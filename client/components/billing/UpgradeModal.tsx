'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Check, Zap, Crown, Sparkles } from 'lucide-react'
import { PLANS, type Plan } from '@/lib/plans'
import { startCheckout } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'

type UpgradeModalProps = {
  isOpen: boolean
  onClose: () => void
  /** Optional message shown above the plans (e.g. "You've reached your 3 journal entries limit") */
  reason?: string
}

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      await startCheckout(interval)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  const monthlyCost = interval === 'year'
    ? (PLANS.pro.yearlyPrice / 12).toFixed(2)
    : PLANS.pro.monthlyPrice

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className="relative bg-[#0a0b14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
              {/* Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.08)_0%,transparent_60%)] pointer-events-none" />

              {/* Header */}
              <div className="relative flex items-start justify-between p-6 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Adventurer Pro</span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white">
                    Unlock everything
                  </h2>
                  {reason && (
                    <p className="text-sm text-white/50 mt-1">{reason}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Interval toggle */}
              <div className="relative px-6 pb-4">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
                  {(['month', 'year'] as const).map((i) => (
                    <button
                      key={i}
                      onClick={() => setInterval(i)}
                      className={cn(
                        'relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                        interval === i ? 'bg-amber-500 text-black' : 'text-white/50 hover:text-white'
                      )}
                    >
                      {i === 'year' ? 'Yearly' : 'Monthly'}
                      {i === 'year' && (
                        <span className="ml-1.5 text-[10px] font-bold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">
                          Save 27%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="relative px-6 pb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-bold text-white">${monthlyCost}</span>
                  <span className="text-white/40 text-sm">/ month</span>
                </div>
                {interval === 'year' && (
                  <p className="text-xs text-white/40 mt-0.5">
                    Billed ${PLANS.pro.yearlyPrice}/year — 7-day free trial
                  </p>
                )}
                {interval === 'month' && (
                  <p className="text-xs text-white/40 mt-0.5">7-day free trial, cancel anytime</p>
                )}
              </div>

              {/* Features */}
              <div className="relative px-6 pb-5">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {PLANS.pro.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="relative px-6 pb-6">
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-base transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100 shadow-lg shadow-amber-500/25"
                >
                  <Zap className="w-4 h-4" />
                  {loading ? 'Redirecting to checkout…' : 'Start 7-day free trial'}
                </button>
                <p className="text-center text-[11px] text-white/25 mt-2">
                  No charge during trial · Cancel anytime
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
