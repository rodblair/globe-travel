import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { createClient } from '@supabase/supabase-js'

const GUEST_SESSION_COOKIE = 'globe_travel_guest'
const root = resolve(process.cwd(), '..')
const nextWaveOpsPath = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS || 'qa/beta-human-review-next-wave-ops-2026-05-21.json'
const packetManifestPath = process.env.QA_BETA_REVIEW_PACKET_MANIFEST || 'qa/beta-human-review-packet-manifest-2026-05-21.json'
const rehearsalScope = process.env.QA_BETA_REVIEW_WAVE_REHEARSAL_SCOPE || 'wave'
const requestedDate = process.env.QA_BETA_REVIEW_WAVE_REHEARSAL_DATE || new Date().toISOString().slice(0, 10)
const defaultArtifactPrefix = rehearsalScope === 'matrix'
  ? 'beta-human-review-matrix-rehearsal'
  : 'beta-human-review-wave-rehearsal'
const artifactName = process.env.QA_BETA_REVIEW_WAVE_REHEARSAL_ARTIFACT_NAME || `${defaultArtifactPrefix}-${requestedDate}`
const jsonArtifact = process.env.QA_BETA_REVIEW_WAVE_REHEARSAL_JSON || `${artifactName}.json`
const reportArtifact = process.env.QA_BETA_REVIEW_WAVE_REHEARSAL_REPORT || `${artifactName}.md`
const artifactDir = resolve(root, 'qa', artifactName)
const screenshotDir = resolve(artifactDir, 'screenshots')
const chromePath = process.env.QA_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const baseUrl = (process.env.QA_BASE_URL || '').replace(/\/$/, '')
const allowRemoteGuestStart = process.env.QA_BETA_REVIEW_WAVE_REHEARSAL_ALLOW_REMOTE_GUEST_START === '1'
const guestStartExerciseLimit = Number(process.env.QA_BETA_REVIEW_WAVE_REHEARSAL_GUEST_START_LIMIT || '1')
let guestStartExerciseCount = 0

function repoPath(path) {
  return resolve(root, path)
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function slug(value) {
  return String(value || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function viewportFromRow(row) {
  const match = String(row.viewport || '').match(/^(\d+)x(\d+)$/)
  if (!match) return { width: 1280, height: 900 }
  return {
    width: Number(match[1]),
    height: Number(match[2]),
  }
}

function startUrlForRow(row) {
  if (!baseUrl) return row.startUrl
  const source = new URL(row.startUrl)
  const target = new URL(baseUrl)
  source.protocol = target.protocol
  source.host = target.host
  return source.toString()
}

function completedSubmissionPathForPacket(packet) {
  const templatePath = packet.submissionTemplatePath || ''
  return templatePath.endsWith('.template.json')
    ? templatePath.replace(/\.template\.json$/, '.json')
    : templatePath
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(qaDisplayPath(path)), 'utf8'))
}

async function readTextOrEmpty(path) {
  try {
    return await readFile(repoPath(qaDisplayPath(path)), 'utf8')
  } catch {
    return ''
  }
}

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

async function cleanupGuestAccount(guestId) {
  if (!guestId) {
    return {
      attempted: false,
      guestId: null,
      profileDeleted: false,
      userDeleted: false,
      error: null,
      reason: 'no guest id observed',
    }
  }

  await loadDotEnv()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    return {
      attempted: false,
      guestId,
      profileDeleted: false,
      userDeleted: false,
      error: null,
      reason: 'missing Supabase service role cleanup credentials',
    }
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
  const { error: tripError } = await supabase.from('trips').delete().eq('user_id', guestId)
  const { error: profileError } = await supabase.from('profiles').delete().eq('id', guestId)
  const { error: userError } = await supabase.auth.admin.deleteUser(guestId)
  const userAlreadyAbsent = userError?.message?.toLowerCase().includes('user not found')

  return {
    attempted: true,
    guestId,
    tripsDeleted: !tripError,
    profileDeleted: !profileError,
    userDeleted: !userError || Boolean(userAlreadyAbsent),
    error: tripError?.message || profileError?.message || (userError && !userAlreadyAbsent ? userError.message : null),
    reason: null,
  }
}

function expectedPrompt(row) {
  const url = new URL(row.startUrl)
  return url.searchParams.get('q') || ''
}

function sameAuthNext(actual, expected) {
  if (!actual || !expected) return false
  try {
    const actualUrl = new URL(actual, 'https://globe.travel')
    const expectedUrl = new URL(expected, 'https://globe.travel')
    const actualParams = Array.from(actualUrl.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b))
    const expectedParams = Array.from(expectedUrl.searchParams.entries()).sort(([a], [b]) => a.localeCompare(b))
    return actualUrl.pathname === expectedUrl.pathname &&
      JSON.stringify(actualParams) === JSON.stringify(expectedParams)
  } catch {
    return actual === expected
  }
}

