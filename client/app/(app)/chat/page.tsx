'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Users, Wallet, CalendarDays } from 'lucide-react'
import { useChat, type NavigateEvent, type PlaceEvent } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import TripDayMap from '@/components/trips/TripDayMap'
import type { TripDay, TripItem } from '@/components/trips/ItineraryArtifact'
import { buildDisplayStops, getDestinationFallback } from '@/components/trips/derivedStops'
import { CompassRose } from '@/components/atmosphere/CompassRose'
import { ContourOverlay } from '@/components/atmosphere/ContourOverlay'
import { cn } from '@/lib/utils'

type ChatMapStop = {
  id: string
  title: string
  latitude: number
  longitude: number
  index: number
}

const CHAT_MAP_STORAGE_KEY = 'globe-travel:chat:explore:map-stops'

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
    q: 'Ask me the right questions about my group, budget, dates, pace, and travel style before recommending where we should go.',
  },
  {
    icon: Wallet,
    label: 'Compare the tradeoffs',
    value: 'See which cities fit the group before committing to a full itinerary.',
    q: 'Compare possible city-break destinations for my group by budget, food, nightlife, walkability, and ease of travel.',
  },
  {
    icon: CalendarDays,
    label: 'Open Trip Studio',
    value: 'When the idea is real, we create a trip you can refine, map, and share.',
    q: 'Plan a balanced 3-day city break for 4 friends with food, sightseeing, relaxed pacing, and one memorable night out.',
  },
] as const

