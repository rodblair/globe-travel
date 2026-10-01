'use client'

import { motion } from 'motion/react'
import { Calendar, MapPin, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'

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
      className="group relative bg-muted/60 border border-border rounded-2xl overflow-hidden hover:border-border hover:bg-muted/60 transition-all duration-200"
    >
      <Button
        variant="ghost"
        className="h-auto w-full justify-start whitespace-normal rounded-none p-5 text-left hover:bg-transparent"
        onClick={onClick}
        aria-label={`Open ${title}`}
     >
        <div className="min-w-0 flex-1">
        {/* Date + place row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3 h-3 shrink-0" />
            <span className="text-xs">{displayDate}</span>
          </div>
          {displayLocation && (
            <>
              <span className="text-foreground/15 text-xs">·</span>
              <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="text-xs truncate">{displayLocation}</span>
              </div>
            </>
          )}
          {tripTitle && (
            <>
              <span className="text-foreground/15 text-xs">·</span>
              <span className="text-xs text-primary truncate">{tripTitle}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
          {mood && <span className="mr-2 not-italic">{mood}</span>}
          {title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {content}
        </p>
        </div>
      </Button>

      {/* Action buttons — visible on hover */}
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <IconButton
            label={`Edit ${title}`}
            onClick={(e) => { e.stopPropagation(); onEdit() }}
            variant="secondary"
            size="icon-sm"
            className="text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Pencil className="w-3.5 h-3.5" />
          </IconButton>
        )}
        {onDelete && (
          <IconButton
            label={`Delete ${title}`}
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            variant="secondary"
            size="icon-sm"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </IconButton>
        )}
      </div>
    </motion.div>
  )
}
