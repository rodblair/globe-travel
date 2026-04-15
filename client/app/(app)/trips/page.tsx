'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Calendar, ArrowRight, Plus, MapPin, Clock } from 'lucide-react'

type TripListItem = {
  id: string
  title: string
  share_slug: string | null
  is_public: boolean
  start_date: string | null
  end_date: string | null
  updated_at: string
  created_at: string
}

function extractTripInfo(title: string) {
  const dayMatch = title.match(/(\d+)[-\s]?[Dd]ay/)
  const days = dayMatch ? parseInt(dayMatch[1]) : null

  const destPatterns = [
    /^\d+\s+Days?\s+in\s+(.+?)(?:\s*[-–—].*)?$/i,
    /^(.+?)\s+in\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
    /^(.+?)\s+\d+[-\s]?[Dd]ay\s+Trip$/i,
    /^Trip to\s+(.+)$/i,
    /^(.+?)\s+(?:Food\s+)?Trip$/i,
  ]

  let destination: string | null = null
  for (const p of destPatterns) {
    const m = title.match(p)
    if (m?.[1]) {
      destination = m[1].trim()
      break
    }
  }

  return { days, destination: destination || title }
}

// Deterministic accent color based on destination name
function getAccentClass(title: string): { bg: string; border: string; text: string } {
  const hash = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const accents = [
    { bg: 'from-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
    { bg: 'from-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400' },
    { bg: 'from-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    { bg: 'from-violet-500/10', border: 'border-violet-500/20', text: 'text-violet-400' },
    { bg: 'from-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
    { bg: 'from-sky-500/10', border: 'border-sky-500/20', text: 'text-sky-400' },
  ]
  return accents[hash % accents.length]
}

export default function TripsPage() {
  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await fetch('/api/trips')
      if (!res.ok) return []
      return res.json() as Promise<TripListItem[]>
    },
  })

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-white flex items-center gap-3">
                <Calendar className="w-7 h-7 text-amber-400" />
                City Breaks
              </h1>
              <p className="text-white/50 mt-1">Weekend plans for you and your crew</p>
            </div>
            <Link
              href="/trips/new"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-3 rounded-full transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Plan a New Trip</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !trips || trips.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-white mb-2">
              Plan your next weekend away
            </h2>
            <p className="text-white/50 max-w-md mb-8">
              Start with a destination, add your group vibe, and let AI build a city-break itinerary everyone can react to.
            </p>
            <Link
              href="/trips/new"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105"
            >
              <ArrowRight className="w-5 h-5" />
              Start a City Break
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map((trip, idx) => {
              const { days, destination } = extractTripInfo(trip.title)
              const accent = getAccentClass(trip.title)

              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                >
                  <Link
                    href={`/trips/${trip.id}`}
                    className={`group block bg-gradient-to-br ${accent.bg} to-transparent bg-white/[0.03] backdrop-blur-sm border ${accent.border} rounded-2xl p-5 hover:bg-white/[0.06] transition-all duration-200`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <h3 className="font-serif font-semibold text-white text-lg leading-snug group-hover:text-amber-300 transition-colors">
                          {trip.title}
                        </h3>
                        {destination !== trip.title && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3 h-3 text-white/30" />
                            <span className="text-xs text-white/40">{destination}</span>
                          </div>
                        )}
                      </div>
                      <div className={`flex-shrink-0 flex items-center gap-1 ${accent.text} bg-white/5 rounded-full px-2.5 py-1`}>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {days && (
                        <span className="flex items-center gap-1.5 text-xs text-white/50 bg-white/5 rounded-full px-3 py-1">
                          <Clock className="w-3 h-3" />
                          {days} {days === 1 ? 'day' : 'days'}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full border text-xs ${
                        trip.is_public
                          ? 'border-emerald-500/30 text-emerald-300 bg-emerald-500/5'
                          : 'border-white/10 text-white/30 bg-black/20'
                      }`}>
                        {trip.is_public ? 'Public' : 'Private'}
                      </span>
                      {(trip.start_date || trip.end_date) && (
                        <span className="text-xs text-white/30 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {trip.start_date
                            ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '—'}
                          {' → '}
                          {trip.end_date
                            ? new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '—'}
                        </span>
                      )}
                    </div>

                    {/* Updated at */}
                    <p className="text-[11px] text-white/25 mt-3">
                      Updated {new Date(trip.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
