'use client'

import Image from 'next/image'
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
      className="group relative rounded-2xl overflow-hidden bg-muted backdrop-blur-sm border border-border cursor-pointer"
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        {photo_url ? (
          <Image
            src={photo_url}
            alt={name}
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-paper-recessed to-white/[0.02] flex items-center justify-center">
            <span className="text-4xl">{getFlagEmoji(country)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
              status === 'visited'
                ? 'bg-primary/10 text-foreground'
                : status === 'bucket_list'
                ? 'bg-info/10 text-chart-2'
                : 'bg-primary/10 text-foreground'
            }`}
          >
            {status === 'visited' ? (
              <Check className="w-3 h-3" />
            ) : (
              <Heart className="w-3 h-3" />
            )}
            {status === 'visited' ? 'Visited' : status === 'bucket_list' ? 'Saved idea' : 'Planning'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {getFlagEmoji(country)} {country}
          </span>
        </div>

        {rating && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i <= rating ? 'text-primary fill-amber-400' : 'text-foreground/20'}`}
              />
            ))}
          </div>
        )}

        {reason && (
          <p className="text-sm text-muted-foreground line-clamp-2">{reason}</p>
        )}

        {status === 'bucket_list' && onPlanTrip && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPlanTrip()
            }}
            className="mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-info/10 border border-cyan-500/25 text-chart-2 text-xs font-medium hover:bg-info/10 transition-colors"
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
