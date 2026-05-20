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
const allowRemoteMutation = process.env.QA_ALLOW_REMOTE_FEEDBACK_MUTATION === '1'
const keepFeedback = process.env.QA_KEEP_FEEDBACK === '1'
const runId = process.env.QA_RUN_ID || randomUUID().slice(0, 8)
const authorName = `QA Friend ${runId}`
const feedbackComment = `QA browser feedback ${runId}: Day 2 looks strong, but please add one slower cafe break before dinner.`
const failures = []
const results = []
let browser = null
let insertedFeedbackId = null
let cleanup = {
  attempted: false,
  feedbackId: null,
  deleted: false,
  error: null,
}

if (!isLocalBaseUrl && !allowRemoteMutation) {
  console.error('qa:share-recipient-ui mutates feedback and only runs against localhost unless QA_ALLOW_REMOTE_FEEDBACK_MUTATION=1 is set.')
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

async function fetchJson(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'user-agent': 'globe-travel-share-recipient-ui-smoke/1.0',
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

async function cleanupFeedback() {
  if (!insertedFeedbackId) return

  if (keepFeedback) {
    cleanup = {
      attempted: false,
      feedbackId: insertedFeedbackId,
      deleted: false,
      error: 'kept for caller',
    }
    record('recipient UI feedback kept inserted reaction for caller cleanup', true, {
      feedbackId: insertedFeedbackId,
      cleanupCommand: `QA_CLEANUP_FEEDBACK_ID=${insertedFeedbackId} npm run qa:share-feedback`,
    })
    return
  }

  try {
    const supabase = await getSupabase()
    const { error } = await supabase
      .from('trip_feedback')
      .delete()
      .eq('id', insertedFeedbackId)

    cleanup = {
      attempted: true,
      feedbackId: insertedFeedbackId,
      deleted: !error,
      error: error?.message || null,
    }

    record('recipient UI feedback cleanup deleted inserted reaction', !error, cleanup)
  } catch (error) {
    cleanup = {
      attempted: true,
      feedbackId: insertedFeedbackId,
      deleted: false,
      error: error instanceof Error ? error.message : String(error),
    }
    record('recipient UI feedback cleanup deleted inserted reaction', false, cleanup)
  }
}

async function pageState(page) {
  await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3500 }).catch(() => {})
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

async function gotoPublicShare(page) {
  await page.goto(`${baseUrl}/t/${shareSlug}`, {
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

try {
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

  await phonePage.getByLabel('Your name').fill(authorName)
  await phonePage.getByLabel('Email optional').fill('')
  await phonePage.getByRole('button', { name: /Practical note/i }).click()
  await phonePage.getByLabel('Trip feedback').fill(feedbackComment)

  const readyState = await pageState(phonePage)
  const sendButton = phonePage.getByRole('button', { name: /Send feedback/i })
  record('recipient feedback form becomes ready on phone', (
    readyState.text.includes('Ready to send') &&
    await sendButton.isEnabled() &&
    !readyState.hasAppError &&
    !readyState.horizontalOverflow
  ), {
    hasReadyCopy: readyState.text.includes('Ready to send'),
    sendEnabled: await sendButton.isEnabled(),
    hasAppError: readyState.hasAppError,
    horizontalOverflow: readyState.horizontalOverflow,
    clientWidth: readyState.clientWidth,
    scrollWidth: readyState.scrollWidth,
  })

  await sendButton.click({ timeout: 8000 })
  await phonePage.waitForFunction((comment) => {
    const text = document.body?.innerText || ''
    return text.includes('Feedback sent') || text.includes(comment)
  }, feedbackComment, { timeout: 10000 }).catch(() => {})

  const afterSubmitState = await pageState(phonePage)
  const commentValueAfterSubmit = await phonePage.getByLabel('Trip feedback').inputValue()
  record('recipient feedback submits successfully on phone', (
    afterSubmitState.text.includes('Feedback sent') &&
    commentValueAfterSubmit === '' &&
    !afterSubmitState.hasAppError &&
    !afterSubmitState.horizontalOverflow
  ), {
    hasFeedbackSent: afterSubmitState.text.includes('Feedback sent'),
    commentCleared: commentValueAfterSubmit === '',
    hasAppError: afterSubmitState.hasAppError,
    horizontalOverflow: afterSubmitState.horizontalOverflow,
  })

  const feedbackRead = await fetchJson(`/api/trips/share/${shareSlug}/feedback`, { cache: 'no-store' })
  const feedbackRows = Array.isArray(feedbackRead.json) ? feedbackRead.json : []
  const insertedRow = feedbackRows.find((entry) => (
    entry.author_name === authorName &&
    entry.comment === feedbackComment
  ))
  insertedFeedbackId = insertedRow?.id || null
  record('recipient feedback API readback includes browser-submitted reaction', (
    feedbackRead.response.ok &&
    Boolean(insertedFeedbackId) &&
    insertedRow?.sentiment === 'practical'
  ), {
    status: feedbackRead.response.status,
    feedbackId: insertedFeedbackId,
    feedbackCount: feedbackRows.length,
    sentiment: insertedRow?.sentiment || null,
  })

  await phoneContext.close().catch(() => {})

  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
  })
  const desktopPage = await desktopContext.newPage()
  await gotoPublicShare(desktopPage)
  await desktopPage.waitForFunction((comment) => {
    const text = document.body?.innerText || ''
    return text.includes(comment)
  }, feedbackComment, { timeout: 10000 }).catch(() => {})
  const desktopState = await pageState(desktopPage)
  record('recipient feedback remains visible after desktop reload', (
    desktopState.text.includes(authorName) &&
    desktopState.text.includes(feedbackComment) &&
    !desktopState.hasAppError &&
    !desktopState.horizontalOverflow
  ), {
    hasAuthor: desktopState.text.includes(authorName),
    hasComment: desktopState.text.includes(feedbackComment),
    hasAppError: desktopState.hasAppError,
    horizontalOverflow: desktopState.horizontalOverflow,
    clientWidth: desktopState.clientWidth,
    scrollWidth: desktopState.scrollWidth,
  })
  await desktopContext.close().catch(() => {})
} catch (error) {
  record('recipient feedback UI smoke completed without unexpected exception', false, {
    error: error instanceof Error ? error.message : String(error),
  })
} finally {
  await cleanupFeedback()
  await Promise.race([
    browser?.close() || Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ])
}

const summary = {
  baseUrl,
  shareSlug,
  runId,
  keepFeedback,
  insertedFeedbackId,
  cleanup,
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
