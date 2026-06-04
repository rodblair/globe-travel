import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate, daysBetween, isDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const artifactDate = process.env.QA_LAUNCH_SENT_DISPATCH_REHEARSAL_DATE || currentQaDate()
const betaDispatchLogPath = process.env.QA_BETA_REVIEW_DISPATCH_LOG ||
  process.env.QA_BETA_REVIEW_OPERATOR_DISPATCH_LOG ||
  latestQaArtifact(/^beta-human-review-dispatch-log-all-wave-\d{4}-\d{2}-\d{2}\.json$/, 'qa/beta-human-review-dispatch-log-2026-05-21.json')
const visualDispatchLogPath = process.env.QA_VISUAL_REVIEW_DISPATCH_LOG ||
  latestQaArtifact(/^production-visual-review-dispatch-log-\d{4}-\d{2}-\d{2}\.json$/, 'qa/production-visual-review-dispatch-log-2026-05-21.json')
const rawArtifactName = `launch-operator-sent-dispatch-rehearsal-raw-${artifactDate}`
const betaRawLog = `qa/${rawArtifactName}-beta-dispatch-log.json`
const visualRawLog = `qa/${rawArtifactName}-visual-dispatch-log.json`
const artifactName = process.env.QA_LAUNCH_SENT_DISPATCH_REHEARSAL_ARTIFACT_NAME ||
  `launch-operator-sent-dispatch-rehearsal-${artifactDate}`

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

function isOnlyOverdueExecutionFailure(summary) {
  const failures = Array.isArray(summary?.failures) ? summary.failures : []
  return summary?.status === 'fail' &&
    failures.length === 1 &&
    failures[0]?.name === 'launch today has no overdue launch execution rows'
}

function markSent(row, sentAt) {
  return {
    ...row,
    sendStatus: 'sent',
    reviewerAlias: row.reviewerAlias || `rehearsal-${row.id}`,
    deliveryChannel: row.deliveryChannel || 'private-outreach-log',
    sentAt,
    contactRecordLocation: row.contactRecordLocation || 'external-record:launch-rehearsal',
    notes: 'Rehearsal-only sent state. No real contact details are stored in this repo.',
  }
}

function refreshBetaLog(summary) {
  const rows = Array.isArray(summary.dispatchRows) ? summary.dispatchRows : []
  const sentRows = rows.filter((row) => row.sendStatus === 'sent')
  const preparedRows = rows.filter((row) => row.sendStatus !== 'sent')
  const preparedDueTodayRows = preparedRows.filter((row) => daysBetween(summary.today, row.expectedSendBy) === 0)
  const preparedOverdueRows = preparedRows.filter((row) => {
    const delta = daysBetween(summary.today, row.expectedSendBy)
    return Number.isFinite(delta) && delta < 0
  })

  return {
    ...summary,
    sentCount: sentRows.length,
    preparedNotSentCount: preparedRows.length,
    preparedDueTodayCount: preparedDueTodayRows.length,
    preparedOverdueCount: preparedOverdueRows.length,
  }
}

function refreshVisualLog(summary) {
  const rows = Array.isArray(summary.dispatchRows) ? summary.dispatchRows : []
  const sentRows = rows.filter((row) => row.sendStatus === 'sent')
  const preparedRows = rows.filter((row) => row.sendStatus !== 'sent')
  const requiredPreparedRows = preparedRows.filter((row) => row.requiredForPublicLaunch)
  const preparedDueSoonRows = preparedRows.filter((row) => {
    const delta = daysBetween(summary.today, row.dueAt)
    return Number.isFinite(delta) && delta >= 0 && delta <= 7
  })
  const preparedOverdueRows = preparedRows.filter((row) => {
    const delta = daysBetween(summary.today, row.dueAt)
    return Number.isFinite(delta) && delta < 0
  })

  return {
    ...summary,
    sentCount: sentRows.length,
    preparedNotSentCount: preparedRows.length,
    requiredPreparedNotSentCount: requiredPreparedRows.length,
    preparedDueSoonCount: preparedDueSoonRows.length,
    preparedOverdueCount: preparedOverdueRows.length,
  }
}

