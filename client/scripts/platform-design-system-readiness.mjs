import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const clientDir = resolve(scriptDir, '..')
const repoRoot = resolve(clientDir, '..')
const date = process.env.QA_DESIGN_SYSTEM_DATE || new Date().toISOString().slice(0, 10)
const jsonArtifact = process.env.QA_DESIGN_SYSTEM_JSON || `qa/design-system-readiness-${date}.json`
const reportArtifact = process.env.QA_DESIGN_SYSTEM_REPORT || `qa/design-system-readiness-${date}.md`
const responsiveVisualArtifact =
  process.env.QA_DESIGN_SYSTEM_VISUAL_ARTIFACT ||
  'qa/visual-baseline-2026-05-22-full-with-pricing-local/summary.json'
const productionVisualRegister =
  process.env.QA_DESIGN_SYSTEM_PRODUCTION_VISUAL_REGISTER ||
  'qa/production-visual-review-register.json'
let productionVisualArtifact = process.env.QA_DESIGN_SYSTEM_PRODUCTION_VISUAL_ARTIFACT || ''
let productionVisualArtifactSource = process.env.QA_DESIGN_SYSTEM_PRODUCTION_VISUAL_ARTIFACT
  ? 'QA_DESIGN_SYSTEM_PRODUCTION_VISUAL_ARTIFACT'
  : productionVisualRegister

const requiredContextMarkers = [
  'Primary users are friend groups planning trips together',
  'easy to understand, confident, and social',
  'refined, intentional, and editorial',
  'Make group planning legible at a glance',
]

const requiredTokens = [
  '--deep-horizon-navy',
  '--cream-vellum',
  '--sun-compass',
  '--dusty-aqua',
  '--terracotta',
  '--moss',
  '--paper',
  '--paper-raised',
  '--ink',
  '--brass',
  '--primary',
  '--background',
  '--foreground',
  '--transition-fast',
  '--transition-smooth',
  '--shadow-elevation-low',
]

const requiredUiPrimitives = [
  'client/components/ui/button.tsx',
  'client/components/ui/input.tsx',
  'client/components/ui/textarea.tsx',
  'client/components/ui/card.tsx',
  'client/components/ui/badge.tsx',
  'client/components/ui/label.tsx',
]

const requiredAtmosphereComponents = [
  'client/components/atmosphere/PaperPanel.tsx',
  'client/components/atmosphere/HorizonHero.tsx',
  'client/components/atmosphere/ItineraryThread.tsx',
  'client/components/atmosphere/DestinationPin.tsx',
  'client/components/atmosphere/GlobeBrand.tsx',
]

const requiredResponsiveRoutes = [
  'landing',
  'pricing',
  'planner',
  'saved-trips',
  'saved-journal',
  'account-profile',
  'account-billing',
  'login',
  'signup',
  'public-share',
  'trip-studio',
]
const requiredResponsiveViewports = [
  'phone',
  'tablet',
  'laptop',
  'desktop',
  'wide',
]
const requiredResponsiveVisualCount = requiredResponsiveRoutes.length * requiredResponsiveViewports.length

const requiredProductionRoutes = [
  'landing',
  'pricing',
  'login',
  'signup',
  'public-share',
]
const requiredProductionViewports = [
  'phone',
  'tablet',
  'laptop',
  'desktop',
  'wide',
]
const requiredProductionVisualCount = requiredProductionRoutes.length * requiredProductionViewports.length

const checks = []

function repoPath(relativePath) {
  return resolve(repoRoot, relativePath)
}

function addCheck(name, ok, detail = {}) {
  checks.push({
    name,
    ok: Boolean(ok),
    ...detail,
  })
}

async function readText(relativePath) {
  return readFile(repoPath(relativePath), 'utf8')
}

async function readJson(relativePath) {
  const raw = await readText(relativePath)
  return JSON.parse(raw)
}

async function fileExists(relativePath) {
  try {
    await access(repoPath(relativePath))
    return true
  } catch {
    return false
  }
}

async function collectFiles(startRelativePath, allowedExtensions = new Set(['.ts', '.tsx', '.css'])) {
  const start = repoPath(startRelativePath)
  const files = []

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(directory, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue
        await walk(fullPath)
      } else if (allowedExtensions.has(extname(entry.name))) {
        files.push(relative(repoRoot, fullPath))
      }
    }
  }

  await walk(start)
  return files
}

