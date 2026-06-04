import { createHash, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'
import { PNG } from 'pngjs'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const runId = process.env.QA_RUN_ID || randomUUID().slice(0, 8)
const fixtureLimit = Number.parseInt(process.env.QA_SHARE_MULTI_UI_LIMIT || '3', 10)
const scriptStartedAt = Date.now()
const childScriptTimeoutMs = Number.parseInt(process.env.QA_SHARE_MULTI_UI_CHILD_TIMEOUT_MS || '90000', 10)
const fetchTimeoutMs = Number.parseInt(process.env.QA_SHARE_MULTI_UI_FETCH_TIMEOUT_MS || '30000', 10)
const phaseTimeoutMs = Number.parseInt(process.env.QA_SHARE_MULTI_UI_PHASE_TIMEOUT_MS || '120000', 10)
const browserTimeoutMs = Number.parseInt(process.env.QA_SHARE_MULTI_UI_BROWSER_TIMEOUT_MS || '480000', 10)
const cleanupTimeoutMs = Number.parseInt(process.env.QA_SHARE_MULTI_UI_CLEANUP_TIMEOUT_MS || '45000', 10)
const totalTimeoutMs = Number.parseInt(process.env.QA_SHARE_MULTI_UI_TOTAL_TIMEOUT_MS || '720000', 10)
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const allowRemote = process.env.QA_ALLOW_REMOTE_MUTATION === '1'
const failures = []
const results = []
const insertedFeedbackIds = []
let browser = null
let supabase = null
let ownerUserId = null
let created = null
let fixtureCleanup = null
let ownerCleanup = null
let shareCardAnalyses = []
let finishing = false

if (!isLocalBaseUrl && !allowRemote) {
  console.error('qa:share-multi-itinerary-ui creates disposable public trips and only runs against localhost unless QA_ALLOW_REMOTE_MUTATION=1 is set.')
  process.exit(1)
}

const totalWatchdog = setTimeout(() => {
  if (finishing) return
  record('multi-itinerary share UI smoke completed before total timeout', false, {
    elapsedMs: Date.now() - scriptStartedAt,
    timeoutMs: totalTimeoutMs,
  })
  console.log(JSON.stringify(buildSummary(), null, 2))
  process.exit(1)
}, totalTimeoutMs)
totalWatchdog.unref?.()

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

function parseJsonOutput(stdout) {
  const trimmed = stdout.trim()
  if (!trimmed) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.lastIndexOf('\n{')
    if (start === -1) return null
    try {
      return JSON.parse(trimmed.slice(start + 1))
    } catch {
      return null
    }
  }
}

function record(name, ok, details = {}) {
  const result = { name, ok: Boolean(ok), ...details }
  results.push(result)
  if (!result.ok) failures.push(result)
  return result
}

function logProgress(message, details = {}) {
  const suffix = Object.keys(details).length ? ` ${JSON.stringify(details)}` : ''
  console.error(`[qa:share-multi-itinerary-ui] ${message}${suffix}`)
}

function buildSummary() {
  return {
    baseUrl,
    runId,
    ownerUserId,
    fixtureLimit,
    fixtureCount: created?.fixtures?.length || 0,
    checkedFixtureKeys: created?.fixtures?.slice(0, Math.max(1, fixtureLimit)).map((fixture) => fixture.key) || [],
    shareSlugs: created?.shareSlugs || [],
    feedbackIds: insertedFeedbackIds,
    shareCardAnalyses,
    fixtureCleanup,
    ownerCleanup,
    checked: results.length,
    passed: results.filter((result) => result.ok).length,
    failed: failures.length,
    elapsedMs: Date.now() - scriptStartedAt,
    results,
    failures,
  }
}

