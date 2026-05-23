import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const date = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_DATE || currentQaDate()
const launchOperatorTodayPath = process.env.QA_LAUNCH_OPERATOR_TODAY || `qa/launch-operator-today-${date}.json`
const artifactName = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_ARTIFACT_NAME ||
  `dispatch-sent-record-template-${date}`

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function repoPath(path) {
  return resolve(root, qaDisplayPath(path))
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
}

async function exists(path) {
  try {
    await access(repoPath(path))
    return true
  } catch {
    return false
  }
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function rowsToCsv(rows) {
  const headers = [
    'id',
    'workType',
    'destination',
    'messageFile',
    'submissionTemplatePath',
    'completedSubmissionPath',
    'reviewerAlias',
    'deliveryChannel',
    'sentAt',
    'contactRecordLocation',
    'notes',
  ]
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function looksSensitive(value) {
  const text = String(value || '')
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text) ||
    /\+?\d[\d\s().-]{7,}\d/.test(text)
}

function templatePathFor(completedSubmissionPath) {
  return String(completedSubmissionPath || '').replace(/\.json$/, '.template.json')
}

const launchOperatorToday = await readJson(launchOperatorTodayPath)
const actionRows = Array.isArray(launchOperatorToday.actionRows) ? launchOperatorToday.actionRows : []
const sendRows = actionRows.filter((row) => row.sendStatus !== 'sent')
const templateRows = sendRows.map((row) => ({
  id: row.id,
  workType: row.workType,
  destination: row.destination || '',
  messageFile: row.messageFile || '',
  submissionTemplatePath: templatePathFor(row.submissionPath),
  completedSubmissionPath: row.submissionPath || '',
  reviewerAlias: '',
  deliveryChannel: '',
  sentAt: '',
  contactRecordLocation: '',
  notes: 'Fill only after real outreach is sent. Do not store reviewer names, email addresses, phone numbers, or other contact details in this repo.',
}))
const validationCommand = `QA_DISPATCH_MARK_SENT_RECORD=qa/${artifactName}.json npm run qa:dispatch-mark-sent`
const importCommand = `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/${artifactName}.json npm run qa:dispatch-mark-sent`

const messageFileChecks = await Promise.all(templateRows.map(async (row) => ({
  id: row.id,
  messageFile: row.messageFile,
  exists: row.messageFile ? await exists(row.messageFile) : false,
})))
const submissionTemplateChecks = await Promise.all(templateRows.map(async (row) => ({
  id: row.id,
  submissionTemplatePath: row.submissionTemplatePath,
  exists: row.submissionTemplatePath ? await exists(row.submissionTemplatePath) : false,
})))

const checks = [
  {
    name: 'sent-record template reads passing launch operator board',
    ok: launchOperatorToday.status === 'pass' && launchOperatorToday.today === date,
    launchOperatorStatus: launchOperatorToday.status || null,
    launchOperatorToday: launchOperatorToday.today || null,
  },
  {
    name: 'sent-record template covers every current send action',
    ok: templateRows.length === actionRows.length && templateRows.length > 0,
    actionRowCount: actionRows.length,
    templateRowCount: templateRows.length,
  },
  {
    name: 'sent-record template keeps post-send proof fields blank',
    ok: templateRows.every((row) => !row.reviewerAlias && !row.deliveryChannel && !row.sentAt && !row.contactRecordLocation),
    blankFieldCount: templateRows.filter((row) => !row.reviewerAlias && !row.deliveryChannel && !row.sentAt && !row.contactRecordLocation).length,
  },
  {
    name: 'sent-record template points at existing message files',
    ok: messageFileChecks.every((check) => check.exists),
    missingMessageFiles: messageFileChecks.filter((check) => !check.exists),
  },
  {
    name: 'sent-record template points at existing submission templates',
    ok: submissionTemplateChecks.every((check) => check.exists),
    missingSubmissionTemplates: submissionTemplateChecks.filter((check) => !check.exists),
  },
  {
    name: 'sent-record template includes validation and import commands',
    ok: validationCommand.includes('qa:dispatch-mark-sent') &&
      importCommand.includes('QA_DISPATCH_MARK_SENT_IMPORT=1') &&
      importCommand.includes('qa:dispatch-mark-sent'),
    validationCommand,
    importCommand,
  },
  {
    name: 'sent-record template contains no sensitive contact details',
    ok: templateRows.every((row) => !looksSensitive(row.reviewerAlias) && !looksSensitive(row.contactRecordLocation) && !looksSensitive(row.notes)),
    sensitiveRowIds: templateRows
      .filter((row) => looksSensitive(row.reviewerAlias) || looksSensitive(row.contactRecordLocation) || looksSensitive(row.notes))
      .map((row) => row.id),
  },
]
const failures = checks.filter((check) => !check.ok)
const betaRows = templateRows.filter((row) => row.workType === 'beta-human-review')
const visualRows = templateRows.filter((row) => row.workType === 'production-visual-review')
const summary = {
  date,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  launchOperatorArtifact: qaDisplayPath(launchOperatorTodayPath),
  readyForImport: false,
  rowCount: templateRows.length,
  betaRowCount: betaRows.length,
  visualRowCount: visualRows.length,
  validationCommand,
  importCommand,
  messageFileChecks,
  submissionTemplateChecks,
  rows: templateRows,
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
  csvArtifact: `qa/${artifactName}.csv`,
}

const report = `# Dispatch Sent-Record Template

Date: ${summary.date}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Launch operator board: \`${summary.launchOperatorArtifact}\`
- Template rows: ${summary.rowCount}
- Beta rows: ${summary.betaRowCount}
- Visual rows: ${summary.visualRowCount}
- Ready for import now: no

## Operating Meaning

This file is not a sent proof and does not count as outreach evidence. It is a starter record for the release operator to fill only after real beta invites or visual-review assignments are sent outside the repo. Keep real names, emails, phone numbers, and other contact details in the external contact system; use only non-sensitive aliases and external record pointers here.

## Commands After Filling

- Validate: \`${summary.validationCommand}\`
- Import: \`${summary.importCommand}\`

## Rows To Fill

| ID | Type | Message | Submission Template | Completed Evidence Target |
| --- | --- | --- | --- | --- |
${templateRows.map((row) => `| ${row.id} | ${row.workType} | \`${row.messageFile}\` | \`${row.submissionTemplatePath}\` | \`${row.completedSubmissionPath}\` |`).join('\n') || '| none | none | none | none | none |'}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(repoPath(summary.jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(summary.reportArtifact), report)
await writeFile(repoPath(summary.csvArtifact), `${rowsToCsv(templateRows)}\n`)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
