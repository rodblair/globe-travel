import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const supabase = await createClient()

  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('*')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .maybeSingle()

  if (tripErr) return NextResponse.json({ error: tripErr.message }, { status: 500 })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: days, error: daysErr } = await supabase
    .from('trip_days')
    .select('id,day_index,date,title,notes')
    .eq('trip_id', trip.id)
    .order('day_index', { ascending: true })

  if (daysErr) return NextResponse.json({ error: daysErr.message }, { status: 500 })

  const dayIds = (days || []).map((d) => d.id)
  const { data: items, error: itemsErr } = dayIds.length === 0
    ? { data: [], error: null }
    : await supabase
      .from('trip_items')
      .select('id,trip_day_id,type,title,start_time,end_time,duration_minutes,cost_estimate,notes,metadata,order_index,place:places(id,name,country,latitude,longitude)')
      .in('trip_day_id', dayIds)
      .order('order_index', { ascending: true })

  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

  const { data: routes, error: routesErr } = dayIds.length === 0
    ? { data: [], error: null }
    : await supabase
      .from('trip_routes')
      .select('trip_day_id,geojson,distance_m,duration_s,mode,updated_at')
      .in('trip_day_id', dayIds)

  if (routesErr) return NextResponse.json({ error: routesErr.message }, { status: 500 })

  const byDayItems = new Map<string, any[]>()
  for (const it of items || []) {
    if (!byDayItems.has(it.trip_day_id)) byDayItems.set(it.trip_day_id, [])
    byDayItems.get(it.trip_day_id)!.push(it)
  }

  const byDayRoutes = new Map<string, any[]>()
  for (const r of routes || []) {
    if (!byDayRoutes.has(r.trip_day_id)) byDayRoutes.set(r.trip_day_id, [])
    byDayRoutes.get(r.trip_day_id)!.push(r)
  }

  const resultDays = (days || []).map((d) => ({
    ...d,
    items: byDayItems.get(d.id) || [],
    routes: byDayRoutes.get(d.id) || [],
  }))

  return NextResponse.json({ trip, days: resultDays })
}

