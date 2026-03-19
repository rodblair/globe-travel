import { NextResponse } from 'next/server'
import { requireUser } from '@/app/api/trips/_utils'
import { directionsGeojson } from '@/app/api/trips/_mapbox'

function haversine(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const R = 6371e3
  const toRad = (n: number) => (n * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

function nearestNeighborOrder<T extends { latitude: number; longitude: number }>(points: T[]) {
  if (points.length <= 2) return points
  const remaining = [...points]
  const ordered: T[] = [remaining.shift()!]
  while (remaining.length > 0) {
    const last = ordered[ordered.length - 1]
    let bestIdx = 0
    let bestDist = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(last, remaining[i])
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }
    ordered.push(remaining.splice(bestIdx, 1)[0])
  }
  return ordered
}

async function getTripDayId(supabase: any, tripId: string, dayIndex: number) {
  const { data: day, error } = await supabase
    .from('trip_days')
    .select('id')
    .eq('trip_id', tripId)
    .eq('day_index', dayIndex)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (day?.id) return day.id as string

  const { data: created, error: createErr } = await supabase
    .from('trip_days')
    .insert({ trip_id: tripId, day_index: dayIndex })
    .select('id')
    .single()
  if (createErr) throw new Error(createErr.message)
  return created.id as string
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string; dayIndex: string }> }) {
  const { id: tripId, dayIndex } = await ctx.params
  const day_index = parseInt(dayIndex, 10)
  if (!Number.isFinite(day_index) || day_index < 1) {
    return NextResponse.json({ error: 'Invalid day index' }, { status: 400 })
  }

  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 })

  try {
    const tripDayId = await getTripDayId(supabase, tripId, day_index)

    const { data: items, error } = await supabase
      .from('trip_items')
      .select('id,order_index,place:places(latitude,longitude)')
      .eq('trip_day_id', tripDayId)
      .order('order_index', { ascending: true })
    if (error) throw new Error(error.message)

    const withCoords = (items || [])
      .map((it: any) => ({
        id: it.id,
        latitude: it.place?.latitude,
        longitude: it.place?.longitude,
      }))
      .filter((x: any) => typeof x.latitude === 'number' && typeof x.longitude === 'number')

    const withoutCoords = (items || [])
      .filter((it: any) => !(typeof it.place?.latitude === 'number' && typeof it.place?.longitude === 'number'))
      .map((it: any) => it.id as string)

    const orderedCoords = nearestNeighborOrder(withCoords)
    const orderedIds = [...orderedCoords.map((x: any) => x.id), ...withoutCoords]

    for (let i = 0; i < orderedIds.length; i++) {
      const { error: upErr } = await supabase
        .from('trip_items')
        .update({ order_index: i, updated_at: new Date().toISOString() })
        .eq('id', orderedIds[i])
        .eq('trip_day_id', tripDayId)
      if (upErr) throw new Error(upErr.message)
    }

    const coords = orderedCoords.map((p: any) => ({ latitude: p.latitude, longitude: p.longitude }))
    const route = await directionsGeojson(coords, token, 'walk')
    if (route) {
      const { error: routeErr } = await supabase
        .from('trip_routes')
        .upsert(
          {
            trip_day_id: tripDayId,
            geojson: route.geojson,
            distance_m: route.distance_m,
            duration_s: route.duration_s,
            mode: 'walk',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'trip_day_id,mode' }
        )
      if (routeErr) throw new Error(routeErr.message)
    }

    return NextResponse.json({ ok: true, ordered_item_ids: orderedIds })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to optimize' }, { status: 500 })
  }
}

