'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Share2, ArrowLeftRight, Calendar, Link as LinkIcon, Copy, Send, MessageSquareQuote, Route } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import ItineraryArtifact, { type TripDay, type TripItem } from '@/components/trips/ItineraryArtifact'
import { cn } from '@/lib/utils'

const TripGlobe = dynamic(() => import('@/components/globes/TripGlobe'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#050510]" />,
})

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

export default function TripStudioPage() {
  const params = useParams<{ tripId: string }>()
  const tripId = params.tripId

  const [selectedDayIndex, setSelectedDayIndex] = useState(1)
  const [chatOpen, setChatOpen] = useState(true)
  const [isHydratingMaps, setIsHydratingMaps] = useState(false)
  const flyToRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null)
  const hydrationAttemptedRef = useRef<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load trip')
      return res.json() as Promise<TripPayload>
    },
  })

  const trip = data?.trip
  const days = data?.days ?? EMPTY_DAYS

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

  const selectedDay = useMemo(
    () => days.find((d) => d.day_index === ensureSelectedDayExists),
    [days, ensureSelectedDayExists]
  )

  const selectedStops = useMemo(() => {
    const items = (selectedDay?.items || [])
      .filter((it) => it.place?.latitude && it.place?.longitude)
      .sort((a, b) => a.order_index - b.order_index)
    return items.map((it, idx) => ({
      id: it.id,
      title: it.place?.name || it.title,
      latitude: it.place?.latitude || 0,
      longitude: it.place?.longitude || 0,
      index: idx + 1,
    }))
  }, [selectedDay])

  const selectedRouteGeojson = useMemo(() => {
    const route = selectedDay?.routes?.find((r) => r.mode === 'walk') || selectedDay?.routes?.[0]
    if (!route?.geojson) return null
    return route.geojson
  }, [selectedDay])

  const mappingSummary = useMemo(() => {
    const itemCount = days.reduce((sum, day) => sum + (day.items?.length || 0), 0)
    const mappedItemCount = days.reduce(
      (sum, day) => sum + day.items.filter((item) => item.place?.latitude != null && item.place?.longitude != null).length,
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
    if (item.place?.latitude && item.place?.longitude) {
      flyToRef.current?.(item.place.latitude, item.place.longitude, 4)
    }
  }, [])

  const { messages, isLoading: chatLoading, sendMessage, stop } = useChat({
    type: 'plan',
    tripId,
    onTripPatch: () => refetch(),
    onNavigate: (nav) => {
      if (nav.latitude && nav.longitude) flyToRef.current?.(nav.latitude, nav.longitude, 4)
    },
  })

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
    <div className="relative w-full h-full min-h-screen bg-[#050510] overflow-hidden">
      {/* Globe */}
      <div className="absolute inset-0">
        <TripGlobe
          stops={selectedStops}
          routeGeojson={selectedRouteGeojson}
          flyToRef={flyToRef}
          className="w-full h-full"
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-2.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full"
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-white/70 font-medium">
            {trip?.title || 'Trip Studio'}
          </span>
          <div className="w-px h-3 bg-white/10" />
          <button
            onClick={handleOptimize}
            className="text-xs text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-1.5"
            title="Optimize the order for this day"
          >
            <ArrowLeftRight className="w-4 h-4 text-white/30" />
            Optimize order
          </button>
          <div className="w-px h-3 bg-white/10" />
          <button
            onClick={hydrateMaps}
            disabled={isHydratingMaps}
            className="text-xs text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
            title="Repair or rebuild day map locations and routes"
          >
            <Route className="w-4 h-4 text-white/30" />
            {isHydratingMaps ? 'Building maps…' : 'Build maps'}
          </button>
          <div className="w-px h-3 bg-white/10" />
          <button
            onClick={togglePublic}
            className="text-xs text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-1.5"
            title="Toggle public sharing"
          >
            <Share2 className="w-4 h-4 text-white/30" />
            {trip?.is_public ? 'Public' : 'Private'}
          </button>
          {trip?.is_public && shareUrl && (
            <>
              <div className="w-px h-3 bg-white/10" />
              <Link
                href={`/t/${trip.share_slug}`}
                className="text-xs text-amber-300 hover:text-amber-200 transition-colors inline-flex items-center gap-1.5"
                title="Open public share link"
              >
                <LinkIcon className="w-4 h-4" />
                View share
              </Link>
            </>
          )}
        </motion.div>
      </div>

      {/* Invite + feedback */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[min(720px,calc(100%-2rem))] pointer-events-none">
        <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-3 pointer-events-auto">
          <div className="bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-white/25">Invite friends</p>
                <p className="text-sm text-white/75 mt-1">
                  Turn on public sharing, send the link, and collect feedback on this itinerary.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={togglePublic}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-medium border transition-colors',
                    trip?.is_public
                      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-white/50 hover:text-white/80'
                  )}
                >
                  {trip?.is_public ? 'Public link on' : 'Enable public link'}
                </button>
              </div>
            </div>

            {trip?.is_public && shareUrl ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/40 truncate">
                  {shareUrl}
                </div>
                <button
                  onClick={copyInviteLink}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white/80 hover:bg-white/10 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy link
                </button>
                <button
                  onClick={shareInvite}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/25 text-xs text-amber-300 hover:bg-amber-500/20 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Share invite
                </button>
              </div>
            ) : (
              <p className="mt-3 text-xs text-white/35">
                Reviews open automatically once the trip is public.
              </p>
            )}
          </div>

          <div className="bg-black/55 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/25">Friend feedback</p>
                <p className="text-sm text-white/75 mt-1">
                  {feedback.length} {feedback.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
              <MessageSquareQuote className="w-5 h-5 text-white/25" />
            </div>

            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
              {feedback.length === 0 ? (
                <p className="text-xs text-white/35">
                  No reviews yet. Invite a few friends and ask them where the itinerary feels too busy or exciting.
                </p>
              ) : (
                feedback.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-white/70 font-medium truncate">{entry.author_name}</p>
                      <span className={cn('px-2 py-1 rounded-full border text-[10px]', sentimentClasses[entry.sentiment])}>
                        {sentimentLabel[entry.sentiment]}
                      </span>
                    </div>
                    <p className="text-xs text-white/45 leading-relaxed mt-2 line-clamp-3">{entry.comment}</p>
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
            className="absolute top-[178px] md:top-36 left-4 bottom-4 w-[calc(100%-2rem)] md:w-[360px] z-20 flex flex-col bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 flex-shrink-0">
              <span className="text-xs font-medium text-white/70">Trip Planner</span>
              <button
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
                onSendMessage={sendMessage}
                onStop={stop}
                placeholder="Tell me where/when you’re going, your vibe, and your must-dos…"
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
        className="absolute top-[178px] md:top-36 right-4 bottom-4 w-[calc(100%-2rem)] md:w-[420px] z-20 flex flex-col bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden"
      >
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
      </motion.div>

      {/* Loading overlay if trip payload is empty */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center">
          <div className="text-sm text-white/50">Loading trip…</div>
        </div>
      )}
    </div>
  )
}
