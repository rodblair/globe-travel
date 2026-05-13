import { openai } from '@ai-sdk/openai'
import {
  type UIMessage,
  convertToModelMessages,
  streamText,
  tool,
  stepCountIs,
} from 'ai'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import { createGuestUser, devUser, getGuestIdFromCookieHeader, isDevAuthBypassEnabled } from '@/lib/dev-auth'
import { ensureDevAccount, ensureGuestAccount } from '@/lib/guest-server'
import { geocodePlace, directionsGeojson } from '@/app/api/trips/_mapbox'
import { randomSlug } from '@/app/api/trips/_utils'
import { buildPlannerSystemPrompt, runPlannerPolicyHooks } from '@/lib/planner/policies'
import { getPlanToolChoice, getPlanToolSelection, inferPlanIntent } from '@/lib/planner/tools'
import { extractDestinationFromTitle } from '@/lib/planner/runtime'
import { loadPlannerSession } from '@/lib/planner/session'
import { compareDestinations, listScoredDestinations } from '@/lib/planner/scoring'

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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function resolvePlannerPlace({
  db,
  token,
  placeQuery,
  destinationLabel,
  destinationAnchor,
}: {
  db: any
  token: string
  placeQuery?: string
  destinationLabel?: string | null
  destinationAnchor?: { latitude: number; longitude: number } | null
}) {
  if (!placeQuery) return null

  const queryCandidates = Array.from(
    new Set(
      [
        destinationLabel &&
        !placeQuery.toLowerCase().includes(destinationLabel.toLowerCase())
          ? `${placeQuery}, ${destinationLabel}`
          : '',
        placeQuery,
      ].filter(Boolean)
    )
  )

  for (const query of queryCandidates) {
    const result = await geocodePlace(query, token)
    if (!result) continue

    const tooFar = destinationAnchor != null &&
      haversineKm(result.latitude, result.longitude, destinationAnchor.latitude, destinationAnchor.longitude) > 120

    if (tooFar) continue

    const { data: place, error } = await db
      .from('places')
      .upsert(
        {
          name: result.name,
          country: result.country,
          country_code: result.country_code || null,
          latitude: result.latitude,
          longitude: result.longitude,
          mapbox_id: result.mapbox_place_id,
        },
        { onConflict: 'mapbox_id' }
      )
      .select('id,name')
      .single()

    if (!error && place?.id) return place as { id: string; name: string }
    if (error) console.error('[resolvePlannerPlace] places upsert error (continuing without place)', error.message)
  }

  return null
}

function shouldUseResolvedPlaceTitle(type: string, title: string, placeName?: string | null) {
  if (type !== 'meal' || !placeName) return false
  if (title.toLowerCase().includes(placeName.toLowerCase())) return false

  return /\b(breakfast|brunch|lunch|dinner|drinks?|coffee|cafe|café|meal|food|seafood|rooftop|taverna|restaurant|bar)\b/i.test(title)
}

function normalizeTripItemType(type?: string | null) {
  if (type === 'transit') return 'transport'
  if (type === 'note') return 'activity'
  return type || 'activity'
}


