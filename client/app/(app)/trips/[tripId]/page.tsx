'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'motion/react'
import { Share2, ArrowLeftRight, Calendar, Send, MessageSquareQuote, Route, Check, Sparkles, Wand2, RefreshCcw, Scale3d, Save, AlertTriangle, MapPinned, Navigation2, MoreHorizontal, Plus, ExternalLink } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import ChatInterface from '@/components/chat/ChatInterface'
import ItineraryArtifact, { type SwapCandidate, type TripDay, type TripItem } from '@/components/trips/ItineraryArtifact'
import TripDayMap from '@/components/trips/TripDayMap'
import { buildDisplayStops, getRouteFallbackLabel, hasScheduleOrderConflict, hasTransitRouteCue, shouldUseSavedRoute, sortTripItemsForDisplay, sortTripItemsForVisibleItinerary } from '@/components/trips/derivedStops'
import { getItineraryItemImage } from '@/lib/itinerary-images'
import { formatTripTitleForDisplay } from '@/lib/trip-copy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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

function getStopMapsUrl({
  title,
  placeName,
  country,
  latitude,
  longitude,
}: {
  title: string
  placeName?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
}) {
  const label = placeName?.trim() || title.trim()
  const textQuery = [label, country?.trim()].filter(Boolean).join(', ')
  const coordinateQuery = latitude != null && longitude != null ? `${latitude},${longitude}` : ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(textQuery || coordinateQuery)}`
}

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

type TrackedMapStop = {
  id: string | null
  itemId?: string | null
  title: string
  index?: number | null
  dayIndex?: number | null
  latitude: number
  longitude: number
  zoom?: number
}

type PlannerQuickEdit = {
  key: string
  label: string
  detail: string
  prompt: string
  directItem?: {
    type: TripItem['type']
    title: string
    place_query?: string
    start_time?: string
    duration_minutes?: number
    notes?: string
  }
}

const sentimentLabel: Record<TripFeedback['sentiment'], string> = {
  love_it: 'Love it',
  curious: 'Curious',
  practical: 'Practical note',
}

const sentimentClasses: Record<TripFeedback['sentiment'], string> = {
  love_it: 'border-success/30 bg-success/10 text-success',
  curious: 'border-info/30 bg-info/10 text-chart-2',
  practical: 'border-primary/30 bg-primary/10 text-foreground',
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
      className="relative flex min-h-dvh w-full items-center overflow-hidden bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklch,var(--primary),transparent_82%),transparent_32%),linear-gradient(180deg,var(--background),var(--muted))] px-5 py-10"
    >
      <div className="hidden pointer-events-none absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-px bg-muted" />
      <section className="relative mx-auto w-full max-w-4xl rounded-2xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur-2xl md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" />
          Trip unavailable
        </div>
        <h1 id="trip-studio-recovery-title" className="mt-5 max-w-2xl text-4xl leading-[1] text-foreground md:text-6xl">
          We could not open this trip.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
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
              className="touch-target group rounded-xl border border-[color:var(--success)]/25 bg-success/10 p-4 text-left text-success transition-colors hover:bg-[color:var(--success)] hover:text-white sm:col-span-2"
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
            className="touch-target group rounded-xl border border-primary/30 bg-primary p-4 text-primary-foreground shadow-[0_16px_42px_rgba(245,158,11,0.18)] transition-colors hover:bg-primary/90"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <MapPinned className="h-4 w-4" />
              Go to saved trips
            </span>
            <span className="mt-2 block text-xs leading-relaxed text-primary-foreground/78">
              Reopen an itinerary you still own or review trips saved to this session.
            </span>
          </Link>
          <Link
            href="/chat"
            className="touch-target rounded-xl border border-border bg-muted p-4 text-foreground transition-colors hover:bg-background"
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              <MessageSquareQuote className="h-4 w-4 text-primary" />
              Plan a new trip
            </span>
            <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
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
  const [copyDone, setCopyDone] = useState(false)
  const [optimizeDone, setOptimizeDone] = useState(false)
  const [regeneratingDayIndex, setRegeneratingDayIndex] = useState<number | null>(null)
  const [regenerateDoneDayIndex, setRegenerateDoneDayIndex] = useState<number | null>(null)
  const [suggestedRewriteHandoffDayIndex, setSuggestedRewriteHandoffDayIndex] = useState<number | null>(null)
  const [regenerateNotice, setRegenerateNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const [pageOrigin, setPageOrigin] = useState('')
  const [groupBrief, setGroupBrief] = useState<GroupBrief | null>(null)
  const [creatingWorkflow, setCreatingWorkflow] = useState<string | null>(null)
  const [workflowError, setWorkflowError] = useState<string | null>(null)
  const [suggestedStepNotice, setSuggestedStepNotice] = useState<string | null>(null)
  const [mapPassNeedsPlanEdits, setMapPassNeedsPlanEdits] = useState(false)
  const [trackedMapStop, setTrackedMapStop] = useState<TrackedMapStop | null>(null)
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

  const copyTextToClipboard = useCallback(async (text: string) => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        return
      } catch {
        // Fall back below for browsers that block async clipboard writes.
      }
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '-1000px'
    textarea.style.left = '-1000px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (!copied) {
      throw new Error('Clipboard write failed')
    }
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

  const selectDay = useCallback((dayIndex: number) => {
    setSelectedDayIndex(dayIndex)
    setTrackedMapStop(null)
  }, [])

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

  const tripDisplayTitle = useMemo(
    () => formatTripTitleForDisplay(trip?.title || 'Trip workspace'),
    [trip?.title]
  )
  const tripDestination = useMemo(() => extractDestinationLabel(tripDisplayTitle), [tripDisplayTitle])

  const mappingSummary = useMemo(() => {
    const itemCount = days.reduce((sum, day) => sum + (day.items?.length || 0), 0)
    let mappedItemCount = 0
    let routeDayCount = 0
    let routeEligibleDayCount = 0
    let scheduleOrderConflictDayCount = 0

    for (const day of days) {
      const dayItems = (day.items || []) as any
      const displayStops = buildDisplayStops(dayItems)
      const mappedStops = displayStops.filter((stop) => stop.mapped)
      const usesDerivedStops = displayStops.some((stop) => stop.id.includes(':'))
      const savedRoute = day.routes?.find((entry) => entry.mode === 'walk') || day.routes?.[0]

      mappedItemCount += mappedStops.length

      if (mappedStops.length >= 2 && !usesDerivedStops && !hasTransitRouteCue(dayItems)) {
        routeEligibleDayCount += 1
        if (hasScheduleOrderConflict(dayItems)) {
          scheduleOrderConflictDayCount += 1
          continue
        }
        if (shouldUseSavedRoute(dayItems, savedRoute, usesDerivedStops)) {
          routeDayCount += 1
        }
      }
    }

    const routeBuildNeededCount = Math.max(0, routeEligibleDayCount - scheduleOrderConflictDayCount - routeDayCount)

    return {
      itemCount,
      mappedItemCount,
      routeDayCount,
      routeEligibleDayCount,
      scheduleOrderConflictDayCount,
      needsHydration: itemCount > 0 && (mappedItemCount < itemCount || routeBuildNeededCount > 0),
      needsStopOrderReview: scheduleOrderConflictDayCount > 0,
    }
  }, [days])

  const onBulkOps = useCallback(async (ops: any[]) => {
    const response = await fetch(`/api/trips/${tripId}/items/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ops }),
    })
    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(typeof payload?.error === 'string' ? payload.error : 'Bulk itinerary update failed')
    }
    await refetch()
  }, [tripId, refetch])

  const onSelectItem = useCallback((item: TripItem) => {
    const itemDay = days.find((day) => (day.items || []).some((candidate) => candidate.id === item.id)) || null
    const displayStops = itemDay
      ? buildDisplayStops(sortTripItemsForVisibleItinerary((itemDay.items || []) as TripItem[]), { preserveOrder: true })
      : []
    const mappedStop = displayStops.find((stop) => stop.item.id === item.id && stop.mapped) || null
    const latitude = coerceCoordinate(mappedStop?.latitude ?? item.place?.latitude)
    const longitude = coerceCoordinate(mappedStop?.longitude ?? item.place?.longitude)

    if (itemDay) {
      setSelectedDayIndex(itemDay.day_index)
    }

    if (latitude != null && longitude != null) {
      setTrackedMapStop({
        id: mappedStop?.id || item.id,
        itemId: item.id,
        title: mappedStop?.title || item.title,
        index: mappedStop?.index ?? null,
        dayIndex: itemDay?.day_index ?? null,
        latitude,
        longitude,
        zoom: item.type === 'lodging' ? 15.5 : 15,
      })
    }
  }, [days])

  const { messages, isReady: chatReady, isLoading: chatLoading, error: chatError, sendMessage, stop } = useChat({
    type: 'plan',
    tripId,
    onTripPatch: () => {
      void refetch()
    },
    onNavigate: (nav) => {
      const latitude = coerceCoordinate(nav.latitude)
      const longitude = coerceCoordinate(nav.longitude)
      if (latitude != null && longitude != null) {
        setTrackedMapStop({
          id: null,
          title: [nav.name, nav.country].filter(Boolean).join(', ') || 'Planner map focus',
          dayIndex: ensureSelectedDayExists,
          latitude,
          longitude,
          zoom: 14.5,
        })
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
      const message = 'Planner chat is open. Use Rewrite day again once Globe is ready.'
      setActionError(message)
      setSuggestedStepNotice(message)
      setChatOpen(true)
      window.setTimeout(() => {
        plannerChatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
      return
    }

    const pendingNotice = `Rewrite request for Day ${dayIndex} is opening in Planner chat.`
    const notice = `Day ${dayIndex} rewrite completed. Review the updated itinerary below; Planner chat kept the request history.`

    setActionError(null)
    setRegenerateNotice(pendingNotice)
    setSuggestedStepNotice(pendingNotice)
    setRegenerateDoneDayIndex(null)
    setSuggestedRewriteHandoffDayIndex(dayIndex)
    setRegeneratingDayIndex(dayIndex)
    setChatOpen(true)
    window.setTimeout(() => {
      plannerChatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)

    try {
      await sendMessage(`Rewrite Day ${dayIndex} using the replaceTripDayPlan tool. Replace only Day ${dayIndex}, keep the rest of the trip unchanged, and make the day realistic with clear timing, named places, and a better neighborhood flow. Every meal must be an exact named restaurant, cafe, bar, bakery, or market hall in the item title and place_query; every lodging or hotel item must be an exact named hotel property in the item title and place_query. Do not use generic meal or hotel labels.`)
      setMapPassNeedsPlanEdits(false)
      setRegenerateDoneDayIndex(dayIndex)
      setRegenerateNotice(notice)
      setSuggestedStepNotice(notice)
      setTimeout(() => {
        setRegenerateDoneDayIndex((current) => (current === dayIndex ? null : current))
        setSuggestedRewriteHandoffDayIndex((current) => (current === dayIndex ? null : current))
        setRegenerateNotice((current) => (current === notice ? null : current))
      }, 4500)
    } catch {
      setSuggestedRewriteHandoffDayIndex((current) => (current === dayIndex ? null : current))
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

  const hydrateMaps = useCallback(async (options?: { suggestedStep?: boolean }) => {
    if (isHydratingMaps || !canEditTrip) return
    setActionError(null)
    if (options?.suggestedStep) {
      setSuggestedStepNotice('Building map routes for this itinerary. Keep the Trip Map open while Globe refreshes the pins and walking lines.')
    }
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
      const payload = await response.json().catch(() => null)
      await refetch()
      setBuildMapsDone(true)
      const geocodedItems = typeof payload?.geocodedItems === 'number' ? payload.geocodedItems : 0
      const routeDays = typeof payload?.routeDays === 'number' ? payload.routeDays : 0
      const stillNeedsPlaceData = mappingSummary.mappedItemCount < mappingSummary.itemCount
      const needsPlanEdits = stillNeedsPlaceData || (geocodedItems === 0 && routeDays === 0)
      setMapPassNeedsPlanEdits(needsPlanEdits)
      if (options?.suggestedStep) {
        setSuggestedStepNotice(
          needsPlanEdits
            ? 'Map pass ran, but some stops still need place data. Rewrite the day or edit unmapped stops before sharing.'
            : 'Map routes rebuilt. Review the Trip Map, then share the link or tune the selected day.'
        )
      }
      setTimeout(() => setBuildMapsDone(false), 2500)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const nextMessage =
        message === 'Mapbox token not configured'
          ? 'Map tools are temporarily unavailable. The itinerary is still saved; try rebuilding maps after the map service is configured.'
          : 'Could not rebuild the maps. Try again, or refresh the page if the trip changed.'
      setActionError(nextMessage)
      setMapPassNeedsPlanEdits(false)
      if (options?.suggestedStep) {
        setSuggestedStepNotice(nextMessage)
      }
    } finally {
      setIsHydratingMaps(false)
    }
  }, [tripId, refetch, isHydratingMaps, canEditTrip, qaForceBuildMapsFailure, mappingSummary])

  useEffect(() => {
    hydrationAttemptedRef.current = null
    setMapPassNeedsPlanEdits(false)
    setSuggestedRewriteHandoffDayIndex(null)
  }, [tripId])

  useEffect(() => {
    if (!mappingSummary.needsHydration) {
      setMapPassNeedsPlanEdits(false)
    }
  }, [mappingSummary.needsHydration])

  useEffect(() => {
    if (isLoading || isHydratingMaps || !mappingSummary.needsHydration || mapPassNeedsPlanEdits) return

    const hydrationKey = `${tripId}:${mappingSummary.itemCount}:${mappingSummary.mappedItemCount}:${mappingSummary.routeDayCount}`
    if (hydrationAttemptedRef.current === hydrationKey) return

    hydrationAttemptedRef.current = hydrationKey
    void hydrateMaps()
  }, [tripId, isLoading, isHydratingMaps, mappingSummary, hydrateMaps, mapPassNeedsPlanEdits])

  const shareUrl = trip?.share_slug && pageOrigin ? `${pageOrigin}/t/${trip.share_slug}` : null
  const inviteMessage = shareUrl
    ? `Review my trip ideas for ${tripDisplayTitle || 'this trip'} and tell me what you think: ${shareUrl}`
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
      await copyTextToClipboard(shareUrl)
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2600)
      showActionNotice('Public invite link copied. Send it to your group for feedback.')
    } catch {
      setActionError('Could not copy the invite link automatically. Select the link and copy it manually.')
    }
  }, [shareUrl, copyTextToClipboard, showActionNotice])

  const shareInvite = useCallback(async () => {
    if (!shareUrl) return
    setActionError(null)
    try {
      if (navigator.share) {
        await navigator.share({
          title: tripDisplayTitle || 'Trip ideas',
          text: inviteMessage,
          url: shareUrl,
        })
        showActionNotice('Share sheet opened with the public invite link.')
        return
      }
      await copyTextToClipboard(inviteMessage || shareUrl)
      showActionNotice('Invite message copied. Paste it anywhere your group is planning.')
    } catch {
      setActionError('Could not open sharing automatically. The public link is still available above.')
    }
  }, [shareUrl, inviteMessage, tripDisplayTitle, copyTextToClipboard, showActionNotice])

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
          title: tripDisplayTitle || 'Trip ideas',
          text: inviteMessage || `Review my trip ideas: ${shareUrl}`,
          url: shareUrl,
        })
        showActionNotice('Share sheet opened with the public review link.')
      } else {
        await copyTextToClipboard(inviteMessage || shareUrl)
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
  }, [trip, isSharingTrip, tripId, refetch, shareUrl, inviteMessage, tripDisplayTitle, canEditTrip, qaForceShareFailure, copyTextToClipboard, showActionNotice])

  const latestWorkflowJob = workflowJobs[0]
  const studioDayMaps = useMemo(() => {
    return days.map((day) => {
      const sortedItems = sortTripItemsForDisplay((day.items || []) as TripItem[])
      const visibleItems = sortTripItemsForVisibleItinerary((day.items || []) as TripItem[])
      const displayStops = buildDisplayStops(visibleItems, { preserveOrder: true })
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
  const handleMapStopClick = useCallback((stop: { id: string; title: string; latitude: number; longitude: number; index: number }) => {
    const displayStop = selectedStudioDay?.displayStops.find((candidate) => candidate.id === stop.id) || null

    setTrackedMapStop({
      id: stop.id,
      itemId: displayStop?.item.id ?? null,
      title: stop.title,
      index: stop.index,
      dayIndex: selectedStudioDay?.day.day_index ?? ensureSelectedDayExists,
      latitude: stop.latitude,
      longitude: stop.longitude,
      zoom: 15,
    })
  }, [ensureSelectedDayExists, selectedStudioDay])
  const mappedDayCount = useMemo(
    () => studioDayMaps.filter(({ mappedStops }) => mappedStops.length > 0).length,
    [studioDayMaps]
  )
  const routeQualityLabel = mappingSummary.needsHydration
    ? 'Needs map pass'
    : mappingSummary.needsStopOrderReview
      ? 'Review stop order'
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
  const selectedMapSubtitle = trackedMapStop
    ? `Following ${trackedMapStop.index ? `stop ${trackedMapStop.index}: ` : ''}${trackedMapStop.title}`
    : selectedDaySubtitle

  useEffect(() => {
    if (!trackedMapStop?.itemId && !trackedMapStop?.id) return

    const trackedStillExists = studioDayMaps.some(({ displayStops }) =>
      displayStops.some((stop) =>
        (trackedMapStop.id && stop.id === trackedMapStop.id) ||
        (trackedMapStop.itemId && stop.item.id === trackedMapStop.itemId)
      )
    )

    if (!trackedStillExists) setTrackedMapStop(null)
  }, [studioDayMaps, trackedMapStop?.id, trackedMapStop?.itemId])
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
  const plannerQuickEdits = useMemo<PlannerQuickEdit[]>(() => {
    const selectedDayTitle = selectedStudioDay?.day.title?.trim()
    const selectedDaySearchText = [
      selectedDayTitle,
      ...(selectedStudioDay?.sortedItems || []).flatMap((item) => [
        item.title,
        item.place?.name,
        item.place?.country,
      ]),
    ].filter(Boolean).join(' ')
    const isAeginaDay = /\baegina\b/i.test(selectedDaySearchText)
    const destination = isAeginaDay ? 'Aegina, Greece' : tripDestination || 'this destination'
    const isAthens = /\bathens\b/i.test(destination)
    const dayContext = `Day ${ensureSelectedDayExists}${selectedDayTitle ? ` (${selectedDayTitle})` : ''}`

    return [
      {
        key: 'hotel',
        label: 'Add hotel',
        detail: `Stay for Day ${ensureSelectedDayExists}`,
        prompt: `Add one exact named hotel in ${destination} as the lodging item for ${dayContext} of this live itinerary. Keep every existing stop unchanged. Use addTripItem, classify it as lodging, and include the real hotel name in both the item title and place_query so it appears in the Stay section.`,
        directItem: isAeginaDay
          ? {
              type: 'lodging',
              title: 'Aeginitikon Archontikon Hotel',
              place_query: 'Aeginitikon Archontikon Hotel, Aegina, Greece',
              start_time: '15:00',
              notes: 'Added from Planner as selected-day lodging for the Aegina overnight.',
            }
          : isAthens
          ? {
              type: 'lodging',
              title: 'Ergon House Athens',
              place_query: 'Ergon House Athens, Athens, Greece',
              start_time: '15:00',
              notes: 'Added from Planner as selected-day lodging without replacing existing stops.',
            }
          : undefined,
      },
      {
        key: 'dinner',
        label: 'Add dinner',
        detail: `Restaurant for Day ${ensureSelectedDayExists}`,
        prompt: `Add one exact named dinner restaurant in ${destination} to ${dayContext} of this live itinerary. Keep the existing day structure intact, place it at a realistic evening time, use addTripItem, and include the real restaurant name in both the item title and place_query.`,
        directItem: isAthens
          ? {
              type: 'meal',
              title: 'Karamanlidika',
              place_query: 'Karamanlidika, Athens, Greece',
              start_time: '20:00',
              duration_minutes: 90,
              notes: 'Added from Planner as a named dinner stop for the selected day.',
            }
          : undefined,
      },
      {
        key: 'walkable',
        label: 'Make walkable',
        detail: `Tighten Day ${ensureSelectedDayExists}`,
        prompt: `Edit ${dayContext} of this live itinerary to reduce backtracking and make the route more walkable. Keep the strongest stops, preserve exact named places, and explain the itinerary changes after applying them.`,
      },
      {
        key: 'local',
        label: 'Add local stop',
        detail: `One useful addition`,
        prompt: `Add one useful, exact named local stop in ${destination} to ${dayContext} of this live itinerary. Choose something that improves the day without making it too busy, use addTripItem, and include the exact place name in both the item title and place_query.`,
        directItem: isAthens
          ? {
              type: 'activity',
              title: 'National Garden',
              place_query: 'National Garden, Athens, Greece',
              start_time: '16:30',
              duration_minutes: 60,
              notes: 'Added from Planner as a low-friction local stop for the selected day.',
            }
          : undefined,
      },
    ]
  }, [ensureSelectedDayExists, selectedStudioDay, tripDestination])
  const selectedSuggestedDayIndex = selectedStudioDay?.day.day_index
  const suggestedRewriteInProgress = Boolean(selectedSuggestedDayIndex && regeneratingDayIndex === selectedSuggestedDayIndex)
  const suggestedRewriteHandoffActive = Boolean(
    selectedSuggestedDayIndex &&
    suggestedRewriteHandoffDayIndex === selectedSuggestedDayIndex
  )
  const suggestedRewriteLabel = suggestedRewriteInProgress
    ? 'Requesting rewrite...'
    : selectedSuggestedDayIndex && regenerateDoneDayIndex === selectedSuggestedDayIndex
      ? 'Rewrite sent'
      : suggestedRewriteHandoffActive
        ? 'Requesting rewrite...'
      : 'Rewrite day'
  const suggestedRefreshLabel = creatingWorkflow === 'feedback_refresh'
    ? 'Starting refresh...'
    : 'Refresh plan from feedback'
  const suggestedRewriteKeepsPrimary = suggestedRewriteInProgress || suggestedRewriteHandoffActive
  const suggestedPrimaryIsMapPass = mappingSummary.needsHydration && !mapPassNeedsPlanEdits && !suggestedRewriteKeepsPrimary
  const suggestedPlannerUnavailable = !chatReady || qaForceRewriteUnavailable
  const suggestedStepText = suggestedRewriteKeepsPrimary
    ? `Rewrite request for Day ${selectedSuggestedDayIndex} is running in Planner chat.`
    : mappingSummary.needsHydration
    ? mapPassNeedsPlanEdits
      ? `Rewrite Day ${ensureSelectedDayExists} with exact places before sharing.`
      : 'Rebuild map routes before sharing.'
    : suggestedPlannerUnavailable
      ? chatOpen
        ? `Planner chat is open. Finish the Day ${ensureSelectedDayExists} request there, then review the itinerary.`
        : 'Planner chat is connecting. Open it now, then rewrite once Globe is ready.'
      : mappingSummary.needsStopOrderReview
        ? `Tune Day ${ensureSelectedDayExists} timing before sharing.`
        : `Ask Globe to tune Day ${ensureSelectedDayExists}.`
  const suggestedPrimaryAction = suggestedRewriteKeepsPrimary
    ? 'rewrite-day'
    : suggestedPrimaryIsMapPass
    ? 'build-maps'
    : suggestedPlannerUnavailable
      ? 'open-planner-chat'
      : 'rewrite-day'
  const suggestedPrimaryTestId = suggestedPrimaryAction === 'build-maps'
    ? 'trip-suggested-build-maps'
    : suggestedPrimaryAction === 'open-planner-chat'
      ? 'trip-suggested-open-planner'
      : 'trip-suggested-rewrite-day'
  const suggestedPrimaryLabel = suggestedPrimaryIsMapPass
    ? isHydratingMaps
      ? 'Building maps...'
      : buildMapsDone
        ? 'Maps built'
        : 'Build maps'
    : suggestedPlannerUnavailable
      ? chatOpen
        ? 'Planner open'
        : 'Open planner'
    : suggestedRewriteLabel
  const suggestedPrimaryDisabled = suggestedRewriteKeepsPrimary
    ? true
    : suggestedPrimaryIsMapPass
    ? isHydratingMaps || !canEditTrip
    : suggestedPlannerUnavailable
      ? false
    : !selectedStudioDay || regeneratingDayIndex != null
  const suggestedNoticeIsWarning = Boolean(suggestedStepNotice && (
    suggestedStepNotice.toLowerCase().includes('could not') ||
    suggestedStepNotice.toLowerCase().includes('did not') ||
    suggestedStepNotice.toLowerCase().includes('still connecting') ||
    suggestedStepNotice.toLowerCase().includes('still need place data') ||
    suggestedStepNotice.toLowerCase().includes('temporarily unavailable') ||
    suggestedStepNotice.toLowerCase().includes('shared trip preview')
  ))

  const handleSuggestedPrimaryStep = useCallback(() => {
    if (suggestedPrimaryIsMapPass) {
      void hydrateMaps({ suggestedStep: true })
      return
    }

    if (suggestedPlannerUnavailable) {
      const message = 'Planner chat is open. Keep this panel open, then use Rewrite day once Globe is ready.'
      setActionError(null)
      setSuggestedStepNotice(message)
      setChatOpen(true)
      window.setTimeout(() => {
        plannerChatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
      return
    }

    if (selectedStudioDay) {
      void handleRegenerateDay(selectedStudioDay.day.day_index)
      return
    }

    setSuggestedStepNotice('Choose a day first, then use Suggested next step to rewrite it.')
  }, [handleRegenerateDay, hydrateMaps, selectedStudioDay, suggestedPlannerUnavailable, suggestedPrimaryIsMapPass])

  const handlePlannerQuickEdit = useCallback(async (edit: PlannerQuickEdit) => {
    if (!canEditTrip) {
      const message = 'This is a shared trip preview. Start your own trip to edit the itinerary.'
      setActionError(message)
      setSuggestedStepNotice(message)
      return
    }

    setChatOpen(true)
    setActionError(null)
    window.setTimeout(() => {
      plannerChatPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)

    if (!chatReady || qaForceRewriteUnavailable) {
      const message = 'Planner chat is still connecting. Keep it open, then try this edit again.'
      setActionError(message)
      setSuggestedStepNotice(message)
      return
    }

    if (edit.directItem) {
      const selectedItems = selectedStudioDay?.sortedItems || []
      const hotelPlaceholder = edit.directItem.type === 'lodging'
        ? selectedItems.find((item) =>
            item.type !== 'lodging' &&
            /\b(?:hotel|lodging|stay)\s+(?:needed|tbd|to be added)|\bhotel needed\b/i.test(item.title)
          )
        : null

      if (edit.directItem.type === 'lodging' && selectedItems.some((item) => item.type === 'lodging')) {
        const message = `Day ${ensureSelectedDayExists} already has a hotel. Use Planner chat to swap or replace it.`
        setActionError(message)
        setSuggestedStepNotice(message)
        return
      }

      const duplicate = selectedItems.some(
        (item) => item.title.trim().toLowerCase() === edit.directItem?.title.trim().toLowerCase()
      )
      if (duplicate) {
        const message = `${edit.directItem.title} is already in Day ${ensureSelectedDayExists}.`
        setActionError(message)
        setSuggestedStepNotice(message)
        return
      }

      if (hotelPlaceholder) {
        const pendingNotice = `${edit.label} is replacing the Day ${ensureSelectedDayExists} hotel placeholder.`
        showActionNotice(pendingNotice)
        setSuggestedStepNotice(pendingNotice)

        try {
          await onBulkOps([
            {
              op: 'update',
              item_id: hotelPlaceholder.id,
              place_query: edit.directItem.place_query,
              fields: {
                type: edit.directItem.type,
                title: edit.directItem.title,
                start_time: edit.directItem.start_time ?? null,
                duration_minutes: edit.directItem.duration_minutes ?? null,
                notes: edit.directItem.notes ?? null,
              },
            },
          ])
          const completeNotice = `${edit.directItem.title} replaced the Day ${ensureSelectedDayExists} hotel placeholder.`
          showActionNotice(completeNotice)
          setSuggestedStepNotice(completeNotice)
        } catch {
          const message = 'Could not save that hotel edit. Try typing the request in Planner chat.'
          setActionError(message)
          setSuggestedStepNotice(message)
        }
        return
      }

      const pendingNotice = `${edit.label} is being added to Day ${ensureSelectedDayExists}.`
      showActionNotice(pendingNotice)
      setSuggestedStepNotice(pendingNotice)

      try {
        await onBulkOps([
          {
            op: 'add',
            day_index: ensureSelectedDayExists,
            ...edit.directItem,
          },
        ])
        const completeNotice = `${edit.directItem.title} was added to Day ${ensureSelectedDayExists}.`
        showActionNotice(completeNotice)
        setSuggestedStepNotice(completeNotice)
      } catch {
        const message = 'Could not save that itinerary edit. Try typing the request in Planner chat.'
        setActionError(message)
        setSuggestedStepNotice(message)
      }
      return
    }

    const pendingNotice = `${edit.label} request sent to Planner for Day ${ensureSelectedDayExists}.`
    showActionNotice(pendingNotice)
    setSuggestedStepNotice(pendingNotice)

    try {
      await sendMessage(edit.prompt)
      const sentNotice = `${edit.label} request is in Planner chat. Review the itinerary after Globe applies it.`
      showActionNotice(sentNotice)
      setSuggestedStepNotice(sentNotice)
    } catch {
      const message = 'Could not send that Planner edit. Try typing the request in Planner chat.'
      setActionError(message)
      setSuggestedStepNotice(message)
    }
  }, [canEditTrip, chatReady, ensureSelectedDayExists, onBulkOps, qaForceRewriteUnavailable, selectedStudioDay?.sortedItems, sendMessage, showActionNotice])

  const renderPlannerEditShortcuts = useCallback((surface: 'panel' | 'drawer') => (
    <div className="border-b border-border bg-background px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">Edit selected day</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Send a precise Planner edit to Day {ensureSelectedDayExists}. The itinerary refreshes when Globe applies it.
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          Day {ensureSelectedDayExists}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {plannerQuickEdits.map((edit) => (
          <button
            key={`${surface}-${edit.key}`}
            type="button"
            data-testid={`planner-quick-edit-${edit.key}-${surface}`}
            onClick={() => void handlePlannerQuickEdit(edit)}
            disabled={chatLoading || !canEditTrip}
            className="min-h-[58px] rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/35 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span className="block truncate text-xs font-semibold text-foreground">{edit.label}</span>
            <span className="mt-1 block text-xs leading-snug text-muted-foreground">{edit.detail}</span>
          </button>
        ))}
      </div>
    </div>
  ), [canEditTrip, chatLoading, ensureSelectedDayExists, handlePlannerQuickEdit, plannerQuickEdits])

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
        className="relative flex min-h-dvh w-full items-center overflow-hidden bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklch,var(--primary),transparent_82%),transparent_32%),linear-gradient(180deg,var(--background),var(--muted))] px-5 py-10"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-muted" />
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-border bg-card/85 p-6 shadow-lg backdrop-blur-2xl md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Trip Studio
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl leading-[1] text-foreground md:text-6xl">
            Loading your itinerary.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Gathering trip days, routed stops, and group planning tools into one clean workspace.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-border bg-background p-5">
              <div className="mb-4 h-3 w-28 animate-pulse rounded-full bg-muted" />
              <div className="space-y-3">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="h-14 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="h-3 w-32 animate-pulse rounded-full bg-muted" />
                <div className="h-8 w-20 animate-pulse rounded-full bg-primary" />
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-16 animate-pulse rounded-2xl bg-muted" />
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
    <div ref={studioRef} className="relative h-full min-h-full overflow-y-auto bg-background text-foreground xl:overflow-hidden">
      <div className="hidden pointer-events-none absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-52 bg-[linear-gradient(180deg,var(--card),transparent)]" />

      <div className="relative z-10 flex min-h-full flex-col">
        <header className="flex flex-col gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {isBuildingInitialItinerary ? 'Creating your itinerary…' : `Trip Studio · ${mappedDayCount}/${Math.max(days.length, 1)} mapped days`}
            </p>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 max-w-full break-words text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
                {tripDisplayTitle || 'Trip workspace'}
              </h1>
              <Badge variant={canEditTrip ? 'secondary' : 'outline'}>
                {canEditTrip ? 'Draft' : 'View only'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {canEditTrip ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChatOpen(true)}
                  className="rounded-full 2xl:hidden"
                >
                  <MessageSquareQuote />
                  Planner chat
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon-sm" aria-label="More trip actions" className="rounded-full">
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => void saveTrip()} disabled={isSavingTrip || !trip}>
                      {saveDone ? <Check /> : <Save />}
                      {isSavingTrip ? 'Saving...' : saveDone ? 'Saved' : 'Save trip'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void hydrateMaps()} disabled={isHydratingMaps}>
                      {buildMapsDone ? <Check /> : <Route />}
                      {isHydratingMaps ? 'Building maps...' : buildMapsDone ? 'Maps built' : 'Build maps'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={shareWithFriends}
                  disabled={isSharingTrip || !trip}
                  className="rounded-full"
                  variant={shareDone ? 'secondary' : 'default'}
                >
                  {shareDone ? <Check /> : <Share2 />}
                  {isSharingTrip ? 'Sharing...' : shareDone ? 'Link copied' : 'Share with friends'}
                </Button>
              </>
            ) : trip?.is_public && trip.share_slug ? (
              <Button asChild className="rounded-full">
                <Link href={`/t/${trip.share_slug}`}>
                  <Send />
                  View share
                </Link>
              </Button>
            ) : null}
          </div>
        </header>

        {(actionError || actionNotice || !canEditTrip) && (
          <div className="border-b border-border bg-background px-4 py-2 lg:px-6">
            <p className={cn(
              'rounded-md border px-3 py-2 text-xs',
              actionError && 'border-destructive/30 bg-destructive/10 text-destructive',
              actionNotice && !actionError && 'border-success/30 bg-success/10 text-success',
              !actionError && !actionNotice && 'border-border bg-muted text-muted-foreground'
            )}>
              {actionError || actionNotice || 'Shared preview. Start your own trip to edit and save.'}
            </p>
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-4 p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:p-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:overflow-hidden 2xl:grid-cols-[300px_minmax(0,1fr)_320px]">
          <section ref={plannerChatPanelRef} className="hidden min-h-0 overflow-hidden rounded-xl border border-border bg-card/92 shadow-xs 2xl:flex 2xl:flex-col">
            <div className="border-b border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">Planner chat</p>
              <p className="mt-1 text-sm font-medium text-foreground">Chat becomes itinerary edits</p>
            </div>
            {renderPlannerEditShortcuts('panel')}
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
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'inline-flex h-7 w-7 items-center justify-center rounded-full border',
                      mappingSummary.needsHydration
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : 'border-success/30 bg-success/10 text-success'
                    )}>
                      {mappingSummary.needsHydration ? <Navigation2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">Route quality: {routeQualityLabel}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{selectedMapSubtitle}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOptimize()}
                    disabled={isOptimizing || !canEditTrip}
                    className="rounded-full"
                  >
                    {optimizeDone ? <Check className="text-success" /> : <ArrowLeftRight className={cn('text-primary', isOptimizing && 'animate-pulse')} />}
                    {isOptimizing ? 'Optimizing...' : optimizeDone ? 'Optimized' : 'Optimize day'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedStudioDay && handleRegenerateDay(selectedStudioDay.day.day_index)}
                    disabled={!selectedStudioDay || regeneratingDayIndex != null || isLoading || !canEditTrip}
                    className="rounded-full"
                  >
                    <Sparkles className="text-primary" />
                    Rewrite day
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon-sm" className="rounded-full" aria-label="More map actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onSelect={() => void hydrateMaps()} disabled={isHydratingMaps || !canEditTrip}>
                        <Route />
                        {isHydratingMaps ? 'Rebuilding routes...' : 'Rebuild map routes'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setChatOpen(true)} disabled={!canEditTrip}>
                        <MessageSquareQuote />
                        Open planner chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid min-h-[520px] lg:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)]">
                <div className="border-b border-border bg-background lg:border-b-0 lg:border-r">
                  <div className="hide-scrollbar flex gap-2 overflow-x-auto border-b border-border p-3 lg:block lg:space-y-2 lg:overflow-visible">
                    {studioDayMaps.map(({ day, mappedStops, routeSummary }) => (
                      <button
                        key={day.id}
                        onClick={() => selectDay(day.day_index)}
                        aria-pressed={day.day_index === ensureSelectedDayExists}
                        className={cn(
                          'touch-target w-56 shrink-0 rounded-md border px-3 py-3 text-left transition-colors lg:w-full',
                          day.day_index === ensureSelectedDayExists
                            ? 'border-primary/40 bg-primary/10 text-foreground'
                            : 'border-transparent bg-transparent text-muted-foreground hover:bg-accent'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {day.day_index}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{day.title || `Day ${day.day_index}`}</span>
                            <span className="mt-1 block truncate text-xs text-muted-foreground">
                              {mappedStops.length} stops{routeSummary ? ` • ${routeSummary}` : ''}
                            </span>
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="hidden p-4 lg:block">
                    <p className="text-xs text-muted-foreground">Selected stops</p>
                    <div className="mt-3 space-y-2">
                      {(selectedStudioDay?.displayStops || []).slice(0, 5).map((stop) => {
                        const stopImage = getItineraryItemImage({
                          title: stop.title,
                          type: stop.item.type,
                          placeName: stop.placeName || stop.item.place?.name,
                          country: stop.country || stop.item.place?.country,
                          photoUrl: stop.item.place?.photo_url,
                        })
                        const mapsUrl = getStopMapsUrl({
                          title: stop.title,
                          placeName: stop.placeName || stop.item.place?.name,
                          country: stop.country || stop.item.place?.country,
                          latitude: stop.mapped ? stop.latitude : null,
                          longitude: stop.mapped ? stop.longitude : null,
                        })

                        return (
                          <div
                            key={stop.id}
                            className={cn(
                              'group flex w-full items-start gap-2 rounded-md border px-2.5 py-2 transition-colors hover:bg-accent',
                              trackedMapStop?.id === stop.id || trackedMapStop?.itemId === stop.item.id
                                ? 'border-primary/40 bg-primary/10 shadow-[0_10px_24px_rgba(190,132,49,0.12)]'
                                : 'border-border bg-background'
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => onSelectItem(stop.item)}
                              className="touch-target flex min-w-0 flex-1 items-start gap-2 text-left"
                            >
                              <span className="relative h-12 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                                <Image
                                  src={stopImage.src}
                                  alt=""
                                  fill
                                  sizes="56px"
                                  unoptimized
                                  loading="lazy"
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                                />
                              <span className={cn(
                                'absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-semibold shadow-sm',
                                trackedMapStop?.id === stop.id || trackedMapStop?.itemId === stop.item.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-card/90 text-primary'
                              )}>
                                  {stop.mapped ? stop.index : '—'}
                                </span>
                              </span>
                              <span className="min-w-0 flex-1 pt-0.5">
                                <span className="block truncate text-xs font-medium text-foreground">{stop.title}</span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                  {stop.timeLabel || 'Flexible'} {stop.mapped ? '• pinned' : '• needs map data'}
                                </span>
                              </span>
                            </button>
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="touch-target mt-1 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-foreground"
                              aria-label={`Open maps URL for ${stop.title}`}
                              title="Open maps URL"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        )
                      })}
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
                  focusedStopId={trackedMapStop?.id || null}
                  focusTarget={trackedMapStop}
                  onStopClick={handleMapStopClick}
                  mapHeightClassName="h-72 sm:h-[360px] lg:h-full"
                  className="min-w-0 rounded-none border-0"
                />
              </div>

              <div className="grid border-t border-border bg-background md:grid-cols-5">
                {[
                  ['Overview', `${days.length} days · ${tripStops.length} stops`],
                  ['Highlights', tripDestination || 'Group trip'],
                  ['Pace', groupBrief?.vibe || 'Balanced'],
                  ['Budget', groupBrief?.budget || 'Flexible'],
                  ['Missing details', mappingSummary.needsHydration ? 'Map pass needed' : 'Looks ready'],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-border px-4 py-3 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              <ItineraryArtifact
                tripTitle={trip?.title || 'Trip'}
                days={days}
                selectedDayIndex={ensureSelectedDayExists}
                setSelectedDayIndex={selectDay}
                focusedItemId={trackedMapStop?.itemId || null}
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
            <section className="rounded-xl border border-border bg-card px-4 py-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Share with crew</p>
                  <p className="mt-1 text-sm font-medium text-foreground">Public review link</p>
                </div>
                <button
                  onClick={togglePublic}
                  disabled={!canEditTrip}
                  className={cn(
                    'touch-target rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                    trip?.is_public
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-border bg-muted text-muted-foreground hover:bg-accent'
                  )}
                >
                  {trip?.is_public ? 'On' : 'Off'}
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  aria-label="Public review link"
                  readOnly
                  value={shareUrl || 'Enable public link to create one'}
                  onFocus={(event) => event.currentTarget.select()}
                  onClick={(event) => event.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground"
                />
                <button
                  onClick={copyInviteLink}
                  disabled={!shareUrl}
                  className={cn(
                    'touch-target rounded-md border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-45',
                    copyDone
                      ? 'border-success/30 bg-success/10 text-success'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent'
                  )}
                >
                  {copyDone ? 'Copied' : 'Copy'}
                </button>
              </div>
              <button
                onClick={shareInvite}
                disabled={!shareUrl}
                className="touch-target mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-45"
              >
                <Send className="h-4 w-4" />
                Share invite
              </button>
            </section>

            <section className="rounded-xl border border-border bg-card px-4 py-4 shadow-xs">
              <p className="text-xs text-muted-foreground">Crew consensus</p>
              <div className="mt-4 space-y-3">
                {[
                  ['Budget fit', groupBrief?.budget ? 'Good' : 'Needs detail'],
                  ['Pace fit', groupBrief?.vibe || 'Balanced'],
                  ['Map fit', routeQualityLabel],
                  ['Readiness', `${readinessCount}/4`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="inline-flex items-center gap-2 font-medium text-success">
                      {value}
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card px-4 py-4 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Friend feedback</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{feedback.length} {feedback.length === 1 ? 'review' : 'reviews'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">crew reacting to the plan</p>
                </div>
                <MessageSquareQuote className="h-5 w-5 text-foreground/25" />
              </div>
              <div className="mt-4 space-y-2">
                {feedback.length === 0 ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">Invite friends to flag what feels too busy, expensive, or worth keeping.</p>
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
                          <p className="mt-1 text-xs">{label}</p>
                        </div>
                      ))}
                    </div>
                    {visibleFeedback.map((entry) => (
                      <div key={entry.id} className="rounded-md border border-border bg-muted p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-medium text-foreground">{entry.author_name}</p>
                          <span className={cn('shrink-0 rounded-full border px-2 py-1 text-xs', sentimentClasses[entry.sentiment])}>
                            {sentimentLabel[entry.sentiment]}
                          </span>
                        </div>
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{entry.comment}</p>
                      </div>
                    ))}
                    {hiddenFeedbackCount > 0 && (
                      <p className="rounded-md border border-dashed border-border bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        Showing latest 4 of {feedback.length} reviews. {hiddenFeedbackCount} more {hiddenFeedbackCount === 1 ? 'reaction is' : 'reactions are'} saved for refresh.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>

            <section data-testid="trip-suggested-next-step" className="rounded-xl border border-border bg-card px-4 py-4 shadow-xs">
              <p className="text-xs text-muted-foreground">Suggested next step</p>
              {!canEditTrip ? (
                <>
                  <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                    Review the shared itinerary, or start your own editable version.
                  </p>
                  <div className={cn('mt-4 grid gap-2', trip?.is_public && trip.share_slug ? 'grid-cols-2' : 'grid-cols-1')}>
                    {trip?.is_public && trip.share_slug && (
                      <Link
                        data-testid="trip-suggested-view-share"
                        href={`/t/${trip.share_slug}`}
                        className="touch-target inline-flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        <Send className="h-4 w-4" />
                        View share
                      </Link>
                    )}
                    <Link
                      data-testid="trip-suggested-start-trip"
                      href="/chat"
                      className="touch-target inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent"
                    >
                      <Plus className="h-4 w-4" />
                      Start trip
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm font-medium leading-snug text-foreground">
                    {suggestedStepText}
                  </p>
                  {suggestedStepNotice && (
                    <p className={cn(
                      'mt-3 rounded-md border px-3 py-2 text-xs leading-relaxed',
                      suggestedNoticeIsWarning
                        ? 'border-destructive/30 bg-destructive/10 text-destructive'
                        : 'border-success/30 bg-success/10 text-success'
                    )} aria-live="polite">
                      {suggestedStepNotice}
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      data-testid={suggestedPrimaryTestId}
                      data-suggested-action={suggestedPrimaryAction}
                      onClick={handleSuggestedPrimaryStep}
                      disabled={suggestedPrimaryDisabled}
                      aria-label={suggestedPrimaryAction === 'build-maps'
                        ? 'Build map routes from suggested next step'
                        : suggestedPrimaryAction === 'open-planner-chat'
                          ? 'Open Planner chat from suggested next step'
                          : `Rewrite Day ${ensureSelectedDayExists} from suggested next step`}
                      className="touch-target inline-flex items-center justify-center gap-1.5 rounded-md border border-primary/30 bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      {suggestedPrimaryAction === 'build-maps'
                        ? <Route className="h-4 w-4" />
                        : suggestedPrimaryAction === 'open-planner-chat'
                          ? <MessageSquareQuote className="h-4 w-4" />
                          : <Plus className="h-4 w-4" />}
                      {suggestedPrimaryLabel}
                    </button>
                    <button
                      data-testid="trip-suggested-feedback-refresh"
                      onClick={() => startWorkflow('feedback_refresh')}
                      disabled={Boolean(creatingWorkflow)}
                      className="touch-target inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      {suggestedRefreshLabel}
                    </button>
                  </div>
                </>
              )}
            </section>

            <section ref={workflowPanelRef} className="rounded-xl border border-border bg-card px-4 py-4 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Planner workflows</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{latestWorkflowJob ? latestWorkflowJob.type.replace(/_/g, ' ') : 'Run async planning jobs'}</p>
                </div>
                <Wand2 className="h-5 w-5 text-foreground/25" />
              </div>
              <div className="mt-4 grid gap-2">
                <button onClick={() => startWorkflow('decision_memo')} disabled={Boolean(creatingWorkflow) || !canEditTrip} className="touch-target flex items-center justify-between rounded-md border border-border bg-muted px-3 py-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50">
                  <span>{creatingWorkflow === 'decision_memo' ? 'Starting memo...' : 'Generate decision memo'}</span>
                  <Scale3d className="h-4 w-4 text-primary" />
                </button>
                <button onClick={() => startWorkflow('generate_variants')} disabled={Boolean(creatingWorkflow) || !canEditTrip} className="touch-target flex items-center justify-between rounded-md border border-border bg-muted px-3 py-3 text-left text-xs text-muted-foreground transition-colors hover:bg-accent disabled:opacity-50">
                  <span>{creatingWorkflow === 'generate_variants' ? 'Starting variants...' : 'Create budget variants'}</span>
                  <Wand2 className="h-4 w-4 text-chart-2" />
                </button>
              </div>
              {workflowError && <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{workflowError}</p>}
              {latestWorkflowJob && (
                <div className="mt-3 rounded-md border border-border bg-muted p-3">
                  <p className="text-xs text-muted-foreground">{latestWorkflowJob.status}</p>
                  {latestWorkflowJob.status === 'completed' && latestWorkflowJob.result && (
                    <pre className="mt-2 max-h-36 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{JSON.stringify(latestWorkflowJob.result, null, 2)}</pre>
                  )}
                  {latestWorkflowJob.status === 'failed' && <p className="mt-2 text-xs text-destructive">{latestWorkflowJob.error || 'Workflow failed'}</p>}
                  {(latestWorkflowJob.status === 'queued' || latestWorkflowJob.status === 'running') && <p className="mt-2 text-xs text-muted-foreground">Working through the planner job...</p>}
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
            className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] top-24 z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg 2xl:hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Planner chat</p>
                <p className="text-sm font-medium text-foreground">Guide the crew itinerary</p>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="touch-target flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-accent"
                aria-label="Close planner chat"
              >
                ×
              </button>
            </div>
            {renderPlannerEditShortcuts('drawer')}
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
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <TripStudioPageContent />
    </Suspense>
  )
}
