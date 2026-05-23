import { spawnSync } from 'node:child_process'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const date = process.env.QA_REVIEW_INTAKE_IMPORT_REHEARSAL_DATE || currentQaDate()
const visualReviewDate = process.env.QA_REVIEW_INTAKE_IMPORT_REHEARSAL_VISUAL_DATE ||
  new Date().toISOString().slice(0, 10)
const artifactName = process.env.QA_REVIEW_INTAKE_IMPORT_REHEARSAL_ARTIFACT_NAME ||
  `review-intake-import-rehearsal-${date}`
const rawDir = `qa/${artifactName}-raw`
const betaRegisterPath = process.env.QA_BETA_REVIEW_REGISTER || 'qa/beta-human-review-register.json'
const visualRegisterPath = process.env.QA_VISUAL_REVIEW_REGISTER || 'qa/production-visual-review-register.json'
const latestVisualSummaryPath = process.env.QA_REVIEW_INTAKE_IMPORT_REHEARSAL_VISUAL_SUMMARY ||
  'qa/visual-baseline-production-runtime-current-2026-05-22-e629404/summary.json'

const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])

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
  return Array.isArray(register?.plannedReviews)
    ? register.plannedReviews.filter((review) => completedStatuses.has(review.status)).length
    : 0
}

function visualHistoryCount(register) {
  return Array.isArray(register?.reviewHistory) ? register.reviewHistory.length : 0
}

function relativeDir(path) {
  return `../${qaDisplayPath(path)}`
}

function runIntake({ script, env }) {
  return spawnSync(process.execPath, [script], {
    cwd: clientRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env,
    },
  })
}

function visualArtifactFromSummaryPath(summaryPath) {
  return qaDisplayPath(summaryPath).replace(/\/summary\.json$/, '')
}

await rm(repoPath(rawDir), { recursive: true, force: true })
await mkdir(repoPath(`${rawDir}/beta-submissions`), { recursive: true })
await mkdir(repoPath(`${rawDir}/visual-submissions`), { recursive: true })

const betaRegister = await readJson(betaRegisterPath)
const visualRegister = await readJson(visualRegisterPath)
const latestVisualSummary = await readJson(latestVisualSummaryPath)
const canonicalBetaBeforeSerialized = JSON.stringify(betaRegister)
const canonicalVisualBeforeSerialized = JSON.stringify(visualRegister)
const betaReview = betaRegister.plannedReviews?.find((review) => review.id === 'BETA-HR-001') ||
  betaRegister.plannedReviews?.[0]
const visualArtifact = visualArtifactFromSummaryPath(latestVisualSummaryPath)
const visualDeployment = latestVisualSummary.deployment || {}

if (!betaReview?.id) {
  throw new Error('could not find a beta review for import rehearsal')
}
if (!visualDeployment.commit || !visualDeployment.url) {
  throw new Error(`visual summary ${latestVisualSummaryPath} is missing deployment metadata`)
}

const betaRawRegister = `${rawDir}/beta-register.json`
const visualRawRegister = `${rawDir}/visual-register.json`
const betaSubmissionDir = `${rawDir}/beta-submissions`
const visualSubmissionDir = `${rawDir}/visual-submissions`
const betaRawJson = `review-intake-import-rehearsal-beta-raw-${date}.json`
const betaRawReport = `review-intake-import-rehearsal-beta-raw-${date}.md`
const visualRawJson = `review-intake-import-rehearsal-visual-raw-${date}.json`
const visualRawReport = `review-intake-import-rehearsal-visual-raw-${date}.md`
const visualReviewId = 'PROD-VISUAL-IMPORT-REHEARSAL'

