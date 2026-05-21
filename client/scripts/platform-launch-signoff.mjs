import { access, readFile, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const clientDir = resolve(scriptDir, '..')
const repoRoot = resolve(clientDir, '..')

const baseUrl = (process.env.QA_LAUNCH_BASE_URL || process.env.QA_BASE_URL || 'https://globe-travel-two.vercel.app').replace(/\/$/, '')
const expectedCommit = process.env.QA_LAUNCH_EXPECTED_COMMIT || ''
const releaseArtifact =
  process.env.QA_LAUNCH_RELEASE_ARTIFACT ||
  'qa/release-candidate-full-with-multi-2026-05-21/summary.json'
const visualArtifact =
  process.env.QA_LAUNCH_VISUAL_ARTIFACT ||
  'qa/visual-baseline-2026-05-21-full-with-multi-2026-05-21/summary.json'
const productionEvidence =
  process.env.QA_LAUNCH_PRODUCTION_EVIDENCE ||
  'qa/release-candidate-share-multi-integration-2026-05-21/README.md'
const riskRegister =
  process.env.QA_LAUNCH_RISK_REGISTER ||
  'qa/launch-risk-register.json'
const rollbackPlan =
  process.env.QA_LAUNCH_ROLLBACK_PLAN ||
  'qa/launch-rollback-plan.json'
const maxEvidenceAgeDays = Number.parseInt(process.env.QA_LAUNCH_MAX_EVIDENCE_AGE_DAYS || '14', 10)

const requiredDocs = [
  'RELEASE_READINESS_MEMO.md',
  'PLATFORM_NEXT_SEVERAL_MONTHS_PLAN.md',
  'OPERATIONS_RUNBOOK.md',
]

const requiredReleaseTasks = [
  'lint',
  'production build',
  'local ops readiness',
  'geocode quality smoke',
  'local route smoke',
  'Trip Studio missing-trip recovery UI smoke',
  'auth and guest access smoke',
  'saved and account smoke',
  'local commercial smoke',
  'local accessibility and keyboard smoke',
  'public share and social preview smoke',
  'public share recovery smoke',
  'public share viral loop smoke',
  'public share map fallback smoke',
  'public share fixture sweep',
  'public share multi-itinerary browser UI smoke',
  'public share feedback mutation smoke',
  'public share recipient browser feedback smoke',
  'public share feedback states browser smoke',
  'planner handoff smoke',
  'billing recovery smoke',
  'Trip Studio action smoke with kept fixture',
  'Trip Studio recovery smoke on kept fixture',
  'Trip Studio owner/read-only browser UI smoke on kept fixture',
  'Trip Studio owner feedback readback smoke',
  'Trip Studio owner feedback browser UI smoke',
  'slow-network recovery smoke on kept fixture',
  'Stripe test-mode readiness',
  'planner prompt contract suite',
  'responsive visual QA',
  'hosted Stripe checkout browser QA',
  'hosted Stripe billing portal browser QA',
  'cleanup release-candidate Trip Studio fixture',
]

const requiredVisualRoutes = [
  'landing',
  'planner',
  'saved-trips',
  'saved-journal',
  'account-profile',
  'account-billing',
  'login',
  'signup',
  'public-share',
  'trip-studio',
]

const requiredProtectedRoutes = [
  'planner',
  'saved-trips',
  'saved-journal',
  'account-profile',
  'account-billing',
  'trip-studio',
]

const requiredStripeScreenshots = [
  'qa/stripe-checkout-browser-full-with-multi-2026-05-21/screenshots/stripe-checkout-loaded.png',
  'qa/stripe-checkout-browser-full-with-multi-2026-05-21/screenshots/stripe-checkout-filled.png',
  'qa/stripe-checkout-browser-full-with-multi-2026-05-21/screenshots/stripe-checkout-returned.png',
  'qa/stripe-portal-browser-full-with-multi-2026-05-21/screenshots/stripe-portal-loaded.png',
  'qa/stripe-portal-browser-full-with-multi-2026-05-21/screenshots/stripe-portal-returned.png',
]

const checks = []

function addCheck(name, ok, detail = {}) {
  checks.push({
    name,
    ok: Boolean(ok),
    ...detail,
  })
}

function repoPath(relativePath) {
  return resolve(repoRoot, relativePath)
}

async function fileExists(relativePath) {
  try {
    await access(repoPath(relativePath))
    return true
  } catch {
    return false
  }
}

async function readJson(relativePath) {
  const raw = await readFile(repoPath(relativePath), 'utf8')
  return JSON.parse(raw)
}

async function readText(relativePath) {
  return readFile(repoPath(relativePath), 'utf8')
}

function unique(values) {
  return [...new Set(values)]
}

function hasAll(actual, expected) {
  const actualSet = new Set(actual)
  return expected.filter((item) => !actualSet.has(item))
}

function dateOnly(value) {
  if (!value) return null
  const match = String(value).match(/\b\d{4}-\d{2}-\d{2}\b/)
  return match?.[0] || null
}

function evidenceDateFrom(summary, artifactPath) {
  return dateOnly(summary?.date) ||
    dateOnly(summary?.createdAt) ||
    dateOnly(summary?.checkedAt) ||
    dateOnly(summary?.artifactDir) ||
    dateOnly(artifactPath)
}

function evidenceDateFromText(text) {
  const dateLine = String(text || '').match(/^Date:\s*(\d{4}-\d{2}-\d{2})\b/im)
  if (dateLine) return dateLine[1]

  const checkedAt = String(text || '').match(/"checkedAt":\s*"([^"]+)"/i)
  return checkedAt ? dateOnly(checkedAt[1]) : null
}

