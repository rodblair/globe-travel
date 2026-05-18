type GeocodeResult = {
  mapbox_place_id: string
  name: string
  full_name: string
  latitude: number
  longitude: number
  country: string
  country_code?: string
}

type GeocodeFeature = {
  id?: string
  text?: string
  place_name?: string
  place_type?: string[]
  center?: [number, number]
  context?: Array<{ id?: string; text?: string; short_code?: string }>
  relevance?: number
}

const DESTINATION_OVERRIDES: Record<string, GeocodeResult> = {
  athens: {
    mapbox_place_id: 'manual:destination:athens',
    name: 'Athens',
    full_name: 'Athens, Greece',
    latitude: 37.98381,
    longitude: 23.72754,
    country: 'Greece',
    country_code: 'GR',
  },
  'athens greece': {
    mapbox_place_id: 'manual:destination:athens',
    name: 'Athens',
    full_name: 'Athens, Greece',
    latitude: 37.98381,
    longitude: 23.72754,
    country: 'Greece',
    country_code: 'GR',
  },
  lisbon: {
    mapbox_place_id: 'manual:destination:lisbon',
    name: 'Lisbon',
    full_name: 'Lisbon, Portugal',
    latitude: 38.72225,
    longitude: -9.13934,
    country: 'Portugal',
    country_code: 'PT',
  },
  'lisbon portugal': {
    mapbox_place_id: 'manual:destination:lisbon',
    name: 'Lisbon',
    full_name: 'Lisbon, Portugal',
    latitude: 38.72225,
    longitude: -9.13934,
    country: 'Portugal',
    country_code: 'PT',
  },
  'mexico city': {
    mapbox_place_id: 'manual:destination:mexico-city',
    name: 'Mexico City',
    full_name: 'Mexico City, Mexico',
    latitude: 19.43261,
    longitude: -99.13321,
    country: 'Mexico',
    country_code: 'MX',
  },
  'mexico city mexico': {
    mapbox_place_id: 'manual:destination:mexico-city',
    name: 'Mexico City',
    full_name: 'Mexico City, Mexico',
    latitude: 19.43261,
    longitude: -99.13321,
    country: 'Mexico',
    country_code: 'MX',
  },
  cdmx: {
    mapbox_place_id: 'manual:destination:mexico-city',
    name: 'Mexico City',
    full_name: 'Mexico City, Mexico',
    latitude: 19.43261,
    longitude: -99.13321,
    country: 'Mexico',
    country_code: 'MX',
  },
  tokyo: {
    mapbox_place_id: 'manual:destination:tokyo',
    name: 'Tokyo',
    full_name: 'Tokyo, Japan',
    latitude: 35.67642,
    longitude: 139.65003,
    country: 'Japan',
    country_code: 'JP',
  },
  'tokyo japan': {
    mapbox_place_id: 'manual:destination:tokyo',
    name: 'Tokyo',
    full_name: 'Tokyo, Japan',
    latitude: 35.67642,
    longitude: 139.65003,
    country: 'Japan',
    country_code: 'JP',
  },
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function querySubject(query: string) {
  return normalizeText(query.split(',')[0] || query)
}

function tokenSet(value: string) {
  const stopwords = new Set(['and', 'the', 'of', 'de', 'da', 'do', 'dos', 'das', 'del', 'el', 'la', 'las', 'los'])
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter((token) => token.length > 1 && !stopwords.has(token))
  )
}

function tokenCoverage(source: Set<string>, target: Set<string>) {
  if (source.size === 0 || target.size === 0) return 0
  let matches = 0
  for (const token of source) {
    if (target.has(token)) matches += 1
  }
  return matches / source.size
}

