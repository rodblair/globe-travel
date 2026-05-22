import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const clientDir = resolve(scriptDir, '..')
const repoRoot = resolve(clientDir, '..')

const registerPath = process.env.QA_PRODUCTION_MONITORING_REGISTER || 'qa/production-monitoring-register.json'
const baseUrl = (process.env.QA_MONITORING_BASE_URL || process.env.QA_BASE_URL || 'https://globe-travel-two.vercel.app').replace(/\/$/, '')
const maxEvidenceAgeDays = Number.parseInt(process.env.QA_MONITORING_MAX_EVIDENCE_AGE_DAYS || '14', 10)
const requestedDate = process.env.QA_PRODUCTION_MONITORING_DATE || ''

const requiredSignals = [
  'health',
  'landing',
  'login',
  'signup',
  'pricing',
  'public-share-page',
  'public-share-api',
  'feedback-api',
  'app-surface-gate',
  'accessibility-keyboard',
  'trip-entry-compat',
  'release-gate',
  'visual-gate',
  'launch-signoff',
  'rollback',
]

const requiredAlertMarkers = [
  '5xx',
  '/api/health',
  '/pricing',
  '/trips',
  '/trips/new',
  'public share',
  'app surface',
  'accessibility',
  'visual',
  'release gate',
  'launch signoff',
]

const checks = []

function repoPath(relativePath) {
  return resolve(repoRoot, relativePath)
}

function addCheck(name, ok, detail = {}) {
  checks.push({
    name,
    ok: Boolean(ok),
    ...detail,
  })
}

async function readJson(relativePath) {
  const raw = await readFile(repoPath(relativePath), 'utf8')
  return JSON.parse(raw)
}

async function readText(relativePath) {
  return readFile(repoPath(relativePath), 'utf8')
}

function dateOnly(value) {
  if (!value) return null
  const match = String(value).match(/\b\d{4}-\d{2}-\d{2}\b/)
  return match?.[0] || null
}

function currentUtcDate() {
  return new Date().toISOString().slice(0, 10)
}

function ageInDays(dateValue) {
  const parsed = Date.parse(`${dateValue}T00:00:00Z`)
  if (!Number.isFinite(parsed)) return null
  const now = new Date()
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor((todayUtc - parsed) / 86400000)
}

function hasMeaningfulText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function unique(values) {
  return [...new Set(values)]
}

function missingFrom(actual, expected) {
  const actualSet = new Set(actual)
  return expected.filter((item) => !actualSet.has(item))
}

