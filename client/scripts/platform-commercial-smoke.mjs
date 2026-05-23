const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

const failures = []

function recordFailure(name, details) {
  failures.push({ name, ...details })
}

async function readJsonResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const body = await response.text()

  if (!contentType.includes('application/json')) {
    return {
      ok: false,
      body,
      json: null,
      error: `Expected JSON response, received ${contentType || 'no content-type'}`,
    }
  }

  try {
    return { ok: true, body, json: JSON.parse(body), error: null }
  } catch (error) {
    return {
      ok: false,
      body,
      json: null,
      error: error instanceof Error ? error.message : 'Could not parse JSON response',
    }
  }
}

async function checkJsonPost({ name, path, body, expectedStatuses }) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'content-type': 'application/json',
      'user-agent': 'globe-travel-commercial-smoke/1.0',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const parsed = await readJsonResponse(response)
  const hasExpectedStatus = expectedStatuses.includes(response.status)
  const hasErrorMessage = typeof parsed.json?.error === 'string' && parsed.json.error.length > 0
  const ok = hasExpectedStatus && parsed.ok && hasErrorMessage
  const result = {
    name,
    path,
    status: response.status,
    ok,
    expectedStatuses,
    errorMessage: parsed.json?.error ?? parsed.error,
  }

  if (!ok) recordFailure(name, result)
  return result
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match?.[1]?.replace(/\s+/g, ' ').trim() || ''
}

function hrefPresent(html, href) {
  const escaped = href.replace(/&/g, '&amp;')
  return html.includes(`href="${href}"`) || html.includes(`href="${escaped}"`)
}

async function checkPage({
  name,
  path,
  markers,
  expectedTitle = null,
  expectedHrefs = [],
  disallowedFinalPathnames = [],
  disallowedTitleFragments = [],
}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'follow',
    headers: { 'user-agent': 'globe-travel-commercial-smoke/1.0' },
  })
  const finalUrl = new URL(response.url)
  const body = await response.text()
  const title = extractTitle(body)
  const missingMarkers = markers.filter((marker) => !body.includes(marker))
  const missingHrefs = expectedHrefs.filter((href) => !hrefPresent(body, href))
  const badTitleFragments = disallowedTitleFragments.filter((fragment) => title.includes(fragment))
  const titleMatches = !expectedTitle || title === expectedTitle
  const redirectedToDisallowedPath = disallowedFinalPathnames.includes(finalUrl.pathname)
  const ok =
    response.ok &&
    missingMarkers.length === 0 &&
    missingHrefs.length === 0 &&
    titleMatches &&
    badTitleFragments.length === 0 &&
    !redirectedToDisallowedPath
  const result = {
    name,
    path,
    status: response.status,
    ok,
    finalUrl: response.url,
    title,
    expectedTitle,
    missingMarkers,
    missingHrefs,
    badTitleFragments,
    disallowedFinalPathnames,
  }

  if (!ok) recordFailure(name, result)
  return result
}

const results = []

results.push(await checkPage({
  name: 'public pricing page renders conversion-ready plan details',
  path: '/pricing',
  markers: [
    'Globe.travel pricing',
    'Start 7-day free trial',
    'Adventurer',
    'No charge today',
  ],
  expectedTitle: 'Pricing · Globe.travel',
  expectedHrefs: [
    '/signup?next=%2Faccount%3Ftab%3Dbilling',
    '/api/guest/start?next=%2Fchat',
  ],
  disallowedTitleFragments: [
    'Globe.travel · Globe.travel',
    'Pricing - Globe.travel',
  ],
  disallowedFinalPathnames: ['/login'],
}))

results.push(await checkJsonPost({
  name: 'checkout fails safely when unauthenticated or unconfigured',
  path: '/api/stripe/checkout',
  body: { interval: 'month' },
  expectedStatuses: [401, 503],
}))

results.push(await checkJsonPost({
  name: 'billing portal fails safely when unauthenticated or unconfigured',
  path: '/api/stripe/portal',
  expectedStatuses: [401, 503],
}))

if (process.env.QA_SHARE_SLUG) {
  results.push(await checkJsonPost({
    name: 'public feedback validation fails safely',
    path: `/api/trips/share/${process.env.QA_SHARE_SLUG}/feedback`,
    body: { name: '', sentiment: 'invalid', comment: '' },
    expectedStatuses: [400],
  }))
}

const summary = {
  baseUrl,
  checked: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  results,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
