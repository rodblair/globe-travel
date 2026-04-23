'use client'

import Image from 'next/image'
import { Suspense, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Crown,
  Flame,
  Globe2,
  LogOut,
  MapPin,
  Save,
  Settings,
  Share2,
  Trophy,
  User,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { createClient } from '@/lib/supabase-browser'
import { PLANS } from '@/lib/plans'
import { openBillingPortal, startCheckout, useSubscription } from '@/hooks/useSubscription'
import { cn } from '@/lib/utils'

type AccountTab = 'profile' | 'billing'

type UserPlaceRow = {
  status: 'visited' | 'bucket_list' | 'planning'
  place?: {
    country?: string | null
  } | null
}

type JournalEntry = {
  id: string
  title: string
  content: string
  mood?: string
  created_at: string
}

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
  const [copied, setCopied] = useState(false)
  const [interval, setInterval] = useState<'month' | 'year'>('month')
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  const { data: userPlaces = [] } = useQuery<UserPlaceRow[]>({
    queryKey: ['account-user-places'],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_places')
        .select('status, place:places(country)')
      return (data || []) as UserPlaceRow[]
    },
  })

  const { data: recentEntries = [] } = useQuery<JournalEntry[]>({
    queryKey: ['journal-entries', 'recent'],
    queryFn: async () => {
      const { data } = await supabase
        .from('journal_entries')
        .select('id, title, content, mood, created_at')
        .order('created_at', { ascending: false })
        .limit(3)
      return (data || []) as JournalEntry[]
    },
  })

  const visitedCount = useMemo(
    () => userPlaces.filter((place) => place.status === 'visited').length,
    [userPlaces]
  )

  const countriesCount = useMemo(
    () =>
      new Set(
        userPlaces
          .filter((place) => place.status === 'visited' && place.place?.country)
          .map((place) => place.place?.country)
      ).size,
    [userPlaces]
  )

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

  const handleShare = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? window.location.origin + (profile?.username ? `/u/${profile.username}` : '/chat')
        : '/chat'

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'Globe Travel', url: shareUrl }).catch(() => {})
      }
    }
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
    <div className="min-h-screen bg-black">
      <div className="sticky top-0 z-10 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="flex items-center gap-3 text-3xl font-serif font-semibold text-white">
                  <Settings className="h-7 w-7 text-white/40" />
                  Account
                </h1>
                <p className="mt-1 text-sm text-white/45">
                  Manage your profile, sharing, and subscription in one place.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:w-auto">
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">Countries</p>
                  <p className="mt-1 text-lg font-semibold text-white">{countriesCount}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">Places</p>
                  <p className="mt-1 text-lg font-semibold text-white">{visitedCount}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">Stories</p>
                  <p className="mt-1 text-lg font-semibold text-white">{recentEntries.length}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    onClick={() => switchTab(tab.key)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200',
                      activeTab === tab.key
                        ? 'bg-amber-500/12 text-amber-300'
                        : 'text-white/45 hover:bg-white/[0.05] hover:text-white/75'
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

      <div className="mx-auto max-w-5xl px-6 py-8">
        {activeTab === 'profile' && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_320px]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/8">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.display_name || 'Traveler'}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <User className="h-7 w-7 text-white/25" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-medium text-white">
                      {profile?.display_name || 'Traveler'}
                    </p>
                    <p className="truncate text-sm text-white/40">
                      {profile?.username ? `@${profile.username}` : 'No username set yet'}
                    </p>
                    {profile?.bio && (
                      <p className="mt-1 line-clamp-2 text-sm text-white/35">{profile.bio}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Your name"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/20 transition-all focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
                      Username
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30">
                        @
                      </span>
                      <input
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="yourusername"
                        className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-8 pr-4 text-sm text-white placeholder:text-white/20 transition-all focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      placeholder="Tell the world about your travels..."
                      rows={4}
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/20 transition-all focus:border-amber-500/40 focus:outline-none focus:ring-1 focus:ring-amber-500/10"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all',
                        saved
                          ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40'
                      )}
                    >
                      <Save className="h-4 w-4" />
                      {saved ? 'Saved' : saving ? 'Saving…' : 'Save changes'}
                    </button>

                    <button
                      onClick={handleShare}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                    >
                      <Share2 className="h-4 w-4" />
                      {copied ? 'Link copied' : 'Share profile'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <div className="mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-amber-400" />
                  <h2 className="text-lg font-serif font-semibold text-white">Recent journal entries</h2>
                </div>
                {recentEntries.length > 0 ? (
                  <div className="space-y-3">
                    {recentEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          {entry.mood && <span>{entry.mood}</span>}
                          <h3 className="font-medium text-white">{entry.title}</h3>
                        </div>
                        <p className="line-clamp-2 text-sm text-white/45">{entry.content}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-white/30">
                          <Calendar className="h-3 w-3" />
                          {new Date(entry.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </div>
                    ))}
                    <Link
                      href="/saved?tab=journal"
                      className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
                    >
                      Open full journal
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 text-sm text-white/40">
                    No journal entries yet. Your recent travel notes will show up here.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-400" />
                  <h2 className="text-lg font-serif font-semibold text-white">Travel snapshot</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Globe2, label: 'Countries', value: countriesCount, color: 'text-amber-400' },
                    { icon: MapPin, label: 'Places', value: visitedCount, color: 'text-emerald-400' },
                    { icon: Flame, label: 'Streak', value: profile?.streak_days ?? 0, color: 'text-orange-400' },
                    { icon: BookOpen, label: 'Stories', value: recentEntries.length, color: 'text-cyan-400' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-center"
                    >
                      <item.icon className={cn('mx-auto mb-1.5 h-5 w-5', item.color)} />
                      <p className="text-xl font-serif font-bold text-white">{item.value}</p>
                      <p className="mt-0.5 text-xs text-white/40">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <h2 className="text-lg font-serif font-semibold text-white">Session</h2>
                <p className="mt-1 text-sm text-white/40">Signed in and ready to pick up where you left off.</p>
                <button
                  onClick={handleSignOut}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5 text-sm font-medium text-red-400/85 transition-all hover:bg-red-500/10 hover:text-red-400"
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
              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <div className="mb-6 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-400" />
                  <h2 className="text-lg font-serif font-semibold text-white">Plan and billing</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Current plan</p>
                    <p className="mt-2 text-2xl font-serif font-semibold text-white">
                      {isPro ? PLANS.pro.name : PLANS.free.name}
                    </p>
                    <p className="mt-1 text-sm text-white/45">
                      {subscriptionLoading
                        ? 'Checking subscription…'
                        : isPro
                        ? 'Pro features are active on this account.'
                        : 'Free plan with generous limits to get started.'}
                    </p>
                    {subscription?.currentPeriodEnd && (
                      <p className="mt-3 text-xs text-white/35">
                        Current period ends{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">What you get</p>
                    <ul className="mt-3 space-y-2 text-sm text-white/55">
                      {(isPro ? PLANS.pro.features : PLANS.free.features).slice(0, 5).map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-serif font-semibold text-white">
                      {isPro ? 'Manage subscription' : 'Upgrade to Adventurer'}
                    </h2>
                    <p className="mt-1 text-sm text-white/40">
                      {isPro
                        ? 'Open Stripe billing portal to manage payment details and billing.'
                        : 'Unlock unlimited planning, saved places, and journal entries.'}
                    </p>
                  </div>
                  {!isPro && (
                    <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.03] p-1">
                      {(['month', 'year'] as const).map((value) => (
                        <button
                          key={value}
                          onClick={() => setInterval(value)}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
                            interval === value ? 'bg-amber-500 text-black' : 'text-white/45 hover:text-white'
                          )}
                        >
                          {value === 'year' ? 'Yearly' : 'Monthly'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {!isPro && (
                  <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">${monthlyCost}</span>
                      <span className="text-sm text-white/40">/ month</span>
                    </div>
                    <p className="mt-2 text-sm text-white/45">
                      {interval === 'year'
                        ? `$${PLANS.pro.yearlyPrice} billed yearly · 7-day free trial`
                        : 'Billed monthly · 7-day free trial'}
                    </p>
                  </div>
                )}

                {billingError && (
                  <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {billingError}
                  </div>
                )}

                <button
                  onClick={isPro ? handleManage : handleUpgrade}
                  disabled={billingLoading}
                  className={cn(
                    'inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60',
                    isPro
                      ? 'bg-white/10 text-white hover:bg-white/15'
                      : 'bg-amber-500 text-black hover:scale-[1.01] hover:bg-amber-400'
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
              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <h2 className="text-lg font-serif font-semibold text-white">Plan comparison</h2>
                <div className="mt-4 space-y-3">
                  {[
                    ['Journal entries', '3', 'Unlimited'],
                    ['Saved trips', '2', 'Unlimited'],
                    ['AI messages / day', '10', 'Unlimited'],
                    ['Saved places', '10', 'Unlimited'],
                    ['Trip sharing', '—', 'Included'],
                  ].map(([feature, free, pro]) => (
                    <div key={feature} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-sm font-medium text-white">{feature}</p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-white/40">Explorer: {free}</span>
                        <span className="text-amber-400">Adventurer: {pro}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
                <h2 className="text-lg font-serif font-semibold text-white">Need more detail?</h2>
                <p className="mt-1 text-sm text-white/40">
                  The old pricing route still works if you want the full feature table and FAQ.
                </p>
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
                >
                  Open detailed pricing
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
    <Suspense fallback={<div className="min-h-screen bg-[#050510]" />}>
      <AccountPageContent />
    </Suspense>
  )
}
