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
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 max-w-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <h4 className="font-serif font-semibold text-white truncate">{name}</h4>
          </div>
          <p className="text-xs text-white/50 mb-2">{country}</p>
          {reason && <p className="text-xs text-white/70 line-clamp-2">{reason}</p>}
        </div>

        {onAdd && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdd}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 hover:bg-amber-500/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
