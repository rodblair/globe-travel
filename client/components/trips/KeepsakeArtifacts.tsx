'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { CalendarDays, Check, Copy, Heart, MessageCircleQuestion, Route, Share2, Users } from 'lucide-react'
import TripDayMap from '@/components/trips/TripDayMap'
import type { TripDay } from '@/components/trips/ItineraryArtifact'
import { buildDisplayStops, getRouteFallbackLabel, shouldUseSavedRoute, sortTripItemsForDisplay } from '@/components/trips/derivedStops'
import { cn } from '@/lib/utils'

type KeepsakeTrip = {
  id?: string
  title: string
  share_slug?: string | null
  is_public?: boolean
}

type FeedbackTone = 'love_it' | 'curious' | 'practical'

type FeedbackPreview = {
  id: string
  author_name: string
  sentiment: FeedbackTone
  comment: string
}

const toneLabel: Record<FeedbackTone, string> = {
  love_it: 'Love it',
  curious: 'Curious',
  practical: 'Practical note',
}

const toneClass: Record<FeedbackTone, string> = {
  love_it: 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]',
  curious: 'border-[color:var(--pillar-coastal-wash)] bg-[color:var(--pillar-coastal-wash)] text-[var(--horizon)]',
  practical: 'border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] text-foreground',
}

export function getTripKeepsakeMeta(title: string) {
  const dayMatch = title.match(/(\d+)[-\s]?(?:day|days)\b/i)
  const days = dayMatch ? Number(dayMatch[1]) : null
  const destinationPatterns = [
    /^\d+\s+Days?\s+in\s+(.+?)(?:\s*[-–—].*)?$/i,
    /^Trip to\s+(.+)$/i,
    /^(.+?)\s+(?:City\s+Break|Escape|Trip)$/i,
  ]

  for (const pattern of destinationPatterns) {
    const match = title.match(pattern)
    if (match?.[1]) return { days, destination: match[1].trim() }
  }

  return { days, destination: title }
}

