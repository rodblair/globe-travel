'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PLANS } from '@/lib/plans'

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
      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={interval}
          onValueChange={(value) => value && setInterval(value as Interval)}
          variant="outline"
          aria-label="Billing interval"
          className="rounded-full bg-muted p-1"
        >
          <ToggleGroupItem value="monthly" className="rounded-full px-5 data-[state=on]:bg-background data-[state=on]:shadow-xs">
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem value="yearly" className="gap-2 rounded-full px-5 data-[state=on]:bg-background data-[state=on]:shadow-xs">
            Yearly
            <Badge variant="success" className="px-1.5 py-0">Save {savings}%</Badge>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{PLANS.free.name}</CardTitle>
            <CardDescription>Plan and share your next trip.</CardDescription>
            <p className="pt-3 text-5xl font-bold tracking-tight">$0</p>
            <p className="text-sm text-muted-foreground">Free forever</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild variant="outline" size="lg" className="w-full rounded-full">
              <Link href="/signup">Start free</Link>
            </Button>
            <ul className="space-y-2.5">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <Check className="size-4 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-primary shadow-md ring-1 ring-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xl">{PLANS.pro.name}</CardTitle>
              <Badge>7-day free trial</Badge>
            </div>
            <CardDescription>For groups planning together.</CardDescription>
            <p className="pt-3 text-5xl font-bold tracking-tight">
              ${interval === 'yearly' ? yearlyMonthly : PLANS.pro.monthlyPrice.toFixed(2)}
              <span className="text-base font-normal text-muted-foreground"> / month</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {interval === 'yearly' ? `Billed $${PLANS.pro.yearlyPrice} yearly` : 'Billed monthly'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild size="lg" className="w-full rounded-full">
              <Link href={BILLING_HREF}>Start 7-day free trial</Link>
            </Button>
            <ul className="space-y-2.5">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <Check className="size-4 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">No charge today. Cancel any time. Your share links stay yours.</p>
    </div>
  )
}
