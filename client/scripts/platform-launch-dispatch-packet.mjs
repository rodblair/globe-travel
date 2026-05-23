import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const date = process.env.QA_LAUNCH_DISPATCH_PACKET_DATE || currentQaDate()
const sentRecordTemplatePath = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE ||
  `qa/dispatch-sent-record-template-${date}.json`
const launchOperatorPath = process.env.QA_LAUNCH_OPERATOR_TODAY ||
  `qa/launch-operator-today-${date}.json`
const artifactName = process.env.QA_LAUNCH_DISPATCH_PACKET_ARTIFACT_NAME ||
  `launch-dispatch-packet-${date}`

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function repoPath(path) {
  return resolve(root, qaDisplayPath(path))
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
}

async function readText(path) {
  return readFile(repoPath(path), 'utf8')
}

async function exists(path) {
  try {
    await access(repoPath(path))
    return true
  } catch {
    return false
  }
}

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function fence(text) {
  return `\`\`\`text\n${String(text || '').trim()}\n\`\`\``
}

function looksSensitive(value) {
  const text = String(value || '')
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text) ||
    /\+?\d[\d\s().-]{7,}\d/.test(text)
}

const sentRecordTemplate = await readJson(sentRecordTemplatePath)
const launchOperator = await readJson(launchOperatorPath)
const templateRows = Array.isArray(sentRecordTemplate.rows) ? sentRecordTemplate.rows : []
const launchRows = Array.isArray(launchOperator.actionRows) ? launchOperator.actionRows : []
const launchRowById = new Map(launchRows.map((row) => [row.id, row]))
const packetRows = await Promise.all(templateRows.map(async (row) => {
  const launchRow = launchRowById.get(row.id) || {}
  const messageBody = hasText(row.messageFile) ? await readText(row.messageFile) : ''
  return {
    id: row.id,
    workType: row.workType,
    priority: launchRow.priority || null,
    destination: row.destination || launchRow.destination || '',
    messageSubject: row.messageSubject || launchRow.messageSubject || row.id,
    messageFile: qaDisplayPath(row.messageFile),
    messageBody,
    startUrlOrCommand: row.startUrlOrCommand || launchRow.startUrlOrCommand || '',
    packetOrArtifact: qaDisplayPath(row.packetOrArtifact),
    submissionTemplatePath: qaDisplayPath(row.submissionTemplatePath),
    completedSubmissionPath: qaDisplayPath(row.completedSubmissionPath),
    validateCommand: row.validateCommand || '',
    importCommand: row.importCommand || '',
    reviewerAlias: row.reviewerAlias || '',
    deliveryChannel: row.deliveryChannel || '',
    sentAt: row.sentAt || '',
    contactRecordLocation: row.contactRecordLocation || '',
  }
}))

const messageFileChecks = await Promise.all(packetRows.map(async (row) => ({
  id: row.id,
  messageFile: row.messageFile,
  exists: hasText(row.messageFile) ? await exists(row.messageFile) : false,
  hasBody: hasText(row.messageBody, 80),
  subjectMatches: row.messageBody.includes(row.messageSubject),
})))
const submissionTemplateChecks = await Promise.all(packetRows.map(async (row) => ({
  id: row.id,
  submissionTemplatePath: row.submissionTemplatePath,
  exists: hasText(row.submissionTemplatePath) ? await exists(row.submissionTemplatePath) : false,
})))
const rowsWithProofFields = packetRows.filter((row) => (
  hasText(row.reviewerAlias) ||
  hasText(row.deliveryChannel) ||
  hasText(row.sentAt) ||
  hasText(row.contactRecordLocation)
))
const rowsMissingCommands = packetRows.filter((row) => !hasText(row.validateCommand) || !hasText(row.importCommand)).map((row) => row.id)
const rowsMissingContext = packetRows.filter((row) => (
  !hasText(row.messageSubject) ||
  !hasText(row.startUrlOrCommand) ||
  !hasText(row.packetOrArtifact) ||
  !hasText(row.completedSubmissionPath)
)).map((row) => row.id)
const sensitiveRows = packetRows.filter((row) => (
  looksSensitive(row.reviewerAlias) ||
  looksSensitive(row.contactRecordLocation)
)).map((row) => row.id)

