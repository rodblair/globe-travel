const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const requireProductionMetadata = process.env.QA_REQUIRE_PRODUCTION_METADATA === '1'

const failures = []

function fail(name, details) {
  failures.push({ name, ...details })
}

async function readJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'user-agent': 'globe-travel-ops-smoke/1.0' },
  })
  const text = await response.text()
  let json = null

  try {
    json = JSON.parse(text)
  } catch {
    // handled by caller
  }

  return { response, text, json }
}

const results = []

const health = await readJson('/api/health')
const healthChecks = Array.isArray(health.json?.checks) ? health.json.checks : []
const criticalMissing = healthChecks.filter((check) => (
  check.severity === 'critical' && check.status !== 'ok'
))
const healthOk =
  health.response.ok &&
  health.json?.service === 'globe-travel' &&
  health.json?.status === 'ok' &&
  criticalMissing.length === 0
const healthResult = {
  name: 'health endpoint reports operational readiness',
  ok: healthOk,
  status: health.response.status,
  healthStatus: health.json?.status ?? null,
  criticalMissing: criticalMissing.map((check) => check.name),
  warningMissing: healthChecks
    .filter((check) => check.severity === 'warning' && check.status !== 'ok')
    .map((check) => check.name),
}
if (!healthOk) fail(healthResult.name, healthResult)
results.push(healthResult)

const metadata = health.json?.deployment || {}
const metadataOk =
  !requireProductionMetadata ||
  (metadata.environment === 'production' && Boolean(metadata.commit) && Boolean(metadata.url))
const metadataResult = {
  name: 'production deployment metadata is present',
  ok: metadataOk,
  required: requireProductionMetadata,
  environment: metadata.environment ?? null,
  hasCommit: Boolean(metadata.commit),
  hasUrl: Boolean(metadata.url),
}
if (!metadataOk) fail(metadataResult.name, metadataResult)
results.push(metadataResult)

const summary = {
  baseUrl,
  checked: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  results,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
