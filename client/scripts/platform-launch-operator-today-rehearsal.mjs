import { spawnSync } from 'node:child_process'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate, isDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const artifactDate = process.env.QA_LAUNCH_TODAY_REHEARSAL_DATE || currentQaDate()
const blockerBoardPath = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD || 'qa/public-launch-blocker-board-2026-05-21.json'
const requestedOverdueDate = process.env.QA_LAUNCH_TODAY_OVERDUE_DATE || ''
const rawArtifactName = `launch-operator-today-overdue-rehearsal-raw-${artifactDate}`
const artifactName = process.env.QA_LAUNCH_TODAY_REHEARSAL_ARTIFACT_NAME ||
  `launch-operator-today-overdue-rehearsal-${artifactDate}`

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

function addDays(dateValue, days) {
  const parsed = Date.parse(`${dateValue}T00:00:00Z`)
  if (!Number.isFinite(parsed)) return ''
  return new Date(parsed + days * 86400000).toISOString().slice(0, 10)
}

function earliestDate(values) {
  return values.filter(isDate).sort()[0] || ''
}

function isOnlyOverdueExecutionFailure(summary) {
  const failures = Array.isArray(summary?.failures) ? summary.failures : []
  return summary?.status === 'fail' &&
    failures.length === 1 &&
    failures[0]?.name === 'launch today has no overdue launch execution rows'
}

const blockerBoard = await readJson(blockerBoardPath)
const betaSendByDate = earliestDate((blockerBoard.rows || [])
  .filter((row) => row.workType === 'beta-human-review')
  .map((row) => row.sendBy))
const visualDueAtDate = earliestDate((blockerBoard.rows || [])
  .filter((row) => row.workType === 'production-visual-review' && row.status === 'required for public launch history')
  .map((row) => row.dueAt))
const firstOverdueDate = addDays(earliestDate([betaSendByDate, visualDueAtDate]), 1)
const simulatedOverdueDate = firstOverdueDate === currentQaDate()
  ? addDays(firstOverdueDate, 1)
  : firstOverdueDate
const overdueToday = isDate(requestedOverdueDate)
  ? requestedOverdueDate
  : simulatedOverdueDate

const launchJson = `qa/${rawArtifactName}.json`
const launchReport = `qa/${rawArtifactName}.md`
const launchCsv = `qa/${rawArtifactName}.csv`
await Promise.all([launchJson, launchReport, launchCsv].map((path) => rm(repoPath(path), { force: true })))

const result = spawnSync(process.execPath, ['scripts/platform-launch-operator-today.mjs'], {
  cwd: clientRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    QA_LAUNCH_TODAY: overdueToday,
    QA_LAUNCH_TODAY_DATE: overdueToday,
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

const currentLaunchArtifact = `qa/launch-operator-today-${currentQaDate()}.json`
const currentLaunchSummary = await readJson(currentLaunchArtifact).catch(() => null)
const expectedFailureName = 'launch today has no overdue launch execution rows'
const currentLaunchBoardActionable = currentLaunchSummary?.status === 'pass' ||
  isOnlyOverdueExecutionFailure(currentLaunchSummary)
const checks = [
  {
    name: 'overdue rehearsal produced a launch-operator artifact',
    ok: Boolean(launchSummary),
  },
  {
    name: 'overdue rehearsal uses isolated simulated date',
    ok: launchSummary?.date === overdueToday && launchSummary?.today === overdueToday,
    date: launchSummary?.date || null,
    today: launchSummary?.today || null,
    overdueToday,
  },
  {
    name: 'overdue rehearsal exits non-zero',
    ok: result.status !== 0,
    exitCode: result.status,
  },
  {
    name: 'overdue rehearsal fails the daily board',
    ok: launchSummary?.status === 'fail' && Number(launchSummary?.failed) > 0,
    status: launchSummary?.status || null,
    failed: launchSummary?.failed ?? null,
  },
  {
    name: 'overdue rehearsal detects overdue launch execution rows',
    ok: Number(launchSummary?.betaDispatchOverdueCount || 0) + Number(launchSummary?.visualOverdueCount || 0) > 0,
    betaDispatchOverdueCount: launchSummary?.betaDispatchOverdueCount ?? null,
    visualOverdueCount: launchSummary?.visualOverdueCount ?? null,
  },
  {
    name: 'overdue rehearsal failure reason is explicit',
    ok: (launchSummary?.failures || []).some((failure) => failure.name === expectedFailureName),
    expectedFailureName,
  },
  {
    name: 'current launch operator artifact remains actionable',
    ok: currentLaunchBoardActionable,
    currentLaunchArtifact,
    currentStatus: currentLaunchSummary?.status || null,
    currentOnlyOverdueExecutionFailure: isOnlyOverdueExecutionFailure(currentLaunchSummary),
  },
]

await Promise.all([launchJson, launchReport, launchCsv].map((path) => rm(repoPath(path), { force: true })))

const failures = checks.filter((check) => !check.ok)
const summary = {
  date: artifactDate,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  overdueToday,
  blockerBoardArtifact: qaDisplayPath(blockerBoardPath),
  currentLaunchArtifact,
  rawLaunchArtifactsCleanedUp: !(await fileExists(launchJson)) && !(await fileExists(launchReport)) && !(await fileExists(launchCsv)),
  launchOperatorExitCode: result.status,
  launchOperatorStdoutIncludesFail: String(result.stdout || '').includes('"status": "fail"'),
  expectedFailureName,
  detectedOverdueRows: {
    betaDispatchOverdueCount: launchSummary?.betaDispatchOverdueCount ?? null,
    visualOverdueCount: launchSummary?.visualOverdueCount ?? null,
    betaDispatchOverdueIds: (launchSummary?.failures || [])
      .find((failure) => failure.name === expectedFailureName)?.betaDispatchOverdue || [],
    visualOverdueIds: (launchSummary?.failures || [])
      .find((failure) => failure.name === expectedFailureName)?.visualOverdue || [],
  },
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
}

const report = `# Launch Operator Overdue Rehearsal

Date: ${summary.date}
Simulated today: ${summary.overdueToday}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Launch operator exit code: ${summary.launchOperatorExitCode}
- Beta dispatch overdue rows detected: ${summary.detectedOverdueRows.betaDispatchOverdueCount ?? 0}
- Visual overdue rows detected: ${summary.detectedOverdueRows.visualOverdueCount ?? 0}
- Raw failure artifacts cleaned up: ${summary.rawLaunchArtifactsCleanedUp ? 'yes' : 'no'}

## Operating Meaning

This rehearsal proves \`npm run qa:launch-today\` fails when launch execution rows become overdue, names simulated-date artifacts away from the real current-day board, and leaves the current actionable board intact.

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
