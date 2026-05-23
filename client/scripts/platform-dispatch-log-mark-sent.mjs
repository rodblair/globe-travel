import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate, isDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const date = process.env.QA_DISPATCH_MARK_SENT_DATE || currentQaDate()
const betaDispatchLogPath = process.env.QA_BETA_REVIEW_DISPATCH_LOG || 'qa/beta-human-review-dispatch-log-2026-05-21.json'
const visualDispatchLogPath = process.env.QA_VISUAL_REVIEW_DISPATCH_LOG || 'qa/production-visual-review-dispatch-log-2026-05-21.json'
const recordPath = process.env.QA_DISPATCH_MARK_SENT_RECORD || ''
const importMode = process.env.QA_DISPATCH_MARK_SENT_IMPORT === '1'
const artifactName = process.env.QA_DISPATCH_MARK_SENT_ARTIFACT_NAME || `dispatch-log-mark-sent-${date}`

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function repoPath(path) {
  return resolve(root, qaDisplayPath(path))
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function looksSensitive(value) {
  const text = String(value || '')
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text) ||
    /\+?\d[\d\s().-]{7,}\d/.test(text)
}

function normalizeRows(record) {
  if (Array.isArray(record)) return record
  if (Array.isArray(record?.rows)) return record.rows
  if (Array.isArray(record?.sentRows)) return record.sentRows
  return []
}

function findRow(id, betaRows, visualRows) {
  const beta = betaRows.find((row) => row.id === id)
  const visual = visualRows.find((row) => row.id === id)
  if (beta && visual) return { kind: 'ambiguous', row: null }
  if (beta) return { kind: 'beta', row: beta }
  if (visual) return { kind: 'visual', row: visual }
  return { kind: null, row: null }
}

function validateUpdate(update, betaRows, visualRows) {
  const issues = []
  const id = hasText(update.id) ? update.id.trim() : ''
  const located = findRow(id, betaRows, visualRows)
  if (!id) issues.push('missing id')
  if (located.kind === 'ambiguous') issues.push(`${id} appears in more than one dispatch log`)
  if (!located.kind) issues.push(`${id || 'unknown'} is not present in beta or visual dispatch logs`)
  if (located.row?.sendStatus === 'sent') issues.push(`${id} is already marked sent`)

  for (const field of ['reviewerAlias', 'deliveryChannel', 'sentAt', 'contactRecordLocation']) {
    if (!hasText(update[field])) issues.push(`${id || 'unknown'} missing ${field}`)
  }
  if (hasText(update.sentAt) && Number.isNaN(Date.parse(update.sentAt))) {
    issues.push(`${id} sentAt is not parseable`)
  }
  if (hasText(update.sentAt) && isDate(date) && !String(update.sentAt).startsWith(date)) {
    issues.push(`${id} sentAt should use ${date} for this launch-operator run`)
  }
  for (const field of ['reviewerAlias', 'contactRecordLocation', 'notes']) {
    if (looksSensitive(update[field])) issues.push(`${id || 'unknown'} ${field} appears to include contact details`)
  }

  return {
    ok: issues.length === 0,
    issues,
    id,
    kind: located.kind,
    currentStatus: located.row?.sendStatus || null,
  }
}

function applySentUpdate(row, update) {
  return {
    ...row,
    sendStatus: 'sent',
    reviewerAlias: update.reviewerAlias.trim(),
    deliveryChannel: update.deliveryChannel.trim(),
    sentAt: update.sentAt.trim(),
    contactRecordLocation: update.contactRecordLocation.trim(),
    notes: hasText(update.notes)
      ? update.notes.trim()
      : 'Marked sent from external outreach record. Real reviewer contact details are stored outside this repo.',
  }
}

let record = null
let betaDispatchLog = null
let visualDispatchLog = null
const setupIssues = []

