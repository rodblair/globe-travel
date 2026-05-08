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
      className="bg-paper-recessed backdrop-blur-sm border border-rule rounded-xl p-4 max-w-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-[var(--brass)] flex-shrink-0" />
            <h4 className="font-serif font-semibold text-foreground truncate">{name}</h4>
          </div>
          <p className="text-xs text-foreground/50 mb-2">{country}</p>
          {reason && <p className="text-xs text-foreground/70 line-clamp-2">{reason}</p>}
        </div>

        {onAdd && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--brass)] border border-[color:var(--brass)]/30 flex items-center justify-center text-[var(--brass)] hover:bg-[var(--brass)] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
