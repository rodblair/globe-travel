const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const fetchTimeoutMs = Number.parseInt(process.env.QA_SMOKE_FETCH_TIMEOUT_MS || '20000', 10)

const routes = [
  { path: '/', markers: ['Globe.travel', 'Plan the trip everyone'] },
  { path: '/chat', markers: ['Planner', 'Trip Studio'], allowLoginRedirect: true },
  { path: '/login', markers: ['Welcome back', 'Continue as guest'] },
  { path: '/signup', markers: ['Create your account', 'Continue as guest'] },
  { path: '/saved', markers: ['Trips'], allowLoginRedirect: true },
  { path: '/account', markers: ['Account'], allowLoginRedirect: true },
  { path: '/account?tab=billing', markers: ['Plan and billing'], allowLoginRedirect: true },
]

if (process.env.QA_SHARE_SLUG) {
  routes.push({
    path: `/t/${process.env.QA_SHARE_SLUG}`,
    // Public share content is client-rendered behind Suspense, so the fetch-only
    // smoke gate checks server-rendered metadata while qa:share validates the
    // full itinerary, feedback API, and map integrity.
    markers: ['og:site_name', 'twitter:card'],
  })
}

if (process.env.QA_TRIP_ID) {
  routes.push({
    path: `/api/trips/${process.env.QA_TRIP_ID}`,
    kind: 'trip-api',
  })
}

const failures = []

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchTextWithRetry(url, options, attempts = 3) {
  let lastError = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: options?.signal || AbortSignal.timeout(fetchTimeoutMs),
      })
      const body = await response.text()
      if (response.status < 500 || attempt === attempts) {
        return { response, body, attempts: attempt, error: null }
      }
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
    }

    await wait(250 * attempt)
  }

  return {
    response: null,
    body: '',
    attempts,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  }
}

async function checkRoute(route) {
  const url = `${baseUrl}${route.path}`
  const started = Date.now()
  const fetched = await fetchTextWithRetry(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'globe-travel-platform-smoke/1.0' },
  })
  if (!fetched.response) {
    throw new Error(fetched.error || 'Fetch failed')
  }

  const response = fetched.response
  const body = fetched.body
  const elapsedMs = Date.now() - started

  if (route.kind === 'trip-api') {
    let payload = null
    try {
      payload = JSON.parse(body)
    } catch {
      // handled below
    }

    const days = Array.isArray(payload?.days) ? payload.days : []
    const tripOk =
      response.ok &&
      typeof payload?.trip?.title === 'string' &&
      payload.trip.is_owner !== false &&
      days.length > 0
    const result = {
      path: route.path,
      status: response.status,
      elapsedMs,
      attempts: fetched.attempts,
      ok: tripOk,
      tripTitle: payload?.trip?.title,
      isOwner: payload?.trip?.is_owner,
      dayCount: days.length,
      finalUrl: response.url,
    }

    if (!result.ok) failures.push(result)
    return result
  }

  const finalUrl = new URL(response.url)
  const loginRedirected = route.allowLoginRedirect && finalUrl.pathname === '/login'
  const expectedMarkers = loginRedirected
    ? ['Welcome back', 'Continue as guest']
    : route.markers
  const missingMarkers = expectedMarkers.filter((marker) => !body.includes(marker))

  const result = {
    path: route.path,
    status: response.status,
    elapsedMs,
    attempts: fetched.attempts,
    ok: response.ok && missingMarkers.length === 0,
    missingMarkers,
    finalUrl: response.url,
    loginRedirected,
  }

  if (!result.ok) failures.push(result)
  return result
}

const results = []

for (const route of routes) {
  try {
    results.push(await checkRoute(route))
  } catch (error) {
    const result = {
      path: route.path,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
    failures.push(result)
    results.push(result)
  }
}

const summary = {
  baseUrl,
  checked: routes.length,
  passed: routes.length - failures.length,
  failed: failures.length,
  results,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
