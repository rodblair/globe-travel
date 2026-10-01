"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  LogOut,
  Save,
  TriangleAlert,
  User,
  UserPlus,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PLANS } from '@/lib/plans'
import { openBillingPortal, startCheckout, useSubscription } from '@/hooks/useSubscription'
import { hasProAccess, type Subscription } from '@/lib/subscription'

type AccountTab = 'profile' | 'billing'

const PROFILE_SAVE_NOTICE_TIMEOUT_MS = 8000

function normalizeTab(value: string | null): AccountTab {
  return value === 'billing' ? 'billing' : 'profile'
}

function buildQaSubscription(state: string | null): Subscription | null {
  if (process.env.NODE_ENV !== 'development' || !state) return null

  const periodEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
  const base = {
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    stripeCustomerId: 'cus_globe_qa',
  }

  if (state === 'free') {
    return { plan: 'free', status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false, stripeCustomerId: null }
  }

  if (state === 'canceling') {
    return { ...base, plan: 'pro', status: 'active', cancelAtPeriodEnd: true }
  }

  if (state === 'active' || state === 'trialing' || state === 'past_due' || state === 'canceled') {
    return { ...base, plan: 'pro', status: state }
  }

  return null
}

function billingStatusLabel(subscription: Subscription | null | undefined) {
  if (!subscription || subscription.plan === 'free') return 'Free'
  if (subscription.status === 'trialing') return 'Trial active'
  if (subscription.status === 'active' && subscription.cancelAtPeriodEnd) return 'Cancels soon'
  if (subscription.status === 'active') return 'Active'
  if (subscription.status === 'past_due') return 'Payment needs attention'
  if (subscription.status === 'canceled') return 'Canceled'
  return subscription.status.replaceAll('_', ' ')
}

function billingSummary(subscription: Subscription | null | undefined, isPro: boolean) {
  if (!subscription || subscription.plan === 'free') {
    return 'Free plan with generous limits to get started.'
  }

  if (subscription.status === 'trialing') {
    return `Your ${PLANS.pro.name} trial is active. Keep planning before the first bill.`
  }

  if (subscription.status === 'past_due') {
    return `Your ${PLANS.pro.name} access needs a payment update before it can continue.`
  }

  if (subscription.status === 'canceled') {
    return `Your ${PLANS.pro.name} subscription is canceled. Your saved work remains available.`
  }

  if (subscription.status === 'active' && subscription.cancelAtPeriodEnd) {
    return `Your ${PLANS.pro.name} plan stays active until the current period ends.`
  }

  return isPro ? `${PLANS.pro.name} features are active on this account.` : 'Free plan with generous limits to get started.'
}

function AccountPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, isGuest, signOut, refreshProfile } = useAuth()
  // Guests have no Stripe customer, so billing is account-only.
  const activeTab: AccountTab = isGuest ? 'profile' : normalizeTab(searchParams.get('tab'))
  const { subscription, isPro, isLoading: subscriptionLoading, refetch: refetchSubscription } = useSubscription()
  const qaSubscription = useMemo(() => buildQaSubscription(searchParams.get('qaBillingState')), [searchParams])
  const displayedSubscription = qaSubscription || subscription
  const displayedIsPro = qaSubscription ? hasProAccess(qaSubscription) : isPro
  const checkoutReturned = activeTab === 'billing' && searchParams.get('upgraded') === 'true'
  const billingChecking = subscriptionLoading && !qaSubscription
  const canOpenBillingPortal = displayedIsPro || Boolean(displayedSubscription?.stripeCustomerId)

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)
  const [billingNotice, setBillingNotice] = useState<string | null>(null)
  const profileSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousProfileIdRef = useRef<string | null>(profile?.id || null)
  const billingActionDisabled = billingLoading || (checkoutReturned && !canOpenBillingPortal)
  const qaForceCheckoutFailure = process.env.NODE_ENV === 'development' && searchParams.get('qaCheckoutFailure') === '1'
  const qaForcePortalFailure = process.env.NODE_ENV === 'development' && searchParams.get('qaPortalFailure') === '1'

  useEffect(() => {
    setDisplayName(profile?.display_name || '')
    setUsername(profile?.username || '')
    setBio(profile?.bio || '')
    setProfileError(null)
    const nextProfileId = profile?.id || null
    if (previousProfileIdRef.current !== nextProfileId) {
      previousProfileIdRef.current = nextProfileId
      if (profileSaveTimeoutRef.current) clearTimeout(profileSaveTimeoutRef.current)
      setSaved(false)
    }
  }, [profile?.bio, profile?.display_name, profile?.id, profile?.username])

  useEffect(() => {
    return () => {
      if (profileSaveTimeoutRef.current) clearTimeout(profileSaveTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'billing') return

    if (searchParams.get('checkout') === 'cancelled') {
      setBillingNotice('Checkout was cancelled. Your current plan is unchanged.')
      return
    }

    if (searchParams.get('upgraded') === 'true') {
      setBillingNotice('Checkout returned successfully. We are refreshing your subscription status.')
      void refetchSubscription()
      return
    }

    setBillingNotice(null)
  }, [activeTab, refetchSubscription, searchParams])

  const switchTab = (tab: AccountTab) => {
    const next = new URLSearchParams(searchParams.toString())
    if (tab === 'profile') {
      next.delete('tab')
    } else {
      next.set('tab', tab)
    }
    const query = next.toString()
    router.replace(query ? `/account?${query}` : '/account')
  }

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    setProfileError(null)
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim(),
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || 'Could not save your profile.')
      }
      await refreshProfile()
      setSaved(true)
      if (profileSaveTimeoutRef.current) clearTimeout(profileSaveTimeoutRef.current)
      profileSaveTimeoutRef.current = setTimeout(() => {
        setSaved(false)
      }, PROFILE_SAVE_NOTICE_TIMEOUT_MS)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'Could not save your profile. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleUpgrade = async () => {
    setBillingError(null)
    setBillingNotice(null)
    setBillingLoading(true)
    try {
      if (qaForceCheckoutFailure) throw new Error('Checkout is temporarily unavailable in QA mode.')
      await startCheckout(interval)
    } catch (error: unknown) {
      setBillingError(error instanceof Error ? error.message : 'Checkout is temporarily unavailable. Please try again.')
      setBillingLoading(false)
    }
  }

  const handleManage = async () => {
    setBillingError(null)
    setBillingNotice(null)
    setBillingLoading(true)
    try {
      if (qaForcePortalFailure) throw new Error('Billing portal is temporarily unavailable in QA mode.')
      await openBillingPortal()
    } catch (error: unknown) {
      setBillingError(error instanceof Error ? error.message : 'Could not open billing portal. Please try again.')
      setBillingLoading(false)
    }
  }

  const monthlyCost =
    interval === 'year'
      ? (PLANS.pro.yearlyPrice / 12).toFixed(2)
      : PLANS.pro.monthlyPrice

  const initials = (profile?.display_name || 'T').trim().slice(0, 2).toUpperCase()

  return (
    <div className="min-h-dvh bg-background">
      <div className="app-sticky-header">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-6">
          <h1 className="text-3xl md:text-4xl">Account</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isGuest ? 'You are browsing as a guest.' : 'Manage your profile and subscription.'}
          </p>
          {!isGuest && (
            <Tabs value={activeTab} onValueChange={(value) => switchTab(value as AccountTab)} className="mt-3">
              <TabsList>
                <TabsTrigger value="profile" className="gap-2">
                  <User className="size-4" /> Profile
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <Crown className="size-4" /> Billing
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 md:px-6 md:py-8">
        {isGuest && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle>Keep your trips by creating an account</CardTitle>
              <CardDescription>
                Guest sessions are temporary and live in this browser only. Create a free account to save your trips,
                use them on any device and unlock billing.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild >
                <Link href="/signup?next=%2Ftrips">
                  <UserPlus /> Create free account
                </Link>
              </Button>
              <Button asChild variant="outline" >
                <Link href="/login?next=%2Ftrips">I already have an account</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'profile' && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="size-16">
                    {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate">{profile?.display_name || (isGuest ? 'Guest traveler' : 'Traveler')}</CardTitle>
                    <CardDescription className="truncate">
                      {profile?.username ? `@${profile.username}` : 'No username set'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <Field>
                  <FieldLabel htmlFor="profile-display-name">Display name</FieldLabel>
                  <Input
                    id="profile-display-name"
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your name"
                    maxLength={80}
                    className="h-11"
                  />
                  <FieldDescription>Shown to friends on feedback you leave. {displayName.length}/80</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="profile-username">Username</FieldLabel>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                    <Input
                      id="profile-username"
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="yourusername"
                      maxLength={30}
                      aria-describedby="profile-username-help"
                      className="h-11 pl-7"
                    />
                  </div>
                  <FieldDescription id="profile-username-help">
                    3-30 lowercase letters, numbers, hyphens or underscores. Leave blank to stay private.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
                  <Textarea
                    id="profile-bio"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    placeholder="A short note friends will recognize when you share itinerary feedback."
                    rows={3}
                    maxLength={240}
                    className="resize-none"
                  />
                  <FieldDescription>{bio.length}/240</FieldDescription>
                </Field>

                {profileError && (
                  <Alert variant="destructive">
                    <TriangleAlert />
                    <AlertDescription>{profileError}</AlertDescription>
                  </Alert>
                )}
                {saved && !profileError && (
                  <Alert>
                    <CheckCircle2 className="text-success" />
                    <AlertDescription>Profile saved. Friends will see this on new feedback.</AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                  <Save />
                  {saved ? 'Saved' : saving ? 'Saving…' : 'Save changes'}
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Session</CardTitle>
                  <CardDescription>
                    {isGuest ? 'This guest session ends when you clear your browser data.' : 'Signed in on this device.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleSignOut} variant="outline" className="w-full">
                    <LogOut /> {isGuest ? 'End guest session' : 'Sign out'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'billing' && !isGuest && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current plan</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-3xl font-bold">
                        {displayedSubscription?.plan === 'pro' ? PLANS.pro.name : PLANS.free.name}
                      </p>
                      <StatusBadge tone={displayedIsPro ? 'success' : 'pending'}>
                        {billingStatusLabel(displayedSubscription)}
                      </StatusBadge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {billingChecking ? 'Checking subscription…' : billingSummary(displayedSubscription, displayedIsPro)}
                    </p>
                    {displayedSubscription?.currentPeriodEnd && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Current period ends{' '}
                        {new Date(displayedSubscription.currentPeriodEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm">
                    {(displayedSubscription?.plan === 'pro' ? PLANS.pro.features : PLANS.free.features).slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>
                        {canOpenBillingPortal
                          ? displayedSubscription?.status === 'past_due'
                            ? 'Update billing'
                            : 'Manage subscription'
                          : `Upgrade to ${PLANS.pro.name}`}
                      </CardTitle>
                      <CardDescription className="mt-1.5">
                        {canOpenBillingPortal
                          ? 'Open the Stripe billing portal to manage payment details and invoices.'
                          : 'Unlock unlimited trips, AI messages and richer sharing.'}
                      </CardDescription>
                    </div>
                    {!canOpenBillingPortal && (
                      <ToggleGroup
                        type="single"
                        variant="outline"
                        size="sm"
                        value={interval}
                        onValueChange={(value) => value && setInterval(value as 'month' | 'year')}
                        aria-label="Billing interval"
                      >
                        <ToggleGroupItem value="month">Monthly</ToggleGroupItem>
                        <ToggleGroupItem value="year">Yearly</ToggleGroupItem>
                      </ToggleGroup>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!canOpenBillingPortal && (
                    <div className="rounded-lg bg-primary/5 p-4">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <p className="text-4xl font-bold tracking-tight">
                          ${monthlyCost}
                          <span className="text-sm font-normal text-muted-foreground"> / month</span>
                        </p>
                        <Badge>7-day free trial</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {interval === 'year' ? `$${PLANS.pro.yearlyPrice} billed yearly` : 'Billed monthly'}
                      </p>
                    </div>
                  )}

                  {billingNotice && (
                    <Alert>
                      <CheckCircle2 className="text-success" />
                      <AlertDescription>{billingNotice}</AlertDescription>
                    </Alert>
                  )}

                  {billingError && (
                    <Alert variant="destructive">
                      <TriangleAlert />
                      <AlertDescription>
                        <p>{billingError}</p>
                        <Button
                          type="button"
                          onClick={canOpenBillingPortal ? handleManage : handleUpgrade}
                          disabled={billingLoading}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                       >
                          Try again
                        </Button>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={canOpenBillingPortal ? handleManage : handleUpgrade}
                    disabled={billingActionDisabled}
                    variant={canOpenBillingPortal ? 'outline' : 'default'}
                    size="lg"
                    className="w-full"
                 >
                    {canOpenBillingPortal ? (
                      <>
                        Manage billing
                        <ArrowRight />
                      </>
                    ) : (
                      <>
                        <Zap />
                        {billingLoading ? 'Redirecting…' : checkoutReturned ? 'Checking subscription…' : 'Start free trial'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-base">Plan comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead />
                      <TableHead>{PLANS.free.name}</TableHead>
                      <TableHead className="text-primary">{PLANS.pro.name}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      ['Saved trips', String(PLANS.free.limits.trips), 'Unlimited'],
                      ['AI messages / day', String(PLANS.free.limits.aiMessagesPerDay), 'Unlimited'],
                      ['Trip notes', String(PLANS.free.limits.journalEntries), 'Unlimited'],
                      ['Sharing', 'Basic', 'Advanced'],
                    ].map(([feature, free, pro]) => (
                      <TableRow key={feature}>
                        <TableCell className="font-medium whitespace-normal">{feature}</TableCell>
                        <TableCell className="text-muted-foreground">{free}</TableCell>
                        <TableCell>{pro}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-background" />}>
      <AccountPageContent />
    </Suspense>
  )
}
