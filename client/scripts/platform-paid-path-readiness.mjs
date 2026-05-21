import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const date = process.env.QA_PAID_PATH_DATE || new Date().toISOString().slice(0, 10)
const releaseArtifact =
  process.env.QA_PAID_PATH_RELEASE_ARTIFACT ||
  '../qa/release-candidate-full-with-multi-planner-2026-05-21/summary.json'
const checkoutArtifactDir =
  process.env.QA_PAID_PATH_CHECKOUT_ARTIFACT_DIR ||
  '../qa/stripe-checkout-browser-full-with-multi-planner-2026-05-21'
const portalArtifactDir =
  process.env.QA_PAID_PATH_PORTAL_ARTIFACT_DIR ||
  '../qa/stripe-portal-browser-full-with-multi-planner-2026-05-21'
const subscriptionStateArtifactDir =
  process.env.QA_PAID_PATH_SUBSCRIPTION_STATE_ARTIFACT_DIR ||
  '../qa/billing-subscription-state-2026-05-21'
const jsonArtifact = process.env.QA_PAID_PATH_JSON || `paid-path-readiness-${date}.json`
const reportArtifact = process.env.QA_PAID_PATH_REPORT || `paid-path-readiness-${date}.md`

const requiredReleaseTasks = [
  { name: 'local commercial smoke', checked: 4 },
  { name: 'billing recovery smoke', checked: 15 },
  { name: 'Stripe test-mode readiness', checked: 11 },
  { name: 'hosted Stripe checkout browser QA', checked: 15 },
  { name: 'hosted Stripe billing portal browser QA', checked: 16 },
]

const requiredCheckoutScreenshots = [
  'screenshots/stripe-checkout-loaded.png',
  'screenshots/stripe-checkout-filled.png',
  'screenshots/stripe-checkout-returned.png',
]

const requiredPortalScreenshots = [
  'screenshots/stripe-portal-loaded.png',
  'screenshots/stripe-portal-returned.png',
]

const requiredSubscriptionStateScreenshots = [
  'screenshots/account-billing-canceling-local-1103x-view.png',
]

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function repoPath(relativePath) {
  return resolve(process.cwd(), relativePath)
}

async function readJson(relativePath) {
  const raw = await readFile(repoPath(relativePath), 'utf8')
  return JSON.parse(raw)
}

async function fileExists(relativePath) {
  try {
    await access(repoPath(relativePath))
    return true
  } catch {
    return false
  }
}

function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

