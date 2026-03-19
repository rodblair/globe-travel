'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase-browser'
import { JournalCard } from '@/components/journal/JournalCard'
import { JournalEditor } from '@/components/journal/JournalEditor'
import { motion } from 'motion/react'
import { Plus, BookOpen, Feather } from 'lucide-react'

export default function JournalPage() {
  const [editorOpen, setEditorOpen] = useState(false)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const { data } = await supabase
        .from('journal_entries')
        .select('*, user_place:user_places(*, place:places(*))')
        .order('created_at', { ascending: false })
      return data
    },
  })

  const { data: userPlaces } = useQuery({
    queryKey: ['user-places'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_places')
        .select('*, place:places(*)')
        .order('created_at', { ascending: false })
      return data
    },
  })

  const createEntry = useMutation({
    mutationFn: async (entry: {
      title: string
      content: string
      mood?: string
      user_place_id?: string
    }) => {
      const { data } = await supabase
        .from('journal_entries')
        .insert(entry)
        .select()
        .single()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    },
  })

  const placesForEditor = (userPlaces || []).map((up: any) => ({
    id: up.id,
    place: { name: up.place?.name || 'Unknown' },
  }))

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-serif font-semibold text-white flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-amber-400" />
            Journal
          </h1>
          <p className="text-white/50 mt-1">Your travel stories and memories</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : !entries || entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
              <Feather className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-serif font-semibold text-white mb-2">
              Start writing your story
            </h2>
            <p className="text-white/50 max-w-md mb-8">
              Capture the moments, emotions, and discoveries from your travels.
            </p>
            <button
              onClick={() => setEditorOpen(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-6 py-3 rounded-full transition-all duration-200 hover:scale-105"
            >
              <Feather className="w-5 h-5" />
              Write Your First Entry
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Timeline line */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10" />
              <div className="space-y-4 pl-10">
                {entries.map((entry: any, index: number) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-10 top-5 w-3 h-3 rounded-full bg-amber-500 border-2 border-black" />
                    <JournalCard
                      id={entry.id}
                      title={entry.title}
                      placeName={entry.user_place?.place?.name || 'Unknown Place'}
                      date={entry.created_at}
                      mood={entry.mood}
                      content={entry.content}
                      photoUrl={entry.photo_urls?.[0]}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Write Entry FAB */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-24 md:bottom-8 right-6 z-20"
      >
        <button
          onClick={() => setEditorOpen(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-5 py-3 rounded-full shadow-lg shadow-amber-500/20 transition-all duration-200 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Write Entry</span>
        </button>
      </motion.div>

      {/* Editor */}
      <JournalEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={(entry) => createEntry.mutate(entry)}
        userPlaces={placesForEditor}
      />
    </div>
  )
}
