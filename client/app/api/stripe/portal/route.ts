import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'
import { getUserSubscription } from '@/lib/subscription'

const PLACEHOLDER_KEY = 'sk_test_placeholder'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === PLACEHOLDER_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured yet. Add your STRIPE_SECRET_KEY to .env.local.' },
        { status: 503 }
      )
    }

    const stripe = getStripe()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sub = await getUserSubscription(supabase, user.id)
    if (!sub.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }

    const origin = request.headers.get('origin') ?? 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${origin}/account?tab=billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not open billing portal'
    console.error('[stripe/portal]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
