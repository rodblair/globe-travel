'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Share2, ArrowLeftRight, Calendar, Link as LinkIcon } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import ItineraryArtifact, { type TripDay, type TripItem } from '@/components/trips/ItineraryArtifact'

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

export default function TripStudioPage() {
  const params = useParams<{ tripId: string }>()
  const tripId = params.tripId

  const [selectedDayIndex, setSelectedDayIndex] = useState(1)
  const [chatOpen, setChatOpen] = useState(true)
  const flyToRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}`)
      if (!res.ok) throw new Error('Failed to load trip')
      return res.json() as Promise<TripPayload>
    },
  })

  const trip = data?.trip
  const days = data?.days || []

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

  const shareUrl = trip?.share_slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/t/${trip.share_slug}` : null

  const togglePublic = useCallback(async () => {
    if (!trip) return
    await fetch(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_public: !trip.is_public }),
    })
    await refetch()
  }, [tripId, trip, refetch])

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

      {/* Left panel: chat */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute top-4 left-4 bottom-4 w-[calc(100%-2rem)] md:w-[360px] z-20 flex flex-col bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden"
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
        className="absolute top-4 right-4 bottom-4 w-[calc(100%-2rem)] md:w-[420px] z-20 flex flex-col bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden"
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

