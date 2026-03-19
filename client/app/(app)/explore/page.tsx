'use client'

import { motion } from 'motion/react'
import { Compass, Sparkles, TrendingUp, Heart, BookOpen } from 'lucide-react'
import Link from 'next/link'

const trendingDestinations = [
  { name: 'Tokyo', country: 'Japan', emoji: '🇯🇵', description: 'Neon-lit streets meet ancient temples', image: null },
  { name: 'Santorini', country: 'Greece', emoji: '🇬🇷', description: 'Blue domes and Mediterranean sunsets', image: null },
  { name: 'Marrakech', country: 'Morocco', emoji: '🇲🇦', description: 'Spice markets and desert adventures', image: null },
  { name: 'Reykjavik', country: 'Iceland', emoji: '🇮🇸', description: 'Northern lights and volcanic landscapes', image: null },
  { name: 'Kyoto', country: 'Japan', emoji: '🇯🇵', description: 'Bamboo forests and zen gardens', image: null },
  { name: 'Lisbon', country: 'Portugal', emoji: '🇵🇹', description: 'Pastel tiles and coastal charm', image: null },
]

const collections = [
  { name: 'Hidden Gems in Southeast Asia', count: 12, emoji: '💎' },
  { name: 'Best Food Cities in the World', count: 15, emoji: '🍜' },
  { name: 'Romantic Getaways', count: 8, emoji: '💕' },
  { name: 'Adventure & Adrenaline', count: 10, emoji: '🏔️' },
  { name: 'Budget-Friendly Europe', count: 14, emoji: '💰' },
  { name: 'Beaches You Must Visit', count: 9, emoji: '🏖️' },
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-serif font-semibold text-white flex items-center gap-3">
            <Compass className="w-7 h-7 text-amber-400" />
            Explore
          </h1>
          <p className="text-white/50 mt-1">Discover your next adventure</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-12">
        {/* Ask AI CTA */}
        <motion.div {...fadeInUp}>
          <Link href="/chat" className="block group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-cyan-500/10 border border-amber-500/20 p-8 md:p-10 hover:border-amber-500/40 transition-all duration-300">
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
                <Sparkles className="w-24 h-24 text-amber-400" />
              </div>
              <div className="relative">
                <h2 className="text-2xl md:text-3xl font-serif font-semibold text-white mb-2">
                  Not sure where to go next?
                </h2>
                <p className="text-white/60 max-w-lg mb-6">
                  Chat with our AI travel advisor. It knows your style and will suggest
                  destinations you will love.
                </p>
                <span className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-full transition-all duration-200 group-hover:scale-105">
                  <Sparkles className="w-5 h-5" />
                  Ask AI for Recommendations
                </span>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Trending Destinations */}
        <motion.section {...fadeInUp}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-serif font-semibold text-white">
              Trending Destinations
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingDestinations.map((dest, i) => (
              <motion.div
                key={dest.name}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-white/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{dest.emoji}</span>
                  <div>
                    <h3 className="font-serif font-semibold text-white group-hover:text-amber-300 transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-sm text-white/40 mt-0.5">{dest.country}</p>
                    <p className="text-sm text-white/50 mt-2">{dest.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Collections */}
        <motion.section {...fadeInUp}>
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-serif font-semibold text-white">
              Curated Collections
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col) => (
              <motion.div
                key={col.name}
                whileHover={{ scale: 1.02, y: -2 }}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{col.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white group-hover:text-amber-300 transition-colors truncate">
                      {col.name}
                    </h3>
                    <p className="text-xs text-white/40 mt-0.5">{col.count} places</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Recommended */}
        <motion.section {...fadeInUp}>
          <div className="flex items-center gap-2 mb-6">
            <Heart className="w-5 h-5 text-rose-400" />
            <h2 className="text-xl font-serif font-semibold text-white">
              Recommended for You
            </h2>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-white/40 mb-4">
              Add some places to your globe and we will recommend destinations you will love.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Tell our AI about your travels
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