const betaDispatchLog = await readJson(betaDispatchLogPath)
const visualDispatchLog = await readJson(visualDispatchLogPath)
const visualRegister = await readJson('qa/production-visual-review-register.json').catch(() => null)
const expectedVisualHistoryCount = Array.isArray(visualRegister?.reviewHistory)
  ? visualRegister.reviewHistory.length
  : 0
const betaRows = Array.isArray(betaDispatchLog.dispatchRows) ? betaDispatchLog.dispatchRows : []
const visualRows = Array.isArray(visualDispatchLog.dispatchRows) ? visualDispatchLog.dispatchRows : []
const betaSelected = betaRows.find((row) => row.sendStatus !== 'sent' && daysBetween(betaDispatchLog.today, row.expectedSendBy) === 0) ||
  betaRows.find((row) => row.sendStatus !== 'sent')
const visualSelected = visualRows.find((row) => row.sendStatus !== 'sent' && row.requiredForPublicLaunch && daysBetween(visualDispatchLog.today, row.dueAt) >= 0 && daysBetween(visualDispatchLog.today, row.dueAt) <= 7) ||
  visualRows.find((row) => row.sendStatus !== 'sent' && row.requiredForPublicLaunch)
const sentAt = `${isDate(artifactDate) ? artifactDate : currentQaDate()}T12:00:00.000Z`

const betaRehearsalLog = refreshBetaLog({
  ...betaDispatchLog,
  artifact: betaRawLog,
  dispatchRows: betaRows.map((row) => row.id === betaSelected?.id ? markSent(row, sentAt) : row),
})
const visualRehearsalLog = refreshVisualLog({
  ...visualDispatchLog,
  artifact: visualRawLog,
  dispatchRows: visualRows.map((row) => row.id === visualSelected?.id ? markSent(row, sentAt) : row),
})

const launchJson = `qa/${rawArtifactName}.json`
const launchReport = `qa/${rawArtifactName}.md`
const launchCsv = `qa/${rawArtifactName}.csv`
await Promise.all([launchJson, launchReport, launchCsv, betaRawLog, visualRawLog].map((path) => rm(repoPath(path), { force: true })))
await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(repoPath(betaRawLog), `${JSON.stringify(betaRehearsalLog, null, 2)}\n`)
await writeFile(repoPath(visualRawLog), `${JSON.stringify(visualRehearsalLog, null, 2)}\n`)

const result = spawnSync(process.execPath, ['scripts/platform-launch-operator-today.mjs'], {
  cwd: clientRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    QA_BETA_REVIEW_DISPATCH_LOG: betaRawLog,
    QA_VISUAL_REVIEW_DISPATCH_LOG: visualRawLog,
    QA_LAUNCH_TODAY_JSON: `${rawArtifactName}.json`,
    QA_LAUNCH_TODAY_REPORT: `${rawArtifactName}.md`,
    QA_LAUNCH_TODAY_CSV: `${rawArtifactName}.csv`,
  },
})

let launchSummary = null
try {
  launchSummary = await readJson(launchJson)
} catch {
  launchSummary = null
}

const actionRows = Array.isArray(launchSummary?.actionRows) ? launchSummary.actionRows : []
const launchOperatorDeploymentRuntimeBlocked =
  launchSummary?.publicLaunchStatus === 'blocked' &&
  actionRows.some((row) => row.id === 'production-runtime-deployment-currency')
const launchOperatorOnlySelfGuardrails =
  launchSummary?.publicLaunchStatus === 'blocked' &&
  launchSummary?.publicOnlyLaunchOperatorSelfGuardrails === true
const launchOperatorEvidenceDidNotAdvance =
  !launchOperatorDeploymentRuntimeBlocked &&
  Number(launchSummary?.betaReviews?.completed || 0) === 0 &&
  Number(launchSummary?.productionVisualReviews?.distinctHistoryDateCount || 0) === expectedVisualHistoryCount
const currentLaunchArtifact = `qa/launch-operator-today-${currentQaDate()}.json`
const currentLaunchSummary = await readJson(currentLaunchArtifact).catch(() => null)
const launchOperatorBoardActionable = result.status === 0 ||
  isOnlyOverdueExecutionFailure(launchSummary)
const currentLaunchBoardActionable = currentLaunchSummary?.status === 'pass' ||
  isOnlyOverdueExecutionFailure(currentLaunchSummary)
