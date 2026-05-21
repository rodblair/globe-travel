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
  'qa/release-candidate-full-with-multi-planner-2026-05-21/summary.json'
const visualArtifact =
  process.env.QA_LAUNCH_VISUAL_ARTIFACT ||
  'qa/visual-baseline-2026-05-21-full-with-multi-planner-2026-05-21/summary.json'
const designSystemArtifact =
  process.env.QA_LAUNCH_DESIGN_SYSTEM_ARTIFACT ||
  'qa/design-system-readiness-2026-05-21.json'
const plannerActualsArtifact =
  process.env.QA_LAUNCH_PLANNER_ACTUALS_ARTIFACT ||
  'qa/release-candidate-full-with-multi-planner-2026-05-21/planner-generated-actuals-regional-edge-cities.json'
const betaHumanReviewRegister =
  process.env.QA_LAUNCH_BETA_HUMAN_REVIEW_REGISTER ||
  'qa/beta-human-review-register.json'
const accessibilityArtifact =
  process.env.QA_LAUNCH_ACCESSIBILITY_ARTIFACT ||
  'qa/accessibility-keyboard-production-guest-2026-05-21/summary.json'
const productionEvidence =
  process.env.QA_LAUNCH_PRODUCTION_EVIDENCE ||
  'qa/launch-signoff-current-production-evidence-2026-05-21.md'
const riskRegister =
  process.env.QA_LAUNCH_RISK_REGISTER ||
  'qa/launch-risk-register.json'
const rollbackPlan =
  process.env.QA_LAUNCH_ROLLBACK_PLAN ||
  'qa/launch-rollback-plan.json'
const visualReviewRegister =
  process.env.QA_LAUNCH_VISUAL_REVIEW_REGISTER ||
  'qa/production-visual-review-register.json'
const productionMonitoringRegister =
  process.env.QA_LAUNCH_PRODUCTION_MONITORING_REGISTER ||
  'qa/production-monitoring-register.json'
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
  'planner generated actuals map trust',
  'planner generated actuals prompt-suite cross-check',
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

const requiredProductionVisualRoutes = [
  'landing',
  'login',
  'signup',
  'public-share',
]

const requiredProductionVisualDiffRoutes = [
  'landing',
  'login',
  'signup',
]

const requiredDesignSystemChecks = [
  'design context documents users, tone, aesthetic, and principles',
  'global design tokens expose the Globe.travel atmosphere palette and interaction system',
  'shared UI primitives exist for core forms and controls',
  'atmosphere component vocabulary exists for editorial travel surfaces',
  'production UI and API source has no debug console.log calls',
  'production UI source has no placeholder TODO or lorem copy',
  'user-facing copy avoids generic AI-travel marketing filler',
  'responsive visual QA covers every design-critical public and protected route',
  'responsive visual QA has no polish blockers',
  'production visual QA covers public acquisition and sharing surfaces',
]

const requiredAccessibilityRoutes = [
  'landing',
  'planner',
  'saved-trips',
  'account-profile',
  'account-billing',
  'login',
  'signup',
  'public-share',
]

const requiredAccessibilityProtectedRoutes = [
  'planner',
  'saved-trips',
  'account-profile',
  'account-billing',
]

const requiredAccessibilityViewports = [
  'phone',
  'desktop',
]

const requiredMonitoringSignals = [
  'health',
  'landing',
  'login',
  'signup',
  'public-share-page',
  'public-share-api',
  'feedback-api',
  'release-gate',
  'visual-gate',
  'launch-signoff',
  'rollback',
]

const requiredMonitoringAlertMarkers = [
  '5xx',
  '/api/health',
  'public share',
  'visual',
  'release gate',
  'launch signoff',
]

const requiredStripeScreenshots = [
  'qa/stripe-checkout-browser-full-with-multi-planner-2026-05-21/screenshots/stripe-checkout-loaded.png',
  'qa/stripe-checkout-browser-full-with-multi-planner-2026-05-21/screenshots/stripe-checkout-filled.png',
  'qa/stripe-checkout-browser-full-with-multi-planner-2026-05-21/screenshots/stripe-checkout-returned.png',
  'qa/stripe-portal-browser-full-with-multi-planner-2026-05-21/screenshots/stripe-portal-loaded.png',
  'qa/stripe-portal-browser-full-with-multi-planner-2026-05-21/screenshots/stripe-portal-returned.png',
]

