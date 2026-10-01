import Link from 'next/link'
import { CalendarCheck, Map, Users } from 'lucide-react'
import { GlobeBrand } from '@/components/atmosphere/GlobeBrand'
import { CartographicPlate } from '@/components/brand/CartographicPlate'
import { VoteMock } from '@/components/marketing/ProductMock'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const POINTS = [
  { icon: Map, text: 'A walkable, mapped itinerary in seconds' },
  { icon: Users, text: 'One link for friends to react, no sign-up needed' },
  { icon: CalendarCheck, text: 'Lock in the plan before anyone books' },
]

/**
 * Split auth layout shared by login, signup and reset-password:
 * form on the left, product value panel on the right (desktop only).
 */
export function AuthShell({
  title,
  subtitle,
  panelTitle = 'Plan the trip everyone says yes to.',
  children,
}: {
  title: string
  subtitle?: string
  panelTitle?: string
  children: React.ReactNode
}) {
  return (
    <main className="grid min-h-dvh bg-background text-foreground lg:grid-cols-2" aria-label="Authentication">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Globe.travel home" className="inline-flex">
            <GlobeBrand />
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-medium">{title}</h1>
          {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-plate text-plate-foreground lg:flex lg:flex-col lg:justify-between lg:p-14" aria-hidden="true">
        <div aria-hidden className="absolute inset-0 opacity-25 mix-blend-screen"><CartographicPlate seed="auth-panel" stops={6} showPins={false} /></div>
        <div className="relative">
          <p className="max-w-md text-5xl leading-[1.02]" style={{ fontFamily: 'var(--font-serif)' }}>{panelTitle}</p>
        </div>
        <VoteMock className="relative my-10 w-full max-w-sm self-center text-card-foreground" />
        <ul className="relative space-y-4">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-lg">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm border border-plate-foreground/30">
                <Icon className="size-5" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </aside>
    </main>
  )
}
