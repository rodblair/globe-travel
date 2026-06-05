'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Check, Zap, Crown, AlertCircle, ShieldCheck } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { startCheckout } from '@/hooks/useSubscription'
import { useDialogFocus } from '@/hooks/useDialogFocus'
import { cn } from '@/lib/utils'

type UpgradeModalProps = {
  isOpen: boolean
  onClose: () => void
  /** Optional message shown above the plans (e.g. "You've reached your 3 journal entries limit") */
  reason?: string
  /** Development/testing hook for exercising checkout recovery without contacting Stripe. */
  checkoutFailureMessage?: string
}

export function UpgradeModal({ isOpen, onClose, reason, checkoutFailureMessage }: UpgradeModalProps) {
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [loading, setLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useDialogFocus({ isOpen, onClose, dialogRef })

  useEffect(() => {
    if (!isOpen) {
      setLoading(false)
      setBillingError(null)
    }
  }, [isOpen])

  const handleUpgrade = async () => {
    setBillingError(null)
    setLoading(true)
    try {
      if (checkoutFailureMessage) throw new Error(checkoutFailureMessage)
      await startCheckout(interval)
    } catch (error: unknown) {
      setBillingError(error instanceof Error ? error.message : 'Checkout is temporarily unavailable. Please try again.')
      setLoading(false)
    }
  }

  const monthlyCost = interval === 'year'
    ? (PLANS.pro.yearlyPrice / 12).toFixed(2)
    : PLANS.pro.monthlyPrice

  const trustItems = ['No charge today', 'Cancel anytime', 'Private by default']

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-paper-raised/85 backdrop-blur-md z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            ref={dialogRef}
            tabIndex={-1}
            className="fixed inset-x-3 bottom-3 z-50 max-h-[calc(100dvh-1.5rem)] overflow-y-auto sm:inset-x-4 sm:bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-xl md:-translate-x-1/2 md:-translate-y-1/2"
          >
            <div className="relative overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[var(--shadow-lg)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,var(--brass-subtle),transparent)]" />

              <div className="relative flex items-start justify-between gap-4 p-5 pb-4 sm:p-6 sm:pb-4">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[color:var(--brass)]/25 bg-[color:var(--brass-subtle)] px-3 py-1">
                    <Crown className="h-4 w-4 text-[var(--brass)]" />
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brass)]">{PLANS.pro.name}</span>
                  </div>
                  <h2 id={titleId} className="text-2xl font-serif font-bold leading-tight text-foreground">
                    Unlock the full planning workspace
                  </h2>
                  <p id={descriptionId} className="mt-2 max-w-md text-sm leading-relaxed text-ink-2">
                    {reason || 'Upgrade for unlimited trip notes, friend feedback, and richer planning tools.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close upgrade dialog"
                  className="touch-target flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-recessed text-ink-3 transition-colors hover:bg-paper-sumi hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative px-5 pb-4 sm:px-6">
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-rule bg-paper-recessed p-1">
                  {(['month', 'year'] as const).map((i) => (
                    <button
                      type="button"
                      key={i}
                      onClick={() => setInterval(i)}
                      aria-pressed={interval === i}
                      aria-label={i === 'year' ? 'Yearly, save 27 percent' : 'Monthly'}
                      className={cn(
                        'touch-target relative flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]',
                        interval === i ? 'bg-[var(--brass)] text-[var(--brass-text)] shadow-sm' : 'text-ink-2 hover:bg-paper-hover hover:text-foreground'
                      )}
                    >
                      {i === 'year' ? 'Yearly' : 'Monthly'}
                      {i === 'year' && (
                        <span className="rounded-full bg-[color:var(--pillar-nature-wash)] px-2 py-0.5 text-[10px] font-bold text-[var(--moss)]">
                          Save 27%
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative border-y border-rule bg-paper/45 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="text-5xl font-bold text-foreground">${monthlyCost}</span>
                  <span className="pb-1 text-sm font-medium text-ink-2">/ month</span>
                </div>
                {interval === 'year' && (
                  <p className="mt-1 text-sm text-ink-2">
                    Billed ${PLANS.pro.yearlyPrice}/year after your 7-day free trial.
                  </p>
                )}
                {interval === 'month' && (
                  <p className="mt-1 text-sm text-ink-2">7-day free trial, then ${PLANS.pro.monthlyPrice}/month.</p>
                )}
              </div>

              <div className="relative px-5 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-4">
                  {PLANS.pro.features.map((f) => (
                    <div key={f} className="flex min-w-0 items-start gap-2 text-sm leading-snug text-ink-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brass)]" />
                      <span className="min-w-0">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {billingError && (
                <div role="alert" aria-live="polite" className="relative mx-5 mb-4 rounded-xl border border-[color:var(--terracotta)]/25 bg-[color:var(--pillar-desert-wash)] px-4 py-3 text-sm text-[var(--terracotta)] sm:mx-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p>{billingError}</p>
                      <button
                        type="button"
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="touch-target mt-3 inline-flex items-center justify-center rounded-full border border-[color:var(--terracotta)]/30 bg-paper-raised px-3 py-2 text-xs font-semibold text-[var(--terracotta)] disabled:opacity-60"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="touch-target flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brass)] px-4 py-3.5 text-base font-bold text-[var(--brass-text)] shadow-lg shadow-[color:var(--brass-glow)] transition-all duration-200 hover:scale-[1.01] hover:bg-[var(--brass-hover)] disabled:scale-100 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
                >
                  <Zap className="h-4 w-4" />
                  {loading ? 'Redirecting to checkout…' : 'Start 7-day free trial'}
                </button>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] font-medium text-ink-3">
                  {trustItems.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--moss)]" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
