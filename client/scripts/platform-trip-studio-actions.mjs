import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const keepFixture = process.env.QA_KEEP_FIXTURE === '1'
const allowRemote = process.env.QA_ALLOW_REMOTE_MUTATION === '1'
const cleanupTripId = process.env.QA_CLEANUP_TRIP_ID
const cleanupRunId = process.env.QA_CLEANUP_RUN_ID
const cleanupGuestId = process.env.QA_CLEANUP_GUEST_ID
const authMode = process.env.QA_AUTH_MODE === 'dev' ? 'dev' : 'guest'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const runId = (process.env.QA_RUN_ID || randomUUID().slice(0, 8)).slice(0, 24)
const guestId = authMode === 'guest' ? process.env.QA_GUEST_ID || randomUUID() : null
const cookie = guestId ? `globe_travel_guest=${guestId}` : null
const results = []
const failures = []
const cleanup = {
  attempted: false,
  tripDeleted: false,
  placesDeleted: false,
  guestProfileDeleted: false,
  guestUserDeleted: false,
  error: null,
}
let createdTripId = null
let createdPlaceIds = []

if (!isLocalBaseUrl && !allowRemote) {
  console.error('qa:studio-actions mutates a disposable trip and only runs against localhost unless QA_ALLOW_REMOTE_MUTATION=1 is set.')
  process.exit(1)
}

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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for qa:studio-actions.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

async function cleanupGuestAccount(id, cleanupResult = null) {
  if (!id) return { profileDeleted: false, userDeleted: false, errors: [] }
  const errors = []

  if (!serviceRoleKey) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required to clean up disposable guest accounts.')
    return { profileDeleted: false, userDeleted: false, errors }
  }

  const serviceSupabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { error: profileError } = await serviceSupabase
    .from('profiles')
    .delete()
    .eq('id', id)
  const { error: userError } = await serviceSupabase.auth.admin.deleteUser(id)
  const userAlreadyAbsent = Boolean(userError?.message?.toLowerCase().includes('not found'))

  if (profileError) errors.push(profileError.message)
  if (userError && !userAlreadyAbsent) errors.push(userError.message)

  if (cleanupResult) {
    cleanupResult.guestId = id
    cleanupResult.guestProfileDeleted = !profileError
    cleanupResult.guestUserDeleted = !userError || userAlreadyAbsent
  }

  return {
    profileDeleted: !profileError,
    userDeleted: !userError || userAlreadyAbsent,
    errors,
  }
}

if (cleanupTripId || cleanupRunId || cleanupGuestId) {
  const cleanupResult = {
    mode: 'cleanup',
    tripId: cleanupTripId || null,
    runId: cleanupRunId || null,
    guestId: cleanupGuestId || null,
    tripDeleted: false,
    runTripsDeleted: false,
    placesDeleted: false,
    guestProfileDeleted: false,
    guestUserDeleted: false,
    ok: true,
    errors: [],
  }

  if (cleanupTripId) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', cleanupTripId)

    cleanupResult.tripDeleted = !error
    if (error) cleanupResult.errors.push(error.message)
  }

  if (cleanupRunId) {
    const { error: tripRunError } = await supabase
      .from('trips')
      .delete()
      .ilike('title', `%${cleanupRunId}%`)

    cleanupResult.runTripsDeleted = !tripRunError
    if (tripRunError) cleanupResult.errors.push(tripRunError.message)

    const { error } = await supabase
      .from('places')
      .delete()
      .ilike('name', `%${cleanupRunId}%`)

    cleanupResult.placesDeleted = !error
    if (error) cleanupResult.errors.push(error.message)
  }

  if (cleanupGuestId) {
    const guestCleanup = await cleanupGuestAccount(cleanupGuestId, cleanupResult)
    cleanupResult.errors.push(...guestCleanup.errors)
  }

  cleanupResult.ok = cleanupResult.errors.length === 0
  console.log(JSON.stringify(cleanupResult, null, 2))
  process.exit(cleanupResult.ok ? 0 : 1)
}

function record(name, ok, details = {}) {
  const result = { name, ok: Boolean(ok), ...details }
  results.push(result)
  if (!result.ok) failures.push(result)
  return result
}

function assertOk(name, ok, details = {}) {
  const result = record(name, ok, details)
  if (!ok) throw new Error(`${name} failed`)
  return result
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'user-agent': 'globe-travel-trip-studio-actions/1.0',
      ...(cookie ? { cookie } : {}),
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let json = null

  try {
    json = JSON.parse(text)
  } catch {
    // handled by caller
  }

  return { response, text, json }
}

