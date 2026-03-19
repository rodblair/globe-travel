'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-browser'
import { TravelMap } from '@/components/map/TravelMap'
import { PlaceDetailSheet } from '@/components/places/PlaceDetailSheet'
import { motion } from 'motion/react'
import { Plus, Filter } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const filters = [
  { key: 'all', label: 'All' },
  { key: 'visited', label: 'Visited' },
  { key: 'bucket_list', label: 'Bucket List' },
  { key: 'planning', label: 'Planning' },
] as const

type FilterKey = (typeof filters)[number]['key']

export default function MapPage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [selectedPlace, setSelectedPlace] = useState<any>(null)
  const supabase = createClient()

  const { data: userPlaces } = useQuery({
    queryKey: ['user-places'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_places')
        .select('*, place:places(*)')
        .order('created_at', { ascending: false })
      return data
    },
  })

  const places = useMemo(() => {
    if (!userPlaces) return []
    return userPlaces
      .filter((up: any) => up.place?.latitude && up.place?.longitude)
      .map((up: any) => ({
        id: up.id,
        name: up.place.name,
        country: up.place.country || '',
        latitude: up.place.latitude,
        longitude: up.place.longitude,
        status: up.status,
        visit_date: up.visit_date,
        rating: up.rating,
        notes: up.notes,
        photo_url: up.place.photo_url,
      }))
  }, [userPlaces])

  const filteredPlaces = useMemo(() => {
    if (activeFilter === 'all') return places
    return places.filter((p) => p.status === activeFilter)
  }, [places, activeFilter])

  return (
    <div className="relative w-full h-full min-h-screen bg-black">
      {/* Map */}
      <div className="absolute inset-0">
        <TravelMap
          places={filteredPlaces}
          onMarkerClick={(place) => setSelectedPlace(place)}
        />
      </div>

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:right-auto"
      >
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-lg border border-white/10 rounded-full px-2 py-1.5">
          <Filter className="w-4 h-4 text-white/40 ml-2" />
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                activeFilter === f.key
                  ? 'bg-white/15 text-white'
                  : 'text-white/50 hover:text-white/80'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Place count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-20 md:top-4 left-4 md:left-4"
      >
        <div className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl px-4 py-2">
          <span className="text-sm text-white/60">
            {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'}
          </span>
        </div>
      </motion.div>

      {/* Add Place button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-24 md:bottom-8 right-6"
      >
        <Link
          href="/chat"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-3 rounded-full shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Add Place</span>
        </Link>
      </motion.div>

      {/* Place detail sheet */}
      <PlaceDetailSheet
        place={selectedPlace}
        isOpen={!!selectedPlace}
        onClose={() => setSelectedPlace(null)}
      />
    </div>
  )
}
