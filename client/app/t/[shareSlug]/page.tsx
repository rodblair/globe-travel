'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Calendar, Lock, Globe2, MessageSquareQuote, Send, Sparkles } from 'lucide-react'
import type { TripDay } from '@/components/trips/ItineraryArtifact'
import { cn } from '@/lib/utils'
import { QueryProvider } from '@/components/providers/QueryProvider'

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

type TripFeedback = {
  id: string
  author_name: string
  sentiment: 'love_it' | 'curious' | 'practical'
  comment: string
  created_at: string
}

const sentimentOptions = [
  { value: 'love_it', label: 'Love it' },
  { value: 'curious', label: 'Curious' },
  { value: 'practical', label: 'Practical note' },
] as const

const sentimentClasses: Record<TripFeedback['sentiment'], string> = {
  love_it: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  curious: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
  practical: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
}

function SharedTripPageInner() {
  const params = useParams<{ shareSlug: string }>()
  const shareSlug = params.shareSlug
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [sentiment, setSentiment] = useState<(typeof sentimentOptions)[number]['value']>('love_it')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['trip-share', shareSlug],
    queryFn: async () => {
      const res = await fetch(`/api/trips/share/${shareSlug}`)
      if (!res.ok) throw new Error('Not found')
      return res.json() as Promise<TripPayload>
    },
  })

  const { data: feedback = [], refetch: refetchFeedback } = useQuery({
    queryKey: ['trip-share-feedback', shareSlug],
    queryFn: async () => {
      const res = await fetch(`/api/trips/share/${shareSlug}/feedback`)
      if (!res.ok) return [] as TripFeedback[]
      return res.json() as Promise<TripFeedback[]>
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

  const submitFeedback = async () => {
    if (!authorName.trim() || comment.trim().length < 8 || submitting) return
    setSubmitting(true)
    const res = await fetch(`/api/trips/share/${shareSlug}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author_name: authorName.trim(),
        author_email: authorEmail.trim(),
        sentiment,
        comment: comment.trim(),
      }),
    })

    if (res.ok) {
      setComment('')
      setAuthorEmail('')
      await refetchFeedback()
    }
    setSubmitting(false)
  }

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
            View-only for itinerary editing, open for feedback
          </p>
        </motion.div>

        <div className="mt-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          <div className="space-y-6">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/25">Review this trip</p>
                  <h2 className="mt-1 text-lg font-serif text-white">Tell your friend what you would change</h2>
                  <p className="text-sm text-white/45 mt-2">
                    Point out anything too packed, anything missing, or the parts you would definitely keep.
                  </p>
                </div>
                <MessageSquareQuote className="w-5 h-5 text-white/25 flex-shrink-0" />
              </div>

              <div className="mt-4 space-y-3">
                <input
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-500/35"
                />
                <input
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-500/35"
                />
                <div className="flex flex-wrap gap-2">
                  {sentimentOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSentiment(option.value)}
                      className={cn(
                        'px-3 py-2 rounded-xl border text-xs transition-colors',
                        sentiment === option.value
                          ? sentimentClasses[option.value]
                          : 'border-white/10 bg-white/5 text-white/45 hover:text-white/70'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  placeholder="Example: Day 2 looks too packed. I would skip one museum and leave more room for dinner around Shibuya."
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:border-amber-500/35 leading-relaxed"
                />
                <button
                  onClick={submitFeedback}
                  disabled={!authorName.trim() || comment.trim().length < 8 || submitting}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 text-black text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Sending...' : 'Send review'}
                </button>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/25">Start your own trip</p>
                  <h2 className="mt-1 text-lg font-serif text-white">Use this as inspiration</h2>
                  <p className="text-sm text-white/45 mt-2">
                    Build your own version, change the pace, and share it back.
                  </p>
                </div>
                <Sparkles className="w-5 h-5 text-white/25 flex-shrink-0" />
              </div>
              <Link
                href="/signup"
                className="mt-4 inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                Create your own itinerary
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
              <p className="text-[10px] uppercase tracking-wider text-white/25">Friend reviews</p>
              <h2 className="mt-1 text-lg font-serif text-white">
                {feedback.length} {feedback.length === 1 ? 'review' : 'reviews'}
              </h2>
              <div className="mt-4 space-y-3 max-h-[420px] overflow-y-auto">
                {feedback.length === 0 ? (
                  <p className="text-sm text-white/40">
                    No reviews yet. Be the first to leave practical feedback.
                  </p>
                ) : (
                  feedback.map((entry) => (
                    <div key={entry.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm text-white/75 font-medium truncate">{entry.author_name}</p>
                        <span className={cn('px-2 py-1 rounded-full border text-[10px]', sentimentClasses[entry.sentiment])}>
                          {sentimentOptions.find((option) => option.value === entry.sentiment)?.label}
                        </span>
                      </div>
                      <p className="text-xs text-white/50 mt-3 leading-relaxed">{entry.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

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

export default function SharedTripPage() {
  return (
    <QueryProvider>
      <SharedTripPageInner />
    </QueryProvider>
  )
}
