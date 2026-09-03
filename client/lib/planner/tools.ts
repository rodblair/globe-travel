import type { UIMessage } from 'ai'
import type { PlanIntent } from '@/lib/planner/types'

export const PLANNER_TOOL_GROUPS = {
  profile: ['addVisitedPlace', 'addBucketListPlace', 'navigateToPlace', 'setTravelPreferences'],
  planningCore: ['resolvePlace', 'createTrip', 'setTripDays', 'setFullTripPlan'],
  planningEdits: ['swapTripItem', 'replaceTripDayPlan', 'addTripItem', 'moveTripItem', 'updateTripItem', 'deleteTripItem'],
  routing: ['computeDayRoute'],
} as const

export function inferPlanIntent({
  latestUserText,
  hasExistingTrip,
  hasExistingDays,
  hasExistingItems,
}: {
  latestUserText: string
  hasExistingTrip: boolean
  hasExistingDays: boolean
  hasExistingItems: boolean
}): PlanIntent {
  const normalized = latestUserText.toLowerCase().replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return hasExistingTrip || hasExistingDays || hasExistingItems ? 'item-edit' : 'clarify'
  }

  const dayRewritePatterns = [
    /\b(regenerate|rewrite|rebuild|replace)\b.*\bday\s*\d+\b/,
    /\bday\s*\d+\b.*\b(regenerate|rewrite|rebuild|replace)\b/,
    /\b(regenerate|rewrite|rebuild|replace)\b.*\b(day|morning|afternoon|evening)\b/,
    /\b(make|optimi[sz]e|improve|reorder)\b.*\bday\s*\d+\b.*\b(walkable|walking|backtracking|route|flow)\b/,
    /\bday\s*\d+\b.*\b(make|optimi[sz]e|improve|reorder)\b.*\b(walkable|walking|backtracking|route|flow)\b/,
  ]
  if (dayRewritePatterns.some((pattern) => pattern.test(normalized))) return 'day-rewrite'

  const lodgingAddPatterns = [
    /\b(add|include|insert|append|also add|add another|recommend|suggest)\b.*\b(hotel|lodging|stay|accommodation|place to stay)\b/,
    /\b(hotel|lodging|accommodation|place to stay)\b.*\b(add|added|include|included|needed|missing)\b/,
    /\bwhere\s+(should|can)\s+(i|we)\s+stay\b/,
  ]
  if (lodgingAddPatterns.some((pattern) => pattern.test(normalized))) return 'add-items'

  const itemEditPatterns = [
    /\b(regenerate|rewrite|rebuild|replace|swap|move|delete|remove|update|edit)\b.*\b(day|morning|afternoon|evening|activity|meal|item|stop|hotel|lodging|stay|accommodation)\b/,
    /\b(make|change|set)\b.*\b(activity|meal|item|stop|hotel|lodging|stay|accommodation)\b/,
    /\b(day\s*\d+)\b.*\b(regenerate|rewrite|rebuild|replace|swap|move|delete|remove|update|edit|make|change|set)\b/,
    /\b(this activity|this stop|that stop|this item|that item|this hotel|that hotel|the hotel)\b/,
  ]
  if (itemEditPatterns.some((pattern) => pattern.test(normalized))) return 'item-edit'

  if (
    /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen)\s*[- ]?\s*days?\b/.test(normalized) &&
    /\b(?:trip|itinerary|schedule|plan)\b/.test(normalized)
  ) {
    return 'full-plan'
  }

  const fullPlanPatterns = [
    /\b(plan|build|create|make|generate)\b.*\b(itinerary|trip|days?|schedule)\b/,
    /\b(full itinerary|from scratch|start over|replace the whole trip|whole trip|full trip)\b/,
    /\b(make it more relaxed|better flow|less packed|more packed|optimize order)\b/,
  ]
  if (fullPlanPatterns.some((pattern) => pattern.test(normalized))) return 'full-plan'

  const addPatterns = [
    /\b(add|insert|append|also add|add another|more)\b.*\b(day trip|stop|activity|meal|museum|restaurant|attraction|hotel|lodging|stay|accommodation)\b/,
    /\b(add|insert|append|also add|add another|more)\b.*\b(?:to|into|onto)\s+(?:this|the|current|existing|live|same|my|our)\s+(?:trip|itinerary|plan|day)\b/,
    /\bday trip\b/,
  ]
  if (addPatterns.some((pattern) => pattern.test(normalized))) return 'add-items'

  if (!hasExistingDays || !hasExistingItems) return 'full-plan'
  return hasExistingTrip ? 'item-edit' : 'clarify'
}

export function getPlanToolSelection(intent: PlanIntent, hasTripId: boolean) {
  const baseSelection = ['resolvePlace']

  if (intent === 'clarify') return [] as string[]

  if (intent === 'full-plan') {
    return hasTripId
      ? [...baseSelection, 'setFullTripPlan']
      : [...baseSelection, 'createTrip', 'setFullTripPlan']
  }

  if (intent === 'day-rewrite') {
    return hasTripId
      ? [...baseSelection, 'replaceTripDayPlan']
      : [...baseSelection, 'createTrip', 'replaceTripDayPlan']
  }

  if (intent === 'add-items') {
    return hasTripId
      ? [...baseSelection, 'setTripDays', 'addTripItem', 'moveTripItem', 'updateTripItem']
      : [...baseSelection, 'createTrip', 'setTripDays', 'addTripItem', 'moveTripItem', 'updateTripItem']
  }

  return hasTripId
    ? [...baseSelection, 'setTripDays', 'swapTripItem', 'replaceTripDayPlan', 'addTripItem', 'moveTripItem', 'updateTripItem', 'deleteTripItem']
    : [...baseSelection, 'createTrip', 'setTripDays', 'swapTripItem', 'replaceTripDayPlan', 'addTripItem', 'moveTripItem', 'updateTripItem', 'deleteTripItem']
}

export function getPlanToolChoice(stepNumber: number, intent: PlanIntent) {
  if (intent === 'clarify') return 'none' as const
  if (stepNumber === 0 && intent === 'full-plan') {
    return { type: 'tool' as const, toolName: 'setFullTripPlan' as const }
  }
  if (stepNumber === 0 && intent === 'day-rewrite') {
    return { type: 'tool' as const, toolName: 'replaceTripDayPlan' as const }
  }
  if (stepNumber === 0) return 'required' as const
  return 'none' as const
}

export function buildPlanStepMessages(
  messages: UIMessage[],
  stepNumber: number
) {
  return stepNumber === 0 ? messages : messages.slice(-8)
}
