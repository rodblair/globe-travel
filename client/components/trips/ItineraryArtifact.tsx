'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GripVertical, Trash2, Pencil, Clock, Sparkles, Maximize2, Minimize2, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import TripDayMap from '@/components/trips/TripDayMap'

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
  type: 'activity' | 'meal' | 'lodging' | 'transit' | 'note'
  title: string
  start_time: string | null
  end_time: string | null
  duration_minutes: number | null
  notes: string | null
  order_index: number
  place?: {
    id: string
    name: string
    country: string | null
    latitude: number | null
    longitude: number | null
  } | null
}

type ItineraryArtifactProps = {
  tripTitle: string
  days: TripDay[]
  selectedDayIndex: number
  setSelectedDayIndex: (dayIndex: number) => void
  onSelectItem?: (item: TripItem) => void
  onBulkOps: (ops: any[]) => Promise<void>
  onRegenerateDay?: (dayIndex: number) => void
  onSwapItem?: (item: TripItem) => void
  isLoading?: boolean
}

type DerivedStop = {
  title: string
  latitude: number
  longitude: number
}

type DisplayStop = {
  id: string
  title: string
  latitude: number
  longitude: number
  index: number
  item: TripItem
  placeName: string | null
  country: string | null
  timeLabel: string | null
  mapped: boolean
}

const DERIVED_STOP_RULES: Array<{ pattern: RegExp; stops: DerivedStop[] }> = [
  {
    pattern: /colosseum.*roman forum|roman forum.*colosseum/i,
    stops: [
      { title: 'Colosseum', latitude: 41.89021, longitude: 12.49223 },
      { title: 'Roman Forum', latitude: 41.89246, longitude: 12.48533 },
    ],
  },
  {
    pattern: /vatican museums.*sistine chapel|sistine chapel.*vatican museums/i,
    stops: [
      { title: 'Vatican Museums', latitude: 41.90649, longitude: 12.45362 },
      { title: 'Sistine Chapel', latitude: 41.90293, longitude: 12.45486 },
    ],
  },
]

function buildDisplayStops(items: TripItem[]) {
  const sortedItems = [...items].sort((a, b) => a.order_index - b.order_index)
  const displayStops: DisplayStop[] = []

  for (const item of sortedItems) {
    const timeLabel = [item.start_time, item.end_time].filter(Boolean).join('–') || null
    const derivedStops = DERIVED_STOP_RULES.find((entry) => entry.pattern.test(item.title))?.stops || null

    if (derivedStops) {
      for (const stop of derivedStops) {
        displayStops.push({
          id: `${item.id}:${stop.title}`,
          title: stop.title,
          latitude: stop.latitude,
          longitude: stop.longitude,
          index: displayStops.length + 1,
          item,
          placeName: stop.title,
          country: item.place?.country || 'Italy',
          timeLabel,
          mapped: true,
        })
      }
      continue
    }

    displayStops.push({
      id: item.id,
      title: item.place?.name || item.title,
      latitude: item.place?.latitude || 0,
      longitude: item.place?.longitude || 0,
      index: displayStops.length + 1,
      item,
      placeName: item.place?.name || null,
      country: item.place?.country || null,
      timeLabel,
      mapped: item.place?.latitude != null && item.place?.longitude != null,
    })
  }

  return displayStops
}

