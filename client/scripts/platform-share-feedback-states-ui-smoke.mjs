import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const providedShareSlug = process.env.QA_SHARE_SLUG || ''
const providedTripId = process.env.QA_TRIP_ID || ''
const providedGuestId = process.env.QA_GUEST_ID || ''
const providedRunId = process.env.QA_RUN_ID || ''
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const shouldCreateFixture = !providedShareSlug || !providedTripId || !providedGuestId
const runId = providedRunId || randomUUID().slice(0, 8)
const duplicateAuthor = `QA Shared Friend ${runId}`
const failures = []
const results = []
const insertedFeedbackIds = []
let browser = null
let fixture = {
  shareSlug: providedShareSlug,
  tripId: providedTripId,
  guestId: providedGuestId,
  runId,
  external: !shouldCreateFixture,
}

const feedbackVariants = [
  {
    label: 'Love it',
    sentiment: 'love_it',
    author: `QA Love ${runId}`,
    comment: `QA share-state ${runId}: The Acropolis morning should absolutely stay because it anchors the whole trip.`,
  },
  {
    label: 'Curious',
    sentiment: 'curious',
    author: duplicateAuthor,
    comment: `QA share-state ${runId}: Could we clarify whether the ferry timing leaves enough room for breakfast?`,
  },
  {
    label: 'Practical note',
    sentiment: 'practical',
    author: duplicateAuthor,
    comment: [
      `QA share-state ${runId}: This is the near-limit practical note.`,
      'Please protect a slower cafe break, add transit breathing room before dinner, keep the museum day flexible, and make sure the group knows which stop is the firm booking anchor.',
      'The plan still feels exciting, but this kind of long friend comment needs to stay readable, valid, and useful for the organizer without breaking the public share layout.',
      'This sentence pads the message close to the field limit while staying realistic for a verbose friend reviewing a group itinerary.',
    ].join(' '),
  },
]

if (!isLocalBaseUrl) {
  console.error('qa:share-feedback-states-ui mutates disposable feedback and only runs against localhost.')
  process.exit(1)
}

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

function runNodeScript(script, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], {
      cwd: process.cwd(),
      env: { ...process.env, QA_BASE_URL: baseUrl, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })
    child.on('close', (code) => {
      resolve({ code, stdout, stderr, parsed: parseJsonOutput(stdout) })
    })
  })
}

