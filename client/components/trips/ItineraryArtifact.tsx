'use client'

import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GripVertical, Trash2, Pencil, Clock, Sparkles, Maximize2, Minimize2, MapPin, ArrowLeftRight, Check, ArrowUp, ArrowDown, BedDouble, ExternalLink, CalendarCheck, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'
import TripDayMap from '@/components/trips/TripDayMap'
import { buildDisplayStops, getItineraryPlaceLabel, getRouteFallbackLabel, shouldUseSavedRoute, sortTripItemsForDisplay, sortTripItemsForVisibleItinerary } from '@/components/trips/derivedStops'
import { getItineraryItemImage } from '@/lib/itinerary-images'
import { getTravelBookingAction, type TravelBookingAction } from '@/lib/travel-booking-links'

export type TripDay = {
  id: string
  day_index: number
  date: string | null
  title: string | null
  notes: string | null
  items: TripItem[]
  routes?: Array<{
    mode: string
    geojson: any
    distance_m: number | null
    duration_s: number | null
  }>
}

export type TripItem = {
  id: string
  trip_day_id: string
  type: 'activity' | 'meal' | 'lodging' | 'transport' | 'transit' | 'note'
  title: string
  start_time: string | null
  end_time: string | null
  duration_minutes: number | null
  notes: string | null
  metadata?: Record<string, unknown> | null
  order_index: number
  place?: {
    id: string
    name: string
    country: string | null
    latitude: number | null
    longitude: number | null
    photo_url?: string | null
  } | null
}

export type SwapCandidate = {
  id: string
  title: string
  notes: string
  type: 'activity' | 'meal' | 'lodging' | 'transport'
}

function ItineraryStopImage({
  image,
  compact = false,
}: {
  image: ReturnType<typeof getItineraryItemImage>
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        'relative block shrink-0 overflow-hidden rounded-xl border border-rule bg-paper-raised',
        compact ? 'h-12 w-14' : 'h-20 w-20 sm:h-[5.25rem] sm:w-24'
      )}
      aria-hidden="true"
    >
      <Image
        src={image.src}
        alt=""
        fill
        sizes={compact ? '56px' : '(max-width: 640px) 80px, 96px'}
        unoptimized
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,16,0.02),rgba(8,12,16,0.28))]" />
    </span>
  )
}

type ItineraryArtifactProps = {
  tripTitle: string
  days: TripDay[]
  selectedDayIndex: number
  setSelectedDayIndex: (dayIndex: number) => void
  onSelectItem?: (item: TripItem) => void
  onBulkOps: (ops: any[]) => Promise<void>
  onRegenerateDay?: (dayIndex: number) => Promise<void> | void
  regeneratingDayIndex?: number | null
  regenerateDoneDayIndex?: number | null
  regenerateNotice?: string | null
  onSwapItem?: (item: TripItem, preference: string) => Promise<SwapCandidate[]> | SwapCandidate[]
  onApplySwapItem?: (item: TripItem, choiceId: string) => Promise<void> | void
  onOptimize?: (dayIndex: number) => Promise<void>
  isLoading?: boolean
  loadingLabel?: string
  readOnly?: boolean
  showMapPanel?: boolean
}

const SWAP_OPTIONS = [
  { label: 'Similar nearby', value: 'similar nearby option with the same general vibe and less friction' },
  { label: 'More relaxed', value: 'more relaxed option with less walking and more breathing room' },
  { label: 'More iconic', value: 'more iconic, memorable, must-see option that still fits the day' },
  { label: 'Better food', value: 'better food or drink option nearby, group-friendly and realistic' },
] as const

function timeChip(start: string | null, end: string | null) {
  if (!start && !end) return null
  const label = [start, end].filter(Boolean).join('–')
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-paper-recessed border border-rule text-foreground/60">
      <Clock className="w-3 h-3 text-foreground/30" />
      {label}
    </span>
  )
}

