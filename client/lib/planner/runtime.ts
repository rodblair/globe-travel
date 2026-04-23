import type { UIMessage } from 'ai'
import type { PlannerGroupBrief, PlannerRuntimeContext, PlannerTripContext, PlannerTripDaySummary } from '@/lib/planner/types'

export function extractLatestUserMessage(messages: UIMessage[]) {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')
  if (!latestUserMessage) return ''

  return latestUserMessage.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as { type: 'text'; text: string }).text)
    .join(' ')
    .trim()
}

export function extractDestinationFromTitle(title: string | null | undefined): string {
  if (!title) return ''
  const cleaned = title.trim()
  const patterns = [
    /^\d+\s+Days?\s+in\s+(.+?)(?=\s+\b(?:for|with|on|around|near|from)\b|[,.!?]|$)/i,
    /^(.+?)\s+in\s+(January|February|March|April|May|June|July|August|September|October|November|December)\b/i,
    /^(.+?)\s+in\s+\d+\s+Days?$/i,
    /^(.+?)\s+in\s+\d+\s+Nights?$/i,
    /^(.+?)\s+Weekend\s+Getaway$/i,
    /^(.+?)\s+Day\s+Trip$/i,
    /^Trip to\s+(.+)$/i,
    /^(.+?)\s+Trip$/i,
  ]
  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return cleaned
}

function coerceDays(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function deriveGroupBrief({
  title,
  constraints,
  budgetLevel,
  pace,
}: {
  title?: string | null
  constraints?: Record<string, unknown> | null
  budgetLevel?: string | null
  pace?: string | null
}): PlannerGroupBrief {
  const destination = (typeof constraints?.destination_query === 'string' && constraints.destination_query) || extractDestinationFromTitle(title)
  const vibe = typeof constraints?.group_vibe === 'string' ? constraints.group_vibe : null
  const days = coerceDays(constraints?.days)

  return {
    destination: destination || null,
    days,
    budget: budgetLevel || null,
    pace: pace || null,
    vibe,
  }
}

export function buildTripDaySummaries(
  tripDays: Array<{ id: string; day_index: number; title?: string | null }>,
  dayItems: Array<{ trip_day_id: string; title: string; type: string; start_time?: string | null }> = []
) {
  const itemsByDay = new Map<string, typeof dayItems>()
  for (const item of dayItems) {
    if (!itemsByDay.has(item.trip_day_id)) itemsByDay.set(item.trip_day_id, [])
    itemsByDay.get(item.trip_day_id)!.push(item)
  }

  const days: PlannerTripDaySummary[] = tripDays.map((day) => {
    const items = itemsByDay.get(day.id) || []
    return {
      id: day.id,
      dayIndex: day.day_index,
      title: day.title || null,
      hasItems: items.length > 0,
      summary:
        items.length > 0
          ? items.map((item) => `${item.start_time || 'unscheduled'} ${item.title} (${item.type})`).join('; ')
          : 'empty',
    }
  })

  return {
    days,
    hasExistingDays: tripDays.length > 0,
    hasExistingItems: days.some((day) => day.hasItems),
  }
}

export function createPlannerRuntimeContext(input: PlannerRuntimeContext): PlannerRuntimeContext {
  return input
}

export function createTripContext(input: PlannerTripContext): PlannerTripContext {
  return input
}
