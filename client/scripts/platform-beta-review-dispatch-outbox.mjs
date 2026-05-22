import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { currentQaDate, dateOnly, daysBetween, requestedOrCurrentDate } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX_DATE || ''
const requestedToday = process.env.QA_BETA_REVIEW_TODAY || ''
const nextWaveOpsPath = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS || 'qa/beta-human-review-next-wave-ops-2026-05-21.json'

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function currentReviewDate() {
  return requestedOrCurrentDate(requestedToday)
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function repoPath(path) {
  return resolve(root, qaDisplayPath(path))
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function safeFileStem(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function fileExists(path) {
  try {
    await access(repoPath(path))
    return true
  } catch {
    return false
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
}

function messageFileText(row) {
  return `Subject: ${row.messageSubject}

${row.reviewerMessage}

Start URL:
${row.startUrl}

Packet:
${row.packetPath}

Submission template:
${row.submissionTemplatePath}

Completed submission filename:
${row.completedSubmissionPath}

Reviewer checklist:
${row.reviewerChecklist.map((item) => `- ${item}`).join('\n')}

Operator checklist:
${row.operatorChecklist.map((item) => `- ${item}`).join('\n')}

Validation:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This message is reviewer outreach, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
`
}

function rowsToCsv(rows) {
  const headers = [
    'id',
    'waveId',
    'destination',
    'reviewerRole',
    'device',
    'viewport',
    'sendBy',
    'followUpAt',
    'dueAt',
    'dispatchStatus',
    'messageSubject',
    'messageFile',
    'startUrl',
    'packetPath',
    'submissionTemplatePath',
    'completedSubmissionPath',
  ]
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
}

const nextWaveOps = await readJson(nextWaveOpsPath)
const date = requestedDate || dateOnly(nextWaveOps.date) || currentQaDate()
const today = currentReviewDate()
const jsonName = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX_JSON || `beta-human-review-dispatch-outbox-${date}.json`
const reportName = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX_REPORT || `beta-human-review-dispatch-outbox-${date}.md`
const csvName = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX_CSV || `beta-human-review-dispatch-outbox-${date}.csv`
const outboxDirName = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX_DIR || `beta-human-review-dispatch-outbox-${date}`
const outboxDir = `qa/${outboxDirName}`
const operatorRows = Array.isArray(nextWaveOps.operatorRows) ? nextWaveOps.operatorRows : []

const messageRows = operatorRows.map((row) => {
  const fileName = `${safeFileStem(row.id)}-${safeFileStem(row.destination)}.txt`
  return {
    id: row.id,
    waveId: row.waveId,
    destination: row.destination,
    reviewerRole: row.reviewerRole,
    device: row.device,
    viewport: row.viewport,
    sendBy: row.sendBy,
    followUpAt: row.followUpAt,
    dueAt: row.dueAt,
    dispatchStatus: row.dispatchStatus,
    messageSubject: row.messageSubject,
    messageFile: `${outboxDir}/${fileName}`,
    startUrl: row.startUrl,
    packetPath: row.packetPath,
    submissionTemplatePath: row.submissionTemplatePath,
    completedSubmissionPath: row.completedSubmissionPath,
    reviewerChecklist: Array.isArray(row.reviewerChecklist) ? row.reviewerChecklist : [],
    operatorChecklist: Array.isArray(row.operatorChecklist) ? row.operatorChecklist : [],
    reviewerMessage: row.reviewerMessage || '',
    sendInDays: daysBetween(today, row.sendBy),
    followUpInDays: daysBetween(today, row.followUpAt),
    dueInDays: daysBetween(today, row.dueAt),
  }
})

await mkdir(repoPath(outboxDir), { recursive: true })
for (const row of messageRows) {
  await writeFile(repoPath(row.messageFile), messageFileText(row))
}

const csvRows = messageRows.map((row) => ({
  ...row,
  reviewerChecklist: undefined,
  operatorChecklist: undefined,
  reviewerMessage: undefined,
  sendInDays: undefined,
  followUpInDays: undefined,
  dueInDays: undefined,
}))
const csvText = rowsToCsv(csvRows)

const messageFileChecks = await Promise.all(messageRows.map(async (row) => {
  const text = await readFile(repoPath(row.messageFile), 'utf8')
  return {
    id: row.id,
    messageFile: row.messageFile,
    exists: await fileExists(row.messageFile),
    hasSubject: text.includes(row.messageSubject),
    hasStartUrl: text.includes(row.startUrl),
    hasPacket: text.includes(row.packetPath),
    hasTemplate: text.includes(row.submissionTemplatePath),
    hasCompletedSubmission: text.includes(row.completedSubmissionPath),
    hasIntakeCommand: text.includes('npm run qa:beta-review-intake'),
    hasLaunchBoundary: text.includes('not completed review evidence'),
  }
}))

const malformedRows = messageRows.filter((row) => (
  !hasText(row.id) ||
  !hasText(row.waveId) ||
  !hasText(row.destination) ||
  !hasText(row.reviewerRole) ||
  !hasText(row.device) ||
  !hasText(row.viewport) ||
  !hasText(row.sendBy) ||
  !hasText(row.followUpAt) ||
  !hasText(row.dueAt) ||
  row.dispatchStatus !== 'prepared-not-sent' ||
  !hasText(row.messageSubject, 20) ||
  !hasText(row.reviewerMessage, 120) ||
  !hasText(row.startUrl) ||
  !hasText(row.packetPath) ||
  !hasText(row.submissionTemplatePath) ||
  !hasText(row.completedSubmissionPath) ||
  row.completedSubmissionPath.endsWith('.template.json') ||
  !Array.isArray(row.reviewerChecklist) ||
  row.reviewerChecklist.length < 6 ||
  !Array.isArray(row.operatorChecklist) ||
  row.operatorChecklist.length < 6
))
const badMessageFiles = messageFileChecks.filter((check) => (
  !check.exists ||
  !check.hasSubject ||
  !check.hasStartUrl ||
  !check.hasPacket ||
  !check.hasTemplate ||
  !check.hasCompletedSubmission ||
  !check.hasIntakeCommand ||
  !check.hasLaunchBoundary
))
const dispatchDueTodayRows = messageRows.filter((row) => row.sendInDays === 0)
const dispatchOverdueRows = messageRows.filter((row) => Number.isFinite(row.sendInDays) && row.sendInDays < 0)
const followUpDueSoonRows = messageRows.filter((row) => (
  Number.isFinite(row.followUpInDays) &&
  row.followUpInDays >= 0 &&
  row.followUpInDays <= 2
))
const followUpOverdueRows = messageRows.filter((row) => Number.isFinite(row.followUpInDays) && row.followUpInDays < 0)

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('dispatch outbox reads passing next-wave ops', (
  nextWaveOps.status === 'pass' &&
  nextWaveOps.scope === 'next-wave' &&
  Number(nextWaveOps.operatorRowCount) === operatorRows.length &&
  operatorRows.length > 0
), {
  nextWaveOpsPath: qaDisplayPath(nextWaveOpsPath),
  nextWaveOpsStatus: nextWaveOps.status || null,
  nextWaveOpsScope: nextWaveOps.scope || null,
  nextWaveOpsRowCount: nextWaveOps.operatorRowCount ?? null,
  rowCount: operatorRows.length,
})

addCheck('dispatch outbox has one message file per next-wave row', (
  messageRows.length === operatorRows.length &&
  badMessageFiles.length === 0
), {
  messageRowCount: messageRows.length,
  badMessageFiles: badMessageFiles.map((row) => row.id || basename(row.messageFile || 'missing')),
})

addCheck('dispatch outbox message rows are send-ready', (
  malformedRows.length === 0 &&
  dispatchOverdueRows.length === 0 &&
  followUpOverdueRows.length === 0
), {
  malformedRows: malformedRows.map((row) => row.id || '(missing id)'),
  dispatchOverdueRows: dispatchOverdueRows.map((row) => row.id || '(missing id)'),
  followUpOverdueRows: followUpOverdueRows.map((row) => row.id || '(missing id)'),
})

addCheck('dispatch outbox CSV includes every message file and completed-submission path', (
  messageRows.every((row) => csvText.includes(row.messageFile)) &&
  messageRows.every((row) => csvText.includes(row.completedSubmissionPath))
), {
  csvArtifact: `qa/${csvName}`,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  today,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  nextWaveOpsArtifact: qaDisplayPath(nextWaveOpsPath),
  nextWave: nextWaveOps.nextWave || null,
  artifact: `qa/${jsonName}`,
  report: `qa/${reportName}`,
  csv: `qa/${csvName}`,
  artifactDir: outboxDir,
  outboxRowCount: messageRows.length,
  messageFileCount: messageFileChecks.length,
  dispatchDueTodayCount: dispatchDueTodayRows.length,
  dispatchOverdueCount: dispatchOverdueRows.length,
  followUpDueSoonCount: followUpDueSoonRows.length,
  followUpOverdueCount: followUpOverdueRows.length,
  messageRows: csvRows,
  messageFileChecks,
  checks,
  failures,
}

const report = `# Beta Human Review Dispatch Outbox

Date: ${date}
Today: ${today}
Status: ${summary.status}
Source: ${summary.nextWaveOpsArtifact}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Next wave: ${summary.nextWave?.waveId || 'none'}
- Message files: ${summary.messageFileCount}
- Dispatch due today: ${summary.dispatchDueTodayCount}
- Dispatch overdue: ${summary.dispatchOverdueCount}
- Follow-ups due soon: ${summary.followUpDueSoonCount}
- Follow-ups overdue: ${summary.followUpOverdueCount}

## Operator Workflow

- Assign a named human reviewer for each message before sending.
- Send the matching message file, packet path, start URL, and submission-template path to the reviewer.
- Record reviewer contact outside the repo.
- Follow up no later than the row's follow-up date.
- Do not edit \`.template.json\` files; completed reviews must arrive as non-template JSON files.
- Validate with \`npm run qa:beta-review-intake\`; import only with \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\` after validation is clean.

## Message Files

| ID | Reviewer | Destination | Send By | Follow Up | Due | Message File |
| --- | --- | --- | --- | --- | --- | --- |
${messageRows.map((row) => `| ${row.id} | ${row.reviewerRole} | ${row.destination} | ${row.sendBy} | ${row.followUpAt} | ${row.dueAt} | \`${row.messageFile}\` |`).join('\n') || '| none | none | none | none | none | none | none |'}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}

## Launch Rule

This dispatch outbox is assignment and outreach evidence, not completed review evidence. Public launch still requires completed non-template reviewer JSON submissions that pass intake and are explicitly imported.
`

await writeFile(repoPath(`qa/${jsonName}`), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(`qa/${reportName}`), report)
await writeFile(repoPath(`qa/${csvName}`), `${csvText}\n`)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
