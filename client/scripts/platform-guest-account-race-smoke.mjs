import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const GUEST_SESSION_COOKIE = 'globe_travel_guest'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const date = process.env.QA_GUEST_RACE_DATE || new Date().toISOString().slice(0, 10)
const artifactName = process.env.QA_GUEST_RACE_ARTIFACT_NAME || `guest-account-race-${date}`
const root = resolve(process.cwd(), '..')
const artifactDir = resolve(root, 'qa', artifactName)
const jsonArtifact = resolve(artifactDir, 'summary.json')
const reportArtifact = resolve(artifactDir, 'README.md')
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const allowRemoteGuest = process.env.QA_GUEST_RACE_ALLOW_REMOTE === '1'
const guestId = process.env.QA_GUEST_RACE_GUEST_ID || randomUUID()
const requestPaths = (process.env.QA_GUEST_RACE_PATHS || '/api/trips,/api/journal,/api/trips,/api/journal,/api/trips,/api/journal')
  .split(',')
  .map((path) => path.trim())
  .filter(Boolean)

async function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
  let text = ''

  try {
    text = await readFile(envPath, 'utf8')
  } catch {
    return
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

async function cleanupGuest() {
  if (!isLocalBaseUrl && !allowRemoteGuest) {
    return {
      attempted: false,
      reason: 'remote guest cleanup skipped',
      guestId,
      profileDeleted: false,
      userDeleted: false,
      error: null,
    }
  }

  await loadDotEnv()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return {
      attempted: false,
      reason: 'missing Supabase service role cleanup credentials',
      guestId,
      profileDeleted: false,
      userDeleted: false,
      error: null,
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', guestId)
  const { error: userError } = await supabase.auth.admin.deleteUser(guestId)
  const userAlreadyAbsent = userError?.message?.toLowerCase().includes('user not found')

  return {
    attempted: true,
    reason: null,
    guestId,
    profileDeleted: !profileError,
    userDeleted: !userError || Boolean(userAlreadyAbsent),
    error: profileError?.message || (userError && !userAlreadyAbsent ? userError.message : null),
  }
}

async function requestGuestPath(path) {
  const startedAt = Date.now()
  let status = 0
  let bodyPreview = ''
  let error = null

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      cache: 'no-store',
      headers: {
        cookie: `${GUEST_SESSION_COOKIE}=${guestId}`,
      },
      signal: AbortSignal.timeout(20000),
    })
    status = response.status
    bodyPreview = (await response.text()).slice(0, 160)
  } catch (requestError) {
    error = requestError instanceof Error ? requestError.message : String(requestError)
  }

  return {
    path,
    status,
    ok: status >= 200 && status < 300 && !error,
    elapsedMs: Date.now() - startedAt,
    error,
    bodyPreview,
  }
}

if (!isLocalBaseUrl && !allowRemoteGuest) {
  console.error('Guest race smoke mutates guest auth state. Set QA_GUEST_RACE_ALLOW_REMOTE=1 to run against a remote deployment intentionally.')
  process.exit(1)
}

const waves = []
for (const wave of ['initial-parallel', 'follow-up-parallel']) {
  waves.push({
    wave,
    results: await Promise.all(requestPaths.map(requestGuestPath)),
  })
}

const cleanup = await cleanupGuest()
const failedRequests = waves.flatMap((wave) => wave.results.map((result) => ({ wave: wave.wave, ...result }))).filter((result) => !result.ok)
const checks = [
  {
    name: 'parallel guest API requests all returned 2xx',
    ok: failedRequests.length === 0,
    failedRequests,
  },
  {
    name: 'generated guest cleanup completed',
    ok: cleanup.attempted && cleanup.profileDeleted && cleanup.userDeleted && !cleanup.error,
    cleanup,
  },
]
const failures = checks.filter((check) => !check.ok)

const summary = {
  date,
  baseUrl,
  guestId,
  requestPaths,
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  status: failures.length === 0 ? 'pass' : 'fail',
  waves,
  cleanup,
  checks,
  failures,
}

const report = `# Guest Account Race Smoke

Date: ${date}
Environment: ${baseUrl}
Guest id: ${guestId}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Request paths: ${requestPaths.join(', ')}
- Cleanup: ${cleanup.attempted ? (cleanup.error || 'ok') : cleanup.reason}

## Waves

${waves.map((wave) => `### ${wave.wave}

${wave.results.map((result) => `- ${result.ok ? 'Pass' : 'Fail'}: ${result.path} -> ${result.status || result.error}`).join('\n')}`).join('\n\n')}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Notes

- This smoke catches guest auth/profile provisioning races where protected route hydration fires multiple API requests for the same new guest at once.
- Remote runs are blocked by default because this command creates and deletes a guest auth user.
`

await mkdir(artifactDir, { recursive: true })
await writeFile(jsonArtifact, `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(reportArtifact, report)

console.log(JSON.stringify({
  baseUrl,
  checked: summary.checked,
  passed: summary.passed,
  failed: summary.failed,
  guestId,
  cleanup,
  artifactDir,
  summaryPath: jsonArtifact,
  reportPath: reportArtifact,
}, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
