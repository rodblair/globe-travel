import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '../../../_utils'

const BulkOpSchema = z.union([
  z.object({
    op: z.literal('add'),
    day_index: z.number().int().min(1),
    type: z.enum(['activity', 'meal', 'lodging', 'transport', 'transit', 'note']),
    title: z.string().min(1),
    place_query: z.string().min(1).optional(),
    start_time: z.string().nullable().optional(),
    end_time: z.string().nullable().optional(),
    duration_minutes: z.number().int().min(0).max(1440).nullable().optional(),
    notes: z.string().nullable().optional(),
  }),
  z.object({
    op: z.literal('reorder'),
    day_index: z.number().int().min(1),
    ordered_item_ids: z.array(z.string().uuid()).min(1),
  }),
  z.object({
    op: z.literal('move'),
    item_id: z.string().uuid(),
    to_day_index: z.number().int().min(1),
    to_order_index: z.number().int().min(0),
  }),
  z.object({
    op: z.literal('update'),
    item_id: z.string().uuid(),
    fields: z.record(z.string(), z.any()),
    place_query: z.string().min(1).optional(),
  }),
  z.object({
    op: z.literal('delete'),
    item_id: z.string().uuid(),
  }),
])

const BulkBodySchema = z.object({
  ops: z.array(BulkOpSchema).min(1),
})

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

const CANONICAL_ATHENS_PLACES = [
  {
    pattern: /acropolis\s+museum/i,
    name: 'Acropolis Museum',
    country: 'Greece',
    country_code: 'GR',
    latitude: 37.96845,
    longitude: 23.72855,
    mapbox_id: 'manual:athens:acropolis-museum',
  },
  {
    pattern: /athens\s+gate(?:\s+hotel)?|athensgate/i,
    name: 'Athens Gate Hotel',
    country: 'Greece',
    country_code: 'GR',
    latitude: 37.96833,
    longitude: 23.73167,
    mapbox_id: 'manual:athens:athens-gate-hotel',
  },
  {
    pattern: /ergon(?:\s+house)?(?:\s+athens)?|ergon\s+hotel/i,
    name: 'Ergon House Athens',
    country: 'Greece',
    country_code: 'GR',
    latitude: 37.9755,
    longitude: 23.73008,
    mapbox_id: 'manual:athens:ergon-house-athens',
  },
  {
    pattern: /aeginitik[oo]n?\s+archontik[oo]n?|aeginitik[oo]n?\s+arhontik[oo]n?|aegina mansion hotel/i,
    name: 'Aeginitikon Archontikon Hotel',
    country: 'Greece',
    country_code: 'GR',
    latitude: 37.74672,
    longitude: 23.42854,
    mapbox_id: 'manual:aegina:aeginitikon-archontikon',
  },
]

