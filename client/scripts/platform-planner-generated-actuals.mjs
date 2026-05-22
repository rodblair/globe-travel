import { randomUUID } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { extractDaysFromPrompt, extractDestinationFromPrompt } from '../lib/planner/runtime.ts'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const allowRemoteMutation = process.env.QA_ALLOW_REMOTE_MUTATION === '1'
const generatedActualPresets = {
  default: ['lisbon-3-day-friends-nightlife'],
  'launch-cities': [
    'lisbon-3-day-friends-nightlife',
    'porto-1-day-food-viewpoints',
    'mexico-city-4-day-food-museums-nightlife',
    'tokyo-3-day-calm-evening',
  ],
  'next-cities': [
    'rome-weekend-classics-drinks',
    'barcelona-3-day-budget-beaches',
    'london-3-day-rain-safe',
    'paris-4-day-couples-premium',
    'copenhagen-2-day-design-food',
    'berlin-3-day-nightlife-culture',
  ],
  'month2-cities': [
    'lisbon-3-day-friends-nightlife',
    'porto-1-day-food-viewpoints',
    'mexico-city-4-day-food-museums-nightlife',
    'tokyo-3-day-calm-evening',
    'rome-weekend-classics-drinks',
    'barcelona-3-day-budget-beaches',
    'london-3-day-rain-safe',
    'paris-4-day-couples-premium',
    'copenhagen-2-day-design-food',
    'berlin-3-day-nightlife-culture',
  ],
  'regional-edge-cities': [
    'istanbul-4-day-history-markets',
    'seoul-5-day-food-shopping',
    'bangkok-4-day-temples-street-food',
    'marrakech-3-day-markets-riads',
    'cape-town-5-day-outdoors-food',
    'sydney-4-day-beaches-neighborhoods',
  ],
  'beta-representative': [
    'athens-5-day-couples-rest',
    'lisbon-3-day-friends-nightlife',
    'barcelona-3-day-budget-beaches',
    'london-3-day-rain-safe',
    'paris-4-day-couples-premium',
    'new-york-3-day-repeat-visitors',
    'istanbul-4-day-history-markets',
    'seoul-5-day-food-shopping',
    'bangkok-4-day-temples-street-food',
    'marrakech-3-day-markets-riads',
    'cape-town-5-day-outdoors-food',
    'sydney-4-day-beaches-neighborhoods',
    'vancouver-3-day-outdoors-food',
    'rio-5-day-beach-nightlife',
    'reykjavik-4-day-outdoors',
    'crete-5-day-family-beaches',
    'singapore-3-day-family-food',
    'dubai-3-day-luxury-family',
    'madrid-seville-5-day-multi-city',
    'kyoto-3-day-solo-temples-food',
    'seattle-2-day-solo-coffee-music',
    'bali-5-day-solo-reset',
    'nairobi-4-day-solo-culture-nature',
    'washington-dc-3-day-museums-family',
    'mexico-city-4-day-food-museums-nightlife',
  ],
}
const explicitFixtureIds = Boolean(process.env.QA_GENERATED_ACTUAL_IDS)
const presetName = explicitFixtureIds ? null : (process.env.QA_GENERATED_ACTUAL_PRESET || 'default')
const presetFixtureIds = presetName ? generatedActualPresets[presetName] : null
const fixtureIdsInput = process.env.QA_GENERATED_ACTUAL_IDS || (presetFixtureIds || generatedActualPresets.default).join(',')
const fixtureIds = fixtureIdsInput
  .split(/[\s,]+/)
  .map((id) => id.trim())
  .filter(Boolean)
const outputPath = process.env.QA_GENERATED_ACTUALS_OUT
const keepGeneratedActuals = process.env.QA_KEEP_GENERATED_ACTUALS === '1'
const failures = []
const results = []

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