async function inspectPacket(row) {
  const packetText = await readTextOrEmpty(row.packetPath)
  const template = await readJson(row.submissionTemplatePath).catch(() => null)
  const prompt = expectedPrompt(row)
  const packetIssues = []

  if (!packetText) packetIssues.push(`packet missing or unreadable: ${row.packetPath}`)
  if (!template) packetIssues.push(`submission template missing or unreadable: ${row.submissionTemplatePath}`)
  if (packetText && !packetText.includes(row.id)) packetIssues.push('packet does not include review id')
  if (packetText && !packetText.includes(row.startUrl)) packetIssues.push('packet does not include start URL')
  if (packetText && !packetText.includes(prompt)) packetIssues.push('packet does not include decoded prompt')
  if (template && template.id !== row.id) packetIssues.push(`template id ${template.id || 'missing'} does not match ${row.id}`)
  if (template && template.prompt !== prompt) packetIssues.push('template prompt does not match start URL prompt')
  if (template && template.routeOrShareUrl !== row.startUrl) packetIssues.push('template routeOrShareUrl does not match start URL')
  if (template && template.viewport !== row.viewport) packetIssues.push('template viewport does not match operator row')
  if (template && template.device !== row.device) packetIssues.push('template device does not match operator row')

  const missingSurfaces = (Array.isArray(row.surfaces) ? row.surfaces : [])
    .filter((surface) => packetText && !packetText.includes(`${surface}:`))
  if (missingSurfaces.length > 0) packetIssues.push(`packet missing checklist surfaces: ${missingSurfaces.join(', ')}`)

  return {
    packetReadable: Boolean(packetText),
    templateReadable: Boolean(template),
    prompt,
    missingSurfaces,
    issues: packetIssues,
  }
}

