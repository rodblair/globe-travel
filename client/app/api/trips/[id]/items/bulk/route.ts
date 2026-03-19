import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '../../../_utils'

const BulkOpSchema = z.union([
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
        const fields = { ...op.fields, updated_at: new Date().toISOString() }
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
