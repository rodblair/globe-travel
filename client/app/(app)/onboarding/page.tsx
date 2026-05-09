'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Globe, Sparkles } from 'lucide-react'
import dynamic from 'next/dynamic'
import OnboardingChat from '@/components/chat/OnboardingChat'
import type { PlaceEvent } from '@/hooks/useChat'

const ProfileGlobe = dynamic(() => import('@/components/globes/ProfileGlobe'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Globe className="w-16 h-16 text-foreground/10 animate-pulse" />
    </div>
  ),
})

type GlobePin = {
  latitude: number
  longitude: number
  status: 'visited' | 'bucket_list'
  name: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [globePins, setGlobePins] = useState<GlobePin[]>([])

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
    setShowCelebration(true)

    // Complete onboarding before leaving this fullscreen flow so middleware allows the app shell.
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_completed: true }),
      })
    } catch (err) {
      console.error('Profile update error:', err)
    }

    // Navigate after short celebration
    setTimeout(() => {
      router.push('/chat')
    }, 1500)
  }, [router, completing])

  return (
    <div className="fixed inset-0 bg-paper overflow-hidden z-50">
      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-paper/95"
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
                className="w-16 h-16 mx-auto mb-5 rounded-full bg-[var(--brass-subtle)] border border-[color:var(--brass)]/30 flex items-center justify-center"
              >
                <Sparkles className="w-7 h-7 text-[var(--brass)]" />
              </motion.div>
              <h2 className="font-serif text-2xl text-foreground mb-1.5">You&apos;re all set!</h2>
              <p className="text-foreground/40 text-sm">
                {globePins.length} itinerary idea{globePins.length === 1 ? '' : 's'} captured
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <div className="relative z-10 flex h-full">
        {/* Left side - Live Globe (desktop only) */}
        <div className="hidden lg:flex lg:w-[45%] items-center justify-center border-r border-rule relative overflow-hidden">
          <div className="absolute inset-0">
            <ProfileGlobe pins={globePins} />
          </div>

          {/* Overlay text at bottom */}
          <div className="absolute bottom-8 left-0 right-0 text-center z-10">
            <AnimatePresence mode="wait">
              {globePins.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-foreground/30 text-sm"
                >
                  Your group trip ideas will appear here as you chat
                </motion.p>
              ) : (
                <motion.div
                  key="count"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-paper/60 backdrop-blur-sm border border-rule"
                >
                  <div className="w-2 h-2 rounded-full bg-[var(--brass)] animate-pulse" />
                  <span className="text-foreground/60 text-sm">
                    {globePins.length} idea{globePins.length !== 1 ? 's' : ''} ready to plan
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right side - Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Progress header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-rule">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="lg:hidden w-8 h-8 rounded-full bg-paper-recessed border border-rule flex items-center justify-center">
                  <Globe className="w-4 h-4 text-foreground/40" />
                </div>
                <div>
                  <h2 className="font-serif text-lg text-foreground">Start your group trip</h2>
                  <p className="text-xs text-foreground/40">Tell Globe.travel where your group wants to go</p>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-8 h-1 rounded-full transition-colors duration-500 ${
                      step <= Math.min(3, Math.ceil(globePins.length / 2) + 1)
                        ? 'bg-[var(--brass)]'
                        : 'bg-paper-recessed'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 min-h-0">
            <OnboardingChat
              onComplete={handleComplete}
              onPlaceAdded={handlePlaceAdded}
            />
          </div>

{/* removed inline loading - celebration overlay handles it */}
        </div>
      </div>
    </div>
  )
}
