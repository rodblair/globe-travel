import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { GUEST_HREF, SiteHeader } from '@/components/marketing/SiteHeader'
import { SiteFooter } from '@/components/marketing/SiteFooter'
import { ChatMock, ProductMock, VoteMock } from '@/components/marketing/ProductMock'
import { LandingFaq } from '@/components/marketing/LandingFaq'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/plans'

const STEPS = [
  {
    n: '01',
    title: 'Tell it the trip.',
    body: 'Say who is going, how long, and what the group cares about. Globe.travel drafts a mapped plan in seconds, and you keep refining it in plain language.',
    visual: <ChatMock />,
  },
  {
    n: '02',
    title: 'See every day on the map.',
    body: 'Stops in order, distances on foot, where you eat and where you sleep. Swap a stop and the route redraws. Optimise a day with one click.',
    visual: <ProductMock />,
  },
  {
    n: '03',
    title: 'Send one link. Get a yes.',
    body: 'Friends open a read-only page on any phone, react, and leave a note. No accounts, no group-chat archaeology. You see where everyone agrees.',
    visual: <VoteMock />,
  },
]

const FEATURES = [
  ['Walkable days', 'Real routes with distances and walking times, so the plan matches how you actually move.'],
  ['One-tap swaps', 'Not feeling a stop? Swap it, reorder the day, or ask for less walking. The map keeps up.'],
  ['A say for everyone', 'Reactions land in one place, with a clear read on who is in and what to change.'],
  ['Plan by chatting', 'Describe the trip like you would to a friend. Follow up with "add a rooftop bar".'],
  ['Stays nearby', 'Jump from any stop to check hotels and activities with the providers you already use.'],
  ['Made for phones', 'Share pages are fast, readable and calm on a small screen, because that is where friends will open them.'],
]

