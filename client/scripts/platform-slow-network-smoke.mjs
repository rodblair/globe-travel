import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const providedTripId = process.env.QA_TRIP_ID || ''
const providedGuestId = process.env.QA_GUEST_ID || ''
const providedShareSlug = process.env.QA_SHARE_SLUG || ''
const delayMs = Number(process.env.QA_SLOW_NETWORK_DELAY_MS || '2200')
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const results = []
const failures = []
let browser = null
let supabase = null
let fixture = null
let plannerCleanup = {
  attempted: false,
  tripDeleted: false,
  guestProfileDeleted: false,
  guestUserDeleted: false,
  error: null,
}

if (!isLocalBaseUrl) {
  console.error('qa:slow-network only runs against localhost because it creates disposable guest state.')
  process.exit(1)
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

function record(name, ok, details = {}) {
  const result = { name, ok: Boolean(ok), ...details }
  results.push(result)
  if (!result.ok) failures.push(result)
  return result
}

function parseJsonOutput(stdout) {
  const trimmed = stdout.trim()
  if (!trimmed) return null

  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.lastIndexOf('\n{')
    if (start === -1) return null
    return JSON.parse(trimmed.slice(start + 1))
  }
}

function runNodeScript(script, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], {
      cwd: root,
      env: { ...process.env, ...env, QA_BASE_URL: baseUrl },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
    child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    child.on('close', (code) => {
      resolve({ code, stdout, stderr, parsed: parseJsonOutput(stdout) })
    })
  })
}

async function ensureSupabase() {
  if (supabase) return supabase
  await loadDotEnv()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for qa:slow-network cleanup.')
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
  return supabase
}

async function cleanupPlannerDraft(tripId, guestId) {
  plannerCleanup.attempted = true

  try {
    const db = await ensureSupabase()

    if (tripId) {
      const { error } = await db.from('trips').delete().eq('id', tripId)
      plannerCleanup.tripDeleted = !error
      if (error) throw error
    }

    if (guestId) {
      const { error: profileError } = await db.from('profiles').delete().eq('id', guestId)
      const { error: userError } = await db.auth.admin.deleteUser(guestId)
      const userAlreadyAbsent = userError?.message?.toLowerCase().includes('user not found')
      plannerCleanup.guestProfileDeleted = !profileError
      plannerCleanup.guestUserDeleted = !userError || Boolean(userAlreadyAbsent)
      if (profileError || (userError && !userAlreadyAbsent)) throw new Error(profileError?.message || userError?.message)
    }
  } catch (error) {
    plannerCleanup.error = error instanceof Error ? error.message : String(error)
  }
}

async function createFixtureIfNeeded() {
  if (providedTripId && providedGuestId && providedShareSlug) {
    return {
      tripId: providedTripId,
      guestId: providedGuestId,
      shareSlug: providedShareSlug,
      runId: null,
      external: true,
    }
  }

  const created = await runNodeScript('scripts/platform-trip-studio-actions.mjs', {
    QA_KEEP_FIXTURE: '1',
  })
  const parsed = created.parsed
  const tripId = parsed?.fixture?.tripId
  const guestId = parsed?.guestId
  const shareSlug = parsed?.fixture?.shareSlug

  record('slow-network fixture created', created.code === 0 && Boolean(tripId && guestId && shareSlug), {
    code: created.code,
    tripId,
    guestId,
    shareSlug,
    stderr: created.stderr.trim().slice(-500) || null,
  })

  if (!tripId || !guestId || !shareSlug) {
    throw new Error('Could not create slow-network Trip Studio fixture.')
  }

  return {
    tripId,
    guestId,
    shareSlug,
    runId: parsed?.runId || null,
    external: false,
  }
}

async function cleanupFixtureIfNeeded() {
  if (!fixture || fixture.external) return

  const cleaned = await runNodeScript('scripts/platform-trip-studio-actions.mjs', {
    QA_CLEANUP_TRIP_ID: fixture.tripId,
    QA_CLEANUP_RUN_ID: fixture.runId || '',
    QA_CLEANUP_GUEST_ID: fixture.guestId,
  })
  const parsed = cleaned.parsed
  record('slow-network fixture cleanup passed', cleaned.code === 0 && parsed?.ok === true, {
    code: cleaned.code,
    tripId: fixture.tripId,
    runId: fixture.runId,
    guestId: fixture.guestId,
    tripDeleted: parsed?.tripDeleted,
    placesDeleted: parsed?.placesDeleted,
    guestProfileDeleted: parsed?.guestProfileDeleted,
    guestUserDeleted: parsed?.guestUserDeleted,
    errors: parsed?.errors || [],
  })
}