async function createFixtureTrip() {
  const created = await fetchJson('/api/trips', {
    method: 'POST',
    body: JSON.stringify({
      title: `QA Trip Studio Actions ${runId}`,
      travelers_count: 3,
      pace: 'balanced',
      budget_level: 'mid',
      constraints: { days: 2, qa: true, runId, destination_query: 'Athens, Greece' },
    }),
  })

  assertOk('create disposable guest trip', created.response.ok && created.json?.tripId, {
    status: created.response.status,
    tripId: created.json?.tripId,
  })

  const tripId = created.json.tripId
  createdTripId = tripId
  const { data: days, error: daysError } = await supabase
    .from('trip_days')
    .select('id,day_index')
    .eq('trip_id', tripId)
    .order('day_index', { ascending: true })

  if (daysError) throw new Error(daysError.message)
  assertOk('fixture has two days', Array.isArray(days) && days.length === 2, { dayCount: days?.length || 0 })

  const placesPayload = [
    {
      name: `QA Acropolis Museum ${runId}`,
      country: 'Greece',
      country_code: 'GR',
      latitude: 37.9684,
      longitude: 23.7285,
      mapbox_id: `qa-trip-actions-${runId}-acropolis`,
    },
    {
      name: `QA Plaka Cafe ${runId}`,
      country: 'Greece',
      country_code: 'GR',
      latitude: 37.973,
      longitude: 23.7308,
      mapbox_id: `qa-trip-actions-${runId}-plaka`,
    },
    {
      name: `QA Lycabettus View ${runId}`,
      country: 'Greece',
      country_code: 'GR',
      latitude: 37.9818,
      longitude: 23.7431,
      mapbox_id: `qa-trip-actions-${runId}-lycabettus`,
    },
    {
      name: `QA Piraeus Ferry ${runId}`,
      country: 'Greece',
      country_code: 'GR',
      latitude: 37.9429,
      longitude: 23.6469,
      mapbox_id: `qa-trip-actions-${runId}-piraeus`,
    },
  ]

  const { data: places, error: placesError } = await supabase
    .from('places')
    .insert(placesPayload)
    .select('id,name,mapbox_id')

  if (placesError) throw new Error(placesError.message)
  createdPlaceIds = places.map((place) => place.id)
  assertOk('fixture places inserted', Array.isArray(places) && places.length === placesPayload.length, {
    placeCount: places?.length || 0,
  })

  const placeByKey = new Map(places.map((place) => [place.mapbox_id, place]))
  const dayOne = days.find((day) => day.day_index === 1)
  const dayTwo = days.find((day) => day.day_index === 2)
  const itemPayload = [
    {
      trip_day_id: dayOne.id,
      type: 'activity',
      title: `QA Acropolis Museum ${runId}`,
      place_id: placeByKey.get(`qa-trip-actions-${runId}-acropolis`).id,
      start_time: '09:00',
      end_time: '10:30',
      duration_minutes: 90,
      notes: 'Fixture stop for action QA.',
      order_index: 0,
    },
    {
      trip_day_id: dayOne.id,
      type: 'meal',
      title: `QA Plaka Cafe ${runId}`,
      place_id: placeByKey.get(`qa-trip-actions-${runId}-plaka`).id,
      start_time: '11:00',
      end_time: '12:00',
      duration_minutes: 60,
      notes: 'Fixture meal for action QA.',
      order_index: 1,
    },
    {
      trip_day_id: dayOne.id,
      type: 'activity',
      title: `QA Lycabettus View ${runId}`,
      place_id: placeByKey.get(`qa-trip-actions-${runId}-lycabettus`).id,
      start_time: '13:00',
      end_time: '14:00',
      duration_minutes: 60,
      notes: 'Fixture viewpoint for action QA.',
      order_index: 2,
    },
    {
      trip_day_id: dayTwo.id,
      type: 'activity',
      title: `QA Piraeus Ferry ${runId}`,
      place_id: placeByKey.get(`qa-trip-actions-${runId}-piraeus`).id,
      start_time: '10:00',
      end_time: '11:00',
      duration_minutes: 60,
      notes: 'Fixture second-day stop for action QA.',
      order_index: 0,
    },
  ]

  const { data: items, error: itemsError } = await supabase
    .from('trip_items')
    .insert(itemPayload)
    .select('id,title,trip_day_id,order_index')

  if (itemsError) throw new Error(itemsError.message)
  assertOk('fixture items inserted', Array.isArray(items) && items.length === itemPayload.length, {
    itemCount: items?.length || 0,
  })

  return { tripId, days, places, items }
}

async function readTrip(tripId) {
  const payload = await fetchJson(`/api/trips/${tripId}`, { method: 'GET' })
  if (!payload.response.ok) {
    throw new Error(payload.json?.error || payload.text || `Trip read failed with ${payload.response.status}`)
  }
  return payload.json
}

function findItem(tripPayload, titleIncludes) {
  return tripPayload.days
    .flatMap((day) => day.items.map((item) => ({ ...item, dayIndex: day.day_index })))
    .find((item) => item.title.includes(titleIncludes))
}

