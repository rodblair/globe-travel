import { spawnSync } from 'node:child_process'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const date = process.env.QA_REVIEW_INTAKE_REHEARSAL_DATE || currentQaDate()
const artifactName = process.env.QA_REVIEW_INTAKE_REHEARSAL_ARTIFACT_NAME || `review-intake-rehearsal-${date}`
const rawDir = `qa/${artifactName}-raw`
const betaTemplatePath = process.env.QA_REVIEW_INTAKE_REHEARSAL_BETA_TEMPLATE ||
  'qa/beta-human-review-submissions-2026-05-21/BETA-HR-001-athens.template.json'
const visualTemplatePath = process.env.QA_REVIEW_INTAKE_REHEARSAL_VISUAL_TEMPLATE ||
  'qa/production-visual-review-submissions-2026-05-21/PROD-VISUAL-HISTORY-002.template.json'
const betaRegisterPath = process.env.QA_BETA_REVIEW_REGISTER || 'qa/beta-human-review-register.json'
const visualRegisterPath = process.env.QA_VISUAL_REVIEW_REGISTER || 'qa/production-visual-review-register.json'

function repoPath(path) {
  return resolve(root, String(path || '').replace(/^\.\.\//, ''))
}

function qaDisplayPath(path) {
  return String(path || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
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

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function completedBetaCount(register) {
  const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])
  return Array.isArray(register.plannedReviews)
    ? register.plannedReviews.filter((review) => completedStatuses.has(review.status)).length
    : 0
}

function visualHistoryCount(register) {
  return Array.isArray(register.reviewHistory) ? register.reviewHistory.length : 0
}

function addDays(dateValue, days) {
  const parsed = Date.parse(`${dateValue}T00:00:00Z`)
  if (!Number.isFinite(parsed)) return dateValue
  return new Date(parsed + days * 86400000).toISOString().slice(0, 10)
}

function runIntake({ script, submissionDir, jsonName, reportName }) {
  return spawnSync(process.execPath, [script], {
    cwd: clientRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      QA_BETA_REVIEW_IMPORT: '',
      QA_VISUAL_REVIEW_IMPORT: '',
      QA_BETA_REVIEW_SUBMISSION_DIR: `../${submissionDir}`,
      QA_BETA_REVIEW_INTAKE_JSON: jsonName,
      QA_BETA_REVIEW_INTAKE_REPORT: reportName,
      QA_VISUAL_REVIEW_SUBMISSION_DIR: `../${submissionDir}`,
      QA_VISUAL_REVIEW_INTAKE_JSON: jsonName,
      QA_VISUAL_REVIEW_INTAKE_REPORT: reportName,
    },
  })
}

await rm(repoPath(rawDir), { recursive: true, force: true })
await mkdir(repoPath(`${rawDir}/beta`), { recursive: true })
await mkdir(repoPath(`${rawDir}/beta-blocking`), { recursive: true })
await mkdir(repoPath(`${rawDir}/beta-private`), { recursive: true })
await mkdir(repoPath(`${rawDir}/visual`), { recursive: true })
await mkdir(repoPath(`${rawDir}/visual-private`), { recursive: true })

const betaRegisterBefore = await readJson(betaRegisterPath)
const visualRegisterBefore = await readJson(visualRegisterPath)
const betaTemplate = await readFile(repoPath(betaTemplatePath), 'utf8')
const betaBlockingSubmission = JSON.parse(betaTemplate)
betaBlockingSubmission.reviewerRole = 'blocking-finding rehearsal reviewer'
betaBlockingSubmission.completedAt = date
betaBlockingSubmission.firstMinuteOutcome = 'Planner was understandable, but this fixture intentionally carries an open blocking finding.'
betaBlockingSubmission.mapTrustNotes = 'Map evidence was reviewed for the rehearsal fixture.'
betaBlockingSubmission.shareFeedbackOutcome = 'Share feedback was reviewed for the rehearsal fixture.'
betaBlockingSubmission.scorecard = {
  firstMinuteClarity: 4,
  itineraryUsefulness: 4,
  mapTrust: 4,
  editAndSwapConfidence: 4,
  saveReopenConfidence: 4,
  shareRecipientClarity: 4,
  feedbackLoopClarity: 4,
  mobileUsability: 4,
  paidValueCredibility: 4,
}
betaBlockingSubmission.findings = [
  {
    severity: 'P1',
    status: 'open',
    surface: 'planner',
    title: 'Intentional open blocker rehearsal finding',
    notes: 'This fixture proves beta intake refuses otherwise valid reviews when unresolved P0/P1 findings remain.',
  },
]
const betaPrivateSubmission = JSON.parse(betaTemplate)
betaPrivateSubmission.reviewerRole = 'alex@example.com'
betaPrivateSubmission.completedAt = date
betaPrivateSubmission.firstMinuteOutcome = 'Reviewer understood the first minute but included private contact details in this rehearsal fixture.'
betaPrivateSubmission.mapTrustNotes = 'Map trust was acceptable for this fixture; contact +1 555 121 2121 should be rejected.'
betaPrivateSubmission.shareFeedbackOutcome = 'Share feedback worked, but the fixture intentionally includes private contact details.'
betaPrivateSubmission.scorecard = {
  firstMinuteClarity: 4,
  itineraryUsefulness: 4,
  mapTrust: 4,
  editAndSwapConfidence: 4,
  saveReopenConfidence: 4,
  shareRecipientClarity: 4,
  feedbackLoopClarity: 4,
  mobileUsability: 4,
  paidValueCredibility: 4,
}
betaPrivateSubmission.findings = [
  {
    severity: 'P2',
    status: 'closed',
    surface: 'planner',
    title: 'Intentional private contact rehearsal finding',
    notes: 'This fixture proves beta intake refuses private reviewer contact details such as alex@example.com before import.',
  },
]
const visualTemplate = JSON.parse(await readFile(repoPath(visualTemplatePath), 'utf8'))
visualTemplate.reviewedAt = addDays(date, 1)
const visualPrivateSubmission = {
  ...visualTemplate,
  reviewedBy: 'visual-reviewer@example.com',
  notes: 'This otherwise template-derived visual review intentionally includes private contact details such as +1 555 121 2121 so intake must reject it before import.',
}
await writeFile(repoPath(`${rawDir}/beta/BETA-HR-001-athens.json`), betaTemplate)
await writeFile(repoPath(`${rawDir}/beta-blocking/BETA-HR-001-athens.json`), `${JSON.stringify(betaBlockingSubmission, null, 2)}\n`)
await writeFile(repoPath(`${rawDir}/beta-private/BETA-HR-001-athens.json`), `${JSON.stringify(betaPrivateSubmission, null, 2)}\n`)
await writeFile(repoPath(`${rawDir}/visual/PROD-VISUAL-HISTORY-002.json`), `${JSON.stringify(visualTemplate, null, 2)}\n`)
await writeFile(repoPath(`${rawDir}/visual-private/PROD-VISUAL-HISTORY-002.json`), `${JSON.stringify(visualPrivateSubmission, null, 2)}\n`)

const betaRawJson = `review-intake-rehearsal-beta-raw-${date}.json`
const betaRawReport = `review-intake-rehearsal-beta-raw-${date}.md`
const betaBlockingRawJson = `review-intake-rehearsal-beta-blocking-raw-${date}.json`
const betaBlockingRawReport = `review-intake-rehearsal-beta-blocking-raw-${date}.md`
const betaPrivateRawJson = `review-intake-rehearsal-beta-private-raw-${date}.json`
const betaPrivateRawReport = `review-intake-rehearsal-beta-private-raw-${date}.md`
const visualRawJson = `review-intake-rehearsal-visual-raw-${date}.json`
const visualRawReport = `review-intake-rehearsal-visual-raw-${date}.md`
const visualPrivateRawJson = `review-intake-rehearsal-visual-private-raw-${date}.json`
const visualPrivateRawReport = `review-intake-rehearsal-visual-private-raw-${date}.md`

const betaResult = runIntake({
  script: 'scripts/platform-beta-human-review-intake.mjs',
  submissionDir: `${rawDir}/beta`,
  jsonName: betaRawJson,
  reportName: betaRawReport,
})
const betaBlockingResult = runIntake({
  script: 'scripts/platform-beta-human-review-intake.mjs',
  submissionDir: `${rawDir}/beta-blocking`,
  jsonName: betaBlockingRawJson,
  reportName: betaBlockingRawReport,
})
const betaPrivateResult = runIntake({
  script: 'scripts/platform-beta-human-review-intake.mjs',
  submissionDir: `${rawDir}/beta-private`,
  jsonName: betaPrivateRawJson,
  reportName: betaPrivateRawReport,
})
const visualResult = runIntake({
  script: 'scripts/platform-visual-review-intake.mjs',
  submissionDir: `${rawDir}/visual`,
  jsonName: visualRawJson,
  reportName: visualRawReport,
})
const visualPrivateResult = runIntake({
  script: 'scripts/platform-visual-review-intake.mjs',
  submissionDir: `${rawDir}/visual-private`,
  jsonName: visualPrivateRawJson,
  reportName: visualPrivateRawReport,
})

const betaRawSummary = await readJson(`qa/${betaRawJson}`).catch(() => null)
const betaBlockingRawSummary = await readJson(`qa/${betaBlockingRawJson}`).catch(() => null)
const betaPrivateRawSummary = await readJson(`qa/${betaPrivateRawJson}`).catch(() => null)
const visualRawSummary = await readJson(`qa/${visualRawJson}`).catch(() => null)
const visualPrivateRawSummary = await readJson(`qa/${visualPrivateRawJson}`).catch(() => null)
const betaRegisterAfter = await readJson(betaRegisterPath)
const visualRegisterAfter = await readJson(visualRegisterPath)
const betaInvalidIssues = (betaRawSummary?.submissions || []).flatMap((submission) => submission.issues || [])
const betaBlockingChecks = betaBlockingRawSummary?.checks || []
const betaPrivateIssues = (betaPrivateRawSummary?.submissions || []).flatMap((submission) => submission.issues || [])
const visualInvalidIssues = (visualRawSummary?.submissions || []).flatMap((submission) => submission.issues || [])
const visualPrivateIssues = (visualPrivateRawSummary?.submissions || []).flatMap((submission) => submission.issues || [])

await Promise.all([
  rm(repoPath(rawDir), { recursive: true, force: true }),
  rm(repoPath(`qa/${betaRawJson}`), { force: true }),
  rm(repoPath(`qa/${betaRawReport}`), { force: true }),
  rm(repoPath(`qa/${betaBlockingRawJson}`), { force: true }),
  rm(repoPath(`qa/${betaBlockingRawReport}`), { force: true }),
  rm(repoPath(`qa/${betaPrivateRawJson}`), { force: true }),
  rm(repoPath(`qa/${betaPrivateRawReport}`), { force: true }),
  rm(repoPath(`qa/${visualRawJson}`), { force: true }),
  rm(repoPath(`qa/${visualRawReport}`), { force: true }),
  rm(repoPath(`qa/${visualPrivateRawJson}`), { force: true }),
  rm(repoPath(`qa/${visualPrivateRawReport}`), { force: true }),
])

const checks = [
  {
    name: 'beta intake rejects copied template as completed evidence',
    ok: betaResult.status !== 0 &&
      betaRawSummary?.status === 'fail' &&
      Number(betaRawSummary?.invalidSubmissionCount || 0) > 0,
    exitCode: betaResult.status,
    status: betaRawSummary?.status || null,
    invalidSubmissionCount: betaRawSummary?.invalidSubmissionCount ?? null,
  },
  {
    name: 'beta intake reports missing reviewer evidence and scorecard ratings',
    ok: betaInvalidIssues.some((issue) => String(issue).includes('reviewerRole')) &&
      betaInvalidIssues.some((issue) => String(issue).includes('scorecard ratings missing or out of range')),
    issues: betaInvalidIssues,
  },
  {
    name: 'beta intake rehearsal does not mutate completed review count',
    ok: completedBetaCount(betaRegisterBefore) === completedBetaCount(betaRegisterAfter),
    before: completedBetaCount(betaRegisterBefore),
    after: completedBetaCount(betaRegisterAfter),
  },
  {
    name: 'beta intake rejects otherwise valid reviews with unresolved P0/P1 findings',
    ok: betaBlockingResult.status !== 0 &&
      betaBlockingRawSummary?.status === 'fail' &&
      Number(betaBlockingRawSummary?.validSubmissionCount || 0) === 1 &&
      Number(betaBlockingRawSummary?.invalidSubmissionCount || 0) === 0 &&
      Number(betaBlockingRawSummary?.unresolvedBlockingFindingCount || 0) === 1 &&
      betaBlockingChecks.some((check) => (
        check.name === 'beta review submissions have no unresolved P0/P1 findings' &&
        check.ok === false
      )),
    exitCode: betaBlockingResult.status,
    status: betaBlockingRawSummary?.status || null,
    validSubmissionCount: betaBlockingRawSummary?.validSubmissionCount ?? null,
    invalidSubmissionCount: betaBlockingRawSummary?.invalidSubmissionCount ?? null,
    unresolvedBlockingFindingCount: betaBlockingRawSummary?.unresolvedBlockingFindingCount ?? null,
  },
  {
    name: 'beta intake rejects private contact details before import',
    ok: betaPrivateResult.status !== 0 &&
      betaPrivateRawSummary?.status === 'fail' &&
      betaPrivateIssues.some((issue) => String(issue).includes('reviewerRole appears to include contact details')) &&
      betaPrivateIssues.some((issue) => String(issue).includes('mapTrustNotes appears to include contact details')) &&
      betaPrivateIssues.some((issue) => String(issue).includes('finding(s) appear to include contact details')),
    exitCode: betaPrivateResult.status,
    status: betaPrivateRawSummary?.status || null,
    issues: betaPrivateIssues,
  },
  {
    name: 'visual intake rejects copied template as completed evidence',
    ok: visualResult.status !== 0 &&
      visualRawSummary?.status === 'fail' &&
      Number(visualRawSummary?.invalidSubmissionCount || 0) > 0,
    exitCode: visualResult.status,
    status: visualRawSummary?.status || null,
    invalidSubmissionCount: visualRawSummary?.invalidSubmissionCount ?? null,
  },
  {
    name: 'visual intake reports local-calendar future-dated production evidence',
    ok: visualInvalidIssues.some((issue) => String(issue).includes('reviewedAt cannot be in the future')),
    issues: visualInvalidIssues,
  },
  {
    name: 'visual intake rejects private contact details before import',
    ok: visualPrivateResult.status !== 0 &&
      visualPrivateRawSummary?.status === 'fail' &&
      visualPrivateIssues.some((issue) => String(issue).includes('reviewedBy appears to include contact details')) &&
      visualPrivateIssues.some((issue) => String(issue).includes('notes appears to include contact details')),
    exitCode: visualPrivateResult.status,
    status: visualPrivateRawSummary?.status || null,
    issues: visualPrivateIssues,
  },
  {
    name: 'visual intake rehearsal does not mutate review history',
    ok: visualHistoryCount(visualRegisterBefore) === visualHistoryCount(visualRegisterAfter),
    before: visualHistoryCount(visualRegisterBefore),
    after: visualHistoryCount(visualRegisterAfter),
  },
  {
    name: 'review intake rehearsal cleans up raw temporary artifacts',
    ok: !(await fileExists(rawDir)) &&
      !(await fileExists(`qa/${betaRawJson}`)) &&
      !(await fileExists(`qa/${visualRawJson}`)),
    rawDir,
    betaRawArtifact: `qa/${betaRawJson}`,
    visualRawArtifact: `qa/${visualRawJson}`,
  },
]

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  betaTemplate: qaDisplayPath(betaTemplatePath),
  visualTemplate: qaDisplayPath(visualTemplatePath),
  betaIntakeExitCode: betaResult.status,
  betaBlockingIntakeExitCode: betaBlockingResult.status,
  betaPrivateIntakeExitCode: betaPrivateResult.status,
  visualIntakeExitCode: visualResult.status,
  visualPrivateIntakeExitCode: visualPrivateResult.status,
  betaInvalidSubmissionCount: betaRawSummary?.invalidSubmissionCount ?? null,
  betaBlockingUnresolvedFindingCount: betaBlockingRawSummary?.unresolvedBlockingFindingCount ?? null,
  betaPrivateContactIssueCount: betaPrivateIssues.filter((issue) => String(issue).includes('contact details')).length,
  betaPrivateContactIssues: betaPrivateIssues.filter((issue) => String(issue).includes('contact details')),
  visualInvalidSubmissionCount: visualRawSummary?.invalidSubmissionCount ?? null,
  visualPrivateContactIssueCount: visualPrivateIssues.filter((issue) => String(issue).includes('contact details')).length,
  visualPrivateContactIssues: visualPrivateIssues.filter((issue) => String(issue).includes('contact details')),
  betaCompletedBefore: completedBetaCount(betaRegisterBefore),
  betaCompletedAfter: completedBetaCount(betaRegisterAfter),
  visualHistoryBefore: visualHistoryCount(visualRegisterBefore),
  visualHistoryAfter: visualHistoryCount(visualRegisterAfter),
  rawArtifactsCleanedUp: checks.at(-1)?.ok === true,
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
}

