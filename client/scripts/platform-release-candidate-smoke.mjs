import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG || 'x3m2c8cnws'
const date = process.env.QA_RELEASE_DATE || new Date().toISOString().slice(0, 10)
const artifactName = process.env.QA_RELEASE_ARTIFACT_NAME || `release-candidate-${date}`
const repoRoot = resolve(process.cwd(), '..')
const artifactDir = resolve(repoRoot, 'qa', artifactName)
const summaryPath = resolve(artifactDir, 'summary.json')
const reportPath = resolve(artifactDir, 'README.md')
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const includeVisual = process.env.QA_RELEASE_INCLUDE_VISUAL !== '0'
const includeStudioFixture = process.env.QA_RELEASE_INCLUDE_STUDIO !== '0'
const includeShareFeedback = process.env.QA_RELEASE_INCLUDE_SHARE_FEEDBACK !== '0'
const includeShareFixtureSweep =
  process.env.QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP === '1' ||
  (
    process.env.QA_RELEASE_INCLUDE_SHARE_FIXTURE_SWEEP !== '0' &&
    isLocalBaseUrl &&
    Boolean(process.env.QA_OWNER_USER_ID)
  )
const includeOwnerFeedback = process.env.QA_RELEASE_INCLUDE_OWNER_FEEDBACK !== '0'
const includeStripeCheckout = process.env.QA_RELEASE_INCLUDE_STRIPE_CHECKOUT === '1'
const includeStripePortal = process.env.QA_RELEASE_INCLUDE_STRIPE_PORTAL === '1'
const includePromptSuite = process.env.QA_RELEASE_INCLUDE_PROMPT_SUITE !== '0'
const includeSlowNetwork = process.env.QA_RELEASE_INCLUDE_SLOW_NETWORK !== '0'
const visualRunId = process.env.QA_VISUAL_RUN_ID || `release-candidate-${new Date().toISOString().slice(0, 10)}`
const shareFixtureOwnerUserId = process.env.QA_OWNER_USER_ID || randomUUID()
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const failures = []
const results = []
let studioFixture = null

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
    baseUrl: parsed.baseUrl,
    shareSlug: parsed.shareSlug,
    tripId: parsed.tripId || parsed.fixture?.tripId,
    guestId: parsed.guestId || parsed.auth?.guestId,
    runId: parsed.runId,
    tripDeleted: parsed.tripDeleted,
    placesDeleted: parsed.placesDeleted,
    guestProfileDeleted: parsed.guestProfileDeleted,
    guestUserDeleted: parsed.guestUserDeleted,
    auth: parsed.auth
      ? {
        mode: parsed.auth.mode,
        protectedRoutes: parsed.auth.protectedRoutes,
        externalGuestId: parsed.auth.externalGuestId,
        cleanup: parsed.auth.cleanup,
      }
      : undefined,
    cleanup: parsed.cleanup,
  }
}

