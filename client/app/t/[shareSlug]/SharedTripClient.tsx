'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Compass, Send, TriangleAlert } from 'lucide-react'
import type { TripDay } from '@/components/trips/ItineraryArtifact'
import {
  FriendFeedbackPanel,
  KeepsakeRouteCard,
  ShareLinkCard,
  getTripKeepsakeMeta,
} from '@/components/trips/KeepsakeArtifacts'
import { GlobeBrand } from '@/components/atmosphere/GlobeBrand'
import { Postcard } from '@/components/brand/Postcard'
import { sceneForTitle } from '@/components/brand/Scene'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { formatTripTitleForDisplay, splitTripTitleTiming } from '@/lib/trip-copy'
import { cn } from '@/lib/utils'

type Trip = {
  id: string
  title: string
  is_public: boolean
  share_slug: string
}

type TripPayload = {
  trip: Trip
  days: TripDay[]
}

type TripFeedback = {
  id: string
  author_name: string
  sentiment: 'love_it' | 'curious' | 'practical'
  comment: string
  created_at: string
}

const sentimentOptions = [
  { value: 'love_it', label: 'Love it', helper: 'This part should stay.' },
  { value: 'curious', label: 'Curious', helper: 'I have a question.' },
  { value: 'practical', label: 'Practical note', helper: 'This may affect logistics.' },
] as const

const sentimentClasses: Record<TripFeedback['sentiment'], string> = {
  love_it: 'border-success/40 bg-success/10 text-foreground',
  curious: 'border-info/40 bg-info/10 text-foreground',
  practical: 'border-warning/50 bg-warning/15 text-foreground',
}

function SharedTripLoadingState() {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Loading shared trip map"
      className="grid min-h-[68vh] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-full max-w-lg" />
        </div>
        <Skeleton className="h-72 rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </div>
      <aside className="space-y-4">
        <Skeleton className="h-96 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </aside>
      <span className="sr-only">Loading the itinerary, route, and group notes.</span>
    </section>
  )
}