const report = `# Review Intake Rehearsal

Date: ${summary.date}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Beta intake exit code: ${summary.betaIntakeExitCode}
- Beta blocking-finding intake exit code: ${summary.betaBlockingIntakeExitCode}
- Beta private-contact intake exit code: ${summary.betaPrivateIntakeExitCode}
- Visual intake exit code: ${summary.visualIntakeExitCode}
- Visual private-contact intake exit code: ${summary.visualPrivateIntakeExitCode}
- Beta invalid submissions: ${summary.betaInvalidSubmissionCount ?? 0}
- Beta unresolved P0/P1 rehearsal findings: ${summary.betaBlockingUnresolvedFindingCount ?? 0}
- Beta private-contact issues: ${summary.betaPrivateContactIssueCount ?? 0}
- Visual invalid submissions: ${summary.visualInvalidSubmissionCount ?? 0}
- Visual private-contact issues: ${summary.visualPrivateContactIssueCount ?? 0}
- Raw artifacts cleaned up: ${summary.rawArtifactsCleanedUp ? 'yes' : 'no'}

## Operating Meaning

This rehearsal copies beta and visual-review templates into non-template submission files and proves the intake commands reject them as incomplete evidence. It also submits an otherwise valid beta review with an unresolved P1 finding and proves intake rejects it before import. It confirms the canonical beta register and production visual-review history stay unchanged.

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(repoPath(summary.jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(summary.reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
