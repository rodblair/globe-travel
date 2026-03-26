'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useDragControls } from 'motion/react'
import { Share2, ArrowLeftRight, Calendar, Link as LinkIcon, Copy, Send, MessageSquareQuote, Route, GripHorizontal } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import ItineraryArtifact, { type TripDay, type TripItem } from '@/components/trips/ItineraryArtifact'
import { buildDisplayStops } from '@/components/trips/derivedStops'
import { cn } from '@/lib/utils'

type Trip = {
  id: string
  title: string
  is_public: boolean
  share_slug: string | null
}

type TripPayload = {
  trip: Trip
  days: TripDay[]
}

const EMPTY_DAYS: TripDay[] = []
const INITIAL_PROMPT_PREFIX = 'globe-travel:trip:initial-prompt:'

type TripFeedback = {
  id: string
  author_name: string
  author_email?: string | null
  sentiment: 'love_it' | 'curious' | 'practical'
  comment: string
  created_at: string
}

const sentimentLabel: Record<TripFeedback['sentiment'], string> = {
  love_it: 'Love it',
  curious: 'Curious',
  practical: 'Practical note',
}

const sentimentClasses: Record<TripFeedback['sentiment'], string> = {
  love_it: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  curious: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
  practical: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
}

function extractDestinationLabel(title: string | null | undefined) {
  if (!title) return null

  const cleaned = title.trim()
  const patterns = [
    /^\d+\s+Days?\s+in\s+(.+)$/i,
    /^(.+?)\s+in\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
    /^(.+?)\s+Day\s+Trip$/i,
    /^Trip to\s+(.+)$/i,
    /^(.+?)\s+Trip$/i,
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    if (match?.[1]) return match[1].trim()
  }

  return cleaned
}

