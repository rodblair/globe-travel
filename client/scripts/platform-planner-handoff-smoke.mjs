import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const prompt = process.env.QA_PLANNER_PROMPT || 'Plan a 5 day Athens trip for 4 friends with history food relaxed pacing and one memorable night out'
const runId = process.env.QA_RUN_ID || randomUUID().slice(0, 8)
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const failures = []

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
  const result = { name, ok, ...details }
  if (!ok) failures.push(result)
  return result
}

function getSetCookieHeaders(headers) {
  if (typeof headers.getSetCookie === 'function') return headers.getSetCookie()
  const cookie = headers.get('set-cookie')
  return cookie ? [cookie] : []
}

async function fetchText(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'follow',
    ...init,
    headers: {
      'user-agent': 'globe-travel-planner-handoff-smoke/1.0',
      ...(init.headers || {}),
    },
  })
  const text = await response.text()
  return { response, text }
}

async function fetchJson(path, init = {}) {
  const { response, text } = await fetchText(path, init)
  let json = null

  try {
    json = JSON.parse(text)
  } catch {
    // handled by caller
  }

  return { response, text, json }
}

async function cleanupTrip(tripId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!tripId || !supabaseUrl || !supabaseKey) {
    return { attempted: false, tripDeleted: false, error: null }
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
  const { error } = await supabase.from('trips').delete().eq('id', tripId)

  return {
    attempted: true,
    tripDeleted: !error,
    error: error?.message || null,
  }
}

async function cleanupGuestAccount(guestId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!guestId || !supabaseUrl || !supabaseKey) {
    return {
      attempted: false,
      guestId: guestId || null,
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
    guestId,
    profileDeleted: !profileError,
    userDeleted: !userError || Boolean(userAlreadyAbsent),
    error: profileError?.message || (userError && !userAlreadyAbsent ? userError.message : null),
  }
}