async function runActions(fixture) {
  const initial = await readTrip(fixture.tripId)
  const dayOne = initial.days.find((day) => day.day_index === 1)
  const dayTwo = initial.days.find((day) => day.day_index === 2)
  const initialDayOneIds = dayOne.items.map((item) => item.id)
  const firstItem = dayOne.items[0]
  const secondItem = dayOne.items[1]

  assertOk('fixture API returns mapped editable trip', initial.trip?.is_owner === true && dayOne.items.length === 3 && dayTwo.items.length === 1, {
    tripId: fixture.tripId,
    dayOneItems: dayOne.items.length,
    dayTwoItems: dayTwo.items.length,
    mappedItems: initial.days.flatMap((day) => day.items).filter((item) => item.place?.latitude && item.place?.longitude).length,
  })

  const updatedTitle = `${firstItem.title} Updated`
  const update = await fetchJson(`/api/trips/${fixture.tripId}/items/bulk`, {
    method: 'POST',
    body: JSON.stringify({
      ops: [{ op: 'update', item_id: firstItem.id, fields: { title: updatedTitle } }],
    }),
  })
  assertOk('bulk update item title', update.response.ok, { status: update.response.status })

  const afterUpdate = await readTrip(fixture.tripId)
  assertOk('updated item title persists', Boolean(findItem(afterUpdate, 'Updated')), { updatedTitle })

  const swapOptions = await fetchJson(`/api/trips/${fixture.tripId}/items/${secondItem.id}/swap`, {
    method: 'POST',
    body: JSON.stringify({ preference: 'quieter cafe or neighborhood reset' }),
  })
  const firstSwapOption = swapOptions.json?.options?.[0]
  assertOk('swap options return deterministic replacements', swapOptions.response.ok && firstSwapOption?.id, {
    status: swapOptions.response.status,
    optionCount: swapOptions.json?.options?.length || 0,
    firstOptionTitle: firstSwapOption?.title,
  })

  const applySwap = await fetchJson(`/api/trips/${fixture.tripId}/items/${secondItem.id}/swap`, {
    method: 'POST',
    body: JSON.stringify({
      preference: 'apply selected replacement',
      choiceId: firstSwapOption.id,
    }),
  })
  assertOk('apply selected swap replacement', applySwap.response.ok, {
    status: applySwap.response.status,
    choiceId: firstSwapOption.id,
    appliedTitle: applySwap.json?.item?.title,
  })

  const afterSwap = await readTrip(fixture.tripId)
  const swappedItem = afterSwap.days.flatMap((day) => day.items).find((item) => item.id === secondItem.id)
  assertOk('applied swap persists with mapped place', swappedItem?.title === firstSwapOption.title && Boolean(swappedItem?.place?.latitude), {
    expectedTitle: firstSwapOption.title,
    actualTitle: swappedItem?.title,
    mapped: Boolean(swappedItem?.place?.latitude && swappedItem?.place?.longitude),
  })

  const hydrate = await fetchJson(`/api/trips/${fixture.tripId}/hydrate-map`, { method: 'POST' })
  const mapboxConfigured = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN)
  const hydrateOk = mapboxConfigured
    ? hydrate.response.ok && Number.isFinite(hydrate.json?.routeDays)
    : hydrate.response.ok || hydrate.json?.error === 'Mapbox token not configured'
  assertOk('build maps completes or fails safely without Mapbox', hydrateOk, {
    status: hydrate.response.status,
    mapboxConfigured,
    geocodedItems: hydrate.json?.geocodedItems,
    routeDays: hydrate.json?.routeDays,
    error: hydrate.json?.error,
  })

  const afterHydrate = await readTrip(fixture.tripId)
  const routeCountAfterHydrate = afterHydrate.days.reduce((total, day) => total + (day.routes?.length || 0), 0)
  assertOk('build maps persists at least one usable route when Mapbox is configured', !mapboxConfigured || routeCountAfterHydrate > 0, {
    mapboxConfigured,
    routeCountAfterHydrate,
  })

  const reversedIds = [...initialDayOneIds].reverse()
  const reorder = await fetchJson(`/api/trips/${fixture.tripId}/items/bulk`, {
    method: 'POST',
    body: JSON.stringify({
      ops: [{ op: 'reorder', day_index: 1, ordered_item_ids: reversedIds }],
    }),
  })
  assertOk('bulk reorder day items', reorder.response.ok, { status: reorder.response.status })

  const afterReorder = await readTrip(fixture.tripId)
  const reorderedIds = afterReorder.days.find((day) => day.day_index === 1).items.map((item) => item.id)
  assertOk('reordered item order persists', JSON.stringify(reorderedIds) === JSON.stringify(reversedIds), {
    expected: reversedIds,
    actual: reorderedIds,
  })

  const move = await fetchJson(`/api/trips/${fixture.tripId}/items/bulk`, {
    method: 'POST',
    body: JSON.stringify({
      ops: [{ op: 'move', item_id: secondItem.id, to_day_index: 2, to_order_index: 0 }],
    }),
  })
  assertOk('bulk move item across days', move.response.ok, { status: move.response.status })

  const afterMove = await readTrip(fixture.tripId)
  const movedItem = afterMove.days.find((day) => day.day_index === 2).items[0]
  assertOk('moved item appears first on target day', movedItem?.id === secondItem.id, {
    movedItemId: movedItem?.id,
    expectedItemId: secondItem.id,
  })

  const remove = await fetchJson(`/api/trips/${fixture.tripId}/items/bulk`, {
    method: 'POST',
    body: JSON.stringify({
      ops: [{ op: 'delete', item_id: secondItem.id }],
    }),
  })
  assertOk('bulk delete moved item', remove.response.ok, { status: remove.response.status })

  const afterDelete = await readTrip(fixture.tripId)
  const deletedStillPresent = afterDelete.days.flatMap((day) => day.items).some((item) => item.id === secondItem.id)
  assertOk('deleted item is absent', !deletedStillPresent, { deletedItemId: secondItem.id })

  const optimize = await fetchJson(`/api/trips/${fixture.tripId}/days/1/optimize`, { method: 'POST' })
  const optimizeOk = mapboxConfigured
    ? optimize.response.ok && Array.isArray(optimize.json?.ordered_item_ids)
    : optimize.response.ok || optimize.json?.error === 'Mapbox token not configured'
  assertOk('optimize day completes or fails safely without Mapbox', optimizeOk, {
    status: optimize.response.status,
    mapboxConfigured,
    orderedItemCount: optimize.json?.ordered_item_ids?.length || 0,
    error: optimize.json?.error,
  })

  const savedTitle = `QA Trip Studio Actions ${runId} Saved`
  const save = await fetchJson(`/api/trips/${fixture.tripId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title: savedTitle }),
  })
  assertOk('save trip title', save.response.ok, { status: save.response.status })

  const afterSave = await readTrip(fixture.tripId)
  assertOk('saved trip title persists', afterSave.trip?.title === savedTitle, {
    expected: savedTitle,
    actual: afterSave.trip?.title,
  })

  const publish = await fetchJson(`/api/trips/${fixture.tripId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_public: true }),
  })
  assertOk('enable public share for disposable trip', publish.response.ok, { status: publish.response.status })

  const afterPublish = await readTrip(fixture.tripId)
  const share = await fetchJson(`/api/trips/share/${afterPublish.trip.share_slug}`)
  assertOk('public share API returns disposable trip', share.response.ok && share.json?.trip?.title === savedTitle, {
    status: share.response.status,
    shareSlug: afterPublish.trip.share_slug,
    tripTitle: share.json?.trip?.title,
  })

  return {
    tripId: fixture.tripId,
    shareSlug: afterPublish.trip.share_slug,
    finalTitle: savedTitle,
  }
}

