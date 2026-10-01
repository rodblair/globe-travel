'use client'

import { useEffect, useState } from 'react'
import { X, Check, Zap, Crown, AlertCircle, ShieldCheck } from 'lucide-react'
import { PLANS } from '@/lib/plans'
import { startCheckout } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IconButton } from '@/components/ui/icon-button'

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
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogContent
        className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl border-border bg-card p-0 shadow-lg sm:max-w-xl"
        showCloseButton={false}
      >
        <div className="relative overflow-hidden">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]" />

              <DialogHeader className="relative flex-row items-start justify-between gap-4 p-5 pb-4 text-left sm:p-6 sm:pb-4">
                <div className="min-w-0">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-[color:color-mix(in_oklch,var(--primary)_10%,transparent)] px-3 py-1">
                    <Crown className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-primary">{PLANS.pro.name}</span>
                  </div>
                  <DialogTitle className="text-2xl font-bold leading-tight text-foreground">
                    Unlock the full planning workspace
                  </DialogTitle>
                  <DialogDescription className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {reason || 'Upgrade for unlimited trip notes, friend feedback, and richer planning tools.'}
                  </DialogDescription>
                </div>
                <DialogClose asChild>
                  <IconButton label="Close upgrade dialog" variant="secondary" className="shrink-0">
                    <X className="h-4 w-4" />
                  </IconButton>
                </DialogClose>
              </DialogHeader>

              <div className="relative px-5 pb-4 sm:px-6">
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1">
                  {(['month', 'year'] as const).map((i) => (
                    <Button
                      type="button"
                      key={i}
                      onClick={() => setInterval(i)}
                      aria-pressed={interval === i}
                      aria-label={i === 'year' ? 'Yearly, save 27 percent' : 'Monthly'}
                      variant={interval === i ? 'default' : 'ghost'}
                      className={cn(
                        'relative min-h-11 rounded-lg shadow-none',
                        interval !== i && 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {i === 'year' ? 'Yearly' : 'Monthly'}
                      {i === 'year' && (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                          Save 27%
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="relative border-y border-border bg-background px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="text-5xl font-bold text-foreground">${monthlyCost}</span>
                  <span className="pb-1 text-sm font-medium text-muted-foreground">/ month</span>
                </div>
                {interval === 'year' && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Billed ${PLANS.pro.yearlyPrice}/year after your 7-day free trial.
                  </p>
                )}
                {interval === 'month' && (
                  <p className="mt-1 text-sm text-muted-foreground">7-day free trial, then ${PLANS.pro.monthlyPrice}/month.</p>
                )}
              </div>

              <div className="relative px-5 py-5 sm:px-6">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-4">
                  {PLANS.pro.features.map((f) => (
                    <div key={f} className="flex min-w-0 items-start gap-2 text-sm leading-snug text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="min-w-0">{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {billingError && (
                <Alert variant="destructive" aria-live="polite" className="relative mx-5 mb-4 border-[color:var(--destructive)]/25 bg-destructive/10 text-destructive sm:mx-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div>
                      <p>{billingError}</p>
                      <Button
                        type="button"
                        onClick={handleUpgrade}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="mt-3 border-[color:var(--destructive)]/30 bg-card text-destructive disabled:opacity-60"
                      >
                        Try again
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="relative px-5 pb-5 sm:px-6 sm:pb-6">
                <Button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={loading}
                  size="xl"
                  className="w-full rounded-xl text-base font-bold shadow-lg shadow-[color:color-mix(in_oklch,var(--primary)_28%,transparent)] hover:scale-[1.01] disabled:scale-100"
                >
                  <Zap className="h-4 w-4" />
                  {loading ? 'Redirecting to checkout…' : 'Start 7-day free trial'}
                </Button>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs font-medium text-muted-foreground">
                  {trustItems.map((item) => (
                    <span key={item} className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-success" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
      </DialogContent>
    </Dialog>
  )
}
