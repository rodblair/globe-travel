'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ArrowRight, Plus, MapPin, Clock, Users, Sparkles } from 'lucide-react'

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

  const tripCount = trips?.length || 0
  const publicCount = trips?.filter((trip) => trip.is_public).length || 0
  const latestTrip = trips?.[0]

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.11),transparent_30%),linear-gradient(180deg,#050505,#020202)]">
      <div className="mx-auto max-w-6xl px-5 py-7 md:px-8 md:py-10">
        <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.32)] md:p-8">
          <div className="absolute right-0 top-0 h-56 w-56 translate-x-16 -translate-y-20 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                <Calendar className="h-3.5 w-3.5" />
                Trip board
              </div>
              <h1 className="font-serif text-4xl leading-[0.98] text-white md:text-6xl">
                Make the next yes easy.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/52 md:text-base">
                Keep every city break in one place: draft the plan, share it with friends,
                and come back when the group is ready to commit.
              </p>
            </div>
            <div className="grid min-w-[260px] grid-cols-3 gap-2">
              {[
                { label: 'Plans', value: tripCount },
                { label: 'Shared', value: publicCount },
                { label: 'Drafts', value: Math.max(tripCount - publicCount, 0) },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-black/24 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{stat.label}</p>
                  <p className="mt-2 font-serif text-3xl text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/12"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              Start in Planner
            </Link>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-amber-400"
            >
              <Plus className="h-4 w-4" />
              New Trip
            </Link>
          </div>
        </section>

        <div className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-52 rounded-[28px] bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !trips || trips.length === 0 ? (
          <div className="rounded-[34px] border border-white/10 bg-white/[0.035] px-6 py-20 text-center">
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
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            {trips.map((trip, idx) => {
              const { days, destination } = extractTripInfo(trip.title)
              const accent = getAccentClass(trip.title)

              return (
                <div key={trip.id}>
                  <Link
                    href={`/trips/${trip.id}`}
                    className={`group block min-h-52 bg-gradient-to-br ${accent.bg} to-transparent bg-white/[0.035] backdrop-blur-sm border ${accent.border} rounded-[30px] p-6 hover:bg-white/[0.065] transition-all duration-200 ${idx === 0 ? 'lg:min-h-[420px]' : ''}`}
                  >
                    <div className="flex h-full flex-col justify-between gap-8">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/32">
                          {idx === 0 ? 'Most recent plan' : 'Saved plan'}
                        </p>
                        <h3 className={`${idx === 0 ? 'text-4xl md:text-5xl' : 'text-2xl'} font-serif font-semibold text-white leading-tight group-hover:text-amber-200 transition-colors`}>
                          {trip.title}
                        </h3>
                        {destination !== trip.title && (
                          <div className="mt-4 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-white/36" />
                            <span className="text-sm text-white/46">{destination}</span>
                          </div>
                        )}
                      </div>
                      <div className={`flex-shrink-0 flex items-center gap-1 ${accent.text} bg-white/7 rounded-full px-3 py-2`}>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {days && (
                        <span className="flex items-center gap-1.5 text-xs text-white/58 bg-white/7 rounded-full px-3 py-1.5">
                          <Clock className="w-3 h-3" />
                          {days} {days === 1 ? 'day' : 'days'}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-xs text-white/58 bg-white/7 rounded-full px-3 py-1.5">
                        <Users className="w-3 h-3" />
                        Crew plan
                      </span>
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

                    <p className="text-[11px] text-white/25 mt-3">
                      Updated {new Date(trip.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    </div>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
        {latestTrip && (
          <div className="mt-5 rounded-[28px] border border-white/10 bg-white/[0.025] p-5 text-sm text-white/48">
            Next best action: open <span className="text-white/78">{latestTrip.title}</span>, build maps, then share the review link with the group.
          </div>
        )}
        </div>
      </div>
    </div>
  )
}
