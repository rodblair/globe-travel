import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate, qaTimeZone } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const repoRoot = resolve(clientRoot, '..')
const date = process.env.QA_LAUNCH_REFRESH_DATE || currentQaDate()

function repoPath(path) {
  return resolve(repoRoot, path)
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
}

function runNpmScript(scriptName) {
  const result = spawnSync('npm', ['run', scriptName], {
    cwd: clientRoot,
    env: process.env,
    stdio: 'inherit',
  })
  return {
    scriptName,
    exitCode: typeof result.status === 'number' ? result.status : 1,
    signal: result.signal,
    error: result.error ? String(result.error.message || result.error) : null,
  }
}

function isActionableLaunchToday(summary) {
  const failures = Array.isArray(summary.failures) ? summary.failures : []
  const onlyOverdueFailure = failures.length === 1 &&
    failures[0]?.name === 'launch today has no overdue launch execution rows'

  return Boolean(
    summary.status === 'fail' &&
    onlyOverdueFailure &&
    summary.deploymentRuntimeBlocked !== true &&
    (Array.isArray(summary.publicGuardrailIssues) ? summary.publicGuardrailIssues.length === 0 : true),
  )
}

function classifyLaunchToday(run, summary) {
  if (run.exitCode === 0 && summary?.status === 'pass') return 'pass'
  if (run.exitCode === 1 && isActionableLaunchToday(summary)) return 'actionable'
  return 'fail'
}

async function loadLaunchTodaySummary() {
  return readJson(`qa/launch-operator-today-${date}.json`)
}

async function loadPublicStatusSummary() {
  return readJson('qa/public-launch-status-2026-05-21.json')
}

const steps = []

function passOrFail(run) {
  return run.exitCode === 0 ? 'pass' : 'fail'
}

const firstLaunchRun = runNpmScript('qa:launch-today')
const firstLaunchSummary = await loadLaunchTodaySummary()
steps.push({
  step: 'launch-today-before-status',
  ...firstLaunchRun,
  classification: classifyLaunchToday(firstLaunchRun, firstLaunchSummary),
  status: firstLaunchSummary.status,
  failures: (firstLaunchSummary.failures || []).map((failure) => failure.name),
  actionRowCount: firstLaunchSummary.actionRows?.length || 0,
})

const firstTemplateRun = runNpmScript('qa:dispatch-sent-record-template')
steps.push({
  step: 'dispatch-sent-record-template-after-first-board',
  ...firstTemplateRun,
  classification: passOrFail(firstTemplateRun),
})

const firstTemplateRejectionRun = runNpmScript('qa:dispatch-sent-record-template-rejection')
steps.push({
  step: 'dispatch-sent-record-template-rejection-after-first-board',
  ...firstTemplateRejectionRun,
  classification: passOrFail(firstTemplateRejectionRun),
})

const firstStatusRun = runNpmScript('qa:public-launch-status')
const firstPublicStatus = await loadPublicStatusSummary()
steps.push({
  step: 'public-launch-status-after-first-board',
  ...firstStatusRun,
  classification: firstStatusRun.exitCode === 0 ? 'pass' : 'fail',
  status: firstPublicStatus.status,
  guardrailIssues: firstPublicStatus.guardrailIssues || [],
  blockerIds: (firstPublicStatus.blockers || []).map((blocker) => blocker.id),
})

const secondLaunchRun = runNpmScript('qa:launch-today')
const secondLaunchSummary = await loadLaunchTodaySummary()
steps.push({
  step: 'launch-today-after-status',
  ...secondLaunchRun,
  classification: classifyLaunchToday(secondLaunchRun, secondLaunchSummary),
  status: secondLaunchSummary.status,
  failures: (secondLaunchSummary.failures || []).map((failure) => failure.name),
  actionRowCount: secondLaunchSummary.actionRows?.length || 0,
})

const secondTemplateRun = runNpmScript('qa:dispatch-sent-record-template')
steps.push({
  step: 'dispatch-sent-record-template-after-final-board',
  ...secondTemplateRun,
  classification: passOrFail(secondTemplateRun),
})

const secondTemplateRejectionRun = runNpmScript('qa:dispatch-sent-record-template-rejection')
steps.push({
  step: 'dispatch-sent-record-template-rejection-after-final-board',
  ...secondTemplateRejectionRun,
  classification: passOrFail(secondTemplateRejectionRun),
})

const secondStatusRun = runNpmScript('qa:public-launch-status')
const secondPublicStatus = await loadPublicStatusSummary()
steps.push({
  step: 'public-launch-status-final',
  ...secondStatusRun,
  classification: secondStatusRun.exitCode === 0 ? 'pass' : 'fail',
  status: secondPublicStatus.status,
  guardrailIssues: secondPublicStatus.guardrailIssues || [],
  blockerIds: (secondPublicStatus.blockers || []).map((blocker) => blocker.id),
})

const hardFailures = steps.filter((step) => step.classification === 'fail')
const summary = {
  date,
  timeZone: qaTimeZone,
  generatedAt: new Date().toISOString(),
  status: hardFailures.length === 0 ? 'pass' : 'fail',
  checked: steps.length,
  passed: steps.filter((step) => step.classification === 'pass' || step.classification === 'actionable').length,
  failed: hardFailures.length,
  actionableStepCount: steps.filter((step) => step.classification === 'actionable').length,
  publicLaunchStatus: secondPublicStatus.status,
  publicGuardrailIssues: secondPublicStatus.guardrailIssues || [],
  blockers: secondPublicStatus.blockers || [],
  nextActions: secondPublicStatus.nextActions || [],
  steps,
  jsonArtifact: `qa/launch-refresh-${date}.json`,
  reportArtifact: `qa/launch-refresh-${date}.md`,
}

const report = `# Launch Refresh

Date: ${date}
Time zone: ${summary.timeZone}
Generated at: ${summary.generatedAt}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed or actionable: ${summary.passed}
- Failed: ${summary.failed}
- Actionable launch-board failures tolerated: ${summary.actionableStepCount}
- Public launch status: ${summary.publicLaunchStatus}
- Public guardrail issues: ${summary.publicGuardrailIssues.length}
- Public blockers: ${summary.blockers.map((blocker) => blocker.id).join(', ') || 'none'}

## Steps

${steps.map((step) => `- ${step.classification.toUpperCase()}: ${step.step} (${step.scriptName}, exit ${step.exitCode})`).join('\n')}

## Next Actions

${summary.nextActions.length ? summary.nextActions.map((action) => `- ${action}`).join('\n') : '- none'}
`

await mkdir(repoPath('qa'), { recursive: true })
await writeFile(repoPath(summary.jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(summary.reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (hardFailures.length > 0) {
  process.exitCode = 1
}
