'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Compass, Loader2, MapPin, Sparkles, Users } from 'lucide-react'
import { useChat, type NavigateEvent, type PlaceEvent } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import TripDayMap from '@/components/trips/TripDayMap'
import type { TripDay, TripItem } from '@/components/trips/ItineraryArtifact'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  buildDisplayStops,
  getDestinationFallback,
  getItineraryPlaceLabel,
  shouldUseSavedRoute,
  sortTripItemsForDisplay,
} from '@/components/trips/derivedStops'
import { extractDaysFromPrompt, extractDestinationFromPrompt } from '@/lib/planner/runtime'
import { DEFAULT_TRIP_DETAILS, TripDetailsPopover, type TripDetails } from '@/components/chat/TripDetailsPopover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type ChatMapStop = {
  id: string
  title: string
  latitude: number
  longitude: number
  index: number
}

const CHAT_MAP_STORAGE_PREFIX = 'globe-travel:chat:explore:map-stops:'

const STARTER_PROMPTS = [
  {
    label: '3 days in Lisbon',
    sub: 'Food, viewpoints, slow mornings',
    q: 'Plan 3 days in Lisbon with great food, scenic viewpoints, relaxed mornings, and one memorable night out.',
  },
  {
    label: 'Weekend in Rome',
    sub: 'Classics without the crowds',
    q: 'Plan a weekend in Rome covering the classics while avoiding the biggest crowds, with great meals.',
  },
  {
    label: 'Paris or Rome?',
    sub: 'Compare before you commit',
    q: 'Compare Paris and Rome for a 4-day trip by budget, food, walkability, nightlife, and ease of planning.',
  },
  {
    label: '4 days in Tokyo',
    sub: 'Neighbourhoods and food',
    q: 'Plan 4 days in Tokyo with neighbourhood walks, standout food, and one day trip.',
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

function readStoredMapStops(key: string) {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as ChatMapStop[]) : []
  } catch {
    return []
  }
}

function ChatPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const sentQueryRef = useRef<string | null>(null)
  const queryPrompt = searchParams.get('q')?.trim() || ''
  const qaForcePlannerDraftFailure = process.env.NODE_ENV === 'development' && searchParams.get('qaPlannerDraftFailure') === '1'
  const qaPlannerDraftDelayMs = process.env.NODE_ENV === 'development'
    ? Math.min(5000, Math.max(0, Number(searchParams.get('qaPlannerDraftDelayMs') || 0) || 0))
    : 0
  const [activeTripId, setActiveTripId] = useState<string | null>(null)
  const [selectedDayIndex, setSelectedDayIndex] = useState(1)
  const [mapStopsByKey, setMapStopsByKey] = useState<Record<string, ChatMapStop[]>>({})
  const mapStorageKey = useMemo(
    () => `${CHAT_MAP_STORAGE_PREFIX}${user?.id || 'browser'}`,
    [user?.id]
  )
  const mapStops = useMemo(
    () => mapStopsByKey[mapStorageKey] ?? readStoredMapStops(mapStorageKey),
    [mapStopsByKey, mapStorageKey]
  )
  const setMapStops = useCallback(
    (updater: (current: ChatMapStop[]) => ChatMapStop[]) => {
      setMapStopsByKey((currentByKey) => {
        const currentStops = currentByKey[mapStorageKey] ?? readStoredMapStops(mapStorageKey)
        return {
          ...currentByKey,
          [mapStorageKey]: updater(currentStops),
        }
      })
    },
    [mapStorageKey]
  )

  const handlePlaceAdded = useCallback((event: PlaceEvent) => {
    setMapStops((current) =>
      mergeStop(current, {
        id: `${event.place.name}:${event.place.latitude}:${event.place.longitude}`,
        title: event.place.name,
        latitude: event.place.latitude,
        longitude: event.place.longitude,
      })
    )
  }, [setMapStops])

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
  }, [setMapStops])

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
    return extractDaysFromPrompt(text) ?? 4
  }, [])

  const extractDraftTitle = useCallback((text: string) => {
    const destination = extractDestinationFromPrompt(text)
    if (destination) {
      const days = extractDraftDays(text)
      return `${days} ${days === 1 ? 'Day' : 'Days'} in ${destination}`
    }
    return 'Trip Draft'
  }, [extractDraftDays])

  const [tripDetails, setTripDetails] = useState<TripDetails>(DEFAULT_TRIP_DETAILS)

  const createDraftTrip = useCallback(async (prompt: string) => {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: extractDraftTitle(prompt),
        travelers_count: tripDetails.travelers,
        pace: tripDetails.pace,
        budget_level: tripDetails.budget,
        constraints: {
          days: extractDraftDays(prompt),
          destination_query: extractDestinationFromPrompt(prompt) || undefined,
          group_vibe: tripDetails.travelers > 1 ? `Trip for ${tripDetails.travelers} travelers` : 'Solo trip',
        },
      }),
    })

    if (!res.ok) throw new Error('Failed to create trip draft')
    const json = await res.json() as { tripId: string }
    setActiveTripId(json.tripId)
    return json.tripId
  }, [extractDraftDays, extractDraftTitle, tripDetails])

  const activeMessages = exploreChat.messages
  const activeLoading = exploreChat.isLoading
  const activeError = exploreChat.error
  const activeStop = exploreChat.stop

  const [planningError, setPlanningError] = useState<string | null>(null)
  const [planningInProgress, setPlanningInProgress] = useState(false)
  const [lastPlannerPrompt, setLastPlannerPrompt] = useState('')
  const [draftInput, setDraftInput] = useState('')

  const sendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return

    if (isPlanningPrompt(trimmed)) {
      setPlanningError(null)
      setLastPlannerPrompt(trimmed)
      setPlanningInProgress(true)
      try {
        if (qaPlannerDraftDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, qaPlannerDraftDelayMs))
        }
        if (qaForcePlannerDraftFailure) throw new Error('Forced planner draft failure')
        const tripId = resolvedActiveTripId || await createDraftTrip(trimmed)
        const target = `/trips/${tripId}?prompt=${encodeURIComponent(trimmed)}`
        router.push(target)
      } catch {
        setPlanningError('We could not start your trip. Your idea is still here, so you can try again.')
        setDraftInput(trimmed)
        setPlanningInProgress(false)
      }
      return
    }

    exploreChat.sendMessage(trimmed)
  }, [createDraftTrip, exploreChat, isPlanningPrompt, qaForcePlannerDraftFailure, qaPlannerDraftDelayMs, resolvedActiveTripId, router])

  const submitDraftInput = useCallback(() => {
    const next = draftInput.trim()
    if (!next || planningInProgress) return
    setDraftInput('')
    sendMessage(next)
  }, [draftInput, planningInProgress, sendMessage])

  useEffect(() => {
    if (!queryPrompt || sentQueryRef.current === queryPrompt) return
    const timer = setTimeout(() => {
      sentQueryRef.current = queryPrompt
      sendMessage(queryPrompt)
    }, 120)
    return () => clearTimeout(timer)
  }, [queryPrompt, sendMessage])

  useEffect(() => {
    localStorage.setItem(mapStorageKey, JSON.stringify(mapStops))
  }, [mapStorageKey, mapStops])

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
      const dayItems = (day.items || []) as TripItem[]
      const displayStops = buildDisplayStops(dayItems)
      const usesDerivedStops = displayStops.some((stop) => stop.id.includes(':'))
      const savedRoute = day.routes?.find((route) => route.mode === 'walk') || day.routes?.[0]
      const useSavedRoute = shouldUseSavedRoute(dayItems, savedRoute, usesDerivedStops)
      const stops = displayStops
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
        routeGeojson: useSavedRoute ? savedRoute?.geojson || null : null,
        routeSummary:
          useSavedRoute && savedRoute?.distance_m && savedRoute?.duration_s
            ? `${Math.round(savedRoute.distance_m / 100) / 10} km • ${Math.round(savedRoute.duration_s / 60)} min walk`
            : null,
        items: sortTripItemsForDisplay(dayItems),
      }
    })
  }, [tripDays])

  const destinationFallback = useMemo(
    () => getDestinationFallback(tripPayload?.trip.title),
    [tripPayload?.trip.title]
  )

  const hasPreview = previewDays.length > 0 || Boolean(destinationFallback) || mapStops.length > 0
  const isEmpty = activeMessages.length === 0

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
      {isEmpty ? (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-4 py-10 md:py-16">
            <div className="text-center">
              <h1 className="text-3xl font-bold md:text-5xl">Where to next?</h1>
              <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground md:text-lg">
                Describe your trip and get a mapped, day-by-day itinerary you can share with your group.
              </p>
            </div>

            <Card className="mt-8 gap-0 p-3 shadow-md focus-within:ring-[3px] focus-within:ring-ring/30">
              <Textarea
                aria-label="Describe your trip idea"
                placeholder='Try "4 days in Athens with an island overnight, relaxed mornings and great food"'
                disabled={planningInProgress}
                value={draftInput}
                onChange={(event) => setDraftInput(event.target.value)}
                rows={3}
                className="min-h-24 resize-none border-0 bg-transparent px-2 text-base shadow-none focus-visible:ring-0"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    submitDraftInput()
                  }
                }}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <TripDetailsPopover value={tripDetails} onChange={setTripDetails} disabled={planningInProgress} />
                <Button
                  type="button"
                  size="lg"
                  onClick={submitDraftInput}
                  disabled={!draftInput.trim() || planningInProgress}
                  className="rounded-full"
                  aria-label="Create itinerary"
                >
                  {planningInProgress ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {planningInProgress ? 'Creating…' : 'Create itinerary'}
                </Button>
              </div>
            </Card>

            {planningError && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3 text-destructive">
                  <span>{planningError}</span>
                  {lastPlannerPrompt && (
                    <Button type="button" size="sm" variant="outline" onClick={() => sendMessage(lastPlannerPrompt)}>
                      Try again
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-8">
              <p className="mb-3 text-center text-sm text-muted-foreground">Need inspiration?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {STARTER_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setDraftInput(item.q)
                    }}
                    disabled={planningInProgress}
                    className="group flex items-start gap-3 rounded-xl border bg-card p-4 text-left shadow-xs transition-all hover:border-primary/40 hover:shadow-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-50"
                  >
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {item.label.includes('?') ? <Compass className="size-4" /> : <MapPin className="size-4" />}
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block text-sm text-muted-foreground">{item.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                Planning with friends? Share the finished plan with one link.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className="flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div>
                <h1 className="text-base font-semibold leading-tight">Planner</h1>
                <p className="text-xs text-muted-foreground">Ask about destinations, compare cities, or build an itinerary.</p>
              </div>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 xl:overflow-hidden">
            <div
              className={cn(
                'mx-auto grid min-h-full max-w-7xl gap-4 pb-6 xl:h-full xl:min-h-0 xl:pb-0',
                hasPreview && 'xl:grid-cols-[minmax(0,1fr)_380px]',
              )}
            >
              <Card className="min-h-[360px] gap-0 overflow-hidden p-0 xl:min-h-0">
                <ChatInterface
                  messages={activeMessages}
                  isLoading={activeLoading}
                  error={activeError}
                  onSendMessage={sendMessage}
                  onStop={activeStop}
                  placeholder={resolvedActiveTripId ? 'Refine this itinerary, adjust the pace, or rebalance it…' : 'Ask about city trips, destinations, or multi-day itineraries…'}
                  storageKey={resolvedActiveTripId ? `globe-travel:chat-input:plan:${resolvedActiveTripId}` : 'globe-travel:chat-input:explore'}
                  suggestions={[
                    'Suggest 3 easy city trips this month',
                    'Compare two cities for food, walkability, and nightlife',
                    'Plan a balanced 3-day break',
                  ]}
                />
              </Card>

              {hasPreview && (
                <Card className="min-h-[300px] gap-0 overflow-hidden p-0 xl:min-h-[280px]">
                  <div className="border-b px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground">{tripPayload ? 'Itinerary map' : 'Map preview'}</p>
                    <h2 className="mt-0.5 text-base font-semibold leading-tight">
                      {tripPayload ? tripPayload.trip.title : 'Places from this chat'}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{mapSubtitle}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3">
                    {previewDays.length > 0 ? (
                      <div className="space-y-3">
                        {previewDays.map(({ day, stops, routeGeojson, routeSummary, items }) => (
                          <div key={day.id} className="overflow-hidden rounded-xl border bg-background">
                            <TripDayMap
                              stops={stops}
                              routeGeojson={routeGeojson}
                              title={`Day ${day.day_index}${day.title ? ` · ${day.title}` : ''}`}
                              subtitle={`${stops.length} mapped stop${stops.length === 1 ? '' : 's'}`}
                              routeSummary={routeSummary}
                              ariaLabel={`Planner preview map for day ${day.day_index}${day.title ? `: ${day.title}` : ''}`}
                              active={resolvedSelectedDayIndex === day.day_index}
                              onClick={() => setSelectedDayIndex(day.day_index)}
                              mapHeightClassName="h-44"
                              className="min-w-0 rounded-none border-0"
                            />
                            {items.length > 0 && (
                              <ol className="space-y-2 border-t px-3 py-3">
                                {items.map((item: TripItem, idx: number) => {
                                  const placeLabel = getItineraryPlaceLabel(item)
                                  return (
                                    <li key={item.id} className="flex items-start gap-2.5">
                                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                        {idx + 1}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium leading-snug">{item.title}</p>
                                        <p className="truncate text-xs text-muted-foreground">
                                          {[item.start_time?.slice(0, 5), placeLabel].filter(Boolean).join(' · ')}
                                        </p>
                                      </div>
                                    </li>
                                  )
                                })}
                              </ol>
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
                        ariaLabel={`Destination preview map for ${destinationFallback.title}`}
                        showDetails={false}
                        mapHeightClassName="h-full min-h-[220px]"
                        className="h-full min-h-[220px] min-w-0"
                      />
                    ) : null}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <ChatPageContent />
    </Suspense>
  )
}