async function inspectStartPage(page, row, startUrl) {
  const response = await page.goto(startUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForLoadState('networkidle', { timeout: 2500 }).catch(() => {})
  await page.waitForTimeout(600)

  const state = await page.evaluate(({ expectedPromptValue, allowGuestStart }) => {
    const text = document.body?.innerText || ''
    const links = Array.from(document.querySelectorAll('a[href]')).map((link) => ({
      text: (link.textContent || '').trim().replace(/\s+/g, ' '),
      href: link.href,
      pathname: new URL(link.href).pathname,
      next: new URL(link.href).searchParams.get('next'),
      q: new URL(link.href).searchParams.get('q'),
    }))
    const guestLink = links.find((link) => link.text.includes('Continue as guest'))
    const signupLink = links.find((link) => link.pathname === '/signup')
    const loginActionPresent = text.includes('Welcome back') && text.includes('Continue as guest')
    const plannerPresent = text.includes('Planner') && text.includes('Trip Studio')
    const promptVisible = text.includes(expectedPromptValue) || text.includes('Plan')
    const hasAppError = /Application error|Unhandled Runtime Error|Hydration failed|Something went wrong/i.test(text)
    const horizontalOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1

    return {
      url: location.href,
      pathname: location.pathname,
      search: location.search,
      title: document.title,
      textLength: text.trim().length,
      loginActionPresent,
      plannerPresent,
      promptVisible,
      guestHref: guestLink?.href || null,
      guestNext: guestLink?.next || null,
      signupHref: signupLink?.href || null,
      signupNext: signupLink?.next || null,
      hasAppError,
      horizontalOverflow,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      allowGuestStart,
    }
  }, {
    expectedPromptValue: expectedPrompt(row),
    allowGuestStart: allowRemoteGuestStart,
  })

  const expectedNext = `/chat?q=${new URL(row.startUrl).searchParams.get('q') || ''}`
  const issues = []

  if (!response || response.status() >= 500) issues.push(`HTTP ${response?.status() || 'missing'}`)
  if (state.hasAppError) issues.push('application error text detected')
  if (state.horizontalOverflow) issues.push('horizontal overflow detected')
  if (state.textLength < 100) issues.push('page rendered too little user-facing content')

  if (state.pathname === '/login') {
    if (!state.loginActionPresent) issues.push('login page does not expose guest access')
    if (!sameAuthNext(state.guestNext, expectedNext)) issues.push(`guest next does not preserve prompt: ${state.guestNext || 'missing'}`)
    if (!sameAuthNext(state.signupNext, expectedNext)) issues.push(`signup next does not preserve prompt: ${state.signupNext || 'missing'}`)
  } else if (state.pathname === '/chat') {
    if (!state.plannerPresent) issues.push('planner markers missing after direct chat access')
  } else {
    issues.push(`unexpected start-page path ${state.pathname}`)
  }

  const screenshot = `qa/${artifactName}/screenshots/${slug(row.id)}-${slug(row.destination)}.png`
  await page.screenshot({ path: repoPath(screenshot), fullPage: false }).catch(() => {})

  const guestStart = await exerciseGuestStart(page, row, state).catch((error) => ({
    exercised: false,
    skipped: false,
    guestId: null,
    finalUrl: null,
    cleanup: {
      attempted: false,
      guestId: null,
      profileDeleted: false,
      userDeleted: false,
      error: null,
      reason: 'guest-start exercise failed before cleanup',
    },
    state: null,
    issues: [error instanceof Error ? error.message : String(error)],
  }))
  issues.push(...guestStart.issues)

  return {
    status: response?.status() || 0,
    screenshot,
    state,
    guestStart,
    issues,
  }
}

async function exerciseGuestStart(page, row, startState) {
  if (!allowRemoteGuestStart) {
    return {
      exercised: false,
      skipped: true,
      guestId: null,
      finalUrl: null,
      cleanup: {
        attempted: false,
        guestId: null,
        profileDeleted: false,
        userDeleted: false,
        error: null,
        reason: 'remote guest-start exercise disabled by default',
      },
      state: null,
      issues: [],
    }
  }

  if (guestStartExerciseCount >= guestStartExerciseLimit) {
    return {
      exercised: false,
      skipped: true,
      guestId: null,
      finalUrl: null,
      cleanup: {
        attempted: false,
        guestId: null,
        profileDeleted: false,
        userDeleted: false,
        error: null,
        reason: `guest-start exercise limit reached (${guestStartExerciseLimit})`,
      },
      state: null,
      issues: [],
    }
  }

  if (!startState?.guestHref) {
    return {
      exercised: false,
      skipped: false,
      guestId: null,
      finalUrl: null,
      cleanup: {
        attempted: false,
        guestId: null,
        profileDeleted: false,
        userDeleted: false,
        error: null,
        reason: 'guest-start link missing',
      },
      state: null,
      issues: ['guest-start exercise requested but no guest link was found'],
    }
  }

  guestStartExerciseCount += 1
  const guestUrl = new URL(startState.guestHref)
  if (guestUrl.hostname === 'localhost' || guestUrl.hostname === '127.0.0.1') {
    guestUrl.searchParams.set('id', randomUUID())
  }

  const response = await page.goto(guestUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForFunction(() => location.pathname === '/chat' || location.pathname.startsWith('/trips/'), { timeout: 20000 }).catch(() => {})
  await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {})
  await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(600)

  const state = await page.evaluate(({ expectedPromptValue }) => {
    const text = document.body?.innerText || ''
    const current = new URL(location.href)
    const promptValue = current.searchParams.get('q') || current.searchParams.get('prompt') || ''
    return {
      url: location.href,
      pathname: location.pathname,
      promptValue,
      hasPlanner: text.includes('Planner'),
      hasTripStudio: text.includes('Trip Studio'),
      promptVisible: text.includes(expectedPromptValue) || promptValue.includes(expectedPromptValue.slice(0, 30)),
      hasTripAccessError: /needs the account or guest session|different guest session|trip may have been deleted/i.test(text),
      hasAppError: /Application error|Unhandled Runtime Error|Hydration failed|Something went wrong/i.test(text),
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      textLength: text.trim().length,
    }
  }, { expectedPromptValue: expectedPrompt(row) })

  const cookies = await page.context().cookies(new URL(startState.guestHref).origin)
  const guestCookie = cookies.find((cookie) => cookie.name === GUEST_SESSION_COOKIE)
  const guestId = guestCookie?.value || null

  const cleanup = await cleanupGuestAccount(guestId)
  const issues = []
  const landedOnPlanner = state.pathname === '/chat' && state.hasPlanner
  const landedOnTrip = state.pathname.startsWith('/trips/') && state.promptVisible && !state.hasTripAccessError
  if (!response || response.status() >= 500) issues.push(`guest start HTTP ${response?.status() || 'missing'}`)
  if (!landedOnPlanner && !landedOnTrip) issues.push(`guest start expected Planner or Trip Studio handoff, got ${state.pathname}`)
  if (state.pathname === '/chat' && (!state.hasPlanner || !state.hasTripStudio)) issues.push('guest start did not land on Planner/Trip Studio')
  if (state.pathname.startsWith('/trips/') && state.hasTripAccessError) issues.push('guest start landed on an inaccessible trip')
  if (!guestId) issues.push('guest start did not set guest cookie')
  if (state.hasAppError) issues.push('guest start page showed application error text')
  if (state.horizontalOverflow) issues.push('guest start page had horizontal overflow')
  if (cleanup.attempted !== true) issues.push(`guest cleanup was not attempted: ${cleanup.reason || 'unknown reason'}`)
  if (cleanup.error) issues.push(`guest cleanup failed: ${cleanup.error}`)
  if (cleanup.attempted && (!cleanup.tripsDeleted || !cleanup.profileDeleted || !cleanup.userDeleted)) {
    issues.push('guest cleanup did not confirm trip, profile, and auth user deletion')
  }

  return {
    exercised: true,
    skipped: false,
    guestId,
    finalUrl: state.url,
    cleanup,
    state,
    issues,
  }
}

if (!existsSync(chromePath)) {
  console.error(`Chrome executable not found at ${chromePath}. Set QA_CHROME_PATH to a Chrome-compatible browser.`)
  process.exit(1)
}

const nextWaveOps = await readJson(nextWaveOpsPath)
const packetManifest = await readJson(packetManifestPath)
const rows = rehearsalScope === 'matrix'
  ? (Array.isArray(packetManifest.packets) ? packetManifest.packets : [])
    .map((packet) => ({
      ...packet,
      waveId: null,
      completedSubmissionPath: completedSubmissionPathForPacket(packet),
    }))
  : Array.isArray(nextWaveOps.operatorRows) ? nextWaveOps.operatorRows : []

await mkdir(screenshotDir, { recursive: true })
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--disable-dev-shm-usage', '--disable-gpu', '--disable-extensions', '--disable-background-networking'],
})