function haversineKm(latitude1: number, longitude1: number, latitude2: number, longitude2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(latitude2 - latitude1)
  const dLng = toRad(longitude2 - longitude1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latitude1)) * Math.cos(toRad(latitude2)) * Math.sin(dLng / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function countryContext(feature: GeocodeFeature) {
  const countryCtx = (feature.context || []).find((context) => typeof context?.id === 'string' && context.id.startsWith('country'))
  return {
    country: countryCtx?.text || '',
    country_code: countryCtx?.short_code ? String(countryCtx.short_code).toUpperCase() : undefined,
  }
}

function scoreFeature(
  feature: GeocodeFeature,
  query: string,
  options: {
    proximity?: { latitude: number; longitude: number } | null
    countryCode?: string | null
    strictName?: boolean
  }
) {
  const center = feature.center
  if (!center) return null
  const [longitude, latitude] = center
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const { country_code } = countryContext(feature)
  if (options.countryCode && country_code !== options.countryCode.toUpperCase()) return null

  const types = new Set(feature.place_type || [])
  const subject = querySubject(query)
  const subjectTokens = tokenSet(subject)
  const normalizedFeatureText = normalizeText(feature.text || '')
  const textTokens = tokenSet(feature.text || '')
  const fullNameTokens = tokenSet(feature.place_name || '')
  const textCoverage = tokenCoverage(subjectTokens, textTokens)
  const fullNameCoverage = tokenCoverage(subjectTokens, fullNameTokens)
  const subjectInFeature = Boolean(subject) && normalizedFeatureText.includes(subject)
  const featureInSubject = normalizedFeatureText.length > 0 && subject.includes(normalizedFeatureText)
  const isPoi = types.has('poi')
  const isAddress = types.has('address')
  const isBroadPlace = types.has('place') || types.has('locality') || types.has('neighborhood')
  const firstFeatureToken = normalizedFeatureText.split(' ')[0]
  const streetPrefix = new Set(['avenida', 'av', 'calle', 'cerrada', 'privada', 'rua', 'travessa', 'street'])

  if (options.strictName && isAddress && streetPrefix.has(firstFeatureToken) && !subject.startsWith(`${firstFeatureToken} `)) {
    return null
  }

  if (options.strictName && (subjectTokens.size >= 2 || isBroadPlace || isAddress)) {
    const coverageFloor = isBroadPlace ? 0.65 : 0.45
    const hasEnoughNameMatch = isBroadPlace
      ? subjectInFeature || Math.max(textCoverage, fullNameCoverage) >= coverageFloor
      : subjectInFeature || featureInSubject || Math.max(textCoverage, fullNameCoverage) >= coverageFloor
    if (!hasEnoughNameMatch) {
      return null
    }
  }

  let score = 0
  if (isPoi) score += 60
  else if (isAddress) score += 32
  else if (isBroadPlace) score += 14

  score += textCoverage * 55
  score += fullNameCoverage * 25
  if (subjectInFeature) score += 30
  if (featureInSubject) score += 20
  if (typeof feature.relevance === 'number') score += feature.relevance * 12
  if (options.countryCode && country_code === options.countryCode.toUpperCase()) score += 20

  if (options.proximity) {
    const distanceKm = haversineKm(latitude, longitude, options.proximity.latitude, options.proximity.longitude)
    if (options.strictName && distanceKm > 20) return null
    if (distanceKm <= 2) score += 18
    else if (distanceKm <= 10) score += 13
    else if (distanceKm <= 30) score += 7
    else score -= Math.min(50, distanceKm)
  }

  if (options.strictName && isBroadPlace && subjectTokens.size >= 2) score -= 35
  if (options.strictName && isAddress && subjectTokens.size >= 2 && textCoverage < 0.45) score -= 18

  return { feature, score }
}

export async function geocodePlace(
  query: string,
  token: string,
  options: {
    proximity?: { latitude: number; longitude: number } | null
    countryCode?: string | null
    strictName?: boolean
  } = {}
): Promise<GeocodeResult | null> {
  const destinationOverride = DESTINATION_OVERRIDES[normalizeText(query)]
  if (
    destinationOverride &&
    (!options.countryCode || destinationOverride.country_code === options.countryCode.toUpperCase())
  ) {
    return destinationOverride
  }

  const params = new URLSearchParams({
    access_token: token,
    types: 'place,locality,neighborhood,address,poi',
    limit: '5',
  })
  if (options.proximity) {
    params.set('proximity', `${options.proximity.longitude},${options.proximity.latitude}`)
  }
  if (options.countryCode) {
    params.set('country', options.countryCode.toLowerCase())
  }
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const candidates = (Array.isArray(data?.features) ? data.features : [])
    .map((feature: GeocodeFeature) => scoreFeature(feature, query, options))
    .filter(Boolean)
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
  const feature = candidates[0]?.feature
  if (!feature) return null

  const { country, country_code } = countryContext(feature)

  return {
    mapbox_place_id: feature.id || feature.place_name || query,
    name: feature.text || query,
    full_name: feature.place_name || query,
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
