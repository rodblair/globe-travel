import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const baseUrl = (process.env.QA_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const prompt = process.env.QA_PLANNER_PROMPT || 'Plan a 5 day Athens trip for 4 friends with history food relaxed pacing and one memorable night out'
const runId = process.env.QA_RUN_ID || randomUUID().slice(0, 8)
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
