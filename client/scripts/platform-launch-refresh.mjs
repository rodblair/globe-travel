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

function runNpmScript(scriptName, envPatch = {}) {
  const result = spawnSync('npm', ['run', scriptName], {
    cwd: clientRoot,
    env: {
      ...process.env,
      ...envPatch,
    },
    stdio: 'inherit',
  })
  return {
    scriptName,
    exitCode: typeof result.status === 'number' ? result.status : 1,
    signal: result.signal,
    error: result.error ? String(result.error.message || result.error) : null,
  }
}

async function writeDispatchMarkSentFixture() {
  const fixturePath = `qa/dispatch-log-mark-sent-fixture-${date}.json`
  const fixture = {
    date,
    rows: [
      {
        id: 'BETA-HR-001',
        reviewerAlias: 'beta-reviewer-001',
        deliveryChannel: 'external-outreach-log',
        sentAt: `${date}T12:00:00.000Z`,
        contactRecordLocation: 'external-record:beta-reviewer-001',
        notes: 'Dry-run fixture only. Real reviewer contact details stay outside the repo.',
      },
      {
        id: 'BETA-HR-006',
        reviewerAlias: 'beta-reviewer-006',
        deliveryChannel: 'external-outreach-log',
        sentAt: `${date}T12:03:00.000Z`,
        contactRecordLocation: 'external-record:beta-reviewer-006',
        notes: 'Dry-run fixture only. Real reviewer contact details stay outside the repo.',
      },
      {
        id: 'PROD-VISUAL-HISTORY-002',
        reviewerAlias: 'visual-reviewer-002',
        deliveryChannel: 'external-outreach-log',
        sentAt: `${date}T12:05:00.000Z`,
        contactRecordLocation: 'external-record:visual-reviewer-002',
        notes: 'Dry-run fixture only. Real reviewer contact details stay outside the repo.',
      },
    ],
  }
  await writeFile(repoPath(fixturePath), `${JSON.stringify(fixture, null, 2)}\n`)
  return fixturePath
}

function isActionableLaunchToday(summary) {
  const failures = Array.isArray(summary.failures) ? summary.failures : []
  const publicGuardrailIssues = Array.isArray(summary.publicGuardrailIssues)
    ? summary.publicGuardrailIssues
    : []
  const onlyOverdueFailure = failures.length === 1 &&
    failures[0]?.name === 'launch today has no overdue launch execution rows'

  return Boolean(
    summary.status === 'fail' &&
    onlyOverdueFailure &&
    summary.deploymentRuntimeBlocked !== true &&
    publicGuardrailIssues.every((issue) => issue === 'beta human review command center is not fully prepared'),
  )
}

function classifyLaunchToday(run, summary) {
  if (run.exitCode === 0 && summary?.status === 'pass') return 'pass'
  if (run.exitCode === 1 && isActionableLaunchToday(summary)) return 'actionable'
  return 'fail'
}

function isActionablePublicStatus(summary) {
  const guardrailIssues = Array.isArray(summary?.guardrailIssues) ? summary.guardrailIssues : []
  const blockerIds = (Array.isArray(summary?.blockers) ? summary.blockers : [])
    .map((blocker) => blocker.id)
    .filter(Boolean)

  return Boolean(
    summary?.status === 'blocked' &&
    summary?.publicLaunchReady === false &&
    guardrailIssues.length > 0 &&
    guardrailIssues.every((issue) => issue === 'beta human review command center is not fully prepared') &&
    blockerIds.includes('beta-human-review-threshold') &&
    blockerIds.includes('production-visual-review-history'),
  )
}

function classifyPublicStatus(run, summary) {
  if (run.exitCode === 0 && ['pass', 'beta-ready-public-blocked'].includes(summary?.status)) return 'pass'
  if (run.exitCode === 1 && isActionablePublicStatus(summary)) return 'actionable'
  return 'fail'
}

async function loadLaunchTodaySummary() {
  return readJson(`qa/launch-operator-today-${date}.json`)
}

async function loadPublicStatusSummary() {
  return readJson('qa/public-launch-status-2026-05-21.json')
}

