import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const ownerUserId = process.env.QA_OWNER_USER_ID
const cleanupTripIds = (process.env.QA_CLEANUP_TRIP_IDS || process.env.QA_CLEANUP_TRIP_ID || '')
  .split(/[\s,]+/)
  .map((tripId) => tripId.trim())
  .filter(Boolean)
const cleanupRunId = process.env.QA_CLEANUP_RUN_ID
const runId = process.env.QA_RUN_ID || randomUUID().slice(0, 8)

async function loadDotEnv() {
  const envPath = resolve(root, '.env.local')
  let text = ''

  try {
    text = await readFile(envPath, 'utf8')
  } catch {
    return
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key]) continue
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

await loadDotEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for qa:share-fixtures.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function cleanupFixtures() {
  const result = {
    mode: 'cleanup',
    tripIds: cleanupTripIds,
    runId: cleanupRunId || null,
    tripsDeleted: 0,
    placesDeleted: 0,
    ok: true,
    errors: [],
  }

  if (cleanupTripIds.length) {
    const { error, count } = await supabase
      .from('trips')
      .delete({ count: 'exact' })
      .in('id', cleanupTripIds)

    result.tripsDeleted = count || 0
    if (error) result.errors.push(error.message)
  }

  if (cleanupRunId) {
    const { error, count } = await supabase
      .from('places')
      .delete({ count: 'exact' })
      .ilike('name', `%${cleanupRunId}%`)

    result.placesDeleted = count || 0
    if (error) result.errors.push(error.message)
  }

  result.ok = result.errors.length === 0
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.ok ? 0 : 1)
}

if (cleanupTripIds.length || cleanupRunId) {
  await cleanupFixtures()
}

if (!ownerUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerUserId)) {
  console.error('QA_OWNER_USER_ID must be set to a local profile user id for qa:share-fixtures.')
  process.exit(1)
}

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id,display_name,username')
  .eq('id', ownerUserId)
  .single()

if (profileError || !profile) {
  console.error(`No profile found for QA_OWNER_USER_ID=${ownerUserId}.`)
  process.exit(1)
}

