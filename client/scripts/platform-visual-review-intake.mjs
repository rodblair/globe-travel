import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_VISUAL_REVIEW_INTAKE_DATE || ''
const registerPath = process.env.QA_VISUAL_REVIEW_REGISTER || '../qa/production-visual-review-register.json'
const importValidSubmissions = ['1', 'true', 'yes'].includes(String(process.env.QA_VISUAL_REVIEW_IMPORT || '').toLowerCase())

const requiredRoutes = ['landing', 'pricing', 'login', 'signup', 'public-share']
const requiredViewports = ['phone', 'tablet', 'laptop', 'desktop', 'wide']
const requiredDiffRoutes = ['landing', 'login', 'signup']
const expectedScreenshotCount = requiredRoutes.length * requiredViewports.length

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim()) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

function currentCalendarDate() {
  return currentQaDate()
}

function isFutureDate(value) {
  return isDate(value) && String(value).trim() > currentCalendarDate()
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

function normalizeDeploymentUrl(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '')
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(root, path), 'utf8'))
}

async function fileExists(path) {
  try {
    await readFile(resolve(root, path))
    return true
  } catch {
    return false
  }
}

function normalizeReview(submission) {
  return {
    reviewedAt: dateOnly(submission.reviewedAt),
    artifact: String(submission.artifact || '').trim(),
    summaryArtifact: String(submission.summaryArtifact || '').trim(),
    productionCommit: String(submission.productionCommit || '').trim(),
    deploymentUrl: String(submission.deploymentUrl || '').trim(),
    reviewedBy: String(submission.reviewedBy || '').trim(),
    verdict: String(submission.verdict || '').toLowerCase(),
    blockingFindings: Array.isArray(submission.blockingFindings) ? submission.blockingFindings : [],
    screenshotsReviewed: Number(submission.screenshotsReviewed),
    routesReviewed: Array.isArray(submission.routesReviewed) ? submission.routesReviewed : [],
    viewportsReviewed: Array.isArray(submission.viewportsReviewed) ? submission.viewportsReviewed : [],
    diffRoutesReviewed: Array.isArray(submission.diffRoutesReviewed) ? submission.diffRoutesReviewed : [],
    notes: String(submission.notes || '').trim(),
  }
}

