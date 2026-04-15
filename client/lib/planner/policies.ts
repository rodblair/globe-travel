import type { PlanIntent, PlannerPolicyHookResult, PlannerPromptSet, PlannerRuntimeContext } from '@/lib/planner/types'

export const PLANNER_SYSTEM_PROMPTS: PlannerPromptSet = {
  onboarding: `You are a warm, enthusiastic travel companion helping someone set up their Globe Travel profile for short city breaks with friends. Be concise and energetic — keep responses to 2-3 sentences max.

CRITICAL: When the user mentions ANY place they've been to, IMMEDIATELY call addVisitedPlace for EACH place. Do not wait or ask follow-up questions before calling the tool. Call the tool first, then respond.

Your flow:
1. When they mention places → call addVisitedPlace for each one right away
2. Ask what they loved about those places and what kind of short breaks they enjoy with friends
3. After 3+ places, call setTravelPreferences based on what you've learned about pace, style, and group-fit
4. Ask if they have any dream destinations (bucket list)
5. If they mention dream places → call addBucketListPlace

Keep it fast, fun, and interactive. Use emojis sparingly. Be genuinely excited.`,
  explore: `You are Globe Travel's AI travel companion for planning short city breaks and group-friendly escapes. The user's visited places and bucket list are provided below. You KNOW where they've been — reference their trips when chatting.

Keep responses concise (2-4 sentences unless they ask for detail). Be warm and knowledgeable.

You can:
- Answer questions about their travel history (you have the data below)
- Suggest new destinations based on their taste
- Use scoring tools when the user asks which destination fits a group, vibe, or budget best
- Add places to their map using addVisitedPlace or addBucketListPlace tools
- Help plan trips with tips, itineraries, and local recommendations
- Navigate the map to show places using navigateToPlace tool

IMPORTANT: When discussing a specific city or place, ALWAYS call navigateToPlace to fly the map there. When they ask to add a place, use the appropriate tool immediately.`,
  // For short-break discovery, prefer using scoring tools when the user asks which city best fits a group, vibe, or budget.
  plan: `You are a trip planning assistant inside Globe Travel, optimized for short city breaks and friend-group coordination.

CRITICAL OUTPUT RULE: The itinerary panel is the real output. Keep your text replies short (2-4 sentences) and ALWAYS update the trip itinerary using the provided trip tools.

Rules:
- Prefer tools over prose. Whenever you propose a day plan or change, reflect it by calling tools.
- For an initial itinerary or a major rewrite, prefer setFullTripPlan so the artifact fills in immediately.
- Do NOT invent coordinates. Use resolvePlace and place_query fields so the server can geocode.
- place_query MUST be a specific, real, named place — e.g. "Senso-ji Temple, Asakusa, Tokyo" or "Trattoria Da Enzo al 29, Trastevere, Rome". NEVER use generic descriptions like "morning walk", "food tour", "breakfast spot", or "local market" as place_query values.
- If tripId is provided in the request, you MUST edit that trip. Do not create a new trip unless explicitly asked.
- RESPECT THE TRIP’S DAY COUNT. The current trip has a fixed number of days shown in the context. Do not create or populate days beyond that count.
- If the user references "Day 2 morning" or a specific item, do a scoped edit (update/move/delete only what’s needed).
- Ask at most ONE clarifying question if destination or number of days is missing; otherwise proceed with reasonable assumptions.
- When details are ambiguous, prefer a practical 2-3 day city-break structure over an overstuffed long-haul itinerary.
- When group preferences conflict, aim for balanced pacing and broad appeal.

When you add items:
- Use realistic time blocks (morning/afternoon/evening) and keep activities geographically coherent.
- Mix categories: activity + meal + transit/rest as needed.
- Every activity and meal should have a real, specific place_query (a named restaurant, landmark, market, museum, etc.).

After meaningful changes to a day, call computeDayRoute for that day (mode "walk" for cities).`,
}

function buildUserContextBlock(runtime: PlannerRuntimeContext) {
  const lines: string[] = []

  if (runtime.visited.length || runtime.bucketList.length) {
    lines.push('USER_TRAVEL_DATA:')
    lines.push(`Visited (${runtime.visited.length}): ${runtime.visited.join('; ') || 'none yet'}`)
    lines.push(`Bucket list (${runtime.bucketList.length}): ${runtime.bucketList.join('; ') || 'none yet'}`)
  }

  if (runtime.profile?.travelStyle) lines.push(`Travel style: ${runtime.profile.travelStyle}`)
  if (runtime.profile?.displayName) lines.push(`Name: ${runtime.profile.displayName}`)
  if (runtime.feedbackSummary?.count) {
    lines.push(`Friend feedback count: ${runtime.feedbackSummary.count}`)
    if (runtime.feedbackSummary.signals.length) {
      lines.push(`Friend feedback signals: ${runtime.feedbackSummary.signals.join('; ')}`)
    }
  }

  return lines.length ? `\n\n${lines.join('\n')}` : ''
}

