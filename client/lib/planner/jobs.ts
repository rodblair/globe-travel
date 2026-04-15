import { randomUUID } from 'crypto'
import { loadPlannerSession } from '@/lib/planner/session'
import { listScoredDestinations } from '@/lib/planner/scoring'
import type { PlannerWorkflowJob, PlannerWorkflowType } from '@/lib/planner/types'

const plannerJobs = new Map<string, PlannerWorkflowJob[]>()

function upsertJob(job: PlannerWorkflowJob) {
  const current = plannerJobs.get(job.tripId) || []
  const next = [job, ...current.filter((entry) => entry.id !== job.id)].slice(0, 12)
  plannerJobs.set(job.tripId, next)
}

function getJobs(tripId: string) {
  return plannerJobs.get(tripId) || []
}

function buildDecisionMemo(session: Awaited<ReturnType<typeof loadPlannerSession>>) {
  const trip = session.runtime.trip
  const destination = trip?.brief?.destination || trip?.title || 'this city'
  const ranked = listScoredDestinations({
    groupSize: trip?.brief?.days ? undefined : undefined,
    budget: trip?.brief?.budget || null,
    vibe: trip?.brief?.vibe || null,
    limit: 3,
  })

  const topPick = ranked[0]
  return {
    headline: `${destination} looks ${topPick?.city?.toLowerCase() === String(destination).toLowerCase() ? 'aligned' : 'promising'} for this crew`,
    summary: [
      trip?.brief?.vibe ? `The current vibe is "${trip.brief.vibe}".` : 'The crew vibe is still fairly open.',
      trip?.brief?.budget ? `Budget target is ${trip.brief.budget}.` : 'Budget needs a clearer decision.',
      session.runtime.feedbackSummary?.count
        ? `${session.runtime.feedbackSummary.count} friend review(s) already shape the plan.`
        : 'No friend feedback yet, so consensus risk is still high.',
    ],
    bestOptions: ranked,
    nextMoves: [
      'Share the current draft and collect two practical reactions.',
      'Decide whether dinner + nightlife or slower daytime culture matters more.',
      'Lock one must-keep moment per day before making the itinerary denser.',
    ],
  }
}

function buildVariants(session: Awaited<ReturnType<typeof loadPlannerSession>>) {
  const trip = session.runtime.trip
  const destination = trip?.brief?.destination || trip?.title || 'the destination'
  return {
    destination,
    variants: [
      {
        id: 'budget',
        label: 'Cheap & cheerful',
        summary: `Prioritize free walking, casual meals, and one strong night out in ${destination}.`,
        tradeoffs: ['Less premium dining', 'More compact neighborhood focus'],
      },
      {
        id: 'balanced',
        label: 'Balanced crowd-pleaser',
        summary: `Blend one headline cultural stop, one standout dinner, and relaxed social time each day in ${destination}.`,
        tradeoffs: ['Moderate spend', 'Best fit for mixed tastes'],
      },
      {
        id: 'premium',
        label: 'Treat ourselves',
        summary: `Upgrade to destination dining, design-forward stays, and one polished signature experience in ${destination}.`,
        tradeoffs: ['Higher spend', 'Needs clearer group budget alignment'],
      },
    ],
  }
}

function buildFeedbackRefresh(session: Awaited<ReturnType<typeof loadPlannerSession>>) {
  const feedback = session.runtime.feedbackSummary
  const trip = session.runtime.trip
  const destination = trip?.brief?.destination || trip?.title || 'this trip'
  return {
    destination,
    status: feedback?.count ? 'ready' : 'needs_feedback',
    summary: feedback?.count
      ? `The planner should rebalance ${destination} around: ${feedback.signals.join('; ')}.`
      : 'There is no friend feedback yet, so the best next move is to share the trip before regenerating.',
    suggestedPrompts: feedback?.count
      ? [
          `Rework this ${destination} itinerary to address the latest friend feedback while keeping it fun for the group.`,
          `Make the pacing calmer and keep the strongest dinner and one signature activity per day.`,
        ]
      : [
          'Enable the public review link and ask two friends for one practical note each.',
        ],
  }
}

async function runJob({
  db,
  userId,
  tripId,
  type,
}: {
  db: any
  userId: string
  tripId: string
  type: PlannerWorkflowType
}) {
  const session = await loadPlannerSession({
    db,
    userId,
    messages: [],
    mode: 'plan',
    tripId,
    conversationId: `workflow:${type}`,
  })

  if (type === 'decision_memo') return buildDecisionMemo(session)
  if (type === 'generate_variants') return buildVariants(session)
  return buildFeedbackRefresh(session)
}

export async function enqueuePlannerWorkflowJob({
  db,
  userId,
  tripId,
  type,
}: {
  db: any
  userId: string
  tripId: string
  type: PlannerWorkflowType
}) {
  const now = new Date().toISOString()
  const job: PlannerWorkflowJob = {
    id: randomUUID(),
    tripId,
    type,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
  }
  upsertJob(job)

  void (async () => {
    try {
      upsertJob({ ...job, status: 'running', updatedAt: new Date().toISOString() })
      const result = await runJob({ db, userId, tripId, type })
      upsertJob({
        ...job,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        result,
      })
    } catch (error) {
      upsertJob({
        ...job,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Workflow failed',
      })
    }
  })()

  return job
}

export function listPlannerWorkflowJobs(tripId: string) {
  return getJobs(tripId)
}
