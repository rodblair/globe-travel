import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_BETA_REVIEW_COMMAND_CENTER_DATE || ''
const requestedToday = process.env.QA_BETA_REVIEW_TODAY || ''
const registerPath = process.env.QA_BETA_REVIEW_REGISTER || '../qa/beta-human-review-register.json'

const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])
const blockingSeverities = new Set(['P0', 'P1'])

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim()) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match && isDate(match[0]) ? match[0] : ''
}

function currentUtcDate() {
  return new Date().toISOString().slice(0, 10)
}

function currentReviewDate() {
  return isDate(requestedToday) ? requestedToday : currentUtcDate()
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function missingFrom(values, required) {
  const set = new Set(values)
  return required.filter((value) => !set.has(value))
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function daysBetween(startDate, endDate) {
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return Math.round((end - start) / 86400000)
}

async function readJsonArtifact(path) {
  return JSON.parse(await readFile(resolve(root, qaDisplayPath(path)), 'utf8'))
}

function reviewIsComplete(review) {
  return completedStatuses.has(String(review.status || '').toLowerCase())
}

function reviewHasBlockingFinding(review) {
  return Array.isArray(review.findings) && review.findings.some((finding) => (
    blockingSeverities.has(String(finding.severity || '').toUpperCase()) &&
    String(finding.status || '').toLowerCase() !== 'closed'
  ))
}

function groupByWave(scheduledReviews, plannedById, today) {
  const waveIds = unique(scheduledReviews.map((review) => review.waveId))
  return waveIds.map((waveId) => {
    const reviews = scheduledReviews.filter((review) => review.waveId === waveId)
    const completedReviews = reviews.filter((review) => reviewIsComplete(plannedById.get(review.id)))
    const dueAt = reviews[0]?.dueAt || ''
    const kickoffAt = reviews[0]?.kickoffAt || ''
    const daysUntilDue = daysBetween(today, dueAt)
    return {
      waveId,
      kickoffAt,
      dueAt,
      daysUntilDue,
      status: completedReviews.length === reviews.length
        ? 'complete'
        : daysUntilDue != null && daysUntilDue < 0
          ? 'overdue'
          : 'open',
      scheduledReviewCount: reviews.length,
      completedReviewCount: completedReviews.length,
      remainingReviewCount: reviews.length - completedReviews.length,
      reviewerCohorts: unique(reviews.map((review) => review.reviewerCohort)),
      reviewIds: reviews.map((review) => review.id),
    }
  })
}

function nextOpenWave(waves) {
  return waves
    .filter((wave) => wave.status !== 'complete')
    .sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)))[0] || null
}