const results = []
for (const row of rows) {
  console.error(`[qa:beta-wave-rehearsal] ${row.id} ${row.destination}`)
  const viewport = viewportFromRow(row)
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    isMobile: row.device === 'phone',
  })
  const page = await context.newPage()
  const packet = await inspectPacket(row)
  const startUrl = startUrlForRow(row)
  const start = await inspectStartPage(page, row, startUrl).catch((error) => ({
    status: 0,
    screenshot: null,
    state: null,
    issues: [error instanceof Error ? error.message : String(error)],
  }))
  await context.close().catch(() => {})

  const issues = [
    ...packet.issues,
    ...start.issues,
  ]
  results.push({
    id: row.id,
    waveId: row.waveId,
    destination: row.destination,
    device: row.device,
    viewport: row.viewport,
    startUrl,
    packetPath: row.packetPath,
    submissionTemplatePath: row.submissionTemplatePath,
    completedSubmissionPath: row.completedSubmissionPath,
    surfaces: row.surfaces || [],
    packet,
    start,
    ok: issues.length === 0,
    issues,
  })
}

await browser.close()

const failures = results.filter((result) => !result.ok)
const guestStartResults = results.map((result) => result.start?.guestStart).filter(Boolean)
const exercisedGuestStarts = guestStartResults.filter((result) => result.exercised)
const guestStartCleanupFailures = exercisedGuestStarts.filter((result) => (
  result.cleanup?.attempted !== true ||
  result.cleanup?.error ||
  result.cleanup?.tripsDeleted !== true ||
  result.cleanup?.profileDeleted !== true ||
  result.cleanup?.userDeleted !== true
))
const summary = {
  date: requestedDate,
  scope: rehearsalScope,
  nextWaveOpsArtifact: qaDisplayPath(nextWaveOpsPath),
  packetManifest: qaDisplayPath(packetManifestPath),
  nextWave: nextWaveOps.nextWave || null,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  expectedReviewCount: rehearsalScope === 'matrix'
    ? Number(packetManifest.packetCount || rows.length)
    : Number(nextWaveOps.nextWave?.remainingReviewCount || nextWaveOps.operatorRowCount || rows.length),
  jsonArtifact: `qa/${jsonArtifact}`,
  reportArtifact: `qa/${reportArtifact}`,
  artifactDir: `qa/${artifactName}`,
  baseUrl: baseUrl || new URL(rows[0]?.startUrl || 'https://globe-travel-two.vercel.app').origin,
  nonMutating: !allowRemoteGuestStart,
  remoteGuestStartExercised: exercisedGuestStarts.length > 0,
  remoteGuestStartExerciseLimit: allowRemoteGuestStart ? guestStartExerciseLimit : 0,
  remoteGuestStartExerciseCount: exercisedGuestStarts.length,
  remoteGuestStartCleanupFailureCount: guestStartCleanupFailures.length,
  remoteGuestStartCleanupFailures: guestStartCleanupFailures,
  results,
  failures,
}