async function computeAndStoreDayRoute(
  supabase: any,
  tripDayId: string,
  token: string,
  mode: 'walk' | 'drive' | 'transit' = 'walk'
) {
  try {
    const { data: items, error } = await supabase
      .from('trip_items')
      .select('place:places(latitude,longitude)')
      .eq('trip_day_id', tripDayId)
      .order('order_index', { ascending: true })

    if (error) return

    const coords = (items || [])
      .map((it: any) => ({ latitude: it.place?.latitude, longitude: it.place?.longitude }))
      .filter((coord: any) => typeof coord.latitude === 'number' && typeof coord.longitude === 'number')

    if (coords.length < 2) {
      await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId).eq('mode', mode)
      return
    }

    const route = await directionsGeojson(coords, token, mode)
    if (!route) return

    await supabase
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
  } catch {
    // Route computation is non-critical — items are already saved, silently skip
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const guestId = getGuestIdFromCookieHeader(req.headers.get('cookie'))
    // Service client bypasses RLS — used for all DB operations so inserts aren't blocked by policy subqueries
    const db = await createServiceClient()
    if (guestId && !authUser) {
      await ensureGuestAccount(guestId, db)
    } else if (!authUser && isDevAuthBypassEnabled) {
      await ensureDevAccount(db)
    }
    const user = authUser || (guestId ? createGuestUser(guestId) : null) || (isDevAuthBypassEnabled ? devUser : null)

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, type, tripId, conversationId } = await req.json() as {
      messages: UIMessage[]
      type: 'onboarding' | 'explore' | 'plan'
      tripId?: string
      conversationId?: string
    }
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    const plannerSession = await loadPlannerSession({
      db,
      userId: user.id,
      messages,
      mode: type,
      tripId,
      conversationId,
    })
    const latestUserText = plannerSession.latestUserText
    const hasExistingDays = Boolean(plannerSession.runtime.trip?.hasExistingDays)
    const hasExistingItems = Boolean(plannerSession.runtime.trip?.hasExistingItems)
    const systemPrompt = buildPlannerSystemPrompt(plannerSession.runtime)

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
          const { data: existing } = await db.from('places').select('id').eq('name', name).eq('country', country).maybeSingle()
          if (existing) {
            placeId = existing.id
          } else {
            const { data: newPlace, error } = await db.from('places').insert({ name, country, country_code, latitude, longitude }).select('id').single()
            if (error) return `Failed to add place: ${error.message}`
            placeId = newPlace.id
          }
          await db.from('user_places').upsert({ user_id: user.id, place_id: placeId, status: 'visited', rating: rating || null }, { onConflict: 'user_id,place_id' })
          return JSON.stringify({ success: true, name, country, latitude, longitude, status: 'visited' })
        },
      }),
      addBucketListPlace: tool({
        description: 'Save a destination idea for a future group trip',
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
          const { data: existing } = await db.from('places').select('id').eq('name', name).eq('country', country).maybeSingle()
          if (existing) {
            placeId = existing.id
          } else {
            const { data: newPlace, error } = await db.from('places').insert({ name, country, country_code, latitude, longitude }).select('id').single()
            if (error) return `Failed to add place: ${error.message}`
            placeId = newPlace.id
          }
          await db.from('user_places').upsert({ user_id: user.id, place_id: placeId, status: 'bucket_list', notes: reason || null }, { onConflict: 'user_id,place_id' })
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
          await db.from('profiles').update({ travel_style: `${style} | ${interests.join(', ')} | ${budget_preference}` }).eq('id', user.id)
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
          const token = mapboxToken
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })
          const result = await geocodePlace(query, token)
          if (!result) return JSON.stringify({ kind: 'resolve_place', ok: false, query })

          const { data: place, error } = await db
            .from('places')
            .upsert(
              {
                name: result.name,
                country: result.country,
                country_code: result.country_code || null,
                latitude: result.latitude,
                longitude: result.longitude,
                mapbox_id: result.mapbox_place_id,
              },
              { onConflict: 'mapbox_id' }
            )
            .select('id,name,country,latitude,longitude')
            .single()
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          return JSON.stringify({ kind: 'resolve_place', ok: true, place })
        },
      }),
      scoreDestinations: tool({
        description: 'Rank city-break destinations for a friend group using vibe, budget, and group-size heuristics.',
        inputSchema: z.object({
          group_size: z.number().int().min(1).max(20).optional(),
          budget: z.string().optional(),
          vibe: z.string().optional(),
          limit: z.number().int().min(1).max(8).default(5),
        }),
        execute: async ({ group_size, budget, vibe, limit }) => {
          const ranked = listScoredDestinations({
            groupSize: group_size,
            budget: budget || plannerSession.runtime.trip?.brief?.budget || null,
            vibe: vibe || plannerSession.runtime.trip?.brief?.vibe || null,
            limit,
          })
          return JSON.stringify({ kind: 'destination_scores', ranked })
        },
      }),
      compareDestinationOptions: tool({
        description: 'Compare a shortlist of cities for a group city break and return ranked strengths/cautions.',
        inputSchema: z.object({
          cities: z.array(z.string()).min(2).max(5),
          group_size: z.number().int().min(1).max(20).optional(),
          budget: z.string().optional(),
          vibe: z.string().optional(),
        }),
        execute: async ({ cities, group_size, budget, vibe }) => {
          const comparison = compareDestinations({
            cities,
            groupSize: group_size,
            budget: budget || plannerSession.runtime.trip?.brief?.budget || null,
            vibe: vibe || plannerSession.runtime.trip?.brief?.vibe || null,
          })
          return JSON.stringify({ kind: 'destination_comparison', comparison })
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
          const { data: created, error } = await db
            .from('trips')
            .insert({ user_id: user.id, title, share_slug: slug, constraints: {} })
            .select('id')
            .single()
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          const count = days || 4
          const dayRows = Array.from({ length: count }, (_, i) => ({ trip_id: created.id, day_index: i + 1 }))
          await db.from('trip_days').insert(dayRows)

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
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          for (const d of days) {
            const dayId = await ensureTripDay(db, tid, d.day_index)
            await db
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
          type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']),
          title: z.string(),
          place_query: z.string().optional().describe('Optional place query to geocode and attach'),
          start_time: z.string().optional().describe('HH:MM'),
          end_time: z.string().optional().describe('HH:MM'),
          duration_minutes: z.number().int().min(0).max(1440).optional(),
          notes: z.string().optional(),
        }),
        execute: async ({ trip_id, day_index, type, title, place_query, start_time, end_time, duration_minutes, notes }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const dayId = await ensureTripDay(db, tid, day_index)
          const token = mapboxToken

          const { data: trip } = await db.from('trips').select('title').eq('id', tid).maybeSingle()
          const destinationLabel = extractDestinationFromTitle(trip?.title)
          const destinationAnchor = token && destinationLabel ? await geocodePlace(destinationLabel, token) : null
          const place = token
            ? await resolvePlannerPlace({ db, token, placeQuery: place_query, destinationLabel, destinationAnchor })
            : null
          const normalizedType = normalizeTripItemType(type)
          const itemTitle = shouldUseResolvedPlaceTitle(normalizedType, title, place?.name) ? place!.name : title

          const { data: existing, error: maxErr } = await db
            .from('trip_items')
            .select('order_index')
            .eq('trip_day_id', dayId)
            .order('order_index', { ascending: false })
            .limit(1)
          if (maxErr) return JSON.stringify({ kind: 'error', message: maxErr.message })

          const nextOrder = existing && existing[0]?.order_index != null ? (existing[0].order_index as number) + 1 : 0

          const { error } = await db
            .from('trip_items')
            .insert({
              trip_day_id: dayId,
              type: normalizedType,
              title: itemTitle,
              place_id: place?.id || null,
              start_time: start_time ?? null,
              end_time: end_time ?? null,
              duration_minutes: duration_minutes ?? null,
              notes: notes ?? null,
              order_index: nextOrder,
            })
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          if (token) {
            await computeAndStoreDayRoute(db, dayId, token, 'walk')
          }

          return tripPatch(tid)
        },
      }),

      setFullTripPlan: tool({
        description: 'Create or replace a full multi-day itinerary in one call. Use this for the initial trip plan or full-day rewrites. Include place_query for any activity or meal that should appear on the day map.',
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
              type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']),
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
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })

          const token = mapboxToken
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })

          // Fetch current trip title for destination sanity-checking
          const { data: existingTrip } = await db.from('trips').select('title').eq('id', tid).maybeSingle()
          const destinationLabel = extractDestinationFromTitle(title || existingTrip?.title)
          const destinationAnchor = destinationLabel ? await geocodePlace(destinationLabel, token) : null

          if (title || start_date || end_date || pace || budget_level) {
            const { error: tripErr } = await db
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
            const tripDayId = await ensureTripDay(db, tid, day.day_index)
            const { count: existingItemCount } = await db
              .from('trip_items')
              .select('id', { count: 'exact', head: true })
              .eq('trip_day_id', tripDayId)

            const { error: dayErr } = await db
              .from('trip_days')
              .update({
                title: day.title ?? null,
                date: day.date ?? null,
                notes: day.notes ?? null,
              })
              .eq('id', tripDayId)
            if (dayErr) return JSON.stringify({ kind: 'error', message: dayErr.message })

            if (day.items.length === 0 && (existingItemCount || 0) > 0) {
              console.warn('[setFullTripPlan] skipped clearing populated day with empty items payload', JSON.stringify({ tripId: tid, day_index: day.day_index }))
              continue
            }

            if (clear_existing) {
              await db.from('trip_items').delete().eq('trip_day_id', tripDayId)
              await db.from('trip_routes').delete().eq('trip_day_id', tripDayId)
            }

            console.log('[setFullTripPlan] day', day.day_index, 'items count:', day.items.length)
            for (let index = 0; index < day.items.length; index++) {
              const item = day.items[index]
              const place = await resolvePlannerPlace({
                db,
                token,
                placeQuery: item.place_query,
                destinationLabel,
                destinationAnchor,
              })
              const normalizedType = normalizeTripItemType(item.type)
              const itemTitle = shouldUseResolvedPlaceTitle(normalizedType, item.title, place?.name) ? place!.name : item.title

              const { error: itemErr } = await db
                .from('trip_items')
                .insert({
                  trip_day_id: tripDayId,
                  type: normalizedType,
                  title: itemTitle,
                  place_id: place?.id || null,
                  start_time: item.start_time ?? null,
                  end_time: item.end_time ?? null,
                  duration_minutes: item.duration_minutes ?? null,
                  notes: item.notes ?? null,
                  order_index: index,
                })
              if (itemErr) {
                console.error('[setFullTripPlan] item insert error:', itemErr.message, JSON.stringify({ trip_day_id: tripDayId, type: item.type, title: item.title }))
                return JSON.stringify({ kind: 'error', message: itemErr.message })
              }
            }

            // Route computation is non-critical — wrapped in computeAndStoreDayRoute try-catch
            await computeAndStoreDayRoute(db, tripDayId, token, 'walk')
          }

          return tripPatch(tid)
        },
      }),

      replaceTripDayPlan: tool({
        description: 'Replace the itinerary for one existing day only. Use this when the user asks to change, rewrite, regenerate, rebuild, or improve a named day such as "change Day 1". This clears only that day, inserts the revised items, recomputes that day route, and leaves all other days untouched.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          day_index: z.number().int().min(1),
          title: z.string().optional(),
          date: z.string().optional(),
          notes: z.string().optional(),
          items: z.array(z.object({
            type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']),
            title: z.string(),
            place_query: z.string().optional(),
            start_time: z.string().optional(),
            end_time: z.string().optional(),
            duration_minutes: z.number().int().min(0).max(1440).optional(),
            notes: z.string().optional(),
          })).min(1),
        }),
        execute: async ({ trip_id, day_index, title, date, notes, items }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })

          const token = mapboxToken
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })

          const [{ data: existingTrip }, { data: existingDay, error: dayLookupErr }] = await Promise.all([
            db.from('trips').select('title').eq('id', tid).maybeSingle(),
            db
              .from('trip_days')
              .select('id,day_index')
              .eq('trip_id', tid)
              .eq('day_index', day_index)
              .maybeSingle(),
          ])

          if (dayLookupErr) return JSON.stringify({ kind: 'error', message: dayLookupErr.message })
          if (!existingDay?.id) {
            return JSON.stringify({
              kind: 'error',
              message: `Day ${day_index} does not exist on this trip. Do not create extra days unless the user explicitly changes the trip length.`,
            })
          }

          const destinationLabel = extractDestinationFromTitle(existingTrip?.title)
          const destinationAnchor = destinationLabel ? await geocodePlace(destinationLabel, token) : null

          const { error: dayErr } = await db
            .from('trip_days')
            .update({
              title: title ?? null,
              date: date ?? null,
              notes: notes ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingDay.id)
          if (dayErr) return JSON.stringify({ kind: 'error', message: dayErr.message })

          await db.from('trip_items').delete().eq('trip_day_id', existingDay.id)
          await db.from('trip_routes').delete().eq('trip_day_id', existingDay.id)

          for (let index = 0; index < items.length; index++) {
            const item = items[index]
            const place = await resolvePlannerPlace({
              db,
              token,
              placeQuery: item.place_query,
              destinationLabel,
              destinationAnchor,
            })
            const normalizedType = normalizeTripItemType(item.type)
            const itemTitle = shouldUseResolvedPlaceTitle(normalizedType, item.title, place?.name) ? place!.name : item.title

            const { error: itemErr } = await db
              .from('trip_items')
              .insert({
                trip_day_id: existingDay.id,
                type: normalizedType,
                title: itemTitle,
                place_id: place?.id || null,
                start_time: item.start_time ?? null,
                end_time: item.end_time ?? null,
                duration_minutes: item.duration_minutes ?? null,
                notes: item.notes ?? null,
                order_index: index,
              })
            if (itemErr) {
              console.error('[replaceTripDayPlan] item insert error:', itemErr.message, JSON.stringify({ trip_day_id: existingDay.id, type: item.type, title: item.title }))
              return JSON.stringify({ kind: 'error', message: itemErr.message })
            }
          }

          await computeAndStoreDayRoute(db, existingDay.id, token, 'walk')
          return tripPatch(tid)
        },
      }),

      swapTripItem: tool({
        description: 'Swap one existing itinerary item for one better replacement. This updates exactly one item by id, requires a specific real place_query, recomputes that day route, and must not add duplicate items.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          item_id: z.string().uuid(),
          title: z.string().describe('Exact visible title for the replacement. For meals, this must be the real restaurant/cafe/bar/bakery/market hall name.'),
          place_query: z.string().describe('Specific real place query to geocode and attach, e.g. "Karamanlidika, Athens"'),
          notes: z.string().optional(),
          start_time: z.string().optional(),
          end_time: z.string().optional(),
          duration_minutes: z.number().int().min(0).max(1440).optional(),
          type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']).optional(),
        }),
        execute: async ({ trip_id, item_id, title, place_query, notes, start_time, end_time, duration_minutes, type }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = mapboxToken
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })

          const { data: currentItem, error: currentErr } = await db
            .from('trip_items')
            .select('trip_day_id,type,title,trip_day:trip_days(trip_id,trip:trips(title))')
            .eq('id', item_id)
            .maybeSingle()
          if (currentErr) return JSON.stringify({ kind: 'error', message: currentErr.message })
          if (!currentItem?.trip_day_id) return JSON.stringify({ kind: 'error', message: 'Item not found' })

          const currentItemRecord = currentItem as any
          const destinationTitle = Array.isArray(currentItemRecord?.trip_day)
            ? currentItemRecord.trip_day[0]?.trip?.title
            : currentItemRecord?.trip_day?.trip?.title
          const destinationLabel = extractDestinationFromTitle(destinationTitle)
          const destinationAnchor = destinationLabel ? await geocodePlace(destinationLabel, token) : null
          const resolvedPlace = await resolvePlannerPlace({
            db,
            token,
            placeQuery: place_query,
            destinationLabel,
            destinationAnchor,
          })
          if (!resolvedPlace?.id) {
            return JSON.stringify({ kind: 'error', message: `Could not resolve replacement place: ${place_query}` })
          }

          const resolvedType = normalizeTripItemType(type || currentItem.type)
          const resolvedTitle = shouldUseResolvedPlaceTitle(resolvedType, title, resolvedPlace.name)
            ? resolvedPlace.name
            : title
          const updateFields = {
            title: resolvedTitle,
            place_id: resolvedPlace.id,
            ...(notes != null ? { notes } : {}),
            ...(start_time != null ? { start_time } : {}),
            ...(end_time != null ? { end_time } : {}),
            ...(duration_minutes != null ? { duration_minutes } : {}),
            type: resolvedType,
            updated_at: new Date().toISOString(),
          }
          const { error } = await db
            .from('trip_items')
            .update(updateFields)
            .eq('id', item_id)
          if (error) return JSON.stringify({ kind: 'error', message: error.message })

          await computeAndStoreDayRoute(db, currentItem.trip_day_id, token, 'walk')
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
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = mapboxToken
          const { data: currentItem, error: currentErr } = await db
            .from('trip_items')
            .select('trip_day_id')
            .eq('id', item_id)
            .maybeSingle()
          if (currentErr) return JSON.stringify({ kind: 'error', message: currentErr.message })
          const fromDayId = currentItem?.trip_day_id as string | undefined
          const toDayId = await ensureTripDay(db, tid, to_day_index)
          const orderIndex = to_order_index ?? 0
          const { error } = await db
            .from('trip_items')
            .update({ trip_day_id: toDayId, order_index: orderIndex, updated_at: new Date().toISOString() })
            .eq('id', item_id)
          if (error) return JSON.stringify({ kind: 'error', message: error.message })
          if (token) {
            if (fromDayId) await computeAndStoreDayRoute(db, fromDayId, token, 'walk')
            await computeAndStoreDayRoute(db, toDayId, token, 'walk')
          }
          return tripPatch(tid)
        },
      }),

      updateTripItem: tool({
        description: 'Update fields on an existing itinerary item. Include place_query when swapping to a different real venue or attraction so the item can be geocoded and pinned.',
        inputSchema: z.object({
          trip_id: z.string().uuid().optional(),
          item_id: z.string().uuid(),
          title: z.string().optional(),
          place_query: z.string().optional().describe('Specific real place query to geocode and attach, e.g. "Karamanlidika, Athens"'),
          notes: z.string().optional(),
          start_time: z.string().optional(),
          end_time: z.string().optional(),
          duration_minutes: z.number().int().min(0).max(1440).optional(),
          type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']).optional(),
        }),
        execute: async ({ trip_id, item_id, place_query, ...fields }) => {
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = mapboxToken
          const { data: currentItem, error: currentErr } = await db
            .from('trip_items')
            .select('trip_day_id,type,title,trip_day:trip_days(trip_id,trip:trips(title))')
            .eq('id', item_id)
            .maybeSingle()
          if (currentErr) return JSON.stringify({ kind: 'error', message: currentErr.message })
          const currentItemRecord = currentItem as any
          const destinationTitle = Array.isArray(currentItemRecord?.trip_day)
            ? currentItemRecord.trip_day[0]?.trip?.title
            : currentItemRecord?.trip_day?.trip?.title
          const destinationLabel = extractDestinationFromTitle(destinationTitle)
          const destinationAnchor = token && destinationLabel ? await geocodePlace(destinationLabel, token) : null
          const resolvedPlace = token && place_query
            ? await resolvePlannerPlace({
                db,
                token,
                placeQuery: place_query,
                destinationLabel,
                destinationAnchor,
              })
            : null
          const resolvedType = normalizeTripItemType(fields.type || currentItem?.type)
          const resolvedTitle =
            shouldUseResolvedPlaceTitle(resolvedType, fields.title || currentItem?.title || '', resolvedPlace?.name)
              ? resolvedPlace!.name
              : fields.title
          const safeFields = { ...fields }
          delete safeFields.type
          const updateFields = {
            ...safeFields,
            type: resolvedType,
            ...(resolvedTitle ? { title: resolvedTitle } : {}),
            ...(resolvedPlace?.id ? { place_id: resolvedPlace.id } : {}),
            updated_at: new Date().toISOString(),
          }
          const { error } = await db
            .from('trip_items')
            .update(updateFields)
            .eq('id', item_id)
          if (error) return JSON.stringify({ kind: 'error', message: error.message })
          if (token && currentItem?.trip_day_id) {
            await computeAndStoreDayRoute(db, currentItem.trip_day_id, token, 'walk')
          }
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
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = mapboxToken
          const { data: currentItem, error: currentErr } = await db
            .from('trip_items')
            .select('trip_day_id')
            .eq('id', item_id)
            .maybeSingle()
          if (currentErr) return JSON.stringify({ kind: 'error', message: currentErr.message })
          const { error } = await db.from('trip_items').delete().eq('id', item_id)
          if (error) return JSON.stringify({ kind: 'error', message: error.message })
          if (token && currentItem?.trip_day_id) {
            await computeAndStoreDayRoute(db, currentItem.trip_day_id, token, 'walk')
          }
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
          const tid = tripId || trip_id
          if (!tid) return JSON.stringify({ kind: 'error', message: 'Missing trip id' })
          const token = mapboxToken
          if (!token) return JSON.stringify({ kind: 'error', message: 'Mapbox token not configured' })
          const dayId = await ensureTripDay(db, tid, day_index)

          const { data: items, error } = await db
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

          const { error: routeErr } = await db
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

    if (!process.env.OPENAI_API_KEY) {
      return new Response('OPENAI_API_KEY is not configured', { status: 500 })
    }

    const modelName = process.env.OPENAI_MODEL || 'gpt-5.4'
    const planMode = type === 'plan'
    const latestPlanIntent = planMode
      ? inferPlanIntent({
          latestUserText,
          hasExistingTrip: Boolean(tripId),
          hasExistingDays,
          hasExistingItems,
        })
      : 'clarify'
    const activePlanTools = getPlanToolSelection(latestPlanIntent, Boolean(tripId)) as Array<keyof typeof userTools>

    const result = streamText({
      model: openai.chat(modelName),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      stopWhen: stepCountIs(planMode ? 4 : 12),
      tools: userTools,
      prepareStep: planMode
        ? ({ stepNumber, steps, messages: stepMessages }) => {
            const previousStep = steps[steps.length - 1]
            const previousToolNames = new Set(previousStep?.toolCalls.map((call) => call.toolName) || [])
            const policyHook = runPlannerPolicyHooks({
              runtime: plannerSession.runtime,
              intent: latestPlanIntent,
              stepNumber,
            })
            const needsRouteRefresh =
              stepNumber > 0 &&
              ['addTripItem', 'moveTripItem', 'updateTripItem', 'deleteTripItem'].some((toolName) =>
                previousToolNames.has(toolName)
              ) &&
              !previousToolNames.has('computeDayRoute')

            const fallbackToolChoice = getPlanToolChoice(stepNumber, latestPlanIntent)
            const toolChoice = needsRouteRefresh
              ? 'required'
              : policyHook.preferredToolChoice ?? fallbackToolChoice

            return {
              messages: stepNumber === 0 ? stepMessages : stepMessages.slice(-8),
              activeTools:
                policyHook.requiresClarification
                  ? []
                  : needsRouteRefresh
                    ? ['computeDayRoute']
                    : activePlanTools,
              toolChoice,
              system:
                stepNumber === 0
                  ? `${systemPrompt}${policyHook.systemAppendix}\n\nUse tools first. Keep chat minimal and artifact-first.`
                  : `${systemPrompt}${policyHook.systemAppendix}\n\nIf the itinerary has already been updated this turn, reply with at most one short sentence and do not restate the itinerary in chat.`,
            }
          }
        : undefined,
      onStepFinish: planMode
        ? ({ stepNumber, text, toolCalls, toolResults, finishReason }) => {
            console.info(
              '[chat-step]',
              JSON.stringify({
                type,
                tripId: tripId || null,
                planIntent: latestPlanIntent,
                stepNumber,
                finishReason,
                usedTools: toolCalls.length > 0,
                textLength: text.trim().length,
                toolCalls: toolCalls.map((call) => call.toolName),
                toolResults: toolResults.map((result) => result.toolName),
              })
            )
          }
        : undefined,
    })

    return result.toUIMessageStreamResponse({
      sendReasoning: false,
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
