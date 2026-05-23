import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'

const repoRoot = resolve(process.cwd(), '..')
const baseUrl = (process.env.QA_BASE_URL || 'https://globe-travel-two.vercel.app').replace(/\/$/, '')
const date = process.env.QA_PUBLIC_SHARE_MAP_INTEGRITY_DATE || new Date().toISOString().slice(0, 10)
const artifactName = process.env.QA_PUBLIC_SHARE_MAP_INTEGRITY_ARTIFACT_NAME || `public-share-map-itinerary-integrity-${date}`
const artifactDir = `qa/${artifactName}`
const artifactPath = `${artifactDir}.json`
const reportPath = `${artifactDir}.md`
const screenshotDir = `${artifactDir}/screenshots`
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const requestedShareSlugs = (process.env.QA_PUBLIC_SHARE_MAP_SLUGS || process.env.QA_SHARE_SLUGS || process.env.QA_SHARE_SLUG || 'x3m2c8cnws')
  .split(/[\s,]+/)
  .map((slug) => slug.trim())
  .filter(Boolean)
const expectedCountryMap = parseExpectedCountryMap(process.env.QA_PUBLIC_SHARE_EXPECTED_COUNTRIES || 'x3m2c8cnws=Greece')
const discoverPublicShares = process.argv.includes('--discover') || ['1', 'true', 'yes'].includes(String(process.env.QA_PUBLIC_SHARE_DISCOVER || '').toLowerCase())
const discoveryLimit = Math.max(1, Number(process.env.QA_PUBLIC_SHARE_DISCOVER_LIMIT || '25'))
const includeRequestedSlugsInDiscovery = process.env.QA_PUBLIC_SHARE_DISCOVER_INCLUDE_REQUESTED !== '0'
const requireUsableRoutes = process.env.QA_PUBLIC_SHARE_REQUIRE_ROUTES !== '0'
const requestTimeoutMs = Math.max(5000, Number(process.env.QA_PUBLIC_SHARE_REQUEST_TIMEOUT_MS || 20000) || 20000)
const discoveryTimeoutMs = Math.max(5000, Number(process.env.QA_PUBLIC_SHARE_DISCOVERY_TIMEOUT_MS || 30000) || 30000)
const browserLaunchTimeoutMs = Math.max(5000, Number(process.env.QA_PUBLIC_SHARE_BROWSER_LAUNCH_TIMEOUT_MS || 20000) || 20000)
const renderTimeoutMs = Math.max(10000, Number(process.env.QA_PUBLIC_SHARE_RENDER_TIMEOUT_MS || 60000) || 60000)
const screenshotTimeoutMs = Math.max(5000, Number(process.env.QA_PUBLIC_SHARE_SCREENSHOT_TIMEOUT_MS || 15000) || 15000)
const contextCloseTimeoutMs = Math.max(2000, Number(process.env.QA_PUBLIC_SHARE_CONTEXT_CLOSE_TIMEOUT_MS || 5000) || 5000)

const viewports = [
  { id: 'phone', width: 390, height: 844 },
  { id: 'desktop', width: 1280, height: 900 },
]

const results = []
const failures = []
let browser = null

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms))

function timeoutError(label, timeoutMs) {
  return new Error(`${label} timed out after ${timeoutMs}ms`)
}

function withTimeout(promise, label, timeoutMs) {
  let timeout = null
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(timeoutError(label, timeoutMs)), timeoutMs)
    timeout.unref?.()
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout)
  })
}

async function closeWithTimeout(resource, label) {
  if (!resource?.close) return
  await withTimeout(resource.close(), label, contextCloseTimeoutMs).catch(() => {})
}

function parseExpectedCountryMap(value) {
  return Object.fromEntries(String(value || '')
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [slug, country] = entry.split(/[=:]/).map((part) => part?.trim())
      return [slug, country]
    })
    .filter(([slug, country]) => slug && country))
}

function repoPath(path) {
  return resolve(repoRoot, path)
}

