const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG

if (!shareSlug) {
  console.error('QA_SHARE_SLUG is required for qa:share')
  process.exit(1)
}

const failures = []

function hasMeta(html, matcher) {
  return matcher.test(html)
}

function fail(name, details) {
  failures.push({ name, ...details })
}

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'user-agent': 'globe-travel-share-smoke/1.0' },
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

async function run() {
  const results = []

  const tripApi = await fetchJson(`/api/trips/share/${shareSlug}`)
  const tripTitle = tripApi.json?.trip?.title
  const dayCount = Array.isArray(tripApi.json?.days) ? tripApi.json.days.length : 0
  const apiOk = tripApi.response.ok && typeof tripTitle === 'string' && dayCount > 0
  const apiResult = {
    name: 'public trip API returns itinerary',
    ok: apiOk,
    status: tripApi.response.status,
    tripTitle,
    dayCount,
  }
  if (!apiOk) fail(apiResult.name, apiResult)
  results.push(apiResult)

  const days = Array.isArray(tripApi.json?.days) ? tripApi.json.days : []
  const dayIntegrity = days.map((day) => {
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
  })
  const badDays = dayIntegrity.filter((day) => (
    day.itemCount === 0 ||
    day.mappedItemCount !== day.itemCount ||
    day.countries.length !== 1 ||
    day.usableRouteCount === 0
  ))
  const integrityOk = apiOk && days.length > 0 && badDays.length === 0
  const integrityResult = {
    name: 'public itinerary days have mapped stops and routes',
    ok: integrityOk,
    dayCount: days.length,
    badDays,
    dayIntegrity,
  }
  if (!integrityOk) fail(integrityResult.name, integrityResult)
  results.push(integrityResult)

  const feedbackApi = await fetchJson(`/api/trips/share/${shareSlug}/feedback`)
  const feedbackOk = feedbackApi.response.ok && Array.isArray(feedbackApi.json)
  const feedbackResult = {
    name: 'public feedback API returns array',
    ok: feedbackOk,
    status: feedbackApi.response.status,
    feedbackCount: Array.isArray(feedbackApi.json) ? feedbackApi.json.length : null,
  }
  if (!feedbackOk) fail(feedbackResult.name, feedbackResult)
  results.push(feedbackResult)

  const pageResponse = await fetch(`${baseUrl}/t/${shareSlug}`, {
    headers: { 'user-agent': 'globe-travel-share-smoke/1.0' },
  })
  const html = await pageResponse.text()
  const escapedTitle = tripTitle?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const metaChecks = [
    ['trip title tag', new RegExp(`<title[^>]*>[^<]*${escapedTitle}[^<]*Globe\\.travel`, 'i')],
    ['meta description', /<meta\s+name=["']description["'][^>]+content=["'][^"']*Review the/i],
    ['og title', /<meta\s+property=["']og:title["'][^>]+content=["'][^"']*Globe\.travel/i],
    ['og description', /<meta\s+property=["']og:description["'][^>]+content=["'][^"']*Review the/i],
    ['twitter card', /<meta\s+name=["']twitter:card["'][^>]+content=["']summary_large_image["']/i],
  ]
  const missingMeta = metaChecks
    .filter(([, matcher]) => !hasMeta(html, matcher))
    .map(([name]) => name)
  const pageOk = pageResponse.ok && Boolean(tripTitle) && missingMeta.length === 0
  const pageResult = {
    name: 'public page emits share metadata',
    ok: pageOk,
    status: pageResponse.status,
    missingMeta,
  }
  if (!pageOk) fail(pageResult.name, pageResult)
  results.push(pageResult)

  const summary = {
    baseUrl,
    shareSlug,
    checked: results.length,
    passed: results.length - failures.length,
    failed: failures.length,
    results,
  }

  console.log(JSON.stringify(summary, null, 2))

  if (failures.length > 0) {
    process.exitCode = 1
  }
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
