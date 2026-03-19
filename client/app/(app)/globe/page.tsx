'use client'

import { useMemo, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/components/providers/AuthProvider'
import { motion, AnimatePresence } from 'motion/react'
import {
  Globe2, MapPin, Heart, MessageCircle, X,
  Calendar, BookOpen,
} from 'lucide-react'
import { useChat, type Message } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import Link from 'next/link'

const ProfileGlobe = dynamic(
  () => import('@/components/globes/ProfileGlobe'),
  { ssr: false, loading: () => <div className="w-full h-full bg-[#050510]" /> }
)

type PinData = {
  latitude: number
  longitude: number
  status: 'visited' | 'bucket_list'
  name: string
  country?: string
  rating?: number
  visit_date?: string
  notes?: string
  description?: string
  highlights?: string[]
  best_time?: string
}

const GREETING: Message = {
  id: 'greeting',
  role: 'assistant',
  content: "What are you dreaming about? Ask me anything — new destinations, trip ideas, or add places to your map.",
}

export default function GlobePage() {
  const { profile } = useAuth()
  const [chatOpen, setChatOpen] = useState(true)
  const [selectedPlace, setSelectedPlace] = useState<PinData | null>(null)
  const flyToRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null)

  const { data: userPlaces, refetch } = useQuery({
    queryKey: ['user-places'],
    queryFn: async () => {
      const res = await fetch('/api/user-places')
      if (!res.ok) return []
      return res.json()
    },
  })

  const { messages, isLoading, sendMessage, stop } = useChat({
    type: 'explore',
    onPlaceAdded: (event) => {
      refetch()
      if (event.place.latitude && event.place.longitude) {
        flyToRef.current?.(event.place.latitude, event.place.longitude, 4)
        setSelectedPlace({
          latitude: event.place.latitude,
          longitude: event.place.longitude,
          status: event.place.status,
          name: event.place.name,
          country: event.place.country,
          description: event.place.description,
          highlights: event.place.highlights,
          best_time: event.place.best_time,
        })
      }
    },
  })

  const askAboutPlace = useCallback((name: string) => {
    sendMessage(`Tell me about ${name} — what makes it special and what should I do there?`)
  }, [sendMessage])

  const allMessages = [GREETING, ...messages]

  const pins = useMemo(() => {
    if (!userPlaces) return []
    const seen = new Set<string>()
    return userPlaces
      .filter((up: any) => {
        if (!up.place?.latitude || !up.place?.longitude) return false
        if (seen.has(up.place.name)) return false
        seen.add(up.place.name)
        return true
      })
      .map((up: any) => ({
        latitude: up.place.latitude,
        longitude: up.place.longitude,
        status: up.status as 'visited' | 'bucket_list',
        name: up.place.name,
        country: up.place.country,
        rating: up.rating,
        visit_date: up.visit_date,
        notes: up.notes,
      }))
  }, [userPlaces]) as PinData[]

  const visitedCount = pins.filter(p => p.status === 'visited').length
  const bucketCount = pins.filter(p => p.status === 'bucket_list').length
  const countriesSet = new Set(pins.filter(p => p.status === 'visited' && p.country).map(p => p.country))

  const handlePinClick = useCallback((pin: { latitude: number; longitude: number; status: string; name: string }) => {
    const full = pins.find(p => p.name === pin.name)
    setSelectedPlace(full || pin as PinData)
  }, [pins])

  return (
    <div className="relative w-full h-full min-h-screen bg-[#050510] overflow-hidden">
      {/* Globe */}
      <div className="absolute inset-0">
        <ProfileGlobe pins={pins} onPinClick={handlePinClick} flyToRef={flyToRef} />
      </div>

      {/* Top bar - minimal stats */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-6 px-5 py-2.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full"
        >
          <div className="flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-white/80 font-medium">{countriesSet.size}</span>
            <span className="text-[10px] text-white/30">countries</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-white/80 font-medium">{visitedCount}</span>
            <span className="text-[10px] text-white/30">visited</span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-white/80 font-medium">{bucketCount}</span>
            <span className="text-[10px] text-white/30">bucket list</span>
          </div>
        </motion.div>
      </div>

      {/* Chat toggle */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            onClick={() => setChatOpen(true)}
            className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-black/50 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/70 transition-all z-10"
          >
            <MessageCircle className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel - left side */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute top-4 left-4 bottom-20 md:bottom-4 w-[calc(100%-2rem)] md:w-[360px] z-20 flex flex-col bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <MessageCircle className="w-3 h-3 text-amber-400" />
                </div>
                <span className="text-xs font-medium text-white/70">Travel AI</span>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ChatInterface
                messages={allMessages}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                onStop={stop}
                placeholder="Ask about destinations, plan trips..."
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Place detail panel - right side */}
      <AnimatePresence>
        {selectedPlace && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute top-4 right-4 bottom-20 md:bottom-4 w-[320px] z-20 flex flex-col bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Close */}
            <div className="flex items-center justify-end px-3 py-2 flex-shrink-0">
              <button
                onClick={() => setSelectedPlace(null)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {/* Status + Name */}
              <span
                className="text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  background: selectedPlace.status === 'visited' ? 'rgba(245,158,11,0.12)' : 'rgba(6,182,212,0.12)',
                  color: selectedPlace.status === 'visited' ? '#F59E0B' : '#06B6D4',
                  border: `1px solid ${selectedPlace.status === 'visited' ? 'rgba(245,158,11,0.2)' : 'rgba(6,182,212,0.2)'}`,
                }}
              >
                {selectedPlace.status === 'visited' ? 'Visited' : 'Bucket List'}
              </span>
              <h2 className="text-xl font-serif font-semibold text-white mt-2 mb-0.5">
                {selectedPlace.name}
              </h2>
              {selectedPlace.country && (
                <p className="text-xs text-white/35 mb-4">{selectedPlace.country}</p>
              )}

              {/* AI description if available */}
              {selectedPlace.description && (
                <p className="text-[13px] text-white/60 leading-relaxed mb-4">
                  {selectedPlace.description}
                </p>
              )}

              {/* Highlights */}
              {selectedPlace.highlights && selectedPlace.highlights.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[10px] text-white/25 uppercase tracking-wider mb-2">Highlights</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlace.highlights.map((h, i) => (
                      <span key={i} className="text-[11px] text-white/50 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Best time */}
              {selectedPlace.best_time && (
                <div className="flex items-center gap-2 mb-4 text-[11px] text-white/40">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Best time: {selectedPlace.best_time}</span>
                </div>
              )}

              {/* Coords */}
              <div className="flex items-center gap-2 mb-5 text-[11px] text-white/25">
                <MapPin className="w-3.5 h-3.5" />
                <span>{selectedPlace.latitude.toFixed(2)}°, {selectedPlace.longitude.toFixed(2)}°</span>
              </div>

              {selectedPlace.notes && (
                <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-xs text-white/50 leading-relaxed italic">&ldquo;{selectedPlace.notes}&rdquo;</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => askAboutPlace(selectedPlace.name)}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors text-left"
                >
                  <MessageCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-amber-400/80">Ask AI about this place</span>
                </button>
                <Link
                  href="/journal"
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-white/30 flex-shrink-0" />
                  <span className="text-xs text-white/40">Write a journal entry</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
