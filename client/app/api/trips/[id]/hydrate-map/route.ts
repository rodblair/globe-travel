import { NextResponse } from 'next/server'
import { directionsGeojson, geocodePlace } from '@/app/api/trips/_mapbox'
import { requireUser } from '@/app/api/trips/_utils'

function extractTripContext(title: string | null | undefined) {
  if (!title) return ''
  const match = title.match(/\b(?:in|to)\s+(.+)$/i)
  return match?.[1]?.trim() || title
}

function buildQueries(itemTitle: string, dayTitle: string | null, tripTitle: string) {
  const normalized = itemTitle.replace(/\s+/g, ' ').trim()
  const stripped = normalized
    .replace(/^(Breakfast|Brunch|Lunch|Dinner)\s+at\s+/i, '')
    .replace(/^(Morning|Afternoon|Evening)\s+(at|in)\s+/i, '')
    .replace(/^(Explore|Visit|Tour|Walk through|Stroll through)\s+/i, '')
    .replace(/\s+(Tour|Visit|Experience)$/i, '')
    .trim()

  const tripContext = extractTripContext(tripTitle)
  const dayContext = dayTitle?.trim() || ''

  return Array.from(
    new Set(
      [
        normalized,
        stripped,
        stripped && tripContext ? `${stripped}, ${tripContext}` : '',
        stripped && dayContext && tripContext ? `${stripped}, ${dayContext}, ${tripContext}` : '',
      ].filter(Boolean)
    )
  )
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
    .map((item: any) => ({ latitude: item.place?.latitude, longitude: item.place?.longitude }))
    .filter((coord: any) => typeof coord.latitude === 'number' && typeof coord.longitude === 'number')

  if (coords.length < 2) {
    await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId).eq('mode', mode)
    return false
  }

  const route = await directionsGeojson(coords, token, mode)
  if (!route) return false

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
  return true
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 })
  }

  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('id,title,user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (tripErr) return NextResponse.json({ error: tripErr.message }, { status: 500 })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: tripDays, error: daysErr } = await supabase
    .from('trip_days')
    .select('id,day_index,title')
    .eq('trip_id', id)
    .order('day_index', { ascending: true })

  if (daysErr) return NextResponse.json({ error: daysErr.message }, { status: 500 })

  let geocodedItems = 0
  let routeDays = 0

  for (const day of tripDays || []) {
    const { data: items, error: itemsErr } = await supabase
      .from('trip_items')
      .select('id,title,type,place_id')
      .eq('trip_day_id', day.id)
      .order('order_index', { ascending: true })

    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

    for (const item of items || []) {
      if (item.place_id || !['activity', 'meal', 'lodging'].includes(item.type)) continue

      let resolvedPlace: any = null
      for (const query of buildQueries(item.title, day.title, trip.title)) {
        const result = await geocodePlace(query, token)
        if (!result) continue

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

        if (placeErr) {
          return NextResponse.json({ error: placeErr.message }, { status: 500 })
        }

        resolvedPlace = place
        break
      }

      if (!resolvedPlace?.id) continue

      const { error: updateErr } = await supabase
        .from('trip_items')
        .update({ place_id: resolvedPlace.id, updated_at: new Date().toISOString() })
        .eq('id', item.id)

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
      geocodedItems += 1
    }

    const routeCreated = await computeAndStoreDayRoute(supabase, day.id, token, 'walk')
    if (routeCreated) routeDays += 1
  }

  return NextResponse.json({ ok: true, geocodedItems, routeDays })
}
