import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_BETA_REVIEW_SCHEDULE_DATE || ''
const registerPath = process.env.QA_BETA_REVIEW_REGISTER || '../qa/beta-human-review-register.json'
const packetManifestPath = process.env.QA_BETA_REVIEW_PACKET_MANIFEST || ''
const waveSize = Number.parseInt(process.env.QA_BETA_REVIEW_WAVE_SIZE || '5', 10)

function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

function currentUtcDate() {
  return new Date().toISOString().slice(0, 10)
}

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function missingFrom(values, required) {
  const set = new Set(values)
  return required.filter((value) => !set.has(value))
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim()) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

function addBusinessDays(date, businessDays) {
  const next = new Date(`${date}T00:00:00Z`)
  let remaining = businessDays
  while (remaining > 0) {
    next.setUTCDate(next.getUTCDate() + 1)
    const day = next.getUTCDay()
    if (day !== 0 && day !== 6) remaining -= 1
  }
  return next.toISOString().slice(0, 10)
}

function reviewerCohortFor(review) {
  if (review.primarySurfaces?.includes('save-reopen')) return 'continuity reviewer'
  if (review.primarySurfaces?.includes('feedback')) return 'share-feedback reviewer'
  if (review.device === 'phone') return 'mobile planner reviewer'
  return 'desktop trip-studio reviewer'
}

function reviewerRoleFor(review) {
  const device = review.device === 'phone' ? 'mobile' : 'desktop'
  const audience = String(review.audience || 'traveler').replace(/-/g, ' ')
  return `${device} ${audience} beta reviewer`
}

function packetById(manifest) {
  return new Map((Array.isArray(manifest.packets) ? manifest.packets : []).map((packet) => [packet.id, packet]))
}

function scheduledRows(plannedReviews, manifest, startDate) {
  const packets = packetById(manifest)
  return plannedReviews.map((review, index) => {
    const waveIndex = Math.floor(index / waveSize)
    const waveNumber = waveIndex + 1
    const kickoffAt = addBusinessDays(startDate, waveIndex * 2 + 1)
    const dueAt = addBusinessDays(startDate, waveIndex * 2 + 2)
    const packet = packets.get(review.id) || {}

    return {
      id: review.id,
      waveId: `BETA-WAVE-${String(waveNumber).padStart(2, '0')}`,
      waveNumber,
      kickoffAt,
      dueAt,
      status: 'scheduled',
      owner: 'Product',
      reviewerCohort: reviewerCohortFor(review),
      reviewerRole: reviewerRoleFor(review),
      destination: review.destination,
      audience: review.audience,
      style: review.style,
      region: review.region,
      device: review.device,
      viewport: packet.viewport || '',
      surfaces: review.primarySurfaces || [],
      sourceActualId: review.sourceActualId,
      startUrl: packet.startUrl || '',
      packetPath: packet.packetPath || '',
      submissionTemplatePath: packet.submissionTemplatePath || '',
      acceptanceCriteria: 'Complete the assigned planner-to-trip journey, inspect map trust, perform the assigned save/share/feedback tasks, record all scorecard ratings, and submit a completed non-template JSON file with any findings.',
    }
  })
}

function assignmentCsv(rows) {
  const columns = [
    'id',
    'waveId',
    'kickoffAt',
    'dueAt',
    'status',
    'owner',
    'reviewerCohort',
    'reviewerRole',
    'destination',
    'audience',
    'style',
    'region',
    'device',
    'viewport',
    'surfaces',
    'startUrl',
    'packetPath',
    'submissionTemplatePath',
    'assignee',
    'completedSubmissionPath',
    'notes',
  ]

  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => (
      csvEscape(column === 'surfaces' ? row.surfaces.join('|') : row[column])
    )).join(',')),
  ].join('\n') + '\n'
}

function assignmentMarkdown(rows) {
  const waves = unique(rows.map((row) => row.waveId))
  return `# Beta Human Review Schedule

Date: ${date}
Status: ${summary.status}

## Operator Instructions

- Assign every scheduled row to a real reviewer before kickoff.
- Keep each reviewer on the scheduled device and viewport lens.
- Send the reviewer the packet path and matching JSON submission template path.
- Copy a template to a non-template \`.json\` file only after that review is actually complete.
- Run \`npm run qa:beta-review-intake\`, then \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\` only when validation is clean.
- Re-run \`npm run qa:beta-review-progress\`, \`npm run qa:beta-review-schedule\`, \`npm run qa:public-launch-status\`, and \`npm run qa:launch-signoff\` after import.

## Wave Summary

${waves.map((waveId) => {
  const waveRows = rows.filter((row) => row.waveId === waveId)
  return `- ${waveId}: ${waveRows[0]?.kickoffAt || 'missing'} to ${waveRows[0]?.dueAt || 'missing'}; ${waveRows.length} reviews`
}).join('\n')}

## Scheduled Review Matrix

| ID | Wave | Due | Cohort | Device | Destination | Packet | Submission Template |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.map((row) => (
  `| ${row.id} | ${row.waveId} | ${row.dueAt} | ${row.reviewerCohort} | ${row.device} ${row.viewport} | ${row.destination} | \`${row.packetPath}\` | \`${row.submissionTemplatePath}\` |`
)).join('\n')}

