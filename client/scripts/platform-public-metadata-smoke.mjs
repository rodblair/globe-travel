import { access, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const baseUrl = (process.env.QA_BASE_URL || 'https://globe-travel-two.vercel.app').replace(/\/$/, '')
const publicSiteUrl = (process.env.QA_PUBLIC_METADATA_SITE_URL || baseUrl).replace(/\/$/, '')
const requestedDate = process.env.QA_PUBLIC_METADATA_DATE || currentQaDate()
const shareSlug = process.env.QA_SHARE_SLUG || process.env.NEXT_PUBLIC_LAUNCH_SHARE_SLUG || 'x3m2c8cnws'
const jsonArtifact = process.env.QA_PUBLIC_METADATA_JSON || `public-metadata-smoke-${requestedDate}.json`
const reportArtifact = process.env.QA_PUBLIC_METADATA_REPORT || `public-metadata-smoke-${requestedDate}.md`

const sourceFiles = [
  'client/app/layout.tsx',
  'client/app/manifest.ts',
  'client/app/opengraph-image.tsx',
  'client/app/robots.ts',
  'client/app/sitemap.ts',
  'client/app/twitter-image.tsx',
]

const rootHtmlMarkers = [
  'Globe.travel',
  'Plan the trip everyone can say yes to',
  'og:site_name',
  'twitter:card',
  '/manifest.webmanifest',
]

const manifestExpectations = {
  name: 'Globe.travel',
  short_name: 'Globe',
  display: 'standalone',
  start_url: '/?source=app-manifest',
  scope: '/',
  background_color: '#f6f1e6',
  theme_color: '#0c1f33',
}

const sitemapUrls = [
  `${publicSiteUrl}/`,
  `${publicSiteUrl}/pricing`,
  `${publicSiteUrl}/t/${shareSlug}`,
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

function wait(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms))
}

async function fetchWithRetry(path, attempts = 3) {
  let lastError = null
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        redirect: 'follow',
        headers: { 'user-agent': 'globe-travel-public-metadata/1.0' },
      })
      if (response.status < 500 || attempt === attempts) {
        return { response, attempts: attempt, error: null }
      }
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

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

async function checkRootHtml() {
  const fetched = await fetchWithRetry('/')
  if (!fetched.response) {
    return {
      id: 'root-html',
      path: '/',
      ok: false,
      status: null,
      attempts: fetched.attempts,
      issues: [fetched.error || 'fetch failed'],
    }
  }

  const body = await fetched.response.text()
  const issues = []
  if (!fetched.response.ok) issues.push(`HTTP ${fetched.response.status}`)

  const missingMarkers = rootHtmlMarkers.filter((marker) => !body.includes(marker))
  for (const marker of missingMarkers) {
    issues.push(`missing metadata marker: ${marker}`)
  }

  return {
    id: 'root-html',
    path: '/',
    ok: issues.length === 0,
    status: fetched.response.status,
    finalUrl: fetched.response.url,
    attempts: fetched.attempts,
    missingMarkers,
    issues,
  }
}

async function checkManifest() {
  const fetched = await fetchWithRetry('/manifest.webmanifest')
  if (!fetched.response) {
    return {
      id: 'manifest',
      path: '/manifest.webmanifest',
      ok: false,
      status: null,
      attempts: fetched.attempts,
      issues: [fetched.error || 'fetch failed'],
    }
  }

  const issues = []
  if (!fetched.response.ok) issues.push(`HTTP ${fetched.response.status}`)

  let manifest = null
  try {
    manifest = await fetched.response.json()
  } catch (error) {
    issues.push(`invalid JSON: ${error instanceof Error ? error.message : String(error)}`)
  }

  if (manifest) {
    for (const [key, expected] of Object.entries(manifestExpectations)) {
      if (manifest[key] !== expected) {
        issues.push(`expected manifest.${key}=${expected}, got ${manifest[key] || 'missing'}`)
      }
    }
    if (!Array.isArray(manifest.categories) || !manifest.categories.includes('travel')) {
      issues.push('manifest categories must include travel')
    }
    if (!Array.isArray(manifest.icons) || manifest.icons.length < 1) {
      issues.push('manifest must include at least one icon')
    }
  }

  return {
    id: 'manifest',
    path: '/manifest.webmanifest',
    ok: issues.length === 0,
    status: fetched.response.status,
    finalUrl: fetched.response.url,
    attempts: fetched.attempts,
    manifest,
    issues,
  }
}

