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

Unresolved P0/P1 findings:
${markdownList(unresolvedBlockingReviews.map((review) => review.id))}

## Notes

- This gate does not pretend the invite beta has happened. With the default \`QA_BETA_REVIEW_MIN_COMPLETED=0\`, it proves the review plan, matrix, and scorecard are operationally ready.
- For public-launch approval, run with \`QA_BETA_REVIEW_MIN_COMPLETED=25\` or higher and keep unresolved P0/P1 findings at zero.
- Review records should include the route, viewport, reviewer role, prompt, scorecard ratings, and any findings with severity and status.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', reportName), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
