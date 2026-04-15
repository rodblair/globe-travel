'use client'

import { motion } from 'motion/react'
import { Calendar, MapPin, Pencil, Trash2 } from 'lucide-react'

type JournalCardProps = {
  id: string
  title: string
  placeName?: string
  location?: string
  date: string
  visitedDate?: string
  mood?: string
  content: string
  tripTitle?: string
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function JournalCard({
  title,
  placeName,
  location,
  date,
  visitedDate,
  mood,
  content,
  tripTitle,
  onClick,
  onEdit,
  onDelete,
}: JournalCardProps) {
  const displayDate = visitedDate
    ? new Date(visitedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const displayLocation = location || (placeName && placeName !== 'Unknown Place' ? placeName : null)

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.18 }}
      className="group relative bg-white/[0.04] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 hover:bg-white/[0.06] transition-all duration-200"
    >
      <button className="w-full text-left p-5" onClick={onClick}>
        {/* Date + place row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-white/35">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="text-[11px]">{displayDate}</span>
          </div>
          {displayLocation && (
            <>
              <span className="text-white/15 text-[10px]">·</span>
              <div className="flex items-center gap-1 text-white/35 min-w-0">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="text-[11px] truncate">{displayLocation}</span>
              </div>
            </>
          )}
          {tripTitle && (
            <>
              <span className="text-white/15 text-[10px]">·</span>
              <span className="text-[11px] text-amber-400/60 truncate">{tripTitle}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-semibold text-white group-hover:text-amber-300/90 transition-colors leading-snug mb-2">
          {mood && <span className="mr-2 not-italic">{mood}</span>}
          {title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-white/45 line-clamp-3 leading-relaxed">
          {content}
        </p>
      </button>

      {/* Action buttons — visible on hover */}
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            className="p-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-white/40 hover:text-white transition-colors"
            title="Edit entry"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="p-1.5 rounded-lg bg-white/8 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
            title="Delete entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
