import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

const SELECT = '*, user_place:user_places(*, place:places(*)), trip:trips(id,title)'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const tripId = searchParams.get('trip_id')

  let query = supabase
    .from('journal_entries')
    .select(SELECT)
    .eq('user_id', user.id)
    .order('visited_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (tripId) query = query.eq('trip_id', tripId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { title, content, mood, user_place_id, location, visited_date, trip_id } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  if (!content?.trim()) return NextResponse.json({ error: 'Content is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      mood: mood || null,
      user_place_id: user_place_id || null,
      location: location?.trim() || null,
      visited_date: visited_date || null,
      trip_id: trip_id || null,
    })
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { id, title, content, mood, user_place_id, location, visited_date, trip_id } = body
  if (!id) return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('journal_entries')
    .update({
      title: title?.trim(),
      content: content?.trim(),
      mood: mood || null,
      user_place_id: user_place_id || null,
      location: location?.trim() || null,
      visited_date: visited_date || null,
      trip_id: trip_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select(SELECT)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
