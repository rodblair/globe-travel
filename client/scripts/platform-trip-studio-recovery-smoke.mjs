import { chromium } from 'playwright-core'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const tripId = process.env.QA_TRIP_ID
const guestId = process.env.QA_GUEST_ID
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)

if (!isLocalBaseUrl) {
  console.error('qa:studio-recovery only runs against localhost.')
  process.exit(1)
}

if (!tripId) {
  console.error('QA_TRIP_ID is required for qa:studio-recovery.')
  process.exit(1)
}

if (!guestId) {
  console.error('QA_GUEST_ID is required so the browser can access the owned trip.')
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

const page = await context.newPage()
const failures = []

function record(name, ok, details = {}) {
  const result = { name, ok: Boolean(ok), ...details }
  if (!result.ok) failures.push(result)
  return result
}

async function visibleText() {
  return page.locator('body').innerText({ timeout: 5000 })
}

async function clickButton(name) {
  await page.getByRole('button', { name }).first().click({ timeout: 8000 })
}

try {
  await page.goto(`${baseUrl}/trips/${tripId}?qaOptimizeFailure=1&qaShareFailure=1&qaWorkflowFailure=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {})
  await page.waitForTimeout(800)
  await page
    .waitForFunction(() => document.body.innerText.includes('Share with friends'), { timeout: 15000 })
    .catch(() => {})

  const initialText = await visibleText()
  record(
    'owner controls visible',
    initialText.includes('Save trip') &&
      (initialText.includes('Build maps') || initialText.includes('Maps built') || initialText.includes('Building maps')) &&
      initialText.includes('Share with friends')
  )

  await clickButton('Optimize day')
  await page.waitForTimeout(700)
  record('optimize failure recovery visible', (await visibleText()).includes('Could not optimize this day'))

  await clickButton('Share with friends')
  await page.waitForTimeout(700)
  record('share failure recovery visible', (await visibleText()).includes('Could not create a share link'))

  await clickButton('Refresh plan from feedback')
  await page.waitForTimeout(700)
  record('workflow failure recovery visible', (await visibleText()).includes('Could not start that trip option'))

  const deleteButton = page.getByRole('button', { name: /^Delete /i }).first()
  const deleteButtonName = await deleteButton.getAttribute('aria-label').catch(() => null)
  await deleteButton.click({ timeout: 8000 })
  await page.waitForTimeout(500)
  const deleteText = await visibleText()
  record(
    'delete confirmation visible',
    deleteText.includes('Delete “') && deleteText.includes('Delete item') && deleteText.includes('Cancel'),
    { deleteButtonName }
  )

  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }))
  record('no horizontal overflow', !metrics.horizontalOverflow, metrics)
} catch (error) {
  record('recovery smoke crashed', false, { error: error instanceof Error ? error.message : String(error) })
} finally {
  await context.close().catch(() => {})
  await browser.close().catch(() => {})
}

const summary = {
  baseUrl,
  tripId,
  checked: 6,
  passed: 6 - failures.length,
  failed: failures.length,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
