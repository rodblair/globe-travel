import type { UIMessage } from 'ai'
import { buildTripDaySummaries, createPlannerRuntimeContext, createTripContext, deriveGroupBrief, extractLatestUserMessage } from '@/lib/planner/runtime'
import type { PlannerMode, PlannerSession } from '@/lib/planner/types'

function buildSessionId({
  mode,
  userId,
  conversationId,
  tripId,
}: {
  mode: PlannerMode
  userId: string
  conversationId?: string
  tripId?: string
}) {
  return [mode, userId, tripId || 'no-trip', conversationId || 'default'].join(':')
}

function summarizeFeedback(feedback: Array<{ sentiment: 'love_it' | 'curious' | 'practical'; comment?: string | null }>) {
  if (!feedback.length) {
    return { count: 0, signals: [] as string[] }
  }

  const signals = [
    feedback.some((item) => item.sentiment === 'love_it') ? 'some friends love the direction' : null,
    feedback.some((item) => item.sentiment === 'practical') ? 'there are practical concerns to address' : null,
    feedback.some((item) => item.sentiment === 'curious') ? 'the group wants more options or explanation' : null,
  ].filter(Boolean) as string[]

  return {
    count: feedback.length,
    signals,
  }
}

export async function loadPlannerSession({
  db,
  userId,
  messages,
  mode,
  tripId,
  conversationId,
}: {
  db: any
  userId: string
  messages: UIMessage[]
  mode: PlannerMode
  tripId?: string
  conversationId?: string
}): Promise<PlannerSession> {
  const latestUserText = extractLatestUserMessage(messages)

  let visited: string[] = []
  let bucketList: string[] = []
  let profile: { travelStyle?: string | null; displayName?: string | null } | undefined

  if (mode === 'explore' || mode === 'plan') {
    const { data: userPlaces } = await db
      .from('user_places')
      .select('status, place:places(name, country)')
      .eq('user_id', userId)

    if (userPlaces?.length) {
      visited = userPlaces
        .filter((place: any) => place.status === 'visited')
        .map((place: any) => `${place.place?.name}, ${place.place?.country}`)
      bucketList = userPlaces
        .filter((place: any) => place.status === 'bucket_list')
        .map((place: any) => `${place.place?.name}, ${place.place?.country}`)
    }

    const { data: profileData } = await db
      .from('profiles')
      .select('travel_style, display_name')
      .eq('id', userId)
      .single()

    profile = {
      travelStyle: profileData?.travel_style || null,
      displayName: profileData?.display_name || null,
    }
  }

  let tripContext
  let feedbackSummary = { count: 0, signals: [] as string[] }

  if (mode === 'plan' && tripId) {
    const [{ data: trip }, { data: tripDays }, { data: feedback }] = await Promise.all([
      db
        .from('trips')
        .select('title,start_date,end_date,pace,budget_level,constraints')
        .eq('id', tripId)
        .maybeSingle(),
      db
        .from('trip_days')
        .select('id,day_index,title,date,notes')
        .eq('trip_id', tripId)
        .order('day_index', { ascending: true }),
      db
        .from('trip_feedback')
        .select('sentiment,comment')
        .eq('trip_id', tripId),
    ])

    const dayIds = (tripDays || []).map((day: any) => day.id)
    const { data: dayItems } = dayIds.length === 0
      ? { data: [] }
      : await db
          .from('trip_items')
          .select('trip_day_id,title,type,start_time')
          .in('trip_day_id', dayIds)
          .order('order_index', { ascending: true })

    const tripDayState = buildTripDaySummaries(
      (tripDays || []).map((day: any) => ({ id: day.id, day_index: day.day_index, title: day.title })),
      (dayItems || []).map((item: any) => ({
        trip_day_id: item.trip_day_id,
        title: item.title,
        type: item.type,
        start_time: item.start_time,
      }))
    )

    feedbackSummary = summarizeFeedback(feedback || [])

    tripContext = createTripContext({
      tripId,
      title: trip?.title,
      startDate: trip?.start_date,
      endDate: trip?.end_date,
      budgetLevel: trip?.budget_level,
      pace: trip?.pace,
      brief: deriveGroupBrief({
        title: trip?.title,
        constraints: (trip?.constraints as Record<string, unknown> | null) || null,
        budgetLevel: trip?.budget_level,
        pace: trip?.pace,
      }),
      dayCount: (tripDays || []).length,
      hasExistingDays: tripDayState.hasExistingDays,
      hasExistingItems: tripDayState.hasExistingItems,
      days: tripDayState.days,
    })
  }

  const runtime = createPlannerRuntimeContext({
    mode,
    latestUserText,
    visited,
    bucketList,
    profile,
    trip: tripContext,
    feedbackSummary,
  })

  return {
    sessionId: buildSessionId({ mode, userId, conversationId, tripId }),
    mode,
    userId,
    tripId,
    latestUserText,
    runtime,
  }
}
