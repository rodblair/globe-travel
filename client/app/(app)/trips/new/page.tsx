'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react'

export default function NewTripPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(4)
  const [creating, setCreating] = useState(false)

  const canCreate = title.trim().length > 0 && !creating

  const handleCreate = async () => {
    if (!canCreate) return
    setCreating(true)

    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), constraints: { destination_query: destination.trim() || undefined, days } }),
    })

    if (!res.ok) {
      setCreating(false)
      return
    }

    const json = await res.json()
    router.push(`/trips/${json.tripId}`)
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-serif font-semibold text-white flex items-center gap-3">
            <Calendar className="w-7 h-7 text-amber-400" />
            Plan a New Trip
          </h1>
          <p className="text-white/50 mt-2">
            Start with a title, then let the AI build your itinerary as you chat.
          </p>
        </motion.div>

        <div className="mt-10 space-y-6">
          <div>
            <label className="text-sm text-white/50 mb-2 block">Trip title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tokyo in April"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all"
            />
          </div>

          <div>
            <label className="text-sm text-white/50 mb-2 block">Destination (optional)</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Tokyo, Japan"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/50 mb-2 block">Length (days)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value || '4', 10))}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all"
              />
              <p className="text-xs text-white/30 mt-2">
                You can add/remove days later.
              </p>
            </div>
            <div>
              <label className="text-sm text-white/50 mb-2 block">Travelers</label>
              <div className="relative">
                <Users className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value="1"
                  readOnly
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 text-sm"
                />
              </div>
              <p className="text-xs text-white/30 mt-2">v1 is solo-first.</p>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3.5 rounded-2xl transition-all duration-200 hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-5 h-5" />
            {creating ? 'Creating…' : 'Create Trip'}
          </button>
        </div>
      </div>
    </div>
  )
}

