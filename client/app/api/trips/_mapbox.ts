type GeocodeResult = {
  mapbox_place_id: string
  name: string
  full_name: string
  latitude: number
  longitude: number
  country: string
  country_code?: string
}

export async function geocodePlace(query: string, token: string): Promise<GeocodeResult | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&types=place,locality,neighborhood,address,poi&limit=1`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const feature = data?.features?.[0]
  if (!feature) return null

  const countryCtx = (feature.context || []).find((c: any) => typeof c?.id === 'string' && c.id.startsWith('country'))
  const country = countryCtx?.text || ''
  const country_code = countryCtx?.short_code ? String(countryCtx.short_code).toUpperCase() : undefined

  return {
    mapbox_place_id: feature.id,
    name: feature.text,
    full_name: feature.place_name,
    latitude: feature.center?.[1],
    longitude: feature.center?.[0],
    country,
    country_code,
  }
}

export async function directionsGeojson(coords: Array<{ latitude: number; longitude: number }>, token: string, mode: 'walk' | 'drive' | 'transit' = 'walk') {
  if (coords.length < 2) return null

  const profile = mode === 'drive' ? 'driving' : mode === 'transit' ? 'driving' : 'walking'
  const coordStr = coords.map((c) => `${c.longitude},${c.latitude}`).join(';')
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordStr}?access_token=${token}&geometries=geojson&overview=full`

  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const route = data?.routes?.[0]
  if (!route?.geometry) return null

  return {
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: route.geometry,
        },
      ],
    },
    distance_m: typeof route.distance === 'number' ? Math.round(route.distance) : null,
    duration_s: typeof route.duration === 'number' ? Math.round(route.duration) : null,
  }
}