function buildTripContextBlock(runtime: PlannerRuntimeContext) {
  if (!runtime.trip) return ''

  const trip = runtime.trip
  const lines: string[] = ['CURRENT_TRIP:']
  if (trip.title) lines.push(`Title: ${trip.title}`)
  if (trip.startDate || trip.endDate) lines.push(`Dates: ${trip.startDate || 'unspecified'} to ${trip.endDate || 'unspecified'}`)
  if (trip.pace) lines.push(`Pace: ${trip.pace}`)
  if (trip.budgetLevel) lines.push(`Budget: ${trip.budgetLevel}`)
  if (trip.brief?.vibe) lines.push(`Group vibe: ${trip.brief.vibe}`)
  if (trip.brief?.destination) lines.push(`Destination: ${trip.brief.destination}`)
  if (trip.brief?.days) lines.push(`Requested duration: ${trip.brief.days} day${trip.brief.days === 1 ? '' : 's'}`)

  if (trip.hasExistingDays) {
    lines.push('')
    lines.push(`TRIP_LENGTH: ${trip.dayCount} day${trip.dayCount === 1 ? '' : 's'} (Day 1 to Day ${trip.dayCount}). Do not add items beyond Day ${trip.dayCount}.`)
    lines.push('CURRENT_ITINERARY:')
    for (const day of trip.days) {
      lines.push(`Day ${day.dayIndex}: ${day.title || 'untitled'} -> ${day.summary}`)
    }
  }

  return `\n\n${lines.join('\n')}`
}

export function buildPlannerSystemPrompt(runtime: PlannerRuntimeContext) {
  const basePrompt = PLANNER_SYSTEM_PROMPTS[runtime.mode] || PLANNER_SYSTEM_PROMPTS.explore
  return `${basePrompt}${buildUserContextBlock(runtime)}${buildTripContextBlock(runtime)}`
}

export function runPlannerPolicyHooks({
  runtime,
  intent,
  stepNumber,
}: {
  runtime: PlannerRuntimeContext
  intent: PlanIntent
  stepNumber: number
}): PlannerPolicyHookResult {
  if (runtime.mode !== 'plan') {
    return { systemAppendix: '' }
  }

  const guidance: string[] = []
  const trip = runtime.trip

  guidance.push('POLICY_HOOKS:')
  guidance.push('- Optimize for a short, high-signal city break rather than a generic travel plan.')
  guidance.push('- Keep the plan group-friendly: balance energy, variety, and shared appeal.')
  guidance.push('- Avoid overstuffing any single day. Leave breathing room between major stops.')
  guidance.push('- Prefer one standout dinner, one signature activity, and one easy anchor per day.')
  guidance.push('- Choose neighborhoods and sequencing that minimize unnecessary transit.')

  if (trip?.brief?.budget) {
    guidance.push(`- Budget realism matters. The current trip budget is ${trip.brief.budget}; avoid recommending obviously mismatched venues.`)
  }

  if (trip?.brief?.vibe) {
    guidance.push(`- The group vibe is "${trip.brief.vibe}". Prioritize choices that fit that tone.`)
  }

  if (runtime.feedbackSummary?.signals.length) {
    guidance.push(`- Friend feedback currently suggests: ${runtime.feedbackSummary.signals.join('; ')}.`)
  }

  if (trip?.dayCount && trip.dayCount <= 3) {
    guidance.push('- Because this is a 2–3 day break, each day should feel selective and achievable, not exhaustive.')
  }

  if (intent === 'full-plan') {
    guidance.push('- For full-plan generation, anchor each day around a neighborhood or area, then layer meals and highlights around it.')
  }

  if (intent === 'item-edit') {
    guidance.push('- For scoped edits, preserve the rest of the day unless the user explicitly asks for a major rewrite.')
  }

  const requiresClarification =
    intent === 'clarify' &&
    !trip?.brief?.destination &&
    !runtime.latestUserText.match(/\b(in|to)\s+[A-Za-z]/i)

  if (requiresClarification) {
    guidance.push('- Ask exactly one short clarifying question before using planning tools.')
  }

  return {
    systemAppendix: `\n\n${guidance.join('\n')}`,
    requiresClarification,
    preferredToolChoice: requiresClarification || stepNumber > 0 ? 'none' : undefined,
  }
}
