import { NextResponse } from 'next/server'
import { requireUser } from '@/app/api/trips/_utils'
import { getUserSubscription } from '@/lib/subscription'

export async function GET() {
  const { supabase, user } = await requireUser()
  if (!user) {
    return NextResponse.json({
      plan: 'free',
      status: 'active',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: null,
    })
  }

  const subscription = await getUserSubscription(supabase, user.id)
  return NextResponse.json(subscription)
}
