import { execFileSync } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { currentQaDate, qaTimeZone } from './qa-date-utils.mjs'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const clientDir = resolve(scriptDir, '..')
const repoRoot = resolve(clientDir, '..')
const mobileDir = resolve(repoRoot, 'mobile')
const date = process.env.QA_MOBILE_READINESS_DATE || currentQaDate(qaTimeZone)
const jsonArtifact = process.env.QA_MOBILE_READINESS_JSON || `qa/mobile-readiness-${date}.json`
const reportArtifact = process.env.QA_MOBILE_READINESS_REPORT || `qa/mobile-readiness-${date}.md`

const requiredFiles = [
  'mobile/App.tsx',
  'mobile/app.json',
  'mobile/metro.config.js',
  'mobile/package.json',
  'mobile/README.md',
  'mobile/src/api.ts',
  'mobile/src/theme.ts',
  'mobile/src/trips.ts',
]

const requiredScripts = [
  'ios',
  'android',
  'web',
  'typecheck',
]

const requiredDependencies = [
  'expo',
  'react',
  'react-native',
  'react-dom',
  'react-native-web',
]

const checks = []

function repoPath(path) {
  return resolve(repoRoot, path)
}

function addCheck(name, ok, detail = {}) {
  checks.push({
    name,
    ok: Boolean(ok),
    ...detail,
  })
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
}

async function readText(path) {
  return readFile(repoPath(path), 'utf8')
}

async function fileExists(path) {
  try {
    await access(repoPath(path))
    return true
  } catch {
    return false
  }
}

function run(command, args) {
  try {
    const stdout = execFileSync(command, args, {
      cwd: mobileDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        CI: '1',
        EXPO_NO_TELEMETRY: '1',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    return {
      ok: true,
      exitCode: 0,
      stdout: stdout.trim(),
      stderr: '',
    }
  } catch (error) {
    return {
      ok: false,
      exitCode: Number.isInteger(error.status) ? error.status : 1,
      stdout: String(error.stdout || '').trim(),
      stderr: String(error.stderr || error.message || '').trim(),
    }
  }
}

const packageJson = await readJson('mobile/package.json')
const appJson = await readJson('mobile/app.json')
const readme = await readText('mobile/README.md')
const metroSource = await readText('mobile/metro.config.js')
const apiSource = await readText('mobile/src/api.ts')
const themeSource = await readText('mobile/src/theme.ts')
const appSource = await readText('mobile/App.tsx')

const missingFiles = []
for (const file of requiredFiles) {
  if (!(await fileExists(file))) missingFiles.push(file)
}
addCheck('mobile app source files are present', missingFiles.length === 0, {
  requiredFiles,
  missingFiles,
})

const scripts = packageJson.scripts || {}
const missingScripts = requiredScripts.filter((script) => !scripts[script])
addCheck('mobile package exposes launch and validation scripts', missingScripts.length === 0, {
  requiredScripts,
  missingScripts,
})

const dependencies = {
  ...(packageJson.dependencies || {}),
  ...(packageJson.devDependencies || {}),
}
const missingDependencies = requiredDependencies.filter((dependency) => !dependencies[dependency])
addCheck('mobile package includes Expo and React Native dependencies', missingDependencies.length === 0, {
  requiredDependencies,
  missingDependencies,
  expoVersion: dependencies.expo || null,
  reactNativeVersion: dependencies['react-native'] || null,
})

addCheck('mobile Metro config extends Expo default config', (
  metroSource.includes("require('expo/metro-config')") &&
  metroSource.includes('getDefaultConfig(__dirname)')
), {
  hasExpoMetroConfig: metroSource.includes("require('expo/metro-config')"),
  hasDefaultConfig: metroSource.includes('getDefaultConfig(__dirname)'),
})

addCheck('mobile app config uses Globe Travel launch identity', (
  appJson.expo?.name === 'Globe Travel' &&
  appJson.expo?.slug === 'globe-travel-mobile' &&
  appJson.expo?.orientation === 'portrait' &&
  appJson.expo?.ios?.supportsTablet === true &&
  appJson.expo?.android?.edgeToEdgeEnabled === true
), {
  appName: appJson.expo?.name || null,
  slug: appJson.expo?.slug || null,
  orientation: appJson.expo?.orientation || null,
  iosSupportsTablet: appJson.expo?.ios?.supportsTablet ?? null,
  androidEdgeToEdgeEnabled: appJson.expo?.android?.edgeToEdgeEnabled ?? null,
})

addCheck('mobile API can target the web backend', (
  apiSource.includes('EXPO_PUBLIC_API_URL') &&
  apiSource.includes('http://localhost:3000') &&
  apiSource.includes('/api/trips') &&
  readme.includes('EXPO_PUBLIC_API_URL')
), {
  hasEnvOverride: apiSource.includes('EXPO_PUBLIC_API_URL'),
  hasLocalFallback: apiSource.includes('http://localhost:3000'),
  hasTripApiRoute: apiSource.includes('/api/trips'),
  readmeDocumentsApiUrl: readme.includes('EXPO_PUBLIC_API_URL'),
})

addCheck('mobile UI uses Globe design tokens and core app surfaces', (
  themeSource.includes('deepHorizonNavy') &&
  themeSource.includes('creamVellum') &&
  appSource.includes('Trip Studio') &&
  appSource.includes('Saved') &&
  appSource.includes('Crew')
), {
  hasBrandNavy: themeSource.includes('deepHorizonNavy'),
  hasBrandPaper: themeSource.includes('creamVellum'),
  hasTripStudioSurface: appSource.includes('Trip Studio'),
  hasSavedSurface: appSource.includes('Saved'),
  hasCrewSurface: appSource.includes('Crew'),
})

const typecheck = run('npm', ['run', 'typecheck'])
addCheck('mobile TypeScript typecheck passes', typecheck.ok, {
  command: 'npm run typecheck',
  exitCode: typecheck.exitCode,
  stdout: typecheck.stdout,
  stderr: typecheck.stderr,
})

const expoDoctor = run('npx', ['--yes', 'expo-doctor'])
addCheck('mobile Expo doctor passes', expoDoctor.ok && /18\/18 checks passed/.test(expoDoctor.stdout), {
  command: 'npx --yes expo-doctor',
  exitCode: expoDoctor.exitCode,
  stdout: expoDoctor.stdout,
  stderr: expoDoctor.stderr,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  timeZone: qaTimeZone,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  mobileDir: 'mobile',
  packageName: packageJson.name || null,
  appName: appJson.expo?.name || null,
  jsonArtifact,
  reportArtifact,
  checks,
  failures,
}

const report = `# Mobile Readiness

Date: ${date}
Status: ${summary.status}
Package: ${summary.packageName || 'unknown'}
App: ${summary.appName || 'unknown'}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Typecheck: ${typecheck.ok ? 'pass' : 'fail'}
- Expo doctor: ${expoDoctor.ok ? 'pass' : 'fail'}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${failures.length ? failures.map((check) => `- ${check.name}`).join('\n') : '- none'}

## Operating Meaning

This gate verifies the sibling Expo app still builds against TypeScript, passes Expo project health checks, preserves Globe Travel launch identity, exposes the expected mobile surfaces, and can target the existing Next.js web API through \`EXPO_PUBLIC_API_URL\`.
`

await mkdir(dirname(repoPath(jsonArtifact)), { recursive: true })
await writeFile(repoPath(jsonArtifact), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(repoPath(reportArtifact), report)

console.log(JSON.stringify(summary, null, 2))
if (failures.length > 0) process.exit(1)
