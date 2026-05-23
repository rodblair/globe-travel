'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { MapPin, ArrowRight } from 'lucide-react'
import { useChat, type PlaceEvent, type Message } from '@/hooks/useChat'
import ChatInterface from './ChatInterface'

interface OnboardingChatProps {
  onComplete: () => void
  onPlaceAdded?: (event: PlaceEvent) => void
}

const INITIAL_GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content:
    "Welcome to Globe.travel! Let’s set you up for city trips with friends. Tell me a few places you’ve already loved visiting, and I’ll start mapping your travel style.",
}

const ONBOARDING_SUGGESTIONS = [
  'We loved Lisbon, Kyoto, and Oaxaca for food and walking.',
  'Our group likes museums, beaches, and easy dinners.',
  'We want a trip with design hotels, markets, and one great night out.',
]

export default function OnboardingChat({ onComplete, onPlaceAdded: onPlaceAddedProp }: OnboardingChatProps) {
  const [placesAdded, setPlacesAdded] = useState<PlaceEvent['place'][]>([])

  const handlePlaceAdded = useCallback((event: PlaceEvent) => {
    setPlacesAdded((prev) => [...prev, event.place])
    onPlaceAddedProp?.(event)
  }, [onPlaceAddedProp])

  const { messages, isLoading, sendMessage, stop } = useChat({
    type: 'onboarding',
    onPlaceAdded: handlePlaceAdded,
  })

  const allMessages = [INITIAL_GREETING, ...messages]
  const canFinish = placesAdded.length >= 3

  return (
    <div className="flex flex-col h-full">
      {/* Places tracker bar */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-rule">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[var(--brass)]" />
            <span className="text-xs text-foreground/40">
              {placesAdded.length} place{placesAdded.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mini place pills */}
            <AnimatePresence>
              {placesAdded.slice(-4).map((place, i) => (
                <motion.div
                  key={`${place.name}-${i}`}
                  initial={{ opacity: 0, scale: 0, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  className="px-2 py-0.5 rounded-full bg-paper-recessed border border-rule text-[10px] text-foreground/50 hidden sm:block"
                >
                  {place.name}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Subtle finish button in header */}
            <AnimatePresence>
              {canFinish && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onComplete}
                  className="ml-1 flex items-center gap-1.5 rounded-full border border-[color:var(--brass)]/30 bg-[var(--brass)] px-3 py-1 text-xs font-medium text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-hover)]"
                >
                  Done
                  <ArrowRight className="w-3 h-3" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 min-h-0">
        <ChatInterface
          messages={allMessages}
          isLoading={isLoading}
          onSendMessage={sendMessage}
          onStop={stop}
          placeholder="Name a few places your group loved..."
          suggestions={ONBOARDING_SUGGESTIONS}
        />
      </div>
    </div>
  )
}
