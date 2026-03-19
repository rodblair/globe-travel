'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-browser'
import { PlaceGrid } from '@/components/places/PlaceGrid'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, SortAsc, Heart, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

type SortKey = 'date' | 'country' | 'name'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'date', label: 'Date Added' },
  { key: 'country', label: 'Country' },
  { key: 'name', label: 'A-Z' },
]

export default function BucketListPage() {
  const router = useRouter()
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const supabase = createClient()

  const { data: userPlaces, isLoading } = useQuery({
    queryKey: ['user-places', 'bucket_list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_places')
        .select('*, place:places(*)')
        .eq('status', 'bucket_list')
        .order('created_at', { ascending: false })
      return data
    },
  })

  const places = useMemo(() => {
    if (!userPlaces) return []
    const mapped = userPlaces.map((up: any) => ({
      id: up.id,
      name: up.place?.name || 'Unknown',
      country: up.place?.country || '',
      status: up.status as 'visited' | 'bucket_list' | 'planning',
      photo_url: up.place?.photo_url,
      reason: up.notes,
      created_at: up.created_at,
    }))

    switch (sortBy) {
      case 'country':
        return mapped.sort((a: any, b: any) => a.country.localeCompare(b.country))
      case 'name':
        return mapped.sort((a: any, b: any) => a.name.localeCompare(b.name))
      default:
        return mapped
    }
  }, [userPlaces, sortBy])

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-semibold text-white flex items-center gap-3">
                <Heart className="w-7 h-7 text-cyan-400" />
                Bucket List
              </h1>
              <p className="text-white/50 mt-1">
                {places.length} {places.length === 1 ? 'dream destination' : 'dream destinations'}
              </p>
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white transition-colors"
              >
                <SortAsc className="w-4 h-4" />
                Sort
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden min-w-[140px]"
                  >
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSortBy(opt.key)
                          setShowSortMenu(false)
                        }}
                        className={cn(
                          'w-full px-4 py-2.5 text-sm text-left transition-colors',
                          sortBy === opt.key
                            ? 'text-cyan-400 bg-white/5'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : places.length === 0 ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-white mb-2">
              Your adventure list starts here
            </h2>
            <p className="text-white/50 max-w-md mb-8">
              Dream big. Add the places you want to explore. Ask our AI for ideas!
            </p>
            <Link
              href="/chat"
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              Ask AI for Ideas
            </Link>
          </motion.div>
        ) : (
          <PlaceGrid
            places={places}
            onPlanTrip={async (place) => {
              const res = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: `${place.name} Trip`,
                  constraints: { destination_query: `${place.name}, ${place.country}`, days: 4 },
                }),
              })
              if (!res.ok) return
              const json = await res.json()
              router.push(`/trips/${json.tripId}`)
            }}
          />
        )}
      </div>

      {/* Add to Bucket List FAB */}
      {places.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-24 md:bottom-8 right-6 z-20"
        >
          <Link
            href="/chat"
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-3 rounded-full shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Add to Bucket List</span>
          </Link>
        </motion.div>
      )}
    </div>
  )
}
