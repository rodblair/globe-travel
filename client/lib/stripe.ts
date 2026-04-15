// Server-only — never import this in client components
// For plan definitions usable on both client & server, import from '@/lib/plans'
import Stripe from 'stripe'
export { PLANS, type Plan } from './plans'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})
