import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareMapInput = process.env.QA_PROMPT_SUITE_SHARE_MAP || ''
const outputPath = process.env.QA_PROMPT_SUITE_ACTUALS_OUT

function parseShareMap(input) {
  return input
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [id, shareSlug] = entry.split(/[=:]/).map((part) => part?.trim())
      return { id, shareSlug }
    })
}

const shareMap = parseShareMap(shareMapInput)

if (!shareMap.length || shareMap.some((entry) => !entry.id || !entry.shareSlug)) {
  console.error('QA_PROMPT_SUITE_SHARE_MAP is required, for example: athens-5-day-couples-rest=x3m2c8cnws')
  process.exit(1)
}

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'user-agent': 'globe-travel-planner-actuals/1.0' },
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

function dayIntegrity(day) {
  const items = Array.isArray(day.items) ? day.items : []
  const mappedItems = items.filter((item) => (
    item.place &&
    Number.isFinite(item.place.latitude) &&
    Number.isFinite(item.place.longitude)
  ))
  const countries = [...new Set(mappedItems.map((item) => item.place.country).filter(Boolean))]
  const routes = Array.isArray(day.routes) ? day.routes : []
  const usableRoutes = routes.filter((route) => (
    Number.isFinite(route.distance_m) &&
    route.distance_m > 0 &&
    route.distance_m <= 25000
  ))

  return {
    dayIndex: day.day_index,
    title: day.title,
    itemCount: items.length,
    mappedItemCount: mappedItems.length,
    countries,
    usableRouteCount: usableRoutes.length,
  }
}

const actuals = []
const failures = []

for (const entry of shareMap) {
  const tripApi = await fetchJson(`/api/trips/share/${entry.shareSlug}`)
  const tripTitle = tripApi.json?.trip?.title
  const days = Array.isArray(tripApi.json?.days) ? tripApi.json.days : []

  if (!tripApi.response.ok || !tripTitle || days.length === 0) {
    failures.push({
      id: entry.id,
      shareSlug: entry.shareSlug,
      status: tripApi.response.status,
      error: tripApi.json?.error || tripApi.text.slice(0, 160),
    })
    continue
  }

  actuals.push({
    id: entry.id,
    shareSlug: entry.shareSlug,
    tripTitle,
    days: days.map(dayIntegrity),
  })
}

if (failures.length) {
  console.error(JSON.stringify({ baseUrl, failures }, null, 2))
  process.exit(1)
}

const output = JSON.stringify(actuals, null, 2)

if (outputPath) {
  await writeFile(resolve(process.cwd(), outputPath), `${output}\n`)
  console.log(JSON.stringify({
    baseUrl,
    outputPath,
    exported: actuals.length,
    ids: actuals.map((actual) => actual.id),
  }, null, 2))
} else {
  console.log(output)
}
