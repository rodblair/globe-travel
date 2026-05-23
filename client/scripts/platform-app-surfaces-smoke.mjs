import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'
import { currentQaDate } from './qa-date-utils.mjs'

const GUEST_SESSION_COOKIE = 'globe_travel_guest'

const root = resolve(process.cwd(), '..')
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const requestedDate = process.env.QA_APP_SURFACES_DATE || currentQaDate()
const artifactName = process.env.QA_APP_SURFACES_ARTIFACT_NAME || `app-surfaces-smoke-${requestedDate}`
const artifactDir = resolve(root, 'qa', artifactName)
const screenshotDir = resolve(artifactDir, 'screenshots')
const jsonArtifact = process.env.QA_APP_SURFACES_JSON || `${artifactName}.json`
const reportArtifact = process.env.QA_APP_SURFACES_REPORT || `${artifactName}.md`
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const providedGuestId = process.env.QA_APP_SURFACES_GUEST_ID || process.env.QA_GUEST_ID || ''
const guestId = providedGuestId || randomUUID()
const allowRemoteGuest = process.env.QA_APP_SURFACES_ALLOW_REMOTE_GUEST === '1'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const markerTimeoutMs = Number(process.env.QA_APP_SURFACES_MARKER_TIMEOUT_MS || '10000')
const navigationTimeoutMs = Number(process.env.QA_APP_SURFACES_NAVIGATION_TIMEOUT_MS || '30000')
const settleMs = Number(process.env.QA_APP_SURFACES_SETTLE_MS || '900')

const viewports = [
  { id: 'phone', width: 390, height: 844 },
  { id: 'desktop', width: 1440, height: 950 },
]

const surfaces = [
  {
    id: 'explore-alias',
    path: '/explore',
    expectedPath: '/chat',
    expectedSearch: '',
    markers: ['Planner', 'Trip Studio'],
    intent: 'Explore remains a working compatibility path into Planner.',
  },
  {
    id: 'globe-alias',
    path: '/globe',
    expectedPath: '/chat',
    expectedSearch: '',
    markers: ['Planner', 'Trip Studio'],
    intent: 'Globe remains a working compatibility path into Planner.',
  },
  {
    id: 'map-alias',
    path: '/map',
    expectedPath: '/chat',
    expectedSearch: '',
    markers: ['Planner', 'Trip Studio'],
    intent: 'Map compatibility path opens the Planner so map-seeking users can create itinerary maps.',
  },
  {
    id: 'bucket-list-alias',
    path: '/bucket-list',
    expectedPath: '/saved',
    expectedSearch: '',
    markers: ['Trips', 'Saved itineraries'],
    intent: 'Bucket list compatibility path lands in the saved workspace.',
  },
  {
    id: 'journal-alias',
    path: '/journal',
    expectedPath: '/saved',
    expectedSearch: '?tab=journal',
    markers: ['Trip notes', 'Capture decisions'],
    intent: 'Journal compatibility path opens the notes tab.',
  },
  {
    id: 'profile-alias',
    path: '/profile',
    expectedPath: '/account',
    expectedSearch: '',
    markers: ['Account', 'Profile'],
    intent: 'Profile compatibility path opens account profile settings.',
  },
  {
    id: 'settings-alias',
    path: '/settings',
    expectedPath: '/account',
    expectedSearch: '',
    markers: ['Account', 'Profile'],
    intent: 'Settings compatibility path opens account profile settings.',
  },
  {
    id: 'pricing-alias',
    path: '/pricing',
    expectedPath: '/pricing',
    expectedSearch: '',
    markers: ['Globe.travel pricing', 'Start 7-day free trial', 'Adventurer'],
    intent: 'Pricing renders a public commercial plan page for guest and signed-in contexts.',
  },
  {
    id: 'trips-index-compat',
    path: '/trips',
    expectedPath: '/saved',
    expectedSearch: '',
    markers: ['Trips', 'Saved itineraries'],
    intent: 'Trips index compatibility path lands in the saved workspace.',
  },
  {
    id: 'new-trip-compat',
    path: '/trips/new',
    expectedPath: '/chat',
    expectedSearch: '',
    markers: ['Planner', 'Trip Studio'],
    intent: 'New trip compatibility path opens the Planner.',
  },
  {
    id: 'onboarding-fullscreen',
    path: '/onboarding',
    expectedPath: '/onboarding',
    expectedSearch: '',
    markers: ['Start your group trip', 'Tell Globe.travel'],
    intent: 'Onboarding renders as the first-run trip-starting experience.',
  },
]