if (!isLocalBaseUrl && !allowRemoteMutation) {
  console.error('qa:planner-actuals creates disposable trips and only runs against localhost unless QA_ALLOW_REMOTE_MUTATION=1 is set.')
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

function record(name, ok, details = {}) {
  const result = { name, ok, ...details }
  results.push(result)
  if (!ok) failures.push(result)
  return result
}

function getSetCookieHeaders(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie()
  const cookie = headers.get('set-cookie')
  return cookie ? [cookie] : []
}

function cookieHeaderFromSetCookie(headers) {
  return getSetCookieHeaders(headers)
    .map((cookie) => cookie.split(';')[0])
    .filter(Boolean)
    .join('; ')
}

async function fetchWithRetry(path, init = {}, options = {}) {
  const method = String(init.method || 'GET').toUpperCase()
  const canRetry = method === 'GET' || method === 'HEAD' || method === 'PATCH' || options.retryUnsafe
  let lastError = null
  let lastResponse = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          'user-agent': 'globe-travel-planner-generated-actuals/1.0',
          ...(init.headers || {}),
        },
      })
      lastResponse = response
      if (!canRetry || response.status < 500 || attempt === 3) return response
    } catch (error) {
      lastError = error
      if (!canRetry || attempt === 3) throw error
    }

    await sleep(750 * attempt)
  }

  if (lastResponse) return lastResponse
  throw lastError || new Error(`fetch failed for ${path}`)
}

async function fetchJson(path, init = {}, options = {}) {
  const response = await fetchWithRetry(path, init, options)
  const text = await response.text()
  let json = null

  try {
    json = JSON.parse(text)
  } catch {
    // handled by caller
  }

  return { response, text, json }
}

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeCountry(value) {
  const normalized = normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const aliases = {
    turkiye: 'turkey',
    'united states of america': 'united states',
    usa: 'united states',
    uk: 'united kingdom',
  }

  return aliases[normalized] || normalized
}

function distanceKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const value =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function hasGeographicOutlier(day) {
  const stops = (Array.isArray(day.mappedStops) ? day.mappedStops : [])
    .map((stop) => ({
      title: stop.title,
      type: stop.type,
      latitude: Number(stop.latitude),
      longitude: Number(stop.longitude),
    }))
    .filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude))
  const allowsLongTransfer = /train|flight|ferry|transfer|drive|road trip/i.test(`${day.title || ''} ${stops.map((stop) => stop.type).join(' ')}`)

  if (allowsLongTransfer || stops.length < 3) return false

  return stops.some((stop, index) => {
    const nearestKm = Math.min(...stops
      .filter((_, otherIndex) => otherIndex !== index)
      .map((otherStop) => distanceKm(stop, otherStop)))
    return nearestKm > 150
  })
}

function dayHasMapTrust(day, expectedCountry) {
  const itemCount = Number(day.itemCount) || 0
  const mappedItemCount = Number(day.mappedItemCount) || 0
  const uniqueMappedStopCount = Number(day.uniqueMappedStopCount) || 0
  const countries = Array.isArray(day.countries) ? day.countries : []
  const minimumUniqueStops = Math.min(itemCount, 1)

  return (
    Number.isInteger(day.dayIndex) &&
    itemCount > 0 &&
    mappedItemCount >= minimumUniqueStops &&
    uniqueMappedStopCount >= minimumUniqueStops &&
    !hasGeographicOutlier(day) &&
    countries.length > 0 &&
    countries.every((country) => normalizeCountry(country) === normalizeCountry(expectedCountry))
  )
}

function isRecoverablePlannerStreamError(error) {
  const message = error instanceof Error ? error.message : String(error)
  return /terminated|fetch failed|other side closed|socket|network/i.test(message)
}

async function retrySupabaseOperation(operation) {
  let lastError = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await operation()
      if (!result?.error) return result
      lastError = result.error
    } catch (error) {
      lastError = error
    }

    if (attempt < 3) await sleep(750 * attempt)
  }

  return { error: lastError || new Error('Supabase operation failed') }
}

