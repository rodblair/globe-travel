import { randomUUID } from 'node:crypto'
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
const runId = providedRunId || randomUUID().slice(0, 8)
const feedbackRunId = `owner${runId.slice(0, 8)}`
const feedbackAuthor = `QA Friend ${feedbackRunId}`
const feedbackComment = `QA browser feedback ${feedbackRunId}: Day 2 looks strong, but please add one slower cafe break before dinner.`
const failures = []
const results = []
let fixture = {
  tripId: providedTripId,
  guestId: providedGuestId,
  shareSlug: providedShareSlug,
  runId,
  external: !shouldCreateFixture,
}
let insertedFeedbackId = null
let browser = null

if (!isLocalBaseUrl) {
  console.error('qa:share-owner-feedback-ui mutates disposable feedback and only runs against localhost.')
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
      env: { ...process.env, QA_BASE_URL: baseUrl, ...env },
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
    record('owner feedback UI fixture supplied by caller', true, fixture)
    return
  }

  const created = await runNodeScript('scripts/platform-trip-studio-actions.mjs', {
    QA_KEEP_FIXTURE: '1',
  })
  fixture = {
    tripId: created.parsed?.fixture?.tripId || null,
    guestId: created.parsed?.guestId || null,
    shareSlug: created.parsed?.fixture?.shareSlug || null,
    runId: created.parsed?.runId || runId,
    external: false,
  }

  record('owner feedback UI fixture created with public Trip Studio link', (
    created.code === 0 &&
    created.parsed?.failed === 0 &&
    Boolean(fixture.tripId && fixture.guestId && fixture.shareSlug && fixture.runId)
  ), {
    code: created.code,
    checked: created.parsed?.checked,
    passed: created.parsed?.passed,
    failed: created.parsed?.failed,
    fixture,
    stderr: created.stderr.trim().slice(-300),
  })
}

async function submitRecipientFeedback() {
  const submitted = await runNodeScript('scripts/platform-share-recipient-ui-smoke.mjs', {
    QA_SHARE_SLUG: fixture.shareSlug,
    QA_RUN_ID: feedbackRunId,
    QA_KEEP_FEEDBACK: '1',
  })
  insertedFeedbackId = submitted.parsed?.insertedFeedbackId || null

  record('recipient browser UI submits feedback for owner review', (
    submitted.code === 0 &&
    submitted.parsed?.failed === 0 &&
    Boolean(insertedFeedbackId)
  ), {
    code: submitted.code,
    checked: submitted.parsed?.checked,
    passed: submitted.parsed?.passed,
    failed: submitted.parsed?.failed,
    feedbackId: insertedFeedbackId,
    feedbackAuthor,
    stderr: submitted.stderr.trim().slice(-300),
  })
}

async function cleanupFeedback() {
  if (!insertedFeedbackId) return

  const cleaned = await runNodeScript('scripts/platform-share-feedback-smoke.mjs', {
    QA_CLEANUP_FEEDBACK_ID: insertedFeedbackId,
  })
  record('owner feedback UI cleanup deleted inserted reaction', cleaned.code === 0 && cleaned.parsed?.ok === true, {
    code: cleaned.code,
    feedbackId: insertedFeedbackId,
    error: cleaned.parsed?.error || null,
    stderr: cleaned.stderr.trim().slice(-300),
  })
}

async function cleanupFixture() {
  if (fixture.external || !fixture.tripId) {
    record('owner feedback UI fixture cleanup skipped for external fixture', true, fixture)
    return
  }

  const cleaned = await runNodeScript('scripts/platform-trip-studio-actions.mjs', {
    QA_CLEANUP_TRIP_ID: fixture.tripId || '',
    QA_CLEANUP_RUN_ID: fixture.runId || '',
    QA_CLEANUP_GUEST_ID: fixture.guestId || '',
  })
  record('owner feedback UI fixture cleanup passed', cleaned.code === 0 && cleaned.parsed?.ok === true, {
    code: cleaned.code,
    tripDeleted: cleaned.parsed?.tripDeleted,
    placesDeleted: cleaned.parsed?.placesDeleted,
    guestProfileDeleted: cleaned.parsed?.guestProfileDeleted,
    guestUserDeleted: cleaned.parsed?.guestUserDeleted,
    errors: cleaned.parsed?.errors,
    stderr: cleaned.stderr.trim().slice(-300),
  })
}

async function addGuestCookie(context) {
  await context.addCookies([
    {
      name: 'globe_travel_guest',
      value: fixture.guestId,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ])
}

async function pageState(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3500 }).catch(() => {})
  return page.evaluate(() => {
    const text = document.body?.innerText || ''
    return {
      url: location.href,
      text,
      hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => text.includes(pattern)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
}

async function runOwnerUiChecks() {
  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  await addGuestCookie(context)
  const page = await context.newPage()

  try {
    await page.goto(`${baseUrl}/trips/${fixture.tripId}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForFunction((author) => {
      const text = document.body?.innerText || ''
      return text.includes(author) || text.includes('Friend feedback')
    }, feedbackAuthor, { timeout: 15000 }).catch(() => {})

    const initialState = await pageState(page)
    const refreshButton = page.getByRole('button', { name: /Refresh plan from feedback/i })
    const refreshEnabled = await refreshButton.isEnabled().catch(() => false)

    record('owner Trip Studio shows submitted friend feedback', (
      initialState.text.includes(feedbackAuthor) &&
      initialState.text.includes(feedbackComment) &&
      initialState.text.includes('crew reacting') &&
      refreshEnabled &&
      !initialState.hasAppError &&
      !initialState.horizontalOverflow
    ), {
      url: initialState.url,
      hasAuthor: initialState.text.includes(feedbackAuthor),
      hasComment: initialState.text.includes(feedbackComment),
      hasCrewReacting: initialState.text.includes('crew reacting'),
      refreshEnabled,
      hasAppError: initialState.hasAppError,
      horizontalOverflow: initialState.horizontalOverflow,
      clientWidth: initialState.clientWidth,
      scrollWidth: initialState.scrollWidth,
    })

    await refreshButton.click({ timeout: 8000 })
    await page.waitForFunction(() => {
      const text = document.body?.innerText || ''
      const lowerText = text.toLowerCase()
      return lowerText.includes('feedback refresh') && (lowerText.includes('completed') || text.includes('"status": "ready"'))
    }, { timeout: 15000 }).catch(() => {})
    const refreshState = await pageState(page)
    const refreshText = refreshState.text.toLowerCase()
    record('owner feedback refresh workflow completes from visible feedback', (
      refreshText.includes('feedback refresh') &&
      refreshState.text.includes('"status": "ready"') &&
      !refreshState.hasAppError &&
      !refreshState.horizontalOverflow
    ), {
      hasFeedbackRefresh: refreshText.includes('feedback refresh'),
      hasReadyStatus: refreshState.text.includes('"status": "ready"'),
      hasAppError: refreshState.hasAppError,
      horizontalOverflow: refreshState.horizontalOverflow,
    })
  } finally {
    await context.close().catch(() => {})
  }
}

try {
  await createFixtureIfNeeded()
  if (failures.length === 0) await submitRecipientFeedback()
  if (failures.length === 0) await runOwnerUiChecks()
} catch (error) {
  record('owner feedback UI smoke completed without unexpected exception', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  await browser?.close().catch(() => {})
  await cleanupFeedback()
  await cleanupFixture()
}

const summary = {
  baseUrl,
  fixture,
  feedbackId: insertedFeedbackId,
  feedbackAuthor,
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

process.exit(failures.length > 0 ? 1 : 0)