async function loadOutreachBriefSummary() {
  return readJson(`qa/launch-outreach-brief-${date}.json`)
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

const firstDispatchPacketRun = runNpmScript('qa:launch-dispatch-packet')
steps.push({
  step: 'launch-dispatch-packet-after-first-template',
  ...firstDispatchPacketRun,
  classification: passOrFail(firstDispatchPacketRun),
})

const firstTemplateRejectionRun = runNpmScript('qa:dispatch-sent-record-template-rejection')
steps.push({
  step: 'dispatch-sent-record-template-rejection-after-first-board',
  ...firstTemplateRejectionRun,
  classification: passOrFail(firstTemplateRejectionRun),
})

const dispatchMarkSentFixturePath = await writeDispatchMarkSentFixture()
steps.push({
  step: 'dispatch-mark-sent-fixture-current-date',
  scriptName: 'write-dispatch-mark-sent-fixture',
  exitCode: 0,
  signal: null,
  error: null,
  classification: 'pass',
  artifact: dispatchMarkSentFixturePath,
})

const firstDispatchMarkSentRun = runNpmScript('qa:dispatch-mark-sent', {
  QA_DISPATCH_MARK_SENT_RECORD: dispatchMarkSentFixturePath,
})
steps.push({
  step: 'dispatch-mark-sent-dry-run-after-first-board',
  ...firstDispatchMarkSentRun,
  classification: passOrFail(firstDispatchMarkSentRun),
})

const firstDispatchMarkSentImportRehearsalRun = runNpmScript('qa:dispatch-mark-sent-import-rehearsal')
steps.push({
  step: 'dispatch-mark-sent-import-rehearsal-after-first-board',
  ...firstDispatchMarkSentImportRehearsalRun,
  classification: passOrFail(firstDispatchMarkSentImportRehearsalRun),
})

const firstLaunchTodayOverdueRehearsalRun = runNpmScript('qa:launch-today-overdue-rehearsal')
steps.push({
  step: 'launch-today-overdue-rehearsal-after-first-board',
  ...firstLaunchTodayOverdueRehearsalRun,
  classification: passOrFail(firstLaunchTodayOverdueRehearsalRun),
})

const firstLaunchTodaySentDispatchRehearsalRun = runNpmScript('qa:launch-today-sent-dispatch-rehearsal')
steps.push({
  step: 'launch-today-sent-dispatch-rehearsal-after-first-board',
  ...firstLaunchTodaySentDispatchRehearsalRun,
  classification: passOrFail(firstLaunchTodaySentDispatchRehearsalRun),
})

const firstReviewIntakeRehearsalRun = runNpmScript('qa:review-intake-rehearsal')
steps.push({
  step: 'review-intake-rehearsal-after-first-board',
  ...firstReviewIntakeRehearsalRun,
  classification: passOrFail(firstReviewIntakeRehearsalRun),
})

const firstReviewIntakeImportRehearsalRun = runNpmScript('qa:review-intake-import-rehearsal')
steps.push({
  step: 'review-intake-import-rehearsal-after-first-board',
  ...firstReviewIntakeImportRehearsalRun,
  classification: passOrFail(firstReviewIntakeImportRehearsalRun),
})

const firstPublicLaunchModeRehearsalRun = runNpmScript('qa:public-launch-mode-rehearsal')
steps.push({
  step: 'public-launch-mode-rehearsal-after-first-board',
  ...firstPublicLaunchModeRehearsalRun,
  classification: passOrFail(firstPublicLaunchModeRehearsalRun),
})

const firstPublicLaunchThresholdRehearsalRun = runNpmScript('qa:public-launch-threshold-rehearsal')
steps.push({
  step: 'public-launch-threshold-rehearsal-after-first-board',
  ...firstPublicLaunchThresholdRehearsalRun,
  classification: passOrFail(firstPublicLaunchThresholdRehearsalRun),
})

const firstStatusRun = runNpmScript('qa:public-launch-status')
const firstPublicStatus = await loadPublicStatusSummary()
steps.push({
  step: 'public-launch-status-after-first-board',
  ...firstStatusRun,
  classification: classifyPublicStatus(firstStatusRun, firstPublicStatus),
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

const secondDispatchPacketRun = runNpmScript('qa:launch-dispatch-packet')
steps.push({
  step: 'launch-dispatch-packet-after-final-template',
  ...secondDispatchPacketRun,
  classification: passOrFail(secondDispatchPacketRun),
})

const secondTemplateRejectionRun = runNpmScript('qa:dispatch-sent-record-template-rejection')
steps.push({
  step: 'dispatch-sent-record-template-rejection-after-final-board',
  ...secondTemplateRejectionRun,
  classification: passOrFail(secondTemplateRejectionRun),
})

const secondDispatchMarkSentRun = runNpmScript('qa:dispatch-mark-sent', {
  QA_DISPATCH_MARK_SENT_RECORD: dispatchMarkSentFixturePath,
})
steps.push({
  step: 'dispatch-mark-sent-dry-run-after-final-board',
  ...secondDispatchMarkSentRun,
  classification: passOrFail(secondDispatchMarkSentRun),
})

const secondDispatchMarkSentImportRehearsalRun = runNpmScript('qa:dispatch-mark-sent-import-rehearsal')
steps.push({
  step: 'dispatch-mark-sent-import-rehearsal-after-final-board',
  ...secondDispatchMarkSentImportRehearsalRun,
  classification: passOrFail(secondDispatchMarkSentImportRehearsalRun),
})

const secondLaunchTodayOverdueRehearsalRun = runNpmScript('qa:launch-today-overdue-rehearsal')
steps.push({
  step: 'launch-today-overdue-rehearsal-after-final-board',
  ...secondLaunchTodayOverdueRehearsalRun,
  classification: passOrFail(secondLaunchTodayOverdueRehearsalRun),
})

const secondLaunchTodaySentDispatchRehearsalRun = runNpmScript('qa:launch-today-sent-dispatch-rehearsal')
steps.push({
  step: 'launch-today-sent-dispatch-rehearsal-after-final-board',
  ...secondLaunchTodaySentDispatchRehearsalRun,
  classification: passOrFail(secondLaunchTodaySentDispatchRehearsalRun),
})

const secondPublicLaunchModeRehearsalRun = runNpmScript('qa:public-launch-mode-rehearsal')
steps.push({
  step: 'public-launch-mode-rehearsal-after-final-board',
  ...secondPublicLaunchModeRehearsalRun,
  classification: passOrFail(secondPublicLaunchModeRehearsalRun),
})

const secondPublicLaunchThresholdRehearsalRun = runNpmScript('qa:public-launch-threshold-rehearsal')
steps.push({
  step: 'public-launch-threshold-rehearsal-after-final-board',
  ...secondPublicLaunchThresholdRehearsalRun,
  classification: passOrFail(secondPublicLaunchThresholdRehearsalRun),
})

const outreachBriefRun = runNpmScript('qa:launch-outreach-brief')
const outreachBriefSummary = await loadOutreachBriefSummary()
steps.push({
  step: 'launch-outreach-brief-final',
  ...outreachBriefRun,
  classification: passOrFail(outreachBriefRun),
  status: outreachBriefSummary.status,
  rowCount: outreachBriefSummary.rowCount || 0,
  betaRowCount: outreachBriefSummary.betaRowCount || 0,
  visualRowCount: outreachBriefSummary.visualRowCount || 0,
})

const secondStatusRun = runNpmScript('qa:public-launch-status')
const secondPublicStatus = await loadPublicStatusSummary()
steps.push({
  step: 'public-launch-status-final',
  ...secondStatusRun,
  classification: classifyPublicStatus(secondStatusRun, secondPublicStatus),
  status: secondPublicStatus.status,
  guardrailIssues: secondPublicStatus.guardrailIssues || [],
  blockerIds: (secondPublicStatus.blockers || []).map((blocker) => blocker.id),
})

const finalStatusClean = secondStatusRun.exitCode === 0 &&
  ['pass', 'beta-ready-public-blocked', 'public-launch-ready'].includes(secondPublicStatus.status) &&
  (secondPublicStatus.guardrailIssues || []).length === 0
const hardFailures = steps.filter((step) => {
  if (step.classification !== 'fail') return false
  if (finalStatusClean && (step.step.includes('after-first-board') || step.step.includes('before-status'))) {
    return false
  }
  return true
})
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
  operatorHandoff: secondLaunchSummary.operatorHandoff || null,
  outreachBrief: {
    artifact: outreachBriefSummary.jsonArtifact,
    report: outreachBriefSummary.reportArtifact,
    csv: outreachBriefSummary.csvArtifact,
    status: outreachBriefSummary.status,
    rowCount: outreachBriefSummary.rowCount || 0,
    betaRowCount: outreachBriefSummary.betaRowCount || 0,
    visualRowCount: outreachBriefSummary.visualRowCount || 0,
  },
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
- Immediate operator action: ${summary.operatorHandoff?.immediateExternalAction || 'none'}
- Sent-record CSV: ${summary.operatorHandoff?.sentRecordTemplateCsv || 'none'}
- Handoff rows: ${summary.operatorHandoff?.rows?.length ?? 0}
- Outreach brief: ${summary.outreachBrief.report || 'none'} (${summary.outreachBrief.rowCount} rows)

## Steps

${steps.map((step) => `- ${step.classification.toUpperCase()}: ${step.step} (${step.scriptName}, exit ${step.exitCode})`).join('\n')}

## Operator Handoff

- Validate sent proof: ${summary.operatorHandoff?.validationCommand ? `\`${summary.operatorHandoff.validationCommand}\`` : 'none'}
- Import sent proof: ${summary.operatorHandoff?.importCommand ? `\`${summary.operatorHandoff.importCommand}\`` : 'none'}
- Refresh after import: ${summary.operatorHandoff?.postImportCommands?.length ? summary.operatorHandoff.postImportCommands.map((command) => `\`${command}\``).join(' and ') : 'none'}
- Privacy rule: ${summary.operatorHandoff?.privacyRule || 'none'}
- Completion rule: ${summary.operatorHandoff?.completionRule || 'none'}
- Concise outreach brief: ${summary.outreachBrief.report ? `\`${summary.outreachBrief.report}\`` : 'none'}
- Outreach CSV: ${summary.outreachBrief.csv ? `\`${summary.outreachBrief.csv}\`` : 'none'}

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
