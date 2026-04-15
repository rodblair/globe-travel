import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'
import { getUserSubscription } from '@/lib/subscription'

const PLACEHOLDER_KEY = 'sk_test_placeholder'

export async function POST(request: NextRequest) {
  try {
    // Guard: real Stripe key required
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === PLACEHOLDER_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured yet. Add your STRIPE_SECRET_KEY to .env.local.' },
        { status: 503 }
      )
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { priceId, interval } = await request.json()
    const resolvedPriceId = priceId
      ?? (interval === 'year'
        ? process.env.STRIPE_PRO_YEARLY_PRICE_ID
        : process.env.STRIPE_PRO_MONTHLY_PRICE_ID)

    if (!resolvedPriceId || resolvedPriceId.startsWith('price_placeholder')) {
      return NextResponse.json(
        { error: 'Stripe Price IDs are not configured yet. Add STRIPE_PRO_MONTHLY_PRICE_ID and STRIPE_PRO_YEARLY_PRICE_ID to .env.local.' },
        { status: 503 }
      )
    }

    // Get or create Stripe customer
    const sub = await getUserSubscription(supabase, user.id)
    let customerId = sub.stripeCustomerId

    if (!customerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single()

      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.display_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase.from('subscriptions').upsert(
        { user_id: user.id, stripe_customer_id: customerId, plan: 'free', status: 'active' },
        { onConflict: 'user_id' }
      )
    }

    const origin = request.headers.get('origin') ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/settings?upgraded=true`,
      cancel_url: `${origin}/pricing`,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
        trial_period_days: 7,
      },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Checkout failed'
    console.error('[stripe/checkout]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
