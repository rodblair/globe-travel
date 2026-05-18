import { mkdir, readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import Stripe from 'stripe'
import { chromium } from 'playwright-core'

const root = process.cwd()
const repoRoot = resolve(root, '..')
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const runHostedCheckout = process.env.QA_STRIPE_RUN_HOSTED_CHECKOUT === '1'
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const date = process.env.QA_STRIPE_DATE || new Date().toISOString().slice(0, 10)
const runId = process.env.QA_RUN_ID || randomUUID().slice(0, 8)
const artifactName = process.env.QA_STRIPE_CHECKOUT_ARTIFACT_NAME || `stripe-checkout-browser-${date}`
const artifactDir = resolve(repoRoot, 'qa', artifactName)
const screenshotsDir = resolve(artifactDir, 'screenshots')
const failures = []
const results = []

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

function mask(value) {
  if (!value) return null
  return `${value.slice(0, Math.min(10, value.length))}${value.length > 10 ? '...' : ''}`
}

async function fetchLocal(path) {
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: 'manual',
      headers: { 'user-agent': 'globe-travel-stripe-checkout-browser/1.0' },
    })
    return { ok: response.status >= 200 && response.status < 500, status: response.status }
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) }
  }
}

await loadDotEnv()

record('hosted checkout browser run is explicitly enabled', runHostedCheckout, {
  enableWith: 'QA_STRIPE_RUN_HOSTED_CHECKOUT=1',
})

const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
record('checkout return URL is local', isLocalBaseUrl, { baseUrl })

const localProbe = await fetchLocal('/account?tab=billing')
record('local app is reachable for checkout return', localProbe.ok, localProbe)

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const monthlyPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID
record('STRIPE_SECRET_KEY is configured for test checkout', Boolean(stripeSecretKey), { value: mask(stripeSecretKey) })
record('STRIPE_SECRET_KEY is test mode', typeof stripeSecretKey === 'string' && stripeSecretKey.startsWith('sk_test_'))
record('STRIPE_PRO_MONTHLY_PRICE_ID is configured', Boolean(monthlyPriceId), { value: mask(monthlyPriceId) })

if (!runHostedCheckout || !isLocalBaseUrl || !localProbe.ok || !stripeSecretKey?.startsWith('sk_test_') || !monthlyPriceId) {
  console.log(JSON.stringify({
    baseUrl,
    checked: results.length,
    passed: results.filter((result) => result.ok).length,
    failed: failures.length,
    runHostedCheckout,
    results,
    failures,
  }, null, 2))
  process.exit(failures.length > 0 ? 1 : 0)
}

await mkdir(screenshotsDir, { recursive: true })

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

let browser = null
let customer = null
let checkoutSession = null
let completedSession = null
let subscription = null

