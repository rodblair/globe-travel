import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const clientDir = resolve(scriptDir, '..')
const repoRoot = resolve(clientDir, '..')
const requestedDate = process.env.QA_VISUAL_REVIEW_PROGRESS_DATE || ''
const requestedToday = process.env.QA_VISUAL_REVIEW_TODAY || ''
const registerPath = process.env.QA_VISUAL_REVIEW_REGISTER || 'qa/production-visual-review-register.json'
const requirePublicProgress = ['1', 'true', 'yes', 'public'].includes(String(process.env.QA_VISUAL_REVIEW_PROGRESS_REQUIRE_PUBLIC || '').toLowerCase())

const requiredRoutes = ['landing', 'login', 'signup', 'public-share']
const requiredViewports = ['phone', 'tablet', 'laptop', 'desktop', 'wide']
const requiredDiffRoutes = ['landing', 'login', 'signup']

function repoPath(path) {
  return resolve(repoRoot, path)
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
}

async function fileExists(path) {
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

function currentUtcDate() {
  return new Date().toISOString().slice(0, 10)
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim()) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

function currentReviewDate() {
  return isDate(requestedToday) ? requestedToday : currentUtcDate()
}

function daysBetween(startDate, endDate) {
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return Math.round((end - start) / 86400000)
}

function isFutureDate(value) {
  const date = dateOnly(value)
  return Boolean(date) && date > currentReviewDate()
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function missingFrom(values, required) {
  const set = new Set(Array.isArray(values) ? values : [])
  return required.filter((value) => !set.has(value))
}

function viewportIds(summary) {
  return Array.isArray(summary?.viewports)
    ? summary.viewports.map((viewport) => typeof viewport === 'string' ? viewport : viewport?.id).filter(Boolean)
    : []
}

function normalizeArtifactPath(value) {
  return String(value || '')
    .replace(/^\.\.\/qa\//, 'qa/')
    .replace(/^\.\.\//, '')
    .replace(/^\/Users\/rodneyblair\/Documents\/GitHub\/globe-travel\//, '')
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function normalizeDeploymentUrl(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
}

function publicReviewIssues(review, summary, options = {}) {
  const issues = []
  const reviewedAt = dateOnly(review.reviewedAt)

  if (!reviewedAt) issues.push('reviewedAt must be YYYY-MM-DD')
  else if (isFutureDate(reviewedAt)) issues.push('reviewedAt cannot be in the future')
  if (!hasText(review.artifact)) issues.push('artifact is missing')
  if (!hasText(review.summaryArtifact)) issues.push('summaryArtifact is missing')
  if (!hasText(review.productionCommit)) issues.push('productionCommit is missing')
  if (!hasText(review.deploymentUrl)) issues.push('deploymentUrl is missing')
  if (!hasText(review.reviewedBy)) issues.push('reviewedBy is missing')
  if (String(review.verdict || '').toLowerCase() !== 'pass') issues.push('verdict must be pass')
  if (!Array.isArray(review.blockingFindings) || review.blockingFindings.length > 0) issues.push('blockingFindings must be empty')
  if (Number(review.screenshotsReviewed) < 20) issues.push('screenshotsReviewed must be at least 20')
  if (!hasText(review.notes, options.legacy ? 20 : 40)) issues.push('notes must explain the review result')

  if (!summary) {
    issues.push('summaryArtifact is not readable')
    return issues
  }

  if (summary.checked !== 20 || summary.passed !== 20 || summary.failed !== 0) {
    issues.push('summaryArtifact must show production visual QA 20/20')
  }
  if (!Array.isArray(summary.results) || summary.results.length !== 20) {
    issues.push('summaryArtifact must contain 20 visual results')
  }
  if (missingFrom(summary.routes, requiredRoutes).length > 0) {
    issues.push(`summaryArtifact missing routes: ${missingFrom(summary.routes, requiredRoutes).join(', ')}`)
  }
  if (missingFrom(viewportIds(summary), requiredViewports).length > 0) {
    issues.push(`summaryArtifact missing viewports: ${missingFrom(viewportIds(summary), requiredViewports).join(', ')}`)
  }
  if (missingFrom(summary.diffRoutes, requiredDiffRoutes).length > 0) {
    issues.push(`summaryArtifact missing diff routes: ${missingFrom(summary.diffRoutes, requiredDiffRoutes).join(', ')}`)
  }

  const badResults = Array.isArray(summary.results)
    ? summary.results.filter((result) => {
      const metrics = result.metrics || {}
      return result.ok === false ||
        metrics.horizontalOverflow === true ||
        (Array.isArray(metrics.appErrors) && metrics.appErrors.length > 0) ||
        (Array.isArray(metrics.clippedText) && metrics.clippedText.length > 0) ||
        (Array.isArray(metrics.overlappingAppTargets) && metrics.overlappingAppTargets.length > 0) ||
        result.comparison?.ok === false
    })
    : []
  if (badResults.length > 0) issues.push(`${badResults.length} blocking visual result(s) in summaryArtifact`)

  const deployment = summary.deployment && typeof summary.deployment === 'object' ? summary.deployment : null
  if (deployment?.commit && deployment.commit !== review.productionCommit) {
    issues.push('summaryArtifact deployment commit must match productionCommit')
  }
  if (deployment?.url && normalizeDeploymentUrl(deployment.url) !== normalizeDeploymentUrl(review.deploymentUrl)) {
    issues.push('summaryArtifact deployment url must match deploymentUrl')
  }

  return issues
}

async function reviewSummary(review) {
  if (!hasText(review.summaryArtifact)) return null
  try {
    return await readJson(normalizeArtifactPath(review.summaryArtifact))
  } catch {
    return null
  }
}

async function missingScreenshots(summary) {
  if (!Array.isArray(summary?.results)) return []
  const paths = summary.results
    .map((result) => normalizeArtifactPath(result.screenshot?.relativePath || result.screenshot?.path))
    .filter(Boolean)
  const missing = []
  for (const path of paths) {
    if (!(await fileExists(path))) missing.push(path)
  }
  return missing
}

const register = await readJson(normalizeArtifactPath(registerPath))
const latestProductionReview = register.latestProductionReview || {}
const latestSummary = await reviewSummary(latestProductionReview)
const reviewHistory = Array.isArray(register.reviewHistory) ? register.reviewHistory : []
const scheduledReviews = Array.isArray(register.scheduledPublicLaunchReviews) ? register.scheduledPublicLaunchReviews : []
const minimumPublicLaunchReviewHistory = Number(register.minimumPublicLaunchReviewHistory) || 4
const date = dateOnly(requestedDate) ||
  dateOnly(register.reviewedAt) ||
  dateOnly(latestSummary?.date) ||
  currentUtcDate()
const jsonArtifact = process.env.QA_VISUAL_REVIEW_PROGRESS_JSON || `production-visual-review-progress-${date}.json`
const reportArtifact = process.env.QA_VISUAL_REVIEW_PROGRESS_REPORT || `production-visual-review-progress-${date}.md`
const historyDates = unique(reviewHistory.map((review) => dateOnly(review.reviewedAt)))
const remainingRequiredReviewDates = Math.max(0, minimumPublicLaunchReviewHistory - historyDates.length)
const today = currentReviewDate()
const latestIssues = publicReviewIssues(latestProductionReview, latestSummary)
const latestMissingScreenshots = await missingScreenshots(latestSummary)
if (latestMissingScreenshots.length > 0) {
  latestIssues.push(`${latestMissingScreenshots.length} latest production screenshot artifact(s) missing`)
}

const historyResults = []
for (const review of reviewHistory) {
  const summary = await reviewSummary(review)
  const issues = publicReviewIssues(review, summary, { legacy: true })
  const missing = await missingScreenshots(summary)
  if (missing.length > 0) issues.push(`${missing.length} screenshot artifact(s) missing`)
  historyResults.push({
    reviewedAt: dateOnly(review.reviewedAt),
    artifact: normalizeArtifactPath(review.artifact),
    summaryArtifact: normalizeArtifactPath(review.summaryArtifact),
    productionCommit: review.productionCommit || null,
    deploymentUrl: review.deploymentUrl || null,
    ok: issues.length === 0,
    issues,
  })
}

const duplicateHistoryDates = historyDates.filter((dateValue) => (
  reviewHistory.filter((review) => dateOnly(review.reviewedAt) === dateValue).length > 1
))
const invalidHistoryReviews = historyResults.filter((result) => !result.ok)
const scheduledDates = unique(scheduledReviews.map((review) => dateOnly(review.dueAt)))
const nextScheduledReview = scheduledReviews.find((review) => dateOnly(review.dueAt) === dateOnly(register.nextReviewDueAt)) || scheduledReviews[0] || null
const scheduledReviewStatus = scheduledReviews.map((review) => {
  const dueAt = dateOnly(review.dueAt)
  const daysUntilDue = daysBetween(today, dueAt)
  const completed = historyDates.includes(dueAt)
  return {
    id: review.id || null,
    dueAt,
    daysUntilDue,
    completed,
    status: completed
      ? 'complete'
      : daysUntilDue != null && daysUntilDue < 0
        ? 'overdue'
        : 'planned',
  }
})
const overdueScheduledReviews = scheduledReviewStatus.filter((review) => review.status === 'overdue')
const dueSoonScheduledReviews = scheduledReviewStatus.filter((review) => (
  review.status === 'planned' &&
  Number.isFinite(review.daysUntilDue) &&
  review.daysUntilDue >= 0 &&
  review.daysUntilDue <= 7
))
const scheduledCoverageReady = scheduledReviews.length >= remainingRequiredReviewDates &&
  scheduledDates.length >= remainingRequiredReviewDates
const publicLaunchReadiness = historyDates.length >= minimumPublicLaunchReviewHistory &&
  invalidHistoryReviews.length === 0 &&
  duplicateHistoryDates.length === 0

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('production visual review progress register is owned and dated', (
  hasText(register.owner) &&
  hasText(register.reviewedAt) &&
  hasText(register.cadence, 20) &&
  hasText(register.reviewProtocol, 80)
), {
  owner: register.owner || null,
  reviewedAt: register.reviewedAt || null,
  cadence: register.cadence || null,
})

addCheck('latest production visual review is complete and evidence-backed', latestIssues.length === 0, {
  artifact: normalizeArtifactPath(latestProductionReview.artifact),
  summaryArtifact: normalizeArtifactPath(latestProductionReview.summaryArtifact),
  productionCommit: latestProductionReview.productionCommit || null,
  deploymentUrl: latestProductionReview.deploymentUrl || null,
  issues: latestIssues,
})

addCheck('completed production visual-review history is valid and distinct', (
  invalidHistoryReviews.length === 0 &&
  duplicateHistoryDates.length === 0
), {
  historyCount: reviewHistory.length,
  distinctHistoryDateCount: historyDates.length,
  invalidHistoryReviewCount: invalidHistoryReviews.length,
  duplicateHistoryDates,
  invalidHistoryReviews,
})

addCheck('scheduled production visual-review queue covers remaining launch dates', scheduledCoverageReady, {
  scheduledReviewCount: scheduledReviews.length,
  distinctScheduledDateCount: scheduledDates.length,
  remainingRequiredReviewDates,
  nextReviewDueAt: register.nextReviewDueAt || null,
})

addCheck('scheduled production visual-review queue has no overdue review dates', overdueScheduledReviews.length === 0, {
  today,
  overdueScheduledReviewCount: overdueScheduledReviews.length,
  overdueScheduledReviews,
})

addCheck('latest production review does not inflate dated public-launch history', (
  !dateOnly(latestProductionReview.reviewedAt) ||
  historyDates.includes(dateOnly(latestProductionReview.reviewedAt)) ||
  latestProductionReview.artifact !== reviewHistory.at(-1)?.artifact
), {
  latestReviewDate: dateOnly(latestProductionReview.reviewedAt),
  historyDates,
})

if (requirePublicProgress) {
  addCheck('public-launch production visual-review history is mature', publicLaunchReadiness, {
    distinctHistoryDateCount: historyDates.length,
    minimumPublicLaunchReviewHistory,
    remainingRequiredReviewDates,
  })
}

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  today,
  registerPath: normalizeArtifactPath(registerPath),
  jsonArtifact: `qa/${jsonArtifact}`,
  reportArtifact: `qa/${reportArtifact}`,
  status: failures.length === 0 ? 'pass' : 'fail',
  requirePublicProgress,
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  latestProductionReview: {
    artifact: normalizeArtifactPath(latestProductionReview.artifact),
    summaryArtifact: normalizeArtifactPath(latestProductionReview.summaryArtifact),
    productionCommit: latestProductionReview.productionCommit || null,
    deploymentUrl: latestProductionReview.deploymentUrl || null,
    reviewedBy: latestProductionReview.reviewedBy || null,
    verdict: latestProductionReview.verdict || null,
    issueCount: latestIssues.length,
    issues: latestIssues,
  },
  reviewHistoryCount: reviewHistory.length,
  distinctHistoryDateCount: historyDates.length,
  historyDates,
  minimumPublicLaunchReviewHistory,
  remainingRequiredReviewDates,
  scheduledReviewCount: scheduledReviews.length,
  distinctScheduledDateCount: scheduledDates.length,
  scheduledDates,
  scheduledReviewStatus,
  dueSoonScheduledReviewCount: dueSoonScheduledReviews.length,
  dueSoonScheduledReviews,
  overdueScheduledReviewCount: overdueScheduledReviews.length,
  overdueScheduledReviews,
  nextReviewDueAt: register.nextReviewDueAt || null,
  nextScheduledReview,
  invalidHistoryReviewCount: invalidHistoryReviews.length,
  duplicateHistoryDates,
  publicLaunchReadiness: {
    status: publicLaunchReadiness ? 'ready' : 'blocked',
    blockers: [
      ...(historyDates.length < minimumPublicLaunchReviewHistory ? [`${remainingRequiredReviewDates} more distinct passing production visual-review date(s) required`] : []),
      ...(invalidHistoryReviews.length > 0 ? [`${invalidHistoryReviews.length} invalid visual-review history entr${invalidHistoryReviews.length === 1 ? 'y' : 'ies'}`] : []),
      ...(duplicateHistoryDates.length > 0 ? [`duplicate visual-review dates: ${duplicateHistoryDates.join(', ')}`] : []),
    ],
  },
  checks,
  failures,
}

const report = `# Production Visual Review Progress

Date: ${date}
Today: ${summary.today}
Register: \`${summary.registerPath}\`
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Latest production artifact: \`${summary.latestProductionReview.artifact || 'missing'}\`
- Latest production review issues: ${summary.latestProductionReview.issueCount}
- Completed history dates: ${summary.distinctHistoryDateCount}/${summary.minimumPublicLaunchReviewHistory}
- Remaining required review dates: ${summary.remainingRequiredReviewDates}
- Scheduled review dates: ${summary.distinctScheduledDateCount}
- Due-soon scheduled reviews: ${summary.dueSoonScheduledReviewCount}
- Overdue scheduled reviews: ${summary.overdueScheduledReviewCount}
- Next review due: ${summary.nextReviewDueAt || 'missing'}

## Launch Readiness

- Public-launch visual review status: ${summary.publicLaunchReadiness.status}
- Require public-progress mode: ${summary.requirePublicProgress ? 'yes' : 'no'}

Blockers:
${markdownList(summary.publicLaunchReadiness.blockers)}

## Latest Production Review

- Summary: \`${summary.latestProductionReview.summaryArtifact || 'missing'}\`
- Production commit: ${summary.latestProductionReview.productionCommit || 'missing'}
- Deployment: ${summary.latestProductionReview.deploymentUrl || 'missing'}
- Verdict: ${summary.latestProductionReview.verdict || 'missing'}

Issues:
${markdownList(summary.latestProductionReview.issues)}

## History

${historyResults.map((review) => `- ${review.reviewedAt || 'missing date'}: ${review.ok ? 'pass' : 'needs attention'} - \`${review.artifact || 'missing artifact'}\``).join('\n') || '- none'}

## Scheduled Queue

${scheduledReviews.map((review) => {
  const status = scheduledReviewStatus.find((item) => item.id === review.id)
  return `- ${review.id}: ${dateOnly(review.dueAt)} (${status?.status || 'planned'}, ${status?.daysUntilDue ?? 'n/a'} day(s)) - \`${review.expectedArtifactPrefix}\``
}).join('\n') || '- none'}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}
`

await mkdir(repoPath('qa'), { recursive: true })
await writeFile(repoPath(`qa/${jsonArtifact}`), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(`qa/${reportArtifact}`), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
