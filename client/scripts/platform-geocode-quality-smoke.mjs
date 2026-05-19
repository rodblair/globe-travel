import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { geocodePlace } from '../app/api/trips/_mapbox.ts'

const root = process.cwd()
const failures = []
const results = []

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

await loadDotEnv()

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN
if (!token) {
  record('mapbox token configured', false)
} else {
  record('mapbox token configured', true)
}

const destinationCases = [
  { query: 'Athens', countryCode: 'GR' },
  { query: 'Athens, Greece', countryCode: 'GR' },
  { query: 'Lisbon', countryCode: 'PT' },
  { query: 'Lisbon, Portugal', countryCode: 'PT' },
  { query: 'Mexico City', countryCode: 'MX' },
  { query: 'Mexico City, Mexico', countryCode: 'MX' },
  { query: 'Tokyo', countryCode: 'JP' },
  { query: 'Tokyo, Japan', countryCode: 'JP' },
  { query: 'Rome', countryCode: 'IT' },
  { query: 'Rome, Italy', countryCode: 'IT' },
  { query: 'Barcelona', countryCode: 'ES' },
  { query: 'Barcelona, Spain', countryCode: 'ES' },
  { query: 'London', countryCode: 'GB' },
  { query: 'London, United Kingdom', countryCode: 'GB' },
  { query: 'Paris', countryCode: 'FR' },
  { query: 'Paris, France', countryCode: 'FR' },
  { query: 'Copenhagen', countryCode: 'DK' },
  { query: 'Copenhagen, Denmark', countryCode: 'DK' },
  { query: 'Berlin', countryCode: 'DE' },
  { query: 'Berlin, Germany', countryCode: 'DE' },
]

const destinationAnchors = {
  Lisbon: { latitude: 38.72225, longitude: -9.13934, countryCode: 'PT' },
  'Mexico City': { latitude: 19.43261, longitude: -99.13321, countryCode: 'MX' },
  Tokyo: { latitude: 35.67642, longitude: 139.65003, countryCode: 'JP' },
  Barcelona: { latitude: 41.3874, longitude: 2.1686, countryCode: 'ES' },
  London: { latitude: 51.50722, longitude: -0.1275, countryCode: 'GB' },
  Paris: { latitude: 48.85661, longitude: 2.35222, countryCode: 'FR' },
}

const weakStrictCases = [
  {
    query: 'Castelo de S. Jorge, Lisbon',
    anchor: destinationAnchors.Lisbon,
    reason: 'should not accept a far street hit for an abbreviated castle name',
  },
  {
    query: 'A Happy Pancake Omotesando, Tokyo',
    anchor: destinationAnchors.Tokyo,
    reason: 'should not accept Tokyo prefecture as a restaurant pin',
  },
  {
    query: 'T.Y. HARBOR, Tokyo',
    anchor: destinationAnchors.Tokyo,
    reason: 'should not accept Tokyo prefecture as a venue pin',
  },
  {
    query: 'Fonda Fina, Mexico City',
    anchor: destinationAnchors['Mexico City'],
    reason: 'should not accept a weak street hit for a restaurant',
  },
  {
    query: 'Palacio de Bellas Artes, Mexico City',
    anchor: destinationAnchors['Mexico City'],
    reason: 'should not accept a distant Bellas Artes locality for the landmark',
  },
]

if (token) {
  for (const testCase of destinationCases) {
    const result = await geocodePlace(testCase.query, token)
    record(`destination anchor resolves: ${testCase.query}`, result?.country_code === testCase.countryCode, {
      expectedCountryCode: testCase.countryCode,
      result,
    })
  }

  for (const testCase of weakStrictCases) {
    const result = await geocodePlace(testCase.query, token, {
      proximity: testCase.anchor,
      countryCode: testCase.anchor.countryCode,
      strictName: true,
    })
    const resultDistanceKm = result
      ? distanceKm(testCase.anchor, { latitude: result.latitude, longitude: result.longitude })
      : null
    record(`strict geocode rejects weak hit: ${testCase.query}`, result == null, {
      reason: testCase.reason,
      result,
      resultDistanceKm,
    })
  }
}

const summary = {
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
