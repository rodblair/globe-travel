import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'

const require = createRequire(import.meta.url)

const GUEST_SESSION_COOKIE = 'globe_travel_guest'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG || 'x3m2c8cnws'
const tripId = process.env.QA_TRIP_ID || ''
const date = process.env.QA_A11Y_DATE || new Date().toISOString().slice(0, 10)
const runId = process.env.QA_A11Y_RUN_ID || ''
const artifactName = process.env.QA_A11Y_ARTIFACT_NAME || `accessibility-keyboard-${date}${runId ? `-${runId}` : ''}`
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const root = resolve(process.cwd(), '..')
const artifactDir = resolve(root, 'qa', artifactName)
const axePath = require.resolve('axe-core/axe.min.js')
const axeSource = await readFile(axePath, 'utf8')

const routeFilter = (process.env.QA_A11Y_ROUTES || '').split(',').map((entry) => entry.trim()).filter(Boolean)
const viewportFilter = (process.env.QA_A11Y_VIEWPORTS || '').split(',').map((entry) => entry.trim()).filter(Boolean)
const tabLimit = Number(process.env.QA_A11Y_TAB_LIMIT || '12')
const requestedAuthMode = process.env.QA_A11Y_AUTH_MODE || 'auto'
const providedGuestId = process.env.QA_A11Y_GUEST_ID || process.env.QA_GUEST_ID || ''
const accessibilityGuestId = providedGuestId || randomUUID()
const allowRemoteGuestAuth = process.env.QA_A11Y_ALLOW_REMOTE_GUEST === '1'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)

const allViewports = [
  { id: 'phone', width: 390, height: 844 },
  { id: 'desktop', width: 1440, height: 950 },
]

const allRoutes = [
  { id: 'landing', path: '/', markers: ['Globe.travel', 'Start planning'] },
  { id: 'planner', path: '/chat', markers: ['Planner', 'Describe your trip idea'] },
  { id: 'saved-trips', path: '/saved', markers: ['Trips'] },
  { id: 'account-profile', path: '/account', markers: ['Account'] },
  { id: 'account-billing', path: '/account?tab=billing', markers: ['Plan and billing'] },
  { id: 'pricing', path: '/pricing', markers: ['Globe.travel pricing', 'Start 7-day free trial', 'Adventurer'] },
  { id: 'trips-index-compat', path: '/trips', markers: ['Trips', 'Saved itineraries'] },
  { id: 'new-trip-compat', path: '/trips/new', markers: ['Planner', 'Trip Studio'] },
  { id: 'login', path: '/login', markers: ['Welcome back', 'Continue as guest'] },
  { id: 'signup', path: '/signup', markers: ['Create your account', 'Continue as guest'] },
  { id: 'public-share', path: `/t/${shareSlug}`, markers: ['Start your own trip', 'Friend feedback'] },
]

if (tripId) {
  allRoutes.push({
    id: 'trip-studio',
    path: `/trips/${tripId}`,
    markers: ['Itinerary', 'Save trip', 'Build maps'],
  })
}

const viewports = viewportFilter.length
  ? allViewports.filter((viewport) => viewportFilter.includes(viewport.id))
  : allViewports
const routes = routeFilter.length
  ? allRoutes.filter((route) => routeFilter.includes(route.id))
  : allRoutes
