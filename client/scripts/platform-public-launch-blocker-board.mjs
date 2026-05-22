import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD_DATE || ''
const publicStatusPath = process.env.QA_PUBLIC_LAUNCH_STATUS || 'qa/public-launch-status-2026-05-21.json'
const betaNextWaveOpsPath = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS || 'qa/beta-human-review-next-wave-ops-2026-05-21.json'
const betaAllWaveOpsPath = process.env.QA_BETA_REVIEW_ALL_WAVE_OPS || 'qa/beta-human-review-all-wave-ops-2026-05-21.json'
const visualRegisterPath = process.env.QA_VISUAL_REVIEW_REGISTER || 'qa/production-visual-review-register.json'
const visualProgressPath = process.env.QA_VISUAL_REVIEW_PROGRESS || 'qa/production-visual-review-progress-2026-05-21.json'

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

function currentUtcDate() {
  return new Date().toISOString().slice(0, 10)
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function repoPath(path) {
  return resolve(root, qaDisplayPath(path))
}

async function readJson(path) {
  return JSON.parse(await readFile(repoPath(path), 'utf8'))
}

async function fileExists(path) {
  try {
    await access(repoPath(path))
    return true
  } catch {
    return false
  }
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function rowsToCsv(rows) {
  const headers = [
    'blockerId',
    'workType',
    'id',
    'dueAt',
    'owner',
    'reviewerRole',
    'status',
    'action',
    'urlOrCommand',
    'packetOrArtifact',
    'submissionPath',
    'evidenceRule',
  ]
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
}

function betaRows(betaOps) {
  const rows = Array.isArray(betaOps.operatorRows) ? betaOps.operatorRows : []
  return rows.map((row) => ({
    blockerId: 'beta-human-review-threshold',
    workType: 'beta-human-review',
    id: row.id,
    dueAt: row.dueAt,
    owner: 'Product',
    reviewerRole: row.reviewerRole || row.reviewerCohort || '',
    status: 'needs completed review submission',
    action: `Complete ${row.id} using ${row.device} ${row.viewport}, then validate intake.`,
    urlOrCommand: row.startUrl,
    packetOrArtifact: row.packetPath,
    submissionPath: row.completedSubmissionPath,
    validationCommand: 'npm run qa:beta-review-intake',
    importCommand: 'QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake',
    evidenceRule: 'Counts only after a non-template JSON submission passes beta review intake and is explicitly imported.',
    source: {
      startUrl: row.startUrl,
      packetPath: row.packetPath,
      submissionTemplatePath: row.submissionTemplatePath,
      completedSubmissionPath: row.completedSubmissionPath,
      messageSubject: row.messageSubject,
    },
  }))
}

function visualRows(visualRegister, visualRemaining) {
  const scheduled = Array.isArray(visualRegister.scheduledPublicLaunchReviews)
    ? visualRegister.scheduledPublicLaunchReviews
    : []
  return scheduled.map((review, index) => ({
    blockerId: 'production-visual-review-history',
    workType: 'production-visual-review',
    id: review.id,
    dueAt: review.dueAt,
    owner: review.owner || 'Product',
    reviewerRole: review.reviewerRole || 'visual QA reviewer',
    status: index < visualRemaining ? 'required for public launch history' : 'scheduled buffer review',
    action: `Run production visual review ${review.id}, inspect screenshots, then validate intake.`,
    urlOrCommand: review.command,
    packetOrArtifact: review.expectedArtifactPrefix,
    submissionPath: `qa/production-visual-review-submissions-2026-05-21/${review.id}.json`,
    validationCommand: 'npm run qa:visual-review-intake',
    importCommand: 'QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake',
    evidenceRule: 'Counts only after production visual review evidence passes intake and is explicitly imported into reviewHistory.',
    source: {
      submissionTemplatePath: `qa/production-visual-review-submissions-2026-05-21/${review.id}.template.json`,
      routes: review.routes || [],
      viewports: review.viewports || [],
      diffRoutes: review.diffRoutes || [],
      acceptanceCriteria: review.acceptanceCriteria || '',
    },
  }))
}

const publicStatus = await readJson(publicStatusPath)
const betaNextWaveOps = await readJson(betaNextWaveOpsPath)
const betaAllWaveOps = await readJson(betaAllWaveOpsPath)
const visualRegister = await readJson(visualRegisterPath)
const visualProgress = await readJson(visualProgressPath)
const date = requestedDate ||
  dateOnly(publicStatus.date) ||
  dateOnly(publicStatus.artifacts?.json) ||
  currentUtcDate()
const jsonName = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD_JSON || `public-launch-blocker-board-${date}.json`
const reportName = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD_REPORT || `public-launch-blocker-board-${date}.md`
const csvName = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD_CSV || `public-launch-blocker-board-${date}.csv`
const betaStatus = publicStatus.betaHumanReviews || {}
const visualStatus = publicStatus.productionVisualReviews || {}
const blockers = Array.isArray(publicStatus.blockers) ? publicStatus.blockers : []
const betaWorkRows = betaRows(betaAllWaveOps)
const visualRemaining = Number(visualStatus.remainingDistinctDates) || 0
const visualWorkRows = visualRows(visualRegister, visualRemaining)
const rows = [...betaWorkRows, ...visualWorkRows]
const requiredVisualRows = visualWorkRows.filter((row) => row.status === 'required for public launch history')
const csvText = rowsToCsv(rows)
const rowEvidenceChecks = []
for (const row of rows) {
  const packetPath = row.workType === 'beta-human-review' ? row.packetOrArtifact : ''
  const templatePath = row.source?.submissionTemplatePath || ''
  rowEvidenceChecks.push({
    id: row.id,
    workType: row.workType,
    packetPath,
    packetExists: packetPath ? await fileExists(packetPath) : true,
    templatePath,
    templateExists: templatePath ? await fileExists(templatePath) : false,
    hasValidationCommand: hasText(row.validationCommand),
    hasImportCommand: hasText(row.importCommand),
  })
}
const missingRowEvidence = rowEvidenceChecks.filter((row) => (
  !row.packetExists ||
  !row.templateExists ||
  !row.hasValidationCommand ||
  !row.hasImportCommand
))

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('public launch blocker board reads current blocked status', (
  publicStatus.status === 'beta-ready-public-blocked' &&
  publicStatus.betaReady === true &&
  publicStatus.publicLaunchReady === false &&
  blockers.some((blocker) => blocker.id === 'beta-human-review-threshold') &&
  blockers.some((blocker) => blocker.id === 'production-visual-review-history')
), {
  status: publicStatus.status || null,
  betaReady: publicStatus.betaReady ?? null,
  publicLaunchReady: publicStatus.publicLaunchReady ?? null,
  blockers,
})

addCheck('public launch blocker board covers all remaining beta review rows', (
  betaNextWaveOps.status === 'pass' &&
  betaAllWaveOps.status === 'pass' &&
  betaAllWaveOps.scope === 'all-waves' &&
  Number(betaAllWaveOps.operatorRowCount) === betaWorkRows.length &&
  betaWorkRows.length === Number(betaStatus.remaining || 0) &&
  Number(betaAllWaveOps.operatorWaveCount) >= Number(betaStatus.scheduleWaveCount || 0) &&
  betaWorkRows.every((row) => hasText(row.urlOrCommand) && hasText(row.packetOrArtifact) && hasText(row.submissionPath) && !row.submissionPath.endsWith('.template.json'))
), {
  betaNextWaveOpsStatus: betaNextWaveOps.status || null,
  betaAllWaveOpsStatus: betaAllWaveOps.status || null,
  betaAllWaveOpsScope: betaAllWaveOps.scope || null,
  betaAllWaveOpsRows: betaWorkRows.length,
  expectedRemainingBetaReviews: betaStatus.remaining ?? null,
  betaAllWaveOpsWaveCount: betaAllWaveOps.operatorWaveCount ?? null,
  scheduleWaveCount: betaStatus.scheduleWaveCount ?? null,
})

addCheck('public launch blocker board covers scheduled visual history work', (
  visualProgress.status === 'pass' &&
  requiredVisualRows.length === visualRemaining &&
  visualWorkRows.length >= visualRemaining &&
  visualWorkRows.every((row) => hasText(row.dueAt) && hasText(row.urlOrCommand) && hasText(row.packetOrArtifact) && hasText(row.submissionPath))
), {
  visualProgressStatus: visualProgress.status || null,
  visualRows: visualWorkRows.length,
  requiredVisualRows: requiredVisualRows.length,
  visualRemaining,
})

addCheck('public launch blocker board CSV includes every open work row', (
  rows.length > 0 &&
  rows.every((row) => csvText.includes(row.id) && csvText.includes(row.submissionPath))
), {
  rowCount: rows.length,
  csvArtifact: `qa/${csvName}`,
})

addCheck('public launch blocker board evidence paths and commands are executable', (
  rows.length > 0 &&
  missingRowEvidence.length === 0
), {
  rowEvidenceChecks,
  missingRowEvidence,
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  today: currentUtcDate(),
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  publicStatusArtifact: qaDisplayPath(publicStatusPath),
  betaNextWaveOpsArtifact: qaDisplayPath(betaNextWaveOpsPath),
  betaAllWaveOpsArtifact: qaDisplayPath(betaAllWaveOpsPath),
  visualRegisterArtifact: qaDisplayPath(visualRegisterPath),
  visualProgressArtifact: qaDisplayPath(visualProgressPath),
  jsonArtifact: `qa/${jsonName}`,
  reportArtifact: `qa/${reportName}`,
  csvArtifact: `qa/${csvName}`,
  betaReviewProgress: {
    completed: Number(betaStatus.completed) || 0,
    minimumForPublicLaunch: Number(betaStatus.minimumForPublicLaunch) || 0,
    remaining: Number(betaStatus.remaining) || 0,
    nextWave: betaStatus.nextWave || null,
    scheduleWaveCount: Number(betaStatus.scheduleWaveCount) || 0,
    allWaveCount: Number(betaAllWaveOps.operatorWaveCount) || 0,
    openRowCount: betaWorkRows.length,
  },
  productionVisualProgress: {
    distinctHistoryDateCount: Number(visualStatus.distinctHistoryDateCount) || 0,
    minimumForPublicLaunch: Number(visualStatus.minimumForPublicLaunch) || 0,
    remainingDistinctDates: visualRemaining,
    nextReviewDueAt: visualStatus.nextReviewDueAt || visualRegister.nextReviewDueAt || null,
    openRowCount: visualWorkRows.length,
    requiredRowCount: requiredVisualRows.length,
  },
  rowCount: rows.length,
  rows,
  rowEvidenceChecks,
  checks,
  failures,
}

function markdownRowDetail(row) {
  if (row.workType === 'beta-human-review') {
    return [
      `### ${row.id}: ${row.source?.messageSubject || row.id}`,
      '',
      `- Due: ${row.dueAt}`,
      `- Reviewer role: ${row.reviewerRole || 'missing'}`,
      `- Start URL: ${row.source?.startUrl || 'missing'}`,
      `- Packet: \`${row.source?.packetPath || 'missing'}\``,
      `- Template: \`${row.source?.submissionTemplatePath || 'missing'}\``,
      `- Completed evidence path: \`${row.submissionPath}\``,
      `- Validate: \`${row.validationCommand}\``,
      `- Import when clean: \`${row.importCommand}\``,
      `- Rule: ${row.evidenceRule}`,
    ].join('\n')
  }

  return [
    `### ${row.id}: ${row.status}`,
    '',
    `- Due: ${row.dueAt}`,
    `- Reviewer role: ${row.reviewerRole || 'missing'}`,
    `- Run: \`${row.urlOrCommand || 'missing'}\``,
    `- Expected artifact prefix: \`${row.packetOrArtifact || 'missing'}\``,
    `- Template: \`${row.source?.submissionTemplatePath || 'missing'}\``,
    `- Completed evidence path: \`${row.submissionPath}\``,
    `- Validate: \`${row.validationCommand}\``,
    `- Import when clean: \`${row.importCommand}\``,
    `- Routes: ${(row.source?.routes || []).join(', ') || 'missing'}`,
    `- Viewports: ${(row.source?.viewports || []).join(', ') || 'missing'}`,
    `- Diff routes: ${(row.source?.diffRoutes || []).join(', ') || 'missing'}`,
    `- Rule: ${row.evidenceRule}`,
  ].join('\n')
}

const report = `# Public Launch Blocker Board

Date: ${date}
Today: ${summary.today}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Beta reviews: ${summary.betaReviewProgress.completed}/${summary.betaReviewProgress.minimumForPublicLaunch}, ${summary.betaReviewProgress.remaining} remaining
- Beta next wave: ${summary.betaReviewProgress.nextWave?.waveId || 'none'}
- Beta rows ready across all waves: ${summary.betaReviewProgress.openRowCount}
- Beta waves covered: ${summary.betaReviewProgress.allWaveCount}/${summary.betaReviewProgress.scheduleWaveCount}
- Visual review history: ${summary.productionVisualProgress.distinctHistoryDateCount}/${summary.productionVisualProgress.minimumForPublicLaunch}, ${summary.productionVisualProgress.remainingDistinctDates} remaining
- Visual rows scheduled: ${summary.productionVisualProgress.openRowCount}
- Next visual review due: ${summary.productionVisualProgress.nextReviewDueAt || 'missing'}

## Work Rows

| Blocker | Type | ID | Due | Owner | Status | Evidence Path |
| --- | --- | --- | --- | --- | --- | --- |
${rows.map((row) => `| ${row.blockerId} | ${row.workType} | ${row.id} | ${row.dueAt} | ${row.owner} | ${row.status} | \`${row.submissionPath}\` |`).join('\n') || '| none | none | none | none | none | none | none |'}

## Next Evidence Actions

${rows.map(markdownRowDetail).join('\n\n') || '- none'}

## Operator Rules

- Beta review rows are outreach assignments, not completed review evidence.
- Production visual rows are scheduled review work, not completed visual history.
- Keep template files unchanged; completed evidence must be non-template JSON.
- Validate beta evidence with \`npm run qa:beta-review-intake\`; import only with \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\`.
- Validate visual evidence with \`npm run qa:visual-review-intake\`; import only with \`QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake\`.
- Re-run \`npm run qa:public-launch-blockers\`, \`npm run qa:public-launch-status\`, and \`npm run qa:launch-signoff\` after every import.

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}

## Launch Rule

This blocker board does not satisfy public launch by itself. Public launch still requires 25 completed beta human reviews with no unresolved P0/P1 findings and four distinct dated passing production visual-review history entries.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', jsonName), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(root, 'qa', reportName), report)
await writeFile(resolve(root, 'qa', csvName), `${csvText}\n`)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