const requiredPlannerActualIds = [
  'istanbul-4-day-history-markets',
  'seoul-5-day-food-shopping',
  'bangkok-4-day-temples-street-food',
  'marrakech-3-day-markets-riads',
  'cape-town-5-day-outdoors-food',
  'sydney-4-day-beaches-neighborhoods',
]

const requiredBetaReviewAudiences = ['friend-group', 'couple', 'family', 'solo']
const requiredBetaReviewStyles = ['budget', 'premium', 'food', 'nightlife', 'outdoors', 'culture']
const requiredBetaReviewRegions = ['Africa', 'Asia', 'Europe', 'Latin America', 'North America', 'Oceania']
const requiredBetaReviewSurfaces = ['planner', 'trip-studio', 'map', 'public-share', 'feedback', 'save-reopen']
const requiredBetaReviewScorecardFields = [
  'firstMinuteClarity',
  'itineraryUsefulness',
  'mapTrust',
  'editAndSwapConfidence',
  'saveReopenConfidence',
  'shareRecipientClarity',
  'feedbackLoopClarity',
  'mobileUsability',
  'paidValueCredibility',
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

function normalizeCountry(value) {
  const normalized = String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const aliases = {
    turkiye: 'turkey',
    'united states of america': 'united states',
    usa: 'united states',
    uk: 'united kingdom',
  }

  return aliases[normalized] || normalized
}

function dayHasMapTrust(day, expectedCountry = null) {
  const itemCount = Number(day.itemCount) || 0
  const mappedItemCount = Number(day.mappedItemCount) || 0
  const uniqueMappedStopCount = Number(day.uniqueMappedStopCount) || 0
  const countries = Array.isArray(day.countries) ? day.countries : []
  const minimumUniqueStops = Math.min(itemCount, 1)
  const expected = expectedCountry ? normalizeCountry(expectedCountry) : null

  return (
    itemCount > 0 &&
    mappedItemCount >= minimumUniqueStops &&
    uniqueMappedStopCount >= minimumUniqueStops &&
    countries.length > 0 &&
    (!expected || countries.every((country) => normalizeCountry(country) === expected))
  )
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

  addCheck('full local release-candidate passed all top-level checks', summary.checked === requiredReleaseTasks.length && summary.passed === requiredReleaseTasks.length && summary.failed === 0, {
    checked: summary.checked,
    passed: summary.passed,
    failed: summary.failed,
    requiredTaskCount: requiredReleaseTasks.length,
  })

  checkEvidenceFreshness('full local release-candidate', evidenceDateFrom(summary, releaseArtifact))

  const requiredFlags = [
    'includeVisual',
    'includeStudioFixture',
    'includeShareFeedback',
    'includeShareFixtureSweep',
    'includeShareMultiItinerary',
    'includeOwnerFeedback',
    'includePlannerActuals',
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

  const visualResults = Array.isArray(summary.results) ? summary.results : []
  const screenshotPaths = visualResults
    .map((result) => result.screenshot?.relativePath || result.screenshot?.path)
    .filter(Boolean)
  const missingScreenshots = []
  for (const screenshotPath of screenshotPaths) {
    if (!(await fileExists(screenshotPath))) missingScreenshots.push(screenshotPath)
  }
  addCheck('responsive visual QA screenshot artifacts exist for every checked route and viewport', (
    visualResults.length === summary.checked &&
    screenshotPaths.length === summary.checked &&
    missingScreenshots.length === 0
  ), {
    checked: summary.checked,
    visualResultCount: visualResults.length,
    screenshotCount: screenshotPaths.length,
    missingScreenshots: missingScreenshots.slice(0, 12),
    missingScreenshotCount: missingScreenshots.length,
  })

  return summary
}

async function checkDesignSystemArtifact() {
  let summary
  try {
    summary = await readJson(designSystemArtifact)
  } catch (error) {
    addCheck('design-system readiness artifact is readable', false, {
      artifact: designSystemArtifact,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }

  addCheck('design-system readiness artifact is readable', true, {
    artifact: designSystemArtifact,
  })

  checkEvidenceFreshness('design-system readiness', evidenceDateFrom(summary, designSystemArtifact))

  const checkNames = Array.isArray(summary.checks)
    ? summary.checks.map((check) => check.name).filter(Boolean)
    : []
  const missingChecks = hasAll(checkNames, requiredDesignSystemChecks)
  const failedChecks = Array.isArray(summary.checks)
    ? summary.checks.filter((check) => check.ok === false).map((check) => check.name)
    : []
  addCheck('design-system readiness passed every required polish and token check', (
    summary.checked === requiredDesignSystemChecks.length &&
    summary.passed === requiredDesignSystemChecks.length &&
    summary.failed === 0 &&
    missingChecks.length === 0 &&
    failedChecks.length === 0
  ), {
    checked: summary.checked,
    passed: summary.passed,
    failed: summary.failed,
    requiredCheckCount: requiredDesignSystemChecks.length,
    missingChecks,
    failedChecks,
  })

  const visualEvidenceOk =
    summary.responsiveVisualArtifact === visualArtifact &&
    typeof summary.productionVisualArtifact === 'string' &&
    summary.productionVisualArtifact.includes('qa/visual-baseline-production-') &&
    Array.isArray(summary.failures) &&
    summary.failures.length === 0
  addCheck('design-system readiness is tied to current visual QA evidence', visualEvidenceOk, {
    expectedResponsiveVisualArtifact: visualArtifact,
    responsiveVisualArtifact: summary.responsiveVisualArtifact || null,
    productionVisualArtifact: summary.productionVisualArtifact || null,
    failureCount: Array.isArray(summary.failures) ? summary.failures.length : null,
  })

  return summary
}

async function checkAccessibilityArtifact() {
  let summary
  try {
    summary = await readJson(accessibilityArtifact)
  } catch (error) {
    addCheck('accessibility and keyboard artifact is readable', false, {
      artifact: accessibilityArtifact,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }

  addCheck('accessibility and keyboard artifact is readable', true, {
    artifact: accessibilityArtifact,
  })

  const resultCount = Array.isArray(summary.results) ? summary.results.length : 0
  const viewportIds = Array.isArray(summary.viewports) ? summary.viewports.map((viewport) => viewport.id).filter(Boolean) : []
  const missingRoutes = hasAll(summary.routes || [], requiredAccessibilityRoutes)
  const missingProtectedRoutes = hasAll(summary.auth?.protectedRoutes || [], requiredAccessibilityProtectedRoutes)
  const missingViewports = hasAll(viewportIds, requiredAccessibilityViewports)

  addCheck('accessibility and keyboard QA passed every required route and viewport', (
    summary.checked === 16 &&
    summary.passed === 16 &&
    summary.failed === 0 &&
    resultCount === 16 &&
    missingRoutes.length === 0 &&
    missingProtectedRoutes.length === 0 &&
    missingViewports.length === 0
  ), {
    checked: summary.checked,
    passed: summary.passed,
    failed: summary.failed,
    resultCount,
    requiredRoutes: requiredAccessibilityRoutes,
    missingRoutes,
    requiredProtectedRoutes: requiredAccessibilityProtectedRoutes,
    missingProtectedRoutes,
    requiredViewports: requiredAccessibilityViewports,
    missingViewports,
  })

  checkEvidenceFreshness('accessibility and keyboard QA', evidenceDateFrom(summary, accessibilityArtifact))

  const blockingResults = Array.isArray(summary.results)
    ? summary.results.filter((result) => (
      result.ok === false ||
      (Array.isArray(result.missingMarkers) && result.missingMarkers.length > 0) ||
      (Array.isArray(result.structureIssues) && result.structureIssues.length > 0) ||
      (Array.isArray(result.axe?.blockingViolations) && result.axe.blockingViolations.length > 0) ||
      (Array.isArray(result.keyboard?.issues) && result.keyboard.issues.length > 0)
    ))
    : []

  addCheck('accessibility and keyboard QA has no blocking axe, structure, marker, or keyboard failures', blockingResults.length === 0, {
    badResultCount: blockingResults.length,
    badResults: blockingResults.slice(0, 12).map((result) => ({
      routeId: result.routeId,
      viewportId: result.viewportId,
      missingMarkers: result.missingMarkers || [],
      structureIssues: result.structureIssues || [],
      blockingViolations: result.axe?.blockingViolations || [],
      keyboardIssues: result.keyboard?.issues || [],
    })),
  })

  addCheck('accessibility and keyboard QA uses guest auth for protected launch routes and cleans up generated guest', (
    summary.auth?.mode === 'guest' &&
    missingProtectedRoutes.length === 0 &&
    summary.auth?.cleanup?.attempted === true &&
    summary.auth?.cleanup?.profileDeleted === true &&
    summary.auth?.cleanup?.userDeleted === true &&
    !summary.auth?.cleanup?.error
  ), {
    auth: summary.auth || null,
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

async function checkPlannerActualsArtifact() {
  let actuals
  try {
    actuals = await readJson(plannerActualsArtifact)
  } catch (error) {
    addCheck('regional planner generated actuals artifact is readable', false, {
      artifact: plannerActualsArtifact,
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }

  addCheck('regional planner generated actuals artifact is readable', Array.isArray(actuals), {
    artifact: plannerActualsArtifact,
    actualCount: Array.isArray(actuals) ? actuals.length : null,
  })

  checkEvidenceFreshness('regional planner generated actuals', dateOnly(plannerActualsArtifact))

  const actualIds = Array.isArray(actuals) ? actuals.map((actual) => actual.id).filter(Boolean) : []
  const missingActualIds = hasAll(actualIds, requiredPlannerActualIds)
  addCheck('regional planner generated actuals cover launch edge cities', missingActualIds.length === 0, {
    requiredPlannerActualIds,
    actualIds,
    missingActualIds,
  })

  const badActuals = Array.isArray(actuals)
    ? actuals.filter((actual) => {
      const days = Array.isArray(actual.days) ? actual.days : []
      return days.length === 0 || days.some((day) => !dayHasMapTrust(day))
    })
    : []
  addCheck('regional planner generated actuals have reliable unique map pins and country consistency', badActuals.length === 0, {
    badActuals: badActuals.map((actual) => ({
      id: actual.id,
      tripTitle: actual.tripTitle || null,
      badDays: (actual.days || []).filter((day) => !dayHasMapTrust(day)).map((day) => ({
        dayIndex: day.dayIndex,
        itemCount: day.itemCount,
        mappedItemCount: day.mappedItemCount,
        uniqueMappedStopCount: day.uniqueMappedStopCount,
        duplicateMappedStops: day.duplicateMappedStops || [],
        countries: day.countries || [],
        usableRouteCount: day.usableRouteCount,
      })),
    })),
  })
}

async function checkBetaHumanReviewRegister() {
  let register
  try {
    register = await readJson(betaHumanReviewRegister)
  } catch (error) {
    addCheck('beta human review register is readable', false, {
      artifact: betaHumanReviewRegister,
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }

  addCheck('beta human review register is readable', true, {
    artifact: betaHumanReviewRegister,
    reviewedAt: register.reviewedAt || null,
    status: register.status || null,
  })

  checkEvidenceFreshness('beta human review register', dateOnly(register.reviewedAt))

  const plannedReviews = Array.isArray(register.plannedReviews) ? register.plannedReviews : []
  const audiences = unique(plannedReviews.map((review) => review.audience).filter(Boolean))
  const styles = unique(plannedReviews.map((review) => review.style).filter(Boolean))
  const regions = unique(plannedReviews.map((review) => review.region).filter(Boolean))
  const surfaces = unique(plannedReviews.flatMap((review) => review.primarySurfaces || []).filter(Boolean))
  const missingAudiences = hasAll(audiences, requiredBetaReviewAudiences)
  const missingStyles = hasAll(styles, requiredBetaReviewStyles)
  const missingRegions = hasAll(regions, requiredBetaReviewRegions)
  const missingSurfaces = hasAll(surfaces, requiredBetaReviewSurfaces)
  const missingScorecardFields = hasAll(register.scorecardFields || [], requiredBetaReviewScorecardFields)

  addCheck('beta human review register has 25-review intake matrix and required cohort coverage', (
    plannedReviews.length >= 25 &&
    missingAudiences.length === 0 &&
    missingStyles.length === 0 &&
    missingRegions.length === 0 &&
    missingSurfaces.length === 0
  ), {
    plannedReviewCount: plannedReviews.length,
    requiredMinimum: 25,
    audiences,
    missingAudiences,
    styles,
    missingStyles,
    regions,
    missingRegions,
    surfaces,
    missingSurfaces,
  })

  addCheck('beta human review register has launch scorecard fields', missingScorecardFields.length === 0, {
    requiredBetaReviewScorecardFields,
    missingScorecardFields,
  })

  const incompleteMetadata = plannedReviews.filter((review) => (
    !hasMeaningfulText(review.id) ||
    !hasMeaningfulText(review.sourceActualId) ||
    !hasMeaningfulText(review.destination) ||
    !hasMeaningfulText(review.prompt) ||
    !hasMeaningfulText(review.audience) ||
    !hasMeaningfulText(review.style) ||
    !hasMeaningfulText(review.region) ||
    !hasMeaningfulText(review.device) ||
    !Array.isArray(review.primarySurfaces) ||
    review.primarySurfaces.length === 0 ||
    !hasMeaningfulText(review.status)
  ))
  addCheck('beta human review register has complete metadata for every planned review', incompleteMetadata.length === 0, {
    incompleteMetadata: incompleteMetadata.map((review) => review.id || '(missing id)'),
  })

  const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])
  const completedReviews = plannedReviews.filter((review) => completedStatuses.has(review.status))
  const unresolvedBlockingReviews = completedReviews.filter((review) => {
    const findings = Array.isArray(review.findings) ? review.findings : []
    return findings.some((finding) => {
      const severity = String(finding.severity || '').toUpperCase()
      const status = String(finding.status || '').toLowerCase()
      return (severity === 'P0' || severity === 'P1') && status !== 'closed'
    })
  })
  addCheck('completed beta human reviews have no unresolved P0/P1 findings', unresolvedBlockingReviews.length === 0, {
    completedReviewCount: completedReviews.length,
    publicLaunchMinimum: Number(register.minimumCompletedReviewsForPublicLaunch) || null,
    unresolvedBlockingReviews: unresolvedBlockingReviews.map((review) => review.id),
  })
}

async function checkProductionEvidence(productionHealth) {
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
        /Production health:\s*`ok`,\s*`11\/11`/i.test(text) ||
        /"ok":\s*11[\s\S]{0,120}"criticalMissing":\s*0[\s\S]{0,120}"warningMissing":\s*0/i.test(text) ||
        /"healthStatus":\s*"ok"[\s\S]{0,160}"criticalMissing":\s*\[\][\s\S]{0,160}"warningMissing":\s*\[\]/i.test(text),
    },
    {
      label: 'production release gate with visual QA 10/10',
      ok: /Overall production gate:\s*`9\/9`/i.test(text) ||
        /Overall production gate:\s*`10\/10`/i.test(text) ||
        /production release gate passed\s*`9\/9`/i.test(text) ||
        /production release gate passed\s*`10\/10`/i.test(text) ||
        /production release gate:\s*`9\/9`/i.test(text) ||
        /production release gate:\s*`10\/10`/i.test(text) ||
        /"checked":\s*10[\s\S]{0,120}"passed":\s*10[\s\S]{0,120}"failed":\s*0[\s\S]{0,220}"includeProductionVisual":\s*true/i.test(text),
    },
    {
      label: 'production visual QA 20/20',
      ok: /production visual QA:\s*`20\/20`/i.test(text) ||
        /Production visual QA included:\s*`20\/20`/i.test(text) ||
        /"checked":\s*20[\s\S]{0,80}"passed":\s*20[\s\S]{0,80}"failed":\s*0[\s\S]{0,220}"artifactDir"/i.test(text),
    },
  ]

  const liveProductionCommit = productionHealth?.deployment?.commit || ''
  const expectedEvidenceCommit = expectedCommit || liveProductionCommit
  if (expectedEvidenceCommit) {
    evidenceMatchers.push({
      label: 'current production commit',
      ok: text.includes(expectedEvidenceCommit),
    })
  }

  const missingEvidence = evidenceMatchers.filter((matcher) => !matcher.ok).map((matcher) => matcher.label)
  addCheck('postdeploy production release evidence is present', missingEvidence.length === 0, {
    artifact: productionEvidence,
    requiredEvidence: evidenceMatchers.map((matcher) => matcher.label),
    missingEvidence,
    expectedEvidenceCommit: expectedEvidenceCommit || null,
  })
}

async function checkVisualReviewRegister(productionHealth) {
  let register
  try {
    register = await readJson(visualReviewRegister)
  } catch (error) {
    addCheck('production visual review register is readable', false, {
      artifact: visualReviewRegister,
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }

  addCheck('production visual review register is readable', true, {
    artifact: visualReviewRegister,
    reviewedAt: register.reviewedAt || null,
  })

  checkEvidenceFreshness('production visual review register', dateOnly(register.reviewedAt))

  const latestReview = register.latestProductionReview || {}
  const liveDeployment = productionHealth?.deployment || {}
  const liveCommit = liveDeployment.commit || ''
  const liveUrl = liveDeployment.url || ''
  const reviewTracksProduction =
    hasMeaningfulText(liveCommit) &&
    hasMeaningfulText(liveUrl) &&
    latestReview.productionCommit === liveCommit &&
    latestReview.deploymentUrl === liveUrl
  addCheck('production visual review tracks current production deployment', reviewTracksProduction, {
    liveDeployment,
    productionCommit: latestReview.productionCommit || null,
    deploymentUrl: latestReview.deploymentUrl || null,
    commitMatches: latestReview.productionCommit === liveCommit,
    urlMatches: latestReview.deploymentUrl === liveUrl,
  })

  let summary = null
  const summaryPath = latestReview.summaryArtifact || ''
  try {
    summary = await readJson(summaryPath)
  } catch (error) {
    addCheck('production visual review summary artifact is readable', false, {
      artifact: summaryPath || null,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  if (summary) {
    addCheck('production visual review summary artifact is readable', true, {
      artifact: summaryPath,
    })

    const missingRoutes = hasAll(summary.routes || [], requiredProductionVisualRoutes)
    const missingDiffRoutes = hasAll(summary.diffRoutes || [], requiredProductionVisualDiffRoutes)
    const resultCount = Array.isArray(summary.results) ? summary.results.length : 0
    addCheck('production visual review covers required public routes, viewports, and diffs', (
      summary.checked === 20 &&
      summary.passed === 20 &&
      summary.failed === 0 &&
      resultCount === 20 &&
      Array.isArray(summary.viewports) &&
      summary.viewports.length === 5 &&
      missingRoutes.length === 0 &&
      missingDiffRoutes.length === 0
    ), {
      checked: summary.checked,
      passed: summary.passed,
      failed: summary.failed,
      resultCount,
      viewportCount: Array.isArray(summary.viewports) ? summary.viewports.length : 0,
      requiredRoutes: requiredProductionVisualRoutes,
      missingRoutes,
      requiredDiffRoutes: requiredProductionVisualDiffRoutes,
      missingDiffRoutes,
    })

    const visualResults = Array.isArray(summary.results) ? summary.results : []
    const screenshotPaths = visualResults
      .map((result) => result.screenshot?.relativePath || result.screenshot?.path)
      .filter(Boolean)
    const missingScreenshots = []
    for (const screenshotPath of screenshotPaths) {
      if (!(await fileExists(screenshotPath))) missingScreenshots.push(screenshotPath)
    }
    addCheck('production visual review screenshot artifacts exist for every reviewed result', (
      screenshotPaths.length === 20 &&
      missingScreenshots.length === 0
    ), {
      screenshotCount: screenshotPaths.length,
      missingScreenshots: missingScreenshots.slice(0, 12),
      missingScreenshotCount: missingScreenshots.length,
    })

    const badVisualResults = visualResults.filter((result) => {
      const metrics = result.metrics || {}
      return result.ok === false ||
        metrics.horizontalOverflow === true ||
        (Array.isArray(metrics.appErrors) && metrics.appErrors.length > 0) ||
        (Array.isArray(metrics.clippedText) && metrics.clippedText.length > 0) ||
        (Array.isArray(metrics.overlappingAppTargets) && metrics.overlappingAppTargets.length > 0) ||
        result.comparison?.ok === false
    })
    addCheck('production visual review has no unresolved visual blockers', (
      badVisualResults.length === 0 &&
      latestReview.verdict === 'pass' &&
      Array.isArray(latestReview.blockingFindings) &&
      latestReview.blockingFindings.length === 0
    ), {
      verdict: latestReview.verdict || null,
      blockingFindings: latestReview.blockingFindings || [],
      badResultCount: badVisualResults.length,
      badResults: badVisualResults.slice(0, 12).map((result) => ({
        routeId: result.routeId,
        viewportId: result.viewportId,
        ok: result.ok,
        comparisonOk: result.comparison?.ok,
      })),
    })
  }

  const nextReviewDueAt = dateOnly(register.nextReviewDueAt)
  const nextReviewDueTime = nextReviewDueAt ? Date.parse(`${nextReviewDueAt}T00:00:00Z`) : Number.NaN
  const today = new Date()
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  addCheck('production visual review cadence has owner and future review date', (
    hasMeaningfulText(register.owner) &&
    hasMeaningfulText(register.cadence) &&
    hasMeaningfulText(register.reviewProtocol, 80) &&
    Number.isFinite(nextReviewDueTime) &&
    nextReviewDueTime >= todayUtc
  ), {
    owner: register.owner || null,
    cadence: register.cadence || null,
    nextReviewDueAt: register.nextReviewDueAt || null,
    hasReviewProtocol: hasMeaningfulText(register.reviewProtocol, 80),
  })
}

async function checkProductionMonitoringRegister(productionHealth) {
  let register
  try {
    register = await readJson(productionMonitoringRegister)
  } catch (error) {
    addCheck('production monitoring register is readable', false, {
      artifact: productionMonitoringRegister,
      error: error instanceof Error ? error.message : String(error),
    })
    return
  }

  addCheck('production monitoring register is readable', true, {
    artifact: productionMonitoringRegister,
    reviewedAt: register.reviewedAt || null,
    status: register.status || null,
  })

  checkEvidenceFreshness('production monitoring register', dateOnly(register.reviewedAt))

  addCheck('production monitoring register has owner, status, and production targets', (
    hasMeaningfulText(register.owner) &&
    register.status === 'automation-ready' &&
    register.baseUrl === baseUrl &&
    register.healthEndpoint === `${baseUrl}/api/health` &&
    hasMeaningfulText(register.publicShareSlug)
  ), {
    owner: register.owner || null,
    status: register.status || null,
    expectedBaseUrl: baseUrl,
    baseUrl: register.baseUrl || null,
    expectedHealthEndpoint: `${baseUrl}/api/health`,
    healthEndpoint: register.healthEndpoint || null,
    publicShareSlug: register.publicShareSlug || null,
  })

  const monitors = Array.isArray(register.monitors) ? register.monitors : []
  const coveredSignals = unique(monitors.flatMap((monitor) => monitor.signals || []).filter(Boolean))
  const missingSignals = hasAll(coveredSignals, requiredMonitoringSignals)
  addCheck('production monitoring covers launch-critical signals', missingSignals.length === 0, {
    requiredMonitoringSignals,
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
    const missingMarkers = (monitor.commandMarkers || [])
      .filter((marker) => !lower.includes(String(marker).toLowerCase()))
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
  const missingAlertMarkers = requiredMonitoringAlertMarkers
    .filter((marker) => !alertText.includes(marker.toLowerCase()))
  addCheck('production monitoring has actionable alert policy', (
    hasMeaningfulText(register.alertPolicy?.owner) &&
    Array.isArray(register.alertPolicy?.triggers) &&
    register.alertPolicy.triggers.length >= requiredMonitoringAlertMarkers.length &&
    missingAlertMarkers.length === 0 &&
    Array.isArray(register.alertPolicy?.firstResponseSteps) &&
    register.alertPolicy.firstResponseSteps.length >= 5
  ), {
    owner: register.alertPolicy?.owner || null,
    triggerCount: Array.isArray(register.alertPolicy?.triggers) ? register.alertPolicy.triggers.length : 0,
    missingAlertMarkers,
    firstResponseStepCount: Array.isArray(register.alertPolicy?.firstResponseSteps) ? register.alertPolicy.firstResponseSteps.length : 0,
  })

  let runbookText = ''
  try {
    runbookText = await readText('OPERATIONS_RUNBOOK.md')
  } catch {
    runbookText = ''
  }
  const missingRunbookMarkers = [
    'Monitoring Targets',
    '.github/workflows/production-release-gate.yml',
    '.github/workflows/production-visual-gate.yml',
    '/api/health',
    '/t/x3m2c8cnws',
    '/api/trips/share/x3m2c8cnws',
    'Alert on',
  ].filter((marker) => !runbookText.includes(marker))
  addCheck('operations runbook documents production monitoring targets and workflows', missingRunbookMarkers.length === 0, {
    missingRunbookMarkers,
  })

  const liveDeployment = productionHealth?.deployment || {}
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
    (!liveDeployment.commit || latestVerification.expectedLiveCommit === liveDeployment.commit)
  ), {
    verifiedAt: latestVerification.verifiedAt || null,
    ageDays: latestVerificationAgeDays,
    command: latestVerification.command || null,
    relatedCommands: latestVerification.relatedCommands || [],
    expectedLiveCommit: latestVerification.expectedLiveCommit || null,
    liveCommit: liveDeployment.commit || null,
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

async function checkRollbackPlan(productionHealth) {
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
  const knownGoodDeployment = production.knownGoodDeployment || {}
  addCheck('launch rollback plan identifies production targets', (
    production.alias === baseUrl &&
    hasMeaningfulText(production.healthEndpoint) &&
    hasMeaningfulText(knownGoodDeployment.commit) &&
    hasMeaningfulText(knownGoodDeployment.url)
  ), {
    expectedAlias: baseUrl,
    alias: production.alias || null,
    healthEndpoint: production.healthEndpoint || null,
    knownGoodDeployment,
  })

  const liveDeployment = productionHealth?.deployment || {}
  const liveCommit = liveDeployment.commit || ''
  const liveUrl = liveDeployment.url || ''
  const rollbackTracksLiveDeployment =
    hasMeaningfulText(liveCommit) &&
    hasMeaningfulText(liveUrl) &&
    knownGoodDeployment.commit === liveCommit &&
    knownGoodDeployment.url === liveUrl &&
    hasMeaningfulText(knownGoodDeployment.verifiedAt) &&
    hasMeaningfulText(knownGoodDeployment.verifiedBy) &&
    knownGoodDeployment.verifiedBy.includes(liveCommit) &&
    knownGoodDeployment.verifiedBy.includes('npm run qa:launch-signoff')
  addCheck('launch rollback plan tracks current known-good production deployment', rollbackTracksLiveDeployment, {
    liveDeployment,
    knownGoodDeployment,
    commitMatches: knownGoodDeployment.commit === liveCommit,
    urlMatches: knownGoodDeployment.url === liveUrl,
    verifiedByIncludesCommit: hasMeaningfulText(liveCommit) && String(knownGoodDeployment.verifiedBy || '').includes(liveCommit),
    verifiedByIncludesLaunchSignoff: String(knownGoodDeployment.verifiedBy || '').includes('npm run qa:launch-signoff'),
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

const productionHealth = await checkProductionHealth()
await checkRequiredDocs()
await checkReleaseArtifact()
await checkVisualArtifact()
await checkDesignSystemArtifact()
await checkAccessibilityArtifact()
await checkStripeArtifacts()
await checkPlannerActualsArtifact()
await checkBetaHumanReviewRegister()
await checkProductionEvidence(productionHealth)
await checkVisualReviewRegister(productionHealth)
await checkProductionMonitoringRegister(productionHealth)
await checkRiskRegister()
await checkRollbackPlan(productionHealth)

const failures = checks.filter((check) => !check.ok)
const summary = {
  baseUrl,
  expectedCommit: expectedCommit || null,
  releaseArtifact,
  visualArtifact,
  designSystemArtifact,
  accessibilityArtifact,
  plannerActualsArtifact,
  betaHumanReviewRegister,
  productionEvidence,
  visualReviewRegister,
  productionMonitoringRegister,
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