const report = `# Beta Human Review Wave Rehearsal

Date: ${summary.date}
Scope: ${summary.scope}
Status: ${summary.status}
Next-wave ops: \`${summary.nextWaveOpsArtifact}\`
Packet manifest: \`${summary.packetManifest}\`

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Expected review count: ${summary.expectedReviewCount}
- Non-mutating: ${summary.nonMutating ? 'yes' : 'no'}
- Remote guest start exercised: ${summary.remoteGuestStartExercised ? 'yes' : 'no'}
- Remote guest start exercise count: ${summary.remoteGuestStartExerciseCount}
- Remote guest start cleanup failures: ${summary.remoteGuestStartCleanupFailureCount}

## Coverage

| Review | Destination | Viewport | Start result | Packet/template result | Screenshot |
| --- | --- | --- | --- | --- | --- |
${results.map((result) => `| ${result.id} | ${result.destination} | ${result.viewport} | ${result.start.issues.length ? 'Fail' : 'Pass'} | ${result.packet.issues.length ? 'Fail' : 'Pass'} | \`${result.start.screenshot || 'missing'}\` |`).join('\n')}

## Failures

${markdownList(failures.map((failure) => `${failure.id}: ${failure.issues.join('; ')}`))}

## Operating Meaning

This preflight does not count as a completed beta review and does not replace human evidence. It proves the ${summary.scope === 'matrix' ? 'planned beta reviewer matrix' : 'active reviewer wave'} opens cleanly in a browser, every start URL preserves the assigned prompt through auth and guest-entry handoff, and each reviewer packet/template pair matches the ${summary.scope === 'matrix' ? 'packet manifest record' : 'operator row'} before people spend time on the review.

When \`QA_BETA_REVIEW_WAVE_REHEARSAL_ALLOW_REMOTE_GUEST_START=1\` is set, the rehearsal also clicks a limited number of guest-start links, confirms the Planner handoff, and removes the disposable guest account. That mode is intentionally opt-in because it touches production guest state.
`

await writeFile(repoPath(`qa/${jsonArtifact}`), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(`qa/${reportArtifact}`), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
