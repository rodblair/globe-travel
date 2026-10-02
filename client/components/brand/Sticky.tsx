import { cn } from '@/lib/utils'

const TONES = {
  note: 'bg-[#ffe8a8]',
  glass: 'bg-[#bfe6df]',
  peach: 'bg-[#ffd9b8]',
} as const

/** A friend's reaction as a handwritten sticky note. */
export function Sticky({
  children,
  author,
  tone = 'note',
  tilt = -2,
  className,
}: {
  children: React.ReactNode
  author?: string
  tone?: keyof typeof TONES
  tilt?: number
  className?: string
}) {
  return (
    <div
      className={cn('rounded-[6px] px-4 pt-3.5 pb-4 text-[#0f2431] shadow-md', TONES[tone], className)}
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <p className="font-hand text-[1.75rem] leading-[1.05]">{children}</p>
      {author ? <p className="mt-1.5 text-sm font-semibold">{author}</p> : null}
    </div>
  )
}
