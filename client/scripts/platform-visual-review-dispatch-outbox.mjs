import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { currentQaDate, dateOnly, daysBetween, isDate, requestedOrCurrentDate } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_VISUAL_REVIEW_DISPATCH_OUTBOX_DATE || ''
const requestedToday = process.env.QA_VISUAL_REVIEW_TODAY || ''
const registerPath = process.env.QA_VISUAL_REVIEW_REGISTER || 'qa/production-visual-review-register.json'
const progressPath = process.env.QA_VISUAL_REVIEW_PROGRESS || 'qa/production-visual-review-progress-2026-05-21.json'

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function currentReviewDate() {
  return requestedOrCurrentDate(requestedToday)
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function repoPath(path) {
  return resolve(root, qaDisplayPath(path))
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function safeFileStem(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function fileExists(path) {
  try {
    await access(repoPath(path))
    return true
  } catch {
    return false
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
}

function completedSubmissionPath(review, submissionDir) {
  return `${submissionDir}/${review.id}.json`
}

function submissionTemplatePath(review, submissionDir) {
  return `${submissionDir}/${review.id}.template.json`
}

function messageFileText(row) {
  return `Subject: ${row.messageSubject}

You are assigned ${row.id}, a scheduled Globe.travel production visual review for ${row.dueAt}.

Run command:
${row.command}

Expected artifact:
${row.expectedArtifactPrefix}

Submission template:
${row.submissionTemplatePath}

Completed submission filename:
${row.completedSubmissionPath}

Acceptance criteria:
${row.acceptanceCriteria}

Reviewer checklist:
- Run the production visual command on or after ${row.dueAt}.
- Review all ${row.screenshotsReviewed} screenshots across ${row.routes.join(', ')} and ${row.viewports.join(', ')}.
- Confirm no app errors, horizontal overflow, clipped primary text, overlapping app controls, missing screenshots, or unexplained stable-route diffs.
- Replace production commit and deployment placeholders with the current /api/health deployment metadata.
- Save the completed non-template JSON as ${row.completedSubmissionPath}.
- Validate with npm run qa:visual-review-intake before import.

Operator checklist:
- Assign a named visual reviewer and record their contact outside this repo.
- Send this message file, the command, and the submission template path to the reviewer.
- Confirm the review is not imported until screenshots have actually been inspected.
- Import only after validation is clean: QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake.
- Re-run npm run qa:visual-review-progress, npm run qa:public-launch-status, and npm run qa:launch-signoff after import.

Launch rule:
This message is visual-review outreach, not completed visual-review history. Public launch can count this review only after the completed non-template JSON passes intake and is explicitly imported into reviewHistory.
`
}

function rowsToCsv(rows) {
  const headers = [
    'id',
    'dueAt',
    'reviewerRole',
    'requiredForPublicLaunch',
    'dispatchStatus',
    'messageSubject',
    'messageFile',
    'command',
    'expectedArtifactPrefix',
    'submissionTemplatePath',
    'completedSubmissionPath',
  ]
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
}

const register = await readJson(registerPath)
const progress = await readJson(progressPath)
const date = requestedDate || dateOnly(register.reviewedAt) || currentQaDate()
const today = currentReviewDate()
const jsonName = process.env.QA_VISUAL_REVIEW_DISPATCH_OUTBOX_JSON || `production-visual-review-dispatch-outbox-${date}.json`
const reportName = process.env.QA_VISUAL_REVIEW_DISPATCH_OUTBOX_REPORT || `production-visual-review-dispatch-outbox-${date}.md`
const csvName = process.env.QA_VISUAL_REVIEW_DISPATCH_OUTBOX_CSV || `production-visual-review-dispatch-outbox-${date}.csv`
const outboxDirName = process.env.QA_VISUAL_REVIEW_DISPATCH_OUTBOX_DIR || `production-visual-review-dispatch-outbox-${date}`
const outboxDir = `qa/${outboxDirName}`
const scheduledReviews = Array.isArray(register.scheduledPublicLaunchReviews) ? register.scheduledPublicLaunchReviews : []
const submissionDir = qaDisplayPath(register.reviewSubmissionDirectory || `qa/production-visual-review-submissions-${date}`)
const remainingRequiredReviewDates = Math.max(0, Number(progress.remainingRequiredReviewDates ?? 0))

const messageRows = scheduledReviews.map((review, index) => {
  const dueAt = dateOnly(review.dueAt)
  const fileName = `${safeFileStem(review.id)}-${dueAt}.txt`
  return {
    id: review.id,
    dueAt,
    reviewerRole: review.reviewerRole || 'visual QA reviewer',
    requiredForPublicLaunch: index < remainingRequiredReviewDates,
    dispatchStatus: 'prepared-not-sent',
    messageSubject: `[Globe.travel visual QA] ${review.id} production review due ${dueAt}`,
    messageFile: `${outboxDir}/${fileName}`,
    command: review.command,
    expectedArtifactPrefix: review.expectedArtifactPrefix,
    submissionTemplatePath: submissionTemplatePath(review, submissionDir),
    completedSubmissionPath: completedSubmissionPath(review, submissionDir),
    routes: Array.isArray(review.routes) ? review.routes : [],
    viewports: Array.isArray(review.viewports) ? review.viewports : [],
    diffRoutes: Array.isArray(review.diffRoutes) ? review.diffRoutes : [],
    acceptanceCriteria: review.acceptanceCriteria || '',
    screenshotsReviewed: (Array.isArray(review.routes) ? review.routes.length : 0) *
      (Array.isArray(review.viewports) ? review.viewports.length : 0),
    daysUntilDue: daysBetween(today, dueAt),
  }
})

await mkdir(repoPath(outboxDir), { recursive: true })
for (const row of messageRows) {
  await writeFile(repoPath(row.messageFile), messageFileText(row))
}

const csvText = rowsToCsv(messageRows)
const messageFileChecks = await Promise.all(messageRows.map(async (row) => {
  const text = await readFile(repoPath(row.messageFile), 'utf8')
  return {
    id: row.id,
    messageFile: row.messageFile,
    exists: await fileExists(row.messageFile),
    hasSubject: text.includes(row.messageSubject),
    hasCommand: text.includes(row.command),
    hasArtifact: text.includes(row.expectedArtifactPrefix),
    hasTemplate: text.includes(row.submissionTemplatePath),
    hasCompletedSubmission: text.includes(row.completedSubmissionPath),
    hasIntakeCommand: text.includes('npm run qa:visual-review-intake'),
    hasLaunchBoundary: text.includes('not completed visual-review history'),
  }
}))

const malformedRows = messageRows.filter((row) => (
  !hasText(row.id) ||
  !isDate(row.dueAt) ||
  !hasText(row.reviewerRole) ||
  row.dispatchStatus !== 'prepared-not-sent' ||
  !hasText(row.messageSubject, 20) ||
  !hasText(row.messageFile) ||
  !hasText(row.command) ||
  !row.command.includes('npm run qa:release-production') ||
  !hasText(row.expectedArtifactPrefix) ||
  !hasText(row.submissionTemplatePath) ||
  !row.submissionTemplatePath.endsWith('.template.json') ||
  !hasText(row.completedSubmissionPath) ||
  row.completedSubmissionPath.endsWith('.template.json') ||
  !Array.isArray(row.routes) ||
  row.routes.length < 4 ||
  !Array.isArray(row.viewports) ||
  row.viewports.length < 5 ||
  !Array.isArray(row.diffRoutes) ||
  row.diffRoutes.length < 3 ||
  !hasText(row.acceptanceCriteria, 80)
))
const badMessageFiles = messageFileChecks.filter((check) => (
  !check.exists ||
  !check.hasSubject ||
  !check.hasCommand ||
  !check.hasArtifact ||
  !check.hasTemplate ||
  !check.hasCompletedSubmission ||
  !check.hasIntakeCommand ||
  !check.hasLaunchBoundary
))
const dueSoonRows = messageRows.filter((row) => (
  Number.isFinite(row.daysUntilDue) &&
  row.daysUntilDue >= 0 &&
  row.daysUntilDue <= 7
))
const overdueRows = messageRows.filter((row) => Number.isFinite(row.daysUntilDue) && row.daysUntilDue < 0)
const requiredRows = messageRows.filter((row) => row.requiredForPublicLaunch)

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('visual dispatch outbox reads passing progress and scheduled reviews', (
  progress.status === 'pass' &&
  scheduledReviews.length > 0 &&
  messageRows.length === scheduledReviews.length &&
  requiredRows.length === remainingRequiredReviewDates
), {
  progressArtifact: qaDisplayPath(progressPath),
  progressStatus: progress.status || null,
  scheduledReviewCount: scheduledReviews.length,
  remainingRequiredReviewDates,
  requiredRows: requiredRows.map((row) => row.id),
})

addCheck('visual dispatch outbox has one message file per scheduled review', (
  badMessageFiles.length === 0 &&
  messageFileChecks.length === messageRows.length
), {
  messageFileCount: messageFileChecks.length,
  badMessageFiles: badMessageFiles.map((row) => row.id || basename(row.messageFile || 'missing')),
})

addCheck('visual dispatch outbox rows are actionable and not overdue', (
  malformedRows.length === 0 &&
  overdueRows.length === 0
), {
  malformedRows: malformedRows.map((row) => row.id || '(missing id)'),
  overdueRows: overdueRows.map((row) => row.id || '(missing id)'),
})

addCheck('visual dispatch outbox CSV includes every command and completed-submission path', (
  messageRows.every((row) => csvText.includes(row.command)) &&
  messageRows.every((row) => csvText.includes(row.completedSubmissionPath))
), {
  csvArtifact: `qa/${csvName}`,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  today,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  registerPath: qaDisplayPath(registerPath),
  progressArtifact: qaDisplayPath(progressPath),
  artifact: `qa/${jsonName}`,
  report: `qa/${reportName}`,
  csv: `qa/${csvName}`,
  artifactDir: outboxDir,
  outboxRowCount: messageRows.length,
  requiredOutboxRowCount: requiredRows.length,
  messageFileCount: messageFileChecks.length,
  dueSoonCount: dueSoonRows.length,
  overdueCount: overdueRows.length,
  messageRows,
  messageFileChecks,
  checks,
  failures,
}

const report = `# Production Visual Review Dispatch Outbox

Date: ${date}
Today: ${today}
Status: ${summary.status}
Source: ${summary.progressArtifact}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Message files: ${summary.messageFileCount}
- Required public-launch rows: ${summary.requiredOutboxRowCount}
- Due soon: ${summary.dueSoonCount}
- Overdue: ${summary.overdueCount}

## Operator Workflow

- Assign a named visual reviewer before each due date.
- Send the matching message file, command, and submission-template path to the reviewer.
- Review all scheduled screenshots before copying a template to a completed non-template JSON file.
- Replace commit and deployment placeholders with current \`/api/health\` metadata.
- Validate with \`npm run qa:visual-review-intake\`; import only with \`QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake\` after validation is clean.
- Re-run \`npm run qa:visual-review-progress\`, \`npm run qa:public-launch-status\`, and \`npm run qa:launch-signoff\` after import.

## Message Files

| ID | Due | Required | Reviewer | Message File |
| --- | --- | --- | --- | --- |
${messageRows.map((row) => `| ${row.id} | ${row.dueAt} | ${row.requiredForPublicLaunch ? 'yes' : 'buffer'} | ${row.reviewerRole} | \`${row.messageFile}\` |`).join('\n') || '| none | none | none | none | none |'}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}

## Launch Rule

This dispatch outbox is assignment and outreach evidence, not completed visual-review history. Public launch still requires completed non-template visual-review JSON submissions that pass intake and are explicitly imported into reviewHistory.
`

await writeFile(repoPath(`qa/${jsonName}`), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(`qa/${reportName}`), report)
await writeFile(repoPath(`qa/${csvName}`), `${csvText}\n`)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
