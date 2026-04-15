import type { SupabaseClient } from '@supabase/supabase-js'
import type { Plan } from './plans'

export type Subscription = {
  plan: Plan
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeCustomerId: string | null
}

/** Fetch the user's subscription from the DB. Returns free plan if none found. */
export async function getUserSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<Subscription> {
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, cancel_at_period_end, stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (!data) {
    return { plan: 'free', status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false, stripeCustomerId: null }
  }

  const isActive = data.status === 'active' || data.status === 'trialing'
  return {
    plan: isActive ? (data.plan as Plan) : 'free',
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
    stripeCustomerId: data.stripe_customer_id,
  }
}

/** Quick isPro check for API route gating */
export async function isPro(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const sub = await getUserSubscription(supabase, userId)
  return sub.plan === 'pro'
}

/** Upsert subscription record after a Stripe webhook event */
export async function upsertSubscription(
  supabase: SupabaseClient,
  {
    userId,
    stripeCustomerId,
    stripeSubscriptionId,
    plan,
    status,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  }: {
    userId: string
    stripeCustomerId: string
    stripeSubscriptionId: string
    plan: Plan
    status: string
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
  }
) {
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      plan,
      status,
      current_period_end: currentPeriodEnd?.toISOString() ?? null,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
}
