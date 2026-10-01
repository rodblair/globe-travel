import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, Minus } from 'lucide-react'
import { SiteHeader, GUEST_HREF } from '@/components/marketing/SiteHeader'
import { SiteFooter } from '@/components/marketing/SiteFooter'
import { PricingPlans } from '@/components/marketing/PricingPlans'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PLANS } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Start free, then upgrade for unlimited trips, AI planning, maps, sharing, and friend feedback.',
}

const COMPARISON: Array<[string, string | boolean, string | boolean]> = [
  ['Saved trips', String(PLANS.free.limits.trips), 'Unlimited'],
  ['AI messages per day', String(PLANS.free.limits.aiMessagesPerDay), 'Unlimited'],
  ['Trip notes', String(PLANS.free.limits.journalEntries), 'Unlimited'],
  ['Itinerary maps', true, true],
  ['Advanced maps & walking routes', false, true],
  ['Shareable review links', true, true],
  ['Friend feedback review pages', 'Basic', 'Unlimited'],
  ['Priority AI responses', false, true],
]

const PRICING_FAQ = [
  {
    q: 'Do I need a card to start?',
    a: 'No. Explorer is free and needs no payment details. Adventurer starts with a 7-day free trial, and you can cancel before it ends without being charged.',
  },
  {
    q: 'Can I switch between monthly and yearly?',
    a: 'Yes. You can change your billing interval or cancel from the billing tab in your account at any time.',
  },
  {
    q: 'What happens to my trips if I downgrade?',
    a: 'Your trips and share links stay put. On the free plan you can keep editing within the plan limits, and nothing you have already shared is removed.',
  },
  {
    q: 'Can I try it before paying?',
    a: 'Yes. Use Try as guest to plan a trip right away, or create a free account to keep your work.',
  },
]

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="mx-auto size-4 text-success" aria-label="Included" />
  if (value === false) return <Minus className="mx-auto size-4 text-muted-foreground" aria-label="Not included" />
  return <span>{value}</span>
}

export default function PricingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div aria-hidden className="bg-glow pointer-events-none absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-4 pt-16 pb-20 md:px-6 md:pt-24">
            <div className="mx-auto max-w-2xl text-center">
              <Badge variant="brass" className="mb-4">Pricing</Badge>
              <h1 className="text-4xl font-bold md:text-6xl">Start free. Upgrade when the trip gets real.</h1>
              <p className="mt-5 text-lg text-muted-foreground">
                Plan a city trip, map the days, share the itinerary and collect feedback before anyone commits.
                Upgrade when Globe.travel becomes your group&apos;s planning workspace.
              </p>
            </div>
            <div className="mt-12">
              <PricingPlans />
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/40 py-20">
          <div className="mx-auto w-full max-w-4xl px-4 md:px-6">
            <h2 className="text-center text-3xl font-bold md:text-4xl">Compare plans</h2>
            <div className="mt-10 overflow-hidden rounded-xl border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Feature</TableHead>
                    <TableHead className="text-center">{PLANS.free.name}</TableHead>
                    <TableHead className="text-center text-primary">{PLANS.pro.name}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COMPARISON.map(([feature, free, pro]) => (
                    <TableRow key={feature}>
                      <TableCell className="font-medium">{feature}</TableCell>
                      <TableCell className="text-center text-muted-foreground"><Cell value={free} /></TableCell>
                      <TableCell className="text-center"><Cell value={pro} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto w-full max-w-3xl px-4 md:px-6">
            <h2 className="text-center text-3xl font-bold md:text-4xl">Pricing questions</h2>
            <Accordion type="single" collapsible className="mt-8">
              {PRICING_FAQ.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-left text-base font-medium">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <section className="px-4 pb-20 md:px-6">
          <div className="mx-auto max-w-4xl rounded-3xl border bg-card px-6 py-12 text-center shadow-sm">
            <h2 className="text-2xl font-bold md:text-4xl">Give the group one plan to react to.</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Start with the free workspace, or begin Adventurer when you already know this trip needs more room.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full rounded-full sm:w-auto">
                <Link href="/signup?next=%2Faccount%3Ftab%3Dbilling">Start free trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full rounded-full sm:w-auto">
                <Link href={GUEST_HREF}>Try as guest</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
