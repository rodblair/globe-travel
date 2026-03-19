'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GripVertical, Trash2, Pencil, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const sortedItems = useMemo(() => {
    if (!selectedDay) return []
    return [...(selectedDay.items || [])].sort((a, b) => a.order_index - b.order_index)
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

