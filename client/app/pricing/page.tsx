import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Crown, Map, MessageSquare, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { GlobeBrand } from '@/components/atmosphere/GlobeBrand'
import { CompassRose } from '@/components/atmosphere/CompassRose'
import { ContourOverlay } from '@/components/atmosphere/ContourOverlay'
import { MeridianFrame } from '@/components/atmosphere/MeridianFrame'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Start free, then upgrade for unlimited trip notes, AI planning, maps, sharing, and friend feedback.',
}

const proMonthly = PLANS.pro.monthlyPrice.toFixed(2)
const proMonthlyFromYearly = (PLANS.pro.yearlyPrice / 12).toFixed(2)

const coreBenefits = [
  {
    icon: Map,
    title: 'Maps that match the itinerary',
    body: 'Every day keeps its stops, routes, and share preview tied together so friends can trust the plan.',
  },
  {
    icon: MessageSquare,
    title: 'Feedback without another thread',
    body: 'Share a review page, collect reactions, and decide what needs to change before anyone books.',
  },
  {
    icon: Users,
    title: 'Built for small groups',
    body: 'Couples, families, and friend groups can compare pacing, neighborhoods, and must-do stops in one calm workspace.',
  },
]

const comparisonRows = [
  ['Saved trips', String(PLANS.free.limits.trips), 'Unlimited'],
  ['Trip notes', String(PLANS.free.limits.journalEntries), 'Unlimited'],
  ['AI messages / day', String(PLANS.free.limits.aiMessagesPerDay), 'Unlimited'],
  ['Friend-ready sharing', 'Basic links', 'Review pages with feedback'],
]

export default function PricingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-paper text-foreground">
      <section className="relative border-b border-rule px-4 pb-16 pt-5 md:px-6 md:pb-20">
        <div aria-hidden className="absolute inset-0 opacity-75">
          <ContourOverlay density="sparse" />
        </div>
        <div className="paper-grain pointer-events-none absolute inset-0" />

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex min-h-11 items-center">
            <GlobeBrand />
          </Link>
          <nav className="hidden items-center gap-6 t-mono text-[0.6875rem] uppercase tracking-[0.16em] text-ink-2 md:flex">
            <Link href="/#how" className="flex min-h-11 items-center transition-colors hover:text-foreground">
              How it works
            </Link>
            <Link href="/login" className="flex min-h-11 items-center transition-colors hover:text-foreground">
              Sign in
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto grid max-w-6xl gap-10 pt-14 lg:grid-cols-[minmax(0,0.95fr)_minmax(340px,0.72fr)] lg:items-start lg:pt-18">
          <div className="max-w-3xl">
            <p className="mb-4 t-mono text-[0.6875rem] uppercase tracking-[0.18em] text-[var(--brass)]">
              Globe.travel pricing
            </p>
            <h1 className="h-display max-w-[15ch] leading-[1.05] text-foreground">
              Start free. Upgrade when the trip gets real.
            </h1>
            <p className="mt-6 max-w-2xl text-body-lg leading-relaxed text-ink-2">
              Plan a city trip, map the days, share the itinerary, and collect friend feedback before anyone commits. Adventurer removes the limits when Globe becomes the group planning workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="xl" className="rounded-full px-8">
                <Link href="/signup?next=%2Faccount%3Ftab%3Dbilling" className="touch-target">
                  Start 7-day free trial
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="rounded-full px-8">
                <Link href="/api/guest/start?next=%2Fchat" className="touch-target">
                  Try as guest
                </Link>
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-ink-3">
              {['No charge today', 'Cancel anytime', 'Your share links stay yours'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[var(--moss)]" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative rounded-[28px] border border-rule bg-paper-raised p-5 shadow-[var(--shadow-md)] sm:p-6">
            <MeridianFrame inset={10} length={14} color="var(--ink-3)" opacity={0.55} />
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--brass)]/25 bg-[color:var(--brass-subtle)] px-3 py-1">
              <Crown className="h-4 w-4 text-[var(--brass)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--brass)]">Adventurer</span>
            </div>
            <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
              <span className="text-5xl font-bold text-foreground">${proMonthly}</span>
              <span className="pb-1 text-sm font-medium text-ink-2">/ month</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-2">
              Or ${proMonthlyFromYearly}/month when billed yearly at ${PLANS.pro.yearlyPrice}. Includes a 7-day free trial.
            </p>
            <div className="mt-6 space-y-2">
              {PLANS.pro.features.slice(0, 7).map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-sm leading-snug text-ink-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brass)]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:px-6 md:py-18">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {coreBenefits.map((benefit) => (
            <article key={benefit.title} className="relative rounded-[24px] border border-rule bg-paper-raised p-6 shadow-[var(--panel-shadow)]">
              <benefit.icon className="mb-5 h-5 w-5 text-[var(--brass)]" strokeWidth={1.5} />
              <h2 className="t-h3 text-foreground">{benefit.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{benefit.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-rule bg-paper-recessed px-4 py-14 md:px-6 md:py-18">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.72fr_1fr] lg:items-start">
          <div>
            <CompassRose size={46} showLabels={false} className="mb-5" />
            <p className="mb-3 t-mono text-[0.6875rem] uppercase tracking-[0.18em] text-ink-3">Plan comparison</p>
            <h2 className="h-detail max-w-[14ch] text-foreground">The free plan proves the trip. Adventurer runs the whole crew.</h2>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-rule bg-paper-raised shadow-[var(--panel-shadow)]">
            <div className="grid grid-cols-[1.1fr_0.8fr_0.95fr] border-b border-rule bg-paper px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
              <span>Feature</span>
              <span>Explorer</span>
              <span>Adventurer</span>
            </div>
            {comparisonRows.map(([feature, free, pro]) => (
              <div key={feature} className="grid grid-cols-[1.1fr_0.8fr_0.95fr] gap-2 border-b border-rule px-4 py-4 text-sm last:border-b-0">
                <span className="font-medium text-foreground">{feature}</span>
                <span className="text-ink-2">{free}</span>
                <span className="font-semibold text-[var(--brass)]">{pro}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 text-center md:px-6 md:py-18">
        <Sparkles className="mx-auto mb-5 h-6 w-6 text-[var(--brass)]" />
        <h2 className="mx-auto max-w-xl h-detail text-foreground">Give the group one plan to react to.</h2>
        <p className="mx-auto mt-4 max-w-md text-body text-ink-2">
          Start with the free workspace, or begin Adventurer when you already know this trip needs more room.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button asChild size="xl" className="rounded-full px-8">
            <Link href="/signup?next=%2Faccount%3Ftab%3Dbilling" className="touch-target">
              Start free trial
            </Link>
          </Button>
          <Button asChild variant="ghost" size="xl" className="rounded-full px-8">
            <Link href="/" className="touch-target">
              Back to Globe.travel
            </Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
