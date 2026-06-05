'use client'

import Link from 'next/link'
import { Suspense, useId, useMemo, useRef, useState } from 'react'
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
import { ArtifactFrame, getTripKeepsakeMeta } from '@/components/trips/KeepsakeArtifacts'
import { useDialogFocus } from '@/hooks/useDialogFocus'
import { useSubscription } from '@/hooks/useSubscription'
import { PLANS } from '@/lib/plans'
import { formatTripTitleForDisplay } from '@/lib/trip-copy'
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
  { key: 'journal', label: 'Trip notes', icon: BookOpen },
]

function SavedLoadingState({
  icon: Icon,
  title,
  detail,
  rows = 2,
}: {
  icon: typeof Calendar
  title: string
  detail: string
  rows?: number
}) {
  return (
    <div
      aria-busy="true"
      className="rounded-[28px] border border-rule bg-paper-recessed/60 p-5"
      role="status"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brass-subtle)] text-[var(--brass)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-xl font-semibold text-foreground">{title}</p>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-foreground/45">{detail}</p>
          <div className="mt-5 space-y-3">
            {Array.from({ length: rows }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-rule bg-paper/45 p-4"
              >
                <div className="h-3 w-28 animate-pulse rounded-full bg-[var(--brass-subtle)]" />
                <div className="mt-4 h-4 w-3/4 animate-pulse rounded-full bg-paper-recessed" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-paper-recessed" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function normalizeTab(value: string | null): SavedTab {
  if (value === 'journal') return value
  return 'trips'
}

function SavedPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = normalizeTab(searchParams.get('tab'))
  const activeTabMeta = tabs.find((tab) => tab.key === activeTab) || tabs[0]
  const HeaderIcon = activeTabMeta.icon
  const headerDescription = activeTab === 'journal'
    ? 'Capture memories, decisions, and notes from the trips you are shaping.'
    : 'Saved itineraries and trip notes in one calm workspace.'
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [readingEntry, setReadingEntry] = useState<JournalEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingTripId, setConfirmingTripId] = useState<string | null>(null)
  const [tripDeleteError, setTripDeleteError] = useState<string | null>(null)
  const qaForceUpgradeOpen = process.env.NODE_ENV === 'development' && searchParams.get('qaUpgradeModal') === '1'
  const [upgradeOpen, setUpgradeOpen] = useState(qaForceUpgradeOpen)
  const readingDialogRef = useRef<HTMLDivElement>(null)
  const deleteDialogRef = useRef<HTMLDivElement>(null)
  const tripDeleteDialogRef = useRef<HTMLDivElement>(null)
  const readingDialogTitleId = useId()
  const readingDialogDescriptionId = useId()
  const deleteDialogTitleId = useId()
  const deleteDialogDescriptionId = useId()
  const tripDeleteDialogTitleId = useId()
  const tripDeleteDialogDescriptionId = useId()

  const queryClient = useQueryClient()
  const { isPro } = useSubscription()
  const FREE_LIMIT = PLANS.free.limits.journalEntries
  const qaCheckoutFailureMessage =
    process.env.NODE_ENV === 'development' && searchParams.get('qaCheckoutFailure') === '1'
      ? 'Checkout is temporarily unavailable in QA mode.'
      : undefined

  useDialogFocus({
    isOpen: Boolean(readingEntry),
    onClose: () => setReadingEntry(null),
    dialogRef: readingDialogRef,
  })

  useDialogFocus({
    isOpen: Boolean(deletingId),
    onClose: () => setDeletingId(null),
    dialogRef: deleteDialogRef,
  })

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
  const tripCountLabel = tripsLoading ? '—' : trips.length
  const noteCountLabel = journalLoading ? '—' : entries.length
  const itinerarySummary = tripsLoading
    ? 'Checking this session for itineraries, maps, and friend-ready plans.'
    : trips.length === 0
      ? 'Start a trip to keep itinerary maps, notes, and friend-ready plans here.'
      : `${trips.length} ${trips.length === 1 ? 'itinerary' : 'itineraries'} ready to reopen, refine, or share.`
  const noteSummary = journalLoading
    ? 'Gathering private notes, decisions, and reminders tied to your itineraries.'
    : 'Private reminders, decisions, and memories tied to your itineraries.'
  const pendingTripDelete = useMemo(
    () => trips.find((trip) => trip.id === confirmingTripId) || null,
    [confirmingTripId, trips]
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

  const deleteTrip = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/trips/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-trips'] })
      setConfirmingTripId(null)
      setTripDeleteError(null)
    },
    onError: () => {
      setTripDeleteError('Could not delete this trip. Please try again, or reopen it to confirm you still own it.')
    },
  })

  useDialogFocus({
    isOpen: Boolean(confirmingTripId),
    onClose: () => {
      if (!deleteTrip.isPending) {
        setConfirmingTripId(null)
        setTripDeleteError(null)
      }
    },
    dialogRef: tripDeleteDialogRef,
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
    <div className="min-h-screen bg-paper">
      <div className="app-sticky-header">
        <div className="app-container py-4 md:py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-serif font-semibold text-foreground">
                  <HeaderIcon className="h-7 w-7 text-[var(--brass)]" />
                  {activeTabMeta.label}
                </h1>
                <p className="mt-1 text-sm text-foreground/45">
                  {headerDescription}
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
                <div className="rounded-2xl border border-rule bg-paper-recessed/60 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-foreground/30">Trips</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{tripCountLabel}</p>
                </div>
                <div className="rounded-2xl border border-rule bg-paper-recessed/60 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-foreground/30">Notes</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">{noteCountLabel}</p>
                </div>
              </div>
            </div>

            <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto rounded-2xl border border-rule bg-paper-recessed/60 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => switchTab(tab.key)}
                    className={cn(
                      'touch-target inline-flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                      activeTab === tab.key
                        ? 'bg-[var(--brass-subtle)] text-foreground'
                        : 'text-foreground/45 hover:bg-paper-recessed/60 hover:text-foreground/75'
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

      <div className="app-container pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 md:py-8">
        {activeTab === 'trips' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-serif font-semibold text-foreground">Your itineraries</h2>
                <p className="mt-1 text-sm text-foreground/40">
                  {itinerarySummary}
                </p>
              </div>
              <Link
                href="/chat"
                className="touch-target inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brass)] px-5 py-2.5 font-semibold text-[var(--brass-text)] transition-colors duration-200 hover:bg-[var(--brass-hover)]"
              >
                <Plus className="h-4 w-4" />
                Plan another trip
              </Link>
            </div>

            {tripDeleteError && (
              <div
                className="rounded-2xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] px-4 py-3 text-sm text-[var(--terracotta)]"
                role="alert"
              >
                {tripDeleteError}
              </div>
            )}

            {tripsLoading ? (
              <SavedLoadingState
                icon={Calendar}
                title="Loading saved trips"
                detail="Checking this session for itineraries, maps, and friend-ready plans."
              />
            ) : trips.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[28px] border border-rule bg-paper-recessed/60 px-6 py-7 text-center sm:min-h-[320px] sm:py-10 lg:min-h-[340px]">
                <div className="mb-4 rounded-full bg-[var(--brass-subtle)] p-5 sm:mb-5">
                  <Calendar className="h-7 w-7 text-[var(--brass)] sm:h-8 sm:w-8" />
                </div>
                <h2 className="text-2xl font-serif font-semibold text-foreground">No saved trips yet</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-foreground/45">
                  Build an itinerary in Planner, then use Save trip to keep it here for later.
                </p>
                <p className="mt-3 hidden max-w-md text-xs leading-relaxed text-foreground/45 sm:block">
                  If you opened a friend&apos;s shared link, that trip stays on its public review page until you create or save your own version.
                </p>
                <Link
                  href="/chat"
                  className="touch-target mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brass)] px-6 py-3 font-semibold text-[var(--brass-text)] transition-colors duration-200 hover:bg-[var(--brass-hover)] sm:mt-6"
                >
                  <Sparkles className="h-4 w-4" />
                  Open Planner
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {trips.map((trip, index) => {
                  const displayTitle = formatTripTitleForDisplay(trip.title)
                  const { days, destination } = getTripKeepsakeMeta(displayTitle)
                  return (
                    <motion.div
                      key={trip.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.035 }}
                    >
                      <ArtifactFrame className="group relative min-h-64 transition-all duration-200 hover:-translate-y-0.5" ribbon={false}>
                        <div className="flex h-full min-h-64 flex-col justify-between gap-7 p-5 pb-20 md:p-6 md:pb-20">
                          <div className="flex items-start justify-between gap-4">
                            <Link
                              href={`/trips/${trip.id}`}
                              className="min-w-0 rounded-2xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-4 focus-visible:ring-offset-paper-raised"
                              aria-label={`Open ${displayTitle}`}
                            >
                              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--brass)]">
                                Globe.travel map
                              </p>
                              <h3 className="break-words font-serif text-2xl font-semibold uppercase leading-[1.04] tracking-[0.08em] text-foreground transition-colors group-hover:text-[var(--brass)] sm:text-3xl">
                                {destination}
                              </h3>
                              <div className="mt-4 flex items-center gap-1.5">
                                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-3" />
                                <span className="line-clamp-2 break-words text-sm leading-snug text-ink-2">{displayTitle}</span>
                              </div>
                            </Link>
                            <Link
                              href={`/trips/${trip.id}`}
                              className="touch-target inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-paper-recessed text-[var(--brass)] transition-transform hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
                              aria-label={`Open ${displayTitle}`}
                              title={`Open ${displayTitle}`}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              {days && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-recessed px-3 py-1.5 text-xs text-foreground/58">
                                  <Clock className="h-3 w-3" />
                                  {days} {days === 1 ? 'day' : 'days'}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-recessed px-3 py-1.5 text-xs text-ink-2">
                                <Users className="h-3 w-3" />
                                Friend-ready
                              </span>
                              <span className={cn(
                                'rounded-full border px-2.5 py-1 text-xs',
                                trip.is_public
                                  ? 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                                  : 'border-rule bg-paper/20 text-foreground/36'
                              )}>
                                {trip.is_public ? 'Public' : 'Private'}
                              </span>
                            </div>
                            <p className="mt-3 text-[11px] text-foreground/30">
                              Saved {new Date(trip.updated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                            <Link
                              href={`/trips/${trip.id}`}
                              className="touch-target mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-rule bg-paper-recessed px-3 py-2 text-xs font-semibold text-foreground/78 transition-colors hover:border-[color:var(--brass)]/30 hover:bg-[var(--brass-subtle)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-paper-raised"
                              aria-label={`Open ${displayTitle}`}
                            >
                              Open trip
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setTripDeleteError(null)
                            setConfirmingTripId(trip.id)
                          }}
                          disabled={deleteTrip.isPending}
                          className={cn(
                            'touch-target absolute bottom-5 right-5 z-10 inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50',
                            'border-rule bg-paper/28 text-foreground/70 hover:border-[color:var(--pillar-desert-wash)] hover:bg-[color:var(--pillar-desert-wash)] hover:text-[var(--terracotta)]'
                          )}
                          aria-label={`Delete ${displayTitle}`}
                          title={`Delete ${displayTitle}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </ArtifactFrame>
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
                <h2 className="text-xl font-serif font-semibold text-foreground">Trip notes</h2>
                <p className="mt-1 text-sm text-foreground/40">
                  {noteSummary}
                </p>
              </div>
              {entries.length > 0 && (
                <button
                  onClick={openNewEntry}
                  className="touch-target inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brass)] px-5 py-2.5 font-semibold text-[var(--brass-text)] transition-colors duration-200 hover:bg-[var(--brass-hover)]"
                >
                  <Plus className="h-4 w-4" />
                  Add note
                </button>
              )}
            </div>

            {!isPro && !journalLoading && entries.length > 0 && (
              <div className="rounded-2xl border border-rule bg-paper-recessed/60 p-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-foreground/40">
                  <span>{entries.length} of {FREE_LIMIT} free notes used</span>
                  <button
                    onClick={() => setUpgradeOpen(true)}
                    className="flex items-center gap-1 font-medium text-[var(--brass)] hover:text-[var(--brass)]"
                  >
                    <Zap className="h-3 w-3" />
                    Upgrade for unlimited
                  </button>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-paper-recessed">
                  <div
                    className="h-full rounded-full bg-[var(--brass)] transition-all duration-500"
                    style={{ width: `${Math.min(100, (entries.length / FREE_LIMIT) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {journalLoading ? (
              <SavedLoadingState
                icon={Feather}
                title="Loading trip notes"
                detail="Gathering private notes, decisions, and reminders tied to your itineraries."
                rows={3}
              />
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[28px] border border-rule bg-paper-recessed/60 px-6 py-16 text-center sm:py-28">
                <div className="mb-6 rounded-full bg-[var(--brass-subtle)] p-6">
                  <Feather className="h-8 w-8 text-[var(--brass)]" />
                </div>
                <h2 className="text-2xl font-serif font-semibold text-foreground">Add a trip note</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground/45">
                  Capture decisions, reminders, and memories for the itineraries you are building with friends.
                </p>
                <button
                  onClick={openNewEntry}
                  className="touch-target mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brass)] px-6 py-3 font-semibold text-[var(--brass-text)] transition-colors duration-200 hover:bg-[var(--brass-hover)]"
                >
                  <Feather className="h-4 w-4" />
                  Add first note
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
              className="fixed inset-0 z-40 bg-paper/75 backdrop-blur-sm"
              onClick={() => setReadingEntry(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              ref={readingDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={readingDialogTitleId}
              aria-describedby={readingDialogDescriptionId}
              tabIndex={-1}
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col md:inset-auto md:top-1/2 md:left-1/2 md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-[85vh]"
            >
              <div className="flex h-full flex-col overflow-hidden rounded-t-3xl border border-rule bg-paper-raised shadow-[var(--shadow-lg)] md:rounded-2xl">
                <div className="flex justify-center pt-3 pb-1 md:hidden">
                  <div className="h-1 w-10 rounded-full bg-paper-recessed" />
                </div>

                <div className="flex items-start justify-between border-b border-rule px-6 pt-5 pb-4">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5 text-foreground/35">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs">{formatEntryDate(readingEntry)}</span>
                      </div>
                      {(readingEntry.location || readingEntry.user_place?.place?.name) && (
                        <div className="flex items-center gap-1 text-foreground/35">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-xs">{readingEntry.location || readingEntry.user_place?.place?.name}</span>
                        </div>
                      )}
                      {readingEntry.trip?.title && (
                        <span className="rounded-full bg-[var(--brass-subtle)] px-2 py-0.5 text-xs text-[var(--brass)]">
                          {readingEntry.trip.title}
                        </span>
                      )}
                    </div>
                    <h2 id={readingDialogTitleId} className="font-serif text-xl font-semibold leading-snug text-foreground">
                      {readingEntry.mood && <span className="mr-2">{readingEntry.mood}</span>}
                      {readingEntry.title}
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEditEntry(readingEntry)}
                      aria-label="Edit note"
                      className="touch-target rounded-xl bg-paper-recessed p-2 text-foreground/40 transition-colors hover:bg-paper-recessed hover:text-foreground"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(readingEntry.id)
                        setReadingEntry(null)
                      }}
                      aria-label="Delete note"
                      className="touch-target rounded-xl bg-paper-recessed p-2 text-foreground/40 transition-colors hover:bg-[color:var(--pillar-desert-wash)] hover:text-[var(--terracotta)]"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setReadingEntry(null)}
                      aria-label="Close note"
                      className="touch-target ml-1 rounded-xl bg-paper-recessed p-2 text-foreground/40 transition-colors hover:bg-paper-recessed hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div id={readingDialogDescriptionId} className="flex-1 overflow-y-auto px-6 py-6">
                  <p className="whitespace-pre-wrap text-base font-light leading-[1.85] text-foreground/80">
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
              className="fixed inset-0 z-50 bg-paper/60"
              onClick={() => setDeletingId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              ref={deleteDialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={deleteDialogTitleId}
              aria-describedby={deleteDialogDescriptionId}
              tabIndex={-1}
              className="fixed inset-x-4 bottom-4 z-50 md:inset-auto md:top-1/2 md:left-1/2 md:w-80 md:-translate-x-1/2 md:-translate-y-1/2"
            >
              <div className="rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-lg)]">
                <h3 id={deleteDialogTitleId} className="mb-1 font-semibold text-foreground">Delete note?</h3>
                <p id={deleteDialogDescriptionId} className="mb-4 text-sm text-foreground/50">This can&apos;t be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="touch-target flex-1 rounded-xl bg-paper-recessed px-4 py-2 text-sm font-medium text-foreground/60 transition-colors hover:bg-paper-recessed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteEntry.mutate(deletingId)}
                    disabled={deleteEntry.isPending}
                    className="touch-target flex-1 rounded-xl bg-[color:var(--pillar-desert-wash)] px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-[var(--terracotta)] disabled:opacity-50"
                  >
                    {deleteEntry.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingTripDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-paper/60"
              onClick={() => {
                if (!deleteTrip.isPending) {
                  setConfirmingTripId(null)
                  setTripDeleteError(null)
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              ref={tripDeleteDialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby={tripDeleteDialogTitleId}
              aria-describedby={tripDeleteDialogDescriptionId}
              tabIndex={-1}
              className="fixed inset-x-4 bottom-4 z-50 md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-sm md:-translate-x-1/2 md:-translate-y-1/2"
            >
              <div className="rounded-2xl border border-rule bg-paper-raised p-5 shadow-[var(--shadow-lg)]">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--terracotta)]">
                  Remove itinerary
                </p>
                <h3 id={tripDeleteDialogTitleId} className="font-serif text-xl font-semibold text-foreground">
                  Delete {pendingTripDelete.title}?
                </h3>
                <p id={tripDeleteDialogDescriptionId} className="mt-2 text-sm leading-relaxed text-foreground/50">
                  This removes the saved trip from this account or guest session. Public links and friend review context may stop working.
                </p>
                {tripDeleteError && (
                  <p className="mt-3 rounded-xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] px-3 py-2 text-sm text-[var(--terracotta)]">
                    {tripDeleteError}
                  </p>
                )}
                <div className="mt-5 flex gap-2">
                  <button
                    onClick={() => {
                      setConfirmingTripId(null)
                      setTripDeleteError(null)
                    }}
                    disabled={deleteTrip.isPending}
                    className="touch-target flex-1 rounded-xl bg-paper-recessed px-4 py-2 text-sm font-medium text-foreground/60 transition-colors hover:bg-paper-recessed disabled:opacity-50"
                  >
                    Keep trip
                  </button>
                  <button
                    onClick={() => deleteTrip.mutate(pendingTripDelete.id)}
                    disabled={deleteTrip.isPending}
                    className="touch-target flex-1 rounded-xl bg-[color:var(--pillar-desert-wash)] px-4 py-2 text-sm font-semibold text-[var(--terracotta)] transition-colors hover:bg-[var(--terracotta)] hover:text-white disabled:opacity-50"
                  >
                    {deleteTrip.isPending ? 'Deleting...' : 'Delete trip'}
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
        reason={`You've used all ${FREE_LIMIT} free trip notes. Upgrade for unlimited.`}
        checkoutFailureMessage={qaCheckoutFailureMessage}
      />
    </div>
  )
}

export default function SavedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <SavedPageContent />
    </Suspense>
  )
}
