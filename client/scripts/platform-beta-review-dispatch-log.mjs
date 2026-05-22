import { access, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate, dateOnly, daysBetween, requestedOrCurrentDate } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_BETA_REVIEW_DISPATCH_LOG_DATE || ''
const requestedToday = process.env.QA_BETA_REVIEW_TODAY || ''
const requireSent = ['1', 'true', 'yes', 'sent'].includes(String(process.env.QA_BETA_REVIEW_DISPATCH_LOG_REQUIRE_SENT || '').toLowerCase())
const dispatchOutboxPath = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX || 'qa/beta-human-review-dispatch-outbox-2026-05-21.json'

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function repoPath(path) {
  return resolve(root, qaDisplayPath(path))
}

function currentReviewDate() {
  return requestedOrCurrentDate(requestedToday)
}

function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
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

async function readExistingJson(path) {
  try {
    return await readJson(path)
  } catch {
    return null
  }
}

function looksSensitive(value) {
  const text = String(value || '')
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text) || /\+?\d[\d\s().-]{7,}\d/.test(text)
}

function defaultLogRow(row) {
  return {
    id: row.id,
    waveId: row.waveId,
    destination: row.destination,
    messageFile: row.messageFile,
    messageSubject: row.messageSubject,
    startUrl: row.startUrl,
    packetPath: row.packetPath,
    submissionTemplatePath: row.submissionTemplatePath,
    completedSubmissionPath: row.completedSubmissionPath,
    expectedSendBy: row.sendBy,
    followUpAt: row.followUpAt,
    dueAt: row.dueAt,
    sendStatus: 'prepared-not-sent',
    reviewerAlias: '',
    deliveryChannel: '',
    sentAt: null,
    contactRecordLocation: '',
    notes: 'Prepared by QA outbox. Store real reviewer contact details outside the repo.',
  }
}

function mergeLogRows(outboxRows, existingRows) {
  const existingById = new Map(existingRows.map((row) => [row.id, row]))

  return outboxRows.map((row) => {
    const existing = existingById.get(row.id) || {}
    return {
      ...defaultLogRow(row),
      sendStatus: existing.sendStatus || 'prepared-not-sent',
      reviewerAlias: existing.reviewerAlias || '',
      deliveryChannel: existing.deliveryChannel || '',
      sentAt: existing.sentAt || null,
      contactRecordLocation: existing.contactRecordLocation || '',
      notes: existing.notes || 'Prepared by QA outbox. Store real reviewer contact details outside the repo.',
    }
  })
}

function rowsToCsv(rows) {
  const headers = [
    'id',
    'waveId',
    'destination',
    'expectedSendBy',
    'followUpAt',
    'dueAt',
    'sendStatus',
    'reviewerAlias',
    'deliveryChannel',
    'sentAt',
    'contactRecordLocation',
    'messageFile',
    'completedSubmissionPath',
  ]

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
}

const dispatchOutbox = await readJson(dispatchOutboxPath)
const date = requestedDate || dateOnly(dispatchOutbox.date) || currentQaDate()
const today = currentReviewDate()
const jsonName = process.env.QA_BETA_REVIEW_DISPATCH_LOG_JSON || `beta-human-review-dispatch-log-${date}.json`
const reportName = process.env.QA_BETA_REVIEW_DISPATCH_LOG_REPORT || `beta-human-review-dispatch-log-${date}.md`
const csvName = process.env.QA_BETA_REVIEW_DISPATCH_LOG_CSV || `beta-human-review-dispatch-log-${date}.csv`
const logPath = `qa/${jsonName}`
const reportPath = `qa/${reportName}`
const csvPath = `qa/${csvName}`
const outboxRows = Array.isArray(dispatchOutbox.messageRows) ? dispatchOutbox.messageRows : []
const existingLog = await readExistingJson(logPath)
const existingRows = Array.isArray(existingLog?.dispatchRows) ? existingLog.dispatchRows : []
const dispatchRows = mergeLogRows(outboxRows, existingRows)
const outboxById = new Map(outboxRows.map((row) => [row.id, row]))
const existingUnknownRows = existingRows.filter((row) => !outboxById.has(row.id))
const allowedStatuses = new Set(['prepared-not-sent', 'sent'])