const protectedRouteIds = new Set([
  'planner',
  'saved-trips',
  'account-profile',
  'account-billing',
  'trips-index-compat',
  'new-trip-compat',
  'trip-studio',
])
const protectedRoutes = routes.filter((route) => protectedRouteIds.has(route.id)).map((route) => route.id)
const useGuestAuth = requestedAuthMode === 'guest' || (requestedAuthMode === 'auto' && isLocalBaseUrl && protectedRoutes.length > 0)
let guestCleanup = {
  attempted: false,
  reason: useGuestAuth
    ? (providedGuestId ? 'external guest id provided; owner cleanup remains with the caller' : 'not run yet')
    : 'guest accessibility auth not used',
  guestId: useGuestAuth ? accessibilityGuestId : null,
  profileDeleted: false,
  userDeleted: false,
  error: null,
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

async function authenticateAccessibilityContext(context) {
  if (!useGuestAuth) return { mode: 'none', guestId: null, cookieSet: false }

  const parsedBaseUrl = new URL(baseUrl)
  await context.addCookies([
    {
      name: GUEST_SESSION_COOKIE,
      value: accessibilityGuestId,
      domain: parsedBaseUrl.hostname,
      path: '/',
      httpOnly: false,
      secure: baseUrl.startsWith('https://'),
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    },
  ])

  const cookies = await context.cookies(baseUrl)
  const guestCookie = cookies.find((cookie) => cookie.name === GUEST_SESSION_COOKIE)

  return {
    mode: 'guest',
    guestId: accessibilityGuestId,
    cookieSet: guestCookie?.value === accessibilityGuestId,
  }
}

async function cleanupGeneratedGuest() {
  if (!useGuestAuth || providedGuestId) return

  if (!isLocalBaseUrl && !allowRemoteGuestAuth) {
    guestCleanup = {
      ...guestCleanup,
      attempted: false,
      reason: 'remote guest accessibility cleanup skipped',
    }
    return
  }

  await loadDotEnv()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    guestCleanup = {
      ...guestCleanup,
      attempted: false,
      reason: 'missing Supabase service role cleanup credentials',
    }
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', accessibilityGuestId)
      const { error: userError } = await supabase.auth.admin.deleteUser(accessibilityGuestId)
      const userAlreadyAbsent = userError?.message?.toLowerCase().includes('user not found')

      guestCleanup = {
        attempted: true,
        reason: null,
        guestId: accessibilityGuestId,
        profileDeleted: !profileError,
        userDeleted: !userError || Boolean(userAlreadyAbsent),
        error: profileError?.message || (userError && !userAlreadyAbsent ? userError.message : null),
      }
      return
    } catch (error) {
      if (attempt < 3) {
        await sleep(750 * attempt)
        continue
      }
      guestCleanup = {
        attempted: true,
        reason: null,
        guestId: accessibilityGuestId,
        profileDeleted: false,
        userDeleted: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }
}

function markdownTable(rows) {
  return [
    '| Route | Viewport | Axe Critical/Serious | Axe Moderate | Keyboard Issues | Missing Markers | Result |',
    '| --- | --- | ---: | ---: | ---: | --- | --- |',
    ...rows.map((row) => (
      `| ${row.routeId} | ${row.viewportId} | ${row.axe.blockingViolations.length} | ${row.axe.warningViolations.length} | ${row.keyboard.issues.length} | ${row.missingMarkers.length ? row.missingMarkers.join(', ') : 'none'} | ${row.ok ? 'Pass' : 'Fail'} |`
    )),
  ].join('\n')
}

function compactViolation(violation) {
  return {
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.slice(0, 5).map((node) => ({
      target: node.target,
      failureSummary: node.failureSummary,
    })),
  }
}

async function collectA11y(page, route, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  let response = null
  let lastNavigationError = null
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      })
      break
    } catch (error) {
      lastNavigationError = error
      if (attempt === 3) throw error
      await sleep(600 * attempt)
    }
  }

  await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {})
  await page.waitForTimeout(700)
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

      return markers.every((marker) => text.includes(marker.toLowerCase()))
    },
    { markers: route.markers },
    { timeout: 10000 }
  ).catch(() => {})
  await page.addScriptTag({ content: axeSource })

  const preflight = await page.evaluate(({ markers }) => {
    const text = document.body?.innerText || ''
    const accessibleText = [
      text,
      ...Array.from(document.querySelectorAll('[aria-label], input[placeholder], textarea[placeholder]')).map((el) => (
        el.getAttribute('aria-label') ||
        el.getAttribute('placeholder') ||
        ''
      )),
    ].join('\n')
    const target = document.querySelector('#main-content')
    const mainLandmark = document.querySelector('main, [role="main"], #main-content')
    const skipLink = document.querySelector('a.skip-link[href="#main-content"]')
    const heading = document.querySelector('h1')

    return {
      title: document.title,
      url: location.href,
      hasSkipLink: Boolean(skipLink),
      hasSkipTarget: Boolean(target),
      hasMainLandmark: Boolean(mainLandmark),
      hasH1: Boolean(heading),
      missingMarkers: markers.filter((marker) => !accessibleText.toLowerCase().includes(marker.toLowerCase())),
    }
  }, { markers: route.markers })

  const axe = await page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      },
      resultTypes: ['violations'],
    })
  })

  const blockingViolations = axe.violations
    .filter((violation) => violation.impact === 'critical' || violation.impact === 'serious')
    .map(compactViolation)

  const warningViolations = axe.violations
    .filter((violation) => violation.impact === 'moderate')
    .map(compactViolation)

  const keyboard = await collectKeyboardPath(page, Math.max(4, tabLimit))

  const structureIssues = []
  if (!preflight.hasSkipLink) structureIssues.push('Missing skip link')
  if (!preflight.hasSkipTarget) structureIssues.push('Missing skip target')
  if (!preflight.hasMainLandmark) structureIssues.push('Missing main landmark')
  if (!preflight.hasH1) structureIssues.push('Missing h1')

  const ok =
    response &&
    response.status() >= 200 &&
    response.status() < 400 &&
    preflight.missingMarkers.length === 0 &&
    blockingViolations.length === 0 &&
    structureIssues.length === 0 &&
    keyboard.issues.length === 0

  return {
    routeId: route.id,
    path: route.path,
    viewportId: viewport.id,
    requestedViewport: viewport,
    status: response?.status() || 0,
    navigationError: lastNavigationError instanceof Error ? lastNavigationError.message : null,
    ok,
    preflight,
    missingMarkers: preflight.missingMarkers,
    structureIssues,
    axe: {
      blockingViolations,
      warningViolations,
      rawViolationCount: axe.violations.length,
    },
    keyboard,
  }
}

