import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG || 'x3m2c8cnws'
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const guestId = process.env.QA_GUEST_ID || randomUUID()
const protectedPlannerNext = '/chat?q=Plan%20five%20days%20in%20Athens%20for%20friends%20with%20food%20and%20beaches'
const allowRemoteGuestMutation = process.env.QA_ALLOW_REMOTE_GUEST_MUTATION === '1'
const shouldCheckGuestApi = isLocalBaseUrl || allowRemoteGuestMutation
const navigationTimeoutMs = isLocalBaseUrl ? 30000 : 60000
const failures = []
const results = []
let browser = null
let cleanup = null

async function loadDotEnv() {
  const envPath = resolve(root, '.env.local')
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

function record(name, ok, details = {}) {
  const result = { name, ok: Boolean(ok), ...details }
  results.push(result)
  if (!result.ok) failures.push(result)
  return result
}

function markerSatisfied(text, markers) {
  const normalized = text.toLowerCase()
  return markers.every((marker) => {
    const choices = Array.isArray(marker) ? marker : [marker]
    return choices.some((choice) => normalized.includes(choice.toLowerCase()))
  })
}

function missingMarkers(text, markers) {
  const normalized = text.toLowerCase()
  return markers
    .filter((marker) => {
      const choices = Array.isArray(marker) ? marker : [marker]
      return !choices.some((choice) => normalized.includes(choice.toLowerCase()))
    })
    .map((marker) => Array.isArray(marker) ? marker.join(' or ') : marker)
}

async function readPageState(page, markerGroups = []) {
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  await page.waitForFunction(
    ({ markers }) => {
      const text = document.body?.innerText || ''
      const appErrors = ['Application error', 'Unhandled Runtime Error', 'Hydration failed']
      const ready = markers.every((marker) => {
        const choices = Array.isArray(marker) ? marker : [marker]
        return choices.some((choice) => text.toLowerCase().includes(choice.toLowerCase()))
      })
      return ready || appErrors.some((pattern) => text.includes(pattern))
    },
    { markers: markerGroups },
    { timeout: 8000 }
  ).catch(() => {})

  return page.evaluate(({ markers }) => {
    const text = document.body?.innerText || ''
    return {
      url: location.href,
      title: document.title,
      text,
      missingMarkers: markers
        .filter((marker) => {
          const choices = Array.isArray(marker) ? marker : [marker]
          return !choices.some((choice) => text.toLowerCase().includes(choice.toLowerCase()))
        })
        .map((marker) => Array.isArray(marker) ? marker.join(' or ') : marker),
      hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => text.includes(pattern)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }
  }, { markers: markerGroups })
}

async function gotoWithRetry(page, url, options = {}) {
  const attempts = isLocalBaseUrl ? 3 : 2
  let lastError = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: navigationTimeoutMs,
        ...options,
      })
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
      await new Promise((resolve) => setTimeout(resolve, 750))
    }
  }

  throw lastError
}

async function checkPage({ context, name, path, markers, expectedPathnames = null }) {
  const page = await context.newPage()
  await gotoWithRetry(page, `${baseUrl}${path}`)
  const state = await readPageState(page, markers)
  await page.close().catch(() => {})

  const finalUrl = new URL(state.url)
  const pathOk = !expectedPathnames || expectedPathnames.includes(finalUrl.pathname)
  const ok = (
    pathOk &&
    state.missingMarkers.length === 0 &&
    !state.hasAppError &&
    !state.horizontalOverflow
  )

  return record(name, ok, {
    path,
    finalUrl: state.url,
    expectedPathnames,
    missingMarkers: state.missingMarkers,
    hasAppError: state.hasAppError,
    horizontalOverflow: state.horizontalOverflow,
    clientWidth: state.clientWidth,
    scrollWidth: state.scrollWidth,
  })
}

