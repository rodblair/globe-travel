const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareSlugs = (process.env.QA_SHARE_SLUGS || process.env.QA_SHARE_SLUG || '')
  .split(/[\s,]+/)
  .map((slug) => slug.trim())
  .filter(Boolean)

if (!shareSlugs.length) {
  console.error('QA_SHARE_SLUG or QA_SHARE_SLUGS is required for qa:share')
  process.exit(1)
}

const failures = []

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const cityCountryReplacements = [
  [/\bAthens Greece\b/gi, 'Athens, Greece'],
  [/\bLisbon Portugal\b/gi, 'Lisbon, Portugal'],
  [/\bBarcelona Spain\b/gi, 'Barcelona, Spain'],
  [/\bParis France\b/gi, 'Paris, France'],
  [/\bIstanbul Turkey\b/gi, 'Istanbul, Turkey'],
  [/\bSeoul South Korea\b/gi, 'Seoul, South Korea'],
  [/\bBangkok Thailand\b/gi, 'Bangkok, Thailand'],
  [/\bMarrakech Morocco\b/gi, 'Marrakech, Morocco'],
  [/\bCape Town South Africa\b/gi, 'Cape Town, South Africa'],
  [/\bSydney Australia\b/gi, 'Sydney, Australia'],
  [/\bVancouver Canada\b/gi, 'Vancouver, Canada'],
  [/\bRio de Janeiro Brazil\b/gi, 'Rio de Janeiro, Brazil'],
  [/\bReykjavik Iceland\b/gi, 'Reykjavik, Iceland'],
  [/\bCrete Greece\b/gi, 'Crete, Greece'],
  [/\bDubai UAE\b/gi, 'Dubai, UAE'],
  [/\bDubai United Arab Emirates\b/gi, 'Dubai, United Arab Emirates'],
  [/\bKyoto Japan\b/gi, 'Kyoto, Japan'],
  [/\bBali Indonesia\b/gi, 'Bali, Indonesia'],
  [/\bNairobi Kenya\b/gi, 'Nairobi, Kenya'],
  [/\bWashington DC\b/gi, 'Washington, DC'],
  [/\bMexico City Mexico\b/gi, 'Mexico City, Mexico'],
  [/\bLondon England\b/gi, 'London, England'],
  [/\bLondon UK\b/gi, 'London, UK'],
  [/\bRome Italy\b/gi, 'Rome, Italy'],
  [/\bTokyo Japan\b/gi, 'Tokyo, Japan'],
  [/\bCopenhagen Denmark\b/gi, 'Copenhagen, Denmark'],
  [/\bBerlin Germany\b/gi, 'Berlin, Germany'],
]

const monthNames = {
  jan: 'January',
  january: 'January',
  feb: 'February',
  february: 'February',
  mar: 'March',
  march: 'March',
  apr: 'April',
  april: 'April',
  may: 'May',
  jun: 'June',
  june: 'June',
  jul: 'July',
  july: 'July',
  aug: 'August',
  august: 'August',
  sep: 'September',
  sept: 'September',
  september: 'September',
  oct: 'October',
  october: 'October',
  nov: 'November',
  november: 'November',
  dec: 'December',
  december: 'December',
}

function hasMeta(html, matcher) {
  return matcher.test(html)
}

function formatShareDisplayTitle(title) {
  let formatted = String(title || 'Trip').replace(/\s+/g, ' ').trim()
  for (const [pattern, replacement] of cityCountryReplacements) {
    formatted = formatted.replace(pattern, replacement)
  }
  formatted = formatted
    .replace(/\b(early|mid|late)\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi, (_match, modifier, month) => {
      const monthName = monthNames[String(month).toLowerCase()] || month
      const cleanModifier = String(modifier).toLowerCase()
      return cleanModifier === 'mid' ? `mid\u2011${monthName}` : `${cleanModifier} ${monthName}`
    })
    .replace(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi, (match) => monthNames[String(match).toLowerCase()] || match)
    .replace(/\b(in\s+[^,]+,\s+(?:Greece|Portugal|Spain|France|Turkey|South Korea|Thailand|Morocco|South Africa|Australia|Canada|Brazil|Iceland|UAE|United Arab Emirates|Japan|Indonesia|Kenya|DC|Mexico|England|UK|Italy|Denmark|Germany))\s+in\s+((?:early|late)\s+[A-Z][a-z]+|mid[\u2011-][A-Z][a-z]+)/g, '$1, in $2')
  return formatted.replace(/\s+/g, ' ').trim()
}

function fail(shareSlug, name, details) {
  failures.push({ shareSlug, name, ...details })
}

