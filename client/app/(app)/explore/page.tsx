'use client'

import { motion } from 'motion/react'
import { Compass, Sparkles, TrendingUp, BookOpen, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const trendingDestinations = [
  { name: 'Tokyo', country: 'Japan', emoji: '🇯🇵', description: 'Neon-lit streets meet ancient temples', query: 'Tell me about Tokyo, Japan — what makes it special and what are the best things to see and do there?' },
  { name: 'Santorini', country: 'Greece', emoji: '🇬🇷', description: 'Blue domes and Mediterranean sunsets', query: 'Tell me about Santorini, Greece — what makes it magical and what should I experience there?' },
  { name: 'Marrakech', country: 'Morocco', emoji: '🇲🇦', description: 'Spice markets and desert adventures', query: 'Tell me about Marrakech, Morocco — what makes it unique and what should I see there?' },
  { name: 'Reykjavik', country: 'Iceland', emoji: '🇮🇸', description: 'Northern lights and volcanic landscapes', query: 'Tell me about Reykjavik, Iceland — what makes it special and what are the best experiences there?' },
  { name: 'Kyoto', country: 'Japan', emoji: '🇯🇵', description: 'Bamboo forests and zen gardens', query: 'Tell me about Kyoto, Japan — what makes it so beautiful and what should I see and do there?' },
  { name: 'Lisbon', country: 'Portugal', emoji: '🇵🇹', description: 'Pastel tiles and coastal charm', query: 'Tell me about Lisbon, Portugal — what makes it charming and what are the best things to experience there?' },
  { name: 'Bali', country: 'Indonesia', emoji: '🇮🇩', description: 'Tropical temples and rice terraces', query: 'Tell me about Bali, Indonesia — what makes it so popular and what should I see and do there?' },
  { name: 'Dubrovnik', country: 'Croatia', emoji: '🇭🇷', description: 'Medieval walls above the Adriatic', query: 'Tell me about Dubrovnik, Croatia — what makes it stunning and what should I experience there?' },
  { name: 'Cape Town', country: 'South Africa', emoji: '🇿🇦', description: 'Mountains, ocean and vibrant culture', query: 'Tell me about Cape Town, South Africa — what makes it amazing and what are the best things to do there?' },
]

const collections = [
  { name: 'Hidden Gems in Southeast Asia', count: 12, emoji: '💎', query: 'Show me the best hidden gems and underrated destinations in Southeast Asia' },
  { name: 'Best Food Cities in the World', count: 15, emoji: '🍜', query: 'What are the best cities in the world for food lovers? Give me the top picks' },
  { name: 'Romantic Getaways', count: 8, emoji: '💕', query: 'Suggest the most romantic travel destinations for a couple — dreamy and unforgettable' },
  { name: 'Adventure & Adrenaline', count: 10, emoji: '🏔️', query: 'What are the best adventure travel destinations for thrill-seekers and outdoor lovers?' },
  { name: 'Budget-Friendly Europe', count: 14, emoji: '💰', query: 'What are the best budget-friendly European destinations that are beautiful but affordable?' },
  { name: 'Beaches You Must Visit', count: 9, emoji: '🏖️', query: 'What are the most stunning beach destinations in the world that everyone should visit?' },
]

const seasonalPicks = [
  { season: 'Spring', destinations: 'Cherry blossoms in Japan', emoji: '🌸', query: 'Where should I travel in spring to see cherry blossoms and enjoy the best spring weather?' },
  { season: 'Summer', destinations: 'Greek islands & Scandinavia', emoji: '☀️', query: 'What are the best summer travel destinations for beach lovers and outdoor explorers?' },
  { season: 'Autumn', destinations: 'New England & Kyoto', emoji: '🍁', query: 'Where should I travel in autumn to see the most beautiful fall foliage and scenery?' },
  { season: 'Winter', destinations: 'Christmas markets & ski resorts', emoji: '❄️', query: 'What are the best winter travel destinations for festive markets, skiing, and cozy vibes?' },
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

export default function ExplorePage() {
  const router = useRouter()

  const openChat = (query: string) => {
    const params = new URLSearchParams({ q: query })
    router.push(`/chat?${params.toString()}`)
  }

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
            <span className="text-xs text-white/30 ml-1">Click to explore with AI</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingDestinations.map((dest) => (
              <motion.button
                key={dest.name}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openChat(dest.query)}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-amber-500/30 hover:bg-white/[0.07] transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{dest.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-semibold text-white group-hover:text-amber-300 transition-colors">
                        {dest.name}
                      </h3>
                      <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-amber-400/60 transition-colors opacity-0 group-hover:opacity-100" />
                    </div>
                    <p className="text-sm text-white/40 mt-0.5">{dest.country}</p>
                    <p className="text-sm text-white/50 mt-2">{dest.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Seasonal Picks */}
        <motion.section {...fadeInUp}>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-lg">📅</span>
            <h2 className="text-xl font-serif font-semibold text-white">
              Travel by Season
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {seasonalPicks.map((pick) => (
              <motion.button
                key={pick.season}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openChat(pick.query)}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 cursor-pointer hover:border-amber-500/30 hover:bg-white/[0.07] transition-all text-left"
              >
                <div className="text-2xl mb-2">{pick.emoji}</div>
                <h3 className="font-semibold text-white text-sm group-hover:text-amber-300 transition-colors">
                  {pick.season}
                </h3>
                <p className="text-xs text-white/40 mt-1">{pick.destinations}</p>
              </motion.button>
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
            <span className="text-xs text-white/30 ml-1">Click to explore with AI</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((col) => (
              <motion.button
                key={col.name}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => openChat(col.query)}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-cyan-500/30 hover:bg-white/[0.07] transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{col.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white group-hover:text-cyan-300 transition-colors truncate">
                        {col.name}
                      </h3>
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">{col.count} destinations</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400/60 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100" />
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}
