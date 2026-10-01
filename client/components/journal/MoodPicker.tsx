'use client'

import { Button } from '@/components/ui/button'
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
        <Button
          key={mood.emoji}
          type="button"
          onClick={() => onChange(selected === mood.emoji ? '' : mood.emoji)}
          aria-pressed={selected === mood.emoji}
          variant={selected === mood.emoji ? 'default' : 'secondary'}
          size="sm"
          className={cn(
            'min-h-12 px-3 py-1.5 transition-all duration-200',
            selected === mood.emoji
              ? 'scale-105 ring-1 ring-[color:var(--primary)]/40'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground/80'
          )}
          title={mood.label}
       >
          <span className="text-base leading-none">{mood.emoji}</span>
          <span className="text-xs font-medium">{mood.label}</span>
        </Button>
      ))}
    </div>
  )
}
