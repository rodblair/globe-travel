import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import Stripe from 'stripe'

const root = process.cwd()
const createTestSessions = process.env.QA_STRIPE_CREATE_TEST_SESSIONS === '1'
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

function requireEnv(key) {
  const value = process.env[key]
  record(`${key} is configured`, Boolean(value), { value: mask(value) })
  return value
}

await loadDotEnv()

const stripeSecretKey = requireEnv('STRIPE_SECRET_KEY')
const monthlyPriceId = requireEnv('STRIPE_PRO_MONTHLY_PRICE_ID')
const yearlyPriceId = requireEnv('STRIPE_PRO_YEARLY_PRICE_ID')
const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET')

const hasRequiredEnv = Boolean(stripeSecretKey && monthlyPriceId && yearlyPriceId && webhookSecret)
record('Stripe secret key is test mode', typeof stripeSecretKey === 'string' && stripeSecretKey.startsWith('sk_test_'), {
  livemodeKey: typeof stripeSecretKey === 'string' ? stripeSecretKey.startsWith('sk_live_') : false,
})
record('Stripe webhook secret has expected format', typeof webhookSecret === 'string' && webhookSecret.startsWith('whsec_'))

if (!hasRequiredEnv || !stripeSecretKey?.startsWith('sk_test_')) {
  console.log(JSON.stringify({
    checked: results.length,
    passed: results.filter((result) => result.ok).length,
    failed: failures.length,
    createTestSessions,
    results,
    failures,
  }, null, 2))
  process.exit(failures.length > 0 ? 1 : 0)
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

async function checkPrice({ key, priceId, expectedInterval, expectedAmount }) {
  try {
    const price = await stripe.prices.retrieve(priceId)
    const ok =
      price.active === true &&
      price.livemode === false &&
      price.currency === 'usd' &&
      price.recurring?.interval === expectedInterval &&
      price.unit_amount === expectedAmount

    record(`${key} resolves to expected Stripe test price`, ok, {
      priceId: price.id,
      livemode: price.livemode,
      active: price.active,
      currency: price.currency,
      interval: price.recurring?.interval || null,
      amount: price.unit_amount,
      expectedInterval,
      expectedAmount,
    })
    return price
  } catch (error) {
    record(`${key} resolves to expected Stripe test price`, false, {
      priceId,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

const monthlyPrice = await checkPrice({
  key: 'STRIPE_PRO_MONTHLY_PRICE_ID',
  priceId: monthlyPriceId,
  expectedInterval: 'month',
  expectedAmount: 499,
})

const yearlyPrice = await checkPrice({
  key: 'STRIPE_PRO_YEARLY_PRICE_ID',
  priceId: yearlyPriceId,
  expectedInterval: 'year',
  expectedAmount: 4900,
})

try {
  const payload = JSON.stringify({
    id: `evt_globe_qa_${randomUUID()}`,
    object: 'event',
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_globe_qa', object: 'checkout.session' } },
  })
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  })
  const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  record('Stripe webhook signature verification succeeds locally', event.type === 'checkout.session.completed', {
    eventType: event.type,
  })
} catch (error) {
  record('Stripe webhook signature verification succeeds locally', false, {
    error: error instanceof Error ? error.message : String(error),
  })
}

let portalConfig = null
try {
  const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 1 })
  portalConfig = configs.data[0] || null
  record('Stripe billing portal has active test configuration', Boolean(portalConfig && portalConfig.livemode === false), {
    configurationId: portalConfig?.id || null,
    livemode: portalConfig?.livemode ?? null,
    active: portalConfig?.active ?? null,
  })
} catch (error) {
  record('Stripe billing portal has active test configuration', false, {
    error: error instanceof Error ? error.message : String(error),
  })
}

if (createTestSessions) {
  const runId = randomUUID().slice(0, 8)
  let customer = null
  let checkoutSession = null

  try {
    customer = await stripe.customers.create({
      email: `qa-billing-${runId}@globe-travel.local`,
      name: `Globe.travel QA ${runId}`,
      metadata: {
        qa: 'true',
        qa_run_id: runId,
        purpose: 'stripe-readiness-smoke',
      },
    })

    record('Stripe test customer can be created', customer.livemode === false, {
      customerId: customer.id,
      livemode: customer.livemode,
    })

    checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: monthlyPrice?.id || monthlyPriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: 'http://localhost:3000/account?tab=billing&upgraded=true',
      cancel_url: 'http://localhost:3000/account?tab=billing&checkout=cancelled',
      subscription_data: {
        metadata: { supabase_user_id: `qa-${runId}` },
        trial_period_days: 7,
      },
      allow_promotion_codes: true,
    })

    record('Stripe test checkout session can be created', Boolean(checkoutSession.url && checkoutSession.mode === 'subscription' && checkoutSession.status === 'open'), {
      sessionId: checkoutSession.id,
      mode: checkoutSession.mode,
      status: checkoutSession.status,
      hasUrl: Boolean(checkoutSession.url),
      livemode: checkoutSession.livemode,
    })

    if (portalConfig) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: 'http://localhost:3000/account?tab=billing',
      })
      record('Stripe test billing portal session can be created', Boolean(portalSession.url && portalSession.livemode === false), {
        sessionId: portalSession.id,
        hasUrl: Boolean(portalSession.url),
        livemode: portalSession.livemode,
      })
    }
  } catch (error) {
    record('Stripe test checkout and portal session creation completes', false, {
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    if (checkoutSession?.id && checkoutSession.status === 'open') {
      try {
        const expired = await stripe.checkout.sessions.expire(checkoutSession.id)
        record('Stripe test checkout session can be expired', expired.status === 'expired', {
          sessionId: expired.id,
          status: expired.status,
        })
      } catch (error) {
        record('Stripe test checkout session can be expired', false, {
          sessionId: checkoutSession.id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    if (customer?.id) {
      try {
        const deleted = await stripe.customers.del(customer.id)
        record('Stripe test customer cleanup succeeds', deleted.deleted === true, {
          customerId: deleted.id,
          deleted: deleted.deleted,
        })
      } catch (error) {
        record('Stripe test customer cleanup succeeds', false, {
          customerId: customer.id,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }
} else {
  record('Stripe test session mutation skipped by default', true, {
    enableWith: 'QA_STRIPE_CREATE_TEST_SESSIONS=1',
  })
}

const summary = {
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  createTestSessions,
  monthlyPriceId: monthlyPrice?.id || null,
  yearlyPriceId: yearlyPrice?.id || null,
  portalConfigurationId: portalConfig?.id || null,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
