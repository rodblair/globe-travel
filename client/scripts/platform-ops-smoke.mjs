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
const expectedChecks = [
  'supabase_url',
  'supabase_anon_key',
  'supabase_service_role',
  'mapbox_token',
  'openai_api_key',
  'stripe_secret_key',
  'stripe_publishable_key',
  'stripe_webhook_secret',
  'stripe_monthly_price',
  'stripe_yearly_price',
  'site_url',
]
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

const cacheHeader = health.response.headers.get('cache-control') || ''
const healthContractOk =
  cacheHeader.includes('no-store') &&
  typeof health.json?.checkedAt === 'string' &&
  !Number.isNaN(Date.parse(health.json.checkedAt)) &&
  expectedChecks.every((name) => healthChecks.some((check) => check.name === name))
const contractResult = {
  name: 'health endpoint exposes no-store operational contract',
  ok: healthContractOk,
  cacheControl: cacheHeader,
  hasCheckedAt: typeof health.json?.checkedAt === 'string',
  missingChecks: expectedChecks.filter((name) => !healthChecks.some((check) => check.name === name)),
}
if (!healthContractOk) fail(contractResult.name, contractResult)
results.push(contractResult)

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