if (!recordPath) {
  setupIssues.push('QA_DISPATCH_MARK_SENT_RECORD is required')
} else {
  try {
    record = await readJson(recordPath)
  } catch (error) {
    setupIssues.push(`could not read sent record ${qaDisplayPath(recordPath)}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

try {
  betaDispatchLog = await readJson(betaDispatchLogPath)
} catch (error) {
  setupIssues.push(`could not read beta dispatch log ${qaDisplayPath(betaDispatchLogPath)}: ${error instanceof Error ? error.message : String(error)}`)
}

try {
  visualDispatchLog = await readJson(visualDispatchLogPath)
} catch (error) {
  setupIssues.push(`could not read visual dispatch log ${qaDisplayPath(visualDispatchLogPath)}: ${error instanceof Error ? error.message : String(error)}`)
}

const betaRows = Array.isArray(betaDispatchLog?.dispatchRows) ? betaDispatchLog.dispatchRows : []
const visualRows = Array.isArray(visualDispatchLog?.dispatchRows) ? visualDispatchLog.dispatchRows : []
const requestedUpdates = normalizeRows(record)
const validationResults = requestedUpdates.map((update) => validateUpdate(update, betaRows, visualRows))
const duplicateIds = requestedUpdates
  .map((update) => update?.id)
  .filter((id, index, ids) => hasText(id) && ids.indexOf(id) !== index)
const duplicateIssues = Array.from(new Set(duplicateIds)).map((id) => `${id} is listed more than once`)
const rowIssues = validationResults.flatMap((result) => result.issues)
const issues = [
  ...setupIssues,
  ...(requestedUpdates.length > 0 ? [] : ['sent record has no rows']),
  ...duplicateIssues,
  ...rowIssues,
]
const validationClean = issues.length === 0
const validUpdates = issues.length === 0 ? requestedUpdates : []
const betaUpdateIds = new Set(validationClean ? validationResults.filter((result) => result.ok && result.kind === 'beta').map((result) => result.id) : [])
const visualUpdateIds = new Set(validationClean ? validationResults.filter((result) => result.ok && result.kind === 'visual').map((result) => result.id) : [])
const updateById = new Map(validUpdates.map((update) => [update.id, update]))

const nextBetaDispatchLog = betaDispatchLog
  ? {
      ...betaDispatchLog,
      sentCount: betaRows.filter((row) => betaUpdateIds.has(row.id) || row.sendStatus === 'sent').length,
      preparedNotSentCount: betaRows.filter((row) => !betaUpdateIds.has(row.id) && row.sendStatus !== 'sent').length,
      dispatchRows: betaRows.map((row) => betaUpdateIds.has(row.id) ? applySentUpdate(row, updateById.get(row.id)) : row),
    }
  : null
const nextVisualDispatchLog = visualDispatchLog
  ? {
      ...visualDispatchLog,
      sentCount: visualRows.filter((row) => visualUpdateIds.has(row.id) || row.sendStatus === 'sent').length,
      preparedNotSentCount: visualRows.filter((row) => !visualUpdateIds.has(row.id) && row.sendStatus !== 'sent').length,
      requiredPreparedNotSentCount: visualRows.filter((row) => !visualUpdateIds.has(row.id) && row.sendStatus !== 'sent' && row.requiredForPublicLaunch).length,
      dispatchRows: visualRows.map((row) => visualUpdateIds.has(row.id) ? applySentUpdate(row, updateById.get(row.id)) : row),
    }
  : null

if (importMode && issues.length === 0) {
  if (betaUpdateIds.size > 0) await writeFile(repoPath(betaDispatchLogPath), `${JSON.stringify(nextBetaDispatchLog, null, 2)}\n`)
  if (visualUpdateIds.size > 0) await writeFile(repoPath(visualDispatchLogPath), `${JSON.stringify(nextVisualDispatchLog, null, 2)}\n`)
}

const summary = {
  date,
  status: issues.length === 0 ? 'pass' : 'fail',
  importMode,
  recordArtifact: recordPath ? qaDisplayPath(recordPath) : null,
  betaDispatchLogArtifact: qaDisplayPath(betaDispatchLogPath),
  visualDispatchLogArtifact: qaDisplayPath(visualDispatchLogPath),
  requestedUpdateCount: requestedUpdates.length,
  betaUpdateCount: betaUpdateIds.size,
  visualUpdateCount: visualUpdateIds.size,
  updatedLogArtifacts: [
    ...(betaUpdateIds.size > 0 ? [qaDisplayPath(betaDispatchLogPath)] : []),
    ...(visualUpdateIds.size > 0 ? [qaDisplayPath(visualDispatchLogPath)] : []),
  ],
  validationResults,
  issues,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
}

const report = `# Dispatch Log Mark Sent

Date: ${summary.date}
Status: ${summary.status}
Mode: ${summary.importMode ? 'import' : 'dry run'}

## Result

- Requested updates: ${summary.requestedUpdateCount}
- Beta rows: ${summary.betaUpdateCount}
- Visual rows: ${summary.visualUpdateCount}
- Record: \`${summary.recordArtifact || 'missing'}\`
- Updated logs: ${summary.importMode ? summary.updatedLogArtifacts.map((artifact) => `\`${artifact}\``).join(', ') || 'none' : 'dry run only'}

## Operating Meaning

Use this command after real outreach happens outside the repo. The sent record must contain only non-sensitive reviewer aliases, delivery channels, timestamps, and external contact-record pointers. Dry run validates the record without mutating dispatch logs; import mode writes the matching beta and visual dispatch rows as sent.

## Rows

${validationResults.map((result) => `- ${result.ok ? 'Pass' : 'Fail'}: ${result.id || 'unknown'} (${result.kind || 'missing'})`).join('\n') || '- none'}

## Issues

${markdownList(summary.issues)}
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(repoPath(summary.jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(summary.reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (issues.length > 0) {
  process.exitCode = 1
}
