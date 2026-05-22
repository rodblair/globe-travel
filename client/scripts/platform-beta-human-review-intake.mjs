import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_BETA_REVIEW_INTAKE_DATE || ''
const registerPath = process.env.QA_BETA_REVIEW_REGISTER || '../qa/beta-human-review-register.json'
const importValidSubmissions = ['1', 'true', 'yes'].includes(String(process.env.QA_BETA_REVIEW_IMPORT || '').toLowerCase())

const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])
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
const requiredSubmissionFields = [
  'id',
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
const reviewDeviceViewports = {
  phone: '390x844',
  desktop: '1440x950',
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

function urlOrigin(value) {
  try {
    return new URL(value).origin
  } catch {
    return ''
  }
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim()) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match && isDate(match[0]) ? match[0] : ''
}

function currentUtcDate() {
  return new Date().toISOString().slice(0, 10)
}

function isFutureDate(value) {
  return isDate(value) && String(value).trim() > currentUtcDate()
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function normalizeFinding(finding) {
  return {
    severity: String(finding.severity || '').toUpperCase(),
    status: String(finding.status || '').toLowerCase(),
    surface: String(finding.surface || '').trim(),
    title: String(finding.title || '').trim(),
    notes: String(finding.notes || '').trim(),
  }
}

function submissionIssues(submission, plannedReview) {
  const issues = []

  for (const field of requiredSubmissionFields) {
    if (field === 'scorecard') {
      if (!submission.scorecard || typeof submission.scorecard !== 'object' || Array.isArray(submission.scorecard)) {
        issues.push('scorecard')
      }
      continue
    }

    if (field === 'findings') {
      if (!Array.isArray(submission.findings)) issues.push('findings')
      continue
    }

    if (!hasText(submission[field])) issues.push(field)
  }

  if (!plannedReview) {
    issues.push('id does not match a planned review')
    return issues
  }

  const status = String(submission.status || 'passed').toLowerCase()
  if (!completedStatuses.has(status)) {
    issues.push('status must be passed, failed, or accepted-risk')
  }

  if (submission.prompt !== plannedReview.prompt) {
    issues.push('prompt must match the assigned review packet')
  }

  if (submission.device !== plannedReview.device) {
    issues.push('device must match the assigned review packet')
  }

  if (hasText(submission.sourceActualId) && submission.sourceActualId !== plannedReview.sourceActualId) {
    issues.push('sourceActualId must match the assigned review packet')
  }

  const expectedViewport = reviewDeviceViewports[plannedReview.device]
  if (submission.viewport !== expectedViewport) {
    issues.push(`viewport must match assigned ${expectedViewport}`)
  }

  if (hasText(submission.routeOrShareUrl)) {
    if (!isHttpUrl(submission.routeOrShareUrl)) {
      issues.push('routeOrShareUrl must be http(s)')
    } else if (urlOrigin(submission.routeOrShareUrl) !== expectedReviewOrigin) {
      issues.push(`routeOrShareUrl must use expected review origin ${expectedReviewOrigin}`)
    }
  }

  if (hasText(submission.completedAt) && !isDate(submission.completedAt)) {
    issues.push('completedAt must be YYYY-MM-DD')
  } else if (hasText(submission.completedAt) && isFutureDate(submission.completedAt)) {
    issues.push('completedAt cannot be in the future')
  }

  const scorecard = submission.scorecard || {}
  const missingRatings = requiredScorecardFields.filter((field) => !isRating(scorecard[field]))
  if (missingRatings.length > 0) {
    issues.push(`scorecard ratings missing or out of range: ${missingRatings.join(', ')}`)
  }

  const malformedFindings = Array.isArray(submission.findings)
    ? submission.findings.filter((finding) => {
      const normalized = normalizeFinding(finding)
      return !allowedFindingSeverities.has(normalized.severity) ||
        !allowedFindingStatuses.has(normalized.status) ||
        !hasText(normalized.surface) ||
        !hasText(normalized.title) ||
        !hasText(normalized.notes)
    })
    : []
  if (malformedFindings.length > 0) {
    issues.push(`${malformedFindings.length} malformed finding(s)`)
  }

  return issues
}

function unresolvedBlockingFindings(submission) {
  return Array.isArray(submission.findings)
    ? submission.findings
      .map(normalizeFinding)
      .filter((finding) => (finding.severity === 'P0' || finding.severity === 'P1') && finding.status !== 'closed')
    : []
}

async function readSubmissions() {
  let entries
  try {
    entries = await readdir(resolve(process.cwd(), submissionDir), { withFileTypes: true })
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { missingDirectory: true, submissions: [] }
    }
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
        path,
        submission: JSON.parse(await readFile(path, 'utf8')),
        parseError: null,
      })
    } catch (error) {
      submissions.push({
        file,
        path,
        submission: null,
        parseError: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return { missingDirectory: false, submissions }
}

const rawRegister = await readFile(resolve(process.cwd(), registerPath), 'utf8')
const register = JSON.parse(rawRegister)
const expectedReviewOrigin = new URL(process.env.QA_BETA_REVIEW_BASE_URL || register.baseUrl || 'https://globe-travel-two.vercel.app').origin
const date = dateOnly(requestedDate) || dateOnly(register.reviewedAt) || currentUtcDate()
const submissionDir = process.env.QA_BETA_REVIEW_SUBMISSION_DIR || `../qa/beta-human-review-submissions-${date}`
const jsonArtifact = process.env.QA_BETA_REVIEW_INTAKE_JSON || `beta-human-review-intake-${date}.json`
const reportArtifact = process.env.QA_BETA_REVIEW_INTAKE_REPORT || `beta-human-review-intake-${date}.md`
const plannedReviews = Array.isArray(register.plannedReviews) ? register.plannedReviews : []
const plannedById = new Map(plannedReviews.map((review) => [review.id, review]))
const completedBefore = plannedReviews.filter((review) => completedStatuses.has(review.status)).length
const { missingDirectory, submissions } = await readSubmissions()

const seenIds = new Map()
const duplicateIds = []
for (const record of submissions) {
  const id = record.submission?.id
  if (!hasText(id)) continue
  if (seenIds.has(id)) {
    duplicateIds.push({ id, files: [seenIds.get(id), record.file] })
  } else {
    seenIds.set(id, record.file)
  }
}

const validationResults = submissions.map((record) => {
  const plannedReview = record.submission ? plannedById.get(record.submission.id) : null
  const issues = record.parseError
    ? [`invalid JSON: ${record.parseError}`]
    : submissionIssues(record.submission, plannedReview)
  return {
    file: record.file,
    id: record.submission?.id || null,
    destination: plannedReview?.destination || null,
    ok: issues.length === 0,
    issues,
    status: String(record.submission?.status || 'passed').toLowerCase(),
    unresolvedBlockingFindings: record.submission ? unresolvedBlockingFindings(record.submission) : [],
  }
})
const invalidSubmissions = validationResults.filter((result) => !result.ok)
const validRecords = submissions.filter((record) => {
  const result = validationResults.find((item) => item.file === record.file)
  return result?.ok === true
})
const unknownReviewCount = validationResults.filter((result) => result.issues.includes('id does not match a planned review')).length
const unresolvedBlockingFindingCount = validationResults.reduce((count, result) => count + result.unresolvedBlockingFindings.length, 0)

let imported = false
let importedReviewIds = []
let completedAfter = completedBefore
if (importValidSubmissions && validRecords.length > 0 && invalidSubmissions.length === 0 && duplicateIds.length === 0) {
  const nextRegister = {
    ...register,
    reviewedAt: date,
    status: 'intake-ready',
    plannedReviews: plannedReviews.map((review) => {
      const record = validRecords.find((item) => item.submission.id === review.id)
      if (!record) return review
      const submission = record.submission
      importedReviewIds.push(review.id)
      return {
        ...review,
        status: String(submission.status || 'passed').toLowerCase(),
        reviewerRole: submission.reviewerRole.trim(),
        routeOrShareUrl: submission.routeOrShareUrl.trim(),
        viewport: submission.viewport.trim(),
        completedAt: submission.completedAt.trim(),
        firstMinuteOutcome: submission.firstMinuteOutcome.trim(),
        mapTrustNotes: submission.mapTrustNotes.trim(),
        shareFeedbackOutcome: submission.shareFeedbackOutcome.trim(),
        scorecard: submission.scorecard,
        findings: submission.findings.map(normalizeFinding),
        reviewSubmissionFile: `${qaDisplayPath(submissionDir)}/${basename(record.file)}`,
      }
    }),
  }
  await writeFile(resolve(process.cwd(), registerPath), `${JSON.stringify(nextRegister, null, 2)}\n`)
  imported = true
  completedAfter = nextRegister.plannedReviews.filter((review) => completedStatuses.has(review.status)).length
}

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('beta review submission directory is present', !missingDirectory, {
  submissionDir: qaDisplayPath(submissionDir),
})
addCheck('beta review submissions parse and match assigned packets', invalidSubmissions.length === 0, {
  submissionCount: submissions.length,
  invalidSubmissionCount: invalidSubmissions.length,
  invalidSubmissions,
})
addCheck('beta review submissions do not duplicate planned review ids', duplicateIds.length === 0, {
  duplicateSubmissionCount: duplicateIds.length,
  duplicateIds,
})
addCheck('beta review intake import is explicit', !imported || importValidSubmissions, {
  importRequested: importValidSubmissions,
  imported,
  importedReviewIds,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  registerPath: qaDisplayPath(registerPath),
  submissionDir: qaDisplayPath(submissionDir),
  jsonArtifact: `qa/${jsonArtifact}`,
  reportArtifact: `qa/${reportArtifact}`,
  expectedReviewOrigin,
  status: failures.length === 0 ? 'pass' : 'fail',
  imported,
  importRequested: importValidSubmissions,
  plannedReviewCount: plannedReviews.length,
  completedReviewCountBefore: completedBefore,
  completedReviewCountAfter: completedAfter,
  submissionCount: submissions.length,
  validSubmissionCount: validationResults.filter((result) => result.ok).length,
  invalidSubmissionCount: invalidSubmissions.length,
  duplicateSubmissionCount: duplicateIds.length,
  unknownReviewCount,
  unresolvedBlockingFindingCount,
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  submissions: validationResults,
  checks,
  failures,
}

const report = `# Beta Human Review Intake

Date: ${date}
Register: \`${summary.registerPath}\`
Submission directory: \`${summary.submissionDir}\`
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Planned reviews: ${summary.plannedReviewCount}
- Completed reviews before intake: ${summary.completedReviewCountBefore}
- Completed reviews after intake: ${summary.completedReviewCountAfter}
- Submission files: ${summary.submissionCount}
- Valid submissions: ${summary.validSubmissionCount}
- Invalid submissions: ${summary.invalidSubmissionCount}
- Duplicate planned-review ids: ${summary.duplicateSubmissionCount}
- Import requested: ${summary.importRequested}
- Imported: ${summary.imported}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Invalid Submission Detail

${markdownList(invalidSubmissions.map((result) => `${result.file}: ${result.issues.join('; ')}`))}

## Duplicate Submission Detail

${markdownList(duplicateIds.map((item) => `${item.id}: ${item.files.join(', ')}`))}

## Unresolved P0/P1 Findings In Submitted Reviews

${markdownList(validationResults.flatMap((result) => result.unresolvedBlockingFindings.map((finding) => `${result.id}: ${finding.severity} ${finding.title}`)))}

## How To Use

- Add completed review JSON files to \`${summary.submissionDir}\`.
- Run \`npm run qa:beta-review-intake\` to validate submissions without changing the register.
- Run \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\` only after the intake report is clean and the submissions are ready to count.
- Re-run \`npm run qa:beta-review-progress\` after import so the public-launch dashboard reflects completed reviews.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(root, 'qa', reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
