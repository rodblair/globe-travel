import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const date = process.env.QA_PUBLIC_LAUNCH_STATUS_DATE || new Date().toISOString().slice(0, 10)
const baseUrl = (process.env.QA_BASE_URL || 'https://globe-travel-two.vercel.app').replace(/\/$/, '')
const requirePublicLaunch = ['1', 'true', 'yes', 'public'].includes(String(process.env.QA_LAUNCH_STATUS_REQUIRE_PUBLIC || '').toLowerCase())
const expectedCommit = process.env.QA_LAUNCH_EXPECTED_COMMIT || ''

const betaRegisterPath = process.env.QA_BETA_REVIEW_REGISTER || 'qa/beta-human-review-register.json'
const betaProgressPath = process.env.QA_BETA_REVIEW_PROGRESS || 'qa/beta-human-review-progress-2026-05-21.json'
const betaIntakePath = process.env.QA_BETA_REVIEW_INTAKE || 'qa/beta-human-review-intake-2026-05-21.json'
const visualRegisterPath = process.env.QA_VISUAL_REVIEW_REGISTER || 'qa/production-visual-review-register.json'
const visualIntakePath = process.env.QA_VISUAL_REVIEW_INTAKE || 'qa/production-visual-review-intake-2026-05-21.json'
const visualSchedulePath = process.env.QA_VISUAL_REVIEW_SCHEDULE || 'qa/production-visual-review-schedule-2026-05-21.md'
const monitoringRegisterPath = process.env.QA_PRODUCTION_MONITORING_REGISTER || 'qa/production-monitoring-register.json'
const rollbackPath = process.env.QA_ROLLBACK_PLAN || 'qa/launch-rollback-plan.json'
const riskRegisterPath = process.env.QA_RISK_REGISTER || 'qa/launch-risk-register.json'
const jsonArtifact = process.env.QA_PUBLIC_LAUNCH_STATUS_JSON || `public-launch-status-${date}.json`
const reportArtifact = process.env.QA_PUBLIC_LAUNCH_STATUS_REPORT || `public-launch-status-${date}.md`

const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])

function repoPath(path) {
  return resolve(root, path)
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
}

async function readText(path) {
  return readFile(repoPath(path), 'utf8')
}

function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