async function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  let text = ''
  try {
    text = await readFile(envPath, 'utf8')
  } catch {
    return
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const index = trimmed.indexOf('=')
    const key = trimmed.slice(0, index).trim()
    const rawValue = trimmed.slice(index + 1).trim()
    if (!key || process.env[key]) continue
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

async function discoverShareSlugs() {
  await loadEnvLocal()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for public share discovery.')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error, count } = await withTimeout(supabase
    .from('trips')
    .select('id,title,share_slug,updated_at,created_at', { count: 'exact' })
    .eq('is_public', true)
    .not('share_slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(discoveryLimit), 'public share discovery', discoveryTimeoutMs)

  if (error) throw new Error(`Could not discover public share slugs: ${error.message}`)

  return {
    count,
    limit: discoveryLimit,
    shares: (data || [])
      .filter((trip) => trip.share_slug)
      .map((trip) => ({
        tripId: trip.id,
        title: trip.title || null,
        shareSlug: trip.share_slug,
        updatedAt: trip.updated_at || null,
        createdAt: trip.created_at || null,
      })),
  }
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function addFailure(shareSlug, name, details = {}) {
  failures.push({ shareSlug, name, ...details })
}

async function fetchWithRetry(path, options = {}) {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`
  let lastError = null
  let lastResponse = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs)
    timeout.unref?.()
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'user-agent': 'globe-travel-public-share-map-integrity/1.0',
          ...(options.headers || {}),
        },
      })
      lastResponse = response
      if (response.status < 500 || attempt === 3) return response
    } catch (error) {
      lastError = error
      if (attempt === 3) throw error
    } finally {
      clearTimeout(timeout)
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
    // Callers validate JSON shape.
  }

  return { response, text, json }
}

function analyzeDay(day, expectedCountry) {
  const items = Array.isArray(day.items) ? day.items : []
  const mappedItems = items.filter((item) => (
    item.place &&
    Number.isFinite(Number(item.place.latitude)) &&
    Number.isFinite(Number(item.place.longitude))
  ))
  const countries = [...new Set(mappedItems.map((item) => item.place.country).filter(Boolean))]
  const routes = Array.isArray(day.routes) ? day.routes : []
  const usableRoutes = routes.filter((route) => (
    Number.isFinite(Number(route.distance_m)) &&
    Number(route.distance_m) > 0 &&
    Number(route.distance_m) <= 25000
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
  const issues = []

  if (items.length === 0) issues.push('day has no itinerary items')
  if (mappedItems.length !== items.length) issues.push(`mapped ${mappedItems.length}/${items.length} itinerary items`)
  if (duplicateMappedStops.length > 0) issues.push('day has duplicate mapped stops')
  if (mappedItems.length > 0 && countries.length === 0) issues.push('day has mapped stops without country labels')
  if (expectedCountry && countries.some((country) => country !== expectedCountry)) {
    issues.push(`mapped country does not match ${expectedCountry}`)
  }
  if (requireUsableRoutes && mappedItems.length > 1 && usableRoutes.length === 0) issues.push('day has no usable route')

  return {
    dayIndex: day.day_index,
    title: day.title || null,
    itemCount: items.length,
    mappedItemCount: mappedItems.length,
    uniqueMappedStopCount: seenStopKeys.size,
    duplicateMappedStops,
    countries,
    expectedCountry: expectedCountry || null,
    usableRouteCount: usableRoutes.length,
    routeDistanceMeters: usableRoutes.map((route) => route.distance_m),
    issues,
    ok: issues.length === 0,
  }
}

async function readRenderedShareState(page, shareSlug, expectedDayTitles) {
  await page.goto(`${baseUrl}/t/${shareSlug}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForFunction(() => {
    const text = document.body?.innerText || ''
    const normalized = text.toLowerCase()
    return (
      normalized.includes('day-by-day itinerary') ||
      normalized.includes('this itinerary link is unavailable.') ||
      normalized.includes('application error')
    )
  }, undefined, { timeout: 18000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})

  return page.evaluate((dayTitles) => {
    const text = document.body?.innerText || ''
    const normalized = text.toLowerCase()
    const compact = text.replace(/\s+/g, '').toLowerCase()
    const routeLabels = Array.from(document.querySelectorAll('*'))
      .map((element) => ({
        spaced: (element.textContent || '').trim().replace(/\s+/g, ' '),
        compact: (element.textContent || '').replace(/\s+/g, '').toLowerCase(),
      }))
      .filter((value) => (
        ['Live route', 'Static Route', 'Static route preview', 'Route ready to review', 'Trip map'].includes(value.spaced) ||
        ['liveroute', 'staticroute', 'staticroutepreview', 'routereadytoreview', 'tripmap'].includes(value.compact)
      ))
      .map((value) => value.spaced)
    const visibleDayTitles = dayTitles.filter((title) => title && text.includes(title))
    const stopChipMentions = (text.match(/\b\d+\s+stops?\b/gi) || []).length
    const buttons = Array.from(document.querySelectorAll('button'))
      .map((button) => (button.textContent || '').trim().replace(/\s+/g, ' '))
      .filter(Boolean)
    const mapboxCanvasCount = document.querySelectorAll('.mapboxgl-canvas').length

    return {
      url: location.href,
      title: document.title,
      hasSharedMapLabel: compact.includes('sharedglobe.travelmap'),
      hasItineraryHeading: compact.includes('day-by-dayitinerary'),
      hasDayPlanHeading: text.includes('What the group will actually do'),
      hasStartCta: normalized.includes('start your own trip'),
      hasFeedback: normalized.includes('add your reaction') && normalized.includes('friend feedback'),
      hasShareControls: buttons.includes('Copy link') && buttons.includes('Share'),
      routeLabelCount: routeLabels.length,
      routeLabels,
      mapboxCanvasCount,
      mapSurfaceCount: Math.max(mapboxCanvasCount, routeLabels.length),
      stopChipMentions,
      visibleDayTitleCount: visibleDayTitles.length,
      missingDayTitles: dayTitles.filter((title) => title && !text.includes(title)),
      hasUnavailableState: text.includes('This itinerary link is unavailable.'),
      hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => text.includes(pattern)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }
  }, expectedDayTitles)
}

async function checkShareSlug(shareSlug) {
  const expectedCountry = expectedCountryMap[shareSlug] || null
  const tripApi = await fetchJson(`/api/trips/share/${shareSlug}`)
  const trip = tripApi.json?.trip || null
  const days = Array.isArray(tripApi.json?.days) ? tripApi.json.days : []
  const apiIssues = []

  if (!tripApi.response.ok) apiIssues.push(`API returned HTTP ${tripApi.response.status}`)
  if (!trip?.title) apiIssues.push('API did not return a trip title')
  if (days.length === 0) apiIssues.push('API did not return itinerary days')

  const dayIntegrity = days.map((day) => analyzeDay(day, expectedCountry))
  const badDays = dayIntegrity.filter((day) => !day.ok)
  const apiOk = apiIssues.length === 0 && badDays.length === 0
  if (!apiOk) addFailure(shareSlug, 'public share API map/itinerary integrity', { apiIssues, badDays })

  const rendered = []
  if (!browser) {
    browser = await withTimeout(
      chromium.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
      }),
      'public share map browser launch',
      browserLaunchTimeoutMs,
    )
  }

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      isMobile: viewport.id === 'phone',
    })
    const page = await context.newPage()
    const screenshot = `${screenshotDir}/${shareSlug}-${viewport.id}.png`
    let state = null
    const issues = []
    let ok = false

    try {
      page.setDefaultTimeout?.(renderTimeoutMs)
      page.setDefaultNavigationTimeout?.(renderTimeoutMs)
      state = await withTimeout(
        readRenderedShareState(page, shareSlug, dayIntegrity.map((day) => day.title).filter(Boolean)),
        `public share ${shareSlug} ${viewport.id} render`,
        renderTimeoutMs,
      )

      await withTimeout(
        page.screenshot({ path: repoPath(screenshot), fullPage: true, timeout: screenshotTimeoutMs }),
        `public share ${shareSlug} ${viewport.id} screenshot`,
        screenshotTimeoutMs + 1000,
      )

      if (!state.hasSharedMapLabel) issues.push('missing shared map label')
      if (!state.hasItineraryHeading) issues.push('missing itinerary heading')
      if (!state.hasDayPlanHeading) issues.push('missing day plan heading')
      if (!state.hasStartCta) issues.push('missing recipient start CTA')
      if (!state.hasFeedback) issues.push('missing feedback surfaces')
      if (!state.hasShareControls) issues.push('missing copy/share controls')
      if (state.mapSurfaceCount < Math.max(1, days.length)) issues.push(`found ${state.mapSurfaceCount} rendered map surfaces for ${days.length} days`)
      if (state.stopChipMentions < Math.max(1, days.length)) issues.push(`found ${state.stopChipMentions} stop-count chips for ${days.length} days`)
      if (state.missingDayTitles.length > 0) issues.push(`missing visible day titles: ${state.missingDayTitles.join(', ')}`)
      if (state.hasUnavailableState) issues.push('rendered unavailable state')
      if (state.hasAppError) issues.push('rendered application error')
      if (state.horizontalOverflow) issues.push(`horizontal overflow ${state.scrollWidth}px > ${state.clientWidth}px`)

      ok = issues.length === 0
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error))
      state = {
        url: `${baseUrl}/t/${shareSlug}`,
        title: null,
        hasSharedMapLabel: false,
        hasItineraryHeading: false,
        hasDayPlanHeading: false,
        hasStartCta: false,
        hasFeedback: false,
        hasShareControls: false,
        routeLabelCount: 0,
        routeLabels: [],
        mapboxCanvasCount: 0,
        mapSurfaceCount: 0,
        stopChipMentions: 0,
        visibleDayTitleCount: 0,
        missingDayTitles: dayIntegrity.map((day) => day.title).filter(Boolean),
        hasUnavailableState: false,
        hasAppError: false,
        horizontalOverflow: false,
        clientWidth: viewport.width,
        scrollWidth: viewport.width,
      }
    }
    if (!ok) addFailure(shareSlug, `public share rendered map/itinerary ${viewport.id}`, { issues, state })
    rendered.push({
      viewport: viewport.id,
      width: viewport.width,
      height: viewport.height,
      screenshot,
      ok,
      issues,
      state,
    })
    await closeWithTimeout(context, `public share ${shareSlug} ${viewport.id} context close`)
  }

  return {
    shareSlug,
    expectedCountry,
    tripTitle: trip?.title || null,
    apiStatus: tripApi.response.status,
    dayCount: days.length,
    dayIntegrity,
    rendered,
    ok: apiOk && rendered.every((result) => result.ok),
  }
}

