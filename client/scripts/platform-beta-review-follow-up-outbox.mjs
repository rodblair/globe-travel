import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { currentQaDate, dateOnly, daysBetween, requestedOrCurrentDate } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_BETA_REVIEW_FOLLOW_UP_OUTBOX_DATE || ''
const requestedToday = process.env.QA_BETA_REVIEW_TODAY || ''
const dispatchOutboxPath = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX || 'qa/beta-human-review-dispatch-outbox-2026-05-21.json'
const dispatchLogPath = process.env.QA_BETA_REVIEW_DISPATCH_LOG || 'qa/beta-human-review-dispatch-log-2026-05-21.json'
const intakePath = process.env.QA_BETA_REVIEW_INTAKE || 'qa/beta-human-review-intake-2026-05-21.json'
const allowOverdue = ['1', 'true', 'yes', 'catch-up'].includes(String(process.env.QA_BETA_REVIEW_FOLLOW_UP_OUTBOX_ALLOW_OVERDUE || '').toLowerCase())

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
  return `Subject: ${row.followUpSubject}

Hi,

Quick follow-up on ${row.id} for Globe.travel. The beta review is due ${row.dueAt}, and the completed non-template JSON has not been received yet.

Please use this start URL:
${row.startUrl}

Review packet:
${row.packetPath}

Submission template:
${row.submissionTemplatePath}

Save completed review as:
${row.completedSubmissionPath}

What still has to be completed:
${row.followUpChecklist.map((item) => `- ${item}`).join('\n')}

Validation after the completed JSON arrives:
- npm run qa:beta-review-intake
- QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake

Launch rule:
This follow-up outbox is outreach evidence, not completed review evidence. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.
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
    'followUpAt',
    'dueAt',
    'initialSendStatus',
    'initialSentAt',
    'followUpSendEligible',
    'followUpStatus',
    'followUpSubject',
    'followUpFile',
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

const dispatchOutbox = await readJson(dispatchOutboxPath)
const dispatchLog = await readJson(dispatchLogPath)
const intake = await readJson(intakePath)
const date = requestedDate || dateOnly(dispatchOutbox.date) || currentQaDate()
const today = currentReviewDate()
const jsonName = process.env.QA_BETA_REVIEW_FOLLOW_UP_OUTBOX_JSON || `beta-human-review-follow-up-outbox-${date}.json`
const reportName = process.env.QA_BETA_REVIEW_FOLLOW_UP_OUTBOX_REPORT || `beta-human-review-follow-up-outbox-${date}.md`
const csvName = process.env.QA_BETA_REVIEW_FOLLOW_UP_OUTBOX_CSV || `beta-human-review-follow-up-outbox-${date}.csv`
const outboxDirName = process.env.QA_BETA_REVIEW_FOLLOW_UP_OUTBOX_DIR || `beta-human-review-follow-up-outbox-${date}`
const outboxDir = `qa/${outboxDirName}`
const importedIds = new Set(Array.isArray(intake.importedReviewIds) ? intake.importedReviewIds : [])
const submittedIds = new Set(Array.isArray(intake.submissions) ? intake.submissions.map((submission) => submission.id).filter(Boolean) : [])
const dispatchRows = Array.isArray(dispatchOutbox.messageRows) ? dispatchOutbox.messageRows : []
const dispatchLogRows = Array.isArray(dispatchLog.dispatchRows) ? dispatchLog.dispatchRows : []
const dispatchLogById = new Map(dispatchLogRows.map((row) => [row.id, row]))

const candidateRows = []
for (const row of dispatchRows) {
  const followUpInDays = daysBetween(today, row.followUpAt)
  const dueInDays = daysBetween(today, row.dueAt)
  const completedFileExists = row.completedSubmissionPath ? await fileExists(row.completedSubmissionPath) : false
  const alreadyCompleted = importedIds.has(row.id) || submittedIds.has(row.id) || completedFileExists
  const followUpIsReady = Number.isFinite(followUpInDays) && (
    (followUpInDays >= 0 && followUpInDays <= 2) ||
    (allowOverdue && followUpInDays < 0)
  )
  if (!alreadyCompleted && followUpIsReady) {
    const fileName = `${safeFileStem(row.id)}-${safeFileStem(row.destination)}-follow-up.txt`
    const dispatchLogRow = dispatchLogById.get(row.id) || {}
    const initialSendStatus = dispatchLogRow.sendStatus || row.dispatchStatus || ''
    candidateRows.push({
      id: row.id,
      waveId: row.waveId,
      destination: row.destination,
      reviewerRole: row.reviewerRole,
      device: row.device,
      viewport: row.viewport,
      followUpAt: row.followUpAt,
      dueAt: row.dueAt,
      initialSendStatus,
      initialSentAt: dispatchLogRow.sentAt || '',
      followUpSendEligible: initialSendStatus === 'sent',
      followUpStatus: 'prepared-not-sent',
      followUpSubject: `[Globe.travel beta follow-up] ${row.id} ${row.destination} review due ${row.dueAt}`,
      followUpFile: `${outboxDir}/${fileName}`,
      startUrl: row.startUrl,
      packetPath: row.packetPath,
      submissionTemplatePath: row.submissionTemplatePath,
      completedSubmissionPath: row.completedSubmissionPath,
      followUpInDays,
      dueInDays,
      completedFileExists,
      followUpChecklist: [
        `Complete ${row.id} on ${row.device} ${row.viewport}.`,
        `Use the assigned packet at ${row.packetPath}.`,
        'Fill every launch scorecard field with a numeric score.',
        'Classify every finding as P0, P1, P2, P3, or none.',
        `Save the completed non-template JSON as ${row.completedSubmissionPath}.`,
        'Tell the operator when the file is ready so intake can run before import.',
      ],
    })
  }
}

await mkdir(repoPath(outboxDir), { recursive: true })
for (const row of candidateRows) {
  await writeFile(repoPath(row.followUpFile), messageFileText(row))
}

const csvRows = candidateRows.map((row) => ({
  ...row,
  followUpChecklist: undefined,
  followUpInDays: undefined,
  dueInDays: undefined,
  completedFileExists: undefined,
}))
const csvText = rowsToCsv(csvRows)

const messageFileChecks = await Promise.all(candidateRows.map(async (row) => {
  const text = await readFile(repoPath(row.followUpFile), 'utf8')
  return {
    id: row.id,
    followUpFile: row.followUpFile,
    exists: await fileExists(row.followUpFile),
    hasSubject: text.includes(row.followUpSubject),
    hasStartUrl: text.includes(row.startUrl),
    hasPacket: text.includes(row.packetPath),
    hasTemplate: text.includes(row.submissionTemplatePath),
    hasCompletedSubmission: text.includes(row.completedSubmissionPath),
    hasIntakeCommand: text.includes('npm run qa:beta-review-intake'),
    hasLaunchBoundary: text.includes('not completed review evidence'),
  }
}))

const malformedRows = candidateRows.filter((row) => (
  !hasText(row.id) ||
  !hasText(row.waveId) ||
  !hasText(row.destination) ||
  !hasText(row.reviewerRole) ||
  !hasText(row.device) ||
  !hasText(row.viewport) ||
  !hasText(row.followUpAt) ||
  !hasText(row.dueAt) ||
  !hasText(row.initialSendStatus) ||
  !['prepared-not-sent', 'sent'].includes(row.initialSendStatus) ||
  typeof row.followUpSendEligible !== 'boolean' ||
  row.followUpStatus !== 'prepared-not-sent' ||
  !hasText(row.followUpSubject, 20) ||
  !hasText(row.followUpFile) ||
  !hasText(row.startUrl) ||
  !hasText(row.packetPath) ||
  !hasText(row.submissionTemplatePath) ||
  !hasText(row.completedSubmissionPath) ||
  row.completedSubmissionPath.endsWith('.template.json') ||
  !Array.isArray(row.followUpChecklist) ||
  row.followUpChecklist.length < 6
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
const followUpOverdueRows = candidateRows.filter((row) => Number.isFinite(row.followUpInDays) && row.followUpInDays < 0)
const dueSoonRows = candidateRows.filter((row) => Number.isFinite(row.dueInDays) && row.dueInDays >= 0 && row.dueInDays <= 3)
const sendEligibleRows = candidateRows.filter((row) => row.followUpSendEligible)
const blockedUntilInitialSendRows = candidateRows.filter((row) => !row.followUpSendEligible)

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('follow-up outbox reads passing dispatch and intake artifacts', (
  dispatchOutbox.status === 'pass' &&
  dispatchLog.status === 'pass' &&
  intake.status === 'pass' &&
  Number(dispatchOutbox.followUpDueSoonCount || 0) + (allowOverdue ? Number(dispatchOutbox.followUpOverdueCount || 0) : 0) >= candidateRows.length
), {
  dispatchOutboxArtifact: qaDisplayPath(dispatchOutboxPath),
  dispatchOutboxStatus: dispatchOutbox.status || null,
  dispatchOutboxFollowUpDueSoonCount: dispatchOutbox.followUpDueSoonCount ?? null,
  dispatchOutboxFollowUpOverdueCount: dispatchOutbox.followUpOverdueCount ?? null,
  allowOverdue,
  dispatchLogArtifact: qaDisplayPath(dispatchLogPath),
  dispatchLogStatus: dispatchLog.status || null,
  intakeArtifact: qaDisplayPath(intakePath),
  intakeStatus: intake.status || null,
})

addCheck('follow-up outbox has one message file per due-soon incomplete review', (
  candidateRows.length > 0 &&
  messageFileChecks.length === candidateRows.length &&
  badMessageFiles.length === 0
), {
  followUpRowCount: candidateRows.length,
  badMessageFiles: badMessageFiles.map((row) => row.id || basename(row.followUpFile || 'missing')),
})

addCheck('follow-up rows are actionable and not overdue', (
  malformedRows.length === 0 &&
  (allowOverdue || followUpOverdueRows.length === 0)
), {
  allowOverdue,
  malformedRows: malformedRows.map((row) => row.id || '(missing id)'),
  followUpOverdueRows: followUpOverdueRows.map((row) => row.id || '(missing id)'),
})

addCheck('follow-up send eligibility is gated by dispatch sent state', (
  candidateRows.every((row) => row.followUpSendEligible === (row.initialSendStatus === 'sent')) &&
  sendEligibleRows.length + blockedUntilInitialSendRows.length === candidateRows.length
), {
  sendEligibleRows: sendEligibleRows.map((row) => row.id),
  blockedUntilInitialSendRows: blockedUntilInitialSendRows.map((row) => row.id),
})

addCheck('follow-up CSV includes every message and completed-submission path', (
  candidateRows.every((row) => csvText.includes(row.followUpFile)) &&
  candidateRows.every((row) => csvText.includes(row.completedSubmissionPath))
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
  dispatchOutboxArtifact: qaDisplayPath(dispatchOutboxPath),
  dispatchLogArtifact: qaDisplayPath(dispatchLogPath),
  intakeArtifact: qaDisplayPath(intakePath),
  allowOverdue,
  artifact: `qa/${jsonName}`,
  report: `qa/${reportName}`,
  csv: `qa/${csvName}`,
  artifactDir: outboxDir,
  followUpRowCount: candidateRows.length,
  messageFileCount: messageFileChecks.length,
  dueSoonCount: dueSoonRows.length,
  followUpOverdueCount: followUpOverdueRows.length,
  sendEligibleCount: sendEligibleRows.length,
  blockedUntilInitialSendCount: blockedUntilInitialSendRows.length,
  messageRows: csvRows,
  messageFileChecks,
  checks,
  failures,
}

const report = `# Beta Human Review Follow-Up Outbox