const checks = [
  {
    name: 'sent-dispatch rehearsal selects beta and visual rows',
    ok: Boolean(betaSelected?.id) && Boolean(visualSelected?.id),
    betaSelectedId: betaSelected?.id || null,
    visualSelectedId: visualSelected?.id || null,
  },
  {
    name: 'sent-dispatch rehearsal produced an actionable launch board',
    ok: launchOperatorBoardActionable,
    exitCode: result.status,
    status: launchSummary?.status || null,
    onlyOverdueExecutionFailure: isOnlyOverdueExecutionFailure(launchSummary),
  },
  {
    name: 'sent beta dispatch row is removed from send actions',
    ok: Boolean(betaSelected?.id) && !actionRows.some((row) => row.id === betaSelected.id),
    betaSelectedId: betaSelected?.id || null,
    actionIds: actionRows.map((row) => row.id),
  },
  {
    name: 'sent visual dispatch row is removed from send actions',
    ok: Boolean(visualSelected?.id) && !actionRows.some((row) => row.id === visualSelected.id),
    visualSelectedId: visualSelected?.id || null,
    actionIds: actionRows.map((row) => row.id),
  },
  {
    name: 'sent-dispatch rehearsal does not advance launch evidence',
    ok: launchOperatorEvidenceDidNotAdvance,
    publicLaunchStatus: launchSummary?.publicLaunchStatus || null,
    deploymentRuntimeBlocked: launchOperatorDeploymentRuntimeBlocked,
    onlySelfGuardrails: launchOperatorOnlySelfGuardrails,
    betaCompleted: launchSummary?.betaReviews?.completed ?? null,
    visualHistoryCount: launchSummary?.productionVisualReviews?.distinctHistoryDateCount ?? null,
  },
  {
    name: 'current launch operator artifact remains actionable',
    ok: currentLaunchBoardActionable,
    currentLaunchArtifact,
    currentStatus: currentLaunchSummary?.status || null,
    currentOnlyOverdueExecutionFailure: isOnlyOverdueExecutionFailure(currentLaunchSummary),
  },
]

await Promise.all([launchJson, launchReport, launchCsv, betaRawLog, visualRawLog].map((path) => rm(repoPath(path), { force: true })))

const rawArtifactsCleanedUp = !(await fileExists(launchJson)) &&
  !(await fileExists(launchReport)) &&
  !(await fileExists(launchCsv)) &&
  !(await fileExists(betaRawLog)) &&
  !(await fileExists(visualRawLog))

checks.push({
  name: 'sent-dispatch rehearsal cleans up temporary logs and board',
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
  betaDispatchLogArtifact: qaDisplayPath(betaDispatchLogPath),
  visualDispatchLogArtifact: qaDisplayPath(visualDispatchLogPath),
  selectedRows: {
    beta: betaSelected?.id || null,
    visual: visualSelected?.id || null,
  },
  sentAt,
  launchOperatorExitCode: result.status,
  launchOperatorStatus: launchSummary?.status || null,
  launchOperatorOnlyOverdueExecutionFailure: isOnlyOverdueExecutionFailure(launchSummary),
  launchOperatorPublicLaunchStatus: launchSummary?.publicLaunchStatus || null,
  launchOperatorDeploymentRuntimeBlocked,
  launchOperatorOnlySelfGuardrails,
  launchOperatorActionRowCount: actionRows.length,
  launchOperatorActionIds: actionRows.map((row) => row.id),
  currentLaunchArtifact,
  rawArtifactsCleanedUp,
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
}

const report = `# Launch Operator Sent Dispatch Rehearsal

Date: ${summary.date}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Beta row rehearsed as sent: ${summary.selectedRows.beta || 'none'}
- Visual row rehearsed as sent: ${summary.selectedRows.visual || 'none'}
- Launch operator status: ${summary.launchOperatorStatus || 'missing'}
- Launch public status after rehearsal: ${summary.launchOperatorPublicLaunchStatus || 'missing'}
- Raw artifacts cleaned up: ${summary.rawArtifactsCleanedUp ? 'yes' : 'no'}

## Operating Meaning

This rehearsal proves \`npm run qa:launch-today\` consumes dispatch-log sent state: sent rows drop out of the send-action list, but public launch still stays blocked until completed non-template review evidence is validated and imported.

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
