import { ArrowRight, Check, Footprints, Sparkles } from 'lucide-react'
import { CartographicPlate } from '@/components/brand/CartographicPlate'
import { Scene } from '@/components/brand/Scene'
import { cn } from '@/lib/utils'

const AVATAR_TONES = ['bg-primary text-primary-foreground', 'bg-dusk text-[#fff8ec]', 'bg-chart-2 text-white', 'bg-sun text-[#0f2431]']

export function Avatars({ names, className }: { names: string[]; className?: string }) {
  return (
    <div className={cn('flex', className)}>
      {names.map((n, i) => (
        <span
          key={n}
          className={cn(
            'grid size-10 place-items-center rounded-full border-[3px] border-card text-sm font-bold',
            AVATAR_TONES[i % AVATAR_TONES.length],
            i > 0 && '-ml-3',
          )}
        >
          {n}
        </span>
      ))}
    </div>
  )
}

/** Step one: describe the trip. */
export function ChatVignette() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 bg-peach p-6">
      <div className="max-w-[16rem] self-end rounded-[1.125rem] rounded-br-sm bg-foreground px-4 py-3 text-[0.9375rem] leading-snug text-background">
        Four of us, four days in Athens. Slow mornings, great food.
      </div>
      <div className="flex items-start gap-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="size-3.5" />
        </span>
        <div className="max-w-[16rem] rounded-[1.125rem] rounded-bl-sm bg-card px-4 py-3 text-[0.9375rem] leading-snug">
          Here is a walkable plan with a night on Hydra. 22 stops.
        </div>
      </div>
      <div className="mt-1 flex h-11 items-center justify-between rounded-full bg-card/70 pr-1.5 pl-4 text-sm text-muted-foreground">
        Swap lunch for something vegetarian…
        <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </div>
  )
}

/** Step two: the route lands on a map. */
export function MapVignette() {
  return (
    <div className="relative h-full bg-glass">
      <CartographicPlate seed="how-it-works-map" stops={5} label="Map with a dotted route through five numbered stops" />
      <p className="absolute top-5 left-5 rounded-full bg-card px-3.5 py-1.5 text-sm font-semibold shadow-sm">
        3.5 km · 44 min on foot
      </p>
    </div>
  )
}

/** Step three: friends vote. */
export function VoteVignette() {
  const rows = [
    { n: 'M', tone: AVATAR_TONES[0], label: 'Love it', full: true },
    { n: 'J', tone: AVATAR_TONES[1], label: 'Love it', full: true },
    { n: 'A', tone: AVATAR_TONES[2], label: 'Love it', full: true },
    { n: 'S', tone: AVATAR_TONES[3], label: 'Later lunch?', full: false },
  ]
  return (
    <div className="flex h-full flex-col justify-center gap-3 bg-note p-7">
      <p className="font-serif text-2xl font-medium tracking-tight">3 of 4 said yes</p>
      {rows.map((r) => (
        <div key={r.n} className="flex items-center gap-3">
          <span className={cn('grid size-8 place-items-center rounded-full text-sm font-bold', r.tone)}>{r.n}</span>
          <span className={cn('h-3 flex-1 rounded-full', r.full ? 'bg-chart-2' : 'bg-foreground/15')} />
          <span className="w-24 text-sm font-semibold">{r.label}</span>
        </div>
      ))}
    </div>
  )
}

const STOPS = [
  ['Acropolis Museum', '09:00'],
  ['Plaka lunch', '12:30'],
  ['Ancient Agora', '14:30'],
  ['Monastiraki', '17:00'],
  ['Filopappou sunset', '19:30'],
]

