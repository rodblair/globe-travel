import Link from 'next/link'
import {
  ArrowRight,
  Check,
  Footprints,
  MapPinned,
  MessageSquareText,
  Repeat2,
  Route,
  Share2,
  Users,
} from 'lucide-react'
import { GUEST_HREF, SiteHeader } from '@/components/marketing/SiteHeader'
import { SiteFooter } from '@/components/marketing/SiteFooter'
import { ChatMock, ProductMock, VoteMock } from '@/components/marketing/ProductMock'
import { LandingFaq } from '@/components/marketing/LandingFaq'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PLANS } from '@/lib/plans'

const FEATURES = [
  {
    icon: Route,
    title: 'Walkable days, on a map',
    body: 'Every day is a real route with distances and walking times, so the plan matches how you will actually move.',
  },
  {
    icon: Repeat2,
    title: 'Swap anything in one tap',
    body: 'Not feeling a stop? Swap it, reorder the day, or ask the planner to smooth things out. The map redraws instantly.',
  },
  {
    icon: Users,
    title: 'Everyone gets a say',
    body: 'Friends react to the plan on a share page. You see who is in and what to change before anyone books.',
  },
  {
    icon: Share2,
    title: 'One link, no sign-up',
    body: 'Send a single read-only link. It opens in any browser and looks great on a phone.',
  },
  {
    icon: MessageSquareText,
    title: 'Plan by chatting',
    body: 'Describe the trip the way you would tell a friend. Refine it with plain follow-ups like "less walking" or "add a rooftop bar".',
  },
  {
    icon: MapPinned,
    title: 'Stays and bookings nearby',
    body: 'Jump from any stop to check hotels and activities with the providers you already use.',
  },
]

