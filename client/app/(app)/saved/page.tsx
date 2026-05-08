'use client'

import Link from 'next/link'
import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import {
  BookOpen,
  Calendar,
  ArrowRight,
  Feather,
  MapPin,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
  Clock,
  Users,
  Zap,
} from 'lucide-react'
import { JournalCard } from '@/components/journal/JournalCard'
import { JournalEditor, type JournalEntryFields } from '@/components/journal/JournalEditor'
import { UpgradeModal } from '@/components/billing/UpgradeModal'
import { useSubscription } from '@/hooks/useSubscription'
import { PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'

type SavedTab = 'trips' | 'journal'

type JournalEntry = {
  id: string
  title: string
  content: string
  mood?: string
  location?: string
  visited_date?: string
  created_at: string
  user_place_id?: string
  trip_id?: string
  user_place?: { place?: { name: string } }
  trip?: { id: string; title: string }
}

type SavedTrip = {
  id: string
  title: string
  share_slug: string | null
  is_public: boolean
  start_date: string | null
  end_date: string | null
  updated_at: string
  created_at: string
}

type JournalTripOption = { id: string; title: string }

const tabs: { key: SavedTab; label: string; icon: typeof Calendar }[] = [
  { key: 'trips', label: 'Trips', icon: Calendar },
  { key: 'journal', label: 'Journal', icon: BookOpen },
]

function normalizeTab(value: string | null): SavedTab {
  if (value === 'journal') return value
  return 'trips'
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
  for (const pattern of destPatterns) {
    const match = title.match(pattern)
    if (match?.[1]) {
      destination = match[1].trim()
      break
    }
  }

  return { days, destination: destination || title }
}

function SavedPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = normalizeTab(searchParams.get('tab'))
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [readingEntry, setReadingEntry] = useState<JournalEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const queryClient = useQueryClient()
  const { isPro } = useSubscription()
  const FREE_LIMIT = PLANS.free.limits.journalEntries

  const { data: entries = [], isLoading: journalLoading } = useQuery<JournalEntry[]>({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const res = await fetch('/api/journal')
      if (!res.ok) throw new Error('Failed to load entries')
      return res.json()
    },
  })

  const { data: trips = [], isLoading: tripsLoading } = useQuery<SavedTrip[]>({
    queryKey: ['saved-trips'],
    queryFn: async () => {
      const res = await fetch('/api/trips', { cache: 'no-store' })
      if (!res.ok) return [] as SavedTrip[]
      return res.json() as Promise<SavedTrip[]>
    },
  })

  const journalTrips = useMemo<JournalTripOption[]>(
    () => trips.map((trip) => ({ id: trip.id, title: trip.title })),
    [trips]
  )

  const createEntry = useMutation({
    mutationFn: async (entry: JournalEntryFields) => {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal-entries'] }),
  })

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...entry }: JournalEntryFields & { id: string }) => {
      const res = await fetch('/api/journal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...entry }),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journal-entries'] }),
  })

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/journal?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      setDeletingId(null)
      setReadingEntry(null)
    },
  })

  const switchTab = (tab: SavedTab) => {
    const next = new URLSearchParams(searchParams.toString())
    if (tab === 'trips') {
      next.delete('tab')
    } else {
      next.set('tab', tab)
    }
    const query = next.toString()
    router.replace(query ? `/saved?${query}` : '/saved')
  }

  const handleSave = async (fields: JournalEntryFields) => {
    if (editingEntry) {
      await updateEntry.mutateAsync({ id: editingEntry.id, ...fields })
      return
    }
    await createEntry.mutateAsync(fields)
  }

  const openNewEntry = () => {
    if (!isPro && entries.length >= FREE_LIMIT) {
      setUpgradeOpen(true)
      return
    }
    setEditingEntry(null)
    setEditorOpen(true)
  }

  const openEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setReadingEntry(null)
    setEditorOpen(true)
  }

  const formatEntryDate = (entry: JournalEntry) => {
    const date = entry.visited_date
      ? new Date(entry.visited_date + 'T12:00:00')
      : new Date(entry.created_at)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 z-10 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-serif font-semibold text-white">
                  <Calendar className="h-7 w-7 text-amber-400" />
                  Saved
                </h1>
                <p className="mt-1 text-sm text-white/45">
                  Saved trips and travel notes in one calm workspace.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:w-auto">
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">Trips</p>
                  <p className="mt-1 text-lg font-semibold text-white">{trips.length}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">Stories</p>
                  <p className="mt-1 text-lg font-semibold text-white">{entries.length}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => switchTab(tab.key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                      activeTab === tab.key
                        ? 'bg-amber-500/12 text-amber-300'
                        : 'text-white/45 hover:bg-white/[0.05] hover:text-white/75'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {activeTab === 'trips' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-serif font-semibold text-white">Saved Trips</h2>
                <p className="mt-1 text-sm text-white/40">
                  {trips.length} {trips.length === 1 ? 'itinerary' : 'itineraries'} ready to reopen, refine, or share.
                </p>
              </div>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 font-semibold text-black transition-all duration-200 hover:scale-105 hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" />
                Plan another trip
              </Link>
            </div>

            {tripsLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="h-52 animate-pulse rounded-[28px] bg-white/5" />
                ))}
              </div>
            ) : trips.length === 0 ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-16 text-center">
                <div className="mb-6 rounded-full bg-amber-500/10 p-6">
                  <Calendar className="h-8 w-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-serif font-semibold text-white">No saved trips yet</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/45">
                  Build an itinerary in Planner, then use Save trip to keep it here for later.
                </p>
                <Link
                  href="/chat"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-black transition-all duration-200 hover:scale-105 hover:bg-amber-400"
                >
                  <Sparkles className="h-4 w-4" />
                  Open Planner
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {trips.map((trip, index) => {
                  const { days, destination } = extractTripInfo(trip.title)
                  return (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035 }}
                    >
                      <Link
                        href={`/trips/${trip.id}`}
                        className="group block min-h-56 overflow-hidden rounded-[30px] border border-amber-400/16 bg-[radial-gradient(circle_at_20%_0%,rgba(245,158,11,0.14),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300/30 hover:bg-white/[0.065]"
                      >
                        <div className="flex h-full flex-col justify-between gap-8">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/60">
                                Saved itinerary
                              </p>
                              <h3 className="font-serif text-3xl font-semibold leading-tight text-white transition-colors group-hover:text-amber-100">
                                {trip.title}
                              </h3>
                              {destination !== trip.title && (
                                <div className="mt-4 flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4 text-white/36" />
                                  <span className="text-sm text-white/50">{destination}</span>
                                </div>
                              )}
                            </div>
                            <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white/8 text-amber-300 transition-transform group-hover:translate-x-0.5">
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              {days && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-xs text-white/58">
                                  <Clock className="h-3 w-3" />
                                  {days} {days === 1 ? 'day' : 'days'}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-xs text-white/58">
                                <Users className="h-3 w-3" />
                                Crew plan
                              </span>
                              <span className={cn(
                                'rounded-full border px-2.5 py-1 text-xs',
                                trip.is_public
                                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                                  : 'border-white/10 bg-black/20 text-white/36'
                              )}>
                                {trip.is_public ? 'Public' : 'Private'}
                              </span>
                            </div>
                            <p className="mt-3 text-[11px] text-white/30">
                              Saved {new Date(trip.updated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-serif font-semibold text-white">Journal</h2>
                <p className="mt-1 text-sm text-white/40">Your travel stories and memories</p>
              </div>
              {entries.length > 0 && (
                <button
                  onClick={openNewEntry}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 font-semibold text-black transition-all duration-200 hover:scale-105 hover:bg-amber-400"
                >
                  <Plus className="h-4 w-4" />
                  Write entry
                </button>
              )}
            </div>

            {!isPro && !journalLoading && entries.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-white/40">
                  <span>{entries.length} of {FREE_LIMIT} free entries used</span>
                  <button
                    onClick={() => setUpgradeOpen(true)}
                    className="flex items-center gap-1 font-medium text-amber-400 hover:text-amber-300"
                  >
                    <Zap className="h-3 w-3" />
                    Upgrade for unlimited
                  </button>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (entries.length / FREE_LIMIT) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {journalLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-32 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[28px] border border-white/8 bg-white/[0.03] px-6 py-28 text-center">
                <div className="mb-6 rounded-full bg-amber-500/10 p-6">
                  <Feather className="h-8 w-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-serif font-semibold text-white">Start writing your story</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/45">
                  Capture the moments, emotions, and discoveries from your travels. Every trip deserves a story.
                </p>
                <button
                  onClick={openNewEntry}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-black transition-all duration-200 hover:scale-105 hover:bg-amber-400"
                >
                  <Feather className="h-4 w-4" />
                  Write your first entry
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.035 }}
                  >
                    <JournalCard
                      id={entry.id}
                      title={entry.title}
                      placeName={entry.user_place?.place?.name}
                      location={entry.location}
                      date={entry.created_at}
                      visitedDate={entry.visited_date}
                      mood={entry.mood}
                      content={entry.content}
                      tripTitle={entry.trip?.title}
                      onClick={() => setReadingEntry(entry)}
                      onEdit={() => openEditEntry(entry)}
                      onDelete={() => setDeletingId(entry.id)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {readingEntry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
              onClick={() => setReadingEntry(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col md:inset-auto md:top-1/2 md:left-1/2 md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-[85vh]"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0e0f1a] shadow-2xl shadow-black/60 md:rounded-2xl">
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                  <div className="h-1 w-10 rounded-full bg-white/15" />
                </div>

                <div className="flex items-start justify-between border-b border-white/8 px-6 pt-5 pb-4">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 text-white/35">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs">{formatEntryDate(readingEntry)}</span>
                      </div>
                      {(readingEntry.location || readingEntry.user_place?.place?.name) && (
                        <div className="flex items-center gap-1 text-white/35">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-xs">{readingEntry.location || readingEntry.user_place?.place?.name}</span>
                        </div>
                      )}
                      {readingEntry.trip?.title && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400/70">
                          {readingEntry.trip.title}
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-xl font-semibold leading-snug text-white">
                      {readingEntry.mood && <span className="mr-2">{readingEntry.mood}</span>}
                      {readingEntry.title}
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEditEntry(readingEntry)}
                      className="rounded-xl bg-white/5 p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(readingEntry.id)
                        setReadingEntry(null)
                      }}
                      className="rounded-xl bg-white/5 p-2 text-white/40 transition-colors hover:bg-red-500/15 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setReadingEntry(null)}
                      className="ml-1 rounded-xl bg-white/5 p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <p className="whitespace-pre-wrap text-base font-light leading-[1.85] text-white/80">
                    {readingEntry.content}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60"
              onClick={() => setDeletingId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 bottom-4 z-50 md:inset-auto md:top-1/2 md:left-1/2 md:w-80 md:-translate-x-1/2 md:-translate-y-1/2"
            >
              <div className="rounded-2xl border border-white/10 bg-[#0e0f1a] p-5 shadow-2xl">
                <h3 className="mb-1 font-semibold text-white">Delete entry?</h3>
                <p className="mb-4 text-sm text-white/50">This can&apos;t be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="flex-1 rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteEntry.mutate(deletingId)}
                    disabled={deleteEntry.isPending}
                    className="flex-1 rounded-xl bg-red-500/80 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                  >
                    {deleteEntry.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <JournalEditor
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false)
          setEditingEntry(null)
        }}
        onSave={handleSave}
        trips={journalTrips}
        initialData={editingEntry ? {
          id: editingEntry.id,
          title: editingEntry.title,
          content: editingEntry.content,
          mood: editingEntry.mood,
          location: editingEntry.location,
          visited_date: editingEntry.visited_date,
          user_place_id: editingEntry.user_place_id,
          trip_id: editingEntry.trip_id,
        } : undefined}
        isSaving={createEntry.isPending || updateEntry.isPending}
      />

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason={`You've used all ${FREE_LIMIT} free journal entries. Upgrade for unlimited.`}
      />
    </div>
  )
}

export default function SavedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050510]" />}>
      <SavedPageContent />
    </Suspense>
  )
}
