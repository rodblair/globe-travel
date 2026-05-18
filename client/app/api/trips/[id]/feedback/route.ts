import { NextResponse } from 'next/server'
import { requireUser } from '../../_utils'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .select('id,user_id,is_public')
    .eq('id', id)
    .maybeSingle()

  if (tripError) return NextResponse.json({ error: tripError.message }, { status: 500 })
  if (!trip || (trip.user_id !== user.id && !trip.is_public)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('trip_feedback')
    .select('id,author_name,author_email,sentiment,comment,created_at')
    .eq('trip_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}
