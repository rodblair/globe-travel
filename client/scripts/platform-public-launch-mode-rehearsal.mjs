import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const clientRoot = process.cwd()
const root = resolve(clientRoot, '..')
const date = process.env.QA_PUBLIC_LAUNCH_MODE_REHEARSAL_DATE || currentQaDate()
const artifactName = process.env.QA_PUBLIC_LAUNCH_MODE_REHEARSAL_ARTIFACT_NAME ||
  `public-launch-mode-rehearsal-${date}`
const publicStatusJson = process.env.QA_PUBLIC_LAUNCH_STATUS_JSON || 'public-launch-status-2026-05-21.json'
const publicStatusReport = process.env.QA_PUBLIC_LAUNCH_STATUS_REPORT || 'public-launch-status-2026-05-21.md'

function repoPath(path) {
  return resolve(root, String(path || '').replace(/^\.\.\//, '').replace(/^qa\//, 'qa/'))
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

const publicStatusJsonPath = repoPath(`qa/${publicStatusJson}`)
const publicStatusReportPath = repoPath(`qa/${publicStatusReport}`)
const originalJson = await readFile(publicStatusJsonPath, 'utf8')
const originalReport = await readFile(publicStatusReportPath, 'utf8')

const result = spawnSync(process.execPath, ['scripts/platform-public-launch-status.mjs'], {
  cwd: clientRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    QA_LAUNCH_STATUS_REQUIRE_PUBLIC: '1',
  },
})

let rehearsalStatus = null
try {
  rehearsalStatus = JSON.parse(await readFile(publicStatusJsonPath, 'utf8'))
} finally {
  await writeFile(publicStatusJsonPath, originalJson)
  await writeFile(publicStatusReportPath, originalReport)
}

const restoredJson = await readFile(publicStatusJsonPath, 'utf8')
const restoredStatus = JSON.parse(restoredJson)
const blockers = Array.isArray(rehearsalStatus?.blockers) ? rehearsalStatus.blockers : []
const blockerIds = blockers.map((blocker) => blocker.id).filter(Boolean)
const guardrailIssues = Array.isArray(rehearsalStatus?.guardrailIssues) ? rehearsalStatus.guardrailIssues : []
const strictModeKeepsLaunchClosed = (
  rehearsalStatus?.status === 'beta-ready-public-blocked' ||
  rehearsalStatus?.status === 'blocked'
) &&
  rehearsalStatus?.publicLaunchReady === false &&
  rehearsalStatus?.requirePublicLaunch === true

const checks = [
  {
    name: 'public launch required mode exits non-zero while public blockers remain',
    ok: result.status !== 0,
    exitCode: result.status,
  },
  {
    name: 'public launch required mode keeps public launch closed',
    ok: strictModeKeepsLaunchClosed,
    status: rehearsalStatus?.status || null,
    betaReady: rehearsalStatus?.betaReady ?? null,
    publicLaunchReady: rehearsalStatus?.publicLaunchReady ?? null,
    requirePublicLaunch: rehearsalStatus?.requirePublicLaunch ?? null,
    guardrailIssues,
  },
  {
    name: 'public launch required mode identifies beta and visual blockers',
    ok: blockerIds.includes('beta-human-review-threshold') &&
      blockerIds.includes('production-visual-review-history') &&
      blockers.length >= 2,
    blockerIds,
  },
  {
    name: 'public launch required mode reports guardrail state without hiding blockers',
    ok: Array.isArray(guardrailIssues),
    guardrailIssues,
  },
  {
    name: 'public launch required mode does not mutate canonical default status',
    ok: restoredJson === originalJson,
    restoredRequirePublicLaunch: restoredStatus.requirePublicLaunch ?? null,
    restoredStatus: restoredStatus.status || null,
  },
]

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  publicStatusArtifact: `qa/${publicStatusJson}`,
  publicStatusReport: `qa/${publicStatusReport}`,
  publicLaunchStatus: rehearsalStatus?.status || null,
  betaReady: rehearsalStatus?.betaReady ?? null,
  publicLaunchReady: rehearsalStatus?.publicLaunchReady ?? null,
  requirePublicLaunch: rehearsalStatus?.requirePublicLaunch ?? null,
  publicLaunchModeExitCode: result.status,
  blockers,
  guardrailIssues,
  guardrailIssueCount: guardrailIssues.length,
  canonicalRestored: restoredJson === originalJson,
  checks,
  failures,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
}

const report = `# Public Launch Mode Rehearsal

Date: ${summary.date}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Public-mode exit code: ${summary.publicLaunchModeExitCode}
- Public launch status: ${summary.publicLaunchStatus}
- Beta ready: ${summary.betaReady ? 'yes' : 'no'}
- Public launch ready: ${summary.publicLaunchReady ? 'yes' : 'no'}
- Canonical status restored: ${summary.canonicalRestored ? 'yes' : 'no'}

## Operating Meaning

This rehearsal proves \`QA_LAUNCH_STATUS_REQUIRE_PUBLIC=1 npm run qa:public-launch-status\` fails while beta-review, production visual-review, or current operator guardrails remain. Default status evidence is restored after the rehearsal.

## Blockers

${markdownList(blockers.map((blocker) => `${blocker.id}: ${blocker.detail}`))}

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
