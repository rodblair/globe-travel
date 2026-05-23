import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_VISUAL_REVIEW_SCHEDULE_DATE || ''
const registerPath = process.env.QA_VISUAL_REVIEW_REGISTER || '../qa/production-visual-review-register.json'
const writeSubmissionTemplates = !['0', 'false', 'no'].includes(String(process.env.QA_VISUAL_REVIEW_WRITE_SUBMISSION_TEMPLATES || '1').toLowerCase())

const requiredRoutes = ['landing', 'pricing', 'login', 'signup', 'public-share']
const requiredViewports = ['phone', 'tablet', 'laptop', 'desktop', 'wide']
const requiredDiffRoutes = ['landing', 'login', 'signup']
const expectedScreenshotCount = requiredRoutes.length * requiredViewports.length

function unique(values) {
  return [...new Set(values.filter(Boolean))]
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

function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function submissionTemplateFile(review) {
  return `${review.id}.template.json`
}

function submissionTemplatePath(review, submissionDir) {
  return `${submissionDir}/${submissionTemplateFile(review)}`
}

function submissionTemplateForReview(review) {
  const artifact = review.expectedArtifactPrefix
  return {
    scheduledReviewId: review.id,
    reviewedAt: dateOnly(review.dueAt),
    artifact,
    summaryArtifact: `${artifact}/summary.json`,
    productionCommit: 'replace-with-live-production-commit',
    deploymentUrl: 'replace-with-live-production-deployment-url',
    reviewedBy: review.reviewerRole || 'visual QA reviewer',
    verdict: 'pass',
    blockingFindings: [],
    screenshotsReviewed: (review.routes || requiredRoutes).length * (review.viewports || requiredViewports).length,
    routesReviewed: review.routes || requiredRoutes,
    viewportsReviewed: review.viewports || requiredViewports,
    diffRoutesReviewed: review.diffRoutes || requiredDiffRoutes,
    notes: 'Replace with a concise review note confirming no app errors, horizontal overflow, clipped app text, overlapping controls, missing screenshots, or unexplained stable-route diffs.',
  }
}

function assignmentRows(scheduledReviews, submissionDir) {
  return scheduledReviews.map((review) => ({
    id: review.id,
    dueAt: dateOnly(review.dueAt),
    owner: review.owner,
    reviewerRole: review.reviewerRole,
    status: review.status,
    command: review.command,
    expectedArtifactPrefix: review.expectedArtifactPrefix,
    routes: (review.routes || []).join('|'),
    viewports: (review.viewports || []).join('|'),
    diffRoutes: (review.diffRoutes || []).join('|'),
    submissionTemplatePath: submissionTemplatePath(review, submissionDir),
    assignee: '',
    completedSubmissionPath: '',
    notes: '',
  }))
}

function assignmentCsv(scheduledReviews, submissionDir) {
  const columns = [
    'id',
    'dueAt',
    'owner',
    'reviewerRole',
    'status',
    'command',
    'expectedArtifactPrefix',
    'routes',
    'viewports',
    'diffRoutes',
    'submissionTemplatePath',
    'assignee',
    'completedSubmissionPath',
    'notes',
  ]
  const rows = assignmentRows(scheduledReviews, submissionDir)
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n') + '\n'
}

function assignmentMarkdown(scheduledReviews, submissionDir) {
  return `# Production Visual Review Assignment Board

Date: ${date}
Status: ready for scheduled review execution

## Operator Instructions

- Run each scheduled production release command on or after its due date.
- Review all ${expectedScreenshotCount} production visual screenshots for the scheduled artifact.
- Copy the matching \`.template.json\` file to a non-template \`.json\` file only after the review is actually complete.
- Replace live production commit and deployment placeholders with the current \`/api/health\` deployment metadata.
- Run \`npm run qa:visual-review-intake\`, then \`QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake\` only when validation is clean.
- Re-run \`npm run qa:visual-review-schedule\`, \`npm run qa:launch-refresh\`, and \`npm run qa:launch-signoff\` after import.

## Scheduled Review Matrix

| ID | Due | Owner | Artifact | Template | Command |
| --- | --- | --- | --- | --- | --- |
${scheduledReviews.map((review) => (
  `| ${review.id} | ${dateOnly(review.dueAt)} | ${review.owner} | \`${review.expectedArtifactPrefix}\` | \`${submissionTemplatePath(review, submissionDir)}\` | \`${review.command}\` |`
)).join('\n')}

