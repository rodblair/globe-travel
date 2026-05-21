import { execFileSync } from 'node:child_process'

const DOC_ONLY_PATTERNS = [
  /^qa\//,
  /^README\.md$/,
  /^OPERATIONS_RUNBOOK\.md$/,
  /^PLATFORM_[A-Z0-9_]+\.md$/,
  /^RELEASE_READINESS_MEMO\.md$/,
]

function runGit(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

function hasRevision(revision) {
  try {
    runGit(['rev-parse', '--verify', `${revision}^{commit}`])
    return true
  } catch {
    return false
  }
}

function isUsableSha(value) {
  return Boolean(value && !/^0+$/.test(value))
}

const head = process.env.VERCEL_GIT_COMMIT_SHA || 'HEAD'
const previous = process.env.VERCEL_GIT_PREVIOUS_SHA
let base = null

if (isUsableSha(previous) && hasRevision(previous)) {
  base = previous
} else if (hasRevision(`${head}^`)) {
  base = `${head}^`
}

if (!base || !hasRevision(head)) {
  console.log('[vercel-ignore] No reliable git base found; continuing build.')
  process.exit(1)
}

let changedFiles = []
try {
  changedFiles = runGit(['diff', '--name-only', '--diff-filter=ACMRT', base, head])
    .split('\n')
    .map((file) => file.trim())
    .filter(Boolean)
} catch (error) {
  console.log(`[vercel-ignore] Could not inspect changed files: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}

if (changedFiles.length === 0) {
  console.log('[vercel-ignore] No changed files detected; continuing build.')
  process.exit(1)
}

const unsafeFiles = changedFiles.filter((file) => !DOC_ONLY_PATTERNS.some((pattern) => pattern.test(file)))

if (unsafeFiles.length === 0) {
  console.log(`[vercel-ignore] Skipping build: ${changedFiles.length} documentation/evidence file(s) changed.`)
  process.exit(0)
}

console.log(`[vercel-ignore] Continuing build: runtime-relevant change(s) detected: ${unsafeFiles.slice(0, 8).join(', ')}`)
process.exit(1)
