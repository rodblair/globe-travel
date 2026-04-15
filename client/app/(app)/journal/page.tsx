'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-browser'
import { JournalCard } from '@/components/journal/JournalCard'
import { JournalEditor, type JournalEntryFields } from '@/components/journal/JournalEditor'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, BookOpen, Feather, X, Calendar, MapPin, Pencil, Trash2, Zap } from 'lucide-react'
import { UpgradeModal } from '@/components/billing/UpgradeModal'
import { useSubscription } from '@/hooks/useSubscription'
import { PLANS } from '@/lib/plans'

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

export default function JournalPage() {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [readingEntry, setReadingEntry] = useState<JournalEntry | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const { isPro } = useSubscription()
  const FREE_LIMIT = PLANS.free.limits.journalEntries

  const supabase = createClient()
  const queryClient = useQueryClient()

  // Fetch entries
  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const res = await fetch('/api/journal')
      if (!res.ok) throw new Error('Failed to load entries')
      return res.json()
    },
  })

  // Fetch trips for the editor link dropdown
  const { data: trips = [] } = useQuery({
    queryKey: ['trips-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('trips')
        .select('id, title')
        .order('created_at', { ascending: false })
      return data || []
    },
  })

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
      if (readingEntry?.id === deletingId) setReadingEntry(null)
    },
  })

  const handleSave = async (fields: JournalEntryFields) => {
    if (editingEntry) {
      await updateEntry.mutateAsync({ id: editingEntry.id, ...fields })
    } else {
      await createEntry.mutateAsync(fields)
    }
  }

  const openNew = () => {
    if (!isPro && entries.length >= FREE_LIMIT) {
      setUpgradeOpen(true)
      return
    }
    setEditingEntry(null)
    setEditorOpen(true)
  }

  const openEdit = (entry: JournalEntry) => {
    setEditingEntry(entry)
    setReadingEntry(null)
    setEditorOpen(true)
  }

  const confirmDelete = (id: string) => {
    setDeletingId(id)
  }

  const formatDate = (entry: JournalEntry) => {
    const d = entry.visited_date
      ? new Date(entry.visited_date + 'T12:00:00')
      : new Date(entry.created_at)
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-semibold text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-amber-400" />
              Journal
            </h1>
            <p className="text-white/40 text-sm mt-0.5">Your travel stories &amp; memories</p>
          </div>
          {entries.length > 0 && (
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 text-sm"
            >
              <Plus className="w-4 h-4" />
              Write entry
            </button>
          )}
        </div>

        {/* Free plan usage bar */}
        {!isPro && !isLoading && entries.length > 0 && (
          <div className="max-w-3xl mx-auto px-6 py-2">
            <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
              <span>{entries.length} of {FREE_LIMIT} free entries used</span>
              <button onClick={() => setUpgradeOpen(true)} className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" /> Upgrade for unlimited
              </button>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (entries.length / FREE_LIMIT) * 100)}%` }}
              />
            </div>
          </div>
        )}

      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
              <Feather className="w-9 h-9 text-amber-400" />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-white mb-2">
              Start writing your story
            </h2>
            <p className="text-white/45 max-w-sm mb-8 text-sm leading-relaxed">
              Capture the moments, emotions, and discoveries from your travels. Every trip deserves a story.
            </p>
            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105"
            >
              <Feather className="w-4 h-4" />
              Write your first entry
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
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
                  onEdit={() => openEdit(entry)}
                  onDelete={() => confirmDelete(entry.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Entry reading modal */}
      <AnimatePresence>
        {readingEntry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40"
              onClick={() => setReadingEntry(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl z-50 max-h-[90dvh] md:max-h-[85vh] flex flex-col"
            >
              <div className="flex flex-col bg-[#0e0f1a] border border-white/10 rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl shadow-black/60 h-full">
                {/* drag handle */}
                <div className="md:hidden flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-white/15" />
                </div>

                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-white/8">
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-white/35">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">{formatDate(readingEntry)}</span>
                      </div>
                      {(readingEntry.location || readingEntry.user_place?.place?.name) && (
                        <div className="flex items-center gap-1 text-white/35">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-xs">{readingEntry.location || readingEntry.user_place?.place?.name}</span>
                        </div>
                      )}
                      {readingEntry.trip?.title && (
                        <span className="text-xs text-amber-400/70 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          {readingEntry.trip.title}
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-xl font-semibold text-white leading-snug">
                      {readingEntry.mood && <span className="mr-2">{readingEntry.mood}</span>}
                      {readingEntry.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEdit(readingEntry)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { confirmDelete(readingEntry.id); setReadingEntry(null) }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-red-500/15 text-white/40 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setReadingEntry(null)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors ml-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <p className="text-white/80 text-base leading-[1.85] font-light whitespace-pre-wrap">
                    {readingEntry.content}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deletingId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setDeletingId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-80 z-50"
            >
              <div className="bg-[#0e0f1a] border border-white/10 rounded-2xl p-5 shadow-2xl">
                <h3 className="font-semibold text-white mb-1">Delete entry?</h3>
                <p className="text-sm text-white/50 mb-4">This can't be undone.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-white/60 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteEntry.mutate(deletingId!)}
                    disabled={deleteEntry.isPending}
                    className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500/80 hover:bg-red-500 transition-colors disabled:opacity-50"
                  >
                    {deleteEntry.isPending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Editor */}
      <JournalEditor
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingEntry(null) }}
        onSave={handleSave}
        trips={trips as Trip[]}
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

      {/* Upgrade modal */}
      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        reason={`You've used all ${FREE_LIMIT} free journal entries. Upgrade for unlimited.`}
      />
    </div>
  )
}

type Trip = { id: string; title: string }
