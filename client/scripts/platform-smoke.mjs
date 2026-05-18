const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

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
    path: `/trips/${process.env.QA_TRIP_ID}`,
    markers: ['ITINERARY', 'Save trip'],
  })
}

const failures = []

async function checkRoute(route) {
  const url = `${baseUrl}${route.path}`
  const started = Date.now()
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'user-agent': 'globe-travel-platform-smoke/1.0' },
  })
  const body = await response.text()
  const elapsedMs = Date.now() - started
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
    failures.push({
      path: route.path,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    })
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
