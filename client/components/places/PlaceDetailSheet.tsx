'use client'

import { X, Star, Calendar, MapPin, BookOpen, Edit3 } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

type PlaceDetail = {
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
  status: 'visited' | 'bucket_list' | 'planning'
  visit_date?: string
  rating?: number
  notes?: string
  photo_url?: string
}

type PlaceDetailSheetProps = {
  place: PlaceDetail | null
  isOpen: boolean
  onClose: () => void
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`}
        />
      ))}
    </div>
  )
}

export function PlaceDetailSheet({ place, isOpen, onClose }: PlaceDetailSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && place && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto"
          >
            <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Photo banner */}
              {place.photo_url ? (
                <div className="relative h-48 mx-4 mt-2 rounded-2xl overflow-hidden">
                  <img
                    src={place.photo_url}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : (
                <div className="relative h-32 mx-4 mt-2 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center">
                  <span className="text-5xl">{place.country ? getFlagEmoji(place.country) : '🌍'}</span>
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-serif font-semibold text-white">
                      {place.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-white/40" />
                      <span className="text-sm text-white/50">{place.country}</span>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      place.status === 'visited'
                        ? 'bg-amber-500/20 text-amber-400'
                        : place.status === 'bucket_list'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {place.status === 'visited'
                      ? 'Visited'
                      : place.status === 'bucket_list'
                      ? 'Bucket List'
                      : 'Planning'}
                  </span>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3">
                  {place.visit_date && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-white/40 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">Visited</span>
                      </div>
                      <p className="text-sm text-white">
                        {new Date(place.visit_date).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}
                  {place.rating && (
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-white/40 mb-1">
                        <Star className="w-3.5 h-3.5" />
                        <span className="text-xs">Rating</span>
                      </div>
                      <StarRating rating={place.rating} />
                    </div>
                  )}
                </div>

                {/* Notes */}
                {place.notes && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-white/70 leading-relaxed">{place.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm font-medium text-white transition-colors">
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm font-medium text-white transition-colors">
                    <BookOpen className="w-4 h-4" />
                    View Journal
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
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