function getMapsUrl({
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

function StopUrlLink({
  href,
  label,
  compact = false,
}: {
  href: string
  label: string
  compact?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      aria-label={`Open maps URL for ${label}`}
      title={`Open maps URL for ${label}`}
      className={cn(
        'touch-target inline-flex shrink-0 items-center justify-center rounded-xl border border-rule bg-paper-raised text-foreground/58 transition-colors hover:border-[color:var(--brass)]/30 hover:bg-[var(--brass-subtle)] hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brass)]',
        compact ? 'h-8 w-8' : 'h-9 w-9'
      )}
    >
      <ExternalLink className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span className="sr-only">Open maps URL</span>
    </a>
  )
}

function BookingActionLink({
  action,
  compact = false,
}: {
  action: TravelBookingAction
  compact?: boolean
}) {
  const Icon = action.kind === 'hotel' ? CalendarCheck : Utensils

  return (
    <a
      href={action.href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      aria-label={action.ariaLabel}
      title={`${action.label} via ${action.provider}`}
      className={cn(
        'touch-target inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[color:var(--brass)]/30 bg-[var(--brass)] font-semibold text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brass)]',
        compact ? 'h-8 px-2.5 text-[11px]' : 'h-9 px-3 text-xs'
      )}
    >
      <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span>{compact ? action.shortLabel : action.label}</span>
      <ExternalLink className={compact ? 'h-3 w-3 opacity-75' : 'h-3.5 w-3.5 opacity-75'} />
    </a>
  )
}

export default function ItineraryArtifact({
  tripTitle,
  days,
  selectedDayIndex,
  setSelectedDayIndex,
  onSelectItem,
  onBulkOps,
  onRegenerateDay,
  regeneratingDayIndex,
  regenerateDoneDayIndex,
  regenerateNotice,
  onSwapItem,
  onApplySwapItem,
  onOptimize,
  isLoading,
  loadingLabel,
  readOnly = false,
  showMapPanel = true,
}: ItineraryArtifactProps) {
  const selectedDay = useMemo(
    () => days.find((d) => d.day_index === selectedDayIndex) || days[0],
    [days, selectedDayIndex]
  )

  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')
  const [swapMenuItemId, setSwapMenuItemId] = useState<string | null>(null)
  const [swappingItemId, setSwappingItemId] = useState<string | null>(null)
  const [swapOptionsByItemId, setSwapOptionsByItemId] = useState<Record<string, SwapCandidate[]>>({})
  const [swapErrorByItemId, setSwapErrorByItemId] = useState<Record<string, string>>({})
  const [swapSuccessByItemId, setSwapSuccessByItemId] = useState<Record<string, string>>({})
  const [swapNotice, setSwapNotice] = useState<string | null>(null)
  const pointerDragRef = useRef<{
    itemId: string
    fromDayIndex: number
    startX: number
    startY: number
  } | null>(null)
  const editingInputRef = useRef<HTMLInputElement>(null)
  const [applyingSwapId, setApplyingSwapId] = useState<string | null>(null)
  const [mapExpanded, setMapExpanded] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizeDone, setOptimizeDone] = useState(false)
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState<string | null>(null)
  const [itemActionError, setItemActionError] = useState<string | null>(null)

  const handleSwapChoice = async (item: TripItem, preference: string) => {
    if (!onSwapItem || swappingItemId) return
    setSwappingItemId(item.id)
    setSwapMenuItemId(null)
    setSwapErrorByItemId((current) => ({ ...current, [item.id]: '' }))
    setSwapSuccessByItemId((current) => ({ ...current, [item.id]: '' }))
    setSwapNotice('Finding similar places...')
    try {
      const options = await onSwapItem(item, preference)
      setSwapOptionsByItemId((current) => ({ ...current, [item.id]: options }))
      setSwapNotice(options.length ? 'Choose one of the replacements below.' : 'No replacements found yet.')
    } catch {
      setSwapNotice('Could not find swap ideas.')
      setSwapErrorByItemId((current) => ({
        ...current,
        [item.id]: 'Could not find swap ideas. Try the planner chat for a custom request.',
      }))
    } finally {
      setSwappingItemId((current) => (current === item.id ? null : current))
    }
  }

  const applySwapChoice = async (item: TripItem, choiceId: string) => {
    if (!onApplySwapItem || applyingSwapId) return
    const selectedOption = swapOptionsByItemId[item.id]?.find((option) => option.id === choiceId)
    setApplyingSwapId(`${item.id}:${choiceId}`)
    setSwapErrorByItemId((current) => ({ ...current, [item.id]: '' }))
    setSwapOptionsByItemId((current) => {
      const next = { ...current }
      delete next[item.id]
      return next
    })
    if (selectedOption) {
      setSwapNotice(`Swapping to ${selectedOption.title}...`)
      setSwapSuccessByItemId((current) => ({
        ...current,
        [item.id]: `Swapping to ${selectedOption.title}...`,
      }))
    }
    try {
      await onApplySwapItem(item, choiceId)
      if (selectedOption) {
        setSwapNotice(`Swapped to ${selectedOption.title}`)
        setSwapSuccessByItemId((current) => ({
          ...current,
          [item.id]: `Swapped to ${selectedOption.title}`,
        }))
        setTimeout(() => {
          setSwapNotice((current) => (current === `Swapped to ${selectedOption.title}` ? null : current))
          setSwapSuccessByItemId((current) => {
            if (current[item.id] !== `Swapped to ${selectedOption.title}`) return current
            const next = { ...current }
            delete next[item.id]
            return next
          })
        }, 4500)
      }
    } catch {
      setSwapNotice('Could not apply that swap.')
      setSwapSuccessByItemId((current) => {
        const next = { ...current }
        delete next[item.id]
        return next
      })
      setSwapErrorByItemId((current) => ({
        ...current,
        [item.id]: 'Could not apply that swap. Please try another option.',
      }))
    } finally {
      setApplyingSwapId(null)
    }
  }

  const handleOptimize = async () => {
    if (readOnly || !selectedDay || !onOptimize || isOptimizing) return
    setIsOptimizing(true)
    setOptimizeDone(false)
    setItemActionError(null)
    try {
      await onOptimize(selectedDay.day_index)
      setOptimizeDone(true)
      setTimeout(() => setOptimizeDone(false), 2500)
    } catch {
      setItemActionError('Could not optimize this day. Try again after checking the mapped stops.')
    } finally {
      setIsOptimizing(false)
    }
  }

  const dayMapCards = useMemo(() => {
    return days.map((day) => {
      const dayItems = day.items || []
      const sortedDayItems = sortTripItemsForDisplay(dayItems)
      const visibleDayItems = sortTripItemsForVisibleItinerary(dayItems)
      const displayStops = buildDisplayStops(visibleDayItems, { preserveOrder: true })
      const stops = displayStops.filter((stop) => stop.mapped)
      const usesDerivedStops = displayStops.some((stop) => stop.id.includes(':'))
      const savedRoute = day.routes?.find((entry) => entry.mode === 'walk') || day.routes?.[0]
      const useSavedRoute = shouldUseSavedRoute(dayItems, savedRoute, usesDerivedStops)

      const routeGeojson = useSavedRoute ? savedRoute?.geojson || null : null
      const route = useSavedRoute ? savedRoute : null
      const routeSummary = route?.distance_m && route?.duration_s
        ? `${Math.round(route.distance_m / 100) / 10} km • ${Math.round(route.duration_s / 60)} min walk`
        : getRouteFallbackLabel(dayItems, savedRoute, usesDerivedStops)
      const subtitleParts = [day.date, `${stops.length} stop${stops.length === 1 ? '' : 's'}`].filter(Boolean)

      return {
        day,
        sortedItems: sortedDayItems,
        displayStops,
        stops,
        routeGeojson,
        subtitle: subtitleParts.join(' • '),
        routeSummary,
        stopPreview: stops.map((stop) => stop.title),
      }
    })
  }, [days])

  const selectedDayMap = useMemo(() => {
    const selectedCard = dayMapCards.find(({ day }) => day.day_index === selectedDay?.day_index)
    if (!selectedCard) return null

    return {
      routeGeojson: selectedCard.routeGeojson,
      routeSummary: selectedCard.routeSummary,
      mappedStops: selectedCard.stops,
      stopDetails: selectedCard.displayStops,
    }
  }, [dayMapCards, selectedDay])

  const selectedDayCard = useMemo(
    () => dayMapCards.find(({ day }) => day.day_index === selectedDay?.day_index) || null,
    [dayMapCards, selectedDay]
  )
  const runDropOperation = async (itemId: string, fromDayIndex: number, dayIndex: number, sortedDayItems: TripItem[], toIndex: number) => {
    if (fromDayIndex !== dayIndex) {
      await onBulkOps([{ op: 'move', item_id: itemId, to_day_index: dayIndex, to_order_index: toIndex }])
      return
    }

    const ids = sortedDayItems.map((it) => it.id).filter((id) => id !== itemId)
    ids.splice(toIndex, 0, itemId)
    await onBulkOps(buildSameDayReorderOps(dayIndex, sortedDayItems, ids))
  }

  const buildSameDayReorderOps = (dayIndex: number, sortedDayItems: TripItem[], orderedItemIds: string[]) => {
    const itemById = new Map(sortedDayItems.map((item) => [item.id, item]))
    const ops: any[] = [{ op: 'reorder', day_index: dayIndex, ordered_item_ids: orderedItemIds }]

    orderedItemIds.forEach((itemId, index) => {
      const item = itemById.get(itemId)
      const timeSlot = sortedDayItems[index]
      if (!item || !timeSlot) return

      if (item.start_time !== timeSlot.start_time || item.end_time !== timeSlot.end_time) {
        ops.push({
          op: 'update',
          item_id: item.id,
          fields: {
            start_time: timeSlot.start_time,
            end_time: timeSlot.end_time,
          },
        })
      }
    })

    return ops
  }

  const handleDropOnList = async (dayIndex: number, sortedDayItems: TripItem[], toIndex: number, e: React.DragEvent) => {
    e.preventDefault()
    setDragOverItemId(null)

    let payload: any = null
    try {
      payload = JSON.parse(e.dataTransfer.getData('application/json'))
    } catch {
      return
    }
    if (!payload || payload.kind !== 'trip_item') return

    const itemId = payload.item_id as string
    const fromDayIndex = payload.from_day_index as number

    await runDropOperation(itemId, fromDayIndex, dayIndex, sortedDayItems, toIndex)
  }

  const handlePointerDragEnd = async (clientX: number, clientY: number) => {
    const payload = pointerDragRef.current
    pointerDragRef.current = null
    if (!payload) return

    const movedEnough = Math.hypot(clientX - payload.startX, clientY - payload.startY) > 12
    if (!movedEnough) return

    const dropElement = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>('[data-trip-drop-day][data-trip-drop-index]')
    if (!dropElement) return

    const targetDayIndex = Number(dropElement.dataset.tripDropDay)
    const toIndex = Number(dropElement.dataset.tripDropIndex)
    const targetCard = dayMapCards.find(({ day }) => day.day_index === targetDayIndex)
    if (!targetCard || !Number.isFinite(targetDayIndex) || !Number.isFinite(toIndex)) return

    setSelectedDayIndex(targetDayIndex)
    await runDropOperation(payload.itemId, payload.fromDayIndex, targetDayIndex, targetCard.sortedItems, toIndex)
  }

  const handlePointerDragMove = (clientX: number, clientY: number) => {
    if (!pointerDragRef.current) return

    const dropElement = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>('[data-trip-drop-day][data-trip-drop-index]')
    if (!dropElement) {
      setDragOverItemId(null)
      return
    }

    const targetDayIndex = Number(dropElement.dataset.tripDropDay)
    const toIndex = Number(dropElement.dataset.tripDropIndex)
    const targetCard = dayMapCards.find(({ day }) => day.day_index === targetDayIndex)
    const targetItem = targetCard?.sortedItems[toIndex]
    setDragOverItemId(targetItem?.id || null)
  }

  const moveItemWithinDay = async (dayIndex: number, sortedDayItems: TripItem[], itemId: string, direction: -1 | 1) => {
    const currentIndex = sortedDayItems.findIndex((item) => item.id === itemId)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= sortedDayItems.length) return

    const ids = sortedDayItems.map((item) => item.id)
    const [movedId] = ids.splice(currentIndex, 1)
    ids.splice(nextIndex, 0, movedId)

    setSelectedDayIndex(dayIndex)
    await onBulkOps(buildSameDayReorderOps(dayIndex, sortedDayItems, ids))
  }

  const startEditing = (item: TripItem) => {
    setEditingItemId(item.id)
    setEditingTitle(item.title)
  }

  const commitEditing = async (nextTitle?: string) => {
    if (!editingItemId) return
    const trimmed = (nextTitle ?? editingTitle).trim()
    setEditingItemId(null)
    if (!trimmed) return
    setItemActionError(null)
    try {
      await onBulkOps([{
        op: 'update',
        item_id: editingItemId,
        fields: { title: trimmed },
      }])
    } catch {
      setItemActionError('Could not save that edit. Refresh the trip and try again.')
    }
  }

  const deleteItem = async (itemId: string) => {
    setItemActionError(null)
    try {
      await onBulkOps([{ op: 'delete', item_id: itemId }])
      setPendingDeleteItemId((current) => (current === itemId ? null : current))
    } catch {
      setItemActionError('Could not delete that item. Refresh the trip and try again.')
    }
  }

  if (!selectedDay) {
    return (
      <div className="h-full flex items-center justify-center text-foreground/40 text-sm">
        Create a trip to start planning.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b border-rule px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-foreground/38">Itinerary</p>
            <h2 className="max-w-full break-words text-base font-medium leading-snug text-foreground">{tripTitle}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && onOptimize && (
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className={cn(
                  'touch-target inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
                  optimizeDone
                    ? 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                    : 'border-rule bg-paper-recessed text-foreground/82 hover:bg-paper-recessed'
                )}
                title="Optimize stop order to minimize walking"
              >
                {optimizeDone ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <ArrowLeftRight className={cn('w-3.5 h-3.5 text-[var(--brass)]', isOptimizing && 'animate-pulse')} />
                )}
                {isOptimizing ? 'Optimizing…' : optimizeDone ? 'Optimized!' : 'Optimize'}
              </button>
            )}
            {!readOnly && onRegenerateDay && (
              <button
                onClick={() => onRegenerateDay(selectedDay.day_index)}
                disabled={regeneratingDayIndex != null || isLoading}
                className="touch-target inline-flex items-center justify-center gap-1.5 rounded-full border border-rule bg-paper-recessed px-3 py-1.5 text-xs font-medium text-foreground/82 transition-colors hover:bg-paper-recessed"
                title="Rewrite this day only, leaving the rest of the trip unchanged"
              >
                {regenerateDoneDayIndex === selectedDay.day_index ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                {regeneratingDayIndex === selectedDay.day_index ? 'Requesting…' : regenerateDoneDayIndex === selectedDay.day_index ? 'Rewrite sent' : 'Rewrite day'}
              </button>
            )}
          </div>
        </div>

        <div className="hide-scrollbar mt-3 flex items-center gap-2 overflow-x-auto">
          {days.map((d) => (
            <button
              key={d.id}
              data-testid={`trip-day-tab-${d.day_index}`}
              onClick={() => setSelectedDayIndex(d.day_index)}
              aria-pressed={d.day_index === selectedDay.day_index}
              aria-current={d.day_index === selectedDay.day_index ? 'true' : undefined}
              aria-label={`Show Day ${d.day_index}${d.title ? `: ${d.title}` : ''}`}
              className={cn(
                'touch-target flex-shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                d.day_index === selectedDay.day_index
                  ? 'bg-[var(--brass)] border-[color:var(--brass)]/30 text-[var(--brass-text)] shadow-[0_8px_20px_rgba(190,132,49,0.18)]'
                  : 'bg-paper-raised/85 border-rule text-foreground/40 hover:text-foreground/70 hover:bg-paper-recessed'
              )}
            >
              Day {d.day_index}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {swapNotice && (
          <div className="rounded-2xl border border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)]/70 px-4 py-3 text-sm font-semibold text-[var(--moss)] shadow-[var(--panel-shadow)]">
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4" />
              {swapNotice}
            </span>
          </div>
        )}
        {regenerateNotice && (
          <div className="rounded-2xl border border-[color:var(--pillar-coastal-wash)] bg-[color:var(--pillar-coastal-wash)]/70 px-4 py-3 text-sm font-semibold text-[var(--horizon)] shadow-[var(--panel-shadow)]">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {regenerateNotice}
            </span>
          </div>
        )}
        {itemActionError && (
          <div className="rounded-2xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] px-4 py-3 text-sm font-semibold text-[var(--terracotta)] shadow-[var(--panel-shadow)]">
            {itemActionError}
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] px-4 py-3 text-sm font-semibold text-foreground shadow-[var(--panel-shadow)]">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 animate-pulse text-[var(--brass)]" />
              {loadingLabel || 'Building this itinerary.'}
            </span>
            <p className="mt-1 text-xs font-normal leading-relaxed text-foreground/62">
              Globe is adding named stops, timing, and map context. The first draft will appear here automatically.
            </p>
          </div>
        )}

        {showMapPanel && selectedDayMap && (!isLoading || selectedDayMap.mappedStops.length > 0) && (
          <div className="rounded-[26px] border border-rule bg-paper-recessed/60 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">Selected route</p>
                <p className="mt-1 truncate text-sm font-medium text-foreground">
                  Day {selectedDay.day_index} map
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-foreground/66 truncate">
                  {selectedDayMap.routeSummary ||
                    `${selectedDayMap.mappedStops.length} mapped stop${selectedDayMap.mappedStops.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                onClick={() => setMapExpanded((current) => !current)}
                className="touch-target inline-flex items-center justify-center gap-1.5 rounded-full border border-rule bg-paper-recessed px-3 py-1.5 text-xs font-medium text-foreground/82 transition-colors hover:bg-paper-recessed"
              >
                {mapExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                {mapExpanded ? 'Shrink' : 'Enlarge'}
              </button>
            </div>

            <div className="mt-3">
              <TripDayMap
                stops={selectedDayMap.mappedStops}
                routeGeojson={selectedDayMap.routeGeojson}
                title={`Day ${selectedDay.day_index}`}
                subtitle={selectedDay.title}
                routeSummary={selectedDayMap.routeSummary}
                ariaLabel={`Focused route map for day ${selectedDay.day_index}${selectedDay.title ? `: ${selectedDay.title}` : ''}`}
                showDetails={false}
                interactive={true}
                mapHeightClassName={mapExpanded ? 'h-80' : 'h-56'}
                className="min-w-0 overflow-hidden"
              />
            </div>

            <div className="mt-3 grid gap-2">
              {selectedDayMap.stopDetails.map((stop) => {
                const mapsUrl = getMapsUrl({
                  title: stop.title,
                  placeName: stop.placeName,
                  country: stop.country,
                  latitude: stop.mapped ? stop.latitude : null,
                  longitude: stop.mapped ? stop.longitude : null,
                })

                return (
                <div
                  key={stop.id}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border px-3 py-2.5 transition-colors',
                    stop.mapped
                      ? 'border-rule bg-paper-recessed/60 hover:border-rule hover:bg-paper-recessed/60'
                      : 'border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] hover:bg-[var(--brass-subtle)]'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectItem?.(stop.item)}
                    className="touch-target flex min-w-0 flex-1 items-start gap-3 text-left"
                  >
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-6 min-w-6 flex-shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
                        stop.mapped
                          ? 'bg-[var(--brass)] text-[var(--brass-text)]'
                          : 'border border-rule bg-paper-raised text-foreground/42'
                      )}
                      aria-label={stop.mapped ? `Map stop ${stop.index}` : 'Not numbered on map'}
                    >
                      {stop.mapped ? stop.index : '—'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-foreground/38">
                        {stop.mapped ? `Map stop ${stop.index}` : 'Not on map'}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="break-words text-xs font-medium leading-snug text-foreground">{stop.title}</p>
                        {stop.timeLabel && (
                          <span className="rounded-full border border-rule bg-paper-recessed px-2 py-0.5 text-[10px] text-foreground/62">
                            {stop.timeLabel}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 break-words text-[11px] leading-snug text-foreground/62">
                        {[
                          stop.placeName,
                          stop.country,
                        ].filter(Boolean).join(' • ') || (stop.mapped ? 'Pinned to the itinerary map' : 'No pinned place yet')}
                      </p>
                    </div>
                  </button>
                  <StopUrlLink href={mapsUrl} label={stop.title} compact />
                  <span className={cn(
                    'inline-flex h-8 flex-shrink-0 items-center justify-center gap-1 rounded-xl border px-2 text-[10px]',
                    stop.mapped
                      ? 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                      : 'border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] text-foreground'
                  )}>
                    <MapPin className="h-3 w-3" />
                    <span className="hidden sm:inline">{stop.mapped ? 'Pinned' : 'Needs map data'}</span>
                  </span>
                </div>
                )
              })}
            </div>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {selectedDayCard && (() => {
            const { day, sortedItems, subtitle, displayStops } = selectedDayCard
            const lodgingItems = sortedItems.filter((item) => item.type === 'lodging')
            const timelineItems = sortedItems.filter((item) => item.type !== 'lodging')

            return (
              <motion.section
                key={day.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="rounded-[28px] border border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 text-left">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-foreground/42">Day {day.day_index}</p>
                    <h3 className="mt-1 text-sm font-medium text-foreground">{day.title || `Itinerary for Day ${day.day_index}`}</h3>
                    <p className="mt-1 text-xs text-foreground/62">
                      {isLoading && sortedItems.length === 0
                        ? 'Building named stops and map context...'
                        : subtitle || `${sortedItems.length} item${sortedItems.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  {!readOnly && onRegenerateDay && (
                    <button
                      onClick={() => onRegenerateDay(day.day_index)}
                      disabled={regeneratingDayIndex != null || isLoading}
                      className="touch-target inline-flex items-center justify-center gap-1.5 rounded-full border border-rule bg-paper-recessed px-3 py-1.5 text-xs font-medium text-foreground/82 transition-colors hover:bg-paper-recessed"
                      title="Rewrite this day only, leaving the rest of the trip unchanged"
                    >
                      {regenerateDoneDayIndex === day.day_index ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                      {regeneratingDayIndex === day.day_index ? 'Requesting…' : regenerateDoneDayIndex === day.day_index ? 'Rewrite sent' : 'Rewrite this day'}
                    </button>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  <section className="rounded-[22px] border border-rule bg-paper-raised/80 p-3 shadow-[0_10px_28px_rgba(28,42,55,0.05)]">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--brass)]/25 bg-[var(--brass-subtle)] text-[var(--brass)]">
                          <BedDouble className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/42">Stay</p>
                          <p className="text-sm font-medium text-foreground">
                            {lodgingItems.length
                              ? `${lodgingItems.length} hotel${lodgingItems.length === 1 ? '' : 's'} for Day ${day.day_index}`
                              : `No hotel set for Day ${day.day_index}`}
                          </p>
                        </div>
                      </div>
                      {!lodgingItems.length && (
                        <p className="max-w-sm text-xs leading-relaxed text-foreground/55">
                          Ask Planner to add a specific hotel and it will appear here, separate from the day route.
                        </p>
                      )}
                    </div>

                    {lodgingItems.length > 0 && (
                      <div className="mt-3 grid gap-2">
                        {lodgingItems.map((item) => {
                          const mappedStop = displayStops.find((stop) => stop.item.id === item.id && stop.mapped)
                          const locationLabel = mappedStop?.placeName || getItineraryPlaceLabel(item)
                          const countryLabel = mappedStop?.country || item.place?.country || null
                          const itemImage = getItineraryItemImage({
                            title: item.title,
                            type: item.type,
                            placeName: locationLabel || item.place?.name,
                            country: countryLabel,
                            photoUrl: item.place?.photo_url,
                          })
                          const mapsUrl = getMapsUrl({
                            title: item.title,
                            placeName: locationLabel || item.place?.name,
                            country: countryLabel,
                            latitude: mappedStop?.latitude ?? item.place?.latitude ?? null,
                            longitude: mappedStop?.longitude ?? item.place?.longitude ?? null,
                          })
                          const bookingAction = getTravelBookingAction({
                            item,
                            dayDate: day.date,
                            destination: tripTitle,
                          })

                          return (
                            <div key={item.id} className="rounded-2xl border border-rule bg-paper-recessed p-3">
                              <div className="flex flex-col gap-3">
                                <div className="min-w-0 flex-1 text-left">
                                  <div className="flex min-w-0 gap-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDayIndex(day.day_index)
                                        onSelectItem?.(item)
                                      }}
                                      className="shrink-0 text-left"
                                      aria-label={mappedStop ? `Show map stop ${mappedStop.index}: ${item.title}` : `Show ${item.title} on the map`}
                                    >
                                      <ItineraryStopImage image={itemImage} compact />
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        {mappedStop && (
                                          <span className="inline-flex items-center rounded-full border border-[color:var(--brass)]/30 bg-[var(--brass)] px-2 py-1 text-[10px] font-semibold tabular-nums text-[var(--brass-text)]">
                                            Map {mappedStop.index}
                                          </span>
                                        )}
                                        {timeChip(item.start_time, item.end_time)}
                                        <span className="rounded-full border border-[color:var(--brass)]/25 bg-[var(--brass-subtle)] px-2 py-1 text-[10px] font-medium text-[var(--brass)]">
                                          Hotel
                                        </span>
                                      </div>
                                      <div className="mt-2">
                                        {editingItemId === item.id ? (
                                          <div className="flex flex-col gap-2 sm:flex-row">
                                            <input
                                              ref={editingInputRef}
                                              autoFocus
                                              value={editingTitle}
                                              onChange={(e) => setEditingTitle(e.target.value)}
                                              onInput={(e) => setEditingTitle(e.currentTarget.value)}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') void commitEditing(e.currentTarget.value)
                                                if (e.key === 'Escape') setEditingItemId(null)
                                              }}
                                              className="w-full rounded-xl border border-rule bg-paper-recessed px-3 py-2 text-sm text-foreground placeholder:text-[var(--ink-4)] focus:border-[color:var(--brass)]/30 focus:outline-none"
                                            />
                                            <div className="flex gap-2">
                                              <button
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => void commitEditing(editingInputRef.current?.value)}
                                                className="touch-target rounded-xl border border-[color:var(--brass)]/30 bg-[var(--brass)] px-3 py-2 text-xs font-semibold text-[var(--brass-text)]"
                                              >
                                                Save
                                              </button>
                                              <button
                                                type="button"
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => setEditingItemId(null)}
                                                className="touch-target rounded-xl border border-rule bg-paper px-3 py-2 text-xs font-semibold text-foreground/60"
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedDayIndex(day.day_index)
                                              onSelectItem?.(item)
                                            }}
                                            className="max-w-full break-words text-left text-sm font-semibold leading-snug text-foreground transition-colors hover:text-[var(--brass)]"
                                          >
                                            {item.title}
                                          </button>
                                        )}
                                        {(locationLabel || countryLabel) && (
                                          <p className="mt-0.5 break-words text-xs leading-snug text-foreground/55">
                                            {[locationLabel, countryLabel].filter(Boolean).join(' • ')}
                                          </p>
                                        )}
                                        {item.notes && (
                                          <p className="mt-2 whitespace-pre-line break-words text-xs leading-relaxed text-foreground/62">{item.notes}</p>
                                        )}
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                          {bookingAction && <BookingActionLink action={bookingAction} />}
                                          <StopUrlLink href={mapsUrl} label={item.title} />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {!readOnly && (
                                  <div className="flex flex-wrap items-center gap-1 border-t border-rule/70 pt-2">
                                    <button
                                      onClick={() => startEditing(item)}
                                      className="touch-target flex h-8 w-8 items-center justify-center rounded-xl border border-rule bg-paper-recessed text-foreground/55 transition-colors hover:bg-paper-recessed hover:text-foreground/80"
                                      title="Edit title"
                                      aria-label={`Edit ${item.title}`}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => setPendingDeleteItemId((current) => (current === item.id ? null : item.id))}
                                      className="touch-target flex h-8 w-8 items-center justify-center rounded-xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] text-[var(--terracotta)] transition-colors hover:bg-[color:var(--pillar-desert-wash)]"
                                      title="Delete"
                                      aria-label={`Delete ${item.title}`}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {pendingDeleteItemId === item.id && (
                                <div className="mt-2 rounded-2xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)]/75 p-3">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs leading-relaxed text-[var(--terracotta)]">
                                      Delete “{item.title}” from this day?
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPendingDeleteItemId(null)}
                                        className="touch-target rounded-full border border-rule bg-paper-raised px-3 py-2 text-xs font-medium text-foreground/72"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteItem(item.id)}
                                        className="touch-target rounded-full border border-[color:var(--terracotta)]/30 bg-[var(--terracotta)] px-3 py-2 text-xs font-semibold text-white"
                                      >
                                        Delete hotel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </section>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 px-1">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/42">Day Plan</p>
                        <p className="text-xs text-foreground/55">
                          {timelineItems.length} stop{timelineItems.length === 1 ? '' : 's'} for meals, activities, and movement
                        </p>
                      </div>
                    </div>
                  <div
                    data-trip-drop-day={day.day_index}
                    data-trip-drop-index={0}
                    onDragOver={(e) => {
                      if (!readOnly) e.preventDefault()
                    }}
                    onDrop={(e) => {
                      if (!readOnly) handleDropOnList(day.day_index, sortedItems, 0, e)
                    }}
                    className="h-2 rounded-lg"
                  />

                  {timelineItems.map((item) => {
                    const sortedItemIndex = sortedItems.findIndex((sortedItem) => sortedItem.id === item.id)
                    const mappedStop = displayStops.find((stop) => stop.item.id === item.id && stop.mapped)
                    const locationLabel = mappedStop?.placeName || getItineraryPlaceLabel(item)
                    const countryLabel = mappedStop?.country || item.place?.country || null
                    const itemImage = getItineraryItemImage({
                      title: item.title,
                      type: item.type,
                      placeName: locationLabel || item.place?.name,
                      country: countryLabel,
                      photoUrl: item.place?.photo_url,
                    })
                    const mapsUrl = getMapsUrl({
                      title: item.title,
                      placeName: locationLabel || item.place?.name,
                      country: countryLabel,
                      latitude: mappedStop?.latitude ?? item.place?.latitude ?? null,
                      longitude: mappedStop?.longitude ?? item.place?.longitude ?? null,
                    })
                    const bookingAction = getTravelBookingAction({
                      item,
                      dayDate: day.date,
                      destination: tripTitle,
                    })

                    return (
                    <div key={item.id}>
                        <div
                        data-trip-drop-day={day.day_index}
                        data-trip-drop-index={sortedItemIndex}
                        onDragOver={(e) => {
                          if (readOnly) return
                          e.preventDefault()
                          setSelectedDayIndex(day.day_index)
                          setDragOverItemId(item.id)
                        }}
                        onDragLeave={() => {
                          setDragOverItemId((prev) => (prev === item.id ? null : prev))
                        }}
                        onDrop={(e) => {
                          if (!readOnly) handleDropOnList(day.day_index, sortedItems, sortedItemIndex, e)
                        }}
                        className={cn(
                          'group rounded-2xl border p-3 transition-colors',
                          dragOverItemId === item.id ? 'border-[color:var(--brass)]/30 bg-[var(--brass-subtle)]' : 'border-rule bg-paper-recessed hover:border-rule'
                        )}
                      >
                        <div className="flex flex-col gap-3">
                          {!readOnly && (
                            <div className="flex items-center gap-1 text-foreground/28 transition-colors group-hover:text-foreground/45 sm:mt-0.5 sm:block">
                              <span
                                onPointerDown={(e) => {
                                  pointerDragRef.current = {
                                    itemId: item.id,
                                    fromDayIndex: day.day_index,
                                    startX: e.clientX,
                                    startY: e.clientY,
                                  }
                                  e.currentTarget.setPointerCapture?.(e.pointerId)
                                }}
                                onPointerMove={(e) => handlePointerDragMove(e.clientX, e.clientY)}
                                onPointerUp={(e) => {
                                  const { clientX, clientY } = e
                                  e.currentTarget.releasePointerCapture?.(e.pointerId)
                                  void handlePointerDragEnd(clientX, clientY)
                                }}
                                onPointerCancel={(e) => {
                                  pointerDragRef.current = null
                                  e.currentTarget.releasePointerCapture?.(e.pointerId)
                                }}
                                className="inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-xl text-foreground/35 active:cursor-grabbing"
                                title={`Drag ${item.title}`}
                                aria-label={`Drag ${item.title}`}
                              >
                                <GripVertical className="h-4 w-4 flex-shrink-0" />
                              </span>
                              <div className="flex gap-1 sm:mt-2 sm:flex-col">
                                <button
                                  type="button"
                                  draggable={false}
                                  onClick={() => moveItemWithinDay(day.day_index, sortedItems, item.id, -1)}
                                  disabled={sortedItemIndex <= 0}
                                  className="touch-target inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rule bg-paper-recessed text-foreground/55 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                                  title="Move earlier"
                                  aria-label={`Move ${item.title} earlier`}
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  draggable={false}
                                  onClick={() => moveItemWithinDay(day.day_index, sortedItems, item.id, 1)}
                                  disabled={sortedItemIndex === sortedItems.length - 1}
                                  className="touch-target inline-flex h-8 w-8 items-center justify-center rounded-xl border border-rule bg-paper-recessed text-foreground/55 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-35"
                                  title="Move later"
                                  aria-label={`Move ${item.title} later`}
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="min-w-0 flex-1 text-left">
                            <div className="flex min-w-0 gap-3">
                              <ItineraryStopImage image={itemImage} />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={cn(
                                      'inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold tabular-nums',
                                      mappedStop
                                        ? 'border-[color:var(--brass)]/30 bg-[var(--brass)] text-[var(--brass-text)]'
                                        : 'border-rule bg-paper-raised/85 text-foreground/38'
                                    )}
                                  >
                                    {mappedStop ? `Map ${mappedStop.index}` : 'No map #'}
                                  </span>
                                  {timeChip(item.start_time, item.end_time)}
                                  <span className="rounded-full border border-rule bg-paper-raised/85 px-2 py-1 text-[10px] text-foreground/40">
                                    {item.type}
                                  </span>
                                </div>

                                <div className="mt-2">
                                  {editingItemId === item.id ? (
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                      <input
                                        ref={editingInputRef}
                                        autoFocus
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        onInput={(e) => setEditingTitle(e.currentTarget.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') void commitEditing(e.currentTarget.value)
                                          if (e.key === 'Escape') setEditingItemId(null)
                                        }}
                                        className="w-full rounded-xl border border-rule bg-paper-recessed px-3 py-2 text-sm text-foreground placeholder:text-[var(--ink-4)] focus:border-[color:var(--brass)]/30 focus:outline-none"
                                      />
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => void commitEditing(editingInputRef.current?.value)}
                                          className="touch-target rounded-xl border border-[color:var(--brass)]/30 bg-[var(--brass)] px-3 py-2 text-xs font-semibold text-[var(--brass-text)]"
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onMouseDown={(e) => e.preventDefault()}
                                          onClick={() => setEditingItemId(null)}
                                          className="touch-target rounded-xl border border-rule bg-paper px-3 py-2 text-xs font-semibold text-foreground/60"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedDayIndex(day.day_index)
                                        onSelectItem?.(item)
                                      }}
                                      className="max-w-full break-words text-left text-sm font-medium leading-snug text-foreground transition-colors hover:text-[var(--brass)]"
                                      aria-label={mappedStop ? `Show map stop ${mappedStop.index}: ${item.title}` : `Show ${item.title}`}
                                    >
                                      {item.title}
                                    </button>
                                  )}
                                  {(locationLabel || countryLabel) && (
                                    <p className="mt-0.5 break-words text-xs leading-snug text-foreground/55">
                                      {[locationLabel, countryLabel].filter(Boolean).join(' • ')}
                                    </p>
                                  )}
                                  {item.notes && (
                                    <p className="mt-2 whitespace-pre-line break-words text-xs leading-relaxed text-foreground/62">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {bookingAction && <BookingActionLink action={bookingAction} />}
                            <StopUrlLink href={mapsUrl} label={item.title} />
                          </div>

                          {!readOnly && (
                          <div className="flex flex-wrap items-center gap-1 border-t border-rule/70 pt-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                            <button
                              onClick={() => startEditing(item)}
                              className="touch-target flex h-8 w-8 items-center justify-center rounded-xl border border-rule bg-paper-recessed text-foreground/55 transition-colors hover:bg-paper-recessed hover:text-foreground/80"
                              title="Edit title"
                              aria-label={`Edit ${item.title}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setSwapMenuItemId((current) => (current === item.id ? null : item.id))}
                                className={cn(
                                  'touch-target inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border px-2.5 text-[11px] font-medium transition-colors',
                                  swappingItemId === item.id
                                    ? 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                                    : 'border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] text-foreground hover:bg-[var(--brass)] hover:text-[var(--brass-text)]'
                                )}
                                title="Choose how to swap this exact activity"
                                aria-label={`Swap ${item.title}`}
                                aria-expanded={swapMenuItemId === item.id}
                              >
                                {swappingItemId === item.id ? <Check className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                                {swappingItemId === item.id ? 'Sent' : 'Swap'}
                              </button>
                              <AnimatePresence>
                                {swapMenuItemId === item.id && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                    transition={{ duration: 0.14 }}
                                    className="fixed inset-x-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[70] max-h-[min(18rem,calc(100dvh-8rem))] overflow-y-auto rounded-2xl border border-rule bg-paper-raised p-1.5 shadow-[var(--shadow-lg)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-10 sm:z-40 sm:max-h-none sm:w-44 sm:overflow-hidden"
                                  >
                                    <p className="px-2.5 pb-1.5 pt-1 text-[10px] uppercase tracking-[0.18em] text-foreground/45">
                                      Swap for
                                    </p>
                                    {SWAP_OPTIONS.map((option) => (
                                      <button
                                        key={option.label}
                                        type="button"
                                        onClick={() => handleSwapChoice(item, option.value)}
                                        className="touch-target block w-full rounded-xl px-2.5 py-2 text-left text-xs font-medium text-foreground/82 transition-colors hover:bg-paper-recessed hover:text-foreground"
                                      >
                                        {option.label}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                            <button
                              onClick={() => setPendingDeleteItemId((current) => (current === item.id ? null : item.id))}
                              className="touch-target flex h-8 w-8 items-center justify-center rounded-xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] text-[var(--terracotta)] transition-colors hover:bg-[color:var(--pillar-desert-wash)]"
                              title="Delete"
                              aria-label={`Delete ${item.title}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          )}
	                        </div>
	                      </div>

                        {pendingDeleteItemId === item.id && (
                          <div className="mt-2 rounded-2xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)]/75 p-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-xs leading-relaxed text-[var(--terracotta)]">
                                Delete “{item.title}” from this day?
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPendingDeleteItemId(null)}
                                  className="touch-target rounded-full border border-rule bg-paper-raised px-3 py-2 text-xs font-medium text-foreground/72"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteItem(item.id)}
                                  className="touch-target rounded-full border border-[color:var(--terracotta)]/30 bg-[var(--terracotta)] px-3 py-2 text-xs font-semibold text-white"
                                >
                                  Delete item
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

	                      {(swapOptionsByItemId[item.id]?.length || swapErrorByItemId[item.id] || swapSuccessByItemId[item.id]) && (
	                        <div
	                          className={cn(
	                            'mt-2 rounded-2xl border p-3',
	                            swapSuccessByItemId[item.id]
	                              ? 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)]/70'
	                              : 'border-[color:var(--brass)]/25 bg-[var(--brass-subtle)]/70'
	                          )}
	                        >
	                          {swapOptionsByItemId[item.id]?.length ? (
	                            <>
	                              <div className="mb-2 flex items-center justify-between gap-3">
	                                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
	                                  Pick a replacement
	                                </p>
	                                <button
	                                  type="button"
	                                  onClick={() =>
	                                    setSwapOptionsByItemId((current) => {
	                                      const next = { ...current }
	                                      delete next[item.id]
	                                      return next
	                                    })
	                                  }
	                                  className="text-[11px] font-medium text-foreground/55 hover:text-foreground"
	                                >
	                                  Dismiss
	                                </button>
	                              </div>
	                              <div className="grid gap-2">
	                                {swapOptionsByItemId[item.id].map((option) => {
	                                  const applyId = `${item.id}:${option.id}`
	                                  return (
	                                    <button
	                                      key={option.id}
	                                      type="button"
	                                      onClick={() => applySwapChoice(item, option.id)}
	                                      disabled={applyingSwapId != null}
	                                      className="rounded-xl border border-rule bg-paper-raised px-3 py-2 text-left transition-colors hover:border-[color:var(--brass)]/35 hover:bg-paper disabled:cursor-wait disabled:opacity-60"
	                                    >
	                                      <span className="flex items-start justify-between gap-3">
	                                        <span>
	                                          <span className="block text-sm font-semibold text-foreground">{option.title}</span>
	                                          <span className="mt-1 block text-xs leading-relaxed text-foreground/62">{option.notes}</span>
	                                        </span>
	                                        <span className="mt-0.5 rounded-full bg-paper-recessed px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/50">
	                                          {applyingSwapId === applyId ? 'Applying' : option.type}
	                                        </span>
	                                      </span>
	                                    </button>
	                                  )
	                                })}
	                              </div>
	                            </>
	                          ) : swapSuccessByItemId[item.id] ? (
	                            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--moss)]">
	                              <Check className="h-4 w-4" />
	                              {swapSuccessByItemId[item.id]}
	                            </div>
	                          ) : (
	                            <p className="text-xs font-medium text-[var(--terracotta)]">{swapErrorByItemId[item.id]}</p>
	                          )}
	                        </div>
	                      )}

	                      <div
                        data-trip-drop-day={day.day_index}
                        data-trip-drop-index={sortedItemIndex + 1}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnList(day.day_index, sortedItems, sortedItemIndex + 1, e)}
                        className="h-2 rounded-lg"
                      />
                    </div>
                  )})}
                  </div>
                </div>

                {isLoading && sortedItems.length === 0 && (
                  <div className="mt-6 grid gap-2">
                    {[0, 1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-16 animate-pulse rounded-2xl border border-rule bg-paper-raised/80"
                      />
                    ))}
                  </div>
                )}

                {!isLoading && sortedItems.length === 0 && (
                  <div className="mt-6 rounded-2xl border border-dashed border-rule bg-paper-raised/85 px-4 py-5 text-center">
                    <p className="text-sm text-foreground/40">Ask the AI to build this day.</p>
                    <p className="mt-2 text-xs text-foreground/25">
                      Example: “Plan Day {day.day_index} around great food and neighborhoods.”
                    </p>
                  </div>
                )}
              </motion.section>
            )
          })()}
        </AnimatePresence>
      </div>
    </div>
  )
}
