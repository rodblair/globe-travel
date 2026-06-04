'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Share2, ArrowLeftRight, Calendar, Send, MessageSquareQuote, Route, Check, Sparkles, Wand2, RefreshCcw, Scale3d, Save, AlertTriangle, MapPinned, Navigation2, MoreHorizontal, Plus } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import ItineraryArtifact, { type SwapCandidate, type TripDay, type TripItem } from '@/components/trips/ItineraryArtifact'
import TripDayMap from '@/components/trips/TripDayMap'
import { buildDisplayStops, getRouteFallbackLabel, hasTransitRouteCue, shouldUseSavedRoute, sortTripItemsForDisplay } from '@/components/trips/derivedStops'
import { cn } from '@/lib/utils'

type Trip = {
  id: string
  title: string
  is_public: boolean
  is_owner?: boolean
  share_slug: string | null
}

type TripPayload = {
  trip: Trip
  days: TripDay[]
}

type TripLoadError = Error & {
  status?: number
}

const EMPTY_DAYS: TripDay[] = []
const TRIP_LOAD_TIMEOUT_MS = 12000
const ACTION_NOTICE_TIMEOUT_MS = 8000

function isTerminalTripLoadStatus(status?: number) {
  return status === 401 || status === 403 || status === 404 || status === 408
}
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
  love_it: 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]',
  curious: 'border-[color:var(--pillar-coastal-wash)] bg-[color:var(--pillar-coastal-wash)] text-[var(--horizon)]',
  practical: 'border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] text-foreground',
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

function TripStudioRecovery({ status, onRetry }: { status?: number; onRetry?: () => void }) {
  const isAuthProblem = status === 401 || status === 403
  const isTimeout = status === 408

  return (
    <section
      aria-labelledby="trip-studio-recovery-title"
      className="relative flex min-h-screen w-full items-center overflow-hidden bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklch,var(--brass),transparent_82%),transparent_32%),linear-gradient(180deg,var(--paper),var(--paper-recessed))] px-5 py-10"
    >
      <div className="paper-grain pointer-events-none absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-px bg-paper-recessed" />
      <section className="relative mx-auto w-full max-w-4xl rounded-[32px] border border-rule bg-paper-raised/90 p-6 shadow-[var(--shadow-lg)] backdrop-blur-2xl md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--terracotta)]">
          <AlertTriangle className="h-3.5 w-3.5" />
          Trip unavailable
        </div>
        <h1 id="trip-studio-recovery-title" className="mt-5 max-w-2xl font-serif text-4xl leading-[1] text-foreground md:text-6xl">
          We could not open this trip.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/62 md:text-base">
          {isTimeout
            ? 'This itinerary took too long to respond. Try again, return to saved trips, or start a fresh plan while the service finishes responding.'
            : isAuthProblem
              ? 'This itinerary needs the account or guest session that created it. Sign in, return to saved trips, or start a fresh plan.'
              : 'The trip may have been deleted, made private, or created in a different guest session. Your saved trips and planner are still available.'}
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="touch-target group rounded-[24px] border border-[color:var(--moss)]/25 bg-[color:var(--pillar-nature-wash)] p-4 text-left text-[var(--moss)] transition-colors hover:bg-[color:var(--moss)] hover:text-white sm:col-span-2"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <RefreshCcw className="h-4 w-4" />
                Try again
              </span>
              <span className="mt-2 block text-xs leading-relaxed opacity-78">
                Reload the itinerary without losing your place.
              </span>
            </button>
          )}
          <Link
            href="/saved"
            className="touch-target group rounded-[24px] border border-[color:var(--brass)]/30 bg-[var(--brass)] p-4 text-[var(--brass-text)] shadow-[0_16px_42px_rgba(245,158,11,0.18)] transition-colors hover:bg-[var(--brass-hover)]"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <MapPinned className="h-4 w-4" />
              Go to saved trips
            </span>
            <span className="mt-2 block text-xs leading-relaxed text-[var(--brass-text)]/78">
              Reopen an itinerary you still own or review trips saved to this session.
            </span>
          </Link>
          <Link
            href="/chat"
            className="touch-target rounded-[24px] border border-rule bg-paper-recessed p-4 text-foreground transition-colors hover:bg-paper"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <MessageSquareQuote className="h-4 w-4 text-[var(--brass)]" />
              Plan a new trip
            </span>
            <span className="mt-2 block text-xs leading-relaxed text-foreground/62">
              Start from a destination, a date, or a rough idea and move it into Trip Studio.
            </span>
          </Link>
        </div>
      </section>
    </section>
  )
}

