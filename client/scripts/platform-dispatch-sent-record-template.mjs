import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const date = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_DATE || currentQaDate()
const launchOperatorTodayPath = process.env.QA_LAUNCH_OPERATOR_TODAY || `qa/launch-operator-today-${date}.json`
const artifactName = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_ARTIFACT_NAME ||
  `dispatch-sent-record-template-${date}`
const postImportCommands = [
  'npm run qa:launch-refresh',
  'npm run qa:launch-signoff',
]
const allowedDeliveryChannels = [
  'email',
  'sms',
  'slack',
  'discord',
  'whatsapp',
  'imessage',
  'phone',
  'manual',
  'external-outreach-log',
  'other',
]
const contactRecordLocationExamples = [
  'https://crm.example.com/records/GT-123',
  'external-record:BETA-HR-001-sent-proof',
  'crm:GT-BETA-HR-001',
]

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
    'messageSubject',
    'messageFile',
    'startUrlOrCommand',
    'packetOrArtifact',
    'submissionTemplatePath',
    'completedSubmissionPath',
    'validateCommand',
    'importCommand',
    'postImportCommands',
    'reviewerAlias',
    'deliveryChannel',
    'sentAt',
    'contactRecordLocation',
    'notes',
    'reviewerAliasExample',
    'deliveryChannelExample',
    'sentAtExample',
    'contactRecordLocationExample',
  ]
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
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

function templatePathFor(completedSubmissionPath) {
  return String(completedSubmissionPath || '').replace(/\.json$/, '.template.json')
}

const launchOperatorToday = await readJson(launchOperatorTodayPath)
const actionRows = Array.isArray(launchOperatorToday.actionRows) ? launchOperatorToday.actionRows : []
const launchOperatorFailures = Array.isArray(launchOperatorToday.failures) ? launchOperatorToday.failures : []
const onlyOverdueLaunchExecutionFailure = launchOperatorToday.status === 'fail' &&
  launchOperatorFailures.length === 1 &&
  launchOperatorFailures[0]?.name === 'launch today has no overdue launch execution rows'
