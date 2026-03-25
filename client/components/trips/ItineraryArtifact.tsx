'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GripVertical, Trash2, Pencil, Clock, Sparkles, Maximize2, Minimize2, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import TripDayMap from '@/components/trips/TripDayMap'
import { buildDisplayStops } from '@/components/trips/derivedStops'

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

  const dayMapCards = useMemo(() => {
    return days.map((day) => {
      const sortedDayItems = [...(day.items || [])].sort((a, b) => a.order_index - b.order_index)
      const displayStops = buildDisplayStops(sortedDayItems)
      const stops = displayStops.filter((stop) => stop.mapped)

      const routeGeojson = day.routes?.find((route) => route.mode === 'walk')?.geojson || day.routes?.[0]?.geojson || null
      const route = day.routes?.find((entry) => entry.mode === 'walk') || day.routes?.[0]
      const routeSummary = route?.distance_m && route?.duration_s
        ? `${Math.round(route.distance_m / 100) / 10} km • ${Math.round(route.duration_s / 60)} min walk`
        : null
      const subtitleParts = [day.date, `${stops.length} stop${stops.length === 1 ? '' : 's'}`].filter(Boolean)

      return {
        day,
        sortedItems: sortedDayItems,
        displayStops,
        stops,
        routeGeojson,
        subtitle: subtitleParts.join(' • '),
        routeSummary,
        stopPreview: displayStops.map((stop) => stop.title),
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

  const handleDragStart = (item: TripItem, fromDayIndex: number, e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      kind: 'trip_item',
      item_id: item.id,
      from_day_index: fromDayIndex,
    }))
    e.dataTransfer.effectAllowed = 'move'
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

    if (fromDayIndex !== dayIndex) {
      await onBulkOps([{ op: 'move', item_id: itemId, to_day_index: dayIndex, to_order_index: toIndex }])
      return
    }

    const ids = sortedDayItems.map((it) => it.id).filter((id) => id !== itemId)
    ids.splice(toIndex, 0, itemId)
    await onBulkOps([{ op: 'reorder', day_index: dayIndex, ordered_item_ids: ids }])
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
      <div className="flex-shrink-0 border-b border-white/12 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/38">Itinerary</p>
            <h2 className="truncate text-base font-medium text-white">{tripTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRegenerateDay?.(selectedDay.day_index)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/82 transition-colors hover:bg-white/12"
              title="Regenerate this day"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Regen
            </button>
          </div>
        </div>

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

        {selectedDayMap && (
          <div className="mt-4 rounded-[26px] border border-white/12 bg-white/[0.05] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Selected route</p>
                <p className="mt-1 truncate text-sm font-medium text-white">
                  Day {selectedDay.day_index} map
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/66 truncate">
                  {selectedDayMap.routeSummary ||
                    `${selectedDayMap.mappedStops.length} mapped stop${selectedDayMap.mappedStops.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <button
                onClick={() => setMapExpanded((current) => !current)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/82 transition-colors hover:bg-white/12"
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
                    'flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors',
                    stop.mapped
                      ? 'border-white/12 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
                      : 'border-amber-500/20 bg-amber-500/[0.06] hover:bg-amber-500/[0.1]'
                  )}
                >
                  <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/90 text-[11px] font-semibold text-black">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/38">
                      Stop {index + 1}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-medium text-white">{stop.title}</p>
                      {stop.timeLabel && (
                        <span className="rounded-full border border-white/12 bg-white/8 px-2 py-0.5 text-[10px] text-white/62">
                          {stop.timeLabel}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-white/62 truncate">
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

      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
        <AnimatePresence mode="popLayout">
          {dayMapCards.map(({ day, sortedItems, stops, routeGeojson, routeSummary, subtitle, stopPreview, displayStops }) => {
            const isSelectedDay = day.day_index === selectedDay.day_index

            return (
              <motion.section
                key={day.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className={cn('rounded-[28px] border p-4.5', isSelectedDay ? 'border-amber-400/28 bg-amber-400/[0.055]' : 'border-white/12 bg-white/[0.035]')}
              >
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => setSelectedDayIndex(day.day_index)} className="min-w-0 text-left">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">Day {day.day_index}</p>
                    <h3 className="mt-1 text-sm font-medium text-white">{day.title || `Itinerary for Day ${day.day_index}`}</h3>
                    <p className="mt-1 text-xs text-white/62">{subtitle || `${sortedItems.length} item${sortedItems.length === 1 ? '' : 's'}`}</p>
                  </button>
                  <button
                    onClick={() => onRegenerateDay?.(day.day_index)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/82 transition-colors hover:bg-white/12"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Regenerate day
                  </button>
                </div>

                <div className="mt-4">
                  <TripDayMap
                    stops={stops}
                    routeGeojson={routeGeojson}
                    title={`Day ${day.day_index}`}
                    subtitle={day.title}
                    routeSummary={routeSummary}
                    stopPreview={stopPreview}
                    showDetails={false}
                    active={isSelectedDay}
                    mapHeightClassName={isSelectedDay ? 'h-56' : 'h-44'}
                    className="min-w-0 overflow-hidden"
                    onClick={() => setSelectedDayIndex(day.day_index)}
                  />
                </div>

                {displayStops.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {displayStops.map((stop, index) => (
                      <button
                        key={stop.id}
                        onClick={() => onSelectItem?.(stop.item)}
                        className={cn(
                          'flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors',
                          stop.mapped
                            ? 'border-white/12 bg-white/[0.05] hover:border-white/22 hover:bg-white/[0.07]'
                            : 'border-amber-500/20 bg-amber-500/[0.06] hover:bg-amber-500/[0.1]'
                        )}
                      >
                        <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-400/90 text-[11px] font-semibold text-black">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-[0.16em] text-white/38">
                            Stop {index + 1}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-medium text-white">{stop.title}</p>
                            {stop.timeLabel && (
                              <span className="rounded-full border border-white/12 bg-white/8 px-2 py-0.5 text-[10px] text-white/62">
                                {stop.timeLabel}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-white/62 truncate">
                            {stop.placeName || 'No pinned place yet'}
                            {stop.country ? ` • ${stop.country}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnList(day.day_index, sortedItems, 0, e)}
                    className="h-2 rounded-lg"
                  />

                  {sortedItems.map((item, index) => (
                    <div key={item.id}>
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(item, day.day_index, e)}
                        onDragOver={(e) => {
                          e.preventDefault()
                          setSelectedDayIndex(day.day_index)
                          setDragOverItemId(item.id)
                        }}
                        onDragLeave={() => {
                          setDragOverItemId((prev) => (prev === item.id ? null : prev))
                        }}
                        onDrop={(e) => handleDropOnList(day.day_index, sortedItems, index, e)}
                        className={cn(
                          'group rounded-2xl border p-3 transition-colors',
                          dragOverItemId === item.id ? 'border-amber-400/35 bg-amber-400/[0.08]' : 'border-white/12 bg-white/8 hover:border-white/22'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-white/20 group-hover:text-white/35 transition-colors">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          <button
                            onClick={() => {
                              setSelectedDayIndex(day.day_index)
                              onSelectItem?.(item)
                            }}
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
                                <p className="truncate text-sm font-medium text-white">
                                  {item.title}
                                </p>
                              )}
                              {item.place?.country && (
                                <p className="mt-0.5 truncate text-xs text-white/55">
                                  {item.place.country}
                                </p>
                              )}
                              {item.notes && (
                                <p className="mt-2 line-clamp-2 text-xs text-white/62">
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

                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropOnList(day.day_index, sortedItems, index + 1, e)}
                        className="h-2 rounded-lg"
                      />
                    </div>
                  ))}
                </div>

                {!isLoading && sortedItems.length === 0 && (
                  <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-5 text-center">
                    <p className="text-sm text-white/40">Ask the AI to build this day.</p>
                    <p className="mt-2 text-xs text-white/25">
                      Example: “Plan Day {day.day_index} around great food and neighborhoods.”
                    </p>
                  </div>
                )}
              </motion.section>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