async function evidenceDateFromTextOrPathOrMtime(text, artifactPath) {
  const explicitDate = evidenceDateFromText(text) || dateOnly(artifactPath)
  if (explicitDate) return explicitDate

  try {
    const info = await stat(repoPath(artifactPath))
    return info.mtime.toISOString().slice(0, 10)
  } catch {
    return null
  }
}

function ageInDays(dateValue) {
  const parsed = Date.parse(`${dateValue}T00:00:00Z`)
  if (!Number.isFinite(parsed)) return null
  const now = new Date()
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor((todayUtc - parsed) / 86400000)
}

function checkEvidenceFreshness(name, dateValue) {
  const ageDays = dateValue ? ageInDays(dateValue) : null
  addCheck(`${name} evidence is fresh`, Number.isFinite(ageDays) && ageDays >= 0 && ageDays <= maxEvidenceAgeDays, {
    evidenceDate: dateValue || null,
    ageDays,
    maxEvidenceAgeDays,
  })
}

function hasMeaningfulText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

async function checkProductionHealth() {
  const url = `${baseUrl}/api/health`
  let response
  let body

  try {
    response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    })
    body = await response.json()
  } catch (error) {
    addCheck('production health endpoint reachable', false, {
      url,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }

  addCheck('production health endpoint reachable', response.ok, {
    url,
    status: response.status,
  })

  const summary = body?.summary || {}
  addCheck('production health is fully green', body?.status === 'ok' && summary.total === 11 && summary.ok === 11 && summary.criticalMissing === 0 && summary.warningMissing === 0, {
    status: body?.status,
    summary,
  })

  const deployment = body?.deployment || {}
  addCheck('production deployment metadata is present', Boolean(deployment.environment && deployment.region && deployment.url && deployment.commit), {
    deployment,
  })

  if (expectedCommit) {
    addCheck('production deployment matches expected commit', deployment.commit === expectedCommit || deployment.commit?.startsWith(expectedCommit), {
      expectedCommit,
      actualCommit: deployment.commit || null,
    })
  }

  const checkedAt = Date.parse(body?.checkedAt || '')
  addCheck('production health timestamp is parseable', Number.isFinite(checkedAt), {
    checkedAt: body?.checkedAt || null,
  })

  return body
}

async function checkRequiredDocs() {
  const missing = []
  for (const doc of requiredDocs) {
    if (!(await fileExists(doc))) missing.push(doc)
  }
  addCheck('launch readiness docs exist', missing.length === 0, {
    requiredDocs,
    missing,
  })
}

async function checkReleaseArtifact() {
  let summary
  try {
    summary = await readJson(releaseArtifact)
  } catch (error) {
    addCheck('full local release-candidate artifact is readable', false, {
      artifact: releaseArtifact,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }

  addCheck('full local release-candidate artifact is readable', true, {
    artifact: releaseArtifact,
  })

  addCheck('full local release-candidate passed all top-level checks', summary.checked === 33 && summary.passed === 33 && summary.failed === 0, {
    checked: summary.checked,
    passed: summary.passed,
    failed: summary.failed,
  })

  checkEvidenceFreshness('full local release-candidate', evidenceDateFrom(summary, releaseArtifact))

  const requiredFlags = [
    'includeVisual',
    'includeStudioFixture',
    'includeShareFeedback',
    'includeShareFixtureSweep',
    'includeShareMultiItinerary',
    'includeOwnerFeedback',
    'includeSlowNetwork',
    'includeStripeCheckout',
    'includeStripePortal',
    'includePromptSuite',
  ]
  const missingFlags = requiredFlags.filter((flag) => summary[flag] !== true)
  addCheck('full local release-candidate includes every launch option', missingFlags.length === 0, {
    requiredFlags,
    missingFlags,
  })

  const taskNames = unique((summary.results || []).map((result) => result.name).filter(Boolean))
  const missingTasks = hasAll(taskNames, requiredReleaseTasks)
  const failedTasks = (summary.results || []).filter((result) => result.ok === false).map((result) => result.name)
  addCheck('full local release-candidate covers every core journey task', missingTasks.length === 0 && failedTasks.length === 0, {
    requiredTaskCount: requiredReleaseTasks.length,
    taskCount: taskNames.length,
    missingTasks,
    failedTasks,
  })

  return summary
}

async function checkVisualArtifact() {
  let summary
  try {
    summary = await readJson(visualArtifact)
  } catch (error) {
    addCheck('responsive visual artifact is readable', false, {
      artifact: visualArtifact,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }

  addCheck('responsive visual artifact is readable', true, {
    artifact: visualArtifact,
  })

  addCheck('responsive visual QA passed every route and viewport', summary.checked === 50 && summary.passed === 50 && summary.failed === 0, {
    checked: summary.checked,
    passed: summary.passed,
    failed: summary.failed,
    viewportCount: Array.isArray(summary.viewports) ? summary.viewports.length : 0,
  })

  checkEvidenceFreshness('responsive visual QA', evidenceDateFrom(summary, visualArtifact))

  const missingRoutes = hasAll(summary.routes || [], requiredVisualRoutes)
  const missingProtectedRoutes = hasAll(summary.auth?.protectedRoutes || [], requiredProtectedRoutes)
  addCheck('responsive visual QA covers public and protected launch routes', missingRoutes.length === 0 && missingProtectedRoutes.length === 0, {
    requiredRoutes: requiredVisualRoutes,
    missingRoutes,
    requiredProtectedRoutes,
    missingProtectedRoutes,
  })

  const badVisualResults = (summary.results || []).filter((result) => {
    const metrics = result.metrics || {}
    return result.ok === false ||
      metrics.horizontalOverflow === true ||
      (Array.isArray(metrics.appErrors) && metrics.appErrors.length > 0) ||
      (Array.isArray(metrics.clippedText) && metrics.clippedText.length > 0) ||
      (Array.isArray(metrics.overlappingAppTargets) && metrics.overlappingAppTargets.length > 0)
  })
  addCheck('responsive visual QA has no overflow, app errors, clipped text, or overlapping targets', badVisualResults.length === 0, {
    badResultCount: badVisualResults.length,
    badResults: badVisualResults.slice(0, 12).map((result) => ({
      routeId: result.routeId,
      viewportId: result.viewportId,
      ok: result.ok,
    })),
  })

  return summary
}

async function checkStripeArtifacts() {
  const missing = []
  for (const screenshot of requiredStripeScreenshots) {
    if (!(await fileExists(screenshot))) missing.push(screenshot)
  }
  addCheck('hosted Stripe checkout and portal screenshots exist', missing.length === 0, {
    requiredScreenshots: requiredStripeScreenshots,
    missing,
  })
}

async function checkProductionEvidence() {
  let text
  try {
    text = await readText(productionEvidence)
  } catch (error) {
    addCheck('postdeploy production release evidence is readable', false, {
      artifact: productionEvidence,
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }

  checkEvidenceFreshness(
    'postdeploy production release',
    await evidenceDateFromTextOrPathOrMtime(text, productionEvidence),
  )

  const evidenceMatchers = [
    {
      label: 'Vercel production deploy',
      ok: /deployed to Vercel production/i.test(text) ||
        /"environment":\s*"production"/i.test(text),
    },
    {
      label: 'production health 11/11',
      ok: /Checks:\s*`11\/11`/i.test(text) ||
        /health\s+`11\/11`/i.test(text) ||
        /"ok":\s*11[\s\S]{0,120}"criticalMissing":\s*0[\s\S]{0,120}"warningMissing":\s*0/i.test(text) ||
        /"healthStatus":\s*"ok"[\s\S]{0,160}"criticalMissing":\s*\[\][\s\S]{0,160}"warningMissing":\s*\[\]/i.test(text),
    },
    {
      label: 'production release gate 9/9',
      ok: /Overall production gate:\s*`9\/9`/i.test(text) ||
        /production release gate passed\s*`9\/9`/i.test(text) ||
        /"checked":\s*9[\s\S]{0,80}"passed":\s*9[\s\S]{0,80}"failed":\s*0/i.test(text),
    },
  ]
  const missingEvidence = evidenceMatchers.filter((matcher) => !matcher.ok).map((matcher) => matcher.label)
  addCheck('postdeploy production release evidence is present', missingEvidence.length === 0, {
    artifact: productionEvidence,
    requiredEvidence: evidenceMatchers.map((matcher) => matcher.label),
    missingEvidence,
  })
}

async function checkRiskRegister() {
  let register
  try {
    register = await readJson(riskRegister)
  } catch (error) {
    addCheck('launch risk register is readable', false, {
      artifact: riskRegister,
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }

  addCheck('launch risk register is readable', true, {
    artifact: riskRegister,
    reviewedAt: register.reviewedAt || null,
  })

  checkEvidenceFreshness('launch risk register', dateOnly(register.reviewedAt))

  const issues = Array.isArray(register.issues) ? register.issues : []
  const openBlockingIssues = issues.filter((issue) => {
    const severity = String(issue.severity || '').toUpperCase()
    const status = String(issue.status || '').toLowerCase()
    return (severity === 'P0' || severity === 'P1') && status !== 'closed'
  })
  addCheck('launch risk register has no open P0/P1 issues', openBlockingIssues.length === 0, {
    totalIssues: issues.length,
    openBlockingIssues: openBlockingIssues.map((issue) => ({
      id: issue.id,
      severity: issue.severity,
      status: issue.status,
      title: issue.title,
    })),
  })

  const openP2Issues = issues.filter((issue) => (
    String(issue.severity || '').toUpperCase() === 'P2' &&
    String(issue.status || '').toLowerCase() !== 'closed'
  ))
  const incompleteP2Issues = openP2Issues.filter((issue) => (
    !hasMeaningfulText(issue.owner) ||
    !hasMeaningfulText(issue.targetMonth) ||
    !hasMeaningfulText(issue.acceptedRisk, 40)
  ))
  addCheck('launch risk register open P2 issues have owner, target month, and accepted risk', incompleteP2Issues.length === 0, {
    openP2Count: openP2Issues.length,
    incompleteP2Issues: incompleteP2Issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      hasOwner: hasMeaningfulText(issue.owner),
      hasTargetMonth: hasMeaningfulText(issue.targetMonth),
      hasAcceptedRisk: hasMeaningfulText(issue.acceptedRisk, 40),
    })),
  })
}

async function checkRollbackPlan() {
  let plan
  try {
    plan = await readJson(rollbackPlan)
  } catch (error) {
    addCheck('launch rollback plan is readable', false, {
      artifact: rollbackPlan,
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }

  addCheck('launch rollback plan is readable', true, {
    artifact: rollbackPlan,
    reviewedAt: plan.reviewedAt || null,
  })

  checkEvidenceFreshness('launch rollback plan', dateOnly(plan.reviewedAt))

  const production = plan.production || {}
  addCheck('launch rollback plan identifies production targets', (
    production.alias === baseUrl &&
    hasMeaningfulText(production.healthEndpoint) &&
    hasMeaningfulText(production.knownGoodDeployment?.commit) &&
    hasMeaningfulText(production.knownGoodDeployment?.url)
  ), {
    expectedAlias: baseUrl,
    alias: production.alias || null,
    healthEndpoint: production.healthEndpoint || null,
    knownGoodDeployment: production.knownGoodDeployment || null,
  })

  const commands = Array.isArray(plan.verificationCommands) ? plan.verificationCommands : []
  const commandText = commands.join('\n')
  const requiredCommandMarkers = [
    'npm run qa:release-production',
    'npm run qa:launch-signoff',
  ]
  const missingCommandMarkers = requiredCommandMarkers.filter((marker) => !commandText.includes(marker))
  addCheck('launch rollback plan includes post-rollback verification commands', missingCommandMarkers.length === 0, {
    requiredCommandMarkers,
    missingCommandMarkers,
    commandCount: commands.length,
  })

  const steps = Array.isArray(plan.rollbackSteps) ? plan.rollbackSteps : []
  const stepText = steps.join('\n').toLowerCase()
  const requiredStepMarkers = [
    'identify',
    'promote',
    'production',
    'health',
    'record',
  ]
  const missingStepMarkers = requiredStepMarkers.filter((marker) => !stepText.includes(marker))
  addCheck('launch rollback plan has actionable restore steps', steps.length >= 5 && missingStepMarkers.length === 0, {
    stepCount: steps.length,
    missingStepMarkers,
  })
}

await checkProductionHealth()
await checkRequiredDocs()
await checkReleaseArtifact()
await checkVisualArtifact()
await checkStripeArtifacts()
await checkProductionEvidence()
await checkRiskRegister()
await checkRollbackPlan()

const failures = checks.filter((check) => !check.ok)
const summary = {
  baseUrl,
  expectedCommit: expectedCommit || null,
  releaseArtifact,
  visualArtifact,
  productionEvidence,
  riskRegister,
  rollbackPlan,
  maxEvidenceAgeDays,
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  checks,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
