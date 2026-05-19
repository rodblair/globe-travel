import { spawn } from 'node:child_process'
import { chromium } from 'playwright-core'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const providedTripId = process.env.QA_TRIP_ID || ''
const providedGuestId = process.env.QA_GUEST_ID || ''
const providedShareSlug = process.env.QA_SHARE_SLUG || ''
const providedRunId = process.env.QA_RUN_ID || ''
const shouldCreateFixture = !providedTripId || !providedGuestId || !providedShareSlug
const failures = []
const results = []
let fixture = {
  tripId: providedTripId,
  guestId: providedGuestId,
  shareSlug: providedShareSlug,
  runId: providedRunId,
  external: !shouldCreateFixture,
}
let browser = null

if (!isLocalBaseUrl) {
  console.error('qa:studio-owner-ui mutates disposable fixtures and only runs against localhost.')
  process.exit(1)
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

function record(name, ok, details = {}) {
  const result = { name, ok: Boolean(ok), ...details }
  results.push(result)
  if (!result.ok) failures.push(result)
  return result
}

function runNodeScript(script, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], {
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
      resolve({ code, stdout, stderr, parsed: parseJsonOutput(stdout) })
    })
  })
}

async function createFixtureIfNeeded() {
  if (!shouldCreateFixture) {
    record('owner UI fixture supplied by caller', true, fixture)
    return
  }

  const created = await runNodeScript('scripts/platform-trip-studio-actions.mjs', {
    QA_KEEP_FIXTURE: '1',
  })

  const nextFixture = {
    tripId: created.parsed?.fixture?.tripId || null,
    guestId: created.parsed?.guestId || null,
    shareSlug: created.parsed?.fixture?.shareSlug || null,
    runId: created.parsed?.runId || null,
    external: false,
  }
  fixture = nextFixture

  record('owner UI fixture created with editable mapped trip', (
    created.code === 0 &&
    created.parsed?.failed === 0 &&
    Boolean(nextFixture.tripId && nextFixture.guestId && nextFixture.shareSlug && nextFixture.runId)
  ), {
    code: created.code,
    checked: created.parsed?.checked,
    passed: created.parsed?.passed,
    failed: created.parsed?.failed,
    fixture: nextFixture,
    stderr: created.stderr.trim().slice(-300),
  })
}

async function cleanupFixture() {
  if (fixture.external) {
    record('owner UI fixture cleanup skipped for external fixture', true, fixture)
    return
  }

  if (!fixture.tripId && !fixture.runId && !fixture.guestId) {
    record('owner UI fixture cleanup skipped because no disposable ids were created', true, fixture)
    return
  }

  const cleaned = await runNodeScript('scripts/platform-trip-studio-actions.mjs', {
    QA_CLEANUP_TRIP_ID: fixture.tripId || '',
    QA_CLEANUP_RUN_ID: fixture.runId || '',
    QA_CLEANUP_GUEST_ID: fixture.guestId || '',
  })

  record('owner UI fixture cleanup passed', cleaned.code === 0 && cleaned.parsed?.ok === true, {
    code: cleaned.code,
    tripDeleted: cleaned.parsed?.tripDeleted,
    placesDeleted: cleaned.parsed?.placesDeleted,
    guestProfileDeleted: cleaned.parsed?.guestProfileDeleted,
    guestUserDeleted: cleaned.parsed?.guestUserDeleted,
    errors: cleaned.parsed?.errors,
    stderr: cleaned.stderr.trim().slice(-300),
  })
}

async function readPageState(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  return page.evaluate(() => ({
    url: location.href,
    text: document.body.innerText,
    title: document.title,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    appError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => document.body.innerText.includes(pattern)),
  }))
}