async function fetchHealth(healthEndpoint) {
  try {
    const response = await fetch(healthEndpoint, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
      headers: {
        'user-agent': 'globe-travel-monitoring-readiness/1.0',
      },
    })
    const body = await response.json()
    return { response, body, error: null }
  } catch (error) {
    return {
      response: null,
      body: null,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const register = await readJson(registerPath)
const date = requestedDate || dateOnly(register.reviewedAt) || currentUtcDate()
const reportPath = process.env.QA_PRODUCTION_MONITORING_REPORT || `qa/production-monitoring-readiness-${date}.md`
addCheck('production monitoring register is readable', true, {
  artifact: registerPath,
  reviewedAt: register.reviewedAt || null,
  status: register.status || null,
})

const reviewedAt = dateOnly(register.reviewedAt)
const reviewedAgeDays = reviewedAt ? ageInDays(reviewedAt) : null
addCheck('production monitoring register evidence is fresh', Number.isFinite(reviewedAgeDays) && reviewedAgeDays >= 0 && reviewedAgeDays <= maxEvidenceAgeDays, {
  evidenceDate: reviewedAt,
  ageDays: reviewedAgeDays,
  maxEvidenceAgeDays,
})

addCheck('production monitoring register has owner, status, and production targets', (
  hasMeaningfulText(register.owner) &&
  register.status === 'automation-ready' &&
  register.baseUrl === baseUrl &&
  hasMeaningfulText(register.healthEndpoint) &&
  hasMeaningfulText(register.publicShareSlug)
), {
  owner: register.owner || null,
  status: register.status || null,
  expectedBaseUrl: baseUrl,
  baseUrl: register.baseUrl || null,
  healthEndpoint: register.healthEndpoint || null,
  publicShareSlug: register.publicShareSlug || null,
})

const monitors = Array.isArray(register.monitors) ? register.monitors : []
const coveredSignals = unique(monitors.flatMap((monitor) => monitor.signals || []).filter(Boolean))
const missingSignals = missingFrom(coveredSignals, requiredSignals)
addCheck('production monitoring covers launch-critical signals', missingSignals.length === 0, {
  requiredSignals,
  coveredSignals,
  missingSignals,
})

const workflowMonitors = monitors.filter((monitor) => monitor.kind === 'github-actions')
const workflowResults = []
for (const monitor of workflowMonitors) {
  let workflowText = ''
  let readable = false
  try {
    workflowText = await readText(monitor.workflowFile)
    readable = true
  } catch {
    readable = false
  }
  const lower = workflowText.toLowerCase()
  const missingMarkers = (monitor.commandMarkers || []).filter((marker) => !lower.includes(String(marker).toLowerCase()))
  workflowResults.push({
    id: monitor.id,
    workflowFile: monitor.workflowFile,
    readable,
    hasSchedule: /^  schedule:/m.test(workflowText) || /\n  schedule:\n/m.test(workflowText),
    missingMarkers,
  })
}
addCheck('production monitoring GitHub workflows are scheduled and run the expected gates', (
  workflowResults.length >= 2 &&
  workflowResults.every((result) => result.readable && result.hasSchedule && result.missingMarkers.length === 0)
), {
  workflowResults,
})

const alertText = JSON.stringify(register.alertPolicy || {}).toLowerCase()
const missingAlertMarkers = requiredAlertMarkers.filter((marker) => !alertText.includes(marker.toLowerCase()))
addCheck('production monitoring has actionable alert policy', (
  hasMeaningfulText(register.alertPolicy?.owner) &&
  Array.isArray(register.alertPolicy?.triggers) &&
  register.alertPolicy.triggers.length >= requiredAlertMarkers.length &&
  missingAlertMarkers.length === 0 &&
  Array.isArray(register.alertPolicy?.firstResponseSteps) &&
  register.alertPolicy.firstResponseSteps.length >= 5
), {
  owner: register.alertPolicy?.owner || null,
  triggerCount: Array.isArray(register.alertPolicy?.triggers) ? register.alertPolicy.triggers.length : 0,
  missingAlertMarkers,
  firstResponseStepCount: Array.isArray(register.alertPolicy?.firstResponseSteps) ? register.alertPolicy.firstResponseSteps.length : 0,
})

const runbookText = await readText('OPERATIONS_RUNBOOK.md')
const missingRunbookMarkers = [
  'Monitoring Targets',
  '.github/workflows/production-release-gate.yml',
  '.github/workflows/production-visual-gate.yml',
  '/api/health',
  '/pricing',
  '/trips',
  '/trips/new',
  '/t/x3m2c8cnws',
  '/api/trips/share/x3m2c8cnws',
  'Alert on',
].filter((marker) => !runbookText.includes(marker))
addCheck('operations runbook documents production monitoring targets and workflows', missingRunbookMarkers.length === 0, {
  missingRunbookMarkers,
})

const health = await fetchHealth(register.healthEndpoint || `${baseUrl}/api/health`)
const healthSummary = health.body?.summary || {}
const healthOk =
  health.response?.ok === true &&
  health.body?.status === 'ok' &&
  healthSummary.total === 11 &&
  healthSummary.ok === 11 &&
  healthSummary.criticalMissing === 0 &&
  healthSummary.warningMissing === 0
addCheck('production monitoring live health probe is green', healthOk, {
  status: health.response?.status || null,
  error: health.error,
  healthStatus: health.body?.status || null,
  summary: healthSummary,
  deployment: health.body?.deployment || null,
})

const latestVerification = register.latestVerification || {}
const latestVerificationDate = dateOnly(latestVerification.verifiedAt)
const latestVerificationAgeDays = latestVerificationDate ? ageInDays(latestVerificationDate) : null
const latestVerificationText = JSON.stringify(latestVerification).toLowerCase()
addCheck('production monitoring latest verification is fresh and tied to release gates', (
  Number.isFinite(latestVerificationAgeDays) &&
  latestVerificationAgeDays >= 0 &&
  latestVerificationAgeDays <= maxEvidenceAgeDays &&
  latestVerificationText.includes('qa:production-monitoring') &&
  latestVerificationText.includes('qa:release-production') &&
  latestVerificationText.includes('qa:launch-signoff') &&
  (!health.body?.deployment?.commit || latestVerification.expectedLiveCommit === health.body.deployment.commit)
), {
  verifiedAt: latestVerification.verifiedAt || null,
  ageDays: latestVerificationAgeDays,
  command: latestVerification.command || null,
  relatedCommands: latestVerification.relatedCommands || [],
  expectedLiveCommit: latestVerification.expectedLiveCommit || null,
  liveCommit: health.body?.deployment?.commit || null,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  dateSource: requestedDate ? 'QA_PRODUCTION_MONITORING_DATE' : 'monitoring register',
  baseUrl,
  register: registerPath,
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  signalsCovered: coveredSignals,
  workflowCount: workflowResults.length,
  liveDeployment: health.body?.deployment || null,
  checks,
  failures,
}

await mkdir(dirname(repoPath(reportPath)), { recursive: true })
await writeFile(repoPath(reportPath), `# Production Monitoring Readiness

Date: ${date}
Register: \`${registerPath}\`
Base URL: \`${baseUrl}\`

## Result

- Checked: \`${summary.checked}\`
- Passed: \`${summary.passed}\`
- Failed: \`${summary.failed}\`
- Signals covered: \`${coveredSignals.length}/${requiredSignals.length}\`
- Workflow monitors: \`${workflowResults.length}\`

## Live Deployment

\`\`\`json
${JSON.stringify(summary.liveDeployment, null, 2)}
\`\`\`

## Checks

${checks.map((check) => `- ${check.ok ? 'PASS' : 'FAIL'}: ${check.name}`).join('\n')}

## Failure Detail

\`\`\`json
${JSON.stringify(failures, null, 2)}
\`\`\`
`)

console.log(JSON.stringify({
  ...summary,
  report: reportPath,
}, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