try {
  const price = await stripe.prices.retrieve(monthlyPriceId)
  record('monthly Stripe price is active test subscription price', Boolean(
    price.active &&
    price.livemode === false &&
    price.recurring?.interval === 'month'
  ), {
    priceId: price.id,
    active: price.active,
    livemode: price.livemode,
    interval: price.recurring?.interval || null,
    amount: price.unit_amount,
  })

  customer = await stripe.customers.create({
    email: `qa-checkout-browser-${runId}@globe-travel.local`,
    name: `Globe.travel checkout QA ${runId}`,
    metadata: {
      qa: 'true',
      qa_run_id: runId,
      purpose: 'stripe-checkout-browser',
    },
  })
  record('Stripe test customer can be created for browser checkout', customer.livemode === false, {
    customerId: customer.id,
    livemode: customer.livemode,
  })

  checkoutSession = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ['card'],
    line_items: [{ price: price.id, quantity: 1 }],
    mode: 'subscription',
    success_url: `${baseUrl}/account?tab=billing&upgraded=true&qaStripeCheckout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/account?tab=billing&checkout=cancelled&qaStripeCheckout=cancel`,
    subscription_data: {
      metadata: { supabase_user_id: `qa-${runId}` },
      trial_period_days: 7,
    },
    allow_promotion_codes: true,
  })
  record('Stripe hosted checkout session can be created for browser completion', Boolean(checkoutSession.url && checkoutSession.status === 'open'), {
    sessionId: checkoutSession.id,
    status: checkoutSession.status,
    hasUrl: Boolean(checkoutSession.url),
    livemode: checkoutSession.livemode,
  })

  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })

  await page.goto(checkoutSession.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(1200)

  const checkoutText = await page.locator('body').innerText({ timeout: 10000 })
  record('hosted Stripe checkout page renders expected subscription offer', (
    checkoutText.includes('Try Adventurer Pro') &&
    checkoutText.includes('7 days free') &&
    checkoutText.includes('$4.99')
  ), {
    title: await page.title(),
    urlHost: new URL(page.url()).host,
  })

  await page.screenshot({ path: resolve(screenshotsDir, 'stripe-checkout-loaded.png'), fullPage: false })

  await page.locator('input[name="cardNumber"]').fill('4242424242424242')
  await page.locator('input[name="cardExpiry"]').fill('1234')
  await page.locator('input[name="cardCvc"]').fill('123')
  await page.locator('input[name="billingName"]').fill('Globe Travel QA')
  await page.locator('select[name="billingCountry"]').selectOption('US')
  const postalCode = page.locator('input[name="billingPostalCode"]')
  if (await postalCode.count()) {
    await postalCode.fill('94107')
  }

  await page.screenshot({ path: resolve(screenshotsDir, 'stripe-checkout-filled.png'), fullPage: false })

  await Promise.all([
    page.waitForURL(new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/account`), { timeout: 60000 }),
    page.locator('button[type="submit"]').click(),
  ])
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  await page.screenshot({ path: resolve(screenshotsDir, 'stripe-checkout-returned.png'), fullPage: false })

  const returnMetrics = await page.evaluate(() => {
    const text = document.body?.innerText || ''
    return {
      url: location.href,
      title: document.title,
      hasCheckoutSuccess: text.includes('Checkout returned successfully'),
      hasBillingSurface: text.includes('Plan and billing'),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      appErrors: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].filter((pattern) => text.includes(pattern)),
    }
  })
  record('checkout returns to Globe.travel billing success state', (
    returnMetrics.url.includes('/account') &&
    returnMetrics.url.includes('upgraded=true') &&
    returnMetrics.hasCheckoutSuccess &&
    returnMetrics.hasBillingSurface &&
    !returnMetrics.horizontalOverflow &&
    returnMetrics.appErrors.length === 0
  ), returnMetrics)

  completedSession = await stripe.checkout.sessions.retrieve(checkoutSession.id, {
    expand: ['subscription'],
  })
  const expandedSubscription = typeof completedSession.subscription === 'string' ? null : completedSession.subscription
  const subscriptionId = typeof completedSession.subscription === 'string'
    ? completedSession.subscription
    : expandedSubscription?.id

  record('Stripe checkout session completed after browser payment', (
    completedSession.status === 'complete' &&
    completedSession.payment_status === 'paid' &&
    Boolean(subscriptionId)
  ), {
    sessionId: completedSession.id,
    status: completedSession.status,
    paymentStatus: completedSession.payment_status,
    subscriptionId,
  })

  if (subscriptionId) {
    subscription = expandedSubscription || await stripe.subscriptions.retrieve(subscriptionId)
    record('Stripe subscription enters trialing state after browser checkout', subscription.status === 'trialing', {
      subscriptionId: subscription.id,
      status: subscription.status,
      customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
    })
  }
} catch (error) {
  record('hosted Stripe checkout browser flow completes', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  if (browser) {
    await browser.close().catch(() => {})
  }

  if (subscription?.id && subscription.status !== 'canceled') {
    try {
      const canceled = await stripe.subscriptions.cancel(subscription.id)
      record('Stripe browser checkout subscription cleanup succeeds', canceled.status === 'canceled', {
        subscriptionId: canceled.id,
        status: canceled.status,
      })
    } catch (error) {
      record('Stripe browser checkout subscription cleanup succeeds', false, {
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  } else if (checkoutSession?.id && !completedSession) {
    try {
      const expired = await stripe.checkout.sessions.expire(checkoutSession.id)
      record('incomplete Stripe checkout session cleanup succeeds', expired.status === 'expired', {
        sessionId: expired.id,
        status: expired.status,
      })
    } catch (error) {
      record('incomplete Stripe checkout session cleanup succeeds', false, {
        sessionId: checkoutSession.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (customer?.id) {
    try {
      const deleted = await stripe.customers.del(customer.id)
      record('Stripe browser checkout customer cleanup succeeds', deleted.deleted === true, {
        customerId: deleted.id,
        deleted: deleted.deleted,
      })
    } catch (error) {
      record('Stripe browser checkout customer cleanup succeeds', false, {
        customerId: customer.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

const summary = {
  baseUrl,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  runHostedCheckout,
  runId,
  artifactDir,
  screenshots: {
    loaded: `qa/${artifactName}/screenshots/stripe-checkout-loaded.png`,
    filled: `qa/${artifactName}/screenshots/stripe-checkout-filled.png`,
    returned: `qa/${artifactName}/screenshots/stripe-checkout-returned.png`,
  },
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
