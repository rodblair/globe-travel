'use client'

import { motion } from 'motion/react'
import { Plus, MapPin } from 'lucide-react'

interface PlaceSuggestionCardProps {
  name: string
  country: string
  reason?: string
  onAdd?: () => void
}

export default function PlaceSuggestionCard({
  name,
  country,
  reason,
  onAdd,
}: PlaceSuggestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="bg-muted backdrop-blur-sm border border-border rounded-xl p-4 max-w-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
            <h4 className="font-semibold text-foreground truncate">{name}</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-2">{country}</p>
          {reason && <p className="text-xs text-muted-foreground line-clamp-2">{reason}</p>}
        </div>

        {onAdd && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-primary border border-primary/30 flex items-center justify-center text-primary hover:bg-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
