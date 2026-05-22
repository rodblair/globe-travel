import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

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

  if (allowRemoteGuestStart && state.guestHref) {
    issues.push('remote guest-start exercise is intentionally not implemented in this non-mutating preflight')
  }

  const screenshot = `qa/${artifactName}/screenshots/${slug(row.id)}-${slug(row.destination)}.png`
  await page.screenshot({ path: repoPath(screenshot), fullPage: false }).catch(() => {})

  return {
    status: response?.status() || 0,
    screenshot,
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
  nonMutating: true,
  remoteGuestStartExercised: false,
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

## Coverage

| Review | Destination | Viewport | Start result | Packet/template result | Screenshot |
| --- | --- | --- | --- | --- | --- |
${results.map((result) => `| ${result.id} | ${result.destination} | ${result.viewport} | ${result.start.issues.length ? 'Fail' : 'Pass'} | ${result.packet.issues.length ? 'Fail' : 'Pass'} | \`${result.start.screenshot || 'missing'}\` |`).join('\n')}

## Failures

${markdownList(failures.map((failure) => `${failure.id}: ${failure.issues.join('; ')}`))}

## Operating Meaning

This preflight does not count as a completed beta review and does not replace human evidence. It proves the ${summary.scope === 'matrix' ? 'planned beta reviewer matrix' : 'active reviewer wave'} opens cleanly in a browser, every start URL preserves the assigned prompt through auth and guest-entry handoff, and each reviewer packet/template pair matches the ${summary.scope === 'matrix' ? 'packet manifest record' : 'operator row'} before people spend time on the review.
`

await writeFile(repoPath(`qa/${jsonArtifact}`), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(`qa/${reportArtifact}`), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
