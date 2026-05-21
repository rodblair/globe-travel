import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const date = process.env.QA_BETA_REVIEW_PROGRESS_DATE || new Date().toISOString().slice(0, 10)
const registerPath = process.env.QA_BETA_REVIEW_REGISTER || '../qa/beta-human-review-register.json'
const requirePublicProgress = ['1', 'true', 'yes', 'public'].includes(String(process.env.QA_BETA_REVIEW_PROGRESS_REQUIRE_PUBLIC || '').toLowerCase())
const progressSuffix = requirePublicProgress ? '-public' : ''
const jsonArtifact = process.env.QA_BETA_REVIEW_PROGRESS_JSON || `beta-human-review-progress-${date}${progressSuffix}.json`
const reportArtifact = process.env.QA_BETA_REVIEW_PROGRESS_REPORT || `beta-human-review-progress-${date}${progressSuffix}.md`

const requiredAudiences = ['friend-group', 'couple', 'family', 'solo']
const requiredStyles = ['budget', 'premium', 'food', 'nightlife', 'outdoors', 'culture']
const requiredRegions = ['Africa', 'Asia', 'Europe', 'Latin America', 'North America', 'Oceania']
const requiredDevices = ['phone', 'desktop']
const requiredSurfaces = ['planner', 'trip-studio', 'map', 'public-share', 'feedback', 'save-reopen']
const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])
const blockingSeverities = new Set(['P0', 'P1'])
const requiredScorecardFields = [
  'firstMinuteClarity',
  'itineraryUsefulness',
  'mapTrust',
  'editAndSwapConfidence',
  'saveReopenConfidence',
  'feedbackLoopClarity',
  'shareRecipientClarity',
  'mobileUsability',
  'paidValueCredibility',
]
const requiredCompletedReviewFields = [
  'reviewerRole',
  'routeOrShareUrl',
  'viewport',
  'device',
  'prompt',
  'completedAt',
  'firstMinuteOutcome',
  'mapTrustNotes',
  'shareFeedbackOutcome',
  'scorecard',
  'findings',
]
const allowedFindingSeverities = new Set(['P0', 'P1', 'P2', 'P3'])
const allowedFindingStatuses = new Set(['open', 'closed', 'accepted-risk'])

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function missingFrom(values, required) {
  const set = new Set(values)
  return required.filter((value) => !set.has(value))
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function isViewport(value) {
  return /^\d{3,4}x\d{3,4}$/.test(String(value || '').trim())
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim()) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null
}

function average(values) {
  const numbers = values.filter((value) => Number.isFinite(value))
  if (numbers.length === 0) return null
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length
}

function pct(part, whole) {
  if (!whole) return 0
  return Math.round((part / whole) * 1000) / 10
}

function completedReviewEvidenceIssues(review) {
  const issues = []

  for (const field of requiredCompletedReviewFields) {
    if (field === 'scorecard') {
      if (!review.scorecard || typeof review.scorecard !== 'object' || Array.isArray(review.scorecard)) {
        issues.push('scorecard')
      }
      continue
    }

    if (field === 'findings') {
      if (!Array.isArray(review.findings)) issues.push('findings')
      continue
    }

    if (!hasText(review[field])) issues.push(field)
  }

  if (hasText(review.routeOrShareUrl) && !isHttpUrl(review.routeOrShareUrl)) {
    issues.push('routeOrShareUrl must be http(s)')
  }

  if (hasText(review.viewport) && !isViewport(review.viewport)) {
    issues.push('viewport must look like 390x844')
  }

  if (hasText(review.completedAt) && !isDate(review.completedAt)) {
    issues.push('completedAt must be YYYY-MM-DD')
  }

  const scorecard = review.scorecard || {}
  const missingRatings = requiredScorecardFields.filter((field) => !isRating(scorecard[field]))
  if (missingRatings.length > 0) {
    issues.push(`scorecard ratings missing or out of range: ${missingRatings.join(', ')}`)
  }

  const malformedFindings = Array.isArray(review.findings)
    ? review.findings.filter((finding) => (
      !allowedFindingSeverities.has(String(finding.severity || '').toUpperCase()) ||
      !allowedFindingStatuses.has(String(finding.status || '').toLowerCase()) ||
      !hasText(finding.surface) ||
      !hasText(finding.title) ||
      !hasText(finding.notes)
    ))
    : []
  if (malformedFindings.length > 0) {
    issues.push(`${malformedFindings.length} malformed finding(s)`)
  }

  return issues
}

