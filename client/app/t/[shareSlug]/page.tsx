'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import dynamic from 'next/dynamic'
import { Calendar, Lock, Globe2 } from 'lucide-react'
import type { TripDay } from '@/components/trips/ItineraryArtifact'

const TripGlobe = dynamic(() => import('@/components/globes/TripGlobe'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#050510]" />,
})

type Trip = {
  id: string
  title: string
  is_public: boolean
  share_slug: string
}

type TripPayload = {
  trip: Trip
  days: TripDay[]
}

export default function SharedTripPage() {
  const params = useParams<{ shareSlug: string }>()
  const shareSlug = params.shareSlug

  const { data, isLoading } = useQuery({
    queryKey: ['trip-share', shareSlug],
    queryFn: async () => {
      const res = await fetch(`/api/trips/share/${shareSlug}`)
      if (!res.ok) throw new Error('Not found')
      return res.json() as Promise<TripPayload>
    },
  })

  const trip = data?.trip
  const days = data?.days || []

  const firstDay = days[0]
  const firstStops = (firstDay?.items || [])
    .filter((it: any) => it.place?.latitude && it.place?.longitude)
    .sort((a: any, b: any) => a.order_index - b.order_index)
    .map((it: any, idx: number) => ({
      id: it.id,
      title: it.place?.name || it.title,
      latitude: it.place?.latitude || 0,
      longitude: it.place?.longitude || 0,
      index: idx + 1,
    }))

  const firstRouteGeojson = firstDay?.routes?.find((r) => r.mode === 'walk')?.geojson || null

  return (
    <div className="relative min-h-screen bg-[#050510] overflow-hidden">
      <div className="absolute inset-0">
        <TripGlobe stops={firstStops} routeGeojson={firstRouteGeojson} className="w-full h-full" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-xs text-white/50">
            <Globe2 className="w-4 h-4 text-amber-400/70" />
            Shared itinerary
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-serif font-semibold text-white">
            {trip?.title || 'Trip'}
          </h1>
          <p className="text-white/45 mt-2 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-white/30" />
            View-only
          </p>
        </motion.div>

        <div className="mt-10 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            days.map((day) => (
              <div key={day.id} className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-white/25">
                      Day {day.day_index}
                    </p>
                    <h2 className="text-sm font-medium text-white/80 truncate">
                      {day.title || 'Itinerary'}
                    </h2>
                  </div>
                  {day.date && (
                    <div className="text-xs text-white/35 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/25" />
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-2">
                  {(day.items || [])
                    .sort((a: any, b: any) => a.order_index - b.order_index)
                    .map((item: any) => (
                      <div key={item.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-white/80 font-medium truncate">{item.title}</p>
                            {item.place?.country && (
                              <p className="text-xs text-white/35 truncate mt-1">{item.place.country}</p>
                            )}
                          </div>
                          <span className="text-[10px] px-2 py-1 rounded-full bg-black/40 border border-white/10 text-white/40">
                            {item.type}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-white/45 mt-3 leading-relaxed">{item.notes}</p>
                        )}
                      </div>
                    ))}
                  {day.items?.length === 0 && (
                    <p className="text-sm text-white/40">No items yet.</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