async function withTimeout(label, timeoutMs, operation) {
  let timeout = null
  try {
    return await Promise.race([
      operation(),
      new Promise((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`))
        }, timeoutMs)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function runPhase(name, operation, timeoutMs = phaseTimeoutMs) {
  const startedAt = Date.now()
  logProgress(`${name} started`)
  try {
    const value = await withTimeout(name, timeoutMs, operation)
    logProgress(`${name} completed`, { elapsedMs: Date.now() - startedAt })
    return value
  } catch (error) {
    logProgress(`${name} failed`, {
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

function runNodeScript(script, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], {
      cwd: process.cwd(),
      env: { ...process.env, QA_BASE_URL: baseUrl, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let settled = false

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, childScriptTimeoutMs)

    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      resolve(result)
    }

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('error', (error) => {
      finish({
        code: null,
        signal: null,
        timedOut,
        stdout,
        stderr: `${stderr}\n${error instanceof Error ? error.message : String(error)}`.trim(),
        parsed: parseJsonOutput(stdout),
      })
    })
    child.on('close', (code, signal) => {
      finish({ code, signal, timedOut, stdout, stderr, parsed: parseJsonOutput(stdout) })
    })
  })
}

async function fetchJson(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    signal: init.signal || AbortSignal.timeout(fetchTimeoutMs),
    headers: {
      'user-agent': 'globe-travel-share-multi-itinerary-ui-smoke/1.0',
      ...(init.headers || {}),
    },
  })
  const text = await response.text()
  let json = null

  try {
    json = JSON.parse(text)
  } catch {
    // handled by caller
  }

  return { response, text, json }
}

async function fetchBuffer(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    signal: init.signal || AbortSignal.timeout(fetchTimeoutMs),
    headers: {
      'user-agent': 'globe-travel-share-multi-itinerary-ui-smoke/1.0',
      ...(init.headers || {}),
    },
  })
  return { response, buffer: Buffer.from(await response.arrayBuffer()) }
}

async function setupSupabase() {
  await loadDotEnv()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for qa:share-multi-itinerary-ui.')
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

async function createDisposableOwner() {
  ownerUserId = randomUUID()
  const email = `qa-share-${ownerUserId.slice(0, 8)}@globe-travel.local`
  const { error: userError } = await supabase.auth.admin.createUser({
    id: ownerUserId,
    email,
    email_confirm: true,
    password: randomUUID(),
    user_metadata: {
      full_name: 'QA Share Owner',
      is_guest: true,
    },
  })
  if (userError && !/already|duplicate|registered/i.test(userError.message)) {
    throw new Error(userError.message)
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: ownerUserId,
      username: `qa-share-${ownerUserId.slice(0, 8)}`,
      display_name: 'QA Share Owner',
      avatar_url: null,
      bio: 'Disposable owner for public share multi-itinerary QA.',
      travel_style: 'group city breaks',
      onboarding_completed: true,
    }, { onConflict: 'id' })

  if (profileError) throw new Error(profileError.message)

  record('multi-itinerary share owner fixture created', true, {
    ownerUserId,
  })
}

async function createFixtureSet() {
  const createdResult = await runNodeScript('scripts/platform-share-fixtures.mjs', {
    QA_OWNER_USER_ID: ownerUserId,
    QA_RUN_ID: runId,
  })
  created = createdResult.parsed

  record('multi-itinerary public share fixtures created', (
    createdResult.code === 0 &&
    created?.ok === true &&
    Array.isArray(created?.fixtures) &&
    created.fixtures.length >= Math.max(3, fixtureLimit)
  ), {
    code: createdResult.code,
    fixtureCount: created?.fixtures?.length || 0,
    shareSlugs: created?.shareSlugs || [],
    runId: created?.runId || runId,
    stderr: createdResult.stderr.trim().slice(-300),
  })
}

async function cleanupFeedback() {
  if (!insertedFeedbackIds.length) return

  const { error } = await supabase
    .from('trip_feedback')
    .delete()
    .in('id', insertedFeedbackIds)

  record('multi-itinerary feedback cleanup deleted inserted reactions', !error, {
    feedbackIds: insertedFeedbackIds,
    deleted: !error,
    error: error?.message || null,
  })
}

async function cleanupFixtures() {
  if (!created?.fixtures?.length) return
  const tripIds = created.fixtures.map((fixture) => fixture.tripId).filter(Boolean)
  const cleaned = await runNodeScript('scripts/platform-share-fixtures.mjs', {
    QA_CLEANUP_TRIP_IDS: tripIds.join(','),
    QA_CLEANUP_RUN_ID: created.runId || runId,
  })
  fixtureCleanup = cleaned.parsed
  record('multi-itinerary public share fixtures cleaned up', cleaned.code === 0 && cleaned.parsed?.ok === true, {
    code: cleaned.code,
    tripIds,
    tripsDeleted: cleaned.parsed?.tripsDeleted,
    placesDeleted: cleaned.parsed?.placesDeleted,
    errors: cleaned.parsed?.errors,
    stderr: cleaned.stderr.trim().slice(-300),
  })
}

async function cleanupOwner() {
  if (!ownerUserId || !supabase) return

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', ownerUserId)
  const { error: userError } = await supabase.auth.admin.deleteUser(ownerUserId)
  const userAlreadyAbsent = Boolean(userError?.message?.toLowerCase().includes('not found'))
  ownerCleanup = {
    ownerUserId,
    profileDeleted: !profileError,
    userDeleted: !userError || userAlreadyAbsent,
    profileError: profileError?.message || null,
    userError: userAlreadyAbsent ? null : userError?.message || null,
  }

  record('multi-itinerary share owner fixture cleaned up', (
    !profileError &&
    (!userError || userAlreadyAbsent)
  ), ownerCleanup)
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

async function addOwnerCookie(context) {
  const cookie = {
    name: 'globe_travel_guest',
    value: ownerUserId,
    httpOnly: false,
    secure: baseUrl.startsWith('https://'),
    sameSite: 'Lax',
  }
  const cookieUrl = new URL(baseUrl)

  await context.addCookies([
    cookieUrl.hostname === 'localhost'
      ? { ...cookie, domain: 'localhost', path: '/' }
      : { ...cookie, url: baseUrl },
  ])
}

async function pageState(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 1000 }).catch(() => {})
  return page.evaluate(() => {
    const text = document.body?.innerText || ''
    const buttons = Array.from(document.querySelectorAll('button'))
      .map((button) => (button.textContent || '').trim().replace(/\s+/g, ' '))
      .filter(Boolean)
    const startLinks = Array.from(document.querySelectorAll('a'))
      .filter((link) => (link.textContent || '').includes('Start your own trip'))
      .map((link) => {
        const url = new URL(link.href)
        return {
          href: link.href,
          pathname: url.pathname,
          q: url.searchParams.get('q'),
        }
      })

    return {
      url: location.href,
      title: document.title,
      text,
      normalizedText: text.toLowerCase(),
      buttons,
      startLinks,
      hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => text.includes(pattern)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
}

async function gotoOwnerTrip(page, tripId) {
  await page.goto(`${baseUrl}/trips/${tripId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  await page.waitForFunction(() => {
    const text = document.body?.innerText || ''
    return (
      text.includes('Trip Studio') &&
      text.includes('Friend feedback') &&
      text.includes('Planner workflows')
    )
  }, { timeout: 15000 }).catch(() => {})
}

async function gotoPublicShare(page, shareSlug) {
  await page.goto(`${baseUrl}/t/${shareSlug}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  await page.waitForFunction(() => {
    const text = document.body?.innerText || ''
    return (
      text.includes('Shared Globe.travel map') &&
      text.includes('Day-by-day itinerary') &&
      text.includes('Add your reaction') &&
      text.includes('Share trip') &&
      text.includes('Start your own trip')
    )
  }, { timeout: 15000 }).catch(() => {})
}

async function submitFeedback(page, fixture, index) {
  const sentiments = [
    ['Love it', 'love_it'],
    ['Curious', 'curious'],
    ['Practical note', 'practical'],
  ]
  const [label, sentiment] = sentiments[index % sentiments.length]
  const author = `QA Multi Friend ${index + 1} ${runId}`
  const comment = `QA multi-itinerary feedback ${runId} for ${fixture.title}: this public plan is readable, shareable, and gives the group a clear next action.`

  await page.getByLabel('Your name').fill(author)
  await page.getByLabel('Email optional').fill('')
  await page.getByRole('button', { name: new RegExp(`^${label}:`, 'i') }).click({ timeout: 8000 })
  await page.getByLabel('Trip feedback').fill(comment)

  const readyState = await pageState(page)
  const sendButton = page.getByRole('button', { name: /Send feedback/i })
  const sendEnabled = await sendButton.isEnabled().catch(() => false)
  record(`multi-itinerary ${fixture.key} feedback form is ready`, (
    readyState.text.includes('Ready to send') &&
    sendEnabled &&
    !readyState.hasAppError &&
    !readyState.horizontalOverflow
  ), {
    shareSlug: fixture.shareSlug,
    sentiment,
    hasReadyCopy: readyState.text.includes('Ready to send'),
    sendEnabled,
    hasAppError: readyState.hasAppError,
    horizontalOverflow: readyState.horizontalOverflow,
  })

  await sendButton.click({ timeout: 8000 })
  await page.waitForFunction((expectedComment) => {
    const text = document.body?.innerText || ''
    return text.includes('Feedback sent') || text.includes(expectedComment)
  }, comment, { timeout: 5000 }).catch(() => {})

  const readback = await fetchJson(`/api/trips/share/${fixture.shareSlug}/feedback`, { cache: 'no-store' })
  const rows = Array.isArray(readback.json) ? readback.json : []
  const row = rows.find((entry) => (
    entry.author_name === author &&
    entry.comment === comment &&
    entry.sentiment === sentiment
  ))
  if (row?.id) insertedFeedbackIds.push(row.id)

  record(`multi-itinerary ${fixture.key} feedback submits and reads back`, (
    readback.response.ok &&
    Boolean(row?.id)
  ), {
    shareSlug: fixture.shareSlug,
    status: readback.response.status,
    feedbackId: row?.id || null,
    feedbackCount: rows.length,
    sentiment: row?.sentiment || null,
  })

  return { author, comment, sentiment, feedbackId: row?.id || null }
}

async function runOwnerFeedbackRefreshChecks(verifications) {
  const ownerViewports = [
    { label: 'phone', viewport: { width: 390, height: 844 }, isMobile: true },
    { label: 'tablet', viewport: { width: 768, height: 1024 }, isMobile: false },
    { label: 'desktop', viewport: { width: 1280, height: 900 }, isMobile: false },
  ]

  for (const [index, verification] of verifications.entries()) {
    const viewport = ownerViewports[index % ownerViewports.length]
    await runPhase(`verify owner feedback ${verification.fixture.key} on ${viewport.label}`, async () => {
      const ownerContext = await browser.newContext({
        viewport: viewport.viewport,
        deviceScaleFactor: 1,
        isMobile: viewport.isMobile,
      })
      await addOwnerCookie(ownerContext)
      const ownerPage = await ownerContext.newPage()

      try {
        await gotoOwnerTrip(ownerPage, verification.fixture.tripId)
        await ownerPage.waitForFunction((expectedComment) => {
          const text = document.body?.innerText || ''
          return text.includes(expectedComment) && text.includes('crew reacting')
        }, verification.feedback.comment, { timeout: 15000 }).catch(() => {})

        const ownerState = await pageState(ownerPage)
        const refreshButton = ownerPage.getByRole('button', { name: /Refresh plan from feedback/i })
        const refreshEnabled = await refreshButton.isEnabled().catch(() => false)

        record(`multi-itinerary ${verification.fixture.key} owner feedback readback works on ${viewport.label}`, (
          ownerState.text.includes(verification.fixture.title) &&
          ownerState.text.includes(verification.feedback.author) &&
          ownerState.text.includes(verification.feedback.comment) &&
          ownerState.text.includes('crew reacting') &&
          ownerState.text.includes('Share invite') &&
          !ownerState.text.includes('View only') &&
          refreshEnabled &&
          !ownerState.hasAppError &&
          !ownerState.horizontalOverflow
        ), {
          shareSlug: verification.fixture.shareSlug,
          tripId: verification.fixture.tripId,
          url: ownerState.url,
          viewport: viewport.label,
          hasTitle: ownerState.text.includes(verification.fixture.title),
          hasAuthor: ownerState.text.includes(verification.feedback.author),
          hasComment: ownerState.text.includes(verification.feedback.comment),
          hasCrewReacting: ownerState.text.includes('crew reacting'),
          hasShareInvite: ownerState.text.includes('Share invite'),
          hasViewOnly: ownerState.text.includes('View only'),
          refreshEnabled,
          hasAppError: ownerState.hasAppError,
          horizontalOverflow: ownerState.horizontalOverflow,
          clientWidth: ownerState.clientWidth,
          scrollWidth: ownerState.scrollWidth,
          textExcerpt: ownerState.text.trim().replace(/\s+/g, ' ').slice(0, 220),
        })

        if (!refreshEnabled) return

        await refreshButton.click({ timeout: 8000 })
        await ownerPage.waitForFunction(() => {
          const text = document.body?.innerText || ''
          const lowerText = text.toLowerCase()
          return lowerText.includes('feedback refresh') && (lowerText.includes('completed') || text.includes('"status": "ready"'))
        }, { timeout: 15000 }).catch(() => {})

        const refreshState = await pageState(ownerPage)
        const refreshText = refreshState.text.toLowerCase()
        record(`multi-itinerary ${verification.fixture.key} owner feedback refresh completes on ${viewport.label}`, (
          refreshText.includes('feedback refresh') &&
          refreshState.text.includes('"status": "ready"') &&
          !refreshState.hasAppError &&
          !refreshState.horizontalOverflow
        ), {
          shareSlug: verification.fixture.shareSlug,
          tripId: verification.fixture.tripId,
          viewport: viewport.label,
          hasFeedbackRefresh: refreshText.includes('feedback refresh'),
          hasReadyStatus: refreshState.text.includes('"status": "ready"'),
          hasAppError: refreshState.hasAppError,
          horizontalOverflow: refreshState.horizontalOverflow,
          clientWidth: refreshState.clientWidth,
          scrollWidth: refreshState.scrollWidth,
        })
      } finally {
        await ownerContext.close().catch(() => {})
      }
    }, 70000)
  }
}

async function runBrowserChecks() {
  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
  })

  const fixturesToCheck = created.fixtures.slice(0, Math.max(1, fixtureLimit))
  const desktopVerifications = []

  for (const [index, fixture] of fixturesToCheck.entries()) {
    logProgress(`verify public recipient flow ${fixture.key} on phone started`, {
      shareSlug: fixture.shareSlug,
    })
    const phoneContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 1,
      isMobile: true,
    })
    const phonePage = await phoneContext.newPage()
    await installShareStubs(phonePage)
    await gotoPublicShare(phonePage, fixture.shareSlug)
    const initialState = await pageState(phonePage)
    const startPrompts = initialState.startLinks.map((link) => link.q || '')
    const expectedDayCopy = `${fixture.dayCount} day${fixture.dayCount === 1 ? '' : 's'}`

    record(`multi-itinerary ${fixture.key} public share is usable on phone`, (
      initialState.text.includes(fixture.title) &&
      initialState.normalizedText.includes('day-by-day itinerary') &&
      initialState.normalizedText.includes('add your reaction') &&
      initialState.normalizedText.includes('share trip') &&
      initialState.normalizedText.includes('start your own trip') &&
      initialState.normalizedText.includes(expectedDayCopy) &&
      initialState.startLinks.length >= 2 &&
      initialState.startLinks.every((link) => link.pathname === '/api/guest/start' && link.q?.includes('shareable itinerary map')) &&
      !initialState.hasAppError &&
      !initialState.horizontalOverflow
    ), {
      shareSlug: fixture.shareSlug,
      title: fixture.title,
      dayCount: fixture.dayCount,
      hasTitle: initialState.text.includes(fixture.title),
      hasItinerary: initialState.normalizedText.includes('day-by-day itinerary'),
      hasFeedbackForm: initialState.normalizedText.includes('add your reaction'),
      hasShareTrip: initialState.normalizedText.includes('share trip'),
      hasStartCta: initialState.normalizedText.includes('start your own trip'),
      hasDayCopy: initialState.normalizedText.includes(expectedDayCopy),
      startLinkCount: initialState.startLinks.length,
      startPrompts,
      hasAppError: initialState.hasAppError,
      horizontalOverflow: initialState.horizontalOverflow,
      clientWidth: initialState.clientWidth,
      scrollWidth: initialState.scrollWidth,
    })

    desktopVerifications.push({
      fixture,
      feedback: await submitFeedback(phonePage, fixture, index),
    })
    await phoneContext.close().catch(() => {})
    logProgress(`verify public recipient flow ${fixture.key} on phone completed`)
  }

  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  const desktopPage = await desktopContext.newPage()
  await installShareStubs(desktopPage)

  for (const [index, verification] of desktopVerifications.entries()) {
    logProgress(`verify public feedback readback ${verification.fixture.key} on desktop started`, {
      shareSlug: verification.fixture.shareSlug,
    })
    await gotoPublicShare(desktopPage, verification.fixture.shareSlug)
    await desktopPage.waitForFunction((expectedComment) => {
      const text = document.body?.innerText || ''
      return text.includes(expectedComment)
    }, verification.feedback.comment, { timeout: 5000 }).catch(() => {})
    const desktopState = await pageState(desktopPage)

    record(`multi-itinerary ${verification.fixture.key} feedback remains visible on desktop`, (
      desktopState.text.includes(verification.feedback.author) &&
      desktopState.text.includes(verification.feedback.comment) &&
      desktopState.normalizedText.includes('share trip') &&
      !desktopState.hasAppError &&
      !desktopState.horizontalOverflow
    ), {
      shareSlug: verification.fixture.shareSlug,
      hasAuthor: desktopState.text.includes(verification.feedback.author),
      hasComment: desktopState.text.includes(verification.feedback.comment),
      hasShareTrip: desktopState.normalizedText.includes('share trip'),
      hasAppError: desktopState.hasAppError,
      horizontalOverflow: desktopState.horizontalOverflow,
      clientWidth: desktopState.clientWidth,
      scrollWidth: desktopState.scrollWidth,
    })

    if (index === 0) {
      await desktopPage.getByRole('button', { name: 'Copy link' }).click({ timeout: 8000 })
      await desktopPage.waitForFunction(() => (window.__globeShareEvents?.clipboardWrites || []).length > 0, { timeout: 5000 }).catch(() => {})
      await desktopPage.waitForFunction(() => (document.body?.innerText || '').includes('Copied'), { timeout: 5000 }).catch(() => {})
      const copyState = await desktopPage.evaluate(() => ({
        clipboardWrites: window.__globeShareEvents?.clipboardWrites || [],
        copiedVisible: (document.body?.innerText || '').includes('Copied'),
      }))
      record('multi-itinerary public share copy link works on desktop', (
        copyState.clipboardWrites.some((entry) => entry.includes(`/t/${verification.fixture.shareSlug}`)) &&
        copyState.copiedVisible
      ), copyState)

      await desktopPage.getByRole('button', { name: 'Share' }).click({ timeout: 8000 })
      await desktopPage.waitForFunction(() => (window.__globeShareEvents?.nativeShares || []).length > 0, { timeout: 5000 }).catch(() => {})
      const nativeShareState = await desktopPage.evaluate(() => ({
        nativeShares: window.__globeShareEvents?.nativeShares || [],
      }))
      record('multi-itinerary public share native share payload is trip-specific', (
        nativeShareState.nativeShares.length === 1 &&
        String(nativeShareState.nativeShares[0]?.title || '').includes(verification.fixture.title) &&
        String(nativeShareState.nativeShares[0]?.text || '').includes('Globe.travel') &&
        String(nativeShareState.nativeShares[0]?.url || '').includes(`/t/${verification.fixture.shareSlug}`)
      ), nativeShareState)
    }
    logProgress(`verify public feedback readback ${verification.fixture.key} on desktop completed`)
  }

  await desktopContext.close().catch(() => {})

  await runOwnerFeedbackRefreshChecks(desktopVerifications)
}

async function runShareCardImageChecks() {
  const analyses = []

  for (const fixture of created.fixtures) {
    const image = await fetchBuffer(`/api/share-card/${fixture.shareSlug}`, { cache: 'no-store' })
    let png = null
    try {
      png = PNG.sync.read(image.buffer)
    } catch {
      png = null
    }

    const expectedPaper = { r: 246, g: 241, b: 230 }
    let sampled = 0
    let nonPaper = 0
    let darkPixels = 0
    let brassPixels = 0
    const colorBuckets = new Set()

    if (png) {
      for (let y = 0; y < png.height; y += 6) {
        for (let x = 0; x < png.width; x += 6) {
          const offset = (png.width * y + x) << 2
          const r = png.data[offset]
          const g = png.data[offset + 1]
          const b = png.data[offset + 2]
          const a = png.data[offset + 3]
          if (a < 16) continue
          sampled += 1
          const paperDistance = Math.abs(r - expectedPaper.r) + Math.abs(g - expectedPaper.g) + Math.abs(b - expectedPaper.b)
          if (paperDistance > 30) nonPaper += 1
          if (r < 90 && g < 110 && b < 130) darkPixels += 1
          if (r >= 90 && r <= 180 && g >= 55 && g <= 140 && b <= 110) brassPixels += 1
          colorBuckets.add(`${Math.round(r / 12)},${Math.round(g / 12)},${Math.round(b / 12)}`)
        }
      }
    }

    const analysis = {
      key: fixture.key,
      shareSlug: fixture.shareSlug,
      title: fixture.title,
      status: image.response.status,
      contentType: image.response.headers.get('content-type') || '',
      byteLength: image.buffer.length,
      hash: createHash('sha256').update(image.buffer).digest('hex'),
      width: png?.width || 0,
      height: png?.height || 0,
      sampledPixels: sampled,
      uniqueColorBuckets: colorBuckets.size,
      nonPaperRatio: sampled ? Number((nonPaper / sampled).toFixed(4)) : 0,
      darkPixelRatio: sampled ? Number((darkPixels / sampled).toFixed(4)) : 0,
      brassPixelRatio: sampled ? Number((brassPixels / sampled).toFixed(4)) : 0,
    }

    analyses.push(analysis)
    record(`multi-itinerary ${fixture.key} share-card image has branded nonblank content`, (
      image.response.ok &&
      analysis.contentType.toLowerCase().startsWith('image/png') &&
      analysis.width === 1200 &&
      analysis.height === 630 &&
      analysis.byteLength > 40000 &&
      analysis.uniqueColorBuckets >= 30 &&
      analysis.nonPaperRatio >= 0.04 &&
      analysis.darkPixelRatio >= 0.015 &&
      analysis.brassPixelRatio >= 0.003
    ), analysis)
  }

  const uniqueHashes = new Set(analyses.map((analysis) => analysis.hash))
  const uniqueByteLengths = new Set(analyses.map((analysis) => analysis.byteLength))
  shareCardAnalyses = analyses

  record('multi-itinerary share-card images are trip-specific across fixture set', (
    analyses.length === created.fixtures.length &&
    uniqueHashes.size === analyses.length &&
    uniqueByteLengths.size >= Math.min(5, analyses.length)
  ), {
    imageCount: analyses.length,
    uniqueHashCount: uniqueHashes.size,
    uniqueByteLengthCount: uniqueByteLengths.size,
    hashes: analyses.map((analysis) => ({
      key: analysis.key,
      shareSlug: analysis.shareSlug,
      hash: analysis.hash.slice(0, 16),
      byteLength: analysis.byteLength,
    })),
  })
}

try {
  await runPhase('setup Supabase client', setupSupabase, 30000)
  await runPhase('create disposable owner', createDisposableOwner, 45000)
  await runPhase('create public share fixture set', createFixtureSet, 90000)
  if (failures.length === 0) {
    const shareSmoke = await runPhase('run public share API smoke across fixture set', () => runNodeScript('scripts/platform-share-smoke.mjs', {
      QA_SHARE_SLUGS: created.shareSlugs.join(','),
    }), childScriptTimeoutMs + 5000)
    record('multi-itinerary fixture set passes public share API smoke', shareSmoke.code === 0 && shareSmoke.parsed?.failed === 0, {
      code: shareSmoke.code,
      signal: shareSmoke.signal || null,
      timedOut: Boolean(shareSmoke.timedOut),
      checked: shareSmoke.parsed?.checked,
      passed: shareSmoke.parsed?.passed,
      failed: shareSmoke.parsed?.failed,
      shareSlugCount: shareSmoke.parsed?.shareSlugs?.length,
      stderr: shareSmoke.stderr.trim().slice(-300),
    })
  }
  if (failures.length === 0) await runPhase('verify multi-itinerary share-card images', runShareCardImageChecks, 120000)
  if (failures.length === 0) await runPhase('verify multi-itinerary public and owner browser flows', runBrowserChecks, browserTimeoutMs)
} catch (error) {
  record('multi-itinerary share UI smoke completed without unexpected exception', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  await runPhase('close browser', async () => {
    await browser?.close().catch(() => {})
  }, cleanupTimeoutMs).catch((error) => {
    record('multi-itinerary browser cleanup completed before timeout', false, {
      error: error instanceof Error ? error.message : String(error),
    })
  })
  await runPhase('cleanup inserted feedback', cleanupFeedback, cleanupTimeoutMs).catch((error) => {
    record('multi-itinerary feedback cleanup completed before timeout', false, {
      error: error instanceof Error ? error.message : String(error),
    })
  })
  await runPhase('cleanup public share fixtures', cleanupFixtures, cleanupTimeoutMs).catch((error) => {
    record('multi-itinerary public share fixture cleanup completed before timeout', false, {
      error: error instanceof Error ? error.message : String(error),
    })
  })
  await runPhase('cleanup disposable owner', cleanupOwner, cleanupTimeoutMs).catch((error) => {
    record('multi-itinerary owner cleanup completed before timeout', false, {
      error: error instanceof Error ? error.message : String(error),
    })
  })
}

finishing = true
clearTimeout(totalWatchdog)

const summary = buildSummary()

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}

process.exit(failures.length > 0 ? 1 : 0)
