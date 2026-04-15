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
    "Welcome to Globe Travel! Let’s set you up for short city breaks with friends. Tell me a few places you’ve already loved visiting, and I’ll start mapping your travel style.",
}

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
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-white/40">
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
                  className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 hidden sm:block"
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
                  className="ml-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center gap-1.5 hover:bg-amber-500/25 transition-colors"
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
          placeholder="Tell me about your travels..."
        />
      </div>
    </div>
  )
}
