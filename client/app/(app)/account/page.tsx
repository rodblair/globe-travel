'use client'

import Image from 'next/image'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  Check,
  Crown,
  LogOut,
  Save,
  Settings,
  User,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { Textarea } from '@/components/ui/textarea'
import { PLANS } from '@/lib/plans'
import { openBillingPortal, startCheckout, useSubscription } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'
import { hasProAccess, type Subscription } from '@/lib/subscription'

type AccountTab = 'profile' | 'billing'

const tabs: { key: AccountTab; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'billing', label: 'Billing', icon: Crown },
]
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
  const activeTab = normalizeTab(searchParams.get('tab'))
  const { profile, signOut, refreshProfile } = useAuth()
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

  return (
    <div className="min-h-screen bg-paper">
      <div className="app-sticky-header">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-serif font-semibold text-foreground">
                  <Settings className="h-7 w-7 text-foreground/40" />
                  Account
                </h1>
                <p className="mt-1 text-sm text-foreground/45">
                  Manage your identity, guest handoff, and subscription for shared trip planning.
                </p>
              </div>
            </div>

            <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto rounded-2xl border border-rule bg-paper-recessed/60 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.key}
                    onClick={() => switchTab(tab.key)}
                    variant="ghost"
                    aria-pressed={activeTab === tab.key}
                    className={cn(
                      'flex-shrink-0 rounded-xl px-4 py-2',
                      activeTab === tab.key
                        ? 'bg-[var(--brass-subtle)] text-foreground'
                        : 'text-foreground/45 hover:bg-paper-recessed/60 hover:text-foreground/75'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5 md:px-6 md:py-8">
        {activeTab === 'profile' && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_320px] lg:gap-7">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-rule bg-paper-recessed/60 p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rule bg-paper-recessed sm:h-16 sm:w-16">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name || 'Traveler'}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <User className="h-7 w-7 text-foreground/25" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium text-foreground">
                      {profile?.display_name || 'Traveler'}
                    </p>
                    <p className="truncate text-sm text-foreground/40">
                      {profile?.username ? `@${profile.username}` : 'Username not set'}
                    </p>
                    {profile?.bio && (
                      <p className="mt-1 line-clamp-2 text-sm text-foreground/35">{profile.bio}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-5">
                  <Field>
                    <FieldLabel htmlFor="profile-display-name">
                      Display name
                    </FieldLabel>
                    <Input
                      id="profile-display-name"
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Your name"
                      maxLength={80}
                      className="min-h-11 rounded-xl bg-paper/40 sm:py-3"
                    />
                    <FieldDescription>{displayName.length}/80 characters</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="profile-username">
                      Username
                    </FieldLabel>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/30">
                        @
                      </span>
                      <Input
                        id="profile-username"
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="yourusername"
                        maxLength={30}
                        aria-describedby="profile-username-help"
                        className="min-h-11 rounded-xl bg-paper/40 pl-8 sm:py-3"
                      />
                    </div>
                    <FieldDescription id="profile-username-help">
                      3-30 lowercase letters, numbers, hyphens, or underscores. Leave blank to stay private.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="profile-bio">
                      Bio
                    </FieldLabel>
                    <Textarea
                      id="profile-bio"
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="A short note friends will recognize when you share itinerary feedback."
                      rows={3}
                      maxLength={240}
                      className="resize-none rounded-xl bg-paper/40 sm:py-3"
                    />
                    <FieldDescription>{bio.length}/240 characters</FieldDescription>
                  </Field>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      variant={saved ? 'outline' : 'default'}
                      className={cn(
                        'w-full rounded-xl sm:w-auto',
                        saved && 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                      )}
                    >
                      <Save className="h-4 w-4" />
                      {saved ? 'Saved' : saving ? 'Saving…' : 'Save changes'}
                    </Button>
                    {profileError && (
                      <Alert variant="destructive" className="border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] text-[var(--terracotta)]">
                        <AlertDescription>{profileError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  {saved && !profileError && (
                    <Alert className="border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]">
                      <AlertDescription>
                        Profile saved. Friends will see this identity on new feedback and shared planning links.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-rule bg-paper-recessed/60 p-6">
                <h2 className="text-lg font-serif font-semibold text-foreground">Sharing profile</h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/55">
                  This is the lightweight identity friends see around itinerary feedback and shared planning links.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {['Name visible on feedback', 'Guest mode stays available', 'Share links remain view-only'].map((label) => (
                    <div key={label} className="rounded-2xl border border-rule bg-paper px-3 py-3 text-sm text-foreground/70">
                      <Check className="mb-2 h-4 w-4 text-[var(--brass)]" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-rule bg-paper-recessed/60 p-6">
                <h2 className="text-lg font-serif font-semibold text-foreground">Session</h2>
                <p className="mt-1 text-sm text-foreground/40">Signed in and ready to pick up where you left off.</p>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="mt-5 rounded-xl border-[color:var(--pillar-desert-wash)] text-[var(--terracotta)] hover:bg-[color:var(--pillar-desert-wash)] hover:text-[var(--terracotta)]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-rule bg-paper-recessed/60 p-6">
                <div className="mb-6 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-[var(--brass)]" />
                  <h2 className="text-lg font-serif font-semibold text-foreground">Plan and billing</h2>
                </div>

                <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:gap-6">
                  <div className="min-w-0 border-b border-rule pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/35">Current plan</p>
                    <p className="mt-2 text-2xl font-serif font-semibold text-foreground">
                      {displayedSubscription?.plan === 'pro' ? PLANS.pro.name : PLANS.free.name}
                    </p>
                    <p className="mt-1 text-sm text-foreground/45">
                      {billingChecking
                        ? 'Checking subscription…'
                        : billingSummary(displayedSubscription, displayedIsPro)}
                    </p>
                    <StatusBadge tone={displayedIsPro ? 'success' : 'pending'} className="mt-3">
                      {billingStatusLabel(displayedSubscription)}
                    </StatusBadge>
                    {displayedSubscription?.currentPeriodEnd && (
                      <p className="mt-3 text-xs text-foreground/35">
                        Current period ends{' '}
                        {new Date(displayedSubscription.currentPeriodEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/35">What you get</p>
                    <ul className="mt-3 space-y-2 text-sm text-foreground/55">
                      {(displayedSubscription?.plan === 'pro' ? PLANS.pro.features : PLANS.free.features).slice(0, 5).map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brass)]" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-rule bg-paper-recessed/60 p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-semibold text-foreground">
                      {canOpenBillingPortal
                        ? displayedSubscription?.status === 'past_due'
                          ? 'Update billing'
                          : 'Manage subscription'
                        : `Upgrade to ${PLANS.pro.name}`}
                    </h2>
                    <p className="mt-1 text-sm text-foreground/40">
                      {canOpenBillingPortal
                        ? 'Open Stripe billing portal to manage payment details and billing.'
                        : 'Unlock unlimited trip planning and richer sharing tools.'}
                    </p>
                  </div>
                  {!canOpenBillingPortal && (
                    <div className="flex items-center gap-1 rounded-xl border border-rule bg-paper-recessed/60 p-1">
                      {(['month', 'year'] as const).map((value) => (
                        <Button
                          key={value}
                          onClick={() => setInterval(value)}
                          variant={interval === value ? 'default' : 'ghost'}
                          size="sm"
                          aria-pressed={interval === value}
                          className={cn(
                            'h-8 rounded-lg px-3 text-xs',
                            interval !== value && 'text-foreground/45 hover:text-foreground'
                          )}
                        >
                          {value === 'year' ? 'Yearly' : 'Monthly'}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {!canOpenBillingPortal && (
                  <div className="mb-5 border-y border-[color:var(--brass)]/25 bg-[var(--brass-subtle)] px-1 py-4 sm:px-0">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">${monthlyCost}</span>
                        <span className="text-sm text-foreground/40">/ month</span>
                      </div>
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--brass)]">
                        7-day free trial
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-foreground/45">
                      {interval === 'year'
                        ? `$${PLANS.pro.yearlyPrice} billed yearly`
                        : 'Billed monthly'}
                    </p>
                  </div>
                )}

                {billingNotice && (
                  <Alert className="mb-4 border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]">
                    <AlertDescription>{billingNotice}</AlertDescription>
                  </Alert>
                )}

                {billingError && (
                  <Alert variant="destructive" className="mb-4 border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] text-[var(--terracotta)]">
                    <AlertDescription>
                      <p>{billingError}</p>
                    <Button
                      type="button"
                      onClick={canOpenBillingPortal ? handleManage : handleUpgrade}
                      disabled={billingLoading}
                      variant="outline"
                      size="sm"
                      className="mt-3 rounded-full border-[color:var(--terracotta)]/30 bg-paper-raised text-[var(--terracotta)] disabled:opacity-60"
                    >
                      Try again
                    </Button>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={canOpenBillingPortal ? handleManage : handleUpgrade}
                  disabled={billingActionDisabled}
                  variant={canOpenBillingPortal ? 'secondary' : 'default'}
                  size="xl"
                  className={cn(
                    'w-full rounded-xl text-sm font-semibold',
                    canOpenBillingPortal && 'bg-paper-recessed hover:bg-paper-recessed'
                  )}
                >
                  {canOpenBillingPortal ? (
                    <>
                      Manage billing
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      {billingLoading ? 'Redirecting…' : checkoutReturned ? 'Checking subscription…' : 'Start free trial'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-rule bg-paper-recessed/60 p-6">
                <h2 className="text-lg font-serif font-semibold text-foreground">Plan comparison</h2>
                <div className="mt-4 divide-y divide-rule border-y border-rule">
                  {[
                    ['Globe.travel maps', '2', 'Unlimited'],
                    ['Saved trips', '2', 'Unlimited'],
                    ['AI messages / day', '10', 'Unlimited'],
                    ['Trip sharing', 'Basic links', 'Advanced feedback'],
                  ].map(([feature, free, pro]) => (
                    <div key={feature} className="grid gap-2 py-3 text-sm">
                      <p className="font-medium text-foreground">{feature}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="rounded-xl bg-paper px-3 py-2 text-xs text-foreground/70">{PLANS.free.name}: {free}</span>
                        <span className="rounded-xl bg-[var(--brass-subtle)] px-3 py-2 text-xs font-medium text-[var(--brass)]">{PLANS.pro.name}: {pro}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-rule bg-paper-recessed/60 p-6">
                <h2 className="text-lg font-serif font-semibold text-foreground">Built for small groups</h2>
                <p className="mt-1 text-sm text-foreground/40">
                  Keep planning simple: create a city itinerary, share the Globe.travel map link, and collect feedback before anyone books.
                </p>
                <Button asChild variant="outline" className="mt-4 rounded-full border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--brass-text)]">
                  <Link href="/chat">
                    Start a group trip
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <AccountPageContent />
    </Suspense>
  )
}