function repoPath(path) {
  return resolve(root, path)
}

function screenshotName(routeId, viewportId) {
  return `${routeId}-${viewportId}.png`.replace(/[^a-z0-9.-]/gi, '-').toLowerCase()
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

async function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env.local')
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

async function cleanupGeneratedGuest() {
  if (providedGuestId) {
    return {
      attempted: false,
      reason: 'external guest id provided; owner cleanup remains with the caller',
      guestId,
      profileDeleted: false,
      userDeleted: false,
      error: null,
    }
  }

  if (!isLocalBaseUrl && !allowRemoteGuest) {
    return {
      attempted: false,
      reason: 'remote guest cleanup skipped',
      guestId,
      profileDeleted: false,
      userDeleted: false,
      error: null,
    }
  }

  await loadDotEnv()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return {
      attempted: false,
      reason: 'missing Supabase service role cleanup credentials',
      guestId,
      profileDeleted: false,
      userDeleted: false,
      error: null,
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
  const { error: profileError } = await supabase.from('profiles').delete().eq('id', guestId)
  const { error: userError } = await supabase.auth.admin.deleteUser(guestId)
  const userAlreadyAbsent = userError?.message?.toLowerCase().includes('user not found')

  return {
    attempted: true,
    reason: null,
    guestId,
    profileDeleted: !profileError,
    userDeleted: !userError || Boolean(userAlreadyAbsent),
    error: profileError?.message || (userError && !userAlreadyAbsent ? userError.message : null),
  }
}

async function authenticateContext(context) {
  await context.addCookies([
    {
      name: GUEST_SESSION_COOKIE,
      value: guestId,
      domain: new URL(baseUrl).hostname,
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
      secure: baseUrl.startsWith('https://'),
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ])

  const cookies = await context.cookies(baseUrl)
  const guestCookie = cookies.find((cookie) => cookie.name === GUEST_SESSION_COOKIE)
  return {
    mode: 'guest',
    guestId,
    cookieSet: guestCookie?.value === guestId,
  }
}

async function collectSurface(page, surface, viewport) {
  const pageErrors = []
  const consoleErrors = []
  const failedRequests = []

  const pageErrorHandler = (error) => {
    pageErrors.push(error.message)
  }
  const consoleHandler = (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  }
  const requestFailedHandler = (request) => {
    const url = request.url()
    if (url.startsWith(baseUrl)) {
      const error = request.failure()?.errorText || 'request failed'
      if (error === 'net::ERR_ABORTED') return
      failedRequests.push({
        url,
        error,
      })
    }
  }

  page.on('pageerror', pageErrorHandler)
  page.on('console', consoleHandler)
  page.on('requestfailed', requestFailedHandler)

  let response = null
  let navigationError = null
  const startedAt = Date.now()
  try {
    response = await page.goto(`${baseUrl}${surface.path}`, {
      waitUntil: 'domcontentloaded',
      timeout: navigationTimeoutMs,
    })
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error)
  }

  await page.waitForLoadState('networkidle', { timeout: 1800 }).catch(() => {})
  await page.waitForTimeout(settleMs)
  await page.waitForFunction(
    ({ markers }) => {
      const text = [
        document.body?.innerText || '',
        ...Array.from(document.querySelectorAll('[aria-label], input[placeholder], textarea[placeholder]')).map((el) => (
          el.getAttribute('aria-label') ||
          el.getAttribute('placeholder') ||
          ''
        )),
      ].join('\n').toLowerCase()

      return markers.every((marker) => text.includes(String(marker).toLowerCase()))
    },
    { markers: surface.markers.filter((marker) => !Array.isArray(marker)) },
    { timeout: markerTimeoutMs }
  ).catch(() => {})

  const preflight = await page.evaluate(({ markers }) => {
    const bodyText = document.body?.innerText || ''
    const accessibleText = [
      bodyText,
      ...Array.from(document.querySelectorAll('[aria-label], input[placeholder], textarea[placeholder]')).map((el) => (
        el.getAttribute('aria-label') ||
        el.getAttribute('placeholder') ||
        ''
      )),
    ].join('\n')
    const documentElement = document.documentElement
    const horizontalOverflow = documentElement.scrollWidth > documentElement.clientWidth + 1
    const main = document.querySelector('main, [role="main"], #main-content')
    const heading = document.querySelector('h1, h2')
    const skipLink = document.querySelector('.skip-link')
    const skipLinkRect = skipLink?.getBoundingClientRect()
    const hiddenSkipLinkLeaks = Boolean(
      skipLinkRect &&
      skipLinkRect.width > 0 &&
      skipLinkRect.height > 0 &&
      skipLinkRect.bottom > 0 &&
      skipLink !== document.activeElement
    )
    const appError = /application error|unhandled runtime error|something went wrong/i.test(bodyText)
    const interactiveElements = Array.from(document.querySelectorAll('a[href], button, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])'))
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
      })
    const tinyTargets = interactiveElements
      .map((element) => {
        const rect = element.getBoundingClientRect()
        const label = (
          element.getAttribute('aria-label') ||
          element.getAttribute('title') ||
          element.textContent ||
          element.getAttribute('href') ||
          element.tagName
        ).trim().replace(/\s+/g, ' ').slice(0, 80)
        return {
          label,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      })
      .filter((target) => target.width < 32 || target.height < 32)
      .slice(0, 10)

    return {
      title: document.title,
      url: location.href,
      pathname: location.pathname,
      search: location.search,
      hasMainLandmark: Boolean(main),
      hasHeading: Boolean(heading),
      hiddenSkipLinkLeaks,
      horizontalOverflow,
      appError,
      textLength: bodyText.trim().length,
      missingMarkers: markers.filter((marker) => !accessibleText.toLowerCase().includes(String(marker).toLowerCase())),
      tinyTargets,
    }
  }, { markers: surface.markers })

  const screenshotPath = resolve(screenshotDir, screenshotName(surface.id, viewport.id))
  await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {})
  page.off('pageerror', pageErrorHandler)
  page.off('console', consoleHandler)
  page.off('requestfailed', requestFailedHandler)

  const issues = []
  if (navigationError) issues.push(`navigation failed: ${navigationError}`)
  if (!response || response.status() >= 500) issues.push(`HTTP ${response?.status() || 'missing'}`)
  if (preflight.pathname !== surface.expectedPath) {
    issues.push(`expected path ${surface.expectedPath}, got ${preflight.pathname}`)
  }
  if (preflight.search !== surface.expectedSearch) {
    issues.push(`expected search ${surface.expectedSearch || 'empty'}, got ${preflight.search || 'empty'}`)
  }
  if (preflight.missingMarkers.length > 0) {
    issues.push(`missing marker(s): ${preflight.missingMarkers.join(', ')}`)
  }
  if (preflight.textLength < 80) issues.push('surface rendered too little user-facing content')
  if (!preflight.hasHeading) issues.push('missing visible heading')
  if (preflight.hiddenSkipLinkLeaks) issues.push('hidden skip link leaks into the viewport')
  if (preflight.horizontalOverflow) issues.push('horizontal overflow detected')
  if (preflight.appError) issues.push('application error text detected')
  if (pageErrors.length > 0) issues.push(`${pageErrors.length} browser page error(s)`)
  if (consoleErrors.length > 0) issues.push(`${consoleErrors.length} browser console error(s)`)
  if (failedRequests.length > 0) issues.push(`${failedRequests.length} same-origin failed request(s)`)

  return {
    routeId: surface.id,
    path: surface.path,
    expectedPath: surface.expectedPath,
    expectedSearch: surface.expectedSearch,
    viewportId: viewport.id,
    viewport: {
      width: viewport.width,
      height: viewport.height,
    },
    intent: surface.intent,
    status: response?.status() || 0,
    finalUrl: preflight.url,
    elapsedMs: Date.now() - startedAt,
    screenshot: `qa/${artifactName}/screenshots/${screenshotName(surface.id, viewport.id)}`,
    missingMarkers: preflight.missingMarkers,
    pageErrors,
    consoleErrorCount: consoleErrors.length,
    consoleErrors: consoleErrors.slice(0, 10),
    failedRequests,
    tinyTargets: preflight.tinyTargets,
    preflight,
    ok: issues.length === 0,
    issues,
  }
}

