import { spawnSync } from 'node:child_process'
import { access, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const artifactDate = process.env.QA_DISPATCH_MARK_SENT_IMPORT_REHEARSAL_DATE || currentQaDate()
const betaDispatchLogPath = process.env.QA_BETA_REVIEW_DISPATCH_LOG || 'qa/beta-human-review-dispatch-log-2026-05-21.json'
const visualDispatchLogPath = process.env.QA_VISUAL_REVIEW_DISPATCH_LOG || 'qa/production-visual-review-dispatch-log-2026-05-21.json'
const fixturePath = process.env.QA_DISPATCH_MARK_SENT_IMPORT_REHEARSAL_RECORD ||
  'qa/dispatch-log-mark-sent-fixture-2026-05-22.json'
const rawArtifactName = `dispatch-log-mark-sent-import-rehearsal-raw-${artifactDate}`
const betaRawLog = `qa/${rawArtifactName}-beta-dispatch-log.json`
const visualRawLog = `qa/${rawArtifactName}-visual-dispatch-log.json`
const markSentRawJson = `qa/${rawArtifactName}.json`
const markSentRawReport = `qa/${rawArtifactName}.md`
const csvFixturePath = `qa/${rawArtifactName}-fixture.csv`
const betaCsvRawLog = `qa/${rawArtifactName}-csv-beta-dispatch-log.json`
const visualCsvRawLog = `qa/${rawArtifactName}-csv-visual-dispatch-log.json`
const markSentCsvRawJson = `qa/${rawArtifactName}-csv.json`
const markSentCsvRawReport = `qa/${rawArtifactName}-csv.md`
const launchRawName = `dispatch-log-mark-sent-import-rehearsal-launch-raw-${artifactDate}`
const launchRawJson = `qa/${launchRawName}.json`
const launchRawReport = `qa/${launchRawName}.md`
const launchRawCsv = `qa/${launchRawName}.csv`
const artifactName = process.env.QA_DISPATCH_MARK_SENT_IMPORT_REHEARSAL_ARTIFACT_NAME ||
  `dispatch-log-mark-sent-import-rehearsal-${artifactDate}`

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function repoPath(path) {
  return resolve(root, qaDisplayPath(path))
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
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

function rowById(summary, id) {
  const rows = Array.isArray(summary?.dispatchRows) ? summary.dispatchRows : []
  return rows.find((row) => row.id === id) || null
}

function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function rowsToCsv(rows) {
  const headers = [
    'id',
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

await mkdir(resolve(root, 'qa'), { recursive: true })
const rawArtifacts = [
  betaRawLog,
  visualRawLog,
  markSentRawJson,
  markSentRawReport,
  csvFixturePath,
  betaCsvRawLog,
  visualCsvRawLog,
  markSentCsvRawJson,
  markSentCsvRawReport,
  launchRawJson,
  launchRawReport,
  launchRawCsv,
]
await Promise.all(rawArtifacts.map((path) => rm(repoPath(path), { force: true })))
await copyFile(repoPath(betaDispatchLogPath), repoPath(betaRawLog))
await copyFile(repoPath(visualDispatchLogPath), repoPath(visualRawLog))
await copyFile(repoPath(betaDispatchLogPath), repoPath(betaCsvRawLog))
await copyFile(repoPath(visualDispatchLogPath), repoPath(visualCsvRawLog))

const fixture = await readJson(fixturePath)
const fixtureRows = Array.isArray(fixture?.rows) ? fixture.rows : []
await writeFile(repoPath(csvFixturePath), `${rowsToCsv(fixtureRows)}\n`)

const markSentResult = spawnSync(process.execPath, ['scripts/platform-dispatch-log-mark-sent.mjs'], {
  cwd: clientRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    QA_DISPATCH_MARK_SENT_IMPORT: '1',
    QA_DISPATCH_MARK_SENT_RECORD: fixturePath,
    QA_BETA_REVIEW_DISPATCH_LOG: betaRawLog,
    QA_VISUAL_REVIEW_DISPATCH_LOG: visualRawLog,
    QA_DISPATCH_MARK_SENT_ARTIFACT_NAME: rawArtifactName,
  },
})

const markSentSummary = await readJson(markSentRawJson).catch(() => null)
const tempBetaDispatchLog = await readJson(betaRawLog).catch(() => null)
const tempVisualDispatchLog = await readJson(visualRawLog).catch(() => null)
const betaImportedRow = rowById(tempBetaDispatchLog, 'BETA-HR-001')
const visualImportedRow = rowById(tempVisualDispatchLog, 'PROD-VISUAL-HISTORY-002')

const markSentCsvResult = spawnSync(process.execPath, ['scripts/platform-dispatch-log-mark-sent.mjs'], {
  cwd: clientRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    QA_DISPATCH_MARK_SENT_IMPORT: '1',
    QA_DISPATCH_MARK_SENT_RECORD: csvFixturePath,
    QA_BETA_REVIEW_DISPATCH_LOG: betaCsvRawLog,
    QA_VISUAL_REVIEW_DISPATCH_LOG: visualCsvRawLog,
    QA_DISPATCH_MARK_SENT_ARTIFACT_NAME: `${rawArtifactName}-csv`,
  },
})

const markSentCsvSummary = await readJson(markSentCsvRawJson).catch(() => null)
const tempBetaCsvDispatchLog = await readJson(betaCsvRawLog).catch(() => null)
const tempVisualCsvDispatchLog = await readJson(visualCsvRawLog).catch(() => null)
const betaCsvImportedRow = rowById(tempBetaCsvDispatchLog, 'BETA-HR-001')
const visualCsvImportedRow = rowById(tempVisualCsvDispatchLog, 'PROD-VISUAL-HISTORY-002')

const launchResult = spawnSync(process.execPath, ['scripts/platform-launch-operator-today.mjs'], {
  cwd: clientRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    QA_BETA_REVIEW_DISPATCH_LOG: betaRawLog,
    QA_VISUAL_REVIEW_DISPATCH_LOG: visualRawLog,
    QA_LAUNCH_TODAY_JSON: `${launchRawName}.json`,
    QA_LAUNCH_TODAY_REPORT: `${launchRawName}.md`,
    QA_LAUNCH_TODAY_CSV: `${launchRawName}.csv`,
  },
})

const launchSummary = await readJson(launchRawJson).catch(() => null)
const canonicalBetaDispatchLog = await readJson(betaDispatchLogPath)
const canonicalVisualDispatchLog = await readJson(visualDispatchLogPath)
const currentLaunchArtifact = `qa/launch-operator-today-${currentQaDate()}.json`
const currentLaunchSummary = await readJson(currentLaunchArtifact).catch(() => null)
const launchActionRows = Array.isArray(launchSummary?.actionRows) ? launchSummary.actionRows : []
const launchActionIds = launchActionRows.map((row) => row.id)
const importedRows = {
  beta: betaImportedRow?.id || null,
  visual: visualImportedRow?.id || null,
}
const csvImportedRows = {
  beta: betaCsvImportedRow?.id || null,
  visual: visualCsvImportedRow?.id || null,
}
const checks = [
  {
    name: 'mark-sent import rehearsal runs import mode against isolated logs',
    ok: markSentResult.status === 0 && markSentSummary?.status === 'pass' && markSentSummary?.importMode === true,
    exitCode: markSentResult.status,
    status: markSentSummary?.status || null,
    importMode: markSentSummary?.importMode ?? null,
  },
  {
    name: 'mark-sent import rehearsal accepts CSV sent-record fixtures',
    ok: markSentCsvResult.status === 0 &&
      markSentCsvSummary?.status === 'pass' &&
      markSentCsvSummary?.recordFormat === 'csv' &&
      betaCsvImportedRow?.sendStatus === 'sent' &&
      visualCsvImportedRow?.sendStatus === 'sent',
    exitCode: markSentCsvResult.status,
    status: markSentCsvSummary?.status || null,
    recordFormat: markSentCsvSummary?.recordFormat || null,
    importedRows: csvImportedRows,
  },
  {
    name: 'mark-sent import rehearsal imports beta fixture row',
    ok: betaImportedRow?.sendStatus === 'sent' &&
      betaImportedRow?.reviewerAlias === 'beta-reviewer-001' &&
      Number(tempBetaDispatchLog?.sentCount || 0) > 0,
    rowId: betaImportedRow?.id || null,
    sendStatus: betaImportedRow?.sendStatus || null,
    reviewerAlias: betaImportedRow?.reviewerAlias || null,
    tempBetaSentCount: tempBetaDispatchLog?.sentCount ?? null,
  },
  {
    name: 'mark-sent import rehearsal imports visual fixture row',
    ok: visualImportedRow?.sendStatus === 'sent' &&
      visualImportedRow?.reviewerAlias === 'visual-reviewer-002' &&
      Number(tempVisualDispatchLog?.sentCount || 0) > 0,
    rowId: visualImportedRow?.id || null,
    sendStatus: visualImportedRow?.sendStatus || null,
    reviewerAlias: visualImportedRow?.reviewerAlias || null,
    tempVisualSentCount: tempVisualDispatchLog?.sentCount ?? null,
  },
  {
    name: 'launch operator consumes imported sent state',
    ok: launchResult.status === 0 &&
      launchSummary?.status === 'pass' &&
      ['beta-ready-public-blocked', 'blocked'].includes(launchSummary?.publicLaunchStatus) &&
      !launchActionIds.includes(importedRows.beta) &&
      !launchActionIds.includes(importedRows.visual),
    exitCode: launchResult.status,
    status: launchSummary?.status || null,
    publicLaunchStatus: launchSummary?.publicLaunchStatus || null,
    actionIds: launchActionIds,
  },
  {
    name: 'import rehearsal does not advance external launch evidence',
    ok: Number(launchSummary?.betaReviews?.completed || 0) === 0 &&
      Number(launchSummary?.productionVisualReviews?.distinctHistoryDateCount || 0) === 2,
    betaCompleted: launchSummary?.betaReviews?.completed ?? null,
    visualHistoryCount: launchSummary?.productionVisualReviews?.distinctHistoryDateCount ?? null,
  },
  {
    name: 'canonical dispatch logs remain unmutated',
    ok: Number(canonicalBetaDispatchLog?.sentCount || 0) === 0 &&
      Number(canonicalVisualDispatchLog?.sentCount || 0) === 0 &&
      rowById(canonicalBetaDispatchLog, 'BETA-HR-001')?.sendStatus !== 'sent' &&
      rowById(canonicalVisualDispatchLog, 'PROD-VISUAL-HISTORY-002')?.sendStatus !== 'sent',
    canonicalBetaSentCount: canonicalBetaDispatchLog?.sentCount ?? null,
    canonicalVisualSentCount: canonicalVisualDispatchLog?.sentCount ?? null,
  },
  {
    name: 'current launch operator artifact remains passing',
    ok: currentLaunchSummary?.status === 'pass',
    currentLaunchArtifact,
    currentStatus: currentLaunchSummary?.status || null,
  },
]

await Promise.all(rawArtifacts.map((path) => rm(repoPath(path), { force: true })))
const rawArtifactsCleanedUp = !(await Promise.all(rawArtifacts.map((path) => fileExists(path))))
  .some(Boolean)

checks.push({
  name: 'mark-sent import rehearsal cleans up temporary logs and boards',
  ok: rawArtifactsCleanedUp,
  rawArtifactsCleanedUp,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date: artifactDate,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  fixtureArtifact: qaDisplayPath(fixturePath),
  csvFixtureArtifact: qaDisplayPath(csvFixturePath),
  betaDispatchLogArtifact: qaDisplayPath(betaDispatchLogPath),
  visualDispatchLogArtifact: qaDisplayPath(visualDispatchLogPath),
  markSentExitCode: markSentResult.status,
  markSentStatus: markSentSummary?.status || null,
  markSentImportMode: markSentSummary?.importMode ?? null,
  markSentRecordFormat: markSentSummary?.recordFormat || null,
  markSentCsvExitCode: markSentCsvResult.status,
  markSentCsvStatus: markSentCsvSummary?.status || null,
  markSentCsvImportMode: markSentCsvSummary?.importMode ?? null,
  markSentCsvRecordFormat: markSentCsvSummary?.recordFormat || null,
  importedRows,
  csvImportedRows,
  tempBetaSentCount: tempBetaDispatchLog?.sentCount ?? null,
  tempVisualSentCount: tempVisualDispatchLog?.sentCount ?? null,
  tempBetaCsvSentCount: tempBetaCsvDispatchLog?.sentCount ?? null,
  tempVisualCsvSentCount: tempVisualCsvDispatchLog?.sentCount ?? null,
  launchOperatorExitCode: launchResult.status,
  launchOperatorStatus: launchSummary?.status || null,
  launchOperatorPublicLaunchStatus: launchSummary?.publicLaunchStatus || null,
  launchOperatorActionRowCount: launchActionRows.length,
  launchOperatorActionIds: launchActionIds,
  launchOperatorBetaCompleted: launchSummary?.betaReviews?.completed ?? null,
  launchOperatorVisualHistoryCount: launchSummary?.productionVisualReviews?.distinctHistoryDateCount ?? null,
  canonicalBetaSentCount: canonicalBetaDispatchLog?.sentCount ?? null,
  canonicalVisualSentCount: canonicalVisualDispatchLog?.sentCount ?? null,
  currentLaunchArtifact,
  rawArtifactsCleanedUp,
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
}

const report = `# Dispatch Mark-Sent Import Rehearsal

Date: ${summary.date}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Fixture: \`${summary.fixtureArtifact}\`
- CSV fixture: \`${summary.csvFixtureArtifact}\`
- Beta row imported on isolated log: ${summary.importedRows.beta || 'none'}
- Visual row imported on isolated log: ${summary.importedRows.visual || 'none'}
- CSV beta row imported on isolated log: ${summary.csvImportedRows.beta || 'none'}
- CSV visual row imported on isolated log: ${summary.csvImportedRows.visual || 'none'}
- Launch operator status after isolated import: ${summary.launchOperatorStatus || 'missing'}
- Launch public status after isolated import: ${summary.launchOperatorPublicLaunchStatus || 'missing'}
- Canonical beta sent count: ${summary.canonicalBetaSentCount ?? 'missing'}
- Canonical visual sent count: ${summary.canonicalVisualSentCount ?? 'missing'}
- Raw artifacts cleaned up: ${summary.rawArtifactsCleanedUp ? 'yes' : 'no'}

## Operating Meaning

This rehearsal proves import mode can update isolated dispatch logs without mutating canonical launch evidence. It covers JSON and CSV sent records, and it also proves the launch operator consumes the imported sent state while keeping public launch blocked until real beta and visual review evidence is completed.

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}
`

await writeFile(repoPath(summary.jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(summary.reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
