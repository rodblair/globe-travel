// Server-only — never import this in client components
// For plan definitions usable on both client & server, import from '@/lib/plans'
import Stripe from 'stripe'
export { PLANS, type Plan } from './plans'

const PLACEHOLDER_KEY = 'sk_test_placeholder'

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY

  if (!key || key === PLACEHOLDER_KEY) {
    throw new Error('Stripe is not configured yet. Add STRIPE_SECRET_KEY to your environment variables.')
  }

  return new Stripe(key, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
}
