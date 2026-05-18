import type { UIMessage } from 'ai'
import type { PlannerGroupBrief, PlannerRuntimeContext, PlannerTripContext, PlannerTripDaySummary } from '@/lib/planner/types'

const DAY_NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
}
const DAY_NUMBER_SOURCE = String.raw`\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen`
const DAY_DURATION_SOURCE = String.raw`(?:${DAY_NUMBER_SOURCE})\s*[- ]?\s*(?:day|days)`
const DAY_DURATION_PATTERN = new RegExp(String.raw`\b(${DAY_NUMBER_SOURCE})\s*[- ]?\s*(?:day|days)\b`, 'i')
const DESTINATION_TRAILING_THEME_PATTERN =
  /\s+\b(?:food(?:ie)?|viewpoints?|views?|restaurants?|cafes?|cafés?|coffee|wine|nightlife|bars?|beach(?:es)?|museums?|galleries|art|history|historic|culture|design|architecture|shops?|shopping|bakeries|bakery|romantic|family|families|friends?|group|walkable|walking|budget|luxury|midrange|cheap|premium|balanced|relaxed|packed|adventure|outdoors?|markets?)\b.*$/i

export function extractDaysFromPrompt(text: string | null | undefined): number | null {
  if (!text) return null
  const normalized = text.trim().toLowerCase()
  const match = normalized.match(DAY_DURATION_PATTERN)
  if (match?.[1]) {
    const token = match[1].toLowerCase()
    const parsed = /^\d+$/.test(token) ? Number(token) : DAY_NUMBER_WORDS[token]
    return Number.isFinite(parsed) ? Math.min(14, Math.max(1, parsed)) : null
  }
  if (/\bweekend\b/.test(normalized)) return 2
  return null
}

function cleanDestinationCandidate(candidate: string) {
  return candidate
    .replace(/[“”"']/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^(?:plan|build|create|make|generate)\s+(?:(?:an|a|the)\s+)?/i, '')
    .replace(new RegExp(String.raw`^(?:${DAY_DURATION_SOURCE})\s+(?:in|to|for)\s+`, 'i'), '')
    .replace(new RegExp(String.raw`^(?:${DAY_DURATION_SOURCE})\s+`, 'i'), '')
    .replace(/^(?:in|to|for)\s+/i, '')
    .replace(/\s+\band\s+[A-Z][A-Za-z\s'’-]{1,60}$/g, '')
    .replace(DESTINATION_TRAILING_THEME_PATTERN, '')
    .replace(/\s+(?:trip|itinerary|city break|escape|weekend|getaway|with friends|for friends)$/i, '')
    .trim()
}

function looksLikeDateOrDuration(candidate: string) {
  const normalized = candidate.trim().toLowerCase()
  if (!normalized) return true

  return (
    /\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(normalized) ||
    /\b(?:spring|summer|fall|autumn|winter|weekend|weekday|tonight|tomorrow|next\s+week|next\s+month|next\s+year)\b/.test(normalized) ||
    new RegExp(String.raw`^(?:${DAY_DURATION_SOURCE}|(?:\d+|${Object.keys(DAY_NUMBER_WORDS).join('|')})\s*[- ]?\s*(?:night|nights|week|weeks))$`, 'i').test(normalized)
  )
}

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
    /^(.+?)\s+with\s+Friends?$/i,
    /^(.+?)\s+for\s+Friends?$/i,
    /^(.+?)\s+Itinerary$/i,
    /^(.+?)\s+City\s+Break$/i,
  ]
  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    if (match?.[1]) return cleanDestinationCandidate(match[1])
  }
  return cleanDestinationCandidate(cleaned)
}

export function extractDestinationFromPrompt(text: string | null | undefined): string {
  if (!text) return ''
  const cleaned = text.trim()
  const commandSource = String.raw`\b(?:plan|build|create|make|generate)\s+(?:(?:me|us)\s+)?(?:(?:an|a|the)\s+)?`
  const patterns = [
    new RegExp(String.raw`${commandSource}(?:${DAY_DURATION_SOURCE})\s+(?:in|to|for)\s+([A-Za-z][A-Za-z\s'’-]{1,60}?)(?=\s+\b(?:for|with|around|over|as|trip|itinerary|city break)\b|[,.!?]|$)`, 'i'),
    new RegExp(String.raw`${commandSource}(?:${DAY_DURATION_SOURCE})\s+([A-Za-z][A-Za-z\s'’-]{1,60}?)\s+(?:trip|itinerary|city break)\b`, 'i'),
    new RegExp(String.raw`${commandSource}(?:(?:${DAY_DURATION_SOURCE})\s+)?([A-Za-z][A-Za-z\s'’-]{1,60}?)(?=\s+\b(?:(?:${DAY_DURATION_SOURCE})|for|with|around|over|as|trip|itinerary|weekend|city break)\b|[,.!?]|$)`, 'i'),
    new RegExp(String.raw`${commandSource}([A-Za-z][A-Za-z\s'’-]{1,60}?)\s+(?:${DAY_DURATION_SOURCE}|weekend)\b`, 'i'),
    new RegExp(String.raw`\b(?:${DAY_DURATION_SOURCE})\s+([A-Za-z][A-Za-z\s'’-]{1,60}?)\s+trip\b`, 'i'),
    /\b(?:in|to|for)\s+([A-Za-z][A-Za-z\s'’-]{1,60}?)(?=\s+\b(?:for|with|from|on|around|near|and|that|who|leaving|including)\b|[,.!?]|$)/i,
    /\b([A-Za-z][A-Za-z\s'’-]{1,60}?)\s+trip\b/i,
    /\b([A-Za-z][A-Za-z\s'’-]{1,60}?)\s+itinerary\b/i,
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    const candidate = match?.[1]?.trim()
    if (!candidate) continue
    const normalized = cleanDestinationCandidate(extractDestinationFromTitle(candidate))
    if (
      normalized &&
      !looksLikeDateOrDuration(normalized) &&
      !/^(?:realistic|balanced|beautiful|budget|friendly|group|city|day city|short|weekend|friends?|couples?|family)$/i.test(normalized)
    ) {
      return normalized
    }
  }

  return ''
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