function dayIntegrity(day) {
  const items = Array.isArray(day.items) ? day.items : []
  const mappedItems = items.filter((item) => (
    item.place &&
    Number.isFinite(item.place.latitude) &&
    Number.isFinite(item.place.longitude)
  ))
  const mappedStops = mappedItems.map((item) => ({
    title: item.title,
    type: item.type,
    placeName: item.place?.name || null,
    latitude: item.place?.latitude ?? null,
    longitude: item.place?.longitude ?? null,
  }))
  const countries = [...new Set(mappedItems.map((item) => item.place.country).filter(Boolean))]
  const routes = Array.isArray(day.routes) ? day.routes : []
  const usableRoutes = routes.filter((route) => (
    Number.isFinite(route.distance_m) &&
    route.distance_m > 0 &&
    route.distance_m <= 25000
  ))
  const mappedStopKeys = mappedItems.map((item) => {
    const lat = Number(item.place.latitude).toFixed(5)
    const lng = Number(item.place.longitude).toFixed(5)
    return `${lat},${lng}`
  })
  const seenStopKeys = new Set()
  const duplicateMappedStops = mappedItems
    .filter((item, index) => {
      const key = mappedStopKeys[index]
      if (seenStopKeys.has(key)) return true
      seenStopKeys.add(key)
      return false
    })
    .map((item) => ({
      title: item.title,
      placeName: item.place?.name || null,
    }))

  return {
    dayIndex: day.day_index,
    title: day.title,
    itemCount: items.length,
    mappedItemCount: mappedItems.length,
    mappedStops,
    unmappedItems: items
      .filter((item) => !item.place || !Number.isFinite(item.place.latitude) || !Number.isFinite(item.place.longitude))
      .map((item) => ({ title: item.title, type: item.type })),
    uniqueMappedStopCount: seenStopKeys.size,
    duplicateMappedStops,
    countries,
    usableRouteCount: usableRoutes.length,
    routeDistanceMeters: usableRoutes.map((route) => route.distance_m),
  }
}

function validateActual(fixture, actual) {
  const expected = fixture.expected
  const days = Array.isArray(actual.days) ? actual.days : []
  const expectedDayIndexes = Array.from({ length: expected.days }, (_, index) => index + 1)
  const actualDayIndexes = days.map((day) => day.dayIndex)
  const badDays = days.filter((day) => !dayHasMapTrust(day, expected.country))
  const titleDestinationOk = normalize(actual.tripTitle).includes(normalize(expected.destination))
  const dayIndexesOk =
    days.length === expected.days &&
    expectedDayIndexes.every((dayIndex, index) => actualDayIndexes[index] === dayIndex)

  return {
    ok: days.length === expected.days && titleDestinationOk && dayIndexesOk && badDays.length === 0,
    expectedDays: expected.days,
    actualDays: days.length,
    titleDestinationOk,
    expectedDayIndexes,
    actualDayIndexes,
    dayIndexesOk,
    badDays,
  }
}

async function cleanupTripAndGuest({ supabase, tripId, guestId }) {
  const result = {
    attempted: Boolean(supabase),
    tripId,
    guestId,
    tripDeleted: false,
    profileDeleted: false,
    userDeleted: false,
    errors: [],
  }

  if (!supabase) return result

  if (keepGeneratedActuals) {
    return { ...result, kept: true }
  }

  if (tripId) {
    const { error } = await retrySupabaseOperation(() => supabase.from('trips').delete().eq('id', tripId))
    result.tripDeleted = !error
    if (error) result.errors.push(error.message || String(error))
  }

  if (!tripId && guestId) {
    const { error } = await retrySupabaseOperation(() => supabase.from('trips').delete().eq('user_id', guestId))
    result.tripDeleted = !error
    if (error) result.errors.push(error.message || String(error))
  }

  if (guestId) {
    const { error: profileError } = await retrySupabaseOperation(() => supabase.from('profiles').delete().eq('id', guestId))
    const { error: userError } = await retrySupabaseOperation(() => supabase.auth.admin.deleteUser(guestId))
    const userAlreadyAbsent = userError?.message?.toLowerCase().includes('user not found')
    result.profileDeleted = !profileError
    result.userDeleted = !userError || Boolean(userAlreadyAbsent)
    if (profileError) result.errors.push(profileError.message || String(profileError))
    if (userError && !userAlreadyAbsent) result.errors.push(userError.message || String(userError))
  }

  return result
}

await loadDotEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
  : null
const fixtures = JSON.parse(await readFile(resolve(root, 'qa/planner-prompt-fixtures.json'), 'utf8'))
const fixturesById = new Map(fixtures.map((fixture) => [fixture.id, fixture]))
const selectedFixtures = fixtureIds.map((id) => fixturesById.get(id))

record('generated actual fixture ids resolve', selectedFixtures.every(Boolean), {
  preset: presetFixtureIds ? presetName : null,
  requested: fixtureIds,
  missing: fixtureIds.filter((id) => !fixturesById.has(id)),
})

const actuals = []
const cleanupResults = []

