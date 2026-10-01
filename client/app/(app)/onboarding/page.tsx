'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { GlobeBrand } from '@/components/atmosphere/GlobeBrand'
import { CartographicPlate } from '@/components/brand/CartographicPlate'
import OnboardingChat from '@/components/chat/OnboardingChat'
import type { PlaceEvent } from '@/hooks/useChat'

type GlobePin = {
  latitude: number
  longitude: number
  status: 'visited' | 'bucket_list'
  name: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)
  const [completionError, setCompletionError] = useState<string | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [qaCanFinish, setQaCanFinish] = useState(false)
  const [globePins, setGlobePins] = useState<GlobePin[]>([])

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    const params = new URLSearchParams(window.location.search)
    setQaCanFinish(params.get('qaCanFinish') === '1')
  }, [])

  const handlePlaceAdded = useCallback((event: PlaceEvent) => {
    setGlobePins(prev => [
      ...prev,
      {
        latitude: event.place.latitude,
        longitude: event.place.longitude,
        status: event.place.status,
        name: event.place.name,
      },
    ])
  }, [])

  const handleComplete = useCallback(async () => {
    if (completing) return
    setCompleting(true)
    setCompletionError(null)

    // Complete onboarding before leaving this fullscreen flow so middleware allows the app shell.
    try {
      const params = new URLSearchParams(window.location.search)
      if (process.env.NODE_ENV !== 'production' && params.get('qaProfileSave') === 'fail') {
        throw new Error('QA profile save failure')
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: true }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const message = typeof body?.error === 'string' ? body.error : 'Profile update failed.'
        throw new Error(message)
      }
    } catch {
      setCompleting(false)
      setShowCelebration(false)
      setCompletionError('We could not save your setup yet. Check your connection and try again.')
      return
    }

    setShowCelebration(true)

    // Navigate after short celebration
    setTimeout(() => {
      router.push('/chat')
    }, 1500)
  }, [router, completing])

  return (
    <div className="fixed inset-0 bg-background overflow-hidden z-50">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-background"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Sparkles className="size-7" />
              </motion.div>
              <h2 className="mb-1.5 text-4xl text-foreground">You&apos;re all set.</h2>
              <p className="text-muted-foreground text-sm">
                {globePins.length} itinerary idea{globePins.length === 1 ? '' : 's'} captured
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="relative z-10 flex h-full">
        {/* Left side - live map plate (desktop only) */}
        <div className="relative hidden overflow-hidden border-r border-border bg-plate text-plate-foreground lg:flex lg:w-[45%] lg:flex-col lg:justify-between lg:p-12">
          <GlobeBrand className="text-plate-foreground" markClassName="text-plate-foreground [--mark-bg:var(--plate)]" />

          <div>
            <div className="overflow-hidden rounded-lg border border-plate-foreground/60 bg-card shadow-[6px_6px_0_0_oklch(0.955_0.013_88/0.9)]">
              <div className="aspect-[4/3]">
                <CartographicPlate
                  seed={`onboarding-${globePins.length}`}
                  stops={Math.max(2, globePins.length + 1)}
                  label="A route that grows as you add places"
                />
              </div>
            </div>
            <ol className="mt-8 divide-y divide-plate-foreground/20 border-y border-plate-foreground/20">
              {globePins.length === 0 ? (
                <li className="py-3 text-plate-foreground/70">Places you mention appear here as numbered stops.</li>
              ) : (
                globePins.slice(-5).map((pin, index) => (
                  <li key={`${pin.name}-${index}`} className="flex items-center gap-3 py-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {Math.max(0, globePins.length - 5) + index + 1}
                    </span>
                    <span className="truncate font-medium">{pin.name}</span>
                  </li>
                ))
              )}
            </ol>
          </div>

          <p className="text-sm text-plate-foreground/60">
            {globePins.length === 0 ? 'Start chatting to draw your first route.' : `${globePins.length} idea${globePins.length !== 1 ? 's' : ''} ready to plan`}
          </p>
        </div>

        {/* Right side - Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Progress header */}
          <div className="flex-shrink-0 border-b border-border px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <GlobeBrand compact className="mb-3 lg:hidden" />
                <h1 className="text-3xl leading-tight text-foreground">Start your group trip</h1>
                <p className="mt-1 text-sm text-muted-foreground">Tell Globe.travel where your group wants to go.</p>
              </div>
              <div className="text-right text-sm font-semibold text-muted-foreground" aria-label="Setup progress">
                Step {Math.min(3, Math.ceil(globePins.length / 2) + 1)} of 3
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 min-h-0">
            <OnboardingChat
              onComplete={handleComplete}
              onPlaceAdded={handlePlaceAdded}
              isCompleting={completing}
              completionError={completionError}
              canFinishOverride={qaCanFinish}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
