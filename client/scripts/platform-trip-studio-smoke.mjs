import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const tripId = process.env.QA_TRIP_ID
const shareSlug = process.env.QA_SHARE_SLUG
const expectOwner = process.env.QA_EXPECT_OWNER !== '0'
const failures = []

function fail(name, details = {}) {
  failures.push({ name, ...details })
}

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'user-agent': 'globe-travel-trip-studio-smoke/1.0' },
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

function requiredStrings(source, labels) {
  return labels.filter((label) => !source.includes(label))
}

function summarizeDays(days) {
  return days.map((day) => {
    const items = Array.isArray(day.items) ? day.items : []
    const mappedItems = items.filter((item) => (
      item.place &&
      Number.isFinite(item.place.latitude) &&
      Number.isFinite(item.place.longitude)
    ))
    const routes = Array.isArray(day.routes) ? day.routes : []
    const usableRoutes = routes.filter((route) => (
      Number.isFinite(route.distance_m) &&
      route.distance_m > 0 &&
      route.distance_m <= 25000
    ))

    return {
      dayIndex: day.day_index,
      itemCount: items.length,
      mappedItemCount: mappedItems.length,
      routeCount: usableRoutes.length,
    }
  })
}

const tripPageSource = await readFile(resolve(root, 'app/(app)/trips/[tripId]/page.tsx'), 'utf8')
const itinerarySource = await readFile(resolve(root, 'components/trips/ItineraryArtifact.tsx'), 'utf8')

const ownerControlLabels = [
  'Save trip',
  'Planner chat',
  'Optimize day',
  'Build maps',
  'Share with friends',
  'View share',
]
const collaborationLabels = [
  'Share with crew',
  'Crew consensus',
  'Friend feedback',
  'Planner workflows',
  'Generate decision memo',
  'Create budget variants',
  'Refresh plan from feedback',
]
const readOnlyLabels = [
  'View only',
  'Shared preview',
  'Shared preview. Start your own trip to edit and save.',
]
const itineraryActionLabels = [
  'Rewrite day',
  'Enlarge',
  'Swap',
  'Delete',
  'Edit',
]

const missingOwnerControls = requiredStrings(tripPageSource, ownerControlLabels)
if (missingOwnerControls.length) {
  fail('Trip Studio source exposes owner action controls', { missing: missingOwnerControls })
}

const missingCollaboration = requiredStrings(tripPageSource, collaborationLabels)
if (missingCollaboration.length) {
  fail('Trip Studio source exposes collaboration and workflow controls', { missing: missingCollaboration })
}

const missingReadOnlyLabels = requiredStrings(tripPageSource, readOnlyLabels)
if (missingReadOnlyLabels.length) {
  fail('Trip Studio source exposes clear read-only shared preview state', { missing: missingReadOnlyLabels })
}

const missingItineraryActions = requiredStrings(itinerarySource, itineraryActionLabels)
if (missingItineraryActions.length) {
  fail('Itinerary source exposes day and item actions', { missing: missingItineraryActions })
}

if (tripPageSource.includes('pointer-events-none hidden')) {
  fail('Trip Studio readiness controls are not hard-hidden')
}

const results = [
  {
    name: 'Trip Studio owner action controls are present in source',
    ok: missingOwnerControls.length === 0,
    missing: missingOwnerControls,
  },
  {
    name: 'Trip Studio collaboration and workflow controls are present in source',
    ok: missingCollaboration.length === 0,
    missing: missingCollaboration,
  },
  {
    name: 'Trip Studio read-only shared preview state is explicit in source',
    ok: missingReadOnlyLabels.length === 0,
    missing: missingReadOnlyLabels,
  },
  {
    name: 'Itinerary day and item actions are present in source',
    ok: missingItineraryActions.length === 0,
    missing: missingItineraryActions,
  },
  {
    name: 'Trip Studio readiness controls are not hard-hidden',
    ok: !tripPageSource.includes('pointer-events-none hidden'),
  },
]

if (tripId) {
  const tripApi = await fetchJson(`/api/trips/${tripId}`)
  const trip = tripApi.json?.trip
  const days = Array.isArray(tripApi.json?.days) ? tripApi.json.days : []
  const dayIntegrity = summarizeDays(days)
  const hasItems = dayIntegrity.some((day) => day.itemCount > 0)
  const hasMappedItems = dayIntegrity.some((day) => day.mappedItemCount > 0)
  const hasRoutes = dayIntegrity.some((day) => day.routeCount > 0)
  const privateTripOk =
    tripApi.response.ok &&
    typeof trip?.title === 'string' &&
    (!expectOwner || trip.is_owner !== false) &&
    days.length > 0 &&
    hasItems &&
    hasMappedItems &&
    hasRoutes

  const result = {
    name: 'Private Trip Studio API returns editable mapped itinerary',
    ok: privateTripOk,
    status: tripApi.response.status,
    tripTitle: trip?.title,
    isOwner: trip?.is_owner,
    expectOwner,
    dayCount: days.length,
    dayIntegrity,
  }
  results.push(result)
  if (!privateTripOk) fail(result.name, result)
}

if (shareSlug) {
  const shareApi = await fetchJson(`/api/trips/share/${shareSlug}`)
  const days = Array.isArray(shareApi.json?.days) ? shareApi.json.days : []
  const dayIntegrity = summarizeDays(days)
  const publicShareOk =
    shareApi.response.ok &&
    typeof shareApi.json?.trip?.title === 'string' &&
    days.length > 0 &&
    dayIntegrity.every((day) => day.itemCount > 0 && day.mappedItemCount === day.itemCount)

  const result = {
    name: 'Public Trip Studio share baseline remains mapped and logged-out readable',
    ok: publicShareOk,
    status: shareApi.response.status,
    tripTitle: shareApi.json?.trip?.title,
    dayCount: days.length,
    dayIntegrity,
  }
  results.push(result)
  if (!publicShareOk) fail(result.name, result)
}

const summary = {
  baseUrl,
  tripId: tripId || null,
  shareSlug: shareSlug || null,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
