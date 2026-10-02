import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { HorizonGlobe, Stars } from '@/components/brand/HorizonGlobe'
import { Postcard } from '@/components/brand/Postcard'
import { Sticky } from '@/components/brand/Sticky'
import { LandingFaq } from '@/components/marketing/LandingFaq'
import {
  ChatVignette,
  MapVignette,
  PhoneShare,
  StudioFrame,
  VoteVignette,
} from '@/components/marketing/ProductMock'
import { SiteFooter } from '@/components/marketing/SiteFooter'
import { GUEST_HREF, SiteHeader } from '@/components/marketing/SiteHeader'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/plans'

const container = 'mx-auto w-full max-w-7xl px-4 md:px-10'
const h2 = 'text-[clamp(2.5rem,5vw,4rem)] leading-[1.02] font-medium tracking-[-0.03em]'

function Kicker({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`mb-4 flex items-center gap-3 text-base font-bold ${light ? 'text-[#ffd48a]' : 'text-primary'}`}>
      <span aria-hidden className="h-0.5 w-9 bg-current" />
      {children}
    </p>
  )
}

function ArrowCircle() {
  return (
    <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
      <ArrowRight className="size-5" />
    </span>
  )
}

const STEPS = [
  { n: 'Step one', title: 'Tell it the trip', body: 'Say who is going and what the group loves. Refine it in plain words, any time.', visual: <ChatVignette />, offset: '' },
  { n: 'Step two', title: 'Watch it land on the map', body: 'Every day is a real walking route. Swap a stop and the line redraws itself.', visual: <MapVignette />, offset: 'md:mt-14' },
  { n: 'Step three', title: 'Send one link, get a yes', body: 'Friends open it on any phone, react, and leave a note. Nobody has to sign up.', visual: <VoteVignette />, offset: 'md:mt-5' },
]

const POSTCARDS = [
  { scene: 'lisbon', title: 'Lisbon', caption: 'Trams, viewpoints, slow dinners', tilt: -2, offset: '', mark: true },
  { scene: 'kyoto', title: 'Kyoto', caption: 'Temples, markets, tea at dusk', tilt: 1.5, offset: 'lg:mt-9', mark: false },
  { scene: 'athens', title: 'Athens', caption: 'Ruins by day, islands by ferry', tilt: -1, offset: 'lg:mt-2', mark: false },
  { scene: 'marrakech', title: 'Marrakech', caption: 'Souks, rooftops, sunset tea', tilt: 2, offset: 'lg:mt-11', mark: false },
] as const

