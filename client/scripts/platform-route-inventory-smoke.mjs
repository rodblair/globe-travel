import { access, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const baseUrl = (process.env.QA_BASE_URL || 'https://globe-travel-two.vercel.app').replace(/\/$/, '')
const shareSlug = process.env.QA_SHARE_SLUG || 'x3m2c8cnws'
const requestedDate = process.env.QA_ROUTE_INVENTORY_DATE || currentQaDate()
const jsonArtifact = process.env.QA_ROUTE_INVENTORY_JSON || `route-inventory-smoke-${requestedDate}.json`
const reportArtifact = process.env.QA_ROUTE_INVENTORY_REPORT || `route-inventory-smoke-${requestedDate}.md`

const routes = [
  {
    path: '/',
    sourceFile: 'client/app/page.tsx',
    access: 'public',
    expectation: 'renders',
    markers: ['Globe.travel', 'Plan the trip everyone'],
  },
  {
    path: '/login',
    sourceFile: 'client/app/(auth)/login/page.tsx',
    access: 'public',
    expectation: 'renders',
    markers: ['Welcome back', 'Continue as guest'],
  },
  {
    path: '/signup',
    sourceFile: 'client/app/(auth)/signup/page.tsx',
    access: 'public',
    expectation: 'renders',
    markers: ['Create your account', 'Continue as guest'],
  },
  {
    path: '/reset-password',
    sourceFile: 'client/app/(auth)/reset-password/page.tsx',
    access: 'public',
    expectation: 'renders',
    markers: ['Set a new password', 'Update password'],
  },
  {
    path: '/callback',
    sourceFile: 'client/app/(auth)/callback/route.ts',
    access: 'public',
    expectation: 'renders',
    markers: ['Confirming your account'],
  },
  {
    path: '/auth/callback-client',
    sourceFile: 'client/app/(auth)/auth/callback-client/page.tsx',
    access: 'public',
    expectation: 'renders',
    markers: ['min-h-screen', 'bg-paper'],
  },
  {
    path: `/t/${shareSlug}`,
    sourceFile: 'client/app/t/[shareSlug]/page.tsx',
    access: 'public',
    expectation: 'renders',
    markers: ['og:site_name', 'twitter:card'],
  },
  {
    path: '/chat',
    sourceFile: 'client/app/(app)/chat/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/chat',
  },
  {
    path: '/explore',
    sourceFile: 'client/app/(app)/explore/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/explore',
  },
  {
    path: '/globe',
    sourceFile: 'client/app/(app)/globe/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/globe',
  },
  {
    path: '/map',
    sourceFile: 'client/app/(app)/map/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/map',
  },
  {
    path: '/bucket-list',
    sourceFile: 'client/app/(app)/bucket-list/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/bucket-list',
  },
  {
    path: '/journal',
    sourceFile: 'client/app/(app)/journal/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/journal',
  },
  {
    path: '/saved',
    sourceFile: 'client/app/(app)/saved/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/saved',
  },
  {
    path: '/account',
    sourceFile: 'client/app/(app)/account/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/account',
  },
  {
    path: '/account?tab=billing',
    sourceFile: 'client/app/(app)/account/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/account?tab=billing',
  },
  {
    path: '/pricing',
    sourceFile: 'client/app/pricing/page.tsx',
    access: 'public',
    expectation: 'renders',
    markers: ['Globe.travel pricing', 'Start 7-day free trial', 'Adventurer'],
  },
  {
    path: '/profile',
    sourceFile: 'client/app/(app)/profile/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/profile',
  },
  {
    path: '/settings',
    sourceFile: 'client/app/(app)/settings/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/settings',
  },
  {
    path: '/trips',
    sourceFile: 'client/app/(app)/trips/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/saved',
  },
  {
    path: '/trips/new',
    sourceFile: 'client/app/(app)/trips/new/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/chat',
  },
  {
    path: '/onboarding',
    sourceFile: 'client/app/(app)/onboarding/page.tsx',
    access: 'protected',
    expectation: 'login-redirect',
    expectedNext: '/onboarding',
  },
]

function repoPath(path) {
  return resolve(root, path)
}

async function fileExists(path) {
  try {
    await access(repoPath(path))
    return true
  } catch {
    return false
  }
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function wait(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: { 'user-agent': 'globe-travel-route-inventory/1.0' },
      })
      if (response.status < 500 || attempt === attempts) return { response, attempts: attempt, error: null }
      lastError = new Error(`HTTP ${response.status}`)
    } catch (error) {
      lastError = error
      if (attempt === attempts) break
    }
    await wait(250 * attempt)
  }

  return {
    response: null,
    attempts,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  }
}

