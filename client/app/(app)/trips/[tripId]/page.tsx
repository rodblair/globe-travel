'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useDragControls } from 'motion/react'
import { Share2, ArrowLeftRight, Calendar, Link as LinkIcon, Copy, Send, MessageSquareQuote, Route, GripHorizontal, Check, Users, Wallet, Plane, Sparkles, Wand2, RefreshCcw, Scale3d } from 'lucide-react'
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
const GROUP_BRIEF_KEY = 'globe-travel:trip:group-brief:'

type TripFeedback = {
  id: string
  author_name: string
  author_email?: string | null
  sentiment: 'love_it' | 'curious' | 'practical'
  comment: string
  created_at: string
}

type PlannerWorkflowJob = {
  id: string
  tripId: string
  type: 'decision_memo' | 'generate_variants' | 'feedback_refresh'
  status: 'queued' | 'running' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  result?: any
  error?: string
}

type GroupBrief = {
  groupSize?: number
  originCity?: string
  budget?: string
  vibe?: string
  days?: number
  destination?: string
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

function TripStudioPageContent() {
  const params = useParams<{ tripId: string }>()
  const searchParams = useSearchParams()
  const tripId = params.tripId

  const [selectedDayIndex, setSelectedDayIndex] = useState(1)
  const [chatOpen, setChatOpen] = useState(false)
  const [isHydratingMaps, setIsHydratingMaps] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizeDone, setOptimizeDone] = useState(false)
  const [pageOrigin, setPageOrigin] = useState('')
  const [groupBrief, setGroupBrief] = useState<GroupBrief | null>(null)
  const [creatingWorkflow, setCreatingWorkflow] = useState<string | null>(null)
  const [workflowError, setWorkflowError] = useState<string | null>(null)

  // Capture window.location.origin after mount to avoid SSR ↔ client mismatch
  useEffect(() => { setPageOrigin(window.location.origin) }, [])
  useEffect(() => {
    if (!tripId || typeof window === 'undefined') return

    const fromUrl = searchParams.get('brief')
    if (fromUrl) {
      try {
        const parsed = JSON.parse(fromUrl) as GroupBrief
        setGroupBrief(parsed)
        window.localStorage.setItem(`${GROUP_BRIEF_KEY}${tripId}`, JSON.stringify(parsed))
        return
      } catch {
      }
    }

    try {
      const saved = window.localStorage.getItem(`${GROUP_BRIEF_KEY}${tripId}`)
      if (saved) {
        setGroupBrief(JSON.parse(saved) as GroupBrief)
      }
    } catch {
    }
  }, [tripId, searchParams])
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

  const { data: workflowJobs = [], refetch: refetchWorkflowJobs } = useQuery({
    queryKey: ['planner-jobs', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/planner-jobs`)
      if (!res.ok) return [] as PlannerWorkflowJob[]
      return res.json() as Promise<PlannerWorkflowJob[]>
    },
    refetchInterval: (query) => {
      const jobs = (query.state.data as PlannerWorkflowJob[] | undefined) || []
      return jobs.some((job) => job.status === 'queued' || job.status === 'running') ? 2500 : false
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

  const { messages, isReady: chatReady, isLoading: chatLoading, error: chatError, sendMessage, stop } = useChat({
    type: 'plan',
    tripId,
    onTripPatch: () => {
      void refetch()
    },
    onNavigate: (nav) => {
      if (coerceCoordinate(nav.latitude) != null && coerceCoordinate(nav.longitude) != null) {
        flyToRef.current?.(Number(nav.latitude), Number(nav.longitude), 4)
      }
    },
  })

  // If the trip has days but 0 items (e.g. a previous plan run failed to insert),
  // auto-generate an itinerary — either by clearing the URL-prompt lock or by sending
  // a fallback generate message derived from the trip title.
  useEffect(() => {
    if (!tripId || typeof window === 'undefined') return
    if (isLoading || !chatReady) return
    const totalItems = days.reduce((sum, d) => sum + (d.items?.length ?? 0), 0)
    if (days.length === 0 || totalItems > 0) return

    const urlPrompt = searchParams.get('prompt')?.trim()
    if (urlPrompt) {
      // Clear URL-prompt lock so the send-effect below can fire
      window.sessionStorage.removeItem(`${INITIAL_PROMPT_PREFIX}${tripId}:${urlPrompt}`)
      return
    }

    // No URL prompt — use a fallback derived from the trip title
    const dest = trip?.title?.trim() || 'this destination'
    const fallback = `Plan a ${days.length}-day trip to ${dest}. Build a complete itinerary for each day with specific activities, meals, and must-see sights. Include real place names with timing.`
    const fallbackKey = `${INITIAL_PROMPT_PREFIX}${tripId}:fallback`
    if (window.sessionStorage.getItem(fallbackKey)) return
    window.sessionStorage.setItem(fallbackKey, 'sent')
    sendMessage(fallback).catch(() => window.sessionStorage.removeItem(fallbackKey))
  }, [tripId, isLoading, chatReady, days, searchParams, trip?.title, sendMessage])

  useEffect(() => {
    if (!tripId || typeof window === 'undefined' || !chatReady) return

    const prompt = searchParams.get('prompt')?.trim()
    if (!prompt) return

    const storageKey = `${INITIAL_PROMPT_PREFIX}${tripId}:${prompt}`
    if (window.sessionStorage.getItem(storageKey)) return

    window.sessionStorage.setItem(storageKey, 'sent')
    sendMessage(prompt).catch(() => {
      window.sessionStorage.removeItem(storageKey)
    })
  }, [searchParams, sendMessage, tripId, chatReady])

  const handleRegenerateDay = useCallback((dayIndex: number) => {
    sendMessage(`Regenerate Day ${dayIndex} with a better flow. Keep it realistic with timing and neighborhoods.`)
  }, [sendMessage])

  const handleSwapItem = useCallback((item: TripItem) => {
    sendMessage(`Swap this activity for something better:\nDay ${ensureSelectedDayExists}\nCurrent: ${item.title}\nPreference: similar vibe, nearby, and fits the day's flow.`)
  }, [sendMessage, ensureSelectedDayExists])

  const handleOptimize = useCallback(async (dayIndex?: number) => {
    if (isOptimizing) return
    const targetDay = dayIndex ?? ensureSelectedDayExists
    setIsOptimizing(true)
    setOptimizeDone(false)
    try {
      await fetch(`/api/trips/${tripId}/days/${targetDay}/optimize`, { method: 'POST' })
      await refetch()
      setOptimizeDone(true)
      setTimeout(() => setOptimizeDone(false), 2500)
    } finally {
      setIsOptimizing(false)
    }
  }, [tripId, ensureSelectedDayExists, refetch, isOptimizing])

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

  const shareUrl = trip?.share_slug && pageOrigin ? `${pageOrigin}/t/${trip.share_slug}` : null
  const inviteMessage = shareUrl
    ? `Review my trip ideas for ${trip?.title || 'this trip'} and tell me what you think: ${shareUrl}`
    : ''
  const readinessCount = Number(Boolean(trip?.is_public)) + Math.min(feedback.length, 2) + Number(Boolean(groupBrief?.groupSize))

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

  const latestWorkflowJob = workflowJobs[0]

  const startWorkflow = useCallback(async (type: PlannerWorkflowJob['type']) => {
    if (!tripId || creatingWorkflow) return
    setWorkflowError(null)
    setCreatingWorkflow(type)
    try {
      const res = await fetch(`/api/trips/${tripId}/planner-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) throw new Error('Planner workflow could not start')
      await refetchWorkflowJobs()
    } catch {
      setWorkflowError('Could not start that trip option. Please try again.')
    } finally {
      setCreatingWorkflow(null)
    }
  }, [tripId, creatingWorkflow, refetchWorkflowJobs])

  return (
    <div ref={studioRef} className="relative w-full h-full min-h-screen bg-[#050510] overflow-hidden">
      {/* Globe */}
      <div className="absolute inset-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.09),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.08),transparent_26%),linear-gradient(180deg,rgba(5,5,16,0.98),rgba(3,4,10,1))]" />
        <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
        <div className="absolute right-4 top-4 z-10 hidden rounded-[28px] border border-white/12 bg-[rgba(8,8,14,0.72)] px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl xl:block">
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
              onClick={() => setChatOpen((current) => !current)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                chatOpen
                  ? 'border-amber-400/25 bg-amber-400/12 text-amber-200'
                  : 'border-white/15 bg-white/8 text-white/82 hover:bg-white/12'
              )}
            >
              <MessageSquareQuote className="h-4 w-4" />
              {chatOpen ? 'Hide chat' : 'Planner chat'}
            </button>
            <button
              onClick={() => handleOptimize()}
              disabled={isOptimizing}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50',
                optimizeDone
                  ? 'border-emerald-400/25 bg-emerald-400/12 text-emerald-200'
                  : 'border-white/15 bg-white/8 text-white/82 hover:bg-white/12'
              )}
              title="Optimize the order for this day"
            >
              {optimizeDone ? (
                <Check className="h-4 w-4 text-emerald-300" />
              ) : (
                <ArrowLeftRight className={cn('h-4 w-4 text-amber-300', isOptimizing && 'animate-pulse')} />
              )}
              {isOptimizing ? 'Optimizing…' : optimizeDone ? 'Optimized!' : 'Optimize day'}
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
      <div className="pointer-events-none absolute top-24 left-1/2 z-30 hidden w-[min(920px,calc(100%-2rem))] -translate-x-1/2 2xl:block">
        <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
          <div className="pointer-events-none rounded-[26px] border border-white/12 bg-[rgba(8,8,14,0.7)] px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
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
                    'pointer-events-auto rounded-full border px-3 py-2 text-xs font-medium transition-colors',
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
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-medium text-white/82 transition-colors hover:bg-white/12"
                >
                  <Copy className="w-4 h-4" />
                  Copy link
                </button>
                <button
                  onClick={shareInvite}
                  className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/12 px-3 py-2 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-400/18"
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

          <div className="grid gap-3">
            <div className="pointer-events-none rounded-[26px] border border-white/12 bg-[rgba(8,8,14,0.7)] px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/38">Crew brief</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    {groupBrief?.groupSize ? `${groupBrief.groupSize} travelers` : 'Add crew context in chat'}
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-amber-300/60" />
              </div>

              <div className="mt-4 grid gap-2">
                <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-xs text-white/72">
                  <Users className="w-4 h-4 text-amber-300" />
                  <span>{groupBrief?.groupSize ? `${groupBrief.groupSize} friends` : 'Crew size not set yet'}</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-xs text-white/72">
                  <Wallet className="w-4 h-4 text-emerald-300" />
                  <span>{groupBrief?.budget ? `Budget: ${groupBrief.budget}` : 'Budget still flexible'}</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-xs text-white/72">
                  <Plane className="w-4 h-4 text-sky-300" />
                  <span>{groupBrief?.originCity ? `Leaving from ${groupBrief.originCity}` : 'Origin city not set'}</span>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/8 px-3 py-2 text-xs text-white/72">
                  Vibe: {groupBrief?.vibe || 'Balanced weekend with broad appeal'}
                </div>
                <div className="rounded-2xl border border-amber-400/18 bg-amber-400/10 px-3 py-2 text-xs text-amber-100/90">
                  Trip readiness: {readinessCount}/4 — {trip?.is_public ? 'shareable' : 'turn on sharing'}, {feedback.length > 0 ? 'crew reacting' : 'needs reactions'}.
                </div>
              </div>
            </div>

            <div className="pointer-events-none rounded-[26px] border border-white/12 bg-[rgba(8,8,14,0.7)] px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
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
                    No reviews yet. Invite a few friends and ask them where the itinerary feels too busy, expensive, or worth keeping.
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

            <div className="pointer-events-none rounded-[26px] border border-white/12 bg-[rgba(8,8,14,0.7)] px-5 py-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/38">Planner workflows</p>
                  <p className="mt-1 text-sm font-medium text-white">Run async planning jobs</p>
                </div>
                <Wand2 className="w-5 h-5 text-white/25" />
              </div>

              <div className="mt-4 grid gap-2">
                <button
                  onClick={() => startWorkflow('decision_memo')}
                  disabled={Boolean(creatingWorkflow)}
                  className="pointer-events-auto flex items-center justify-between rounded-2xl border border-white/12 bg-white/8 px-3 py-3 text-left text-xs text-white/78 transition-colors hover:bg-white/12 disabled:opacity-50"
                >
                  <span>{creatingWorkflow === 'decision_memo' ? 'Starting decision memo...' : 'Generate decision memo'}</span>
                  <Scale3d className="w-4 h-4 text-amber-300" />
                </button>
                <button
                  onClick={() => startWorkflow('generate_variants')}
                  disabled={Boolean(creatingWorkflow)}
                  className="pointer-events-auto flex items-center justify-between rounded-2xl border border-white/12 bg-white/8 px-3 py-3 text-left text-xs text-white/78 transition-colors hover:bg-white/12 disabled:opacity-50"
                >
                  <span>{creatingWorkflow === 'generate_variants' ? 'Starting variants...' : 'Create cheap / balanced / premium variants'}</span>
                  <Wand2 className="w-4 h-4 text-sky-300" />
                </button>
                <button
                  onClick={() => startWorkflow('feedback_refresh')}
                  disabled={Boolean(creatingWorkflow)}
                  className="pointer-events-auto flex items-center justify-between rounded-2xl border border-white/12 bg-white/8 px-3 py-3 text-left text-xs text-white/78 transition-colors hover:bg-white/12 disabled:opacity-50"
                >
                  <span>{creatingWorkflow === 'feedback_refresh' ? 'Starting refresh...' : 'Refresh plan from feedback'}</span>
                  <RefreshCcw className="w-4 h-4 text-emerald-300" />
                </button>
              </div>

              {workflowError && (
                <p className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-300">
                  {workflowError}
                </p>
              )}

              <div className="mt-4 rounded-2xl border border-white/12 bg-white/8 p-3">
                {latestWorkflowJob ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-white capitalize">{latestWorkflowJob.type.replace(/_/g, ' ')}</p>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-white/40">{latestWorkflowJob.status}</span>
                    </div>
                    {latestWorkflowJob.status === 'completed' && latestWorkflowJob.result && (
                      <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-white/70">
                        {JSON.stringify(latestWorkflowJob.result, null, 2)}
                      </pre>
                    )}
                    {latestWorkflowJob.status === 'failed' && (
                      <p className="text-[11px] text-red-300">{latestWorkflowJob.error || 'Workflow failed'}</p>
                    )}
                    {(latestWorkflowJob.status === 'queued' || latestWorkflowJob.status === 'running') && (
                      <p className="text-[11px] text-white/55">Working through the planner job…</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] leading-relaxed text-white/55">
                    No workflow runs yet. Use these to generate decision support, itinerary variants, or feedback-driven refresh ideas.
                  </p>
                )}
              </div>
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
            className="fixed inset-x-3 bottom-3 top-24 z-40 flex flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[rgba(7,7,12,0.94)] shadow-[0_28px_90px_rgba(0,0,0,0.5)] backdrop-blur-2xl xl:absolute xl:inset-auto xl:bottom-4 xl:left-4 xl:top-44 xl:z-20 xl:w-[360px] xl:bg-[rgba(7,7,12,0.82)]"
          >
            <div
              onPointerDown={(event) => chatDragControls.start(event)}
              className="flex flex-shrink-0 items-center justify-between border-b border-white/12 px-5 py-4 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">Planner chat</p>
                  <p className="text-sm font-medium text-white">Guide the crew itinerary</p>
                </div>
                <span
                  className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] text-white/55"
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
                placeholder="Tell me the crew vibe, must-dos, budget tension, and where compromise matters…"
                storageKey={tripId ? `globe-travel:chat-input:plan:${tripId}` : undefined}
                suggestions={[
                  `Make Day ${ensureSelectedDayExists} work for ${groupBrief?.groupSize || 4} friends with mixed energy`,
                  `Keep this weekend walkable and group-friendly`,
                  `Add one standout dinner and one easy late-night stop`,
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
        className="absolute inset-x-3 bottom-3 top-28 z-20 flex flex-col overflow-hidden rounded-[30px] border border-white/12 bg-[rgba(7,7,12,0.88)] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl xl:inset-x-auto xl:bottom-4 xl:right-4 xl:top-44 xl:w-[520px] xl:bg-[rgba(7,7,12,0.82)]"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            onPointerDown={(event) => itineraryDragControls.start(event)}
            className="absolute right-4 top-4 z-30 hidden xl:inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[10px] text-white/55 cursor-grab active:cursor-grabbing"
          >
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
            onOptimize={handleOptimize}
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

export default function TripStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050510]" />}>
      <TripStudioPageContent />
    </Suspense>
  )
}
