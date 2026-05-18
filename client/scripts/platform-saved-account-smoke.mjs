import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const isLocalBaseUrl = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(baseUrl)
const allowRemoteMutation = process.env.QA_ALLOW_REMOTE_MUTATION === '1'
const guestId = process.env.QA_GUEST_ID || randomUUID()
const cookie = `globe_travel_guest=${guestId}`
const runId = randomUUID().slice(0, 8)
const failures = []
const results = []
let browser = null
let supabase = null
let createdTripId = null
let createdJournalId = null
const cleanup = {
  attempted: false,
  tripDeleted: false,
  journalDeleted: false,
  profileDeleted: false,
  userDeleted: false,
  error: null,
}

if (!isLocalBaseUrl && !allowRemoteMutation) {
  console.error('qa:saved-account mutates disposable guest saved/account data and only runs against localhost unless QA_ALLOW_REMOTE_MUTATION=1 is set.')
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

function record(name, ok, details = {}) {
  const result = { name, ok: Boolean(ok), ...details }
  results.push(result)
  if (!result.ok) failures.push(result)
  return result
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'user-agent': 'globe-travel-saved-account-smoke/1.0',
      cookie,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  })
  const text = await response.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    // handled by callers
  }
  return { response, text, json }
}

async function cleanupFixture() {
  cleanup.attempted = true
  const errors = []

  if (!supabase) {
    cleanup.error = 'Supabase cleanup client was not initialized'
    return
  }

  if (createdJournalId) {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', createdJournalId)
    cleanup.journalDeleted = !error
    if (error) errors.push(error.message)
  }

  if (createdTripId) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', createdTripId)
    cleanup.tripDeleted = !error
    if (error) errors.push(error.message)
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', guestId)
  cleanup.profileDeleted = !profileError
  if (profileError) errors.push(profileError.message)

  const { error: userError } = await supabase.auth.admin.deleteUser(guestId)
  cleanup.userDeleted = !userError
  if (userError && !/User not found/i.test(userError.message)) errors.push(userError.message)

  cleanup.error = errors.length ? errors.join('; ') : null
}