function coerceCoordinate(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export default function TripStudioPage() {
  const params = useParams<{ tripId: string }>()
  const searchParams = useSearchParams()
  const tripId = params.tripId

  const [selectedDayIndex, setSelectedDayIndex] = useState(1)
  const [chatOpen, setChatOpen] = useState(true)
  const [isHydratingMaps, setIsHydratingMaps] = useState(false)
  const studioRef = useRef<HTMLDivElement>(null)
  const flyToRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null)
  const hydrationAttemptedRef = useRef<string | null>(null)
  const chatDragControls = useDragControls()
  const itineraryDragControls = useDragControls()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load trip')
      return res.json() as Promise<TripPayload>
    },
    retry: 1,
  })

  const resolvedPayload = data
  const trip = resolvedPayload?.trip
  const days = resolvedPayload?.days ?? EMPTY_DAYS

  const { data: feedback = [] } = useQuery({
    queryKey: ['trip-feedback', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/feedback`)
      if (!res.ok) return [] as TripFeedback[]
      return res.json() as Promise<TripFeedback[]>
    },
  })

  const ensureSelectedDayExists = useMemo(() => {
    if (days.length === 0) return 1
    const has = days.some((d) => d.day_index === selectedDayIndex)
    return has ? selectedDayIndex : days[0].day_index
  }, [days, selectedDayIndex])

  const tripStops = useMemo(
    () =>
      days
        .flatMap((day) => buildDisplayStops((day.items || []) as any))
        .filter((stop) => stop.mapped)
        .map((stop, index) => ({
          id: stop.id,
          title: stop.title,
          latitude: stop.latitude,
          longitude: stop.longitude,
          index: index + 1,
        })),
    [days]
  )

  const tripDestination = useMemo(() => extractDestinationLabel(trip?.title), [trip?.title])

  const mappingSummary = useMemo(() => {
    const itemCount = days.reduce((sum, day) => sum + (day.items?.length || 0), 0)
    const mappedItemCount = days.reduce(
      (sum, day) => sum + day.items.filter((item) => coerceCoordinate(item.place?.latitude) != null && coerceCoordinate(item.place?.longitude) != null).length,
      0
    )
    const routeDayCount = days.filter((day) => (day.routes?.length || 0) > 0).length

    return {
      itemCount,
      mappedItemCount,
      routeDayCount,
      needsHydration: itemCount > 0,
    }
  }, [days])

  const onBulkOps = useCallback(async (ops: any[]) => {
    await fetch(`/api/trips/${tripId}/items/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ops }),
    })
    await refetch()
  }, [tripId, refetch])

  const onSelectItem = useCallback((item: TripItem) => {
    const latitude = coerceCoordinate(item.place?.latitude)
    const longitude = coerceCoordinate(item.place?.longitude)
    if (latitude != null && longitude != null) {
      flyToRef.current?.(latitude, longitude, 4)
    }
  }, [])

  const refreshTripWithMaps = useCallback(async () => {
    await fetch(`/api/trips/${tripId}/hydrate-map`, { method: 'POST' }).catch(() => null)
    await refetch()
  }, [tripId, refetch])

  const { messages, isLoading: chatLoading, error: chatError, sendMessage, stop } = useChat({
    type: 'plan',
    tripId,
    onTripPatch: () => {
      void refreshTripWithMaps()
    },
    onNavigate: (nav) => {
      if (coerceCoordinate(nav.latitude) != null && coerceCoordinate(nav.longitude) != null) {
        flyToRef.current?.(Number(nav.latitude), Number(nav.longitude), 4)
      }
    },
  })

  useEffect(() => {
    if (!tripId || typeof window === 'undefined') return

    const prompt = searchParams.get('prompt')?.trim()
    if (!prompt) return

    const storageKey = `${INITIAL_PROMPT_PREFIX}${tripId}:${prompt}`
    if (window.sessionStorage.getItem(storageKey)) return

    window.sessionStorage.setItem(storageKey, 'sent')
    sendMessage(prompt)
  }, [searchParams, sendMessage, tripId])

  const handleRegenerateDay = useCallback((dayIndex: number) => {
    sendMessage(`Regenerate Day ${dayIndex} with a better flow. Keep it realistic with timing and neighborhoods.`)
  }, [sendMessage])

  const handleSwapItem = useCallback((item: TripItem) => {
    sendMessage(`Swap this activity for something better:\nDay ${ensureSelectedDayExists}\nCurrent: ${item.title}\nPreference: similar vibe, nearby, and fits the day's flow.`)
  }, [sendMessage, ensureSelectedDayExists])

  const handleOptimize = useCallback(async () => {
    await fetch(`/api/trips/${tripId}/days/${ensureSelectedDayExists}/optimize`, { method: 'POST' })
    await refetch()
  }, [tripId, ensureSelectedDayExists, refetch])

  const hydrateMaps = useCallback(async () => {
    if (isHydratingMaps) return
    setIsHydratingMaps(true)
    try {
      await fetch(`/api/trips/${tripId}/hydrate-map`, { method: 'POST' })
      await refetch()
    } finally {
      setIsHydratingMaps(false)
    }
  }, [tripId, refetch, isHydratingMaps])

  useEffect(() => {
    hydrationAttemptedRef.current = null
  }, [tripId])

  useEffect(() => {
    if (isLoading || isHydratingMaps || !mappingSummary.needsHydration) return

    const hydrationKey = `${tripId}:${mappingSummary.itemCount}:${mappingSummary.mappedItemCount}:${mappingSummary.routeDayCount}`
    if (hydrationAttemptedRef.current === hydrationKey) return

    hydrationAttemptedRef.current = hydrationKey
    void hydrateMaps()
  }, [tripId, isLoading, isHydratingMaps, mappingSummary, hydrateMaps])

  const shareUrl = trip?.share_slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/t/${trip.share_slug}` : null
  const inviteMessage = shareUrl
    ? `Review my trip ideas for ${trip?.title || 'this trip'} and tell me what you think: ${shareUrl}`
    : ''

  const togglePublic = useCallback(async () => {
    if (!trip) return
    await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: !trip.is_public }),
    })
    await refetch()
  }, [tripId, trip, refetch])

  const copyInviteLink = useCallback(async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
  }, [shareUrl])

  const shareInvite = useCallback(async () => {
    if (!shareUrl) return
    if (navigator.share) {
      await navigator.share({
        title: trip?.title || 'Trip ideas',
        text: inviteMessage,
        url: shareUrl,
      })
      return
    }
    await navigator.clipboard.writeText(inviteMessage)
  }, [shareUrl, inviteMessage, trip?.title])

  return (
    <div ref={studioRef} className="relative w-full h-full min-h-screen bg-[#050510] overflow-hidden">
      {/* Globe */}
      <div className="absolute inset-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.09),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.08),transparent_26%),linear-gradient(180deg,rgba(5,5,16,0.98),rgba(3,4,10,1))]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
        <div className="absolute right-4 top-4 z-10 rounded-[28px] border border-white/12 bg-[rgba(8,8,14,0.72)] px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/38">Trip Map Status</p>
          <p className="mt-1 text-sm font-medium text-white">{tripDestination || trip?.title || 'Trip Studio'}</p>
          <p className="mt-2 text-xs text-white/62">
            {tripStops.length > 0
              ? `${tripStops.length} routed stops across ${days.length} day${days.length === 1 ? '' : 's'}`
              : 'Using itinerary-first map previews for stability'}
          </p>
        </div>
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[min(960px,calc(100%-2rem))]">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/15 bg-[rgba(9,9,15,0.78)] px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/12">
                <Calendar className="h-4 w-4 text-amber-300" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">{tripDestination ? `${tripDestination} Trip Studio` : 'Trip Studio'}</p>
                <p className="truncate text-sm font-medium text-white">{trip?.title || 'Trip Studio'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOptimize}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-medium text-white/82 transition-colors hover:bg-white/12"
              title="Optimize the order for this day"
            >
              <ArrowLeftRight className="h-4 w-4 text-amber-300" />
              Optimize day
            </button>
            <button
              onClick={hydrateMaps}
              disabled={isHydratingMaps}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-medium text-white/82 transition-colors hover:bg-white/12 disabled:opacity-50"
              title="Repair or rebuild day map locations and routes"
            >
              <Route className="h-4 w-4 text-sky-300" />
              {isHydratingMaps ? 'Building maps…' : 'Build maps'}
            </button>
            <button
              onClick={togglePublic}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                trip?.is_public
                  ? 'border-emerald-400/25 bg-emerald-400/12 text-emerald-200 hover:bg-emerald-400/16'
                  : 'border-white/15 bg-white/8 text-white/82 hover:bg-white/12'
              )}
              title="Toggle public sharing"
            >
              <Share2 className="h-4 w-4" />
              {trip?.is_public ? 'Public review on' : 'Enable review link'}
            </button>
            {trip?.is_public && shareUrl && (
              <Link
                href={`/t/${trip.share_slug}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/12 px-3 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/18"
                title="Open public share link"
              >
                <LinkIcon className="h-4 w-4" />
                View share
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* Invite + feedback */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 w-[min(920px,calc(100%-2rem))] pointer-events-none">
        <div className="grid gap-3 pointer-events-auto md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[26px] border border-white/12 bg-[rgba(8,8,14,0.7)] px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/38">Group review</p>
                <p className="mt-1 text-sm font-medium text-white">Invite friends to react to this {tripDestination || 'trip'} plan.</p>
                <p className="mt-1 text-xs leading-relaxed text-white/62">
                  Keep the planning flow social without burying the itinerary in extra controls.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={togglePublic}
                  className={cn(
                    'rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                    trip?.is_public
                      ? 'border-emerald-400/25 bg-emerald-400/12 text-emerald-200'
                      : 'border-white/15 bg-white/8 text-white/78 hover:bg-white/12'
                  )}
                >
                  {trip?.is_public ? 'Public link on' : 'Enable public link'}
                </button>
              </div>
            </div>

            {trip?.is_public && shareUrl ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1 rounded-2xl border border-white/12 bg-white/7 px-3 py-2 text-xs text-white/72 truncate">
                  {shareUrl}
                </div>
                <button
                  onClick={copyInviteLink}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-medium text-white/82 transition-colors hover:bg-white/12"
                >
                  <Copy className="w-4 h-4" />
                  Copy link
                </button>
                <button
                  onClick={shareInvite}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/12 px-3 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/18"
                >
                  <Send className="w-4 h-4" />
                  Share invite
                </button>
              </div>
            ) : (
              <p className="mt-4 text-xs text-white/58">
                Reviews open automatically once the trip is public.
              </p>
            )}
          </div>

          <div className="rounded-[26px] border border-white/12 bg-[rgba(8,8,14,0.7)] px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/38">Friend feedback</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {feedback.length} {feedback.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
              <MessageSquareQuote className="w-5 h-5 text-white/25" />
            </div>

            <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
              {feedback.length === 0 ? (
                <p className="text-xs leading-relaxed text-white/58">
                  No reviews yet. Invite a few friends and ask them where the itinerary feels too busy or exciting.
                </p>
              ) : (
                feedback.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-white/12 bg-white/8 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-xs font-medium text-white">{entry.author_name}</p>
                      <span className={cn('px-2 py-1 rounded-full border text-[10px]', sentimentClasses[entry.sentiment])}>
                        {sentimentLabel[entry.sentiment]}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-white/72 line-clamp-3">{entry.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Left panel: chat */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            drag
            dragControls={chatDragControls}
            dragListener={false}
            dragConstraints={studioRef}
            dragMomentum={false}
            dragElastic={0.08}
            className="absolute top-[214px] md:top-44 left-4 bottom-4 w-[calc(100%-2rem)] md:w-[360px] z-20 flex flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[rgba(7,7,12,0.82)] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
          >
            <div
              onPointerDown={(event) => chatDragControls.start(event)}
              className="flex flex-shrink-0 items-center justify-between border-b border-white/12 px-5 py-4 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">Planner chat</p>
                  <p className="text-sm font-medium text-white">Guide the itinerary</p>
                </div>
                <span
                  className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] text-white/55"
                  title="Drag chat window"
                >
                  <GripHorizontal className="h-3.5 w-3.5" />
                  Move
                </span>
              </div>
              <button
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setChatOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ChatInterface
                messages={messages}
                isLoading={chatLoading}
                error={chatError}
                onSendMessage={sendMessage}
                onStop={stop}
                placeholder="Tell me where/when you’re going, your vibe, and your must-dos…"
                storageKey={tripId ? `globe-travel:chat-input:plan:${tripId}` : undefined}
                suggestions={[
                  `Plan Day ${ensureSelectedDayExists} around food and neighborhoods`,
                  `Add a day trip from here`,
                  `Make Day ${ensureSelectedDayExists} more relaxed`,
                ]}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right panel: itinerary */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        drag
        dragControls={itineraryDragControls}
        dragListener={false}
        dragConstraints={studioRef}
        dragMomentum={false}
        dragElastic={0.08}
        className="absolute top-[214px] md:top-44 right-4 bottom-4 w-[calc(100%-2rem)] md:w-[460px] z-20 flex flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[rgba(7,7,12,0.82)] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
      >
        <div
          onPointerDown={(event) => itineraryDragControls.start(event)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="absolute right-4 top-4 z-30 hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] text-white/55 cursor-grab active:cursor-grabbing">
            <GripHorizontal className="h-3.5 w-3.5" />
            Move
          </div>
          <ItineraryArtifact
            tripTitle={trip?.title || 'Trip'}
            days={days}
            selectedDayIndex={ensureSelectedDayExists}
            setSelectedDayIndex={setSelectedDayIndex}
            onSelectItem={onSelectItem}
            onBulkOps={onBulkOps}
            onRegenerateDay={handleRegenerateDay}
            onSwapItem={handleSwapItem}
            isLoading={isLoading}
          />
        </div>
      </motion.div>

      {/* Loading overlay if trip payload is empty */}
      {isLoading && !resolvedPayload && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center">
          <div className="text-sm text-white/50">Loading trip…</div>
        </div>
      )}
    </div>
  )
}