async function fetchWithRetry(path, options = {}) {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`
  let lastError = null
  let lastResponse = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'user-agent': 'globe-travel-share-smoke/1.0',
          ...(options.headers || {}),
        },
      })
      lastResponse = response
      if (response.status < 500 || attempt === 3) {
        return response
      }
    } catch (error) {
      lastError = error
      if (attempt === 3) throw error
    }

    await sleep(500 * attempt)
  }

  if (lastResponse) return lastResponse
  throw lastError || new Error(`Failed to fetch ${url}`)
}

async function fetchJson(path) {
  const response = await fetchWithRetry(path)
  const text = await response.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // handled by caller
  }
  return { response, text, json }
}

async function checkShareSlug(shareSlug) {
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
  if (!apiOk) fail(shareSlug, apiResult.name, apiResult)
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
    const mappedStopKeys = mappedItems.map((item) => {
      const latitude = Number(item.place.latitude).toFixed(5)
      const longitude = Number(item.place.longitude).toFixed(5)
      return `${latitude},${longitude}`
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
      uniqueMappedStopCount: seenStopKeys.size,
      duplicateMappedStops,
      countries,
      usableRouteCount: usableRoutes.length,
      routeDistanceMeters: usableRoutes.map((route) => route.distance_m),
    }
  })
  const badDays = dayIntegrity.filter((day) => (
    day.itemCount === 0 ||
    day.mappedItemCount !== day.itemCount ||
    day.duplicateMappedStops.length > 0 ||
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
  if (!integrityOk) fail(shareSlug, integrityResult.name, integrityResult)
  results.push(integrityResult)

  const feedbackApi = await fetchJson(`/api/trips/share/${shareSlug}/feedback`)
  const feedbackOk = feedbackApi.response.ok && Array.isArray(feedbackApi.json)
  const feedbackResult = {
    name: 'public feedback API returns array',
    ok: feedbackOk,
    status: feedbackApi.response.status,
    feedbackCount: Array.isArray(feedbackApi.json) ? feedbackApi.json.length : null,
  }
  if (!feedbackOk) fail(shareSlug, feedbackResult.name, feedbackResult)
  results.push(feedbackResult)

  const pageResponse = await fetchWithRetry(`/t/${shareSlug}`)
  const html = await pageResponse.text()
  const displayTitle = formatShareDisplayTitle(tripTitle)
  const escapedTitle = displayTitle?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const metaChecks = [
    ['trip title tag', escapedTitle ? new RegExp(`<title[^>]*>[^<]*${escapedTitle}[^<]*Globe\\.travel`, 'i') : /$a/],
    ['meta description', /<meta\s+name=["']description["'][^>]+content=["'][^"']*Review the/i],
    ['og title', /<meta\s+property=["']og:title["'][^>]+content=["'][^"']*Globe\.travel/i],
    ['og description', /<meta\s+property=["']og:description["'][^>]+content=["'][^"']*Review the/i],
    ['og image', new RegExp(`<meta\\s+property=["']og:image["'][^>]+content=["'][^"']*/api/share-card/${shareSlug}["']`, 'i')],
    ['og image width', /<meta\s+property=["']og:image:width["'][^>]+content=["']1200["']/i],
    ['og image height', /<meta\s+property=["']og:image:height["'][^>]+content=["']630["']/i],
    ['twitter card', /<meta\s+name=["']twitter:card["'][^>]+content=["']summary_large_image["']/i],
    ['twitter image', new RegExp(`<meta\\s+name=["']twitter:image["'][^>]+content=["'][^"']*/api/share-card/${shareSlug}["']`, 'i')],
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
  if (!pageOk) fail(shareSlug, pageResult.name, pageResult)
  results.push(pageResult)

  const imageResponse = await fetchWithRetry(`/api/share-card/${shareSlug}`)
  const imageBuffer = await imageResponse.arrayBuffer()
  const imageContentType = imageResponse.headers.get('content-type') || ''
  const imageOk =
    imageResponse.ok &&
    imageContentType.toLowerCase().startsWith('image/png') &&
    imageBuffer.byteLength > 1000
  const imageResult = {
    name: 'public share card image renders',
    ok: imageOk,
    status: imageResponse.status,
    contentType: imageContentType,
    byteLength: imageBuffer.byteLength,
  }
  if (!imageOk) fail(shareSlug, imageResult.name, imageResult)
  results.push(imageResult)

  return {
    shareSlug,
    checked: results.length,
    passed: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
  }
}

async function run() {
  const shareResults = []

  for (const shareSlug of shareSlugs) {
    shareResults.push(await checkShareSlug(shareSlug))
  }

  const summary = {
    baseUrl,
    shareSlugs,
    checked: shareResults.reduce((total, result) => total + result.checked, 0),
    passed: shareResults.reduce((total, result) => total + result.passed, 0),
    failed: failures.length,
    shareResults,
    failures,
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
