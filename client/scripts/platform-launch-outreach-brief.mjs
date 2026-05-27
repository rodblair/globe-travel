import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const date = process.env.QA_LAUNCH_OUTREACH_BRIEF_DATE || currentQaDate()
const publicStatusPath = process.env.QA_PUBLIC_LAUNCH_STATUS || 'qa/public-launch-status-2026-05-21.json'
const launchOperatorPath = process.env.QA_LAUNCH_OPERATOR_TODAY || `qa/launch-operator-today-${date}.json`
const dispatchPacketPath = process.env.QA_LAUNCH_DISPATCH_PACKET || `qa/launch-dispatch-packet-${date}.json`
const artifactName = process.env.QA_LAUNCH_OUTREACH_BRIEF_ARTIFACT_NAME || `launch-outreach-brief-${date}`

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

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function looksSensitive(value) {
  const text = String(value || '')
  return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text) ||
    /\+?\d[\d\s().-]{7,}\d/.test(text)
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function rowsToCsv(rows) {
  const headers = [
    'order',
    'priority',
    'id',
    'workType',
    'destination',
    'sendTiming',
    'dueTiming',
    'messageSubject',
    'messageFile',
    'startUrlOrCommand',
    'packetOrArtifact',
    'completedEvidenceTarget',
  ]
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function commandList(commands) {
  return Array.isArray(commands) && commands.length
    ? commands.map((command) => `- \`${command}\``).join('\n')
    : '- none'
}

const publicStatus = await readJson(publicStatusPath)
const launchOperator = await readJson(launchOperatorPath)
const dispatchPacket = await readJson(dispatchPacketPath)
const actionRows = Array.isArray(launchOperator.actionRows) ? launchOperator.actionRows : []
const packetRows = Array.isArray(dispatchPacket.rows) ? dispatchPacket.rows : []
const actionRowById = new Map(actionRows.map((row) => [row.id, row]))

const briefRows = packetRows.map((row, index) => {
  const actionRow = actionRowById.get(row.id) || {}
  return {
    order: index + 1,
    priority: actionRow.priority || row.priority || 'n/a',
    id: row.id,
    workType: row.workType,
    destination: row.destination || actionRow.destination || '',
    sendTiming: actionRow.sendTiming || '',
    dueTiming: actionRow.dueTiming || '',
    messageSubject: row.messageSubject || actionRow.messageSubject || row.id,
    messageFile: qaDisplayPath(row.messageFile),
    startUrlOrCommand: row.startUrlOrCommand || actionRow.startUrlOrCommand || '',
    packetOrArtifact: qaDisplayPath(row.packetOrArtifact),
    completedEvidenceTarget: qaDisplayPath(row.completedSubmissionPath || actionRow.submissionPath),
    reviewerAlias: row.reviewerAlias || '',
    deliveryChannel: row.deliveryChannel || '',
    sentAt: row.sentAt || '',
    contactRecordLocation: row.contactRecordLocation || '',
  }
})

const messageFileChecks = await Promise.all(briefRows.map(async (row) => ({
  id: row.id,
  messageFile: row.messageFile,
  exists: hasText(row.messageFile) ? await exists(row.messageFile) : false,
})))
const rowsWithProofFields = briefRows.filter((row) => (
  hasText(row.reviewerAlias) ||
  hasText(row.deliveryChannel) ||
  hasText(row.sentAt) ||
  hasText(row.contactRecordLocation)
))
const sensitiveRows = briefRows.filter((row) => (
  looksSensitive(row.reviewerAlias) ||
  looksSensitive(row.contactRecordLocation)
))
const missingActionRows = briefRows.filter((row) => !actionRowById.has(row.id)).map((row) => row.id)
const missingBriefContextRows = briefRows.filter((row) => (
  !hasText(row.id) ||
  !hasText(row.messageSubject) ||
  !hasText(row.messageFile) ||
  !hasText(row.completedEvidenceTarget)
)).map((row) => row.id)
const blockerIds = Array.isArray(publicStatus.blockers) ? publicStatus.blockers.map((blocker) => blocker.id) : []
const guardrailIssues = Array.isArray(publicStatus.guardrailIssues) ? publicStatus.guardrailIssues : []
const validationCommands = [
  dispatchPacket.csvValidationCommand,
  dispatchPacket.csvImportCommand,
  ...(Array.isArray(dispatchPacket.postImportCommands) ? dispatchPacket.postImportCommands : []),
].filter(hasText)

const checks = [
  {
    name: 'launch outreach brief reads current status, operator board, and dispatch packet',
    ok: publicStatus.status === 'blocked' &&
      launchOperator.today === date &&
      dispatchPacket.date === date &&
      dispatchPacket.status === 'pass',
    publicStatus: publicStatus.status || null,
    launchOperatorToday: launchOperator.today || null,
    dispatchPacketDate: dispatchPacket.date || null,
    dispatchPacketStatus: dispatchPacket.status || null,
  },
  {
    name: 'launch outreach brief is tied to external review blockers, not runtime drift',
    ok: blockerIds.includes('beta-human-review-threshold') &&
      blockerIds.includes('production-visual-review-history') &&
      publicStatus.deploymentCurrency?.runtimeCommitAhead !== true,
    blockerIds,
    guardrailIssues,
    runtimeCommitAhead: publicStatus.deploymentCurrency?.runtimeCommitAhead ?? null,
  },
  {
    name: 'launch outreach brief includes every current outreach row',
    ok: briefRows.length === packetRows.length &&
      briefRows.length === actionRows.length &&
      missingActionRows.length === 0,
    briefRowCount: briefRows.length,
    packetRowCount: packetRows.length,
    actionRowCount: actionRows.length,
    missingActionRows,
  },
  {
    name: 'launch outreach brief points at existing message files',
    ok: messageFileChecks.every((check) => check.exists),
    messageFileChecks,
  },
  {
    name: 'launch outreach brief keeps proof fields blank until real sends happen',
    ok: rowsWithProofFields.length === 0,
    rowsWithProofFields: rowsWithProofFields.map((row) => row.id),
  },
  {
    name: 'launch outreach brief avoids private contact details',
    ok: sensitiveRows.length === 0,
    sensitiveRows: sensitiveRows.map((row) => row.id),
  },
  {
    name: 'launch outreach brief includes post-send validation commands',
    ok: validationCommands.some((command) => command.includes('qa:dispatch-mark-sent')) &&
      validationCommands.includes('npm run qa:launch-refresh') &&
      validationCommands.includes('npm run qa:launch-signoff'),
    validationCommands,
  },
  {
    name: 'launch outreach brief has complete operator row context',
    ok: missingBriefContextRows.length === 0,
    missingBriefContextRows,
  },
]

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  publicStatusArtifact: qaDisplayPath(publicStatusPath),
  launchOperatorArtifact: qaDisplayPath(launchOperatorPath),
  dispatchPacketArtifact: qaDisplayPath(dispatchPacketPath),
  sentRecordCsv: qaDisplayPath(dispatchPacket.sentRecordTemplateCsv),
  publicLaunchStatus: publicStatus.status,
  liveDeployment: publicStatus.liveDeployment || null,
  guardrailIssues,
  blockerIds,
  immediateExternalAction: launchOperator.operatorHandoff?.immediateExternalAction || dispatchPacket.operatorBrief?.immediateExternalAction || '',
  rowCount: briefRows.length,
  betaRowCount: briefRows.filter((row) => row.workType === 'beta-human-review').length,
  visualRowCount: briefRows.filter((row) => row.workType === 'production-visual-review').length,
  validationCommands,
  privacyRule: dispatchPacket.operatorBrief?.proofPrivacyRule || 'Keep private reviewer contact details outside repo artifacts.',
  evidenceBoundary: dispatchPacket.operatorBrief?.publicLaunchBoundary || 'This brief is outreach guidance, not completed review evidence.',
  rows: briefRows.map((row) => ({
    order: row.order,
    priority: row.priority,
    id: row.id,
    workType: row.workType,
    destination: row.destination,
    sendTiming: row.sendTiming,
    dueTiming: row.dueTiming,
    messageSubject: row.messageSubject,
    messageFile: row.messageFile,
    startUrlOrCommand: row.startUrlOrCommand,
    packetOrArtifact: row.packetOrArtifact,
    completedEvidenceTarget: row.completedEvidenceTarget,
  })),
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
  csvArtifact: `qa/${artifactName}.csv`,
}

