'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Compass, Sparkles, MapPinned, ExternalLink, Users, Wallet, CalendarDays } from 'lucide-react'
import { useChat, type NavigateEvent, type PlaceEvent } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import TripDayMap from '@/components/trips/TripDayMap'
import type { TripDay, TripItem } from '@/components/trips/ItineraryArtifact'
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

const STARTER_PROMPTS = [
  {
    label: 'Build a trip',
    sub: 'Turn a rough idea into a day-by-day plan',
    q: 'Plan a detailed 3-day city break for 4 friends who want food, cocktails, and one cultural highlight',
  },
  {
    label: 'Pick the city',
    sub: 'Compare options for the group',
    q: 'Compare Lisbon, Copenhagen, and Barcelona for a 3-day city break for friends in their early 30s',
  },
  {
    label: 'Easy weekend',
    sub: 'Low-friction ideas from home',
    q: 'Suggest 5 short city breaks for 4 friends leaving from Toronto, with good food and a walkable centre',
  },
  {
    label: 'Best value',
    sub: 'Keep cost and energy realistic',
    q: 'Where should a group of friends go for a budget-friendly city break with great food and nightlife?',
  },
] as const

const PLANNING_STEPS = [
  {
    icon: Users,
    label: 'Start with the crew',
    value: 'Tell us who is going, the pace, budget, and what each person cares about.',
  },
  {
    icon: Wallet,
    label: 'Compare the tradeoffs',
    value: 'See which cities fit the group before committing to a full itinerary.',
  },
  {
    icon: CalendarDays,
    label: 'Open Trip Studio',
    value: 'When the idea is real, we create a trip you can refine, map, and share.',
  },
] as const

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

function ChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQueryRef = useRef<string | null>(searchParams.get('q'))
  const sentInitialRef = useRef(false)
  const [activeTripId, setActiveTripId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(CHAT_ACTIVE_TRIP_KEY)
  })
  const [selectedDayIndex, setSelectedDayIndex] = useState(1)
  const [mapStops, setMapStops] = useState<ChatMapStop[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(CHAT_MAP_STORAGE_KEY)
      return saved ? (JSON.parse(saved) as ChatMapStop[]) : []
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

  const { data: tripPayload, isError: tripPreviewFailed } = useQuery({
    queryKey: ['chat-trip-preview', activeTripId],
    enabled: Boolean(activeTripId),
    queryFn: async () => {
      const res = await fetch(`/api/trips/${activeTripId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load trip preview')
      return res.json() as Promise<TripPayload>
    },
    retry: 1,
  })

  const resolvedActiveTripId = tripPreviewFailed ? null : activeTripId

  const isPlanningPrompt = useCallback((text: string) => {
    const normalized = text.toLowerCase()
    return (
      /\b(itinerary|trip plan|plan a trip|plan my trip|plan\b|day\s*\d+|days in|weekend in|day trip|walking tour|food tour)\b/.test(normalized) ||
      /\b\d+\s+day\b/.test(normalized)
    )
  }, [])

  const extractDraftDays = useCallback((text: string) => {
    const match = text.match(/\b(\d+)(?:\s*-\s*|\s+)days?\b/i)
    if (!match) return 4
    const parsed = Number(match[1])
    return Number.isFinite(parsed) ? Math.min(14, Math.max(1, parsed)) : 4
  }, [])

  const extractDraftTitle = useCallback((text: string) => {
    const inMatch = text.match(/\b(?:in|to)\s+([A-Za-z][A-Za-z\s'’-]{1,60}?)(?=\s+\b(?:for|with|on|around|near|from)\b|[,.!?]|$)/i)
    const destination = inMatch?.[1]?.trim()
    if (destination) {
      const days = extractDraftDays(text)
      return `${days} Days in ${destination}`
    }
    return 'Trip Draft'
  }, [extractDraftDays])

  const createDraftTrip = useCallback(async (prompt: string) => {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: extractDraftTitle(prompt),
        travelers_count: 4,
        pace: 'balanced',
        budget_level: 'mid',
        constraints: { days: extractDraftDays(prompt), group_vibe: 'Balanced weekend with friends' },
      }),
    })

    if (!res.ok) throw new Error('Failed to create trip draft')
    const json = await res.json() as { tripId: string }
    setActiveTripId(json.tripId)
    localStorage.setItem(CHAT_ACTIVE_TRIP_KEY, json.tripId)
    return json.tripId
  }, [extractDraftDays, extractDraftTitle])

  const activeMessages = exploreChat.messages
  const activeLoading = exploreChat.isLoading
  const activeError = exploreChat.error
  const activeStop = exploreChat.stop


  const [planningError, setPlanningError] = useState<string | null>(null)
  const [planningInProgress, setPlanningInProgress] = useState(false)

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    if (isPlanningPrompt(trimmed)) {
      setPlanningError(null)
      setPlanningInProgress(true)
      try {
        if (tripPreviewFailed && typeof window !== 'undefined') {
          localStorage.removeItem(CHAT_ACTIVE_TRIP_KEY)
        }
        const tripId = resolvedActiveTripId || await createDraftTrip(trimmed)
        const target = `/trips/${tripId}?prompt=${encodeURIComponent(trimmed)}`
        if (typeof window !== 'undefined') {
          window.location.assign(target)
        } else {
          router.push(target)
        }
      } catch {
        setPlanningError('Could not start trip planning. Please try again.')
        setPlanningInProgress(false)
      }
      return
    }

    exploreChat.sendMessage(trimmed)
  }, [createDraftTrip, exploreChat, isPlanningPrompt, resolvedActiveTripId, router, tripPreviewFailed])

  // Auto-send initial query from URL ?q= param (e.g. from Explore page)
  useEffect(() => {
    const q = initialQueryRef.current
    if (!q || sentInitialRef.current) return
    sentInitialRef.current = true
    // Small delay to ensure the chat transport is initialized
    const timer = setTimeout(() => {
      sendMessage(q)
    }, 120)
    return () => clearTimeout(timer)
  }, [sendMessage])

  useEffect(() => {
    localStorage.setItem(CHAT_MAP_STORAGE_KEY, JSON.stringify(mapStops))
  }, [mapStops])

  useEffect(() => {
    if (resolvedActiveTripId) {
      localStorage.setItem(CHAT_ACTIVE_TRIP_KEY, resolvedActiveTripId)
    } else {
      localStorage.removeItem(CHAT_ACTIVE_TRIP_KEY)
    }
  }, [resolvedActiveTripId])

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
        items: (day.items || []) as TripItem[],
      }
    })
  }, [tripDays])

  const destinationFallback = useMemo(
    () => getDestinationFallback(tripPayload?.trip.title),
    [tripPayload?.trip.title]
  )

  return (
    <div className="relative h-full bg-black flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.03)_0%,transparent_50%)]" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 border-b border-white/5">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center"
              >
                <Compass className="w-5 h-5 text-amber-400" />
              </motion.div>
              <div>
                <h1 className="font-serif text-xl text-white">Planner</h1>
                <p className="text-xs text-white/40">Discover, compare, and build short city breaks</p>
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
              <div className="flex h-full flex-col">
                <div className="flex-1 flex items-center justify-center px-8 py-8">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-3xl"
                  >
                    <div className="mb-7 max-w-xl">
                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-200">
                        <Sparkles className="h-3.5 w-3.5" />
                        Start here
                      </div>
                      <h2 className="font-serif text-3xl md:text-5xl text-white leading-[0.98] mb-4">
                        Plan the trip your friends will actually say yes to.
                      </h2>
                      <p className="text-sm md:text-base text-white/46 leading-relaxed">
                        Describe the group, the vibe, and the constraints. Globe Travel will help choose
                        the city, shape the itinerary, and move the plan into Trip Studio when it is ready.
                      </p>
                    </div>

                    <div className="mb-7 grid gap-2.5 md:grid-cols-3">
                      {PLANNING_STEPS.map((item, index) => {
                        const Icon = item.icon
                        return (
                          <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/28">
                                Step {index + 1}
                              </span>
                              <Icon className="w-4 h-4 text-amber-400/80" />
                            </div>
                            <p className="text-sm font-medium text-white/86">{item.label}</p>
                            <p className="mt-2 text-xs leading-relaxed text-white/38">{item.value}</p>
                          </div>
                        )
                      })}
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">Choose a starting point</h3>
                      <span className="hidden text-xs text-white/26 sm:inline">Or type your own idea below</span>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {STARTER_PROMPTS.map((item) => (
                        <motion.button
                          key={item.label}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => sendMessage(item.q)}
                          className="group min-h-24 text-left p-4 rounded-2xl bg-white/[0.04] border border-white/8 hover:border-amber-500/25 hover:bg-amber-500/[0.06] transition-all duration-200"
                        >
                          <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{item.label}</p>
                          <p className="mt-2 text-xs leading-relaxed text-white/34">{item.sub}</p>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <ChatInterface
                messages={activeMessages}
                isLoading={activeLoading}
                error={activeError}
                onSendMessage={sendMessage}
                onStop={activeStop}
                placeholder={resolvedActiveTripId ? 'Refine this group itinerary, adjust the pace, or rebalance it for the crew...' : 'Ask about city breaks, friend-group destinations, or weekend itineraries...'}
                storageKey={resolvedActiveTripId ? `globe-travel:chat-input:plan:${resolvedActiveTripId}` : 'globe-travel:chat-input:explore'}
                suggestions={[
                  'Suggest 3 easy city breaks for 4 friends this month',
                  'Compare two cities for food, walkability, and nightlife',
                  'Plan a balanced 3-day break for mixed travel styles',
                ]}
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
              {resolvedActiveTripId && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-200">
                    <MapPinned className="h-3.5 w-3.5" />
                    Trip linked
                  </span>
                  <Link
                    href={`/trips/${resolvedActiveTripId}`}
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
                  {previewDays.map(({ day, stops, routeGeojson, routeSummary, items }) => (
                    <div key={day.id} className="rounded-[24px] border border-white/10 bg-black/30 overflow-hidden">
                      <TripDayMap
                        stops={stops}
                        routeGeojson={routeGeojson}
                        title={`Day ${day.day_index}${day.title ? ` · ${day.title}` : ''}`}
                        subtitle={`${stops.length} mapped stop${stops.length === 1 ? '' : 's'}`}
                        routeSummary={routeSummary}
                        active={resolvedSelectedDayIndex === day.day_index}
                        onClick={() => setSelectedDayIndex(day.day_index)}
                        mapHeightClassName="h-44"
                        className="min-w-0 border-0 rounded-none"
                      />
                      {items.length > 0 && (
                        <div className="border-t border-white/8 px-3 py-2.5 space-y-1.5">
                          {items.map((item: TripItem, idx: number) => (
                            <div key={item.id} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex-shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/8 text-[9px] font-bold text-white/60">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white/85 truncate leading-snug">{item.title}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {item.start_time && (
                                    <span className="text-[10px] text-white/38 tabular-nums">{item.start_time.slice(0,5)}</span>
                                  )}
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/35 capitalize">{item.type}</span>
                                  {item.place?.name && (
                                    <span className="text-[10px] text-white/32 truncate">{item.place.name}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
        <div className="relative z-10 flex-shrink-0 border-t border-white/8 bg-black/60 backdrop-blur-xl px-4 py-4">
          {planningError && (
            <div className="max-w-2xl mx-auto mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {planningError}
            </div>
          )}
          <div className="flex items-center gap-3 max-w-2xl mx-auto bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-2 focus-within:border-amber-500/30 focus-within:ring-1 focus-within:ring-amber-500/10 transition-all">
            <input
              type="text"
              placeholder={planningInProgress ? 'Opening Trip Studio…' : 'Try: “Best 3-day city break for 4 friends leaving from Toronto?”'}
              disabled={planningInProgress}
              className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  sendMessage(e.currentTarget.value.trim())
                  e.currentTarget.value = ''
                }
              }}
            />
            <div className="text-[10px] text-white/20 flex-shrink-0">↵ send</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050510]" />}>
      <ChatPageContent />
    </Suspense>
  )
}
