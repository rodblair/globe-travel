import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG || 'x3m2c8cnws'
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const allowRemoteGuestMutation = process.env.QA_ALLOW_REMOTE_GUEST_MUTATION === '1'
const shouldExerciseGuestStart = isLocalBaseUrl || allowRemoteGuestMutation
const failures = []
const results = []
let browser = null
let cleanup = {
  attempted: false,
  reason: shouldExerciseGuestStart ? 'not run yet' : 'guest-start click skipped for remote base URL',
  guestId: null,
  profileDeleted: false,
  userDeleted: false,
  error: null,
}

const viewports = [
  { id: 'phone', width: 390, height: 844 },
  { id: 'desktop', width: 1280, height: 900 },
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

async function installShareStubs(page) {
  await page.addInitScript(() => {
    window.__globeShareEvents = { clipboardWrites: [], nativeShares: [] }
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__globeShareEvents.clipboardWrites.push(String(text))
        },
      },
    })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (payload) => {
        window.__globeShareEvents.nativeShares.push(payload)
      },
    })
  })
}

async function gotoWithRetry(page, url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    } catch (error) {
      if (attempt === 3) throw error
      await sleep(600 * attempt)
    }
  }
}

async function readPublicShareState(page) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {})
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
    await page.waitForFunction(() => {
      const text = document.body?.innerText || ''
      const appErrors = ['Application error', 'Unhandled Runtime Error', 'Hydration failed']
      return (
        (
          text.includes('Start your own trip') &&
          text.includes('Add your reaction') &&
          text.includes('Friend feedback') &&
          text.includes('Share trip')
        ) ||
        appErrors.some((pattern) => text.includes(pattern))
      )
    }, { timeout: 12000 }).catch(() => {})

    const ready = await page.evaluate(() => {
      const text = document.body?.innerText || ''
      return text.includes('Add your reaction') && text.includes('Friend feedback') && text.includes('Share trip')
    })

    if (ready || attempt === 3) break
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
    await sleep(700 * attempt)
  }

  return page.evaluate(() => {
    const text = document.body?.innerText || ''
    const normalizedText = text.toLowerCase()
    const startLinks = Array.from(document.querySelectorAll('a'))
      .filter((link) => (link.textContent || '').includes('Start your own trip'))
      .map((link) => ({
        text: (link.textContent || '').trim().replace(/\s+/g, ' '),
        href: link.href,
        pathname: new URL(link.href).pathname,
        q: new URL(link.href).searchParams.get('q'),
      }))
    const buttons = Array.from(document.querySelectorAll('button'))
      .map((button) => (button.textContent || '').trim().replace(/\s+/g, ' '))
      .filter(Boolean)

    return {
      url: location.href,
      title: document.title,
      hasStartCta: normalizedText.includes('start your own trip'),
      hasFeedbackForm: normalizedText.includes('add your reaction') && normalizedText.includes('send feedback'),
      hasFeedbackPanel: normalizedText.includes('friend feedback'),
      hasShareCard: normalizedText.includes('share trip') && normalizedText.includes('copy link') && buttons.includes('Share'),
      hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => text.includes(pattern)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      startLinks,
      buttons,
    }
  })
}

async function cleanupGuestAccount(guestId) {
  if (!guestId) {
    cleanup = { ...cleanup, attempted: false, reason: 'no guest id observed' }
    return
  }

  await loadDotEnv()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    cleanup = {
      attempted: false,
      reason: 'missing Supabase service role cleanup credentials',
      guestId,
      profileDeleted: false,
      userDeleted: false,
      error: null,
    }
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
  const userAlreadyAbsent = Boolean(userError?.message?.toLowerCase().includes('not found'))

  cleanup = {
    attempted: true,
    reason: null,
    guestId,
    profileDeleted: !profileError,
    userDeleted: !userError || userAlreadyAbsent,
    error: profileError?.message || (userAlreadyAbsent ? null : userError?.message) || null,
  }
}