const report = `# Launch Outreach Brief

Date: ${summary.date}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Public launch status: ${summary.publicLaunchStatus}
- Current blockers: ${summary.blockerIds.join(', ') || 'none'}
- Outreach rows: ${summary.rowCount} (${summary.betaRowCount} beta, ${summary.visualRowCount} visual)
- Sent-record CSV to fill only after real outreach: \`${summary.sentRecordCsv}\`

## Do Now

${summary.immediateExternalAction}

## Boundaries

- ${summary.evidenceBoundary}
- ${summary.privacyRule}
- Do not enter real names, emails, phone numbers, or private contact notes into repo artifacts.

## Send Order

| Order | Priority | ID | Type | Send Timing | Due Timing | Subject | Message File | Completed Evidence Target |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${summary.rows.map((row) => `| ${row.order} | ${row.priority} | ${row.id} | ${row.workType} | ${row.sendTiming || 'n/a'} | ${row.dueTiming || 'n/a'} | ${row.messageSubject} | \`${row.messageFile}\` | \`${row.completedEvidenceTarget}\` |`).join('\n')}

## After Real Sends

${commandList(summary.validationCommands)}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(repoPath(summary.jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(summary.reportArtifact), report)
await writeFile(repoPath(summary.csvArtifact), `${rowsToCsv(summary.rows)}\n`)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
