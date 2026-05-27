import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const date = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_REJECTION_DATE || currentQaDate()
const templatePath = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE ||
  `qa/dispatch-sent-record-template-${date}.json`
const templateReportPath = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_REPORT ||
  `qa/dispatch-sent-record-template-${date}.md`
const betaDispatchLogPath = process.env.QA_BETA_REVIEW_DISPATCH_LOG ||
  process.env.QA_BETA_REVIEW_OPERATOR_DISPATCH_LOG ||
  latestQaArtifact(/^beta-human-review-dispatch-log-all-wave-\d{4}-\d{2}-\d{2}\.json$/, 'qa/beta-human-review-dispatch-log-2026-05-21.json')
const visualDispatchLogPath = process.env.QA_VISUAL_REVIEW_DISPATCH_LOG ||
  latestQaArtifact(/^production-visual-review-dispatch-log-\d{4}-\d{2}-\d{2}\.json$/, 'qa/production-visual-review-dispatch-log-2026-05-21.json')
const rawArtifactName = `dispatch-sent-record-template-rejection-raw-${date}`
const rawJson = `qa/${rawArtifactName}.json`
const rawReport = `qa/${rawArtifactName}.md`
const invalidProofRecord = `qa/dispatch-sent-record-template-invalid-proof-${date}.json`
const invalidProofArtifactName = `dispatch-sent-record-template-invalid-proof-raw-${date}`
const invalidProofRawJson = `qa/${invalidProofArtifactName}.json`
const invalidProofRawReport = `qa/${invalidProofArtifactName}.md`
const artifactName = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_REJECTION_ARTIFACT_NAME ||
  `dispatch-sent-record-template-rejection-${date}`

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function latestQaArtifact(filePattern, fallbackPath) {
  try {
    const matches = readdirSync(resolve(root, 'qa'))
      .filter((file) => filePattern.test(file))
      .sort()
    return matches.length ? `qa/${matches.at(-1)}` : fallbackPath
  } catch {
    return fallbackPath
  }
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

async function fileExists(path) {
  try {
    await access(repoPath(path))
    return true
  } catch {
    return false
  }
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function sentCount(log) {
  return Array.isArray(log?.dispatchRows)
    ? log.dispatchRows.filter((row) => row.sendStatus === 'sent').length
    : Number(log?.sentCount || 0)
}

await mkdir(resolve(root, 'qa'), { recursive: true })
await Promise.all([rawJson, rawReport, invalidProofRecord, invalidProofRawJson, invalidProofRawReport].map((path) => rm(repoPath(path), { force: true })))

const template = await readJson(templatePath)
const templateReport = await readText(templateReportPath)
const canonicalBetaBefore = await readJson(betaDispatchLogPath)
const canonicalVisualBefore = await readJson(visualDispatchLogPath)
const canonicalBetaBeforeSerialized = JSON.stringify(canonicalBetaBefore)
const canonicalVisualBeforeSerialized = JSON.stringify(canonicalVisualBefore)

const markSentResult = spawnSync(process.execPath, ['scripts/platform-dispatch-log-mark-sent.mjs'], {
  cwd: clientRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    QA_BETA_REVIEW_DISPATCH_LOG: betaDispatchLogPath,
    QA_VISUAL_REVIEW_DISPATCH_LOG: visualDispatchLogPath,
    QA_DISPATCH_MARK_SENT_IMPORT: '1',
    QA_DISPATCH_MARK_SENT_RECORD: templatePath,
    QA_DISPATCH_MARK_SENT_ARTIFACT_NAME: rawArtifactName,
  },
})

const markSentSummary = await readJson(rawJson).catch(() => null)
const canonicalBetaAfter = await readJson(betaDispatchLogPath)
const canonicalVisualAfter = await readJson(visualDispatchLogPath)
const rawReportExistsBeforeCleanup = await fileExists(rawReport)
const rawJsonExistsBeforeCleanup = await fileExists(rawJson)
await Promise.all([rawJson, rawReport].map((path) => rm(repoPath(path), { force: true })))
const rawArtifactsCleanedUp = !(await Promise.all([rawJson, rawReport].map((path) => fileExists(path))))
  .some(Boolean)

const markSentIssues = Array.isArray(markSentSummary?.issues) ? markSentSummary.issues : []
const missingFieldNames = ['reviewerAlias', 'deliveryChannel', 'sentAt', 'contactRecordLocation']
  .filter((field) => markSentIssues.some((issue) => String(issue).includes(`missing ${field}`)))
const canonicalBetaUnchanged = JSON.stringify(canonicalBetaAfter) === canonicalBetaBeforeSerialized
const canonicalVisualUnchanged = JSON.stringify(canonicalVisualAfter) === canonicalVisualBeforeSerialized
const templateRows = Array.isArray(template?.rows) ? template.rows : []
const invalidProofTemplateRow = templateRows[0] || {}
const localProofTemplateRow = templateRows[1] || {}
const sensitiveProofTemplateRow = templateRows[2] || {}
const invalidProofRecordBody = {
  date,
  rows: [
    ...(invalidProofTemplateRow.id
      ? [
        {
          id: invalidProofTemplateRow.id,
          reviewerAlias: 'reviewer-alias-001',
          deliveryChannel: 'personal-inbox',
          sentAt: `${date}T12:00:00.000Z`,
          contactRecordLocation: 'todo',
          notes: 'Invalid proof fixture should be rejected before import.',
        },
      ]
      : []),
    ...(localProofTemplateRow.id
      ? [
        {
          id: localProofTemplateRow.id,
          reviewerAlias: 'reviewer-alias-002',
          deliveryChannel: 'external-outreach-log',
          sentAt: `${date}T12:05:00.000Z`,
          contactRecordLocation: 'qa/fake-local-contact-proof.json',
          notes: 'Local repo proof fixture should be rejected before import.',
        },
      ]
      : []),
    ...(sensitiveProofTemplateRow.id
      ? [
        {
          id: sensitiveProofTemplateRow.id,
          reviewerAlias: 'alex@example.com',
          deliveryChannel: 'external-outreach-log',
          sentAt: `${date}T12:10:00.000Z`,
          contactRecordLocation: `https://crm.example.com/records/${sensitiveProofTemplateRow.id}?email=alex@example.com`,
          notes: 'Called +1 555 121 2121; sensitive fixture should be rejected before import.',
        },
      ]
      : []),
  ],
}
await writeFile(repoPath(invalidProofRecord), `${JSON.stringify(invalidProofRecordBody, null, 2)}\n`)

const invalidProofResult = spawnSync(process.execPath, ['scripts/platform-dispatch-log-mark-sent.mjs'], {
  cwd: clientRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    QA_BETA_REVIEW_DISPATCH_LOG: betaDispatchLogPath,
    QA_VISUAL_REVIEW_DISPATCH_LOG: visualDispatchLogPath,
    QA_DISPATCH_MARK_SENT_IMPORT: '1',
    QA_DISPATCH_MARK_SENT_RECORD: invalidProofRecord,
    QA_DISPATCH_MARK_SENT_ARTIFACT_NAME: invalidProofArtifactName,
  },
})
const invalidProofSummary = await readJson(invalidProofRawJson).catch(() => null)
const invalidProofIssues = Array.isArray(invalidProofSummary?.issues) ? invalidProofSummary.issues : []
const privateContactIssues = invalidProofIssues.filter((issue) => String(issue).includes('appears to include contact details'))
const canonicalBetaAfterInvalidProof = await readJson(betaDispatchLogPath)
const canonicalVisualAfterInvalidProof = await readJson(visualDispatchLogPath)
const invalidProofArtifactsExistBeforeCleanup = await Promise.all([invalidProofRecord, invalidProofRawJson, invalidProofRawReport].map((path) => fileExists(path)))
await Promise.all([invalidProofRecord, invalidProofRawJson, invalidProofRawReport].map((path) => rm(repoPath(path), { force: true })))
const invalidProofArtifactsCleanedUp = !(await Promise.all([invalidProofRecord, invalidProofRawJson, invalidProofRawReport].map((path) => fileExists(path))))
  .some(Boolean)