const fixtureDefinitions = [
  {
    key: 'lisbon',
    promptFixtureId: 'lisbon-3-day-friends-nightlife',
    title: 'QA 3 Days in Lisbon',
    destinationQuery: 'Lisbon, Portugal',
    travelers: 4,
    days: [
      {
        title: 'Alfama arrival',
        route: { distance_m: 1800, duration_s: 1500 },
        items: [
          ['activity', 'QA Lisbon Miradouro da Graca', 38.7169, -9.1306, '09:30', 'Portugal', 'PT'],
          ['meal', 'QA Lisbon Alfama Lunch', 38.7117, -9.1296, '12:00', 'Portugal', 'PT'],
        ],
      },
      {
        title: 'Belém and riverfront',
        route: { distance_m: 2400, duration_s: 2100 },
        items: [
          ['activity', 'QA Lisbon Jeronimos Monastery', 38.6979, -9.2068, '10:00', 'Portugal', 'PT'],
          ['meal', 'QA Lisbon Pasteis de Belem', 38.6975, -9.2033, '12:00', 'Portugal', 'PT'],
          ['activity', 'QA Lisbon MAAT River Walk', 38.6958, -9.1943, '14:30', 'Portugal', 'PT'],
        ],
      },
      {
        title: 'Chiado finale',
        route: { distance_m: 1500, duration_s: 1260 },
        items: [
          ['activity', 'QA Lisbon Carmo Convent', 38.7121, -9.1406, '10:00', 'Portugal', 'PT'],
          ['meal', 'QA Lisbon Time Out Market', 38.7067, -9.1454, '12:30', 'Portugal', 'PT'],
        ],
      },
    ],
  },
  {
    key: 'porto',
    promptFixtureId: 'porto-1-day-food-viewpoints',
    title: 'QA 1 Day in Porto',
    destinationQuery: 'Porto, Portugal',
    travelers: 2,
    days: [
      {
        title: 'Ribeira food and viewpoints',
        route: { distance_m: 1800, duration_s: 1500 },
        items: [
          ['activity', 'QA Porto Clerigos Tower View', 41.1458, -8.6145, '10:00', 'Portugal', 'PT'],
          ['meal', 'QA Porto Bolhao Market Lunch', 41.1494, -8.6074, '12:30', 'Portugal', 'PT'],
          ['activity', 'QA Porto Ribeira Sunset Walk', 41.1409, -8.6110, '16:00', 'Portugal', 'PT'],
        ],
      },
    ],
  },
  {
    key: 'mexico-city',
    promptFixtureId: 'mexico-city-4-day-food-museums-nightlife',
    title: 'QA 4 Days in Mexico City',
    destinationQuery: 'Mexico City, Mexico',
    travelers: 5,
    days: [
      {
        title: 'Roma and Condesa food',
        route: { distance_m: 1700, duration_s: 1440 },
        items: [
          ['meal', 'QA Mexico City Roma Breakfast', 19.4194, -99.1627, '09:30', 'Mexico', 'MX'],
          ['activity', 'QA Mexico City Parque Mexico', 19.4117, -99.1693, '11:30', 'Mexico', 'MX'],
          ['meal', 'QA Mexico City Condesa Dinner', 19.4148, -99.1755, '19:00', 'Mexico', 'MX'],
        ],
      },
      {
        title: 'Historic center',
        route: { distance_m: 2100, duration_s: 1980 },
        items: [
          ['activity', 'QA Mexico City Templo Mayor', 19.4342, -99.1311, '10:00', 'Mexico', 'MX'],
          ['activity', 'QA Mexico City Palacio de Bellas Artes', 19.4352, -99.1412, '13:00', 'Mexico', 'MX'],
        ],
      },
      {
        title: 'Museums and Chapultepec',
        route: { distance_m: 2300, duration_s: 2100 },
        items: [
          ['activity', 'QA Mexico City Anthropology Museum', 19.4260, -99.1862, '10:00', 'Mexico', 'MX'],
          ['activity', 'QA Mexico City Chapultepec Castle', 19.4204, -99.1819, '13:00', 'Mexico', 'MX'],
        ],
      },
      {
        title: 'Coyoacan and one big night',
        route: { distance_m: 2500, duration_s: 2400 },
        items: [
          ['activity', 'QA Mexico City Frida Kahlo Museum', 19.3552, -99.1626, '10:30', 'Mexico', 'MX'],
          ['meal', 'QA Mexico City Coyoacan Dinner', 19.3488, -99.1622, '18:30', 'Mexico', 'MX'],
          ['activity', 'QA Mexico City Late Night Mezcal', 19.4140, -99.1659, '21:30', 'Mexico', 'MX'],
        ],
      },
    ],
  },
  {
    key: 'tokyo',
    promptFixtureId: 'tokyo-3-day-calm-evening',
    title: 'QA 3 Days in Tokyo',
    destinationQuery: 'Tokyo, Japan',
    travelers: 3,
    days: [
      {
        title: 'First-time west side',
        route: { distance_m: 2100, duration_s: 1900 },
        items: [
          ['activity', 'QA Tokyo Meiji Shrine', 35.6764, 139.6993, '09:30', 'Japan', 'JP'],
          ['meal', 'QA Tokyo Harajuku Lunch', 35.6702, 139.7036, '12:30', 'Japan', 'JP'],
        ],
      },
      {
        title: 'Asakusa and river',
        route: { distance_m: 1700, duration_s: 1500 },
        items: [
          ['activity', 'QA Tokyo Sensoji Temple', 35.7148, 139.7967, '10:00', 'Japan', 'JP'],
          ['activity', 'QA Tokyo Sumida River Walk', 35.7101, 139.8016, '14:00', 'Japan', 'JP'],
        ],
      },
      {
        title: 'Calm evening finale',
        route: { distance_m: 1600, duration_s: 1440 },
        items: [
          ['activity', 'QA Tokyo Nezu Museum Garden', 35.6628, 139.7170, '11:00', 'Japan', 'JP'],
          ['meal', 'QA Tokyo Aoyama Dinner', 35.6652, 139.7126, '18:30', 'Japan', 'JP'],
        ],
      },
    ],
  },
  {
    key: 'rome',
    promptFixtureId: 'rome-weekend-classics-drinks',
    title: 'QA Rome Weekend',
    destinationQuery: 'Rome, Italy',
    travelers: 4,
    days: [
      {
        title: 'Classic Rome',
        route: { distance_m: 2200, duration_s: 2100 },
        items: [
          ['activity', 'QA Rome Colosseum', 41.8902, 12.4922, '09:30', 'Italy', 'IT'],
          ['activity', 'QA Rome Roman Forum', 41.8925, 12.4853, '11:30', 'Italy', 'IT'],
          ['meal', 'QA Rome Monti Dinner', 41.8957, 12.4923, '20:00', 'Italy', 'IT'],
        ],
      },
      {
        title: 'Piazzas and late drinks',
        route: { distance_m: 1900, duration_s: 1800 },
        items: [
          ['activity', 'QA Rome Pantheon', 41.8986, 12.4769, '10:30', 'Italy', 'IT'],
          ['activity', 'QA Rome Piazza Navona', 41.8992, 12.4731, '13:00', 'Italy', 'IT'],
          ['activity', 'QA Rome Trastevere Drinks', 41.8894, 12.4663, '21:00', 'Italy', 'IT'],
        ],
      },
    ],
  },
  {
    key: 'barcelona',
    promptFixtureId: 'barcelona-3-day-budget-beaches',
    title: 'QA 3 Days in Barcelona',
    destinationQuery: 'Barcelona, Spain',
    travelers: 5,
    days: [
      {
        title: 'Gaudi and tapas',
        route: { distance_m: 2300, duration_s: 2100 },
        items: [
          ['activity', 'QA Barcelona Sagrada Familia', 41.4036, 2.1744, '09:30', 'Spain', 'ES'],
          ['meal', 'QA Barcelona Gracia Tapas', 41.4007, 2.1589, '13:00', 'Spain', 'ES'],
        ],
      },
      {
        title: 'Gothic quarter budget day',
        route: { distance_m: 1600, duration_s: 1440 },
        items: [
          ['activity', 'QA Barcelona Cathedral', 41.3839, 2.1763, '10:00', 'Spain', 'ES'],
          ['meal', 'QA Barcelona Boqueria Lunch', 41.3817, 2.1717, '12:30', 'Spain', 'ES'],
        ],
      },
      {
        title: 'Beach afternoon',
        route: { distance_m: 1800, duration_s: 1600 },
        items: [
          ['activity', 'QA Barcelona Barceloneta Beach', 41.3784, 2.1926, '11:00', 'Spain', 'ES'],
          ['meal', 'QA Barcelona Seafood Dinner', 41.3755, 2.1896, '19:00', 'Spain', 'ES'],
        ],
      },
    ],
  },
  {
    key: 'london',
    promptFixtureId: 'london-3-day-rain-safe',
    title: 'QA 3 Days in London',
    destinationQuery: 'London, United Kingdom',
    travelers: 4,
    days: [
      {
        title: 'Rain-safe museums',
        route: { distance_m: 2100, duration_s: 1900 },
        items: [
          ['activity', 'QA London British Museum', 51.5194, -0.1270, '10:00', 'United Kingdom', 'GB'],
          ['meal', 'QA London Covent Garden Lunch', 51.5117, -0.1230, '13:00', 'United Kingdom', 'GB'],
        ],
      },
      {
        title: 'Markets and South Bank',
        route: { distance_m: 2400, duration_s: 2200 },
        items: [
          ['meal', 'QA London Borough Market', 51.5055, -0.0910, '11:00', 'United Kingdom', 'GB'],
          ['activity', 'QA London Tate Modern', 51.5076, -0.0994, '14:00', 'United Kingdom', 'GB'],
        ],
      },
      {
        title: 'Mixed-energy finale',
        route: { distance_m: 1700, duration_s: 1500 },
        items: [
          ['activity', 'QA London Notting Hill Walk', 51.5136, -0.2006, '10:30', 'United Kingdom', 'GB'],
          ['meal', 'QA London Soho Dinner', 51.5137, -0.1365, '19:00', 'United Kingdom', 'GB'],
        ],
      },
    ],
  },
  {
    key: 'paris',
    promptFixtureId: 'paris-4-day-couples-premium',
    title: 'QA 4 Days in Paris',
    destinationQuery: 'Paris, France',
    travelers: 4,
    days: [
      {
        title: 'Left Bank arrival',
        route: { distance_m: 1800, duration_s: 1600 },
        items: [
          ['activity', 'QA Paris Luxembourg Gardens', 48.8462, 2.3372, '10:30', 'France', 'FR'],
          ['meal', 'QA Paris Saint Germain Lunch', 48.8543, 2.3336, '13:00', 'France', 'FR'],
        ],
      },
      {
        title: 'Art without the obvious',
        route: { distance_m: 2000, duration_s: 1800 },
        items: [
          ['activity', 'QA Paris Musee Rodin', 48.8554, 2.3158, '10:00', 'France', 'FR'],
          ['meal', 'QA Paris Rue Cler Dinner', 48.8575, 2.3068, '19:30', 'France', 'FR'],
        ],
      },
      {
        title: 'Canal and neighborhoods',
        route: { distance_m: 2300, duration_s: 2100 },
        items: [
          ['activity', 'QA Paris Canal Saint Martin', 48.8720, 2.3650, '11:00', 'France', 'FR'],
          ['meal', 'QA Paris Marais Dinner', 48.8575, 2.3580, '20:00', 'France', 'FR'],
        ],
      },
      {
        title: 'Premium dinner night',
        route: { distance_m: 1500, duration_s: 1200 },
        items: [
          ['activity', 'QA Paris Palais Royal', 48.8638, 2.3371, '11:00', 'France', 'FR'],
          ['meal', 'QA Paris Premium Dinner', 48.8686, 2.3305, '20:00', 'France', 'FR'],
        ],
      },
    ],
  },
  {
    key: 'copenhagen',
    promptFixtureId: 'copenhagen-2-day-design-food',
    title: 'QA 2 Days in Copenhagen',
    destinationQuery: 'Copenhagen, Denmark',
    travelers: 2,
    days: [
      {
        title: 'Design and bakeries',
        route: { distance_m: 1600, duration_s: 1320 },
        items: [
          ['meal', 'QA Copenhagen Bakery Morning', 55.6810, 12.5710, '09:30', 'Denmark', 'DK'],
          ['activity', 'QA Copenhagen Designmuseum', 55.6862, 12.5930, '12:00', 'Denmark', 'DK'],
        ],
      },
      {
        title: 'Bike-friendly harbor',
        route: { distance_m: 2200, duration_s: 1900 },
        items: [
          ['activity', 'QA Copenhagen Nyhavn Walk', 55.6797, 12.5900, '10:00', 'Denmark', 'DK'],
          ['meal', 'QA Copenhagen Food Market', 55.6772, 12.5775, '13:00', 'Denmark', 'DK'],
        ],
      },
    ],
  },
  {
    key: 'berlin',
    promptFixtureId: 'berlin-3-day-nightlife-culture',
    title: 'QA 3 Days in Berlin',
    destinationQuery: 'Berlin, Germany',
    travelers: 4,
    days: [
      {
        title: 'Museum Island culture',
        route: { distance_m: 1700, duration_s: 1500 },
        items: [
          ['activity', 'QA Berlin Museum Island', 52.5169, 13.4010, '10:00', 'Germany', 'DE'],
          ['meal', 'QA Berlin Mitte Lunch', 52.5208, 13.4095, '13:00', 'Germany', 'DE'],
        ],
      },
      {
        title: 'Neighborhood day',
        route: { distance_m: 2100, duration_s: 1900 },
        items: [
          ['activity', 'QA Berlin East Side Gallery', 52.5050, 13.4397, '11:00', 'Germany', 'DE'],
          ['meal', 'QA Berlin Kreuzberg Dinner', 52.4996, 13.4314, '19:30', 'Germany', 'DE'],
        ],
      },
      {
        title: 'Serious nightlife',
        route: { distance_m: 1600, duration_s: 1500 },
        items: [
          ['activity', 'QA Berlin Tempelhofer Feld', 52.4730, 13.4039, '14:00', 'Germany', 'DE'],
          ['activity', 'QA Berlin Nightlife Stop', 52.5110, 13.4549, '22:00', 'Germany', 'DE'],
        ],
      },
    ],
  },
]

