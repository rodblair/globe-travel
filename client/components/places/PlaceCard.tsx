'use client'

import { motion } from 'motion/react'
import { MapPin, Star, Check, Heart, CalendarPlus } from 'lucide-react'

type PlaceCardProps = {
  name: string
  country: string
  status: 'visited' | 'bucket_list' | 'planning'
  photo_url?: string
  rating?: number
  reason?: string
  onClick?: () => void
  onPlanTrip?: () => void
}

function getFlagEmoji(country: string): string {
  const flags: Record<string, string> = {
    'Japan': '🇯🇵', 'France': '🇫🇷', 'Italy': '🇮🇹', 'Spain': '🇪🇸',
    'Germany': '🇩🇪', 'United Kingdom': '🇬🇧', 'United States': '🇺🇸',
    'Brazil': '🇧🇷', 'Australia': '🇦🇺', 'Thailand': '🇹🇭',
    'Mexico': '🇲🇽', 'India': '🇮🇳', 'China': '🇨🇳', 'Canada': '🇨🇦',
    'South Korea': '🇰🇷', 'Turkey': '🇹🇷', 'Greece': '🇬🇷',
    'Portugal': '🇵🇹', 'Morocco': '🇲🇦', 'Egypt': '🇪🇬',
  }
  return flags[country] || '🌍'
}

export function PlaceCard({ name, country, status, photo_url, rating, reason, onClick, onPlanTrip }: PlaceCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {photo_url ? (
          <img
            src={photo_url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
            <span className="text-4xl">{getFlagEmoji(country)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
              status === 'visited'
                ? 'bg-amber-500/30 text-amber-300'
                : status === 'bucket_list'
                ? 'bg-cyan-500/30 text-cyan-300'
                : 'bg-purple-500/30 text-purple-300'
            }`}
          >
            {status === 'visited' ? (
              <Check className="w-3 h-3" />
            ) : (
              <Heart className="w-3 h-3" />
            )}
            {status === 'visited' ? 'Visited' : status === 'bucket_list' ? 'Bucket List' : 'Planning'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-serif font-semibold text-white group-hover:text-amber-300 transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-white/40" />
          <span className="text-sm text-white/50">
            {getFlagEmoji(country)} {country}
          </span>
        </div>

        {rating && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
              />
            ))}
          </div>
        )}

        {reason && (
          <p className="text-sm text-white/40 line-clamp-2">{reason}</p>
        )}

        {status === 'bucket_list' && onPlanTrip && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPlanTrip()
            }}
            className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 text-xs font-medium hover:bg-cyan-500/25 transition-colors"
            title="Plan a trip here"
          >
            <CalendarPlus className="w-4 h-4" />
            Plan this trip
          </button>
        )}
      </div>
    </motion.div>
  )
}
