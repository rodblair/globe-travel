import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_PUBLIC_LAUNCH_STATUS_DATE || ''
const baseUrl = (process.env.QA_BASE_URL || 'https://globe-travel-two.vercel.app').replace(/\/$/, '')
const requirePublicLaunch = ['1', 'true', 'yes', 'public'].includes(String(process.env.QA_LAUNCH_STATUS_REQUIRE_PUBLIC || '').toLowerCase())
const expectedCommit = process.env.QA_LAUNCH_EXPECTED_COMMIT || ''

const betaRegisterPath = process.env.QA_BETA_REVIEW_REGISTER || 'qa/beta-human-review-register.json'
const betaPacketManifestPath = process.env.QA_BETA_REVIEW_PACKET_MANIFEST || 'qa/beta-human-review-packet-manifest-2026-05-21.json'
const betaProgressPath = process.env.QA_BETA_REVIEW_PROGRESS || 'qa/beta-human-review-progress-2026-05-21.json'
const betaIntakePath = process.env.QA_BETA_REVIEW_INTAKE || 'qa/beta-human-review-intake-2026-05-21.json'
const visualRegisterPath = process.env.QA_VISUAL_REVIEW_REGISTER || 'qa/production-visual-review-register.json'
const visualIntakePath = process.env.QA_VISUAL_REVIEW_INTAKE || 'qa/production-visual-review-intake-2026-05-21.json'
const visualSchedulePath = process.env.QA_VISUAL_REVIEW_SCHEDULE || 'qa/production-visual-review-schedule-2026-05-21.md'
const monitoringRegisterPath = process.env.QA_PRODUCTION_MONITORING_REGISTER || 'qa/production-monitoring-register.json'
const rollbackPath = process.env.QA_ROLLBACK_PLAN || 'qa/launch-rollback-plan.json'
const riskRegisterPath = process.env.QA_RISK_REGISTER || 'qa/launch-risk-register.json'

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

function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

