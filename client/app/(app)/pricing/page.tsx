'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, Zap, Globe, Crown, Sparkles, ArrowRight } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { startCheckout, openBillingPortal, useSubscription } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'

const FREE_FEATURES = PLANS.free.features
const PRO_FEATURES = PLANS.pro.features

const FAQ = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — every new subscription starts with a 7-day free trial. No charge until the trial ends, cancel anytime.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Absolutely. Cancel from your account settings and you keep Pro access until the end of your billing period.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards (Visa, Mastercard, Amex) via Stripe. Apple Pay and Google Pay where available.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'All your trips, journal entries, and places are preserved — you just lose the ability to create new ones beyond the free limits.',
  },
]

export default function PricingPage() {
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const { isPro, isLoading: subLoading } = useSubscription()

  const monthlyCost = interval === 'year'
    ? (PLANS.pro.yearlyPrice / 12).toFixed(2)
    : PLANS.pro.monthlyPrice

  const handleUpgrade = async () => {
    setLoading(true)
    setCheckoutError(null)
    try {
      await startCheckout(interval)
    } catch (e: unknown) {
      setCheckoutError(e instanceof Error ? e.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const handleManage = async () => {
    setLoading(true)
    try {
      await openBillingPortal()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.07)_0%,transparent_55%)]" />
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/8 text-amber-400 text-xs font-semibold uppercase tracking-widest mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simple pricing
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl md:text-5xl font-serif font-bold mb-4 leading-tight"
          >
            Travel without limits
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-white/50 max-w-xl mx-auto"
          >
            Start free. Upgrade when you're ready to unlock the full adventure.
          </motion.p>

          {/* Interval toggle */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center justify-center gap-1 mt-8 p-1 rounded-xl bg-white/5 border border-white/8 w-fit mx-auto"
          >
            {(['month', 'year'] as const).map((i) => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  interval === i ? 'bg-amber-500 text-black' : 'text-white/50 hover:text-white'
                )}
              >
                {i === 'year' ? 'Yearly' : 'Monthly'}
                {i === 'year' && (
                  <span className="ml-2 text-[10px] font-bold bg-green-500/25 text-green-400 px-1.5 py-0.5 rounded-full">
                    Save 18%
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Plans */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative bg-white/[0.03] border border-white/8 rounded-2xl p-7 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-5 h-5 text-white/40" />
              <span className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                {PLANS.free.name}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2 mb-1">
              <span className="text-4xl font-bold text-white">Free</span>
            </div>
            <p className="text-sm text-white/35 mb-6">Forever free, no card required</p>

            <ul className="space-y-3 flex-1 mb-7">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/55">
                  <Check className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-2 border-t border-white/5">
              <p className="text-center text-sm text-white/30 py-2">Your current plan</p>
            </div>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative bg-gradient-to-b from-amber-500/[0.07] to-transparent border border-amber-500/25 rounded-2xl p-7 flex flex-col overflow-hidden"
          >
            {/* Popular badge */}
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              Most popular
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400 uppercase tracking-wider">
                {PLANS.pro.name}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2 mb-0.5">
              <span className="text-4xl font-bold text-white">${monthlyCost}</span>
              <span className="text-white/40 text-sm">/ month</span>
            </div>
            <p className="text-sm text-white/35 mb-6">
              {interval === 'year'
                ? `$${PLANS.pro.yearlyPrice} billed annually · 7-day free trial`
                : 'Billed monthly · 7-day free trial'}
            </p>

            <ul className="space-y-3 flex-1 mb-7">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              {checkoutError && (
                <div className="mb-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 leading-snug">
                  ⚠️ {checkoutError}
                </div>
              )}
              {subLoading ? null : isPro ? (
                <button
                  onClick={handleManage}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  Manage subscription
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-base transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100 shadow-lg shadow-amber-500/20"
                >
                  <Zap className="w-4 h-4" />
                  {loading ? 'Redirecting…' : 'Start free trial'}
                </button>
              )}
              <p className="text-center text-[11px] text-white/25 mt-2">
                {isPro ? 'Billed via Stripe' : 'No charge during trial · Cancel anytime'}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Feature comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-16"
        >
          <h2 className="text-xl font-serif font-semibold text-white mb-6 text-center">Compare plans</h2>
          <div className="border border-white/8 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-white/[0.03] border-b border-white/8 text-xs uppercase tracking-widest text-white/40 font-semibold">
              <div className="px-5 py-3">Feature</div>
              <div className="px-5 py-3 text-center border-x border-white/5">Explorer</div>
              <div className="px-5 py-3 text-center text-amber-400">Adventurer</div>
            </div>
            {[
              ['Journal entries', '3', 'Unlimited'],
              ['Saved trips', '2', 'Unlimited'],
              ['AI messages / day', '10', 'Unlimited'],
              ['Maps & walking routes', '✓', '✓'],
              ['Bucket list places', '10', 'Unlimited'],
              ['Share trip itineraries', '—', '✓'],
              ['Priority AI responses', '—', '✓'],
              ['Export to PDF', '—', 'Coming soon'],
            ].map(([feature, free, pro], i) => (
              <div
                key={feature}
                className={cn(
                  'grid grid-cols-3 text-sm border-b border-white/5 last:border-0',
                  i % 2 === 0 ? 'bg-white/[0.01]' : ''
                )}
              >
                <div className="px-5 py-3.5 text-white/60">{feature}</div>
                <div className="px-5 py-3.5 text-center text-white/40 border-x border-white/5">{free}</div>
                <div className={cn(
                  'px-5 py-3.5 text-center font-medium',
                  pro === '—' ? 'text-white/20' : 'text-amber-400'
                )}>{pro}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <h2 className="text-xl font-serif font-semibold text-white mb-6 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-1.5">{q}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
