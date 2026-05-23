import { spawnSync } from 'node:child_process'
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const date = process.env.QA_PUBLIC_LAUNCH_THRESHOLD_REHEARSAL_DATE || currentQaDate()
const artifactName = process.env.QA_PUBLIC_LAUNCH_THRESHOLD_REHEARSAL_ARTIFACT_NAME ||
  `public-launch-threshold-rehearsal-${date}`
const rawDir = `qa/${artifactName}-raw`
const betaRegisterPath = process.env.QA_BETA_REVIEW_REGISTER || 'qa/beta-human-review-register.json'
const betaPacketManifestPath = process.env.QA_BETA_REVIEW_PACKET_MANIFEST ||
  'qa/beta-human-review-packet-manifest-2026-05-21.json'
const visualRegisterPath = process.env.QA_VISUAL_REVIEW_REGISTER || 'qa/production-visual-review-register.json'
const visualSummaryPath = process.env.QA_PUBLIC_LAUNCH_THRESHOLD_REHEARSAL_VISUAL_SUMMARY ||
  'qa/visual-baseline-production-runtime-current-2026-05-22-e629404/summary.json'
const rehearsalToday = process.env.QA_PUBLIC_LAUNCH_THRESHOLD_REHEARSAL_TODAY ||
  new Date().toISOString().slice(0, 10)

const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])
const betaProgressRawJson = `public-launch-threshold-rehearsal-beta-progress-raw-${date}.json`
const betaProgressRawReport = `public-launch-threshold-rehearsal-beta-progress-raw-${date}.md`
const visualProgressRawJson = `public-launch-threshold-rehearsal-visual-progress-raw-${date}.json`
const visualProgressRawReport = `public-launch-threshold-rehearsal-visual-progress-raw-${date}.md`

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

function viewportForDevice(device) {
  return device === 'desktop' ? '1440x950' : '390x844'
}

function completedBetaCount(register) {
  return Array.isArray(register?.plannedReviews)
    ? register.plannedReviews.filter((review) => completedStatuses.has(review.status)).length
    : 0
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function visualHistoryDates(register) {
  return unique((Array.isArray(register?.reviewHistory) ? register.reviewHistory : [])
    .map((review) => String(review.reviewedAt || '').slice(0, 10)))
}

function visualArtifactFromSummaryPath(summaryPath) {
  return qaDisplayPath(summaryPath).replace(/\/summary\.json$/, '')
}

function runNode(script, env) {
  return spawnSync(process.execPath, [script], {
    cwd: clientRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...env,
    },
  })
}

await rm(repoPath(rawDir), { recursive: true, force: true })
await mkdir(repoPath(rawDir), { recursive: true })

const betaRegister = await readJson(betaRegisterPath)
const betaPacketManifest = await readJson(betaPacketManifestPath)
const visualRegister = await readJson(visualRegisterPath)
const visualSummary = await readJson(visualSummaryPath)
const canonicalBetaBeforeSerialized = JSON.stringify(betaRegister)
const canonicalVisualBeforeSerialized = JSON.stringify(visualRegister)
const packetById = new Map((Array.isArray(betaPacketManifest.packets) ? betaPacketManifest.packets : [])
  .map((packet) => [packet.id, packet]))
const visualDeployment = visualSummary.deployment || {}
const visualArtifact = visualArtifactFromSummaryPath(visualSummaryPath)

if (!visualDeployment.commit || !visualDeployment.url) {
  throw new Error(`visual summary ${visualSummaryPath} is missing deployment metadata`)
}