function runTask({ name, command, args, env = {}, parseJson = false, echoOutput = false, mutatesLocal = false }) {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''

    console.log(`\n--- ${name}${mutatesLocal ? ' (local mutation)' : ''} ---`)

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
      const parsed = parseJson ? parseJsonOutput(stdout) : null
      const result = {
        name,
        ok: code === 0,
        code,
        elapsedMs: Date.now() - startedAt,
        mutatesLocal,
        ...summarizeParsed(parsed),
      }

      if (!echoOutput) {
        if (parsed) {
          console.log(JSON.stringify(summarizeParsed(parsed), null, 2))
        } else if (stdout.trim()) {
          console.log(stdout.trim().split('\n').slice(-12).join('\n'))
        }
        if (stderr.trim()) {
          console.error(stderr.trim().split('\n').slice(-12).join('\n'))
        }
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

async function runNodeTask(name, script, env = {}, options = {}) {
  return runTask({
    name,
    command: process.execPath,
    args: [script],
    env: { QA_BASE_URL: baseUrl, QA_SHARE_SLUG: shareSlug, ...env },
    parseJson: true,
    ...options,
  })
}

async function cleanupStudioFixture() {
  if (!studioFixture?.tripId && !studioFixture?.runId) return

  await runNodeTask(
    'cleanup release-candidate Trip Studio fixture',
    'scripts/platform-trip-studio-actions.mjs',
    {
      QA_CLEANUP_TRIP_ID: studioFixture.tripId || '',
      QA_CLEANUP_RUN_ID: studioFixture.runId || '',
      QA_CLEANUP_GUEST_ID: studioFixture.guestId || '',
    },
    { mutatesLocal: true }
  )
}

function withoutParsed(result) {
  const clean = { ...result }
  delete clean.parsed
  return clean
}

function markdownTable(rows) {
  return [
    '| Task | Result | Checks | Elapsed | Mutation |',
    '| --- | --- | ---: | ---: | --- |',
    ...rows.map((row) => (
      `| ${row.name} | ${row.ok ? 'Pass' : 'Fail'} | ${row.checked ?? 'n/a'} | ${(row.elapsedMs / 1000).toFixed(1)}s | ${row.mutatesLocal ? 'local' : 'no'} |`
    )),
  ].join('\n')
}

function markdownReport(summary) {
  const rows = summary.results
  const failedRows = rows.filter((row) => !row.ok)

  return `# Release Candidate Gate

Date: ${date}
Environment: ${baseUrl}
Public share slug: ${shareSlug}

## Result

- Checked tasks: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Visual QA included: ${includeVisual ? 'yes' : 'no'}
- Trip Studio fixture included: ${includeStudioFixture ? 'yes' : 'no'}
- Public share fixture sweep included: ${includeShareFixtureSweep ? 'yes' : 'no'}
- Public share fixture owner id: ${includeShareFixtureSweep ? shareFixtureOwnerUserId : 'n/a'}
- Owner feedback readback included: ${includeOwnerFeedback ? 'yes' : 'no'}
- Slow-network recovery included: ${includeSlowNetwork ? 'yes' : 'no'}
- Hosted Stripe Checkout included: ${includeStripeCheckout ? 'yes' : 'no'}
- Hosted Stripe billing portal included: ${includeStripePortal ? 'yes' : 'no'}
- Summary JSON: \`qa/${artifactName}/summary.json\`

${markdownTable(rows)}

## Fixture

- Trip id: ${summary.studioFixture?.tripId || 'n/a'}
- Share slug: ${summary.studioFixture?.shareSlug || 'n/a'}
- Run id: ${summary.studioFixture?.runId || 'n/a'}
- Cleanup task: ${rows.some((row) => row.name === 'cleanup release-candidate Trip Studio fixture' && row.ok) ? 'passed' : 'n/a'}

## Failure Detail

${failedRows.length ? failedRows.map((row) => `### ${row.name}

- Code: ${row.code}
- Checks: ${row.checked ?? 'n/a'}
- Failure: ${JSON.stringify(summary.failures.find((failure) => failure.name === row.name) || row, null, 2)}
`).join('\n') : 'No failures.'}

## Notes

- This gate is the local pre-deploy release-candidate contract.
- It intentionally keeps one disposable Trip Studio fixture alive across owner action QA, recovery QA, and visual QA, then cleans it up.
- Set \`QA_RELEASE_INCLUDE_STRIPE_CHECKOUT=1\` to include hosted Stripe Checkout browser completion with test-mode Stripe objects.
- Set \`QA_RELEASE_INCLUDE_STRIPE_PORTAL=1\` to include hosted Stripe billing portal browser completion with test-mode Stripe objects.
`
}

try {
  await runTask({ name: 'lint', command: npmBin, args: ['run', 'lint'] })
  await runTask({ name: 'production build', command: npmBin, args: ['run', 'build'] })

  await runNodeTask('local ops readiness', 'scripts/platform-ops-smoke.mjs')
  await runTask({
    name: 'geocode quality smoke',
    command: process.execPath,
    args: [
      '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
      '--experimental-strip-types',
      'scripts/platform-geocode-quality-smoke.mjs',
    ],
    parseJson: true,
  })
  await runNodeTask('local route smoke', 'scripts/platform-smoke.mjs')
  await runNodeTask('auth and guest access smoke', 'scripts/platform-auth-access-smoke.mjs', {}, { mutatesLocal: true })
  await runNodeTask('saved and account smoke', 'scripts/platform-saved-account-smoke.mjs', {}, { mutatesLocal: true })
  await runNodeTask('local commercial smoke', 'scripts/platform-commercial-smoke.mjs')
  await runNodeTask('local accessibility and keyboard smoke', 'scripts/platform-accessibility-smoke.mjs')
  await runNodeTask('public share and social preview smoke', 'scripts/platform-share-smoke.mjs')
  await runNodeTask('public share recovery smoke', 'scripts/platform-public-share-recovery-smoke.mjs')
  await runNodeTask('public share viral loop smoke', 'scripts/platform-share-viral-smoke.mjs', {}, { mutatesLocal: isLocalBaseUrl })
  await runNodeTask('public share map fallback smoke', 'scripts/platform-map-fallback-smoke.mjs')

  if (includeShareFixtureSweep) {
    await runNodeTask(
      'public share fixture sweep',
      'scripts/platform-share-fixture-sweep.mjs',
      {
        QA_OWNER_USER_ID: shareFixtureOwnerUserId,
        QA_CREATE_OWNER_PROFILE: process.env.QA_OWNER_USER_ID ? '0' : '1',
      },
      { mutatesLocal: true }
    )
  }

  if (includeShareFeedback) {
    await runNodeTask('public share feedback mutation smoke', 'scripts/platform-share-feedback-smoke.mjs', {}, { mutatesLocal: true })
    await runNodeTask('public share recipient browser feedback smoke', 'scripts/platform-share-recipient-ui-smoke.mjs', {}, { mutatesLocal: true })
    await runNodeTask('public share feedback states browser smoke', 'scripts/platform-share-feedback-states-ui-smoke.mjs', {}, { mutatesLocal: true })
  }

  await runNodeTask('planner handoff smoke', 'scripts/platform-planner-handoff-smoke.mjs', {}, { mutatesLocal: true })
  await runNodeTask('billing recovery smoke', 'scripts/platform-billing-recovery-smoke.mjs')

  if (includeStudioFixture) {
    const studioActions = await runNodeTask(
      'Trip Studio action smoke with kept fixture',
      'scripts/platform-trip-studio-actions.mjs',
      { QA_KEEP_FIXTURE: '1' },
      { mutatesLocal: true }
    )
    studioFixture = {
      tripId: studioActions.parsed?.fixture?.tripId || null,
      shareSlug: studioActions.parsed?.fixture?.shareSlug || null,
      guestId: studioActions.parsed?.guestId || null,
      runId: studioActions.parsed?.runId || null,
    }

    if (studioFixture.tripId && studioFixture.guestId) {
      await runNodeTask('Trip Studio recovery smoke on kept fixture', 'scripts/platform-trip-studio-recovery-smoke.mjs', {
        QA_TRIP_ID: studioFixture.tripId,
        QA_GUEST_ID: studioFixture.guestId,
      })

      if (studioFixture.shareSlug) {
        await runNodeTask(
          'Trip Studio owner/read-only browser UI smoke on kept fixture',
          'scripts/platform-trip-studio-owner-ui-smoke.mjs',
          {
            QA_TRIP_ID: studioFixture.tripId,
            QA_GUEST_ID: studioFixture.guestId,
            QA_SHARE_SLUG: studioFixture.shareSlug,
            QA_RUN_ID: studioFixture.runId || '',
          }
        )
      } else {
        const failure = {
          name: 'Trip Studio owner/read-only browser UI smoke has a public share slug',
          ok: false,
          studioFixture,
        }
        failures.push(failure)
        results.push(failure)
      }

      if (includeOwnerFeedback) {
        if (studioFixture.shareSlug) {
          await runNodeTask(
            'Trip Studio owner feedback readback smoke',
            'scripts/platform-share-feedback-smoke.mjs',
            {
              QA_SHARE_SLUG: studioFixture.shareSlug,
              QA_TRIP_ID: studioFixture.tripId,
              QA_VERIFY_TRIP_FEEDBACK: '1',
            },
            { mutatesLocal: true }
          )
          await runNodeTask(
            'Trip Studio owner feedback browser UI smoke',
            'scripts/platform-share-owner-feedback-ui-smoke.mjs',
            {
              QA_SHARE_SLUG: studioFixture.shareSlug,
              QA_TRIP_ID: studioFixture.tripId,
              QA_GUEST_ID: studioFixture.guestId,
              QA_RUN_ID: studioFixture.runId || '',
            },
            { mutatesLocal: true }
          )
        } else {
          const failure = {
            name: 'Trip Studio owner feedback readback has a public share slug',
            ok: false,
            studioFixture,
          }
          failures.push(failure)
          results.push(failure)
        }
      }

      if (includeSlowNetwork && studioFixture.shareSlug) {
        await runNodeTask(
          'slow-network recovery smoke on kept fixture',
          'scripts/platform-slow-network-smoke.mjs',
          {
            QA_TRIP_ID: studioFixture.tripId,
            QA_GUEST_ID: studioFixture.guestId,
            QA_SHARE_SLUG: studioFixture.shareSlug,
          },
          { mutatesLocal: true }
        )
      }
    } else {
      const failure = {
        name: 'Trip Studio fixture exposes trip and guest for recovery/visual checks',
        ok: false,
        studioFixture,
      }
      failures.push(failure)
      results.push(failure)
    }
  }

  await runNodeTask('Stripe test-mode readiness', 'scripts/platform-stripe-readiness.mjs')

  if (includePromptSuite) {
    await runTask({
      name: 'planner prompt contract suite',
      command: process.execPath,
      args: [
        '--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',
        '--experimental-strip-types',
        'scripts/planner-prompt-suite.mjs',
      ],
      parseJson: true,
    })
  }

  if (includeVisual) {
    await runNodeTask('responsive visual QA', 'scripts/platform-visual-baseline.mjs', {
      QA_VISUAL_RUN_ID: visualRunId,
      QA_TRIP_ID: studioFixture?.tripId || process.env.QA_TRIP_ID || '',
      QA_GUEST_ID: studioFixture?.guestId || process.env.QA_GUEST_ID || '',
      QA_VISUAL_AUTH_MODE: studioFixture?.guestId ? 'guest' : (process.env.QA_VISUAL_AUTH_MODE || 'auto'),
      QA_VISUAL_SETTLE_MS: process.env.QA_VISUAL_SETTLE_MS || '1200',
    })
  }

  if (includeStripeCheckout) {
    await runNodeTask('hosted Stripe checkout browser QA', 'scripts/platform-stripe-checkout-browser.mjs', {
      QA_STRIPE_RUN_HOSTED_CHECKOUT: '1',
    }, { mutatesLocal: true })
  }

  if (includeStripePortal) {
    await runNodeTask('hosted Stripe billing portal browser QA', 'scripts/platform-stripe-portal-browser.mjs', {
      QA_STRIPE_RUN_PORTAL_BROWSER: '1',
    }, { mutatesLocal: true })
  }
} finally {
  if (includeStudioFixture) {
    await cleanupStudioFixture()
  }
}

const summary = {
  baseUrl,
  shareSlug,
  artifactDir,
  summaryPath,
  reportPath,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  includeVisual,
  includeStudioFixture,
  includeShareFeedback,
  includeShareFixtureSweep,
  includeOwnerFeedback,
  includeSlowNetwork,
  includeStripeCheckout,
  includeStripePortal,
  includePromptSuite,
  shareFixtureOwnerUserId: includeShareFixtureSweep ? shareFixtureOwnerUserId : null,
  studioFixture,
  localOnly: isLocalBaseUrl,
  results: results.map(withoutParsed),
  failures,
}

await mkdir(artifactDir, { recursive: true })
await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(reportPath, markdownReport(summary))

console.log('\n--- release candidate summary ---')
console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
