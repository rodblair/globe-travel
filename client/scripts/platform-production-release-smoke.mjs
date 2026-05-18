import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const baseUrl = (process.env.QA_BASE_URL || 'https://globe-travel-two.vercel.app').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG || 'x3m2c8cnws'
const shareMap = process.env.QA_PROMPT_SUITE_SHARE_MAP || `athens-5-day-couples-rest=${shareSlug}`
const includePromptActuals = process.env.QA_INCLUDE_PROMPT_ACTUALS !== '0'
const includeFeedbackMutation = process.env.QA_INCLUDE_FEEDBACK_MUTATION === '1'

const tmpDir = await mkdtemp(join(tmpdir(), 'globe-travel-release-'))
const actualsPath = join(tmpDir, 'prompt-actuals.json')
const failures = []
const results = []

function runNodeTask({ name, args, env = {}, mutatesProduction = false, echoOutput = true }) {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''

    console.log(`\n--- ${name}${mutatesProduction ? ' (mutating)' : ''} ---`)

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString()
      stdout += text
      if (echoOutput) process.stdout.write(text)
    })
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString()
      stderr += text
      if (echoOutput) process.stderr.write(text)
    })
    child.on('close', (code) => {
      let parsed = null
      try {
        parsed = JSON.parse(stdout)
      } catch {
        // Not all tasks emit pure JSON.
      }
      const result = {
        name,
        ok: code === 0,
        code,
        elapsedMs: Date.now() - startedAt,
        mutatesProduction,
      }
      if (!echoOutput && parsed) {
        console.log(JSON.stringify({
          checked: parsed.checked,
          passed: parsed.passed,
          failed: parsed.failed,
          exported: parsed.exported,
          actualsChecked: parsed.actualsChecked,
          shareSlug: parsed.shareSlug,
          ids: parsed.ids,
          cleanup: parsed.cleanup,
          missingCoverage: parsed.missingCoverage,
        }, null, 2))
      } else if (!echoOutput && stdout.trim()) {
        console.log(stdout.trim().split('\n').slice(-12).join('\n'))
      }
      if (code !== 0) {
        failures.push({
          ...result,
          stderr: stderr.trim().slice(-2000),
          stdout: stdout.trim().slice(-2000),
        })
      }
      results.push(result)
      resolve(result)
    })
  })
}

const tasks = [
  {
    name: 'production ops',
    args: ['scripts/platform-ops-smoke.mjs'],
    env: {
      QA_BASE_URL: baseUrl,
      QA_REQUIRE_PRODUCTION_METADATA: '1',
    },
  },
  {
    name: 'production smoke',
    args: ['scripts/platform-smoke.mjs'],
    env: {
      QA_BASE_URL: baseUrl,
      QA_SHARE_SLUG: shareSlug,
    },
  },
  {
    name: 'production auth and guest access',
    args: ['scripts/platform-auth-access-smoke.mjs'],
    env: {
      QA_BASE_URL: baseUrl,
      QA_SHARE_SLUG: shareSlug,
    },
    echoOutput: false,
  },
  {
    name: 'production commercial',
    args: ['scripts/platform-commercial-smoke.mjs'],
    env: {
      QA_BASE_URL: baseUrl,
      QA_SHARE_SLUG: shareSlug,
    },
  },
  {
    name: 'production share',
    args: ['scripts/platform-share-smoke.mjs'],
    env: {
      QA_BASE_URL: baseUrl,
      QA_SHARE_SLUG: shareSlug,
    },
  },
]

if (includePromptActuals) {
  tasks.push(
    {
      name: 'production prompt actuals export',
      args: ['scripts/planner-share-actuals.mjs'],
      env: {
        QA_BASE_URL: baseUrl,
        QA_PROMPT_SUITE_SHARE_MAP: shareMap,
        QA_PROMPT_SUITE_ACTUALS_OUT: actualsPath,
      },
      echoOutput: false,
    },
    {
      name: 'prompt suite with production actuals',
      args: [
        '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
        '--experimental-strip-types',
        'scripts/planner-prompt-suite.mjs',
      ],
      env: {
        QA_PROMPT_SUITE_ACTUALS: actualsPath,
      },
      echoOutput: false,
    }
  )
}

if (includeFeedbackMutation) {
  tasks.push({
    name: 'production share feedback mutation',
    args: ['scripts/platform-share-feedback-smoke.mjs'],
    env: {
      QA_BASE_URL: baseUrl,
      QA_SHARE_SLUG: shareSlug,
    },
    mutatesProduction: true,
  })
}

for (const task of tasks) {
  await runNodeTask(task)
}

let actuals = null
try {
  actuals = JSON.parse(await readFile(actualsPath, 'utf8'))
} catch {
  // Prompt actuals are optional and may be disabled.
}

await rm(tmpDir, { recursive: true, force: true })

const summary = {
  baseUrl,
  shareSlug,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  includePromptActuals,
  includeFeedbackMutation,
  promptActualIds: Array.isArray(actuals) ? actuals.map((actual) => actual.id) : [],
  results,
  failures,
}

console.log('\n--- production release summary ---')
console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
