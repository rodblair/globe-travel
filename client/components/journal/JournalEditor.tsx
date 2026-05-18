'use client'

import { useState, useEffect, useId, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Save, MapPin, CalendarDays, Briefcase } from 'lucide-react'
import { MoodPicker } from './MoodPicker'
import { useDialogFocus } from '@/hooks/useDialogFocus'
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
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useDialogFocus({ isOpen, onClose, dialogRef })

  // Reset form when the note changes or dialog opens.
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
            className="fixed inset-0 bg-paper-raised/85 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl z-50 flex flex-col max-h-[92dvh] md:max-h-[88vh]"
          >
            <div className="flex flex-col overflow-hidden rounded-t-3xl border border-rule bg-paper-raised shadow-[var(--shadow-lg)] md:rounded-2xl">
              {/* Drag handle (mobile) */}
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-paper-recessed" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-rule">
                <h2 id={titleId} className="text-lg font-serif font-semibold text-foreground">
                  {initialData?.id ? 'Edit trip note' : 'New trip note'}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close note editor"
                  className="touch-target min-h-12 min-w-12 rounded-xl bg-paper-recessed p-2 text-foreground/50 transition-colors hover:bg-paper-recessed hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body — scrollable */}
              <div id={descriptionId} className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                {/* Title */}
                <div>
                  <input
                    id="journal-title"
                    aria-label="Note title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title..."
                    autoFocus
                    className="w-full bg-transparent text-xl font-serif font-semibold text-foreground placeholder:text-foreground/25 focus:outline-none border-b border-rule pb-2"
                  />
                </div>

                {/* Mood */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-foreground/35 mb-2 block">Mood</label>
                  <MoodPicker selected={mood} onChange={setMood} />
                </div>

                {/* Meta row: date + location */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="journal-date" className="mb-1.5 flex items-center gap-1 text-xs uppercase tracking-widest text-foreground/35">
                      <CalendarDays className="w-3 h-3" /> Trip date
                    </label>
                    <input
                      id="journal-date"
                      type="date"
                      value={visitedDate}
                      onChange={(e) => setVisitedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-paper-recessed border border-rule text-foreground text-sm focus:outline-none focus:border-[color:var(--brass)]/30 transition-colors [color-scheme:light]"
                    />
                  </div>
                  <div>
                    <label htmlFor="journal-location" className="mb-1.5 flex items-center gap-1 text-xs uppercase tracking-widest text-foreground/35">
                      <MapPin className="w-3 h-3" /> Location
                    </label>
                    <input
                      id="journal-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, country"
                      className="w-full px-3 py-2 rounded-xl bg-paper-recessed border border-rule text-foreground placeholder:text-foreground/25 text-sm focus:outline-none focus:border-[color:var(--brass)]/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Trip linkage */}
                {trips.length > 0 && (
                  <div>
                    <label htmlFor="journal-trip" className="mb-1.5 flex items-center gap-1 text-xs uppercase tracking-widest text-foreground/35">
                      <Briefcase className="w-3 h-3" /> Link to trip
                    </label>
                    <select
                      id="journal-trip"
                      value={selectedTrip}
                      onChange={(e) => setSelectedTrip(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-paper-recessed border border-rule text-foreground text-sm focus:outline-none focus:border-[color:var(--brass)]/30 transition-colors"
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
                  <label htmlFor="journal-content" className="mb-1.5 block text-xs uppercase tracking-widest text-foreground/35">Trip note</label>
                  <textarea
                    id="journal-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Capture a decision, reminder, or memory from this trip..."
                    rows={9}
                    className="w-full px-4 py-3 rounded-xl bg-paper-recessed/60 border border-rule text-foreground placeholder:text-foreground/25 text-sm resize-none focus:outline-none focus:border-[color:var(--brass)]/30 transition-colors leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 border-t border-rule bg-paper-raised px-5 py-4">
                <p className={cn(
                  'text-xs transition-colors',
                  canSave ? 'text-foreground/30' : 'text-[var(--brass)]'
                )}>
                  {!title.trim() ? 'Add a title to save' : !content.trim() ? 'Add a note to save' : `${content.trim().split(/\s+/).length} words`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={onClose}
                    className="touch-target min-h-12 rounded-xl bg-paper-recessed px-4 py-2 text-sm font-medium text-foreground/50 transition-colors hover:bg-paper-recessed hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!canSave || saving || isSaving}
                    className="touch-target flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-[var(--brass)] px-5 py-2 text-sm font-semibold text-[var(--brass-text)] transition-colors hover:bg-[var(--brass)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save note'}
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
