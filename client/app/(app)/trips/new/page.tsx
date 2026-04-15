'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { MapPin, ArrowRight, Sparkles, Users, Wallet, Plane } from 'lucide-react'
import Link from 'next/link'

const DAY_PRESETS = [2, 3, 4, 5]
const GROUP_PRESETS = [2, 3, 4, 6]
const BUDGET_OPTIONS = [
  { value: 'budget', label: 'Budget-friendly' },
  { value: 'mid', label: 'Comfortable' },
  { value: 'luxury', label: 'Treat ourselves' },
] as const
const VIBE_OPTIONS = [
  'Food and wine',
  'Walkable highlights',
  'Design and culture',
  'Nightlife energy',
  'Relaxed and cute',
]

export default function NewTripPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(3)
  const [groupSize, setGroupSize] = useState(4)
  const [originCity, setOriginCity] = useState('')
  const [budget, setBudget] = useState<(typeof BUDGET_OPTIONS)[number]['value']>('mid')
  const [vibe, setVibe] = useState(VIBE_OPTIONS[0])
  const [creating, setCreating] = useState(false)

  const resolvedDestination = destination.trim() || title.trim()
  const resolvedTitle = title.trim() || (resolvedDestination ? `${days} Days in ${resolvedDestination}` : '')
  const canCreate = resolvedDestination.length > 0 && !creating

  const handleCreate = async () => {
    if (!canCreate) return
    setCreating(true)

    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: resolvedTitle,
        travelers_count: groupSize,
        budget_level: budget,
        constraints: {
          destination_query: resolvedDestination || undefined,
          days,
          origin_city: originCity.trim() || undefined,
          group_vibe: vibe,
        },
      }),
    })

    if (!res.ok) {
      setCreating(false)
      return
    }

    const json = await res.json()
    const groupBrief = {
      groupSize,
      originCity: originCity.trim(),
      budget,
      vibe,
      days,
      destination: resolvedDestination,
    }
    const autoPrompt = `Plan a ${days}-day short city break in ${resolvedDestination} for ${groupSize} friends. The group is leaving from ${originCity.trim() || 'the same departure city'}. Budget level: ${budget}. Primary vibe: ${vibe}. Build a realistic itinerary with specific neighborhoods, meals, and standout moments that work well for a friend group. Include real place names with timing and keep the pacing practical for a shared weekend.`
    router.push(`/trips/${json.tripId}?prompt=${encodeURIComponent(autoPrompt)}&brief=${encodeURIComponent(JSON.stringify(groupBrief))}`)
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back link */}
        <Link href="/trips" className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors mb-10 group">
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Trips
        </Link>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-serif font-semibold text-white leading-tight">
            Plan a group city break
          </h1>
          <p className="text-white/40 mt-3 text-base leading-relaxed">
            Set the destination, crew vibe, and budget. We&apos;ll turn it into a weekend plan your friends can actually agree on.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-10 space-y-7"
        >
          {/* Trip title */}
          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3 block">
              Trip Title <span className="normal-case text-white/20">— optional</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Lisbon girls weekend"
              autoFocus
              className="w-full px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-lg placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/10 transition-all"
            />
            <p className="mt-2 text-xs text-white/28">
              If you leave this blank, we&apos;ll generate a title from the destination.
            </p>
          </div>

          {/* Destination */}
          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3 block">
              Destination
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-white/25 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Copenhagen, Denmark"
                className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 text-base focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/10 transition-all"
              />
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3 block">
              Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {DAY_PRESETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    days === d
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                >
                  {d} {d === 1 ? 'day' : 'days'}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-white/30">Custom:</span>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Math.min(30, Math.max(1, parseInt(e.target.value || '1', 10))))}
                className="w-20 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/40 transition-all text-center"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3 block">
                Crew size
              </label>
              <div className="flex flex-wrap gap-2">
                {GROUP_PRESETS.map((size) => (
                  <button
                    key={size}
                    onClick={() => setGroupSize(size)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      groupSize === size
                        ? 'bg-amber-500 text-black'
                        : 'bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.07]'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3 block">
                Budget
              </label>
              <div className="grid gap-2">
                {BUDGET_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBudget(option.value)}
                    className={`inline-flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-all ${
                      budget === option.value
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                        : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span>{option.label}</span>
                    <Wallet className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3 block">
                Leaving from <span className="normal-case text-white/20">— optional</span>
              </label>
              <div className="relative">
                <Plane className="w-4 h-4 text-white/25 absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  placeholder="London"
                  className="w-full pl-12 pr-5 py-4 rounded-2xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/20 text-base focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-white/40 uppercase tracking-widest mb-3 block">
                Group vibe
              </label>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setVibe(option)}
                    className={`px-4 py-2.5 rounded-xl text-sm transition-all ${
                      vibe === option
                        ? 'bg-white text-black'
                        : 'bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-2 space-y-3">
            <button
              onClick={handleCreate}
              disabled={!canCreate}
              className="w-full flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-[1.01] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {creating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Create Group Break
                </>
              )}
            </button>

            <p className="text-center text-xs text-white/25 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              We&apos;ll open a live planner tuned for your group, budget, and weekend vibe
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
