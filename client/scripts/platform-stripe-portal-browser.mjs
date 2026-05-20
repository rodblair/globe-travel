import { randomUUID } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import Stripe from 'stripe'
import { chromium } from 'playwright-core'

const root = process.cwd()
const repoRoot = resolve(root, '..')
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const runPortalBrowser = process.env.QA_STRIPE_RUN_PORTAL_BROWSER === '1'
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const date = process.env.QA_STRIPE_DATE || new Date().toISOString().slice(0, 10)
const runId = process.env.QA_RUN_ID || randomUUID().slice(0, 8)
const artifactName = process.env.QA_STRIPE_PORTAL_ARTIFACT_NAME || `stripe-portal-browser-${date}`
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
      headers: { 'user-agent': 'globe-travel-stripe-portal-browser/1.0' },
    })
    return { ok: response.status >= 200 && response.status < 500, status: response.status }
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) }
  }
}

await loadDotEnv()

record('hosted portal browser run is explicitly enabled', runPortalBrowser, {
  enableWith: 'QA_STRIPE_RUN_PORTAL_BROWSER=1',
})

const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
record('billing portal return URL is local', isLocalBaseUrl, { baseUrl })

const localProbe = await fetchLocal('/account?tab=billing')
record('local app is reachable for portal return', localProbe.ok, localProbe)

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const monthlyPriceId = process.env.STRIPE_PRO_MONTHLY_PRICE_ID
record('STRIPE_SECRET_KEY is configured for portal QA', Boolean(stripeSecretKey), { value: mask(stripeSecretKey) })
record('STRIPE_SECRET_KEY is test mode', typeof stripeSecretKey === 'string' && stripeSecretKey.startsWith('sk_test_'))
record('STRIPE_PRO_MONTHLY_PRICE_ID is configured', Boolean(monthlyPriceId), { value: mask(monthlyPriceId) })

if (!runPortalBrowser || !isLocalBaseUrl || !localProbe.ok || !stripeSecretKey?.startsWith('sk_test_') || !monthlyPriceId) {
  console.log(JSON.stringify({
    baseUrl,
    checked: results.length,
    passed: results.filter((result) => result.ok).length,
    failed: failures.length,
    runPortalBrowser,
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
let subscription = null
let portalSession = null

try {
  const price = await stripe.prices.retrieve(monthlyPriceId)
  record('monthly Stripe price is active test subscription price for portal QA', Boolean(
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

  const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 1 })
  const portalConfig = configs.data[0] || null
  record('Stripe billing portal has active test configuration for browser QA', Boolean(portalConfig && portalConfig.livemode === false), {
    configurationId: portalConfig?.id || null,
    livemode: portalConfig?.livemode ?? null,
    active: portalConfig?.active ?? null,
  })

  customer = await stripe.customers.create({
    email: `qa-portal-browser-${runId}@globe-travel.local`,
    name: `Globe.travel portal QA ${runId}`,
    metadata: {
      qa: 'true',
      qa_run_id: runId,
      purpose: 'stripe-portal-browser',
    },
  })
  record('Stripe test customer can be created for hosted portal', customer.livemode === false, {
    customerId: customer.id,
    livemode: customer.livemode,
  })

  subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: price.id }],
    trial_period_days: 7,
    metadata: {
      qa: 'true',
      qa_run_id: runId,
      purpose: 'stripe-portal-browser',
    },
  })
  record('Stripe trial subscription can be created for hosted portal', subscription.status === 'trialing', {
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id,
  })

  portalSession = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${baseUrl}/account?tab=billing&qaStripePortal=returned`,
  })
  record('Stripe hosted billing portal session can be created', Boolean(portalSession.url && portalSession.livemode === false), {
    sessionId: portalSession.id,
    hasUrl: Boolean(portalSession.url),
    livemode: portalSession.livemode,
  })

  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
  })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })

  await page.goto(portalSession.url, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(1200)
  await page.screenshot({ path: resolve(screenshotsDir, 'stripe-portal-loaded.png'), fullPage: false })

  const portalMetrics = await page.evaluate((returnBaseUrl) => {
    const text = document.body?.innerText || ''
    const links = Array.from(document.querySelectorAll('a')).map((link) => ({
      href: link.href,
      text: link.textContent?.replace(/\s+/g, ' ').trim() || '',
    }))
    return {
      url: location.href,
      title: document.title,
      textSample: text.slice(0, 600),
      hasStripeError: /Something went wrong|Unable to load|No such customer|expired/i.test(text),
      hasPortalLanguage: /billing|subscription|payment|invoice|Adventurer|Globe\.travel/i.test(text),
      returnHref: links.find((link) => link.href.startsWith(returnBaseUrl))?.href || null,
    }
  }, baseUrl)

  record('hosted Stripe billing portal renders subscription management surface', (
    new URL(portalMetrics.url).host.includes('stripe.com') &&
    portalMetrics.hasPortalLanguage &&
    !portalMetrics.hasStripeError
  ), portalMetrics)

  record('hosted Stripe billing portal exposes return link to Globe.travel', Boolean(portalMetrics.returnHref), {
    returnHref: portalMetrics.returnHref,
  })

  if (portalMetrics.returnHref) {
    await page.goto(portalMetrics.returnHref, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
    await page.screenshot({ path: resolve(screenshotsDir, 'stripe-portal-returned.png'), fullPage: false })
    const returnMetrics = await page.evaluate(() => {
      const text = document.body?.innerText || ''
      return {
        url: location.href,
        title: document.title,
        hasBillingSurface: text.includes('Plan and billing'),
        hasLoginSurface: text.includes('Welcome back') || text.includes('Sign in'),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        appErrors: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].filter((pattern) => text.includes(pattern)),
      }
    })
    record('billing portal return reaches Globe.travel without layout failure', (
      returnMetrics.url.startsWith(baseUrl) &&
      (returnMetrics.hasBillingSurface || returnMetrics.hasLoginSurface) &&
      !returnMetrics.horizontalOverflow &&
      returnMetrics.appErrors.length === 0
    ), returnMetrics)
  }
} catch (error) {
  record('hosted Stripe billing portal browser flow completes', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  if (browser) {
    await browser.close().catch(() => {})
  }

  if (subscription?.id && subscription.status !== 'canceled') {
    try {
      const canceled = await stripe.subscriptions.cancel(subscription.id)
      record('Stripe portal subscription cleanup succeeds', canceled.status === 'canceled', {
        subscriptionId: canceled.id,
        status: canceled.status,
      })
    } catch (error) {
      record('Stripe portal subscription cleanup succeeds', false, {
        subscriptionId: subscription.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  if (customer?.id) {
    try {
      const deleted = await stripe.customers.del(customer.id)
      record('Stripe portal customer cleanup succeeds', deleted.deleted === true, {
        customerId: deleted.id,
        deleted: deleted.deleted,
      })
    } catch (error) {
      record('Stripe portal customer cleanup succeeds', false, {
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
  runPortalBrowser,
  runId,
  artifactDir,
  screenshots: {
    loaded: `qa/${artifactName}/screenshots/stripe-portal-loaded.png`,
    returned: `qa/${artifactName}/screenshots/stripe-portal-returned.png`,
  },
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
