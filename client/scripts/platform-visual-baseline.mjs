import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { createClient } from '@supabase/supabase-js'

const GUEST_SESSION_COOKIE = 'globe_travel_guest'

const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG || 'x3m2c8cnws'
const tripId = process.env.QA_TRIP_ID || ''
const date = process.env.QA_VISUAL_DATE || new Date().toISOString().slice(0, 10)
const runId = process.env.QA_VISUAL_RUN_ID || ''
const artifactName = process.env.QA_VISUAL_ARTIFACT_NAME || `visual-baseline-${date}${runId ? `-${runId}` : ''}`
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const root = resolve(process.cwd(), '..')
const artifactDir = resolve(root, 'qa', artifactName)
const screenshotDir = resolve(artifactDir, 'screenshots')
const diffDir = resolve(artifactDir, 'diffs')
const baselineDirInput = process.env.QA_VISUAL_BASELINE_DIR || ''
const baselineDir = baselineDirInput ? resolve(root, baselineDirInput) : ''
const diffFailureThreshold = Number(process.env.QA_VISUAL_DIFF_THRESHOLD || '0.015')
const pixelmatchThreshold = Number(process.env.QA_VISUAL_PIXEL_THRESHOLD || '0.12')
const settleMs = Number(process.env.QA_VISUAL_SETTLE_MS || '900')
const showProgress = process.env.QA_VISUAL_PROGRESS !== '0'
const routeFilter = (process.env.QA_VISUAL_ROUTES || '').split(',').map((entry) => entry.trim()).filter(Boolean)
const viewportFilter = (process.env.QA_VISUAL_VIEWPORTS || '').split(',').map((entry) => entry.trim()).filter(Boolean)
const requestedAuthMode = process.env.QA_VISUAL_AUTH_MODE || 'auto'
const providedGuestId = process.env.QA_VISUAL_GUEST_ID || process.env.QA_GUEST_ID || ''
const visualGuestId = providedGuestId || randomUUID()
const allowRemoteGuestAuth = process.env.QA_VISUAL_ALLOW_REMOTE_GUEST === '1'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const navigationTimeoutMs = Number(process.env.QA_VISUAL_NAVIGATION_TIMEOUT_MS || (isLocalBaseUrl ? '30000' : '60000'))
const markerTimeoutMs = Number(process.env.QA_VISUAL_MARKER_TIMEOUT_MS || (isLocalBaseUrl ? '8000' : '30000'))
const defaultDiffRoutes = ['landing', 'planner', 'account-profile', 'account-billing', 'login', 'signup']
const diffRouteFilter = (process.env.QA_VISUAL_DIFF_ROUTES || defaultDiffRoutes.join(','))
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean)

const allViewports = [
  { id: 'phone', width: 390, height: 844 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'laptop', width: 1280, height: 800 },
  { id: 'desktop', width: 1440, height: 950 },
  { id: 'wide', width: 1728, height: 1050 },
]

const allRoutes = [
  { id: 'landing', path: '/', markers: ['Globe.travel', 'Plan the trip everyone'] },
  { id: 'pricing', path: '/pricing', markers: ['Globe.travel pricing', 'Start 7-day free trial', 'Adventurer'] },
  { id: 'planner', path: '/chat', markers: ['Planner', 'Trip Studio'] },
  { id: 'saved-trips', path: '/saved', markers: ['Trips'] },
  { id: 'saved-journal', path: '/saved?tab=journal', markers: ['Trip notes'] },
  { id: 'account-profile', path: '/account', markers: ['Account'] },
  { id: 'account-billing', path: '/account?tab=billing', markers: ['Plan and billing'] },
  { id: 'login', path: '/login', markers: ['Welcome back', 'Continue as guest'] },
  { id: 'signup', path: '/signup', markers: ['Create your account', 'Continue as guest'] },
  { id: 'public-share', path: `/t/${shareSlug}`, markers: ['Start your own trip', 'Friend feedback'] },
]