async function fetchJson(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'user-agent': 'globe-travel-share-feedback-states-ui-smoke/1.0',
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

async function getSupabase() {
  await loadDotEnv()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for feedback cleanup.')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

async function createFixtureIfNeeded() {
  if (!shouldCreateFixture) {
    record('share feedback states fixture supplied by caller', true, fixture)
    return
  }

  const created = await runNodeScript('scripts/platform-trip-studio-actions.mjs', {
    QA_KEEP_FIXTURE: '1',
  })
  fixture = {
    shareSlug: created.parsed?.fixture?.shareSlug || null,
    tripId: created.parsed?.fixture?.tripId || null,
    guestId: created.parsed?.guestId || null,
    runId: created.parsed?.runId || runId,
    external: false,
  }

  record('share feedback states fixture created with empty public feedback', (
    created.code === 0 &&
    created.parsed?.failed === 0 &&
    Boolean(fixture.shareSlug && fixture.tripId && fixture.guestId && fixture.runId)
  ), {
    code: created.code,
    checked: created.parsed?.checked,
    passed: created.parsed?.passed,
    failed: created.parsed?.failed,
    fixture,
    stderr: created.stderr.trim().slice(-300),
  })
}

async function cleanupFeedback() {
  if (insertedFeedbackIds.length === 0) return

  try {
    const supabase = await getSupabase()
    const { error } = await supabase
      .from('trip_feedback')
      .delete()
      .in('id', insertedFeedbackIds)

    record('share feedback states cleanup deleted inserted reactions', !error, {
      feedbackIds: insertedFeedbackIds,
      deleted: !error,
      error: error?.message || null,
    })
  } catch (error) {
    record('share feedback states cleanup deleted inserted reactions', false, {
      feedbackIds: insertedFeedbackIds,
      deleted: false,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

async function cleanupFixture() {
  if (fixture.external || !fixture.tripId) {
    record('share feedback states fixture cleanup skipped for external fixture', true, fixture)
    return
  }

  const cleaned = await runNodeScript('scripts/platform-trip-studio-actions.mjs', {
    QA_CLEANUP_TRIP_ID: fixture.tripId || '',
    QA_CLEANUP_RUN_ID: fixture.runId || '',
    QA_CLEANUP_GUEST_ID: fixture.guestId || '',
  })
  record('share feedback states fixture cleanup passed', cleaned.code === 0 && cleaned.parsed?.ok === true, {
    code: cleaned.code,
    tripDeleted: cleaned.parsed?.tripDeleted,
    placesDeleted: cleaned.parsed?.placesDeleted,
    guestProfileDeleted: cleaned.parsed?.guestProfileDeleted,
    guestUserDeleted: cleaned.parsed?.guestUserDeleted,
    errors: cleaned.parsed?.errors,
    stderr: cleaned.stderr.trim().slice(-300),
  })
}

async function pageState(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3500 }).catch(() => {})
  return page.evaluate(() => {
    const text = document.body?.innerText || ''
    return {
      url: location.href,
      text,
      hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => text.includes(pattern)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
}

async function gotoPublicShare(page) {
  await page.goto(`${baseUrl}/t/${fixture.shareSlug}`, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  })
  await page.waitForFunction(() => {
    const text = (document.body?.innerText || '').toLowerCase()
    return (
      text.includes('add your reaction') &&
      text.includes('friend feedback') &&
      text.includes('send feedback')
    )
  }, { timeout: 15000 })
}

async function waitForFeedbackRow(variant) {
  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const feedbackRead = await fetchJson(`/api/trips/share/${fixture.shareSlug}/feedback`, { cache: 'no-store' })
    const rows = Array.isArray(feedbackRead.json) ? feedbackRead.json : []
    const row = rows.find((entry) => (
      entry.author_name === variant.author &&
      entry.comment === variant.comment &&
      entry.sentiment === variant.sentiment
    ))
    if (feedbackRead.response.ok && row?.id) return { row, rows, status: feedbackRead.response.status }
    await new Promise((resolve) => setTimeout(resolve, 450 * attempt))
  }

  const feedbackRead = await fetchJson(`/api/trips/share/${fixture.shareSlug}/feedback`, { cache: 'no-store' })
  const rows = Array.isArray(feedbackRead.json) ? feedbackRead.json : []
  return { row: null, rows, status: feedbackRead.response.status }
}

async function selectSentiment(page, label) {
  const option = page.getByRole('button', { name: new RegExp(`^${label}:`, 'i') })
  await option.click({ timeout: 8000 })
}

async function submitVariant(page, variant) {
  await page.getByLabel('Your name').fill(variant.author)
  await page.getByLabel('Email optional').fill('')
  await selectSentiment(page, variant.label)
  await page.getByLabel('Trip feedback').fill(variant.comment)

  const readyState = await pageState(page)
  const sendButton = page.getByRole('button', { name: /Send feedback/i })
  const sendEnabled = await sendButton.isEnabled().catch(() => false)
  const expectedCount = String(variant.comment.trim().length)

  record(`feedback state ${variant.sentiment} form is ready`, (
    readyState.text.includes('Ready to send') &&
    readyState.text.includes(`${expectedCount}/600`) &&
    sendEnabled &&
    !readyState.hasAppError &&
    !readyState.horizontalOverflow
  ), {
    author: variant.author,
    commentLength: variant.comment.trim().length,
    hasReadyCopy: readyState.text.includes('Ready to send'),
    hasCharacterCount: readyState.text.includes(`${expectedCount}/600`),
    sendEnabled,
    hasAppError: readyState.hasAppError,
    horizontalOverflow: readyState.horizontalOverflow,
  })

  await sendButton.click({ timeout: 8000 })
  await page.waitForFunction((comment) => {
    const text = document.body?.innerText || ''
    return text.includes('Feedback sent') || text.includes(comment)
  }, variant.comment, { timeout: 12000 }).catch(() => {})

  const afterSubmitState = await pageState(page)
  const commentValueAfterSubmit = await page.getByLabel('Trip feedback').inputValue()
  const readback = await waitForFeedbackRow(variant)
  const feedbackId = readback.row?.id || null
  if (feedbackId) insertedFeedbackIds.push(feedbackId)

  record(`feedback state ${variant.sentiment} submits and reads back`, (
    Boolean(feedbackId) &&
    commentValueAfterSubmit === '' &&
    !afterSubmitState.hasAppError &&
    !afterSubmitState.horizontalOverflow
  ), {
    feedbackId,
    feedbackCount: readback.rows.length,
    status: readback.status,
    commentCleared: commentValueAfterSubmit === '',
    hasAppError: afterSubmitState.hasAppError,
    horizontalOverflow: afterSubmitState.horizontalOverflow,
  })
}

async function runBrowserChecks() {
  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
  })

  const phoneContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
  })
  const phonePage = await phoneContext.newPage()
  await gotoPublicShare(phonePage)

  const emptyState = await pageState(phonePage)
  const expectsEmpty = !fixture.external
  record('public share feedback empty state is useful before reactions', (
    (!expectsEmpty || emptyState.text.includes('0 reactions')) &&
    emptyState.text.includes('Send this link to the group') &&
    !emptyState.hasAppError &&
    !emptyState.horizontalOverflow
  ), {
    expectsEmpty,
    hasZeroReactions: emptyState.text.includes('0 reactions'),
    hasEmptyGuidance: emptyState.text.includes('Send this link to the group'),
    hasAppError: emptyState.hasAppError,
    horizontalOverflow: emptyState.horizontalOverflow,
    clientWidth: emptyState.clientWidth,
    scrollWidth: emptyState.scrollWidth,
  })

  await phonePage.getByLabel('Your name').fill('QA Invalid Email')
  await phonePage.getByLabel('Email optional').fill('not-an-email')
  await phonePage.getByLabel('Trip feedback').fill('This has enough characters to be blocked only by email.')
  const invalidEmailState = await pageState(phonePage)
  const invalidSendButton = phonePage.getByRole('button', { name: /Send feedback/i })
  const invalidSendEnabled = await invalidSendButton.isEnabled().catch(() => false)
  record('public share feedback blocks invalid optional email in the rendered form', (
    invalidEmailState.text.includes('Use a valid email address or leave it blank.') &&
    !invalidSendEnabled &&
    !invalidEmailState.hasAppError &&
    !invalidEmailState.horizontalOverflow
  ), {
    hasInvalidEmailCopy: invalidEmailState.text.includes('Use a valid email address or leave it blank.'),
    sendEnabled: invalidSendEnabled,
    hasAppError: invalidEmailState.hasAppError,
    horizontalOverflow: invalidEmailState.horizontalOverflow,
  })

  for (const variant of feedbackVariants) {
    await submitVariant(phonePage, variant)
  }
  await phoneContext.close().catch(() => {})

  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  const desktopPage = await desktopContext.newPage()
  await gotoPublicShare(desktopPage)
  await desktopPage.waitForFunction((author) => {
    const text = document.body?.innerText || ''
    return text.includes(author) && text.includes('3 reactions')
  }, duplicateAuthor, { timeout: 12000 }).catch(() => {})
  const desktopState = await pageState(desktopPage)

  record('public share feedback shows multiple sentiments and duplicate-name reactions after reload', (
    desktopState.text.includes('3 reactions') &&
    desktopState.text.includes('Love') &&
    desktopState.text.includes('Curious') &&
    desktopState.text.includes('Notes') &&
    desktopState.text.includes(feedbackVariants[0].author) &&
    desktopState.text.includes(duplicateAuthor) &&
    desktopState.text.includes(feedbackVariants[2].comment) &&
    !desktopState.hasAppError &&
    !desktopState.horizontalOverflow
  ), {
    hasThreeReactions: desktopState.text.includes('3 reactions'),
    hasLoveTone: desktopState.text.includes('Love'),
    hasCuriousTone: desktopState.text.includes('Curious'),
    hasPracticalTone: desktopState.text.includes('Notes'),
    hasUniqueAuthor: desktopState.text.includes(feedbackVariants[0].author),
    hasDuplicateAuthor: desktopState.text.includes(duplicateAuthor),
    hasLongComment: desktopState.text.includes(feedbackVariants[2].comment),
    hasAppError: desktopState.hasAppError,
    horizontalOverflow: desktopState.horizontalOverflow,
    clientWidth: desktopState.clientWidth,
    scrollWidth: desktopState.scrollWidth,
  })
  await desktopContext.close().catch(() => {})
}

try {
  await createFixtureIfNeeded()
  if (failures.length === 0) await runBrowserChecks()
} catch (error) {
  record('share feedback states UI smoke completed without unexpected exception', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  await browser?.close().catch(() => {})
  await cleanupFeedback()
  await cleanupFixture()
}

const summary = {
  baseUrl,
  fixture,
  feedbackIds: insertedFeedbackIds,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}

process.exit(failures.length > 0 ? 1 : 0)
