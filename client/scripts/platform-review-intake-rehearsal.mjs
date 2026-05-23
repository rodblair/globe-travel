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
await mkdir(repoPath(`${rawDir}/visual`), { recursive: true })

const betaRegisterBefore = await readJson(betaRegisterPath)
const visualRegisterBefore = await readJson(visualRegisterPath)
const betaTemplate = await readFile(repoPath(betaTemplatePath), 'utf8')
const visualTemplate = JSON.parse(await readFile(repoPath(visualTemplatePath), 'utf8'))
visualTemplate.reviewedAt = addDays(date, 1)
await writeFile(repoPath(`${rawDir}/beta/BETA-HR-001-athens.json`), betaTemplate)
await writeFile(repoPath(`${rawDir}/visual/PROD-VISUAL-HISTORY-002.json`), `${JSON.stringify(visualTemplate, null, 2)}\n`)

const betaRawJson = `review-intake-rehearsal-beta-raw-${date}.json`
const betaRawReport = `review-intake-rehearsal-beta-raw-${date}.md`
const visualRawJson = `review-intake-rehearsal-visual-raw-${date}.json`
const visualRawReport = `review-intake-rehearsal-visual-raw-${date}.md`

const betaResult = runIntake({
  script: 'scripts/platform-beta-human-review-intake.mjs',
  submissionDir: `${rawDir}/beta`,
  jsonName: betaRawJson,
  reportName: betaRawReport,
})
const visualResult = runIntake({
  script: 'scripts/platform-visual-review-intake.mjs',
  submissionDir: `${rawDir}/visual`,
  jsonName: visualRawJson,
  reportName: visualRawReport,
})

const betaRawSummary = await readJson(`qa/${betaRawJson}`).catch(() => null)
const visualRawSummary = await readJson(`qa/${visualRawJson}`).catch(() => null)
const betaRegisterAfter = await readJson(betaRegisterPath)
const visualRegisterAfter = await readJson(visualRegisterPath)
const betaInvalidIssues = (betaRawSummary?.submissions || []).flatMap((submission) => submission.issues || [])
const visualInvalidIssues = (visualRawSummary?.submissions || []).flatMap((submission) => submission.issues || [])

await Promise.all([
  rm(repoPath(rawDir), { recursive: true, force: true }),
  rm(repoPath(`qa/${betaRawJson}`), { force: true }),
  rm(repoPath(`qa/${betaRawReport}`), { force: true }),
  rm(repoPath(`qa/${visualRawJson}`), { force: true }),
  rm(repoPath(`qa/${visualRawReport}`), { force: true }),
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
  visualIntakeExitCode: visualResult.status,
  betaInvalidSubmissionCount: betaRawSummary?.invalidSubmissionCount ?? null,
  visualInvalidSubmissionCount: visualRawSummary?.invalidSubmissionCount ?? null,
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
- Visual intake exit code: ${summary.visualIntakeExitCode}
- Beta invalid submissions: ${summary.betaInvalidSubmissionCount ?? 0}
- Visual invalid submissions: ${summary.visualInvalidSubmissionCount ?? 0}
- Raw artifacts cleaned up: ${summary.rawArtifactsCleanedUp ? 'yes' : 'no'}

## Operating Meaning

This rehearsal copies beta and visual-review templates into non-template submission files and proves the intake commands reject them as incomplete evidence. It also confirms the canonical beta register and production visual-review history stay unchanged.

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
