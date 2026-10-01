import { Check, Clock, Footprints, MapPin, Send, Sparkles, ThumbsUp } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STOPS = [
  { n: 1, name: 'Acropolis Museum', time: '09:00', note: 'Skip the queue, 90 min' },
  { n: 2, name: 'Plaka lunch', time: '12:30', note: 'Taverna on Adrianou' },
  { n: 3, name: 'Ancient Agora', time: '14:30', note: 'Shaded, flat walk' },
  { n: 4, name: 'Monastiraki', time: '17:00', note: 'Coffee and vintage shops' },
  { n: 5, name: 'Filopappou sunset', time: '19:30', note: 'Best view of the Acropolis' },
]

/** Stylised city map: land, water, roads, route, numbered pins. Tokens only. */
function MockMap({ className }: { className?: string }) {
  const pins = [
    { n: 1, x: 118, y: 250 },
    { n: 2, x: 210, y: 175 },
    { n: 3, x: 300, y: 130 },
    { n: 4, x: 390, y: 190 },
    { n: 5, x: 330, y: 300 },
  ]
  return (
    <svg viewBox="0 0 480 360" role="img" aria-label="Walking route across five stops" className={cn('h-full w-full', className)} preserveAspectRatio="xMidYMid slice">
      <rect width="480" height="360" className="fill-muted" />
      <path d="M0 300 C70 270 120 340 200 330 S340 360 480 320 V360 H0Z" className="fill-primary/10" />
      <path d="M-10 60 C80 30 150 90 240 60 S400 20 490 70 V0 H-10Z" className="fill-chart-2/15" />
      <g className="stroke-border" strokeWidth="6" fill="none" strokeLinecap="round">
        <path d="M0 210 C100 190 160 230 260 200 S400 150 480 170" />
        <path d="M150 0 C170 90 140 160 175 260 S210 340 200 360" />
        <path d="M340 0 C330 90 360 170 350 250 S380 330 400 360" />
        <path d="M0 120 C120 110 220 120 300 100 S430 90 480 110" />
      </g>
      <g className="fill-background/70">
        <rect x="236" y="214" width="46" height="30" rx="6" />
        <rect x="70" y="150" width="52" height="34" rx="6" />
        <rect x="400" y="240" width="48" height="36" rx="6" />
        <rect x="260" y="40" width="60" height="28" rx="6" />
      </g>
      <polyline
        points={pins.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        className="stroke-primary"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 9"
      />
      <polyline
        points={pins.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="none"
        className="stroke-primary/40"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pins.map((p) => (
        <g key={p.n} transform={`translate(${p.x} ${p.y})`}>
          <circle r="17" className="fill-primary/15" />
          <circle r="12" className="fill-primary stroke-background" strokeWidth="3" />
          <text textAnchor="middle" dy="4" className="fill-primary-foreground text-[12px] font-semibold">
            {p.n}
          </text>
        </g>
      ))}
    </svg>
  )
}

/** Browser-framed Trip Studio preview used in the landing hero. */
export function ProductMock({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
        <div className="flex items-center gap-3 border-b bg-muted/60 px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
          </div>
          <div className="mx-auto flex h-6 w-full max-w-xs items-center justify-center rounded-md bg-background text-xs text-muted-foreground">
            globe.travel/trips/athens
          </div>
        </div>

        <div className="grid md:grid-cols-[18rem_1fr]">
          <div className="border-b p-4 md:border-r md:border-b-0">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">4 days in Athens</p>
                <p className="text-xs text-muted-foreground">Day 1 · Acropolis & Plaka</p>
              </div>
              <Badge variant="brass">Draft</Badge>
            </div>
            <ol className="space-y-1.5">
              {STOPS.map((stop) => (
                <li key={stop.n} className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {stop.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{stop.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{stop.note}</span>
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">{stop.time}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative min-h-64 md:min-h-[26rem]">
            <MockMap />
            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full border bg-card/95 px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur">
              <Footprints className="size-3.5 text-primary" />
              3.5 km · 44 min walk
            </div>
            <div className="absolute right-3 bottom-3 flex items-center gap-2 rounded-xl border bg-card/95 p-2.5 shadow-md backdrop-blur">
              <div className="flex -space-x-2">
                {['M', 'J', 'A'].map((initial) => (
                  <Avatar key={initial} className="size-6 border-2 border-card">
                    <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="text-xs leading-tight">
                <p className="font-semibold">3 of 4 said yes</p>
                <p className="text-muted-foreground">Sam wants a later lunch</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Chat preview: describe the trip in plain language. */
export function ChatMock({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border bg-card p-4 shadow-lg', className)}>
      <div className="space-y-3">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          4 friends, 4 days in Athens. Relaxed mornings, great food, one island overnight.
        </div>
        <div className="flex gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Sparkles className="size-3.5" />
          </span>
          <div className="max-w-[85%] space-y-2 rounded-2xl rounded-bl-md bg-muted px-4 py-2.5 text-sm">
            <p>Here is a 4 day plan with a night on Hydra. I kept each day walkable and put dinner near your hotel.</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline"><MapPin /> 22 stops</Badge>
              <Badge variant="outline"><Clock /> Slow mornings</Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
        <span className="flex-1">Swap lunch for something vegetarian…</span>
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Send className="size-3.5" />
        </span>
      </div>
    </div>
  )
}

/** Share + vote preview: friends react on one page. */
export function VoteMock({ className }: { className?: string }) {
  const votes = [
    { name: 'Maya', vote: 'Love it', tone: 'text-success' },
    { name: 'Jonas', vote: 'Love it', tone: 'text-success' },
    { name: 'Alex', vote: 'Love it', tone: 'text-success' },
    { name: 'Sam', vote: 'Move lunch later', tone: 'text-warning' },
  ]
  return (
    <div className={cn('rounded-2xl border bg-card p-4 shadow-lg', className)}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Friend feedback</p>
        <Badge variant="success"><Check /> 3 of 4 in</Badge>
      </div>
      <ul className="divide-y">
        {votes.map((v) => (
          <li key={v.name} className="flex items-center gap-3 py-2.5">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">{v.name[0]}</AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-medium">{v.name}</span>
            <span className={cn('flex items-center gap-1.5 text-sm', v.tone)}>
              <ThumbsUp className="size-3.5" />
              {v.vote}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
        <span className="truncate">globe.travel/t/athens-crew</span>
        <span className="ml-auto rounded-md bg-background px-2 py-1 font-medium text-foreground">Copy link</span>
      </div>
    </div>
  )
}
