'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowLeft, Compass, Sparkles } from 'lucide-react'
import { useChat, type NavigateEvent, type PlaceEvent } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import TripDayMap from '@/components/trips/TripDayMap'

type ChatMapStop = {
  id: string
  title: string
  latitude: number
  longitude: number
  index: number
}

const CHAT_MAP_STORAGE_KEY = 'globe-travel:chat:explore:map-stops'

function mergeStop(stops: ChatMapStop[], nextStop: Omit<ChatMapStop, 'index'>) {
  const existing = stops.findIndex((stop) => {
    if (stop.id === nextStop.id) return true
    if (stop.title.toLowerCase() === nextStop.title.toLowerCase()) return true
    return Math.abs(stop.latitude - nextStop.latitude) < 0.0001 && Math.abs(stop.longitude - nextStop.longitude) < 0.0001
  })

  const merged =
    existing >= 0
      ? stops.map((stop, index) => (index === existing ? { ...stop, ...nextStop } : stop))
      : [...stops, { ...nextStop, index: stops.length + 1 }]

  return merged.map((stop, index) => ({ ...stop, index: index + 1 }))
}

export default function ChatPage() {
  const router = useRouter()
  const [mapStops, setMapStops] = useState<ChatMapStop[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = window.localStorage.getItem(CHAT_MAP_STORAGE_KEY)
      return saved ? JSON.parse(saved) as ChatMapStop[] : []
    } catch {
      return []
    }
  })

  const handlePlaceAdded = useCallback((event: PlaceEvent) => {
    setMapStops((current) =>
      mergeStop(current, {
        id: `${event.place.name}:${event.place.latitude}:${event.place.longitude}`,
        title: event.place.name,
        latitude: event.place.latitude,
        longitude: event.place.longitude,
      })
    )
  }, [])

  const handleNavigate = useCallback((event: NavigateEvent) => {
    if (!event.latitude || !event.longitude) return

    setMapStops((current) =>
      mergeStop(current, {
        id: `${event.name || 'place'}:${event.latitude}:${event.longitude}`,
        title: event.name || 'Selected place',
        latitude: event.latitude,
        longitude: event.longitude,
      })
    )
  }, [])

  const { messages, isLoading, sendMessage, stop } = useChat({
    type: 'explore',
    onPlaceAdded: handlePlaceAdded,
    onNavigate: handleNavigate,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CHAT_MAP_STORAGE_KEY, JSON.stringify(mapStops))
  }, [mapStops])

  const mapSubtitle = useMemo(() => {
    if (mapStops.length === 0) return 'Ask about a destination to see it mapped here.'
    return `${mapStops.length} mapped place${mapStops.length === 1 ? '' : 's'} from this chat`
  }, [mapStops])

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.03)_0%,transparent_50%)]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 border-b border-white/5">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-200 shadow-lg shadow-amber-500/10 transition-colors hover:bg-amber-500/20 hover:text-white"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center"
              >
                <Compass className="w-5 h-5 text-amber-400" />
              </motion.div>
              <div>
                <h1 className="font-serif text-xl text-white">AI Travel Advisor</h1>
                <p className="text-xs text-white/40">Discover your next adventure</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400/40" />
              <span className="text-xs text-white/30">Powered by OpenAI GPT-5.4</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 px-4 py-4 md:px-6">
        <div className="mx-auto grid h-full max-w-7xl gap-4 md:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center px-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center max-w-md"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
                  >
                    <Compass className="w-8 h-8 text-amber-400/60" />
                  </motion.div>
                  <h2 className="font-serif text-2xl text-white mb-3">
                    Where to next?
                  </h2>
                  <p className="text-sm text-white/40 mb-8 leading-relaxed">
                    Ask me for destination recommendations, trip planning help, local tips,
                    or anything travel-related. I know your preferences and can suggest
                    perfect spots for you.
                  </p>

                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      'Suggest a weekend getaway',
                      'Best hidden gems in Europe',
                      'Plan a 2-week Asia trip',
                      'Beach destinations in winter',
                    ].map((suggestion) => (
                      <motion.button
                        key={suggestion}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => sendMessage(suggestion)}
                        className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 hover:text-white/70 hover:bg-white/10 transition-all"
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              <ChatInterface
                messages={messages}
                isLoading={isLoading}
                onSendMessage={sendMessage}
                onStop={stop}
                placeholder="Ask about destinations, trips, or travel tips..."
                storageKey="globe-travel:chat-input:explore"
              />
            )}
          </div>

          <div className="flex min-h-[280px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">Map Preview</p>
              <h2 className="mt-1 text-sm font-medium text-white/80">Places from this chat</h2>
              <p className="mt-1 text-xs text-white/40">{mapSubtitle}</p>
            </div>
            <div className="flex-1 p-3">
              <TripDayMap
                stops={mapStops}
                title="Chat Map"
                subtitle={mapSubtitle}
                showDetails={false}
                mapHeightClassName="h-full min-h-[220px]"
                className="h-full min-h-[220px] min-w-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Input when no messages (overlaid at bottom) */}
      {messages.length === 0 && (
        <div className="relative z-10 flex-shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-xl px-4 py-3">
          <div className="flex items-center gap-3 max-w-3xl mx-auto">
            <input
              type="text"
              placeholder="Ask about destinations, trips, or travel tips..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  sendMessage(e.currentTarget.value.trim())
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
