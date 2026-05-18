import { chromium } from 'playwright-core'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG || 'x3m2c8cnws'
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const results = []
const failures = []

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function record(name, ok, details = {}) {
  const result = { name, ok: Boolean(ok), ...details }
  results.push(result)
  if (!result.ok) failures.push(result)
}

async function collectState(page) {
  return page.evaluate(() => {
    const text = document.body.innerText
    return {
      url: location.href,
      staticRouteLabels: Array.from(document.querySelectorAll('*'))
        .filter((element) => element.textContent?.trim() === 'Static Route').length,
      staticPreviewLabels: Array.from(document.querySelectorAll('*'))
        .filter((element) => element.textContent?.trim() === 'Static route preview').length,
      mapboxCanvasCount: document.querySelectorAll('.mapboxgl-canvas').length,
      mapboxControlCount: document.querySelectorAll('.mapboxgl-ctrl').length,
      hasRecipientCta: text.includes('Start your own trip'),
      hasItinerary: text.toLowerCase().includes('day-by-day itinerary'),
      hasFeedback: text.toLowerCase().includes('add your reaction') && text.toLowerCase().includes('friend feedback'),
      hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => text.includes(pattern)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
}

async function gotoWithRetry(page, url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    } catch (error) {
      if (attempt === 3) throw error
      await sleep(600 * attempt)
    }
  }
}

let browser = null

try {
  if (!isLocalBaseUrl) {
    record('map fallback smoke skipped for remote base URL', true, {
      reason: 'qaMapFallback is a development-only public-share query flag',
      baseUrl,
    })
  } else {
    browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
    })
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
    const page = await context.newPage()
    await gotoWithRetry(page, `${baseUrl}/t/${shareSlug}?qaMapFallback=1`)
    await page.waitForFunction(() => document.body.innerText.includes('Static route preview'), { timeout: 15000 }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    const state = await collectState(page)

    record('public share static map fallback stays useful', (
      state.staticRouteLabels > 0 &&
      state.staticPreviewLabels > 0 &&
      state.mapboxCanvasCount === 0 &&
      state.hasRecipientCta &&
      state.hasItinerary &&
      state.hasFeedback &&
      !state.hasAppError &&
      !state.horizontalOverflow
    ), state)

    await context.close().catch(() => {})
  }
} catch (error) {
  record('map fallback smoke completed without unexpected exception', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  await browser?.close().catch(() => {})
}

const summary = {
  baseUrl,
  shareSlug,
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