function missingFrom(actual, expected) {
  const set = new Set(actual)
  return expected.filter((item) => !set.has(item))
}

function summarizeBadMatches(files, pattern, allowedPathPattern = null) {
  const matches = []
  for (const file of files) {
    if (allowedPathPattern?.test(file)) continue
    const lines = fileContents.get(file)?.split('\n') || []
    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        matches.push({
          file,
          line: index + 1,
          text: line.trim().slice(0, 180),
        })
      }
    })
  }
  return matches
}

function dateOnly(value) {
  if (!value) return null
  const match = String(value).match(/\b\d{4}-\d{2}-\d{2}\b/)
  return match?.[0] || null
}

if (!productionVisualArtifact) {
  try {
    const visualRegister = await readJson(productionVisualRegister)
    productionVisualArtifact = visualRegister.latestProductionReview?.summaryArtifact || ''
  } catch {
    productionVisualArtifact = ''
  }
}

const designContext = await readText('.impeccable.md')
const globals = await readText('client/app/globals.css')
const sourceFiles = [
  ...(await collectFiles('client/app')),
  ...(await collectFiles('client/components')),
  ...(await collectFiles('client/lib')),
]
const fileContents = new Map()
for (const file of sourceFiles) {
  fileContents.set(file, await readText(file))
}

const missingContextMarkers = requiredContextMarkers.filter((marker) => !designContext.includes(marker))
addCheck('design context documents users, tone, aesthetic, and principles', missingContextMarkers.length === 0, {
  missingContextMarkers,
})

const missingTokens = requiredTokens.filter((token) => !globals.includes(token))
addCheck('global design tokens expose the Globe.travel atmosphere palette and interaction system', missingTokens.length === 0, {
  requiredTokens,
  missingTokens,
})

const missingUiPrimitives = []
for (const file of requiredUiPrimitives) {
  if (!(await fileExists(file))) missingUiPrimitives.push(file)
}
addCheck('shared UI primitives exist for core forms and controls', missingUiPrimitives.length === 0, {
  requiredUiPrimitives,
  missingUiPrimitives,
})

const missingAtmosphereComponents = []
for (const file of requiredAtmosphereComponents) {
  if (!(await fileExists(file))) missingAtmosphereComponents.push(file)
}
addCheck('atmosphere component vocabulary exists for editorial travel surfaces', missingAtmosphereComponents.length === 0, {
  requiredAtmosphereComponents,
  missingAtmosphereComponents,
})

