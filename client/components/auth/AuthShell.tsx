import Link from 'next/link'
import { CalendarCheck, Map, Users } from 'lucide-react'
import { GlobeBrand } from '@/components/atmosphere/GlobeBrand'
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
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle ? <p className="mt-2 text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-14" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_0%,oklch(1_0_0/0.22),transparent),radial-gradient(50%_50%_at_0%_100%,oklch(0.78_0.15_75/0.25),transparent)]" />
        <div className="relative">
          <p className="max-w-md text-4xl font-bold leading-tight tracking-tight">{panelTitle}</p>
        </div>
        <VoteMock className="relative my-10 w-full max-w-sm -rotate-2 self-center text-card-foreground" />
        <ul className="relative space-y-4">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-lg">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
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