const completedBetaRegister = {
  ...betaRegister,
  reviewedAt: date,
  plannedReviews: (Array.isArray(betaRegister.plannedReviews) ? betaRegister.plannedReviews : []).map((review, index) => {
    const packet = packetById.get(review.id) || {}
    return {
      ...review,
      status: 'passed',
      reviewerRole: `threshold rehearsal reviewer ${String(index + 1).padStart(2, '0')}`,
      routeOrShareUrl: packet.startUrl || 'https://globe-travel-two.vercel.app/chat',
      viewport: packet.viewport || viewportForDevice(review.device),
      completedAt: date,
      firstMinuteOutcome: 'The assigned reviewer could understand the trip goal, route, and first action without launch-blocking confusion.',
      mapTrustNotes: 'The mapped itinerary and day structure were coherent enough to trust for public-launch threshold rehearsal purposes.',
      shareFeedbackOutcome: 'The share and feedback path was understandable for the assigned reviewer cohort.',
      scorecard: {
        firstMinuteClarity: 5,
        itineraryUsefulness: 5,
        mapTrust: 5,
        editAndSwapConfidence: 4,
        saveReopenConfidence: 5,
        shareRecipientClarity: 5,
        feedbackLoopClarity: 5,
        mobileUsability: review.device === 'phone' ? 5 : 4,
        paidValueCredibility: 4,
      },
      findings: [
        {
          severity: 'P3',
          status: 'closed',
          surface: 'public-launch-threshold-rehearsal',
          title: 'No launch-blocking issue in simulated beta threshold evidence',
          notes: 'Synthetic completed review exists only in a copied register to prove threshold gate behavior.',
        },
      ],
      reviewSubmissionFile: `qa/public-launch-threshold-rehearsal/${review.id}.json`,
    }
  }),
}

const visualHistory = Array.isArray(visualRegister.reviewHistory) ? visualRegister.reviewHistory : []
const additionalVisualDates = ['2026-05-20', rehearsalToday]
  .filter((reviewDate) => !visualHistory.some((review) => String(review.reviewedAt || '').startsWith(reviewDate)))
  .slice(0, Math.max(0, 4 - visualHistoryDates(visualRegister).length))
const completedVisualReviews = additionalVisualDates.map((reviewDate, index) => ({
  reviewedAt: reviewDate,
  artifact: visualArtifact,
  summaryArtifact: qaDisplayPath(visualSummaryPath),
  productionCommit: visualDeployment.commit,
  deploymentUrl: visualDeployment.url,
  reviewedBy: `Codex visual threshold rehearsal ${index + 1}`,
  verdict: 'pass',
  blockingFindings: [],
  screenshotsReviewed: 25,
  routesReviewed: ['landing', 'pricing', 'login', 'signup', 'public-share'],
  viewportsReviewed: ['phone', 'tablet', 'laptop', 'desktop', 'wide'],
  diffRoutesReviewed: ['landing', 'login', 'signup'],
  notes: 'Synthetic visual history entry exists only in a copied register to prove public-launch threshold behavior with current production visual evidence.',
}))
const completedVisualRegister = {
  ...visualRegister,
  reviewedAt: date,
  latestProductionReview: completedVisualReviews.at(-1) || visualRegister.latestProductionReview,
  reviewHistory: [
    ...visualHistory,
    ...completedVisualReviews,
  ],
  scheduledPublicLaunchReviews: [],
  nextReviewDueAt: null,
}

const betaRawRegister = `${rawDir}/beta-register.json`
const visualRawRegister = `${rawDir}/visual-register.json`
await writeFile(repoPath(betaRawRegister), `${JSON.stringify(completedBetaRegister, null, 2)}\n`)
await writeFile(repoPath(visualRawRegister), `${JSON.stringify(completedVisualRegister, null, 2)}\n`)

const betaProgressResult = runNode('scripts/platform-beta-human-review-progress.mjs', {
  QA_BETA_REVIEW_REGISTER: `../${qaDisplayPath(betaRawRegister)}`,
  QA_BETA_REVIEW_PROGRESS_REQUIRE_PUBLIC: '1',
  QA_BETA_REVIEW_PROGRESS_JSON: betaProgressRawJson,
  QA_BETA_REVIEW_PROGRESS_REPORT: betaProgressRawReport,
})
const visualProgressResult = runNode('scripts/platform-visual-review-progress.mjs', {
  QA_VISUAL_REVIEW_REGISTER: qaDisplayPath(visualRawRegister),
  QA_VISUAL_REVIEW_PROGRESS_REQUIRE_PUBLIC: '1',
  QA_VISUAL_REVIEW_PROGRESS_JSON: visualProgressRawJson,
  QA_VISUAL_REVIEW_PROGRESS_REPORT: visualProgressRawReport,
  QA_VISUAL_REVIEW_TODAY: rehearsalToday,
})