function markdownReport(summary) {
  const rows = summary.shareResults.map((result) => (
    `| ${result.shareSlug} | ${result.ok ? 'Pass' : 'Fail'} | ${result.tripTitle || 'n/a'} | ${result.dayCount} | ${result.expectedCountry || 'any'} | ${result.rendered.length} |`
  ))

  return `# Public Share Map Itinerary Integrity

Date: ${summary.date}
Base URL: ${summary.baseUrl}

## Result

- Checked shares: ${summary.shareResults.length}
- Checked viewports: ${summary.checkedViewports}
- Passed shares: ${summary.passed}
- Failed shares: ${summary.failed}
- Discovery mode: ${summary.discovery.enabled ? 'yes' : 'no'}
- Discovered public shares: ${summary.discovery.enabled ? `${summary.discovery.shareCount}/${summary.discovery.totalPublicShares ?? 'unknown'}` : 'n/a'}
- Requires usable route lines: ${summary.requireUsableRoutes ? 'yes' : 'no'}

| Share | Result | Trip | Days | Expected country | Rendered viewports |
| --- | --- | --- | ---: | --- | ---: |
${rows.join('\n')}

## Failures

${markdownList(summary.failures.map((failure) => `${failure.shareSlug}: ${failure.name}`))}

## Evidence

- JSON: \`${summary.jsonArtifact}\`
- Screenshots: \`${summary.artifactDir}/screenshots\`
`
}

