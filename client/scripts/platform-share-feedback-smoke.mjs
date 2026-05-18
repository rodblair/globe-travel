import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG
const ownerTripId = process.env.QA_TRIP_ID
const verifyTripFeedback = process.env.QA_VERIFY_TRIP_FEEDBACK === '1' || Boolean(ownerTripId)
const cleanupFeedbackId = process.env.QA_CLEANUP_FEEDBACK_ID
const runId = process.env.QA_RUN_ID || randomUUID().slice(0, 8)
const keepFeedback = process.env.QA_KEEP_FEEDBACK === '1'
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

async function fetchJson(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'user-agent': 'globe-travel-share-feedback-smoke/1.0',
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

await loadDotEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required so qa:share-feedback can clean up inserted feedback.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

if (cleanupFeedbackId) {
  const { error } = await supabase
    .from('trip_feedback')
    .delete()
    .eq('id', cleanupFeedbackId)

  console.log(JSON.stringify({
    mode: 'cleanup',
    feedbackId: cleanupFeedbackId,
    ok: !error,
    error: error?.message || null,
  }, null, 2))
  process.exit(error ? 1 : 0)
}

if (!shareSlug) {
  console.error('QA_SHARE_SLUG is required for qa:share-feedback.')
  process.exit(1)
}

const results = []
const feedbackPath = `/api/trips/share/${shareSlug}/feedback`
const feedbackComment = `QA feedback ${runId}: Day 2 looks strong, but please leave a slower cafe break before dinner.`
let insertedFeedbackId = null
let resolvedTripId = ownerTripId || null

try {
  const before = await fetchJson(feedbackPath, { cache: 'no-store' })
  const beforeFeedback = Array.isArray(before.json) ? before.json : []
  results.push(record('public feedback API is readable before submission', before.response.ok && Array.isArray(before.json), {
    status: before.response.status,
    feedbackCount: beforeFeedback.length,
  }))

  const invalid = await fetchJson(feedbackPath, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      author_name: 'Q',
      author_email: 'not-an-email',
      sentiment: 'love_it',
      comment: 'short',
    }),
  })
  results.push(record('public feedback rejects invalid payloads safely', invalid.response.status === 400 && invalid.json?.error === 'Invalid feedback', {
    status: invalid.response.status,
    error: invalid.json?.error,
  }))

  const valid = await fetchJson(feedbackPath, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      author_name: `QA Friend ${runId}`,
      author_email: '',
      sentiment: 'practical',
      comment: feedbackComment,
    }),
  })
  insertedFeedbackId = valid.json?.id || null
  results.push(record('public feedback accepts valid friend reaction', valid.response.status === 201 && typeof insertedFeedbackId === 'string', {
    status: valid.response.status,
    feedbackId: insertedFeedbackId,
    authorName: valid.json?.author_name,
    sentiment: valid.json?.sentiment,
  }))

  const after = await fetchJson(feedbackPath, { cache: 'no-store' })
  const afterFeedback = Array.isArray(after.json) ? after.json : []
  const insertedRow = afterFeedback.find((entry) => entry.id === insertedFeedbackId)
  results.push(record('submitted friend feedback appears in public readback', after.response.ok && Boolean(insertedRow) && insertedRow.comment === feedbackComment, {
    status: after.response.status,
    feedbackCount: afterFeedback.length,
    feedbackId: insertedFeedbackId,
    readbackComment: insertedRow?.comment,
  }))

  if (verifyTripFeedback) {
    if (!resolvedTripId) {
      const share = await fetchJson(`/api/trips/share/${shareSlug}`, { cache: 'no-store' })
      resolvedTripId = share.json?.trip?.id || null
      results.push(record('public share resolves to a Trip Studio trip id', share.response.ok && typeof resolvedTripId === 'string', {
        status: share.response.status,
        tripId: resolvedTripId,
      }))
    }

    if (resolvedTripId) {
      const ownerFeedback = await fetchJson(`/api/trips/${resolvedTripId}/feedback`, { cache: 'no-store' })
      const ownerRows = Array.isArray(ownerFeedback.json) ? ownerFeedback.json : []
      const ownerRow = ownerRows.find((entry) => entry.id === insertedFeedbackId)
      results.push(record('Trip Studio feedback feed includes submitted friend reaction', ownerFeedback.response.ok && Boolean(ownerRow) && ownerRow.comment === feedbackComment, {
        status: ownerFeedback.response.status,
        tripId: resolvedTripId,
        feedbackCount: ownerRows.length,
        feedbackId: insertedFeedbackId,
        readbackComment: ownerRow?.comment,
      }))
    }
  }
} finally {
  if (insertedFeedbackId && keepFeedback) {
    results.push(record('public feedback smoke kept inserted reaction for Browser inspection', true, {
      feedbackId: insertedFeedbackId,
      cleanupCommand: `QA_CLEANUP_FEEDBACK_ID=${insertedFeedbackId} npm run qa:share-feedback`,
    }))
  } else if (insertedFeedbackId) {
    const { error } = await supabase
      .from('trip_feedback')
      .delete()
      .eq('id', insertedFeedbackId)

    results.push(record('public feedback smoke cleans up inserted reaction', !error, {
      feedbackId: insertedFeedbackId,
      error: error?.message || null,
    }))
  }
}

const summary = {
  baseUrl,
  shareSlug,
  tripId: resolvedTripId,
  runId,
  keepFeedback,
  verifyTripFeedback,
  insertedFeedbackId,
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