function stateOk(state, markers = []) {
  return (
    markers.every((marker) => state.text.toLowerCase().includes(marker.toLowerCase())) &&
    !state.hasAppError &&
    !state.horizontalOverflow
  )
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function readPageState(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  return page.evaluate(() => {
    const text = document.body?.innerText || ''
    return {
      url: location.href,
      title: document.title,
      text,
      hasAppError: ['Application error', 'Unhandled Runtime Error', 'Hydration failed'].some((pattern) => text.includes(pattern)),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
}

await loadDotEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for qa:saved-account.')
  process.exit(1)
}

supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

try {
  const tripTitle = `QA Saved Account ${runId} 3 Days in Athens`
  const tripCreate = await fetchJson('/api/trips', {
    method: 'POST',
    body: JSON.stringify({
      title: tripTitle,
      travelers_count: 2,
      pace: 'balanced',
      budget_level: 'mid',
      constraints: { days: 3, qa: true, runId },
    }),
  })
  createdTripId = tripCreate.json?.tripId || null
  record('saved/account smoke creates disposable saved trip', tripCreate.response.ok && Boolean(createdTripId), {
    status: tripCreate.response.status,
    tripId: createdTripId,
  })

  const tripsReadback = await fetchJson('/api/trips', { cache: 'no-store' })
  const trips = Array.isArray(tripsReadback.json) ? tripsReadback.json : []
  record('saved trips API returns disposable trip for guest', tripsReadback.response.ok && trips.some((trip) => trip.id === createdTripId), {
    status: tripsReadback.response.status,
    tripCount: trips.length,
  })

  const journalTitle = `QA Journal ${runId}`
  const journalCreate = await fetchJson('/api/journal', {
    method: 'POST',
    body: JSON.stringify({
      title: journalTitle,
      content: `Remember to confirm the rooftop dinner for QA run ${runId}.`,
      mood: '🧭',
      location: 'Athens',
      visited_date: '2026-09-15',
      trip_id: createdTripId,
    }),
  })
  createdJournalId = journalCreate.json?.id || null
  record('saved/account smoke creates guest trip note', journalCreate.response.status === 201 && Boolean(createdJournalId), {
    status: journalCreate.response.status,
    journalId: createdJournalId,
  })

  const journalPatch = await fetchJson('/api/journal', {
    method: 'PATCH',
    body: JSON.stringify({
      id: createdJournalId,
      title: `${journalTitle} updated`,
      content: `Updated QA note for ${runId}.`,
      mood: '🧭',
      location: 'Athens',
      visited_date: '2026-09-16',
      trip_id: createdTripId,
    }),
  })
  record('saved/account smoke edits guest trip note', journalPatch.response.ok && journalPatch.json?.title === `${journalTitle} updated`, {
    status: journalPatch.response.status,
    title: journalPatch.json?.title,
  })

  const journalReadback = await fetchJson('/api/journal', { cache: 'no-store' })
  const entries = Array.isArray(journalReadback.json) ? journalReadback.json : []
  record('journal API returns edited note tied to saved trip', journalReadback.response.ok && entries.some((entry) => (
    entry.id === createdJournalId &&
    entry.trip_id === createdTripId &&
    entry.title === `${journalTitle} updated`
  )), {
    status: journalReadback.response.status,
    entryCount: entries.length,
  })

  const invalidProfilePatch = await fetchJson('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      username: 'bad username!',
      bio: 'x'.repeat(260),
    }),
  })
  record('account profile API rejects invalid sharing identity updates', (
    invalidProfilePatch.response.status === 400 &&
    typeof invalidProfilePatch.json?.error === 'string' &&
    invalidProfilePatch.json.error.includes('username')
  ), {
    status: invalidProfilePatch.response.status,
    error: invalidProfilePatch.json?.error || invalidProfilePatch.text.slice(0, 120),
  })

  const profilePatch = await fetchJson('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      display_name: `QA Traveler ${runId}`,
      username: `qa_${runId}`,
      bio: `Returning-user smoke profile for ${runId}.`,
    }),
  })
  record('account profile API saves guest profile updates', profilePatch.response.ok && profilePatch.json?.display_name === `QA Traveler ${runId}`, {
    status: profilePatch.response.status,
    displayName: profilePatch.json?.display_name,
  })

  browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
  })
  const parsedBaseUrl = new URL(baseUrl)
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  })
  await context.addCookies([{
    name: 'globe_travel_guest',
    value: guestId,
    domain: parsedBaseUrl.hostname,
    path: '/',
    httpOnly: false,
    secure: baseUrl.startsWith('https://'),
    sameSite: 'Lax',
    expires: Math.floor(Date.now() / 1000) + 60 * 60,
  }])
  const page = await context.newPage()

  await page.goto(`${baseUrl}/saved`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.getByText(tripTitle, { exact: false }).waitFor({ state: 'visible', timeout: 12000 }).catch(() => {})
  const savedState = await readPageState(page)
  record('saved trips page shows disposable trip without overflow', stateOk(savedState, ['Trips', tripTitle, 'Your itineraries']), {
    url: savedState.url,
    hasTripTitle: savedState.text.includes(tripTitle),
    horizontalOverflow: savedState.horizontalOverflow,
    hasAppError: savedState.hasAppError,
  })

  await page.goto(`${baseUrl}/saved?tab=journal`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.getByText(`${journalTitle} updated`, { exact: false }).waitFor({ state: 'visible', timeout: 12000 }).catch(() => {})
  const journalState = await readPageState(page)
  record('saved journal page shows edited trip note without overflow', stateOk(journalState, ['Trip notes', `${journalTitle} updated`, tripTitle]), {
    url: journalState.url,
    hasJournalTitle: journalState.text.includes(`${journalTitle} updated`),
    hasTripTitle: journalState.text.includes(tripTitle),
    horizontalOverflow: journalState.horizontalOverflow,
    hasAppError: journalState.hasAppError,
  })

  await page.getByRole('button', { name: /Add note/i }).click({ timeout: 8000 })
  const editorDialog = page.getByRole('dialog', { name: /New trip note/i })
  await editorDialog.waitFor({ state: 'visible', timeout: 8000 })
  const editorDialogState = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    return {
      activeInsideDialog: Boolean(dialog && document.activeElement && dialog.contains(document.activeElement)),
      ariaModal: dialog?.getAttribute('aria-modal'),
    }
  })
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab')
  }
  const editorFocusStayedInDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement))
  })
  await page.keyboard.press('Escape')
  await editorDialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
  const editorVisibleAfterEscape = await editorDialog.isVisible().catch(() => false)
  record('journal editor dialog has keyboard focus management', (
    editorDialogState.activeInsideDialog &&
    editorDialogState.ariaModal === 'true' &&
    editorFocusStayedInDialog &&
    !editorVisibleAfterEscape
  ), {
    ...editorDialogState,
    focusStayedInDialog: editorFocusStayedInDialog,
    visibleAfterEscape: editorVisibleAfterEscape,
  })

  const journalCardButton = page.getByRole('button', { name: new RegExp(`^Open ${escapeRegExp(`${journalTitle} updated`)}$`, 'i') })
  await journalCardButton.click({ timeout: 8000 })
  const readerDialog = page.getByRole('dialog', { name: new RegExp(escapeRegExp(`${journalTitle} updated`), 'i') })
  await readerDialog.waitFor({ state: 'visible', timeout: 8000 })
  const readerDialogState = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    return {
      activeInsideDialog: Boolean(dialog && document.activeElement && dialog.contains(document.activeElement)),
      ariaModal: dialog?.getAttribute('aria-modal'),
    }
  })
  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press('Tab')
  }
  const readerFocusStayedInDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]')
    return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement))
  })
  await page.getByRole('button', { name: 'Delete note' }).click({ timeout: 8000 })
  const deleteDialog = page.getByRole('alertdialog', { name: /Delete note/i })
  await deleteDialog.waitFor({ state: 'visible', timeout: 8000 })
  const deleteDialogState = await page.evaluate(() => {
    const dialog = document.querySelector('[role="alertdialog"]')
    return {
      activeInsideDialog: Boolean(dialog && document.activeElement && dialog.contains(document.activeElement)),
      ariaModal: dialog?.getAttribute('aria-modal'),
    }
  })
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  const deleteFocusStayedInDialog = await page.evaluate(() => {
    const dialog = document.querySelector('[role="alertdialog"]')
    return Boolean(dialog && document.activeElement && dialog.contains(document.activeElement))
  })
  await page.keyboard.press('Escape')
  await deleteDialog.waitFor({ state: 'hidden', timeout: 2000 }).catch(() => {})
  const deleteVisibleAfterEscape = await deleteDialog.isVisible().catch(() => false)
  record('journal reader and delete dialogs have keyboard focus management', (
    readerDialogState.activeInsideDialog &&
    readerDialogState.ariaModal === 'true' &&
    readerFocusStayedInDialog &&
    deleteDialogState.activeInsideDialog &&
    deleteDialogState.ariaModal === 'true' &&
    deleteFocusStayedInDialog &&
    !deleteVisibleAfterEscape
  ), {
    reader: {
      ...readerDialogState,
      focusStayedInDialog: readerFocusStayedInDialog,
    },
    deleteDialog: {
      ...deleteDialogState,
      focusStayedInDialog: deleteFocusStayedInDialog,
      visibleAfterEscape: deleteVisibleAfterEscape,
    },
  })

  await page.goto(`${baseUrl}/account`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.getByText('Account', { exact: false }).waitFor({ state: 'visible', timeout: 12000 }).catch(() => {})
  const accountState = await readPageState(page)
  record('account profile page renders for returning guest without overflow', stateOk(accountState, ['Account', 'Sharing profile', 'Save changes']), {
    url: accountState.url,
    horizontalOverflow: accountState.horizontalOverflow,
    hasAppError: accountState.hasAppError,
  })

  await page.goto(`${baseUrl}/saved`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.getByText(tripTitle, { exact: false }).waitFor({ state: 'visible', timeout: 12000 }).catch(() => {})
  const tripLink = page.locator(`a[href="/trips/${createdTripId}"]`)
  const linkCount = await tripLink.count()
  record('saved trip card exposes reopen link to Trip Studio', linkCount >= 1, {
    linkCount,
    href: `/trips/${createdTripId}`,
  })

  await context.close().catch(() => {})
} finally {
  await Promise.race([
    browser?.close() || Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ])
  await cleanupFixture()
}

const summary = {
  baseUrl,
  guestId,
  runId,
  tripId: createdTripId,
  journalId: createdJournalId,
  checked: results.length,
  passed: results.filter((result) => result.ok).length,
  failed: failures.length,
  cleanup,
  results,
  failures,
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0 || cleanup.error) {
  process.exitCode = 1
}
