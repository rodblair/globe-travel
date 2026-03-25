import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, TripBudgetSchema, TripPaceSchema } from '../_utils'

function coerceCoordinate(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeTripItem(item: any) {
  const latitude = coerceCoordinate(item?.place?.latitude)
  const longitude = coerceCoordinate(item?.place?.longitude)

  return {
    ...item,
    place: item?.place
      ? {
          ...item.place,
          latitude,
          longitude,
        }
      : item?.place,
  }
}

const UpdateTripSchema = z.object({
  title: z.string().min(1).optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  travelers_count: z.number().int().min(1).max(20).optional(),
  pace: TripPaceSchema,
  budget_level: TripBudgetSchema,
  constraints: z.record(z.string(), z.any()).optional(),
  is_public: z.boolean().optional(),
})

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (tripErr) return NextResponse.json({ error: tripErr.message }, { status: 500 })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: days, error: daysErr } = await supabase
    .from('trip_days')
    .select('id,day_index,date,title,notes')
    .eq('trip_id', id)
    .order('day_index', { ascending: true })

  if (daysErr) return NextResponse.json({ error: daysErr.message }, { status: 500 })
  if (!days || days.length === 0) {
    // Ensure there's always at least Day 1 for the Studio UI.
    const { data: created, error: createErr } = await supabase
      .from('trip_days')
      .insert({ trip_id: id, day_index: 1 })
      .select('id,day_index,date,title,notes')
      .single()
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 500 })
    days.push(created as any)
  }

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
    byDayItems.get(it.trip_day_id)!.push(normalizeTripItem(it))
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

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = UpdateTripSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('trips')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
