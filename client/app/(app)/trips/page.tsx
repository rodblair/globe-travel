"use client"

import Link from 'next/link'
import { Suspense, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  Calendar,
  Clock,
  Feather,
  Globe2,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
  Zap,
} from 'lucide-react'
import { JournalCard } from '@/components/journal/JournalCard'
import { JournalEditor, type JournalEntryFields } from '@/components/journal/JournalEditor'
import { UpgradeModal } from '@/components/billing/UpgradeModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { CartographicPlate } from '@/components/brand/CartographicPlate'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSubscription } from '@/hooks/useSubscription'
import { PLANS } from '@/lib/plans'
import { formatTripTitleForDisplay, getTripKeepsakeMeta } from '@/lib/trip-copy'
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


const tabs: { key: SavedTab; label: string }[] = [
  { key: 'trips', label: 'Trips' },
  { key: 'journal', label: 'Trip notes' },
]

function TripsGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-busy="true" aria-label="Loading trips">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="gap-0 overflow-hidden p-0">
          <Skeleton className="h-28 rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </Card>
      ))}
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
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [readingEntry, setReadingEntry] = useState<JournalEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingTripId, setConfirmingTripId] = useState<string | null>(null)
  const [tripDeleteError, setTripDeleteError] = useState<string | null>(null)
  const qaForceUpgradeOpen = process.env.NODE_ENV === 'development' && searchParams.get('qaUpgradeModal') === '1'
  const [upgradeOpen, setUpgradeOpen] = useState(qaForceUpgradeOpen)

  const queryClient = useQueryClient()
  const { isPro } = useSubscription()
  const FREE_LIMIT = PLANS.free.limits.journalEntries
  const qaCheckoutFailureMessage =
    process.env.NODE_ENV === 'development' && searchParams.get('qaCheckoutFailure') === '1'
      ? 'Checkout is temporarily unavailable in QA mode.'
      : undefined

  const { data: entries = [], isLoading: journalLoading } = useQuery<JournalEntry[]>({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const res = await fetch('/api/journal')
      if (!res.ok) throw new Error('Failed to load entries')
      return res.json()
    },
  })

  const { data: trips = [], isLoading: tripsLoading, isError: tripsError, refetch: refetchTrips } = useQuery<SavedTrip[]>({
    queryKey: ['saved-trips'],
    queryFn: async () => {
      const res = await fetch('/api/trips', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load trips')
      return res.json() as Promise<SavedTrip[]>
    },
  })
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<'recent' | 'name'>('recent')
  const visibleTrips = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q ? trips.filter((trip) => trip.title.toLowerCase().includes(q)) : trips
    return [...filtered].sort((a, b) =>
      sort === 'name'
        ? a.title.localeCompare(b.title)
        : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    )
  }, [trips, search, sort])

  const journalTrips = useMemo<JournalTripOption[]>(
    () => trips.map((trip) => ({ id: trip.id, title: trip.title })),
    [trips]
  )
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
      queryClient.invalidateQueries({ queryKey: ['recent-trips'] })
      setConfirmingTripId(null)
      setTripDeleteError(null)
    },
    onError: () => {
      setTripDeleteError('Could not delete this trip. Please try again, or reopen it to confirm you still own it.')
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
    router.replace(query ? `/trips?${query}` : '/trips')
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
    <div className="min-h-dvh bg-background">
      <div className="app-sticky-header">
        <div className="app-container flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <h1 className="text-2xl font-medium md:text-3xl">{activeTab === 'journal' ? 'Trip notes' : 'Your trips'}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {activeTab === 'journal'
                ? 'Private decisions, reminders and memories tied to your trips.'
                : tripsLoading
                  ? 'Loading your trips…'
                  : `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'} saved`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'journal' && entries.length > 0 ? (
              <Button onClick={openNewEntry} >
                <Plus /> Add note
              </Button>
            ) : (
              <Button asChild >
                <Link href="/chat">
                  <Plus /> New trip
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="app-container pb-3">
          <Tabs value={activeTab} onValueChange={(value) => switchTab(value as SavedTab)}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key} className="gap-2">
                  {tab.key === 'trips' ? <Calendar className="size-4" /> : <BookOpen className="size-4" />}
                  {tab.label}
                  <Badge variant="secondary" className="px-1.5 py-0">
                    {tab.key === 'trips' ? (tripsLoading ? '–' : trips.length) : journalLoading ? '–' : entries.length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="app-container pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 md:py-8">
        {activeTab === 'trips' && (
          <div className="space-y-6">
            {tripDeleteError && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertDescription>{tripDeleteError}</AlertDescription>
              </Alert>
            )}

            {tripsLoading ? (
              <TripsGridSkeleton />
            ) : tripsError ? (
              <EmptyState
                icon={TriangleAlert}
                title="We couldn't load your trips"
                description="Check your connection and try again. Your trips are safe."
                action={<Button onClick={() => refetchTrips()}>Try again</Button>}
              />
            ) : trips.length === 0 ? (
              <EmptyState
                icon={Globe2}
                title="No trips yet"
                description="Describe a destination and get a mapped, day-by-day itinerary in seconds."
                action={
                  <Button asChild >
                    <Link href="/chat">
                      <Sparkles /> Plan your first trip
                    </Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      aria-label="Search trips"
                      placeholder="Search trips"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={sort}
                    onValueChange={(value) => value && setSort(value as 'recent' | 'name')}
                    aria-label="Sort trips"
                  >
                    <ToggleGroupItem value="recent">Recent</ToggleGroupItem>
                    <ToggleGroupItem value="name">A–Z</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {visibleTrips.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">No trips match &ldquo;{search}&rdquo;.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleTrips.map((trip) => {
                      const displayTitle = formatTripTitleForDisplay(trip.title)
                      const { days, destination } = getTripKeepsakeMeta(displayTitle)
                      return (
                        <Card
                          key={trip.id}
                          className="group relative gap-0 overflow-hidden border-foreground/80 p-0 transition-transform hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--foreground)]"
                        >
                          <div className="h-36 border-b">
                            <CartographicPlate seed={trip.id} stops={Math.min(7, Math.max(3, (days ?? 3) + 1))} />
                          </div>
                          <div className="flex flex-1 flex-col gap-3 p-4">
                            <div className="min-w-0">
                              <h2 className="text-2xl leading-tight">
                                <Link
                                  href={`/trips/${trip.id}`}
                                  className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50 focus-visible:after:rounded-xl"
                                >
                                  {destination || displayTitle}
                                </Link>
                              </h2>
                              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                                <span className="line-clamp-2">{displayTitle}</span>
                              </p>
                            </div>
                            <div className="mt-auto flex flex-wrap items-center gap-2">
                              {days ? (
                                <Badge variant="secondary">
                                  <Clock /> {days} {days === 1 ? 'day' : 'days'}
                                </Badge>
                              ) : null}
                              <Badge variant={trip.is_public ? 'success' : 'outline'}>
                                {trip.is_public ? <Share2 /> : null}
                                {trip.is_public ? 'Shared' : 'Private'}
                              </Badge>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {new Date(trip.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="icon-sm"
                                className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur"
                                aria-label={`Actions for ${displayTitle}`}
                             >
                                <MoreHorizontal />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/trips/${trip.id}`}>Open trip</Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                disabled={deleteTrip.isPending}
                                onClick={() => {
                                  setTripDeleteError(null)
                                  setConfirmingTripId(trip.id)
                                }}
                              >
                                <Trash2 /> Delete trip
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="space-y-6">
            {!isPro && !journalLoading && entries.length > 0 && (
              <Card className="gap-2 p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{entries.length} of {FREE_LIMIT} free notes used</span>
                  <Button onClick={() => setUpgradeOpen(true)} variant="link" size="sm" className="h-auto gap-1 p-0">
                    <Zap /> Upgrade for unlimited
                  </Button>
                </div>
                <Progress value={Math.min(100, (entries.length / FREE_LIMIT) * 100)} />
              </Card>
            )}

            {journalLoading ? (
              <div className="space-y-3" role="status" aria-busy="true" aria-label="Loading trip notes">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <EmptyState
                icon={Feather}
                title="Add a trip note"
                description="Capture decisions, reminders and memories for the trips you are planning."
                action={
                  <Button onClick={openNewEntry} >
                    <Feather /> Add first note
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {entries.map((entry) => (
                  <JournalCard
                    key={entry.id}
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={Boolean(readingEntry)} onOpenChange={(open) => {
        if (!open) setReadingEntry(null)
      }}>
        <DialogContent
          className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
          showCloseButton={false}
        >
          {readingEntry && (
            <>
              <DialogHeader className="flex-row items-start justify-between gap-4 border-b px-6 pb-4 pt-5 text-left">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-xs">{formatEntryDate(readingEntry)}</span>
                    </div>
                    {(readingEntry.location || readingEntry.user_place?.place?.name) && (
                      <div className="flex min-w-0 items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate text-xs">{readingEntry.location || readingEntry.user_place?.place?.name}</span>
                      </div>
                    )}
                    {readingEntry.trip?.title && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        {readingEntry.trip.title}
                      </span>
                    )}
                  </div>
                  <DialogTitle className="text-xl font-semibold leading-snug">
                    {readingEntry.mood && <span className="mr-2">{readingEntry.mood}</span>}
                    {readingEntry.title}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Saved trip note content.
                  </DialogDescription>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label="Edit note"
                    variant="secondary"
                    size="icon-sm"
                    onClick={() => openEditEntry(readingEntry)}
                  >
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Delete note"
                    variant="secondary"
                    size="icon-sm"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => {
                      setDeletingId(readingEntry.id)
                      setReadingEntry(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                  <DialogClose asChild>
                    <IconButton label="Close note" variant="secondary" size="icon-sm">
                      <X className="h-4 w-4" />
                    </IconButton>
                  </DialogClose>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto px-6 py-6">
                <p className="whitespace-pre-wrap text-base leading-7 text-foreground/90">
                  {readingEntry.content}
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => {
        if (!open && !deleteEntry.isPending) setDeletingId(null)
      }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete note?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEntry.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteEntry.isPending || !deletingId}
              onClick={() => {
                if (deletingId) deleteEntry.mutate(deletingId)
              }}
            >
              {deleteEntry.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(pendingTripDelete)} onOpenChange={(open) => {
        if (!open && !deleteTrip.isPending) {
          setConfirmingTripId(null)
          setTripDeleteError(null)
        }
      }}>
        <AlertDialogContent>
          {pendingTripDelete && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {pendingTripDelete.title}?</AlertDialogTitle>
                <AlertDialogDescription className="leading-relaxed">
                  This removes the saved trip from this account or guest session. Public links and friend review context may stop working.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {tripDeleteError && (
                <Alert variant="destructive"><AlertDescription>{tripDeleteError}</AlertDescription></Alert>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteTrip.isPending}>Keep trip</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deleteTrip.isPending}
                  onClick={() => deleteTrip.mutate(pendingTripDelete.id)}
                >
                  {deleteTrip.isPending ? 'Deleting...' : 'Delete trip'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

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

export default function TripsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <SavedPageContent />
    </Suspense>
  )
}