const STEPS = [
  {
    id: 'how',
    kicker: 'Step 1',
    title: 'Tell it the trip',
    body: 'Say who is going, how long, and what the group cares about. Globe.travel drafts a plan in seconds, and you keep refining it by chat.',
    bullets: ['Works with a rough idea or a detailed brief', 'Pace, budget and group size are respected'],
    visual: <ChatMock />,
  },
  {
    kicker: 'Step 2',
    title: 'See it on a real map',
    body: 'Each day becomes a route you can read at a glance: stops in order, walking distance and time, and where you eat and sleep.',
    bullets: ['Optimise a day with one click', 'Swap or reorder stops and the route updates'],
    visual: <ProductMock />,
    wide: true,
  },
  {
    kicker: 'Step 3',
    title: 'Share it and decide together',
    body: 'Send one link. Friends react and leave notes without making an account, and you see where the group agrees.',
    bullets: ['Read-only link anyone can open', 'Feedback collected in one place'],
    visual: <VoteMock />,
  },
]

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main aria-label="Globe.travel overview" className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="bg-glow pointer-events-none absolute inset-0" />
          <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-16 pb-12 text-center md:px-6 md:pt-24">
            <Badge variant="outline" className="mb-6 gap-2 bg-background/80 px-3 py-1 text-sm backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" />
              AI trip planner for groups
            </Badge>
            <h1 className="h-hero max-w-4xl">
              Plan the trip <span className="text-primary">everyone</span> says yes to.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Describe your trip and get a mapped, walkable itinerary in seconds. Share one link, let your friends
              weigh in, and lock it in. No more 200-message group chats.
            </p>
            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="xl" className="w-full rounded-full sm:w-auto">
                <Link href="/signup">
                  Start planning free
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="w-full rounded-full sm:w-auto">
                <Link href={GUEST_HREF}>Try as guest</Link>
              </Button>
            </div>
            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {['Free to start', 'No credit card', 'Share links stay yours'].map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="size-4 text-success" />
                  {item}
                </li>
              ))}
            </ul>

            <ProductMock className="mt-14 w-full max-w-5xl text-left md:mt-16" />
          </div>
        </section>

        {/* AUDIENCE STRIP */}
        <section aria-label="Who it is for" className="border-y bg-muted/40">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-sm font-medium text-muted-foreground md:px-6">
            {['Friend trips', 'Couples getaways', 'Family city breaks', 'Bachelor & bachelorette weekends', 'Work offsites'].map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="scroll-mt-20 py-20 md:py-28">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="brass" className="mb-4">How it works</Badge>
              <h2 className="text-3xl font-bold md:text-5xl">From group chat to a plan everyone has agreed on</h2>
              <p className="mt-4 text-lg text-muted-foreground">Three steps, one place, no spreadsheets.</p>
            </div>

            <div className="mt-16 space-y-20 md:space-y-28">
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className={
                    step.wide
                      ? 'grid items-center gap-8'
                      : 'grid items-center gap-8 md:grid-cols-2 md:gap-14'
                  }
                >
                  <div className={step.wide ? 'mx-auto max-w-2xl text-center' : index % 2 === 1 ? 'md:order-2' : ''}>
                    <p className="text-sm font-semibold text-primary">{step.kicker}</p>
                    <h3 className="mt-2 text-2xl font-bold md:text-4xl">{step.title}</h3>
                    <p className="mt-4 text-lg text-muted-foreground">{step.body}</p>
                    <ul className={step.wide ? 'mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2' : 'mt-5 space-y-2'}>
                      {step.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-center gap-2 text-base">
                          <Check className="size-4 shrink-0 text-success" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={step.wide ? '' : index % 2 === 1 ? 'md:order-1' : ''}>{step.visual}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="scroll-mt-20 border-t bg-muted/40 py-20 md:py-28">
          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="brass" className="mb-4">Features</Badge>
              <h2 className="text-3xl font-bold md:text-5xl">Everything a group trip needs</h2>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <Card key={title} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription className="text-base">{body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING TEASER */}
        <section aria-labelledby="pricing-heading" className="py-20 md:py-28">
          <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="brass" className="mb-4">Pricing</Badge>
              <h2 id="pricing-heading" className="text-3xl font-bold md:text-5xl">Start free. Upgrade when the trip gets real.</h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{PLANS.free.name}</CardTitle>
                  <CardDescription>Plan and share your next trip.</CardDescription>
                  <p className="pt-2 text-4xl font-bold tracking-tight">$0</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['2 saved trips', '10 AI messages a day', 'Shareable review links'].map((item) => (
                    <p key={item} className="flex items-center gap-2 text-sm"><Check className="size-4 text-success" />{item}</p>
                  ))}
                  <Button asChild variant="outline" size="lg" className="mt-3 w-full rounded-full">
                    <Link href="/signup">Start free</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="border-primary shadow-md ring-1 ring-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{PLANS.pro.name}</CardTitle>
                    <Badge>7-day free trial</Badge>
                  </div>
                  <CardDescription>For the group planning workspace.</CardDescription>
                  <p className="pt-2 text-4xl font-bold tracking-tight">
                    ${PLANS.pro.monthlyPrice}<span className="text-base font-normal text-muted-foreground"> / month</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['Unlimited trips', 'Unlimited AI messages', 'Advanced maps & walking routes'].map((item) => (
                    <p key={item} className="flex items-center gap-2 text-sm"><Check className="size-4 text-success" />{item}</p>
                  ))}
                  <Button asChild size="lg" className="mt-3 w-full rounded-full">
                    <Link href="/pricing">See plans</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t bg-muted/40 py-20 md:py-28">
          <div className="mx-auto w-full max-w-3xl px-4 md:px-6">
            <h2 className="text-center text-3xl font-bold md:text-5xl">Questions, answered</h2>
            <div className="mt-10">
              <LandingFaq />
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <section className="px-4 py-20 md:px-6 md:py-28">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground md:px-12">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,oklch(1_0_0/0.18),transparent)]" />
            <div className="relative">
              <Footprints className="mx-auto mb-4 size-8 opacity-80" />
              <h2 className="text-3xl font-bold md:text-5xl">Your next group trip starts here.</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/85">
                Free to start. Faster than a spreadsheet. Calmer than the group chat.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="xl" variant="secondary" className="w-full rounded-full sm:w-auto">
                  <Link href="/signup">Plan your first trip<ArrowRight /></Link>
                </Button>
                <Button asChild size="xl" variant="ghost" className="w-full rounded-full text-primary-foreground hover:bg-white/10 hover:text-primary-foreground sm:w-auto">
                  <Link href={GUEST_HREF}>Try as guest</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