async function resolvePlaceId(supabase: any, placeQuery?: string | null) {
  const query = placeQuery?.trim()
  if (!query) return null

  const canonical = CANONICAL_ATHENS_PLACES.find((place) => place.pattern.test(query))
  if (canonical) {
    const placeFields = {
      name: canonical.name,
      country: canonical.country,
      country_code: canonical.country_code,
      latitude: canonical.latitude,
      longitude: canonical.longitude,
      mapbox_id: canonical.mapbox_id,
    }
    const { data, error } = await supabase
      .from('places')
      .upsert(placeFields, { onConflict: 'mapbox_id' })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    return data?.id || null
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=poi,address&limit=1`
  )
  const payload = await response.json().catch(() => null)
  const feature = payload?.features?.[0]
  if (!feature?.center) return null

  const country = feature.context?.find((entry: any) => String(entry.id).startsWith('country'))
  const { data, error } = await supabase
    .from('places')
    .upsert(
      {
        name: feature.text || query,
        country: country?.text || null,
        country_code: country?.short_code?.toUpperCase() || null,
        latitude: feature.center[1],
        longitude: feature.center[0],
        mapbox_id: feature.id,
      },
      { onConflict: 'mapbox_id' }
    )
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data?.id || null
}

function normalizeDuplicateText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function duplicateItemKey(item: {
  type?: string | null
  title?: string | null
  start_time?: string | null
  end_time?: string | null
  place_id?: string | null
}) {
  const type = item.type === 'transit' ? 'transport' : item.type || 'activity'
  const title = normalizeDuplicateText(item.title)
  const place = item.place_id || ''
  const time = type === 'lodging' ? '' : `${item.start_time || ''}-${item.end_time || ''}`
  return [type, title, place, time].join('|')
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await ctx.params
  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = BulkBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    for (const op of parsed.data.ops) {
      if (op.op === 'add') {
        const dayId = await getTripDayId(supabase, tripId, op.day_index)
        const placeId = await resolvePlaceId(supabase, op.place_query)
        const { data: existing, error: existingErr } = await supabase
          .from('trip_items')
          .select('id,type,title,start_time,end_time,place_id,order_index')
          .eq('trip_day_id', dayId)
          .order('order_index', { ascending: false })
        if (existingErr) throw new Error(existingErr.message)

        const incomingKey = duplicateItemKey({
          type: op.type,
          title: op.title,
          start_time: op.start_time ?? null,
          end_time: op.end_time ?? null,
          place_id: placeId,
        })
        const duplicate = (existing || []).find((item: any) => duplicateItemKey(item) === incomingKey)
        if (duplicate?.id) {
          const { error: updateErr } = await supabase
            .from('trip_items')
            .update({
              place_id: placeId,
              start_time: op.start_time ?? null,
              end_time: op.end_time ?? null,
              duration_minutes: op.duration_minutes ?? null,
              notes: op.notes ?? null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', duplicate.id)
          if (updateErr) throw new Error(updateErr.message)
          continue
        }

        const nextOrder = existing?.[0]?.order_index != null ? (existing[0].order_index as number) + 1 : 0
        const { error } = await supabase
          .from('trip_items')
          .insert({
            trip_day_id: dayId,
            type: op.type,
            title: op.title,
            place_id: placeId,
            start_time: op.start_time ?? null,
            end_time: op.end_time ?? null,
            duration_minutes: op.duration_minutes ?? null,
            notes: op.notes ?? null,
            order_index: nextOrder,
          })
        if (error) throw new Error(error.message)
      }

      if (op.op === 'reorder') {
        const dayId = await getTripDayId(supabase, tripId, op.day_index)
        for (let idx = 0; idx < op.ordered_item_ids.length; idx++) {
          const itemId = op.ordered_item_ids[idx]
          const { error } = await supabase
            .from('trip_items')
            .update({ order_index: idx, updated_at: new Date().toISOString() })
            .eq('id', itemId)
            .eq('trip_day_id', dayId)
          if (error) throw new Error(error.message)
        }
      }

      if (op.op === 'move') {
        const toDayId = await getTripDayId(supabase, tripId, op.to_day_index)

        const { data: existing, error: exErr } = await supabase
          .from('trip_items')
          .select('id,order_index')
          .eq('trip_day_id', toDayId)
          .order('order_index', { ascending: true })
        if (exErr) throw new Error(exErr.message)

        const ids = (existing || []).map((x: any) => x.id as string)
        const clampedIndex = Math.max(0, Math.min(op.to_order_index, ids.length))
        ids.splice(clampedIndex, 0, op.item_id)

        const { error: moveErr } = await supabase
          .from('trip_items')
          .update({ trip_day_id: toDayId, updated_at: new Date().toISOString() })
          .eq('id', op.item_id)
        if (moveErr) throw new Error(moveErr.message)

        for (let i = 0; i < ids.length; i++) {
          const itemId = ids[i]
          const { error } = await supabase
            .from('trip_items')
            .update({ order_index: i, updated_at: new Date().toISOString() })
            .eq('id', itemId)
            .eq('trip_day_id', toDayId)
          if (error) throw new Error(error.message)
        }
      }

      if (op.op === 'update') {
        const fields: Record<string, any> = { ...op.fields, updated_at: new Date().toISOString() }
        if (op.place_query) {
          fields.place_id = await resolvePlaceId(supabase, op.place_query)
        }
        const { error } = await supabase
          .from('trip_items')
          .update(fields)
          .eq('id', op.item_id)
        if (error) throw new Error(error.message)
      }

      if (op.op === 'delete') {
        const { error } = await supabase
          .from('trip_items')
          .delete()
          .eq('id', op.item_id)
        if (error) throw new Error(error.message)
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed bulk ops' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