## Launch Rule

Public launch still requires four distinct dated passing visual-review history entries. This board and its templates are scheduling aids, not completed visual-review evidence.
`
}

const raw = await readFile(resolve(process.cwd(), registerPath), 'utf8')
const register = JSON.parse(raw)
const date = requestedDate || dateOnly(register.reviewedAt) || currentUtcDate()
const reportName = process.env.QA_VISUAL_REVIEW_SCHEDULE_REPORT || `production-visual-review-schedule-${date}.md`
const assignmentCsvName = process.env.QA_VISUAL_REVIEW_ASSIGNMENT_CSV || `production-visual-review-assignments-${date}.csv`
const assignmentReportName = process.env.QA_VISUAL_REVIEW_ASSIGNMENT_REPORT || `production-visual-review-assignments-${date}.md`
const reviewHistory = Array.isArray(register.reviewHistory) ? register.reviewHistory : []
const scheduledReviews = Array.isArray(register.scheduledPublicLaunchReviews) ? register.scheduledPublicLaunchReviews : []
const submissionDir = register.reviewSubmissionDirectory || qaDisplayPath(`../qa/production-visual-review-submissions-${date}`)
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
  dateSource: requestedDate ? 'QA_VISUAL_REVIEW_SCHEDULE_DATE' : 'visual review register',
  registerPath: qaDisplayPath(registerPath),
  reportPath: `qa/${reportName}`,
  assignmentCsv: `qa/${assignmentCsvName}`,
  assignmentReport: `qa/${assignmentReportName}`,
  submissionDir,
  submissionTemplateCount: scheduledReviews.length,
  submissionTemplatesWritten: writeSubmissionTemplates,
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
- Submission templates: ${summary.submissionTemplateCount}${writeSubmissionTemplates ? ` written to \`${summary.submissionDir}\`` : ''}
- Assignment board: \`${summary.assignmentReport}\` and \`${summary.assignmentCsv}\`

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
- Each scheduled entry must run production visual QA, review ${expectedScreenshotCount} screenshots, and then be recorded in \`qa/production-visual-review-register.json\` only after the review is actually complete.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', reportName), report)
await writeFile(resolve(root, 'qa', assignmentCsvName), assignmentCsv(scheduledReviews, submissionDir))
await writeFile(resolve(root, 'qa', assignmentReportName), assignmentMarkdown(scheduledReviews, submissionDir))

if (writeSubmissionTemplates) {
  const templateDir = resolve(root, submissionDir)
  await mkdir(templateDir, { recursive: true })
  for (const review of scheduledReviews) {
    await writeFile(
      resolve(templateDir, submissionTemplateFile(review)),
      `${JSON.stringify(submissionTemplateForReview(review), null, 2)}\n`,
    )
  }
  await writeFile(resolve(templateDir, 'README.md'), `# Production Visual Review Submissions

Drop completed visual-review JSON files in this directory after a scheduled production visual review is actually run and reviewed.

Each \`.template.json\` file is prefilled from a scheduled public-launch visual-review entry. Copy or rename the relevant template to a non-template \`.json\` file only after the review is complete, replace production deployment placeholders, and keep \`blockingFindings\` empty only when the review found no blockers.

Use \`npm run qa:visual-review-intake\` from \`client/\` to validate files without changing the canonical visual-review register. Use \`QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake\` only after the report is clean and the review is ready to count toward public-launch visual-review history.

Template files ending in \`.template.json\` are ignored by the intake command.
`)
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
