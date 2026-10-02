import Link from 'next/link'
import { GlobeBrand } from '@/components/atmosphere/GlobeBrand'
import { HorizonGlobe, Stars } from '@/components/brand/HorizonGlobe'
import { Postcard } from '@/components/brand/Postcard'
import { Sticky } from '@/components/brand/Sticky'
import { ThemeToggle } from '@/components/ui/theme-toggle'

/**
 * Split auth layout shared by login, signup and reset-password:
 * the form on paper, and a dusk-sky postcard panel on desktop.
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
      <div className="flex flex-col px-5 py-6 sm:px-12 lg:px-[4.5rem]">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Globe.travel home" className="inline-flex">
            <GlobeBrand />
          </Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-[clamp(2.75rem,5vw,4.5rem)] leading-[0.98] tracking-[-0.04em]">{title}</h1>
          {subtitle ? <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{subtitle}</p> : null}
          <div className="mt-9">{children}</div>
        </div>
      </div>

      <aside className="relative isolate hidden overflow-hidden bg-dusk lg:block" aria-hidden="true">
        <Stars className="absolute inset-x-0 top-0 h-56" />
        <HorizonGlobe labels={false} className="absolute inset-x-0 bottom-0 h-[16rem]" />
        <p className="absolute top-16 right-16 left-16 text-right font-serif text-[1.875rem] leading-[1.05] font-medium tracking-[-0.025em] text-[#fff8ec]">
          {panelTitle}
        </p>
        <Postcard
          scene="kyoto"
          title="Kyoto, in the autumn"
          caption="5 days · 3 friends"
          tilt={-4}
          postmark
          className="absolute top-44 left-[16%] w-80"
          aspect="aspect-[302/260]"
        />
        <Sticky author="Sam" tilt={3} className="absolute top-[22rem] right-[10%] w-56">
          Tea at dusk, yes please!
        </Sticky>
      </aside>
    </main>
  )
}