Date: ${date}
Today: ${today}
Status: ${summary.status}
Source: ${summary.dispatchOutboxArtifact}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Catch-up overdue follow-ups allowed: ${summary.allowOverdue ? 'yes' : 'no'}
- Follow-up message files: ${summary.messageFileCount}
- Due within 3 days: ${summary.dueSoonCount}
- Follow-ups overdue: ${summary.followUpOverdueCount}
- Eligible to send now: ${summary.sendEligibleCount}
- Draft-only until initial invite is sent: ${summary.blockedUntilInitialSendCount}

## Operator Workflow

- Send these only after the initial dispatch message has gone out.
- Rows with \`followUpSendEligible: false\` are draft-only until the initial invite is recorded as sent in the dispatch log.
- Use the follow-up file matching each review ID.
- Keep reviewer contact and send timestamps outside this repo.
- Completed reviews must arrive as non-template JSON files.
- Validate with \`npm run qa:beta-review-intake\`; import only with \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\` after validation is clean.

## Follow-Up Files

| ID | Reviewer | Destination | Follow Up | Initial Send | Eligible | Message File |
| --- | --- | --- | --- | --- | --- | --- |
${candidateRows.map((row) => `| ${row.id} | ${row.reviewerRole} | ${row.destination} | ${row.followUpAt} | ${row.initialSendStatus} | ${row.followUpSendEligible ? 'yes' : 'draft-only'} | \`${row.followUpFile}\` |`).join('\n') || '| none | none | none | none | none | none |'}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}

## Launch Rule

This follow-up outbox is outreach evidence, not completed review evidence. Public launch still requires completed non-template reviewer JSON submissions that pass intake and are explicitly imported.
`

await writeFile(repoPath(`qa/${jsonName}`), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(`qa/${reportName}`), report)
await writeFile(repoPath(`qa/${csvName}`), `${csvText}\n`)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