async function checkRobots() {
  const fetched = await fetchWithRetry('/robots.txt')
  if (!fetched.response) {
    return {
      id: 'robots',
      path: '/robots.txt',
      ok: false,
      status: null,
      attempts: fetched.attempts,
      issues: [fetched.error || 'fetch failed'],
    }
  }

  const body = await fetched.response.text()
  const issues = []
  if (!fetched.response.ok) issues.push(`HTTP ${fetched.response.status}`)

  const requiredMarkers = [
    'User-Agent: *',
    'Allow: /',
    'Allow: /pricing',
    'Allow: /t/',
    'Disallow: /api/',
    'Disallow: /trips',
    `Sitemap: ${publicSiteUrl}/sitemap.xml`,
  ]
  for (const marker of requiredMarkers) {
    if (!body.includes(marker)) issues.push(`missing robots marker: ${marker}`)
  }

  return {
    id: 'robots',
    path: '/robots.txt',
    ok: issues.length === 0,
    status: fetched.response.status,
    finalUrl: fetched.response.url,
    attempts: fetched.attempts,
    issues,
  }
}

async function checkSitemap() {
  const fetched = await fetchWithRetry('/sitemap.xml')
  if (!fetched.response) {
    return {
      id: 'sitemap',
      path: '/sitemap.xml',
      ok: false,
      status: null,
      attempts: fetched.attempts,
      issues: [fetched.error || 'fetch failed'],
    }
  }

  const body = await fetched.response.text()
  const issues = []
  if (!fetched.response.ok) issues.push(`HTTP ${fetched.response.status}`)

  for (const url of sitemapUrls) {
    if (!body.includes(`<loc>${url}</loc>`)) issues.push(`missing sitemap url: ${url}`)
  }

  const protectedMarkers = ['/account', '/chat', '/saved', '/trips/new']
  const protectedLeaks = protectedMarkers.filter((marker) => body.includes(marker))
  for (const marker of protectedLeaks) {
    issues.push(`protected route leaked into sitemap: ${marker}`)
  }

  return {
    id: 'sitemap',
    path: '/sitemap.xml',
    ok: issues.length === 0,
    status: fetched.response.status,
    finalUrl: fetched.response.url,
    attempts: fetched.attempts,
    sitemapUrlCount: (body.match(/<loc>/g) || []).length,
    protectedLeaks,
    issues,
  }
}

async function checkImageRoute(id, path) {
  const fetched = await fetchWithRetry(path)
  if (!fetched.response) {
    return {
      id,
      path,
      ok: false,
      status: null,
      attempts: fetched.attempts,
      issues: [fetched.error || 'fetch failed'],
    }
  }

  const issues = []
  const contentType = fetched.response.headers.get('content-type') || ''
  const bytes = new Uint8Array(await fetched.response.arrayBuffer())
  if (!fetched.response.ok) issues.push(`HTTP ${fetched.response.status}`)
  if (!contentType.includes('image/png')) issues.push(`expected image/png, got ${contentType || 'missing'}`)
  if (bytes.length < 5000) issues.push(`image response is too small: ${bytes.length} bytes`)

  return {
    id,
    path,
    ok: issues.length === 0,
    status: fetched.response.status,
    finalUrl: fetched.response.url,
    attempts: fetched.attempts,
    contentType,
    byteLength: bytes.length,
    issues,
  }
}

const sourceResults = []
for (const sourceFile of sourceFiles) {
  sourceResults.push({
    path: sourceFile,
    exists: await fileExists(sourceFile),
  })
}

const sourceFailures = sourceResults.filter((source) => !source.exists)
const results = [
  await checkRootHtml(),
  await checkManifest(),
  await checkRobots(),
  await checkSitemap(),
  await checkImageRoute('opengraph-image', '/opengraph-image'),
  await checkImageRoute('twitter-image', '/twitter-image'),
]

for (const sourceFailure of sourceFailures) {
  results.push({
    id: `source:${sourceFailure.path}`,
    path: sourceFailure.path,
    ok: false,
    issues: ['source file missing'],
  })
}

const failures = results.filter((result) => !result.ok)
const summary = {
  date: requestedDate,
  baseUrl,
  publicSiteUrl,
  shareSlug,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  sourceFiles: sourceResults,
  sourceMissingCount: sourceFailures.length,
  jsonArtifact: `qa/${jsonArtifact}`,
  reportArtifact: `qa/${reportArtifact}`,
  results,
  failures,
}

const report = `# Public Metadata Smoke

Date: ${summary.date}
Base URL: ${summary.baseUrl}
Public site URL: ${summary.publicSiteUrl}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Source files missing: ${summary.sourceMissingCount}
- Share slug in sitemap: ${summary.shareSlug}

## Coverage

| Check | Path | Status | Result |
| --- | --- | --- | --- |
${results.map((result) => `| ${result.id} | \`${result.path}\` | ${result.status || 'n/a'} | ${result.ok ? 'Pass' : 'Fail'} |`).join('\n')}

## Failures

${markdownList(failures.map((result) => `${result.id}: ${result.issues.join('; ')}`))}

## Operating Meaning

This gate proves Globe.travel has a launch-ready public wrapper: social preview tags on the landing page, a manifest for app-like install surfaces, robots policy that keeps protected planning surfaces out of indexing, and a sitemap focused on acquisition plus the public itinerary sharing loop.
`

await mkdir(repoPath('qa'), { recursive: true })
await writeFile(repoPath(`qa/${jsonArtifact}`), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(`qa/${reportArtifact}`), report)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
