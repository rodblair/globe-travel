import { NextResponse } from 'next/server'
import { z } from 'zod'
import { randomSlug, requireUser, TripBudgetSchema, TripPaceSchema } from './_utils'

const CreateTripSchema = z.object({
  title: z.string().min(1),
  destination_place_id: z.string().uuid().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  travelers_count: z.number().int().min(1).max(20).optional(),
  pace: TripPaceSchema,
  budget_level: TripBudgetSchema,
  constraints: z.record(z.string(), z.any()).optional(),
})

export async function GET() {
  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data, error } = await supabase
    .from('trips')
    .select('id,title,share_slug,is_public,start_date,end_date,updated_at,created_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: Request) {
  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = CreateTripSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const payload = parsed.data
  const share_slug = randomSlug()

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      title: payload.title,
      destination_place_id: payload.destination_place_id ?? null,
      start_date: payload.start_date ?? null,
      end_date: payload.end_date ?? null,
      travelers_count: payload.travelers_count ?? 1,
      pace: payload.pace ?? null,
      budget_level: payload.budget_level ?? null,
      constraints: payload.constraints ?? {},
      share_slug,
    })
    .select('id,share_slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create initial day rows if caller provided a preferred length in constraints.days
  const daysCount = typeof (payload.constraints as any)?.days === 'number'
    ? Math.max(1, Math.min(30, Math.floor((payload.constraints as any).days)))
    : 4
  const dayRows = Array.from({ length: daysCount }, (_, i) => ({ trip_id: trip.id, day_index: i + 1 }))
  await supabase.from('trip_days').insert(dayRows)

  return NextResponse.json({ tripId: trip.id, shareSlug: trip.share_slug })
}
