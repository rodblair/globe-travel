import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const requestedOwnerUserId = process.env.QA_OWNER_USER_ID || ''
const shouldCreateOwnerProfile = process.env.QA_CREATE_OWNER_PROFILE === '1' || !requestedOwnerUserId
const ownerUserId = requestedOwnerUserId || randomUUID()
const includePromptActuals = process.env.QA_SHARE_FIXTURE_INCLUDE_PROMPT_ACTUALS !== '0'
const allowRemote = process.env.QA_ALLOW_REMOTE_MUTATION === '1'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const failures = []
const results = []
let supabase = null

if (!isLocalBaseUrl && !allowRemote) {
  console.error('qa:share-fixture-sweep creates disposable public trips and only runs against localhost unless QA_ALLOW_REMOTE_MUTATION=1 is set.')
  process.exit(1)
}

const tmpDir = await mkdtemp(join(tmpdir(), 'globe-travel-share-fixtures-'))
const actualsPath = join(tmpDir, 'prompt-actuals.json')
let created = null
let cleanup = null
let ownerCleanup = {
  attempted: false,
  reason: shouldCreateOwnerProfile ? 'not run yet' : 'external owner profile supplied',
  ownerUserId: shouldCreateOwnerProfile ? ownerUserId : null,
  profileDeleted: false,
  userDeleted: false,
  error: null,
}

async function loadDotEnv() {
  const envPath = resolve(root, '.env.local')
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

async function getSupabase() {
  if (supabase) return supabase

  await loadDotEnv()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for qa:share-fixture-sweep.')
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  return supabase
}

async function ensureOwnerProfile() {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerUserId)) {
    throw new Error('QA_OWNER_USER_ID must be a valid profile user id for qa:share-fixture-sweep.')
  }

  const db = await getSupabase()
  const { data: profile, error: profileError } = await db
    .from('profiles')
    .select('id,display_name,username')
    .eq('id', ownerUserId)
    .maybeSingle()

  if (profileError) throw new Error(profileError.message)
  if (profile) return profile

  if (!shouldCreateOwnerProfile) {
    throw new Error(`No profile found for QA_OWNER_USER_ID=${ownerUserId}.`)
  }

  const email = `qa-share-sweep-${ownerUserId.slice(0, 8)}@globe-travel.local`
  const { error: userError } = await db.auth.admin.createUser({
    id: ownerUserId,
    email,
    email_confirm: true,
    password: randomUUID(),
    user_metadata: {
      full_name: 'QA Share Sweep Owner',
      is_guest: true,
    },
  })

  if (userError && !/already|duplicate|registered/i.test(userError.message)) {
    throw new Error(userError.message)
  }

  const { error: upsertError } = await db
    .from('profiles')
    .upsert({
      id: ownerUserId,
      username: `qa-share-sweep-${ownerUserId.slice(0, 8)}`,
      display_name: 'QA Share Sweep Owner',
      avatar_url: null,
      bio: 'Disposable owner for public share fixture sweep QA.',
      travel_style: 'group city breaks',
      onboarding_completed: true,
    }, { onConflict: 'id' })

  if (upsertError) throw new Error(upsertError.message)

  return {
    id: ownerUserId,
    username: `qa-share-sweep-${ownerUserId.slice(0, 8)}`,
    display_name: 'QA Share Sweep Owner',
  }
}

async function cleanupOwnerProfile() {
  if (!shouldCreateOwnerProfile) return

  ownerCleanup = {
    attempted: true,
    reason: 'created disposable owner profile',
    ownerUserId,
    profileDeleted: false,
    userDeleted: false,
    error: null,
  }

  try {
    const db = await getSupabase()
    const { error: profileError } = await db
      .from('profiles')
      .delete()
      .eq('id', ownerUserId)
    const { error: userError } = await db.auth.admin.deleteUser(ownerUserId)
    const userAlreadyAbsent = Boolean(userError?.message?.toLowerCase().includes('not found'))

    ownerCleanup.profileDeleted = !profileError
    ownerCleanup.userDeleted = !userError || userAlreadyAbsent
    ownerCleanup.error = profileError?.message || (userAlreadyAbsent ? null : userError?.message) || null
  } catch (error) {
    ownerCleanup.error = error instanceof Error ? error.message : String(error)
  }
}

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
  await ensureOwnerProfile()

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

  await cleanupOwnerProfile()
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
  ownerCleanup,
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
