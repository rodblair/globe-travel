'use client'

import { cn } from '@/lib/utils'

export const MOODS = [
  { emoji: '🤩', label: 'Amazed' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😌', label: 'Peaceful' },
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
    <div className="flex flex-wrap gap-2">
      {MOODS.map((mood) => (
        <button
          key={mood.emoji}
          type="button"
          onClick={() => onChange(selected === mood.emoji ? '' : mood.emoji)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200',
            selected === mood.emoji
              ? 'bg-amber-500/25 ring-1 ring-amber-400/60 text-amber-200 scale-105'
              : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80'
          )}
          title={mood.label}
        >
          <span className="text-base leading-none">{mood.emoji}</span>
          <span className="text-xs font-medium">{mood.label}</span>
        </button>
      ))}
    </div>
  )
}