function currentUtcDate() {
  return new Date().toISOString().slice(0, 10)
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
  readJson(betaPacketManifestPath),
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
const date = requestedDate ||
  dateOnly(betaRegister.reviewedAt) ||
  dateOnly(visualRegister.reviewedAt) ||
  dateOnly(monitoringRegister.reviewedAt) ||
  dateOnly(rollbackPlan.reviewedAt) ||
  dateOnly(riskRegister.reviewedAt) ||
  currentUtcDate()
const jsonArtifact = process.env.QA_PUBLIC_LAUNCH_STATUS_JSON || `public-launch-status-${date}.json`
const reportArtifact = process.env.QA_PUBLIC_LAUNCH_STATUS_REPORT || `public-launch-status-${date}.md`
const betaAssignmentCsvPath = betaPacketManifest.assignmentCsv || `qa/beta-human-review-assignments-${date}.csv`
const betaAssignmentReportPath = betaPacketManifest.assignmentReport || `qa/beta-human-review-assignments-${date}.md`
const visualSubmissionDir = visualRegister.reviewSubmissionDirectory || `qa/production-visual-review-submissions-${date}`
const visualAssignmentCsvPath = visualRegister.reviewAssignmentCsv || `qa/production-visual-review-assignments-${date}.csv`
const visualAssignmentReportPath = visualRegister.reviewAssignmentReport || `qa/production-visual-review-assignments-${date}.md`

const [
  betaAssignmentCsv,
  betaAssignmentReport,
  visualAssignmentCsv,
  visualAssignmentReport,
  betaPacketFileChecks,
  betaSubmissionTemplateChecks,
  visualSubmissionTemplateChecks,
] = await Promise.all([
  readableText(betaAssignmentCsvPath),
  readableText(betaAssignmentReportPath),
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
  if (Number(file.json?.screenshotsReviewed) < 20) visualQueueIssues.push(`visual template ${file.path} screenshotsReviewed must be at least 20`)
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

const openBlockingRisks = (Array.isArray(riskRegister.issues) ? riskRegister.issues : [])
  .filter((issue) => ['P0', 'P1'].includes(String(issue.severity || '').toUpperCase()) && String(issue.status || '').toLowerCase() === 'open')
const openAcceptedP2Risks = (Array.isArray(riskRegister.issues) ? riskRegister.issues : [])
  .filter((issue) => String(issue.severity || '').toUpperCase() === 'P2' && String(issue.status || '').toLowerCase() === 'open')
const incompleteAcceptedP2Risks = openAcceptedP2Risks.filter((issue) => (
  !hasText(issue.owner) ||
  !hasText(issue.targetMonth) ||
  !hasText(issue.acceptedRisk, 40)
))
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
if (betaQueueIssues.length > 0) guardrailIssues.push('beta human review assignment queue is not fully prepared')
if (visualIntake.status !== 'pass') guardrailIssues.push('production visual review intake artifact is not passing')
if (!visualScheduleReport.includes('Status: pass')) guardrailIssues.push('production visual review schedule report is not passing')
if (visualQueueIssues.length > 0) guardrailIssues.push('production visual review assignment queue is not fully prepared')
if (incompleteAcceptedP2Risks.length > 0) {
  guardrailIssues.push('open accepted P2 launch risks are missing owner, target month, or accepted-risk notes')
}
if (monitoringRegister.latestVerification?.expectedLiveCommit !== liveDeployment?.commit) {
  guardrailIssues.push('production monitoring latest verification is not tied to the live production commit')
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
    packetManifest: qaDisplayPath(betaPacketManifestPath),
    packetCount: betaPacketRecords.length,
    assignmentCsv: qaDisplayPath(betaAssignmentCsvPath),
    assignmentReport: qaDisplayPath(betaAssignmentReportPath),
    submissionTemplateCount: betaSubmissionTemplateChecks.length,
    queueIssues: betaQueueIssues,
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
    assignmentQueueReady: visualQueueIssues.length === 0,
    assignmentQueueIssueCount: visualQueueIssues.length,
    assignmentCsv: qaDisplayPath(visualAssignmentCsvPath),
    assignmentReport: qaDisplayPath(visualAssignmentReportPath),
    submissionTemplateDir: qaDisplayPath(visualSubmissionDir),
    submissionTemplateCount: visualSubmissionTemplateChecks.length,
    queueIssues: visualQueueIssues,
  },
  risks: {
    openBlockingRiskCount: openBlockingRisks.length,
    openAcceptedP2RiskCount: openAcceptedP2Risks.length,
    openAcceptedP2RiskIds: openAcceptedP2Risks.map((issue) => issue.id),
    incompleteAcceptedP2RiskCount: incompleteAcceptedP2Risks.length,
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
- Beta review origin: ${summary.betaHumanReviews.expectedReviewOrigin || 'missing'}
- Beta review assignment queue ready: ${summary.betaHumanReviews.assignmentQueueReady ? 'yes' : 'no'}
- Production visual review history: ${visualHistoryDates.length}/${visualMinimum}
- Production visual review assignment queue ready: ${summary.productionVisualReviews.assignmentQueueReady ? 'yes' : 'no'}
- Open P0/P1 risks: ${openBlockingRisks.length}
- Open accepted P2 risks: ${openAcceptedP2Risks.length}
- Incomplete accepted P2 risks: ${incompleteAcceptedP2Risks.length}
- Rollback plan actionable: ${summary.rollback.actionable ? 'yes' : 'no'}

## Public-Launch Blockers

${markdownList(blockers.map((blocker) => `${blocker.id}: ${blocker.detail}`))}

## Guardrail Issues

${markdownList(guardrailIssues)}

## Evidence Queue Issues

Beta human-review queue:
${markdownList(betaQueueIssues)}

Production visual-review queue:
${markdownList(visualQueueIssues)}

## Next Actions

${markdownList(summary.nextActions)}

## Evidence

- Beta register: \`${summary.artifacts.betaRegister}\`
- Beta progress: \`${summary.betaHumanReviews.progressArtifact}\`
- Beta intake: \`${summary.betaHumanReviews.intakeArtifact}\`
- Beta packet manifest: \`${summary.betaHumanReviews.packetManifest}\`
- Beta assignment board: \`${summary.betaHumanReviews.assignmentReport}\` and \`${summary.betaHumanReviews.assignmentCsv}\`
- Visual register: \`${summary.artifacts.visualRegister}\`
- Visual schedule: \`${summary.productionVisualReviews.scheduleArtifact}\`
- Visual intake: \`${summary.productionVisualReviews.intakeArtifact}\`
- Visual assignment board: \`${summary.productionVisualReviews.assignmentReport}\` and \`${summary.productionVisualReviews.assignmentCsv}\`
- Visual submission templates: \`${summary.productionVisualReviews.submissionTemplateDir}\`
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