const launchOperatorBoardActionable = launchOperatorToday.status === 'pass' || onlyOverdueLaunchExecutionFailure
const sendRows = actionRows.filter((row) => (
  row.sendStatus !== 'sent' &&
  (row.workType === 'beta-human-review' || row.workType === 'production-visual-review')
))
const templateRows = sendRows.map((row) => ({
  id: row.id,
  workType: row.workType,
  destination: row.destination || '',
  messageSubject: row.messageSubject || row.id,
  messageFile: row.messageFile || '',
  startUrlOrCommand: row.startUrlOrCommand || '',
  packetOrArtifact: row.packetOrArtifact || '',
  submissionTemplatePath: templatePathFor(row.submissionPath),
  completedSubmissionPath: row.submissionPath || '',
  validateCommand: row.validateCommand || '',
  importCommand: row.importCommand || '',
  postImportCommands,
  reviewerAlias: '',
  deliveryChannel: '',
  sentAt: '',
  contactRecordLocation: '',
  notes: 'Fill only after real outreach is sent. Do not store reviewer names, email addresses, phone numbers, or other contact details in this repo.',
  reviewerAliasExample: `reviewer-${String(row.id || 'row').toLowerCase()}`,
  deliveryChannelExample: 'external-outreach-log',
  sentAtExample: `${date}T12:00:00.000Z`,
  contactRecordLocationExample: `external-record:${String(row.id || 'row').toLowerCase()}-sent-proof`,
}))
const validationCommand = `QA_DISPATCH_MARK_SENT_RECORD=qa/${artifactName}.json npm run qa:dispatch-mark-sent`
const importCommand = `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/${artifactName}.json npm run qa:dispatch-mark-sent`
const csvValidationCommand = `QA_DISPATCH_MARK_SENT_RECORD=qa/${artifactName}.csv npm run qa:dispatch-mark-sent`
const csvImportCommand = `QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=qa/${artifactName}.csv npm run qa:dispatch-mark-sent`

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
    name: 'sent-record template reads actionable launch operator board',
    ok: launchOperatorBoardActionable && launchOperatorToday.today === date,
    launchOperatorStatus: launchOperatorToday.status || null,
    launchOperatorToday: launchOperatorToday.today || null,
    acceptedOverdueRemediationBoard: onlyOverdueLaunchExecutionFailure,
  },
  {
    name: 'sent-record template covers every current outreach send action',
    ok: templateRows.length === sendRows.length && templateRows.length > 0,
    actionRowCount: actionRows.length,
    outreachSendRowCount: sendRows.length,
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
      importCommand.includes('qa:dispatch-mark-sent') &&
      csvValidationCommand.includes('.csv') &&
      csvImportCommand.includes('QA_DISPATCH_MARK_SENT_IMPORT=1') &&
      csvImportCommand.includes('.csv') &&
      templateRows.every((row) => hasText(row.validateCommand) && hasText(row.importCommand)),
    validationCommand,
    importCommand,
    csvValidationCommand,
    csvImportCommand,
    rowsMissingCommands: templateRows
      .filter((row) => !hasText(row.validateCommand) || !hasText(row.importCommand))
      .map((row) => row.id),
  },
  {
    name: 'sent-record template requires launch refresh and signoff after import',
    ok: postImportCommands.includes('npm run qa:launch-refresh') &&
      postImportCommands.includes('npm run qa:launch-signoff'),
    postImportCommands,
  },
  {
    name: 'sent-record template includes operator context for every outreach row',
    ok: templateRows.every((row) => (
      hasText(row.messageSubject) &&
      hasText(row.startUrlOrCommand) &&
      hasText(row.packetOrArtifact)
    )),
    rowsMissingOperatorContext: templateRows
      .filter((row) => !hasText(row.messageSubject) || !hasText(row.startUrlOrCommand) || !hasText(row.packetOrArtifact))
      .map((row) => row.id),
  },
  {
    name: 'sent-record template includes proof-format guidance',
    ok: allowedDeliveryChannels.includes('external-outreach-log') &&
      contactRecordLocationExamples.some((example) => example.startsWith('https://')) &&
      contactRecordLocationExamples.some((example) => example.startsWith('external-record:')) &&
      contactRecordLocationExamples.some((example) => example.startsWith('crm:')) &&
      templateRows.every((row) => (
        hasText(row.reviewerAliasExample) &&
        allowedDeliveryChannels.includes(row.deliveryChannelExample) &&
        hasText(row.sentAtExample) &&
        hasText(row.contactRecordLocationExample) &&
        String(row.contactRecordLocationExample).startsWith('external-record:')
      )),
    allowedDeliveryChannels,
    contactRecordLocationExamples,
    rowsMissingProofExamples: templateRows
      .filter((row) => !hasText(row.reviewerAliasExample) ||
        !allowedDeliveryChannels.includes(row.deliveryChannelExample) ||
        !hasText(row.sentAtExample) ||
        !hasText(row.contactRecordLocationExample))
      .map((row) => row.id),
  },
  {
    name: 'sent-record template contains no sensitive contact details',
    ok: templateRows.every((row) => !looksSensitive(row.reviewerAlias) &&
      !looksSensitive(row.contactRecordLocation) &&
      !looksSensitive(row.notes) &&
      !looksSensitive(row.reviewerAliasExample) &&
      !looksSensitive(row.contactRecordLocationExample)),
    sensitiveRowIds: templateRows
      .filter((row) => looksSensitive(row.reviewerAlias) ||
        looksSensitive(row.contactRecordLocation) ||
        looksSensitive(row.notes) ||
        looksSensitive(row.reviewerAliasExample) ||
        looksSensitive(row.contactRecordLocationExample))
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
  csvValidationCommand,
  csvImportCommand,
  postImportCommands,
  allowedDeliveryChannels,
  contactRecordLocationExamples,
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

## Proof Fields To Fill

- reviewerAlias: a stable non-sensitive alias, such as \`reviewer-beta-hr-001\`
- deliveryChannel: one of ${summary.allowedDeliveryChannels.map((channel) => `\`${channel}\``).join(', ')}
- sentAt: an ISO timestamp that starts with ${summary.date}, such as \`${summary.date}T12:00:00.000Z\`
- contactRecordLocation: a stable external proof pointer, such as ${summary.contactRecordLocationExamples.map((example) => `\`${example}\``).join(', ')}

The example columns in the JSON and CSV are examples only. Leave them unchanged or delete them before import; the import command reads only the real proof fields.

## Commands After Filling The JSON

- Validate: \`${summary.validationCommand}\`
- Import: \`${summary.importCommand}\`

## Commands After Filling The CSV

- Validate: \`${summary.csvValidationCommand}\`
- Import: \`${summary.csvImportCommand}\`

## After Import

${summary.postImportCommands.map((command) => `- Run: \`${command}\``).join('\n')}

## Rows To Fill

| ID | Type | Subject | Source | Packet | Submission Template | Completed Evidence Target |
| --- | --- | --- | --- | --- | --- | --- |
${templateRows.map((row) => `| ${row.id} | ${row.workType} | ${row.messageSubject} | \`${row.messageFile || row.startUrlOrCommand}\` | \`${row.packetOrArtifact}\` | \`${row.submissionTemplatePath}\` | \`${row.completedSubmissionPath}\` |`).join('\n') || '| none | none | none | none | none | none | none |'}

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
