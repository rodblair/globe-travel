import { pruneMessages, type UIMessage } from 'ai'
import type { PlanIntent } from '@/lib/planner/types'

export const PLANNER_TOOL_GROUPS = {
  profile: ['addVisitedPlace', 'addBucketListPlace', 'navigateToPlace', 'setTravelPreferences'],
  planningCore: ['resolvePlace', 'createTrip', 'setTripDays', 'setFullTripPlan'],
  planningEdits: ['addTripItem', 'moveTripItem', 'updateTripItem', 'deleteTripItem'],
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

  const fullPlanPatterns = [
    /\b(plan|build|create|make|generate)\b.*\b(itinerary|trip|days?|schedule)\b/,
    /\b(full itinerary|from scratch|start over|replace the whole trip|whole trip|full trip)\b/,
    /\b(make it more relaxed|better flow|less packed|more packed|optimize order)\b/,
  ]
  if (fullPlanPatterns.some((pattern) => pattern.test(normalized))) return 'full-plan'

  const itemEditPatterns = [
    /\b(regenerate|rewrite|rebuild|replace|swap|move|delete|remove|update|edit)\b.*\b(day|morning|afternoon|evening|activity|meal|item|stop)\b/,
    /\b(day\s*\d+)\b.*\b(regenerate|rewrite|rebuild|replace|swap|move|delete|remove|update|edit)\b/,
    /\b(this activity|this stop|that stop|this item|that item)\b/,
  ]
  if (itemEditPatterns.some((pattern) => pattern.test(normalized))) return 'item-edit'

  const addPatterns = [
    /\b(add|insert|append|also add|add another|more)\b.*\b(day trip|stop|activity|meal|museum|restaurant|attraction)\b/,
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

  if (intent === 'add-items') {
    return hasTripId
      ? [...baseSelection, 'setTripDays', 'addTripItem', 'moveTripItem', 'updateTripItem']
      : [...baseSelection, 'createTrip', 'setTripDays', 'addTripItem', 'moveTripItem', 'updateTripItem']
  }

  return hasTripId
    ? [...baseSelection, 'setTripDays', 'addTripItem', 'moveTripItem', 'updateTripItem', 'deleteTripItem']
    : [...baseSelection, 'createTrip', 'setTripDays', 'addTripItem', 'moveTripItem', 'updateTripItem', 'deleteTripItem']
}

export function getPlanToolChoice(stepNumber: number, intent: PlanIntent) {
  if (intent === 'clarify') return 'none' as const
  if (stepNumber === 0 && intent === 'full-plan') {
    return { type: 'tool' as const, toolName: 'setFullTripPlan' as const }
  }
  if (stepNumber === 0) return 'required' as const
  return 'none' as const
}

export function buildPlanStepMessages(
  messages: UIMessage[],
  stepNumber: number
) {
  if (stepNumber === 0) {
    return pruneMessages({
      messages,
      reasoning: 'none',
      toolCalls: 'none',
      emptyMessages: 'remove',
    })
  }

  return pruneMessages({
    messages: messages.slice(-8),
    reasoning: 'none',
    toolCalls: 'before-last-message',
    emptyMessages: 'remove',
  })
}
