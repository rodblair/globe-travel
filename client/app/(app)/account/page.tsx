'use client'

import Image from 'next/image'
import { Suspense, useState } from 'react'
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
import { createClient } from '@/lib/supabase-browser'
import { PLANS } from '@/lib/plans'
import { openBillingPortal, startCheckout, useSubscription } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'

type AccountTab = 'profile' | 'billing'

const tabs: { key: AccountTab; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'billing', label: 'Billing', icon: Crown },
]

function normalizeTab(value: string | null): AccountTab {
  return value === 'billing' ? 'billing' : 'profile'
}

function AccountPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = normalizeTab(searchParams.get('tab'))
  const { profile, signOut, refreshProfile } = useAuth()
  const { subscription, isPro, isLoading: subscriptionLoading } = useSubscription()
  const supabase = createClient()

  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

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
    try {
      await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          username: username.trim(),
          bio: bio.trim(),
        })
        .eq('id', profile.id)

      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
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
    setBillingLoading(true)
    try {
      await startCheckout(interval)
    } catch (error: unknown) {
      setBillingError(error instanceof Error ? error.message : 'Something went wrong')
      setBillingLoading(false)
    }
  }

  const handleManage = async () => {
    setBillingError(null)
    setBillingLoading(true)
    try {
      await openBillingPortal()
    } catch {
      setBillingError('Could not open billing portal')
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
                  <button
                    key={tab.key}
                    onClick={() => switchTab(tab.key)}
                    className={cn(
                      'touch-target inline-flex flex-shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                      activeTab === tab.key
                        ? 'bg-[var(--brass-subtle)] text-foreground'
                        : 'text-foreground/45 hover:bg-paper-recessed/60 hover:text-foreground/75'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
        {activeTab === 'profile' && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_320px] lg:gap-7">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-rule bg-paper-recessed/60 p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rule bg-paper-recessed">
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
                      {profile?.username ? `@${profile.username}` : 'No username set yet'}
                    </p>
                    {profile?.bio && (
                      <p className="mt-1 line-clamp-2 text-sm text-foreground/35">{profile.bio}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="profile-display-name" className="mb-2 block text-xs font-medium uppercase tracking-widest text-foreground/40">
                      Display name
                    </label>
                    <input
                      id="profile-display-name"
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-rule bg-paper/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 transition-all focus:border-[color:var(--brass)]/30 focus:outline-none focus:ring-1 focus:ring-[color:var(--brass)]/40"
                    />
                  </div>

                  <div>
                    <label htmlFor="profile-username" className="mb-2 block text-xs font-medium uppercase tracking-widest text-foreground/40">
                      Username
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-foreground/30">
                        @
                      </span>
                      <input
                        id="profile-username"
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="yourusername"
                        className="w-full rounded-xl border border-rule bg-paper/40 py-3 pl-8 pr-4 text-sm text-foreground placeholder:text-foreground/20 transition-all focus:border-[color:var(--brass)]/30 focus:outline-none focus:ring-1 focus:ring-[color:var(--brass)]/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="profile-bio" className="mb-2 block text-xs font-medium uppercase tracking-widest text-foreground/40">
                      Bio
                    </label>
                    <textarea
                      id="profile-bio"
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="A short note friends will recognize when you share itinerary feedback."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-rule bg-paper/40 px-4 py-3 text-sm text-foreground placeholder:text-foreground/20 transition-all focus:border-[color:var(--brass)]/30 focus:outline-none focus:ring-1 focus:ring-[color:var(--brass)]/40"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={cn(
                        'touch-target inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors',
                        saved
                          ? 'border border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]'
                          : 'bg-[var(--brass)] text-[var(--brass-text)] hover:bg-[var(--brass-hover)] disabled:opacity-40'
                      )}
                    >
                      <Save className="h-4 w-4" />
                      {saved ? 'Saved' : saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
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
                <button
                  onClick={handleSignOut}
                  className="touch-target mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-[color:var(--pillar-desert-wash)] px-4 py-2.5 text-sm font-medium text-[var(--terracotta)] transition-colors hover:bg-[color:var(--pillar-desert-wash)] hover:text-[var(--terracotta)]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
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

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-rule bg-paper-recessed/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/35">Current plan</p>
                    <p className="mt-2 text-2xl font-serif font-semibold text-foreground">
                      {isPro ? PLANS.pro.name : PLANS.free.name}
                    </p>
                    <p className="mt-1 text-sm text-foreground/45">
                      {subscriptionLoading
                        ? 'Checking subscription…'
                        : isPro
                        ? 'Pro features are active on this account.'
                        : 'Free plan with generous limits to get started.'}
                    </p>
                    {subscription?.currentPeriodEnd && (
                      <p className="mt-3 text-xs text-foreground/35">
                        Current period ends{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-rule bg-paper-recessed/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/35">What you get</p>
                    <ul className="mt-3 space-y-2 text-sm text-foreground/55">
                      {(isPro ? PLANS.pro.features : PLANS.free.features).slice(0, 5).map((feature) => (
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
                      {isPro ? 'Manage subscription' : 'Upgrade to Adventurer'}
                    </h2>
                    <p className="mt-1 text-sm text-foreground/40">
                      {isPro
                        ? 'Open Stripe billing portal to manage payment details and billing.'
                        : 'Unlock unlimited trip planning and richer sharing tools.'}
                    </p>
                  </div>
                  {!isPro && (
                    <div className="flex items-center gap-1 rounded-xl border border-rule bg-paper-recessed/60 p-1">
                      {(['month', 'year'] as const).map((value) => (
                        <button
                          key={value}
                          onClick={() => setInterval(value)}
                          className={cn(
                            'touch-target rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200',
                            interval === value ? 'bg-[var(--brass)] text-[var(--brass-text)]' : 'text-foreground/45 hover:text-foreground'
                          )}
                        >
                          {value === 'year' ? 'Yearly' : 'Monthly'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!isPro && (
                  <div className="mb-5 rounded-2xl border border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] p-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-foreground">${monthlyCost}</span>
                      <span className="text-sm text-foreground/40">/ month</span>
                    </div>
                    <p className="mt-2 text-sm text-foreground/45">
                      {interval === 'year'
                        ? `$${PLANS.pro.yearlyPrice} billed yearly · 7-day free trial`
                        : 'Billed monthly · 7-day free trial'}
                    </p>
                  </div>
                )}

                {billingError && (
                  <div className="mb-4 rounded-xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] px-4 py-3 text-sm text-[var(--terracotta)]">
                    {billingError}
                  </div>
                )}

                <button
                  onClick={isPro ? handleManage : handleUpgrade}
                  disabled={billingLoading}
                  className={cn(
                    'touch-target inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-colors duration-200 disabled:opacity-60',
                    isPro
                      ? 'bg-paper-recessed text-foreground hover:bg-paper-recessed'
                      : 'bg-[var(--brass)] text-[var(--brass-text)] hover:bg-[var(--brass-hover)]'
                  )}
                >
                  {isPro ? (
                    <>
                      Manage billing
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      {billingLoading ? 'Redirecting…' : 'Start free trial'}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-rule bg-paper-recessed/60 p-6">
                <h2 className="text-lg font-serif font-semibold text-foreground">Plan comparison</h2>
                <div className="mt-4 space-y-3">
                  {[
                    ['Globe.travel maps', '2', 'Unlimited'],
                    ['Saved trips', '2', 'Unlimited'],
                    ['AI messages / day', '10', 'Unlimited'],
                    ['Trip sharing', 'Basic links', 'Advanced feedback'],
                  ].map(([feature, free, pro]) => (
                    <div key={feature} className="rounded-2xl border border-rule bg-paper-recessed/60 p-4">
                      <p className="text-sm font-medium text-foreground">{feature}</p>
                      <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
                        <span className="text-foreground/40">Explorer: {free}</span>
                        <span className="text-[var(--brass)] sm:text-right">Adventurer: {pro}</span>
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
                <Link
                  href="/chat"
                  className="touch-target mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] px-4 py-2 text-sm font-medium text-[var(--brass)] transition-colors hover:bg-[var(--brass)] hover:text-[var(--brass-text)]"
                >
                  Start a group trip
                  <ArrowRight className="h-4 w-4" />
                </Link>
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
