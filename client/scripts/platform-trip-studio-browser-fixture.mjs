import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const ownerUserId = process.env.QA_OWNER_USER_ID
const cleanupTripId = process.env.QA_CLEANUP_TRIP_ID
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
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for qa:studio-browser-fixture.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function cleanupFixture() {
  const result = {
    mode: 'cleanup',
    tripId: cleanupTripId || null,
    runId: cleanupRunId || null,
    tripDeleted: false,
    placesDeleted: false,
    ok: true,
    errors: [],
  }

  if (cleanupTripId) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', cleanupTripId)

    result.tripDeleted = !error
    if (error) result.errors.push(error.message)
  }

  if (cleanupRunId) {
    const { error } = await supabase
      .from('places')
      .delete()
      .ilike('name', `%${cleanupRunId}%`)

    result.placesDeleted = !error
    if (error) result.errors.push(error.message)
  }

  result.ok = result.errors.length === 0
  console.log(JSON.stringify(result, null, 2))
  process.exit(result.ok ? 0 : 1)
}

if (cleanupTripId || cleanupRunId) {
  await cleanupFixture()
}

if (!ownerUserId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerUserId)) {
  console.error('QA_OWNER_USER_ID must be set to the Browser profile user id for qa:studio-browser-fixture.')
  process.exit(1)
}

const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('id,display_name,username')
  .eq('id', ownerUserId)
  .single()

if (profileError || !profile) {
  console.error(`No profile found for QA_OWNER_USER_ID=${ownerUserId}. Open /api/profile in Browser and use that id.`)
  process.exit(1)
}

const placesPayload = [
  {
    name: `QA Browser Acropolis Museum ${runId}`,
    country: 'Greece',
    country_code: 'GR',
    latitude: 37.9684,
    longitude: 23.7285,
    mapbox_id: `qa-browser-studio-${runId}-acropolis`,
  },
  {
    name: `QA Browser Plaka Cafe ${runId}`,
    country: 'Greece',
    country_code: 'GR',
    latitude: 37.973,
    longitude: 23.7308,
    mapbox_id: `qa-browser-studio-${runId}-plaka`,
  },
  {
    name: `QA Browser Lycabettus View ${runId}`,
    country: 'Greece',
    country_code: 'GR',
    latitude: 37.9818,
    longitude: 23.7431,
    mapbox_id: `qa-browser-studio-${runId}-lycabettus`,
  },
  {
    name: `QA Browser Piraeus Ferry ${runId}`,
    country: 'Greece',
    country_code: 'GR',
    latitude: 37.9429,
    longitude: 23.6469,
    mapbox_id: `qa-browser-studio-${runId}-piraeus`,
  },
]

const { data: trip, error: tripError } = await supabase
  .from('trips')
  .insert({
    user_id: ownerUserId,
    title: `QA Browser Studio ${runId}`,
    travelers_count: 3,
    pace: 'balanced',
    budget_level: 'mid',
    constraints: { qa: true, browserActionFixture: true, runId, days: 2, destination_query: 'Athens, Greece' },
    share_slug: `qa${runId}`,
  })
  .select('id,title,share_slug')
  .single()

if (tripError) {
  console.error(tripError.message)
  process.exit(1)
}

const dayPayload = [1, 2].map((dayIndex) => ({ trip_id: trip.id, day_index: dayIndex }))
const { data: days, error: daysError } = await supabase
  .from('trip_days')
  .insert(dayPayload)
  .select('id,day_index')
  .order('day_index', { ascending: true })

if (daysError) {
  console.error(daysError.message)
  process.exit(1)
}

const { data: places, error: placesError } = await supabase
  .from('places')
  .insert(placesPayload)
  .select('id,name,mapbox_id')

if (placesError) {
  console.error(placesError.message)
  process.exit(1)
}

const placeByKey = new Map(places.map((place) => [place.mapbox_id, place]))
const dayOne = days.find((day) => day.day_index === 1)
const dayTwo = days.find((day) => day.day_index === 2)

const itemPayload = [
  {
    trip_day_id: dayOne.id,
    type: 'activity',
    title: `QA Browser Acropolis Museum ${runId}`,
    place_id: placeByKey.get(`qa-browser-studio-${runId}-acropolis`).id,
    start_time: '09:00',
    end_time: '10:30',
    duration_minutes: 90,
    notes: 'Browser fixture stop for click and type QA.',
    order_index: 0,
  },
  {
    trip_day_id: dayOne.id,
    type: 'meal',
    title: `QA Browser Plaka Cafe ${runId}`,
    place_id: placeByKey.get(`qa-browser-studio-${runId}-plaka`).id,
    start_time: '11:00',
    end_time: '12:00',
    duration_minutes: 60,
    notes: 'Browser fixture meal for click and type QA.',
    order_index: 1,
  },
  {
    trip_day_id: dayOne.id,
    type: 'activity',
    title: `QA Browser Lycabettus View ${runId}`,
    place_id: placeByKey.get(`qa-browser-studio-${runId}-lycabettus`).id,
    start_time: '13:00',
    end_time: '14:00',
    duration_minutes: 60,
    notes: 'Browser fixture viewpoint for click and type QA.',
    order_index: 2,
  },
  {
    trip_day_id: dayTwo.id,
    type: 'activity',
    title: `QA Browser Piraeus Ferry ${runId}`,
    place_id: placeByKey.get(`qa-browser-studio-${runId}-piraeus`).id,
    start_time: '10:00',
    end_time: '11:00',
    duration_minutes: 60,
    notes: 'Browser fixture second-day stop for click and type QA.',
    order_index: 0,
  },
]

const { data: items, error: itemsError } = await supabase
  .from('trip_items')
  .insert(itemPayload)
  .select('id,title,trip_day_id,order_index')

if (itemsError) {
  console.error(itemsError.message)
  process.exit(1)
}

const routePayload = [
  {
    trip_day_id: dayOne.id,
    mode: 'walk',
    distance_m: 2100,
    duration_s: 1800,
    geojson: {
      type: 'Feature',
      properties: { qa: true, runId },
      geometry: {
        type: 'LineString',
        coordinates: [
          [23.7285, 37.9684],
          [23.7308, 37.973],
          [23.7431, 37.9818],
        ],
      },
    },
  },
  {
    trip_day_id: dayTwo.id,
    mode: 'walk',
    distance_m: 900,
    duration_s: 720,
    geojson: {
      type: 'Feature',
      properties: { qa: true, runId },
      geometry: {
        type: 'LineString',
        coordinates: [
          [23.6469, 37.9429],
          [23.6504, 37.9442],
        ],
      },
    },
  },
]

const { data: routes, error: routesError } = await supabase
  .from('trip_routes')
  .insert(routePayload)
  .select('trip_day_id,mode,distance_m')

if (routesError) {
  console.error(routesError.message)
  process.exit(1)
}

console.log(JSON.stringify({
  mode: 'create',
  ok: true,
  owner: profile,
  runId,
  tripId: trip.id,
  shareSlug: trip.share_slug,
  title: trip.title,
  dayCount: days.length,
  placeCount: places.length,
  itemCount: items.length,
  routeCount: routes.length,
  cleanupCommand: `QA_CLEANUP_TRIP_ID=${trip.id} QA_CLEANUP_RUN_ID=${runId} npm run qa:studio-browser-fixture`,
}, null, 2))
