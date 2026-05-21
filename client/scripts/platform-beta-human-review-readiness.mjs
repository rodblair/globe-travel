import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const date = process.env.QA_BETA_REVIEW_DATE || new Date().toISOString().slice(0, 10)
const registerPath = process.env.QA_BETA_REVIEW_REGISTER || '../qa/beta-human-review-register.json'
const minCompletedReviews = Number(process.env.QA_BETA_REVIEW_MIN_COMPLETED || '0')
const thresholdSuffix = minCompletedReviews > 0 ? `-min-${minCompletedReviews}` : ''
const reportName = process.env.QA_BETA_REVIEW_REPORT || `beta-human-review-readiness-${date}${thresholdSuffix}.md`

const requiredAudiences = ['friend-group', 'couple', 'family', 'solo']
const requiredStyles = ['budget', 'premium', 'food', 'nightlife', 'outdoors', 'culture']
const requiredRegions = ['Africa', 'Asia', 'Europe', 'Latin America', 'North America', 'Oceania']
const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])
const blockingSeverities = new Set(['P0', 'P1'])
const requiredScorecardFields = [
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

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isReviewComplete(review) {
  return completedStatuses.has(review.status)
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

    if (!isNonEmptyString(review[field])) issues.push(field)
  }

  if (isNonEmptyString(review.routeOrShareUrl) && !isHttpUrl(review.routeOrShareUrl)) {
    issues.push('routeOrShareUrl must be http(s)')
  }

  if (isNonEmptyString(review.viewport) && !isViewport(review.viewport)) {
    issues.push('viewport must look like 390x844')
  }

  if (isNonEmptyString(review.completedAt) && !isDate(review.completedAt)) {
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
      !isNonEmptyString(finding.surface) ||
      !isNonEmptyString(finding.title) ||
      !isNonEmptyString(finding.notes)
    ))
    : []
  if (malformedFindings.length > 0) {
    issues.push(`${malformedFindings.length} malformed finding(s)`)
  }

  return issues
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function reviewLabel(review) {
  return `${review.id} (${review.destination}, ${review.audience}, ${review.style}, ${review.region}, ${review.device})`
}

const raw = await readFile(resolve(process.cwd(), registerPath), 'utf8')
const register = JSON.parse(raw)
const plannedReviews = Array.isArray(register.plannedReviews) ? register.plannedReviews : []
const completedReviews = plannedReviews.filter(isReviewComplete)
const unresolvedBlockingReviews = completedReviews.filter((review) => {
  const issues = Array.isArray(review.findings) ? review.findings : []
  return issues.some((issue) => (
    blockingSeverities.has(String(issue.severity || '').toUpperCase()) &&
    String(issue.status || '').toLowerCase() !== 'closed'
  ))
})
const completedReviewEvidenceGaps = completedReviews
  .map((review) => ({
    id: review.id || '(missing id)',
    issues: completedReviewEvidenceIssues(review),
  }))
  .filter((review) => review.issues.length > 0)

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

const audiences = unique(plannedReviews.map((review) => review.audience))
const styles = unique(plannedReviews.map((review) => review.style))
const regions = unique(plannedReviews.map((review) => review.region))
const devices = unique(plannedReviews.map((review) => review.device))
const primarySurfaces = unique(plannedReviews.flatMap((review) => review.primarySurfaces || []))

const missingAudiences = missingFrom(audiences, requiredAudiences)
const missingStyles = missingFrom(styles, requiredStyles)
const missingRegions = missingFrom(regions, requiredRegions)
const missingScorecardFields = missingFrom(register.scorecardFields || [], requiredScorecardFields)

const malformedReviews = plannedReviews.filter((review) => (
  !isNonEmptyString(review.id) ||
  !isNonEmptyString(review.sourceActualId) ||
  !isNonEmptyString(review.destination) ||
  !isNonEmptyString(review.prompt) ||
  !isNonEmptyString(review.audience) ||
  !isNonEmptyString(review.style) ||
  !isNonEmptyString(review.region) ||
  !isNonEmptyString(review.device) ||
  !Array.isArray(review.primarySurfaces) ||
  review.primarySurfaces.length === 0 ||
  !isNonEmptyString(review.status)
))

addCheck('beta human review register is owned and dated', (
  isNonEmptyString(register.owner) &&
  isNonEmptyString(register.reviewedAt) &&
  isNonEmptyString(register.status)
), {
  owner: register.owner || null,
  reviewedAt: register.reviewedAt || null,
  status: register.status || null,
})