if (!existsSync(chromePath)) {
  console.error(`Chrome executable not found at ${chromePath}. Set QA_CHROME_PATH to a Chrome-compatible browser.`)
  process.exit(1)
}

if (!isLocalBaseUrl && !allowRemoteGuest) {
  console.error('qa:app-surfaces uses guest auth and only runs against localhost unless QA_APP_SURFACES_ALLOW_REMOTE_GUEST=1 is set.')
  process.exit(1)
}

await mkdir(screenshotDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
})

const results = []
const authContexts = []

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  })
  authContexts.push({ viewportId: viewport.id, ...(await authenticateContext(context)) })
  const page = await context.newPage()

  for (const surface of surfaces) {
    console.error(`[qa:app-surfaces] ${surface.id} @ ${viewport.id}`)
    results.push(await collectSurface(page, surface, viewport))
  }

  await context.close()
}

await browser.close()
const cleanup = await cleanupGeneratedGuest()

const failures = results.filter((result) => !result.ok)
const summary = {
  date: requestedDate,
  baseUrl,
  localOnly: !allowRemoteGuest,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  routeCount: surfaces.length,
  viewportCount: viewports.length,
  requiredRoutes: surfaces.map((surface) => surface.id),
  viewports: viewports.map((viewport) => viewport.id),
  auth: {
    mode: 'guest',
    guestId,
    contexts: authContexts,
    cleanup,
  },
  artifactDir: `qa/${artifactName}`,
  jsonArtifact: `qa/${jsonArtifact}`,
  reportArtifact: `qa/${reportArtifact}`,
  results,
  failures,
}