const rowIssues = []
for (const row of dispatchRows) {
  const outboxRow = outboxById.get(row.id)
  const messageExists = await fileExists(row.messageFile)

  if (!outboxRow) rowIssues.push(`${row.id || 'unknown'} is not present in the dispatch outbox`)
  if (!allowedStatuses.has(row.sendStatus)) rowIssues.push(`${row.id || 'unknown'} has unsupported sendStatus ${row.sendStatus || 'missing'}`)
  if (!hasText(row.id) || !hasText(row.waveId) || !hasText(row.messageFile) || !hasText(row.completedSubmissionPath)) {
    rowIssues.push(`${row.id || 'unknown'} is missing required source fields`)
  }
  if (!messageExists) rowIssues.push(`${row.id || 'unknown'} message file does not exist`)
  if (row.messageFile !== outboxRow?.messageFile) rowIssues.push(`${row.id || 'unknown'} message file does not match dispatch outbox`)
  if (row.completedSubmissionPath !== outboxRow?.completedSubmissionPath) rowIssues.push(`${row.id || 'unknown'} completed submission path does not match dispatch outbox`)
  if (row.sendStatus === 'sent') {
    if (!hasText(row.reviewerAlias)) rowIssues.push(`${row.id} is sent but reviewerAlias is blank`)
    if (!hasText(row.deliveryChannel)) rowIssues.push(`${row.id} is sent but deliveryChannel is blank`)
    if (!hasText(row.sentAt)) rowIssues.push(`${row.id} is sent but sentAt is blank`)
    if (!hasText(row.contactRecordLocation)) rowIssues.push(`${row.id} is sent but contactRecordLocation is blank`)
  }
  if (looksSensitive(row.reviewerAlias) || looksSensitive(row.contactRecordLocation) || looksSensitive(row.notes)) {
    rowIssues.push(`${row.id || 'unknown'} may include private contact details; use an alias and external record pointer`)
  }
}

for (const row of existingUnknownRows) {
  rowIssues.push(`${row.id || 'unknown'} exists in the dispatch log but no longer exists in the outbox`)
}

const sentRows = dispatchRows.filter((row) => row.sendStatus === 'sent')
const preparedRows = dispatchRows.filter((row) => row.sendStatus === 'prepared-not-sent')
const preparedDueTodayRows = preparedRows.filter((row) => daysBetween(today, row.expectedSendBy) === 0)
const preparedOverdueRows = preparedRows.filter((row) => {
  const sendInDays = daysBetween(today, row.expectedSendBy)
  return Number.isFinite(sendInDays) && sendInDays < 0
})
const strictIssues = requireSent && preparedRows.length > 0
  ? [`${preparedRows.length} dispatch row(s) are still prepared-not-sent while strict send proof is required`]
  : []

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('dispatch log reads passing dispatch outbox', (
  dispatchOutbox.status === 'pass' &&
  Number(dispatchOutbox.outboxRowCount) === outboxRows.length &&
  outboxRows.length > 0
), {
  dispatchOutboxArtifact: qaDisplayPath(dispatchOutboxPath),
  dispatchOutboxStatus: dispatchOutbox.status || null,
  dispatchOutboxRowCount: dispatchOutbox.outboxRowCount ?? null,
  rowCount: outboxRows.length,
})

addCheck('dispatch log has one row per outbox message', (
  dispatchRows.length === outboxRows.length &&
  existingUnknownRows.length === 0
), {
  dispatchRowCount: dispatchRows.length,
  outboxRowCount: outboxRows.length,
  unknownRows: existingUnknownRows.map((row) => row.id || '(missing id)'),
})

addCheck('dispatch log rows are aligned and privacy-safe', rowIssues.length === 0, {
  rowIssues,
})

addCheck('dispatch log strict send proof is satisfied when requested', strictIssues.length === 0, {
  requireSent,
  strictIssues,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  today,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  requireSent,
  dispatchOutboxArtifact: qaDisplayPath(dispatchOutboxPath),
  artifact: logPath,
  report: reportPath,
  csv: csvPath,
  dispatchRowCount: dispatchRows.length,
  sentCount: sentRows.length,
  preparedNotSentCount: preparedRows.length,
  preparedDueTodayCount: preparedDueTodayRows.length,
  preparedOverdueCount: preparedOverdueRows.length,
  dispatchRows,
  checks,
  failures,
  rowIssues,
  strictIssues,
}

const report = `# Beta Human Review Dispatch Log

Date: ${date}
Today: ${today}
Status: ${summary.status}
Source: ${summary.dispatchOutboxArtifact}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Require sent proof: ${summary.requireSent ? 'yes' : 'no'}
- Sent: ${summary.sentCount}
- Prepared not sent: ${summary.preparedNotSentCount}
- Prepared due today: ${summary.preparedDueTodayCount}
- Prepared overdue: ${summary.preparedOverdueCount}

## Operator Workflow

- Keep real reviewer contact details outside the repo.
- Use reviewerAlias for a non-sensitive label, such as beta-reviewer-01.
- Use contactRecordLocation for the external system pointer, such as CRM row or private spreadsheet row.
- Mark sendStatus as sent only after the reviewer receives the message file, packet path, start URL, and submission-template path.
- Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported.

## Dispatch Rows

| ID | Destination | Send By | Status | Alias | Sent At | Contact Record |
| --- | --- | --- | --- | --- | --- | --- |
${dispatchRows.map((row) => `| ${row.id} | ${row.destination} | ${row.expectedSendBy} | ${row.sendStatus} | ${row.reviewerAlias || 'none'} | ${row.sentAt || 'none'} | ${row.contactRecordLocation || 'none'} |`).join('\n') || '| none | none | none | none | none | none | none |'}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}

## Launch Rule

This dispatch log is send-proof workflow evidence, not completed review evidence. Public launch still requires completed non-template reviewer JSON submissions that pass intake and are explicitly imported.
`

await writeFile(repoPath(logPath), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(reportPath), report)
await writeFile(repoPath(csvPath), `${rowsToCsv(dispatchRows)}\n`)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