const checks = [
  {
    name: 'launch dispatch packet reads current launch operator and sent-record template',
    ok: launchOperator.today === date &&
      sentRecordTemplate.date === date &&
      sentRecordTemplate.status === 'pass' &&
      sentRecordTemplate.readyForImport === false,
    launchOperatorToday: launchOperator.today || null,
    sentRecordTemplateDate: sentRecordTemplate.date || null,
    sentRecordTemplateStatus: sentRecordTemplate.status || null,
    readyForImport: sentRecordTemplate.readyForImport ?? null,
  },
  {
    name: 'launch dispatch packet includes every current outreach row',
    ok: packetRows.length === Number(sentRecordTemplate.rowCount) &&
      packetRows.length > 0 &&
      packetRows.every((row) => launchRowById.has(row.id)),
    packetRowCount: packetRows.length,
    sentRecordTemplateRowCount: sentRecordTemplate.rowCount ?? null,
    missingLaunchRows: packetRows.filter((row) => !launchRowById.has(row.id)).map((row) => row.id),
  },
  {
    name: 'launch dispatch packet inlines readable message bodies',
    ok: messageFileChecks.every((check) => check.exists && check.hasBody && check.subjectMatches),
    messageFileChecks,
  },
  {
    name: 'launch dispatch packet points at existing submission templates',
    ok: submissionTemplateChecks.every((check) => check.exists),
    submissionTemplateChecks,
  },
  {
    name: 'launch dispatch packet keeps proof fields blank until real outreach is sent',
    ok: rowsWithProofFields.length === 0,
    rowsWithProofFields: rowsWithProofFields.map((row) => row.id),
  },
  {
    name: 'launch dispatch packet includes validation and import commands for every row',
    ok: rowsMissingCommands.length === 0 &&
      hasText(sentRecordTemplate.csvValidationCommand) &&
      hasText(sentRecordTemplate.csvImportCommand) &&
      Array.isArray(sentRecordTemplate.postImportCommands) &&
      sentRecordTemplate.postImportCommands.includes('npm run qa:launch-refresh') &&
      sentRecordTemplate.postImportCommands.includes('npm run qa:launch-signoff'),
    rowsMissingCommands,
    csvValidationCommand: sentRecordTemplate.csvValidationCommand || null,
    csvImportCommand: sentRecordTemplate.csvImportCommand || null,
    postImportCommands: sentRecordTemplate.postImportCommands || [],
  },
  {
    name: 'launch dispatch packet includes complete operator context without sensitive contact details',
    ok: rowsMissingContext.length === 0 && sensitiveRows.length === 0,
    rowsMissingContext,
    sensitiveRows,
  },
]

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  launchOperatorArtifact: qaDisplayPath(launchOperatorPath),
  sentRecordTemplateArtifact: qaDisplayPath(sentRecordTemplatePath),
  sentRecordTemplateCsv: qaDisplayPath(sentRecordTemplate.csvArtifact),
  rowCount: packetRows.length,
  betaRowCount: packetRows.filter((row) => row.workType === 'beta-human-review').length,
  visualRowCount: packetRows.filter((row) => row.workType === 'production-visual-review').length,
  csvValidationCommand: sentRecordTemplate.csvValidationCommand,
  csvImportCommand: sentRecordTemplate.csvImportCommand,
  postImportCommands: sentRecordTemplate.postImportCommands || [],
  rows: packetRows,
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
}

const report = `# Launch Dispatch Packet

Date: ${summary.date}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Launch operator board: \`${summary.launchOperatorArtifact}\`
- Sent-record template: \`${summary.sentRecordTemplateArtifact}\`
- Sent-record CSV to fill after real outreach: \`${summary.sentRecordTemplateCsv}\`
- Outreach rows: ${summary.rowCount} (${summary.betaRowCount} beta, ${summary.visualRowCount} visual)

## Operating Meaning

This packet is a send bundle, not proof that anything was sent. Use it to copy the prepared messages into the external outreach channel. After real outreach happens, fill only the blank proof fields in \`${summary.sentRecordTemplateCsv}\`, validate, import, then rerun launch gates.

## After Real Sends

- Validate filled CSV: \`${summary.csvValidationCommand}\`
- Import filled CSV: \`${summary.csvImportCommand}\`
${summary.postImportCommands.map((command) => `- Run: \`${command}\``).join('\n')}

## Messages

${packetRows.map((row, index) => `### ${index + 1}. ${row.id} (${row.workType})

- Priority: ${row.priority || 'n/a'}
- Subject: ${row.messageSubject}
- Message source: \`${row.messageFile}\`
- Start URL or command: \`${row.startUrlOrCommand}\`
- Packet or artifact: \`${row.packetOrArtifact}\`
- Submission template: \`${row.submissionTemplatePath}\`
- Completed evidence target: \`${row.completedSubmissionPath}\`
- Validate completed evidence: \`${row.validateCommand}\`
- Import completed evidence: \`${row.importCommand}\`

${fence(row.messageBody)}
`).join('\n')}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(repoPath(summary.jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(summary.reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