addCheck('beta human review plan has at least 25 planned reviews', plannedReviews.length >= 25, {
  plannedReviewCount: plannedReviews.length,
  requiredMinimum: 25,
})

addCheck('beta human review plan covers required audiences', missingAudiences.length === 0, {
  audiences,
  requiredAudiences,
  missingAudiences,
})

addCheck('beta human review plan covers required trip styles', missingStyles.length === 0, {
  styles,
  requiredStyles,
  missingStyles,
})

addCheck('beta human review plan covers required regions', missingRegions.length === 0, {
  regions,
  requiredRegions,
  missingRegions,
})

addCheck('beta human review plan includes phone and desktop lenses', (
  devices.includes('phone') &&
  devices.includes('desktop')
), {
  devices,
})

addCheck('beta human review plan includes core journey surfaces', (
  ['planner', 'trip-studio', 'map', 'public-share', 'feedback', 'save-reopen'].every((surface) => primarySurfaces.includes(surface))
), {
  primarySurfaces,
})

addCheck('beta human review scorecard has required fields', missingScorecardFields.length === 0, {
  requiredScorecardFields,
  missingScorecardFields,
})

addCheck('every planned beta review has required metadata', malformedReviews.length === 0, {
  malformedReviews: malformedReviews.map((review) => review.id || '(missing id)'),
})

addCheck('completed beta reviews meet requested threshold', completedReviews.length >= minCompletedReviews, {
  completedReviewCount: completedReviews.length,
  requestedMinimum: minCompletedReviews,
})

addCheck('completed beta reviews include required reviewer evidence', completedReviewEvidenceGaps.length === 0, {
  completedReviewCount: completedReviews.length,
  requiredCompletedReviewFields,
  completedReviewEvidenceGaps,
})

addCheck('completed beta reviews have no unresolved P0/P1 findings', unresolvedBlockingReviews.length === 0, {
  unresolvedBlockingReviews: unresolvedBlockingReviews.map((review) => ({
    id: review.id,
    findings: (review.findings || []).filter((issue) => (
      blockingSeverities.has(String(issue.severity || '').toUpperCase()) &&
      String(issue.status || '').toLowerCase() !== 'closed'
    )),
  })),
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  registerPath,
  reportPath: `qa/${reportName}`,
  plannedReviewCount: plannedReviews.length,
  completedReviewCount: completedReviews.length,
  minCompletedReviews,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  checks,
  failures,
}

const report = `# Beta Human Review Readiness

Date: ${date}
Register: \`${registerPath.replace(/^\.\.\//, '')}\`
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Planned reviews: ${summary.plannedReviewCount}
- Completed reviews: ${summary.completedReviewCount}
- Requested completed-review threshold: ${summary.minCompletedReviews}

## Coverage

- Audiences: ${audiences.join(', ')}
- Styles: ${styles.join(', ')}
- Regions: ${regions.join(', ')}
- Devices: ${devices.join(', ')}
- Surfaces: ${primarySurfaces.join(', ')}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Planned Review Queue

${plannedReviews.map((review) => `- ${reviewLabel(review)} — ${review.status}`).join('\n')}

## Missing Or Blocking Detail

Missing audiences:
${markdownList(missingAudiences)}

Missing styles:
${markdownList(missingStyles)}

Missing regions:
${markdownList(missingRegions)}

Missing scorecard fields:
${markdownList(missingScorecardFields)}

Malformed reviews:
${markdownList(malformedReviews.map((review) => review.id || '(missing id)'))}

Completed review evidence gaps:
${markdownList(completedReviewEvidenceGaps.map((review) => `${review.id}: ${review.issues.join('; ')}`))}

Unresolved P0/P1 findings:
${markdownList(unresolvedBlockingReviews.map((review) => review.id))}

## Notes

- This gate does not pretend the invite beta has happened. With the default \`QA_BETA_REVIEW_MIN_COMPLETED=0\`, it proves the review plan, matrix, and scorecard are operationally ready.
- For public-launch approval, run with \`QA_BETA_REVIEW_MIN_COMPLETED=25\` or higher and keep unresolved P0/P1 findings at zero.
- Completed review records must include reviewer role, route or share URL, viewport, device, completed date, outcome notes, complete 1-5 scorecard ratings, and findings with severity, status, surface, title, and notes.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', reportName), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