let shareSlugs = [...requestedShareSlugs]
let discovery = {
  enabled: discoverPublicShares,
  limit: discoverPublicShares ? discoveryLimit : null,
  totalPublicShares: null,
  shareCount: 0,
  shares: [],
  includeRequestedSlugs: includeRequestedSlugsInDiscovery,
}

try {
  await mkdir(repoPath(screenshotDir), { recursive: true })
  if (discoverPublicShares) {
    const discovered = await discoverShareSlugs()
    discovery = {
      ...discovery,
      totalPublicShares: discovered.count ?? null,
      shareCount: discovered.shares.length,
      shares: discovered.shares,
    }
    const discoveredSlugs = discovered.shares.map((share) => share.shareSlug)
    shareSlugs = includeRequestedSlugsInDiscovery
      ? [...new Set([...requestedShareSlugs, ...discoveredSlugs])]
      : [...new Set(discoveredSlugs)]
    if (shareSlugs.length === 0) {
      addFailure('discovery', 'public share discovery returned no share slugs', { discovery })
    }
  }

  for (const shareSlug of shareSlugs) {
    results.push(await checkShareSlug(shareSlug))
  }
} catch (error) {
  addFailure('run', 'public share map itinerary integrity completed without exception', {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  await closeWithTimeout(browser, 'public share map browser close')
}

const summary = {
  date,
  baseUrl,
  shareSlugs,
  requestedShareSlugs,
  discovery,
  requireUsableRoutes,
  expectedCountryMap,
  artifactDir,
  jsonArtifact: artifactPath,
  reportArtifact: reportPath,
  checked: results.length,
  checkedViewports: results.reduce((total, result) => total + result.rendered.length, 0),
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  shareResults: results,
  failures,
}

await writeFile(repoPath(artifactPath), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(reportPath), markdownReport(summary))

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