for (const fixture of selectedFixtures.filter(Boolean)) {
  const guestId = randomUUID()
  let tripId = null
  let shareSlug = null

  try {
    const guestStart = await fetchWithRetry(`/api/guest/start?id=${guestId}`, {
      redirect: 'manual',
    })
    const cookie = cookieHeaderFromSetCookie(guestStart.headers)
    if (!cookie) throw new Error('guest start did not set a guest cookie')

    const expectedDays = extractDaysFromPrompt(fixture.prompt) || fixture.expected.days
    const expectedDestination = extractDestinationFromPrompt(fixture.prompt) || fixture.expected.destination
    const created = await fetchJson(
      '/api/trips',
      {
        method: 'POST',
        headers: {
          cookie,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: `${expectedDays} ${expectedDays === 1 ? 'Day' : 'Days'} in ${expectedDestination}`,
          travelers_count: 4,
          pace: 'balanced',
          budget_level: 'mid',
          constraints: {
            days: expectedDays,
            destination_query: expectedDestination,
            group_vibe: 'Generated actual QA sample',
          },
        }),
      },
      { retryUnsafe: true }
    )

    if (!created.response.ok || !created.json?.tripId) {
      throw new Error(`draft creation failed: ${created.response.status} ${created.text.slice(0, 160)}`)
    }

    tripId = created.json.tripId
    shareSlug = created.json.shareSlug

    try {
      const chatResponse = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          cookie,
          'content-type': 'application/json',
          'user-agent': 'globe-travel-planner-generated-actuals/1.0',
        },
        body: JSON.stringify({
          type: 'plan',
          tripId,
          messages: [
            {
              id: `qa-${fixture.id}`,
              role: 'user',
              parts: [{ type: 'text', text: fixture.prompt }],
            },
          ],
        }),
      })
      const streamText = await chatResponse.text()
      if (!chatResponse.ok) {
        throw new Error(`planner chat failed: ${chatResponse.status} ${streamText.slice(0, 240)}`)
      }
    } catch (error) {
      if (!isRecoverablePlannerStreamError(error)) throw error
      await sleep(1500)
    }

    const hydration = await fetchJson(
      `/api/trips/${tripId}/hydrate-map`,
      {
        method: 'POST',
        headers: { cookie },
      },
      { retryUnsafe: true }
    )
    if (!hydration.response.ok || hydration.json?.ok !== true) {
      throw new Error(`map hydration failed: ${hydration.response.status} ${hydration.text.slice(0, 160)}`)
    }

    await fetchJson(`/api/trips/${tripId}`, {
      method: 'PATCH',
      headers: {
        cookie,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ is_public: true }),
    })

    const payload = await fetchJson(`/api/trips/${tripId}`, {
      headers: { cookie },
    })
    if (!payload.response.ok || !payload.json?.trip || !Array.isArray(payload.json?.days)) {
      throw new Error(`trip readback failed: ${payload.response.status} ${payload.text.slice(0, 160)}`)
    }

    const actual = {
      id: fixture.id,
      shareSlug,
      tripId,
      tripTitle: payload.json.trip.title,
      days: payload.json.days.map(dayIntegrity),
    }
    const validation = validateActual(fixture, actual)
    actuals.push(actual)

    record(`generated actual passes map trust: ${fixture.id}`, validation.ok, {
      tripId,
      shareSlug,
      tripTitle: actual.tripTitle,
      ...validation,
    })
  } catch (error) {
    record(`generated actual completed: ${fixture.id}`, false, {
      tripId,
      shareSlug,
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    cleanupResults.push(await cleanupTripAndGuest({ supabase, tripId, guestId }))
  }
}

if (outputPath) {
  await writeFile(resolve(root, outputPath), `${JSON.stringify(actuals, null, 2)}\n`)
}

record('generated actual cleanup completed', cleanupResults.every((result) => (
  result.attempted &&
  (!result.tripId || result.tripDeleted) &&
  result.profileDeleted &&
  result.userDeleted &&
  result.errors.length === 0
)), { cleanupResults })

const summary = {
  baseUrl,
  preset: presetFixtureIds ? presetName : null,
  fixtureIds,
  outputPath: outputPath || null,
  keepGeneratedActuals,
  actualsChecked: actuals.length,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  actuals,
  cleanup: cleanupResults,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