function TripStudioPageContent() {
  const params = useParams<{ tripId: string }>()
  const searchParams = useSearchParams()
  const tripId = params.tripId

  const [selectedDayIndex, setSelectedDayIndex] = useState(1)
  const [chatOpen, setChatOpen] = useState(false)
  const [isHydratingMaps, setIsHydratingMaps] = useState(false)
  const [buildMapsDone, setBuildMapsDone] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isSavingTrip, setIsSavingTrip] = useState(false)
  const [isSharingTrip, setIsSharingTrip] = useState(false)
  const [saveDone, setSaveDone] = useState(false)
  const [shareDone, setShareDone] = useState(false)
  const [optimizeDone, setOptimizeDone] = useState(false)
  const [regeneratingDayIndex, setRegeneratingDayIndex] = useState<number | null>(null)
  const [regenerateDoneDayIndex, setRegenerateDoneDayIndex] = useState<number | null>(null)
  const [regenerateNotice, setRegenerateNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [pageOrigin, setPageOrigin] = useState('')
  const [groupBrief, setGroupBrief] = useState<GroupBrief | null>(null)
  const [creatingWorkflow, setCreatingWorkflow] = useState<string | null>(null)
  const [workflowError, setWorkflowError] = useState<string | null>(null)
  const [suggestedStepNotice, setSuggestedStepNotice] = useState<string | null>(null)
  const qaForceRewriteUnavailable = process.env.NODE_ENV === 'development' && searchParams.get('qaRewriteUnavailable') === '1'
  const qaForceBuildMapsFailure = process.env.NODE_ENV === 'development' && searchParams.get('qaBuildMapsFailure') === '1'
  const qaForceOptimizeFailure = process.env.NODE_ENV === 'development' && searchParams.get('qaOptimizeFailure') === '1'
  const qaForceShareFailure = process.env.NODE_ENV === 'development' && searchParams.get('qaShareFailure') === '1'
  const qaWorkflowFailureMode = process.env.NODE_ENV === 'development' ? searchParams.get('qaWorkflowFailure') : null
  const qaWorkflowFailureConsumedRef = useRef(false)
  const actionNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Capture window.location.origin after mount to avoid SSR ↔ client mismatch
  useEffect(() => { setPageOrigin(window.location.origin) }, [])
  useEffect(() => {
    return () => {
      if (actionNoticeTimeoutRef.current) {
        clearTimeout(actionNoticeTimeoutRef.current)
      }
    }
  }, [])
  const showActionNotice = useCallback((notice: string) => {
    setActionNotice(notice)
    if (actionNoticeTimeoutRef.current) clearTimeout(actionNoticeTimeoutRef.current)
    actionNoticeTimeoutRef.current = setTimeout(() => {
      setActionNotice((current) => (current === notice ? null : current))
    }, ACTION_NOTICE_TIMEOUT_MS)
  }, [])

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
  const plannerChatPanelRef = useRef<HTMLElement>(null)
  const workflowPanelRef = useRef<HTMLElement>(null)
  const flyToRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null)
  const hydrationAttemptedRef = useRef<string | null>(null)
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TRIP_LOAD_TIMEOUT_MS)

      try {
        const res = await fetch(`/api/trips/${tripId}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!res.ok) {
          const loadError = new Error('Failed to load trip') as TripLoadError
          loadError.status = res.status
          throw loadError
        }
        return res.json() as Promise<TripPayload>
      } catch (fetchError) {
        if (controller.signal.aborted) {
          const loadError = new Error('Trip load timed out') as TripLoadError
          loadError.status = 408
          throw loadError
        }
        throw fetchError
      } finally {
        clearTimeout(timeoutId)
      }
    },
    retry: (failureCount, loadError) => {
      const status = (loadError as TripLoadError | null)?.status
      return !isTerminalTripLoadStatus(status) && failureCount < 1
    },
  })

  const resolvedPayload = data
  const trip = resolvedPayload?.trip
  const days = resolvedPayload?.days ?? EMPTY_DAYS
  const canEditTrip = trip?.is_owner !== false
  const urlPrompt = searchParams.get('prompt')?.trim() || ''
  const totalItineraryItems = days.reduce((sum, day) => sum + (day.items?.length ?? 0), 0)

  const { data: feedback = [] } = useQuery({
    queryKey: ['trip-feedback', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/feedback`)
      if (!res.ok) return [] as TripFeedback[]
      return res.json() as Promise<TripFeedback[]>
    },
    enabled: Boolean(trip),
  })

  const { data: workflowJobs = [], refetch: refetchWorkflowJobs } = useQuery({
    queryKey: ['planner-jobs', tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/planner-jobs`)
      if (!res.ok) return [] as PlannerWorkflowJob[]
      return res.json() as Promise<PlannerWorkflowJob[]>
    },
    enabled: Boolean(trip),
    refetchInterval: (query) => {
      const jobs = (query.state.data as PlannerWorkflowJob[] | undefined) || []
      return jobs.some((job) => job.status === 'queued' || job.status === 'running') ? 2500 : false
    },
  })

  const feedbackCounts = useMemo(() => ({
    love_it: feedback.filter((entry) => entry.sentiment === 'love_it').length,
    curious: feedback.filter((entry) => entry.sentiment === 'curious').length,
    practical: feedback.filter((entry) => entry.sentiment === 'practical').length,
  }), [feedback])
  const visibleFeedback = feedback.slice(0, 4)
  const hiddenFeedbackCount = Math.max(0, feedback.length - visibleFeedback.length)

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
    let mappedItemCount = 0
    let routeDayCount = 0
    let routeEligibleDayCount = 0

    for (const day of days) {
      const displayStops = buildDisplayStops((day.items || []) as any)
      const mappedStops = displayStops.filter((stop) => stop.mapped)
      const usesDerivedStops = displayStops.some((stop) => stop.id.includes(':'))
      const savedRoute = day.routes?.find((entry) => entry.mode === 'walk') || day.routes?.[0]

      mappedItemCount += mappedStops.length

      if (mappedStops.length >= 2 && !usesDerivedStops && !hasTransitRouteCue(day.items || [])) {
        routeEligibleDayCount += 1
        if (shouldUseSavedRoute(day.items || [], savedRoute, usesDerivedStops)) {
          routeDayCount += 1
        }
      }
    }

    return {
      itemCount,
      mappedItemCount,
      routeDayCount,
      routeEligibleDayCount,
      needsHydration: itemCount > 0 && (mappedItemCount < itemCount || routeDayCount < routeEligibleDayCount),
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
  const isBuildingInitialItinerary = Boolean(urlPrompt && days.length > 0 && totalItineraryItems === 0 && !chatError)

  // If the trip has days but 0 items (e.g. a previous plan run failed to insert),
  // auto-generate an itinerary — either by clearing the URL-prompt lock or by sending
  // a fallback generate message derived from the trip title.
  useEffect(() => {
    if (!tripId || typeof window === 'undefined') return
    if (isLoading || !chatReady) return
    const totalItems = days.reduce((sum, d) => sum + (d.items?.length ?? 0), 0)
    if (days.length === 0 || totalItems > 0) return

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
  }, [tripId, isLoading, chatReady, days, urlPrompt, trip?.title, sendMessage])

  useEffect(() => {
    if (!tripId || typeof window === 'undefined' || !chatReady) return

    const prompt = urlPrompt
    if (!prompt) return

    const storageKey = `${INITIAL_PROMPT_PREFIX}${tripId}:${prompt}`
    if (window.sessionStorage.getItem(storageKey)) return

    window.sessionStorage.setItem(storageKey, 'sent')
    sendMessage(prompt).catch(() => {
      window.sessionStorage.removeItem(storageKey)
    })
  }, [sendMessage, tripId, chatReady, urlPrompt])

  const handleRegenerateDay = useCallback(async (dayIndex: number) => {
    if (!canEditTrip) {
      const message = 'This is a shared trip preview. Start your own trip to rewrite an editable day.'
      setActionError(message)
      setSuggestedStepNotice(message)
      return
    }

    if (!chatReady || qaForceRewriteUnavailable) {
      const message = 'Planner chat is still connecting. Try Rewrite day again in a moment.'
      setActionError(message)
      setSuggestedStepNotice(message)
      return
    }

    const pendingNotice = `Rewrite request for Day ${dayIndex} is opening in Planner chat.`
    const notice = `Day ${dayIndex} rewrite completed. Review the updated itinerary below; Planner chat kept the request history.`

    setActionError(null)
    setRegenerateNotice(pendingNotice)
    setSuggestedStepNotice(pendingNotice)
    setRegenerateDoneDayIndex(null)
    setRegeneratingDayIndex(dayIndex)
    setChatOpen(true)
    window.setTimeout(() => {
      plannerChatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)

    try {
      await sendMessage(`Rewrite Day ${dayIndex} using the replaceTripDayPlan tool. Replace only Day ${dayIndex}, keep the rest of the trip unchanged, and make the day realistic with clear timing, named places, and a better neighborhood flow. Every meal must be an exact named restaurant, cafe, bar, bakery, or market hall in the item title and place_query; do not use generic meal labels.`)
      setRegenerateDoneDayIndex(dayIndex)
      setRegenerateNotice(notice)
      setSuggestedStepNotice(notice)
      setTimeout(() => {
        setRegenerateDoneDayIndex((current) => (current === dayIndex ? null : current))
        setRegenerateNotice((current) => (current === notice ? null : current))
      }, 4500)
    } catch {
      setActionError('Could not send the rewrite request. Try again, or use Planner chat directly.')
      setSuggestedStepNotice('Rewrite did not start. Try Planner chat directly.')
    } finally {
      setRegeneratingDayIndex((current) => (current === dayIndex ? null : current))
    }
  }, [canEditTrip, chatReady, qaForceRewriteUnavailable, sendMessage])

  const handleSwapItem = useCallback(async (item: TripItem, preference: string): Promise<SwapCandidate[]> => {
    const response = await fetch(`/api/trips/${tripId}/items/${item.id}/swap`, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preference }),
    })

    if (!response.ok) throw new Error('Could not find swap options')
    const payload = await response.json()
    return payload.options || []
  }, [tripId])

  const handleApplySwapItem = useCallback(async (item: TripItem, choiceId: string) => {
    const response = await fetch(`/api/trips/${tripId}/items/${item.id}/swap`, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preference: 'apply selected replacement', choiceId }),
    })

    if (!response.ok) throw new Error('Could not apply swap')
    await refetch()
  }, [tripId, refetch])

  const handleOptimize = useCallback(async (dayIndex?: number) => {
    if (isOptimizing || !canEditTrip) return
    const targetDay = dayIndex ?? ensureSelectedDayExists
    setIsOptimizing(true)
    setOptimizeDone(false)
    setActionError(null)
    try {
      if (qaForceOptimizeFailure) throw new Error('Optimize failed')
      const response = await fetch(`/api/trips/${tripId}/days/${targetDay}/optimize`, { method: 'POST' })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = typeof payload?.error === 'string' ? payload.error : 'Optimize failed'
        throw new Error(message)
      }
      await refetch()
      setOptimizeDone(true)
      setTimeout(() => setOptimizeDone(false), 2500)
    } catch {
      setActionError('Could not optimize this day. The itinerary is still saved; try again after checking the mapped stops.')
    } finally {
      setIsOptimizing(false)
    }
  }, [tripId, ensureSelectedDayExists, refetch, isOptimizing, canEditTrip, qaForceOptimizeFailure])

  const hydrateMaps = useCallback(async () => {
    if (isHydratingMaps || !canEditTrip) return
    setActionError(null)
    setBuildMapsDone(false)
    setIsHydratingMaps(true)
    try {
      if (qaForceBuildMapsFailure) throw new Error('Map rebuild failed')
      const response = await fetch(`/api/trips/${tripId}/hydrate-map`, { method: 'POST' })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        const message = typeof payload?.error === 'string' ? payload.error : 'Map rebuild failed'
        throw new Error(message)
      }
      await refetch()
      setBuildMapsDone(true)
      setTimeout(() => setBuildMapsDone(false), 2500)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      setActionError(
        message === 'Mapbox token not configured'
          ? 'Map tools are temporarily unavailable. The itinerary is still saved; try rebuilding maps after the map service is configured.'
          : 'Could not rebuild the maps. Try again, or refresh the page if the trip changed.'
      )
    } finally {
      setIsHydratingMaps(false)
    }
  }, [tripId, refetch, isHydratingMaps, canEditTrip, qaForceBuildMapsFailure])

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
    if (!trip || !canEditTrip) return
    setActionError(null)
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: !trip.is_public }),
      })
      if (!response.ok) throw new Error('Share setting failed')
      await refetch()
    } catch {
      setActionError('Could not update sharing for this trip. Make sure you are using the account or guest session that created it.')
    }
  }, [tripId, trip, refetch, canEditTrip])

  const saveTrip = useCallback(async () => {
    if (!trip || isSavingTrip) return
    if (!canEditTrip) {
      setActionError('This is a shared trip preview. Start your own trip to save an editable copy.')
      return
    }

    setIsSavingTrip(true)
    setSaveDone(false)
    setActionError(null)
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trip.title || 'Trip workspace' }),
      })
      if (!response.ok) throw new Error('Save failed')
      await refetch()
      setSaveDone(true)
      setTimeout(() => setSaveDone(false), 2600)
    } catch {
      setActionError('Could not save this trip. If this is a shared itinerary, start your own copy first.')
    } finally {
      setIsSavingTrip(false)
    }
  }, [tripId, trip, refetch, isSavingTrip, canEditTrip])

  const copyInviteLink = useCallback(async () => {
    if (!shareUrl) return
    setActionError(null)
    try {
      await navigator.clipboard.writeText(shareUrl)
      showActionNotice('Public invite link copied. Send it to your group for feedback.')
    } catch {
      setActionError('Could not copy the invite link automatically. Select the link and copy it manually.')
    }
  }, [shareUrl, showActionNotice])

  const shareInvite = useCallback(async () => {
    if (!shareUrl) return
    setActionError(null)
    try {
      if (navigator.share) {
        await navigator.share({
          title: trip?.title || 'Trip ideas',
          text: inviteMessage,
          url: shareUrl,
        })
        showActionNotice('Share sheet opened with the public invite link.')
        return
      }
      await navigator.clipboard.writeText(inviteMessage || shareUrl)
      showActionNotice('Invite message copied. Paste it anywhere your group is planning.')
    } catch {
      setActionError('Could not open sharing automatically. The public link is still available above.')
    }
  }, [shareUrl, inviteMessage, trip?.title, showActionNotice])

  const shareWithFriends = useCallback(async () => {
    if (!trip || isSharingTrip) return
    if (!canEditTrip) {
      setActionError('This is a shared trip preview. Use the public share page to send this itinerary to friends.')
      return
    }

    setIsSharingTrip(true)
    setShareDone(false)
    setActionError(null)

    let publicLinkReady = Boolean(shareUrl)

    try {
      if (qaForceShareFailure) throw new Error('Share failed')
      if (!trip.is_public) {
        const response = await fetch(`/api/trips/${tripId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_public: true }),
        })
        if (!response.ok) throw new Error('Share failed')
        await refetch()
      }
      publicLinkReady = true
    } catch {
      setActionError('Could not create a share link for this trip. Make sure you are using the account or guest session that created it.')
      setIsSharingTrip(false)
      return
    }

    if (!shareUrl) {
      showActionNotice('Public review link is ready. Use Copy link in Group review to send it to your crew.')
      setShareDone(true)
      setTimeout(() => setShareDone(false), 5000)
      setIsSharingTrip(false)
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: trip.title || 'Trip ideas',
          text: inviteMessage || `Review my trip ideas: ${shareUrl}`,
          url: shareUrl,
        })
        showActionNotice('Share sheet opened with the public review link.')
      } else {
        await navigator.clipboard.writeText(inviteMessage || shareUrl)
        showActionNotice('Invite message copied. Paste it anywhere your group is planning.')
      }

      setShareDone(true)
      setTimeout(() => setShareDone(false), 5000)
    } catch (error) {
      const shareError = error as Error
      if (shareError?.name === 'AbortError') {
        showActionNotice('Share canceled. The public review link is still ready in Group review.')
      } else {
        setActionError(
          publicLinkReady
            ? 'The public review link is ready, but automatic sharing was blocked. Use Copy link in Group review to send it.'
            : 'Could not create a share link for this trip. Make sure you are using the account or guest session that created it.'
        )
      }
    } finally {
      setIsSharingTrip(false)
    }
  }, [trip, isSharingTrip, tripId, refetch, shareUrl, inviteMessage, canEditTrip, qaForceShareFailure, showActionNotice])

  const latestWorkflowJob = workflowJobs[0]
  const studioDayMaps = useMemo(() => {
    return days.map((day) => {
      const sortedItems = sortTripItemsForDisplay((day.items || []) as TripItem[])
      const displayStops = buildDisplayStops(sortedItems)
      const mappedStops = displayStops.filter((stop) => stop.mapped)
      const usesDerivedStops = displayStops.some((stop) => stop.id.includes(':'))
      const savedRoute = day.routes?.find((entry) => entry.mode === 'walk') || day.routes?.[0]
      const useSavedRoute = shouldUseSavedRoute(sortedItems, savedRoute, usesDerivedStops)
      const route = useSavedRoute ? savedRoute : null
      const routeSummary = route?.distance_m && route?.duration_s
        ? `${Math.round(route.distance_m / 100) / 10} km • ${Math.round(route.duration_s / 60)} min walk`
        : getRouteFallbackLabel(sortedItems, savedRoute, usesDerivedStops)

      return {
        day,
        sortedItems,
        displayStops,
        mappedStops,
        routeGeojson: useSavedRoute ? savedRoute?.geojson || null : null,
        routeSummary,
      }
    })
  }, [days])
  const selectedStudioDay = useMemo(
    () => studioDayMaps.find(({ day }) => day.day_index === ensureSelectedDayExists) || studioDayMaps[0] || null,
    [ensureSelectedDayExists, studioDayMaps]
  )
  const mappedDayCount = useMemo(
    () => studioDayMaps.filter(({ mappedStops }) => mappedStops.length > 0).length,
    [studioDayMaps]
  )
  const routeQualityLabel = mappingSummary.needsHydration
    ? 'Needs map pass'
    : tripStops.length > 0
      ? 'Excellent'
      : 'Drafting'
  const selectedDaySubtitle = selectedStudioDay
    ? [
        selectedStudioDay.day.date,
        `${selectedStudioDay.mappedStops.length} mapped stop${selectedStudioDay.mappedStops.length === 1 ? '' : 's'}`,
        selectedStudioDay.routeSummary,
      ].filter(Boolean).join(' • ')
    : 'Map appears once Globe has routeable stops.'
  const plannerChatEmptyState = useMemo(() => ({
    eyebrow: 'Ready edits',
    title: 'Start with one itinerary move',
    prompts: [
      {
        label: `Smooth Day ${ensureSelectedDayExists}`,
        detail: 'Reorder stops, reduce backtracking, and keep the best parts.',
        prompt: `Make Day ${ensureSelectedDayExists} more walkable. Reorder the stops to reduce backtracking, keep the strongest sights, and explain what changed.`,
      },
      {
        label: 'Anchor dinner',
        detail: 'Add one standout restaurant and rebalance the evening.',
        prompt: `Add one standout dinner to Day ${ensureSelectedDayExists}, then adjust the surrounding stops so the day still feels relaxed.`,
      },
      {
        label: 'Group-ready pass',
        detail: 'Tune pace, budget, and friend feedback before sharing.',
        prompt: `Review this itinerary for a group trip. Flag anything that feels too busy or expensive, then suggest the highest-impact edits before I share it.`,
      },
    ],
  }), [ensureSelectedDayExists])
  const selectedSuggestedDayIndex = selectedStudioDay?.day.day_index
  const suggestedRewriteLabel = selectedSuggestedDayIndex && regeneratingDayIndex === selectedSuggestedDayIndex
    ? 'Requesting rewrite...'
    : selectedSuggestedDayIndex && regenerateDoneDayIndex === selectedSuggestedDayIndex
      ? 'Rewrite sent'
      : 'Rewrite day'
  const suggestedRefreshLabel = creatingWorkflow === 'feedback_refresh'
    ? 'Starting refresh...'
    : 'Refresh plan from feedback'
  const suggestedNoticeIsWarning = Boolean(suggestedStepNotice && (
    suggestedStepNotice.toLowerCase().includes('could not') ||
    suggestedStepNotice.toLowerCase().includes('did not') ||
    suggestedStepNotice.toLowerCase().includes('still connecting') ||
    suggestedStepNotice.toLowerCase().includes('shared trip preview')
  ))

  const startWorkflow = useCallback(async (type: PlannerWorkflowJob['type']) => {
    if (!tripId || creatingWorkflow) return
    if (!canEditTrip) {
      const message = 'This is a shared trip preview. Start your own trip to refresh an editable plan.'
      setWorkflowError(message)
      setSuggestedStepNotice(message)
      return
    }
    const workflowLabel = type === 'feedback_refresh'
      ? 'Feedback refresh'
      : type === 'decision_memo'
        ? 'Decision memo'
        : 'Budget variants'

    setWorkflowError(null)
    setSuggestedStepNotice(`${workflowLabel} is starting...`)
    setCreatingWorkflow(type)
    window.setTimeout(() => {
      workflowPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
    try {
      if (qaWorkflowFailureMode === '1' || (qaWorkflowFailureMode === 'once' && !qaWorkflowFailureConsumedRef.current)) {
        qaWorkflowFailureConsumedRef.current = true
        throw new Error('Planner workflow could not start')
      }
      const res = await fetch(`/api/trips/${tripId}/planner-jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) throw new Error('Planner workflow could not start')
      await refetchWorkflowJobs()
      setSuggestedStepNotice(`${workflowLabel} started. Track progress in Planner workflows below.`)
    } catch {
      setWorkflowError('Could not start that trip option. Please try again.')
      setSuggestedStepNotice('Could not start that trip option. Please try again.')
    } finally {
      setCreatingWorkflow(null)
    }
  }, [tripId, creatingWorkflow, canEditTrip, refetchWorkflowJobs, qaWorkflowFailureMode])

  if (isLoading && !resolvedPayload) {
    return (
      <div
        ref={studioRef}
        className="relative flex min-h-screen w-full items-center overflow-hidden bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklch,var(--brass),transparent_82%),transparent_32%),linear-gradient(180deg,var(--paper),var(--paper-recessed))] px-5 py-10"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-paper-recessed" />
        <div className="mx-auto w-full max-w-4xl rounded-[36px] border border-rule bg-paper-raised/85 p-6 shadow-[var(--shadow-lg)] backdrop-blur-2xl md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brass)]/30 bg-[var(--brass)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brass-text)]">
            <Calendar className="h-3.5 w-3.5" />
            Trip Studio
          </div>
          <h1 className="mt-5 max-w-2xl font-serif text-4xl leading-[1] text-foreground md:text-6xl">
            Loading your itinerary.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/55 md:text-base">
            Gathering trip days, routed stops, and group planning tools into one clean workspace.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-rule bg-paper/18 p-5">
              <div className="mb-4 h-3 w-28 animate-pulse rounded-full bg-paper-recessed" />
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-14 animate-pulse rounded-2xl bg-paper-recessed" />
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-rule bg-paper/18 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="h-3 w-32 animate-pulse rounded-full bg-paper-recessed" />
                <div className="h-8 w-20 animate-pulse rounded-full bg-[var(--brass)]" />
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-2xl bg-paper-recessed" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError && !resolvedPayload) {
    return <TripStudioRecovery status={(error as TripLoadError | null)?.status} onRetry={() => refetch()} />
  }

  return (
    <div ref={studioRef} className="relative h-full min-h-full overflow-y-auto bg-paper text-foreground xl:overflow-hidden">
      <div className="paper-grain pointer-events-none absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-52 bg-[linear-gradient(180deg,var(--paper-raised),transparent)]" />

      <div className="relative z-10 flex min-h-full flex-col">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 border-b border-rule bg-paper-raised/86 px-4 py-3 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between lg:px-6"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground/42">
              <span>Trip Studio</span>
              <span className="h-1 w-1 rounded-full bg-foreground/24" />
              <span>{isBuildingInitialItinerary ? 'Creating your itinerary' : `${mappedDayCount}/${Math.max(days.length, 1)} mapped days`}</span>
            </div>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 max-w-full break-words font-serif text-2xl leading-tight text-foreground md:text-3xl">
                {trip?.title || 'Trip workspace'}
              </h1>
              <span className="rounded-full border border-rule bg-paper px-2.5 py-1 text-[11px] text-foreground/62">
                {canEditTrip ? 'Draft' : 'View only'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:justify-end">
            {canEditTrip ? (
              <>
                <button
                  onClick={() => setChatOpen(true)}
                  className="touch-target inline-flex items-center justify-center gap-1.5 rounded-full border border-rule bg-paper px-3 py-2 text-xs font-medium text-foreground/78 transition-colors hover:bg-paper-hover 2xl:hidden"
                >
                  <MessageSquareQuote className="h-4 w-4" />
                  Planner chat
                </button>
                <button
                  onClick={saveTrip}
                  disabled={isSavingTrip || !trip}
                  className={cn(
                    'touch-target inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50',
                    saveDone
                      ? 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                      : 'border-rule bg-paper text-foreground/82 hover:bg-paper-hover'
                  )}
                >
                  {saveDone ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4 text-[var(--brass)]" />}
                  {isSavingTrip ? 'Saving...' : saveDone ? 'Saved' : 'Save trip'}
                </button>
                <button
                  onClick={hydrateMaps}
                  disabled={isHydratingMaps}
                  className={cn(
                    'touch-target inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50',
                    buildMapsDone
                      ? 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                      : 'border-rule bg-paper text-foreground/82 hover:bg-paper-hover'
                  )}
                >
                  {buildMapsDone ? <Check className="h-4 w-4" /> : <Route className="h-4 w-4 text-[var(--dusty-aqua)]" />}
                  {isHydratingMaps ? 'Building maps...' : buildMapsDone ? 'Maps built' : 'Build maps'}
                </button>
                <button
                  onClick={shareWithFriends}
                  disabled={isSharingTrip || !trip}
                  className={cn(
                    'touch-target col-span-2 inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 sm:col-span-1',
                    shareDone
                      ? 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                      : 'border-[color:var(--brass)]/30 bg-[var(--brass)] text-[var(--brass-text)] hover:bg-[var(--brass-hover)]'
                  )}
                >
                  {shareDone ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {isSharingTrip ? 'Sharing...' : shareDone ? 'Link copied' : 'Share with friends'}
                </button>
              </>
            ) : trip?.is_public && trip.share_slug ? (
              <Link
                href={`/t/${trip.share_slug}`}
                className="touch-target col-span-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-[color:var(--brass)]/30 bg-[var(--brass)] px-4 py-2 text-xs font-semibold text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-hover)] sm:col-span-1"
              >
                <Send className="h-4 w-4" />
                View share
              </Link>
            ) : null}
          </div>
        </motion.header>

        {(actionError || actionNotice || !canEditTrip) && (
          <div className="border-b border-rule bg-paper px-4 py-2 lg:px-6">
            <p className={cn(
              'rounded-md border px-3 py-2 text-xs',
              actionError && 'border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] text-[var(--terracotta)]',
              actionNotice && !actionError && 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]',
              !actionError && !actionNotice && 'border-rule bg-paper-recessed text-foreground/62'
            )}>
              {actionError || actionNotice || 'Shared preview. Start your own trip to edit and save.'}
            </p>
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-4 p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:p-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:overflow-hidden 2xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <section ref={plannerChatPanelRef} className="hidden min-h-0 overflow-hidden rounded-[22px] border border-rule bg-paper-raised/92 shadow-[var(--panel-shadow)] 2xl:flex 2xl:flex-col">
            <div className="border-b border-rule px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-foreground/38">Planner chat</p>
              <p className="mt-1 text-sm font-medium text-foreground">Chat becomes itinerary edits</p>
            </div>
            <div className="border-b border-rule bg-paper px-4 py-4">
              <div className="rounded-md border border-[color:var(--brass)]/25 bg-[var(--brass-subtle)] px-3 py-3">
                <p className="text-xs font-semibold text-foreground">Plan with Globe</p>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground/58">
                  Ask for a change, then review the route, day list, and group feedback in the same workspace.
                </p>
              </div>
            </div>
            <ChatInterface
              messages={messages}
              isLoading={chatLoading}
              error={chatError}
              onSendMessage={sendMessage}
              onStop={stop}
              placeholder="Ask for an itinerary edit..."
              storageKey={tripId ? `globe-travel:chat-input:plan:${tripId}` : undefined}
              emptyState={plannerChatEmptyState}
              suggestions={[
                `Make Day ${ensureSelectedDayExists} more walkable`,
                `Add one standout dinner and one easy late-night stop`,
                `Swap a stop for something less crowded`,
              ]}
            />
          </section>

          <section className="min-h-0 space-y-4 xl:overflow-y-auto">
            <div className="overflow-hidden rounded-[22px] border border-rule bg-paper-raised shadow-[var(--panel-shadow)]">
              <div className="flex flex-col gap-3 border-b border-rule px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-full border',
                      mappingSummary.needsHydration
                        ? 'border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] text-[var(--brass)]'
                        : 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                    )}>
                      {mappingSummary.needsHydration ? <Navigation2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">Route quality: {routeQualityLabel}</p>
                      <p className="mt-0.5 truncate text-xs text-foreground/55">{selectedDaySubtitle}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOptimize()}
                    disabled={isOptimizing || !canEditTrip}
                    className="touch-target inline-flex items-center justify-center gap-1.5 rounded-full border border-rule bg-paper px-3 py-2 text-xs font-semibold text-foreground/82 transition-colors hover:bg-paper-hover disabled:opacity-50"
                  >
                    {optimizeDone ? <Check className="h-4 w-4 text-[var(--moss)]" /> : <ArrowLeftRight className={cn('h-4 w-4 text-[var(--brass)]', isOptimizing && 'animate-pulse')} />}
                    {isOptimizing ? 'Optimizing...' : optimizeDone ? 'Optimized' : 'Optimize day'}
                  </button>
                  <button
                    onClick={() => selectedStudioDay && handleRegenerateDay(selectedStudioDay.day.day_index)}
                    disabled={!selectedStudioDay || regeneratingDayIndex != null || isLoading || !canEditTrip}
                    className="touch-target inline-flex items-center justify-center rounded-full border border-rule bg-paper px-3 py-2 text-foreground/70 transition-colors hover:bg-paper-hover disabled:opacity-50"
                    aria-label="Rewrite selected day"
                  >
                    <Sparkles className="h-4 w-4 text-[var(--brass)]" />
                  </button>
                  <button className="touch-target inline-flex items-center justify-center rounded-full border border-rule bg-paper px-3 py-2 text-foreground/60 transition-colors hover:bg-paper-hover" aria-label="More map actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid min-h-[520px] lg:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)]">
                <div className="border-b border-rule bg-paper/70 lg:border-b-0 lg:border-r">
                  <div className="hide-scrollbar flex gap-2 overflow-x-auto border-b border-rule p-3 lg:block lg:space-y-2 lg:overflow-visible">
                    {studioDayMaps.map(({ day, mappedStops, routeSummary }) => (
                      <button
                        key={day.id}
                        onClick={() => setSelectedDayIndex(day.day_index)}
                        aria-pressed={day.day_index === ensureSelectedDayExists}
                        className={cn(
                          'touch-target min-w-[220px] rounded-md border px-3 py-3 text-left transition-colors lg:min-w-0 lg:w-full',
                          day.day_index === ensureSelectedDayExists
                            ? 'border-[color:var(--brass)]/40 bg-[var(--brass-subtle)] text-foreground'
                            : 'border-transparent bg-transparent text-foreground/72 hover:bg-paper-hover'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brass)] text-xs font-semibold text-[var(--brass-text)]">
                            {day.day_index}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{day.title || `Day ${day.day_index}`}</span>
                            <span className="mt-1 block truncate text-xs text-foreground/52">
                              {mappedStops.length} stops{routeSummary ? ` • ${routeSummary}` : ''}
                            </span>
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="hidden p-4 lg:block">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/38">Selected stops</p>
                    <div className="mt-3 space-y-2">
                      {(selectedStudioDay?.displayStops || []).slice(0, 5).map((stop, index) => (
                        <button
                          key={stop.id}
                          onClick={() => onSelectItem(stop.item)}
                          className="touch-target flex w-full items-start gap-2 rounded-md border border-rule bg-paper px-3 py-2 text-left transition-colors hover:bg-paper-hover"
                        >
                          <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--paper-recessed)] text-[10px] font-semibold text-[var(--brass)]">
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-medium text-foreground">{stop.title}</span>
                            <span className="mt-0.5 block truncate text-[11px] text-foreground/52">
                              {stop.timeLabel || 'Flexible'} {stop.mapped ? '• pinned' : '• needs map data'}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <TripDayMap
                  stops={selectedStudioDay?.mappedStops || tripStops}
                  routeGeojson={selectedStudioDay?.routeGeojson || null}
                  title={selectedStudioDay ? `Day ${selectedStudioDay.day.day_index}` : (tripDestination || 'Trip map')}
                  subtitle={selectedStudioDay?.day.title || 'Live route preview'}
                  routeSummary={selectedStudioDay?.routeSummary}
                  ariaLabel={`Trip Studio map for ${selectedStudioDay?.day.title || trip?.title || 'the selected trip'}`}
                  showDetails={false}
                  interactive={true}
                  mapHeightClassName="h-[88px] sm:h-[360px] lg:h-full"
                  className="min-w-0 rounded-none border-0"
                />
              </div>

              <div className="grid border-t border-rule bg-paper/80 md:grid-cols-5">
                {[
                  ['Overview', `${days.length} days · ${tripStops.length} stops`],
                  ['Highlights', tripDestination || 'Group trip'],
                  ['Pace', groupBrief?.vibe || 'Balanced'],
                  ['Budget', groupBrief?.budget || 'Flexible'],
                  ['Missing details', mappingSummary.needsHydration ? 'Map pass needed' : 'Looks ready'],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-rule px-4 py-3 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-foreground/38">{label}</p>
                    <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[22px] border border-rule bg-paper-raised shadow-[var(--panel-shadow)]">
              <ItineraryArtifact
                tripTitle={trip?.title || 'Trip'}
                days={days}
                selectedDayIndex={ensureSelectedDayExists}
                setSelectedDayIndex={setSelectedDayIndex}
                onSelectItem={onSelectItem}
                onBulkOps={onBulkOps}
                onRegenerateDay={handleRegenerateDay}
                regeneratingDayIndex={regeneratingDayIndex}
                regenerateDoneDayIndex={regenerateDoneDayIndex}
                regenerateNotice={regenerateNotice}
                onSwapItem={handleSwapItem}
                onApplySwapItem={handleApplySwapItem}
                onOptimize={handleOptimize}
                isLoading={isLoading || isBuildingInitialItinerary}
                loadingLabel={isBuildingInitialItinerary ? 'Building the first itinerary from your trip idea.' : undefined}
                readOnly={!canEditTrip}
                showMapPanel={false}
              />
            </div>
          </section>

          <aside className="min-h-0 space-y-4 xl:overflow-y-auto">
            <section className="rounded-[22px] border border-rule bg-paper-raised px-4 py-4 shadow-[var(--panel-shadow)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-foreground/38">Share with crew</p>
                  <p className="mt-1 text-sm font-medium text-foreground">Public review link</p>
                </div>
                <button
                  onClick={togglePublic}
                  disabled={!canEditTrip}
                  className={cn(
                    'touch-target rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                    trip?.is_public
                      ? 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                      : 'border-rule bg-paper-recessed text-foreground/72 hover:bg-paper-hover'
                  )}
                >
                  {trip?.is_public ? 'On' : 'Off'}
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="min-w-0 flex-1 rounded-md border border-rule bg-paper-recessed px-3 py-2 text-xs text-foreground/62 truncate">
                  {shareUrl || 'Enable public link to create one'}
                </div>
                <button
                  onClick={copyInviteLink}
                  disabled={!shareUrl}
                  className="touch-target rounded-md border border-rule bg-paper px-3 py-2 text-xs font-semibold text-foreground/78 transition-colors hover:bg-paper-hover disabled:opacity-45"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={shareInvite}
                disabled={!shareUrl}
                className="touch-target mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-[color:var(--brass)]/30 bg-[var(--brass)] px-4 py-3 text-sm font-semibold text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-hover)] disabled:opacity-45"
              >
                <Send className="h-4 w-4" />
                Share invite
              </button>
            </section>

            <section className="rounded-[22px] border border-rule bg-paper-raised px-4 py-4 shadow-[var(--panel-shadow)]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-foreground/38">Crew consensus</p>
              <div className="mt-4 space-y-3">
                {[
                  ['Budget fit', groupBrief?.budget ? 'Good' : 'Needs detail'],
                  ['Pace fit', groupBrief?.vibe || 'Balanced'],
                  ['Map fit', routeQualityLabel],
                  ['Readiness', `${readinessCount}/4`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-foreground/70">{label}</span>
                    <span className="inline-flex items-center gap-2 font-medium text-[var(--moss)]">
                      {value}
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--moss)]" />
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[22px] border border-rule bg-paper-raised px-4 py-4 shadow-[var(--panel-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-foreground/38">Friend feedback</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{feedback.length} {feedback.length === 1 ? 'review' : 'reviews'}</p>
                  <p className="mt-1 text-xs text-foreground/52">crew reacting to the plan</p>
                </div>
                <MessageSquareQuote className="h-5 w-5 text-foreground/25" />
              </div>
              <div className="mt-4 space-y-2">
                {feedback.length === 0 ? (
                  <p className="text-xs leading-relaxed text-foreground/58">Invite friends to flag what feels too busy, expensive, or worth keeping.</p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ['love_it', 'Love'],
                        ['curious', 'Curious'],
                        ['practical', 'Notes'],
                      ] as const).map(([key, label]) => (
                        <div key={key} className={cn('rounded-md border px-2 py-2 text-center', sentimentClasses[key])}>
                          <p className="text-sm font-semibold leading-none">{feedbackCounts[key]}</p>
                          <p className="mt-1 text-[10px]">{label}</p>
                        </div>
                      ))}
                    </div>
                    {visibleFeedback.map((entry) => (
                      <div key={entry.id} className="rounded-md border border-rule bg-paper-recessed p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-medium text-foreground">{entry.author_name}</p>
                          <span className={cn('shrink-0 rounded-full border px-2 py-1 text-[10px]', sentimentClasses[entry.sentiment])}>
                            {sentimentLabel[entry.sentiment]}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-foreground/66">{entry.comment}</p>
                      </div>
                    ))}
                    {hiddenFeedbackCount > 0 && (
                      <p className="rounded-md border border-dashed border-rule bg-paper-recessed px-3 py-2 text-xs leading-relaxed text-foreground/58">
                        Showing latest 4 of {feedback.length} reviews. {hiddenFeedbackCount} more {hiddenFeedbackCount === 1 ? 'reaction is' : 'reactions are'} saved for refresh.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            <section className="rounded-[22px] border border-rule bg-paper-raised px-4 py-4 shadow-[var(--panel-shadow)]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-foreground/38">Suggested next step</p>
              <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                {mappingSummary.needsHydration ? 'Rebuild map routes before sharing.' : `Ask Globe to tune Day ${ensureSelectedDayExists}.`}
              </p>
              {suggestedStepNotice && (
                <p className={cn(
                  'mt-3 rounded-md border px-3 py-2 text-xs leading-relaxed',
                  suggestedNoticeIsWarning
                    ? 'border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] text-[var(--terracotta)]'
                    : 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                )} aria-live="polite">
                  {suggestedStepNotice}
                </p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => selectedStudioDay && handleRegenerateDay(selectedStudioDay.day.day_index)}
                  disabled={!selectedStudioDay || regeneratingDayIndex != null}
                  className="touch-target inline-flex items-center justify-center gap-1.5 rounded-md border border-[color:var(--brass)]/30 bg-[var(--brass)] px-3 py-2 text-xs font-semibold text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-hover)] disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  {suggestedRewriteLabel}
                </button>
                <button
                  onClick={() => startWorkflow('feedback_refresh')}
                  disabled={Boolean(creatingWorkflow)}
                  className="touch-target inline-flex items-center justify-center gap-1.5 rounded-md border border-rule bg-paper px-3 py-2 text-xs font-semibold text-foreground/76 transition-colors hover:bg-paper-hover disabled:opacity-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  {suggestedRefreshLabel}
                </button>
              </div>
            </section>

            <section ref={workflowPanelRef} className="rounded-[22px] border border-rule bg-paper-raised px-4 py-4 shadow-[var(--panel-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-foreground/38">Planner workflows</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{latestWorkflowJob ? latestWorkflowJob.type.replace(/_/g, ' ') : 'Run async planning jobs'}</p>
                </div>
                <Wand2 className="h-5 w-5 text-foreground/25" />
              </div>
              <div className="mt-4 grid gap-2">
                <button onClick={() => startWorkflow('decision_memo')} disabled={Boolean(creatingWorkflow) || !canEditTrip} className="touch-target flex items-center justify-between rounded-md border border-rule bg-paper-recessed px-3 py-3 text-left text-xs text-foreground/78 transition-colors hover:bg-paper-hover disabled:opacity-50">
                  <span>{creatingWorkflow === 'decision_memo' ? 'Starting memo...' : 'Generate decision memo'}</span>
                  <Scale3d className="h-4 w-4 text-[var(--brass)]" />
                </button>
                <button onClick={() => startWorkflow('generate_variants')} disabled={Boolean(creatingWorkflow) || !canEditTrip} className="touch-target flex items-center justify-between rounded-md border border-rule bg-paper-recessed px-3 py-3 text-left text-xs text-foreground/78 transition-colors hover:bg-paper-hover disabled:opacity-50">
                  <span>{creatingWorkflow === 'generate_variants' ? 'Starting variants...' : 'Create budget variants'}</span>
                  <Wand2 className="h-4 w-4 text-[var(--dusty-aqua)]" />
                </button>
              </div>
              {workflowError && <p className="mt-3 rounded-md border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] px-3 py-2 text-[11px] text-[var(--terracotta)]">{workflowError}</p>}
              {latestWorkflowJob && (
                <div className="mt-3 rounded-md border border-rule bg-paper-recessed p-3">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-foreground/40">{latestWorkflowJob.status}</p>
                  {latestWorkflowJob.status === 'completed' && latestWorkflowJob.result && (
                    <pre className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/66">{JSON.stringify(latestWorkflowJob.result, null, 2)}</pre>
                  )}
                  {latestWorkflowJob.status === 'failed' && <p className="mt-2 text-[11px] text-[var(--terracotta)]">{latestWorkflowJob.error || 'Workflow failed'}</p>}
                  {(latestWorkflowJob.status === 'queued' || latestWorkflowJob.status === 'running') && <p className="mt-2 text-[11px] text-foreground/55">Working through the planner job...</p>}
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] top-24 z-50 flex flex-col overflow-hidden rounded-[22px] border border-rule bg-paper-raised shadow-[var(--shadow-lg)] xl:hidden"
          >
            <div className="flex items-center justify-between border-b border-rule px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-foreground/38">Planner chat</p>
                <p className="text-sm font-medium text-foreground">Guide the crew itinerary</p>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="touch-target flex h-9 w-9 items-center justify-center rounded-md border border-rule bg-paper text-foreground/60 transition-colors hover:bg-paper-hover"
                aria-label="Close planner chat"
              >
                ×
              </button>
            </div>
            <ChatInterface
              messages={messages}
              isLoading={chatLoading}
              error={chatError}
              onSendMessage={sendMessage}
              onStop={stop}
              placeholder="Ask for an itinerary edit..."
              storageKey={tripId ? `globe-travel:chat-input:plan:${tripId}` : undefined}
              emptyState={plannerChatEmptyState}
              suggestions={[
                `Make Day ${ensureSelectedDayExists} more walkable`,
                `Add one standout dinner and one easy late-night stop`,
                `Swap a stop for something less crowded`,
              ]}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TripStudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <TripStudioPageContent />
    </Suspense>
  )
}
