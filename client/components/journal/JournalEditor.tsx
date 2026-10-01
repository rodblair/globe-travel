'use client'

import { useState, useEffect } from 'react'
import { X, Save, MapPin, CalendarDays, Briefcase } from 'lucide-react'
import { MoodPicker } from './MoodPicker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

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
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogContent
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-lg border-border bg-card p-0 shadow-lg sm:max-w-2xl"
        showCloseButton={false}
      >
              <DialogHeader className="flex-row items-center justify-between border-b border-border px-5 py-4 text-left">
                <div>
                  <DialogTitle className="text-lg font-semibold text-foreground">
                  {initialData?.id ? 'Edit trip note' : 'New trip note'}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs text-muted-foreground">
                    Capture a decision, reminder, or memory.
                  </DialogDescription>
                </div>
                <DialogClose asChild>
                  <IconButton label="Close note editor" variant="secondary" className="shrink-0">
                    <X className="w-4 h-4" />
                  </IconButton>
                </DialogClose>
              </DialogHeader>

              {/* Body — scrollable */}
              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">

                {/* Title */}
                <Field>
                  <Input
                    id="journal-title"
                    aria-label="Note title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title..."
                    autoFocus
                    className="h-auto rounded-none border-x-0 border-t-0 bg-transparent px-0 pb-2 text-xl font-semibold shadow-none focus-visible:ring-0"
                  />
                </Field>

                {/* Mood */}
                <Field>
                  <FieldLabel>Mood</FieldLabel>
                  <MoodPicker selected={mood} onChange={setMood} />
                </Field>

                {/* Meta row: date + location */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="journal-date">
                      <CalendarDays className="w-3 h-3" /> Trip date
                    </FieldLabel>
                    <Input
                      id="journal-date"
                      type="date"
                      value={visitedDate}
                      onChange={(e) => setVisitedDate(e.target.value)}
                      className="[color-scheme:light]"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="journal-location">
                      <MapPin className="w-3 h-3" /> Location
                    </FieldLabel>
                    <Input
                      id="journal-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, country"
                    />
                  </Field>
                </div>

                {/* Trip linkage */}
                {trips.length > 0 && (
                  <Field>
                    <FieldLabel htmlFor="journal-trip">
                      <Briefcase className="w-3 h-3" /> Link to trip
                    </FieldLabel>
                    <Select
                      value={selectedTrip || 'none'}
                      onValueChange={(value) => setSelectedTrip(value === 'none' ? '' : value)}
                    >
                      <SelectTrigger id="journal-trip" className="w-full bg-muted">
                        <SelectValue placeholder="No trip linked" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No trip linked</SelectItem>
                        {trips.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                {/* Content */}
                <Field>
                  <FieldLabel htmlFor="journal-content">Trip note</FieldLabel>
                  <Textarea
                    id="journal-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Capture a decision, reminder, or memory from this trip..."
                    rows={9}
                    className="resize-none rounded-lg bg-muted/60 leading-relaxed"
                  />
                </Field>
              </div>

              {/* Footer */}
              <DialogFooter className="flex-col items-stretch justify-between gap-3 border-t border-border bg-card px-5 py-4 sm:flex-row sm:items-center">
                <p className={cn(
                  'text-xs transition-colors',
                  canSave ? 'text-muted-foreground' : 'text-primary'
                )}>
                  {!title.trim() ? 'Add a title to save' : !content.trim() ? 'Add a note to save' : `${content.trim().split(/\s+/).length} words`}
                </p>
                <div className="flex gap-2 sm:justify-end">
                  <DialogClose asChild>
                    <Button
                      variant="secondary"
                      size="lg"
                      className="min-h-12 rounded-lg"
                 >
                    Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleSave}
                    disabled={!canSave || saving || isSaving}
                    size="lg"
                    className="min-h-12 rounded-lg"
                 >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save note'}
                  </Button>
                </div>
              </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