async function addGuestCookie(context, guestId) {
  const parsedBaseUrl = new URL(baseUrl)
  await context.addCookies([
    {
      name: 'globe_travel_guest',
      value: guestId,
      domain: parsedBaseUrl.hostname,
      path: '/',
      httpOnly: false,
      secure: baseUrl.startsWith('https://'),
      sameSite: 'Lax',
    },
  ])
}

async function visibleText(page, timeout = 8000) {
  return page.locator('body').innerText({ timeout })
}

async function pageMetrics(page) {
  return page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    appError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => document.body.innerText.includes(pattern)),
  }))
}

async function delayRoute(context, routeMatcher, label) {
  let hits = 0
  await context.route(routeMatcher, async (route) => {
    hits += 1
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(delayMs) ? delayMs : 2200))
    await route.continue()
  })
  return {
    label,
    hitCount: () => hits,
  }
}

async function testTripStudioSlowLoad() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  await addGuestCookie(context, fixture.guestId)
  const routeDelay = await delayRoute(context, `**/api/trips/${fixture.tripId}`, 'trip-api')
  const page = await context.newPage()

  try {
    await page.goto(`${baseUrl}/trips/${fixture.tripId}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(350)
    const loadingText = await visibleText(page)
    const loadingMetrics = await pageMetrics(page)
    const loadingOk = loadingText.includes('Loading your itinerary.') && !loadingMetrics.horizontalOverflow && !loadingMetrics.appError

    await page.waitForFunction(() => document.body.innerText.includes('Share with friends'), { timeout: 15000 })
    const loadedMetrics = await pageMetrics(page)
    record('Trip Studio slow itinerary load stays legible then recovers', loadingOk && routeDelay.hitCount() > 0 && !loadedMetrics.horizontalOverflow && !loadedMetrics.appError, {
      delayedRequests: routeDelay.hitCount(),
      loadingHadCopy: loadingText.includes('Loading your itinerary.'),
      loadingMetrics,
      loadedMetrics,
    })
  } catch (error) {
    record('Trip Studio slow itinerary load stays legible then recovers', false, {
      error: error instanceof Error ? error.message : String(error),
      delayedRequests: routeDelay.hitCount(),
    })
  } finally {
    await context.close().catch(() => {})
  }
}

async function testPublicShareSlowFeedback() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  const routeDelay = await delayRoute(context, `**/api/trips/share/${fixture.shareSlug}/feedback`, 'share-feedback-api')
  const page = await context.newPage()

  try {
    await page.goto(`${baseUrl}/t/${fixture.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(() => document.body.innerText.includes('Start your own trip'), { timeout: 12000 })
    await page.waitForFunction(
      () =>
        document.body.innerText.toLowerCase().includes('day-by-day itinerary') &&
        document.body.innerText.toLowerCase().includes('add your reaction'),
      { timeout: 12000 }
    )
    const duringText = await visibleText(page)
    const duringTextLower = duringText.toLowerCase()
    const duringMetrics = await pageMetrics(page)

    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    const afterMetrics = await pageMetrics(page)
    record('public share remains useful while feedback is slow', (
      routeDelay.hitCount() > 0 &&
      duringText.includes('Start your own trip') &&
      duringTextLower.includes('day-by-day itinerary') &&
      duringTextLower.includes('add your reaction') &&
      !duringMetrics.horizontalOverflow &&
      !duringMetrics.appError &&
      !afterMetrics.horizontalOverflow &&
      !afterMetrics.appError
    ), {
      delayedRequests: routeDelay.hitCount(),
      hasRecipientCta: duringText.includes('Start your own trip'),
      hasItinerary: duringTextLower.includes('day-by-day itinerary'),
      hasFeedbackForm: duringTextLower.includes('add your reaction'),
      duringMetrics,
      afterMetrics,
    })
  } catch (error) {
    record('public share remains useful while feedback is slow', false, {
      error: error instanceof Error ? error.message : String(error),
      delayedRequests: routeDelay.hitCount(),
    })
  } finally {
    await context.close().catch(() => {})
  }
}

async function testAccountSlowSubscription() {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  await addGuestCookie(context, fixture.guestId)
  const routeDelay = await delayRoute(context, '**/api/stripe/subscription', 'subscription-api')
  const page = await context.newPage()

  try {
    await page.goto(`${baseUrl}/account?tab=billing`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(450)
    const duringText = await visibleText(page)
    const duringMetrics = await pageMetrics(page)
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    const afterText = await visibleText(page)
    const afterMetrics = await pageMetrics(page)

    record('account billing remains actionable while subscription state is slow', (
      routeDelay.hitCount() > 0 &&
      duringText.includes('Plan and billing') &&
      afterText.includes('Plan and billing') &&
      !duringMetrics.horizontalOverflow &&
      !duringMetrics.appError &&
      !afterMetrics.horizontalOverflow &&
      !afterMetrics.appError
    ), {
      delayedRequests: routeDelay.hitCount(),
      duringHasBilling: duringText.includes('Plan and billing'),
      afterHasBilling: afterText.includes('Plan and billing'),
      duringMetrics,
      afterMetrics,
    })
  } catch (error) {
    record('account billing remains actionable while subscription state is slow', false, {
      error: error instanceof Error ? error.message : String(error),
      delayedRequests: routeDelay.hitCount(),
    })
  } finally {
    await context.close().catch(() => {})
  }
}

async function testPlannerSlowDraftCreation() {
  const guestId = randomUUID()
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
  await addGuestCookie(context, guestId)
  const routeDelay = await delayRoute(context, '**/api/trips', 'trip-create-api')
  const page = await context.newPage()
  let tripId = null
  const prompt = 'Plan a 2 day Athens trip for friends with food and history'

  try {
    await page.goto(`${baseUrl}/chat`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const ideaInput = page.locator('input[aria-label="Describe your trip idea"]:visible').first()
    await ideaInput.waitFor({ state: 'visible', timeout: 10000 })
    await ideaInput.click()
    await ideaInput.fill('')
    await ideaInput.pressSequentially(prompt, { delay: 5 })
    await page.waitForFunction(() => {
      const input = document.querySelector('input[aria-label="Describe your trip idea"]')
      const sendButton = document.querySelector('button[aria-label="Send trip idea"]')
      return input instanceof HTMLInputElement &&
        input.value.trim().length > 0 &&
        sendButton instanceof HTMLButtonElement &&
        !sendButton.disabled
    }, undefined, { timeout: 5000 })
    await page.locator('button[aria-label="Send trip idea"]:visible:not([disabled])').click({ timeout: 10000 })
    await page.waitForTimeout(350)

    const waitingText = await visibleText(page)
    const waitingMetrics = await pageMetrics(page)
    const inputPlaceholder = await ideaInput.getAttribute('placeholder').catch(() => '')

    await page.waitForURL(/\/trips\/[^/?]+/, { timeout: 30000 })
    tripId = new URL(page.url()).pathname.split('/').filter(Boolean).pop()
    const loadedMetrics = await pageMetrics(page)

    record('planner slow draft creation shows progress and reaches Trip Studio', (
      routeDelay.hitCount() > 0 &&
      inputPlaceholder?.includes('Opening Trip Studio') &&
      Boolean(tripId) &&
      !waitingMetrics.horizontalOverflow &&
      !waitingMetrics.appError &&
      !loadedMetrics.horizontalOverflow &&
      !loadedMetrics.appError
    ), {
      delayedRequests: routeDelay.hitCount(),
      placeholder: inputPlaceholder,
      waitingMentionsPlanner: waitingText.includes('Planner'),
      tripId,
      waitingMetrics,
      loadedMetrics,
    })
  } catch (error) {
    record('planner slow draft creation shows progress and reaches Trip Studio', false, {
      error: error instanceof Error ? error.message : String(error),
      delayedRequests: routeDelay.hitCount(),
      tripId,
    })
  } finally {
    await context.close().catch(() => {})
    await cleanupPlannerDraft(tripId, guestId)
    record('planner slow-network disposable draft cleanup passed', (
      plannerCleanup.attempted &&
      (!tripId || plannerCleanup.tripDeleted) &&
      plannerCleanup.guestProfileDeleted &&
      plannerCleanup.guestUserDeleted &&
      !plannerCleanup.error
    ), plannerCleanup)
  }
}

await loadDotEnv()

try {
  fixture = await createFixtureIfNeeded()
  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
  })

  await testTripStudioSlowLoad()
  await testPublicShareSlowFeedback()
  await testAccountSlowSubscription()
  await testPlannerSlowDraftCreation()
} catch (error) {
  record('slow-network smoke crashed', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  await browser?.close().catch(() => {})
  await cleanupFixtureIfNeeded()
}

const summary = {
  baseUrl,
  delayMs,
  fixture: fixture
    ? {
      tripId: fixture.tripId,
      shareSlug: fixture.shareSlug,
      guestId: fixture.guestId,
      runId: fixture.runId,
      external: fixture.external,
    }
    : null,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  plannerCleanup,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