try {
  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
  })

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await installShareStubs(page)
    await gotoWithRetry(page, `${baseUrl}/t/${shareSlug}`)
    const state = await readPublicShareState(page)
    const startPrompts = state.startLinks.map((link) => link.q || '')
    const startLinksOk =
      state.startLinks.length >= 2 &&
      state.startLinks.every((link) => (
        link.pathname === '/api/guest/start' &&
        link.q &&
        link.q.includes('shareable itinerary map')
      ))

    record(`public share viral affordances are visible on ${viewport.id}`, (
      state.hasStartCta &&
      state.hasFeedbackForm &&
      state.hasFeedbackPanel &&
      state.hasShareCard &&
      startLinksOk &&
      !state.hasAppError &&
      !state.horizontalOverflow
    ), {
      viewport: viewport.id,
      url: state.url,
      title: state.title,
      hasStartCta: state.hasStartCta,
      hasFeedbackForm: state.hasFeedbackForm,
      hasFeedbackPanel: state.hasFeedbackPanel,
      hasShareCard: state.hasShareCard,
      startLinkCount: state.startLinks.length,
      startPrompts,
      hasAppError: state.hasAppError,
      horizontalOverflow: state.horizontalOverflow,
      clientWidth: state.clientWidth,
      scrollWidth: state.scrollWidth,
    })

    if (viewport.id === 'desktop') {
      await page.getByRole('button', { name: 'Copy link' }).click()
      await page.waitForFunction(() => (window.__globeShareEvents?.clipboardWrites || []).length > 0, { timeout: 5000 })
      await page.waitForFunction(() => (document.body?.innerText || '').includes('Copied'), { timeout: 5000 }).catch(() => {})
      const copyState = await page.evaluate(() => ({
        clipboardWrites: window.__globeShareEvents?.clipboardWrites || [],
        copiedVisible: (document.body?.innerText || '').includes('Copied'),
      }))
      record('public share copy link gives success feedback', (
        copyState.clipboardWrites.some((entry) => entry.includes('/t/')) &&
        copyState.copiedVisible
      ), copyState)

      await page.getByRole('button', { name: 'Share' }).click()
      await page.waitForFunction(() => (window.__globeShareEvents?.nativeShares || []).length > 0, { timeout: 5000 })
      const nativeShareState = await page.evaluate(() => ({
        nativeShares: window.__globeShareEvents?.nativeShares || [],
      }))
      record('public share native share payload is trip-specific', (
        nativeShareState.nativeShares.length === 1 &&
        String(nativeShareState.nativeShares[0]?.title || '').length > 0 &&
        String(nativeShareState.nativeShares[0]?.text || '').includes('Globe.travel') &&
        String(nativeShareState.nativeShares[0]?.url || '').includes('/t/')
      ), nativeShareState)
    }

    await context.close().catch(() => {})
  }

  if (shouldExerciseGuestStart) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await gotoWithRetry(page, `${baseUrl}/t/${shareSlug}`)
    await readPublicShareState(page)
    const tripSpecificStartLink = page.locator('a[href^="/api/guest/start"][href*="q="]').filter({ hasText: 'Start your own trip' }).first()
    await tripSpecificStartLink.waitFor({ state: 'visible', timeout: 15000 })
    await tripSpecificStartLink.click()
    await page.waitForFunction(() => location.pathname === '/chat', { timeout: 15000 })
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {})
    const ctaState = await page.evaluate(() => {
      const text = document.body?.innerText || ''
      return {
        url: location.href,
        pathname: location.pathname,
        q: new URL(location.href).searchParams.get('q'),
        hasPlanner: text.includes('Planner'),
        hasOpeningTripStudio: text.includes('Opening Trip Studio'),
        hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => text.includes(pattern)),
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }
    })
    const cookies = await context.cookies(baseUrl)
    const guestCookie = cookies.find((cookie) => cookie.name === 'globe_travel_guest')

    record('public share start CTA opens guest Planner with shared-trip prompt', (
      ctaState.pathname === '/chat' &&
      ctaState.hasPlanner &&
      Boolean(guestCookie?.value) &&
      !ctaState.hasAppError &&
      !ctaState.horizontalOverflow
    ), {
      ...ctaState,
      hasGuestCookie: Boolean(guestCookie?.value),
      guestId: guestCookie?.value || null,
    })

    await cleanupGuestAccount(guestCookie?.value || null)
    await context.close().catch(() => {})
  } else {
    record('public share start CTA guest-session click skipped safely on remote base URL', true, {
      baseUrl,
      reason: cleanup.reason,
    })
  }
} finally {
  await Promise.race([
    browser?.close() || Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ])
}

const summary = {
  baseUrl,
  shareSlug,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  mutatesGuestStart: shouldExerciseGuestStart,
  cleanup,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}

process.exit(failures.length > 0 ? 1 : 0)