function ageInDays(dateValue) {
  const parsed = Date.parse(`${dateValue}T00:00:00Z`)
  if (!Number.isFinite(parsed)) return null
  const now = new Date()
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor((todayUtc - parsed) / 86400000)
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

let releaseSummary = null
try {
  releaseSummary = await readJson(releaseArtifact)
  addCheck('paid-path release-candidate artifact is readable', true, {
    artifact: qaDisplayPath(releaseArtifact),
    checked: releaseSummary.checked ?? null,
    passed: releaseSummary.passed ?? null,
    failed: releaseSummary.failed ?? null,
  })
} catch (error) {
  addCheck('paid-path release-candidate artifact is readable', false, {
    artifact: qaDisplayPath(releaseArtifact),
    error: error instanceof Error ? error.message : String(error),
  })
}

if (releaseSummary) {
  const evidenceDate = dateOnly(releaseSummary.summaryPath) || dateOnly(releaseSummary.artifactDir) || dateOnly(releaseArtifact)
  const ageDays = evidenceDate ? ageInDays(evidenceDate) : null
  addCheck('paid-path release-candidate evidence is fresh', Number.isFinite(ageDays) && ageDays >= 0 && ageDays <= 14, {
    evidenceDate,
    ageDays,
    maxEvidenceAgeDays: 14,
  })

  addCheck('paid-path release-candidate included checkout and portal browser gates', (
    releaseSummary.includeStripeCheckout === true &&
    releaseSummary.includeStripePortal === true
  ), {
    includeStripeCheckout: releaseSummary.includeStripeCheckout,
    includeStripePortal: releaseSummary.includeStripePortal,
  })

  const results = Array.isArray(releaseSummary.results) ? releaseSummary.results : []
  const taskResults = requiredReleaseTasks.map((task) => {
    const result = results.find((candidate) => candidate.name === task.name)
    return {
      name: task.name,
      expectedChecked: task.checked,
      found: Boolean(result),
      ok: result?.ok === true,
      checked: result?.checked ?? null,
      passed: result?.passed ?? null,
      failed: result?.failed ?? null,
      mutatesLocal: result?.mutatesLocal ?? null,
      baseUrl: result?.baseUrl ?? null,
    }
  })
  const badTaskResults = taskResults.filter((result) => (
    !result.found ||
    !result.ok ||
    Number(result.checked) < result.expectedChecked ||
    Number(result.failed) !== 0
  ))
  addCheck('paid-path release-candidate passed every commercial and subscription gate', badTaskResults.length === 0, {
    taskResults,
    badTaskResults,
  })
}

const checkoutScreenshots = requiredCheckoutScreenshots.map((path) => `${checkoutArtifactDir}/${path}`)
const portalScreenshots = requiredPortalScreenshots.map((path) => `${portalArtifactDir}/${path}`)
const subscriptionStateScreenshots = requiredSubscriptionStateScreenshots.map((path) => `${subscriptionStateArtifactDir}/${path}`)
const screenshotPaths = [
  ...checkoutScreenshots,
  ...portalScreenshots,
  ...subscriptionStateScreenshots,
]
const missingScreenshots = []
for (const screenshot of screenshotPaths) {
  if (!(await fileExists(screenshot))) missingScreenshots.push(qaDisplayPath(screenshot))
}
addCheck('paid-path hosted and billing-state screenshots exist', missingScreenshots.length === 0, {
  screenshotCount: screenshotPaths.length,
  requiredScreenshots: screenshotPaths.map(qaDisplayPath),
  missingScreenshots,
})

if (releaseSummary) {
  const checkoutResult = releaseSummary.results?.find((result) => result.name === 'hosted Stripe checkout browser QA')
  const portalResult = releaseSummary.results?.find((result) => result.name === 'hosted Stripe billing portal browser QA')
  addCheck('paid-path hosted Stripe runs were test-mode local return flows', (
    checkoutResult?.baseUrl === 'http://localhost:3000' &&
    portalResult?.baseUrl === 'http://localhost:3000' &&
    checkoutResult?.mutatesLocal === true &&
    portalResult?.mutatesLocal === true
  ), {
    checkout: checkoutResult ? {
      baseUrl: checkoutResult.baseUrl || null,
      mutatesLocal: checkoutResult.mutatesLocal ?? null,
      checked: checkoutResult.checked ?? null,
      passed: checkoutResult.passed ?? null,
    } : null,
    portal: portalResult ? {
      baseUrl: portalResult.baseUrl || null,
      mutatesLocal: portalResult.mutatesLocal ?? null,
      checked: portalResult.checked ?? null,
      passed: portalResult.passed ?? null,
    } : null,
  })
}

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  releaseArtifact: qaDisplayPath(releaseArtifact),
  checkoutArtifactDir: qaDisplayPath(checkoutArtifactDir),
  portalArtifactDir: qaDisplayPath(portalArtifactDir),
  subscriptionStateArtifactDir: qaDisplayPath(subscriptionStateArtifactDir),
  jsonArtifact: `qa/${jsonArtifact}`,
  reportArtifact: `qa/${reportArtifact}`,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  requiredReleaseTasks: requiredReleaseTasks.map((task) => task.name),
  screenshotCount: screenshotPaths.length,
  checks,
  failures,
}

const report = `# Paid Path Readiness

Date: ${date}
Status: ${summary.status}

## Scope

This gate consolidates paid-product readiness evidence for subscription state handling, checkout, billing portal, Stripe configuration, and hosted Stripe browser artifacts.

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Release artifact: \`${summary.releaseArtifact}\`
- Checkout artifact: \`${summary.checkoutArtifactDir}\`
- Portal artifact: \`${summary.portalArtifactDir}\`
- Subscription-state artifact: \`${summary.subscriptionStateArtifactDir}\`
- Required screenshots: ${summary.screenshotCount}

## Required Release Tasks

${requiredReleaseTasks.map((task) => `- ${task.name}: at least ${task.checked}/${task.checked}`).join('\n')}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(root, 'qa', reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
