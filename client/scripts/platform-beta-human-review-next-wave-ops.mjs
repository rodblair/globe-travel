import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS_DATE || ''
const requestedToday = process.env.QA_BETA_REVIEW_TODAY || ''
const registerPath = process.env.QA_BETA_REVIEW_REGISTER || '../qa/beta-human-review-register.json'
const opsScope = process.env.QA_BETA_REVIEW_OPS_SCOPE || 'next-wave'
const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])

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

function daysBetween(startDate, endDate) {
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return Math.round((end - start) / 86400000)
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

async function readJsonArtifact(path) {
  return JSON.parse(await readFile(resolve(root, qaDisplayPath(path)), 'utf8'))
}

function reviewIsComplete(review) {
  return completedStatuses.has(String(review?.status || '').toLowerCase())
}

function completedSubmissionPath(templatePath) {
  return qaDisplayPath(templatePath).replace(/\.template\.json$/, '.json')
}

function messageFor(row) {
  const scopeText = row.scope === 'all-waves' ? `wave ${row.waveId}` : `the Globe.travel beta review wave ${row.waveId}`
  return [
    `You are assigned ${row.id} for ${scopeText}.`,
    `Please use ${row.device} ${row.viewport}, start here: ${row.startUrl}`,
    `Read the packet at ${row.packetPath}, complete the assigned planner, trip studio, map, save/share, and feedback checks, then save the completed JSON as ${row.completedSubmissionPath}.`,
    `Public launch cannot count this review until every scorecard field is filled, findings are classified, and the intake command passes.`,
  ].join(' ')
}

function rowsToCsv(rows) {
  const headers = [
    'id',
    'waveId',
    'kickoffAt',
    'dueAt',
    'reviewerCohort',
    'reviewerRole',
    'destination',
    'device',
    'viewport',
    'surfaces',
    'startUrl',
    'packetPath',
    'submissionTemplatePath',
    'completedSubmissionPath',
    'messageSubject',
  ]
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
}

const register = JSON.parse(await readFile(resolve(process.cwd(), registerPath), 'utf8'))
const date = requestedDate || dateOnly(register.reviewedAt) || currentUtcDate()
const opsJsonName = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS_JSON || `beta-human-review-next-wave-ops-${date}.json`
const opsReportName = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS_REPORT || `beta-human-review-next-wave-ops-${date}.md`
const opsCsvName = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS_CSV || `beta-human-review-next-wave-ops-${date}.csv`
const today = currentReviewDate()
const commandCenterPath = register.reviewCommandCenterArtifact || `qa/beta-human-review-command-center-${date}.json`
const schedulePath = register.reviewScheduleArtifact || `qa/beta-human-review-schedule-${date}.json`
const packetManifestPath = register.reviewerPacketManifest || `qa/beta-human-review-packet-manifest-${date}.json`

const commandCenter = await readJsonArtifact(commandCenterPath)
const schedule = await readJsonArtifact(schedulePath)
const packetManifest = await readJsonArtifact(packetManifestPath)
const plannedReviews = Array.isArray(register.plannedReviews) ? register.plannedReviews : []
const plannedById = new Map(plannedReviews.map((review) => [review.id, review]))
const packetById = new Map((Array.isArray(packetManifest.packets) ? packetManifest.packets : []).map((packet) => [packet.id, packet]))
const scheduledReviews = Array.isArray(schedule.scheduledReviews) ? schedule.scheduledReviews : []
const nextWave = commandCenter.nextWave || null
const nextWaveIds = new Set(Array.isArray(nextWave?.reviewIds) ? nextWave.reviewIds : [])
const nextWaveScheduledRows = scheduledReviews.filter((review) => nextWaveIds.has(review.id))
const scopedScheduledRows = opsScope === 'all-waves' ? scheduledReviews : nextWaveScheduledRows
const incompleteRows = scopedScheduledRows.filter((review) => !reviewIsComplete(plannedById.get(review.id)))
const operatorRows = incompleteRows.map((review) => {
  const packet = packetById.get(review.id) || {}
  const row = {
    scope: opsScope,
    id: review.id,
    waveId: review.waveId,
    kickoffAt: review.kickoffAt,
    dueAt: review.dueAt,
    daysUntilDue: daysBetween(today, review.dueAt),
    reviewerCohort: review.reviewerCohort,
    reviewerRole: review.reviewerRole,
    destination: review.destination,
    audience: review.audience,
    style: review.style,
    region: review.region,
    device: review.device,
    viewport: review.viewport,
    surfaces: Array.isArray(review.surfaces) ? review.surfaces : [],
    startUrl: review.startUrl || packet.startUrl || '',
    packetPath: review.packetPath || packet.packetPath || '',
    submissionTemplatePath: review.submissionTemplatePath || packet.submissionTemplatePath || '',
    completedSubmissionPath: completedSubmissionPath(review.submissionTemplatePath || packet.submissionTemplatePath || ''),
    messageSubject: `[Globe.travel beta] ${review.id} ${review.destination} review due ${review.dueAt}`,
  }
  return {
    ...row,
    reviewerMessage: messageFor(row),
  }
})

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

const malformedRows = operatorRows.filter((row) => (
  !hasText(row.id) ||
  !hasText(row.waveId) ||
  !hasText(row.dueAt) ||
  !hasText(row.reviewerCohort) ||
  !hasText(row.reviewerRole) ||
  !hasText(row.destination) ||
  !hasText(row.device) ||
  !hasText(row.viewport) ||
  !Array.isArray(row.surfaces) ||
  row.surfaces.length === 0 ||
  !hasText(row.startUrl) ||
  !hasText(row.packetPath) ||
  !hasText(row.submissionTemplatePath) ||
  !hasText(row.completedSubmissionPath) ||
  row.completedSubmissionPath.endsWith('.template.json') ||
  !hasText(row.messageSubject, 20) ||
  !hasText(row.reviewerMessage, 120)
))
const csvText = rowsToCsv(operatorRows)
const scheduledWaveIds = [...new Set(scheduledReviews.map((review) => review.waveId).filter(Boolean))]
const operatorWaveIds = [...new Set(operatorRows.map((row) => row.waveId).filter(Boolean))]
const expectedRowCount = opsScope === 'all-waves'
  ? scheduledReviews.filter((review) => !reviewIsComplete(plannedById.get(review.id))).length
  : Number(nextWave?.remainingReviewCount || 0)

addCheck(`${opsScope} ops inputs are passing and aligned`, (
  commandCenter.status === 'pass' &&
  schedule.status === 'pass' &&
  packetManifest.packetCount >= plannedReviews.length
), {
  commandCenterStatus: commandCenter.status || null,
  scheduleStatus: schedule.status || null,
  packetCount: packetManifest.packetCount ?? null,
  plannedReviewCount: plannedReviews.length,
})

addCheck(`${opsScope} ops exposes the expected review scope`, (
  opsScope === 'all-waves'
    ? scheduledReviews.length === plannedReviews.length && operatorWaveIds.length === scheduledWaveIds.length
    : nextWave && hasText(nextWave.waveId) && Number(nextWave.remainingReviewCount) > 0 && nextWaveIds.size === Number(nextWave.scheduledReviewCount)
), {
  scope: opsScope,
  nextWave,
  scheduledWaveIds,
  operatorWaveIds,
  scheduledReviewCount: scheduledReviews.length,
  plannedReviewCount: plannedReviews.length,
  nextWaveReviewIdCount: nextWaveIds.size,
})

addCheck(`${opsScope} ops has one actionable row per remaining scoped review`, (
  operatorRows.length === expectedRowCount &&
  malformedRows.length === 0
), {
  operatorRowCount: operatorRows.length,
  expectedRemainingReviewCount: expectedRowCount,
  malformedRows: malformedRows.map((row) => row.id || '(missing id)'),
})

const rowsWithBadDueMath = operatorRows.filter((row) => row.daysUntilDue !== daysBetween(today, row.dueAt))
addCheck(`${opsScope} ops due math matches each review due date`, rowsWithBadDueMath.length === 0, {
  today,
  rowsWithBadDueMath: rowsWithBadDueMath.map((row) => row.id || '(missing id)'),
})

addCheck(`${opsScope} ops CSV includes every scoped review id`, (
  operatorRows.every((row) => csvText.includes(row.id)) &&
  operatorRows.every((row) => csvText.includes(row.completedSubmissionPath))
), {
  csvArtifact: `qa/${opsCsvName}`,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  today,
  registerPath: qaDisplayPath(registerPath),
  commandCenterArtifact: qaDisplayPath(commandCenterPath),
  scheduleArtifact: qaDisplayPath(schedulePath),
  packetManifest: qaDisplayPath(packetManifestPath),
  jsonArtifact: `qa/${opsJsonName}`,
  reportArtifact: `qa/${opsReportName}`,
  csvArtifact: `qa/${opsCsvName}`,
  scope: opsScope,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  nextWave,
  scheduledWaveCount: scheduledWaveIds.length,
  operatorWaveCount: operatorWaveIds.length,
  expectedRowCount,
  operatorRowCount: operatorRows.length,
  operatorRows,
  checks,
  failures,
}

const title = opsScope === 'all-waves' ? 'Beta Human Review All-Wave Ops' : 'Beta Human Review Next-Wave Ops'
const evidenceBoundary = opsScope === 'all-waves'
  ? 'This all-wave ops pack is an assignment and outreach artifact, not completed review evidence.'
  : 'This next-wave ops pack is an assignment and outreach artifact, not completed review evidence.'
const report = `# ${title}

Date: ${date}
Today: ${summary.today}
Scope: ${opsScope}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Next wave: ${nextWave?.waveId || 'none'}
- Waves covered: ${summary.operatorWaveCount}/${summary.scheduledWaveCount}
- Rows ready to send: ${summary.operatorRowCount}
- Due: ${nextWave?.dueAt || 'n/a'}

## Operator Workflow

- Assign a named human reviewer to each row before sending.
- Send the packet path, start URL, and completed-submission filename from the row.
- Keep \`.template.json\` files unchanged; completed reviews must be non-template JSON files.
- Run \`npm run qa:beta-review-intake\`; only import with \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\` after validation is clean.
- Re-run \`npm run qa:beta-review-progress\`, \`npm run qa:beta-review-command-center\`, \`npm run qa:beta-review-next-wave-ops\`, \`npm run qa:public-launch-status\`, and \`npm run qa:launch-signoff\`.

## Operator Rows

| ID | Cohort | Device | Destination | Due | Packet | Completed File |
| --- | --- | --- | --- | --- | --- | --- |
${operatorRows.map((row) => `| ${row.id} | ${row.reviewerCohort} | ${row.device} ${row.viewport} | ${row.destination} | ${row.dueAt} | \`${row.packetPath}\` | \`${row.completedSubmissionPath}\` |`).join('\n') || '| none | none | none | none | none | none | none |'}

## Reviewer Message Drafts

${operatorRows.map((row) => `### ${row.id}: ${row.destination}

Subject: ${row.messageSubject}

${row.reviewerMessage}
`).join('\n')}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}

## Launch Rule

${evidenceBoundary} Public launch still requires ${register.minimumCompletedReviewsForPublicLaunch || 25} completed beta human reviews, zero unresolved P0/P1 findings, complete scorecard evidence, and passing intake/progress artifacts.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', opsJsonName), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(root, 'qa', opsReportName), report)
await writeFile(resolve(root, 'qa', opsCsvName), `${csvText}\n`)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
