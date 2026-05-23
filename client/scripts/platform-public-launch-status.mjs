import { execFileSync } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_PUBLIC_LAUNCH_STATUS_DATE || ''
const baseUrl = (process.env.QA_BASE_URL || 'https://globe-travel-two.vercel.app').replace(/\/$/, '')
const requirePublicLaunch = ['1', 'true', 'yes', 'public'].includes(String(process.env.QA_LAUNCH_STATUS_REQUIRE_PUBLIC || '').toLowerCase())
const expectedCommit = process.env.QA_LAUNCH_EXPECTED_COMMIT || ''
const enforceRuntimeDeploymentCurrency = !['0', 'false', 'no'].includes(
  String(process.env.QA_ENFORCE_RUNTIME_DEPLOYMENT_CURRENCY || '1').toLowerCase(),
)

const betaRegisterPath = process.env.QA_BETA_REVIEW_REGISTER || 'qa/beta-human-review-register.json'
const betaPacketManifestPath = process.env.QA_BETA_REVIEW_PACKET_MANIFEST || 'qa/beta-human-review-packet-manifest-2026-05-21.json'
const betaSchedulePath = process.env.QA_BETA_REVIEW_SCHEDULE || 'qa/beta-human-review-schedule-2026-05-21.json'
const betaScheduleReportPath = process.env.QA_BETA_REVIEW_SCHEDULE_REPORT || 'qa/beta-human-review-schedule-2026-05-21.md'
const betaCommandCenterPath = process.env.QA_BETA_REVIEW_COMMAND_CENTER || 'qa/beta-human-review-command-center-2026-05-21.json'
const betaCommandCenterReportPath = process.env.QA_BETA_REVIEW_COMMAND_CENTER_REPORT || 'qa/beta-human-review-command-center-2026-05-21.md'
const betaNextWaveOpsPath = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS || 'qa/beta-human-review-next-wave-ops-2026-05-21.json'
const betaNextWaveOpsReportPath = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS_REPORT || 'qa/beta-human-review-next-wave-ops-2026-05-21.md'
const betaNextWaveOpsCsvPath = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS_CSV || 'qa/beta-human-review-next-wave-ops-2026-05-21.csv'
const betaDispatchOutboxPath = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX || 'qa/beta-human-review-dispatch-outbox-2026-05-21.json'
const betaDispatchOutboxReportPath = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX_REPORT || 'qa/beta-human-review-dispatch-outbox-2026-05-21.md'
const betaDispatchOutboxCsvPath = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX_CSV || 'qa/beta-human-review-dispatch-outbox-2026-05-21.csv'
const betaDispatchLogPath = process.env.QA_BETA_REVIEW_DISPATCH_LOG || 'qa/beta-human-review-dispatch-log-2026-05-21.json'
const betaDispatchLogReportPath = process.env.QA_BETA_REVIEW_DISPATCH_LOG_REPORT || 'qa/beta-human-review-dispatch-log-2026-05-21.md'
const betaDispatchLogCsvPath = process.env.QA_BETA_REVIEW_DISPATCH_LOG_CSV || 'qa/beta-human-review-dispatch-log-2026-05-21.csv'
const betaFollowUpOutboxPath = process.env.QA_BETA_REVIEW_FOLLOW_UP_OUTBOX || 'qa/beta-human-review-follow-up-outbox-2026-05-21.json'
const betaFollowUpOutboxReportPath = process.env.QA_BETA_REVIEW_FOLLOW_UP_OUTBOX_REPORT || 'qa/beta-human-review-follow-up-outbox-2026-05-21.md'
const betaFollowUpOutboxCsvPath = process.env.QA_BETA_REVIEW_FOLLOW_UP_OUTBOX_CSV || 'qa/beta-human-review-follow-up-outbox-2026-05-21.csv'
const betaAllWaveOpsPath = process.env.QA_BETA_REVIEW_ALL_WAVE_OPS || 'qa/beta-human-review-all-wave-ops-2026-05-21.json'
const betaAllWaveOpsReportPath = process.env.QA_BETA_REVIEW_ALL_WAVE_OPS_REPORT || 'qa/beta-human-review-all-wave-ops-2026-05-21.md'
const betaAllWaveOpsCsvPath = process.env.QA_BETA_REVIEW_ALL_WAVE_OPS_CSV || 'qa/beta-human-review-all-wave-ops-2026-05-21.csv'
const betaWaveRehearsalPath = process.env.QA_BETA_REVIEW_WAVE_REHEARSAL_ARTIFACT ||
  process.env.QA_LAUNCH_BETA_REVIEW_WAVE_REHEARSAL_ARTIFACT ||
  'qa/beta-human-review-wave-rehearsal-2026-05-22.json'
const betaMatrixRehearsalPath = process.env.QA_BETA_REVIEW_MATRIX_REHEARSAL_ARTIFACT ||
  process.env.QA_LAUNCH_BETA_REVIEW_MATRIX_REHEARSAL_ARTIFACT ||
  'qa/beta-human-review-matrix-rehearsal-2026-05-22.json'
const betaGuestStartRehearsalPath = process.env.QA_BETA_REVIEW_GUEST_START_REHEARSAL_ARTIFACT ||
  process.env.QA_LAUNCH_BETA_REVIEW_GUEST_START_REHEARSAL_ARTIFACT ||
  'qa/beta-human-review-guest-start-rehearsal-2026-05-22.json'
const betaProgressPath = process.env.QA_BETA_REVIEW_PROGRESS || 'qa/beta-human-review-progress-2026-05-21.json'
const betaIntakePath = process.env.QA_BETA_REVIEW_INTAKE || 'qa/beta-human-review-intake-2026-05-21.json'
const visualRegisterPath = process.env.QA_VISUAL_REVIEW_REGISTER || 'qa/production-visual-review-register.json'
const visualIntakePath = process.env.QA_VISUAL_REVIEW_INTAKE || 'qa/production-visual-review-intake-2026-05-21.json'
const visualProgressPath = process.env.QA_VISUAL_REVIEW_PROGRESS || 'qa/production-visual-review-progress-2026-05-21.json'
const visualSchedulePath = process.env.QA_VISUAL_REVIEW_SCHEDULE || 'qa/production-visual-review-schedule-2026-05-21.md'
const visualDispatchOutboxPath = process.env.QA_VISUAL_REVIEW_DISPATCH_OUTBOX || 'qa/production-visual-review-dispatch-outbox-2026-05-21.json'
const visualDispatchOutboxReportPath = process.env.QA_VISUAL_REVIEW_DISPATCH_OUTBOX_REPORT || 'qa/production-visual-review-dispatch-outbox-2026-05-21.md'
const visualDispatchOutboxCsvPath = process.env.QA_VISUAL_REVIEW_DISPATCH_OUTBOX_CSV || 'qa/production-visual-review-dispatch-outbox-2026-05-21.csv'
const visualDispatchLogPath = process.env.QA_VISUAL_REVIEW_DISPATCH_LOG || 'qa/production-visual-review-dispatch-log-2026-05-21.json'
const visualDispatchLogReportPath = process.env.QA_VISUAL_REVIEW_DISPATCH_LOG_REPORT || 'qa/production-visual-review-dispatch-log-2026-05-21.md'
const visualDispatchLogCsvPath = process.env.QA_VISUAL_REVIEW_DISPATCH_LOG_CSV || 'qa/production-visual-review-dispatch-log-2026-05-21.csv'
const monitoringRegisterPath = process.env.QA_PRODUCTION_MONITORING_REGISTER || 'qa/production-monitoring-register.json'
const rollbackPath = process.env.QA_ROLLBACK_PLAN || 'qa/launch-rollback-plan.json'
const riskRegisterPath = process.env.QA_RISK_REGISTER || 'qa/launch-risk-register.json'
const paidPathReadinessPath = process.env.QA_PAID_PATH_READINESS || process.env.QA_LAUNCH_PAID_PATH_ARTIFACT || 'qa/paid-path-readiness-2026-05-21.json'
const accessibilityPath = process.env.QA_ACCESSIBILITY_ARTIFACT || process.env.QA_LAUNCH_ACCESSIBILITY_ARTIFACT || 'qa/accessibility-keyboard-production-guest-2026-05-21/summary.json'
const designSystemPath = process.env.QA_DESIGN_SYSTEM_READINESS || process.env.QA_LAUNCH_DESIGN_SYSTEM_ARTIFACT || 'qa/design-system-readiness-2026-05-22.json'
const responsiveVisualArtifactPath = process.env.QA_LAUNCH_VISUAL_ARTIFACT || 'qa/visual-baseline-2026-05-22-full-with-pricing-local/summary.json'
const plannerActualsPath = process.env.QA_PLANNER_ACTUALS_ARTIFACT || process.env.QA_LAUNCH_PLANNER_ACTUALS_ARTIFACT || 'qa/release-candidate-full-with-multi-planner-2026-05-21/planner-generated-actuals-regional-edge-cities.json'
const publicShareMapIntegrityPath = process.env.QA_PUBLIC_SHARE_MAP_INTEGRITY_ARTIFACT ||
  process.env.QA_LAUNCH_PUBLIC_SHARE_MAP_INTEGRITY_ARTIFACT ||
  'qa/public-share-map-catalog-2026-05-22.json'
const publicMetadataPath = process.env.QA_PUBLIC_METADATA_ARTIFACT ||
  process.env.QA_LAUNCH_PUBLIC_METADATA_ARTIFACT ||
  'qa/public-metadata-smoke-2026-05-22.json'
const releaseCandidatePath = process.env.QA_RELEASE_CANDIDATE_ARTIFACT || process.env.QA_LAUNCH_RELEASE_ARTIFACT || 'qa/release-candidate-full-with-multi-planner-2026-05-21/summary.json'
const routeInventoryPath = process.env.QA_ROUTE_INVENTORY_ARTIFACT || process.env.QA_LAUNCH_ROUTE_INVENTORY_ARTIFACT || 'qa/route-inventory-smoke-2026-05-22.json'
const appSurfacesPath = process.env.QA_APP_SURFACES_ARTIFACT || process.env.QA_LAUNCH_APP_SURFACES_ARTIFACT || 'qa/app-surfaces-smoke-2026-05-22.json'
const productionAppSurfacesPath = process.env.QA_PRODUCTION_APP_SURFACES_ARTIFACT ||
  process.env.QA_LAUNCH_PRODUCTION_APP_SURFACES_ARTIFACT ||
  'qa/app-surfaces-production-guest-2026-05-22.json'
const blockerBoardPath = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD || 'qa/public-launch-blocker-board-2026-05-21.json'
const blockerBoardReportPath = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD_REPORT || 'qa/public-launch-blocker-board-2026-05-21.md'
const blockerBoardCsvPath = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD_CSV || 'qa/public-launch-blocker-board-2026-05-21.csv'
const launchOperatorTodayPath = process.env.QA_LAUNCH_OPERATOR_TODAY || 'qa/launch-operator-today-2026-05-22.json'
const launchOperatorTodayReportPath = process.env.QA_LAUNCH_OPERATOR_TODAY_REPORT || 'qa/launch-operator-today-2026-05-22.md'
const launchOperatorTodayCsvPath = process.env.QA_LAUNCH_OPERATOR_TODAY_CSV || 'qa/launch-operator-today-2026-05-22.csv'
const launchOperatorTodayOverdueRehearsalPath = process.env.QA_LAUNCH_OPERATOR_TODAY_OVERDUE_REHEARSAL ||
  'qa/launch-operator-today-overdue-rehearsal-2026-05-22.json'
const launchOperatorTodayOverdueRehearsalReportPath = process.env.QA_LAUNCH_OPERATOR_TODAY_OVERDUE_REHEARSAL_REPORT ||
  'qa/launch-operator-today-overdue-rehearsal-2026-05-22.md'
const launchOperatorSentDispatchRehearsalPath = process.env.QA_LAUNCH_OPERATOR_SENT_DISPATCH_REHEARSAL ||
  'qa/launch-operator-sent-dispatch-rehearsal-2026-05-22.json'
const launchOperatorSentDispatchRehearsalReportPath = process.env.QA_LAUNCH_OPERATOR_SENT_DISPATCH_REHEARSAL_REPORT ||
  'qa/launch-operator-sent-dispatch-rehearsal-2026-05-22.md'
const dispatchMarkSentDryRunPath = process.env.QA_DISPATCH_MARK_SENT_DRY_RUN ||
  'qa/dispatch-log-mark-sent-2026-05-22.json'
const dispatchMarkSentDryRunReportPath = process.env.QA_DISPATCH_MARK_SENT_DRY_RUN_REPORT ||
  'qa/dispatch-log-mark-sent-2026-05-22.md'
const dispatchMarkSentImportRehearsalPath = process.env.QA_DISPATCH_MARK_SENT_IMPORT_REHEARSAL ||
  'qa/dispatch-log-mark-sent-import-rehearsal-2026-05-22.json'
const dispatchMarkSentImportRehearsalReportPath = process.env.QA_DISPATCH_MARK_SENT_IMPORT_REHEARSAL_REPORT ||
  'qa/dispatch-log-mark-sent-import-rehearsal-2026-05-22.md'
const dispatchSentRecordTemplatePath = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE ||
  'qa/dispatch-sent-record-template-2026-05-22.json'
const dispatchSentRecordTemplateReportPath = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_REPORT ||
  'qa/dispatch-sent-record-template-2026-05-22.md'
const dispatchSentRecordTemplateCsvPath = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_CSV ||
  'qa/dispatch-sent-record-template-2026-05-22.csv'
const dispatchSentRecordTemplateRejectionPath = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_REJECTION ||
  'qa/dispatch-sent-record-template-rejection-2026-05-22.json'
const dispatchSentRecordTemplateRejectionReportPath = process.env.QA_DISPATCH_SENT_RECORD_TEMPLATE_REJECTION_REPORT ||
  'qa/dispatch-sent-record-template-rejection-2026-05-22.md'
const reviewIntakeRehearsalPath = process.env.QA_REVIEW_INTAKE_REHEARSAL ||
  'qa/review-intake-rehearsal-2026-05-22.json'
const reviewIntakeRehearsalReportPath = process.env.QA_REVIEW_INTAKE_REHEARSAL_REPORT ||
  'qa/review-intake-rehearsal-2026-05-22.md'
const reviewIntakeImportRehearsalPath = process.env.QA_REVIEW_INTAKE_IMPORT_REHEARSAL ||
  'qa/review-intake-import-rehearsal-2026-05-22.json'
const reviewIntakeImportRehearsalReportPath = process.env.QA_REVIEW_INTAKE_IMPORT_REHEARSAL_REPORT ||
  'qa/review-intake-import-rehearsal-2026-05-22.md'
const publicLaunchModeRehearsalPath = process.env.QA_PUBLIC_LAUNCH_MODE_REHEARSAL ||
  'qa/public-launch-mode-rehearsal-2026-05-22.json'
const publicLaunchModeRehearsalReportPath = process.env.QA_PUBLIC_LAUNCH_MODE_REHEARSAL_REPORT ||
  'qa/public-launch-mode-rehearsal-2026-05-22.md'
const publicLaunchThresholdRehearsalPath = process.env.QA_PUBLIC_LAUNCH_THRESHOLD_REHEARSAL ||
  'qa/public-launch-threshold-rehearsal-2026-05-22.json'
const publicLaunchThresholdRehearsalReportPath = process.env.QA_PUBLIC_LAUNCH_THRESHOLD_REHEARSAL_REPORT ||
  'qa/public-launch-threshold-rehearsal-2026-05-22.md'