const register = JSON.parse(await readFile(resolve(process.cwd(), registerPath), 'utf8'))
const date = requestedDate || dateOnly(register.reviewedAt) || currentUtcDate()
const today = currentReviewDate()
const commandCenterName = process.env.QA_BETA_REVIEW_COMMAND_CENTER_JSON || `beta-human-review-command-center-${date}.json`
const reportName = process.env.QA_BETA_REVIEW_COMMAND_CENTER_REPORT || `beta-human-review-command-center-${date}.md`
const schedulePath = register.reviewScheduleArtifact || `qa/beta-human-review-schedule-${date}.json`
const packetManifestPath = register.reviewerPacketManifest || `qa/beta-human-review-packet-manifest-${date}.json`
const progressPath = register.progressArtifact || `qa/beta-human-review-progress-${date}.json`
const intakePath = register.completedReviewIntakeArtifact || `qa/beta-human-review-intake-${date}.json`
const schedule = await readJsonArtifact(schedulePath)
const packetManifest = await readJsonArtifact(packetManifestPath)
const progress = await readJsonArtifact(progressPath)
const intake = await readJsonArtifact(intakePath)
const plannedReviews = Array.isArray(register.plannedReviews) ? register.plannedReviews : []
const plannedById = new Map(plannedReviews.map((review) => [review.id, review]))
const completedReviews = plannedReviews.filter(reviewIsComplete)
const scheduledReviews = Array.isArray(schedule.scheduledReviews) ? schedule.scheduledReviews : []
const packetRecords = Array.isArray(packetManifest.packets) ? packetManifest.packets : []
const publicLaunchMinimum = Number(register.minimumCompletedReviewsForPublicLaunch) || 25
const remainingReviewsForMinimum = Math.max(0, publicLaunchMinimum - completedReviews.length)
const scheduledIds = scheduledReviews.map((review) => review.id).filter(Boolean)
const plannedIds = plannedReviews.map((review) => review.id).filter(Boolean)
const packetIds = packetRecords.map((packet) => packet.id).filter(Boolean)
const missingScheduledIds = missingFrom(scheduledIds, plannedIds)
const missingPacketIds = missingFrom(packetIds, plannedIds)
const duplicateScheduledIds = scheduledIds.filter((id, index) => scheduledIds.indexOf(id) !== index)
const scheduledWithoutPacket = scheduledReviews.filter((review) => (
  !hasText(review.packetPath) ||
  !hasText(review.submissionTemplatePath) ||
  !packetIds.includes(review.id)
))
const blockingReviewIds = plannedReviews.filter(reviewHasBlockingFinding).map((review) => review.id)
const waves = groupByWave(scheduledReviews, plannedById, today)
const nextWave = nextOpenWave(waves)
const overdueWaves = waves.filter((wave) => wave.status === 'overdue')
const dueSoonWaves = waves.filter((wave) => (
  wave.status === 'open' &&
  Number.isFinite(wave.daysUntilDue) &&
  wave.daysUntilDue >= 0 &&
  wave.daysUntilDue <= 3
))

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('beta command center inputs are passing and aligned', (
  schedule.status === 'pass' &&
  progress.status === 'pass' &&
  intake.status === 'pass' &&
  Number(schedule.scheduledReviewCount) === plannedReviews.length &&
  Number(progress.plannedReviewCount) === plannedReviews.length &&
  Number(intake.plannedReviewCount) === plannedReviews.length &&
  Number(progress.completedReviewCount) === completedReviews.length &&
  Number(intake.completedReviewCountAfter) === completedReviews.length
), {
  scheduleStatus: schedule.status || null,
  progressStatus: progress.status || null,
  intakeStatus: intake.status || null,
  plannedReviewCount: plannedReviews.length,
  scheduledReviewCount: schedule.scheduledReviewCount ?? null,
  progressPlannedReviewCount: progress.plannedReviewCount ?? null,
  intakePlannedReviewCount: intake.plannedReviewCount ?? null,
  completedReviewCount: completedReviews.length,
  progressCompletedReviewCount: progress.completedReviewCount ?? null,
  intakeCompletedReviewCountAfter: intake.completedReviewCountAfter ?? null,
})

addCheck('beta command center has one scheduled packet-backed row per planned review', (
  scheduledReviews.length === plannedReviews.length &&
  missingScheduledIds.length === 0 &&
  duplicateScheduledIds.length === 0 &&
  missingPacketIds.length === 0 &&
  scheduledWithoutPacket.length === 0
), {
  plannedReviewCount: plannedReviews.length,
  scheduledReviewCount: scheduledReviews.length,
  packetCount: packetRecords.length,
  missingScheduledIds,
  duplicateScheduledIds,
  missingPacketIds,
  scheduledWithoutPacket: scheduledWithoutPacket.map((review) => review.id || '(missing id)'),
})

addCheck('beta command center exposes the next executable wave', (
  completedReviews.length >= publicLaunchMinimum ||
  (
    nextWave &&
    hasText(nextWave.waveId) &&
    hasText(nextWave.kickoffAt) &&
    hasText(nextWave.dueAt) &&
    nextWave.remainingReviewCount > 0
  )
), {
  completedReviewCount: completedReviews.length,
  publicLaunchMinimum,
  nextWave,
})

