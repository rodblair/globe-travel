import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { upsertSubscription } from '@/lib/subscription'
import { createServiceClient } from '@/lib/supabase-service'
import type Stripe from 'stripe'

// Stripe requires the raw body for signature verification
export const runtime = 'nodejs'

async function getUserIdFromCustomer(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  customerId: string
): Promise<string | null> {
  // First try our subscriptions table
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (data?.user_id) return data.user_id

  // Fall back to Stripe customer metadata
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
  return (customer.metadata?.supabase_user_id as string) ?? null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const userId = await getUserIdFromCustomer(supabase, customerId)
        if (!userId) break

        const priceId = subscription.items.data[0]?.price.id
        const isProPrice =
          priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
          priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID

        // In Stripe API 2026-03-25.dahlia, current_period_end moved to items.data[0]
        // Fall back to trial_end for trialing subscriptions
        const raw = subscription as unknown as Record<string, unknown>
        const itemRaw = (subscription.items.data[0] as unknown as Record<string, unknown>)
        const periodEndTs =
          (itemRaw?.current_period_end as number) ??
          (raw?.trial_end as number) ??
          null
        const periodEndDate = periodEndTs ? new Date(periodEndTs * 1000) : null

        await upsertSubscription(supabase, {
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          plan: isProPrice ? 'pro' : 'free',
          status: subscription.status,
          currentPeriodEnd: periodEndDate,
          cancelAtPeriodEnd: (raw?.cancel_at_period_end as boolean) ?? false,
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const userId = await getUserIdFromCustomer(supabase, customerId)
        if (!userId) break

        await upsertSubscription(supabase, {
          userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          plan: 'free',
          status: 'canceled',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        })
        break
      }

      case 'checkout.session.completed': {
        // Subscription already handled by customer.subscription.created
        // but log for visibility
        const session = event.data.object as Stripe.Checkout.Session
        console.log('[webhook] checkout.session.completed', session.id, 'customer:', session.customer)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const userId = await getUserIdFromCustomer(supabase, customerId)
        if (userId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due', updated_at: new Date().toISOString() })
            .eq('user_id', userId)
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
