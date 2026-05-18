import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const ownerUserId = process.env.QA_OWNER_USER_ID || ''
const includePromptActuals = process.env.QA_SHARE_FIXTURE_INCLUDE_PROMPT_ACTUALS !== '0'
const allowRemote = process.env.QA_ALLOW_REMOTE_MUTATION === '1'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const failures = []
const results = []

if (!isLocalBaseUrl && !allowRemote) {
  console.error('qa:share-fixture-sweep creates disposable public trips and only runs against localhost unless QA_ALLOW_REMOTE_MUTATION=1 is set.')
  process.exit(1)
}

if (!ownerUserId) {
  console.error('QA_OWNER_USER_ID is required for qa:share-fixture-sweep.')
  process.exit(1)
}

const tmpDir = await mkdtemp(join(tmpdir(), 'globe-travel-share-fixtures-'))
const actualsPath = join(tmpDir, 'prompt-actuals.json')
let created = null
let cleanup = null

function parseJsonOutput(stdout) {
  const trimmed = stdout.trim()
  if (!trimmed) return null

  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.lastIndexOf('\n{')
    if (start === -1) return null
    try {
      return JSON.parse(trimmed.slice(start + 1))
    } catch {
      return null
    }
  }
}

function summarizeParsed(parsed) {
  if (!parsed || typeof parsed !== 'object') return {}

  return {
    checked: parsed.checked,
    passed: parsed.passed,
    failed: parsed.failed,
    exported: parsed.exported,
    actualsChecked: parsed.actualsChecked,
    fixtureCount: Array.isArray(parsed.fixtures) ? parsed.fixtures.length : undefined,
    shareSlugCount: Array.isArray(parsed.shareSlugs) ? parsed.shareSlugs.length : undefined,
    runId: parsed.runId,
    tripIds: Array.isArray(parsed.fixtures) ? parsed.fixtures.map((fixture) => fixture.tripId) : parsed.tripIds,
    shareSlugs: parsed.shareSlugs,
    tripsDeleted: parsed.tripsDeleted,
    placesDeleted: parsed.placesDeleted,
    missingCoverage: parsed.missingCoverage,
    cleanup: parsed.cleanup,
  }
}

function runTask({ name, command, args, env = {}, parseJson = true }) {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('close', (code) => {
      const parsed = parseJson ? parseJsonOutput(stdout) : null
      const result = {
        name,
        ok: code === 0,
        code,
        elapsedMs: Date.now() - startedAt,
        ...summarizeParsed(parsed),
      }

      if (!result.ok) {
        failures.push({
          ...result,
          stdout: stdout.trim().slice(-2000),
          stderr: stderr.trim().slice(-2000),
        })
      }

      results.push({ ...result, parsed })
      resolve({ ...result, parsed, stdout, stderr })
    })
  })
}

async function runNpmTask(name, script, env = {}) {
  return runTask({
    name,
    command: npmBin,
    args: ['run', script],
    env: { QA_BASE_URL: baseUrl, ...env },
  })
}

try {
  const createResult = await runNpmTask('create public share fixture set', 'qa:share-fixtures', {
    QA_OWNER_USER_ID: ownerUserId,
  })
  created = createResult.parsed

  if (!createResult.ok || !created?.shareSlugs?.length || !created?.promptSuiteShareMap) {
    throw new Error('share fixture creation did not return share slugs and prompt-suite map')
  }

  await runNpmTask('public share smoke across fixture set', 'qa:share', {
    QA_SHARE_SLUGS: created.shareSlugs.join(','),
  })

  if (includePromptActuals) {
    await runNpmTask('export prompt actuals from fixture set', 'qa:prompt-actuals', {
      QA_PROMPT_SUITE_SHARE_MAP: created.promptSuiteShareMap,
      QA_PROMPT_SUITE_ACTUALS_OUT: actualsPath,
    })

    await runNpmTask('prompt suite with fixture actuals', 'qa:prompt-suite', {
      QA_PROMPT_SUITE_ACTUALS: actualsPath,
    })
  }
} catch (error) {
  failures.push({
    name: 'public share fixture sweep orchestration',
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  if (created?.cleanupCommand && created?.fixtures?.length) {
    const tripIds = created.fixtures.map((fixture) => fixture.tripId).filter(Boolean)
    cleanup = (await runNpmTask('cleanup public share fixture set', 'qa:share-fixtures', {
      QA_CLEANUP_TRIP_IDS: tripIds.join(','),
      QA_CLEANUP_RUN_ID: created.runId || '',
    })).parsed
  }

  await rm(tmpDir, { recursive: true, force: true })
}

const summary = {
  baseUrl,
  ownerUserId,
  includePromptActuals,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  fixtureCount: created?.fixtures?.length || 0,
  shareSlugs: created?.shareSlugs || [],
  promptSuiteShareMap: created?.promptSuiteShareMap || null,
  cleanup,
  results: results.map((result) => {
    const clean = { ...result }
    delete clean.parsed
    return clean
  }),
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
