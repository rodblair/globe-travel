import { chromium } from 'playwright-core'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)

if (!isLocalBaseUrl) {
  console.error('qa:billing-recovery only runs against localhost.')
  process.exit(1)
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
})

const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
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

async function bodyText() {
  return page.locator('body').innerText({ timeout: 6000 })
}

async function gotoAccountBilling(query = '') {
  await page.goto(`${baseUrl}/account?tab=billing${query}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(700)
}

try {
  await gotoAccountBilling('')
  const initialText = await bodyText()
  record(
    'billing surface visible',
    initialText.includes('Plan and billing') && initialText.includes('Plan comparison') && initialText.includes('Start free trial')
  )

  await gotoAccountBilling('&qaCheckoutFailure=1')
  await page.getByRole('button', { name: /Start free trial/i }).click({ timeout: 8000 })
  await page.waitForTimeout(600)
  const checkoutFailureText = await bodyText()
  record(
    'checkout failure recovery visible',
    checkoutFailureText.includes('Checkout is temporarily unavailable in QA mode.') &&
      checkoutFailureText.includes('Try again')
  )

  await gotoAccountBilling('&checkout=cancelled')
  record('checkout cancelled notice visible', (await bodyText()).includes('Checkout was cancelled. Your current plan is unchanged.'))

  await gotoAccountBilling('&upgraded=true')
  record('checkout return notice visible', (await bodyText()).includes('Checkout returned successfully. We are refreshing your subscription status.'))

  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }))
  record('no horizontal overflow', !metrics.horizontalOverflow, metrics)
} catch (error) {
  record('billing recovery smoke crashed', false, { error: error instanceof Error ? error.message : String(error) })
} finally {
  await context.close().catch(() => {})
  await browser.close().catch(() => {})
}

const summary = {
  baseUrl,
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