/** Trip Studio in a window: day tabs, numbered stops, map and a friend's comment. */
export function StudioFrame({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[1.75rem] bg-card text-card-foreground shadow-xl', className)}>
      <div className="flex h-14 items-center justify-between border-b px-5">
        <div className="flex gap-2" aria-hidden>
          <span className="size-3 rounded-full bg-border" />
          <span className="size-3 rounded-full bg-border" />
          <span className="size-3 rounded-full bg-border" />
        </div>
        <p className="font-serif text-lg font-medium">4 days in Athens</p>
        <span className="rounded-full bg-primary px-3.5 py-1.5 text-sm font-bold text-primary-foreground">Share</span>
      </div>
      <div className="grid md:grid-cols-[17rem_1fr]">
        <div className="border-b p-5 md:border-r md:border-b-0">
          <div className="mb-4 flex gap-2">
            {['Day 1', 'Day 2', 'Day 3'].map((d, i) => (
              <span
                key={d}
                className={cn('rounded-full px-3.5 py-1.5 text-sm font-semibold', i === 0 ? 'bg-foreground text-background' : 'bg-secondary')}
              >
                {d}
              </span>
            ))}
          </div>
          <p className="mb-1 text-sm font-bold text-primary">Acropolis and Plaka</p>
          <ol>
            {STOPS.map(([name, time], i) => (
              <li key={name} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                <span className="grid size-7 place-items-center rounded-full bg-primary text-[0.8125rem] font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="flex-1 text-[0.9375rem] font-semibold">{name}</span>
                <span className="text-sm text-muted-foreground">{time}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="relative min-h-[26rem] bg-glass">
          <CartographicPlate seed="studio-frame-athens" stops={5} label="Map of day one with a dotted route through five stops" />
          <p className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-sm font-semibold shadow-sm">
            <Footprints className="size-4 text-primary" />3.5 km · 44 min walk
          </p>
          <div className="absolute right-4 bottom-4 flex w-52 items-start gap-2.5 rounded-2xl bg-card p-3 shadow-md">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sun text-sm font-bold text-[#0f2431]">S</span>
            <p className="text-sm leading-snug">
              <strong className="font-bold">Sam</strong> Can lunch be a bit later?
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** The public share page on a phone. */
export function PhoneShare({ className }: { className?: string }) {
  return (
    <div className={cn('relative h-[40rem] w-80 rounded-[3.1rem] bg-[#0f2431] p-3 shadow-xl', className)}>
      <div className="h-full overflow-hidden rounded-[2.5rem] bg-background text-foreground">
        <div className="h-52">
          <Scene scene="athens" />
        </div>
        <div className="px-5 pt-4">
          <p className="font-serif text-[1.75rem] leading-[1.05] font-medium tracking-[-0.025em]">4 days in Athens</p>
          <p className="mt-1.5 text-sm text-muted-foreground">Planned by Maya, Jonas, Alex and Sam</p>
          {['Day 1 · Acropolis|5 stops', 'Day 2 · Islands|4 stops'].map((row) => {
            const [a, b] = row.split('|')
            return (
              <div key={a} className="mt-2.5 flex items-center justify-between rounded-2xl bg-card px-4 py-3">
                <span className="text-[0.9375rem] font-semibold">{a}</span>
                <span className="text-[0.8125rem] text-muted-foreground">{b}</span>
              </div>
            )
          })}
          <p className="mt-4 mb-2 text-sm font-bold">What do you think?</p>
          <div className="flex gap-2">
            <span className="grid h-11 flex-1 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">Love it</span>
            <span className="grid h-11 flex-1 place-items-center rounded-full border-2 border-border bg-card text-sm font-semibold">Curious</span>
            <span className="grid h-11 flex-1 place-items-center rounded-full border-2 border-border bg-card text-sm font-semibold">Note</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Friend feedback card, used on the sign-in panel. */
export function VoteMock({ className }: { className?: string }) {
  const votes = [
    { name: 'Maya', vote: 'Love it', yes: true },
    { name: 'Jonas', vote: 'Love it', yes: true },
    { name: 'Alex', vote: 'Love it', yes: true },
    { name: 'Sam', vote: 'Move lunch later', yes: false },
  ]
  return (
    <div className={cn('rounded-2xl bg-card p-5 text-card-foreground shadow-xl', className)}>
      <div className="flex items-baseline justify-between">
        <p className="font-serif text-xl font-medium">Friend feedback</p>
        <p className="text-sm font-bold text-success">3 of 4 in</p>
      </div>
      <ul className="mt-3 divide-y divide-border">
        {votes.map((v, i) => (
          <li key={v.name} className="flex items-center gap-3 py-2.5">
            <span className={cn('grid size-8 place-items-center rounded-full text-xs font-bold', AVATAR_TONES[i % 4])}>{v.name[0]}</span>
            <span className="flex-1 text-sm font-semibold">{v.name}</span>
            <span className={cn('flex items-center gap-1.5 text-sm', v.yes ? 'text-success' : 'text-foreground')}>
              {v.yes ? <Check className="size-3.5" /> : null}
              {v.vote}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs">
        <span className="truncate text-muted-foreground">globe.travel/t/athens-crew</span>
        <span className="ml-auto font-bold">Copy link</span>
      </div>
    </div>
  )
}