function findingIsBlocking(finding) {
  return blockingSeverities.has(String(finding.severity || '').toUpperCase()) &&
    String(finding.status || '').toLowerCase() !== 'closed'
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

const raw = await readFile(resolve(process.cwd(), registerPath), 'utf8')
const register = JSON.parse(raw)
const plannedReviews = Array.isArray(register.plannedReviews) ? register.plannedReviews : []
const completedReviews = plannedReviews.filter((review) => completedStatuses.has(review.status))
const publicLaunchMinimum = Number(register.minimumCompletedReviewsForPublicLaunch) || 25
const targetCompletedReviews = Number(register.targetCompletedReviewsBeforePublicLaunch) || publicLaunchMinimum
const remainingReviewsForMinimum = Math.max(0, publicLaunchMinimum - completedReviews.length)
const minimumAverageScore = Number(register.minimumAverageScoreForPublicLaunch) || 4
const minimumFieldAverageScore = Number(register.minimumFieldAverageScoreForPublicLaunch) || 3.75

const completedAudiences = unique(completedReviews.map((review) => review.audience))
const completedStyles = unique(completedReviews.map((review) => review.style))
const completedRegions = unique(completedReviews.map((review) => review.region))
const completedDevices = unique(completedReviews.map((review) => review.device))
const completedSurfaces = unique(completedReviews.flatMap((review) => review.primarySurfaces || []))
const completedCoverageGaps = {
  audiences: missingFrom(completedAudiences, requiredAudiences),
  styles: missingFrom(completedStyles, requiredStyles),
  regions: missingFrom(completedRegions, requiredRegions),
  devices: missingFrom(completedDevices, requiredDevices),
  surfaces: missingFrom(completedSurfaces, requiredSurfaces),
}

const completedReviewEvidenceGaps = completedReviews
  .map((review) => ({
    id: review.id || '(missing id)',
    issues: completedReviewEvidenceIssues(review),
  }))
  .filter((review) => review.issues.length > 0)

const unresolvedBlockingFindings = completedReviews.flatMap((review) => (
  Array.isArray(review.findings)
    ? review.findings
      .filter(findingIsBlocking)
      .map((finding) => ({
        reviewId: review.id,
        severity: String(finding.severity || '').toUpperCase(),
        status: String(finding.status || '').toLowerCase(),
        surface: finding.surface || null,
        title: finding.title || null,
      }))
    : []
))

const unresolvedP2Findings = completedReviews.flatMap((review) => (
  Array.isArray(review.findings)
    ? review.findings
      .filter((finding) => String(finding.severity || '').toUpperCase() === 'P2' && String(finding.status || '').toLowerCase() !== 'closed')
      .map((finding) => ({
        reviewId: review.id,
        status: String(finding.status || '').toLowerCase(),
        surface: finding.surface || null,
        title: finding.title || null,
      }))
    : []
))

const scorecardAverages = Object.fromEntries(requiredScorecardFields.map((field) => [
  field,
  round(average(completedReviews.map((review) => review.scorecard?.[field]).filter(isRating))),
]))
const allScores = completedReviews.flatMap((review) => requiredScorecardFields.map((field) => review.scorecard?.[field]).filter(isRating))
const overallAverageScore = round(average(allScores))
const weakScoreFields = Object.entries(scorecardAverages)
  .filter(([, value]) => Number.isFinite(value) && value < minimumFieldAverageScore)
  .map(([field, value]) => ({ field, average: value }))
const scoreThresholdsMet = (
  completedReviews.length < publicLaunchMinimum ||
  (
    Number.isFinite(overallAverageScore) &&
    overallAverageScore >= minimumAverageScore &&
    weakScoreFields.length === 0
  )
)
const completedCoverageMet = Object.values(completedCoverageGaps).every((items) => items.length === 0)

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('beta human review progress register is owned and dated', (
  hasText(register.owner) &&
  hasText(register.reviewedAt) &&
  hasText(register.status)
), {
  owner: register.owner || null,
  reviewedAt: register.reviewedAt || null,
  status: register.status || null,
})

addCheck('beta human review progress tracks planned and completed review counts', (
  plannedReviews.length >= publicLaunchMinimum &&
  completedReviews.length <= plannedReviews.length
), {
  plannedReviewCount: plannedReviews.length,
  completedReviewCount: completedReviews.length,
  completionPercent: pct(completedReviews.length, publicLaunchMinimum),
  publicLaunchMinimum,
  targetCompletedReviews,
  remainingReviewsForMinimum,
})

addCheck('completed beta reviews include auditable evidence', completedReviewEvidenceGaps.length === 0, {
  completedReviewCount: completedReviews.length,
  completedReviewEvidenceGapCount: completedReviewEvidenceGaps.length,
  completedReviewEvidenceGaps,
})

addCheck('completed beta reviews have no unresolved P0/P1 findings', unresolvedBlockingFindings.length === 0, {
  unresolvedBlockingFindingCount: unresolvedBlockingFindings.length,
  unresolvedBlockingFindings,
})

addCheck('completed beta review scorecard telemetry is computable', (
  completedReviews.length === 0 ||
  (
    Number.isFinite(overallAverageScore) &&
    requiredScorecardFields.every((field) => Number.isFinite(scorecardAverages[field]))
  )
), {
  completedReviewCount: completedReviews.length,
  overallAverageScore,
  scorecardAverages,
})

addCheck('public-launch score thresholds will be enforced once the review sample is complete', scoreThresholdsMet, {
  publicLaunchMinimum,
  completedReviewCount: completedReviews.length,
  minimumAverageScore,
  minimumFieldAverageScore,
  overallAverageScore,
  weakScoreFields,
})

if (requirePublicProgress) {
  addCheck('public-launch beta review progress has enough completed reviews', completedReviews.length >= publicLaunchMinimum, {
    completedReviewCount: completedReviews.length,
    publicLaunchMinimum,
    remainingReviewsForMinimum,
  })

  addCheck('public-launch beta review progress covers required completed-review matrix', completedCoverageMet, {
    completedCoverageGaps,
  })
}

const publicLaunchReadiness = completedReviews.length >= publicLaunchMinimum &&
  completedReviewEvidenceGaps.length === 0 &&
  unresolvedBlockingFindings.length === 0 &&
  completedCoverageMet &&
  scoreThresholdsMet

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  registerPath: qaDisplayPath(registerPath),
  jsonArtifact: `qa/${jsonArtifact}`,
  reportArtifact: `qa/${reportArtifact}`,
  status: failures.length === 0 ? 'pass' : 'fail',
  requirePublicProgress,
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  plannedReviewCount: plannedReviews.length,
  completedReviewCount: completedReviews.length,
  publicLaunchMinimum,
  targetCompletedReviews,
  remainingReviewsForMinimum,
  completionPercent: pct(completedReviews.length, publicLaunchMinimum),
  completedCoverage: {
    audiences: completedAudiences,
    styles: completedStyles,
    regions: completedRegions,
    devices: completedDevices,
    surfaces: completedSurfaces,
    gaps: completedCoverageGaps,
  },
  completedReviewEvidenceGapCount: completedReviewEvidenceGaps.length,
  unresolvedBlockingFindingCount: unresolvedBlockingFindings.length,
  unresolvedP2FindingCount: unresolvedP2Findings.length,
  scorecardAverages,
  overallAverageScore,
  minimumAverageScore,
  minimumFieldAverageScore,
  weakScoreFields,
  publicLaunchReadiness: {
    status: publicLaunchReadiness ? 'ready' : 'blocked',
    blockers: [
      ...(completedReviews.length < publicLaunchMinimum ? [`${remainingReviewsForMinimum} more completed beta reviews required`] : []),
      ...(completedReviewEvidenceGaps.length > 0 ? [`${completedReviewEvidenceGaps.length} completed review evidence gap(s)`] : []),
      ...(unresolvedBlockingFindings.length > 0 ? [`${unresolvedBlockingFindings.length} unresolved P0/P1 finding(s)`] : []),
      ...(!completedCoverageMet ? ['completed-review matrix coverage is incomplete'] : []),
      ...(!scoreThresholdsMet ? ['completed-review score thresholds are below launch bar'] : []),
    ],
  },
  checks,
  failures,
}