async function cleanupFixture(fixture) {
  if (keepFixture) return
  if (!fixture && !createdTripId && createdPlaceIds.length === 0) return

  cleanup.attempted = true

  if (fixture?.tripId || createdTripId) {
    const { error: tripError } = await supabase
      .from('trips')
      .delete()
      .eq('id', fixture?.tripId || createdTripId)

    if (tripError) throw new Error(tripError.message)
    cleanup.tripDeleted = true
  }

  const placeIds = fixture?.places?.map((place) => place.id) || createdPlaceIds
  if (placeIds.length) {
    const { error: placesError } = await supabase
      .from('places')
      .delete()
      .in('id', placeIds)

    if (placesError) throw new Error(placesError.message)
    cleanup.placesDeleted = true
  }

  if (guestId) {
    const guestCleanup = await cleanupGuestAccount(guestId)
    cleanup.guestProfileDeleted = guestCleanup.profileDeleted
    cleanup.guestUserDeleted = guestCleanup.userDeleted
    if (guestCleanup.errors.length) throw new Error(guestCleanup.errors.join('; '))
  }
}

let fixture = null
let actionSummary = null

try {
  fixture = await createFixtureTrip()
  actionSummary = await runActions(fixture)
} catch (error) {
  record('studio action runner completed without unexpected exception', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  try {
    await cleanupFixture(fixture)
  } catch (error) {
    cleanup.error = error instanceof Error ? error.message : String(error)
    failures.push({ name: 'cleanup disposable Trip Studio fixture', ok: false, error: cleanup.error })
  }
}

const summary = {
  baseUrl,
  runId,
  authMode,
  guestId,
  keepFixture,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  fixture: actionSummary,
  cleanup,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
