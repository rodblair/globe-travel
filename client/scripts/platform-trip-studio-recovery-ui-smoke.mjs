import { chromium } from 'playwright-core'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const missingTripId = process.env.QA_MISSING_TRIP_ID || '00000000-0000-4000-8000-000000000001'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const navigationTimeoutMs = isLocalBaseUrl ? 30000 : 60000
const recoveryRenderTimeoutMs = isLocalBaseUrl ? 10000 : 30000
const failures = []
const results = []
let browser = null

function record(name, ok, details = {}) {
  const result = { name, ok: Boolean(ok), ...details }
  results.push(result)
  if (!result.ok) failures.push(result)
  return result
}

async function readPageState(page, markers = []) {
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  await page.waitForFunction(
    ({ expectedMarkers }) => {
      const text = document.body?.innerText || ''
      const appErrors = ['Application error', 'Unhandled Runtime Error', 'Hydration failed']
      const ready = expectedMarkers.every((marker) => text.toLowerCase().includes(marker.toLowerCase()))
      return ready || appErrors.some((pattern) => text.includes(pattern))
    },
    { expectedMarkers: markers },
    { timeout: recoveryRenderTimeoutMs },
  ).catch(() => {})

  return page.evaluate(({ expectedMarkers }) => {
    const text = document.body?.innerText || ''
    return {
      url: location.href,
      title: document.title,
      text,
      textExcerpt: text.replace(/\s+/g, ' ').trim().slice(0, 500),
      missingMarkers: expectedMarkers.filter((marker) => !text.toLowerCase().includes(marker.toLowerCase())),
      mainCount: document.querySelectorAll('main').length,
      hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => text.includes(pattern)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }
  }, { expectedMarkers: markers })
}

async function gotoWithRetry(page, url) {
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: navigationTimeoutMs })
      return attempt
    } catch (error) {
      lastError = error
      if (attempt === 3) break
      await new Promise((resolve) => setTimeout(resolve, 750 * attempt))
    }
  }
  throw lastError
}

async function runMissingTripRecoveryCheck() {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
  })
  const page = await context.newPage()

  try {
    const path = `/trips/${missingTripId}`
    const expectedMarkers = [
      'We could not open this trip.',
      'Go to saved trips',
      'Plan a new trip',
    ]
    let attempts = 0
    let state = null

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      attempts += await gotoWithRetry(page, `${baseUrl}${path}`)
      state = await readPageState(page, expectedMarkers)
      if (state.missingMarkers.length === 0 || state.hasAppError) break
      if (attempt < 3) await page.waitForTimeout(750 * attempt)
    }

    const hasOwnerActions = state?.text.includes('Save trip') || state?.text.includes('Share with friends')
    const hasEmptyWorkspaceCopy = state?.text.includes('Create a trip to start planning.')
    const finalUrl = new URL(state?.url || `${baseUrl}${path}`)

    record('missing Trip Studio route renders recovery path', (
      finalUrl.pathname === path &&
      state?.missingMarkers.length === 0 &&
      !hasOwnerActions &&
      !hasEmptyWorkspaceCopy &&
      !state?.hasAppError &&
      !state?.horizontalOverflow &&
      state?.mainCount === 1
    ), {
      path,
      finalUrl: state?.url || null,
      attempts,
      missingMarkers: state?.missingMarkers || expectedMarkers,
      textExcerpt: state?.textExcerpt || '',
      hasOwnerActions,
      hasEmptyWorkspaceCopy,
      hasAppError: state?.hasAppError || false,
      horizontalOverflow: state?.horizontalOverflow || false,
      mainCount: state?.mainCount || 0,
      clientWidth: state?.clientWidth || null,
      scrollWidth: state?.scrollWidth || null,
    })
  } finally {
    await context.close().catch(() => {})
  }
}

try {
  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
  })
  await runMissingTripRecoveryCheck()
} catch (error) {
  record('Trip Studio recovery UI smoke completed without unexpected exception', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  await browser?.close().catch(() => {})
}

const summary = {
  baseUrl,
  missingTripId,
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