const checks = [
  {
    name: 'blank sent-record template is still marked as not ready for import',
    ok: template?.status === 'pass' && template?.readyForImport === false && templateRows.length > 0,
    templateStatus: template?.status || null,
    readyForImport: template?.readyForImport ?? null,
    rowCount: templateRows.length,
  },
  {
    name: 'blank sent-record template report states the evidence boundary',
    ok: templateReport.includes('This file is not a sent proof'),
  },
  {
    name: 'blank sent-record template import attempt is rejected',
    ok: markSentResult.status !== 0 &&
      markSentSummary?.status === 'fail' &&
      markSentSummary?.importMode === true &&
      Number(markSentSummary?.requestedUpdateCount || 0) === templateRows.length,
    exitCode: markSentResult.status,
    status: markSentSummary?.status || null,
    importMode: markSentSummary?.importMode ?? null,
    requestedUpdateCount: markSentSummary?.requestedUpdateCount ?? null,
    templateRowCount: templateRows.length,
  },
  {
    name: 'blank sent-record template rejection names every required proof field',
    ok: missingFieldNames.length === 4,
    missingFieldNames,
  },
  {
    name: 'invalid sent-record proof values are rejected before import',
    ok: invalidProofResult.status !== 0 &&
      invalidProofSummary?.status === 'fail' &&
      invalidProofIssues.some((issue) => String(issue).includes('deliveryChannel must be one of')) &&
      invalidProofIssues.some((issue) => String(issue).includes('contactRecordLocation must point to a stable external proof record')) &&
      invalidProofIssues.some((issue) => String(issue).includes('qa/fake-local-contact-proof.json') || String(issue).includes(localProofTemplateRow.id || 'local-proof-template-row-missing')) &&
      privateContactIssues.length >= 3 &&
      privateContactIssues.some((issue) => String(issue).includes('reviewerAlias')) &&
      privateContactIssues.some((issue) => String(issue).includes('contactRecordLocation')) &&
      privateContactIssues.some((issue) => String(issue).includes('notes')) &&
      JSON.stringify(canonicalBetaAfterInvalidProof) === canonicalBetaBeforeSerialized &&
      JSON.stringify(canonicalVisualAfterInvalidProof) === canonicalVisualBeforeSerialized,
    exitCode: invalidProofResult.status,
    status: invalidProofSummary?.status || null,
    issues: invalidProofIssues,
    privateContactIssues,
  },
  {
    name: 'blank sent-record template rejection imports no rows',
    ok: Number(markSentSummary?.betaUpdateCount || 0) === 0 &&
      Number(markSentSummary?.visualUpdateCount || 0) === 0,
    betaUpdateCount: markSentSummary?.betaUpdateCount ?? null,
    visualUpdateCount: markSentSummary?.visualUpdateCount ?? null,
  },
  {
    name: 'blank sent-record template cannot mutate canonical dispatch logs',
    ok: canonicalBetaUnchanged &&
      canonicalVisualUnchanged &&
      sentCount(canonicalBetaAfter) === 0 &&
      sentCount(canonicalVisualAfter) === 0,
    canonicalBetaUnchanged,
    canonicalVisualUnchanged,
    canonicalBetaSentCount: sentCount(canonicalBetaAfter),
    canonicalVisualSentCount: sentCount(canonicalVisualAfter),
  },
  {
    name: 'blank sent-record template rejection cleans up temporary mark-sent artifacts',
    ok: rawJsonExistsBeforeCleanup &&
      rawReportExistsBeforeCleanup &&
      rawArtifactsCleanedUp &&
      invalidProofArtifactsExistBeforeCleanup.every(Boolean) &&
      invalidProofArtifactsCleanedUp,
    rawJsonExistsBeforeCleanup,
    rawReportExistsBeforeCleanup,
    rawArtifactsCleanedUp,
    invalidProofArtifactsExistBeforeCleanup,
    invalidProofArtifactsCleanedUp,
  },
]

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  templateArtifact: qaDisplayPath(templatePath),
  templateReport: qaDisplayPath(templateReportPath),
  betaDispatchLogArtifact: qaDisplayPath(betaDispatchLogPath),
  visualDispatchLogArtifact: qaDisplayPath(visualDispatchLogPath),
  markSentExitCode: markSentResult.status,
  markSentStatus: markSentSummary?.status || null,
  markSentImportMode: markSentSummary?.importMode ?? null,
  requestedUpdateCount: markSentSummary?.requestedUpdateCount ?? null,
  betaUpdateCount: markSentSummary?.betaUpdateCount ?? null,
  visualUpdateCount: markSentSummary?.visualUpdateCount ?? null,
  rejectionIssueCount: markSentIssues.length,
  invalidProofExitCode: invalidProofResult.status,
  invalidProofStatus: invalidProofSummary?.status || null,
  invalidProofIssueCount: invalidProofIssues.length,
  privateContactIssueCount: privateContactIssues.length,
  privateContactIssues,
  invalidProofArtifactsCleanedUp,
  missingFieldNames,
  canonicalBetaUnchanged,
  canonicalVisualUnchanged,
  canonicalBetaSentCount: sentCount(canonicalBetaAfter),
  canonicalVisualSentCount: sentCount(canonicalVisualAfter),
  rawArtifactsCleanedUp,
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
}