const betaSubmission = {
  id: betaReview.id,
  sourceActualId: betaReview.sourceActualId,
  reviewerRole: 'launch-readiness beta rehearsal reviewer',
  routeOrShareUrl: betaReview.startUrl || 'https://globe-travel-two.vercel.app/chat',
  viewport: betaReview.device === 'desktop' ? '1440x950' : '390x844',
  device: betaReview.device || 'phone',
  prompt: betaReview.prompt,
  status: 'passed',
  completedAt: date,
  firstMinuteOutcome: 'The first screen made the assigned trip goal clear, preserved the prompt, and offered a direct path into the planner without confusion.',
  mapTrustNotes: 'The Trip Studio map and itinerary stayed aligned well enough for a reviewer to trust the day-by-day plan and mapped stops.',
  shareFeedbackOutcome: 'The public share and feedback surfaces were understandable, with copy and controls clear enough for a recipient to respond.',
  scorecard: {
    firstMinuteClarity: 5,
    itineraryUsefulness: 5,
    mapTrust: 5,
    editAndSwapConfidence: 4,
    saveReopenConfidence: 5,
    shareRecipientClarity: 5,
    feedbackLoopClarity: 5,
    mobileUsability: betaReview.device === 'phone' ? 5 : 4,
    paidValueCredibility: 4,
  },
  findings: [
    {
      severity: 'P3',
      status: 'closed',
      surface: 'review-intake-import-rehearsal',
      title: 'No launch-blocking issue in isolated import rehearsal',
      notes: 'Synthetic evidence exists only to prove the import path against copied registers and is never counted in canonical launch evidence.',
    },
  ],
}

const seededVisualRegister = {
  ...visualRegister,
  scheduledPublicLaunchReviews: [
    {
      id: visualReviewId,
      dueAt: visualReviewDate,
      owner: 'Codex release QA',
      reviewerRole: 'visual QA reviewer',
      status: 'planned',
      command: `QA_BASE_URL=https://globe-travel-two.vercel.app QA_SHARE_SLUG=x3m2c8cnws QA_PRODUCTION_VISUAL_ARTIFACT_NAME=${basename(visualArtifact)} npm run qa:release-production`,
      expectedArtifactPrefix: visualArtifact,
      routes: ['landing', 'pricing', 'login', 'signup', 'public-share'],
      viewports: ['phone', 'tablet', 'laptop', 'desktop', 'wide'],
      diffRoutes: ['landing', 'login', 'signup'],
      acceptanceCriteria: 'Temporary import rehearsal schedule row used only against copied registers.',
    },
  ],
}
const visualSubmission = {
  scheduledReviewId: visualReviewId,
  reviewedAt: visualReviewDate,
  artifact: visualArtifact,
  summaryArtifact: qaDisplayPath(latestVisualSummaryPath),
  productionCommit: visualDeployment.commit,
  deploymentUrl: visualDeployment.url,
  reviewedBy: 'Codex visual QA import rehearsal',
  verdict: 'pass',
  blockingFindings: [],
  screenshotsReviewed: 25,
  routesReviewed: ['landing', 'pricing', 'login', 'signup', 'public-share'],
  viewportsReviewed: ['phone', 'tablet', 'laptop', 'desktop', 'wide'],
  diffRoutesReviewed: ['landing', 'login', 'signup'],
  notes: 'Temporary import rehearsal confirms a completed visual review can be validated and counted against copied registers without mutating canonical public-launch evidence.',
}

await writeFile(repoPath(betaRawRegister), `${JSON.stringify(betaRegister, null, 2)}\n`)
await writeFile(repoPath(visualRawRegister), `${JSON.stringify(seededVisualRegister, null, 2)}\n`)
await writeFile(repoPath(`${betaSubmissionDir}/${betaReview.id}.json`), `${JSON.stringify(betaSubmission, null, 2)}\n`)
await writeFile(repoPath(`${visualSubmissionDir}/${visualReviewId}.json`), `${JSON.stringify(visualSubmission, null, 2)}\n`)

const betaResult = runIntake({
  script: 'scripts/platform-beta-human-review-intake.mjs',
  env: {
    QA_BETA_REVIEW_IMPORT: '1',
    QA_BETA_REVIEW_REGISTER: relativeDir(betaRawRegister),
    QA_BETA_REVIEW_SUBMISSION_DIR: relativeDir(betaSubmissionDir),
    QA_BETA_REVIEW_INTAKE_JSON: betaRawJson,
    QA_BETA_REVIEW_INTAKE_REPORT: betaRawReport,
  },
})
const visualResult = runIntake({
  script: 'scripts/platform-visual-review-intake.mjs',
  env: {
    QA_VISUAL_REVIEW_IMPORT: '1',
    QA_VISUAL_REVIEW_REGISTER: relativeDir(visualRawRegister),
    QA_VISUAL_REVIEW_SUBMISSION_DIR: relativeDir(visualSubmissionDir),
    QA_VISUAL_REVIEW_INTAKE_JSON: visualRawJson,
    QA_VISUAL_REVIEW_INTAKE_REPORT: visualRawReport,
  },
})

