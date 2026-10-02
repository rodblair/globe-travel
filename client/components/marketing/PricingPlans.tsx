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
      <div role="group" aria-label="Billing interval" className="inline-flex rounded-full bg-secondary p-1.5">
        {(['monthly', 'yearly'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={interval === value}
            onClick={() => setInterval(value)}
            className={cn(
              'h-11 rounded-full px-6 text-base font-semibold transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
              interval === value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {value === 'monthly' ? 'Monthly' : `Yearly · save ${savings}%`}
          </button>
        ))}
      </div>

      <div className="mt-9 grid gap-7 md:grid-cols-2">
        <div className="rounded-[2rem] border bg-card p-9 md:p-11">
          <p className="text-lg font-bold text-muted-foreground">{PLANS.free.name}</p>
          <p className="mt-2 font-serif text-[6rem] leading-none font-medium tracking-[-0.04em]">$0</p>
          <p className="mt-3 text-lg text-muted-foreground">Free forever. Plan and share your next trip.</p>
          <Button asChild variant="outline" size="lg" className="mt-7">
            <Link href="/signup">Start free</Link>
          </Button>
          <ul className="mt-8 divide-y divide-border border-t">
            {FREE_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 py-3.5 text-lg">
                <Check className="size-4 shrink-0 text-success" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] bg-plate p-9 text-plate-foreground md:p-11">
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-[#ffd48a]">{PLANS.pro.name}</p>
            <span className="rounded-full bg-sun px-4 py-1.5 text-sm font-bold text-[#0f2431]">7-day free trial</span>
          </div>
          <p className="mt-2 font-serif text-[6rem] leading-none font-medium tracking-[-0.04em]">
            ${interval === 'yearly' ? yearlyMonthly : PLANS.pro.monthlyPrice.toFixed(2)}
            <span className="font-sans text-2xl font-normal text-plate-foreground/70"> / month</span>
          </p>
          <p className="mt-3 text-lg text-plate-foreground/75">
            {interval === 'yearly' ? `Billed $${PLANS.pro.yearlyPrice} yearly.` : 'Billed monthly.'} Cancel any time.
          </p>
          <Button asChild variant="bone" size="lg" className="mt-7 pr-1.5">
            <Link href={BILLING_HREF}>
              Start 7-day free trial
              <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                <ArrowRight className="size-[1.125rem]" />
              </span>
            </Link>
          </Button>
          <ul className="mt-8 divide-y divide-plate-foreground/20 border-t border-plate-foreground/20">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 py-3.5 text-lg">
                <Check className="size-4 shrink-0 text-[#ffd48a]" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-6 text-base text-muted-foreground">No charge today. Your share links stay yours.</p>
    </div>
  )
}
