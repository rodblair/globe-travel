import { Check, Footprints, Send, Sparkles } from 'lucide-react'
import { CartographicPlate } from '@/components/brand/CartographicPlate'
import { cn } from '@/lib/utils'

const STOPS = [
  { n: 1, name: 'Acropolis Museum', time: '09:00' },
  { n: 2, name: 'Plaka lunch', time: '12:30' },
  { n: 3, name: 'Ancient Agora', time: '14:30' },
  { n: 4, name: 'Monastiraki', time: '17:00' },
  { n: 5, name: 'Filopappou', time: '19:30' },
]

/** Trip Studio as a printed plate: map on the left, the day as a numbered ledger. */
export function ProductMock({ className }: { className?: string }) {
  return (
    <figure className={cn('relative', className)}>
      <div className="overflow-hidden rounded-lg border border-foreground bg-card shadow-[6px_6px_0_0_var(--foreground)]">
        <div className="grid md:grid-cols-[1.35fr_1fr]">
          <div className="relative min-h-72 border-b border-foreground md:min-h-[26rem] md:border-r md:border-b-0">
            <CartographicPlate seed="athens-day-one" stops={5} label="Walking route through five stops in Athens" />
            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-sm border border-foreground bg-card px-2.5 py-1 text-xs font-semibold">
              <Footprints className="size-3.5 text-primary" />
              3.5 km · 44 min on foot
            </div>
            <p className="absolute bottom-3 left-3 font-mono text-[0.75rem] tracking-tight text-foreground/70">37.97°N 23.73°E</p>
          </div>
          <div className="flex flex-col p-5">
            <p className="text-sm font-semibold text-primary">Day 1</p>
            <h3 className="mt-0.5 text-2xl leading-tight">Acropolis &amp; Plaka</h3>
            <ol className="mt-4 divide-y divide-foreground/15 border-y border-foreground/15">
              {STOPS.map((stop) => (
                <li key={stop.n} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {stop.n}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">{stop.name}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{stop.time}</span>
                </li>
              ))}
            </ol>
            <p className="mt-auto pt-4 text-sm text-muted-foreground">4 friends · 3 said yes</p>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">Plate 01.</span> A day in Athens, mapped and ready to share.
      </figcaption>
    </figure>
  )
}

/** Chat preview: describe the trip in plain language. */
export function ChatMock({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border border-foreground bg-card p-5 shadow-[6px_6px_0_0_var(--foreground)]', className)}>
      <div className="space-y-4">
        <div className="ml-auto max-w-[88%] rounded-md bg-foreground px-4 py-3 text-sm text-background">
          Four of us, four days in Athens. Slow mornings, great food, one island overnight.
        </div>
        <div className="flex gap-3">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </span>
          <div className="max-w-[88%] space-y-2 text-sm leading-relaxed">
            <p>
              Here is a four-day plan with a night on Hydra. Each day is walkable, and dinner is always near your hotel.
            </p>
            <p className="font-semibold">22 stops · slow mornings · 1 ferry</p>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 rounded-md border border-foreground/30 px-3 py-2 text-sm text-muted-foreground">
        <span className="flex-1">Swap lunch for something vegetarian…</span>
        <span className="flex size-7 items-center justify-center rounded-sm bg-primary text-primary-foreground">
          <Send className="size-3.5" />
        </span>
      </div>
    </div>
  )
}

/** Share + vote preview: friends react on one page. */
export function VoteMock({ className }: { className?: string }) {
  const votes = [
    { name: 'Maya', vote: 'Love it', yes: true },
    { name: 'Jonas', vote: 'Love it', yes: true },
    { name: 'Alex', vote: 'Love it', yes: true },
    { name: 'Sam', vote: 'Move lunch later', yes: false },
  ]
  return (
    <div className={cn('rounded-lg border border-foreground bg-card p-5 text-card-foreground shadow-[6px_6px_0_0_var(--foreground)]', className)}>
      <div className="flex items-baseline justify-between">
        <p className="text-xl font-medium" style={{ fontFamily: 'var(--font-serif)' }}>Friend feedback</p>
        <p className="text-sm font-semibold text-success">3 of 4 in</p>
      </div>
      <ul className="mt-3 divide-y divide-foreground/15 border-y border-foreground/15">
        {votes.map((v) => (
          <li key={v.name} className="flex items-center gap-3 py-2.5">
            <span className="flex size-7 items-center justify-center rounded-full border border-foreground/40 text-xs font-semibold">
              {v.name[0]}
            </span>
            <span className="flex-1 text-sm font-medium">{v.name}</span>
            <span className={cn('flex items-center gap-1.5 text-sm', v.yes ? 'text-success' : 'text-foreground')}>
              {v.yes && <Check className="size-3.5" />}
              {v.vote}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs">
        <span className="truncate text-muted-foreground">globe.travel/t/athens-crew</span>
        <span className="ml-auto font-semibold">Copy link</span>
      </div>
    </div>
  )
}