async function collectKeyboardPath(page, limit) {
  const sequence = []

  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })

  for (let index = 0; index < limit; index += 1) {
    await page.keyboard.press('Tab')
    sequence.push(await page.evaluate(() => {
      function visibleText(el) {
        return (
          el.getAttribute('aria-label') ||
          el.getAttribute('title') ||
          el.getAttribute('placeholder') ||
          el.textContent ||
          el.getAttribute('href') ||
          el.tagName
        ).trim().replace(/\s+/g, ' ').slice(0, 120)
      }

      const active = document.activeElement
      if (!(active instanceof HTMLElement)) {
        return {
          tag: 'none',
          label: 'No active element',
          visible: false,
          hasAccessibleName: false,
          rect: null,
        }
      }

      const rect = active.getBoundingClientRect()
      const style = window.getComputedStyle(active)
      const label = visibleText(active)

      return {
        tag: active.tagName.toLowerCase(),
        label,
        role: active.getAttribute('role') || '',
        href: active.getAttribute('href') || '',
        visible:
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden',
        hasAccessibleName: Boolean(label),
        rect: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
      }
    }))
  }

  const issues = []
  const usableSequence = sequence.filter((entry) => (
    entry.tag !== 'body' &&
    entry.tag !== 'html' &&
    entry.tag !== 'nextjs-portal'
  ))
  const uniqueLabels = new Set(usableSequence.map((entry) => `${entry.tag}:${entry.label}`))
  const hiddenFocus = usableSequence.filter((entry) => !entry.visible)
  const unnamedFocus = usableSequence.filter((entry) => !entry.hasAccessibleName)

  if (usableSequence.length < 3) issues.push(`Only ${usableSequence.length} usable focus stops in first ${limit} tabs`)
  if (uniqueLabels.size < 3) issues.push(`Only ${uniqueLabels.size} distinct focus targets in first ${limit} tabs`)
  if (hiddenFocus.length > 0) issues.push(`${hiddenFocus.length} hidden or zero-size focus target(s)`)
  if (unnamedFocus.length > 0) issues.push(`${unnamedFocus.length} focused control(s) without an accessible name`)

  return { limit, sequence, issues }
}

if (!existsSync(chromePath)) {
  console.error(`Chrome executable not found at ${chromePath}. Set QA_CHROME_PATH to a Chrome-compatible browser.`)
  process.exit(1)
}

if (routeFilter.length && routes.length !== routeFilter.length) {
  const found = new Set(routes.map((route) => route.id))
  const missing = routeFilter.filter((routeId) => !found.has(routeId))
  console.error(`Unknown QA_A11Y_ROUTES entries: ${missing.join(', ')}`)
  process.exit(1)
}

if (viewportFilter.length && viewports.length !== viewportFilter.length) {
  const found = new Set(viewports.map((viewport) => viewport.id))
  const missing = viewportFilter.filter((viewportId) => !found.has(viewportId))
  console.error(`Unknown QA_A11Y_VIEWPORTS entries: ${missing.join(', ')}`)
  process.exit(1)
}

if (!['auto', 'none', 'guest'].includes(requestedAuthMode)) {
  console.error('QA_A11Y_AUTH_MODE must be one of: auto, none, guest.')
  process.exit(1)
}

if (useGuestAuth && !isLocalBaseUrl && !allowRemoteGuestAuth) {
  console.error('Guest-auth accessibility QA on remote URLs can create remote guest state. Set QA_A11Y_ALLOW_REMOTE_GUEST=1 to allow it intentionally.')
  process.exit(1)
}

await mkdir(artifactDir, { recursive: true })

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
})

