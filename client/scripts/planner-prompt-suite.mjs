import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractDaysFromPrompt, extractDestinationFromPrompt } from '../lib/planner/runtime.ts'
import { getPlanToolSelection, inferPlanIntent } from '../lib/planner/tools.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixturesPath = resolve(root, 'qa/planner-prompt-fixtures.json')
const actualsPath = process.env.QA_PROMPT_SUITE_ACTUALS

const fixtures = JSON.parse(await readFile(fixturesPath, 'utf8'))
const actuals = actualsPath
  ? JSON.parse(await readFile(resolve(process.cwd(), actualsPath), 'utf8'))
  : []
const actualsById = new Map(actuals.map((actual) => [actual.id, actual]))
const failures = []
const results = []

function recordFailure(id, name, details = {}) {
  failures.push({ id, name, ...details })
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

function dayCountFromPrompt(prompt) {
  return extractDaysFromPrompt(prompt)
}

function validateFixtureShape(fixture) {
  const expected = fixture.expected || {}
  if (!fixture.id) recordFailure('unknown', 'fixture id is required')
  if (!fixture.prompt) recordFailure(fixture.id, 'prompt is required')
  if (!expected.destination) recordFailure(fixture.id, 'expected destination is required')
  if (!expected.country) recordFailure(fixture.id, 'expected country is required')
  if (!Number.isInteger(expected.days) || expected.days < 1) {
    recordFailure(fixture.id, 'expected days must be a positive integer', { days: expected.days })
  }
  if (!Array.isArray(expected.themes) || expected.themes.length === 0) {
    recordFailure(fixture.id, 'expected themes are required')
  }
}

function validateActualOutput(fixture, actual) {
  if (!actual) return null

  const expected = fixture.expected
  const days = Array.isArray(actual.days) ? actual.days : []
  const expectedDayIndexes = Array.from({ length: expected.days }, (_, index) => index + 1)
  const actualDayIndexes = days.map((day) => day.dayIndex)
  const dayIndexesOk =
    days.length === expected.days &&
    expectedDayIndexes.every((dayIndex, index) => actualDayIndexes[index] === dayIndex)
  const titleDestinationOk = normalize(actual.tripTitle).includes(normalize(expected.destination))
  const badDays = days.filter((day) => (
    !Number.isInteger(day.dayIndex) ||
    day.itemCount <= 0 ||
    day.mappedItemCount !== day.itemCount ||
    (Array.isArray(day.duplicateMappedStops) && day.duplicateMappedStops.length > 0) ||
    !Array.isArray(day.countries) ||
    day.countries.length !== 1 ||
    normalizeCountry(day.countries[0]) !== normalizeCountry(expected.country) ||
    day.usableRouteCount <= 0
  ))
  const ok = days.length === expected.days && dayIndexesOk && titleDestinationOk && badDays.length === 0

  if (!ok) {
    recordFailure(fixture.id, 'actual generated output failed map trust checks', {
      expectedDays: expected.days,
      actualDays: days.length,
      expectedDestination: expected.destination,
      tripTitle: actual.tripTitle,
      titleDestinationOk,
      expectedDayIndexes,
      actualDayIndexes,
      dayIndexesOk,
      badDays,
    })
  }

  return {
    hasActual: true,
    actualDayCount: days.length,
    titleDestinationOk,
    dayIndexesOk,
    badDays,
    ok,
  }
}

const ids = new Set()
const coverage = new Set()
const betaCoverage = {
  audience: new Set(),
  style: new Set(),
  region: new Set(),
}

const countryRegions = new Map(Object.entries({
  Argentina: 'latin-america',
  Australia: 'oceania',
  Austria: 'europe',
  Brazil: 'latin-america',
  Canada: 'north-america',
  Colombia: 'latin-america',
  Croatia: 'europe',
  Czechia: 'europe',
  Denmark: 'europe',
  France: 'europe',
  Germany: 'europe',
  Greece: 'europe',
  'Hong Kong': 'asia',
  Hungary: 'europe',
  Iceland: 'europe',
  Indonesia: 'asia',
  Ireland: 'europe',
  Italy: 'europe',
  Japan: 'asia',
  Kenya: 'africa',
  Mexico: 'latin-america',
  Morocco: 'africa',
  Netherlands: 'europe',
  'New Zealand': 'oceania',
  Peru: 'latin-america',
  Portugal: 'europe',
  Singapore: 'asia',
  Spain: 'europe',
  'South Africa': 'africa',
  'South Korea': 'asia',
  Switzerland: 'europe',
  Taiwan: 'asia',
  Thailand: 'asia',
  Turkey: 'europe-middle-east',
  'United Arab Emirates': 'middle-east',
  'United Kingdom': 'europe',
  'United States': 'north-america',
  Vietnam: 'asia',
}))

for (const fixture of fixtures) {
  validateFixtureShape(fixture)
  if (ids.has(fixture.id)) recordFailure(fixture.id, 'fixture id must be unique')
  ids.add(fixture.id)

  const expected = fixture.expected || {}
  const extractedDestination = extractDestinationFromPrompt(fixture.prompt)
  const extractedOk = normalize(extractedDestination) === normalize(expected.destination)
  if (!extractedOk) {
    recordFailure(fixture.id, 'destination extraction mismatch', {
      expected: expected.destination,
      extracted: extractedDestination,
      prompt: fixture.prompt,
    })
  }

  const promptDayCount = dayCountFromPrompt(fixture.prompt)
  const dayCountOk = promptDayCount == null || promptDayCount === expected.days
  if (!dayCountOk) {
    recordFailure(fixture.id, 'day count mismatch between prompt and fixture', {
      expected: expected.days,
      parsed: promptDayCount,
    })
  }

  const intent = inferPlanIntent({
    latestUserText: fixture.prompt,
    hasExistingTrip: false,
    hasExistingDays: false,
    hasExistingItems: false,
  })
  const toolSelection = getPlanToolSelection(intent, false)
  const initialPlanOk =
    intent === 'full-plan' &&
    toolSelection.includes('createTrip') &&
    toolSelection.includes('setFullTripPlan') &&
    toolSelection.includes('resolvePlace')
  if (!initialPlanOk) {
    recordFailure(fixture.id, 'initial planning prompt should select full-plan tools', {
      intent,
      toolSelection,
    })
  }

  for (const theme of expected.themes || []) coverage.add(normalize(theme))
  if (expected.days === 1) coverage.add('one-day')
  if (expected.days === 5) coverage.add('five-day')
  if (expected.multiCity) coverage.add('multi-city')
  if (expected.requiresRestDay) coverage.add('rest-day')

  const promptText = normalize(fixture.prompt)
  const themeSet = new Set((expected.themes || []).map(normalize))
  if (promptText.includes('friend') || themeSet.has('friends')) betaCoverage.audience.add('friend-groups')
  if (promptText.includes('couple') || themeSet.has('couples') || themeSet.has('romantic')) betaCoverage.audience.add('couples')
  if (promptText.includes('family') || themeSet.has('family')) betaCoverage.audience.add('families')
  if (promptText.includes('solo') || themeSet.has('solo')) betaCoverage.audience.add('solo')

  for (const style of ['budget', 'premium', 'food', 'nightlife', 'outdoors', 'culture']) {
    if (themeSet.has(style) || promptText.includes(style)) betaCoverage.style.add(style)
  }

  const region = countryRegions.get(expected.country)
  if (region) betaCoverage.region.add(region)

  const actualResult = validateActualOutput(fixture, actualsById.get(fixture.id))
  results.push({
    id: fixture.id,
    prompt: fixture.prompt,
    expectedDestination: expected.destination,
    extractedDestination,
    expectedCountry: expected.country,
    expectedDays: expected.days,
    intent,
    toolSelection,
    hasActual: Boolean(actualResult),
    actualResult,
    ok:
      extractedOk &&
      dayCountOk &&
      initialPlanOk &&
      (!actualResult || actualResult.ok),
  })
}

const requiredCoverage = [
  'one-day',
  'five-day',
  'multi-city',
  'rest-day',
  'food',
  'viewpoints',
  'beach',
  'museums',
  'nightlife',
  'budget',
  'premium',
  'family',
  'rain-safe',
  'walkable',
]
const requiredBetaCoverage = {
  audience: ['friend-groups', 'couples', 'families', 'solo'],
  style: ['budget', 'premium', 'food', 'nightlife', 'outdoors', 'culture'],
  region: ['africa', 'asia', 'europe', 'latin-america', 'north-america', 'oceania'],
}
const missingCoverage = requiredCoverage.filter((tag) => !coverage.has(tag))
const missingBetaCoverage = Object.fromEntries(
  Object.entries(requiredBetaCoverage).map(([group, required]) => [
    group,
    required.filter((tag) => !betaCoverage[group].has(tag)),
  ])
)
const missingBetaCoverageEntries = Object.values(missingBetaCoverage).flat()
if (fixtures.length < 50) {
  recordFailure('suite', 'prompt suite must include at least 50 fixtures', { count: fixtures.length })
}
if (missingCoverage.length) {
  recordFailure('suite', 'prompt suite is missing required coverage', { missingCoverage })
}
if (fixtures.length < 60) {
  recordFailure('suite', 'beta representative prompt suite must include at least 60 fixtures', { count: fixtures.length })
}
if (missingBetaCoverageEntries.length) {
  recordFailure('suite', 'beta representative prompt suite is missing required audience, style, or regional coverage', {
    missingBetaCoverage,
  })
}

const summary = {
  fixturePath: fixturesPath,
  actualsPath: actualsPath || null,
  checked: fixtures.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  coverage: Array.from(coverage).sort(),
  missingCoverage,
  betaCoverage: Object.fromEntries(
    Object.entries(betaCoverage).map(([group, tags]) => [group, Array.from(tags).sort()])
  ),
  missingBetaCoverage,
  actualsChecked: actualsById.size,
  failures,
  results,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