async function addGuestCookie(context, guestId) {
  await context.addCookies([
    {
      name: 'globe_travel_guest',
      value: guestId,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

async function runOwnerTripStudioChecks() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  await addGuestCookie(context, fixture.guestId)
  const page = await context.newPage()

  try {
    await page.goto(`${baseUrl}/trips/${fixture.tripId}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(
      () => document.body.innerText.includes('Save trip') || document.body.innerText.includes('View only'),
      { timeout: 15000 },
    ).catch(() => {})

    const ownerState = await readPageState(page)
    const editButtonCount = await page.getByRole('button', { name: /^Edit /i }).count()
    const swapButtonCount = await page.getByRole('button', { name: /^Swap /i }).count()
    const deleteButtonCount = await page.getByRole('button', { name: /^Delete /i }).count()
    const hasMapAction =
      ownerState.text.includes('Build maps') ||
      ownerState.text.includes('Maps built') ||
      ownerState.text.includes('Building maps')

    record('guest owner Trip Studio renders editable controls', (
      ownerState.text.includes('Save trip') &&
      hasMapAction &&
      ownerState.text.includes('Share with friends') &&
      ownerState.text.includes('Rewrite day') &&
      editButtonCount > 0 &&
      swapButtonCount > 0 &&
      deleteButtonCount > 0 &&
      !ownerState.text.includes('View only') &&
      !ownerState.text.includes('Shared preview') &&
      !ownerState.appError &&
      !ownerState.horizontalOverflow
    ), {
      url: ownerState.url,
      hasSaveTrip: ownerState.text.includes('Save trip'),
      hasMapAction,
      hasShareWithFriends: ownerState.text.includes('Share with friends'),
      hasPlannerWorkflows: ownerState.text.includes('Planner workflows'),
      hasPlannerChat: ownerState.text.includes('Planner chat'),
      hasRewriteDay: ownerState.text.includes('Rewrite day'),
      editButtonCount,
      swapButtonCount,
      deleteButtonCount,
      hasViewOnly: ownerState.text.includes('View only'),
      hasSharedPreview: ownerState.text.includes('Shared preview'),
      appError: ownerState.appError,
      horizontalOverflow: ownerState.horizontalOverflow,
      clientWidth: ownerState.clientWidth,
      scrollWidth: ownerState.scrollWidth,
    })

    await page.getByRole('button', { name: 'Day 2', exact: true }).click({ timeout: 8000 })
    await page.waitForFunction(
      () => document.body.innerText.includes('Itinerary for Day 2') || document.body.innerText.includes('Day 2 map'),
      { timeout: 8000 },
    ).catch(() => {})
    const dayTwoState = await readPageState(page)
    record('owner day switch updates itinerary and map context', (
      dayTwoState.text.includes('Day 2') &&
      dayTwoState.text.includes('Piraeus') &&
      !dayTwoState.appError &&
      !dayTwoState.horizontalOverflow
    ), {
      url: dayTwoState.url,
      hasDay2Map: dayTwoState.text.includes('Day 2 map'),
      hasItineraryForDay2: dayTwoState.text.includes('Itinerary for Day 2'),
      hasPiraeus: dayTwoState.text.includes('Piraeus'),
      appError: dayTwoState.appError,
      horizontalOverflow: dayTwoState.horizontalOverflow,
    })
  } finally {
    await context.close().catch(() => {})
  }
}

async function runReadOnlyTripStudioChecks() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  try {
    await page.goto(`${baseUrl}/trips/${fixture.tripId}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(
      () => document.body.innerText.includes('View only') || document.body.innerText.includes('Save trip'),
      { timeout: 15000 },
    ).catch(() => {})
    const directState = await readPageState(page)

    record('logged-out direct Trip Studio route is clearly read-only', (
      directState.text.includes('View only') &&
      directState.text.includes('Shared preview') &&
      directState.text.includes('View share') &&
      !directState.text.includes('Save trip') &&
      !directState.text.includes('Share with friends') &&
      !directState.appError &&
      !directState.horizontalOverflow
    ), {
      url: directState.url,
      hasViewOnly: directState.text.includes('View only'),
      hasSharedPreview: directState.text.includes('Shared preview'),
      hasSaveTrip: directState.text.includes('Save trip'),
      hasShareWithFriends: directState.text.includes('Share with friends'),
      appError: directState.appError,
      horizontalOverflow: directState.horizontalOverflow,
    })

    await page.goto(`${baseUrl}/t/${fixture.shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction(
      () => document.body.innerText.includes('Start your own trip'),
      { timeout: 15000 },
    ).catch(() => {})
    const publicState = await readPageState(page)

    record('logged-out public share keeps recipient CTA without owner controls', (
      publicState.text.includes('Start your own trip') &&
      !publicState.text.includes('Save trip') &&
      !publicState.text.includes('Build maps') &&
      !publicState.appError &&
      !publicState.horizontalOverflow
    ), {
      url: publicState.url,
      hasStartOwnTrip: publicState.text.includes('Start your own trip'),
      hasSaveTrip: publicState.text.includes('Save trip'),
      hasBuildMaps: publicState.text.includes('Build maps'),
      appError: publicState.appError,
      horizontalOverflow: publicState.horizontalOverflow,
    })
  } finally {
    await context.close().catch(() => {})
  }
}

try {
  await createFixtureIfNeeded()
  if (failures.length === 0) {
    browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
    })
    await runOwnerTripStudioChecks()
    await runReadOnlyTripStudioChecks()
  }
} catch (error) {
  record('owner UI smoke completed without unexpected exception', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  await browser?.close().catch(() => {})
  await cleanupFixture()
}

const summary = {
  baseUrl,
  fixture,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