const STUDIO_POINTS = [
  'Walking distances and times for every day',
  'Swap, reorder or rewrite a day in a click',
  "Friends' reactions sit right beside the plan",
]

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <main aria-label="Globe.travel overview" className="flex-1">
        {/* HERO: dusk sky, rising globe */}
        <section className="relative isolate min-h-[60rem] overflow-hidden bg-dusk sm:min-h-[54rem] lg:h-[56.25rem]">
          <Stars className="absolute inset-x-0 top-0 h-64" />
          <HorizonGlobe className="absolute inset-x-0 bottom-0 h-[16rem] lg:h-[27.5rem]" />
          <SiteHeader variant="dusk" />

          <div className={`${container} relative pt-36 lg:pt-44`}>
            <div className="max-w-[44rem] text-[#fff8ec]">
              <p className="mb-6 inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-[#fff8ec]/40 py-2 pr-4 pl-3 text-[0.9375rem] font-semibold">
                <span className="size-2.5 rounded-full bg-[#ffd48a]" />
                Group trips, decided together
              </p>
              <h1 className="text-[clamp(3.25rem,7.4vw,5.75rem)] leading-[0.98] font-medium tracking-[-0.035em]">
                Plan the trip <em className="font-normal text-[#ffd48a] italic">everyone</em> says yes&nbsp;to.
              </h1>
              <p className="mt-7 max-w-xl text-xl leading-relaxed text-[#fff8ec]/90">
                Tell it where. Get a mapped, walkable plan in seconds. Send one link and let your friends weigh in.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
                <Button asChild variant="bone" size="xl" className="pr-2">
                  <Link href="/signup">
                    Start planning free
                    <ArrowCircle />
                  </Link>
                </Button>
                <Link href={GUEST_HREF} className="border-b-2 border-[#ffd48a] pb-0.5 text-[1.0625rem] font-semibold">
                  or try it as a guest
                </Link>
              </div>
              <p className="mt-6 flex flex-wrap gap-x-6 gap-y-1 text-[0.9375rem] text-[#fff8ec]/85">
                <span>Free to start</span>
                <span>No card needed</span>
                <span>Friends need no account</span>
              </p>
            </div>

            <div className="pointer-events-none absolute top-28 right-4 hidden h-[26rem] w-[33rem] lg:block xl:right-0 xl:top-32">
              <Postcard scene="lisbon" title="Lisbon" caption="3 days · 5 friends" tilt={-7} className="absolute top-8 right-[16rem] w-56" aspect="aspect-[226/200]" />
              <Postcard scene="kyoto" title="Kyoto" caption="5 days · 3 friends" tilt={5} postmark className="absolute top-0 right-0 w-56" aspect="aspect-[226/200]" />
              <Postcard scene="athens" title="Athens" caption="4 days · 4 friends" tilt={-2} className="absolute top-[17rem] right-[8.5rem] w-56 -translate-y-6" aspect="aspect-[226/170]" />
              <p className="font-hand absolute top-[19.5rem] right-0 text-[1.75rem] leading-none text-[#ffe29a]" style={{ transform: 'rotate(-8deg)' }}>
                4 friends,<br />1 island!
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="relative scroll-mt-20 py-24 md:py-32">
          <div className={container}>
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-3xl">
                <Kicker>How it works</Kicker>
                <h2 className={h2}>From group chat to a yes, in three easy steps.</h2>
              </div>
              <p className="max-w-sm text-lg leading-relaxed text-muted-foreground">
                No spreadsheets, no 200-message threads. Just one plan everyone can see, and react to.
              </p>
            </div>

            <div className="relative mt-16">
              <svg
                viewBox="0 0 1200 180"
                fill="none"
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-14 hidden h-44 w-full md:block"
                preserveAspectRatio="none"
              >
                <path d="M10 90 C160 -10 260 190 420 90 S700 -10 820 100 S1100 170 1190 60" stroke="#C93E22" strokeWidth="3.4" strokeDasharray="1 10" strokeLinecap="round" />
              </svg>
              <div className="relative grid items-start gap-7 md:grid-cols-3">
                {STEPS.map((step) => (
                  <article key={step.title} className={`overflow-hidden rounded-[1.75rem] border bg-card shadow-lg ${step.offset}`}>
                    <div className="h-[17rem] overflow-hidden">{step.visual}</div>
                    <div className="px-7 pt-6 pb-8">
                      <p className="font-serif text-xl text-primary italic">{step.n}</p>
                      <h3 className="mt-1.5 text-[2rem] leading-[1.08] font-medium tracking-[-0.025em]">{step.title}</h3>
                      <p className="mt-3 text-[1.0625rem] leading-relaxed text-muted-foreground">{step.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* POSTCARDS */}
        <section id="trips" className="scroll-mt-20 bg-secondary py-24 md:py-32">
          <div className={container}>
            <div className="max-w-3xl">
              <Kicker>Destinations</Kicker>
              <h2 className={h2}>Every trip becomes a postcard worth keeping.</h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Your plans live on a shelf of little illustrated places. Open one to see the map, the days, and what your friends said.
              </p>
            </div>
            <div className="mt-16 grid grid-cols-2 items-start gap-5 lg:grid-cols-4 lg:gap-7">
              {POSTCARDS.map((p) => (
                <div key={p.title} className={p.offset}>
                  <Postcard scene={p.scene} title={p.title} caption={p.caption} tilt={p.tilt} postmark={p.mark} aspect="aspect-square" />
                </div>
              ))}
            </div>
            <p className="mt-10 text-sm text-muted-foreground">Sample destinations shown for illustration.</p>
          </div>
        </section>

        {/* TRIP STUDIO */}
        <section id="features" className="relative scroll-mt-20 overflow-hidden bg-plate py-24 text-plate-foreground md:py-32">
          <div className={`${container} grid items-center gap-14 lg:grid-cols-[26rem_1fr] lg:gap-16`}>
            <div>
              <Kicker light>Trip Studio</Kicker>
              <h2 className="text-[clamp(2.5rem,4.6vw,3.625rem)] leading-[1.03] font-medium tracking-[-0.03em]">
                See the whole trip. Move one stop, the route follows.
              </h2>
              <ul className="mt-8 grid gap-4 text-lg leading-snug text-plate-foreground/85">
                {STUDIO_POINTS.map((point) => (
                  <li key={point} className="flex gap-3.5">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" strokeWidth={3.2} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <StudioFrame />
              <p className="font-hand absolute -bottom-12 left-2 hidden text-[1.875rem] leading-none text-[#ffd48a] md:block" style={{ transform: 'rotate(-4deg)' }}>
                drag a stop, the route redraws
              </p>
            </div>
          </div>
        </section>

        {/* SHARE */}
        <section className="py-24 md:py-32">
          <div className={`${container} grid items-center gap-16 lg:grid-cols-[26rem_1fr]`}>
            <div className="flex justify-center">
              <PhoneShare />
            </div>
            <div>
              <Kicker>Share</Kicker>
              <h2 className={h2}>One link. Your friends don&apos;t need an account.</h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
                They open a calm, readable page on their phone, react in one tap, and leave a note. You see who is in and what to change.
              </p>
              <div className="mt-10 flex flex-wrap gap-5">
                <Sticky author="Maya" tilt={-3} className="w-56">Day 2 looks perfect!</Sticky>
                <Sticky author="Sam" tone="glass" tilt={2} className="w-56">Can lunch be a bit later?</Sticky>
                <Sticky author="Jonas" tone="peach" tilt={-1} className="w-56">Ferry to Hydra, yes please</Sticky>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="bg-secondary py-24 md:py-32">
          <div className={container}>
            <div className="max-w-3xl">
              <Kicker>Pricing</Kicker>
              <h2 className={h2}>Start free. Upgrade when the trip gets real.</h2>
            </div>
            <div className="mt-12 grid gap-7 md:grid-cols-2">
              <div className="rounded-[2rem] border bg-card p-9 md:p-10">
                <p className="text-lg font-bold text-muted-foreground">{PLANS.free.name}</p>
                <p className="mt-2 font-serif text-7xl leading-none font-medium tracking-[-0.03em]">$0</p>
                <p className="mt-3 text-lg text-muted-foreground">Plan and share your next trip.</p>
                <ul className="mt-6 grid gap-3 text-lg">
                  {['2 saved trips', '10 AI messages a day', 'Shareable review links'].map((i) => (
                    <li key={i} className="flex items-center gap-3"><Check className="size-4 text-success" />{i}</li>
                  ))}
                </ul>
                <Button asChild variant="outline" size="lg" className="mt-8">
                  <Link href="/signup">Start free</Link>
                </Button>
              </div>
              <div className="rounded-[2rem] bg-plate p-9 text-plate-foreground md:p-10">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-[#ffd48a]">{PLANS.pro.name}</p>
                  <span className="rounded-full bg-sun px-4 py-1.5 text-sm font-bold text-[#0f2431]">7-day free trial</span>
                </div>
                <p className="mt-2 font-serif text-7xl leading-none font-medium tracking-[-0.03em]">
                  ${PLANS.pro.monthlyPrice}
                  <span className="font-sans text-xl font-normal text-plate-foreground/70"> / month</span>
                </p>
                <p className="mt-3 text-lg text-plate-foreground/75">For groups planning together.</p>
                <ul className="mt-6 grid gap-3 text-lg">
                  {['Unlimited trips', 'Unlimited AI messages', 'Advanced maps & walking routes'].map((i) => (
                    <li key={i} className="flex items-center gap-3"><Check className="size-4 text-[#ffd48a]" />{i}</li>
                  ))}
                </ul>
                <Button asChild size="lg" className="mt-8">
                  <Link href="/pricing">See plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 py-24 md:py-32">
          <div className={`${container} grid gap-10 lg:grid-cols-[24rem_1fr] lg:gap-20`}>
            <h2 className={h2}>Questions, answered.</h2>
            <LandingFaq />
          </div>
        </section>

        {/* CLOSING */}
        <section className="relative isolate h-[32rem] overflow-hidden bg-dusk-deep text-center md:h-[40rem]">
          <HorizonGlobe labels={false} className="absolute inset-x-0 bottom-0 h-[11rem] md:h-[16rem]" />
          <div className="relative mx-auto max-w-4xl px-4 pt-24 md:pt-32">
            <h2 className="text-[clamp(2.75rem,6.4vw,5.5rem)] leading-[0.98] font-medium tracking-[-0.035em] text-[#fff8ec]">
              Your next trip starts with a <em className="font-normal text-[#ffd48a] italic">yes.</em>
            </h2>
            <Button asChild variant="bone" size="xl" className="mt-9 pr-2">
              <Link href="/signup">
                Start planning free
                <ArrowCircle />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