function pageMetrics(page) {
  return page.evaluate(() => ({
    url: location.href,
    path: location.pathname,
    hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => document.body.innerText.includes(pattern)),
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
}

async function runBrowserPlannerStartChecks() {
  if (!isLocalBaseUrl) {
    results.push(record('Browser planner start checks skipped for remote base URL', true, {
      reason: 'development-only QA query params and disposable guest mutations are local-only',
    }))
    return
  }

  let browser = null
  let slowTripId = null
  const failureGuestId = randomUUID()
  const slowGuestId = randomUUID()
  const failurePrompt = 'Plan a 4 day Lisbon food trip for friends with viewpoints and relaxed mornings'
  const slowPrompt = 'Plan a 3 day Porto food and viewpoints trip for four friends with relaxed pacing'

  try {
    browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
    })

    const failureContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
    const failurePage = await failureContext.newPage()
    await failurePage.goto(`${baseUrl}/api/guest/start?id=${failureGuestId}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await failurePage.goto(`${baseUrl}/chat?q=${encodeURIComponent(failurePrompt)}&qaPlannerDraftFailure=1`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await failurePage.waitForFunction(() => document.body.innerText.includes('Could not open Trip Studio'), { timeout: 10000 }).catch(() => {})
    const failureState = await failurePage.evaluate(() => {
      const text = document.body.innerText
      const input = document.querySelector('input[aria-label="Describe your trip idea"]')
      const tryAgain = Array.from(document.querySelectorAll('button')).find((button) => button.textContent?.trim() === 'Try again')
      return {
        hasRecoveryCopy: text.includes('Could not open Trip Studio') && text.includes('Your trip idea is still here'),
        inputValue: input?.value || '',
        tryAgainVisible: Boolean(tryAgain),
        tryAgainDisabled: tryAgain?.disabled ?? null,
      }
    })
    const failureMetrics = await pageMetrics(failurePage)
    results.push(record('Browser planner query failure preserves the trip idea and retry path', (
      failureState.hasRecoveryCopy &&
      failureState.inputValue === failurePrompt &&
      failureState.tryAgainVisible &&
      failureState.tryAgainDisabled === false &&
      !failureMetrics.hasAppError &&
      !failureMetrics.horizontalOverflow
    ), {
      ...failureState,
      metrics: failureMetrics,
    }))
    await failureContext.close().catch(() => {})

    const slowContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true })
    const slowPage = await slowContext.newPage()
    await slowPage.goto(`${baseUrl}/api/guest/start?id=${slowGuestId}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await slowPage.goto(`${baseUrl}/chat?q=${encodeURIComponent(slowPrompt)}&qaPlannerDraftDelayMs=2200`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await slowPage.waitForFunction(() => (
      document.body.innerText.includes('Opening Trip Studio') ||
      /\/trips\/[^/?]+/.test(location.pathname)
    ), { timeout: 8000 }).catch(() => {})
    const waitingState = await slowPage.evaluate(() => {
      const text = document.body.innerText
      const input = document.querySelector('input[aria-label="Describe your trip idea"]')
      const sendButton = Array.from(document.querySelectorAll('button'))
        .find((button) => button.textContent?.trim() === 'Send')
      const stepButtons = Array.from(document.querySelectorAll('button'))
        .filter((button) => /^STEP 0/.test((button.textContent || '').trim()))
      return {
        hasOpeningState: text.includes('Opening Trip Studio') && text.includes('Building a draft for'),
        promptVisible: text.includes('Porto food and viewpoints'),
        inputPlaceholder: input?.getAttribute('placeholder') || '',
        inputDisabled: input?.disabled ?? null,
        sendDisabled: sendButton?.disabled ?? null,
        disabledStepCount: stepButtons.filter((button) => button.disabled).length,
        stepCount: stepButtons.length,
      }
    })
    const waitingMetrics = await pageMetrics(slowPage)
    await slowPage.waitForFunction(() => /\/trips\/[^/?]+/.test(location.pathname), { timeout: 20000 })
    await slowPage.waitForFunction(() => (
      document.body.innerText.includes('Save trip') ||
      document.body.innerText.includes('Building the first itinerary from your trip idea') ||
      document.body.innerText.includes('Globe is adding named stops')
    ), { timeout: 12000 }).catch(() => {})
    const studioState = await slowPage.evaluate(() => {
      const text = document.body.innerText
      return {
        tripId: location.pathname.split('/').filter(Boolean).pop() || null,
        hasPromptParam: location.search.includes('prompt='),
        hasStudioActions: text.includes('Save trip') && text.includes('Share with friends'),
        hasInitialGenerationCopy: text.includes('Building the first itinerary from your trip idea') || text.includes('Globe is adding named stops'),
      }
    })
    slowTripId = studioState.tripId
    const studioMetrics = await pageMetrics(slowPage)
    results.push(record('Browser planner delayed query shows progress and reaches Trip Studio', (
      waitingState.hasOpeningState &&
      waitingState.promptVisible &&
      waitingState.inputPlaceholder.includes('Opening Trip Studio') &&
      waitingState.inputDisabled === true &&
      waitingState.sendDisabled === true &&
      waitingState.disabledStepCount === waitingState.stepCount &&
      studioState.hasPromptParam &&
      studioState.hasStudioActions &&
      studioState.hasInitialGenerationCopy &&
      !waitingMetrics.hasAppError &&
      !waitingMetrics.horizontalOverflow &&
      !studioMetrics.hasAppError &&
      !studioMetrics.horizontalOverflow
    ), {
      waitingState,
      studioState,
      waitingMetrics,
      studioMetrics,
    }))
    await slowContext.close().catch(() => {})
  } catch (error) {
    results.push(record('Browser planner start checks completed without unexpected exception', false, {
      error: error instanceof Error ? error.message : String(error),
    }))
  } finally {
    await browser?.close().catch(() => {})
    const tripCleanup = await cleanupTrip(slowTripId)
    const failureGuestCleanup = await cleanupGuestAccount(failureGuestId)
    const slowGuestCleanup = await cleanupGuestAccount(slowGuestId)
    results.push(record('Browser planner start checks clean up disposable state', (
      (!slowTripId || tripCleanup.tripDeleted) &&
      failureGuestCleanup.userDeleted &&
      slowGuestCleanup.userDeleted &&
      !tripCleanup.error &&
      !failureGuestCleanup.error &&
      !slowGuestCleanup.error
    ), {
      tripCleanup,
      failureGuestCleanup,
      slowGuestCleanup,
    }))
  }
}

await loadDotEnv()

const results = []
const chatSource = await readFile(resolve(root, 'app/(app)/chat/page.tsx'), 'utf8')

const queryGuardIndex = chatSource.indexOf('if (!queryPrompt || sentQueryRef.current === queryPrompt) return')
const timeoutIndex = chatSource.indexOf('setTimeout', queryGuardIndex)
const sentInsideTimerIndex = chatSource.indexOf('sentQueryRef.current = queryPrompt', timeoutIndex)
const sendInsideTimerIndex = chatSource.indexOf('sendMessage(queryPrompt)', sentInsideTimerIndex)
const targetPromptIndex = chatSource.indexOf('`/trips/${tripId}?prompt=${encodeURIComponent(trimmed)}`')

results.push(record('Planner source derives query prompt from current search params', chatSource.includes("const queryPrompt = searchParams.get('q')?.trim() || ''")))
results.push(record('Planner source does not use stale one-shot query refs', !chatSource.includes('initialQueryRef') && !chatSource.includes('sentInitialRef')))
results.push(record('Planner query handoff marks query as sent only inside the delayed send', queryGuardIndex >= 0 && timeoutIndex > queryGuardIndex && sentInsideTimerIndex > timeoutIndex && sendInsideTimerIndex > sentInsideTimerIndex, {
  queryGuardIndex,
  timeoutIndex,
  sentInsideTimerIndex,
  sendInsideTimerIndex,
}))
results.push(record('Planner handoff preserves the prompt in the Trip Studio URL', targetPromptIndex >= 0))
results.push(record('Planner handoff creates draft trips with days and destination constraints', chatSource.includes('days: extractDraftDays(prompt)') && chatSource.includes('destination_query: extractDestinationFromPrompt(prompt) || undefined')))
results.push(record('Planner mobile composer keeps an explicit trip idea label', chatSource.includes('aria-label="Describe your trip idea"')))
results.push(record('Planner handoff has a visible opening state', chatSource.includes('Opening Trip Studio') && chatSource.includes('Building a draft for')))
results.push(record('Planner handoff preserves failed prompts for retry', chatSource.includes('setDraftInput(trimmed)') && chatSource.includes('Try again') && chatSource.includes('Your trip idea is still here')))
results.push(record('Planner handoff disables starter prompts while opening', chatSource.includes('disabled={planningInProgress}') && chatSource.includes('cursor-wait opacity-55')))

const tripStudioSource = await readFile(resolve(root, 'app/(app)/trips/[tripId]/page.tsx'), 'utf8')
const itineraryArtifactSource = await readFile(resolve(root, 'components/trips/ItineraryArtifact.tsx'), 'utf8')
results.push(record('Trip Studio explains initial prompt generation before stops arrive', (
  tripStudioSource.includes('isBuildingInitialItinerary') &&
  tripStudioSource.includes('Building the first itinerary from your trip idea.') &&
  itineraryArtifactSource.includes('Globe is adding named stops, timing, and map context')
)))

try {
  const chatRoute = await fetchText(`/chat?q=${encodeURIComponent(prompt)}`)
  const missingMarkers = ['Planner', 'Trip Studio'].filter((marker) => !chatRoute.text.includes(marker))
  results.push(record('/chat?q prompt route is reachable', chatRoute.response.ok && missingMarkers.length === 0, {
    status: chatRoute.response.status,
    finalUrl: chatRoute.response.url,
    missingMarkers,
  }))
} catch (error) {
  results.push(record('/chat?q prompt route is reachable', false, {
    error: error instanceof Error ? error.message : String(error),
  }))
}

let tripId = null
let cleanup = { attempted: false, tripDeleted: false, error: null }

if (process.env.QA_SKIP_MUTATION !== '1') {
  try {
    const guestId = process.env.QA_GUEST_ID || randomUUID()
    const guestStart = await fetch(`${baseUrl}/api/guest/start?id=${guestId}`, {
      redirect: 'manual',
      headers: { 'user-agent': 'globe-travel-planner-handoff-smoke/1.0' },
    })
    const cookie = getSetCookieHeaders(guestStart.headers)
      .map((value) => value.split(';')[0])
      .filter(Boolean)
      .join('; ')

    const create = await fetchJson('/api/trips', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie,
      },
      body: JSON.stringify({
        title: `QA Planner Handoff ${runId}`,
        travelers_count: 4,
        pace: 'balanced',
        budget_level: 'mid',
        constraints: {
          qa: true,
          plannerHandoffSmoke: true,
          runId,
          days: 5,
          destination_query: 'Athens',
          group_vibe: 'Balanced group trip with friends',
        },
      }),
    })
    tripId = create.json?.tripId || null

    results.push(record('Planner draft API accepts the handoff payload', create.response.ok && typeof tripId === 'string', {
      status: create.response.status,
      tripId,
      shareSlug: create.json?.shareSlug,
    }))

    if (tripId) {
      const tripApi = await fetchJson(`/api/trips/${tripId}`, {
        headers: { cookie },
      })
      const days = Array.isArray(tripApi.json?.days) ? tripApi.json.days : []
      const constraints = tripApi.json?.trip?.constraints || {}

      results.push(record('Planner draft API creates the requested five-day Athens trip shell', tripApi.response.ok && days.length === 5 && constraints.destination_query === 'Athens', {
        status: tripApi.response.status,
        tripTitle: tripApi.json?.trip?.title,
        dayCount: days.length,
        destinationQuery: constraints.destination_query,
      }))
    }
  } catch (error) {
    results.push(record('Planner draft API accepts the handoff payload', false, {
      error: error instanceof Error ? error.message : String(error),
    }))
  } finally {
    cleanup = await cleanupTrip(tripId)
    if (tripId) {
      results.push(record('Planner handoff smoke cleans up disposable draft trip', cleanup.tripDeleted, cleanup))
    }
  }
}

await runBrowserPlannerStartChecks()

const summary = {
  baseUrl,
  prompt,
  runId,
  tripId,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  cleanup,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