function isValidOptionalEmail(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

function buildStarterPrompt(meta: { days: number | null; destination: string }, title: string) {
  const destination = meta.destination || title
  if (meta.days) {
    return `Plan a ${meta.days}-day trip to ${destination} with a shareable itinerary map for my group.`
  }
  return `Plan a group trip inspired by ${destination} with a shareable itinerary map.`
}

function SharedTripPageInner({ shareSlug }: { shareSlug: string }) {
  const searchParams = useSearchParams()
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [sentiment, setSentiment] = useState<(typeof sentimentOptions)[number]['value']>('love_it')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const qaFeedbackFailureMode = process.env.NODE_ENV === 'development' ? searchParams.get('qaFeedbackFailure') : null
  const qaForceMapFallback = process.env.NODE_ENV === 'development' && searchParams.get('qaMapFallback') === '1'
  const qaFeedbackFailureConsumedRef = useRef(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['trip-share', shareSlug],
    queryFn: async () => {
      const res = await fetch(`/api/trips/share/${shareSlug}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Not found')
      return res.json() as Promise<TripPayload>
    },
    retry: false,
  })

  const { data: feedback = [], isError: feedbackError, refetch: refetchFeedback } = useQuery({
    queryKey: ['trip-share-feedback', shareSlug],
    queryFn: async () => {
      const res = await fetch(`/api/trips/share/${shareSlug}/feedback`, { cache: 'no-store' })
      if (!res.ok) return [] as TripFeedback[]
      return res.json() as Promise<TripFeedback[]>
    },
    enabled: Boolean(data?.trip),
    retry: false,
  })

  const trip = data?.trip
  const days = data?.days || []
  const displayTitle = useMemo(() => formatTripTitleForDisplay(trip?.title || 'Trip'), [trip?.title])
  const displayTitleParts = useMemo(() => splitTripTitleTiming(displayTitle), [displayTitle])
  const meta = useMemo(() => getTripKeepsakeMeta(displayTitle), [displayTitle])
  const starterPrompt = useMemo(
    () => buildStarterPrompt(meta, displayTitle || 'this trip'),
    [displayTitle, meta]
  )
  const starterHref = `/api/guest/start?q=${encodeURIComponent(starterPrompt)}`
  const shareUrl = typeof window !== 'undefined' ? window.location.href : null
  const emailIsValid = isValidOptionalEmail(authorEmail)
  const trimmedCommentLength = comment.trim().length
  const canSubmit = authorName.trim().length > 1 && trimmedCommentLength >= 8 && trimmedCommentLength <= 600 && emailIsValid && !submitting
  const feedbackHelperText = submitted
    ? 'Feedback sent. It is now visible to the group.'
    : !emailIsValid
    ? 'Use a valid email address or leave it blank.'
    : canSubmit
      ? 'Ready to send'
      : 'Add your name and at least 8 characters.'

  const submitFeedback = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setSubmitted(false)
    setSubmitError(null)
    try {
      if (qaFeedbackFailureMode === '1' || (qaFeedbackFailureMode === 'once' && !qaFeedbackFailureConsumedRef.current)) {
        qaFeedbackFailureConsumedRef.current = true
        throw new Error('Feedback is temporarily unavailable in QA mode.')
      }
      const res = await fetch(`/api/trips/share/${shareSlug}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: authorName.trim(),
          author_email: authorEmail.trim(),
          sentiment,
          comment: comment.trim(),
        }),
      })

      if (res.ok) {
        setComment('')
        setAuthorEmail('')
        setSubmitted(true)
        await refetchFeedback()
        setTimeout(() => setSubmitted(false), 8000)
      } else {
        const payload = await res.json().catch(() => null)
        setSubmitError(payload?.error === 'Invalid feedback'
          ? 'Add your name and a note of at least 8 characters before sending.'
          : payload?.error || 'Could not send feedback. Please try again.')
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not send feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden bg-background text-foreground" aria-label="Shared itinerary">

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6">
        <Link href="/" aria-label="Globe.travel home" className="inline-flex items-center">
          <GlobeBrand />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline" >
            <Link href={trip ? starterHref : '/chat'} prefetch={false}>
              Start your own trip
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-4 md:px-6 md:pt-6">
        {isLoading ? (
          <SharedTripLoadingState />
        ) : isError || !trip ? (
          <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
            <span className="flex size-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Compass className="size-7" />
            </span>
            <h1 className="mt-5 text-3xl font-medium md:text-4xl">This itinerary link is unavailable</h1>
            <p className="mt-3 text-muted-foreground">
              It may have been made private or removed. You can still plan your own trip with Globe.travel.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/api/guest/start?next=/chat">Plan a trip</Link>
            </Button>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-8">
              <section className="grid items-center gap-8 md:grid-cols-[19rem_1fr] md:gap-12">
                <Postcard
                  scene={sceneForTitle(displayTitle, trip.id)}
                  title={meta.destination.split(/ with | and | for /i)[0]}
                  caption={`${days.length} day${days.length === 1 ? '' : 's'} · shared with you`}
                  tilt={-3}
                  postmark
                  className="mx-auto w-full max-w-[19rem]"
                />
                <div>
                  <Badge variant="note" className="mb-3">Shared trip</Badge>
                  <h1 className="break-words text-[clamp(2.5rem,5vw,4rem)] leading-[1] tracking-[-0.035em]">{displayTitleParts.title}</h1>
                  {displayTitleParts.timing && (
                    <p className="mt-2 text-base font-semibold text-primary">In {displayTitleParts.timing}</p>
                  )}
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    Review the route, react to the day plan, and help the group turn the {meta.destination} plan into the trip everyone can say yes to.
                  </p>
                </div>
              </section>

              <section>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-medium">Day-by-day itinerary</h2>
                    <p className="text-sm text-muted-foreground">What the group will actually do</p>
                  </div>
                  <Badge variant="secondary">
                    {days.length} day{days.length === 1 ? '' : 's'}
                  </Badge>
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  {days.map((day, index) => (
                    <KeepsakeRouteCard key={day.id} day={day} active={index === 0} forceStaticMap={qaForceMapFallback} />
                  ))}
                  {days.length === 0 && (
                    <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                      This shared trip does not have itinerary days yet.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle>Help tune the plan</CardTitle>
                  <CardDescription>
                    Keep it short. What should stay, what needs a question, and what could cause friction?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="public-feedback-name">Your name</Label>
                    <Input
                      id="public-feedback-name"
                      type="text"
                      value={authorName}
                      onChange={(e) => {
                        setSubmitted(false)
                        setAuthorName(e.target.value)
                      }}
                      placeholder="Maya"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="public-feedback-email">
                      Email <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="public-feedback-email"
                      type="email"
                      aria-label="Email optional"
                      aria-invalid={!emailIsValid}
                      aria-describedby={!emailIsValid ? 'public-feedback-email-error' : undefined}
                      value={authorEmail}
                      onChange={(e) => {
                        setSubmitted(false)
                        setAuthorEmail(e.target.value)
                      }}
                      placeholder="maya@example.com"
                      className="h-11"
                    />
                    {!emailIsValid && (
                      <p id="public-feedback-email-error" className="text-sm text-destructive">
                        Use a valid email address or leave it blank.
                      </p>
                    )}
                  </div>
                  <fieldset className="grid gap-2">
                    <legend className="mb-1 text-sm font-medium">Reaction</legend>
                    {sentimentOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSubmitted(false)
                          setSentiment(option.value)
                        }}
                        aria-pressed={sentiment === option.value}
                        aria-label={`${option.label}: ${option.helper}`}
                        className={cn(
                          'min-h-11 rounded-lg border px-4 py-2.5 text-left transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                          sentiment === option.value
                            ? sentimentClasses[option.value]
                            : 'bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                        )}
                      >
                        <span className="block text-sm font-semibold">{option.label}</span>{' '}
                        <span className="block text-xs">{option.helper}</span>
                      </button>
                    ))}
                  </fieldset>
                  <div className="space-y-2">
                    <Label htmlFor="public-feedback-comment">What should the group know?</Label>
                    <Textarea
                      id="public-feedback-comment"
                      aria-label="Trip feedback"
                      value={comment}
                      onChange={(e) => {
                        setSubmitted(false)
                        setComment(e.target.value)
                      }}
                      maxLength={600}
                      rows={5}
                      placeholder="Example: Day 2 looks perfect, but can we leave more space before dinner?"
                      className="resize-none"
                    />
                  </div>
                  {submitError && (
                    <Alert variant="destructive">
                      <TriangleAlert />
                      <AlertDescription>{submitError}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{feedbackHelperText}</span>
                    <span>{trimmedCommentLength}/600</span>
                  </div>
                  <Button onClick={submitFeedback} disabled={!canSubmit} size="lg" className="w-full">
                    <Send />
                    {submitting ? 'Sending...' : submitted ? 'Feedback sent' : 'Send feedback'}
                  </Button>
                </CardContent>
              </Card>

              {feedbackError && (
                <Alert variant="destructive">
                  <TriangleAlert />
                  <AlertDescription>
                    <p className="font-medium">Friend feedback could not load.</p>
                    <p>The itinerary is still available. Try refreshing reactions in a moment.</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => refetchFeedback()} className="mt-2">
                      Retry feedback
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              <FriendFeedbackPanel feedback={feedback} />
              <ShareLinkCard shareUrl={shareUrl} title={displayTitle} />

              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle>Plan your own trip</CardTitle>
                  <CardDescription>
                    Start with a destination, build a day-by-day route, then send a link for friend feedback.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild size="lg" className="w-full">
                    <Link href={starterHref}>
                      Start your own trip
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

export default function SharedTripClient({ shareSlug }: { shareSlug: string }) {
  return (
    <QueryProvider>
      <SharedTripPageInner shareSlug={shareSlug} />
    </QueryProvider>
  )
}
