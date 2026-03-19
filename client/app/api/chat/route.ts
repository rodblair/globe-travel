import { google } from '@ai-sdk/google'
import {
  type UIMessage,
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
} from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { geocodePlace, directionsGeojson } from '@/app/api/trips/_mapbox'
import { randomSlug } from '@/app/api/trips/_utils'

const SYSTEM_PROMPTS: Record<string, string> = {
  onboarding:
    `You are a warm, enthusiastic travel companion helping someone set up their Globe Travel profile. Be concise and energetic — keep responses to 2-3 sentences max.

CRITICAL: When the user mentions ANY place they've been to, IMMEDIATELY call addVisitedPlace for EACH place. Do not wait or ask follow-up questions before calling the tool. Call the tool first, then respond.

Your flow:
1. When they mention places → call addVisitedPlace for each one right away
2. Ask what they loved about those places and where else they've been
3. After 3+ places, call setTravelPreferences based on what you've learned
4. Ask if they have any dream destinations (bucket list)
5. If they mention dream places → call addBucketListPlace

Keep it fast, fun, and interactive. Use emojis sparingly. Be genuinely excited.`,
  explore:
    `You are Globe Travel's AI travel companion. The user's visited places and bucket list are provided below. You KNOW where they've been — reference their trips when chatting.

Keep responses concise (2-4 sentences unless they ask for detail). Be warm and knowledgeable.

You can:
- Answer questions about their travel history (you have the data below)
- Suggest new destinations based on their taste
- Add places to their map using addVisitedPlace or addBucketListPlace tools
- Help plan trips with tips, itineraries, and local recommendations
- Navigate the map to show places using navigateToPlace tool

IMPORTANT: When discussing a specific city or place, ALWAYS call navigateToPlace to fly the map there. When they ask to add a place, use the appropriate tool immediately.`,
  plan:
    `You are a trip planning assistant inside Globe Travel.

CRITICAL OUTPUT RULE: The itinerary panel is the real output. Keep your text replies short (2-4 sentences) and ALWAYS update the trip itinerary using the provided trip tools.

Rules:
- Prefer tools over prose. Whenever you propose a day plan or change, reflect it by calling tools.
- For an initial itinerary or a major rewrite, prefer setFullTripPlan so the artifact fills in immediately.
- Do NOT invent coordinates. Use resolvePlace and place_query fields so the server can geocode.
- If tripId is provided in the request, you MUST edit that trip. Do not create a new trip unless explicitly asked.
- If the user references "Day 2 morning" or a specific item, do a scoped edit (update/move/delete only what’s needed).
- Ask at most ONE clarifying question if destination or number of days is missing; otherwise proceed with reasonable assumptions.

When you add items:
- Use realistic time blocks (morning/afternoon/evening) and keep activities geographically coherent.
- Mix categories: activity + meal + transit/rest as needed.

After meaningful changes to a day, call computeDayRoute for that day (mode "walk" for cities).`,
}

async function ensureTripDay(supabase: any, tripId: string, dayIndex: number) {
  const { data: existing, error } = await supabase
    .from('trip_days')
    .select('id')
    .eq('trip_id', tripId)
    .eq('day_index', dayIndex)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (existing?.id) return existing.id as string

  const { data: created, error: createErr } = await supabase
    .from('trip_days')
    .insert({ trip_id: tripId, day_index: dayIndex })
    .select('id')
    .single()
  if (createErr) throw new Error(createErr.message)
  return created.id as string
}

function tripPatch(tripId: string) {
  return JSON.stringify({ kind: 'trip_patch', tripId })
}

