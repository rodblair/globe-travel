'use client'

import { useQuery } from '@tanstack/react-query'
import type { Subscription } from '@/lib/subscription'

export function useSubscription() {
  const query = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const res = await fetch('/api/stripe/subscription')
      if (!res.ok) return { plan: 'free', status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false, stripeCustomerId: null }
      return res.json()
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  })

  const isPro = query.data?.plan === 'pro' && query.data?.status === 'active'

  return {
    subscription: query.data,
    isPro,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

/** Start a Stripe Checkout session and redirect */
export async function startCheckout(interval: 'month' | 'year' = 'month') {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interval }),
  })
  const { url, error } = await readBillingResponse(res)
  if (error) throw new Error(error)
  if (!url) throw new Error('Checkout did not return a redirect link. Please try again.')
  window.location.href = url
}

/** Open Stripe Customer Portal */
export async function openBillingPortal() {
  const res = await fetch('/api/stripe/portal', { method: 'POST' })
  const { url, error } = await readBillingResponse(res)
  if (error) throw new Error(error)
  if (!url) throw new Error('Billing portal did not return a redirect link. Please try again.')
  window.location.href = url
}

async function readBillingResponse(res: Response): Promise<{ url?: string; error?: string }> {
  try {
    return await res.json()
  } catch {
    return {
      error: res.ok
        ? 'Billing returned an unreadable response. Please try again.'
        : 'Billing is temporarily unavailable. Please try again soon.',
    }
  }
}
