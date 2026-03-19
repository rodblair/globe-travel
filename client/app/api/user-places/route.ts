import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_places')
    .select('*, place:places(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { place, status, notes, visit_date, rating } = body

  // Upsert the place first
  const { data: placeData, error: placeError } = await supabase
    .from('places')
    .upsert(
      {
        name: place.name,
        country: place.country,
        latitude: place.latitude,
        longitude: place.longitude,
        photo_url: place.photo_url,
        mapbox_id: place.mapbox_id,
      },
      { onConflict: 'mapbox_id' }
    )
    .select()
    .single()

  if (placeError) {
    return NextResponse.json({ error: placeError.message }, { status: 500 })
  }

  // Create the user_place
  const { data: userPlace, error: upError } = await supabase
    .from('user_places')
    .insert({
      user_id: user.id,
      place_id: placeData.id,
      status: status || 'visited',
      notes,
      visit_date,
      rating,
    })
    .select('*, place:places(*)')
    .single()

  if (upError) {
    return NextResponse.json({ error: upError.message }, { status: 500 })
  }

  return NextResponse.json(userPlace, { status: 201 })
}
