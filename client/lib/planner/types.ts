import type { UIMessage } from 'ai'

export type PlannerMode = 'onboarding' | 'explore' | 'plan'

export type PlanIntent = 'full-plan' | 'item-edit' | 'add-items' | 'clarify'

export type PlannerProfileContext = {
  displayName?: string | null
  travelStyle?: string | null
}

export type PlannerGroupBrief = {
  destination?: string | null
  days?: number | null
  budget?: string | null
  pace?: string | null
  vibe?: string | null
}

export type PlannerTripDaySummary = {
  id: string
  dayIndex: number
  title?: string | null
  summary: string
  hasItems: boolean
}

export type PlannerTripContext = {
  tripId?: string
  title?: string | null
  startDate?: string | null
  endDate?: string | null
  budgetLevel?: string | null
  pace?: string | null
  brief?: PlannerGroupBrief
  dayCount: number
  hasExistingDays: boolean
  hasExistingItems: boolean
  days: PlannerTripDaySummary[]
}

export type PlannerRuntimeContext = {
  mode: PlannerMode
  latestUserText: string
  visited: string[]
  bucketList: string[]
  profile?: PlannerProfileContext
  trip?: PlannerTripContext
  feedbackSummary?: {
    count: number
    signals: string[]
  }
}

export type PlannerPromptSet = Record<PlannerMode, string>

export type PlannerMessages = UIMessage[]

export type PlannerSession = {
  sessionId: string
  mode: PlannerMode
  userId: string
  tripId?: string
  latestUserText: string
  runtime: PlannerRuntimeContext
}

export type PlannerPolicyHookResult = {
  systemAppendix: string
  requiresClarification?: boolean
  preferredToolChoice?: 'required' | 'none' | { type: 'tool'; toolName: string }
}

export type PlannerWorkflowType = 'decision_memo' | 'generate_variants' | 'feedback_refresh'

export type PlannerWorkflowJob = {
  id: string
  tripId: string
  type: PlannerWorkflowType
  status: 'queued' | 'running' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  result?: unknown
  error?: string
}