const betaRawSummary = await readJson(`qa/${betaRawJson}`).catch(() => null)
const visualRawSummary = await readJson(`qa/${visualRawJson}`).catch(() => null)
const tempBetaRegister = await readJson(betaRawRegister).catch(() => null)
const tempVisualRegister = await readJson(visualRawRegister).catch(() => null)
const canonicalBetaAfter = await readJson(betaRegisterPath)
const canonicalVisualAfter = await readJson(visualRegisterPath)
const tempBetaReview = tempBetaRegister?.plannedReviews?.find((review) => review.id === betaReview.id)
const tempVisualReview = tempVisualRegister?.reviewHistory?.find((review) => review.reviewSubmissionFile?.includes(visualReviewId))

const rawArtifacts = [
  rawDir,
  `qa/${betaRawJson}`,
  `qa/${betaRawReport}`,
  `qa/${visualRawJson}`,
  `qa/${visualRawReport}`,
]
await Promise.all(rawArtifacts.map((path) => rm(repoPath(path), { recursive: true, force: true })))
const rawArtifactsCleanedUp = !(await Promise.all(rawArtifacts.map((path) => fileExists(path))))
  .some(Boolean)

const canonicalBetaUnchanged = JSON.stringify(canonicalBetaAfter) === canonicalBetaBeforeSerialized
const canonicalVisualUnchanged = JSON.stringify(canonicalVisualAfter) === canonicalVisualBeforeSerialized
const checks = [
  {
    name: 'beta intake import succeeds against copied register',
    ok: betaResult.status === 0 &&
      betaRawSummary?.status === 'pass' &&
      betaRawSummary?.imported === true &&
      Number(betaRawSummary?.validSubmissionCount || 0) === 1 &&
      Number(betaRawSummary?.invalidSubmissionCount || 0) === 0,
    exitCode: betaResult.status,
    status: betaRawSummary?.status || null,
    imported: betaRawSummary?.imported ?? null,
    validSubmissionCount: betaRawSummary?.validSubmissionCount ?? null,
    invalidSubmissionCount: betaRawSummary?.invalidSubmissionCount ?? null,
  },
  {
    name: 'beta copied register records completed review evidence',
    ok: completedBetaCount(tempBetaRegister) === completedBetaCount(betaRegister) + 1 &&
      tempBetaReview?.status === 'passed' &&
      tempBetaReview?.reviewSubmissionFile?.includes(betaReview.id),
    completedBefore: completedBetaCount(betaRegister),
    completedAfter: completedBetaCount(tempBetaRegister),
    importedReviewId: tempBetaReview?.id || null,
    reviewSubmissionFile: tempBetaReview?.reviewSubmissionFile || null,
  },
  {
    name: 'visual intake import succeeds against copied register',
    ok: visualResult.status === 0 &&
      visualRawSummary?.status === 'pass' &&
      visualRawSummary?.imported === true &&
      Number(visualRawSummary?.validSubmissionCount || 0) === 1 &&
      Number(visualRawSummary?.invalidSubmissionCount || 0) === 0,
    exitCode: visualResult.status,
    status: visualRawSummary?.status || null,
    imported: visualRawSummary?.imported ?? null,
    validSubmissionCount: visualRawSummary?.validSubmissionCount ?? null,
    invalidSubmissionCount: visualRawSummary?.invalidSubmissionCount ?? null,
  },
  {
    name: 'visual copied register records completed history evidence',
    ok: visualHistoryCount(tempVisualRegister) === visualHistoryCount(visualRegister) + 1 &&
      tempVisualReview?.reviewedAt === visualReviewDate &&
      tempVisualReview?.productionCommit === visualDeployment.commit,
    historyBefore: visualHistoryCount(visualRegister),
    historyAfter: visualHistoryCount(tempVisualRegister),
    importedReviewedAt: tempVisualReview?.reviewedAt || null,
    importedProductionCommit: tempVisualReview?.productionCommit || null,
  },
  {
    name: 'review intake import rehearsal does not mutate canonical launch evidence',
    ok: canonicalBetaUnchanged &&
      canonicalVisualUnchanged &&
      completedBetaCount(canonicalBetaAfter) === completedBetaCount(betaRegister) &&
      visualHistoryCount(canonicalVisualAfter) === visualHistoryCount(visualRegister),
    canonicalBetaUnchanged,
    canonicalVisualUnchanged,
    canonicalBetaCompletedBefore: completedBetaCount(betaRegister),
    canonicalBetaCompletedAfter: completedBetaCount(canonicalBetaAfter),
    canonicalVisualHistoryBefore: visualHistoryCount(visualRegister),
    canonicalVisualHistoryAfter: visualHistoryCount(canonicalVisualAfter),
  },
  {
    name: 'review intake import rehearsal cleans up temporary registers and artifacts',
    ok: rawArtifactsCleanedUp,
    rawArtifactsCleanedUp,
  },
]

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  betaReviewId: betaReview.id,
  visualReviewId,
  visualReviewDate,
  visualSummaryArtifact: qaDisplayPath(latestVisualSummaryPath),
  betaIntakeExitCode: betaResult.status,
  betaIntakeStatus: betaRawSummary?.status || null,
  betaImported: betaRawSummary?.imported ?? null,
  betaValidSubmissionCount: betaRawSummary?.validSubmissionCount ?? null,
  betaInvalidSubmissionCount: betaRawSummary?.invalidSubmissionCount ?? null,
  tempBetaCompletedBefore: completedBetaCount(betaRegister),
  tempBetaCompletedAfter: completedBetaCount(tempBetaRegister),
  visualIntakeExitCode: visualResult.status,
  visualIntakeStatus: visualRawSummary?.status || null,
  visualImported: visualRawSummary?.imported ?? null,
  visualValidSubmissionCount: visualRawSummary?.validSubmissionCount ?? null,
  visualInvalidSubmissionCount: visualRawSummary?.invalidSubmissionCount ?? null,
  tempVisualHistoryBefore: visualHistoryCount(visualRegister),
  tempVisualHistoryAfter: visualHistoryCount(tempVisualRegister),
  canonicalBetaUnchanged,
  canonicalVisualUnchanged,
  canonicalBetaCompletedBefore: completedBetaCount(betaRegister),
  canonicalBetaCompletedAfter: completedBetaCount(canonicalBetaAfter),
  canonicalVisualHistoryBefore: visualHistoryCount(visualRegister),
  canonicalVisualHistoryAfter: visualHistoryCount(canonicalVisualAfter),
  rawArtifactsCleanedUp,
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
}

const report = `# Review Intake Import Rehearsal

Date: ${summary.date}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Beta intake imported into copied register: ${summary.betaImported ? 'yes' : 'no'}
- Beta copied-register completed reviews: ${summary.tempBetaCompletedBefore} -> ${summary.tempBetaCompletedAfter}
- Visual intake imported into copied register: ${summary.visualImported ? 'yes' : 'no'}
- Visual copied-register history count: ${summary.tempVisualHistoryBefore} -> ${summary.tempVisualHistoryAfter}
- Canonical beta register unchanged: ${summary.canonicalBetaUnchanged ? 'yes' : 'no'}
- Canonical visual register unchanged: ${summary.canonicalVisualUnchanged ? 'yes' : 'no'}
- Raw artifacts cleaned up: ${summary.rawArtifactsCleanedUp ? 'yes' : 'no'}

## Operating Meaning

This rehearsal proves valid completed beta and production visual-review evidence can be imported against isolated register copies without mutating canonical launch evidence. The real public launch remains blocked until actual reviewer submissions are collected and imported into the canonical registers.

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
