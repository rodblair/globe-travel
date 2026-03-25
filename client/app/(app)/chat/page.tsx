'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowLeft, Compass, Sparkles, MapPinned, ExternalLink } from 'lucide-react'
import { useChat, type NavigateEvent, type PlaceEvent } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import TripDayMap from '@/components/trips/TripDayMap'
import type { TripDay } from '@/components/trips/ItineraryArtifact'
import { buildDisplayStops, getDestinationFallback } from '@/components/trips/derivedStops'

type ChatMapStop = {
  id: string
  title: string
  latitude: number
  longitude: number
  index: number
}

const CHAT_MAP_STORAGE_KEY = 'globe-travel:chat:explore:map-stops'
const CHAT_ACTIVE_TRIP_KEY = 'globe-travel:chat:active-trip-id'

type TripPayload = {
  trip: {
    id: string
    title: string
  }
  days: TripDay[]
}

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
  const [activeTripId, setActiveTripId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(CHAT_ACTIVE_TRIP_KEY)
  })
  const [selectedDayIndex, setSelectedDayIndex] = useState(1)
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

  const exploreChat = useChat({
    type: 'explore',
    onPlaceAdded: handlePlaceAdded,
    onNavigate: handleNavigate,
  })

  const { data: tripPayload } = useQuery({
    queryKey: ['chat-trip-preview', activeTripId],
    enabled: Boolean(activeTripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${activeTripId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load trip preview')
      return res.json() as Promise<TripPayload>
    },
  })

  const isPlanningPrompt = useCallback((text: string) => {
    const normalized = text.toLowerCase()
    return (
      /\b(itinerary|trip plan|plan a trip|plan my trip|plan\b|day\s*\d+|days in|weekend in|day trip|walking tour|food tour)\b/.test(normalized) ||
      /\b\d+\s+day\b/.test(normalized)
    )
  }, [])

  const extractDraftDays = useCallback((text: string) => {
    const match = text.match(/\b(\d+)\s+days?\b/i)
    if (!match) return 4
    const parsed = Number(match[1])
    return Number.isFinite(parsed) ? Math.min(14, Math.max(1, parsed)) : 4
  }, [])

  const extractDraftTitle = useCallback((text: string) => {
    const inMatch = text.match(/\b(?:in|to)\s+([A-Z][A-Za-z\s'’-]{1,40})/i)
    if (inMatch?.[1]) {
      const days = extractDraftDays(text)
      return `${days} Days in ${inMatch[1].trim()}`
    }
    return 'Trip Draft'
  }, [extractDraftDays])

  const createDraftTrip = useCallback(async (prompt: string) => {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: extractDraftTitle(prompt),
        pace: 'balanced',
        budget_level: 'mid',
        constraints: { days: extractDraftDays(prompt) },
      }),
    })

    if (!res.ok) throw new Error('Failed to create trip draft')
    const json = await res.json() as { tripId: string }
    setActiveTripId(json.tripId)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHAT_ACTIVE_TRIP_KEY, json.tripId)
    }
    return json.tripId
  }, [extractDraftDays, extractDraftTitle])

  const activeMessages = exploreChat.messages
  const activeLoading = exploreChat.isLoading
  const activeStop = exploreChat.stop

  const handleBack = useCallback(() => {
    if (typeof window === 'undefined') {
      router.push('/explore')
      return
    }

    const sameOriginReferrer =
      typeof document.referrer === 'string' &&
      document.referrer.startsWith(window.location.origin)

    if (window.history.length > 1 && sameOriginReferrer) {
      router.back()
      return
    }

    router.push('/explore')
  }, [router])

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    if (isPlanningPrompt(trimmed)) {
      const tripId = activeTripId || await createDraftTrip(trimmed)
      const target = `/trips/${tripId}?prompt=${encodeURIComponent(trimmed)}`
      if (typeof window !== 'undefined') {
        window.location.assign(target)
      } else {
        router.push(target)
      }
      return
    }

    exploreChat.sendMessage(trimmed)
  }, [activeTripId, createDraftTrip, exploreChat, isPlanningPrompt, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(CHAT_MAP_STORAGE_KEY, JSON.stringify(mapStops))
  }, [mapStops])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (activeTripId) {
      window.localStorage.setItem(CHAT_ACTIVE_TRIP_KEY, activeTripId)
    } else {
      window.localStorage.removeItem(CHAT_ACTIVE_TRIP_KEY)
    }
  }, [activeTripId])

  const tripDays = useMemo(() => tripPayload?.days || [], [tripPayload?.days])
  const resolvedSelectedDayIndex = useMemo(() => {
    if (!tripDays.length) return selectedDayIndex
    return tripDays.some((day) => day.day_index === selectedDayIndex)
      ? selectedDayIndex
      : tripDays[0].day_index
  }, [selectedDayIndex, tripDays])

  const mapSubtitle = useMemo(() => {
    if (tripDays.length) {
      const mappedDays = tripDays.filter((day) => (day.items || []).some((item) => item.place?.latitude != null && item.place?.longitude != null)).length
      return `${mappedDays} mapped day${mappedDays === 1 ? '' : 's'} in this itinerary`
    }
    if (mapStops.length === 0) return 'Ask about a destination to see it mapped here.'
    return `${mapStops.length} mapped place${mapStops.length === 1 ? '' : 's'} from this chat`
  }, [mapStops, tripDays])

  const previewDays = useMemo(() => {
    return tripDays.map((day) => {
      const stops = buildDisplayStops((day.items || []) as any)
        .filter((stop) => stop.mapped)
        .map((stop) => ({
          id: stop.id,
          title: stop.title,
          latitude: stop.latitude,
          longitude: stop.longitude,
          index: stop.index,
        }))

      return {
        day,
        stops,
        routeGeojson: day.routes?.find((route) => route.mode === 'walk')?.geojson || day.routes?.[0]?.geojson || null,
        routeSummary:
          day.routes?.[0]?.distance_m && day.routes?.[0]?.duration_s
            ? `${Math.round(day.routes[0].distance_m / 100) / 10} km • ${Math.round(day.routes[0].duration_s / 60)} min walk`
            : null,
      }
    })
  }, [tripDays])

  const destinationFallback = useMemo(
    () => getDestinationFallback(tripPayload?.trip.title),
    [tripPayload?.trip.title]
  )

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
                onClick={handleBack}
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
            {activeMessages.length === 0 ? (
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
                messages={activeMessages}
                isLoading={activeLoading}
                onSendMessage={sendMessage}
                onStop={activeStop}
                placeholder={activeTripId ? 'Refine this itinerary, change a day, or ask for walking routes...' : 'Ask about destinations, trips, or travel tips...'}
                storageKey={activeTripId ? `globe-travel:chat-input:plan:${activeTripId}` : 'globe-travel:chat-input:explore'}
              />
            )}
          </div>

          <div className="flex min-h-[280px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/30">
                {tripPayload ? 'Itinerary Maps' : 'Map Preview'}
              </p>
              <h2 className="mt-1 text-sm font-medium text-white/80">
                {tripPayload ? tripPayload.trip.title : 'Places from this chat'}
              </h2>
              <p className="mt-1 text-xs text-white/40">{mapSubtitle}</p>
              {activeTripId && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-200">
                    <MapPinned className="h-3.5 w-3.5" />
                    Trip linked
                  </span>
                  <Link
                    href={`/trips/${activeTripId}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-white/70 hover:bg-white/10"
                  >
                    Open Trip Studio
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {previewDays.length > 0 ? (
                <div className="space-y-3">
                  {previewDays.map(({ day, stops, routeGeojson, routeSummary }) => (
                    <TripDayMap
                      key={day.id}
                      stops={stops}
                      routeGeojson={routeGeojson}
                      title={`Day ${day.day_index}${day.title ? ` · ${day.title}` : ''}`}
                      subtitle={`${stops.length} mapped stop${stops.length === 1 ? '' : 's'}`}
                      routeSummary={routeSummary}
                      active={resolvedSelectedDayIndex === day.day_index}
                      onClick={() => setSelectedDayIndex(day.day_index)}
                      mapHeightClassName="h-44"
                      className="min-w-0"
                    />
                  ))}
                </div>
              ) : destinationFallback ? (
                <TripDayMap
                  stops={[{
                    id: `destination:${destinationFallback.title}`,
                    title: destinationFallback.title,
                    latitude: destinationFallback.latitude,
                    longitude: destinationFallback.longitude,
                    index: 1,
                  }]}
                  title={destinationFallback.title}
                  subtitle="Destination preview"
                  showDetails={false}
                  mapHeightClassName="h-full min-h-[220px]"
                  className="h-full min-h-[220px] min-w-0"
                />
              ) : (
                <TripDayMap
                  stops={mapStops}
                  title="Chat Map"
                  subtitle={mapSubtitle}
                  showDetails={false}
                  mapHeightClassName="h-full min-h-[220px]"
                  className="h-full min-h-[220px] min-w-0"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input when no messages (overlaid at bottom) */}
      {activeMessages.length === 0 && (
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