addCheck('beta command center has no overdue review waves', overdueWaves.length === 0, {
  today,
  overdueWaveCount: overdueWaves.length,
  overdueWaves,
})

addCheck('beta command center keeps launch blockers explicit', (
  remainingReviewsForMinimum > 0 ||
  blockingReviewIds.length === 0
), {
  remainingReviewsForMinimum,
  blockingReviewIds,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  today,
  registerPath: qaDisplayPath(registerPath),
  scheduleArtifact: qaDisplayPath(schedulePath),
  packetManifest: qaDisplayPath(packetManifestPath),
  progressArtifact: qaDisplayPath(progressPath),
  intakeArtifact: qaDisplayPath(intakePath),
  jsonArtifact: `qa/${commandCenterName}`,
  reportArtifact: `qa/${reportName}`,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  plannedReviewCount: plannedReviews.length,
  completedReviewCount: completedReviews.length,
  publicLaunchMinimum,
  remainingReviewsForMinimum,
  waveCount: waves.length,
  waves,
  nextWave,
  overdueWaveCount: overdueWaves.length,
  overdueWaves,
  dueSoonWaves,
  blockingReviewIds,
  checks,
  failures,
}

const report = `# Beta Human Review Command Center

Date: ${date}
Today: ${today}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Planned reviews: ${summary.plannedReviewCount}
- Completed reviews: ${summary.completedReviewCount}
- Remaining for public launch: ${summary.remainingReviewsForMinimum}
- Open P0/P1 review ids: ${summary.blockingReviewIds.length}

## Next Operator Move

${nextWave ? `Run ${nextWave.waveId}: ${nextWave.remainingReviewCount}/${nextWave.scheduledReviewCount} reviews still need completed submissions by ${nextWave.dueAt}.` : 'No open beta review wave remains.'}

Immediate workflow:
- Assign or confirm real reviewers for the next open wave.
- Send each reviewer their packet path and submission template.
- Save completed submissions as non-template JSON files in \`${qaDisplayPath(register.completedReviewSubmissionDirectory)}\`.
- Run \`npm run qa:beta-review-intake\`; if clean, run \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\`.
- Re-run \`npm run qa:beta-review-progress\`, \`npm run qa:beta-review-command-center\`, \`npm run qa:public-launch-status\`, and \`npm run qa:launch-signoff\`.

## Wave Board

| Wave | Kickoff | Due | Status | Completed | Remaining | Cohorts |
| --- | --- | --- | --- | --- | --- | --- |
${waves.map((wave) => (
  `| ${wave.waveId} | ${wave.kickoffAt} | ${wave.dueAt} | ${wave.status} | ${wave.completedReviewCount}/${wave.scheduledReviewCount} | ${wave.remainingReviewCount} | ${wave.reviewerCohorts.join(', ')} |`
)).join('\n')}

## Due Soon

${markdownList(dueSoonWaves.map((wave) => `${wave.waveId}: ${wave.remainingReviewCount} remaining, due ${wave.dueAt}`))}

## Overdue

${markdownList(overdueWaves.map((wave) => `${wave.waveId}: ${wave.remainingReviewCount} remaining, due ${wave.dueAt}`))}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Evidence Inputs

- Register: \`${summary.registerPath}\`
- Schedule: \`${summary.scheduleArtifact}\`
- Packet manifest: \`${summary.packetManifest}\`
- Progress: \`${summary.progressArtifact}\`
- Intake: \`${summary.intakeArtifact}\`

## Launch Rule

This command center is an operating artifact, not completed review evidence. Public launch still requires ${publicLaunchMinimum} completed beta human reviews, zero unresolved P0/P1 findings, complete scorecard evidence, and passing intake/progress artifacts.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', commandCenterName), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(root, 'qa', reportName), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
