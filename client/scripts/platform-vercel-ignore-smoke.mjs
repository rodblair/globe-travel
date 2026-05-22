import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const clientDir = resolve(scriptDir, '..')
const repoRoot = resolve(clientDir, '..')
const requestedDate = process.env.QA_VERCEL_IGNORE_DATE || ''
const artifactName = process.env.QA_VERCEL_IGNORE_ARTIFACT_NAME || `vercel-ignore-smoke-${requestedDate || currentUtcDate()}`

const cases = [
  {
    id: 'qa-only-probe-skips',
    intent: 'QA evidence-only probe commit skips Vercel production build.',
    previous: '60a565a9566c28c48c03407204e93a278389466a',
    head: '5a9e78c5f1d34ee7c02018236f3e275fb3355176',
    expectedExitCode: 0,
    expectedText: 'Skipping build',
  },
  {
    id: 'workflow-and-ignore-policy-skips',
    intent: 'Release-ops workflow and ignore-policy commit stays skip-safe.',
    previous: '9398486fb6971d1e48175602706dbc809064c889',
    head: '06eb269ac896ccb4204607ae4e2348079f393309',
    expectedExitCode: 0,
    expectedText: 'Skipping build',
  },
  {
    id: 'current-release-ops-scripts-skip',
    intent: 'Current release-ops QA script and evidence updates skip Vercel production build.',
    previous: '72159cb26f38f0b2ebe23f35b42658ea5321075a',
    head: 'd791e8f2a710172426b4be1d4eebacf14447e8d0',
    expectedExitCode: 0,
    expectedText: 'Skipping build',
  },
  {
    id: 'runtime-billing-builds',
    intent: 'Known runtime billing change still continues Vercel production build.',
    previous: '0bf1e7402b360e29fd73398e8caebbaa9ec745bb',
    head: 'ec53a97b15ccb8a4e8a854b79a22d69f321a8cbc',
    expectedExitCode: 1,
    expectedText: 'Continuing build',
  },
]

function currentUtcDate() {
  return new Date().toISOString().slice(0, 10)
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function commitExists(sha) {
  try {
    execFileSync('git', ['rev-parse', '--verify', `${sha}^{commit}`], {
      cwd: repoRoot,
      stdio: ['ignore', 'ignore', 'ignore'],
    })
    return true
  } catch {
    return false
  }
}

function changedFiles(previous, head) {
  return execFileSync('git', ['diff', '--name-only', '--diff-filter=ACMRT', previous, head], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim().split('\n').map((file) => file.trim()).filter(Boolean)
}

function runCase(testCase) {
  const missingCommits = [testCase.previous, testCase.head].filter((sha) => !commitExists(sha))
  if (missingCommits.length > 0) {
    return {
      ...testCase,
      ok: false,
      exitCode: null,
      stdout: '',
      stderr: '',
      changedFiles: [],
      issues: [`missing commit(s): ${missingCommits.join(', ')}`],
    }
  }

  const result = spawnSync('node', ['scripts/vercel-ignore-build.mjs'], {
    cwd: clientDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      VERCEL_GIT_PREVIOUS_SHA: testCase.previous,
      VERCEL_GIT_COMMIT_SHA: testCase.head,
    },
  })
  const stdout = String(result.stdout || '').trim()
  const stderr = String(result.stderr || '').trim()
  const output = `${stdout}\n${stderr}`.trim()
  const files = changedFiles(testCase.previous, testCase.head)
  const issues = [
    ...(result.status === testCase.expectedExitCode ? [] : [`expected exit ${testCase.expectedExitCode}, got ${result.status}`]),
    ...(output.includes(testCase.expectedText) ? [] : [`missing output marker: ${testCase.expectedText}`]),
    ...(files.length > 0 ? [] : ['no changed files found for fixture commit range']),
  ]

  return {
    ...testCase,
    ok: issues.length === 0,
    exitCode: result.status,
    stdout,
    stderr,
    changedFiles: files,
    issues,
  }
}

const results = cases.map(runCase)
const failures = results.filter((result) => !result.ok)
const safeSkipCount = results.filter((result) => result.expectedExitCode === 0 && result.ok).length
const runtimeBuildCount = results.filter((result) => result.expectedExitCode === 1 && result.ok).length
const summary = {
  date: requestedDate || currentUtcDate(),
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  safeSkipCount,
  runtimeBuildCount,
  jsonArtifact: `qa/${artifactName}.json`,
  reportArtifact: `qa/${artifactName}.md`,
  results,
  failures,
}

const report = `# Vercel Ignore Smoke

Date: ${summary.date}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Safe skip cases: ${summary.safeSkipCount}
- Runtime build cases: ${summary.runtimeBuildCount}

## Cases

${results.map((result) => `- ${result.ok ? 'Pass' : 'Fail'}: ${result.id} - ${result.intent}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => `${failure.id}: ${failure.issues.join('; ')}`))}

## Operating Meaning

This smoke proves release evidence, workflow, and QA-script-only commits remain safe to skip in Vercel while a known runtime application change still forces a production build. It protects production deployment hygiene without weakening runtime deploy coverage.
`

await mkdir(resolve(repoRoot, 'qa'), { recursive: true })
await writeFile(resolve(repoRoot, `${summary.jsonArtifact}`), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(repoRoot, `${summary.reportArtifact}`), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