async function submissionIssues(submission, scheduledReview, existingHistoryDates) {
  const issues = []
  const review = normalizeReview(submission)

  if (!hasText(submission.scheduledReviewId)) issues.push('scheduledReviewId')
  if (!scheduledReview) issues.push('scheduledReviewId does not match a scheduled review')
  if (!isDate(review.reviewedAt)) issues.push('reviewedAt must be YYYY-MM-DD')
  else if (isFutureDate(review.reviewedAt)) issues.push('reviewedAt cannot be in the future')
  if (!hasText(review.artifact)) issues.push('artifact')
  if (!hasText(review.summaryArtifact)) issues.push('summaryArtifact')
  if (!hasText(review.productionCommit)) issues.push('productionCommit')
  if (!hasText(review.deploymentUrl)) issues.push('deploymentUrl')
  if (!hasText(review.reviewedBy)) issues.push('reviewedBy')
  if (review.verdict !== 'pass') issues.push('verdict must be pass')
  if (!Array.isArray(review.blockingFindings) || review.blockingFindings.length > 0) issues.push('blockingFindings must be an empty array')
  if (!Number.isFinite(review.screenshotsReviewed) || review.screenshotsReviewed < expectedScreenshotCount) {
    issues.push(`screenshotsReviewed must be at least ${expectedScreenshotCount}`)
  }
  if (!hasText(review.notes, 40)) issues.push('notes must explain the review result')

  if (scheduledReview) {
    if (review.reviewedAt !== dateOnly(scheduledReview.dueAt)) {
      issues.push(`reviewedAt must match scheduled dueAt ${dateOnly(scheduledReview.dueAt)}`)
    }
    if (hasText(scheduledReview.expectedArtifactPrefix) && !review.artifact.startsWith(scheduledReview.expectedArtifactPrefix)) {
      issues.push('artifact must start with the scheduled expectedArtifactPrefix')
    }
  }

  if (existingHistoryDates.has(review.reviewedAt)) {
    issues.push('reviewedAt already exists in reviewHistory')
  }

  const missingRoutes = missingFrom(review.routesReviewed, requiredRoutes)
  const missingViewports = missingFrom(review.viewportsReviewed, requiredViewports)
  const missingDiffRoutes = missingFrom(review.diffRoutesReviewed, requiredDiffRoutes)
  if (missingRoutes.length > 0) issues.push(`missing routesReviewed: ${missingRoutes.join(', ')}`)
  if (missingViewports.length > 0) issues.push(`missing viewportsReviewed: ${missingViewports.join(', ')}`)
  if (missingDiffRoutes.length > 0) issues.push(`missing diffRoutesReviewed: ${missingDiffRoutes.join(', ')}`)

  let summary = null
  try {
    summary = await readJson(review.summaryArtifact)
  } catch (error) {
    issues.push(`summaryArtifact is not readable: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (summary) {
    const summaryDeployment = summary.deployment && typeof summary.deployment === 'object' ? summary.deployment : null
    const summaryDeploymentUrl = normalizeDeploymentUrl(summaryDeployment?.url)
    const reviewDeploymentUrl = normalizeDeploymentUrl(review.deploymentUrl)
    const summaryMissingRoutes = missingFrom(summary.routes || [], requiredRoutes)
    const summaryMissingDiffRoutes = missingFrom(summary.diffRoutes || [], requiredDiffRoutes)
    if (summary.checked !== expectedScreenshotCount || summary.passed !== expectedScreenshotCount || summary.failed !== 0) {
      issues.push(`summaryArtifact must show production visual QA ${expectedScreenshotCount}/${expectedScreenshotCount}`)
    }
    if (!Array.isArray(summary.results) || summary.results.length !== expectedScreenshotCount) {
      issues.push(`summaryArtifact must contain ${expectedScreenshotCount} visual results`)
    }
    if (!Array.isArray(summary.viewports) || summary.viewports.length !== 5) {
      issues.push('summaryArtifact must contain five viewports')
    }
    if (summaryMissingRoutes.length > 0) issues.push(`summaryArtifact missing routes: ${summaryMissingRoutes.join(', ')}`)
    if (summaryMissingDiffRoutes.length > 0) issues.push(`summaryArtifact missing diff routes: ${summaryMissingDiffRoutes.join(', ')}`)
    if (!summaryDeployment?.commit || !summaryDeploymentUrl) {
      issues.push('summaryArtifact must include production deployment metadata')
    }
    if (summaryDeployment?.commit && summaryDeployment.commit !== review.productionCommit) {
      issues.push('summaryArtifact deployment commit must match productionCommit')
    }
    if (summaryDeploymentUrl && reviewDeploymentUrl && summaryDeploymentUrl !== reviewDeploymentUrl) {
      issues.push('summaryArtifact deployment url must match deploymentUrl')
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
    if (badResults.length > 0) issues.push(`${badResults.length} visual blocker result(s) in summaryArtifact`)

    const screenshotPaths = Array.isArray(summary.results)
      ? summary.results.map((result) => result.screenshot?.relativePath || result.screenshot?.path).filter(Boolean)
      : []
    const missingScreenshots = []
    for (const screenshotPath of screenshotPaths) {
      if (!(await fileExists(screenshotPath))) missingScreenshots.push(screenshotPath)
    }
    if (screenshotPaths.length !== expectedScreenshotCount) issues.push(`summaryArtifact must reference ${expectedScreenshotCount} screenshots`)
    if (missingScreenshots.length > 0) issues.push(`${missingScreenshots.length} screenshot artifact(s) missing`)
  }

  return issues
}

async function readSubmissions() {
  let entries
  try {
    entries = await readdir(resolve(process.cwd(), submissionDir), { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT') return { missingDirectory: true, submissions: [] }
    throw error
  }

  const jsonFiles = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.json') && !name.endsWith('.template.json'))
    .sort()

  const submissions = []
  for (const file of jsonFiles) {
    const path = resolve(process.cwd(), submissionDir, file)
    try {
      submissions.push({
        file,
        submission: JSON.parse(await readFile(path, 'utf8')),
        parseError: null,
      })
    } catch (error) {
      submissions.push({
        file,
        submission: null,
        parseError: error instanceof Error ? error.message : String(error),
      })
    }
  }
  return { missingDirectory: false, submissions }
}

const rawRegister = await readFile(resolve(process.cwd(), registerPath), 'utf8')
const register = JSON.parse(rawRegister)
const date = dateOnly(requestedDate) || dateOnly(register.reviewedAt) || currentCalendarDate()
const submissionDir = process.env.QA_VISUAL_REVIEW_SUBMISSION_DIR || `../qa/production-visual-review-submissions-${date}`
const jsonArtifact = process.env.QA_VISUAL_REVIEW_INTAKE_JSON || `production-visual-review-intake-${date}.json`
const reportArtifact = process.env.QA_VISUAL_REVIEW_INTAKE_REPORT || `production-visual-review-intake-${date}.md`
const scheduledReviews = Array.isArray(register.scheduledPublicLaunchReviews) ? register.scheduledPublicLaunchReviews : []
const scheduledById = new Map(scheduledReviews.map((review) => [review.id, review]))
const reviewHistory = Array.isArray(register.reviewHistory) ? register.reviewHistory : []
const existingHistoryDates = new Set(reviewHistory.map((review) => dateOnly(review.reviewedAt)).filter(Boolean))
const { missingDirectory, submissions } = await readSubmissions()

const seenScheduledIds = new Map()
const seenReviewDates = new Map()
const duplicateScheduledIds = []
const duplicateReviewDates = []
for (const record of submissions) {
  if (!record.submission) continue
  const scheduledReviewId = record.submission.scheduledReviewId
  const reviewedAt = dateOnly(record.submission.reviewedAt)
  if (hasText(scheduledReviewId)) {
    if (seenScheduledIds.has(scheduledReviewId)) duplicateScheduledIds.push({ scheduledReviewId, files: [seenScheduledIds.get(scheduledReviewId), record.file] })
    else seenScheduledIds.set(scheduledReviewId, record.file)
  }
  if (hasText(reviewedAt)) {
    if (seenReviewDates.has(reviewedAt)) duplicateReviewDates.push({ reviewedAt, files: [seenReviewDates.get(reviewedAt), record.file] })
    else seenReviewDates.set(reviewedAt, record.file)
  }
}

const validationResults = []
for (const record of submissions) {
  const scheduledReview = record.submission ? scheduledById.get(record.submission.scheduledReviewId) : null
  const issues = record.parseError
    ? [`invalid JSON: ${record.parseError}`]
    : await submissionIssues(record.submission, scheduledReview, existingHistoryDates)
  validationResults.push({
    file: record.file,
    scheduledReviewId: record.submission?.scheduledReviewId || null,
    reviewedAt: dateOnly(record.submission?.reviewedAt),
    ok: issues.length === 0,
    issues,
  })
}

const invalidSubmissions = validationResults.filter((result) => !result.ok)
const validRecords = submissions.filter((record) => validationResults.find((result) => result.file === record.file)?.ok === true)
let imported = false
let importedReviewDates = []
let reviewHistoryCountAfter = reviewHistory.length

if (importValidSubmissions && validRecords.length > 0 && invalidSubmissions.length === 0 && duplicateScheduledIds.length === 0 && duplicateReviewDates.length === 0) {
  const importedReviews = validRecords.map((record) => {
    const review = normalizeReview(record.submission)
    importedReviewDates.push(review.reviewedAt)
    return {
      ...review,
      reviewSubmissionFile: `${qaDisplayPath(submissionDir)}/${basename(record.file)}`,
    }
  })
  const importedScheduledIds = new Set(validRecords.map((record) => record.submission.scheduledReviewId))
  const remainingScheduledReviews = scheduledReviews.filter((review) => !importedScheduledIds.has(review.id))
  const nextRegister = {
    ...register,
    reviewedAt: date,
    latestProductionReview: importedReviews.at(-1) || register.latestProductionReview,
    reviewHistory: [...reviewHistory, ...importedReviews],
    scheduledPublicLaunchReviews: remainingScheduledReviews,
    nextReviewDueAt: remainingScheduledReviews[0]?.dueAt || null,
  }
  await writeFile(resolve(process.cwd(), registerPath), `${JSON.stringify(nextRegister, null, 2)}\n`)
  imported = true
  reviewHistoryCountAfter = nextRegister.reviewHistory.length
}

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('production visual review submission directory is present', !missingDirectory, {
  submissionDir: qaDisplayPath(submissionDir),
})
addCheck('production visual review submissions parse and match scheduled reviews', invalidSubmissions.length === 0, {
  submissionCount: submissions.length,
  invalidSubmissionCount: invalidSubmissions.length,
  invalidSubmissions,
})
addCheck('production visual review submissions do not duplicate scheduled ids or dates', duplicateScheduledIds.length === 0 && duplicateReviewDates.length === 0, {
  duplicateScheduledIdCount: duplicateScheduledIds.length,
  duplicateReviewDateCount: duplicateReviewDates.length,
  duplicateScheduledIds,
  duplicateReviewDates,
})
addCheck('production visual review intake import is explicit', !imported || importValidSubmissions, {
  importRequested: importValidSubmissions,
  imported,
  importedReviewDates,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  registerPath: qaDisplayPath(registerPath),
  submissionDir: qaDisplayPath(submissionDir),
  jsonArtifact: `qa/${jsonArtifact}`,
  reportArtifact: `qa/${reportArtifact}`,
  status: failures.length === 0 ? 'pass' : 'fail',
  imported,
  importRequested: importValidSubmissions,
  scheduledReviewCount: scheduledReviews.length,
  reviewHistoryCountBefore: reviewHistory.length,
  reviewHistoryCountAfter,
  submissionCount: submissions.length,
  validSubmissionCount: validationResults.filter((result) => result.ok).length,
  invalidSubmissionCount: invalidSubmissions.length,
  duplicateScheduledIdCount: duplicateScheduledIds.length,
  duplicateReviewDateCount: duplicateReviewDates.length,
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  submissions: validationResults,
  checks,
  failures,
}

const report = `# Production Visual Review Intake

Date: ${date}
Register: \`${summary.registerPath}\`
Submission directory: \`${summary.submissionDir}\`
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Scheduled reviews: ${summary.scheduledReviewCount}
- Review history before intake: ${summary.reviewHistoryCountBefore}
- Review history after intake: ${summary.reviewHistoryCountAfter}
- Submission files: ${summary.submissionCount}
- Valid submissions: ${summary.validSubmissionCount}
- Invalid submissions: ${summary.invalidSubmissionCount}
- Duplicate scheduled ids: ${summary.duplicateScheduledIdCount}
- Duplicate review dates: ${summary.duplicateReviewDateCount}
- Import requested: ${summary.importRequested}
- Imported: ${summary.imported}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Invalid Submission Detail

${markdownList(invalidSubmissions.map((result) => `${result.file}: ${result.issues.join('; ')}`))}

## Duplicate Detail

${markdownList([
  ...duplicateScheduledIds.map((item) => `${item.scheduledReviewId}: ${item.files.join(', ')}`),
  ...duplicateReviewDates.map((item) => `${item.reviewedAt}: ${item.files.join(', ')}`),
])}

## How To Use

- Run the scheduled production release command first so the visual artifact and screenshots exist.
- Add completed visual review JSON files to \`${summary.submissionDir}\`.
- Run \`npm run qa:visual-review-intake\` to validate submissions without changing the register.
- Run \`QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake\` only after the intake report is clean and the review is ready to count.
- Re-run \`npm run qa:visual-review-schedule\`, \`npm run qa:launch-refresh\`, and \`npm run qa:launch-signoff\` after import.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(root, 'qa', reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