const results = []
const failures = []
const authContexts = []

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  })
  const authContext = await authenticateAccessibilityContext(context)
  authContexts.push({ viewportId: viewport.id, ...authContext })
  const page = await context.newPage()

  for (const route of routes) {
    console.error(`[qa:a11y] ${route.id} @ ${viewport.id}`)
    const result = await collectA11y(page, route, viewport)
    results.push(result)
    if (!result.ok) failures.push(result)
  }

  await context.close()
}

await cleanupGeneratedGuest()

const summary = {
  baseUrl,
  date,
  runId: runId || null,
  shareSlug,
  tripId: tripId || null,
  artifactDir,
  auth: {
    requestedMode: requestedAuthMode,
    mode: useGuestAuth ? 'guest' : 'none',
    guestId: useGuestAuth ? accessibilityGuestId : null,
    protectedRoutes,
    externalGuestId: Boolean(providedGuestId),
    allowRemoteGuestAuth,
    contexts: authContexts,
    cleanup: guestCleanup,
  },
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  routes: routes.map((route) => route.id),
  viewports,
  tabLimit,
  results,
  failures: failures.map((failure) => ({
    routeId: failure.routeId,
    viewportId: failure.viewportId,
    status: failure.status,
    missingMarkers: failure.missingMarkers,
    structureIssues: failure.structureIssues,
    blockingViolations: failure.axe.blockingViolations,
    keyboardIssues: failure.keyboard.issues,
    focusSequence: failure.keyboard.sequence,
  })),
}

const jsonPath = resolve(artifactDir, 'summary.json')
await writeFile(jsonPath, JSON.stringify(summary, null, 2))

const md = `# Accessibility And Keyboard Smoke

Date: ${date}
Environment: ${baseUrl}
Public share slug: ${shareSlug}
Trip Studio fixture: ${tripId || 'not included'}
Auth mode: ${useGuestAuth ? `guest (${providedGuestId ? 'external' : 'generated'} guest id)` : 'none'}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Artifact JSON: \`qa/${artifactName}/summary.json\`
- Protected routes: ${protectedRoutes.length ? protectedRoutes.join(', ') : 'none'}
- Guest cleanup: ${guestCleanup.attempted ? `attempted (${guestCleanup.error || 'ok'})` : guestCleanup.reason}

${markdownTable(results)}

## Failure Detail

${failures.length === 0 ? 'No failures.' : failures.map((failure) => `### ${failure.routeId} / ${failure.viewportId}

- Status: ${failure.status}
- Missing markers: ${failure.missingMarkers.length ? failure.missingMarkers.join(', ') : 'none'}
- Structure issues: ${failure.structureIssues.length ? failure.structureIssues.join(', ') : 'none'}
- Axe critical/serious violations: ${failure.axe.blockingViolations.length ? JSON.stringify(failure.axe.blockingViolations, null, 2) : 'none'}
- Keyboard issues: ${failure.keyboard.issues.length ? failure.keyboard.issues.join('; ') : 'none'}
- First focus stops: ${failure.keyboard.sequence.slice(0, 8).map((entry) => `${entry.tag}:${entry.label}`).join(' -> ')}
`).join('\n')}

## Notes

- This gate injects \`axe-core\` into local Chrome and fails on critical/serious WCAG violations.
- Moderate axe findings are recorded as warnings so they can be triaged without blocking unrelated release work.
- The keyboard smoke tabs through the first ${tabLimit} focus stops and fails hidden, unnamed, or trapped/empty focus paths.
- The release shell now includes a global skip link to \`#main-content\` so keyboard users can bypass repeated navigation.
- Guest auth can be enabled with \`QA_A11Y_AUTH_MODE=guest\`; remote guest checks require \`QA_A11Y_ALLOW_REMOTE_GUEST=1\` so protected launch routes are not accidentally replaced by login-screen coverage.
`

const mdPath = resolve(artifactDir, 'README.md')
await writeFile(mdPath, md)

console.log(JSON.stringify({
  baseUrl,
  checked: summary.checked,
  passed: summary.passed,
  failed: summary.failed,
  auth: {
    mode: summary.auth.mode,
    protectedRoutes: summary.auth.protectedRoutes,
    guestId: summary.auth.guestId,
    cleanup: summary.auth.cleanup,
  },
  artifactDir,
  summaryPath: jsonPath,
  reportPath: mdPath,
}, null, 2))

await Promise.race([
  browser.close(),
  new Promise((resolve) => setTimeout(resolve, 5000)),
])

process.exit(failures.length > 0 ? 1 : 0)
