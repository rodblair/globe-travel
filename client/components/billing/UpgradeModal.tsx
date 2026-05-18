'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Check, Zap, Crown, AlertCircle } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { startCheckout } from '@/hooks/useSubscription'
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

  useEffect(() => {
    if (!isOpen) {
      setLoading(false)
      setBillingError(null)
      return
    }

    dialogRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) || []
      ).filter((element) => !element.hasAttribute('aria-hidden'))

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      } else if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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
            className="fixed inset-x-4 bottom-4 z-50 max-h-[calc(100dvh-2rem)] overflow-y-auto md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2"
          >
            <div className="relative overflow-hidden rounded-2xl border border-rule bg-paper-raised shadow-[var(--shadow-lg)]">
              {/* Glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.08)_0%,transparent_60%)] pointer-events-none" />

              {/* Header */}
              <div className="relative flex items-start justify-between p-6 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-5 h-5 text-[var(--brass)]" />
                    <span className="text-xs font-semibold text-[var(--brass)] uppercase tracking-widest">Adventurer</span>
                  </div>
                  <h2 id={titleId} className="text-2xl font-serif font-bold text-foreground">
                    Unlock the full planning workspace
                  </h2>
                  <p id={descriptionId} className="text-sm text-foreground/55 mt-1">
                    {reason || 'Upgrade for unlimited trip notes, friend feedback, and richer planning tools.'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close upgrade dialog"
                  className="p-2 rounded-xl bg-paper-recessed hover:bg-paper-recessed text-foreground/40 hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Interval toggle */}
              <div className="relative px-6 pb-4">
                <div className="flex items-center gap-1 p-1 rounded-xl bg-paper-recessed border border-rule w-fit">
                  {(['month', 'year'] as const).map((i) => (
                    <button
                      key={i}
                      onClick={() => setInterval(i)}
                      className={cn(
                        'relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                        interval === i ? 'bg-[var(--brass)] text-[var(--brass-text)]' : 'text-foreground/50 hover:text-foreground'
                      )}
                    >
                      {i === 'year' ? 'Yearly' : 'Monthly'}
                      {i === 'year' && (
                        <span className="ml-1.5 rounded-full bg-[color:var(--pillar-nature-wash)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--moss)]">
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
                  <span className="text-5xl font-bold text-foreground">${monthlyCost}</span>
                  <span className="text-foreground/40 text-sm">/ month</span>
                </div>
                {interval === 'year' && (
                  <p className="text-xs text-foreground/40 mt-0.5">
                    Billed ${PLANS.pro.yearlyPrice}/year — 7-day free trial
                  </p>
                )}
                {interval === 'month' && (
                  <p className="text-xs text-foreground/40 mt-0.5">7-day free trial, cancel anytime</p>
                )}
              </div>

              {/* Features */}
              <div className="relative px-6 pb-5">
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  {PLANS.pro.features.map((f) => (
                    <div key={f} className="flex items-start gap-2 text-sm text-foreground/70">
                      <Check className="w-3.5 h-3.5 text-[var(--brass)] mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {billingError && (
                <div className="relative mx-6 mb-4 rounded-xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] px-4 py-3 text-sm text-[var(--terracotta)]">
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

              {/* CTA */}
              <div className="relative px-6 pb-6">
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[var(--brass)] hover:bg-[var(--brass)] text-[var(--brass-text)] font-bold text-base transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100 shadow-lg shadow-[color:var(--brass-glow)]"
                >
                  <Zap className="w-4 h-4" />
                  {loading ? 'Redirecting to checkout…' : 'Start 7-day free trial'}
                </button>
                <p className="text-center text-[11px] text-foreground/25 mt-2">
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