const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])
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
const requiredBetaPacketEvidenceFields = [
  'reviewerRole',
  'routeOrShareUrl',
  'viewport',
  'device',
  'completedAt',
  'firstMinuteOutcome',
  'mapTrustNotes',
  'shareFeedbackOutcome',
  'findings',
]
const requiredMonitoringSignals = [
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
const requiredMonitoringAlertMarkers = [
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
const requiredMonitoringRunbookMarkers = [
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
]
const requiredPaidPathTasks = [
  'local commercial smoke',
  'billing recovery smoke',
  'Stripe test-mode readiness',
  'hosted Stripe checkout browser QA',
  'hosted Stripe billing portal browser QA',
]
const requiredStripeScreenshots = [
  'qa/stripe-checkout-browser-full-with-multi-planner-2026-05-21/screenshots/stripe-checkout-loaded.png',
  'qa/stripe-checkout-browser-full-with-multi-planner-2026-05-21/screenshots/stripe-checkout-filled.png',
  'qa/stripe-checkout-browser-full-with-multi-planner-2026-05-21/screenshots/stripe-checkout-returned.png',
  'qa/stripe-portal-browser-full-with-multi-planner-2026-05-21/screenshots/stripe-portal-loaded.png',
  'qa/stripe-portal-browser-full-with-multi-planner-2026-05-21/screenshots/stripe-portal-returned.png',
]
const requiredAccessibilityRoutes = [
  'landing',
  'planner',
  'saved-trips',
  'account-profile',
  'account-billing',
  'pricing',
  'trips-index-compat',
  'new-trip-compat',
  'login',
  'signup',
  'public-share',
]
const requiredAccessibilityProtectedRoutes = [
  'planner',
  'saved-trips',
  'account-profile',
  'account-billing',
  'trips-index-compat',
  'new-trip-compat',
]
const requiredAccessibilityViewports = [
  'phone',
  'desktop',
]
const requiredAccessibilityCheckCount =
  requiredAccessibilityRoutes.length * requiredAccessibilityViewports.length
const requiredDesignSystemChecks = [
  'design context documents users, tone, aesthetic, and principles',
  'global design tokens expose the Globe.travel atmosphere palette and interaction system',
  'shared UI primitives exist for core forms and controls',
  'atmosphere component vocabulary exists for editorial travel surfaces',
  'production UI and API source has no debug console.log calls',
  'production UI source has no placeholder TODO or lorem copy',
  'user-facing copy avoids generic AI-travel marketing filler',
  'production UI source has no stale Globe.travel brand labels',
  'responsive visual QA covers every design-critical public and protected route',
  'responsive visual QA has no polish blockers',
  'production visual QA covers public acquisition and sharing surfaces',
]
const requiredPlannerActualIds = [
  'istanbul-4-day-history-markets',
  'seoul-5-day-food-shopping',
  'bangkok-4-day-temples-street-food',
  'marrakech-3-day-markets-riads',
  'cape-town-5-day-outdoors-food',
  'sydney-4-day-beaches-neighborhoods',
]
const requiredPublicMetadataChecks = [
  'root-html',
  'manifest',
  'robots',
  'sitemap',
  'opengraph-image',
  'twitter-image',
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
const requiredReleaseFlags = [
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
const buildSkipSafePatterns = [
  /^\.github\/workflows\//,
  /^client\/scripts\/platform-[^/]+\.mjs$/,
  /^client\/scripts\/vercel-ignore-build\.mjs$/,
  /^qa\//,
  /^README\.md$/,
  /^OPERATIONS_RUNBOOK\.md$/,
  /^PLATFORM_[A-Z0-9_]+\.md$/,
  /^RELEASE_READINESS_MEMO\.md$/,
]
const visualReviewTemplateProductionCommitPlaceholder = 'replace-with-live-production-commit'
const visualReviewTemplateDeploymentUrlPlaceholder = 'replace-with-live-production-deployment-url'

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

function runGit(args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function hasRevision(revision) {
  if (!revision) return false
  try {
    runGit(['rev-parse', '--verify', `${revision}^{commit}`])
    return true
  } catch {
    return false
  }
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function readJsonAt(revision, file) {
  try {
    return JSON.parse(runGit(['show', `${revision}:${file}`]))
  } catch {
    return null
  }
}

function withoutQaScripts(pkg) {
  if (!pkg || typeof pkg !== 'object') return pkg
  const copy = { ...pkg }
  const scripts = copy.scripts && typeof copy.scripts === 'object' ? copy.scripts : null
  if (scripts) {
    copy.scripts = Object.fromEntries(
      Object.entries(scripts).filter(([name]) => !String(name).startsWith('qa:')),
    )
  }
  return copy
}

function isQaScriptsOnlyPackageChange(file, base, head) {
  if (file !== 'client/package.json') return false
  const before = readJsonAt(base, file)
  const after = readJsonAt(head, file)
  return stableJson(withoutQaScripts(before)) === stableJson(withoutQaScripts(after))
}

function unsafeFilesBetween(base, head) {
  let changedFiles = []
  try {
    changedFiles = runGit(['diff', '--name-only', '--diff-filter=ACMRT', base, head])
      .split('\n')
      .map((file) => file.trim())
      .filter(Boolean)
  } catch {
    return []
  }

  return changedFiles.filter((file) => (
    !buildSkipSafePatterns.some((pattern) => pattern.test(file)) &&
    !isQaScriptsOnlyPackageChange(file, base, head)
  ))
}

function inspectRuntimeDeploymentCurrency(liveCommit) {
  const liveCommitKnown = hasRevision(liveCommit)
  const result = {
    enforced: enforceRuntimeDeploymentCurrency,
    head: liveCommit || runGit(['rev-parse', 'HEAD']),
    shortHead: liveCommit ? String(liveCommit).slice(0, 7) : runGit(['rev-parse', '--short=7', 'HEAD']),
    liveCommit: liveCommit || null,
    liveCommitKnown,
    liveCommitIsAncestor: false,
    runtimeCommitAhead: false,
    latestRuntimeCommit: null,
    latestRuntimeCommitShort: null,
    runtimeCommitCountAhead: 0,
    runtimeUnsafeFiles: [],
    error: null,
  }

  if (!enforceRuntimeDeploymentCurrency || !liveCommit) return result
  if (!result.liveCommitKnown) {
    result.error = 'live production commit is not present in local git history'
    return result
  }

  try {
    runGit(['merge-base', '--is-ancestor', liveCommit, 'HEAD'])
    result.liveCommitIsAncestor = true
  } catch {
    result.error = 'live production commit is not an ancestor of HEAD'
    return result
  }

  const commits = runGit(['rev-list', '--reverse', `${liveCommit}..HEAD`])
    .split('\n')
    .map((commit) => commit.trim())
    .filter(Boolean)

  for (const commit of commits) {
    const files = unsafeFilesBetween(`${commit}^`, commit)
    if (files.length === 0) continue
    result.runtimeCommitAhead = true
    result.latestRuntimeCommit = commit
    result.latestRuntimeCommitShort = runGit(['rev-parse', '--short=7', commit])
    result.runtimeCommitCountAhead += 1
    for (const file of files) {
      if (!result.runtimeUnsafeFiles.includes(file)) result.runtimeUnsafeFiles.push(file)
    }
  }

  if (result.latestRuntimeCommit) {
    result.head = result.latestRuntimeCommit
    result.shortHead = result.latestRuntimeCommitShort
  }

  result.runtimeUnsafeFiles = result.runtimeUnsafeFiles.slice(0, 12)
  return result
}

async function exists(path) {
  try {
    await access(repoPath(path))
    return true
  } catch {
    return false
  }
}

function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

function daysBetween(startDate, endDate) {
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return Math.round((end - start) / 86400000)
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function missingFrom(actual, expected) {
  const actualSet = new Set(Array.isArray(actual) ? actual : [])
  return expected.filter((item) => !actualSet.has(item))
}

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
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

function distanceKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function hasGeographicOutlier(day) {
  const stops = (Array.isArray(day.mappedStops) ? day.mappedStops : [])
    .map((stop) => ({
      title: stop.title,
      type: stop.type,
      latitude: Number(stop.latitude),
      longitude: Number(stop.longitude),
    }))
    .filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude))
  const allowsLongTransfer = /train|flight|ferry|transfer|drive|road trip/i.test(`${day.title || ''} ${stops.map((stop) => stop.type).join(' ')}`)

  if (allowsLongTransfer || stops.length < 3) return false

  return stops.some((stop, index) => {
    const nearestKm = Math.min(...stops
      .filter((_, otherIndex) => otherIndex !== index)
      .map((otherStop) => distanceKm(stop, otherStop)))
    return nearestKm > 150
  })
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
    !hasGeographicOutlier(day) &&
    countries.length > 0 &&
    (!expected || countries.every((country) => normalizeCountry(country) === expected))
  )
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function urlOrigin(value) {
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

async function readableText(path) {
  try {
    return { ok: true, text: await readText(path), error: null }
  } catch (error) {
    return {
      ok: false,
      text: '',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function readableJson(path) {
  try {
    return { ok: true, json: await readJson(path), error: null }
  } catch (error) {
    return {
      ok: false,
      json: null,
      error: error instanceof Error ? error.message : String(error),
    }
  }
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

function betaPacketMarkdownIssues(text, packet) {
  const issues = []
  const body = String(text || '')
  const requiredStrings = [
    packet.id,
    packet.destination,
    packet.audience,
    packet.style,
    packet.region,
    packet.device,
    packet.viewport,
    packet.sourceActualId,
    packet.startUrl,
    packet.prompt,
    packet.submissionTemplatePath,
    'Public launch is blocked by any unresolved P0/P1 finding',
  ].filter(Boolean)

  for (const value of requiredStrings) {
    if (!body.includes(value)) issues.push(`packet markdown missing ${value}`)
  }
  for (const surface of packet.surfaces || []) {
    if (!body.includes(`- [ ] ${surface}:`)) issues.push(`packet markdown missing surface task ${surface}`)
  }
  for (const field of requiredBetaReviewScorecardFields) {
    if (!body.includes(`- [ ] ${field}`)) issues.push(`packet markdown missing scorecard field ${field}`)
  }
  for (const field of requiredBetaPacketEvidenceFields) {
    if (!body.includes(`- [ ] ${field}`)) issues.push(`packet markdown missing evidence field ${field}`)
  }

  return issues
}

const [
  betaRegister,
  betaPacketManifest,
  betaSchedule,
  betaScheduleReport,
  betaCommandCenter,
  betaCommandCenterReport,
  betaNextWaveOps,
  betaNextWaveOpsReport,
  betaNextWaveOpsCsv,
  betaDispatchOutbox,
  betaDispatchOutboxReport,
  betaDispatchOutboxCsv,
  betaDispatchLog,
  betaDispatchLogReport,
  betaDispatchLogCsv,
  betaFollowUpOutbox,
  betaFollowUpOutboxReport,
  betaFollowUpOutboxCsv,
  betaAllWaveOps,
  betaAllWaveOpsReport,
  betaAllWaveOpsCsv,
  betaWaveRehearsal,
  betaMatrixRehearsal,
  betaGuestStartRehearsal,
  betaProgress,
  betaIntake,
  visualRegister,
  visualIntake,
  visualProgress,
  visualScheduleReport,
  visualDispatchOutbox,
  visualDispatchOutboxReport,
  visualDispatchOutboxCsv,
  visualDispatchLog,
  visualDispatchLogReport,
  visualDispatchLogCsv,
  monitoringRegister,
  rollbackPlan,
  riskRegister,
  paidPathReadiness,
  accessibility,
  designSystem,
  plannerActuals,
  publicShareMapIntegrity,
  publicMetadataRead,
  releaseCandidate,
  routeInventory,
  appSurfaces,
  productionAppSurfaces,
  blockerBoard,
  blockerBoardReport,
  blockerBoardCsv,
  launchOperatorToday,
  launchOperatorTodayReport,
  launchOperatorTodayCsv,
  launchOperatorTodayOverdueRehearsal,
  launchOperatorTodayOverdueRehearsalReport,
  launchOperatorSentDispatchRehearsal,
  launchOperatorSentDispatchRehearsalReport,
  dispatchMarkSentDryRun,
  dispatchMarkSentDryRunReport,
  dispatchMarkSentImportRehearsal,
  dispatchMarkSentImportRehearsalReport,
  dispatchSentRecordTemplate,
  dispatchSentRecordTemplateReport,
  dispatchSentRecordTemplateCsv,
  dispatchSentRecordTemplateRejection,
  dispatchSentRecordTemplateRejectionReport,
  reviewIntakeRehearsal,
  reviewIntakeRehearsalReport,
  reviewIntakeImportRehearsal,
  reviewIntakeImportRehearsalReport,
  publicLaunchModeRehearsal,
  publicLaunchModeRehearsalReport,
  publicLaunchThresholdRehearsal,
  publicLaunchThresholdRehearsalReport,
  health,
] = await Promise.all([
  readJson(betaRegisterPath),
  readJson(betaPacketManifestPath),
  readJson(betaSchedulePath),
  readText(betaScheduleReportPath),
  readJson(betaCommandCenterPath),
  readText(betaCommandCenterReportPath),
  readJson(betaNextWaveOpsPath),
  readText(betaNextWaveOpsReportPath),
  readText(betaNextWaveOpsCsvPath),
  readJson(betaDispatchOutboxPath),
  readText(betaDispatchOutboxReportPath),
  readText(betaDispatchOutboxCsvPath),
  readJson(betaDispatchLogPath),
  readText(betaDispatchLogReportPath),
  readText(betaDispatchLogCsvPath),
  readJson(betaFollowUpOutboxPath),
  readText(betaFollowUpOutboxReportPath),
  readText(betaFollowUpOutboxCsvPath),
  readJson(betaAllWaveOpsPath),
  readText(betaAllWaveOpsReportPath),
  readText(betaAllWaveOpsCsvPath),
  readJson(betaWaveRehearsalPath),
  readJson(betaMatrixRehearsalPath),
  readJson(betaGuestStartRehearsalPath),
  readJson(betaProgressPath),
  readJson(betaIntakePath),
  readJson(visualRegisterPath),
  readJson(visualIntakePath),
  readJson(visualProgressPath),
  readText(visualSchedulePath),
  readJson(visualDispatchOutboxPath),
  readText(visualDispatchOutboxReportPath),
  readText(visualDispatchOutboxCsvPath),
  readJson(visualDispatchLogPath),
  readText(visualDispatchLogReportPath),
  readText(visualDispatchLogCsvPath),
  readJson(monitoringRegisterPath),
  readJson(rollbackPath),
  readJson(riskRegisterPath),
  readJson(paidPathReadinessPath),
  readJson(accessibilityPath),
  readJson(designSystemPath),
  readJson(plannerActualsPath),
  readJson(publicShareMapIntegrityPath),
  readableJson(publicMetadataPath),
  readJson(releaseCandidatePath),
  readJson(routeInventoryPath),
  readJson(appSurfacesPath),
  readJson(productionAppSurfacesPath),
  readJson(blockerBoardPath),
  readText(blockerBoardReportPath),
  readText(blockerBoardCsvPath),
  readJson(launchOperatorTodayPath),
  readText(launchOperatorTodayReportPath),
  readText(launchOperatorTodayCsvPath),
  readJson(launchOperatorTodayOverdueRehearsalPath),
  readText(launchOperatorTodayOverdueRehearsalReportPath),
  readJson(launchOperatorSentDispatchRehearsalPath),
  readText(launchOperatorSentDispatchRehearsalReportPath),
  readJson(dispatchMarkSentDryRunPath),
  readText(dispatchMarkSentDryRunReportPath),
  readJson(dispatchMarkSentImportRehearsalPath),
  readText(dispatchMarkSentImportRehearsalReportPath),
  readJson(dispatchSentRecordTemplatePath),
  readText(dispatchSentRecordTemplateReportPath),
  readText(dispatchSentRecordTemplateCsvPath),
  readJson(dispatchSentRecordTemplateRejectionPath),
  readText(dispatchSentRecordTemplateRejectionReportPath),
  readJson(reviewIntakeRehearsalPath),
  readText(reviewIntakeRehearsalReportPath),
  readJson(reviewIntakeImportRehearsalPath),
  readText(reviewIntakeImportRehearsalReportPath),
  readJson(publicLaunchModeRehearsalPath),
  readText(publicLaunchModeRehearsalReportPath),
  readJson(publicLaunchThresholdRehearsalPath),
  readText(publicLaunchThresholdRehearsalReportPath),
  fetchHealth(),
])

const publicMetadata = publicMetadataRead.json || {}
const publicMetadataPresent = publicMetadataRead.ok
const plannedBetaReviews = Array.isArray(betaRegister.plannedReviews) ? betaRegister.plannedReviews : []
const completedBetaReviews = plannedBetaReviews.filter((review) => completedStatuses.has(review.status))
const publicBetaMinimum = Number(betaRegister.minimumCompletedReviewsForPublicLaunch) || 25
const betaRemaining = Math.max(0, publicBetaMinimum - completedBetaReviews.length)
const plannedBetaIds = plannedBetaReviews.map((review) => review.id).filter(Boolean)
const betaPacketRecords = Array.isArray(betaPacketManifest.packets) ? betaPacketManifest.packets : []
const betaPacketIds = betaPacketRecords.map((packet) => packet.id).filter(Boolean)
const expectedBetaReviewOrigin = urlOrigin(betaRegister.baseUrl || baseUrl)
const statusOrigin = urlOrigin(baseUrl)

const visualHistory = Array.isArray(visualRegister.reviewHistory) ? visualRegister.reviewHistory : []
const visualHistoryDates = unique(visualHistory.map((review) => dateOnly(review.reviewedAt)))
const visualMinimum = Number(visualRegister.minimumPublicLaunchReviewHistory) || 4
const visualRemaining = Math.max(0, visualMinimum - visualHistoryDates.length)
const scheduledVisualReviews = Array.isArray(visualRegister.scheduledPublicLaunchReviews)
  ? visualRegister.scheduledPublicLaunchReviews
  : []

const liveDeployment = health.body?.deployment || null
const deploymentCurrency = inspectRuntimeDeploymentCurrency(liveDeployment?.commit)
const today = currentQaDate()
const date = requestedDate ||
  dateOnly(betaRegister.reviewedAt) ||
  dateOnly(visualRegister.reviewedAt) ||
  dateOnly(monitoringRegister.reviewedAt) ||
  dateOnly(rollbackPlan.reviewedAt) ||
  dateOnly(riskRegister.reviewedAt) ||
  today
const jsonArtifact = process.env.QA_PUBLIC_LAUNCH_STATUS_JSON || `public-launch-status-${date}.json`
const reportArtifact = process.env.QA_PUBLIC_LAUNCH_STATUS_REPORT || `public-launch-status-${date}.md`
const betaAssignmentCsvPath = betaPacketManifest.assignmentCsv || `qa/beta-human-review-assignments-${date}.csv`
const betaAssignmentReportPath = betaPacketManifest.assignmentReport || `qa/beta-human-review-assignments-${date}.md`
const betaScheduleCsvPath = betaSchedule.assignmentCsv || betaRegister.reviewScheduleCsv || `qa/beta-human-review-schedule-assignments-${date}.csv`
const visualSubmissionDir = visualRegister.reviewSubmissionDirectory || `qa/production-visual-review-submissions-${date}`
const visualAssignmentCsvPath = visualRegister.reviewAssignmentCsv || `qa/production-visual-review-assignments-${date}.csv`
const visualAssignmentReportPath = visualRegister.reviewAssignmentReport || `qa/production-visual-review-assignments-${date}.md`

const [
  betaAssignmentCsv,
  betaAssignmentReport,
  betaScheduleCsv,
  visualAssignmentCsv,
  visualAssignmentReport,
  betaPacketFileChecks,
  betaSubmissionTemplateChecks,
  visualSubmissionTemplateChecks,
] = await Promise.all([
  readableText(betaAssignmentCsvPath),
  readableText(betaAssignmentReportPath),
  readableText(betaScheduleCsvPath),
  readableText(visualAssignmentCsvPath),
  readableText(visualAssignmentReportPath),
  Promise.all(betaPacketRecords.map(async (packet) => ({
    id: packet.id || null,
    packet,
    path: packet.packetPath || null,
    ...(await readableText(packet.packetPath || '')),
  }))),
  Promise.all(betaPacketRecords.map(async (packet) => ({
    id: packet.id || null,
    packet,
    path: packet.submissionTemplatePath || null,
    ...(await readableJson(packet.submissionTemplatePath || '')),
  }))),
  Promise.all(scheduledVisualReviews.map(async (review) => {
    const templatePath = `${visualSubmissionDir}/${review.id}.template.json`
    return {
      id: review.id || null,
      path: templatePath,
      expectedDueAt: dateOnly(review.dueAt),
      expectedArtifact: review.expectedArtifactPrefix,
      expectedRoutes: Array.isArray(review.routes) ? review.routes : [],
      expectedViewports: Array.isArray(review.viewports) ? review.viewports : [],
      expectedDiffRoutes: Array.isArray(review.diffRoutes) ? review.diffRoutes : [],
      ...(await readableJson(templatePath)),
    }
  })),
])

const monitoringMonitors = Array.isArray(monitoringRegister.monitors) ? monitoringRegister.monitors : []
const coveredMonitoringSignals = unique(monitoringMonitors.flatMap((monitor) => (
  Array.isArray(monitor.signals) ? monitor.signals : []
)))
const missingMonitoringSignals = missingFrom(coveredMonitoringSignals, requiredMonitoringSignals)
const monitoringWorkflowChecks = await Promise.all(monitoringMonitors
  .filter((monitor) => monitor.kind === 'github-actions')
  .map(async (monitor) => {
    const workflow = await readableText(monitor.workflowFile || '')
    const workflowText = workflow.text || ''
    const lowerWorkflowText = workflowText.toLowerCase()
    const missingMarkers = (Array.isArray(monitor.commandMarkers) ? monitor.commandMarkers : [])
      .filter((marker) => !lowerWorkflowText.includes(String(marker).toLowerCase()))
    return {
      id: monitor.id || null,
      workflowFile: monitor.workflowFile || null,
      readable: workflow.ok,
      hasSchedule: /^  schedule:/m.test(workflowText) || /\n  schedule:\n/m.test(workflowText),
      missingMarkers,
      error: workflow.error,
    }
  }))
const monitoringWorkflowIssues = monitoringWorkflowChecks
  .filter((workflow) => !workflow.readable || !workflow.hasSchedule || workflow.missingMarkers.length > 0)
const monitoringAlertText = JSON.stringify(monitoringRegister.alertPolicy || {}).toLowerCase()
const missingMonitoringAlertMarkers = requiredMonitoringAlertMarkers
  .filter((marker) => !monitoringAlertText.includes(marker.toLowerCase()))
const monitoringFirstResponseSteps = Array.isArray(monitoringRegister.alertPolicy?.firstResponseSteps)
  ? monitoringRegister.alertPolicy.firstResponseSteps
  : []
const monitoringAlertReady =
  hasText(monitoringRegister.alertPolicy?.owner) &&
  Array.isArray(monitoringRegister.alertPolicy?.triggers) &&
  monitoringRegister.alertPolicy.triggers.length >= requiredMonitoringAlertMarkers.length &&
  missingMonitoringAlertMarkers.length === 0 &&
  monitoringFirstResponseSteps.length >= 5
const monitoringRunbook = await readableText('OPERATIONS_RUNBOOK.md')
const missingMonitoringRunbookMarkers = requiredMonitoringRunbookMarkers
  .filter((marker) => !monitoringRunbook.text.includes(marker))
const monitoringLatestVerificationText = JSON.stringify(monitoringRegister.latestVerification || {}).toLowerCase()
const monitoringLatestVerificationReady =
  monitoringLatestVerificationText.includes('qa:production-monitoring') &&
  monitoringLatestVerificationText.includes('qa:release-production') &&
  monitoringLatestVerificationText.includes('qa:launch-signoff') &&
  monitoringRegister.latestVerification?.expectedLiveCommit === liveDeployment?.commit
const missingPaidPathTasks = missingFrom(paidPathReadiness.requiredReleaseTasks, requiredPaidPathTasks)
const paidPathScreenshotChecks = await Promise.all(requiredStripeScreenshots.map(async (path) => ({
  path,
  exists: await exists(path),
})))
const missingPaidPathScreenshots = paidPathScreenshotChecks
  .filter((screenshot) => !screenshot.exists)
  .map((screenshot) => screenshot.path)
const paidPathReady =
  paidPathReadiness.status === 'pass' &&
  Number(paidPathReadiness.checked) >= 6 &&
  Number(paidPathReadiness.failed) === 0 &&
  missingPaidPathTasks.length === 0 &&
  Number(paidPathReadiness.screenshotCount) >= requiredStripeScreenshots.length &&
  missingPaidPathScreenshots.length === 0
const accessibilityViewportIds = Array.isArray(accessibility.viewports)
  ? accessibility.viewports.map((viewport) => viewport.id).filter(Boolean)
  : []
const missingAccessibilityRoutes = missingFrom(accessibility.routes, requiredAccessibilityRoutes)
const missingAccessibilityProtectedRoutes = missingFrom(accessibility.auth?.protectedRoutes, requiredAccessibilityProtectedRoutes)
const missingAccessibilityViewports = missingFrom(accessibilityViewportIds, requiredAccessibilityViewports)
const blockingAccessibilityResults = Array.isArray(accessibility.results)
  ? accessibility.results.filter((result) => (
    result.ok === false ||
    (Array.isArray(result.missingMarkers) && result.missingMarkers.length > 0) ||
    (Array.isArray(result.structureIssues) && result.structureIssues.length > 0) ||
    (Array.isArray(result.axe?.blockingViolations) && result.axe.blockingViolations.length > 0) ||
    (Array.isArray(result.keyboard?.issues) && result.keyboard.issues.length > 0)
  ))
  : []
const accessibilityGuestAuthReady =
  accessibility.auth?.mode === 'guest' &&
  missingAccessibilityProtectedRoutes.length === 0 &&
  accessibility.auth?.cleanup?.attempted === true &&
  accessibility.auth?.cleanup?.profileDeleted === true &&
  accessibility.auth?.cleanup?.userDeleted === true &&
  !accessibility.auth?.cleanup?.error
const accessibilityReady =
  Number(accessibility.checked) === requiredAccessibilityCheckCount &&
  Number(accessibility.passed) === requiredAccessibilityCheckCount &&
  Number(accessibility.failed) === 0 &&
  (Array.isArray(accessibility.results) ? accessibility.results.length : 0) === requiredAccessibilityCheckCount &&
  missingAccessibilityRoutes.length === 0 &&
  missingAccessibilityProtectedRoutes.length === 0 &&
  missingAccessibilityViewports.length === 0 &&
  blockingAccessibilityResults.length === 0 &&
  accessibilityGuestAuthReady
const designSystemCheckNames = Array.isArray(designSystem.checks)
  ? designSystem.checks.map((check) => check.name).filter(Boolean)
  : []
const missingDesignSystemChecks = missingFrom(designSystemCheckNames, requiredDesignSystemChecks)
const failedDesignSystemChecks = Array.isArray(designSystem.checks)
  ? designSystem.checks.filter((check) => check.ok === false).map((check) => check.name)
  : []
const expectedDesignSystemProductionVisualArtifact = visualRegister.latestProductionReview?.summaryArtifact || ''
const designSystemVisualEvidenceReady =
  designSystem.responsiveVisualArtifact === responsiveVisualArtifactPath &&
  hasText(expectedDesignSystemProductionVisualArtifact) &&
  designSystem.productionVisualArtifact === expectedDesignSystemProductionVisualArtifact &&
  Array.isArray(designSystem.failures) &&
  designSystem.failures.length === 0
const designSystemReady =
  Number(designSystem.checked) === requiredDesignSystemChecks.length &&
  Number(designSystem.passed) === requiredDesignSystemChecks.length &&
  Number(designSystem.failed) === 0 &&
  missingDesignSystemChecks.length === 0 &&
  failedDesignSystemChecks.length === 0 &&
  designSystemVisualEvidenceReady
const plannerActualIds = Array.isArray(plannerActuals)
  ? plannerActuals.map((actual) => actual.id).filter(Boolean)
  : []
const missingPlannerActualIds = missingFrom(plannerActualIds, requiredPlannerActualIds)
const badPlannerActuals = Array.isArray(plannerActuals)
  ? plannerActuals.filter((actual) => {
    const days = Array.isArray(actual.days) ? actual.days : []
    return days.length === 0 || days.some((day) => !dayHasMapTrust(day))
  })
  : []
const plannerActualsReady =
  Array.isArray(plannerActuals) &&
  missingPlannerActualIds.length === 0 &&
  badPlannerActuals.length === 0
const publicShareMapIntegrityIssues = []
const publicShareMapResults = Array.isArray(publicShareMapIntegrity.shareResults) ? publicShareMapIntegrity.shareResults : []
const publicShareMapSlugs = Array.isArray(publicShareMapIntegrity.shareSlugs) ? publicShareMapIntegrity.shareSlugs : []
const publicShareMapFailures = Array.isArray(publicShareMapIntegrity.failures) ? publicShareMapIntegrity.failures : []
const publicShareMapDiscovery = publicShareMapIntegrity.discovery || {}
const publicShareMapDiscoveredShares = Array.isArray(publicShareMapDiscovery.shares) ? publicShareMapDiscovery.shares : []
const badPublicShareMapResults = publicShareMapResults.filter((result) => result.ok !== true)
const badPublicShareMapRenderedResults = publicShareMapResults.flatMap((result) => (
  Array.isArray(result.rendered)
    ? result.rendered
      .filter((rendered) => rendered.ok !== true)
      .map((rendered) => `${result.shareSlug || 'unknown'}:${rendered.viewport || 'unknown'}`)
    : [`${result.shareSlug || 'unknown'}:missing rendered results`]
))
const badPublicShareMapDays = publicShareMapResults.flatMap((result) => (
  Array.isArray(result.dayIntegrity)
    ? result.dayIntegrity
      .filter((day) => day.ok !== true)
      .map((day) => `${result.shareSlug || 'unknown'}:day ${day.dayIndex || 'unknown'}`)
    : [`${result.shareSlug || 'unknown'}:missing day integrity`]
))
const publicShareMapScreenshotChecks = await Promise.all(publicShareMapResults.flatMap((result) => (
  Array.isArray(result.rendered)
    ? result.rendered.map(async (rendered) => ({
      shareSlug: result.shareSlug || null,
      viewport: rendered.viewport || null,
      screenshot: rendered.screenshot || '',
      exists: hasText(rendered.screenshot) ? await exists(rendered.screenshot) : false,
    }))
    : []
)))
const missingPublicShareMapScreenshots = publicShareMapScreenshotChecks
  .filter((check) => !check.exists)
  .map((check) => `${check.shareSlug || 'unknown'}:${check.viewport || 'unknown'}:${check.screenshot || 'missing screenshot'}`)
if (publicShareMapIntegrity.baseUrl !== baseUrl) publicShareMapIntegrityIssues.push(`public share map integrity base URL ${publicShareMapIntegrity.baseUrl || 'missing'} does not match ${baseUrl}`)
if (!publicShareMapSlugs.includes('x3m2c8cnws')) publicShareMapIntegrityIssues.push('public share map integrity does not include stable Athens share x3m2c8cnws')
if (Number(publicShareMapIntegrity.checked) < 1) publicShareMapIntegrityIssues.push('public share map integrity did not check any shares')
if (publicShareMapDiscovery.enabled !== true) publicShareMapIntegrityIssues.push('public share map integrity did not discover the live public share catalog')
if (Number(publicShareMapDiscovery.totalPublicShares) < 1) publicShareMapIntegrityIssues.push('public share map integrity discovered no public shares')
if (Number(publicShareMapDiscovery.shareCount) !== publicShareMapDiscoveredShares.length) publicShareMapIntegrityIssues.push('public share map integrity discovery count does not match discovered shares')
if (Number(publicShareMapIntegrity.checked) < Number(publicShareMapDiscovery.totalPublicShares || 0)) publicShareMapIntegrityIssues.push('public share map integrity did not check every discovered public share')
if (publicShareMapSlugs.length !== publicShareMapDiscoveredShares.length) publicShareMapIntegrityIssues.push('public share map integrity checked share count does not match discovered public share count')
if (Number(publicShareMapIntegrity.passed) !== publicShareMapResults.length || Number(publicShareMapIntegrity.failed) !== 0 || publicShareMapFailures.length > 0) {
  publicShareMapIntegrityIssues.push('public share map integrity has failing share checks')
}
if (badPublicShareMapResults.length > 0) publicShareMapIntegrityIssues.push('public share map integrity has failing share results')
if (badPublicShareMapRenderedResults.length > 0) publicShareMapIntegrityIssues.push(`public share map integrity rendered failures: ${badPublicShareMapRenderedResults.join(', ')}`)
if (badPublicShareMapDays.length > 0) publicShareMapIntegrityIssues.push(`public share map integrity day failures: ${badPublicShareMapDays.join(', ')}`)
if (missingPublicShareMapScreenshots.length > 0) publicShareMapIntegrityIssues.push(`public share map integrity missing screenshots: ${missingPublicShareMapScreenshots.join(', ')}`)
const publicShareMapIntegrityReady = publicShareMapIntegrityIssues.length === 0
const publicMetadataResults = Array.isArray(publicMetadata.results) ? publicMetadata.results : []
const publicMetadataResultIds = publicMetadataResults.map((result) => result.id).filter(Boolean)
const missingPublicMetadataChecks = missingFrom(publicMetadataResultIds, requiredPublicMetadataChecks)
const failedPublicMetadataResults = publicMetadataResults.filter((result) => result.ok !== true)
const publicMetadataIssues = []
if (publicMetadataPresent && publicMetadata.baseUrl !== baseUrl) publicMetadataIssues.push(`public metadata base URL ${publicMetadata.baseUrl || 'missing'} does not match ${baseUrl}`)
if (publicMetadataPresent && publicMetadata.status !== 'pass') publicMetadataIssues.push('public metadata smoke is not passing')
if (publicMetadataPresent && Number(publicMetadata.checked) < requiredPublicMetadataChecks.length) publicMetadataIssues.push('public metadata smoke did not check every required metadata surface')
if (publicMetadataPresent && Number(publicMetadata.failed) !== 0) publicMetadataIssues.push('public metadata smoke has failing checks')
if (publicMetadataPresent && Number(publicMetadata.sourceMissingCount) !== 0) publicMetadataIssues.push('public metadata source files are missing')
if (publicMetadataPresent && missingPublicMetadataChecks.length > 0) publicMetadataIssues.push(`public metadata smoke is missing checks: ${missingPublicMetadataChecks.join(', ')}`)
if (publicMetadataPresent && failedPublicMetadataResults.length > 0) publicMetadataIssues.push(`public metadata smoke has failed results: ${failedPublicMetadataResults.map((result) => result.id || result.path || 'unknown').join(', ')}`)
const publicMetadataReady = publicMetadataPresent && publicMetadataIssues.length === 0
const releaseTaskNames = unique((Array.isArray(releaseCandidate.results) ? releaseCandidate.results : [])
  .map((result) => result.name)
  .filter(Boolean))
const missingReleaseTasks = missingFrom(releaseTaskNames, requiredReleaseTasks)
const failedReleaseTasks = (Array.isArray(releaseCandidate.results) ? releaseCandidate.results : [])
  .filter((result) => result.ok === false)
  .map((result) => result.name)
  .filter(Boolean)
const missingReleaseFlags = requiredReleaseFlags.filter((flag) => releaseCandidate[flag] !== true)
const releaseCandidateReady =
  Number(releaseCandidate.checked) === requiredReleaseTasks.length &&
  Number(releaseCandidate.passed) === requiredReleaseTasks.length &&
  Number(releaseCandidate.failed) === 0 &&
  missingReleaseFlags.length === 0 &&
  missingReleaseTasks.length === 0 &&
  failedReleaseTasks.length === 0
const requiredInventoryRoutes = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/callback',
  '/auth/callback-client',
  `/t/${routeInventory.shareSlug || 'x3m2c8cnws'}`,
  '/chat',
  '/explore',
  '/globe',
  '/map',
  '/bucket-list',
  '/journal',
  '/saved',
  '/account',
  '/account?tab=billing',
  '/pricing',
  '/profile',
  '/settings',
  '/trips',
  '/trips/new',
  '/onboarding',
]
const routeInventoryRoutes = Array.isArray(routeInventory.routes) ? routeInventory.routes : []
const routeInventoryPaths = routeInventoryRoutes.map((route) => route.path).filter(Boolean)
const missingInventoryRoutes = missingFrom(routeInventoryPaths, requiredInventoryRoutes)
const badInventoryRoutes = routeInventoryRoutes.filter((route) => route.ok !== true)
const routeInventoryIssues = [
  ...(routeInventory.status === 'pass' ? [] : ['route inventory status is not pass']),
  ...(routeInventory.baseUrl === baseUrl ? [] : [`route inventory baseUrl ${routeInventory.baseUrl || 'missing'} does not match ${baseUrl}`]),
  ...(Number(routeInventory.checked) >= requiredInventoryRoutes.length ? [] : [`route inventory checked ${routeInventory.checked ?? 'missing'} routes but expected at least ${requiredInventoryRoutes.length}`]),
  ...(Number(routeInventory.failed) === 0 ? [] : [`route inventory has ${routeInventory.failed ?? 'missing'} failed route(s)`]),
  ...(Number(routeInventory.sourceMissingCount) === 0 ? [] : [`route inventory has ${routeInventory.sourceMissingCount ?? 'missing'} missing source file(s)`]),
  ...missingInventoryRoutes.map((route) => `route inventory missing ${route}`),
  ...badInventoryRoutes.map((route) => `route inventory route ${route.path || 'unknown'} failed: ${(route.issues || []).join('; ') || 'unknown issue'}`),
]
const routeInventoryReady = routeInventoryIssues.length === 0
const requiredAppSurfaceRoutes = [
  'explore-alias',
  'globe-alias',
  'map-alias',
  'bucket-list-alias',
  'journal-alias',
  'profile-alias',
  'settings-alias',
  'pricing-alias',
  'trips-index-compat',
  'new-trip-compat',
  'onboarding-fullscreen',
]
const requiredAppSurfaceViewports = ['phone', 'desktop']
const appSurfaceResults = Array.isArray(appSurfaces.results) ? appSurfaces.results : []
const appSurfaceRouteIds = Array.isArray(appSurfaces.requiredRoutes)
  ? appSurfaces.requiredRoutes
  : unique(appSurfaceResults.map((result) => result.routeId))
const appSurfaceViewportIds = Array.isArray(appSurfaces.viewports)
  ? appSurfaces.viewports
  : unique(appSurfaceResults.map((result) => result.viewportId))
const missingAppSurfaceRoutes = missingFrom(appSurfaceRouteIds, requiredAppSurfaceRoutes)
const missingAppSurfaceViewports = missingFrom(appSurfaceViewportIds, requiredAppSurfaceViewports)
const badAppSurfaceResults = appSurfaceResults.filter((result) => result.ok !== true)
const expectedAppSurfaceChecks = requiredAppSurfaceRoutes.length * requiredAppSurfaceViewports.length
const appSurfaceIssues = [
  ...(appSurfaces.status === 'pass' ? [] : ['authenticated app surfaces status is not pass']),
  ...(appSurfaces.localOnly === true ? [] : ['authenticated app surfaces should run as a local guest-only gate by default']),
  ...(appSurfaces.auth?.mode === 'guest' ? [] : ['authenticated app surfaces did not run in guest auth mode']),
  ...(Number(appSurfaces.checked) >= expectedAppSurfaceChecks ? [] : [`authenticated app surfaces checked ${appSurfaces.checked ?? 'missing'} route/viewport pairs but expected at least ${expectedAppSurfaceChecks}`]),
  ...(Number(appSurfaces.failed) === 0 ? [] : [`authenticated app surfaces has ${appSurfaces.failed ?? 'missing'} failed route/viewport pair(s)`]),
  ...missingAppSurfaceRoutes.map((route) => `authenticated app surfaces missing ${route}`),
  ...missingAppSurfaceViewports.map((viewport) => `authenticated app surfaces missing ${viewport} viewport`),
  ...badAppSurfaceResults.map((result) => `authenticated app surface ${result.routeId || 'unknown'} @ ${result.viewportId || 'unknown'} failed: ${(result.issues || []).join('; ') || 'unknown issue'}`),
]
const appSurfacesReady = appSurfaceIssues.length === 0
const productionAppSurfaceResults = Array.isArray(productionAppSurfaces.results) ? productionAppSurfaces.results : []
const productionAppSurfaceRouteIds = Array.isArray(productionAppSurfaces.requiredRoutes)
  ? productionAppSurfaces.requiredRoutes
  : unique(productionAppSurfaceResults.map((result) => result.routeId))
const productionAppSurfaceViewportIds = Array.isArray(productionAppSurfaces.viewports)
  ? productionAppSurfaces.viewports
  : unique(productionAppSurfaceResults.map((result) => result.viewportId))
const missingProductionAppSurfaceRoutes = missingFrom(productionAppSurfaceRouteIds, requiredAppSurfaceRoutes)
const missingProductionAppSurfaceViewports = missingFrom(productionAppSurfaceViewportIds, requiredAppSurfaceViewports)
const badProductionAppSurfaceResults = productionAppSurfaceResults.filter((result) => result.ok !== true)
const productionAppSurfaceCleanup = productionAppSurfaces.auth?.cleanup || {}
const productionAppSurfaceIssues = [
  ...(productionAppSurfaces.status === 'pass' ? [] : ['production authenticated app surfaces status is not pass']),
  ...(productionAppSurfaces.baseUrl === baseUrl ? [] : [`production authenticated app surfaces baseUrl ${productionAppSurfaces.baseUrl || 'missing'} does not match ${baseUrl}`]),
  ...(productionAppSurfaces.localOnly === false ? [] : ['production authenticated app surfaces should run against the live alias with remote guest enabled']),
  ...(productionAppSurfaces.auth?.mode === 'guest' ? [] : ['production authenticated app surfaces did not run in guest auth mode']),
  ...(productionAppSurfaceCleanup.attempted === true ? [] : ['production authenticated app surfaces did not attempt generated guest cleanup']),
  ...(productionAppSurfaceCleanup.profileDeleted === true ? [] : ['production authenticated app surfaces did not delete the generated guest profile']),
  ...(productionAppSurfaceCleanup.userDeleted === true ? [] : ['production authenticated app surfaces did not delete the generated guest auth user']),
  ...(productionAppSurfaceCleanup.error ? [`production authenticated app surfaces cleanup error: ${productionAppSurfaceCleanup.error}`] : []),
  ...(Number(productionAppSurfaces.checked) >= expectedAppSurfaceChecks ? [] : [`production authenticated app surfaces checked ${productionAppSurfaces.checked ?? 'missing'} route/viewport pairs but expected at least ${expectedAppSurfaceChecks}`]),
  ...(Number(productionAppSurfaces.failed) === 0 ? [] : [`production authenticated app surfaces has ${productionAppSurfaces.failed ?? 'missing'} failed route/viewport pair(s)`]),
  ...missingProductionAppSurfaceRoutes.map((route) => `production authenticated app surfaces missing ${route}`),
  ...missingProductionAppSurfaceViewports.map((viewport) => `production authenticated app surfaces missing ${viewport} viewport`),
  ...badProductionAppSurfaceResults.map((result) => `production authenticated app surface ${result.routeId || 'unknown'} @ ${result.viewportId || 'unknown'} failed: ${(result.issues || []).join('; ') || 'unknown issue'}`),
]
const productionAppSurfacesReady = productionAppSurfaceIssues.length === 0

const betaQueueIssues = []
if (!expectedBetaReviewOrigin) {
  betaQueueIssues.push('beta review expected origin is not configured')
} else if (expectedBetaReviewOrigin !== statusOrigin) {
  betaQueueIssues.push(`beta review register origin ${expectedBetaReviewOrigin} does not match status origin ${statusOrigin}`)
}
if (urlOrigin(betaPacketManifest.reviewerBaseUrl) !== expectedBetaReviewOrigin) {
  betaQueueIssues.push(`beta packet manifest reviewer origin ${urlOrigin(betaPacketManifest.reviewerBaseUrl) || 'missing'} does not match ${expectedBetaReviewOrigin}`)
}
if (betaProgress.expectedReviewOrigin && betaProgress.expectedReviewOrigin !== expectedBetaReviewOrigin) {
  betaQueueIssues.push(`beta progress expected review origin ${betaProgress.expectedReviewOrigin} does not match ${expectedBetaReviewOrigin}`)
}
if (betaIntake.expectedReviewOrigin && betaIntake.expectedReviewOrigin !== expectedBetaReviewOrigin) {
  betaQueueIssues.push(`beta intake expected review origin ${betaIntake.expectedReviewOrigin} does not match ${expectedBetaReviewOrigin}`)
}
if (Number(betaPacketManifest.packetCount) !== plannedBetaReviews.length) {
  betaQueueIssues.push(`packet manifest count ${betaPacketManifest.packetCount || 0} does not match ${plannedBetaReviews.length} planned beta reviews`)
}
if (Number(betaPacketManifest.submissionTemplateCount) !== plannedBetaReviews.length) {
  betaQueueIssues.push(`submission template count ${betaPacketManifest.submissionTemplateCount || 0} does not match ${plannedBetaReviews.length} planned beta reviews`)
}
for (const id of plannedBetaIds.filter((id) => !betaPacketIds.includes(id))) {
  betaQueueIssues.push(`packet manifest is missing planned beta review ${id}`)
}
for (const file of betaPacketFileChecks.filter((file) => !file.ok)) {
  betaQueueIssues.push(`beta reviewer packet is not readable for ${file.id || 'unknown'} at ${file.path || 'missing path'}`)
}
for (const file of betaPacketFileChecks.filter((file) => file.ok)) {
  for (const issue of betaPacketMarkdownIssues(file.text, file.packet)) {
    betaQueueIssues.push(`beta reviewer packet ${file.path}: ${issue}`)
  }
}
for (const file of betaSubmissionTemplateChecks.filter((file) => !file.ok)) {
  betaQueueIssues.push(`beta submission template is not readable for ${file.id || 'unknown'} at ${file.path || 'missing path'}`)
}
for (const file of betaSubmissionTemplateChecks.filter((file) => file.ok && file.json?.id !== file.id)) {
  betaQueueIssues.push(`beta submission template ${file.path} does not match review id ${file.id}`)
}
for (const file of betaSubmissionTemplateChecks.filter((file) => file.ok)) {
  if (file.json?.prompt !== file.packet.prompt) betaQueueIssues.push(`beta submission template ${file.path} prompt must match assigned packet`)
  if (file.json?.device !== file.packet.device) betaQueueIssues.push(`beta submission template ${file.path} device must match assigned packet`)
  if (file.json?.viewport !== file.packet.viewport) betaQueueIssues.push(`beta submission template ${file.path} viewport must match assigned packet`)
  if (file.json?.sourceActualId !== file.packet.sourceActualId) betaQueueIssues.push(`beta submission template ${file.path} sourceActualId must match assigned packet`)
  if (file.json?.routeOrShareUrl !== file.packet.startUrl) betaQueueIssues.push(`beta submission template ${file.path} route URL must match assigned packet start URL`)
  if (!Array.isArray(file.json?.findings)) betaQueueIssues.push(`beta submission template ${file.path} findings must be an array`)
  if (!file.json?.scorecard || typeof file.json.scorecard !== 'object' || Array.isArray(file.json.scorecard)) {
    betaQueueIssues.push(`beta submission template ${file.path} scorecard must be an object`)
  } else {
    const missingScorecardFields = missingFrom(Object.keys(file.json.scorecard), requiredBetaReviewScorecardFields)
    if (missingScorecardFields.length > 0) {
      betaQueueIssues.push(`beta submission template ${file.path} scorecard missing fields: ${missingScorecardFields.join(', ')}`)
    }
  }
}
for (const packet of betaPacketRecords) {
  if (urlOrigin(packet.startUrl) !== expectedBetaReviewOrigin) {
    betaQueueIssues.push(`beta packet ${packet.id || 'unknown'} start URL origin ${urlOrigin(packet.startUrl) || 'missing'} does not match ${expectedBetaReviewOrigin}`)
  }
}
for (const file of betaSubmissionTemplateChecks.filter((file) => file.ok)) {
  if (urlOrigin(file.json?.routeOrShareUrl) !== expectedBetaReviewOrigin) {
    betaQueueIssues.push(`beta submission template ${file.path} route URL origin ${urlOrigin(file.json?.routeOrShareUrl) || 'missing'} does not match ${expectedBetaReviewOrigin}`)
  }
}
if (!betaAssignmentCsv.ok) betaQueueIssues.push(`beta assignment CSV is not readable at ${betaAssignmentCsvPath}`)
if (!betaAssignmentReport.ok) betaQueueIssues.push(`beta assignment report is not readable at ${betaAssignmentReportPath}`)
for (const id of plannedBetaIds) {
  if (betaAssignmentCsv.ok && !betaAssignmentCsv.text.includes(id)) betaQueueIssues.push(`beta assignment CSV does not include ${id}`)
  if (betaAssignmentReport.ok && !betaAssignmentReport.text.includes(id)) betaQueueIssues.push(`beta assignment report does not include ${id}`)
}
if (betaAssignmentReport.ok && !betaAssignmentReport.text.includes('Public launch still requires 25 completed reviews')) {
  betaQueueIssues.push('beta assignment report does not restate the public-launch completion rule')
}

const betaScheduleIssues = []
const scheduledBetaReviews = Array.isArray(betaSchedule.scheduledReviews) ? betaSchedule.scheduledReviews : []
const scheduledBetaIds = scheduledBetaReviews.map((review) => review.id).filter(Boolean)
const missingScheduledBetaIds = missingFrom(scheduledBetaIds, plannedBetaIds)
const scheduleWaveIds = unique(scheduledBetaReviews.map((review) => review.waveId).filter(Boolean))
if (betaSchedule.status !== 'pass') betaScheduleIssues.push('beta review schedule artifact status is not pass')
if (Number(betaSchedule.plannedReviewCount) !== plannedBetaReviews.length) {
  betaScheduleIssues.push(`beta review schedule planned count ${betaSchedule.plannedReviewCount ?? 'missing'} does not match ${plannedBetaReviews.length}`)
}
if (Number(betaSchedule.scheduledReviewCount) !== plannedBetaReviews.length) {
  betaScheduleIssues.push(`beta review schedule count ${betaSchedule.scheduledReviewCount ?? 'missing'} does not match ${plannedBetaReviews.length}`)
}
if (missingScheduledBetaIds.length > 0) {
  betaScheduleIssues.push(`beta review schedule missing planned ids: ${missingScheduledBetaIds.join(', ')}`)
}
if (scheduleWaveIds.length < 5) {
  betaScheduleIssues.push(`beta review schedule has only ${scheduleWaveIds.length} wave(s)`)
}
if (!betaScheduleCsv.ok) betaScheduleIssues.push(`beta review schedule CSV is not readable at ${betaScheduleCsvPath}`)
if (!betaScheduleReport.includes('Status: pass')) betaScheduleIssues.push('beta review schedule report is not passing')
if (!betaScheduleReport.includes('Public launch still requires 25 completed reviews')) {
  betaScheduleIssues.push('beta review schedule report does not restate the public-launch completion rule')
}
for (const review of scheduledBetaReviews) {
  if (betaScheduleCsv.ok && !betaScheduleCsv.text.includes(review.id)) betaScheduleIssues.push(`beta review schedule CSV does not include ${review.id}`)
  if (!review.startUrl || urlOrigin(review.startUrl) !== expectedBetaReviewOrigin) {
    betaScheduleIssues.push(`beta review schedule ${review.id || 'unknown'} start URL origin ${urlOrigin(review.startUrl) || 'missing'} does not match ${expectedBetaReviewOrigin}`)
  }
  if (!review.packetPath || !review.submissionTemplatePath) {
    betaScheduleIssues.push(`beta review schedule ${review.id || 'unknown'} missing packet or submission template path`)
  }
}

const betaCommandCenterIssues = []
const betaCommandCenterOverdueWaves = Array.isArray(betaCommandCenter.overdueWaves) ? betaCommandCenter.overdueWaves : []
const betaCommandCenterDueSoonWaves = Array.isArray(betaCommandCenter.dueSoonWaves) ? betaCommandCenter.dueSoonWaves : []
if (betaCommandCenter.status !== 'pass') betaCommandCenterIssues.push('beta review command center status is not pass')
if (Number(betaCommandCenter.plannedReviewCount) !== plannedBetaReviews.length) {
  betaCommandCenterIssues.push(`beta review command center planned count ${betaCommandCenter.plannedReviewCount ?? 'missing'} does not match ${plannedBetaReviews.length}`)
}
if (Number(betaCommandCenter.completedReviewCount) !== completedBetaReviews.length) {
  betaCommandCenterIssues.push(`beta review command center completed count ${betaCommandCenter.completedReviewCount ?? 'missing'} does not match ${completedBetaReviews.length}`)
}
if (Number(betaCommandCenter.remainingReviewsForMinimum) !== betaRemaining) {
  betaCommandCenterIssues.push(`beta review command center remaining count ${betaCommandCenter.remainingReviewsForMinimum ?? 'missing'} does not match ${betaRemaining}`)
}
if (!Array.isArray(betaCommandCenter.waves) || betaCommandCenter.waves.length < 5) {
  betaCommandCenterIssues.push('beta review command center does not expose at least five scheduled waves')
}
if (completedBetaReviews.length < publicBetaMinimum && !betaCommandCenter.nextWave?.waveId) {
  betaCommandCenterIssues.push('beta review command center does not expose the next open wave')
}
if (Number(betaCommandCenter.overdueWaveCount || 0) > 0 || betaCommandCenterOverdueWaves.length > 0) {
  betaCommandCenterIssues.push(`beta review command center has ${Number(betaCommandCenter.overdueWaveCount || betaCommandCenterOverdueWaves.length)} overdue wave(s)`)
}
if (!betaCommandCenterReport.includes('Status: pass')) betaCommandCenterIssues.push('beta review command center report is not passing')
if (!betaCommandCenterReport.includes('This command center is an operating artifact, not completed review evidence')) {
  betaCommandCenterIssues.push('beta review command center report does not restate the evidence boundary')
}

const betaNextWaveOpsIssues = []
const betaNextWaveOpsRows = Array.isArray(betaNextWaveOps.operatorRows) ? betaNextWaveOps.operatorRows : []
const betaNextWave = betaCommandCenter.nextWave || null
if (betaNextWaveOps.status !== 'pass') betaNextWaveOpsIssues.push('beta next-wave ops artifact status is not pass')
if (betaNextWave?.waveId && betaNextWaveOps.nextWave?.waveId !== betaNextWave.waveId) {
  betaNextWaveOpsIssues.push(`beta next-wave ops wave ${betaNextWaveOps.nextWave?.waveId || 'missing'} does not match command center ${betaNextWave.waveId}`)
}
if (Number(betaNextWaveOps.operatorRowCount) !== betaNextWaveOpsRows.length) {
  betaNextWaveOpsIssues.push('beta next-wave ops operator row count does not match rows')
}
if (betaNextWave?.remainingReviewCount != null && Number(betaNextWaveOps.operatorRowCount) !== Number(betaNextWave.remainingReviewCount)) {
  betaNextWaveOpsIssues.push(`beta next-wave ops row count ${betaNextWaveOps.operatorRowCount ?? 'missing'} does not match remaining wave reviews ${betaNextWave.remainingReviewCount}`)
}
for (const row of betaNextWaveOpsRows) {
  if (!row.id || !betaNextWaveOpsCsv.includes(row.id)) betaNextWaveOpsIssues.push(`beta next-wave ops CSV missing row ${row.id || 'unknown'}`)
  if (!row.completedSubmissionPath || row.completedSubmissionPath.endsWith('.template.json')) betaNextWaveOpsIssues.push(`beta next-wave ops ${row.id || 'unknown'} completed submission path is not a non-template JSON path`)
  if (!row.packetPath || !row.submissionTemplatePath || !row.startUrl) betaNextWaveOpsIssues.push(`beta next-wave ops ${row.id || 'unknown'} missing packet, template, or start URL`)
  if (row.startUrl && urlOrigin(row.startUrl) !== expectedBetaReviewOrigin) betaNextWaveOpsIssues.push(`beta next-wave ops ${row.id || 'unknown'} start URL origin does not match ${expectedBetaReviewOrigin}`)
}
if (!betaNextWaveOpsReport.includes('Status: pass')) betaNextWaveOpsIssues.push('beta next-wave ops report is not passing')
if (!betaNextWaveOpsReport.includes('This next-wave ops pack is an assignment and outreach artifact, not completed review evidence')) {
  betaNextWaveOpsIssues.push('beta next-wave ops report does not restate the evidence boundary')
}

const betaDispatchOutboxIssues = []
const betaDispatchOutboxChecks = Array.isArray(betaDispatchOutbox.messageFileChecks) ? betaDispatchOutbox.messageFileChecks : []
if (betaDispatchOutbox.status !== 'pass') betaDispatchOutboxIssues.push('beta dispatch outbox status is not pass')
if (betaDispatchOutbox.nextWaveOpsArtifact && betaDispatchOutbox.nextWaveOpsArtifact !== qaDisplayPath(betaNextWaveOpsPath)) {
  betaDispatchOutboxIssues.push(`beta dispatch outbox source ${betaDispatchOutbox.nextWaveOpsArtifact} does not match ${qaDisplayPath(betaNextWaveOpsPath)}`)
}
if (Number(betaDispatchOutbox.outboxRowCount) !== betaNextWaveOpsRows.length) {
  betaDispatchOutboxIssues.push(`beta dispatch outbox row count ${betaDispatchOutbox.outboxRowCount ?? 'missing'} does not match next-wave row count ${betaNextWaveOpsRows.length}`)
}
if (Number(betaDispatchOutbox.messageFileCount) !== betaNextWaveOpsRows.length || betaDispatchOutboxChecks.length !== betaNextWaveOpsRows.length) {
  betaDispatchOutboxIssues.push('beta dispatch outbox does not include one message file check per next-wave row')
}
if (Number(betaDispatchOutbox.dispatchOverdueCount) > 0) {
  betaDispatchOutboxIssues.push(`beta dispatch outbox has ${betaDispatchOutbox.dispatchOverdueCount} overdue dispatch message(s)`)
}
if (Number(betaDispatchOutbox.followUpOverdueCount) > 0) {
  betaDispatchOutboxIssues.push(`beta dispatch outbox has ${betaDispatchOutbox.followUpOverdueCount} overdue follow-up message(s)`)
}
for (const row of betaNextWaveOpsRows) {
  if (!betaDispatchOutboxCsv.includes(row.id)) betaDispatchOutboxIssues.push(`beta dispatch outbox CSV missing next-wave row ${row.id || 'unknown'}`)
  if (row.completedSubmissionPath && !betaDispatchOutboxCsv.includes(row.completedSubmissionPath)) {
    betaDispatchOutboxIssues.push(`beta dispatch outbox CSV missing completed submission path for ${row.id || 'unknown'}`)
  }
}
for (const check of betaDispatchOutboxChecks) {
  if (
    !check.exists ||
    !check.hasSubject ||
    !check.hasStartUrl ||
    !check.hasPacket ||
    !check.hasTemplate ||
    !check.hasCompletedSubmission ||
    !check.hasIntakeCommand ||
    !check.hasLaunchBoundary
  ) {
    betaDispatchOutboxIssues.push(`beta dispatch outbox message file is incomplete for ${check.id || check.messageFile || 'unknown'}`)
  }
}
if (!betaDispatchOutboxReport.includes('Status: pass')) betaDispatchOutboxIssues.push('beta dispatch outbox report is not passing')
if (!betaDispatchOutboxReport.includes('This dispatch outbox is assignment and outreach evidence, not completed review evidence')) {
  betaDispatchOutboxIssues.push('beta dispatch outbox report does not restate the evidence boundary')
}

const betaDispatchLogIssues = []
const betaDispatchLogRows = Array.isArray(betaDispatchLog.dispatchRows) ? betaDispatchLog.dispatchRows : []
const betaDispatchLogChecks = Array.isArray(betaDispatchLog.checks) ? betaDispatchLog.checks : []
if (betaDispatchLog.status !== 'pass') betaDispatchLogIssues.push('beta dispatch log status is not pass')
if (betaDispatchLog.dispatchOutboxArtifact && betaDispatchLog.dispatchOutboxArtifact !== qaDisplayPath(betaDispatchOutboxPath)) {
  betaDispatchLogIssues.push(`beta dispatch log source ${betaDispatchLog.dispatchOutboxArtifact} does not match ${qaDisplayPath(betaDispatchOutboxPath)}`)
}
if (Number(betaDispatchLog.dispatchRowCount) !== Number(betaDispatchOutbox.outboxRowCount || 0)) {
  betaDispatchLogIssues.push(`beta dispatch log row count ${betaDispatchLog.dispatchRowCount ?? 'missing'} does not match dispatch outbox row count ${betaDispatchOutbox.outboxRowCount ?? 0}`)
}
if (Number(betaDispatchLog.sentCount || 0) + Number(betaDispatchLog.preparedNotSentCount || 0) !== betaDispatchLogRows.length) {
  betaDispatchLogIssues.push('beta dispatch log sent and prepared counts do not match dispatch rows')
}
if (Number(betaDispatchLog.preparedOverdueCount || 0) > 0) {
  betaDispatchLogIssues.push(`beta dispatch log has ${betaDispatchLog.preparedOverdueCount} prepared row(s) past sendBy`)
}
for (const row of betaDispatchLogRows) {
  if (!row.id || !betaDispatchOutboxCsv.includes(row.id)) betaDispatchLogIssues.push(`beta dispatch log row ${row.id || 'unknown'} is not present in the dispatch outbox CSV`)
  if (row.messageFile && !betaDispatchOutboxCsv.includes(row.messageFile)) betaDispatchLogIssues.push(`beta dispatch log row ${row.id || 'unknown'} message file is not present in the dispatch outbox CSV`)
  if (row.completedSubmissionPath && !betaDispatchOutboxCsv.includes(row.completedSubmissionPath)) betaDispatchLogIssues.push(`beta dispatch log row ${row.id || 'unknown'} completed submission path is not present in the dispatch outbox CSV`)
}
for (const check of betaDispatchLogChecks) {
  if (!check.ok) betaDispatchLogIssues.push(`beta dispatch log check failed: ${check.name || 'unknown'}`)
}
if (!betaDispatchLogReport.includes('Status: pass')) betaDispatchLogIssues.push('beta dispatch log report is not passing')
if (!betaDispatchLogReport.includes('This dispatch log is send-proof workflow evidence, not completed review evidence')) {
  betaDispatchLogIssues.push('beta dispatch log report does not restate the evidence boundary')
}
for (const row of betaDispatchLogRows) {
  if (row.id && !betaDispatchLogCsv.includes(row.id)) betaDispatchLogIssues.push(`beta dispatch log CSV missing row ${row.id}`)
}

const betaFollowUpOutboxIssues = []
const betaFollowUpOutboxRows = Array.isArray(betaFollowUpOutbox.messageRows) ? betaFollowUpOutbox.messageRows : []
const betaFollowUpOutboxChecks = Array.isArray(betaFollowUpOutbox.messageFileChecks) ? betaFollowUpOutbox.messageFileChecks : []
if (betaFollowUpOutbox.status !== 'pass') betaFollowUpOutboxIssues.push('beta follow-up outbox status is not pass')
if (betaFollowUpOutbox.dispatchOutboxArtifact && betaFollowUpOutbox.dispatchOutboxArtifact !== qaDisplayPath(betaDispatchOutboxPath)) {
  betaFollowUpOutboxIssues.push(`beta follow-up outbox source ${betaFollowUpOutbox.dispatchOutboxArtifact} does not match ${qaDisplayPath(betaDispatchOutboxPath)}`)
}
if (betaFollowUpOutbox.dispatchLogArtifact && betaFollowUpOutbox.dispatchLogArtifact !== qaDisplayPath(betaDispatchLogPath)) {
  betaFollowUpOutboxIssues.push(`beta follow-up outbox dispatch log ${betaFollowUpOutbox.dispatchLogArtifact} does not match ${qaDisplayPath(betaDispatchLogPath)}`)
}
if (betaFollowUpOutbox.intakeArtifact && betaFollowUpOutbox.intakeArtifact !== qaDisplayPath(betaIntakePath)) {
  betaFollowUpOutboxIssues.push(`beta follow-up outbox intake ${betaFollowUpOutbox.intakeArtifact} does not match ${qaDisplayPath(betaIntakePath)}`)
}
if (Number(betaFollowUpOutbox.followUpRowCount) !== Number(betaDispatchOutbox.followUpDueSoonCount || 0)) {
  betaFollowUpOutboxIssues.push(`beta follow-up outbox row count ${betaFollowUpOutbox.followUpRowCount ?? 'missing'} does not match due-soon follow-ups ${betaDispatchOutbox.followUpDueSoonCount ?? 0}`)
}
if (Number(betaFollowUpOutbox.messageFileCount) !== betaFollowUpOutboxRows.length || betaFollowUpOutboxChecks.length !== betaFollowUpOutboxRows.length) {
  betaFollowUpOutboxIssues.push('beta follow-up outbox does not include one message file check per follow-up row')
}
if (Number(betaFollowUpOutbox.followUpOverdueCount) > 0) {
  betaFollowUpOutboxIssues.push(`beta follow-up outbox has ${betaFollowUpOutbox.followUpOverdueCount} overdue follow-up message(s)`)
}
if (Number(betaFollowUpOutbox.sendEligibleCount || 0) + Number(betaFollowUpOutbox.blockedUntilInitialSendCount || 0) !== Number(betaFollowUpOutbox.followUpRowCount || 0)) {
  betaFollowUpOutboxIssues.push('beta follow-up outbox send-eligible and blocked counts do not match follow-up rows')
}
if (Number(betaFollowUpOutbox.sendEligibleCount || 0) > Number(betaDispatchLog.sentCount || 0)) {
  betaFollowUpOutboxIssues.push('beta follow-up outbox has more send-eligible rows than sent dispatch rows')
}
for (const row of betaFollowUpOutboxRows) {
  if (!row.id || !betaFollowUpOutboxCsv.includes(row.id)) betaFollowUpOutboxIssues.push(`beta follow-up outbox CSV missing row ${row.id || 'unknown'}`)
  if (typeof row.followUpSendEligible !== 'boolean') betaFollowUpOutboxIssues.push(`beta follow-up outbox row ${row.id || 'unknown'} is missing send eligibility`)
  if (!row.initialSendStatus || !betaFollowUpOutboxCsv.includes(row.initialSendStatus)) betaFollowUpOutboxIssues.push(`beta follow-up outbox CSV missing initial send status for ${row.id || 'unknown'}`)
  if (row.followUpFile && !betaFollowUpOutboxCsv.includes(row.followUpFile)) {
    betaFollowUpOutboxIssues.push(`beta follow-up outbox CSV missing message file for ${row.id || 'unknown'}`)
  }
  if (row.completedSubmissionPath && !betaFollowUpOutboxCsv.includes(row.completedSubmissionPath)) {
    betaFollowUpOutboxIssues.push(`beta follow-up outbox CSV missing completed submission path for ${row.id || 'unknown'}`)
  }
}
for (const check of betaFollowUpOutboxChecks) {
  if (
    !check.exists ||
    !check.hasSubject ||
    !check.hasStartUrl ||
    !check.hasPacket ||
    !check.hasTemplate ||
    !check.hasCompletedSubmission ||
    !check.hasIntakeCommand ||
    !check.hasLaunchBoundary
  ) {
    betaFollowUpOutboxIssues.push(`beta follow-up outbox message file is incomplete for ${check.id || check.followUpFile || 'unknown'}`)
  }
}
if (!betaFollowUpOutboxReport.includes('Status: pass')) betaFollowUpOutboxIssues.push('beta follow-up outbox report is not passing')
if (!betaFollowUpOutboxReport.includes('This follow-up outbox is outreach evidence, not completed review evidence')) {
  betaFollowUpOutboxIssues.push('beta follow-up outbox report does not restate the evidence boundary')
}
if (!betaFollowUpOutboxReport.includes('draft-only until the initial invite is recorded as sent')) {
  betaFollowUpOutboxIssues.push('beta follow-up outbox report does not explain initial-send eligibility')
}

const betaAllWaveOpsIssues = []
const betaAllWaveOpsRows = Array.isArray(betaAllWaveOps.operatorRows) ? betaAllWaveOps.operatorRows : []
const betaAllWaveOpsIds = betaAllWaveOpsRows.map((row) => row.id).filter(Boolean)
const missingBetaAllWaveOpsIds = missingFrom(betaAllWaveOpsIds, plannedBetaIds)
if (betaAllWaveOps.status !== 'pass') betaAllWaveOpsIssues.push('beta all-wave ops artifact status is not pass')
if (betaAllWaveOps.scope !== 'all-waves') betaAllWaveOpsIssues.push(`beta all-wave ops scope ${betaAllWaveOps.scope || 'missing'} is not all-waves`)
if (Number(betaAllWaveOps.operatorRowCount) !== betaAllWaveOpsRows.length) {
  betaAllWaveOpsIssues.push('beta all-wave ops operator row count does not match rows')
}
if (Number(betaAllWaveOps.operatorRowCount) !== plannedBetaReviews.length - completedBetaReviews.length) {
  betaAllWaveOpsIssues.push(`beta all-wave ops row count ${betaAllWaveOps.operatorRowCount ?? 'missing'} does not match remaining planned reviews ${plannedBetaReviews.length - completedBetaReviews.length}`)
}
if (Number(betaAllWaveOps.operatorWaveCount) < Number(betaSchedule.waveCount || 0)) {
  betaAllWaveOpsIssues.push(`beta all-wave ops covers ${betaAllWaveOps.operatorWaveCount ?? 'missing'} wave(s), expected ${betaSchedule.waveCount || 0}`)
}
for (const id of missingBetaAllWaveOpsIds) {
  betaAllWaveOpsIssues.push(`beta all-wave ops missing planned review ${id}`)
}
for (const row of betaAllWaveOpsRows) {
  if (!row.id || !betaAllWaveOpsCsv.includes(row.id)) betaAllWaveOpsIssues.push(`beta all-wave ops CSV missing row ${row.id || 'unknown'}`)
  if (!row.completedSubmissionPath || row.completedSubmissionPath.endsWith('.template.json')) betaAllWaveOpsIssues.push(`beta all-wave ops ${row.id || 'unknown'} completed submission path is not a non-template JSON path`)
  if (!row.packetPath || !row.submissionTemplatePath || !row.startUrl) betaAllWaveOpsIssues.push(`beta all-wave ops ${row.id || 'unknown'} missing packet, template, or start URL`)
  if (row.startUrl && urlOrigin(row.startUrl) !== expectedBetaReviewOrigin) betaAllWaveOpsIssues.push(`beta all-wave ops ${row.id || 'unknown'} start URL origin does not match ${expectedBetaReviewOrigin}`)
}
if (!betaAllWaveOpsReport.includes('Status: pass')) betaAllWaveOpsIssues.push('beta all-wave ops report is not passing')
if (!betaAllWaveOpsReport.includes('This all-wave ops pack is an assignment and outreach artifact, not completed review evidence')) {
  betaAllWaveOpsIssues.push('beta all-wave ops report does not restate the evidence boundary')
}

const betaWaveRehearsalIssues = []
const betaWaveRehearsalResults = Array.isArray(betaWaveRehearsal.results) ? betaWaveRehearsal.results : []
const betaWaveRehearsalFailures = Array.isArray(betaWaveRehearsal.failures) ? betaWaveRehearsal.failures : []
const betaWaveReviewIds = Array.isArray(betaNextWave?.reviewIds) ? betaNextWave.reviewIds : betaNextWaveOpsRows.map((row) => row.id).filter(Boolean)
const betaWaveRehearsalResultIds = betaWaveRehearsalResults.map((result) => result.id).filter(Boolean)
const missingBetaWaveRehearsalResults = missingFrom(betaWaveRehearsalResultIds, betaWaveReviewIds)
const badBetaWaveRehearsalResults = betaWaveRehearsalResults.filter((result) => result.ok !== true)
const betaWaveRehearsalScreenshotChecks = await Promise.all(betaWaveRehearsalResults.map(async (result) => {
  const screenshot = result.start?.screenshot || result.screenshot || ''
  return {
    id: result.id || null,
    screenshot,
    exists: hasText(screenshot) ? await exists(screenshot) : false,
  }
}))
const missingBetaWaveRehearsalScreenshots = betaWaveRehearsalScreenshotChecks
  .filter((check) => !check.exists)
  .map((check) => `${check.id || 'unknown'}:${check.screenshot || 'missing screenshot'}`)
if (betaWaveRehearsal.status !== 'pass') betaWaveRehearsalIssues.push('beta wave rehearsal status is not pass')
if (betaWaveRehearsal.nonMutating !== true) betaWaveRehearsalIssues.push('beta wave rehearsal must be non-mutating by default')
if (betaWaveRehearsal.remoteGuestStartExercised !== false) betaWaveRehearsalIssues.push('beta wave rehearsal must not exercise remote guest start by default')
if (qaDisplayPath(betaWaveRehearsal.nextWaveOpsArtifact) !== qaDisplayPath(betaNextWaveOpsPath)) {
  betaWaveRehearsalIssues.push('beta wave rehearsal does not reference current next-wave ops artifact')
}
if (betaWaveRehearsal.nextWave?.waveId !== betaNextWave?.waveId) {
  betaWaveRehearsalIssues.push(`beta wave rehearsal wave ${betaWaveRehearsal.nextWave?.waveId || 'missing'} does not match ${betaNextWave?.waveId || 'missing'}`)
}
if (Number(betaWaveRehearsal.expectedReviewCount) !== betaWaveReviewIds.length) {
  betaWaveRehearsalIssues.push(`beta wave rehearsal expected ${betaWaveRehearsal.expectedReviewCount ?? 'missing'} reviews but current wave has ${betaWaveReviewIds.length}`)
}
if (Number(betaWaveRehearsal.checked) < betaWaveReviewIds.length) {
  betaWaveRehearsalIssues.push(`beta wave rehearsal checked ${betaWaveRehearsal.checked ?? 'missing'} reviews but expected at least ${betaWaveReviewIds.length}`)
}
if (Number(betaWaveRehearsal.failed) !== 0 || betaWaveRehearsalFailures.length > 0) {
  betaWaveRehearsalIssues.push('beta wave rehearsal has failing reviewer start URLs or packet/template checks')
}
for (const id of missingBetaWaveRehearsalResults) {
  betaWaveRehearsalIssues.push(`beta wave rehearsal missing result for ${id}`)
}
for (const result of badBetaWaveRehearsalResults) {
  betaWaveRehearsalIssues.push(`beta wave rehearsal ${result.id || 'unknown'} failed: ${(result.issues || []).join('; ') || 'unknown issue'}`)
}
for (const screenshot of missingBetaWaveRehearsalScreenshots) {
  betaWaveRehearsalIssues.push(`beta wave rehearsal screenshot missing for ${screenshot}`)
}
const betaWaveRehearsalReady = betaWaveRehearsalIssues.length === 0

const betaMatrixRehearsalIssues = []
const betaMatrixRehearsalResults = Array.isArray(betaMatrixRehearsal.results) ? betaMatrixRehearsal.results : []
const betaMatrixRehearsalFailures = Array.isArray(betaMatrixRehearsal.failures) ? betaMatrixRehearsal.failures : []
const betaMatrixRehearsalResultIds = betaMatrixRehearsalResults.map((result) => result.id).filter(Boolean)
const missingBetaMatrixRehearsalResults = missingFrom(betaMatrixRehearsalResultIds, plannedBetaIds)
const badBetaMatrixRehearsalResults = betaMatrixRehearsalResults.filter((result) => result.ok !== true)
const betaMatrixRehearsalScreenshotChecks = await Promise.all(betaMatrixRehearsalResults.map(async (result) => {
  const screenshot = result.start?.screenshot || result.screenshot || ''
  return {
    id: result.id || null,
    screenshot,
    exists: hasText(screenshot) ? await exists(screenshot) : false,
  }
}))
const missingBetaMatrixRehearsalScreenshots = betaMatrixRehearsalScreenshotChecks
  .filter((check) => !check.exists)
  .map((check) => `${check.id || 'unknown'}:${check.screenshot || 'missing screenshot'}`)
if (betaMatrixRehearsal.status !== 'pass') betaMatrixRehearsalIssues.push('beta matrix rehearsal status is not pass')
if (betaMatrixRehearsal.scope !== 'matrix') betaMatrixRehearsalIssues.push(`beta matrix rehearsal scope ${betaMatrixRehearsal.scope || 'missing'} is not matrix`)
if (betaMatrixRehearsal.nonMutating !== true) betaMatrixRehearsalIssues.push('beta matrix rehearsal must be non-mutating by default')
if (betaMatrixRehearsal.remoteGuestStartExercised !== false) betaMatrixRehearsalIssues.push('beta matrix rehearsal must not exercise remote guest start by default')
if (qaDisplayPath(betaMatrixRehearsal.packetManifest) !== qaDisplayPath(betaPacketManifestPath)) {
  betaMatrixRehearsalIssues.push('beta matrix rehearsal does not reference current packet manifest')
}
if (Number(betaMatrixRehearsal.expectedReviewCount) !== plannedBetaReviews.length) {
  betaMatrixRehearsalIssues.push(`beta matrix rehearsal expected ${betaMatrixRehearsal.expectedReviewCount ?? 'missing'} reviews but register has ${plannedBetaReviews.length}`)
}
if (Number(betaMatrixRehearsal.checked) < plannedBetaReviews.length) {
  betaMatrixRehearsalIssues.push(`beta matrix rehearsal checked ${betaMatrixRehearsal.checked ?? 'missing'} reviews but expected at least ${plannedBetaReviews.length}`)
}
if (Number(betaMatrixRehearsal.failed) !== 0 || betaMatrixRehearsalFailures.length > 0) {
  betaMatrixRehearsalIssues.push('beta matrix rehearsal has failing reviewer start URLs or packet/template checks')
}
for (const id of missingBetaMatrixRehearsalResults) {
  betaMatrixRehearsalIssues.push(`beta matrix rehearsal missing result for ${id}`)
}
for (const result of badBetaMatrixRehearsalResults) {
  betaMatrixRehearsalIssues.push(`beta matrix rehearsal ${result.id || 'unknown'} failed: ${(result.issues || []).join('; ') || 'unknown issue'}`)
}
for (const screenshot of missingBetaMatrixRehearsalScreenshots) {
  betaMatrixRehearsalIssues.push(`beta matrix rehearsal screenshot missing for ${screenshot}`)
}
const betaMatrixRehearsalReady = betaMatrixRehearsalIssues.length === 0

const betaGuestStartRehearsalIssues = []
const betaGuestStartRehearsalResults = Array.isArray(betaGuestStartRehearsal.results) ? betaGuestStartRehearsal.results : []
const betaGuestStartRehearsalFailures = Array.isArray(betaGuestStartRehearsal.failures) ? betaGuestStartRehearsal.failures : []
const betaGuestStartRehearsalResultIds = betaGuestStartRehearsalResults.map((result) => result.id).filter(Boolean)
const missingBetaGuestStartRehearsalResults = missingFrom(betaGuestStartRehearsalResultIds, betaWaveReviewIds)
const badBetaGuestStartRehearsalResults = betaGuestStartRehearsalResults.filter((result) => result.ok !== true)
const betaGuestStartRehearsalScreenshotChecks = await Promise.all(betaGuestStartRehearsalResults.map(async (result) => {
  const screenshot = result.start?.screenshot || result.screenshot || ''
  return {
    id: result.id || null,
    screenshot,
    exists: hasText(screenshot) ? await exists(screenshot) : false,
  }
}))
const missingBetaGuestStartRehearsalScreenshots = betaGuestStartRehearsalScreenshotChecks
  .filter((check) => !check.exists)
  .map((check) => `${check.id || 'unknown'}:${check.screenshot || 'missing screenshot'}`)
const betaGuestStartExerciseResults = betaGuestStartRehearsalResults
  .filter((result) => result.start?.guestStart?.exercised === true)
if (betaGuestStartRehearsal.status !== 'pass') betaGuestStartRehearsalIssues.push('beta guest-start rehearsal status is not pass')
if (betaGuestStartRehearsal.scope !== 'wave') betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal scope ${betaGuestStartRehearsal.scope || 'missing'} is not wave`)
if (betaGuestStartRehearsal.nonMutating !== false) betaGuestStartRehearsalIssues.push('beta guest-start rehearsal must be marked mutating')
if (betaGuestStartRehearsal.remoteGuestStartExercised !== true) betaGuestStartRehearsalIssues.push('beta guest-start rehearsal must exercise remote guest start')
if (Number(betaGuestStartRehearsal.remoteGuestStartExerciseCount) < 1 || betaGuestStartExerciseResults.length < 1) {
  betaGuestStartRehearsalIssues.push('beta guest-start rehearsal did not exercise any guest starts')
}
if (Number(betaGuestStartRehearsal.remoteGuestStartCleanupFailureCount) !== 0) {
  betaGuestStartRehearsalIssues.push('beta guest-start rehearsal has cleanup failures')
}
if (qaDisplayPath(betaGuestStartRehearsal.baseUrl) !== qaDisplayPath(baseUrl)) {
  betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal base URL ${betaGuestStartRehearsal.baseUrl || 'missing'} does not match ${baseUrl}`)
}
if (qaDisplayPath(betaGuestStartRehearsal.nextWaveOpsArtifact) !== qaDisplayPath(betaNextWaveOpsPath)) {
  betaGuestStartRehearsalIssues.push('beta guest-start rehearsal does not reference current next-wave ops artifact')
}
if (betaGuestStartRehearsal.nextWave?.waveId !== betaNextWave?.waveId) {
  betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal wave ${betaGuestStartRehearsal.nextWave?.waveId || 'missing'} does not match ${betaNextWave?.waveId || 'missing'}`)
}
if (Number(betaGuestStartRehearsal.expectedReviewCount) !== betaWaveReviewIds.length) {
  betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal expected ${betaGuestStartRehearsal.expectedReviewCount ?? 'missing'} reviews but current wave has ${betaWaveReviewIds.length}`)
}
if (Number(betaGuestStartRehearsal.checked) < betaWaveReviewIds.length) {
  betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal checked ${betaGuestStartRehearsal.checked ?? 'missing'} reviews but expected at least ${betaWaveReviewIds.length}`)
}
if (Number(betaGuestStartRehearsal.failed) !== 0 || betaGuestStartRehearsalFailures.length > 0) {
  betaGuestStartRehearsalIssues.push('beta guest-start rehearsal has failing reviewer start URLs or guest-start checks')
}
for (const id of missingBetaGuestStartRehearsalResults) {
  betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal missing result for ${id}`)
}
for (const result of badBetaGuestStartRehearsalResults) {
  betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} failed: ${(result.issues || []).join('; ') || 'unknown issue'}`)
}
for (const screenshot of missingBetaGuestStartRehearsalScreenshots) {
  betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal screenshot missing for ${screenshot}`)
}
for (const result of betaGuestStartExerciseResults) {
  const guestStart = result.start?.guestStart || {}
  const cleanup = guestStart.cleanup || {}
  const state = guestStart.state || {}
  let finalPath = ''

  try {
    const finalUrl = new URL(guestStart.finalUrl || '')
    finalPath = finalUrl.pathname
    if (finalUrl.origin !== baseUrl) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} final URL origin does not match ${baseUrl}`)
  } catch {
    betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} final URL is not valid`)
  }

  if (!(finalPath === '/chat' || finalPath.startsWith('/trips/'))) {
    betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} did not land on Trip Studio or chat`)
  }
  if (!hasText(guestStart.guestId)) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} is missing guest id`)
  if (cleanup.attempted !== true) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} cleanup was not attempted`)
  if (cleanup.tripsDeleted !== true) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} trip cleanup did not complete`)
  if (cleanup.profileDeleted !== true) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} profile cleanup did not complete`)
  if (cleanup.userDeleted !== true) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} user cleanup did not complete`)
  if (cleanup.error) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} cleanup error: ${cleanup.error}`)
  if (Array.isArray(guestStart.issues) && guestStart.issues.length > 0) {
    betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} guest-start issues: ${guestStart.issues.join('; ')}`)
  }
  if (state.promptVisible !== true) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} did not preserve the prompt`)
  if (state.hasTripAccessError === true) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} hit trip access error`)
  if (state.hasAppError === true) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} hit app error`)
  if (state.horizontalOverflow === true) betaGuestStartRehearsalIssues.push(`beta guest-start rehearsal ${result.id || 'unknown'} has horizontal overflow`)
}
const betaGuestStartRehearsalReady = betaGuestStartRehearsalIssues.length === 0

const visualQueueIssues = []
for (const file of visualSubmissionTemplateChecks.filter((file) => !file.ok)) {
  visualQueueIssues.push(`visual submission template is not readable for ${file.id || 'unknown'} at ${file.path || 'missing path'}`)
}
for (const file of visualSubmissionTemplateChecks.filter((file) => file.ok)) {
  const expectedSummaryArtifact = `${file.expectedArtifact}/summary.json`
  if (file.json?.scheduledReviewId !== file.id) visualQueueIssues.push(`visual template ${file.path} does not match scheduled id ${file.id}`)
  if (dateOnly(file.json?.reviewedAt) !== file.expectedDueAt) visualQueueIssues.push(`visual template ${file.path} does not match due date ${file.expectedDueAt}`)
  if (file.json?.artifact !== file.expectedArtifact) visualQueueIssues.push(`visual template ${file.path} does not match expected artifact ${file.expectedArtifact}`)
  if (file.json?.summaryArtifact !== expectedSummaryArtifact) visualQueueIssues.push(`visual template ${file.path} does not match expected summary artifact ${expectedSummaryArtifact}`)
  if (file.json?.productionCommit !== visualReviewTemplateProductionCommitPlaceholder) {
    visualQueueIssues.push(`visual template ${file.path} productionCommit must use the scheduled-review placeholder`)
  }
  if (file.json?.deploymentUrl !== visualReviewTemplateDeploymentUrlPlaceholder) {
    visualQueueIssues.push(`visual template ${file.path} deploymentUrl must use the scheduled-review placeholder`)
  }
  const missingRoutes = missingFrom(file.json?.routesReviewed, file.expectedRoutes)
  const missingViewports = missingFrom(file.json?.viewportsReviewed, file.expectedViewports)
  const missingDiffRoutes = missingFrom(file.json?.diffRoutesReviewed, file.expectedDiffRoutes)
  if (!hasText(file.json?.reviewedBy)) visualQueueIssues.push(`visual template ${file.path} reviewedBy is missing`)
  if (file.json?.verdict !== 'pass') visualQueueIssues.push(`visual template ${file.path} verdict must default to pass`)
  if (!Array.isArray(file.json?.blockingFindings)) visualQueueIssues.push(`visual template ${file.path} blockingFindings must be an array`)
  const expectedScreenshotCount = file.expectedRoutes.length * file.expectedViewports.length
  if (Number(file.json?.screenshotsReviewed) < expectedScreenshotCount) {
    visualQueueIssues.push(`visual template ${file.path} screenshotsReviewed must be at least ${expectedScreenshotCount}`)
  }
  if (missingRoutes.length > 0) visualQueueIssues.push(`visual template ${file.path} routesReviewed missing: ${missingRoutes.join(', ')}`)
  if (missingViewports.length > 0) visualQueueIssues.push(`visual template ${file.path} viewportsReviewed missing: ${missingViewports.join(', ')}`)
  if (missingDiffRoutes.length > 0) visualQueueIssues.push(`visual template ${file.path} diffRoutesReviewed missing: ${missingDiffRoutes.join(', ')}`)
  if (!hasText(file.json?.notes, 40)) visualQueueIssues.push(`visual template ${file.path} notes must include review guidance`)
}
if (!visualAssignmentCsv.ok) visualQueueIssues.push(`visual assignment CSV is not readable at ${visualAssignmentCsvPath}`)
if (!visualAssignmentReport.ok) visualQueueIssues.push(`visual assignment report is not readable at ${visualAssignmentReportPath}`)
for (const review of scheduledVisualReviews) {
  const templatePath = `${visualSubmissionDir}/${review.id}.template.json`
  if (visualAssignmentCsv.ok && !visualAssignmentCsv.text.includes(review.id)) visualQueueIssues.push(`visual assignment CSV does not include ${review.id}`)
  if (visualAssignmentCsv.ok && !visualAssignmentCsv.text.includes(templatePath)) visualQueueIssues.push(`visual assignment CSV does not include template path ${templatePath}`)
  if (visualAssignmentReport.ok && !visualAssignmentReport.text.includes(review.id)) visualQueueIssues.push(`visual assignment report does not include ${review.id}`)
  if (visualAssignmentReport.ok && !visualAssignmentReport.text.includes(templatePath)) visualQueueIssues.push(`visual assignment report does not include template path ${templatePath}`)
}
if (visualAssignmentReport.ok && !visualAssignmentReport.text.includes('Public launch still requires four distinct dated passing visual-review history entries')) {
  visualQueueIssues.push('visual assignment report does not restate the public-launch visual-history rule')
}

const visualDispatchOutboxIssues = []
const visualDispatchOutboxRows = Array.isArray(visualDispatchOutbox.messageRows) ? visualDispatchOutbox.messageRows : []
const visualDispatchOutboxChecks = Array.isArray(visualDispatchOutbox.messageFileChecks) ? visualDispatchOutbox.messageFileChecks : []
if (visualDispatchOutbox.status !== 'pass') visualDispatchOutboxIssues.push('visual dispatch outbox status is not pass')
if (visualDispatchOutbox.progressArtifact && visualDispatchOutbox.progressArtifact !== qaDisplayPath(visualProgressPath)) {
  visualDispatchOutboxIssues.push(`visual dispatch outbox progress artifact ${visualDispatchOutbox.progressArtifact} does not match ${qaDisplayPath(visualProgressPath)}`)
}
if (Number(visualDispatchOutbox.outboxRowCount) !== scheduledVisualReviews.length) {
  visualDispatchOutboxIssues.push(`visual dispatch outbox row count ${visualDispatchOutbox.outboxRowCount ?? 'missing'} does not match scheduled reviews ${scheduledVisualReviews.length}`)
}
if (Number(visualDispatchOutbox.requiredOutboxRowCount) !== visualRemaining) {
  visualDispatchOutboxIssues.push(`visual dispatch outbox required row count ${visualDispatchOutbox.requiredOutboxRowCount ?? 'missing'} does not match remaining visual dates ${visualRemaining}`)
}
if (Number(visualDispatchOutbox.messageFileCount) !== scheduledVisualReviews.length || visualDispatchOutboxChecks.length !== scheduledVisualReviews.length) {
  visualDispatchOutboxIssues.push('visual dispatch outbox does not include one message file check per scheduled review')
}
if (Number(visualDispatchOutbox.overdueCount) > 0) {
  visualDispatchOutboxIssues.push(`visual dispatch outbox has ${visualDispatchOutbox.overdueCount} overdue scheduled review(s)`)
}
for (const review of scheduledVisualReviews) {
  if (!visualDispatchOutboxCsv.includes(review.id)) visualDispatchOutboxIssues.push(`visual dispatch outbox CSV missing scheduled review ${review.id || 'unknown'}`)
  if (review.command && !visualDispatchOutboxCsv.includes(review.command)) {
    visualDispatchOutboxIssues.push(`visual dispatch outbox CSV missing command for ${review.id || 'unknown'}`)
  }
}
for (const row of visualDispatchOutboxRows) {
  if (!row.id || !visualDispatchOutboxCsv.includes(row.completedSubmissionPath || '')) {
    visualDispatchOutboxIssues.push(`visual dispatch outbox CSV missing completed submission path for ${row.id || 'unknown'}`)
  }
}
for (const check of visualDispatchOutboxChecks) {
  if (
    !check.exists ||
    !check.hasSubject ||
    !check.hasCommand ||
    !check.hasArtifact ||
    !check.hasTemplate ||
    !check.hasCompletedSubmission ||
    !check.hasIntakeCommand ||
    !check.hasLaunchBoundary
  ) {
    visualDispatchOutboxIssues.push(`visual dispatch outbox message file is incomplete for ${check.id || check.messageFile || 'unknown'}`)
  }
}
if (!visualDispatchOutboxReport.includes('Status: pass')) visualDispatchOutboxIssues.push('visual dispatch outbox report is not passing')
if (!visualDispatchOutboxReport.includes('This dispatch outbox is assignment and outreach evidence, not completed visual-review history')) {
  visualDispatchOutboxIssues.push('visual dispatch outbox report does not restate the evidence boundary')
}

const visualDispatchLogIssues = []
const visualDispatchLogRows = Array.isArray(visualDispatchLog.dispatchRows) ? visualDispatchLog.dispatchRows : []
const visualDispatchLogChecks = Array.isArray(visualDispatchLog.checks) ? visualDispatchLog.checks : []
if (visualDispatchLog.status !== 'pass') visualDispatchLogIssues.push('visual dispatch log status is not pass')
if (visualDispatchLog.dispatchOutboxArtifact && visualDispatchLog.dispatchOutboxArtifact !== qaDisplayPath(visualDispatchOutboxPath)) {
  visualDispatchLogIssues.push(`visual dispatch log source ${visualDispatchLog.dispatchOutboxArtifact} does not match ${qaDisplayPath(visualDispatchOutboxPath)}`)
}
if (Number(visualDispatchLog.dispatchRowCount) !== Number(visualDispatchOutbox.outboxRowCount || 0)) {
  visualDispatchLogIssues.push(`visual dispatch log row count ${visualDispatchLog.dispatchRowCount ?? 'missing'} does not match dispatch outbox row count ${visualDispatchOutbox.outboxRowCount ?? 0}`)
}
if (Number(visualDispatchLog.requiredDispatchRowCount || 0) !== Number(visualDispatchOutbox.requiredOutboxRowCount || 0)) {
  visualDispatchLogIssues.push(`visual dispatch log required row count ${visualDispatchLog.requiredDispatchRowCount ?? 'missing'} does not match dispatch outbox required row count ${visualDispatchOutbox.requiredOutboxRowCount ?? 0}`)
}
if (Number(visualDispatchLog.sentCount || 0) + Number(visualDispatchLog.preparedNotSentCount || 0) !== visualDispatchLogRows.length) {
  visualDispatchLogIssues.push('visual dispatch log sent and prepared counts do not match dispatch rows')
}
if (Number(visualDispatchLog.preparedOverdueCount || 0) > 0) {
  visualDispatchLogIssues.push(`visual dispatch log has ${visualDispatchLog.preparedOverdueCount} prepared row(s) past due date`)
}
for (const row of visualDispatchLogRows) {
  if (!row.id || !visualDispatchOutboxCsv.includes(row.id)) visualDispatchLogIssues.push(`visual dispatch log row ${row.id || 'unknown'} is not present in the dispatch outbox CSV`)
  if (row.messageFile && !visualDispatchOutboxCsv.includes(row.messageFile)) visualDispatchLogIssues.push(`visual dispatch log row ${row.id || 'unknown'} message file is not present in the dispatch outbox CSV`)
  if (row.command && !visualDispatchOutboxCsv.includes(row.command)) visualDispatchLogIssues.push(`visual dispatch log row ${row.id || 'unknown'} command is not present in the dispatch outbox CSV`)
  if (row.completedSubmissionPath && !visualDispatchOutboxCsv.includes(row.completedSubmissionPath)) visualDispatchLogIssues.push(`visual dispatch log row ${row.id || 'unknown'} completed submission path is not present in the dispatch outbox CSV`)
}
for (const check of visualDispatchLogChecks) {
  if (!check.ok) visualDispatchLogIssues.push(`visual dispatch log check failed: ${check.name || 'unknown'}`)
}
if (!visualDispatchLogReport.includes('Status: pass')) visualDispatchLogIssues.push('visual dispatch log report is not passing')
if (!visualDispatchLogReport.includes('This dispatch log is send-proof workflow evidence, not completed visual-review history')) {
  visualDispatchLogIssues.push('visual dispatch log report does not restate the evidence boundary')
}
for (const row of visualDispatchLogRows) {
  if (row.id && !visualDispatchLogCsv.includes(row.id)) visualDispatchLogIssues.push(`visual dispatch log CSV missing row ${row.id}`)
}

const blockerBoardIssues = []
const blockerBoardRows = Array.isArray(blockerBoard.rows) ? blockerBoard.rows : []
const blockerBoardBetaRows = blockerBoardRows.filter((row) => row.workType === 'beta-human-review')
const blockerBoardRequiredVisualRows = blockerBoardRows.filter((row) => (
  row.workType === 'production-visual-review' &&
  row.status === 'required for public launch history'
))
const blockerBoardEvidenceChecks = Array.isArray(blockerBoard.rowEvidenceChecks) ? blockerBoard.rowEvidenceChecks : []
const blockerBoardBetaRowsMissingDispatch = blockerBoardBetaRows.filter((row) => (
  !hasText(row.sendBy) ||
  !hasText(row.followUpAt) ||
  row.dispatchStatus !== 'prepared-not-sent' ||
  !Number.isFinite(Number(row.timeboxMinutes)) ||
  !Array.isArray(row.source?.reviewerChecklist) ||
  row.source.reviewerChecklist.length < 6 ||
  !Array.isArray(row.source?.operatorChecklist) ||
  row.source.operatorChecklist.length < 6
))
const blockerBoardBetaRowsWithDueMath = blockerBoardBetaRows.map((row) => ({
  ...row,
  sendInDays: daysBetween(today, row.sendBy),
  followUpInDays: daysBetween(today, row.followUpAt),
  dueInDays: daysBetween(today, row.dueAt),
}))
const betaDispatchRowsPrepared = blockerBoardBetaRowsWithDueMath.filter((row) => row.dispatchStatus === 'prepared-not-sent')
const betaDispatchDueTodayRows = betaDispatchRowsPrepared.filter((row) => row.sendInDays === 0)
const betaDispatchOverdueRows = betaDispatchRowsPrepared.filter((row) => Number.isFinite(row.sendInDays) && row.sendInDays < 0)
const betaFollowUpDueSoonRows = betaDispatchRowsPrepared.filter((row) => (
  Number.isFinite(row.followUpInDays) &&
  row.followUpInDays >= 0 &&
  row.followUpInDays <= 2
))
const betaFollowUpOverdueRows = betaDispatchRowsPrepared.filter((row) => Number.isFinite(row.followUpInDays) && row.followUpInDays < 0)
if (blockerBoard.status !== 'pass') blockerBoardIssues.push('public launch blocker board status is not pass')
if (Number(blockerBoard.checked) < 6) blockerBoardIssues.push('public launch blocker board is missing executable evidence-path and dispatch checks')
if (blockerBoard.publicStatusArtifact !== `qa/${jsonArtifact}`) {
  blockerBoardIssues.push(`public launch blocker board public status ${blockerBoard.publicStatusArtifact || 'missing'} does not match qa/${jsonArtifact}`)
}
if (blockerBoard.betaNextWaveOpsArtifact !== qaDisplayPath(betaNextWaveOpsPath)) {
  blockerBoardIssues.push('public launch blocker board does not reference current beta next-wave ops artifact')
}
if (blockerBoard.betaAllWaveOpsArtifact !== qaDisplayPath(betaAllWaveOpsPath)) {
  blockerBoardIssues.push('public launch blocker board does not reference current beta all-wave ops artifact')
}
if (blockerBoard.visualProgressArtifact !== qaDisplayPath(visualProgressPath)) {
  blockerBoardIssues.push('public launch blocker board does not reference current production visual progress artifact')
}
if (Number(blockerBoard.betaReviewProgress?.remaining) !== betaRemaining) {
  blockerBoardIssues.push(`public launch blocker board beta remaining ${blockerBoard.betaReviewProgress?.remaining ?? 'missing'} does not match ${betaRemaining}`)
}
if (Number(blockerBoard.betaReviewProgress?.openRowCount) !== betaAllWaveOpsRows.length) {
  blockerBoardIssues.push('public launch blocker board beta row count does not match all-wave ops rows')
}
if (Number(blockerBoard.betaReviewProgress?.allWaveCount) < Number(betaSchedule.waveCount || 0)) {
  blockerBoardIssues.push('public launch blocker board beta wave count does not cover all scheduled beta waves')
}
if (blockerBoardBetaRows.length !== betaAllWaveOpsRows.length) {
  blockerBoardIssues.push('public launch blocker board beta work rows do not match all-wave ops rows')
}
if (blockerBoardBetaRowsMissingDispatch.length > 0) {
  blockerBoardIssues.push(`public launch blocker board has ${blockerBoardBetaRowsMissingDispatch.length} beta row(s) missing dispatch operations`)
}
if (betaDispatchOverdueRows.length > 0) {
  blockerBoardIssues.push(`public launch blocker board has ${betaDispatchOverdueRows.length} beta dispatch row(s) past sendBy`)
}
if (betaFollowUpOverdueRows.length > 0) {
  blockerBoardIssues.push(`public launch blocker board has ${betaFollowUpOverdueRows.length} beta dispatch row(s) past followUpAt`)
}
if (Number(blockerBoard.productionVisualProgress?.remainingDistinctDates) !== visualRemaining) {
  blockerBoardIssues.push(`public launch blocker board visual remaining ${blockerBoard.productionVisualProgress?.remainingDistinctDates ?? 'missing'} does not match ${visualRemaining}`)
}
if (blockerBoardRequiredVisualRows.length !== visualRemaining) {
  blockerBoardIssues.push('public launch blocker board required visual row count does not match remaining visual history dates')
}
for (const row of blockerBoardRows) {
  if (!row.id || !row.submissionPath || !blockerBoardCsv.includes(row.id) || !blockerBoardCsv.includes(row.submissionPath)) {
    blockerBoardIssues.push(`public launch blocker board CSV missing row ${row.id || 'unknown'}`)
  }
  if (!hasText(row.validationCommand) || !hasText(row.importCommand)) {
    blockerBoardIssues.push(`public launch blocker board row ${row.id || 'unknown'} is missing validation or import command`)
  }
}
if (blockerBoardEvidenceChecks.length !== blockerBoardRows.length) {
  blockerBoardIssues.push('public launch blocker board evidence checks do not cover every row')
}
for (const check of blockerBoardEvidenceChecks) {
  if (check.packetPath && !(await exists(check.packetPath))) {
    blockerBoardIssues.push(`public launch blocker board packet path is missing for ${check.id}: ${check.packetPath}`)
  }
  if (!check.templatePath || !(await exists(check.templatePath))) {
    blockerBoardIssues.push(`public launch blocker board template path is missing for ${check.id || 'unknown'}: ${check.templatePath || 'missing'}`)
  }
  if (check.hasValidationCommand !== true || check.hasImportCommand !== true) {
    blockerBoardIssues.push(`public launch blocker board evidence commands are missing for ${check.id || 'unknown'}`)
  }
}
if (!blockerBoardReport.includes('This blocker board does not satisfy public launch by itself')) {
  blockerBoardIssues.push('public launch blocker board report does not restate the evidence boundary')
}
if (!blockerBoardReport.includes('## Next Evidence Actions')) {
  blockerBoardIssues.push('public launch blocker board report does not include per-row next evidence actions')
}
if (!blockerBoardReport.includes('prepared-not-sent')) {
  blockerBoardIssues.push('public launch blocker board report does not expose beta dispatch status')
}

const launchTodayIssues = []
const launchTodayRows = Array.isArray(launchOperatorToday.actionRows) ? launchOperatorToday.actionRows : []
const launchTodayBetaRows = launchTodayRows.filter((row) => row.workType === 'beta-human-review')
const launchTodayVisualRows = launchTodayRows.filter((row) => row.workType === 'production-visual-review')
const launchTodayDeploymentRows = launchTodayRows.filter((row) => row.workType === 'production-runtime-deployment')
const launchTodayOutreachRows = launchTodayRows.filter((row) => (
  row.workType === 'beta-human-review' || row.workType === 'production-visual-review'
))
const launchTodayMessageFileChecks = Array.isArray(launchOperatorToday.messageFileChecks)
  ? launchOperatorToday.messageFileChecks
  : []
const launchTodayVisualMessageFileChecks = Array.isArray(launchOperatorToday.visualMessageFileChecks)
  ? launchOperatorToday.visualMessageFileChecks
  : []
const launchTodayMissingMessageFiles = launchTodayMessageFileChecks.filter((check) => check.exists !== true)
const launchTodayMissingVisualMessageFiles = launchTodayVisualMessageFileChecks.filter((check) => check.exists !== true)
const betaDispatchLogDueTodayRows = betaDispatchLogRows.filter((row) => row.sendStatus !== 'sent' && daysBetween(today, row.expectedSendBy) === 0)
const betaDispatchLogOverdueRows = betaDispatchLogRows.filter((row) => {
  const delta = daysBetween(today, row.expectedSendBy)
  return row.sendStatus !== 'sent' && Number.isFinite(delta) && delta < 0
})
const visualDispatchLogRequiredDueSoonRows = visualDispatchLogRows.filter((row) => {
  const delta = daysBetween(today, row.dueAt)
  return row.sendStatus !== 'sent' && row.requiredForPublicLaunch === true && Number.isFinite(delta) && delta >= 0 && delta <= 7
})
const visualDispatchLogRequiredOverdueRows = visualDispatchLogRows.filter((row) => {
  const delta = daysBetween(today, row.dueAt)
  return row.sendStatus !== 'sent' && row.requiredForPublicLaunch === true && Number.isFinite(delta) && delta < 0
})
if (launchOperatorToday.status !== 'pass') launchTodayIssues.push('launch operator today status is not pass')
if (launchOperatorToday.today !== today) {
  launchTodayIssues.push(`launch operator today date ${launchOperatorToday.today || 'missing'} does not match ${today}`)
}
if (launchOperatorToday.publicStatusArtifact !== `qa/${jsonArtifact}`) {
  launchTodayIssues.push(`launch operator today public status ${launchOperatorToday.publicStatusArtifact || 'missing'} does not match qa/${jsonArtifact}`)
}
if (launchOperatorToday.blockerBoardArtifact !== qaDisplayPath(blockerBoardPath)) {
  launchTodayIssues.push('launch operator today does not reference current blocker board')
}
if (launchOperatorToday.betaDispatchOutboxArtifact !== qaDisplayPath(betaDispatchOutboxPath)) {
  launchTodayIssues.push('launch operator today does not reference current beta dispatch outbox')
}
if (launchOperatorToday.betaDispatchLogArtifact !== qaDisplayPath(betaDispatchLogPath)) {
  launchTodayIssues.push('launch operator today does not reference current beta dispatch log')
}
if (launchOperatorToday.visualDispatchLogArtifact !== qaDisplayPath(visualDispatchLogPath)) {
  launchTodayIssues.push('launch operator today does not reference current visual dispatch log')
}
if (Number(launchOperatorToday.betaDispatchDueTodayCount) !== betaDispatchLogDueTodayRows.length) {
  launchTodayIssues.push(`launch operator today beta invites due today ${launchOperatorToday.betaDispatchDueTodayCount ?? 'missing'} does not match dispatch log ${betaDispatchLogDueTodayRows.length}`)
}
if (Number(launchOperatorToday.betaDispatchLogPreparedDueTodayCount) !== betaDispatchLogDueTodayRows.length) {
  launchTodayIssues.push('launch operator today beta dispatch-log due-today count does not match dispatch log')
}
if (Number(launchOperatorToday.betaDispatchLogPreparedOverdueCount) !== betaDispatchLogOverdueRows.length) {
  launchTodayIssues.push('launch operator today beta dispatch-log overdue count does not match dispatch log')
}
if (Number(launchOperatorToday.betaDispatchOverdueCount) !== betaDispatchLogOverdueRows.length) {
  launchTodayIssues.push('launch operator today beta overdue count does not match dispatch log')
}
if (Number(launchOperatorToday.betaDispatchOverdueCount) !== 0) {
  launchTodayIssues.push(`launch operator today has ${launchOperatorToday.betaDispatchOverdueCount} overdue beta dispatch row(s)`)
}
if (Number(launchOperatorToday.visualOverdueCount) !== 0) {
  launchTodayIssues.push(`launch operator today has ${launchOperatorToday.visualOverdueCount} overdue production visual row(s)`)
}
if (Number(launchOperatorToday.visualDispatchLogPreparedDueSoonCount) !== visualDispatchLogRequiredDueSoonRows.length) {
  launchTodayIssues.push('launch operator today visual dispatch-log due-soon count does not match required visual dispatch log rows')
}
if (Number(launchOperatorToday.visualDispatchLogPreparedOverdueCount) !== visualDispatchLogRequiredOverdueRows.length) {
  launchTodayIssues.push('launch operator today visual dispatch-log overdue count does not match required visual dispatch log rows')
}
if (launchTodayBetaRows.length < betaDispatchLogDueTodayRows.length) {
  launchTodayIssues.push('launch operator today does not include every unsent beta invite due today')
}
if (launchTodayVisualRows.length < Number(visualProgress.dueSoonScheduledReviewCount || 0)) {
  launchTodayIssues.push('launch operator today does not include every due-soon production visual review')
}
if (deploymentCurrency.enforced && deploymentCurrency.runtimeCommitAhead && !launchTodayDeploymentRows.some((row) => row.id === 'production-runtime-deployment-currency')) {
  launchTodayIssues.push('launch operator today does not include the production runtime deployment blocker')
}
if (!(deploymentCurrency.enforced && deploymentCurrency.runtimeCommitAhead) && launchTodayDeploymentRows.length > 0) {
  launchTodayIssues.push('launch operator today includes a stale production runtime deployment action')
}
if (launchTodayMessageFileChecks.length !== launchTodayBetaRows.length) {
  launchTodayIssues.push('launch operator today message-file checks do not cover every beta action row')
}
for (const check of launchTodayMissingMessageFiles) {
  launchTodayIssues.push(`launch operator today message file is missing for ${check.id || 'unknown'}`)
}
if (launchTodayVisualMessageFileChecks.length !== launchTodayVisualRows.length) {
  launchTodayIssues.push('launch operator today visual message-file checks do not cover every visual action row')
}
for (const check of launchTodayMissingVisualMessageFiles) {
  launchTodayIssues.push(`launch operator today visual message file is missing for ${check.id || 'unknown'}`)
}
for (const row of launchTodayRows) {
  const requiresSubmissionPath = row.workType === 'beta-human-review' || row.workType === 'production-visual-review'
  if (
    !row.id ||
    (requiresSubmissionPath && !row.submissionPath) ||
    !launchOperatorTodayCsv.includes(row.id) ||
    (requiresSubmissionPath && !launchOperatorTodayCsv.includes(row.submissionPath))
  ) {
    launchTodayIssues.push(`launch operator today CSV missing row ${row.id || 'unknown'}`)
  }
  if (!row.sendStatus || !launchOperatorTodayCsv.includes(row.sendStatus)) {
    launchTodayIssues.push(`launch operator today CSV missing send status for ${row.id || 'unknown'}`)
  }
}
if (!launchOperatorTodayReport.includes('## Do Today')) {
  launchTodayIssues.push('launch operator today report is missing the action table')
}
if (!launchOperatorTodayReport.includes('do not treat sent messages as completed review evidence')) {
  launchTodayIssues.push('launch operator today report does not restate the beta evidence boundary')
}
if (!launchOperatorTodayReport.includes('After sending an invite or visual-review assignment')) {
  launchTodayIssues.push('launch operator today report does not describe dispatch-log update workflow')
}

const launchTodayOverdueRehearsalIssues = []
const expectedLaunchTodayOverdueFailure = 'launch today has no overdue launch execution rows'
const launchTodayOverdueRowsDetected =
  Number(launchOperatorTodayOverdueRehearsal.detectedOverdueRows?.betaDispatchOverdueCount || 0) +
  Number(launchOperatorTodayOverdueRehearsal.detectedOverdueRows?.visualOverdueCount || 0)
if (launchOperatorTodayOverdueRehearsal.status !== 'pass') {
  launchTodayOverdueRehearsalIssues.push('launch operator overdue rehearsal status is not pass')
}
if (launchOperatorTodayOverdueRehearsal.date !== today) {
  launchTodayOverdueRehearsalIssues.push(`launch operator overdue rehearsal date ${launchOperatorTodayOverdueRehearsal.date || 'missing'} does not match ${today}`)
}
if (launchOperatorTodayOverdueRehearsal.overdueToday === today || !launchOperatorTodayOverdueRehearsal.overdueToday) {
  launchTodayOverdueRehearsalIssues.push('launch operator overdue rehearsal does not use an isolated simulated date')
}
if (Number(launchOperatorTodayOverdueRehearsal.launchOperatorExitCode) === 0) {
  launchTodayOverdueRehearsalIssues.push('launch operator overdue rehearsal did not observe a failing daily-board exit')
}
if (launchTodayOverdueRowsDetected <= 0) {
  launchTodayOverdueRehearsalIssues.push('launch operator overdue rehearsal did not detect overdue rows')
}
if (launchOperatorTodayOverdueRehearsal.expectedFailureName !== expectedLaunchTodayOverdueFailure) {
  launchTodayOverdueRehearsalIssues.push('launch operator overdue rehearsal expected failure name changed')
}
if (launchOperatorTodayOverdueRehearsal.rawLaunchArtifactsCleanedUp !== true) {
  launchTodayOverdueRehearsalIssues.push('launch operator overdue rehearsal left raw simulated-date artifacts behind')
}
if (launchOperatorTodayOverdueRehearsal.currentLaunchArtifact !== qaDisplayPath(launchOperatorTodayPath)) {
  launchTodayOverdueRehearsalIssues.push('launch operator overdue rehearsal does not reference the current passing board')
}
if (!launchOperatorTodayOverdueRehearsalReport.includes('fails when launch execution rows become overdue')) {
  launchTodayOverdueRehearsalIssues.push('launch operator overdue rehearsal report does not state the failure-path meaning')
}

const launchSentDispatchRehearsalIssues = []
const launchSentDispatchActionIds = Array.isArray(launchOperatorSentDispatchRehearsal.launchOperatorActionIds)
  ? launchOperatorSentDispatchRehearsal.launchOperatorActionIds
  : []
if (launchOperatorSentDispatchRehearsal.status !== 'pass') {
  launchSentDispatchRehearsalIssues.push('launch operator sent-dispatch rehearsal status is not pass')
}
if (launchOperatorSentDispatchRehearsal.date !== today) {
  launchSentDispatchRehearsalIssues.push(`launch operator sent-dispatch rehearsal date ${launchOperatorSentDispatchRehearsal.date || 'missing'} does not match ${today}`)
}
if (!launchOperatorSentDispatchRehearsal.selectedRows?.beta || !launchOperatorSentDispatchRehearsal.selectedRows?.visual) {
  launchSentDispatchRehearsalIssues.push('launch operator sent-dispatch rehearsal did not select beta and visual rows')
}
if (Number(launchOperatorSentDispatchRehearsal.launchOperatorExitCode) !== 0) {
  launchSentDispatchRehearsalIssues.push('launch operator sent-dispatch rehearsal did not observe a passing daily-board exit')
}
if (launchOperatorSentDispatchRehearsal.launchOperatorStatus !== 'pass') {
  launchSentDispatchRehearsalIssues.push('launch operator sent-dispatch rehearsal launch board status is not pass')
}
if (launchOperatorSentDispatchRehearsal.launchOperatorPublicLaunchStatus !== 'beta-ready-public-blocked') {
  launchSentDispatchRehearsalIssues.push('launch operator sent-dispatch rehearsal changed the public launch status')
}
if (launchSentDispatchActionIds.includes(launchOperatorSentDispatchRehearsal.selectedRows?.beta)) {
  launchSentDispatchRehearsalIssues.push('launch operator sent-dispatch rehearsal left selected beta row in send actions')
}
if (launchSentDispatchActionIds.includes(launchOperatorSentDispatchRehearsal.selectedRows?.visual)) {
  launchSentDispatchRehearsalIssues.push('launch operator sent-dispatch rehearsal left selected visual row in send actions')
}
if (launchOperatorSentDispatchRehearsal.currentLaunchArtifact !== qaDisplayPath(launchOperatorTodayPath)) {
  launchSentDispatchRehearsalIssues.push('launch operator sent-dispatch rehearsal does not reference the current passing board')
}
if (launchOperatorSentDispatchRehearsal.rawArtifactsCleanedUp !== true) {
  launchSentDispatchRehearsalIssues.push('launch operator sent-dispatch rehearsal left raw temporary artifacts behind')
}
if (!launchOperatorSentDispatchRehearsalReport.includes('sent rows drop out of the send-action list')) {
  launchSentDispatchRehearsalIssues.push('launch operator sent-dispatch rehearsal report does not state the sent-state meaning')
}

const dispatchMarkSentDryRunIssues = []
const dispatchMarkSentUpdatedArtifacts = Array.isArray(dispatchMarkSentDryRun.updatedLogArtifacts)
  ? dispatchMarkSentDryRun.updatedLogArtifacts
  : []
if (dispatchMarkSentDryRun.status !== 'pass') {
  dispatchMarkSentDryRunIssues.push('dispatch mark-sent dry run status is not pass')
}
if (dispatchMarkSentDryRun.date !== today) {
  dispatchMarkSentDryRunIssues.push(`dispatch mark-sent dry run date ${dispatchMarkSentDryRun.date || 'missing'} does not match ${today}`)
}
if (dispatchMarkSentDryRun.importMode !== false) {
  dispatchMarkSentDryRunIssues.push('dispatch mark-sent dry run unexpectedly ran in import mode')
}
if (dispatchMarkSentDryRun.recordArtifact !== 'qa/dispatch-log-mark-sent-fixture-2026-05-22.json') {
  dispatchMarkSentDryRunIssues.push('dispatch mark-sent dry run fixture artifact changed')
}
if (Number(dispatchMarkSentDryRun.requestedUpdateCount || 0) < 2) {
  dispatchMarkSentDryRunIssues.push('dispatch mark-sent dry run did not validate beta and visual rows')
}
if (Number(dispatchMarkSentDryRun.betaUpdateCount || 0) <= 0) {
  dispatchMarkSentDryRunIssues.push('dispatch mark-sent dry run did not validate a beta row')
}
if (Number(dispatchMarkSentDryRun.visualUpdateCount || 0) <= 0) {
  dispatchMarkSentDryRunIssues.push('dispatch mark-sent dry run did not validate a visual row')
}
if (!dispatchMarkSentUpdatedArtifacts.includes(qaDisplayPath(betaDispatchLogPath))) {
  dispatchMarkSentDryRunIssues.push('dispatch mark-sent dry run does not target the beta dispatch log')
}
if (!dispatchMarkSentUpdatedArtifacts.includes(qaDisplayPath(visualDispatchLogPath))) {
  dispatchMarkSentDryRunIssues.push('dispatch mark-sent dry run does not target the visual dispatch log')
}
if (!dispatchMarkSentDryRunReport.includes('Dry run validates the record without mutating dispatch logs')) {
  dispatchMarkSentDryRunIssues.push('dispatch mark-sent dry run report does not state the non-mutating workflow')
}

const dispatchMarkSentImportRehearsalIssues = []
const dispatchMarkSentImportActionIds = Array.isArray(dispatchMarkSentImportRehearsal.launchOperatorActionIds)
  ? dispatchMarkSentImportRehearsal.launchOperatorActionIds
  : []
if (dispatchMarkSentImportRehearsal.status !== 'pass') {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal status is not pass')
}
if (dispatchMarkSentImportRehearsal.date !== today) {
  dispatchMarkSentImportRehearsalIssues.push(`dispatch mark-sent import rehearsal date ${dispatchMarkSentImportRehearsal.date || 'missing'} does not match ${today}`)
}
if (dispatchMarkSentImportRehearsal.fixtureArtifact !== 'qa/dispatch-log-mark-sent-fixture-2026-05-22.json') {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal fixture artifact changed')
}
if (Number(dispatchMarkSentImportRehearsal.markSentExitCode) !== 0) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal mark-sent command did not exit cleanly')
}
if (dispatchMarkSentImportRehearsal.markSentStatus !== 'pass') {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal mark-sent status is not pass')
}
if (dispatchMarkSentImportRehearsal.markSentImportMode !== true) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal did not run import mode')
}
if (!dispatchMarkSentImportRehearsal.importedRows?.beta) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal did not import a beta row')
}
if (!dispatchMarkSentImportRehearsal.importedRows?.visual) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal did not import a visual row')
}
if (Number(dispatchMarkSentImportRehearsal.tempBetaSentCount || 0) <= 0) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal did not create sent beta state on isolated log')
}
if (Number(dispatchMarkSentImportRehearsal.tempVisualSentCount || 0) <= 0) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal did not create sent visual state on isolated log')
}
if (Number(dispatchMarkSentImportRehearsal.launchOperatorExitCode) !== 0) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal launch operator did not exit cleanly')
}
if (dispatchMarkSentImportRehearsal.launchOperatorStatus !== 'pass') {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal launch operator status is not pass')
}
if (dispatchMarkSentImportRehearsal.launchOperatorPublicLaunchStatus !== 'beta-ready-public-blocked') {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal unexpectedly changed public launch status')
}
if (dispatchMarkSentImportActionIds.includes(dispatchMarkSentImportRehearsal.importedRows?.beta)) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal left imported beta row in launch actions')
}
if (dispatchMarkSentImportActionIds.includes(dispatchMarkSentImportRehearsal.importedRows?.visual)) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal left imported visual row in launch actions')
}
if (Number(dispatchMarkSentImportRehearsal.launchOperatorBetaCompleted || 0) !== 0) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal advanced beta review evidence')
}
if (Number(dispatchMarkSentImportRehearsal.launchOperatorVisualHistoryCount || 0) !== 2) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal changed production visual review evidence')
}
if (Number(dispatchMarkSentImportRehearsal.canonicalBetaSentCount || 0) !== 0) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal mutated canonical beta dispatch log')
}
if (Number(dispatchMarkSentImportRehearsal.canonicalVisualSentCount || 0) !== 0) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal mutated canonical visual dispatch log')
}
if (dispatchMarkSentImportRehearsal.rawArtifactsCleanedUp !== true) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal left raw temporary artifacts behind')
}
if (!dispatchMarkSentImportRehearsalReport.includes('import mode can update isolated dispatch logs without mutating canonical launch evidence')) {
  dispatchMarkSentImportRehearsalIssues.push('dispatch mark-sent import rehearsal report does not state the isolated import workflow')
}

const dispatchSentRecordTemplateIssues = []
const dispatchSentRecordTemplateRows = Array.isArray(dispatchSentRecordTemplate.rows)
  ? dispatchSentRecordTemplate.rows
  : []
const dispatchSentRecordMessageFileChecks = Array.isArray(dispatchSentRecordTemplate.messageFileChecks)
  ? dispatchSentRecordTemplate.messageFileChecks
  : []
const dispatchSentRecordSubmissionTemplateChecks = Array.isArray(dispatchSentRecordTemplate.submissionTemplateChecks)
  ? dispatchSentRecordTemplate.submissionTemplateChecks
  : []
const dispatchSentRecordBlankRows = dispatchSentRecordTemplateRows.filter((row) => (
  !row.reviewerAlias &&
  !row.deliveryChannel &&
  !row.sentAt &&
  !row.contactRecordLocation
))
if (dispatchSentRecordTemplate.status !== 'pass') {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template status is not pass')
}
if (dispatchSentRecordTemplate.date !== today) {
  dispatchSentRecordTemplateIssues.push(`dispatch sent-record template date ${dispatchSentRecordTemplate.date || 'missing'} does not match ${today}`)
}
if (dispatchSentRecordTemplate.launchOperatorArtifact !== qaDisplayPath(launchOperatorTodayPath)) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template does not reference current launch operator board')
}
if (dispatchSentRecordTemplate.readyForImport !== false) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template is incorrectly marked ready for import before real sends')
}
if (Number(dispatchSentRecordTemplate.rowCount || 0) !== launchTodayOutreachRows.length) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template row count does not match launch operator outreach action rows')
}
if (Number(dispatchSentRecordTemplate.betaRowCount || 0) !== launchTodayBetaRows.length) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template beta row count does not match launch operator beta action rows')
}
if (Number(dispatchSentRecordTemplate.visualRowCount || 0) !== launchTodayVisualRows.length) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template visual row count does not match launch operator visual action rows')
}
if (dispatchSentRecordTemplateRows.length !== launchTodayOutreachRows.length) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template rows do not cover every launch operator outreach action row')
}
if (dispatchSentRecordBlankRows.length !== dispatchSentRecordTemplateRows.length) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template includes prefilled sent proof fields')
}
if (!dispatchSentRecordMessageFileChecks.every((check) => check.exists === true)) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template references missing message files')
}
if (!dispatchSentRecordSubmissionTemplateChecks.every((check) => check.exists === true)) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template references missing submission templates')
}
if (!String(dispatchSentRecordTemplate.validationCommand || '').includes('qa:dispatch-mark-sent')) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template validation command is missing mark-sent dry run')
}
if (!String(dispatchSentRecordTemplate.importCommand || '').includes('QA_DISPATCH_MARK_SENT_IMPORT=1')) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template import command is missing import mode')
}
if (!dispatchSentRecordTemplateReport.includes('This file is not a sent proof')) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template report does not state the evidence boundary')
}
if (!dispatchSentRecordTemplateCsv.includes('completedSubmissionPath')) {
  dispatchSentRecordTemplateIssues.push('dispatch sent-record template CSV is missing completed submission target column')
}

const dispatchSentRecordTemplateRejectionIssues = []
const dispatchSentRecordTemplateRejectionMissingFields = Array.isArray(dispatchSentRecordTemplateRejection.missingFieldNames)
  ? dispatchSentRecordTemplateRejection.missingFieldNames
  : []
const requiredDispatchSentProofFields = ['reviewerAlias', 'deliveryChannel', 'sentAt', 'contactRecordLocation']
if (dispatchSentRecordTemplateRejection.status !== 'pass') {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection status is not pass')
}
if (dispatchSentRecordTemplateRejection.date !== today) {
  dispatchSentRecordTemplateRejectionIssues.push(`dispatch sent-record template rejection date ${dispatchSentRecordTemplateRejection.date || 'missing'} does not match ${today}`)
}
if (dispatchSentRecordTemplateRejection.templateArtifact !== qaDisplayPath(dispatchSentRecordTemplatePath)) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection does not target the current sent-record template')
}
if (Number(dispatchSentRecordTemplateRejection.markSentExitCode) === 0) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection did not fail the blank import attempt')
}
if (dispatchSentRecordTemplateRejection.markSentStatus !== 'fail') {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection did not record a failed mark-sent status')
}
if (dispatchSentRecordTemplateRejection.markSentImportMode !== true) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection did not exercise import mode')
}
if (Number(dispatchSentRecordTemplateRejection.requestedUpdateCount || 0) !== Number(dispatchSentRecordTemplate.rowCount || 0)) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection did not test every template row')
}
if (Number(dispatchSentRecordTemplateRejection.betaUpdateCount || 0) !== 0) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection imported beta rows')
}
if (Number(dispatchSentRecordTemplateRejection.visualUpdateCount || 0) !== 0) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection imported visual rows')
}
if (Number(dispatchSentRecordTemplateRejection.rejectionIssueCount || 0) === 0) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection did not record validation issues')
}
for (const field of requiredDispatchSentProofFields) {
  if (!dispatchSentRecordTemplateRejectionMissingFields.includes(field)) {
    dispatchSentRecordTemplateRejectionIssues.push(`dispatch sent-record template rejection did not name missing ${field}`)
  }
}
if (dispatchSentRecordTemplateRejection.canonicalBetaUnchanged !== true) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection mutated the canonical beta dispatch log')
}
if (dispatchSentRecordTemplateRejection.canonicalVisualUnchanged !== true) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection mutated the canonical visual dispatch log')
}
if (Number(dispatchSentRecordTemplateRejection.canonicalBetaSentCount || 0) !== 0) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection advanced canonical beta sent count')
}
if (Number(dispatchSentRecordTemplateRejection.canonicalVisualSentCount || 0) !== 0) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection advanced canonical visual sent count')
}
if (dispatchSentRecordTemplateRejection.rawArtifactsCleanedUp !== true) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection left raw temporary artifacts behind')
}
if (!dispatchSentRecordTemplateRejectionReport.includes('blank sent-record template is rejected before import and cannot mutate canonical dispatch logs')) {
  dispatchSentRecordTemplateRejectionIssues.push('dispatch sent-record template rejection report does not state the pre-import safety guarantee')
}

const reviewIntakeRehearsalIssues = []
if (reviewIntakeRehearsal.status !== 'pass') {
  reviewIntakeRehearsalIssues.push('review intake rehearsal status is not pass')
}
if (reviewIntakeRehearsal.date !== today) {
  reviewIntakeRehearsalIssues.push(`review intake rehearsal date ${reviewIntakeRehearsal.date || 'missing'} does not match ${today}`)
}
if (Number(reviewIntakeRehearsal.betaIntakeExitCode) === 0) {
  reviewIntakeRehearsalIssues.push('review intake rehearsal did not observe beta intake rejection')
}
if (Number(reviewIntakeRehearsal.visualIntakeExitCode) === 0) {
  reviewIntakeRehearsalIssues.push('review intake rehearsal did not observe visual intake rejection')
}
if (Number(reviewIntakeRehearsal.betaInvalidSubmissionCount || 0) <= 0) {
  reviewIntakeRehearsalIssues.push('review intake rehearsal did not detect invalid beta submission')
}
if (Number(reviewIntakeRehearsal.visualInvalidSubmissionCount || 0) <= 0) {
  reviewIntakeRehearsalIssues.push('review intake rehearsal did not detect invalid visual submission')
}
if (Number(reviewIntakeRehearsal.betaCompletedBefore) !== Number(reviewIntakeRehearsal.betaCompletedAfter)) {
  reviewIntakeRehearsalIssues.push('review intake rehearsal mutated beta completed-review count')
}
if (Number(reviewIntakeRehearsal.visualHistoryBefore) !== Number(reviewIntakeRehearsal.visualHistoryAfter)) {
  reviewIntakeRehearsalIssues.push('review intake rehearsal mutated production visual-review history')
}
if (reviewIntakeRehearsal.rawArtifactsCleanedUp !== true) {
  reviewIntakeRehearsalIssues.push('review intake rehearsal left raw temporary artifacts behind')
}
if (!reviewIntakeRehearsalReport.includes('reject them as incomplete evidence')) {
  reviewIntakeRehearsalIssues.push('review intake rehearsal report does not state the fake-evidence boundary')
}

const reviewIntakeImportRehearsalIssues = []
if (reviewIntakeImportRehearsal.status !== 'pass') {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal status is not pass')
}
if (reviewIntakeImportRehearsal.date !== today) {
  reviewIntakeImportRehearsalIssues.push(`review intake import rehearsal date ${reviewIntakeImportRehearsal.date || 'missing'} does not match ${today}`)
}
if (Number(reviewIntakeImportRehearsal.betaIntakeExitCode) !== 0 || reviewIntakeImportRehearsal.betaIntakeStatus !== 'pass') {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal did not pass beta intake against copied register')
}
if (reviewIntakeImportRehearsal.betaImported !== true) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal did not import beta evidence into copied register')
}
if (Number(reviewIntakeImportRehearsal.betaValidSubmissionCount || 0) !== 1 || Number(reviewIntakeImportRehearsal.betaInvalidSubmissionCount || 0) !== 0) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal beta submission counts are not clean')
}
if (Number(reviewIntakeImportRehearsal.tempBetaCompletedAfter || 0) !== Number(reviewIntakeImportRehearsal.tempBetaCompletedBefore || 0) + 1) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal did not advance copied beta completed count by one')
}
if (Number(reviewIntakeImportRehearsal.visualIntakeExitCode) !== 0 || reviewIntakeImportRehearsal.visualIntakeStatus !== 'pass') {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal did not pass visual intake against copied register')
}
if (reviewIntakeImportRehearsal.visualImported !== true) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal did not import visual evidence into copied register')
}
if (Number(reviewIntakeImportRehearsal.visualValidSubmissionCount || 0) !== 1 || Number(reviewIntakeImportRehearsal.visualInvalidSubmissionCount || 0) !== 0) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal visual submission counts are not clean')
}
if (Number(reviewIntakeImportRehearsal.tempVisualHistoryAfter || 0) !== Number(reviewIntakeImportRehearsal.tempVisualHistoryBefore || 0) + 1) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal did not advance copied visual history by one')
}
if (reviewIntakeImportRehearsal.canonicalBetaUnchanged !== true || reviewIntakeImportRehearsal.canonicalVisualUnchanged !== true) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal mutated canonical launch evidence')
}
if (Number(reviewIntakeImportRehearsal.canonicalBetaCompletedAfter || 0) !== Number(reviewIntakeImportRehearsal.canonicalBetaCompletedBefore || 0)) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal changed canonical beta completed count')
}
if (Number(reviewIntakeImportRehearsal.canonicalVisualHistoryAfter || 0) !== Number(reviewIntakeImportRehearsal.canonicalVisualHistoryBefore || 0)) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal changed canonical visual history count')
}
if (reviewIntakeImportRehearsal.rawArtifactsCleanedUp !== true) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal left raw temporary artifacts behind')
}
if (!reviewIntakeImportRehearsalReport.includes('valid completed beta and production visual-review evidence can be imported against isolated register copies')) {
  reviewIntakeImportRehearsalIssues.push('review intake import rehearsal report does not state the isolated import guarantee')
}

const publicLaunchModeRehearsalIssues = []
const publicLaunchModeBlockers = Array.isArray(publicLaunchModeRehearsal.blockers)
  ? publicLaunchModeRehearsal.blockers
  : []
const publicLaunchModeBlockerIds = publicLaunchModeBlockers.map((blocker) => blocker.id).filter(Boolean)
if (publicLaunchModeRehearsal.status !== 'pass') {
  publicLaunchModeRehearsalIssues.push('public launch mode rehearsal status is not pass')
}
if (publicLaunchModeRehearsal.date !== today) {
  publicLaunchModeRehearsalIssues.push(`public launch mode rehearsal date ${publicLaunchModeRehearsal.date || 'missing'} does not match ${today}`)
}
if (Number(publicLaunchModeRehearsal.publicLaunchModeExitCode) === 0) {
  publicLaunchModeRehearsalIssues.push('public launch mode rehearsal did not observe strict public-mode failure')
}
if (publicLaunchModeRehearsal.publicLaunchStatus !== 'beta-ready-public-blocked') {
  publicLaunchModeRehearsalIssues.push(`public launch mode rehearsal status ${publicLaunchModeRehearsal.publicLaunchStatus || 'missing'} is not beta-ready-public-blocked`)
}
if (publicLaunchModeRehearsal.betaReady !== true || publicLaunchModeRehearsal.publicLaunchReady !== false || publicLaunchModeRehearsal.requirePublicLaunch !== true) {
  publicLaunchModeRehearsalIssues.push('public launch mode rehearsal does not preserve beta-ready/public-blocked semantics')
}
if (!publicLaunchModeBlockerIds.includes('beta-human-review-threshold') || !publicLaunchModeBlockerIds.includes('production-visual-review-history')) {
  publicLaunchModeRehearsalIssues.push('public launch mode rehearsal does not expose both public blockers')
}
if (!Array.isArray(publicLaunchModeRehearsal.guardrailIssues) || publicLaunchModeRehearsal.guardrailIssues.length !== 0) {
  publicLaunchModeRehearsalIssues.push('public launch mode rehearsal has guardrail regressions')
}
if (publicLaunchModeRehearsal.canonicalRestored !== true) {
  publicLaunchModeRehearsalIssues.push('public launch mode rehearsal did not restore canonical default status')
}
if (!publicLaunchModeRehearsalReport.includes('fails while beta-review and production visual-review blockers remain')) {
  publicLaunchModeRehearsalIssues.push('public launch mode rehearsal report does not state the strict public-mode boundary')
}

const publicLaunchThresholdRehearsalIssues = []
if (publicLaunchThresholdRehearsal.status !== 'pass') {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal status is not pass')
}
if (publicLaunchThresholdRehearsal.date !== today) {
  publicLaunchThresholdRehearsalIssues.push(`public launch threshold rehearsal date ${publicLaunchThresholdRehearsal.date || 'missing'} does not match ${today}`)
}
if (Number(publicLaunchThresholdRehearsal.simulatedBetaCompletedReviewCount || 0) < publicBetaMinimum) {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal does not simulate enough beta reviews')
}
if (Number(publicLaunchThresholdRehearsal.simulatedBetaRemainingReviewsForMinimum || 0) !== 0) {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal still has simulated beta reviews remaining')
}
if (publicLaunchThresholdRehearsal.simulatedBetaPublicLaunchReadiness !== 'ready') {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal beta readiness is not ready')
}
if (Number(publicLaunchThresholdRehearsal.simulatedVisualDistinctHistoryDateCount || 0) < visualMinimum) {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal does not simulate enough visual history dates')
}
if (Number(publicLaunchThresholdRehearsal.simulatedVisualRemainingHistoryDateCount || 0) !== 0) {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal still has simulated visual history dates remaining')
}
if (publicLaunchThresholdRehearsal.simulatedVisualPublicLaunchReadiness !== 'ready') {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal visual readiness is not ready')
}
if (publicLaunchThresholdRehearsal.canonicalBetaUnchanged !== true || publicLaunchThresholdRehearsal.canonicalVisualUnchanged !== true) {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal mutated canonical launch evidence')
}
if (Number(publicLaunchThresholdRehearsal.canonicalBetaCompletedBefore || 0) !== Number(publicLaunchThresholdRehearsal.canonicalBetaCompletedAfter || 0)) {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal changed canonical beta completed count')
}
if (Number(publicLaunchThresholdRehearsal.canonicalVisualHistoryBefore || 0) !== Number(publicLaunchThresholdRehearsal.canonicalVisualHistoryAfter || 0)) {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal changed canonical visual history count')
}
if (publicLaunchThresholdRehearsal.rawArtifactsCleanedUp !== true) {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal left raw temporary artifacts behind')
}
if (!publicLaunchThresholdRehearsalReport.includes('two real public-launch threshold gates turn ready')) {
  publicLaunchThresholdRehearsalIssues.push('public launch threshold rehearsal report does not state the threshold guarantee')
}

const visualProgressIssues = []
if (visualProgress.status !== 'pass') {
  visualProgressIssues.push('progress artifact status is not pass')
}
if (visualProgress.registerPath !== visualRegisterPath) {
  visualProgressIssues.push(`progress register path ${visualProgress.registerPath || 'missing'} does not match ${visualRegisterPath}`)
}
if (Number(visualProgress.reviewHistoryCount) !== visualHistory.length) {
  visualProgressIssues.push(`progress history count ${visualProgress.reviewHistoryCount ?? 'missing'} does not match ${visualHistory.length}`)
}
if (Number(visualProgress.distinctHistoryDateCount) !== visualHistoryDates.length) {
  visualProgressIssues.push(`progress distinct history date count ${visualProgress.distinctHistoryDateCount ?? 'missing'} does not match ${visualHistoryDates.length}`)
}
if (Number(visualProgress.remainingRequiredReviewDates) !== visualRemaining) {
  visualProgressIssues.push(`progress remaining review count ${visualProgress.remainingRequiredReviewDates ?? 'missing'} does not match ${visualRemaining}`)
}
if (Number(visualProgress.scheduledReviewCount) !== scheduledVisualReviews.length) {
  visualProgressIssues.push(`progress scheduled review count ${visualProgress.scheduledReviewCount ?? 'missing'} does not match ${scheduledVisualReviews.length}`)
}
if (Number(visualProgress.overdueScheduledReviewCount || 0) > 0) {
  visualProgressIssues.push(`progress has ${Number(visualProgress.overdueScheduledReviewCount || 0)} overdue scheduled visual review(s)`)
}
if (Number(visualProgress.latestProductionReview?.issueCount) !== 0) {
  visualProgressIssues.push('progress latest production review has unresolved evidence issues')
}

const openBlockingRisks = (Array.isArray(riskRegister.issues) ? riskRegister.issues : [])
  .filter((issue) => ['P0', 'P1'].includes(String(issue.severity || '').toUpperCase()) && String(issue.status || '').toLowerCase() === 'open')
const openAcceptedP2Risks = (Array.isArray(riskRegister.issues) ? riskRegister.issues : [])
  .filter((issue) => String(issue.severity || '').toUpperCase() === 'P2' && String(issue.status || '').toLowerCase() === 'open')
const incompleteAcceptedP2Risks = openAcceptedP2Risks.filter((issue) => (
  !hasText(issue.owner) ||
  !hasText(issue.targetMonth) ||
  !hasText(issue.acceptedRisk, 40)
))
const acceptedRiskEvidenceIssues = []
for (const issue of openAcceptedP2Risks) {
  const note = String(issue.acceptedRisk || '')
  if (issue.id === 'GT-P2-001') {
    const expectedReviewCount = `${completedBetaReviews.length}/${publicBetaMinimum}`
    const nextWaveOpsDisplayPath = qaDisplayPath(betaNextWaveOpsPath)
    if (!note.includes(expectedReviewCount)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current beta review progress ${expectedReviewCount}`)
    }
    if (betaRemaining > 0 && !note.includes(`${betaRemaining} remaining`)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current beta review remaining count ${betaRemaining}`)
    }
    if (hasText(nextWaveOpsDisplayPath) && !note.includes(nextWaveOpsDisplayPath)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current beta next-wave ops artifact ${nextWaveOpsDisplayPath}`)
    }
    if (hasText(betaNextWave?.waveId) && !note.includes(betaNextWave.waveId)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current beta next wave ${betaNextWave.waveId}`)
    }
    if (betaNextWaveOpsRows.length > 0 && !note.includes(`${betaNextWaveOpsRows.length} next-wave operator rows`)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current beta next-wave operator row count ${betaNextWaveOpsRows.length}`)
    }
  }
  if (issue.id === 'GT-P2-002') {
    const expectedVisualCount = `${visualHistoryDates.length}/${visualMinimum}`
    const latestProductionReview = visualProgress.latestProductionReview || {}
    const latestArtifact = qaDisplayPath(latestProductionReview.artifact)
    const latestSummaryArtifact = qaDisplayPath(latestProductionReview.summaryArtifact)
    const latestCommit = String(latestProductionReview.productionCommit || '')
    const latestShortCommit = latestCommit.slice(0, 7)
    const latestDeploymentUrl = latestProductionReview.deploymentUrl || ''
    if (!note.includes(expectedVisualCount)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current production visual-review history ${expectedVisualCount}`)
    }
    if (visualRemaining > 0 && !note.includes(`${visualRemaining} remaining`)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current production visual-review remaining count ${visualRemaining}`)
    }
    if (hasText(latestArtifact) && !note.includes(latestArtifact)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current production visual artifact ${latestArtifact}`)
    }
    if (hasText(latestSummaryArtifact) && !note.includes(latestSummaryArtifact)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current production visual summary ${latestSummaryArtifact}`)
    }
    if (hasText(latestShortCommit) && !note.includes(latestShortCommit)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current production visual commit ${latestShortCommit}`)
    }
    if (hasText(latestDeploymentUrl) && !note.includes(latestDeploymentUrl)) {
      acceptedRiskEvidenceIssues.push(`${issue.id} acceptedRisk must reference current production visual deployment ${latestDeploymentUrl}`)
    }
  }
}
const rollbackVerificationCommands = Array.isArray(rollbackPlan.verificationCommands) ? rollbackPlan.verificationCommands : []
const rollbackVerificationText = rollbackVerificationCommands.join('\n')
const requiredRollbackCommandMarkers = [
  'npm run qa:release-production',
  'npm run qa:launch-signoff',
]
const missingRollbackCommandMarkers = requiredRollbackCommandMarkers
  .filter((marker) => !rollbackVerificationText.includes(marker))
const rollbackSteps = Array.isArray(rollbackPlan.rollbackSteps) ? rollbackPlan.rollbackSteps : []
const rollbackStepText = rollbackSteps.join('\n').toLowerCase()
const requiredRollbackStepMarkers = [
  'identify',
  'promote',
  'production',
  'health',
  'record',
]
const missingRollbackStepMarkers = requiredRollbackStepMarkers
  .filter((marker) => !rollbackStepText.includes(marker))

const deploymentRuntimeCommitShort = deploymentCurrency.latestRuntimeCommitShort || deploymentCurrency.latestRuntimeCommit
const liveDeploymentCommitShort = liveDeployment?.commit ? String(liveDeployment.commit).slice(0, 7) : 'missing'
const blockers = []
if (deploymentCurrency.enforced && deploymentCurrency.error) {
  blockers.push(summarizeBlocker(
    'production-runtime-deployment-currency',
    'Verify production runtime deployment currency',
    deploymentCurrency.error
  ))
}
if (deploymentCurrency.enforced && deploymentCurrency.runtimeCommitAhead) {
  blockers.push(summarizeBlocker(
    'production-runtime-deployment-currency',
    'Deploy latest runtime commit to production',
    `Production is on ${liveDeploymentCommitShort}; runtime commit ${deploymentRuntimeCommitShort} is waiting for Vercel production.`
  ))
}
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
if (deploymentCurrency.enforced && deploymentCurrency.error) {
  guardrailIssues.push(`production deployment currency could not be verified: ${deploymentCurrency.error}`)
}
if (deploymentCurrency.enforced && deploymentCurrency.runtimeCommitAhead) {
  guardrailIssues.push(`production is behind runtime commit ${deploymentCurrency.latestRuntimeCommitShort || deploymentCurrency.latestRuntimeCommit}`)
}
if (betaProgress.status !== 'pass') guardrailIssues.push('beta human review progress artifact is not passing')
if (betaIntake.status !== 'pass') guardrailIssues.push('beta human review intake artifact is not passing')
if (betaQueueIssues.length > 0) guardrailIssues.push('beta human review assignment queue is not fully prepared')
if (betaScheduleIssues.length > 0) guardrailIssues.push('beta human review execution schedule is not fully prepared')
if (betaCommandCenterIssues.length > 0) guardrailIssues.push('beta human review command center is not fully prepared')
if (betaNextWaveOpsIssues.length > 0) guardrailIssues.push('beta human review next-wave ops pack is not fully prepared')
if (betaDispatchOutboxIssues.length > 0) guardrailIssues.push('beta human review dispatch outbox is not fully prepared')
if (betaDispatchLogIssues.length > 0) guardrailIssues.push('beta human review dispatch log is not fully prepared')
if (betaFollowUpOutboxIssues.length > 0) guardrailIssues.push('beta human review follow-up outbox is not fully prepared')
if (betaAllWaveOpsIssues.length > 0) guardrailIssues.push('beta human review all-wave ops pack is not fully prepared')
if (!betaWaveRehearsalReady) guardrailIssues.push('beta human review next-wave browser rehearsal is not passing')
if (!betaMatrixRehearsalReady) guardrailIssues.push('beta human review full-matrix browser rehearsal is not passing')
if (!betaGuestStartRehearsalReady) guardrailIssues.push('beta human review production guest-start rehearsal is not passing')
if (blockerBoardIssues.length > 0) guardrailIssues.push('public launch blocker board is not aligned with current beta and visual blocker evidence')
if (launchTodayIssues.length > 0) guardrailIssues.push('daily launch operator board is not aligned with current blocker evidence')
if (launchTodayOverdueRehearsalIssues.length > 0) guardrailIssues.push('daily launch operator overdue rehearsal is not proving stale-date failure behavior')
if (launchSentDispatchRehearsalIssues.length > 0) guardrailIssues.push('daily launch operator sent-dispatch rehearsal is not proving sent-state behavior')
if (dispatchMarkSentDryRunIssues.length > 0) guardrailIssues.push('dispatch mark-sent dry run is not proving safe sent-state imports')
if (dispatchMarkSentImportRehearsalIssues.length > 0) guardrailIssues.push('dispatch mark-sent import rehearsal is not proving isolated sent-state imports')
if (dispatchSentRecordTemplateIssues.length > 0) guardrailIssues.push('dispatch sent-record template is not ready for operator handoff')
if (dispatchSentRecordTemplateRejectionIssues.length > 0) guardrailIssues.push('dispatch sent-record blank-template rejection is not proving pre-import safety')
if (reviewIntakeRehearsalIssues.length > 0) guardrailIssues.push('review intake rehearsal is not proving incomplete evidence rejection')
if (reviewIntakeImportRehearsalIssues.length > 0) guardrailIssues.push('review intake import rehearsal is not proving isolated completed-evidence imports')
if (publicLaunchModeRehearsalIssues.length > 0) guardrailIssues.push('public launch mode rehearsal is not proving strict public-blocker enforcement')
if (publicLaunchThresholdRehearsalIssues.length > 0) guardrailIssues.push('public launch threshold rehearsal is not proving completed-evidence readiness')
if (visualIntake.status !== 'pass') guardrailIssues.push('production visual review intake artifact is not passing')
if (visualProgressIssues.length > 0) guardrailIssues.push('production visual review progress artifact is not aligned with the launch register')
if (!visualScheduleReport.includes('Status: pass')) guardrailIssues.push('production visual review schedule report is not passing')
if (visualQueueIssues.length > 0) guardrailIssues.push('production visual review assignment queue is not fully prepared')
if (visualDispatchOutboxIssues.length > 0) guardrailIssues.push('production visual review dispatch outbox is not fully prepared')
if (visualDispatchLogIssues.length > 0) guardrailIssues.push('production visual review dispatch log is not fully prepared')
if (incompleteAcceptedP2Risks.length > 0) {
  guardrailIssues.push('open accepted P2 launch risks are missing owner, target month, or accepted-risk notes')
}
if (acceptedRiskEvidenceIssues.length > 0) {
  guardrailIssues.push('open accepted P2 launch risks are not aligned with current launch evidence counts')
}
if (
  !hasText(monitoringRegister.owner) ||
  monitoringRegister.status !== 'automation-ready' ||
  monitoringRegister.baseUrl !== baseUrl ||
  monitoringRegister.healthEndpoint !== `${baseUrl}/api/health` ||
  !hasText(monitoringRegister.publicShareSlug)
) {
  guardrailIssues.push('production monitoring register is missing owner, automation status, or production targets')
}
if (missingMonitoringSignals.length > 0) {
  guardrailIssues.push('production monitoring does not cover every launch-critical signal')
}
if (monitoringWorkflowChecks.length < 2 || monitoringWorkflowIssues.length > 0) {
  guardrailIssues.push('production monitoring workflows are missing schedules or expected gate commands')
}
if (!monitoringAlertReady) {
  guardrailIssues.push('production monitoring alert policy is not actionable enough for launch operations')
}
if (!monitoringRunbook.ok || missingMonitoringRunbookMarkers.length > 0) {
  guardrailIssues.push('operations runbook does not document production monitoring targets and workflows')
}
if (!monitoringLatestVerificationReady) {
  guardrailIssues.push('production monitoring latest verification is not tied to release gates and live production commit')
}
if (!paidPathReady) {
  guardrailIssues.push('paid-path readiness does not cover commercial, subscription, checkout, portal, and screenshot evidence')
}
if (!accessibilityReady) {
  guardrailIssues.push('accessibility and keyboard readiness does not cover required routes, viewports, guest auth, and blocking failures')
}
if (!designSystemReady) {
  guardrailIssues.push('design-system readiness does not cover required polish, token, copy, and visual-evidence checks')
}
if (!plannerActualsReady) {
  guardrailIssues.push('planner generated actuals do not cover regional edge cities with trustworthy map pins')
}
if (!publicShareMapIntegrityReady) {
  guardrailIssues.push('public share map/itinerary integrity evidence is not passing')
}
if (publicMetadataPresent && !publicMetadataReady) {
  guardrailIssues.push('public metadata, sitemap, robots, and manifest evidence is not passing')
}
if (!releaseCandidateReady) {
  guardrailIssues.push('full release-candidate artifact does not cover every core journey task and launch option')
}
if (!routeInventoryReady) {
  guardrailIssues.push('full route inventory smoke does not cover every top-level public, protected, and compatibility route')
}
if (!appSurfacesReady) {
  guardrailIssues.push('authenticated app surfaces smoke does not cover every secondary route, compatibility alias, and responsive destination')
}
if (!productionAppSurfacesReady) {
  guardrailIssues.push('production authenticated app surfaces smoke does not cover every secondary route, compatibility alias, and responsive destination on the live alias')
}
if (rollbackPlan.production?.knownGoodDeployment?.commit !== liveDeployment?.commit) {
  guardrailIssues.push('rollback plan known-good deployment is not tied to the live production commit')
}
if (missingRollbackCommandMarkers.length > 0) {
  guardrailIssues.push('rollback plan is missing required post-rollback verification commands')
}
if (rollbackSteps.length < 5 || missingRollbackStepMarkers.length > 0) {
  guardrailIssues.push('rollback plan restore steps are not actionable enough for launch operations')
}

const publicLaunchReady = blockers.length === 0 && guardrailIssues.length === 0
const betaReady = guardrailIssues.length === 0
const status = publicLaunchReady ? 'public-launch-ready' : betaReady ? 'beta-ready-public-blocked' : 'blocked'
const shouldFail = guardrailIssues.length > 0 || (requirePublicLaunch && !publicLaunchReady)

const summary = {
  date,
  dateSource: requestedDate ? 'QA_PUBLIC_LAUNCH_STATUS_DATE' : 'release evidence',
  baseUrl,
  status,
  betaReady,
  publicLaunchReady,
  requirePublicLaunch,
  liveDeployment,
  deploymentCurrency,
  betaHumanReviews: {
    planned: plannedBetaReviews.length,
    completed: completedBetaReviews.length,
    minimumForPublicLaunch: publicBetaMinimum,
    remaining: betaRemaining,
    progressArtifact: qaDisplayPath(betaProgressPath),
    intakeArtifact: qaDisplayPath(betaIntakePath),
    expectedReviewOrigin: expectedBetaReviewOrigin,
    assignmentQueueReady: betaQueueIssues.length === 0,
    assignmentQueueIssueCount: betaQueueIssues.length,
    executionScheduleReady: betaScheduleIssues.length === 0,
    executionScheduleIssueCount: betaScheduleIssues.length,
    commandCenterReady: betaCommandCenterIssues.length === 0,
    commandCenterIssueCount: betaCommandCenterIssues.length,
    nextWaveOpsReady: betaNextWaveOpsIssues.length === 0,
    nextWaveOpsIssueCount: betaNextWaveOpsIssues.length,
    dispatchOutboxReady: betaDispatchOutboxIssues.length === 0,
    dispatchOutboxIssueCount: betaDispatchOutboxIssues.length,
    dispatchLogReady: betaDispatchLogIssues.length === 0,
    dispatchLogIssueCount: betaDispatchLogIssues.length,
    followUpOutboxReady: betaFollowUpOutboxIssues.length === 0,
    followUpOutboxIssueCount: betaFollowUpOutboxIssues.length,
    allWaveOpsReady: betaAllWaveOpsIssues.length === 0,
    allWaveOpsIssueCount: betaAllWaveOpsIssues.length,
    packetManifest: qaDisplayPath(betaPacketManifestPath),
    scheduleArtifact: qaDisplayPath(betaSchedulePath),
    scheduleReport: qaDisplayPath(betaScheduleReportPath),
    scheduleCsv: qaDisplayPath(betaScheduleCsvPath),
    commandCenterArtifact: qaDisplayPath(betaCommandCenterPath),
    commandCenterReport: qaDisplayPath(betaCommandCenterReportPath),
    nextWaveOpsArtifact: qaDisplayPath(betaNextWaveOpsPath),
    nextWaveOpsReport: qaDisplayPath(betaNextWaveOpsReportPath),
    nextWaveOpsCsv: qaDisplayPath(betaNextWaveOpsCsvPath),
    dispatchOutboxArtifact: qaDisplayPath(betaDispatchOutboxPath),
    dispatchOutboxReport: qaDisplayPath(betaDispatchOutboxReportPath),
    dispatchOutboxCsv: qaDisplayPath(betaDispatchOutboxCsvPath),
    dispatchOutboxArtifactDir: qaDisplayPath(betaDispatchOutbox.artifactDir),
    dispatchOutboxRowCount: betaDispatchOutbox.outboxRowCount ?? null,
    dispatchOutboxMessageFileCount: betaDispatchOutbox.messageFileCount ?? null,
    dispatchLogArtifact: qaDisplayPath(betaDispatchLogPath),
    dispatchLogReport: qaDisplayPath(betaDispatchLogReportPath),
    dispatchLogCsv: qaDisplayPath(betaDispatchLogCsvPath),
    dispatchLogRowCount: betaDispatchLog.dispatchRowCount ?? null,
    dispatchLogSentCount: betaDispatchLog.sentCount ?? null,
    dispatchLogPreparedNotSentCount: betaDispatchLog.preparedNotSentCount ?? null,
    dispatchLogPreparedDueTodayCount: betaDispatchLog.preparedDueTodayCount ?? null,
    dispatchLogPreparedOverdueCount: betaDispatchLog.preparedOverdueCount ?? null,
    dispatchLogRequireSent: betaDispatchLog.requireSent ?? null,
    followUpOutboxArtifact: qaDisplayPath(betaFollowUpOutboxPath),
    followUpOutboxReport: qaDisplayPath(betaFollowUpOutboxReportPath),
    followUpOutboxCsv: qaDisplayPath(betaFollowUpOutboxCsvPath),
    followUpOutboxArtifactDir: qaDisplayPath(betaFollowUpOutbox.artifactDir),
    followUpOutboxDispatchLogArtifact: betaFollowUpOutbox.dispatchLogArtifact ?? null,
    followUpOutboxRowCount: betaFollowUpOutbox.followUpRowCount ?? null,
    followUpOutboxMessageFileCount: betaFollowUpOutbox.messageFileCount ?? null,
    followUpOutboxSendEligibleCount: betaFollowUpOutbox.sendEligibleCount ?? null,
    followUpOutboxBlockedUntilInitialSendCount: betaFollowUpOutbox.blockedUntilInitialSendCount ?? null,
    allWaveOpsArtifact: qaDisplayPath(betaAllWaveOpsPath),
    allWaveOpsReport: qaDisplayPath(betaAllWaveOpsReportPath),
    allWaveOpsCsv: qaDisplayPath(betaAllWaveOpsCsvPath),
    allWaveOpsRowCount: betaAllWaveOpsRows.length,
    allWaveOpsWaveCount: Number(betaAllWaveOps.operatorWaveCount) || 0,
    waveRehearsalArtifact: qaDisplayPath(betaWaveRehearsalPath),
    waveRehearsalReport: qaDisplayPath(betaWaveRehearsal.reportArtifact),
    waveRehearsalArtifactDir: qaDisplayPath(betaWaveRehearsal.artifactDir),
    waveRehearsalReady: betaWaveRehearsalReady,
    waveRehearsalStatus: betaWaveRehearsal.status || null,
    waveRehearsalIssueCount: betaWaveRehearsalIssues.length,
    waveRehearsalChecked: betaWaveRehearsal.checked ?? null,
    waveRehearsalPassed: betaWaveRehearsal.passed ?? null,
    waveRehearsalFailed: betaWaveRehearsal.failed ?? null,
    waveRehearsalNonMutating: betaWaveRehearsal.nonMutating ?? null,
    waveRehearsalRemoteGuestStartExercised: betaWaveRehearsal.remoteGuestStartExercised ?? null,
    waveRehearsalScreenshotCount: betaWaveRehearsalScreenshotChecks.length,
    waveRehearsalMissingResults: missingBetaWaveRehearsalResults,
    waveRehearsalMissingScreenshots: missingBetaWaveRehearsalScreenshots,
    waveRehearsalIssues: betaWaveRehearsalIssues,
    matrixRehearsalArtifact: qaDisplayPath(betaMatrixRehearsalPath),
    matrixRehearsalReport: qaDisplayPath(betaMatrixRehearsal.reportArtifact),
    matrixRehearsalArtifactDir: qaDisplayPath(betaMatrixRehearsal.artifactDir),
    matrixRehearsalReady: betaMatrixRehearsalReady,
    matrixRehearsalStatus: betaMatrixRehearsal.status || null,
    matrixRehearsalIssueCount: betaMatrixRehearsalIssues.length,
    matrixRehearsalChecked: betaMatrixRehearsal.checked ?? null,
    matrixRehearsalPassed: betaMatrixRehearsal.passed ?? null,
    matrixRehearsalFailed: betaMatrixRehearsal.failed ?? null,
    matrixRehearsalNonMutating: betaMatrixRehearsal.nonMutating ?? null,
    matrixRehearsalRemoteGuestStartExercised: betaMatrixRehearsal.remoteGuestStartExercised ?? null,
    matrixRehearsalScreenshotCount: betaMatrixRehearsalScreenshotChecks.length,
    matrixRehearsalMissingResults: missingBetaMatrixRehearsalResults,
    matrixRehearsalMissingScreenshots: missingBetaMatrixRehearsalScreenshots,
    matrixRehearsalIssues: betaMatrixRehearsalIssues,
    guestStartRehearsalArtifact: qaDisplayPath(betaGuestStartRehearsalPath),
    guestStartRehearsalReport: qaDisplayPath(betaGuestStartRehearsal.reportArtifact),
    guestStartRehearsalArtifactDir: qaDisplayPath(betaGuestStartRehearsal.artifactDir),
    guestStartRehearsalReady: betaGuestStartRehearsalReady,
    guestStartRehearsalStatus: betaGuestStartRehearsal.status || null,
    guestStartRehearsalIssueCount: betaGuestStartRehearsalIssues.length,
    guestStartRehearsalChecked: betaGuestStartRehearsal.checked ?? null,
    guestStartRehearsalPassed: betaGuestStartRehearsal.passed ?? null,
    guestStartRehearsalFailed: betaGuestStartRehearsal.failed ?? null,
    guestStartRehearsalNonMutating: betaGuestStartRehearsal.nonMutating ?? null,
    guestStartRehearsalRemoteGuestStartExercised: betaGuestStartRehearsal.remoteGuestStartExercised ?? null,
    guestStartRehearsalExerciseCount: betaGuestStartRehearsal.remoteGuestStartExerciseCount ?? null,
    guestStartRehearsalCleanupFailureCount: betaGuestStartRehearsal.remoteGuestStartCleanupFailureCount ?? null,
    guestStartRehearsalScreenshotCount: betaGuestStartRehearsalScreenshotChecks.length,
    guestStartRehearsalMissingResults: missingBetaGuestStartRehearsalResults,
    guestStartRehearsalMissingScreenshots: missingBetaGuestStartRehearsalScreenshots,
    guestStartRehearsalIssues: betaGuestStartRehearsalIssues,
    nextWave: betaCommandCenter.nextWave || null,
    dueSoonWaveCount: betaCommandCenterDueSoonWaves.length,
    dueSoonWaves: betaCommandCenterDueSoonWaves,
    overdueWaveCount: betaCommandCenterOverdueWaves.length,
    overdueWaves: betaCommandCenterOverdueWaves,
    dispatchPreparedRowCount: betaDispatchRowsPrepared.length,
    dispatchDueTodayCount: betaDispatchDueTodayRows.length,
    dispatchDueTodayRows: betaDispatchDueTodayRows.map((row) => ({
      id: row.id,
      sendBy: row.sendBy,
      followUpAt: row.followUpAt,
      dueAt: row.dueAt,
      submissionPath: row.submissionPath,
    })),
    dispatchOverdueCount: betaDispatchOverdueRows.length,
    dispatchOverdueRows: betaDispatchOverdueRows.map((row) => ({
      id: row.id,
      sendBy: row.sendBy,
      followUpAt: row.followUpAt,
      dueAt: row.dueAt,
      submissionPath: row.submissionPath,
    })),
    followUpDueSoonCount: betaFollowUpDueSoonRows.length,
    followUpDueSoonRows: betaFollowUpDueSoonRows.map((row) => ({
      id: row.id,
      sendBy: row.sendBy,
      followUpAt: row.followUpAt,
      dueAt: row.dueAt,
      submissionPath: row.submissionPath,
    })),
    followUpOverdueCount: betaFollowUpOverdueRows.length,
    followUpOverdueRows: betaFollowUpOverdueRows.map((row) => ({
      id: row.id,
      sendBy: row.sendBy,
      followUpAt: row.followUpAt,
      dueAt: row.dueAt,
      submissionPath: row.submissionPath,
    })),
    dispatchOutboxDueTodayCount: betaDispatchOutbox.dispatchDueTodayCount ?? null,
    dispatchOutboxOverdueCount: betaDispatchOutbox.dispatchOverdueCount ?? null,
    dispatchOutboxFollowUpDueSoonCount: betaDispatchOutbox.followUpDueSoonCount ?? null,
    dispatchOutboxFollowUpOverdueCount: betaDispatchOutbox.followUpOverdueCount ?? null,
    followUpOutboxDueSoonCount: betaFollowUpOutbox.dueSoonCount ?? null,
    followUpOutboxOverdueCount: betaFollowUpOutbox.followUpOverdueCount ?? null,
    nextWaveOpsRowCount: betaNextWaveOpsRows.length,
    scheduleWaveCount: scheduleWaveIds.length,
    packetCount: betaPacketRecords.length,
    assignmentCsv: qaDisplayPath(betaAssignmentCsvPath),
    assignmentReport: qaDisplayPath(betaAssignmentReportPath),
    submissionTemplateCount: betaSubmissionTemplateChecks.length,
    queueIssues: betaQueueIssues,
    scheduleIssues: betaScheduleIssues,
    commandCenterIssues: betaCommandCenterIssues,
    nextWaveOpsIssues: betaNextWaveOpsIssues,
    dispatchOutboxIssues: betaDispatchOutboxIssues,
    dispatchLogIssues: betaDispatchLogIssues,
    followUpOutboxIssues: betaFollowUpOutboxIssues,
    allWaveOpsIssues: betaAllWaveOpsIssues,
  },
  productionVisualReviews: {
    historyCount: visualHistory.length,
    distinctHistoryDateCount: visualHistoryDates.length,
    minimumForPublicLaunch: visualMinimum,
    remainingDistinctDates: visualRemaining,
    latestProductionArtifact: qaDisplayPath(visualProgress.latestProductionReview?.artifact),
    latestProductionSummaryArtifact: qaDisplayPath(visualProgress.latestProductionReview?.summaryArtifact),
    latestProductionCommit: visualProgress.latestProductionReview?.productionCommit || null,
    latestProductionDeploymentUrl: visualProgress.latestProductionReview?.deploymentUrl || null,
    scheduledReviewCount: scheduledVisualReviews.length,
    dueSoonScheduledReviewCount: Number(visualProgress.dueSoonScheduledReviewCount) || 0,
    dueSoonScheduledReviews: Array.isArray(visualProgress.dueSoonScheduledReviews) ? visualProgress.dueSoonScheduledReviews : [],
    overdueScheduledReviewCount: Number(visualProgress.overdueScheduledReviewCount) || 0,
    overdueScheduledReviews: Array.isArray(visualProgress.overdueScheduledReviews) ? visualProgress.overdueScheduledReviews : [],
    nextReviewDueAt: visualRegister.nextReviewDueAt || null,
    intakeArtifact: qaDisplayPath(visualIntakePath),
    progressArtifact: qaDisplayPath(visualProgressPath),
    scheduleArtifact: qaDisplayPath(visualSchedulePath),
    progressIssueCount: visualProgressIssues.length,
    assignmentQueueReady: visualQueueIssues.length === 0,
    assignmentQueueIssueCount: visualQueueIssues.length,
    dispatchOutboxReady: visualDispatchOutboxIssues.length === 0,
    dispatchOutboxIssueCount: visualDispatchOutboxIssues.length,
    dispatchLogReady: visualDispatchLogIssues.length === 0,
    dispatchLogIssueCount: visualDispatchLogIssues.length,
    dispatchOutboxArtifact: qaDisplayPath(visualDispatchOutboxPath),
    dispatchOutboxReport: qaDisplayPath(visualDispatchOutboxReportPath),
    dispatchOutboxCsv: qaDisplayPath(visualDispatchOutboxCsvPath),
    dispatchOutboxArtifactDir: qaDisplayPath(visualDispatchOutbox.artifactDir),
    dispatchOutboxRowCount: visualDispatchOutbox.outboxRowCount ?? null,
    dispatchOutboxRequiredRowCount: visualDispatchOutbox.requiredOutboxRowCount ?? null,
    dispatchOutboxMessageFileCount: visualDispatchOutbox.messageFileCount ?? null,
    dispatchOutboxDueSoonCount: visualDispatchOutbox.dueSoonCount ?? null,
    dispatchOutboxOverdueCount: visualDispatchOutbox.overdueCount ?? null,
    dispatchLogArtifact: qaDisplayPath(visualDispatchLogPath),
    dispatchLogReport: qaDisplayPath(visualDispatchLogReportPath),
    dispatchLogCsv: qaDisplayPath(visualDispatchLogCsvPath),
    dispatchLogRowCount: visualDispatchLog.dispatchRowCount ?? null,
    dispatchLogRequiredRowCount: visualDispatchLog.requiredDispatchRowCount ?? null,
    dispatchLogSentCount: visualDispatchLog.sentCount ?? null,
    dispatchLogPreparedNotSentCount: visualDispatchLog.preparedNotSentCount ?? null,
    dispatchLogRequiredPreparedNotSentCount: visualDispatchLog.requiredPreparedNotSentCount ?? null,
    dispatchLogPreparedDueSoonCount: visualDispatchLog.preparedDueSoonCount ?? null,
    dispatchLogPreparedOverdueCount: visualDispatchLog.preparedOverdueCount ?? null,
    dispatchLogRequireSent: visualDispatchLog.requireSent ?? null,
    assignmentCsv: qaDisplayPath(visualAssignmentCsvPath),
    assignmentReport: qaDisplayPath(visualAssignmentReportPath),
    submissionTemplateDir: qaDisplayPath(visualSubmissionDir),
    submissionTemplateCount: visualSubmissionTemplateChecks.length,
    progressIssues: visualProgressIssues,
    queueIssues: visualQueueIssues,
    dispatchOutboxIssues: visualDispatchOutboxIssues,
    dispatchLogIssues: visualDispatchLogIssues,
  },
  publicLaunchBlockerBoard: {
    ready: blockerBoardIssues.length === 0,
    issueCount: blockerBoardIssues.length,
    artifact: qaDisplayPath(blockerBoardPath),
    report: qaDisplayPath(blockerBoardReportPath),
    csv: qaDisplayPath(blockerBoardCsvPath),
    rowCount: blockerBoardRows.length,
    betaRowCount: blockerBoardBetaRows.length,
    requiredVisualRowCount: blockerBoardRequiredVisualRows.length,
    evidenceCheckCount: blockerBoardEvidenceChecks.length,
    betaDispatchRowCount: betaDispatchRowsPrepared.length,
    betaDispatchDueTodayCount: betaDispatchDueTodayRows.length,
    betaDispatchOverdueCount: betaDispatchOverdueRows.length,
    betaFollowUpDueSoonCount: betaFollowUpDueSoonRows.length,
    betaFollowUpOverdueCount: betaFollowUpOverdueRows.length,
    issues: blockerBoardIssues,
  },
  launchOperatorToday: {
    ready: launchTodayIssues.length === 0,
    issueCount: launchTodayIssues.length,
    artifact: qaDisplayPath(launchOperatorTodayPath),
    report: qaDisplayPath(launchOperatorTodayReportPath),
    csv: qaDisplayPath(launchOperatorTodayCsvPath),
    today: launchOperatorToday.today || null,
    checked: launchOperatorToday.checked ?? null,
    passed: launchOperatorToday.passed ?? null,
    failed: launchOperatorToday.failed ?? null,
    actionRowCount: launchTodayRows.length,
    betaActionRowCount: launchTodayBetaRows.length,
    visualActionRowCount: launchTodayVisualRows.length,
    betaDispatchDueTodayCount: launchOperatorToday.betaDispatchDueTodayCount ?? null,
    betaDispatchOverdueCount: launchOperatorToday.betaDispatchOverdueCount ?? null,
    betaDispatchLogArtifact: launchOperatorToday.betaDispatchLogArtifact ?? null,
    betaDispatchLogPreparedDueTodayCount: launchOperatorToday.betaDispatchLogPreparedDueTodayCount ?? null,
    betaDispatchLogPreparedOverdueCount: launchOperatorToday.betaDispatchLogPreparedOverdueCount ?? null,
    betaDispatchLogPreparedNotSentCount: launchOperatorToday.betaDispatchLogPreparedNotSentCount ?? null,
    betaDispatchLogSentCount: launchOperatorToday.betaDispatchLogSentCount ?? null,
    betaFollowUpsDueSoonCount: launchOperatorToday.betaFollowUpsDueSoonCount ?? null,
    betaReviewsDueSoonCount: launchOperatorToday.betaReviewsDueSoonCount ?? null,
    visualDueSoonCount: launchOperatorToday.visualDueSoonCount ?? null,
    visualOverdueCount: launchOperatorToday.visualOverdueCount ?? null,
    visualDispatchLogArtifact: launchOperatorToday.visualDispatchLogArtifact ?? null,
    visualDispatchLogPreparedDueSoonCount: launchOperatorToday.visualDispatchLogPreparedDueSoonCount ?? null,
    visualDispatchLogPreparedOverdueCount: launchOperatorToday.visualDispatchLogPreparedOverdueCount ?? null,
    visualDispatchLogRequiredPreparedNotSentCount: launchOperatorToday.visualDispatchLogRequiredPreparedNotSentCount ?? null,
    visualDispatchLogSentCount: launchOperatorToday.visualDispatchLogSentCount ?? null,
    messageFileCheckCount: launchTodayMessageFileChecks.length,
    missingMessageFileCount: launchTodayMissingMessageFiles.length,
    visualMessageFileCheckCount: launchTodayVisualMessageFileChecks.length,
    missingVisualMessageFileCount: launchTodayMissingVisualMessageFiles.length,
    issues: launchTodayIssues,
  },
  launchOperatorTodayOverdueRehearsal: {
    ready: launchTodayOverdueRehearsalIssues.length === 0,
    issueCount: launchTodayOverdueRehearsalIssues.length,
    artifact: qaDisplayPath(launchOperatorTodayOverdueRehearsalPath),
    report: qaDisplayPath(launchOperatorTodayOverdueRehearsalReportPath),
    date: launchOperatorTodayOverdueRehearsal.date || null,
    overdueToday: launchOperatorTodayOverdueRehearsal.overdueToday || null,
    checked: launchOperatorTodayOverdueRehearsal.checked ?? null,
    passed: launchOperatorTodayOverdueRehearsal.passed ?? null,
    failed: launchOperatorTodayOverdueRehearsal.failed ?? null,
    launchOperatorExitCode: launchOperatorTodayOverdueRehearsal.launchOperatorExitCode ?? null,
    rawLaunchArtifactsCleanedUp: launchOperatorTodayOverdueRehearsal.rawLaunchArtifactsCleanedUp ?? null,
    detectedOverdueRowCount: launchTodayOverdueRowsDetected,
    expectedFailureName: launchOperatorTodayOverdueRehearsal.expectedFailureName || null,
    issues: launchTodayOverdueRehearsalIssues,
  },
  launchOperatorSentDispatchRehearsal: {
    ready: launchSentDispatchRehearsalIssues.length === 0,
    issueCount: launchSentDispatchRehearsalIssues.length,
    artifact: qaDisplayPath(launchOperatorSentDispatchRehearsalPath),
    report: qaDisplayPath(launchOperatorSentDispatchRehearsalReportPath),
    date: launchOperatorSentDispatchRehearsal.date || null,
    selectedRows: launchOperatorSentDispatchRehearsal.selectedRows || null,
    launchOperatorExitCode: launchOperatorSentDispatchRehearsal.launchOperatorExitCode ?? null,
    launchOperatorStatus: launchOperatorSentDispatchRehearsal.launchOperatorStatus || null,
    launchOperatorPublicLaunchStatus: launchOperatorSentDispatchRehearsal.launchOperatorPublicLaunchStatus || null,
    launchOperatorActionRowCount: launchOperatorSentDispatchRehearsal.launchOperatorActionRowCount ?? null,
    rawArtifactsCleanedUp: launchOperatorSentDispatchRehearsal.rawArtifactsCleanedUp ?? null,
    issues: launchSentDispatchRehearsalIssues,
  },
  dispatchMarkSentDryRun: {
    ready: dispatchMarkSentDryRunIssues.length === 0,
    issueCount: dispatchMarkSentDryRunIssues.length,
    artifact: qaDisplayPath(dispatchMarkSentDryRunPath),
    report: qaDisplayPath(dispatchMarkSentDryRunReportPath),
    date: dispatchMarkSentDryRun.date || null,
    importMode: dispatchMarkSentDryRun.importMode ?? null,
    recordArtifact: dispatchMarkSentDryRun.recordArtifact || null,
    requestedUpdateCount: dispatchMarkSentDryRun.requestedUpdateCount ?? null,
    betaUpdateCount: dispatchMarkSentDryRun.betaUpdateCount ?? null,
    visualUpdateCount: dispatchMarkSentDryRun.visualUpdateCount ?? null,
    updatedLogArtifacts: dispatchMarkSentUpdatedArtifacts,
    issues: dispatchMarkSentDryRunIssues,
  },
  dispatchMarkSentImportRehearsal: {
    ready: dispatchMarkSentImportRehearsalIssues.length === 0,
    issueCount: dispatchMarkSentImportRehearsalIssues.length,
    artifact: qaDisplayPath(dispatchMarkSentImportRehearsalPath),
    report: qaDisplayPath(dispatchMarkSentImportRehearsalReportPath),
    date: dispatchMarkSentImportRehearsal.date || null,
    fixtureArtifact: dispatchMarkSentImportRehearsal.fixtureArtifact || null,
    markSentExitCode: dispatchMarkSentImportRehearsal.markSentExitCode ?? null,
    markSentStatus: dispatchMarkSentImportRehearsal.markSentStatus || null,
    markSentImportMode: dispatchMarkSentImportRehearsal.markSentImportMode ?? null,
    importedRows: dispatchMarkSentImportRehearsal.importedRows || null,
    tempBetaSentCount: dispatchMarkSentImportRehearsal.tempBetaSentCount ?? null,
    tempVisualSentCount: dispatchMarkSentImportRehearsal.tempVisualSentCount ?? null,
    launchOperatorExitCode: dispatchMarkSentImportRehearsal.launchOperatorExitCode ?? null,
    launchOperatorStatus: dispatchMarkSentImportRehearsal.launchOperatorStatus || null,
    launchOperatorPublicLaunchStatus: dispatchMarkSentImportRehearsal.launchOperatorPublicLaunchStatus || null,
    launchOperatorActionRowCount: dispatchMarkSentImportRehearsal.launchOperatorActionRowCount ?? null,
    launchOperatorActionIds: dispatchMarkSentImportActionIds,
    launchOperatorBetaCompleted: dispatchMarkSentImportRehearsal.launchOperatorBetaCompleted ?? null,
    launchOperatorVisualHistoryCount: dispatchMarkSentImportRehearsal.launchOperatorVisualHistoryCount ?? null,
    canonicalBetaSentCount: dispatchMarkSentImportRehearsal.canonicalBetaSentCount ?? null,
    canonicalVisualSentCount: dispatchMarkSentImportRehearsal.canonicalVisualSentCount ?? null,
    rawArtifactsCleanedUp: dispatchMarkSentImportRehearsal.rawArtifactsCleanedUp ?? null,
    issues: dispatchMarkSentImportRehearsalIssues,
  },
  dispatchSentRecordTemplate: {
    ready: dispatchSentRecordTemplateIssues.length === 0,
    issueCount: dispatchSentRecordTemplateIssues.length,
    artifact: qaDisplayPath(dispatchSentRecordTemplatePath),
    report: qaDisplayPath(dispatchSentRecordTemplateReportPath),
    csv: qaDisplayPath(dispatchSentRecordTemplateCsvPath),
    date: dispatchSentRecordTemplate.date || null,
    launchOperatorArtifact: dispatchSentRecordTemplate.launchOperatorArtifact || null,
    readyForImport: dispatchSentRecordTemplate.readyForImport ?? null,
    rowCount: dispatchSentRecordTemplate.rowCount ?? null,
    betaRowCount: dispatchSentRecordTemplate.betaRowCount ?? null,
    visualRowCount: dispatchSentRecordTemplate.visualRowCount ?? null,
    blankProofFieldRowCount: dispatchSentRecordBlankRows.length,
    validationCommand: dispatchSentRecordTemplate.validationCommand || null,
    importCommand: dispatchSentRecordTemplate.importCommand || null,
    missingMessageFileCount: dispatchSentRecordMessageFileChecks.filter((check) => check.exists !== true).length,
    missingSubmissionTemplateCount: dispatchSentRecordSubmissionTemplateChecks.filter((check) => check.exists !== true).length,
    issues: dispatchSentRecordTemplateIssues,
  },
  dispatchSentRecordTemplateRejection: {
    ready: dispatchSentRecordTemplateRejectionIssues.length === 0,
    issueCount: dispatchSentRecordTemplateRejectionIssues.length,
    artifact: qaDisplayPath(dispatchSentRecordTemplateRejectionPath),
    report: qaDisplayPath(dispatchSentRecordTemplateRejectionReportPath),
    date: dispatchSentRecordTemplateRejection.date || null,
    templateArtifact: dispatchSentRecordTemplateRejection.templateArtifact || null,
    markSentExitCode: dispatchSentRecordTemplateRejection.markSentExitCode ?? null,
    markSentStatus: dispatchSentRecordTemplateRejection.markSentStatus || null,
    markSentImportMode: dispatchSentRecordTemplateRejection.markSentImportMode ?? null,
    requestedUpdateCount: dispatchSentRecordTemplateRejection.requestedUpdateCount ?? null,
    betaUpdateCount: dispatchSentRecordTemplateRejection.betaUpdateCount ?? null,
    visualUpdateCount: dispatchSentRecordTemplateRejection.visualUpdateCount ?? null,
    rejectionIssueCount: dispatchSentRecordTemplateRejection.rejectionIssueCount ?? null,
    missingFieldNames: dispatchSentRecordTemplateRejectionMissingFields,
    canonicalBetaUnchanged: dispatchSentRecordTemplateRejection.canonicalBetaUnchanged ?? null,
    canonicalVisualUnchanged: dispatchSentRecordTemplateRejection.canonicalVisualUnchanged ?? null,
    canonicalBetaSentCount: dispatchSentRecordTemplateRejection.canonicalBetaSentCount ?? null,
    canonicalVisualSentCount: dispatchSentRecordTemplateRejection.canonicalVisualSentCount ?? null,
    rawArtifactsCleanedUp: dispatchSentRecordTemplateRejection.rawArtifactsCleanedUp ?? null,
    issues: dispatchSentRecordTemplateRejectionIssues,
  },
  reviewIntakeRehearsal: {
    ready: reviewIntakeRehearsalIssues.length === 0,
    issueCount: reviewIntakeRehearsalIssues.length,
    artifact: qaDisplayPath(reviewIntakeRehearsalPath),
    report: qaDisplayPath(reviewIntakeRehearsalReportPath),
    date: reviewIntakeRehearsal.date || null,
    checked: reviewIntakeRehearsal.checked ?? null,
    passed: reviewIntakeRehearsal.passed ?? null,
    failed: reviewIntakeRehearsal.failed ?? null,
    betaIntakeExitCode: reviewIntakeRehearsal.betaIntakeExitCode ?? null,
    visualIntakeExitCode: reviewIntakeRehearsal.visualIntakeExitCode ?? null,
    betaInvalidSubmissionCount: reviewIntakeRehearsal.betaInvalidSubmissionCount ?? null,
    visualInvalidSubmissionCount: reviewIntakeRehearsal.visualInvalidSubmissionCount ?? null,
    betaCompletedBefore: reviewIntakeRehearsal.betaCompletedBefore ?? null,
    betaCompletedAfter: reviewIntakeRehearsal.betaCompletedAfter ?? null,
    visualHistoryBefore: reviewIntakeRehearsal.visualHistoryBefore ?? null,
    visualHistoryAfter: reviewIntakeRehearsal.visualHistoryAfter ?? null,
    rawArtifactsCleanedUp: reviewIntakeRehearsal.rawArtifactsCleanedUp ?? null,
    issues: reviewIntakeRehearsalIssues,
  },
  reviewIntakeImportRehearsal: {
    ready: reviewIntakeImportRehearsalIssues.length === 0,
    issueCount: reviewIntakeImportRehearsalIssues.length,
    artifact: qaDisplayPath(reviewIntakeImportRehearsalPath),
    report: qaDisplayPath(reviewIntakeImportRehearsalReportPath),
    date: reviewIntakeImportRehearsal.date || null,
    betaReviewId: reviewIntakeImportRehearsal.betaReviewId || null,
    visualReviewId: reviewIntakeImportRehearsal.visualReviewId || null,
    visualReviewDate: reviewIntakeImportRehearsal.visualReviewDate || null,
    betaIntakeExitCode: reviewIntakeImportRehearsal.betaIntakeExitCode ?? null,
    betaIntakeStatus: reviewIntakeImportRehearsal.betaIntakeStatus || null,
    betaImported: reviewIntakeImportRehearsal.betaImported ?? null,
    betaValidSubmissionCount: reviewIntakeImportRehearsal.betaValidSubmissionCount ?? null,
    betaInvalidSubmissionCount: reviewIntakeImportRehearsal.betaInvalidSubmissionCount ?? null,
    tempBetaCompletedBefore: reviewIntakeImportRehearsal.tempBetaCompletedBefore ?? null,
    tempBetaCompletedAfter: reviewIntakeImportRehearsal.tempBetaCompletedAfter ?? null,
    visualIntakeExitCode: reviewIntakeImportRehearsal.visualIntakeExitCode ?? null,
    visualIntakeStatus: reviewIntakeImportRehearsal.visualIntakeStatus || null,
    visualImported: reviewIntakeImportRehearsal.visualImported ?? null,
    visualValidSubmissionCount: reviewIntakeImportRehearsal.visualValidSubmissionCount ?? null,
    visualInvalidSubmissionCount: reviewIntakeImportRehearsal.visualInvalidSubmissionCount ?? null,
    tempVisualHistoryBefore: reviewIntakeImportRehearsal.tempVisualHistoryBefore ?? null,
    tempVisualHistoryAfter: reviewIntakeImportRehearsal.tempVisualHistoryAfter ?? null,
    canonicalBetaUnchanged: reviewIntakeImportRehearsal.canonicalBetaUnchanged ?? null,
    canonicalVisualUnchanged: reviewIntakeImportRehearsal.canonicalVisualUnchanged ?? null,
    canonicalBetaCompletedBefore: reviewIntakeImportRehearsal.canonicalBetaCompletedBefore ?? null,
    canonicalBetaCompletedAfter: reviewIntakeImportRehearsal.canonicalBetaCompletedAfter ?? null,
    canonicalVisualHistoryBefore: reviewIntakeImportRehearsal.canonicalVisualHistoryBefore ?? null,
    canonicalVisualHistoryAfter: reviewIntakeImportRehearsal.canonicalVisualHistoryAfter ?? null,
    rawArtifactsCleanedUp: reviewIntakeImportRehearsal.rawArtifactsCleanedUp ?? null,
    issues: reviewIntakeImportRehearsalIssues,
  },
  publicLaunchModeRehearsal: {
    ready: publicLaunchModeRehearsalIssues.length === 0,
    issueCount: publicLaunchModeRehearsalIssues.length,
    artifact: qaDisplayPath(publicLaunchModeRehearsalPath),
    report: qaDisplayPath(publicLaunchModeRehearsalReportPath),
    date: publicLaunchModeRehearsal.date || null,
    checked: publicLaunchModeRehearsal.checked ?? null,
    passed: publicLaunchModeRehearsal.passed ?? null,
    failed: publicLaunchModeRehearsal.failed ?? null,
    publicLaunchModeExitCode: publicLaunchModeRehearsal.publicLaunchModeExitCode ?? null,
    publicLaunchStatus: publicLaunchModeRehearsal.publicLaunchStatus || null,
    betaReady: publicLaunchModeRehearsal.betaReady ?? null,
    publicLaunchReady: publicLaunchModeRehearsal.publicLaunchReady ?? null,
    requirePublicLaunch: publicLaunchModeRehearsal.requirePublicLaunch ?? null,
    blockerIds: publicLaunchModeBlockerIds,
    guardrailIssueCount: Array.isArray(publicLaunchModeRehearsal.guardrailIssues) ? publicLaunchModeRehearsal.guardrailIssues.length : null,
    canonicalRestored: publicLaunchModeRehearsal.canonicalRestored ?? null,
    issues: publicLaunchModeRehearsalIssues,
  },
  publicLaunchThresholdRehearsal: {
    ready: publicLaunchThresholdRehearsalIssues.length === 0,
    issueCount: publicLaunchThresholdRehearsalIssues.length,
    artifact: qaDisplayPath(publicLaunchThresholdRehearsalPath),
    report: qaDisplayPath(publicLaunchThresholdRehearsalReportPath),
    date: publicLaunchThresholdRehearsal.date || null,
    simulatedBetaCompletedReviewCount: publicLaunchThresholdRehearsal.simulatedBetaCompletedReviewCount ?? null,
    simulatedBetaPublicLaunchMinimum: publicLaunchThresholdRehearsal.simulatedBetaPublicLaunchMinimum ?? null,
    simulatedBetaRemainingReviewsForMinimum: publicLaunchThresholdRehearsal.simulatedBetaRemainingReviewsForMinimum ?? null,
    simulatedBetaPublicLaunchReadiness: publicLaunchThresholdRehearsal.simulatedBetaPublicLaunchReadiness || null,
    simulatedVisualDistinctHistoryDateCount: publicLaunchThresholdRehearsal.simulatedVisualDistinctHistoryDateCount ?? null,
    simulatedVisualMinimumHistoryDateCount: publicLaunchThresholdRehearsal.simulatedVisualMinimumHistoryDateCount ?? null,
    simulatedVisualRemainingHistoryDateCount: publicLaunchThresholdRehearsal.simulatedVisualRemainingHistoryDateCount ?? null,
    simulatedVisualPublicLaunchReadiness: publicLaunchThresholdRehearsal.simulatedVisualPublicLaunchReadiness || null,
    canonicalBetaUnchanged: publicLaunchThresholdRehearsal.canonicalBetaUnchanged ?? null,
    canonicalVisualUnchanged: publicLaunchThresholdRehearsal.canonicalVisualUnchanged ?? null,
    canonicalBetaCompletedBefore: publicLaunchThresholdRehearsal.canonicalBetaCompletedBefore ?? null,
    canonicalBetaCompletedAfter: publicLaunchThresholdRehearsal.canonicalBetaCompletedAfter ?? null,
    canonicalVisualHistoryBefore: publicLaunchThresholdRehearsal.canonicalVisualHistoryBefore ?? null,
    canonicalVisualHistoryAfter: publicLaunchThresholdRehearsal.canonicalVisualHistoryAfter ?? null,
    rawArtifactsCleanedUp: publicLaunchThresholdRehearsal.rawArtifactsCleanedUp ?? null,
    issues: publicLaunchThresholdRehearsalIssues,
  },
  risks: {
    openBlockingRiskCount: openBlockingRisks.length,
    openAcceptedP2RiskCount: openAcceptedP2Risks.length,
    openAcceptedP2RiskIds: openAcceptedP2Risks.map((issue) => issue.id),
    incompleteAcceptedP2RiskCount: incompleteAcceptedP2Risks.length,
    acceptedRiskEvidenceIssueCount: acceptedRiskEvidenceIssues.length,
    acceptedRiskEvidenceIssues,
    incompleteAcceptedP2Risks: incompleteAcceptedP2Risks.map((issue) => ({
      id: issue.id,
      title: issue.title,
      hasOwner: hasText(issue.owner),
      hasTargetMonth: hasText(issue.targetMonth),
      hasAcceptedRisk: hasText(issue.acceptedRisk, 40),
    })),
  },
  rollback: {
    knownGoodDeploymentCommit: rollbackPlan.production?.knownGoodDeployment?.commit || null,
    knownGoodDeploymentUrl: rollbackPlan.production?.knownGoodDeployment?.url || null,
    verificationCommandCount: rollbackVerificationCommands.length,
    missingCommandMarkers: missingRollbackCommandMarkers,
    rollbackStepCount: rollbackSteps.length,
    missingStepMarkers: missingRollbackStepMarkers,
    actionable: missingRollbackCommandMarkers.length === 0 &&
      rollbackSteps.length >= 5 &&
      missingRollbackStepMarkers.length === 0,
  },
  monitoring: {
    owner: monitoringRegister.owner || null,
    status: monitoringRegister.status || null,
    baseUrl: monitoringRegister.baseUrl || null,
    healthEndpoint: monitoringRegister.healthEndpoint || null,
    publicShareSlug: monitoringRegister.publicShareSlug || null,
    coveredSignals: coveredMonitoringSignals,
    missingSignals: missingMonitoringSignals,
    workflowCount: monitoringWorkflowChecks.length,
    workflowIssues: monitoringWorkflowIssues,
    alertOwner: monitoringRegister.alertPolicy?.owner || null,
    alertTriggerCount: Array.isArray(monitoringRegister.alertPolicy?.triggers) ? monitoringRegister.alertPolicy.triggers.length : 0,
    missingAlertMarkers: missingMonitoringAlertMarkers,
    firstResponseStepCount: monitoringFirstResponseSteps.length,
    runbookReadable: monitoringRunbook.ok,
    missingRunbookMarkers: missingMonitoringRunbookMarkers,
    latestVerificationExpectedLiveCommit: monitoringRegister.latestVerification?.expectedLiveCommit || null,
    latestVerificationReady: monitoringLatestVerificationReady,
  },
  paidPath: {
    artifact: qaDisplayPath(paidPathReadinessPath),
    status: paidPathReadiness.status || null,
    checked: paidPathReadiness.checked ?? null,
    failed: paidPathReadiness.failed ?? null,
    requiredTasks: requiredPaidPathTasks,
    missingTasks: missingPaidPathTasks,
    screenshotCount: paidPathReadiness.screenshotCount ?? null,
    requiredScreenshotCount: requiredStripeScreenshots.length,
    missingScreenshots: missingPaidPathScreenshots,
    ready: paidPathReady,
  },
  accessibility: {
    artifact: qaDisplayPath(accessibilityPath),
    checked: accessibility.checked ?? null,
    passed: accessibility.passed ?? null,
    failed: accessibility.failed ?? null,
    resultCount: Array.isArray(accessibility.results) ? accessibility.results.length : 0,
    missingRoutes: missingAccessibilityRoutes,
    missingProtectedRoutes: missingAccessibilityProtectedRoutes,
    missingViewports: missingAccessibilityViewports,
    blockingResultCount: blockingAccessibilityResults.length,
    blockingResults: blockingAccessibilityResults.slice(0, 12).map((result) => ({
      routeId: result.routeId || null,
      viewportId: result.viewportId || null,
      missingMarkers: result.missingMarkers || [],
      structureIssues: result.structureIssues || [],
      blockingViolations: result.axe?.blockingViolations || [],
      keyboardIssues: result.keyboard?.issues || [],
    })),
    authMode: accessibility.auth?.mode || null,
    guestCleanupAttempted: accessibility.auth?.cleanup?.attempted ?? null,
    guestCleanupProfileDeleted: accessibility.auth?.cleanup?.profileDeleted ?? null,
    guestCleanupUserDeleted: accessibility.auth?.cleanup?.userDeleted ?? null,
    guestCleanupError: accessibility.auth?.cleanup?.error || null,
    ready: accessibilityReady,
  },
  designSystem: {
    artifact: qaDisplayPath(designSystemPath),
    checked: designSystem.checked ?? null,
    passed: designSystem.passed ?? null,
    failed: designSystem.failed ?? null,
    requiredCheckCount: requiredDesignSystemChecks.length,
    missingChecks: missingDesignSystemChecks,
    failedChecks: failedDesignSystemChecks,
    responsiveVisualArtifact: qaDisplayPath(designSystem.responsiveVisualArtifact),
    expectedResponsiveVisualArtifact: qaDisplayPath(responsiveVisualArtifactPath),
    productionVisualArtifact: qaDisplayPath(designSystem.productionVisualArtifact),
    expectedProductionVisualArtifact: qaDisplayPath(expectedDesignSystemProductionVisualArtifact),
    failureCount: Array.isArray(designSystem.failures) ? designSystem.failures.length : null,
    visualEvidenceReady: designSystemVisualEvidenceReady,
    ready: designSystemReady,
  },
  plannerActuals: {
    artifact: qaDisplayPath(plannerActualsPath),
    actualCount: Array.isArray(plannerActuals) ? plannerActuals.length : null,
    requiredActualIds: requiredPlannerActualIds,
    actualIds: plannerActualIds,
    missingActualIds: missingPlannerActualIds,
    badActualCount: badPlannerActuals.length,
    badActuals: badPlannerActuals.map((actual) => ({
      id: actual.id || null,
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
    ready: plannerActualsReady,
  },
  publicShareMapIntegrity: {
    artifact: qaDisplayPath(publicShareMapIntegrityPath),
    report: qaDisplayPath(publicShareMapIntegrity.reportArtifact),
    artifactDir: qaDisplayPath(publicShareMapIntegrity.artifactDir),
    baseUrl: publicShareMapIntegrity.baseUrl || null,
    checked: publicShareMapIntegrity.checked ?? null,
    checkedViewports: publicShareMapIntegrity.checkedViewports ?? null,
    passed: publicShareMapIntegrity.passed ?? null,
    failed: publicShareMapIntegrity.failed ?? null,
    shareSlugs: publicShareMapSlugs,
    shareCount: publicShareMapResults.length,
    discovery: {
      enabled: publicShareMapDiscovery.enabled ?? null,
      limit: publicShareMapDiscovery.limit ?? null,
      totalPublicShares: publicShareMapDiscovery.totalPublicShares ?? null,
      shareCount: publicShareMapDiscovery.shareCount ?? null,
      shares: publicShareMapDiscoveredShares.map((share) => ({
        shareSlug: share.shareSlug || null,
        title: share.title || null,
        updatedAt: share.updatedAt || null,
      })),
    },
    badShareCount: badPublicShareMapResults.length,
    badRenderedResults: badPublicShareMapRenderedResults,
    badDays: badPublicShareMapDays,
    screenshotCount: publicShareMapScreenshotChecks.length,
    missingScreenshots: missingPublicShareMapScreenshots,
    failureCount: publicShareMapFailures.length,
    issues: publicShareMapIntegrityIssues,
    ready: publicShareMapIntegrityReady,
  },
  publicMetadata: {
    artifact: qaDisplayPath(publicMetadataPath),
    report: qaDisplayPath(publicMetadata.reportArtifact),
    artifactReadable: publicMetadataPresent,
    artifactError: publicMetadataRead.error,
    pending: !publicMetadataPresent,
    baseUrl: publicMetadata.baseUrl || null,
    shareSlug: publicMetadata.shareSlug || null,
    status: publicMetadata.status || null,
    checked: publicMetadata.checked ?? null,
    passed: publicMetadata.passed ?? null,
    failed: publicMetadata.failed ?? null,
    sourceMissingCount: publicMetadata.sourceMissingCount ?? null,
    requiredCheckCount: requiredPublicMetadataChecks.length,
    resultIds: publicMetadataResultIds,
    missingChecks: missingPublicMetadataChecks,
    failedResults: failedPublicMetadataResults.map((result) => ({
      id: result.id || null,
      path: result.path || null,
      issues: result.issues || [],
    })),
    issues: publicMetadataIssues,
    ready: publicMetadataReady,
  },
  releaseCandidate: {
    artifact: qaDisplayPath(releaseCandidatePath),
    checked: releaseCandidate.checked ?? null,
    passed: releaseCandidate.passed ?? null,
    failed: releaseCandidate.failed ?? null,
    requiredTaskCount: requiredReleaseTasks.length,
    taskCount: releaseTaskNames.length,
    missingTasks: missingReleaseTasks,
    failedTasks: failedReleaseTasks,
    requiredFlags: requiredReleaseFlags,
    missingFlags: missingReleaseFlags,
    localOnly: releaseCandidate.localOnly ?? null,
    plannerActualsPreset: releaseCandidate.plannerActualsPreset || null,
    shareSlug: releaseCandidate.shareSlug || null,
    ready: releaseCandidateReady,
  },
  routeInventory: {
    artifact: qaDisplayPath(routeInventoryPath),
    report: qaDisplayPath(routeInventory.reportArtifact),
    baseUrl: routeInventory.baseUrl || null,
    status: routeInventory.status || null,
    checked: routeInventory.checked ?? null,
    passed: routeInventory.passed ?? null,
    failed: routeInventory.failed ?? null,
    requiredRouteCount: requiredInventoryRoutes.length,
    routeCount: routeInventoryRoutes.length,
    publicRouteCount: routeInventory.publicRouteCount ?? null,
    protectedRouteCount: routeInventory.protectedRouteCount ?? null,
    sourceMissingCount: routeInventory.sourceMissingCount ?? null,
    shareSlug: routeInventory.shareSlug || null,
    missingRoutes: missingInventoryRoutes,
    badRouteCount: badInventoryRoutes.length,
    badRoutes: badInventoryRoutes.map((route) => ({
      path: route.path || null,
      issues: route.issues || [],
    })),
    issues: routeInventoryIssues,
    ready: routeInventoryReady,
  },
  appSurfaces: {
    artifact: qaDisplayPath(appSurfacesPath),
    report: qaDisplayPath(appSurfaces.reportArtifact),
    artifactDir: qaDisplayPath(appSurfaces.artifactDir),
    baseUrl: appSurfaces.baseUrl || null,
    status: appSurfaces.status || null,
    checked: appSurfaces.checked ?? null,
    passed: appSurfaces.passed ?? null,
    failed: appSurfaces.failed ?? null,
    requiredRouteCount: requiredAppSurfaceRoutes.length,
    requiredViewportCount: requiredAppSurfaceViewports.length,
    expectedCheckCount: expectedAppSurfaceChecks,
    routeCount: appSurfaces.routeCount ?? appSurfaceRouteIds.length,
    viewportCount: appSurfaces.viewportCount ?? appSurfaceViewportIds.length,
    authMode: appSurfaces.auth?.mode || null,
    guestCleanupAttempted: appSurfaces.auth?.cleanup?.attempted ?? null,
    guestCleanupProfileDeleted: appSurfaces.auth?.cleanup?.profileDeleted ?? null,
    guestCleanupUserDeleted: appSurfaces.auth?.cleanup?.userDeleted ?? null,
    guestCleanupError: appSurfaces.auth?.cleanup?.error || null,
    localOnly: appSurfaces.localOnly ?? null,
    missingRoutes: missingAppSurfaceRoutes,
    missingViewports: missingAppSurfaceViewports,
    badResultCount: badAppSurfaceResults.length,
    badResults: badAppSurfaceResults.map((result) => ({
      routeId: result.routeId || null,
      viewportId: result.viewportId || null,
      issues: result.issues || [],
    })),
    issues: appSurfaceIssues,
    ready: appSurfacesReady,
  },
  productionAppSurfaces: {
    artifact: qaDisplayPath(productionAppSurfacesPath),
    report: qaDisplayPath(productionAppSurfaces.reportArtifact),
    artifactDir: qaDisplayPath(productionAppSurfaces.artifactDir),
    baseUrl: productionAppSurfaces.baseUrl || null,
    status: productionAppSurfaces.status || null,
    checked: productionAppSurfaces.checked ?? null,
    passed: productionAppSurfaces.passed ?? null,
    failed: productionAppSurfaces.failed ?? null,
    requiredRouteCount: requiredAppSurfaceRoutes.length,
    requiredViewportCount: requiredAppSurfaceViewports.length,
    expectedCheckCount: expectedAppSurfaceChecks,
    routeCount: productionAppSurfaces.routeCount ?? productionAppSurfaceRouteIds.length,
    viewportCount: productionAppSurfaces.viewportCount ?? productionAppSurfaceViewportIds.length,
    authMode: productionAppSurfaces.auth?.mode || null,
    guestCleanupAttempted: productionAppSurfaceCleanup.attempted ?? null,
    guestCleanupProfileDeleted: productionAppSurfaceCleanup.profileDeleted ?? null,
    guestCleanupUserDeleted: productionAppSurfaceCleanup.userDeleted ?? null,
    guestCleanupError: productionAppSurfaceCleanup.error || null,
    localOnly: productionAppSurfaces.localOnly ?? null,
    missingRoutes: missingProductionAppSurfaceRoutes,
    missingViewports: missingProductionAppSurfaceViewports,
    badResultCount: badProductionAppSurfaceResults.length,
    badResults: badProductionAppSurfaceResults.map((result) => ({
      routeId: result.routeId || null,
      viewportId: result.viewportId || null,
      issues: result.issues || [],
    })),
    issues: productionAppSurfaceIssues,
    ready: productionAppSurfacesReady,
  },
  guardrailIssues,
  blockers,
  nextActions: [
    !publicMetadataPresent ? 'Deploy the current metadata routes to production, then run npm run qa:public-metadata against the live alias.' : null,
    publicMetadataPresent && !publicMetadataReady ? 'Fix the failing public metadata smoke before treating the metadata launch surface as production-ready.' : null,
    deploymentCurrency.enforced && deploymentCurrency.runtimeCommitAhead
      ? `Redeploy production from the repo root so Vercel serves runtime commit ${deploymentRuntimeCommitShort}; then rerun npm run qa:public-launch-status and npm run qa:launch-signoff.`
      : null,
    deploymentCurrency.enforced && deploymentCurrency.error
      ? `Resolve production deployment-currency verification: ${deploymentCurrency.error}.`
      : null,
    betaRemaining > 0 ? `Collect and import ${betaRemaining} completed beta review submission(s).` : null,
    visualRemaining > 0 ? `Run, review, and import ${visualRemaining} scheduled production visual review date(s).` : null,
    guardrailIssues.length > 0 ? 'Fix guardrail issues before relying on public-launch status.' : null,
  ].filter(Boolean),
  artifacts: {
    betaRegister: qaDisplayPath(betaRegisterPath),
    visualRegister: qaDisplayPath(visualRegisterPath),
    visualDispatchOutbox: qaDisplayPath(visualDispatchOutboxPath),
    monitoringRegister: qaDisplayPath(monitoringRegisterPath),
    rollbackPlan: qaDisplayPath(rollbackPath),
    riskRegister: qaDisplayPath(riskRegisterPath),
    paidPathReadiness: qaDisplayPath(paidPathReadinessPath),
    accessibility: qaDisplayPath(accessibilityPath),
    designSystemReadiness: qaDisplayPath(designSystemPath),
    plannerActuals: qaDisplayPath(plannerActualsPath),
    publicShareMapIntegrity: qaDisplayPath(publicShareMapIntegrityPath),
    publicMetadata: qaDisplayPath(publicMetadataPath),
    releaseCandidate: qaDisplayPath(releaseCandidatePath),
    routeInventory: qaDisplayPath(routeInventoryPath),
    appSurfaces: qaDisplayPath(appSurfacesPath),
    productionAppSurfaces: qaDisplayPath(productionAppSurfacesPath),
    betaWaveRehearsal: qaDisplayPath(betaWaveRehearsalPath),
    betaMatrixRehearsal: qaDisplayPath(betaMatrixRehearsalPath),
    betaGuestStartRehearsal: qaDisplayPath(betaGuestStartRehearsalPath),
    betaDispatchOutbox: qaDisplayPath(betaDispatchOutboxPath),
    betaFollowUpOutbox: qaDisplayPath(betaFollowUpOutboxPath),
    betaAllWaveOps: qaDisplayPath(betaAllWaveOpsPath),
    launchOperatorToday: qaDisplayPath(launchOperatorTodayPath),
    launchOperatorTodayOverdueRehearsal: qaDisplayPath(launchOperatorTodayOverdueRehearsalPath),
    launchOperatorSentDispatchRehearsal: qaDisplayPath(launchOperatorSentDispatchRehearsalPath),
    dispatchMarkSentDryRun: qaDisplayPath(dispatchMarkSentDryRunPath),
    dispatchMarkSentImportRehearsal: qaDisplayPath(dispatchMarkSentImportRehearsalPath),
    dispatchSentRecordTemplate: qaDisplayPath(dispatchSentRecordTemplatePath),
    dispatchSentRecordTemplateRejection: qaDisplayPath(dispatchSentRecordTemplateRejectionPath),
    reviewIntakeRehearsal: qaDisplayPath(reviewIntakeRehearsalPath),
    reviewIntakeImportRehearsal: qaDisplayPath(reviewIntakeImportRehearsalPath),
    publicLaunchModeRehearsal: qaDisplayPath(publicLaunchModeRehearsalPath),
    publicLaunchThresholdRehearsal: qaDisplayPath(publicLaunchThresholdRehearsalPath),
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
- Runtime deployment current: ${summary.deploymentCurrency.runtimeCommitAhead ? 'no' : summary.deploymentCurrency.error ? 'unknown' : 'yes'}
- Latest runtime commit awaiting production: ${summary.deploymentCurrency.latestRuntimeCommitShort || 'none'}
- Beta reviews: ${completedBetaReviews.length}/${publicBetaMinimum}
- Beta review origin: ${summary.betaHumanReviews.expectedReviewOrigin || 'missing'}
- Beta review assignment queue ready: ${summary.betaHumanReviews.assignmentQueueReady ? 'yes' : 'no'}
- Beta review execution schedule ready: ${summary.betaHumanReviews.executionScheduleReady ? 'yes' : 'no'}
- Beta review command center ready: ${summary.betaHumanReviews.commandCenterReady ? 'yes' : 'no'}
- Beta review overdue waves: ${summary.betaHumanReviews.overdueWaveCount || 0}
- Beta review due-soon waves: ${summary.betaHumanReviews.dueSoonWaveCount || 0}
- Beta review dispatch prepared rows: ${summary.betaHumanReviews.dispatchPreparedRowCount || 0}
- Beta review dispatch due today: ${summary.betaHumanReviews.dispatchDueTodayCount || 0}
- Beta review dispatch overdue: ${summary.betaHumanReviews.dispatchOverdueCount || 0}
- Beta review follow-ups due soon: ${summary.betaHumanReviews.followUpDueSoonCount || 0}
- Beta review follow-ups overdue: ${summary.betaHumanReviews.followUpOverdueCount || 0}
- Beta review next-wave ops ready: ${summary.betaHumanReviews.nextWaveOpsReady ? 'yes' : 'no'}
- Beta review dispatch outbox ready: ${summary.betaHumanReviews.dispatchOutboxReady ? 'yes' : 'no'} (${summary.betaHumanReviews.dispatchOutboxMessageFileCount || 0} message files)
- Beta review dispatch log ready: ${summary.betaHumanReviews.dispatchLogReady ? 'yes' : 'no'} (${summary.betaHumanReviews.dispatchLogSentCount || 0} sent, ${summary.betaHumanReviews.dispatchLogPreparedNotSentCount || 0} prepared not sent)
- Beta review follow-up outbox ready: ${summary.betaHumanReviews.followUpOutboxReady ? 'yes' : 'no'} (${summary.betaHumanReviews.followUpOutboxMessageFileCount || 0} message files, ${summary.betaHumanReviews.followUpOutboxSendEligibleCount || 0} eligible, ${summary.betaHumanReviews.followUpOutboxBlockedUntilInitialSendCount || 0} draft-only)
- Beta review all-wave ops ready: ${summary.betaHumanReviews.allWaveOpsReady ? 'yes' : 'no'} (${summary.betaHumanReviews.allWaveOpsRowCount || 0}/${summary.betaHumanReviews.planned || 0})
- Beta review wave rehearsal ready: ${summary.betaHumanReviews.waveRehearsalReady ? 'yes' : 'no'} (${summary.betaHumanReviews.waveRehearsalChecked || 0}/${summary.betaHumanReviews.nextWaveOpsRowCount || 0})
- Beta review matrix rehearsal ready: ${summary.betaHumanReviews.matrixRehearsalReady ? 'yes' : 'no'} (${summary.betaHumanReviews.matrixRehearsalChecked || 0}/${summary.betaHumanReviews.planned || 0})
- Beta review production guest-start rehearsal ready: ${summary.betaHumanReviews.guestStartRehearsalReady ? 'yes' : 'no'} (${summary.betaHumanReviews.guestStartRehearsalExerciseCount || 0} exercised, ${summary.betaHumanReviews.guestStartRehearsalCleanupFailureCount || 0} cleanup failures)
- Production visual review history: ${visualHistoryDates.length}/${visualMinimum}
- Production visual due-soon reviews: ${summary.productionVisualReviews.dueSoonScheduledReviewCount || 0}
- Production visual overdue reviews: ${summary.productionVisualReviews.overdueScheduledReviewCount || 0}
- Latest production visual artifact: ${summary.productionVisualReviews.latestProductionArtifact || 'missing'}
- Latest production visual commit: ${summary.productionVisualReviews.latestProductionCommit || 'missing'}
- Latest production visual deployment: ${summary.productionVisualReviews.latestProductionDeploymentUrl || 'missing'}
- Production visual review progress artifact aligned: ${visualProgressIssues.length === 0 ? 'yes' : 'no'}
- Production visual review assignment queue ready: ${summary.productionVisualReviews.assignmentQueueReady ? 'yes' : 'no'}
- Production visual review dispatch outbox ready: ${summary.productionVisualReviews.dispatchOutboxReady ? 'yes' : 'no'} (${summary.productionVisualReviews.dispatchOutboxMessageFileCount || 0} message files, ${summary.productionVisualReviews.dispatchOutboxRequiredRowCount || 0} required)
- Production visual review dispatch log ready: ${summary.productionVisualReviews.dispatchLogReady ? 'yes' : 'no'} (${summary.productionVisualReviews.dispatchLogSentCount || 0} sent, ${summary.productionVisualReviews.dispatchLogPreparedNotSentCount || 0} prepared not sent)
- Public launch blocker board ready: ${summary.publicLaunchBlockerBoard.ready ? 'yes' : 'no'} (${summary.publicLaunchBlockerBoard.betaRowCount || 0} beta rows, ${summary.publicLaunchBlockerBoard.requiredVisualRowCount || 0} required visual rows, ${summary.publicLaunchBlockerBoard.rowCount || 0} total rows)
- Launch operator today ready: ${summary.launchOperatorToday.ready ? 'yes' : 'no'} (${summary.launchOperatorToday.actionRowCount || 0} action rows, ${summary.launchOperatorToday.betaActionRowCount || 0} beta, ${summary.launchOperatorToday.visualActionRowCount || 0} visual, ${summary.launchOperatorToday.betaDispatchLogPreparedNotSentCount || 0} beta unsent, ${summary.launchOperatorToday.visualDispatchLogRequiredPreparedNotSentCount || 0} required visual unsent)
- Launch operator overdue rehearsal ready: ${summary.launchOperatorTodayOverdueRehearsal.ready ? 'yes' : 'no'} (${summary.launchOperatorTodayOverdueRehearsal.detectedOverdueRowCount || 0} overdue rows detected)
- Launch operator sent-dispatch rehearsal ready: ${summary.launchOperatorSentDispatchRehearsal.ready ? 'yes' : 'no'} (${summary.launchOperatorSentDispatchRehearsal.launchOperatorActionRowCount || 0} action rows after rehearsed sends)
- Dispatch mark-sent dry run ready: ${summary.dispatchMarkSentDryRun.ready ? 'yes' : 'no'} (${summary.dispatchMarkSentDryRun.betaUpdateCount || 0} beta, ${summary.dispatchMarkSentDryRun.visualUpdateCount || 0} visual)
- Dispatch mark-sent import rehearsal ready: ${summary.dispatchMarkSentImportRehearsal.ready ? 'yes' : 'no'} (${summary.dispatchMarkSentImportRehearsal.tempBetaSentCount || 0} beta sent on isolated log, ${summary.dispatchMarkSentImportRehearsal.tempVisualSentCount || 0} visual sent on isolated log)
- Dispatch sent-record template ready: ${summary.dispatchSentRecordTemplate.ready ? 'yes' : 'no'} (${summary.dispatchSentRecordTemplate.rowCount || 0} rows, ready for import: ${summary.dispatchSentRecordTemplate.readyForImport ? 'yes' : 'no'})
- Dispatch sent-record blank-template rejection ready: ${summary.dispatchSentRecordTemplateRejection.ready ? 'yes' : 'no'} (${summary.dispatchSentRecordTemplateRejection.requestedUpdateCount || 0} rejected rows, canonical logs unchanged: ${summary.dispatchSentRecordTemplateRejection.canonicalBetaUnchanged && summary.dispatchSentRecordTemplateRejection.canonicalVisualUnchanged ? 'yes' : 'no'})
- Review intake rehearsal ready: ${summary.reviewIntakeRehearsal.ready ? 'yes' : 'no'} (${summary.reviewIntakeRehearsal.betaInvalidSubmissionCount || 0} beta invalid, ${summary.reviewIntakeRehearsal.visualInvalidSubmissionCount || 0} visual invalid)
- Review intake import rehearsal ready: ${summary.reviewIntakeImportRehearsal.ready ? 'yes' : 'no'} (beta copied count ${summary.reviewIntakeImportRehearsal.tempBetaCompletedBefore || 0}->${summary.reviewIntakeImportRehearsal.tempBetaCompletedAfter || 0}, visual copied count ${summary.reviewIntakeImportRehearsal.tempVisualHistoryBefore || 0}->${summary.reviewIntakeImportRehearsal.tempVisualHistoryAfter || 0})
- Public launch mode rehearsal ready: ${summary.publicLaunchModeRehearsal.ready ? 'yes' : 'no'} (${summary.publicLaunchModeRehearsal.publicLaunchModeExitCode ?? 'missing'} strict-mode exit)
- Public launch threshold rehearsal ready: ${summary.publicLaunchThresholdRehearsal.ready ? 'yes' : 'no'} (simulated beta ${summary.publicLaunchThresholdRehearsal.simulatedBetaCompletedReviewCount || 0}/${summary.publicLaunchThresholdRehearsal.simulatedBetaPublicLaunchMinimum || 0}, simulated visual ${summary.publicLaunchThresholdRehearsal.simulatedVisualDistinctHistoryDateCount || 0}/${summary.publicLaunchThresholdRehearsal.simulatedVisualMinimumHistoryDateCount || 0})
- Open P0/P1 risks: ${openBlockingRisks.length}
- Open accepted P2 risks: ${openAcceptedP2Risks.length}
- Incomplete accepted P2 risks: ${incompleteAcceptedP2Risks.length}
- Accepted P2 evidence-count issues: ${acceptedRiskEvidenceIssues.length}
- Rollback plan actionable: ${summary.rollback.actionable ? 'yes' : 'no'}
- Production monitoring ready: ${summary.monitoring.latestVerificationReady && summary.monitoring.missingSignals.length === 0 && summary.monitoring.workflowIssues.length === 0 && summary.monitoring.missingAlertMarkers.length === 0 && summary.monitoring.missingRunbookMarkers.length === 0 ? 'yes' : 'no'}
- Paid path ready: ${summary.paidPath.ready ? 'yes' : 'no'}
- Accessibility ready: ${summary.accessibility.ready ? 'yes' : 'no'}
- Design system ready: ${summary.designSystem.ready ? 'yes' : 'no'}
- Planner map actuals ready: ${summary.plannerActuals.ready ? 'yes' : 'no'}
- Public share map/itinerary catalog ready: ${summary.publicShareMapIntegrity.ready ? 'yes' : 'no'} (${summary.publicShareMapIntegrity.shareCount || 0}/${summary.publicShareMapIntegrity.discovery.totalPublicShares || 0} public shares, ${summary.publicShareMapIntegrity.checkedViewports || 0} viewports)
- Public metadata ready: ${summary.publicMetadata.ready ? 'yes' : 'no'} (${summary.publicMetadata.passed || 0}/${summary.publicMetadata.requiredCheckCount || 0})
- Release candidate ready: ${summary.releaseCandidate.ready ? 'yes' : 'no'}
- Full route inventory ready: ${summary.routeInventory.ready ? 'yes' : 'no'}
- Authenticated app surfaces ready: ${summary.appSurfaces.ready ? 'yes' : 'no'}
- Production authenticated app surfaces ready: ${summary.productionAppSurfaces.ready ? 'yes' : 'no'}

## Public-Launch Blockers

${markdownList(blockers.map((blocker) => `${blocker.id}: ${blocker.detail}`))}

## Guardrail Issues

${markdownList(guardrailIssues)}

## Evidence Queue Issues

Beta human-review queue:
${markdownList(betaQueueIssues)}

Beta human-review schedule:
${markdownList(betaScheduleIssues)}

Beta human-review command center:
${markdownList(betaCommandCenterIssues)}

Beta human-review next-wave ops:
${markdownList(betaNextWaveOpsIssues)}

Beta human-review dispatch outbox:
${markdownList(betaDispatchOutboxIssues)}

Beta human-review dispatch log:
${markdownList(betaDispatchLogIssues)}

Beta human-review follow-up outbox:
${markdownList(betaFollowUpOutboxIssues)}

Beta human-review all-wave ops:
${markdownList(betaAllWaveOpsIssues)}

Beta human-review wave rehearsal:
${markdownList(betaWaveRehearsalIssues)}

Beta human-review matrix rehearsal:
${markdownList(betaMatrixRehearsalIssues)}

Beta human-review production guest-start rehearsal:
${markdownList(betaGuestStartRehearsalIssues)}

Production visual-review progress:
${markdownList(visualProgressIssues)}

Production visual-review queue:
${markdownList(visualQueueIssues)}

Production visual-review dispatch outbox:
${markdownList(visualDispatchOutboxIssues)}

Production visual-review dispatch log:
${markdownList(visualDispatchLogIssues)}

Public launch blocker board:
${markdownList(blockerBoardIssues)}

Launch operator today:
${markdownList(launchTodayIssues)}

Launch operator overdue rehearsal:
${markdownList(launchTodayOverdueRehearsalIssues)}

Launch operator sent-dispatch rehearsal:
${markdownList(launchSentDispatchRehearsalIssues)}

Dispatch mark-sent dry run:
${markdownList(dispatchMarkSentDryRunIssues)}

Dispatch mark-sent import rehearsal:
${markdownList(dispatchMarkSentImportRehearsalIssues)}

Dispatch sent-record template:
${markdownList(dispatchSentRecordTemplateIssues)}

Dispatch sent-record blank-template rejection:
${markdownList(dispatchSentRecordTemplateRejectionIssues)}

Review intake rehearsal:
${markdownList(reviewIntakeRehearsalIssues)}

Review intake import rehearsal:
${markdownList(reviewIntakeImportRehearsalIssues)}

Public launch mode rehearsal:
${markdownList(publicLaunchModeRehearsalIssues)}

Public launch threshold rehearsal:
${markdownList(publicLaunchThresholdRehearsalIssues)}

Full route inventory:
${markdownList(routeInventoryIssues)}

Authenticated app surfaces:
${markdownList(appSurfaceIssues)}

Production authenticated app surfaces:
${markdownList(productionAppSurfaceIssues)}

Public share map/itinerary integrity:
${markdownList(publicShareMapIntegrityIssues)}

Public metadata:
${markdownList(publicMetadataIssues)}

## Next Actions

${markdownList(summary.nextActions)}

## Evidence

- Beta register: \`${summary.artifacts.betaRegister}\`
- Beta progress: \`${summary.betaHumanReviews.progressArtifact}\`
- Beta intake: \`${summary.betaHumanReviews.intakeArtifact}\`
- Beta packet manifest: \`${summary.betaHumanReviews.packetManifest}\`
- Beta assignment board: \`${summary.betaHumanReviews.assignmentReport}\` and \`${summary.betaHumanReviews.assignmentCsv}\`
- Beta execution schedule: \`${summary.betaHumanReviews.scheduleArtifact}\`, \`${summary.betaHumanReviews.scheduleReport}\`, and \`${summary.betaHumanReviews.scheduleCsv}\`
- Beta command center: \`${summary.betaHumanReviews.commandCenterArtifact}\` and \`${summary.betaHumanReviews.commandCenterReport}\`
- Beta next-wave ops: \`${summary.betaHumanReviews.nextWaveOpsArtifact}\`, \`${summary.betaHumanReviews.nextWaveOpsReport}\`, and \`${summary.betaHumanReviews.nextWaveOpsCsv}\`
- Beta dispatch outbox: \`${summary.betaHumanReviews.dispatchOutboxArtifact}\`, \`${summary.betaHumanReviews.dispatchOutboxReport}\`, \`${summary.betaHumanReviews.dispatchOutboxCsv}\`, and \`${summary.betaHumanReviews.dispatchOutboxArtifactDir}\`
- Beta dispatch log: \`${summary.betaHumanReviews.dispatchLogArtifact}\`, \`${summary.betaHumanReviews.dispatchLogReport}\`, and \`${summary.betaHumanReviews.dispatchLogCsv}\`
- Beta follow-up outbox: \`${summary.betaHumanReviews.followUpOutboxArtifact}\`, \`${summary.betaHumanReviews.followUpOutboxReport}\`, \`${summary.betaHumanReviews.followUpOutboxCsv}\`, and \`${summary.betaHumanReviews.followUpOutboxArtifactDir}\`
- Beta all-wave ops: \`${summary.betaHumanReviews.allWaveOpsArtifact}\`, \`${summary.betaHumanReviews.allWaveOpsReport}\`, and \`${summary.betaHumanReviews.allWaveOpsCsv}\`
- Beta wave rehearsal: \`${summary.betaHumanReviews.waveRehearsalArtifact}\` and \`${summary.betaHumanReviews.waveRehearsalReport}\`
- Beta matrix rehearsal: \`${summary.betaHumanReviews.matrixRehearsalArtifact}\` and \`${summary.betaHumanReviews.matrixRehearsalReport}\`
- Beta guest-start rehearsal: \`${summary.betaHumanReviews.guestStartRehearsalArtifact}\` and \`${summary.betaHumanReviews.guestStartRehearsalReport}\`
- Public launch blocker board: \`${summary.publicLaunchBlockerBoard.report}\`, \`${summary.publicLaunchBlockerBoard.csv}\`, and \`${summary.publicLaunchBlockerBoard.artifact}\`
- Launch operator today: \`${summary.launchOperatorToday.report}\`, \`${summary.launchOperatorToday.csv}\`, and \`${summary.launchOperatorToday.artifact}\`
- Launch operator sent-dispatch rehearsal: \`${summary.launchOperatorSentDispatchRehearsal.report}\` and \`${summary.launchOperatorSentDispatchRehearsal.artifact}\`
- Dispatch mark-sent dry run: \`${summary.dispatchMarkSentDryRun.report}\` and \`${summary.dispatchMarkSentDryRun.artifact}\`
- Dispatch mark-sent import rehearsal: \`${summary.dispatchMarkSentImportRehearsal.report}\` and \`${summary.dispatchMarkSentImportRehearsal.artifact}\`
- Dispatch sent-record template: \`${summary.dispatchSentRecordTemplate.report}\`, \`${summary.dispatchSentRecordTemplate.csv}\`, and \`${summary.dispatchSentRecordTemplate.artifact}\`
- Dispatch sent-record blank-template rejection: \`${summary.dispatchSentRecordTemplateRejection.report}\` and \`${summary.dispatchSentRecordTemplateRejection.artifact}\`
- Review intake import rehearsal: \`${summary.reviewIntakeImportRehearsal.report}\` and \`${summary.reviewIntakeImportRehearsal.artifact}\`
- Public launch threshold rehearsal: \`${summary.publicLaunchThresholdRehearsal.report}\` and \`${summary.publicLaunchThresholdRehearsal.artifact}\`
- Visual register: \`${summary.artifacts.visualRegister}\`
- Visual progress: \`${summary.productionVisualReviews.progressArtifact}\`
- Latest production visual artifact: \`${summary.productionVisualReviews.latestProductionArtifact}\` and \`${summary.productionVisualReviews.latestProductionSummaryArtifact}\`
- Visual schedule: \`${summary.productionVisualReviews.scheduleArtifact}\`
- Visual intake: \`${summary.productionVisualReviews.intakeArtifact}\`
- Visual assignment board: \`${summary.productionVisualReviews.assignmentReport}\` and \`${summary.productionVisualReviews.assignmentCsv}\`
- Visual dispatch outbox: \`${summary.productionVisualReviews.dispatchOutboxArtifact}\`, \`${summary.productionVisualReviews.dispatchOutboxReport}\`, \`${summary.productionVisualReviews.dispatchOutboxCsv}\`, and \`${summary.productionVisualReviews.dispatchOutboxArtifactDir}\`
- Visual dispatch log: \`${summary.productionVisualReviews.dispatchLogArtifact}\`, \`${summary.productionVisualReviews.dispatchLogReport}\`, and \`${summary.productionVisualReviews.dispatchLogCsv}\`
- Visual submission templates: \`${summary.productionVisualReviews.submissionTemplateDir}\`
- Monitoring register: \`${summary.artifacts.monitoringRegister}\`
- Rollback plan: \`${summary.artifacts.rollbackPlan}\`
- Risk register: \`${summary.artifacts.riskRegister}\`
- Paid-path readiness: \`${summary.artifacts.paidPathReadiness}\`
- Accessibility: \`${summary.artifacts.accessibility}\`
- Design-system readiness: \`${summary.artifacts.designSystemReadiness}\`
- Planner actuals: \`${summary.artifacts.plannerActuals}\`
- Public share map/itinerary integrity: \`${summary.artifacts.publicShareMapIntegrity}\` and \`${summary.publicShareMapIntegrity.report}\`
- Public metadata, manifest, robots, and sitemap: \`${summary.artifacts.publicMetadata}\` and \`${summary.publicMetadata.report}\`
- Release candidate: \`${summary.artifacts.releaseCandidate}\`
- Full route inventory: \`${summary.artifacts.routeInventory}\`
- Authenticated app surfaces: \`${summary.artifacts.appSurfaces}\`
- Production authenticated app surfaces: \`${summary.artifacts.productionAppSurfaces}\`

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