async function cleanupGuestAccount() {
  if (!shouldCheckGuestApi) {
    cleanup = { attempted: false, reason: 'guest API mutation skipped for remote base URL' }
    return
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    cleanup = { attempted: false, reason: 'missing Supabase service role cleanup credentials', guestId }
    record('guest access smoke cleans up disposable guest account', false, cleanup)
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', guestId)

  const { error: userError } = await supabase.auth.admin.deleteUser(guestId)
  const userMissing = userError?.message?.toLowerCase().includes('not found') || false

  cleanup = {
    attempted: true,
    guestId,
    profileDeleted: !profileError,
    userDeleted: !userError || userMissing,
    profileError: profileError?.message || null,
    userError: userMissing ? null : userError?.message || null,
  }

  record('guest access smoke cleans up disposable guest account', !profileError && (!userError || userMissing), cleanup)
}

await loadDotEnv()

try {
  const proxySource = await readFile(resolve(root, 'proxy.ts'), 'utf8')
  const loginSource = await readFile(resolve(root, 'app/(auth)/login/page.tsx'), 'utf8')
  const signupSource = await readFile(resolve(root, 'app/(auth)/signup/page.tsx'), 'utf8')
  const guestStartSource = await readFile(resolve(root, 'app/api/guest/start/route.ts'), 'utf8')
  const authUtilsSource = await readFile(resolve(root, 'app/api/trips/_utils.ts'), 'utf8')
  const chatRouteSource = await readFile(resolve(root, 'app/api/chat/route.ts'), 'utf8')
  const callbackClientSource = await readFile(resolve(root, 'app/(auth)/auth/callback-client/page.tsx'), 'utf8')
  record('auth source preserves protected next destinations', (
    proxySource.includes("url.searchParams.set('next', next)") &&
    proxySource.includes("getSafeAuthNext(`${request.nextUrl.pathname}${request.nextUrl.search}`)") &&
    loginSource.includes("router.push(authNext)") &&
    signupSource.includes("router.push(authNext)") &&
    loginSource.includes("appendAuthNext('/api/guest/start', authNext)") &&
    signupSource.includes("appendAuthNext('/api/guest/start', authNext)") &&
    guestStartSource.includes('getAuthNextFromSearchParams(url.searchParams)')
  ))
  record('guest identity wins consistently until account auth succeeds', (
    authUtilsSource.indexOf(`const guestId = (await cookies()).get(GUEST_SESSION_COOKIE)?.value`) > -1 &&
    authUtilsSource.indexOf(`const guestId = (await cookies()).get(GUEST_SESSION_COOKIE)?.value`) <
      authUtilsSource.indexOf("const { data: { user } } = await supabase.auth.getUser()") &&
    chatRouteSource.includes('const user = (guestId ? createGuestUser(guestId) : null) || authUser') &&
    loginSource.includes('clearBrowserGuestSession()') &&
    signupSource.includes('clearBrowserGuestSession()') &&
    callbackClientSource.includes('clearBrowserGuestSession()')
  ), {
    utilityOrder: {
      guestCookieIndex: authUtilsSource.indexOf(`const guestId = (await cookies()).get(GUEST_SESSION_COOKIE)?.value`),
      authUserIndex: authUtilsSource.indexOf("const { data: { user } } = await supabase.auth.getUser()"),
    },
  })

  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
  })

  const anonymous = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })

  await checkPage({
    context: anonymous,
    name: 'logged-out login page offers guest access',
    path: '/login',
    markers: ['Welcome back', 'Continue as guest'],
    expectedPathnames: ['/login'],
  })
  await checkPage({
    context: anonymous,
    name: 'logged-out signup page offers guest access',
    path: '/signup',
    markers: ['Create your account', 'Continue as guest'],
    expectedPathnames: ['/signup'],
  })
  await checkPage({
    context: anonymous,
    name: 'logged-out public share remains readable',
    path: `/t/${shareSlug}`,
    markers: ['Start your own trip'],
    expectedPathnames: [`/t/${shareSlug}`],
  })
  await checkPage({
    context: anonymous,
    name: 'logged-out saved trips resolves safely',
    path: '/saved',
    markers: [['Welcome back', 'Trips']],
    expectedPathnames: ['/login', '/saved'],
  })
  await checkPage({
    context: anonymous,
    name: 'logged-out billing resolves safely',
    path: '/account?tab=billing',
    markers: [['Welcome back', 'Plan and billing']],
    expectedPathnames: ['/login', '/account'],
  })
  await checkPage({
    context: anonymous,
    name: 'logged-out public pricing remains readable',
    path: '/pricing',
    markers: ['Globe.travel pricing', 'Start 7-day free trial', 'Adventurer'],
    expectedPathnames: ['/pricing'],
  })

  const handoffPage = await anonymous.newPage()
  await gotoWithRetry(handoffPage, `${baseUrl}/login?next=${encodeURIComponent(protectedPlannerNext)}`)
  await handoffPage.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  await handoffPage.waitForFunction((encodedNext) => {
    return Array.from(document.querySelectorAll('a')).some((link) => (
      link.textContent?.includes('Continue as guest') &&
      link.getAttribute('href')?.includes(`next=${encodedNext}`)
    ))
  }, encodeURIComponent(protectedPlannerNext), { timeout: 5000 }).catch(() => {})
  const loginHandoff = await handoffPage.evaluate(() => {
    const guestLink = Array.from(document.querySelectorAll('a')).find((link) => link.textContent?.includes('Continue as guest'))
    const signupLink = Array.from(document.querySelectorAll('a')).find((link) => link.textContent?.includes('Begin a journey'))
    return {
      url: location.href,
      guestHref: guestLink?.getAttribute('href') || null,
      signupHref: signupLink?.getAttribute('href') || null,
      hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => document.body.innerText.includes(pattern)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    }
  })
  record('login preserves protected planner intent in guest and signup actions', (
    loginHandoff.guestHref?.includes(`next=${encodeURIComponent(protectedPlannerNext)}`) &&
    loginHandoff.signupHref?.includes(`next=${encodeURIComponent(protectedPlannerNext)}`) &&
    !loginHandoff.hasAppError &&
    !loginHandoff.horizontalOverflow
  ), loginHandoff)
  await handoffPage.close().catch(() => {})

  if (shouldCheckGuestApi) {
    const guestHandoffPage = await anonymous.newPage()
    await gotoWithRetry(
      guestHandoffPage,
      `${baseUrl}/api/guest/start?id=${guestId}&next=${encodeURIComponent(protectedPlannerNext)}`,
    )
    const guestHandoffState = await readPageState(guestHandoffPage, [['Planner', 'Trip Studio', '5 Days in Athens']])
    const finalUrl = new URL(guestHandoffState.url)
    const promptValue = finalUrl.searchParams.get('q') || finalUrl.searchParams.get('prompt')
    const preservedPlannerIntent =
      (finalUrl.pathname === '/chat' && promptValue?.includes('five days in Athens')) ||
      (finalUrl.pathname.startsWith('/trips/') && promptValue?.includes('five days in Athens'))
    record('guest start preserves protected planner prompt destination', (
      preservedPlannerIntent &&
      markerSatisfied(guestHandoffState.text, [['Planner', 'Trip Studio', '5 Days in Athens']]) &&
      !guestHandoffState.hasAppError &&
      !guestHandoffState.horizontalOverflow
    ), {
      finalUrl: guestHandoffState.url,
      promptValue,
      missingMarkers: guestHandoffState.missingMarkers,
      hasAppError: guestHandoffState.hasAppError,
      horizontalOverflow: guestHandoffState.horizontalOverflow,
    })
    await guestHandoffPage.close().catch(() => {})
  } else {
    record('remote guest-start protected planner handoff skipped by default', true, {
      enableWith: 'QA_ALLOW_REMOTE_GUEST_MUTATION=1',
    })
  }

  await anonymous.close().catch(() => {})

  let guest = null
  if (shouldCheckGuestApi) {
    guest = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
    const guestPage = await guest.newPage()
    await gotoWithRetry(guestPage, `${baseUrl}/api/guest/start?id=${guestId}`)
    const guestChatState = await readPageState(guestPage, ['Plan'])
    const cookies = await guest.cookies(baseUrl)
    const guestCookie = cookies.find((cookie) => cookie.name === 'globe_travel_guest')

    record('guest start creates browser session and opens planner', (
      new URL(guestChatState.url).pathname === '/chat' &&
      markerSatisfied(guestChatState.text, ['Plan']) &&
      Boolean(guestCookie?.value) &&
      !guestChatState.hasAppError &&
      !guestChatState.horizontalOverflow
    ), {
      finalUrl: guestChatState.url,
      hasGuestCookie: Boolean(guestCookie?.value),
      guestId: guestCookie?.value || null,
      missingMarkers: missingMarkers(guestChatState.text, ['Plan']),
      hasAppError: guestChatState.hasAppError,
      horizontalOverflow: guestChatState.horizontalOverflow,
    })
    await guestPage.close().catch(() => {})

    await checkPage({
      context: guest,
      name: 'guest can open saved trips surface',
      path: '/saved',
      markers: ['Trips'],
      expectedPathnames: ['/saved'],
    })
    await checkPage({
      context: guest,
      name: 'guest can open account surface',
      path: '/account',
      markers: ['Account', ['Guest Traveler', 'Traveler']],
      expectedPathnames: ['/account'],
    })

    const apiPage = await guest.newPage()
    await gotoWithRetry(apiPage, `${baseUrl}/chat`)
    const apiResult = await apiPage.evaluate(async () => {
      const response = await fetch('/api/trips', { cache: 'no-store' })
      const text = await response.text()
      let json = null
      try {
        json = JSON.parse(text)
      } catch {
        // handled below
      }
      return {
        status: response.status,
        ok: response.ok,
        isArray: Array.isArray(json),
        count: Array.isArray(json) ? json.length : null,
        bodyPreview: text.slice(0, 120),
      }
    })
    await apiPage.close().catch(() => {})

    record('guest session can read owned trip list API', apiResult.ok && apiResult.isArray, apiResult)
  } else {
    record('remote direct guest-start session creation skipped by default', true, {
      enableWith: 'QA_ALLOW_REMOTE_GUEST_MUTATION=1',
    })
    record('remote guest saved and account surfaces skipped by default', true, {
      enableWith: 'QA_ALLOW_REMOTE_GUEST_MUTATION=1',
    })
    record('remote guest API mutation skipped by default', true, {
      enableWith: 'QA_ALLOW_REMOTE_GUEST_MUTATION=1',
    })
  }

  await guest?.close().catch(() => {})
} catch (error) {
  record('auth and guest access smoke completed without unexpected exception', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  await browser?.close().catch(() => {})
  await cleanupGuestAccount()
}

const summary = {
  baseUrl,
  shareSlug,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  guestId,
  shouldCheckGuestApi,
  cleanup,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