const betaProgress = await readJson(`qa/${betaProgressRawJson}`).catch(() => null)
const visualProgress = await readJson(`qa/${visualProgressRawJson}`).catch(() => null)
const canonicalBetaAfter = await readJson(betaRegisterPath)
const canonicalVisualAfter = await readJson(visualRegisterPath)

const rawArtifacts = [
  rawDir,
  `qa/${betaProgressRawJson}`,
  `qa/${betaProgressRawReport}`,
  `qa/${visualProgressRawJson}`,
  `qa/${visualProgressRawReport}`,
]
await Promise.all(rawArtifacts.map((path) => rm(repoPath(path), { recursive: true, force: true })))
const rawArtifactsCleanedUp = !(await Promise.all(rawArtifacts.map((path) => fileExists(path))))
  .some(Boolean)

const canonicalBetaUnchanged = JSON.stringify(canonicalBetaAfter) === canonicalBetaBeforeSerialized
const canonicalVisualUnchanged = JSON.stringify(canonicalVisualAfter) === canonicalVisualBeforeSerialized
const checks = [
  {
    name: 'simulated beta register reaches public-launch review threshold',
    ok: betaProgressResult.status === 0 &&
      betaProgress?.status === 'pass' &&
      betaProgress?.requirePublicProgress === true &&
      Number(betaProgress?.completedReviewCount || 0) >= Number(betaProgress?.publicLaunchMinimum || 25) &&
      Number(betaProgress?.remainingReviewsForMinimum || 0) === 0 &&
      betaProgress?.publicLaunchReadiness?.status === 'ready',
    exitCode: betaProgressResult.status,
    status: betaProgress?.status || null,
    completedReviewCount: betaProgress?.completedReviewCount ?? null,
    publicLaunchMinimum: betaProgress?.publicLaunchMinimum ?? null,
    remainingReviewsForMinimum: betaProgress?.remainingReviewsForMinimum ?? null,
    publicLaunchReadiness: betaProgress?.publicLaunchReadiness?.status || null,
  },
  {
    name: 'simulated beta threshold covers required completed-review matrix',
    ok: Object.values(betaProgress?.completedCoverage?.gaps || {}).every((items) => Array.isArray(items) && items.length === 0) &&
      Number(betaProgress?.completedReviewEvidenceGapCount || 0) === 0 &&
      Number(betaProgress?.unresolvedBlockingFindingCount || 0) === 0,
    completedCoverageGaps: betaProgress?.completedCoverage?.gaps || null,
    completedReviewEvidenceGapCount: betaProgress?.completedReviewEvidenceGapCount ?? null,
    unresolvedBlockingFindingCount: betaProgress?.unresolvedBlockingFindingCount ?? null,
  },
  {
    name: 'simulated visual register reaches public-launch history threshold',
    ok: visualProgressResult.status === 0 &&
      visualProgress?.status === 'pass' &&
      visualProgress?.requirePublicProgress === true &&
      Number(visualProgress?.distinctHistoryDateCount || 0) >= Number(visualProgress?.minimumPublicLaunchReviewHistory || 4) &&
      Number(visualProgress?.remainingRequiredReviewDates || 0) === 0 &&
      visualProgress?.publicLaunchReadiness?.status === 'ready',
    exitCode: visualProgressResult.status,
    status: visualProgress?.status || null,
    distinctHistoryDateCount: visualProgress?.distinctHistoryDateCount ?? null,
    minimumPublicLaunchReviewHistory: visualProgress?.minimumPublicLaunchReviewHistory ?? null,
    remainingRequiredReviewDates: visualProgress?.remainingRequiredReviewDates ?? null,
    publicLaunchReadiness: visualProgress?.publicLaunchReadiness?.status || null,
  },
  {
    name: 'simulated visual threshold has valid distinct history and no overdue queue',
    ok: Number(visualProgress?.invalidHistoryReviewCount || 0) === 0 &&
      Array.isArray(visualProgress?.duplicateHistoryDates) &&
      visualProgress.duplicateHistoryDates.length === 0 &&
      Number(visualProgress?.overdueScheduledReviewCount || 0) === 0,
    invalidHistoryReviewCount: visualProgress?.invalidHistoryReviewCount ?? null,
    duplicateHistoryDates: visualProgress?.duplicateHistoryDates || null,
    overdueScheduledReviewCount: visualProgress?.overdueScheduledReviewCount ?? null,
  },
  {
    name: 'public launch threshold rehearsal does not mutate canonical launch evidence',
    ok: canonicalBetaUnchanged &&
      canonicalVisualUnchanged &&
      completedBetaCount(canonicalBetaAfter) === completedBetaCount(betaRegister) &&
      visualHistoryDates(canonicalVisualAfter).length === visualHistoryDates(visualRegister).length,
    canonicalBetaUnchanged,
    canonicalVisualUnchanged,
    canonicalBetaCompletedBefore: completedBetaCount(betaRegister),
    canonicalBetaCompletedAfter: completedBetaCount(canonicalBetaAfter),
    canonicalVisualHistoryBefore: visualHistoryDates(visualRegister).length,
    canonicalVisualHistoryAfter: visualHistoryDates(canonicalVisualAfter).length,
  },
  {
    name: 'public launch threshold rehearsal cleans up temporary threshold artifacts',
    ok: rawArtifactsCleanedUp,
    rawArtifactsCleanedUp,
  },
]

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  rehearsalToday,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  simulatedBetaCompletedReviewCount: betaProgress?.completedReviewCount ?? null,
  simulatedBetaPublicLaunchMinimum: betaProgress?.publicLaunchMinimum ?? null,
  simulatedBetaRemainingReviewsForMinimum: betaProgress?.remainingReviewsForMinimum ?? null,
  simulatedBetaPublicLaunchReadiness: betaProgress?.publicLaunchReadiness?.status || null,
  simulatedVisualDistinctHistoryDateCount: visualProgress?.distinctHistoryDateCount ?? null,
  simulatedVisualMinimumHistoryDateCount: visualProgress?.minimumPublicLaunchReviewHistory ?? null,
  simulatedVisualRemainingHistoryDateCount: visualProgress?.remainingRequiredReviewDates ?? null,
  simulatedVisualPublicLaunchReadiness: visualProgress?.publicLaunchReadiness?.status || null,
  canonicalBetaUnchanged,
  canonicalVisualUnchanged,
  canonicalBetaCompletedBefore: completedBetaCount(betaRegister),
  canonicalBetaCompletedAfter: completedBetaCount(canonicalBetaAfter),
  canonicalVisualHistoryBefore: visualHistoryDates(visualRegister).length,
  canonicalVisualHistoryAfter: visualHistoryDates(canonicalVisualAfter).length,
  rawArtifactsCleanedUp,
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
}

