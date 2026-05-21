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

function includesText(source, expected) {
  return source.toLowerCase().includes(expected.toLowerCase())
}

async function gotoAccountBilling(query = '') {
  await page.goto(`${baseUrl}/account?tab=billing${query}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  await page.waitForLoadState('networkidle', { timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(700)
}

async function gotoSavedJournal(query = '') {
  await page.goto(`${baseUrl}/saved?tab=journal${query}`, {
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
    'free subscription state shows upgrade path',
    initialText.includes('Plan and billing') &&
      initialText.includes('Explorer') &&
      initialText.includes('Free') &&
      initialText.includes('Start free trial') &&
      initialText.includes('Plan comparison')
  )

  await gotoAccountBilling('&qaBillingState=active')
  const activeText = await bodyText()
  record(
    'active subscription is shown as paid Adventurer access',
    includesText(activeText, 'Adventurer') &&
      includesText(activeText, 'Active') &&
      includesText(activeText, 'Pro features are active on this account.') &&
      includesText(activeText, 'Manage billing')
  )

  await gotoAccountBilling('&qaBillingState=trialing')
  const trialingText = await bodyText()
  record(
    'trialing subscription is shown as Adventurer access',
    includesText(trialingText, 'Adventurer') &&
      includesText(trialingText, 'Trial active') &&
      includesText(trialingText, 'Your Adventurer trial is active') &&
      includesText(trialingText, 'Manage billing')
  )

  await gotoAccountBilling('&qaBillingState=canceling')
  const cancelingText = await bodyText()
  record(
    'cancel-at-period-end subscription keeps access clear',
    includesText(cancelingText, 'Adventurer') &&
      includesText(cancelingText, 'Cancels soon') &&
      includesText(cancelingText, 'Your Adventurer plan stays active until the current period ends.') &&
      includesText(cancelingText, 'Current period ends') &&
      includesText(cancelingText, 'Manage billing')
  )

  await gotoAccountBilling('&qaBillingState=past_due')
  const pastDueText = await bodyText()
  record(
    'past due subscription prompts billing recovery',
    includesText(pastDueText, 'Adventurer') &&
      includesText(pastDueText, 'Payment needs attention') &&
      includesText(pastDueText, 'Update billing') &&
      includesText(pastDueText, 'Manage billing')
  )

  await gotoAccountBilling('&qaBillingState=canceled')
  const canceledText = await bodyText()
  record(
    'canceled subscription state is explicit and recoverable',
    includesText(canceledText, 'Adventurer') &&
      includesText(canceledText, 'Canceled') &&
      includesText(canceledText, 'Your Adventurer subscription is canceled') &&
      includesText(canceledText, 'Manage billing')
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

  await gotoAccountBilling('&qaBillingState=trialing&qaPortalFailure=1')
  await page.getByRole('button', { name: /Manage billing/i }).click({ timeout: 8000 })
  await page.waitForTimeout(600)
  const portalFailureText = await bodyText()
  record(
    'billing portal failure recovery visible',
    portalFailureText.includes('Billing portal is temporarily unavailable in QA mode.') &&
      portalFailureText.includes('Try again')
  )

  await gotoAccountBilling('&checkout=cancelled')
  record('checkout cancelled notice visible', (await bodyText()).includes('Checkout was cancelled. Your current plan is unchanged.'))

  await gotoAccountBilling('&upgraded=true')
  record('checkout return notice visible', (await bodyText()).includes('Checkout returned successfully. We are refreshing your subscription status.'))

  await gotoSavedJournal('&qaUpgradeModal=1&qaCheckoutFailure=1')
  const upgradeDialog = page.getByRole('dialog', { name: /full planning workspace/i })
  await upgradeDialog.waitFor({ state: 'visible', timeout: 8000 })
  const upgradeText = await bodyText()
  const upgradeHasInitialFocus = await page.evaluate(() => document.activeElement === document.querySelector('[role="dialog"]'))
  record(
    'journal upgrade dialog is accessible and commercially ready',
    upgradeText.includes('Unlock the full planning workspace') &&
      upgradeText.includes('Friend-ready public review pages') &&
      !upgradeText.toLowerCase().includes('coming soon') &&
      upgradeHasInitialFocus
  )

  await page.getByRole('button', { name: /Start 7-day free trial/i }).click({ timeout: 8000 })
  await page.waitForTimeout(600)
  const upgradeFailureText = await bodyText()
  record(
    'journal upgrade dialog shows checkout recovery',
      upgradeFailureText.includes('Checkout is temporarily unavailable in QA mode.') &&
      upgradeFailureText.includes('Try again')
  )

  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab')
  }
  const upgradeFocusStayedInDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement))
  })
  record('journal upgrade dialog traps keyboard focus', upgradeFocusStayedInDialog)

  await page.keyboard.press('Escape')
  await upgradeDialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
  const upgradeVisibleAfterEscape = await upgradeDialog.isVisible().catch(() => false)
  record('journal upgrade dialog closes with Escape', !upgradeVisibleAfterEscape)

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
  await Promise.race([
    browser.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ])
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

process.exit(failures.length > 0 ? 1 : 0)