## Launch Rule

Public launch still requires 25 completed reviews, zero unresolved P0/P1 findings, complete scorecard evidence, and passing intake/progress artifacts. This schedule is an execution aid, not completed review evidence.
`
}

const register = JSON.parse(await readFile(resolve(process.cwd(), registerPath), 'utf8'))
const date = requestedDate || dateOnly(register.reviewedAt) || currentUtcDate()
const manifestPath = packetManifestPath || register.reviewerPacketManifest || `../qa/beta-human-review-packet-manifest-${date}.json`
const manifest = JSON.parse(await readFile(resolve(root, qaDisplayPath(manifestPath)), 'utf8'))
const plannedReviews = Array.isArray(register.plannedReviews) ? register.plannedReviews : []
const rows = scheduledRows(plannedReviews, manifest, date)
const waveIds = unique(rows.map((row) => row.waveId))
const plannedIds = plannedReviews.map((review) => review.id).filter(Boolean)
const scheduledIds = rows.map((row) => row.id).filter(Boolean)
const missingReviewIds = missingFrom(scheduledIds, plannedIds)
const duplicateScheduledIds = scheduledIds.filter((id, index) => scheduledIds.indexOf(id) !== index)
const waveOverflows = waveIds
  .map((waveId) => ({ waveId, count: rows.filter((row) => row.waveId === waveId).length }))
  .filter((wave) => wave.count > waveSize)
const malformedRows = rows.filter((row) => (
  !hasText(row.id) ||
  !hasText(row.waveId) ||
  !isDate(row.kickoffAt) ||
  !isDate(row.dueAt) ||
  !hasText(row.status) ||
  row.status !== 'scheduled' ||
  !hasText(row.owner) ||
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
  !hasText(row.acceptanceCriteria, 120)
))

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('beta review schedule covers every planned review exactly once', (
  rows.length === plannedReviews.length &&
  missingReviewIds.length === 0 &&
  duplicateScheduledIds.length === 0
), {
  plannedReviewCount: plannedReviews.length,
  scheduledReviewCount: rows.length,
  missingReviewIds,
  duplicateScheduledIds,
})

addCheck('beta review schedule is split into actionable waves', (
  waveIds.length >= 5 &&
  waveOverflows.length === 0 &&
  rows.every((row) => isDate(row.kickoffAt) && isDate(row.dueAt))
), {
  waveSize,
  waveCount: waveIds.length,
  waveOverflows,
})

addCheck('beta review schedule entries are actionable', malformedRows.length === 0, {
  malformedRows: malformedRows.map((row) => ({
    id: row.id || null,
    waveId: row.waveId || null,
    dueAt: row.dueAt || null,
    packetPath: row.packetPath || null,
    submissionTemplatePath: row.submissionTemplatePath || null,
  })),
})

const failures = checks.filter((check) => !check.ok)
const scheduleName = process.env.QA_BETA_REVIEW_SCHEDULE_JSON || `beta-human-review-schedule-${date}.json`
const reportName = process.env.QA_BETA_REVIEW_SCHEDULE_REPORT || `beta-human-review-schedule-${date}.md`
const assignmentCsvName = process.env.QA_BETA_REVIEW_SCHEDULE_CSV || `beta-human-review-schedule-assignments-${date}.csv`
const summary = {
  date,
  dateSource: requestedDate ? 'QA_BETA_REVIEW_SCHEDULE_DATE' : 'beta review register',
  registerPath: qaDisplayPath(registerPath),
  packetManifest: qaDisplayPath(manifestPath),
  reportPath: `qa/${reportName}`,
  assignmentCsv: `qa/${assignmentCsvName}`,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  plannedReviewCount: plannedReviews.length,
  scheduledReviewCount: rows.length,
  waveSize,
  waveCount: waveIds.length,
  checks,
  failures,
  scheduledReviews: rows,
}

const report = assignmentMarkdown(rows)

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', scheduleName), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(root, 'qa', reportName), report)
await writeFile(resolve(root, 'qa', assignmentCsvName), assignmentCsv(rows))

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