async function computeAndStoreDayRoute(
  supabase: any,
  tripDayId: string,
  token: string,
  mode: 'walk' | 'drive' | 'transit' = 'walk'
) {
  const { data: items, error } = await supabase
    .from('trip_items')
    .select('place:places(latitude,longitude)')
    .eq('trip_day_id', tripDayId)
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)

  const coords = (items || [])
    .map((it: any) => ({ latitude: it.place?.latitude, longitude: it.place?.longitude }))
    .filter((coord: any) => typeof coord.latitude === 'number' && typeof coord.longitude === 'number')

  const route = await directionsGeojson(coords, token, mode)
  if (!route) return

  const { error: routeErr } = await supabase
    .from('trip_routes')
    .upsert(
      {
        trip_day_id: tripDayId,
        geojson: route.geojson,
        distance_m: route.distance_m,
        duration_s: route.duration_s,
        mode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'trip_day_id,mode' }
    )

  if (routeErr) throw new Error(routeErr.message)
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, type, tripId } = await req.json() as {
      messages: UIMessage[]
      type: 'onboarding' | 'explore' | 'plan'
      tripId?: string
    }

    // Fetch user's places for context in explore/plan modes
    let placesContext = ''
    if (type === 'explore' || type === 'plan') {
      const { data: userPlaces } = await supabase
        .from('user_places')
        .select('status, place:places(name, country)')
        .eq('user_id', user.id)

      if (userPlaces && userPlaces.length > 0) {
        const visited = userPlaces
          .filter((p: any) => p.status === 'visited')
          .map((p: any) => `${p.place?.name}, ${p.place?.country}`)
        const bucketList = userPlaces
          .filter((p: any) => p.status === 'bucket_list')
          .map((p: any) => `${p.place?.name}, ${p.place?.country}`)

        placesContext = `\n\nUSER'S TRAVEL DATA:\nVisited (${visited.length}): ${visited.join('; ')}\nBucket list (${bucketList.length}): ${bucketList.join('; ')}`
      }

      // Also fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('travel_style, display_name')
        .eq('id', user.id)
        .single()

      if (profile?.travel_style) {
        placesContext += `\nTravel style: ${profile.travel_style}`
      }
      if (profile?.display_name) {
        placesContext += `\nName: ${profile.display_name}`
      }
    }

    if (type === 'plan' && tripId) {
      const { data: trip } = await supabase
        .from('trips')
        .select('title,start_date,end_date,pace,budget_level,constraints')
        .eq('id', tripId)
        .maybeSingle()

      const { data: tripDays } = await supabase
        .from('trip_days')
        .select('id,day_index,title,date,notes')
        .eq('trip_id', tripId)
        .order('day_index', { ascending: true })

      let tripContext = ''

      if (trip) {
        tripContext += `\n\nCURRENT TRIP:\nTitle: ${trip.title}`
        if (trip.start_date || trip.end_date) {
          tripContext += `\nDates: ${trip.start_date || 'unspecified'} to ${trip.end_date || 'unspecified'}`
        }
        if (trip.pace) tripContext += `\nPace: ${trip.pace}`
        if (trip.budget_level) tripContext += `\nBudget: ${trip.budget_level}`
      }

      if (tripDays && tripDays.length > 0) {
        const dayIds = tripDays.map((day) => day.id)
        const { data: dayItems } = await supabase
          .from('trip_items')
          .select('trip_day_id,title,type,start_time,place:places(name,country)')
          .in('trip_day_id', dayIds)
          .order('order_index', { ascending: true })

        const itemsByDay = new Map<string, any[]>()
        for (const item of dayItems || []) {
          if (!itemsByDay.has(item.trip_day_id)) itemsByDay.set(item.trip_day_id, [])
          itemsByDay.get(item.trip_day_id)!.push(item)
        }

        tripContext += '\n\nCURRENT ITINERARY:'
        for (const day of tripDays) {
          const items = itemsByDay.get(day.id) || []
          const summary = items.length > 0
            ? items.map((item: any) => `${item.start_time || 'unscheduled'} ${item.title} (${item.type})`).join('; ')
            : 'empty'
          tripContext += `\nDay ${day.day_index}: ${day.title || 'untitled'} -> ${summary}`
        }
      }

      placesContext += tripContext
    }

    const systemPrompt = (SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.explore) + placesContext

    // Create tools with user context for DB operations
    const userTools = {
      addVisitedPlace: tool({
        description: 'Add a place the user has visited to their travel map',
        inputSchema: z.object({
          name: z.string().describe('Name of the place or city'),
          country: z.string().describe('Country name'),
          country_code: z.string().describe('ISO 2-letter country code'),
          latitude: z.number().describe('Latitude coordinate'),
          longitude: z.number().describe('Longitude coordinate'),
          rating: z.number().min(1).max(5).optional().describe('User rating 1-5'),
        }),
        execute: async ({ name, country, country_code, latitude, longitude, rating }) => {
          let placeId: string
          const { data: existing } = await supabase.from('places').select('id').eq('name', name).eq('country', country).maybeSingle()
          if (existing) {
            placeId = existing.id
          } else {
            const { data: newPlace, error } = await supabase.from('places').insert({ name, country, country_code, latitude, longitude }).select('id').single()
            if (error) return `Failed to add place: ${error.message}`
            placeId = newPlace.id
          }
          await supabase.from('user_places').upsert({ user_id: user.id, place_id: placeId, status: 'visited', rating: rating || null }, { onConflict: 'user_id,place_id' })
          return JSON.stringify({ success: true, name, country, latitude, longitude, status: 'visited' })
        },
      }),
      addBucketListPlace: tool({
        description: 'Add a place to the user bucket list',
        inputSchema: z.object({
          name: z.string().describe('Name of the place or city'),
          country: z.string().describe('Country name'),
          country_code: z.string().describe('ISO 2-letter country code'),
          latitude: z.number().describe('Latitude coordinate'),
          longitude: z.number().describe('Longitude coordinate'),
          reason: z.string().optional().describe('Why the user wants to visit'),
        }),
        execute: async ({ name, country, country_code, latitude, longitude, reason }) => {
          let placeId: string
          const { data: existing } = await supabase.from('places').select('id').eq('name', name).eq('country', country).maybeSingle()
          if (existing) {
            placeId = existing.id
          } else {
            const { data: newPlace, error } = await supabase.from('places').insert({ name, country, country_code, latitude, longitude }).select('id').single()
            if (error) return `Failed to add place: ${error.message}`
            placeId = newPlace.id
          }
          await supabase.from('user_places').upsert({ user_id: user.id, place_id: placeId, status: 'bucket_list', notes: reason || null }, { onConflict: 'user_id,place_id' })
          return JSON.stringify({ success: true, name, country, latitude, longitude, status: 'bucket_list' })
        },
      }),
      navigateToPlace: tool({
        description: 'Navigate/fly the map to show a specific place. Use this when the user asks to see, show, or go to a place, or when you are describing a specific location.',
        inputSchema: z.object({
          name: z.string().describe('Name of the place or city'),
          country: z.string().describe('Country name'),
          latitude: z.number().describe('Latitude coordinate'),
          longitude: z.number().describe('Longitude coordinate'),
          description: z.string().describe('A 2-3 sentence vivid description of this place - what makes it special, what a traveler should know'),
          highlights: z.array(z.string()).describe('3-4 top highlights or things to do, each 3-6 words'),
          best_time: z.string().optional().describe('Best time to visit, e.g. "March to May"'),
        }),
        execute: async ({ name, country, latitude, longitude, description, highlights, best_time }) => {
          return JSON.stringify({ kind: 'navigate', success: true, action: 'navigate', name, country, latitude, longitude, description, highlights, best_time })
        },
      }),
      setTravelPreferences: tool({
        description: 'Set the user travel style and preferences',
        inputSchema: z.object({
          style: z.string().describe('Travel style: adventure, luxury, budget, family, backpacker, etc.'),
          interests: z.array(z.string()).describe('List of travel interests'),
          budget_preference: z.string().describe('Budget preference: budget, moderate, luxury'),
        }),
        execute: async ({ style, interests, budget_preference }) => {
          await supabase.from('profiles').update({ travel_style: `${style} | ${interests.join(', ')} | ${budget_preference}` }).eq('id', user.id)
          return `Successfully set travel preferences: ${style}`
        },
      }),

      // ----------------------------
      // Trip planning tools (type: "plan")
      // ----------------------------
      resolvePlace: tool({
        description: 'Resolve a place query into a canonical place record. Always use this if you need a specific location.',
        inputSchema: z.object({
          query: z.string().describe('Place query like "Shinjuku, Tokyo" or "Senso-ji Temple"'),
        }),
        execute: async ({ query }) => {
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })
          const result = await geocodePlace(query, token)
          if (!result) return JSON.stringify({ kind: 'resolve_place', ok: false, query })

          const { data: place, error } = await supabase
            .from('places')
            .upsert(
              {
                name: result.name,
                country: result.country,
                country_code: result.country_code || null,
                latitude: result.latitude,
                longitude: result.longitude,
                mapbox_place_id: result.mapbox_place_id,
              },
              { onConflict: 'mapbox_place_id' }
            )
            .select('id,name,country,latitude,longitude')
            .single()
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          return JSON.stringify({ kind: 'resolve_place', ok: true, place })
        },
      }),

      createTrip: tool({
        description: 'Create a new trip (only if the user explicitly asks).',
        inputSchema: z.object({
          title: z.string(),
          days: z.number().int().min(1).max(30).optional(),
        }),
        execute: async ({ title, days }) => {
          const slug = randomSlug()
          const { data: created, error } = await supabase
            .from('trips')
            .insert({ user_id: user.id, title, share_slug: slug, constraints: {} })
            .select('id')
            .single()
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          const count = days || 4
          const dayRows = Array.from({ length: count }, (_, i) => ({ trip_id: created.id, day_index: i + 1 }))
          await supabase.from('trip_days').insert(dayRows)

          return JSON.stringify({ kind: 'trip_created', tripId: created.id })
        },
      }),

      setTripDays: tool({
        description: 'Set trip day metadata (titles/dates).',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          days: z.array(z.object({
            day_index: z.number().int().min(1),
            title: z.string().optional(),
            date: z.string().optional(),
            notes: z.string().optional(),
          })),
        }),
        execute: async ({ trip_id, days }) => {
          const tid = trip_id || tripId
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          for (const d of days) {
            const dayId = await ensureTripDay(supabase, tid, d.day_index)
            await supabase
              .from('trip_days')
              .update({
                title: d.title ?? null,
                date: d.date ?? null,
                notes: d.notes ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', dayId)
          }
          return tripPatch(tid)
        },
      }),

      addTripItem: tool({
        description: 'Add an itinerary item to a specific day.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          day_index: z.number().int().min(1),
          type: z.enum(['activity', 'meal', 'lodging', 'transit', 'note']),
          title: z.string(),
          place_query: z.string().optional().describe('Optional place query to geocode and attach'),
          start_time: z.string().optional().describe('HH:MM'),
          end_time: z.string().optional().describe('HH:MM'),
          duration_minutes: z.number().int().min(0).max(1440).optional(),
          notes: z.string().optional(),
        }),
        execute: async ({ trip_id, day_index, type, title, place_query, start_time, end_time, duration_minutes, notes }) => {
          const tid = trip_id || tripId
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const dayId = await ensureTripDay(supabase, tid, day_index)

          let placeId: string | null = null
          if (place_query) {
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
            if (token) {
              const result = await geocodePlace(place_query, token)
              if (result) {
                const { data: place } = await supabase
                  .from('places')
                  .upsert(
                    {
                      name: result.name,
                      country: result.country,
                      country_code: result.country_code || null,
                      latitude: result.latitude,
                      longitude: result.longitude,
                      mapbox_place_id: result.mapbox_place_id,
                    },
                    { onConflict: 'mapbox_place_id' }
                  )
                  .select('id')
                  .single()
                if (place?.id) placeId = place.id
              }
            }
          }

          const { data: existing, error: maxErr } = await supabase
            .from('trip_items')
            .select('order_index')
            .eq('trip_day_id', dayId)
            .order('order_index', { ascending: false })
            .limit(1)
          if (maxErr) return JSON.stringify({ kind: 'error', message: maxErr.message })

          const nextOrder = existing && existing[0]?.order_index != null ? (existing[0].order_index as number) + 1 : 0

          const { error } = await supabase
            .from('trip_items')
            .insert({
              trip_day_id: dayId,
              type,
              title,
              place_id: placeId,
              start_time: start_time ?? null,
              end_time: end_time ?? null,
              duration_minutes: duration_minutes ?? null,
              notes: notes ?? null,
              order_index: nextOrder,
            })
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          return tripPatch(tid)
        },
      }),

      setFullTripPlan: tool({
        description: 'Create or replace a full multi-day itinerary in one call. Use this for the initial trip plan or full-day rewrites.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          title: z.string().optional(),
          start_date: z.string().optional(),
          end_date: z.string().optional(),
          pace: z.enum(['relaxed', 'balanced', 'packed']).optional(),
          budget_level: z.enum(['budget', 'mid', 'luxury']).optional(),
          clear_existing: z.boolean().default(true),
          days: z.array(z.object({
            day_index: z.number().int().min(1),
            title: z.string().optional(),
            date: z.string().optional(),
            notes: z.string().optional(),
            items: z.array(z.object({
              type: z.enum(['activity', 'meal', 'lodging', 'transit', 'note']),
              title: z.string(),
              place_query: z.string().optional(),
              start_time: z.string().optional(),
              end_time: z.string().optional(),
              duration_minutes: z.number().int().min(0).max(1440).optional(),
              notes: z.string().optional(),
            })).default([]),
          })).min(1),
        }),
        execute: async ({ trip_id, title, start_date, end_date, pace, budget_level, clear_existing, days }) => {
          const tid = trip_id || tripId
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })

          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })

          if (title || start_date || end_date || pace || budget_level) {
            const { error: tripErr } = await supabase
              .from('trips')
              .update({
                ...(title ? { title } : {}),
                ...(start_date ? { start_date } : {}),
                ...(end_date ? { end_date } : {}),
                ...(pace ? { pace } : {}),
                ...(budget_level ? { budget_level } : {}),
                updated_at: new Date().toISOString(),
              })
              .eq('id', tid)
            if (tripErr) return JSON.stringify({ kind: 'error', message: tripErr.message })
          }

          for (const day of days) {
            const tripDayId = await ensureTripDay(supabase, tid, day.day_index)

            const { error: dayErr } = await supabase
              .from('trip_days')
              .update({
                title: day.title ?? null,
                date: day.date ?? null,
                notes: day.notes ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', tripDayId)
            if (dayErr) return JSON.stringify({ kind: 'error', message: dayErr.message })

            if (clear_existing) {
              await supabase.from('trip_items').delete().eq('trip_day_id', tripDayId)
              await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId)
            }

            for (let index = 0; index < day.items.length; index++) {
              const item = day.items[index]
              let placeId: string | null = null

              if (item.place_query) {
                const result = await geocodePlace(item.place_query, token)
                if (result) {
                  const { data: place, error: placeErr } = await supabase
                    .from('places')
                    .upsert(
                      {
                        name: result.name,
                        country: result.country,
                        country_code: result.country_code || null,
                        latitude: result.latitude,
                        longitude: result.longitude,
                        mapbox_place_id: result.mapbox_place_id,
                      },
                      { onConflict: 'mapbox_place_id' }
                    )
                    .select('id')
                    .single()
                  if (placeErr) return JSON.stringify({ kind: 'error', message: placeErr.message })
                  placeId = place?.id || null
                }
              }

              const { error: itemErr } = await supabase
                .from('trip_items')
                .insert({
                  trip_day_id: tripDayId,
                  type: item.type,
                  title: item.title,
                  place_id: placeId,
                  start_time: item.start_time ?? null,
                  end_time: item.end_time ?? null,
                  duration_minutes: item.duration_minutes ?? null,
                  notes: item.notes ?? null,
                  order_index: index,
                })
              if (itemErr) return JSON.stringify({ kind: 'error', message: itemErr.message })
            }

            await computeAndStoreDayRoute(supabase, tripDayId, token, 'walk')
          }

          return tripPatch(tid)
        },
      }),

      moveTripItem: tool({
        description: 'Move an item to another day (or reorder within a day).',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          item_id: z.string().uuid(),
          to_day_index: z.number().int().min(1),
          to_order_index: z.number().int().min(0).optional(),
        }),
        execute: async ({ trip_id, item_id, to_day_index, to_order_index }) => {
          const tid = trip_id || tripId
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const toDayId = await ensureTripDay(supabase, tid, to_day_index)
          const orderIndex = to_order_index ?? 0
          await supabase.from('trip_items').update({ trip_day_id: toDayId, updated_at: new Date().toISOString() }).eq('id', item_id)
          await supabase.from('trip_items').update({ order_index: orderIndex, updated_at: new Date().toISOString() }).eq('id', item_id)
          return tripPatch(tid)
        },
      }),

      updateTripItem: tool({
        description: 'Update fields on an existing itinerary item.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          item_id: z.string().uuid(),
          title: z.string().optional(),
          notes: z.string().optional(),
          start_time: z.string().optional(),
          end_time: z.string().optional(),
          duration_minutes: z.number().int().min(0).max(1440).optional(),
          type: z.enum(['activity', 'meal', 'lodging', 'transit', 'note']).optional(),
        }),
        execute: async ({ trip_id, item_id, ...fields }) => {
          const tid = trip_id || tripId
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const { error } = await supabase
            .from('trip_items')
            .update({ ...fields, updated_at: new Date().toISOString() })
            .eq('id', item_id)
          if (error) return JSON.stringify({ kind: 'error', message: error.message })
          return tripPatch(tid)
        },
      }),

      deleteTripItem: tool({
        description: 'Delete an itinerary item.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          item_id: z.string().uuid(),
        }),
        execute: async ({ trip_id, item_id }) => {
          const tid = trip_id || tripId
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const { error } = await supabase.from('trip_items').delete().eq('id', item_id)
          if (error) return JSON.stringify({ kind: 'error', message: error.message })
          return tripPatch(tid)
        },
      }),

      computeDayRoute: tool({
        description: 'Compute and cache a route line for a day based on current item order.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          day_index: z.number().int().min(1),
          mode: z.enum(['walk', 'drive', 'transit']).default('walk'),
        }),
        execute: async ({ trip_id, day_index, mode }) => {
          const tid = trip_id || tripId
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })
          const dayId = await ensureTripDay(supabase, tid, day_index)

          const { data: items, error } = await supabase
            .from('trip_items')
            .select('place:places(latitude,longitude)')
            .eq('trip_day_id', dayId)
            .order('order_index', { ascending: true })
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          const coords = (items || [])
            .map((it: any) => ({ latitude: it.place?.latitude, longitude: it.place?.longitude }))
            .filter((c: any) => typeof c.latitude === 'number' && typeof c.longitude === 'number')

          const route = await directionsGeojson(coords, token, mode)
          if (!route) return tripPatch(tid)

          const { error: routeErr } = await supabase
            .from('trip_routes')
            .upsert(
              {
                trip_day_id: dayId,
                geojson: route.geojson,
                distance_m: route.distance_m,
                duration_s: route.duration_s,
                mode,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'trip_day_id,mode' }
            )
          if (routeErr) return JSON.stringify({ kind: 'error', message: routeErr.message })
          return tripPatch(tid)
        },
      }),
    }

    const result = streamText({
      model: google('gemini-3.1-flash-lite-preview'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(12),
      tools: userTools,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
