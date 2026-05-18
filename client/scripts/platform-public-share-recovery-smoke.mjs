import { chromium } from 'playwright-core'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG || 'x3m2c8cnws'
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)

if (!isLocalBaseUrl) {
  console.error('qa:share-recovery only runs against localhost.')
  process.exit(1)
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
})

const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
})
const page = await context.newPage()
const failures = []
const results = []

function record(name, ok, details = {}) {
  const result = { name, ok: Boolean(ok), ...details }
  results.push(result)
  if (!result.ok) failures.push(result)
  return result
}

async function text() {
  return page.locator('body').innerText({ timeout: 8000 })
}

try {
  await page.goto(`${baseUrl}/t/${shareSlug}?qaFeedbackFailure=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {})
  await page.waitForTimeout(900)

  const initialText = await text()
  const initialLower = initialText.toLowerCase()
  record(
    'public share recipient surface visible',
    initialLower.includes('start your own trip') &&
      initialLower.includes('add your reaction') &&
      initialLower.includes('friend feedback')
  )

  await page.getByLabel('Your name').fill('QA Friend')
  await page.getByLabel('Trip feedback').fill('This plan looks good, but please leave room before dinner.')
  await page.getByRole('button', { name: /Send feedback/i }).click({ timeout: 8000 })
  await page.waitForTimeout(700)
  const failureText = await text()
  record(
    'forced feedback failure recovery visible',
    failureText.includes('Feedback is temporarily unavailable in QA mode.') &&
      failureText.includes('Ready to send')
  )

  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }))
  record('no mobile horizontal overflow', !metrics.horizontalOverflow, metrics)
} catch (error) {
  record('public share recovery smoke crashed', false, { error: error instanceof Error ? error.message : String(error) })
} finally {
  await context.close().catch(() => {})
  await browser.close().catch(() => {})
}

const summary = {
  baseUrl,
  shareSlug,
  checked: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
