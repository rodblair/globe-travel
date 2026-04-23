import { NextResponse } from 'next/server'
import { directionsGeojson, geocodePlace } from '@/app/api/trips/_mapbox'
import { requireUser } from '@/app/api/trips/_utils'

type CanonicalPlaceOverride = {
  pattern: RegExp
  query?: string
  name?: string
  country?: string
  country_code?: string
  latitude?: number
  longitude?: number
  manualId?: string
}

const CANONICAL_PLACE_OVERRIDES: CanonicalPlaceOverride[] = [
  { pattern: /acropolis.*parthenon|parthenon.*acropolis/i, name: 'Acropolis of Athens', country: 'Greece', country_code: 'GR', latitude: 37.97153, longitude: 23.72575, manualId: 'manual:athens:acropolis' },
  { pattern: /acropolis museum/i, name: 'Acropolis Museum', country: 'Greece', country_code: 'GR', latitude: 37.96845, longitude: 23.72853, manualId: 'manual:athens:acropolis-museum' },
  { pattern: /long lunch in plaka|lunch.*plaka/i, name: 'Plaka', country: 'Greece', country_code: 'GR', latitude: 37.97308, longitude: 23.73051, manualId: 'manual:athens:plaka' },
  { pattern: /plaka.*anafiotika|anafiotika.*plaka/i, name: 'Anafiotika', country: 'Greece', country_code: 'GR', latitude: 37.97233, longitude: 23.72786, manualId: 'manual:athens:anafiotika' },
  { pattern: /rooftop dinner.*acropolis|acropolis views/i, name: 'A for Athens Rooftop', country: 'Greece', country_code: 'GR', latitude: 37.97615, longitude: 23.72566, manualId: 'manual:athens:a-for-athens-rooftop' },
  { pattern: /coffee.*monastiraki|walk through monastiraki/i, name: 'Monastiraki Square', country: 'Greece', country_code: 'GR', latitude: 37.97608, longitude: 23.72557, manualId: 'manual:athens:monastiraki-square' },
  { pattern: /central market|food stroll/i, name: 'Athens Central Market', country: 'Greece', country_code: 'GR', latitude: 37.98005, longitude: 23.72672, manualId: 'manual:athens:central-market' },
  { pattern: /lunch in psiri|\bpsiri\b|\bpsyri\b/i, name: 'Psiri', country: 'Greece', country_code: 'GR', latitude: 37.97855, longitude: 23.72328, manualId: 'manual:athens:psiri' },
  { pattern: /ermou street/i, name: 'Ermou Street', country: 'Greece', country_code: 'GR', latitude: 37.97682, longitude: 23.7247, manualId: 'manual:athens:ermou-street' },
  { pattern: /national garden.*syntagma|syntagma.*national garden/i, name: 'National Garden', country: 'Greece', country_code: 'GR', latitude: 37.97393, longitude: 23.73624, manualId: 'manual:athens:national-garden' },
  { pattern: /koukaki/i, name: 'Koukaki', country: 'Greece', country_code: 'GR', latitude: 37.96393, longitude: 23.72141, manualId: 'manual:athens:koukaki' },
  { pattern: /brunch in kolonaki|\bkolonaki\b/i, name: 'Kolonaki', country: 'Greece', country_code: 'GR', latitude: 37.97798, longitude: 23.74132, manualId: 'manual:athens:kolonaki' },
  { pattern: /museum stop|boutique browsing/i, name: 'Benaki Museum', country: 'Greece', country_code: 'GR', latitude: 37.97595, longitude: 23.74029, manualId: 'manual:athens:benaki-museum' },
  { pattern: /pangrati/i, name: 'Pangrati', country: 'Greece', country_code: 'GR', latitude: 37.96991, longitude: 23.74531, manualId: 'manual:athens:pangrati' },
  { pattern: /lycabettus/i, name: 'Lycabettus Hill', country: 'Greece', country_code: 'GR', latitude: 37.98178, longitude: 23.74306, manualId: 'manual:athens:lycabettus-hill' },
  { pattern: /\bmile end\b/i, name: 'Mile End', country: 'Canada', country_code: 'CA', latitude: 45.52358, longitude: -73.60078, manualId: 'manual:montreal:mile-end' },
  { pattern: /\bplateau\b|\bplateau mont-royal\b/i, name: 'Plateau Mont-Royal', country: 'Canada', country_code: 'CA', latitude: 45.52654, longitude: -73.58195, manualId: 'manual:montreal:plateau' },
  { pattern: /jean-talon market/i, name: 'Jean-Talon Market', country: 'Canada', country_code: 'CA', latitude: 45.53617, longitude: -73.61434, manualId: 'manual:montreal:jean-talon-market' },
  { pattern: /old montreal|vieux-montreal|vieux-montr[eé]al/i, name: 'Vieux-Montréal', country: 'Canada', country_code: 'CA', latitude: 45.50233, longitude: -73.55859, manualId: 'manual:montreal:old-montreal' },
  { pattern: /chinatown/i, name: 'Montreal Chinatown', country: 'Canada', country_code: 'CA', latitude: 45.50735, longitude: -73.56027, manualId: 'manual:montreal:chinatown' },
  { pattern: /little italy/i, name: 'Little Italy', country: 'Canada', country_code: 'CA', latitude: 45.53543, longitude: -73.61457, manualId: 'manual:montreal:little-italy' },
  { pattern: /parc la fontaine|park la fontaine/i, name: 'Parc La Fontaine', country: 'Canada', country_code: 'CA', latitude: 45.52664, longitude: -73.56994, manualId: 'manual:montreal:parc-la-fontaine' },
  { pattern: /boulevard saint-laurent|boulevard st-laurent|saint-laurent/i, name: 'Boulevard Saint-Laurent', country: 'Canada', country_code: 'CA', latitude: 45.51776, longitude: -73.57787, manualId: 'manual:montreal:saint-laurent' },
  { pattern: /nonna betta/i, name: 'Nonna Betta', country: 'Italy', country_code: 'IT', latitude: 41.89244, longitude: 12.47562, manualId: 'manual:rome:nonna-betta' },
  { pattern: /da enzo al 29/i, name: 'Da Enzo al 29', country: 'Italy', country_code: 'IT', latitude: 41.88798, longitude: 12.46947, manualId: 'manual:rome:da-enzo-al-29' },
  { pattern: /armando al pantheon/i, name: 'Armando al Pantheon', country: 'Italy', country_code: 'IT', latitude: 41.89861, longitude: 12.47679, manualId: 'manual:rome:armando-al-pantheon' },
  { pattern: /bonci pizzarium|pizzarium/i, name: 'Pizzarium Bonci', country: 'Italy', country_code: 'IT', latitude: 41.90708, longitude: 12.44645, manualId: 'manual:rome:pizzarium-bonci' },
  { pattern: /roscioli salumeria|roscioli/i, name: 'Roscioli Salumeria con Cucina', country: 'Italy', country_code: 'IT', latitude: 41.89553, longitude: 12.47225, manualId: 'manual:rome:roscioli' },
  { pattern: /casina valadier/i, name: 'Casina Valadier', country: 'Italy', country_code: 'IT', latitude: 41.91398, longitude: 12.48617, manualId: 'manual:rome:casina-valadier' },
  { pattern: /casa manco/i, name: 'Casa Manco Testaccio', country: 'Italy', country_code: 'IT', latitude: 41.87441, longitude: 12.47587, manualId: 'manual:rome:casa-manco' },
  { pattern: /la taverna dei fori imperiali/i, name: 'La Taverna dei Fori Imperiali', country: 'Italy', country_code: 'IT', latitude: 41.89303, longitude: 12.48923, manualId: 'manual:rome:taverna-fori-imperiali' },
  { pattern: /\btaverna romana\b/i, name: 'Taverna Romana', country: 'Italy', country_code: 'IT', latitude: 41.8944, longitude: 12.4894, manualId: 'manual:rome:taverna-romana' },
  { pattern: /sant'eustachio il caff[eé]|sant'eustachio/i, name: "Sant'Eustachio il Caffè", country: 'Italy', country_code: 'IT', latitude: 41.8987, longitude: 12.4727, manualId: 'manual:rome:sant-eustachio' },
  { pattern: /\balla rampa\b/i, name: 'Alla Rampa', country: 'Italy', country_code: 'IT', latitude: 41.9059, longitude: 12.4832, manualId: 'manual:rome:alla-rampa' },
  { pattern: /\bpierluigi\b/i, name: 'Pierluigi', country: 'Italy', country_code: 'IT', latitude: 41.8961, longitude: 12.4699, manualId: 'manual:rome:pierluigi' },
  { pattern: /\bil sorpasso\b/i, name: 'Il Sorpasso', country: 'Italy', country_code: 'IT', latitude: 41.9053, longitude: 12.4641, manualId: 'manual:rome:il-sorpasso' },
  { pattern: /panino divino/i, name: 'Panino Divino', country: 'Italy', country_code: 'IT', latitude: 41.90623, longitude: 12.45742, manualId: 'manual:rome:panino-divino' },
  { pattern: /piatto romano/i, name: 'Piatto Romano', country: 'Italy', country_code: 'IT', latitude: 41.87779, longitude: 12.47872, manualId: 'manual:rome:piatto-romano' },
  { pattern: /jewish ghetto/i, name: 'Jewish Ghetto', country: 'Italy', country_code: 'IT', latitude: 41.8924, longitude: 12.4751, manualId: 'manual:rome:jewish-ghetto' },
  { pattern: /trastevere/i, name: 'Trastevere', country: 'Italy', country_code: 'IT', latitude: 41.88802, longitude: 12.46984, manualId: 'manual:rome:trastevere' },
  { pattern: /colosseum|roman forum/i, name: 'Colosseum', country: 'Italy', country_code: 'IT', latitude: 41.89021, longitude: 12.49223, manualId: 'manual:rome:colosseum' },
  { pattern: /palatine hill/i, name: 'Palatine Hill', country: 'Italy', country_code: 'IT', latitude: 41.88933, longitude: 12.48899, manualId: 'manual:rome:palatine-hill' },
  { pattern: /vatican museums|sistine chapel/i, name: 'Vatican Museums', country: 'Vatican City', country_code: 'VA', latitude: 41.90649, longitude: 12.45362, manualId: 'manual:vatican:museums' },
  { pattern: /st\.?\s*peter'?s (basilica|square)|piazza san pietro|\bvatican\b/i, name: "St. Peter's Square", country: 'Vatican City', country_code: 'VA', latitude: 41.90217, longitude: 12.45394, manualId: 'manual:vatican:st-peters' },
  { pattern: /villa borghese/i, name: 'Villa Borghese Gardens', country: 'Italy', country_code: 'IT', latitude: 41.9142, longitude: 12.49232, manualId: 'manual:rome:villa-borghese' },
  { pattern: /piazza navona/i, name: 'Piazza Navona', country: 'Italy', country_code: 'IT', latitude: 41.89893, longitude: 12.47307, manualId: 'manual:rome:piazza-navona' },
  { pattern: /pantheon/i, name: 'Pantheon', country: 'Italy', country_code: 'IT', latitude: 41.89861, longitude: 12.47687, manualId: 'manual:rome:pantheon' },
  { pattern: /trevi fountain/i, name: 'Trevi Fountain', country: 'Italy', country_code: 'IT', latitude: 41.90093, longitude: 12.48331, manualId: 'manual:rome:trevi-fountain' },
  { pattern: /spanish steps/i, name: 'Spanish Steps', country: 'Italy', country_code: 'IT', latitude: 41.90599, longitude: 12.48278, manualId: 'manual:rome:spanish-steps' },
  { pattern: /campo de['']? fiori/i, name: "Campo de' Fiori", country: 'Italy', country_code: 'IT', latitude: 41.89574, longitude: 12.4722, manualId: 'manual:rome:campo-de-fiori' },
  { pattern: /testaccio/i, name: 'Testaccio', country: 'Italy', country_code: 'IT', latitude: 41.87416, longitude: 12.47543, manualId: 'manual:rome:testaccio' },
  // Additional Rome landmarks frequently misgeocoded
  { pattern: /castel sant'?angelo|castle sant'?angelo/i, name: "Castel Sant'Angelo", country: 'Italy', country_code: 'IT', latitude: 41.90317, longitude: 12.46631, manualId: 'manual:rome:castel-santangelo' },
  { pattern: /capitoline hill|campidoglio/i, name: 'Capitoline Hill', country: 'Italy', country_code: 'IT', latitude: 41.89330, longitude: 12.48275, manualId: 'manual:rome:capitoline-hill' },
  { pattern: /vittoriano|altare della patria|piazza venezia/i, name: 'Vittoriano', country: 'Italy', country_code: 'IT', latitude: 41.89492, longitude: 12.48278, manualId: 'manual:rome:vittoriano' },
  { pattern: /piazza del popolo/i, name: 'Piazza del Popolo', country: 'Italy', country_code: 'IT', latitude: 41.91102, longitude: 12.47625, manualId: 'manual:rome:piazza-del-popolo' },
  { pattern: /piazza di spagna/i, name: 'Piazza di Spagna', country: 'Italy', country_code: 'IT', latitude: 41.90599, longitude: 12.48278, manualId: 'manual:rome:piazza-di-spagna' },
  { pattern: /\bmonti\b/i, name: 'Monti', country: 'Italy', country_code: 'IT', latitude: 41.89472, longitude: 12.49556, manualId: 'manual:rome:monti' },
  { pattern: /\bprati\b/i, name: 'Prati', country: 'Italy', country_code: 'IT', latitude: 41.90580, longitude: 12.46073, manualId: 'manual:rome:prati' },
  { pattern: /\borganic market\b/i, name: 'Testaccio Market', country: 'Italy', country_code: 'IT', latitude: 41.87416, longitude: 12.47543, manualId: 'manual:rome:testaccio-market' },
]

function extractTripContext(title: string | null | undefined) {
  if (!title) return ''
  const cleaned = title.trim()
  const monthPattern = '(January|February|March|April|May|June|July|August|September|October|November|December)'

  const patterns = [
    new RegExp(`^\\d+\\s+Days?\\s+in\\s+(.+?)(?=\\s+\\b(?:for|with|on|around|near|from)\\b|[,.!?]|$)`, 'i'),
    new RegExp(`^(.+?)\\s+in\\s+${monthPattern}\\b`, 'i'),
    /^(.+?)\s+in\s+\d+\s+Days?$/i,           // "Rome in 3 Days"
    /^(.+?)\s+in\s+\d+\s+Nights?$/i,         // "Paris in 5 Nights"
    /^(.+?)\s+Weekend\s+Getaway$/i,           // "Tokyo Weekend Getaway"
    /^(.+?)\s+Day\s+Trip$/i,
    /^Trip to\s+(.+)$/i,
    /^(.+?)\s+Trip$/i,
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return cleaned
}

function haversineKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(latitude2 - latitude1)
  const dLng = toRad(longitude2 - longitude1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(latitude1)) * Math.cos(toRad(latitude2)) * Math.sin(dLng / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function buildQueries(itemTitle: string, dayTitle: string | null, destinationContext: string) {
  const normalized = itemTitle.replace(/\s+/g, ' ').trim()
  const stripped = normalized
    .replace(/^(Breakfast|Brunch|Lunch|Dinner)\s+at\s+/i, '')
    .replace(/^(Lunch|Dinner|Breakfast|Brunch)\s+near\s+/i, '')
    .replace(/^(Morning|Afternoon|Evening)\s+(at|in)\s+/i, '')
    .replace(/^(Explore|Visit|Tour|Walk through|Stroll through)\s+/i, '')
    .replace(/\s+(Tour|Visit|Experience)$/i, '')
    .trim()

  const dayContext = dayTitle?.trim() || ''
  const canonicalOverride = CANONICAL_PLACE_OVERRIDES.find((entry) => entry.pattern.test(normalized))?.query

  return Array.from(
    new Set(
      [
        canonicalOverride || '',
        normalized && destinationContext ? `${normalized}, ${destinationContext}` : normalized,
        stripped && destinationContext ? `${stripped}, ${destinationContext}` : stripped,
        stripped && dayContext && destinationContext ? `${stripped}, ${dayContext}, ${destinationContext}` : '',
        normalized.includes(destinationContext) ? normalized : '',
        stripped.includes(destinationContext) ? stripped : '',
      ].filter(Boolean)
    )
  )
}

async function upsertCanonicalPlace(supabase: any, override: CanonicalPlaceOverride) {
  if (
    !override.name ||
    !override.country ||
    !override.country_code ||
    typeof override.latitude !== 'number' ||
    typeof override.longitude !== 'number' ||
    !override.manualId
  ) {
    return null
  }

  const { data: place, error } = await supabase
    .from('places')
    .upsert(
      {
        name: override.name,
        country: override.country,
        country_code: override.country_code,
        latitude: override.latitude,
        longitude: override.longitude,
        mapbox_id: override.manualId,
      },
      { onConflict: 'mapbox_id' }
    )
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return place
}

async function computeAndStoreDayRoute(
  supabase: any,
  tripDayId: string,
  token: string,
  mode: 'walk' | 'drive' | 'transit' = 'walk'
) {
  const { data: items, error } = await supabase
    .from('trip_items')
    .select('place:places(latitude,longitude)')
    .eq('trip_day_id', tripDayId)
    .order('order_index', { ascending: true })

  if (error) throw new Error(error.message)

  const coords = (items || [])
    .map((item: any) => ({ latitude: item.place?.latitude, longitude: item.place?.longitude }))
    .filter((coord: any) => typeof coord.latitude === 'number' && typeof coord.longitude === 'number')

  if (coords.length < 2) {
    await supabase.from('trip_routes').delete().eq('trip_day_id', tripDayId).eq('mode', mode)
    return false
  }

  const route = await directionsGeojson(coords, token, mode)
  if (!route) return false

  const { error: routeErr } = await supabase
    .from('trip_routes')
    .upsert(
      {
        trip_day_id: tripDayId,
        geojson: route.geojson,
        distance_m: route.distance_m,
        duration_s: route.duration_s,
        mode,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'trip_day_id,mode' }
    )

  if (routeErr) throw new Error(routeErr.message)
  return true
}

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 500 })
  }

  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('id,title,user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (tripErr) return NextResponse.json({ error: tripErr.message }, { status: 500 })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: tripDays, error: daysErr } = await supabase
    .from('trip_days')
    .select('id,day_index,title')
    .eq('trip_id', id)
    .order('day_index', { ascending: true })

  if (daysErr) return NextResponse.json({ error: daysErr.message }, { status: 500 })

  const destinationContext = extractTripContext(trip.title)
  const destinationPlace = destinationContext
    ? await geocodePlace(destinationContext, token)
    : null

  let geocodedItems = 0
  let routeDays = 0

  for (const day of tripDays || []) {
    const dayFallbackPlace =
      destinationContext && day.title
        ? await geocodePlace(`${day.title}, ${destinationContext}`, token)
        : null

    const { data: items, error: itemsErr } = await supabase
      .from('trip_items')
      .select('id,title,type,place_id,place:places(id,name,country,latitude,longitude)')
      .eq('trip_day_id', day.id)
      .order('order_index', { ascending: true })

    if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

    for (const item of items || []) {
      if (!['activity', 'meal', 'lodging'].includes(item.type)) continue
      const canonicalOverride = CANONICAL_PLACE_OVERRIDES.find((entry) => entry.pattern.test(item.title))

      const currentPlace = Array.isArray(item.place) ? item.place[0] : item.place
      const currentDistanceKm =
        destinationPlace &&
        typeof currentPlace?.latitude === 'number' &&
        typeof currentPlace?.longitude === 'number'
          ? haversineKm(
              currentPlace.latitude,
              currentPlace.longitude,
              destinationPlace.latitude,
              destinationPlace.longitude
            )
          : null

      const shouldRepair =
        canonicalOverride != null ||
        !item.place_id ||
        (destinationPlace != null && currentDistanceKm != null && currentDistanceKm > 30)

      if (!shouldRepair) continue

      let resolvedPlace: any = null
      if (canonicalOverride?.manualId) {
        resolvedPlace = await upsertCanonicalPlace(supabase, canonicalOverride)
      }

      for (const query of buildQueries(item.title, day.title, destinationContext)) {
        if (resolvedPlace) break
        const result = await geocodePlace(query, token)
        if (!result) continue

        if (
          destinationPlace &&
          haversineKm(result.latitude, result.longitude, destinationPlace.latitude, destinationPlace.longitude) > 30
        ) {
          continue
        }

        const { data: place, error: placeErr } = await supabase
          .from('places')
          .upsert(
            {
              name: result.name,
              country: result.country,
              country_code: result.country_code || null,
              latitude: result.latitude,
              longitude: result.longitude,
              mapbox_id: result.mapbox_place_id,
            },
            { onConflict: 'mapbox_id' }
          )
          .select('id')
          .single()

        if (placeErr) {
          return NextResponse.json({ error: placeErr.message }, { status: 500 })
        }

        resolvedPlace = place
        break
      }

      if (!resolvedPlace && dayFallbackPlace) {
        const { data: place, error: placeErr } = await supabase
          .from('places')
          .upsert(
            {
              name: dayFallbackPlace.name,
              country: dayFallbackPlace.country,
              country_code: dayFallbackPlace.country_code || null,
              latitude: dayFallbackPlace.latitude,
              longitude: dayFallbackPlace.longitude,
              mapbox_id: dayFallbackPlace.mapbox_place_id,
            },
            { onConflict: 'mapbox_id' }
          )
          .select('id')
          .single()

        if (placeErr) return NextResponse.json({ error: placeErr.message }, { status: 500 })
        resolvedPlace = place
      }

      if (!resolvedPlace && destinationPlace) {
        const { data: place, error: placeErr } = await supabase
          .from('places')
          .upsert(
            {
              name: destinationPlace.name,
              country: destinationPlace.country,
              country_code: destinationPlace.country_code || null,
              latitude: destinationPlace.latitude,
              longitude: destinationPlace.longitude,
              mapbox_id: destinationPlace.mapbox_place_id,
            },
            { onConflict: 'mapbox_id' }
          )
          .select('id')
          .single()

        if (placeErr) return NextResponse.json({ error: placeErr.message }, { status: 500 })
        resolvedPlace = place
      }

      if (!resolvedPlace?.id) continue

      const { error: updateErr } = await supabase
        .from('trip_items')
        .update({ place_id: resolvedPlace.id, updated_at: new Date().toISOString() })
        .eq('id', item.id)

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
      geocodedItems += 1
    }

    const routeCreated = await computeAndStoreDayRoute(supabase, day.id, token, 'walk')
    if (routeCreated) routeDays += 1
  }

  return NextResponse.json({ ok: true, geocodedItems, routeDays })
}