export function ArtifactFrame({
  children,
  className,
  ribbon = true,
}: {
  children: ReactNode
  className?: string
  ribbon?: boolean
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[32px] border border-[color:var(--brass)]/30 bg-[linear-gradient(135deg,var(--paper-raised),var(--paper-recessed))] shadow-[var(--shadow-lg)]',
        className
      )}
    >
      <div className="paper-grain absolute inset-0 pointer-events-none" />
      <div className="absolute inset-3 rounded-[24px] border border-rule/80 pointer-events-none md:inset-4 md:rounded-[26px]" />
      {ribbon && (
        <div className="absolute right-8 top-0 h-16 w-8 bg-[var(--brass)] shadow-[0_10px_20px_rgba(159,105,32,0.18)]">
          <div className="absolute bottom-0 h-0 w-0 border-l-[16px] border-r-[16px] border-t-[14px] border-l-transparent border-r-transparent border-t-[var(--paper-raised)]" />
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}

export function KeepsakeRouteCard({
  day,
  active = false,
  compact = false,
  forceStaticMap = false,
}: {
  day: TripDay
  active?: boolean
  compact?: boolean
  forceStaticMap?: boolean
}) {
  const dayItems = day.items || []
  const sortedItems = sortTripItemsForDisplay(dayItems)
  const displayStops = buildDisplayStops(sortedItems)
  const usesDerivedStops = displayStops.some((stop) => stop.id.includes(':'))
  const stops = displayStops
    .filter((stop) => stop.mapped)
    .map((stop) => ({
      id: stop.id,
      title: stop.title,
      latitude: stop.latitude,
      longitude: stop.longitude,
      index: stop.index,
    }))
  const savedRoute = day.routes?.find((entry) => entry.mode === 'walk') || day.routes?.[0]
  const route = shouldUseSavedRoute(dayItems, savedRoute, usesDerivedStops) ? savedRoute : null
  const routeSummary = route?.distance_m && route?.duration_s
    ? `${Math.round(route.distance_m / 100) / 10} km • ${Math.round(route.duration_s / 60)} min walk`
    : getRouteFallbackLabel(dayItems, savedRoute, usesDerivedStops)

  return (
    <article className={cn('overflow-hidden rounded-[22px] border border-rule bg-paper-raised', active && 'border-[color:var(--brass)]/40')}>
      <TripDayMap
        stops={stops}
        routeGeojson={route?.geojson || null}
        title={`Day ${day.day_index}`}
        subtitle={day.title}
        routeSummary={routeSummary}
        showDetails={false}
        mapHeightClassName={compact ? 'h-40' : 'h-56'}
        className="min-w-0 rounded-none border-0 shadow-none"
        active={active}
        forceStatic={forceStaticMap}
      />
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="t-mono text-[0.625rem] uppercase tracking-[0.2em] text-[var(--brass)]">Day {day.day_index}</p>
            <h3 className="mt-1 font-serif text-lg font-semibold leading-tight text-foreground">
              {day.title || `Itinerary Day ${day.day_index}`}
            </h3>
          </div>
          <span className="rounded-full border border-rule bg-paper-recessed px-2.5 py-1 text-[11px] text-ink-2">
            {sortedItems.length} stops
          </span>
        </div>
        <div className="space-y-1.5">
          {sortedItems.slice(0, compact ? 3 : sortedItems.length).map((item, index) => (
            <div key={item.id} className="flex items-start gap-2.5 rounded-2xl bg-paper-recessed/70 px-3 py-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brass-subtle)] t-mono text-[0.625rem] font-semibold text-[var(--brass)]">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                {(item.start_time || item.place?.name) && (
                  <p className="mt-0.5 truncate text-xs text-ink-3">
                    {[item.start_time?.slice(0, 5), item.place?.name].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}

export function TripPosterPreview({
  trip,
  days,
  href,
  className,
  forceStaticMap = false,
}: {
  trip: KeepsakeTrip
  days: TripDay[]
  href?: string
  className?: string
  forceStaticMap?: boolean
}) {
  const meta = getTripKeepsakeMeta(trip.title)
  const firstDay = days[0]
  const stopCount = days.reduce((sum, day) => sum + (day.items?.length || 0), 0)
  const body = (
    <ArtifactFrame className={cn('transition-transform duration-300 hover:-translate-y-1', className)}>
      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[0.82fr_1.18fr] md:gap-7 md:p-7 lg:p-8">
        <div className="flex min-h-64 flex-col justify-between md:min-h-72">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[var(--horizon)] px-3 py-1.5 t-mono text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white">
              {meta.days || days.length || 3} days
            </div>
            <p className="t-mono text-[0.625rem] uppercase tracking-[0.22em] text-ink-3">Globe.travel map</p>
            <h2 className="mt-3 max-w-[9ch] font-serif text-4xl font-semibold uppercase leading-[0.98] tracking-[0.12em] text-foreground">
              {meta.destination}
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">
              A shareable route, day-by-day plan, and friend feedback in one calm trip artifact.
            </p>
          </div>
          <div className="mt-7 grid gap-2">
            {days.slice(0, 4).map((day) => (
              <div key={day.id} className="flex items-center gap-2 text-sm text-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--brass-subtle)] t-mono text-[0.625rem] font-semibold text-[var(--brass)]">
                  {String(day.day_index).padStart(2, '0')}
                </span>
                <span className="truncate">{day.title || `Day ${day.day_index}`}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 md:space-y-5">
          {firstDay ? (
            <KeepsakeRouteCard day={firstDay} active compact forceStaticMap={forceStaticMap} />
          ) : (
            <div className="flex h-72 items-center justify-center rounded-[24px] border border-dashed border-rule bg-paper-recessed text-sm text-ink-3">
              The route snapshot appears once the itinerary has stops.
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-rule bg-paper-recessed px-3 py-3">
              <CalendarDays className="h-4 w-4 text-[var(--brass)]" />
              <p className="mt-2 text-xs text-ink-3">Days</p>
              <p className="font-semibold text-foreground">{days.length || 'Draft'}</p>
            </div>
            <div className="rounded-2xl border border-rule bg-paper-recessed px-3 py-3">
              <Route className="h-4 w-4 text-[var(--horizon)]" />
              <p className="mt-2 text-xs text-ink-3">Stops</p>
              <p className="font-semibold text-foreground">{stopCount || 'Soon'}</p>
            </div>
            <div className="rounded-2xl border border-rule bg-paper-recessed px-3 py-3">
              <Users className="h-4 w-4 text-[var(--moss)]" />
              <p className="mt-2 text-xs text-ink-3">Crew</p>
              <p className="font-semibold text-foreground">Ready</p>
            </div>
          </div>
        </div>
      </div>
    </ArtifactFrame>
  )

  if (!href) return body

  return (
    <Link href={href} className="block">
      {body}
    </Link>
  )
}

export function FriendFeedbackPanel({
  feedback,
  className,
}: {
  feedback: FeedbackPreview[]
  className?: string
}) {
  const counts = useMemo(() => {
    return {
      love_it: feedback.filter((entry) => entry.sentiment === 'love_it').length,
      curious: feedback.filter((entry) => entry.sentiment === 'curious').length,
      practical: feedback.filter((entry) => entry.sentiment === 'practical').length,
    }
  }, [feedback])

  return (
    <section className={cn('rounded-[26px] border border-rule bg-paper-raised p-5 shadow-[var(--panel-shadow)] md:p-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="t-mono text-[0.625rem] uppercase tracking-[0.22em] text-ink-3">Friend feedback</p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-foreground">
            {feedback.length} {feedback.length === 1 ? 'reaction' : 'reactions'}
          </h2>
        </div>
        <MessageCircleQuestion className="h-5 w-5 text-[var(--brass)]" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {([
          ['love_it', Heart, 'Love'],
          ['curious', MessageCircleQuestion, 'Curious'],
          ['practical', Check, 'Notes'],
        ] as const).map(([key, Icon, label]) => (
          <div key={key} className={cn('rounded-2xl border px-3 py-3 text-center', toneClass[key])}>
            <Icon className="mx-auto h-4 w-4" />
            <p className="mt-1 text-lg font-semibold">{counts[key]}</p>
            <p className="text-[11px]">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {feedback.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-rule bg-paper-recessed px-4 py-5 text-sm leading-relaxed text-ink-2">
            Send this link to the group. They can mark what they love, what needs a question, and what might break the plan.
          </p>
        ) : (
          feedback.slice(0, 4).map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-rule bg-paper-recessed p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-foreground">{entry.author_name}</p>
                <span className={cn('rounded-full border px-2 py-1 text-[10px]', toneClass[entry.sentiment])}>
                  {toneLabel[entry.sentiment]}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-2">{entry.comment}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export function ShareLinkCard({
  shareUrl,
  title,
  className,
}: {
  shareUrl: string | null
  title: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  const copyLink = async () => {
    if (!shareUrl) return
    try {
      setShareError(null)
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      setShareError('Could not copy the link. Select the URL above and copy it manually.')
    }
  }

  const nativeShare = async () => {
    if (!shareUrl) return
    try {
      setShareError(null)
      if (navigator.share) {
        await navigator.share({ title, text: `Review this Globe.travel itinerary: ${title}`, url: shareUrl })
        return
      }
      await copyLink()
    } catch {
      setShareError('Could not open the share sheet. Copy the link instead.')
    }
  }

  return (
    <section className={cn('rounded-[26px] border border-rule bg-paper-raised p-5 shadow-[var(--panel-shadow)] md:p-6', className)}>
      <p className="t-mono text-[0.625rem] uppercase tracking-[0.22em] text-ink-3">Share trip</p>
      <h2 className="mt-1 font-serif text-xl font-semibold text-foreground">Send the Globe.travel map link</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-2">
        Friends can view the itinerary without signing in and leave lightweight feedback.
      </p>
      <div className="mt-4 rounded-2xl border border-rule bg-paper-recessed px-3 py-2 text-xs text-ink-2">
        <p className="truncate">{shareUrl || 'Enable sharing to create a public link'}</p>
      </div>
      {shareError && (
        <p role="alert" className="mt-3 rounded-2xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] px-4 py-3 text-sm text-[var(--terracotta)]">
          {shareError}
        </p>
      )}
      <p aria-live="polite" className="sr-only">
        {copied ? 'Share link copied to clipboard.' : ''}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyLink}
          disabled={!shareUrl}
          className="touch-target inline-flex items-center justify-center gap-2 rounded-full border border-rule bg-paper-recessed px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-paper-hover disabled:cursor-not-allowed disabled:opacity-45"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy link'}
        </button>
        <button
          type="button"
          onClick={nativeShare}
          disabled={!shareUrl}
          className="touch-target inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brass)] px-4 py-2 text-sm font-semibold text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-hover)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </section>
  )
}