const report = `# Dispatch Sent-Record Template Rejection

Date: ${summary.date}
Status: ${summary.status}

## Result

- Template: \`${summary.templateArtifact}\`
- Mark-sent exit code: ${summary.markSentExitCode ?? 'missing'}
- Mark-sent status: ${summary.markSentStatus || 'missing'}
- Import mode attempted: ${summary.markSentImportMode ? 'yes' : 'no'}
- Requested updates: ${summary.requestedUpdateCount ?? 'missing'}
- Beta rows imported: ${summary.betaUpdateCount ?? 'missing'}
- Visual rows imported: ${summary.visualUpdateCount ?? 'missing'}
- Required proof fields rejected: ${summary.missingFieldNames.join(', ') || 'none'}
- Invalid proof values rejected: ${summary.invalidProofStatus === 'fail' ? 'yes' : 'no'}
- Canonical beta log unchanged: ${summary.canonicalBetaUnchanged ? 'yes' : 'no'}
- Canonical visual log unchanged: ${summary.canonicalVisualUnchanged ? 'yes' : 'no'}
- Raw artifacts cleaned up: ${summary.rawArtifactsCleanedUp ? 'yes' : 'no'}

## Operating Meaning

The blank sent-record template is rejected before import and cannot mutate canonical dispatch logs. Fill the sent-record template only after real outreach has happened outside the repo, then dry-run it before importing.

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Issues

${markdownList(failures.map((failure) => failure.name))}
`

await writeFile(repoPath(summary.jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(summary.reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
