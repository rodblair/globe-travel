'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Save, Image, ChevronDown } from 'lucide-react'
import { MoodPicker } from './MoodPicker'

type JournalEditorProps = {
  isOpen: boolean
  onClose: () => void
  onSave: (entry: {
    title: string
    content: string
    mood?: string
    user_place_id?: string
  }) => void
  userPlaces?: Array<{ id: string; place: { name: string } }>
  initialData?: {
    title: string
    content: string
    mood?: string
    user_place_id?: string
  }
}

export function JournalEditor({
  isOpen,
  onClose,
  onSave,
  userPlaces = [],
  initialData,
}: JournalEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [mood, setMood] = useState(initialData?.mood || '')
  const [selectedPlace, setSelectedPlace] = useState(initialData?.user_place_id || '')
  const [showPlaceDropdown, setShowPlaceDropdown] = useState(false)

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return
    onSave({
      title: title.trim(),
      content: content.trim(),
      mood: mood || undefined,
      user_place_id: selectedPlace || undefined,
    })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] z-50 overflow-y-auto"
          >
            <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-xl font-serif font-semibold text-white">
                  {initialData ? 'Edit Entry' : 'Write Journal Entry'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5">
                {/* Place selector */}
                <div className="relative">
                  <label className="text-sm text-white/50 mb-1.5 block">Place</label>
                  <button
                    type="button"
                    onClick={() => setShowPlaceDropdown(!showPlaceDropdown)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-left text-white/70 hover:bg-white/[0.07] transition-colors"
                  >
                    {selectedPlace
                      ? userPlaces.find((p) => p.id === selectedPlace)?.place?.name || 'Select a place'
                      : 'Select a place'}
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </button>
                  <AnimatePresence>
                    {showPlaceDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute left-0 right-0 top-full mt-1 bg-black/95 border border-white/10 rounded-xl overflow-hidden max-h-48 overflow-y-auto z-10"
                      >
                        {userPlaces.map((up) => (
                          <button
                            key={up.id}
                            onClick={() => {
                              setSelectedPlace(up.id)
                              setShowPlaceDropdown(false)
                            }}
                            className="w-full px-4 py-2.5 text-sm text-left text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            {up.place?.name}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm text-white/50 mb-1.5 block">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Give your entry a title..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
                  />
                </div>

                {/* Mood */}
                <div>
                  <label className="text-sm text-white/50 mb-2 block">How are you feeling?</label>
                  <MoodPicker selected={mood} onChange={setMood} />
                </div>

                {/* Content */}
                <div>
                  <label className="text-sm text-white/50 mb-1.5 block">Your story</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write about your experience..."
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:border-amber-500/50 transition-colors leading-relaxed"
                  />
                </div>

                {/* Photo upload placeholder */}
                <div>
                  <label className="text-sm text-white/50 mb-1.5 block">Photos</label>
                  <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-white/20 transition-colors cursor-pointer">
                    <Image className="w-8 h-8 text-white/30 mb-2" />
                    <p className="text-sm text-white/40">Click to upload photos</p>
                    <p className="text-xs text-white/25 mt-1">JPG, PNG up to 10MB</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!title.trim() || !content.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  Save Entry
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