const report = `# Authenticated App Surfaces Smoke

Date: ${summary.date}
Base URL: ${summary.baseUrl}
Status: ${summary.status}
Auth mode: guest

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Routes: ${summary.routeCount}
- Viewports: ${summary.viewportCount}
- Guest cleanup: ${cleanup.attempted ? `attempted (${cleanup.error || 'ok'})` : cleanup.reason}

## Coverage

| Surface | Viewport | Expected Destination | Final URL | Result |
| --- | --- | --- | --- | --- |
${results.map((result) => `| ${result.routeId} | ${result.viewportId} | \`${result.expectedPath}${result.expectedSearch}\` | ${result.finalUrl} | ${result.ok ? 'Pass' : 'Fail'} |`).join('\n')}

## Failures

${markdownList(failures.map((failure) => `${failure.routeId} @ ${failure.viewportId}: ${failure.issues.join('; ')}`))}

## Operating Meaning

This gate verifies that Globe.travel's secondary authenticated routes, legacy trip entry paths, and compatibility aliases still land on useful user-facing surfaces after login or guest entry. It is intentionally smaller than the full release candidate suite, but catches broken redirects, empty pages, app errors, same-origin request failures, horizontal overflow, and missing core copy across phone and desktop.
`

await writeFile(repoPath(`qa/${jsonArtifact}`), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(`qa/${reportArtifact}`), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