async function fetchHealth() {
  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
      headers: {
        'user-agent': 'globe-travel-public-launch-status/1.0',
      },
    })
    const body = await response.json()
    return { ok: response.ok, status: response.status, body, error: null }
  } catch (error) {
    return {
      ok: false,
      status: null,
      body: null,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function summarizeBlocker(id, title, detail) {
  return { id, title, detail }
}

const [
  betaRegister,
  betaProgress,
  betaIntake,
  visualRegister,
  visualIntake,
  visualScheduleReport,
  monitoringRegister,
  rollbackPlan,
  riskRegister,
  health,
] = await Promise.all([
  readJson(betaRegisterPath),
  readJson(betaProgressPath),
  readJson(betaIntakePath),
  readJson(visualRegisterPath),
  readJson(visualIntakePath),
  readText(visualSchedulePath),
  readJson(monitoringRegisterPath),
  readJson(rollbackPath),
  readJson(riskRegisterPath),
  fetchHealth(),
])

const plannedBetaReviews = Array.isArray(betaRegister.plannedReviews) ? betaRegister.plannedReviews : []
const completedBetaReviews = plannedBetaReviews.filter((review) => completedStatuses.has(review.status))
const publicBetaMinimum = Number(betaRegister.minimumCompletedReviewsForPublicLaunch) || 25
const betaRemaining = Math.max(0, publicBetaMinimum - completedBetaReviews.length)

const visualHistory = Array.isArray(visualRegister.reviewHistory) ? visualRegister.reviewHistory : []
const visualHistoryDates = unique(visualHistory.map((review) => dateOnly(review.reviewedAt)))
const visualMinimum = Number(visualRegister.minimumPublicLaunchReviewHistory) || 4
const visualRemaining = Math.max(0, visualMinimum - visualHistoryDates.length)
const scheduledVisualReviews = Array.isArray(visualRegister.scheduledPublicLaunchReviews)
  ? visualRegister.scheduledPublicLaunchReviews
  : []

const liveDeployment = health.body?.deployment || null
const openBlockingRisks = (Array.isArray(riskRegister.issues) ? riskRegister.issues : [])
  .filter((issue) => ['P0', 'P1'].includes(String(issue.severity || '').toUpperCase()) && String(issue.status || '').toLowerCase() === 'open')
const openAcceptedP2Risks = (Array.isArray(riskRegister.issues) ? riskRegister.issues : [])
  .filter((issue) => String(issue.severity || '').toUpperCase() === 'P2' && String(issue.status || '').toLowerCase() === 'open')

const blockers = []
if (completedBetaReviews.length < publicBetaMinimum) {
  blockers.push(summarizeBlocker(
    'beta-human-review-threshold',
    'Complete beta human reviews',
    `${completedBetaReviews.length}/${publicBetaMinimum} completed; ${betaRemaining} remaining.`
  ))
}
if (visualHistoryDates.length < visualMinimum) {
  blockers.push(summarizeBlocker(
    'production-visual-review-history',
    'Complete production visual-review history',
    `${visualHistoryDates.length}/${visualMinimum} distinct review dates recorded; ${visualRemaining} remaining.`
  ))
}
if (openBlockingRisks.length > 0) {
  blockers.push(summarizeBlocker(
    'open-p0-p1-risk',
    'Close open P0/P1 launch risks',
    `${openBlockingRisks.length} open blocking risk(s).`
  ))
}

const guardrailIssues = []
if (!health.ok || health.body?.status !== 'ok' || health.body?.summary?.criticalMissing > 0) {
  guardrailIssues.push('production health is not fully green')
}
if (expectedCommit && liveDeployment?.commit !== expectedCommit) {
  guardrailIssues.push(`production commit ${liveDeployment?.commit || 'missing'} does not match expected ${expectedCommit}`)
}
if (betaProgress.status !== 'pass') guardrailIssues.push('beta human review progress artifact is not passing')
if (betaIntake.status !== 'pass') guardrailIssues.push('beta human review intake artifact is not passing')
if (visualIntake.status !== 'pass') guardrailIssues.push('production visual review intake artifact is not passing')
if (!visualScheduleReport.includes('Status: pass')) guardrailIssues.push('production visual review schedule report is not passing')
if (monitoringRegister.latestVerification?.expectedLiveCommit !== liveDeployment?.commit) {
  guardrailIssues.push('production monitoring latest verification is not tied to the live production commit')
}
if (rollbackPlan.production?.knownGoodDeployment?.commit !== liveDeployment?.commit) {
  guardrailIssues.push('rollback plan known-good deployment is not tied to the live production commit')
}

const publicLaunchReady = blockers.length === 0 && guardrailIssues.length === 0
const betaReady = guardrailIssues.length === 0
const status = publicLaunchReady ? 'public-launch-ready' : betaReady ? 'beta-ready-public-blocked' : 'blocked'
const shouldFail = guardrailIssues.length > 0 || (requirePublicLaunch && !publicLaunchReady)

const summary = {
  date,
  baseUrl,
  status,
  betaReady,
  publicLaunchReady,
  requirePublicLaunch,
  liveDeployment,
  betaHumanReviews: {
    planned: plannedBetaReviews.length,
    completed: completedBetaReviews.length,
    minimumForPublicLaunch: publicBetaMinimum,
    remaining: betaRemaining,
    progressArtifact: qaDisplayPath(betaProgressPath),
    intakeArtifact: qaDisplayPath(betaIntakePath),
  },
  productionVisualReviews: {
    historyCount: visualHistory.length,
    distinctHistoryDateCount: visualHistoryDates.length,
    minimumForPublicLaunch: visualMinimum,
    remainingDistinctDates: visualRemaining,
    scheduledReviewCount: scheduledVisualReviews.length,
    nextReviewDueAt: visualRegister.nextReviewDueAt || null,
    intakeArtifact: qaDisplayPath(visualIntakePath),
    scheduleArtifact: qaDisplayPath(visualSchedulePath),
  },
  risks: {
    openBlockingRiskCount: openBlockingRisks.length,
    openAcceptedP2RiskCount: openAcceptedP2Risks.length,
    openAcceptedP2RiskIds: openAcceptedP2Risks.map((issue) => issue.id),
  },
  guardrailIssues,
  blockers,
  nextActions: [
    betaRemaining > 0 ? `Collect and import ${betaRemaining} completed beta review submission(s).` : null,
    visualRemaining > 0 ? `Run, review, and import ${visualRemaining} scheduled production visual review date(s).` : null,
    guardrailIssues.length > 0 ? 'Fix guardrail issues before relying on public-launch status.' : null,
  ].filter(Boolean),
  artifacts: {
    betaRegister: qaDisplayPath(betaRegisterPath),
    visualRegister: qaDisplayPath(visualRegisterPath),
    monitoringRegister: qaDisplayPath(monitoringRegisterPath),
    rollbackPlan: qaDisplayPath(rollbackPath),
    riskRegister: qaDisplayPath(riskRegisterPath),
    json: `qa/${jsonArtifact}`,
    report: `qa/${reportArtifact}`,
  },
}

const report = `# Public Launch Status

Date: ${date}
Base URL: ${baseUrl}
Status: ${status}

## Result

- Beta/release-ops ready: ${betaReady ? 'yes' : 'no'}
- Public-launch ready: ${publicLaunchReady ? 'yes' : 'no'}
- Production commit: ${liveDeployment?.commit || 'missing'}
- Production deployment: ${liveDeployment?.url || 'missing'}
- Beta reviews: ${completedBetaReviews.length}/${publicBetaMinimum}
- Production visual review history: ${visualHistoryDates.length}/${visualMinimum}
- Open P0/P1 risks: ${openBlockingRisks.length}
- Open accepted P2 risks: ${openAcceptedP2Risks.length}

## Public-Launch Blockers

${markdownList(blockers.map((blocker) => `${blocker.id}: ${blocker.detail}`))}

## Guardrail Issues

${markdownList(guardrailIssues)}

## Next Actions

${markdownList(summary.nextActions)}

## Evidence

- Beta register: \`${summary.artifacts.betaRegister}\`
- Beta progress: \`${summary.betaHumanReviews.progressArtifact}\`
- Beta intake: \`${summary.betaHumanReviews.intakeArtifact}\`
- Visual register: \`${summary.artifacts.visualRegister}\`
- Visual schedule: \`${summary.productionVisualReviews.scheduleArtifact}\`
- Visual intake: \`${summary.productionVisualReviews.intakeArtifact}\`
- Monitoring register: \`${summary.artifacts.monitoringRegister}\`
- Rollback plan: \`${summary.artifacts.rollbackPlan}\`
- Risk register: \`${summary.artifacts.riskRegister}\`

## Operating Meaning

Default mode may pass while public launch is blocked, because the remaining blockers require real human-review and visual-review history. Run with \`QA_LAUNCH_STATUS_REQUIRE_PUBLIC=1\` to make this command fail until public launch is truly ready.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(root, 'qa', reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (shouldFail) {
  process.exitCode = 1
}
