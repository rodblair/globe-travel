'use client'

import { cn } from '@/lib/utils'

const moods = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🤩', label: 'Amazed' },
  { emoji: '😌', label: 'Peaceful' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '😴', label: 'Tired' },
]

type MoodPickerProps = {
  selected?: string
  onChange: (mood: string) => void
}

export function MoodPicker({ selected, onChange }: MoodPickerProps) {
  return (
    <div className="flex gap-2">
      {moods.map((mood) => (
        <button
          key={mood.emoji}
          type="button"
          onClick={() => onChange(mood.emoji)}
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all duration-200',
            selected === mood.emoji
              ? 'bg-amber-500/20 ring-2 ring-amber-500 scale-110'
              : 'bg-white/5 hover:bg-white/10 hover:scale-105'
          )}
          title={mood.label}
        >
          {mood.emoji}
        </button>
      ))}
    </div>
  )
}