const createdTrips = []
const createdPlaces = []

async function createFixture(definition, index) {
  const shareSlug = `qa${runId}${index + 1}`
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      user_id: ownerUserId,
      title: `${definition.title} ${runId}`,
      travelers_count: definition.travelers,
      pace: 'balanced',
      budget_level: 'mid',
      constraints: {
        qa: true,
        publicShareFixture: true,
        runId,
        destination_query: definition.destinationQuery,
        days: definition.days.length,
      },
      is_public: true,
      share_slug: shareSlug,
    })
    .select('id,title,share_slug')
    .single()

  if (tripError) throw new Error(tripError.message)
  createdTrips.push(trip.id)

  const { data: days, error: daysError } = await supabase
    .from('trip_days')
    .insert(definition.days.map((day, dayIndex) => ({
      trip_id: trip.id,
      day_index: dayIndex + 1,
      title: day.title,
    })))
    .select('id,day_index')
    .order('day_index', { ascending: true })

  if (daysError) throw new Error(daysError.message)

  const placePayload = definition.days.flatMap((day, dayIndex) =>
    day.items.map((item, itemIndex) => {
      const [, name, latitude, longitude,, country, countryCode] = item
      const key = `${definition.key}-${runId}-${dayIndex + 1}-${itemIndex + 1}`
      return {
        name: `${name} ${runId}`,
        country,
        country_code: countryCode,
        latitude,
        longitude,
        mapbox_id: `qa-share-${key}`,
      }
    })
  )

  const { data: places, error: placesError } = await supabase
    .from('places')
    .insert(placePayload)
    .select('id,name,mapbox_id,latitude,longitude')

  if (placesError) throw new Error(placesError.message)
  createdPlaces.push(...places.map((place) => place.id))

  const placeByMapboxId = new Map(places.map((place) => [place.mapbox_id, place]))
  const dayByIndex = new Map(days.map((day) => [day.day_index, day]))
  const itemPayload = definition.days.flatMap((day, dayIndex) =>
    day.items.map((item, itemIndex) => {
      const [type, name,,, startTime] = item
      const key = `${definition.key}-${runId}-${dayIndex + 1}-${itemIndex + 1}`
      const place = placeByMapboxId.get(`qa-share-${key}`)
      return {
        trip_day_id: dayByIndex.get(dayIndex + 1).id,
        type,
        title: `${name} ${runId}`,
        place_id: place.id,
        start_time: startTime,
        duration_minutes: type === 'meal' ? 75 : 90,
        notes: `Public share fixture stop for ${definition.destinationQuery}.`,
        order_index: itemIndex,
      }
    })
  )

  const { error: itemError } = await supabase.from('trip_items').insert(itemPayload)
  if (itemError) throw new Error(itemError.message)

  const routePayload = definition.days.map((day, dayIndex) => {
    const coordinates = day.items.map((item) => [item[3], item[2]])
    return {
      trip_day_id: dayByIndex.get(dayIndex + 1).id,
      mode: 'walk',
      distance_m: day.route.distance_m,
      duration_s: day.route.duration_s,
      geojson: {
        type: 'Feature',
        properties: { qa: true, runId, fixture: definition.key, dayIndex: dayIndex + 1 },
        geometry: {
          type: 'LineString',
          coordinates,
        },
      },
    }
  })

  const { error: routeError } = await supabase.from('trip_routes').insert(routePayload)
  if (routeError) throw new Error(routeError.message)

  return {
    key: definition.key,
    promptFixtureId: definition.promptFixtureId || definition.key,
    tripId: trip.id,
    title: trip.title,
    shareSlug: trip.share_slug,
    dayCount: definition.days.length,
    itemCount: itemPayload.length,
    routeCount: routePayload.length,
  }
}

try {
  const fixtures = []
  for (const [index, definition] of fixtureDefinitions.entries()) {
    fixtures.push(await createFixture(definition, index))
  }

  console.log(JSON.stringify({
    mode: 'create',
    ok: true,
    owner: profile,
    runId,
    fixtures,
    shareSlugs: fixtures.map((fixture) => fixture.shareSlug),
    promptSuiteShareMap: fixtures.map((fixture) => `${fixture.promptFixtureId}=${fixture.shareSlug}`).join(','),
    cleanupCommand: `QA_CLEANUP_TRIP_IDS=${fixtures.map((fixture) => fixture.tripId).join(',')} QA_CLEANUP_RUN_ID=${runId} npm run qa:share-fixtures`,
  }, null, 2))
} catch (error) {
  if (createdTrips.length || createdPlaces.length) {
    await supabase.from('trips').delete().in('id', createdTrips)
    await supabase.from('places').delete().in('id', createdPlaces)
  }
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