type TripPayload = {
  trip: { id: string; title: string }
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
  const [activeTripId, setActiveTripId] = useState<string | null>(null)
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
  }, [createDraftTrip, exploreChat, isPlanningPrompt, resolvedActiveTripId, router])

  useEffect(() => {
    const q = initialQueryRef.current
    if (!q || sentInitialRef.current) return
    sentInitialRef.current = true
    const timer = setTimeout(() => {
      sendMessage(q)
    }, 120)
    return () => clearTimeout(timer)
  }, [sendMessage])

  useEffect(() => {
    localStorage.setItem(CHAT_MAP_STORAGE_KEY, JSON.stringify(mapStops))
  }, [mapStops])

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
    <div className="relative flex h-full flex-col overflow-hidden bg-paper text-foreground">
      <div className="paper-grain absolute inset-0 pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 border-b border-rule bg-paper/80 backdrop-blur-md">
        <div className="px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CompassRose size={36} showLabels={false} />
              <div>
                <p className="t-mono text-[0.625rem] tracking-[0.22em] uppercase text-ink-3">
                  CHAT · DISCOVER
                </p>
                <h1 className="h2-app text-foreground leading-tight">Planner</h1>
              </div>
            </div>

            <div className="hidden items-center gap-2 t-mono text-[0.6875rem] tracking-[0.16em] uppercase text-ink-3 sm:flex">
              <Sparkles className="w-3.5 h-3.5 text-[var(--brass)]" strokeWidth={1.5} />
              AI TRIP PLANNER
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto px-4 py-4 md:px-6 xl:overflow-hidden">
        <div className="mx-auto grid min-h-full max-w-7xl gap-4 pb-28 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_360px] xl:pb-0">
          <div className="flex min-h-[560px] flex-col overflow-hidden rounded-lg border border-rule bg-paper-raised shadow-[var(--panel-shadow)] xl:min-h-0">
            {activeMessages.length === 0 ? (
              <div className="flex min-h-[560px] flex-col overflow-y-auto">
                <div className="relative flex flex-1 items-start justify-center px-6 py-10 md:px-10">
                  <div className="absolute inset-0 -z-0 opacity-40">
                    <ContourOverlay density="sparse" />
                  </div>
                  <div className="relative w-full max-w-3xl">
                    <div className="mb-7 max-w-xl">
                      <p className="t-mono text-[0.6875rem] tracking-[0.24em] uppercase text-[var(--brass)] mb-3">
                        § START HERE
                      </p>
                      <h2 className="h-display text-foreground leading-[1.1] mb-3 max-w-[20ch]">
                        Plan the trip your friends will{' '}
                        <span className="t-italic text-ink-2">actually say yes to.</span>
                      </h2>
                      <p className="text-body text-ink-2 leading-relaxed">
                        Describe the group, the vibe, and the constraints. Globe will help choose
                        the city, shape the itinerary, and move it into Trip Studio when ready.
                      </p>
                    </div>

                    <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {PLANNING_STEPS.map((item, index) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={item.label}
                            onClick={() => sendMessage(item.q)}
                            className={cn(
                              'group relative text-left rounded-md border border-rule px-3 py-3',
                              'bg-paper hover:bg-paper-hover transition-colors',
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <Icon className="w-3.5 h-3.5 text-[var(--brass)]" strokeWidth={1.4} />
                              <span className="t-mono text-[0.625rem] tracking-[0.18em] uppercase text-ink-3">
                                STEP {String(index + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <p className="text-[0.8125rem] font-medium text-foreground leading-snug">
                              {item.label}
                            </p>
                            <p className="text-caption text-ink-3 mt-1 leading-snug">
                              {item.value}
                            </p>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mb-3 flex items-center justify-between gap-4">
                      <p className="t-mono text-[0.625rem] tracking-[0.22em] uppercase text-ink-3">
                        OR PICK A STARTING POINT
                      </p>
                      <span className="hidden text-caption text-ink-3 sm:inline">
                        type your own below
                      </span>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-4">
                      {STARTER_PROMPTS.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => sendMessage(item.q)}
                          className={cn(
                            'group min-h-16 text-left p-3 rounded-md border border-rule bg-paper hover:bg-paper-hover transition-colors',
                          )}
                        >
                          <p className="text-[0.8125rem] font-medium text-foreground group-hover:text-foreground transition-colors">
                            {item.label}
                          </p>
                          <p className="mt-1 text-caption text-ink-3 leading-relaxed md:hidden lg:block">
                            {item.sub}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
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

          <aside className="flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-rule bg-paper-raised shadow-[var(--panel-shadow)] xl:min-h-[280px]">
            <div className="border-b border-rule px-4 py-3">
              <p className="t-mono text-[0.625rem] tracking-[0.22em] uppercase text-ink-3">
                {tripPayload ? 'ITINERARY MAPS' : 'MAP PREVIEW'}
              </p>
              <h2 className="t-h3 text-foreground leading-tight mt-1">
                {tripPayload ? tripPayload.trip.title : 'Places from this chat'}
              </h2>
              <p className="text-caption text-ink-3 mt-1">{mapSubtitle}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {previewDays.length > 0 ? (
                <div className="space-y-3">
                  {previewDays.map(({ day, stops, routeGeojson, routeSummary, items }) => (
                    <div key={day.id} className="rounded-md border border-rule bg-paper overflow-hidden">
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
                        <div className="border-t border-rule px-3 py-2.5 space-y-1.5">
                          {items.map((item: TripItem, idx: number) => (
                            <div key={item.id} className="flex items-start gap-2.5">
                              <span className="mt-0.5 flex-shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brass-subtle)] t-mono text-[0.625rem] font-semibold text-[var(--brass)]">
                                {idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[0.8125rem] font-medium text-foreground truncate leading-snug">{item.title}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {item.start_time && (
                                    <span className="t-mono text-[0.625rem] text-ink-3 tabular-nums">
                                      {item.start_time.slice(0, 5)}
                                    </span>
                                  )}
                                  <span className="t-mono text-[0.625rem] px-1.5 py-0.5 rounded-full bg-[var(--paper-recessed)] text-ink-3 capitalize">
                                    {item.type}
                                  </span>
                                  {item.place?.name && (
                                    <span className="text-caption text-ink-3 truncate">{item.place.name}</span>
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
          </aside>
        </div>
      </div>

      {activeMessages.length === 0 && (
        <div className="relative z-10 flex-shrink-0 border-t border-rule bg-paper-raised/85 backdrop-blur-md px-4 py-4">
          {planningError && (
            <div className="max-w-2xl mx-auto mb-3 rounded-md border border-[color:var(--pillar-desert-wash)] bg-[var(--pillar-desert-wash)] px-4 py-2 text-body-sm text-[var(--terracotta)]">
              {planningError}
            </div>
          )}
          <div className={cn(
            'flex items-center gap-3 max-w-2xl mx-auto',
            'border border-rule bg-[var(--paper-recessed)]/60 rounded-md px-4 py-1.5',
            'focus-within:border-[var(--brass)] focus-within:ring-2 focus-within:ring-[var(--brass-glow)] transition-all'
          )}>
            <input
              type="text"
              placeholder={planningInProgress ? 'Opening Trip Studio…' : 'Try: “Best 3-day city break for 4 friends leaving from Toronto?”'}
              disabled={planningInProgress}
              className="flex-1 bg-transparent py-2 text-body text-foreground placeholder:text-ink-3 focus:outline-none disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  sendMessage(e.currentTarget.value.trim())
                  e.currentTarget.value = ''
                }
              }}
            />
            <span className="t-mono text-[0.625rem] tracking-[0.16em] text-ink-3 flex-shrink-0">↵ SEND</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <ChatPageContent />
    </Suspense>
  )
}