const sourceHygieneFiles = sourceFiles.filter((file) => (
  !file.includes('client/app/api/share-card/') &&
  !file.includes('client/components/globes/') &&
  !file.includes('client/components/map/TravelMap.tsx')
))
const debugConsoleMatches = summarizeBadMatches(sourceHygieneFiles, /\bconsole\.log\s*\(/)
addCheck('production UI and API source has no debug console.log calls', debugConsoleMatches.length === 0, {
  debugConsoleMatches,
})

const placeholderMatches = summarizeBadMatches(sourceHygieneFiles, /\b(TODO|FIXME|lorem ipsum)\b/i)
addCheck('production UI source has no placeholder TODO or lorem copy', placeholderMatches.length === 0, {
  placeholderMatches,
})

const aiSlopTextMatches = summarizeBadMatches(
  sourceHygieneFiles,
  /\b(AI travel app|magic itinerary|10x|stunning travel|beautiful travel experience)\b/i,
  /client\/lib\/planner\//,
)
addCheck('user-facing copy avoids generic AI-travel marketing filler', aiSlopTextMatches.length === 0, {
  aiSlopTextMatches,
})

const staleBrandMatches = summarizeBadMatches(sourceHygieneFiles, /\b(Albatross|Arcki)\b/i)
addCheck('production UI source has no stale Globe.travel brand labels', staleBrandMatches.length === 0, {
  staleBrandMatches,
})

let responsiveVisual = null
try {
  responsiveVisual = await readJson(responsiveVisualArtifact)
  const missingRoutes = missingFrom(responsiveVisual.routes || [], requiredResponsiveRoutes)
  const actualResponsiveViewports = (responsiveVisual.viewports || []).map((viewport) => (
    typeof viewport === 'string' ? viewport : viewport?.id
  )).filter(Boolean)
  const missingViewports = missingFrom(actualResponsiveViewports, requiredResponsiveViewports)
  addCheck('responsive visual QA covers every design-critical public and protected route', (
    responsiveVisual.checked === requiredResponsiveVisualCount &&
    responsiveVisual.passed === requiredResponsiveVisualCount &&
    responsiveVisual.failed === 0 &&
    missingRoutes.length === 0 &&
    missingViewports.length === 0
  ), {
    artifact: responsiveVisualArtifact,
    expected: requiredResponsiveVisualCount,
    checked: responsiveVisual.checked,
    passed: responsiveVisual.passed,
    failed: responsiveVisual.failed,
    missingRoutes,
    missingViewports,
  })

  const badResponsiveResults = (responsiveVisual.results || []).filter((result) => {
    const metrics = result.metrics || {}
    return result.ok === false ||
      metrics.horizontalOverflow === true ||
      (Array.isArray(metrics.appErrors) && metrics.appErrors.length > 0) ||
      (Array.isArray(metrics.clippedText) && metrics.clippedText.length > 0) ||
      (Array.isArray(metrics.overlappingAppTargets) && metrics.overlappingAppTargets.length > 0)
  })
  addCheck('responsive visual QA has no polish blockers', badResponsiveResults.length === 0, {
    badResultCount: badResponsiveResults.length,
    badResults: badResponsiveResults.slice(0, 12).map((result) => ({
      routeId: result.routeId,
      viewportId: result.viewportId,
      ok: result.ok,
    })),
  })
} catch (error) {
  addCheck('responsive visual QA covers every design-critical public and protected route', false, {
    artifact: responsiveVisualArtifact,
    error: error instanceof Error ? error.message : String(error),
  })
  addCheck('responsive visual QA has no polish blockers', false, {
    artifact: responsiveVisualArtifact,
    error: error instanceof Error ? error.message : String(error),
  })
}

let productionVisual = null
try {
  if (!productionVisualArtifact) {
    throw new Error(`No production visual summary found in ${productionVisualArtifactSource}`)
  }
  productionVisual = await readJson(productionVisualArtifact)
  const missingRoutes = missingFrom(productionVisual.routes || [], requiredProductionRoutes)
  addCheck('production visual QA covers public acquisition and sharing surfaces', (
    productionVisual.checked === requiredProductionVisualCount &&
    productionVisual.passed === requiredProductionVisualCount &&
    productionVisual.failed === 0 &&
    missingRoutes.length === 0
  ), {
    artifact: productionVisualArtifact,
    artifactSource: productionVisualArtifactSource,
    expected: requiredProductionVisualCount,
    checked: productionVisual.checked,
    passed: productionVisual.passed,
    failed: productionVisual.failed,
    missingRoutes,
    evidenceDate: dateOnly(productionVisual.date || productionVisualArtifact),
  })
} catch (error) {
  addCheck('production visual QA covers public acquisition and sharing surfaces', false, {
    artifact: productionVisualArtifact,
    artifactSource: productionVisualArtifactSource,
    error: error instanceof Error ? error.message : String(error),
  })
}

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  designContext: '.impeccable.md',
  responsiveVisualArtifact,
  productionVisualArtifact,
  productionVisualArtifactSource,
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  checks,
  failures,
}

await mkdir(dirname(repoPath(jsonArtifact)), { recursive: true })
await writeFile(repoPath(jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(reportArtifact), `# Design System Readiness

Date: ${date}
Design context: \`.impeccable.md\`
Responsive visual artifact: \`${responsiveVisualArtifact}\`
Production visual artifact: \`${productionVisualArtifact}\`

## Result

- Checked: \`${summary.checked}\`
- Passed: \`${summary.passed}\`
- Failed: \`${summary.failed}\`

## Checks

${checks.map((check) => `- ${check.ok ? 'PASS' : 'FAIL'}: ${check.name}`).join('\n')}

## Failure Detail

\`\`\`json
${JSON.stringify(failures, null, 2)}
\`\`\`
`)

console.log(JSON.stringify({
  ...summary,
  jsonArtifact,
  reportArtifact,
}, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