const report = `# Public Launch Threshold Rehearsal

Date: ${summary.date}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Simulated beta completed reviews: ${summary.simulatedBetaCompletedReviewCount}/${summary.simulatedBetaPublicLaunchMinimum}
- Simulated beta remaining reviews: ${summary.simulatedBetaRemainingReviewsForMinimum}
- Simulated beta launch readiness: ${summary.simulatedBetaPublicLaunchReadiness}
- Simulated visual history dates: ${summary.simulatedVisualDistinctHistoryDateCount}/${summary.simulatedVisualMinimumHistoryDateCount}
- Simulated visual remaining dates: ${summary.simulatedVisualRemainingHistoryDateCount}
- Simulated visual launch readiness: ${summary.simulatedVisualPublicLaunchReadiness}
- Canonical beta register unchanged: ${summary.canonicalBetaUnchanged ? 'yes' : 'no'}
- Canonical visual register unchanged: ${summary.canonicalVisualUnchanged ? 'yes' : 'no'}
- Raw artifacts cleaned up: ${summary.rawArtifactsCleanedUp ? 'yes' : 'no'}

## Operating Meaning

This rehearsal proves the two real public-launch threshold gates turn ready when copied beta and production visual-review registers contain complete, valid launch evidence. It does not count synthetic evidence toward the canonical public launch.

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
