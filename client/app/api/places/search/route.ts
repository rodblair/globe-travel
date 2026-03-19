import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 })
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&types=place,locality,neighborhood,address,poi&limit=5`

  try {
    const response = await fetch(url)
    const data = await response.json()

    const places = (data.features || []).map((feature: any) => ({
      mapbox_id: feature.id,
      name: feature.text,
      full_name: feature.place_name,
      latitude: feature.center[1],
      longitude: feature.center[0],
      country: feature.context?.find((c: any) => c.id.startsWith('country'))?.text || '',
    }))

    return NextResponse.json(places)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 })
  }
}