async function checkRoute(route) {
  const sourceExists = await fileExists(route.sourceFile)
  const startedAt = Date.now()
  const fetched = await fetchWithRetry(`${baseUrl}${route.path}`)

  if (!fetched.response) {
    return {
      ...route,
      sourceExists,
      status: null,
      finalUrl: null,
      elapsedMs: Date.now() - startedAt,
      attempts: fetched.attempts,
      ok: false,
      issues: [fetched.error || 'fetch failed'],
    }
  }

  const response = fetched.response
  const body = await response.text()
  const finalUrl = new URL(response.url)
  const issues = []

  if (!sourceExists) issues.push(`source file missing: ${route.sourceFile}`)
  if (!response.ok) issues.push(`HTTP ${response.status}`)

  if (route.expectation === 'login-redirect') {
    const next = finalUrl.searchParams.get('next')
    if (finalUrl.pathname !== '/login') issues.push(`expected final pathname /login, got ${finalUrl.pathname}`)
    if (next !== route.expectedNext) issues.push(`expected next=${route.expectedNext}, got ${next || 'missing'}`)
    for (const marker of ['Welcome back', 'Continue as guest']) {
      if (!body.includes(marker)) issues.push(`missing login marker: ${marker}`)
    }
  } else {
    for (const marker of route.markers || []) {
      if (!body.includes(marker)) issues.push(`missing marker: ${marker}`)
    }
  }

  return {
    ...route,
    sourceExists,
    status: response.status,
    finalUrl: response.url,
    elapsedMs: Date.now() - startedAt,
    attempts: fetched.attempts,
    ok: issues.length === 0,
    issues,
  }
}

const results = []
for (const route of routes) {
  results.push(await checkRoute(route))
}

const failures = results.filter((result) => !result.ok)
const publicRoutes = results.filter((result) => result.access === 'public')
const protectedRoutes = results.filter((result) => result.access === 'protected')
const sourceMissing = results.filter((result) => !result.sourceExists)
const date = requestedDate
const summary = {
  date,
  baseUrl,
  shareSlug,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  publicRouteCount: publicRoutes.length,
  protectedRouteCount: protectedRoutes.length,
  sourceMissingCount: sourceMissing.length,
  jsonArtifact: `qa/${jsonArtifact}`,
  reportArtifact: `qa/${reportArtifact}`,
  routes: results,
  failures,
}

const report = `# Full Platform Route Inventory Smoke

Date: ${summary.date}
Base URL: ${summary.baseUrl}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Public routes: ${summary.publicRouteCount}
- Protected routes: ${summary.protectedRouteCount}
- Missing source files: ${summary.sourceMissingCount}

## Route Coverage

| Route | Access | Expected | Final URL | Status | Result |
| --- | --- | --- | --- | --- | --- |
${results.map((result) => `| \`${result.path}\` | ${result.access} | ${result.expectation} | ${result.finalUrl || 'missing'} | ${result.status || 'n/a'} | ${result.ok ? 'Pass' : 'Fail'} |`).join('\n')}

## Failures

${markdownList(failures.map((result) => `${result.path}: ${result.issues.join('; ')}`))}

## Operating Meaning

This gate covers the full top-level web route inventory that ships in the current app shell. It complements the deeper release-candidate, visual, accessibility, share, planner, billing, and Trip Studio gates by ensuring every public page, protected page, and compatibility redirect still resolves to an intentional destination.
`

await mkdir(repoPath('qa'), { recursive: true })
await writeFile(repoPath(`qa/${jsonArtifact}`), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(`qa/${reportArtifact}`), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
