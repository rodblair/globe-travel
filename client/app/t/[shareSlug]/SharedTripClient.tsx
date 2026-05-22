'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowRight, Compass, Send, Sparkles } from 'lucide-react'
import type { TripDay } from '@/components/trips/ItineraryArtifact'
import {
  FriendFeedbackPanel,
  KeepsakeRouteCard,
  ShareLinkCard,
  TripPosterPreview,
  getTripKeepsakeMeta,
} from '@/components/trips/KeepsakeArtifacts'
import { AlbatrossBrand } from '@/components/atmosphere/AlbatrossBrand'
import { ContourOverlay } from '@/components/atmosphere/ContourOverlay'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { formatTripTitleForDisplay } from '@/lib/trip-copy'
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
  love_it: 'border-[color:var(--pillar-nature-wash)] bg-[color:var(--pillar-nature-wash)] text-[var(--moss)]',
  curious: 'border-[color:var(--pillar-coastal-wash)] bg-[color:var(--pillar-coastal-wash)] text-[var(--horizon)]',
  practical: 'border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] text-foreground',
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
  const feedbackHelperText = !emailIsValid
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
        setTimeout(() => setSubmitted(false), 2600)
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
    <main className="relative min-h-screen overflow-hidden bg-paper text-foreground">
      <div className="absolute inset-0 opacity-70">
        <ContourOverlay density="sparse" />
      </div>
      <div className="paper-grain absolute inset-0 pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-64 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--brass),transparent_86%),transparent)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 md:px-6 md:py-6">
        <Link href="/" className="touch-target inline-flex items-center">
          <AlbatrossBrand compact />
        </Link>
        <Link
          href={trip ? starterHref : '/chat'}
          className="touch-target inline-flex items-center justify-center gap-2 rounded-full border border-rule bg-paper-raised px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-paper-hover"
        >
          Start your own trip
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-5 md:px-6 md:pt-7">
        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-[680px] animate-pulse rounded-[34px] bg-paper-recessed" />
            <div className="space-y-4">
              <div className="h-64 animate-pulse rounded-[28px] bg-paper-recessed" />
              <div className="h-64 animate-pulse rounded-[28px] bg-paper-recessed" />
            </div>
          </div>
        ) : isError || !trip ? (
          <section className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
            <Compass className="h-10 w-10 text-[var(--brass)]" />
            <h1 className="mt-5 font-serif text-4xl font-semibold text-foreground">This itinerary link is unavailable.</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-2">
              It may have been made private or removed. You can still start a new Globe.travel plan.
            </p>
            <Link href="/chat" className="mt-8 rounded-full bg-[var(--brass)] px-5 py-3 text-sm font-semibold text-[var(--brass-text)]">
              Open planner
            </Link>
          </section>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
            <div className="space-y-7">
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
              >
                <div className="mb-6 max-w-2xl">
                  <p className="t-mono text-[0.6875rem] uppercase tracking-[0.24em] text-[var(--brass)]">
                    Shared Globe.travel map
                  </p>
                  <h1 className="mt-3 break-words font-serif text-4xl font-semibold leading-[1.02] text-foreground md:text-6xl">
                    {displayTitle}
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2">
                    Review the route, react to the day plan, and help the group turn the {meta.destination} plan into the trip everyone can say yes to.
                  </p>
                </div>
                <TripPosterPreview trip={trip} days={days} forceStaticMap={qaForceMapFallback} />
              </motion.section>

              <section className="rounded-[30px] border border-rule bg-paper-raised p-5 shadow-[var(--panel-shadow)] md:p-6 lg:p-7">
                <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="t-mono text-[0.625rem] uppercase tracking-[0.22em] text-ink-3">Day-by-day itinerary</p>
                    <h2 className="mt-1 font-serif text-2xl font-semibold text-foreground">What the group will actually do</h2>
                  </div>
                  <span className="rounded-full border border-rule bg-paper-recessed px-3 py-1.5 text-xs text-ink-2">
                    {days.length} day{days.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  {days.map((day, index) => (
                    <KeepsakeRouteCard key={day.id} day={day} active={index === 0} forceStaticMap={qaForceMapFallback} />
                  ))}
                  {days.length === 0 && (
                    <p className="rounded-2xl border border-dashed border-rule bg-paper-recessed px-4 py-8 text-center text-sm text-ink-2">
                      This shared trip does not have itinerary days yet.
                    </p>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <section className="rounded-[26px] border border-rule bg-paper-raised p-5 shadow-[var(--panel-shadow)] md:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="t-mono text-[0.625rem] uppercase tracking-[0.22em] text-ink-3">Add your reaction</p>
                    <h2 className="mt-1 font-serif text-xl font-semibold text-foreground">Help tune the plan</h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-2">
                      Keep it short. What should stay, what needs a question, and what could cause friction?
                    </p>
                  </div>
                  <Sparkles className="h-5 w-5 text-[var(--brass)]" />
                </div>

                <div className="mt-5 space-y-3">
                  <input
                    aria-label="Your name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-2xl border border-rule bg-paper-recessed px-4 py-3 text-sm text-foreground placeholder:text-ink-3 focus:border-[color:var(--brass)]/40 focus:outline-none"
                  />
                  <input
                    aria-label="Email optional"
                    aria-invalid={!emailIsValid}
                    aria-describedby={!emailIsValid ? 'public-feedback-email-error' : undefined}
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    placeholder="Email (optional)"
                    className="w-full rounded-2xl border border-rule bg-paper-recessed px-4 py-3 text-sm text-foreground placeholder:text-ink-3 focus:border-[color:var(--brass)]/40 focus:outline-none"
                  />
                  {!emailIsValid && (
                    <p id="public-feedback-email-error" className="rounded-2xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] px-4 py-3 text-sm text-[var(--terracotta)]">
                      Use a valid email address or leave it blank.
                    </p>
                  )}
                  <div className="grid gap-2">
                    {sentimentOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSentiment(option.value)}
                        aria-pressed={sentiment === option.value}
                        aria-label={`${option.label}: ${option.helper}`}
                        className={cn(
                          'touch-target rounded-2xl border px-4 py-3 text-left transition-colors',
                          sentiment === option.value
                            ? sentimentClasses[option.value]
                            : 'border-rule bg-paper-recessed text-ink-2 hover:text-foreground'
                        )}
                      >
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="mt-0.5 block text-xs">{option.helper}</span>
                      </button>
                    ))}
                  </div>
                  {submitError && (
                    <p role="alert" className="rounded-2xl border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] px-4 py-3 text-sm text-[var(--terracotta)]">
                      {submitError}
                    </p>
                  )}
                  <textarea
                    aria-label="Trip feedback"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={600}
                    rows={5}
                    placeholder="Example: Day 2 looks perfect, but can we leave more space before dinner?"
                    className="w-full resize-none rounded-2xl border border-rule bg-paper-recessed px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-ink-3 focus:border-[color:var(--brass)]/40 focus:outline-none"
                  />
                  <div className="flex items-center justify-between gap-3 text-xs text-ink-3">
                    <span>{feedbackHelperText}</span>
                    <span>{trimmedCommentLength}/600</span>
                  </div>
                  <button
                    onClick={submitFeedback}
                    disabled={!canSubmit}
                    className="touch-target inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brass)] px-4 py-3 text-sm font-semibold text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-hover)] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? 'Sending...' : submitted ? 'Feedback sent' : 'Send feedback'}
                  </button>
                </div>
              </section>

              {feedbackError && (
                <section className="rounded-[26px] border border-[color:var(--pillar-desert-wash)] bg-[color:var(--pillar-desert-wash)] p-5 text-sm text-[var(--terracotta)] shadow-[var(--panel-shadow)] md:p-6">
                  <p className="font-semibold">Friend feedback could not load.</p>
                  <p className="mt-1 leading-relaxed">
                    The itinerary is still available. Try refreshing reactions in a moment.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchFeedback()}
                    className="touch-target mt-3 rounded-full border border-[color:var(--terracotta)]/30 bg-paper-raised px-4 py-2 text-xs font-semibold text-[var(--terracotta)]"
                  >
                    Retry feedback
                  </button>
                </section>
              )}
              <FriendFeedbackPanel feedback={feedback} />
              <ShareLinkCard shareUrl={shareUrl} title={displayTitle} />

              <section className="overflow-hidden rounded-[26px] border border-[color:var(--brass)]/30 bg-[linear-gradient(135deg,var(--brass-subtle),var(--paper-raised))] p-5 shadow-[var(--panel-shadow)] md:p-6">
                <p className="t-mono text-[0.625rem] uppercase tracking-[0.22em] text-[var(--brass)]">
                  Make one for your group
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight text-foreground">
                  Turn your own city idea into a Globe.travel map.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  Start with a destination, build a day-by-day route, then send a polished link for friend feedback.
                </p>
                <Link
                  href={starterHref}
                  className="touch-target mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brass)] px-4 py-3 text-sm font-semibold text-[var(--brass-text)] transition-colors hover:bg-[var(--brass-hover)]"
                >
                  Start your own trip
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
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
