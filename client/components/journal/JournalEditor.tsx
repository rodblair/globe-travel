'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Save, MapPin, CalendarDays, Briefcase } from 'lucide-react'
import { MoodPicker } from './MoodPicker'
import { cn } from '@/lib/utils'

type UserPlace = { id: string; place: { name: string } }
type Trip = { id: string; title: string }

export type JournalEntryFields = {
  title: string
  content: string
  mood?: string
  location?: string
  visited_date?: string
  user_place_id?: string
  trip_id?: string
}

type JournalEditorProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (entry: JournalEntryFields) => Promise<void> | void
  userPlaces?: UserPlace[]
  trips?: Trip[]
  initialData?: JournalEntryFields & { id?: string }
  isSaving?: boolean
}

export function JournalEditor({
  isOpen,
  onClose,
  onSave,
  userPlaces = [],
  trips = [],
  initialData,
  isSaving = false,
}: JournalEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')
  const [location, setLocation] = useState('')
  const [visitedDate, setVisitedDate] = useState('')
  const [selectedPlace, setSelectedPlace] = useState('')
  const [selectedTrip, setSelectedTrip] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset form when entry changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '')
      setContent(initialData?.content || '')
      setMood(initialData?.mood || '')
      setLocation(initialData?.location || '')
      setVisitedDate(initialData?.visited_date || '')
      setSelectedPlace(initialData?.user_place_id || '')
      setSelectedTrip(initialData?.trip_id || '')
    }
  }, [isOpen, initialData])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        content: content.trim(),
        mood: mood || undefined,
        location: location.trim() || undefined,
        visited_date: visitedDate || undefined,
        user_place_id: selectedPlace || undefined,
        trip_id: selectedTrip || undefined,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const canSave = title.trim().length > 0 && content.trim().length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl z-50 flex flex-col max-h-[92dvh] md:max-h-[88vh]"
          >
            <div className="flex flex-col bg-[#0e0f1a] border border-white/10 rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
              {/* Drag handle (mobile) */}
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
                <h2 className="text-lg font-serif font-semibold text-white">
                  {initialData?.id ? 'Edit Entry' : 'New Journal Entry'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                {/* Title */}
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Entry title…"
                    autoFocus
                    className="w-full bg-transparent text-xl font-serif font-semibold text-white placeholder:text-white/25 focus:outline-none border-b border-white/10 pb-2"
                  />
                </div>

                {/* Mood */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-white/35 mb-2 block">Mood</label>
                  <MoodPicker selected={mood} onChange={setMood} />
                </div>

                {/* Meta row: date + location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-white/35 mb-1.5 block flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" /> Date visited
                    </label>
                    <input
                      type="date"
                      value={visitedDate}
                      onChange={(e) => setVisitedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/40 transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-white/35 mb-1.5 block flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Rome, Italy"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-amber-500/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Trip linkage */}
                {trips.length > 0 && (
                  <div>
                    <label className="text-xs uppercase tracking-widest text-white/35 mb-1.5 block flex items-center gap-1">
                      <Briefcase className="w-3 h-3" /> Link to trip
                    </label>
                    <select
                      value={selectedTrip}
                      onChange={(e) => setSelectedTrip(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/40 transition-colors"
                    >
                      <option value="">No trip linked</option>
                      {trips.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Content */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-white/35 mb-1.5 block">Your story</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write about your experience — what you saw, felt, tasted, discovered…"
                    rows={9}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder:text-white/25 text-sm resize-none focus:outline-none focus:border-amber-500/40 transition-colors leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-white/8 bg-[#0e0f1a]">
                <p className={cn(
                  'text-xs transition-colors',
                  canSave ? 'text-white/30' : 'text-amber-500/70'
                )}>
                  {!title.trim() ? 'Add a title to save' : !content.trim() ? 'Add your story to save' : `${content.trim().split(/\s+/).length} words`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!canSave || saving || isSaving}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Save Entry'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