function timeChip(start: string | null, end: string | null) {
  if (!start && !end) return null
  const label = [start, end].filter(Boolean).join('–')
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/60">
      <Clock className="w-3 h-3 text-white/30" />
      {label}
    </span>
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
  onSwapItem,
  isLoading,
}: ItineraryArtifactProps) {
  const selectedDay = useMemo(
    () => days.find((d) => d.day_index === selectedDayIndex) || days[0],
    [days, selectedDayIndex]
  )

  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string>('')
  const [mapExpanded, setMapExpanded] = useState(false)

  const sortedItems = useMemo(() => {
    if (!selectedDay) return []
    return [...(selectedDay.items || [])].sort((a, b) => a.order_index - b.order_index)
  }, [selectedDay])

  const dayMapCards = useMemo(() => {
    return days.map((day) => {
      const sortedDayItems = [...(day.items || [])].sort((a, b) => a.order_index - b.order_index)
      const stops = buildDisplayStops(sortedDayItems).filter((stop) => stop.mapped)

      const routeGeojson = day.routes?.find((route) => route.mode === 'walk')?.geojson || day.routes?.[0]?.geojson || null
      const route = day.routes?.find((entry) => entry.mode === 'walk') || day.routes?.[0]
      const routeSummary = route?.distance_m && route?.duration_s
        ? `${Math.round(route.distance_m / 100) / 10} km • ${Math.round(route.duration_s / 60)} min walk`
        : null
      const subtitleParts = [day.date, `${stops.length} stop${stops.length === 1 ? '' : 's'}`].filter(Boolean)

      return {
        day,
        stops,
        routeGeojson,
        subtitle: subtitleParts.join(' • '),
        routeSummary,
        stopPreview: buildDisplayStops(sortedDayItems).map((stop) => stop.title),
      }
    })
  }, [days])

  const selectedDayMap = useMemo(() => {
    if (!selectedDay) return null

    const sortedDayItems = [...(selectedDay.items || [])].sort((a, b) => a.order_index - b.order_index)
    const displayStops = buildDisplayStops(sortedDayItems)
    const mappedStops = displayStops.filter((stop) => stop.mapped)

    const route = selectedDay.routes?.find((entry) => entry.mode === 'walk') || selectedDay.routes?.[0]

    return {
      routeGeojson: route?.geojson || null,
      routeSummary:
        route?.distance_m && route?.duration_s
          ? `${Math.round(route.distance_m / 100) / 10} km • ${Math.round(route.duration_s / 60)} min walk`
          : null,
      mappedStops,
      stopDetails: displayStops,
    }
  }, [selectedDay])

  const handleDragStart = (item: TripItem, e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      kind: 'trip_item',
      item_id: item.id,
      from_day_index: selectedDay.day_index,
    }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDropOnList = async (toIndex: number, e: React.DragEvent) => {
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
    const toDayIndex = selectedDay.day_index

    if (fromDayIndex !== toDayIndex) {
      await onBulkOps([{ op: 'move', item_id: itemId, to_day_index: toDayIndex, to_order_index: toIndex }])
      return
    }

    const ids = sortedItems.map((it) => it.id).filter((id) => id !== itemId)
    ids.splice(toIndex, 0, itemId)
    await onBulkOps([{ op: 'reorder', day_index: toDayIndex, ordered_item_ids: ids }])
  }

  const startEditing = (item: TripItem) => {
    setEditingItemId(item.id)
    setEditingTitle(item.title)
  }

  const commitEditing = async () => {
    if (!editingItemId) return
    const trimmed = editingTitle.trim()
    setEditingItemId(null)
    if (!trimmed) return
    await onBulkOps([{ op: 'update', item_id: editingItemId, fields: { title: trimmed } }])
  }

  const deleteItem = async (itemId: string) => {
    await onBulkOps([{ op: 'delete', item_id: itemId }])
  }

  if (!selectedDay) {
    return (
      <div className="h-full flex items-center justify-center text-white/40 text-sm">
        Create a trip to start planning.
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-white/25">
              Itinerary
            </p>
            <h2 className="text-sm font-medium text-white/80 truncate">
              {tripTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRegenerateDay?.(selectedDay.day_index)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white/80 hover:bg-white/10 transition-colors"
              title="Regenerate this day"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Regen
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto">
          {days.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDayIndex(d.day_index)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                d.day_index === selectedDay.day_index
                  ? 'bg-amber-500/15 border-amber-500/25 text-amber-300'
                  : 'bg-black/40 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5'
              )}
            >
              Day {d.day_index}
            </button>
          ))}
        </div>

        <div className="mt-4 -mx-1 px-1 overflow-x-auto">
          <div className="flex items-stretch gap-3 pb-1">
            {dayMapCards.map(({ day, stops, routeGeojson, subtitle, routeSummary, stopPreview }) => (
              <TripDayMap
                key={day.id}
                stops={stops}
                routeGeojson={routeGeojson}
                title={`Day ${day.day_index}${day.title ? ` · ${day.title}` : ''}`}
                subtitle={subtitle}
                routeSummary={routeSummary}
                stopPreview={stopPreview}
                active={day.day_index === selectedDay.day_index}
                onClick={() => setSelectedDayIndex(day.day_index)}
              />
            ))}
          </div>
        </div>

        {selectedDayMap && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/80 truncate">
                  Day {selectedDay.day_index} map
                </p>
                <p className="mt-1 text-[11px] text-white/40 truncate">
                  {selectedDayMap.routeSummary ||
                    `${selectedDayMap.mappedStops.length} mapped stop${selectedDayMap.mappedStops.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                onClick={() => setMapExpanded((current) => !current)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white/80"
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
                interactive
                showDetails={false}
                mapHeightClassName={mapExpanded ? 'h-80' : 'h-56'}
                className="min-w-0 overflow-hidden"
              />
            </div>

            <div className="mt-3 grid gap-2">
              {selectedDayMap.stopDetails.map((stop, index) => (
                <button
                  key={stop.id}
                  onClick={() => onSelectItem?.(stop.item)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border px-3 py-2 text-left transition-colors',
                    stop.mapped
                      ? 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                      : 'border-amber-500/20 bg-amber-500/[0.06] hover:bg-amber-500/[0.1]'
                  )}
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/90 text-[11px] font-semibold text-black">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-medium text-white/80">{stop.title}</p>
                      {stop.timeLabel && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/45">
                          {stop.timeLabel}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-white/40 truncate">
                      {stop.placeName || 'No pinned place yet'}
                      {stop.country ? ` • ${stop.country}` : ''}
                    </p>
                  </div>
                  <span className={cn(
                    'inline-flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px]',
                    stop.mapped
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                  )}>
                    <MapPin className="h-3 w-3" />
                    {stop.mapped ? 'Pinned' : 'Needs map data'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
        {/* Dropzone at top */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDropOnList(0, e)}
          className="h-2 rounded-lg"
        />

        <AnimatePresence mode="popLayout">
          {sortedItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div
                draggable
                onDragStart={(e) => handleDragStart(item, e)}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOverItemId(item.id)
                }}
                onDragLeave={() => {
                  setDragOverItemId((prev) => (prev === item.id ? null : prev))
                }}
                onDrop={(e) => handleDropOnList(index, e)}
                className={cn(
                  'group rounded-2xl bg-white/5 border border-white/10 p-3 transition-colors',
                  dragOverItemId === item.id ? 'border-amber-500/30 bg-amber-500/[0.06]' : 'hover:border-white/20'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-white/20 group-hover:text-white/35 transition-colors">
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <button
                    onClick={() => onSelectItem?.(item)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {timeChip(item.start_time, item.end_time)}
                      <span className="text-[10px] px-2 py-1 rounded-full bg-black/40 border border-white/10 text-white/40">
                        {item.type}
                      </span>
                    </div>

                    <div className="mt-2">
                      {editingItemId === item.id ? (
                        <input
                          autoFocus
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={commitEditing}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEditing()
                            if (e.key === 'Escape') setEditingItemId(null)
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40"
                        />
                      ) : (
                        <p className="text-sm text-white/80 font-medium truncate">
                          {item.title}
                        </p>
                      )}
                      {item.place?.country && (
                        <p className="text-xs text-white/35 truncate mt-0.5">
                          {item.place.country}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-white/40 line-clamp-2 mt-2">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </button>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(item)}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                      title="Edit title"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSwapItem?.(item)}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                      title="Swap this activity"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-300 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Dropzone after each item */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDropOnList(index + 1, e)}
                className="h-2 rounded-lg"
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {!isLoading && sortedItems.length === 0 && (
          <div className="mt-10 text-center">
            <p className="text-sm text-white/40">
              Ask the AI to build your day.
            </p>
            <p className="text-xs text-white/25 mt-2">
              Example: “Plan Day {selectedDay.day_index} around great food and neighborhoods.”
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