const PLACES = ['Lisbon', 'Kyoto', 'Athens', 'Oaxaca', 'Porto', 'Marrakech', 'Istanbul', 'Copenhagen']

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main aria-label="Globe.travel overview" className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-foreground">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 pt-10 pb-16 md:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:pt-16 lg:pb-24">
            <div className="flex flex-col justify-center">
              <p className="flex items-center gap-3 text-sm font-semibold">
                <span aria-hidden className="h-px w-10 bg-primary" />
                Group trips, decided together
              </p>
              <h1 className="mt-5 text-[clamp(3rem,7.2vw,6.5rem)] leading-[0.95] font-medium tracking-[-0.035em]">
                Plan the trip <em className="font-normal text-primary">everyone</em> says yes&nbsp;to.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Describe a trip, get a mapped day-by-day plan, and share one link. Your friends react, you decide, nobody
                scrolls a 200-message thread.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
                <Button asChild size="xl">
                  <Link href="/signup">
                    Start planning free
                    <ArrowRight />
                  </Link>
                </Button>
                <Link
                  href={GUEST_HREF}
                  className="text-base font-semibold underline decoration-primary decoration-2 underline-offset-[6px] hover:text-primary"
                >
                  or try it as a guest
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {['Free to start', 'No card needed', 'Friends need no account'].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="size-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:pt-4">
              <ProductMock />
            </div>
          </div>
        </section>

        {/* PLACES RULE */}
        <section aria-label="Places" className="overflow-hidden border-b border-foreground bg-card">
          <ul className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-5 md:px-6">
            <li className="text-sm font-semibold text-muted-foreground">City trips from</li>
            {PLACES.map((place) => (
              <li key={place} className="text-2xl italic" style={{ fontFamily: 'var(--font-serif)' }}>
                {place}
              </li>
            ))}
            <li className="text-sm text-muted-foreground">and anywhere you can describe.</li>
          </ul>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">How it works</p>
              <h2 className="mt-3 text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.02]">
                From group chat to a plan everyone has agreed on.
              </h2>
            </div>

            <div className="mt-14 border-t border-foreground">
              {STEPS.map((step, index) => (
                <div
                  key={step.n}
                  className="grid items-center gap-8 border-b border-foreground py-12 md:py-16 lg:grid-cols-12 lg:gap-12"
                >
                  <div className={index % 2 === 1 ? 'lg:order-2 lg:col-span-5' : 'lg:col-span-5'}>
                    <p className="text-[clamp(4rem,9vw,7rem)] leading-none text-primary" style={{ fontFamily: 'var(--font-serif)' }}>
                      {step.n}
                    </p>
                    <h3 className="mt-4 text-3xl leading-tight md:text-4xl">{step.title}</h3>
                    <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                  <div className={index % 2 === 1 ? 'lg:order-1 lg:col-span-7' : 'lg:col-span-7'}>{step.visual}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES, ocean plate */}
        <section id="features" className="scroll-mt-20 bg-plate py-20 text-plate-foreground md:py-28">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 md:px-6 lg:grid-cols-[1fr_1.6fr]">
            <div>
              <p className="text-sm font-semibold text-[oklch(0.78_0.14_40)]">What you get</p>
              <h2 className="mt-3 text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02]">
                Everything a group trip needs, nothing it doesn&apos;t.
              </h2>
            </div>
            <dl className="grid gap-x-10 sm:grid-cols-2">
              {FEATURES.map(([term, desc], i) => (
                <div key={term} className="border-t border-plate-foreground/30 py-6">
                  <dt className="flex items-baseline gap-3 text-2xl" style={{ fontFamily: 'var(--font-serif)' }}>
                    <span className="text-sm font-semibold text-[oklch(0.78_0.14_40)]">{String(i + 1).padStart(2, '0')}</span>
                    {term}
                  </dt>
                  <dd className="mt-2 text-base leading-relaxed text-plate-foreground/75">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* PRICING */}
        <section aria-labelledby="pricing-heading" className="py-20 md:py-28">
          <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">Pricing</p>
              <h2 id="pricing-heading" className="mt-3 text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02]">
                Start free. Upgrade when the trip gets real.
              </h2>
            </div>
            <div className="mt-12 grid gap-0 border border-foreground md:grid-cols-2">
              <div className="p-8 md:p-10">
                <p className="text-sm font-semibold text-muted-foreground">{PLANS.free.name}</p>
                <p className="mt-2 text-6xl" style={{ fontFamily: 'var(--font-serif)' }}>$0</p>
                <ul className="mt-6 space-y-2.5">
                  {['2 saved trips', '10 AI messages a day', 'Shareable review links'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check className="size-4 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild variant="outline" size="lg" className="mt-8">
                  <Link href="/signup">Start free</Link>
                </Button>
              </div>
              <div className="border-t border-foreground bg-foreground p-8 text-background md:border-t-0 md:border-l md:p-10">
                <p className="text-sm font-semibold text-background/70">{PLANS.pro.name} · 7-day free trial</p>
                <p className="mt-2 text-6xl" style={{ fontFamily: 'var(--font-serif)' }}>
                  ${PLANS.pro.monthlyPrice}
                  <span className="text-lg font-normal text-background/70"> / month</span>
                </p>
                <ul className="mt-6 space-y-2.5">
                  {['Unlimited trips', 'Unlimited AI messages', 'Advanced maps & walking routes'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <Check className="size-4 text-[oklch(0.78_0.14_40)]" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="mt-8">
                  <Link href="/pricing">
                    See plans
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-foreground py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-[1fr_1.6fr]">
            <h2 className="text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02]">Questions, answered.</h2>
            <LandingFaq />
          </div>
        </section>

        {/* CLOSING */}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-20 md:px-6 md:py-28 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-3xl text-[clamp(2.75rem,6.4vw,5.5rem)] leading-[0.97]">Your next trip starts with a yes.</h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button asChild size="xl" className="bg-background text-foreground hover:bg-background/90">
                <Link href="/signup">
                  Plan your first trip
                  <ArrowRight />
                </Link>
              </Button>
              <Link href={GUEST_HREF} className="text-base font-semibold underline decoration-2 underline-offset-[6px]">
                or try it as a guest
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
