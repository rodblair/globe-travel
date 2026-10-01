'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'

type Interval = 'monthly' | 'yearly'

const BILLING_HREF = '/signup?next=%2Faccount%3Ftab%3Dbilling'
const FREE_FEATURES = [
  `${PLANS.free.limits.trips} saved trips`,
  `${PLANS.free.limits.aiMessagesPerDay} AI messages a day`,
  `${PLANS.free.limits.journalEntries} trip notes`,
  'Basic itinerary maps',
  'Shareable review links',
]
const PRO_FEATURES = [
  'Unlimited trips',
  'Unlimited AI messages',
  'Unlimited trip notes',
  'Advanced maps & walking routes',
  'Friend feedback review pages',
  'Priority AI responses',
]

export function PricingPlans() {
  const [interval, setInterval] = useState<Interval>('yearly')
  const yearlyMonthly = (PLANS.pro.yearlyPrice / 12).toFixed(2)
  const savings = Math.round((1 - PLANS.pro.yearlyPrice / (PLANS.pro.monthlyPrice * 12)) * 100)

  return (
    <div>
      <div role="group" aria-label="Billing interval" className="inline-flex border border-foreground">
        {(['monthly', 'yearly'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={interval === value}
            onClick={() => setInterval(value)}
            className={cn(
              'h-11 px-5 text-sm font-semibold transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
              interval === value ? 'bg-foreground text-background' : 'hover:bg-accent',
            )}
          >
            {value === 'monthly' ? 'Monthly' : `Yearly · save ${savings}%`}
          </button>
        ))}
      </div>

      <div className="mt-8 grid border border-foreground md:grid-cols-2">
        <div className="p-8 md:p-10">
          <p className="text-sm font-semibold text-muted-foreground">{PLANS.free.name}</p>
          <p className="mt-2 text-7xl leading-none" style={{ fontFamily: 'var(--font-serif)' }}>$0</p>
          <p className="mt-2 text-muted-foreground">Free forever. Plan and share your next trip.</p>
          <Button asChild variant="outline" size="lg" className="mt-8 w-full sm:w-auto">
            <Link href="/signup">Start free</Link>
          </Button>
          <ul className="mt-8 divide-y divide-foreground/15 border-t border-foreground/15">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 py-3">
                <Check className="size-4 shrink-0 text-success" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-foreground bg-foreground p-8 text-background md:border-t-0 md:border-l md:p-10">
          <p className="text-sm font-semibold text-background/70">{PLANS.pro.name} · 7-day free trial</p>
          <p className="mt-2 text-7xl leading-none" style={{ fontFamily: 'var(--font-serif)' }}>
            ${interval === 'yearly' ? yearlyMonthly : PLANS.pro.monthlyPrice.toFixed(2)}
            <span className="text-xl font-normal text-background/70"> / month</span>
          </p>
          <p className="mt-2 text-background/70">
            {interval === 'yearly' ? `Billed $${PLANS.pro.yearlyPrice} yearly.` : 'Billed monthly.'} Cancel any time.
          </p>
          <Button asChild size="lg" className="mt-8 w-full sm:w-auto">
            <Link href={BILLING_HREF}>
              Start 7-day free trial
              <ArrowRight />
            </Link>
          </Button>
          <ul className="mt-8 divide-y divide-background/20 border-t border-background/20">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 py-3">
                <Check className="size-4 shrink-0 text-[oklch(0.78_0.14_40)]" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">No charge today. Your share links stay yours.</p>
    </div>
  )
}
