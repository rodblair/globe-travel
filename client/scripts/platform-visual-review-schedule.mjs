import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const date = process.env.QA_VISUAL_REVIEW_SCHEDULE_DATE || new Date().toISOString().slice(0, 10)
const registerPath = process.env.QA_VISUAL_REVIEW_REGISTER || '../qa/production-visual-review-register.json'
const reportName = process.env.QA_VISUAL_REVIEW_SCHEDULE_REPORT || `production-visual-review-schedule-${date}.md`

const requiredRoutes = ['landing', 'login', 'signup', 'public-share']
const requiredViewports = ['phone', 'tablet', 'laptop', 'desktop', 'wide']
const requiredDiffRoutes = ['landing', 'login', 'signup']

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim()) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function missingFrom(values, required) {
  const set = new Set(values)
  return required.filter((value) => !set.has(value))
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

const raw = await readFile(resolve(process.cwd(), registerPath), 'utf8')
const register = JSON.parse(raw)
const reviewHistory = Array.isArray(register.reviewHistory) ? register.reviewHistory : []
const scheduledReviews = Array.isArray(register.scheduledPublicLaunchReviews) ? register.scheduledPublicLaunchReviews : []
const minimumPublicLaunchReviewHistory = Number(register.minimumPublicLaunchReviewHistory) || 4
const completedHistoryDates = unique(reviewHistory.map((review) => dateOnly(review.reviewedAt)).filter(Boolean))
const remainingRequiredReviewDates = Math.max(0, minimumPublicLaunchReviewHistory - completedHistoryDates.length)
const scheduledDates = unique(scheduledReviews.map((review) => dateOnly(review.dueAt)).filter(Boolean))
const today = new Date()
const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

const malformedScheduledReviews = scheduledReviews.filter((review) => {
  const missingRoutes = missingFrom(review.routes || [], requiredRoutes)
  const missingViewports = missingFrom(review.viewports || [], requiredViewports)
  const missingDiffRoutes = missingFrom(review.diffRoutes || [], requiredDiffRoutes)
  const dueAt = dateOnly(review.dueAt)
  const dueTime = dueAt ? Date.parse(`${dueAt}T00:00:00Z`) : Number.NaN

  return !hasText(review.id) ||
    !isDate(dueAt) ||
    !Number.isFinite(dueTime) ||
    dueTime < todayUtc ||
    !hasText(review.owner) ||
    !hasText(review.reviewerRole) ||
    !hasText(review.status) ||
    !['planned', 'scheduled'].includes(String(review.status).toLowerCase()) ||
    !hasText(review.command) ||
    !review.command.includes('npm run qa:release-production') ||
    !review.command.includes('QA_PRODUCTION_VISUAL_ARTIFACT_NAME') ||
    !hasText(review.expectedArtifactPrefix) ||
    !review.expectedArtifactPrefix.includes('qa/visual-baseline-production-') ||
    missingRoutes.length > 0 ||
    missingViewports.length > 0 ||
    missingDiffRoutes.length > 0 ||
    !hasText(review.acceptanceCriteria, 80)
})

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('production visual review schedule has enough planned public-launch reviews', (
  scheduledReviews.length >= remainingRequiredReviewDates &&
  scheduledDates.length >= remainingRequiredReviewDates
), {
  completedHistoryDateCount: completedHistoryDates.length,
  minimumPublicLaunchReviewHistory,
  remainingRequiredReviewDates,
  scheduledReviewCount: scheduledReviews.length,
  distinctScheduledDateCount: scheduledDates.length,
})

addCheck('production visual review schedule entries are actionable', malformedScheduledReviews.length === 0, {
  malformedScheduledReviews: malformedScheduledReviews.map((review) => ({
    id: review.id || null,
    dueAt: review.dueAt || null,
    status: review.status || null,
    command: review.command || null,
  })),
})

addCheck('production visual review schedule keeps the next review due date aligned', (
  scheduledDates.length > 0 &&
  dateOnly(register.nextReviewDueAt) === scheduledDates[0]
), {
  nextReviewDueAt: register.nextReviewDueAt || null,
  firstScheduledReviewDueAt: scheduledDates[0] || null,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  registerPath: qaDisplayPath(registerPath),
  reportPath: `qa/${reportName}`,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  completedHistoryDateCount: completedHistoryDates.length,
  minimumPublicLaunchReviewHistory,
  remainingRequiredReviewDates,
  scheduledReviewCount: scheduledReviews.length,
  checks,
  failures,
}

const report = `# Production Visual Review Schedule

Date: ${date}
Register: \`${summary.registerPath}\`
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Completed visual-review history dates: ${summary.completedHistoryDateCount}
- Required public-launch history dates: ${summary.minimumPublicLaunchReviewHistory}
- Remaining required review dates: ${summary.remainingRequiredReviewDates}
- Scheduled review entries: ${summary.scheduledReviewCount}

## Scheduled Reviews

${scheduledReviews.map((review) => `- ${review.id}: ${review.dueAt} — ${review.status} — ${review.owner}`).join('\n')}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Blocking Detail

Malformed scheduled reviews:
${markdownList(malformedScheduledReviews.map((review) => review.id || '(missing id)'))}

## Notes

- This schedule does not count as completed visual-review history.
- Public launch still requires ${minimumPublicLaunchReviewHistory} distinct dated passing visual-review history entries with no blocking findings.
- Each scheduled entry must run production visual QA, review 20 screenshots, and then be recorded in \`qa/production-visual-review-register.json\` only after the review is actually complete.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', reportName), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