const report = `# Beta Human Review Progress

Date: ${date}
Register: \`${summary.registerPath}\`
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Planned reviews: ${summary.plannedReviewCount}
- Completed reviews: ${summary.completedReviewCount}
- Public-launch minimum: ${summary.publicLaunchMinimum}
- Remaining for public-launch minimum: ${summary.remainingReviewsForMinimum}
- Target completed reviews: ${summary.targetCompletedReviews}
- Completion toward public-launch minimum: ${summary.completionPercent}%

## Launch Readiness

- Public-launch beta review status: ${summary.publicLaunchReadiness.status}
- Overall average score: ${summary.overallAverageScore ?? 'not available'}
- Minimum average score: ${summary.minimumAverageScore}
- Minimum field average score: ${summary.minimumFieldAverageScore}
- Unresolved P0/P1 findings: ${summary.unresolvedBlockingFindingCount}
- Unresolved P2 findings: ${summary.unresolvedP2FindingCount}

Blockers:
${markdownList(summary.publicLaunchReadiness.blockers)}

## Completed Review Coverage

- Audiences: ${completedAudiences.join(', ') || 'none'}
- Styles: ${completedStyles.join(', ') || 'none'}
- Regions: ${completedRegions.join(', ') || 'none'}
- Devices: ${completedDevices.join(', ') || 'none'}
- Surfaces: ${completedSurfaces.join(', ') || 'none'}

Coverage gaps:
${markdownList(Object.entries(completedCoverageGaps).flatMap(([group, values]) => values.map((value) => `${group}: ${value}`)))}

## Scorecard Averages

${requiredScorecardFields.map((field) => `- ${field}: ${scorecardAverages[field] ?? 'not available'}`).join('\n')}

Weak score fields:
${markdownList(weakScoreFields.map((field) => `${field.field}: ${field.average}`))}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Evidence Gaps

${markdownList(completedReviewEvidenceGaps.map((review) => `${review.id}: ${review.issues.join('; ')}`))}

## Unresolved P0/P1 Findings

${markdownList(unresolvedBlockingFindings.map((finding) => `${finding.reviewId}: ${finding.severity} ${finding.title || '(untitled)'}`))}

## Next Queue

${plannedReviews.filter((review) => !completedStatuses.has(review.status)).slice(0, 10).map((review) => `- ${review.id}: ${review.destination} (${review.audience}, ${review.style}, ${review.region}, ${review.device})`).join('\n') || '- none'}
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(root, 'qa', reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