if (tripId) {
  allRoutes.push({
    id: 'trip-studio',
    path: `/trips/${tripId}`,
    markers: ['Itinerary', ['Save trip', 'Saved'], 'Build maps'],
  })
}

const viewports = viewportFilter.length
  ? allViewports.filter((viewport) => viewportFilter.includes(viewport.id))
  : allViewports
const routes = routeFilter.length
  ? allRoutes.filter((route) => routeFilter.includes(route.id))
  : allRoutes
const protectedRouteIds = new Set(['planner', 'saved-trips', 'saved-journal', 'account-profile', 'account-billing', 'trip-studio'])
const protectedRoutes = routes.filter((route) => protectedRouteIds.has(route.id)).map((route) => route.id)
const useGuestAuth = requestedAuthMode === 'guest' || (requestedAuthMode === 'auto' && isLocalBaseUrl && protectedRoutes.length > 0)
let guestCleanup = {
  attempted: false,
  reason: useGuestAuth
    ? (providedGuestId ? 'external guest id provided; owner cleanup remains with the caller' : 'not run yet')
    : 'guest visual auth not used',
  guestId: useGuestAuth ? visualGuestId : null,
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

async function readDeploymentMetadata() {
  if (isLocalBaseUrl) {
    return {
      checked: false,
      reason: 'local visual target',
      status: null,
      deployment: null,
      healthStatus: null,
      summary: null,
      error: null,
    }
  }

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { 'user-agent': 'globe-travel-visual-baseline/1.0' },
      cache: 'no-store',
    })
    const body = await response.json().catch(() => null)
    const deployment = body && typeof body === 'object' && body.deployment && typeof body.deployment === 'object'
      ? body.deployment
      : null

    return {
      checked: true,
      reason: null,
      status: response.status,
      deployment,
      healthStatus: body?.status || null,
      summary: body?.summary || null,
      error: null,
    }
  } catch (error) {
    return {
      checked: true,
      reason: null,
      status: null,
      deployment: null,
      healthStatus: null,
      summary: null,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function markdownTable(rows) {
  return [
    '| Route | Viewport | Width | Overflow | Small App Targets | Small Map Controls | Clipped Text | Overlaps | Visual Diff | Screenshot | Result |',
    '| --- | --- | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |',
    ...rows.map((row) => (
      `| ${row.routeId} | ${row.viewportId} | ${row.metrics.clientWidth} | ${row.metrics.horizontalOverflow ? 'Yes' : 'No'} | ${row.metrics.smallAppTargets.length} | ${row.metrics.smallMapControlTargets.length} | ${row.metrics.clippedText.length} | ${row.metrics.overlappingAppTargets.length} | ${row.comparison.enabled ? `${(row.comparison.diffRatio * 100).toFixed(3)}%` : 'n/a'} | ${row.screenshot.ok ? row.screenshot.relativePath : row.screenshot.error || 'failed'} | ${row.ok ? 'Pass' : 'Fail'} |`
    )),
  ].join('\n')
}

async function authenticateVisualContext(context) {
  if (!useGuestAuth) return { mode: 'none', guestId: null, cookieSet: false }

  const parsedBaseUrl = new URL(baseUrl)
  await context.addCookies([
    {
      name: GUEST_SESSION_COOKIE,
      value: visualGuestId,
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
    guestId: visualGuestId,
    cookieSet: guestCookie?.value === visualGuestId,
  }
}

async function cleanupGeneratedGuest() {
  if (!useGuestAuth || providedGuestId) return

  if (!isLocalBaseUrl && !allowRemoteGuestAuth) {
    guestCleanup = {
      ...guestCleanup,
      attempted: false,
      reason: 'remote guest visual auth cleanup skipped',
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

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', visualGuestId)
  const { error: userError } = await supabase.auth.admin.deleteUser(visualGuestId)
  const userAlreadyAbsent = userError?.message?.toLowerCase().includes('user not found')

  guestCleanup = {
    attempted: true,
    reason: null,
    guestId: visualGuestId,
    profileDeleted: !profileError,
    userDeleted: !userError || Boolean(userAlreadyAbsent),
    error: profileError?.message || (userError && !userAlreadyAbsent ? userError.message : null),
  }
}

async function compareScreenshot({ routeId, screenshotName, screenshotPath }) {
  const comparison = {
    enabled: Boolean(baselineDir) && diffRouteFilter.includes(routeId),
    ok: true,
    baselinePath: null,
    baselineRelativePath: null,
    diffPath: null,
    diffRelativePath: null,
    diffPixels: 0,
    totalPixels: 0,
    diffRatio: 0,
    threshold: diffFailureThreshold,
    error: null,
  }

  if (!comparison.enabled) return comparison

  const baselinePath = resolve(baselineDir, 'screenshots', screenshotName)
  const diffPath = resolve(diffDir, screenshotName.replace(/\.png$/i, '.diff.png'))
  comparison.baselinePath = baselinePath
  comparison.baselineRelativePath = baselinePath.startsWith(root) ? baselinePath.slice(root.length + 1) : baselinePath
  comparison.diffPath = diffPath
  comparison.diffRelativePath = `qa/${artifactName}/diffs/${screenshotName.replace(/\.png$/i, '.diff.png')}`

  if (!existsSync(baselinePath)) {
    comparison.ok = false
    comparison.error = 'Missing baseline screenshot'
    return comparison
  }

  try {
    const [baselineBuffer, currentBuffer] = await Promise.all([
      readFile(baselinePath),
      readFile(screenshotPath),
    ])
    const baseline = PNG.sync.read(baselineBuffer)
    const current = PNG.sync.read(currentBuffer)

    if (baseline.width !== current.width || baseline.height !== current.height) {
      comparison.ok = false
      comparison.error = `Dimension mismatch: baseline ${baseline.width}x${baseline.height}, current ${current.width}x${current.height}`
      return comparison
    }

    const diff = new PNG({ width: baseline.width, height: baseline.height })
    const diffPixels = pixelmatch(
      baseline.data,
      current.data,
      diff.data,
      baseline.width,
      baseline.height,
      { threshold: pixelmatchThreshold }
    )
    const totalPixels = baseline.width * baseline.height
    comparison.diffPixels = diffPixels
    comparison.totalPixels = totalPixels
    comparison.diffRatio = totalPixels > 0 ? diffPixels / totalPixels : 0
    comparison.ok = comparison.diffRatio <= diffFailureThreshold

    if (!comparison.ok || process.env.QA_VISUAL_WRITE_ALL_DIFFS === '1') {
      await mkdir(diffDir, { recursive: true })
      await writeFile(diffPath, PNG.sync.write(diff))
    } else {
      comparison.diffPath = null
      comparison.diffRelativePath = null
    }
  } catch (error) {
    comparison.ok = false
    comparison.error = error instanceof Error ? error.message : String(error)
  }

  return comparison
}

async function collectPageMetrics(page, route, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  const markerGroups = route.markers.map((marker) => Array.isArray(marker) ? marker : [marker])
  let response = null
  let lastNavigationError = null

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      response = await page.goto(`${baseUrl}${route.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: navigationTimeoutMs,
      })
      lastNavigationError = null
      break
    } catch (error) {
      lastNavigationError = error
      if (attempt === 3) break
      await sleep(750 * attempt)
    }
  }

  if (lastNavigationError) {
    throw lastNavigationError
  }

  await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {})
  await page.waitForTimeout(Number.isFinite(settleMs) ? Math.max(0, settleMs) : 900)
  for (let markerAttempt = 1; markerAttempt <= 3; markerAttempt += 1) {
    await page.waitForFunction(
      ({ markerGroups: groups }) => {
        const text = document.body?.innerText.toLowerCase() || ''
        const appErrors = ['application error', 'unhandled runtime error', 'hydration failed']
        return (
          groups.every((group) => group.some((marker) => text.includes(marker.toLowerCase()))) ||
          appErrors.some((pattern) => text.includes(pattern))
        )
      },
      { markerGroups },
      { timeout: markerTimeoutMs }
    ).catch(() => {})

    const markerState = await page.evaluate(({ markerGroups: groups }) => {
      const text = document.body?.innerText || ''
      const lower = text.toLowerCase()
      const appErrors = ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].filter((pattern) => text.includes(pattern))
      return {
        missingMarkers: groups
          .filter((group) => !group.some((marker) => lower.includes(marker.toLowerCase())))
          .map((group) => group.join(' or ')),
        appErrors,
      }
    }, { markerGroups })

    if (markerState.missingMarkers.length === 0 || markerState.appErrors.length > 0 || markerAttempt === 3) break

    await sleep(1000 * markerAttempt)
    response = await page.reload({
      waitUntil: 'domcontentloaded',
      timeout: navigationTimeoutMs,
    }).catch(() => response)
    await page.waitForLoadState('networkidle', { timeout: 1500 }).catch(() => {})
    await page.waitForTimeout(Number.isFinite(settleMs) ? Math.max(0, settleMs) : 900)
  }

  const metrics = await page.evaluate(({ markerGroups }) => {
    const text = document.body?.innerText || ''
    const appErrorPatterns = [
      'Application error',
      'Unhandled Runtime Error',
      'Unhandled error',
      'ChunkLoadError',
      'Hydration failed',
    ]

    function isVisible(el) {
      const rect = el.getBoundingClientRect()
      const style = window.getComputedStyle(el)
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number(style.opacity || '1') > 0
      )
    }

    function isThirdPartyControl(el) {
      return Boolean(el.closest('.mapboxgl-ctrl, .mapboxgl-control-container, .mapboxgl-ctrl-attrib'))
    }

    function isMapLegalControl(el) {
      return Boolean(el.closest('.mapboxgl-ctrl-attrib, .mapboxgl-ctrl-logo'))
    }

    function labelFor(el) {
      return (
        el.getAttribute('aria-label') ||
        el.getAttribute('title') ||
        el.getAttribute('placeholder') ||
        el.textContent ||
        el.getAttribute('href') ||
        el.tagName
      ).trim().replace(/\s+/g, ' ').slice(0, 96)
    }

    function roundedRect(rect) {
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }
    }

    function isInViewport(rect) {
      return (
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < viewportHeight &&
        rect.left < viewportWidth
      )
    }

    function isHitTestVisible(el, rect) {
      if (!isInViewport(rect)) return false
      const left = Math.max(0, rect.left)
      const right = Math.min(viewportWidth - 1, rect.right)
      const top = Math.max(0, rect.top)
      const bottom = Math.min(viewportHeight - 1, rect.bottom)
      if (right <= left || bottom <= top) return false

      const samplePoints = [
        [(left + right) / 2, (top + bottom) / 2],
        [left + Math.min(8, (right - left) / 2), top + Math.min(8, (bottom - top) / 2)],
        [right - Math.min(8, (right - left) / 2), top + Math.min(8, (bottom - top) / 2)],
        [left + Math.min(8, (right - left) / 2), bottom - Math.min(8, (bottom - top) / 2)],
        [right - Math.min(8, (right - left) / 2), bottom - Math.min(8, (bottom - top) / 2)],
      ]

      return samplePoints.some(([x, y]) => {
        const hit = document.elementFromPoint(x, y)
        return hit === el || Boolean(hit && el.contains(hit))
      })
    }

    function intersectionArea(a, b) {
      const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
      const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))
      return width * height
    }

    function isIntentionalInputAdornmentPair(first, second) {
      const pair = [first, second]
      const input = pair.find((control) => ['input', 'textarea'].includes(control.tag))
      const button = pair.find((control) => control.tag === 'button')
      if (!input || !button) return false

      const buttonLabel = button.label.toLowerCase()
      const passwordToggle = buttonLabel.includes('show password') || buttonLabel.includes('hide password')
      const verticallyAligned =
        button.rect.top <= input.rect.bottom + 4 &&
        button.rect.bottom >= input.rect.top - 4
      const anchoredToInputEdge =
        button.rect.left >= input.rect.left &&
        button.rect.right <= input.rect.right + 4

      return passwordToggle && verticallyAligned && anchoredToInputEdge
    }

    function isTextClipped(el) {
      const style = window.getComputedStyle(el)
      const clipsX = ['hidden', 'clip'].includes(style.overflowX)
      const clipsY = ['hidden', 'clip'].includes(style.overflowY)
      return (
        (clipsX && el.scrollWidth > el.clientWidth + 4) ||
        (clipsY && el.scrollHeight > el.clientHeight + 4)
      )
    }

    const viewportWidth = document.documentElement.clientWidth
    const viewportHeight = document.documentElement.clientHeight
    const interactiveSelector = 'button,a,input,textarea,select,[role="button"],[role="link"],[tabindex]:not([tabindex="-1"])'
    const controlEntries = Array.from(document.querySelectorAll(interactiveSelector))
      .filter((el) => isVisible(el))
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          el,
          rect,
          tag: el.tagName.toLowerCase(),
          label: labelFor(el),
          ...roundedRect(rect),
          inViewport: isInViewport(rect),
          hitTestable: isHitTestVisible(el, rect),
          disabled: Boolean(el.disabled || el.getAttribute('aria-disabled') === 'true'),
          thirdParty: isThirdPartyControl(el),
          attribution: isMapLegalControl(el),
        }
      })
    const controls = controlEntries.map((control) => ({
      tag: control.tag,
      label: control.label,
      x: control.x,
      y: control.y,
      width: control.width,
      height: control.height,
      inViewport: control.inViewport,
      hitTestable: control.hitTestable,
      disabled: control.disabled,
      thirdParty: control.thirdParty,
      attribution: control.attribution,
    }))

    const appControls = controls.filter((control) => !control.thirdParty && control.hitTestable && !control.disabled)
    const smallAppTargets = appControls
      .filter((control) => control.width < 44 || control.height < 44)
      .filter((control) => control.width >= 18 && control.height >= 18)
      .slice(0, 12)

    const thirdPartySmallTargets = controls
      .filter((control) => control.thirdParty && control.inViewport && (control.width < 44 || control.height < 44))
      .slice(0, 8)

    const smallMapControlTargets = controls
      .filter((control) => (
      control.thirdParty &&
      !control.attribution &&
      control.hitTestable &&
      (control.width < 44 || control.height < 44)
    ))
      .slice(0, 8)

    const appControlEntries = controlEntries.filter((control) => (
      !control.thirdParty &&
      control.hitTestable &&
      !control.disabled &&
      control.width >= 18 &&
      control.height >= 18
    ))
    const overlappingAppTargets = []
    for (let index = 0; index < appControlEntries.length; index += 1) {
      for (let otherIndex = index + 1; otherIndex < appControlEntries.length; otherIndex += 1) {
        const first = appControlEntries[index]
        const second = appControlEntries[otherIndex]
        if (first.el.contains(second.el) || second.el.contains(first.el)) continue
        if (isIntentionalInputAdornmentPair(first, second)) continue
        const area = intersectionArea(first.rect, second.rect)
        if (area < 64) continue
        const firstArea = first.rect.width * first.rect.height
        const secondArea = second.rect.width * second.rect.height
        const overlapRatio = area / Math.min(firstArea, secondArea)
        if (overlapRatio < 0.25) continue
        overlappingAppTargets.push({
          first: { tag: first.tag, label: first.label, ...roundedRect(first.rect) },
          second: { tag: second.tag, label: second.label, ...roundedRect(second.rect) },
          overlapRatio: Number(overlapRatio.toFixed(3)),
        })
        if (overlappingAppTargets.length >= 8) break
      }
      if (overlappingAppTargets.length >= 8) break
    }

    const clippedTextSelector = 'button,a,label,[role="button"],[role="link"],h1,h2,h3,h4'
    const clippedText = Array.from(document.querySelectorAll(clippedTextSelector))
      .filter((el) => isVisible(el) && !isThirdPartyControl(el))
      .map((el) => {
        const rect = el.getBoundingClientRect()
        return { el, rect }
      })
      .filter(({ el, rect }) => isHitTestVisible(el, rect) && rect.width >= 24 && rect.height >= 12 && isTextClipped(el))
      .slice(0, 12)
      .map(({ el, rect }) => ({
        tag: el.tagName.toLowerCase(),
        label: labelFor(el),
        ...roundedRect(rect),
        scrollWidth: Math.round(el.scrollWidth),
        clientWidth: Math.round(el.clientWidth),
        scrollHeight: Math.round(el.scrollHeight),
        clientHeight: Math.round(el.clientHeight),
      }))

    return {
      url: location.href,
      title: document.title,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      missingMarkers: markerGroups
        .filter((group) => !group.some((choice) => text.toLowerCase().includes(choice.toLowerCase())))
        .map((group) => group.join(' or ')),
      appErrors: appErrorPatterns.filter((pattern) => text.includes(pattern)),
      headings: Array.from(document.querySelectorAll('h1,h2,h3')).slice(0, 8).map((el) => el.textContent.trim().replace(/\s+/g, ' ')),
      smallAppTargets,
      smallMapControlTargets,
      thirdPartySmallTargets,
      clippedText,
      overlappingAppTargets,
      visibleControlCount: controls.filter((control) => control.inViewport).length,
      bodyPreview: text.slice(0, 500).replace(/\s+/g, ' '),
    }
  }, { markerGroups })

  const screenshotName = `${route.id}-${viewport.id}-${viewport.width}x${viewport.height}.png`
  const screenshotPath = resolve(screenshotDir, screenshotName)
  const screenshot = { ok: false, path: screenshotPath, relativePath: `qa/${artifactName}/screenshots/${screenshotName}`, error: null }
  let comparison = { enabled: Boolean(baselineDir), ok: !baselineDir, diffRatio: 0, error: null }

  try {
    await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 15000 })
    screenshot.ok = true
    comparison = await compareScreenshot({ routeId: route.id, screenshotName, screenshotPath })
  } catch (error) {
    screenshot.error = error instanceof Error ? error.message : String(error)
    comparison = { ...comparison, ok: false, error: screenshot.error }
  }

  const status = response?.status() || 0
  const ok =
    status >= 200 &&
    status < 400 &&
    metrics.missingMarkers.length === 0 &&
    metrics.appErrors.length === 0 &&
    !metrics.horizontalOverflow &&
    metrics.smallAppTargets.length === 0 &&
    metrics.smallMapControlTargets.length === 0 &&
    metrics.clippedText.length === 0 &&
    metrics.overlappingAppTargets.length === 0 &&
    screenshot.ok &&
    comparison.ok

  return {
    routeId: route.id,
    path: route.path,
    viewportId: viewport.id,
    requestedViewport: viewport,
    status,
    ok,
    metrics,
    screenshot,
    comparison,
  }
}

if (!existsSync(chromePath)) {
  console.error(`Chrome executable not found at ${chromePath}. Set QA_CHROME_PATH to a Chrome-compatible browser.`)
  process.exit(1)
}

if (baselineDir && resolve(baselineDir) === resolve(artifactDir)) {
  console.error('QA_VISUAL_BASELINE_DIR must be different from the output artifact directory.')
  process.exit(1)
}

if (routeFilter.length && routes.length !== routeFilter.length) {
  const found = new Set(routes.map((route) => route.id))
  const missing = routeFilter.filter((routeId) => !found.has(routeId))
  console.error(`Unknown QA_VISUAL_ROUTES entries: ${missing.join(', ')}`)
  process.exit(1)
}

if (viewportFilter.length && viewports.length !== viewportFilter.length) {
  const found = new Set(viewports.map((viewport) => viewport.id))
  const missing = viewportFilter.filter((viewportId) => !found.has(viewportId))
  console.error(`Unknown QA_VISUAL_VIEWPORTS entries: ${missing.join(', ')}`)
  process.exit(1)
}

if (diffRouteFilter.length) {
  const allRouteIds = new Set(allRoutes.map((route) => route.id))
  const missing = diffRouteFilter.filter((routeId) => !allRouteIds.has(routeId))
  if (missing.length) {
    console.error(`Unknown QA_VISUAL_DIFF_ROUTES entries: ${missing.join(', ')}`)
    process.exit(1)
  }
}

if (!['auto', 'none', 'guest'].includes(requestedAuthMode)) {
  console.error('QA_VISUAL_AUTH_MODE must be one of: auto, none, guest.')
  process.exit(1)
}

if (useGuestAuth && !isLocalBaseUrl && !allowRemoteGuestAuth) {
  console.error('Guest-auth visual QA on remote URLs can create remote guest state. Set QA_VISUAL_ALLOW_REMOTE_GUEST=1 to allow it intentionally.')
  process.exit(1)
}

await mkdir(screenshotDir, { recursive: true })

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
  const authContext = await authenticateVisualContext(context)
  authContexts.push({ viewportId: viewport.id, ...authContext })
  const page = await context.newPage()

  for (const route of routes) {
    if (showProgress) console.error(`[qa:visual] ${route.id} @ ${viewport.id}`)
    const result = await collectPageMetrics(page, route, viewport)
    results.push(result)
    if (!result.ok) failures.push(result)
  }

  await context.close()
}

await cleanupGeneratedGuest()
const deploymentMetadata = await readDeploymentMetadata()

const summary = {
  baseUrl,
  date,
  runId: runId || null,
  shareSlug,
  tripId: tripId || null,
  artifactDir,
  baselineDir: baselineDir || null,
  diffRoutes: baselineDir ? diffRouteFilter : [],
  diffFailureThreshold,
  pixelmatchThreshold,
  settleMs,
  deployment: deploymentMetadata.deployment,
  deploymentCheck: {
    checked: deploymentMetadata.checked,
    reason: deploymentMetadata.reason,
    status: deploymentMetadata.status,
    healthStatus: deploymentMetadata.healthStatus,
    summary: deploymentMetadata.summary,
    error: deploymentMetadata.error,
  },
  auth: {
    requestedMode: requestedAuthMode,
    mode: useGuestAuth ? 'guest' : 'none',
    guestId: useGuestAuth ? visualGuestId : null,
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
  results,
  failures: failures.map((failure) => ({
    routeId: failure.routeId,
    viewportId: failure.viewportId,
    status: failure.status,
    missingMarkers: failure.metrics.missingMarkers,
    appErrors: failure.metrics.appErrors,
    horizontalOverflow: failure.metrics.horizontalOverflow,
    smallAppTargets: failure.metrics.smallAppTargets,
    smallMapControlTargets: failure.metrics.smallMapControlTargets,
    clippedText: failure.metrics.clippedText,
    overlappingAppTargets: failure.metrics.overlappingAppTargets,
    screenshot: failure.screenshot,
    comparison: failure.comparison,
  })),
}

const jsonPath = resolve(artifactDir, 'summary.json')
await writeFile(jsonPath, JSON.stringify(summary, null, 2))

const md = `# Full Responsive Visual Baseline

Date: ${date}
Environment: ${baseUrl}
Deployment: ${summary.deployment?.commit ? `${summary.deployment.commit} (${summary.deployment.url || 'unknown deployment URL'})` : deploymentMetadata.checked ? 'not available' : deploymentMetadata.reason}
Public share slug: ${shareSlug}
Trip Studio fixture: ${tripId || 'not included'}
Auth mode: ${useGuestAuth ? `guest (${providedGuestId ? 'external' : 'generated'} guest id)` : 'none'}
Baseline comparison: ${baselineDir || 'not enabled'}
Pixel-compared routes: ${baselineDir ? diffRouteFilter.join(', ') : 'none'}
Diff threshold: ${(diffFailureThreshold * 100).toFixed(2)}%

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Artifact JSON: \`qa/${artifactName}/summary.json\`
- Artifact directory: \`qa/${artifactName}\`
- Protected routes: ${protectedRoutes.length ? protectedRoutes.join(', ') : 'none'}
- Guest cleanup: ${guestCleanup.attempted ? `attempted (${guestCleanup.error || 'ok'})` : guestCleanup.reason}

${markdownTable(results)}

## Failure Detail

${failures.length === 0 ? 'No failures.' : failures.map((failure) => `### ${failure.routeId} / ${failure.viewportId}

- Status: ${failure.status}
- Missing markers: ${failure.metrics.missingMarkers.length ? failure.metrics.missingMarkers.join(', ') : 'none'}
- App errors: ${failure.metrics.appErrors.length ? failure.metrics.appErrors.join(', ') : 'none'}
- Horizontal overflow: ${failure.metrics.horizontalOverflow ? 'yes' : 'no'}
- Small app targets: ${failure.metrics.smallAppTargets.length ? JSON.stringify(failure.metrics.smallAppTargets, null, 2) : 'none'}
- Small map controls: ${failure.metrics.smallMapControlTargets.length ? JSON.stringify(failure.metrics.smallMapControlTargets, null, 2) : 'none'}
- Clipped text: ${failure.metrics.clippedText.length ? JSON.stringify(failure.metrics.clippedText, null, 2) : 'none'}
- Overlapping app targets: ${failure.metrics.overlappingAppTargets.length ? JSON.stringify(failure.metrics.overlappingAppTargets, null, 2) : 'none'}
- Visual diff: ${failure.comparison.enabled ? `${(failure.comparison.diffRatio * 100).toFixed(3)}% (${failure.comparison.error || 'no error'})` : 'not enabled'}
- Screenshot: ${failure.screenshot.ok ? failure.screenshot.relativePath : failure.screenshot.error}
`).join('\n')}

## Notes

- This runner uses installed Chrome through \`playwright-core\` so viewport sizing is controlled outside the in-app Browser screenshot path that has timed out on Mapbox-heavy pages.
- Mapbox navigation controls are measured separately from attribution/legal links; app-owned controls below \`44px\` fail this gate.
- App-owned overlapping controls and clipped action/heading text fail this gate because those are high-signal layout regressions before launch.
- Screenshots are viewport captures, not full-page captures, to keep Mapbox-heavy pages reliable.
- When \`QA_VISUAL_BASELINE_DIR\` is set, screenshots are compared with \`pixelmatch\`; only diffs above the configured threshold fail the gate.
- By default, pixel comparison applies only to stable shell routes. Dynamic user-data routes still receive screenshot, marker, overflow, and touch-target checks; set \`QA_VISUAL_DIFF_ROUTES\` to override.
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
  baselineDir: baselineDir || null,
  diffRoutes: baselineDir ? diffRouteFilter : [],
  diffFailureThreshold,
  deployment: summary.deployment,
  deploymentCheck: summary.deploymentCheck,
}, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}

await Promise.race([
  browser.close(),
  new Promise((resolve) => setTimeout(resolve, 5000)),
])

process.exit(failures.length > 0 ? 1 : 0)
