import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const repoRoot = resolve(process.cwd(), '..')
const date = process.env.QA_PUBLIC_SHARE_QUARANTINE_DATE || new Date().toISOString().slice(0, 10)
const catalogArtifact = process.env.QA_PUBLIC_SHARE_CATALOG_ARTIFACT || `qa/public-share-map-catalog-${date}.json`
const artifactName = process.env.QA_PUBLIC_SHARE_QUARANTINE_ARTIFACT_NAME || `public-share-catalog-quarantine-${date}`
const artifactPath = `qa/${artifactName}.json`
const reportPath = `qa/${artifactName}.md`
const apply = ['1', 'true', 'yes'].includes(String(process.env.QA_PUBLIC_SHARE_QUARANTINE_APPLY || '').toLowerCase())
const keepSlugs = new Set((process.env.QA_PUBLIC_SHARE_QUARANTINE_KEEP || 'x3m2c8cnws')
  .split(/[\s,]+/)
  .map((slug) => slug.trim())
  .filter(Boolean))
const quarantineQaShares = process.env.QA_PUBLIC_SHARE_QUARANTINE_QA_SHARES !== '0'

function repoPath(path) {
  return resolve(repoRoot, path)
}

async function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  let text = ''
  try {
    text = await readFile(envPath, 'utf8')
  } catch {
    return
  }

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const index = trimmed.indexOf('=')
    const key = trimmed.slice(0, index).trim()
    const rawValue = trimmed.slice(index + 1).trim()
    if (!key || process.env[key]) continue
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function isQaShare(share) {
  const title = String(share?.title || '')
  return /^QA\b/i.test(title) || /\bQA Trip\b/i.test(title)
}

await loadEnvLocal()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for public share quarantine.')
}

const catalog = JSON.parse(await readFile(repoPath(catalogArtifact), 'utf8'))
const shareResults = Array.isArray(catalog.shareResults) ? catalog.shareResults : []
const discoveryShares = Array.isArray(catalog.discovery?.shares) ? catalog.discovery.shares : []
const failingSlugs = new Set(shareResults.filter((result) => result.ok !== true).map((result) => result.shareSlug).filter(Boolean))
const discoveryBySlug = new Map(discoveryShares.map((share) => [share.shareSlug, share]))

const candidates = shareResults
  .map((result) => {
    const discovered = discoveryBySlug.get(result.shareSlug) || {}
    const reasons = []
    if (failingSlugs.has(result.shareSlug)) reasons.push('catalog map/itinerary integrity failed')
    if (quarantineQaShares && isQaShare(discovered)) reasons.push('QA-only public fixture should not be live')
    if (keepSlugs.has(result.shareSlug)) reasons.length = 0
    return {
      tripId: discovered.tripId || null,
      title: discovered.title || result.tripTitle || null,
      shareSlug: result.shareSlug,
      wasPublic: true,
      reasons,
    }
  })
  .filter((candidate) => candidate.shareSlug && candidate.reasons.length > 0)

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const updates = []
for (const candidate of candidates) {
  if (!apply) {
    updates.push({ ...candidate, applied: false, skippedReason: 'dry run' })
    continue
  }

  const { data, error } = await supabase
    .from('trips')
    .update({ is_public: false, updated_at: new Date().toISOString() })
    .eq('share_slug', candidate.shareSlug)
    .eq('is_public', true)
    .select('id,title,share_slug,is_public,updated_at')
    .maybeSingle()

  updates.push({
    ...candidate,
    applied: !error && Boolean(data),
    error: error?.message || null,
    resultingTrip: data || null,
  })
}

const failedUpdates = updates.filter((update) => apply && !update.applied)
const summary = {
  date,
  catalogArtifact,
  jsonArtifact: artifactPath,
  reportArtifact: reportPath,
  apply,
  keepSlugs: [...keepSlugs],
  quarantineQaShares,
  checkedShares: shareResults.length,
  catalogFailures: failingSlugs.size,
  candidates,
  candidateCount: candidates.length,
  appliedCount: updates.filter((update) => update.applied).length,
  failedUpdateCount: failedUpdates.length,
  updates,
  ok: failedUpdates.length === 0,
}

const report = `# Public Share Catalog Quarantine

Date: ${date}
Catalog artifact: \`${catalogArtifact}\`
Mode: ${apply ? 'apply' : 'dry run'}

## Result

- Checked shares: ${summary.checkedShares}
- Catalog failures: ${summary.catalogFailures}
- Quarantine candidates: ${summary.candidateCount}
- Applied updates: ${summary.appliedCount}
- Failed updates: ${summary.failedUpdateCount}
- Keep slugs: ${summary.keepSlugs.join(', ') || 'none'}

## Candidates

${markdownList(candidates.map((candidate) => `${candidate.shareSlug} - ${candidate.title || 'Untitled'} (${candidate.reasons.join('; ')})`))}

## Failed Updates

${markdownList(failedUpdates.map((update) => `${update.shareSlug}: ${update.error || update.skippedReason || 'not applied'}`))}
`

await writeFile(repoPath(artifactPath), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(reportPath), report)

console.log(JSON.stringify(summary, null, 2))

if (failedUpdates.length > 0) {
  process.exitCode = 1
}
