'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useMemo, useRef, useState } from 'react'
import { CalendarCheck, CalendarDays, Check, Copy, ExternalLink, Heart, MessageCircleQuestion, Route, Share2, Users, Utensils } from 'lucide-react'
import TripDayMap from '@/components/trips/TripDayMap'
import type { TripDay } from '@/components/trips/ItineraryArtifact'
import { buildDisplayStops, getItineraryPlaceLabel, getRouteFallbackLabel, shouldUseSavedRoute, sortTripItemsForDisplay } from '@/components/trips/derivedStops'
import { getTravelBookingAction, type TravelBookingAction } from '@/lib/travel-booking-links'
import { formatTripTitleForDisplay, getTripKeepsakeMeta } from '@/lib/trip-copy'
import { Sticky } from '@/components/brand/Sticky'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export { getTripKeepsakeMeta } from '@/lib/trip-copy'

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
  love_it: 'border-success/30 bg-success/10 text-success',
  curious: 'border-info/30 bg-info/10 text-info',
  practical: 'border-warning/40 bg-warning/15 text-foreground',
}

function PublicBookingAction({ action }: { action: TravelBookingAction }) {
  const Icon = action.kind === 'hotel' ? CalendarCheck : Utensils

  return (
    <a
      href={action.href}
      target="_blank"
      rel="noreferrer"
      aria-label={action.ariaLabel}
      title={`${action.label} via ${action.provider}`}
      className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Icon className="h-3 w-3" />
      <span>{action.shortLabel}</span>
      <ExternalLink className="h-3 w-3 opacity-75" />
    </a>
  )
}

