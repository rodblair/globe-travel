'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { Calendar, ArrowRight, Plus } from 'lucide-react'

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
                Trips
              </h1>
              <p className="text-white/50 mt-1">Your itineraries, built with AI</p>
            </div>
            <Link
              href="/trips/new"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-3 rounded-full transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Plan a New Trip</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-white/5 animate-pulse" />
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
              Plan your next adventure
            </h2>
            <p className="text-white/50 max-w-md mb-8">
              Create a trip, chat with your AI planner, and watch a live itinerary build itself.
            </p>
            <Link
              href="/trips/new"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105"
            >
              <ArrowRight className="w-5 h-5" />
              Start Planning
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trips.map((trip, idx) => (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-serif font-semibold text-white text-lg truncate group-hover:text-amber-300 transition-colors">
                      {trip.title}
                    </h3>
                    <p className="text-xs text-white/40 mt-1">
                      Updated {new Date(trip.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <Link
                    href={`/trips/${trip.id}`}
                    className="flex-shrink-0 inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                  <span className={`px-2 py-1 rounded-full border ${trip.is_public ? 'border-emerald-500/30 text-emerald-300' : 'border-white/10 text-white/40'} bg-black/40`}>
                    {trip.is_public ? 'Public' : 'Private'}
                  </span>
                  {(trip.start_date || trip.end_date) && (
                    <span className="text-white/30">
                      {trip.start_date ? new Date(trip.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      {' '}→{' '}
                      {trip.end_date ? new Date(trip.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