export function ArtifactFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
  /** Kept for backwards compatibility; the ribbon was retired with the old visual style. */
  ribbon?: boolean
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-foreground bg-card text-card-foreground shadow-lg', className)}>
      {children}
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
    <article className={cn('overflow-hidden rounded-lg border border-foreground/40 bg-card', active && 'border-foreground')}>
      <TripDayMap
        stops={stops}
        routeGeojson={route?.geojson || null}
        title={`Day ${day.day_index}`}
        subtitle={day.title}
        routeSummary={routeSummary}
        ariaLabel={`Itinerary ${compact ? 'summary' : 'detail'} card route map for day ${day.day_index}${day.title ? `: ${day.title}` : ''}`}
        showDetails={false}
        mapHeightClassName={compact ? 'h-40' : 'h-56'}
        className="min-w-0 rounded-none border-0 shadow-none"
        active={active}
        forceStatic={forceStaticMap}
      />
      <div className="space-y-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-primary">Day {day.day_index}</p>
            <h3 className="mt-0.5 text-base font-medium leading-tight text-foreground">
              {day.title || `Itinerary Day ${day.day_index}`}
            </h3>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            {sortedItems.length} stops
          </span>
        </div>
        <div className="space-y-1.5">
          {sortedItems.slice(0, compact ? 3 : sortedItems.length).map((item, index) => {
            const placeLabel = getItineraryPlaceLabel(item)
            const bookingAction = getTravelBookingAction({
              item,
              dayDate: day.date,
              destination: day.title,
            })

            return (
              <div key={item.id} className="flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium leading-snug text-foreground">{item.title}</p>
                  {(item.start_time || placeLabel) && (
                    <p className="mt-0.5 break-words text-xs leading-snug text-muted-foreground">
                      {[item.start_time?.slice(0, 5), placeLabel].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {bookingAction && !compact && (
                    <div className="mt-2">
                      <PublicBookingAction action={bookingAction} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
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
  const displayTitle = formatTripTitleForDisplay(trip.title)
  const meta = getTripKeepsakeMeta(displayTitle)
  const destinationTimingMatch = meta.destination.match(/^(.+?),\s+(?:in\s+)?((?:early|late)\s+[A-Z][a-z]+|mid[\u2011-][A-Z][a-z]+)$/i)
  const posterDestination = destinationTimingMatch?.[1] || meta.destination
  const posterTiming = destinationTimingMatch?.[2] || null
  const firstDay = days[0]
  const previewDays = days.slice(0, 4)
  const hiddenDayCount = Math.max(0, days.length - previewDays.length)
  const stopCount = days.reduce((sum, day) => sum + (day.items?.length || 0), 0)
  const body = (
    <ArtifactFrame className={cn('transition-shadow hover:shadow-lg', className)}>
      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[0.9fr_1.1fr] md:gap-8 md:p-8">
        <div className="flex min-h-64 flex-col justify-between md:min-h-72">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {meta.days || days.length || 3} days
            </div>
            <h2 className="text-balance text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl">
              {posterDestination}
            </h2>
            {posterTiming && (
              <p className="mt-2 text-sm font-medium text-primary">
                In {posterTiming}
              </p>
            )}
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A mapped route, a day-by-day plan, and friend feedback in one place.
            </p>
          </div>
          <div className="mt-7 grid gap-2">
            {previewDays.map((day) => (
              <div key={day.id} className="flex items-center gap-2 text-sm text-foreground">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {day.day_index}
                </span>
                <span className="truncate">{day.title || `Day ${day.day_index}`}</span>
              </div>
            ))}
            {hiddenDayCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-primary/40 text-xs font-semibold text-primary">
                  +
                </span>
                <span className="truncate">
                  {hiddenDayCount} more {hiddenDayCount === 1 ? 'day' : 'days'} in the full itinerary
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-4 md:space-y-5">
          {firstDay ? (
            <KeepsakeRouteCard day={firstDay} active compact forceStaticMap={forceStaticMap} />
          ) : (
            <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              The route snapshot appears once the itinerary has stops.
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border bg-muted/50 px-3 py-3">
              <CalendarDays className="size-4 text-primary" />
              <p className="mt-2 text-xs text-muted-foreground">Days</p>
              <p className="font-semibold text-foreground">{days.length || 'Draft'}</p>
            </div>
            <div className="rounded-lg border bg-muted/50 px-3 py-3">
              <Route className="size-4 text-chart-2" />
              <p className="mt-2 text-xs text-muted-foreground">Stops</p>
              <p className="font-semibold text-foreground">{stopCount || 'Soon'}</p>
            </div>
            <div className="rounded-lg border bg-muted/50 px-3 py-3">
              <Users className="size-4 text-success" />
              <p className="mt-2 text-xs text-muted-foreground">Crew</p>
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
  const visibleFeedback = feedback.slice(0, 4)
  const remainingFeedbackCount = Math.max(0, feedback.length - visibleFeedback.length)
  const counts = useMemo(() => {
    return {
      love_it: feedback.filter((entry) => entry.sentiment === 'love_it').length,
      curious: feedback.filter((entry) => entry.sentiment === 'curious').length,
      practical: feedback.filter((entry) => entry.sentiment === 'practical').length,
    }
  }, [feedback])

  return (
    <section className={cn('rounded-lg border bg-card p-5 text-card-foreground shadow-xs md:p-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Friend feedback</p>
          <h2 className="mt-0.5 text-xl font-medium text-foreground">
            {feedback.length} {feedback.length === 1 ? 'reaction' : 'reactions'}
          </h2>
        </div>
        <MessageCircleQuestion className="size-5 text-primary" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {([
          ['love_it', Heart, 'Love'],
          ['curious', MessageCircleQuestion, 'Curious'],
          ['practical', Check, 'Notes'],
        ] as const).map(([key, Icon, label]) => (
          <div key={key} className={cn('rounded-lg border px-3 py-3 text-center', toneClass[key])}>
            <Icon className="mx-auto h-4 w-4" />
            <p className="mt-1 text-lg font-semibold">{counts[key]}</p>
            <p className="text-xs">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {feedback.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-5 text-sm leading-relaxed text-muted-foreground">
            Send this link to the group. They can mark what they love, what needs a question, and what might break the plan.
          </p>
        ) : (
          <>
            {visibleFeedback.map((entry, index) => (
              <Sticky
                key={entry.id}
                author={`${entry.author_name} · ${toneLabel[entry.sentiment]}`}
                tone={entry.sentiment === 'love_it' ? 'note' : entry.sentiment === 'curious' ? 'glass' : 'peach'}
                tilt={index % 2 === 0 ? -1.5 : 1.5}
              >
                <span className="line-clamp-3 break-words">{entry.comment}</span>
              </Sticky>
            ))}
            {remainingFeedbackCount > 0 && (
              <p className="rounded-lg border border-dashed px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                Showing latest 4 of {feedback.length} reactions. {remainingFeedbackCount} more {remainingFeedbackCount === 1 ? 'reaction is' : 'reactions are'} saved for the organizer.
              </p>
            )}
          </>
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
  const shareUrlInputRef = useRef<HTMLInputElement | null>(null)
  const displayTitle = formatTripTitleForDisplay(title)

  const writeShareUrl = async () => {
    if (!shareUrl) return false

    try {
      await navigator.clipboard.writeText(shareUrl)
      return true
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.top = '0'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()

      try {
        return document.execCommand('copy')
      } finally {
        document.body.removeChild(textarea)
      }
    }
  }

  const copyLink = async () => {
    if (!shareUrl) return
    try {
      setShareError(null)
      const copiedToClipboard = await writeShareUrl()
      if (!copiedToClipboard) throw new Error('Copy command failed')
      setCopied(true)
      setTimeout(() => setCopied(false), 5000)
    } catch {
      shareUrlInputRef.current?.focus()
      shareUrlInputRef.current?.select()
      setShareError('Copy was blocked. The link is selected so you can copy it manually.')
    }
  }

  const nativeShare = async () => {
    if (!shareUrl) return
    try {
      setShareError(null)
      if (navigator.share) {
        await navigator.share({ title: displayTitle, text: `Review this Globe.travel itinerary: ${displayTitle}`, url: shareUrl })
        return
      }
      await copyLink()
    } catch {
      setShareError('Could not open the share sheet. Copy the link instead.')
    }
  }

  return (
    <section className={cn('rounded-lg border bg-card p-5 text-card-foreground shadow-xs md:p-6', className)}>
      <h2 className="text-xl font-medium text-foreground">Share this trip</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Friends can view the itinerary without signing in and leave lightweight feedback.
      </p>
      <div className="mt-4 rounded-lg border bg-muted/50 px-3 text-xs text-muted-foreground">
        <input
          ref={shareUrlInputRef}
          type="text"
          readOnly
          aria-label="Public trip link"
          value={shareUrl || 'Enable sharing to create a public link'}
          onFocus={(event) => event.currentTarget.select()}
          className="h-11 w-full truncate bg-transparent text-xs text-muted-foreground outline-none"
        />
      </div>
      {shareError && (
        <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {shareError}
        </p>
      )}
      <p
        role="status"
        aria-live="polite"
        className={cn(
          copied
            ? 'mt-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm font-medium text-success transition-colors'
            : 'sr-only',
        )}
      >
        {copied ? 'Copied to clipboard.' : 'Copy status'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={copyLink} disabled={!shareUrl} >
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy link'}
        </Button>
        <Button type="button" onClick={nativeShare} disabled={!shareUrl} >
          <Share2 />
          Share
        </Button>
      </div>
    </section>
  )
}
