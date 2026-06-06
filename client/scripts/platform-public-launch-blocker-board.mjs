import { readdirSync } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate, dateOnly, daysBetween } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD_DATE || ''
const publicStatusPath = process.env.QA_PUBLIC_LAUNCH_STATUS || 'qa/public-launch-status-2026-05-21.json'
const betaNextWaveOpsPath = process.env.QA_BETA_REVIEW_NEXT_WAVE_OPS || 'qa/beta-human-review-next-wave-ops-2026-05-21.json'
const betaAllWaveOpsPath = process.env.QA_BETA_REVIEW_ALL_WAVE_OPS || 'qa/beta-human-review-all-wave-ops-2026-05-21.json'
const visualRegisterPath = process.env.QA_VISUAL_REVIEW_REGISTER || 'qa/production-visual-review-register.json'
const visualProgressPath = process.env.QA_VISUAL_REVIEW_PROGRESS ||
  latestQaArtifact(/^production-visual-review-progress-\d{4}-\d{2}-\d{2}\.json$/, 'qa/production-visual-review-progress-2026-05-21.json')

function latestQaArtifact(filePattern, fallbackPath) {
  try {
    const matches = readdirSync(resolve(root, 'qa'))
      .filter((file) => filePattern.test(file))
      .sort()
    return matches.length ? `qa/${matches.at(-1)}` : fallbackPath
  } catch {
    return fallbackPath
  }
}

function hasText(value, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
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

function plural(value, label) {
  return `${value} ${label}${Math.abs(Number(value)) === 1 ? '' : 's'}`
}

function timingLabel(targetDate, label = 'due') {
  const delta = daysBetween(today, targetDate)
  if (!Number.isFinite(delta)) return `${label} date missing`
  if (delta < 0) return `${label} overdue by ${plural(Math.abs(delta), 'day')}`
  if (delta === 0) return `${label} today`
  return `${label} in ${plural(delta, 'day')}`
}

function betaAction(row) {
  const sendDelta = daysBetween(today, row.sendBy)
  if (Number.isFinite(sendDelta) && sendDelta < 0) {
    return `${row.id} dispatch is overdue by ${plural(Math.abs(sendDelta), 'day')}; send or reassign immediately, record sent proof, then validate completed intake after the human review arrives.`
  }
  if (sendDelta === 0) {
    return `Send ${row.id} today, record sent proof, follow up by ${row.followUpAt}, then validate completed intake after the human review arrives.`
  }
  return `Send ${row.id} by ${row.sendBy}, follow up by ${row.followUpAt}, then validate completed intake after the human review arrives.`
}

function visualAction(review) {
  const dueDelta = daysBetween(today, review.dueAt)
  if (Number.isFinite(dueDelta) && dueDelta < 0) {
    return `${review.id} production visual review is overdue by ${plural(Math.abs(dueDelta), 'day')}; run the review, inspect screenshots, then validate intake.`
  }
  if (dueDelta === 0) {
    return `Run production visual review ${review.id} today, inspect screenshots, then validate intake.`
  }
  return `Run production visual review ${review.id} by ${review.dueAt}, inspect screenshots, then validate intake.`
}

function rowsToCsv(rows) {
  const headers = [
    'blockerId',
    'workType',
    'id',
    'sendBy',
    'sendTiming',
    'followUpAt',
    'followUpTiming',
    'dueAt',
    'dueTiming',
    'owner',
    'reviewerRole',
    'dispatchStatus',
    'timeboxMinutes',
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
    sendBy: row.sendBy,
    followUpAt: row.followUpAt,
    dueAt: row.dueAt,
    owner: 'Product',
    reviewerRole: row.reviewerRole || row.reviewerCohort || '',
    dispatchStatus: row.dispatchStatus || '',
    timeboxMinutes: row.timeboxMinutes ?? '',
    status: 'needs completed review submission',
    sendTiming: timingLabel(row.sendBy, 'send'),
    followUpTiming: timingLabel(row.followUpAt, 'follow-up'),
    dueTiming: timingLabel(row.dueAt, 'review'),
    action: betaAction(row),
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
      reviewerChecklist: row.reviewerChecklist || [],
      operatorChecklist: row.operatorChecklist || [],
    },
  }))
}

function visualReviewerChecklist(review, submissionPath) {
  return [
    `Run the production release command on or after ${review.dueAt}.`,
    `Review every screenshot in ${review.expectedArtifactPrefix} across ${(review.routes || []).join(', ') || 'required routes'}.`,
    `Confirm phone, tablet, laptop, desktop, and wide viewports have no horizontal overflow or overlapping controls.`,
    'Confirm primary copy, pricing CTA, auth pages, public-share map, feedback, and share controls are readable.',
    `Check stable diff routes ${(review.diffRoutes || []).join(', ') || 'landing, login, signup'} for unexplained visual drift.`,
    `Save the completed non-template JSON as ${submissionPath}.`,
  ]
}

function visualOperatorChecklist(review, templatePath, submissionPath) {
  return [
    `Assign a visual QA reviewer and record their private contact outside this repo before ${review.dueAt}.`,
    `Run ${review.command}.`,
    `Copy ${templatePath} to ${submissionPath} only after the review is actually complete.`,
    'Replace production commit and deployment placeholders with the live /api/health metadata from the reviewed run.',
    'Run npm run qa:visual-review-intake before any import.',
    'When validation is clean, run QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake.',
    'Then rerun npm run qa:visual-review-progress, npm run qa:launch-refresh, and npm run qa:launch-signoff.',
  ]
}

function visualRows(visualRegister, visualRemaining) {
  const scheduled = Array.isArray(visualRegister.scheduledPublicLaunchReviews)
    ? visualRegister.scheduledPublicLaunchReviews
    : []
  return scheduled.map((review, index) => {
    const templatePath = `qa/production-visual-review-submissions-2026-05-21/${review.id}.template.json`
    const submissionPath = `qa/production-visual-review-submissions-2026-05-21/${review.id}.json`
    return {
      blockerId: 'production-visual-review-history',
      workType: 'production-visual-review',
      id: review.id,
      sendBy: '',
      followUpAt: '',
      dueAt: review.dueAt,
      owner: review.owner || 'Product',
      reviewerRole: review.reviewerRole || 'visual QA reviewer',
      dispatchStatus: review.status || 'planned',
      timeboxMinutes: '',
      status: index < visualRemaining ? 'required for public launch history' : 'scheduled buffer review',
      sendTiming: '',
      followUpTiming: '',
      dueTiming: timingLabel(review.dueAt, 'review'),
      action: visualAction(review),
      urlOrCommand: review.command,
      packetOrArtifact: review.expectedArtifactPrefix,
      submissionPath,
      validationCommand: 'npm run qa:visual-review-intake',
      importCommand: 'QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake',
      evidenceRule: 'Counts only after production visual review evidence passes intake and is explicitly imported into reviewHistory.',
      source: {
        submissionTemplatePath: templatePath,
        routes: review.routes || [],
        viewports: review.viewports || [],
        diffRoutes: review.diffRoutes || [],
        acceptanceCriteria: review.acceptanceCriteria || '',
        reviewerChecklist: visualReviewerChecklist(review, submissionPath),
        operatorChecklist: visualOperatorChecklist(review, templatePath, submissionPath),
      },
    }
  })
}

const publicStatus = await readJson(publicStatusPath)
const betaNextWaveOps = await readJson(betaNextWaveOpsPath)
const betaAllWaveOps = await readJson(betaAllWaveOpsPath)
const visualRegister = await readJson(visualRegisterPath)
const visualProgress = await readJson(visualProgressPath)
const today = requestedDate || currentQaDate()
const date = requestedDate ||
  dateOnly(publicStatus.date) ||
  dateOnly(publicStatus.artifacts?.json) ||
  today
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
const betaRowsMissingDispatchOps = betaWorkRows.filter((row) => (
  !hasText(row.sendBy) ||
  !hasText(row.followUpAt) ||
  row.dispatchStatus !== 'prepared-not-sent' ||
  !Number.isFinite(Number(row.timeboxMinutes)) ||
  !Array.isArray(row.source?.reviewerChecklist) ||
  row.source.reviewerChecklist.length < 6 ||
  !Array.isArray(row.source?.operatorChecklist) ||
  row.source.operatorChecklist.length < 6
))
const betaRowsMissingTimingOps = betaWorkRows.filter((row) => {
  const sendDelta = daysBetween(today, row.sendBy)
  const overdueRowMissingAction = Number.isFinite(sendDelta) && sendDelta < 0 && !String(row.action || '').includes('overdue')
  return !hasText(row.sendTiming) ||
    !hasText(row.followUpTiming) ||
    !hasText(row.dueTiming) ||
    !hasText(row.action) ||
    overdueRowMissingAction
})
const visualRowsMissingReviewOps = visualWorkRows.filter((row) => (
  !Array.isArray(row.source?.reviewerChecklist) ||
  row.source.reviewerChecklist.length < 6 ||
  !Array.isArray(row.source?.operatorChecklist) ||
  row.source.operatorChecklist.length < 6 ||
  !row.source.operatorChecklist.some((item) => item.includes('qa:launch-refresh')) ||
  !row.source.operatorChecklist.some((item) => item.includes('qa:visual-review-intake'))
))
const visualRowsMissingTimingOps = visualWorkRows.filter((row) => (
  !hasText(row.dueTiming) ||
  !hasText(row.action)
))

const publicStatusGuardrailIssues = Array.isArray(publicStatus.guardrailIssues)
  ? publicStatus.guardrailIssues
  : []
const selfReferentialPublicStatusGuardrails = new Set([
  'public launch blocker board is not aligned with current beta and visual blocker evidence',
  'daily launch operator board is not aligned with current blocker evidence',
  'daily launch operator overdue rehearsal is not proving stale-date failure behavior',
  'daily launch operator sent-dispatch rehearsal is not proving sent-state behavior',
  'dispatch mark-sent dry run is not proving safe sent-state imports',
  'dispatch mark-sent import rehearsal is not proving isolated sent-state imports',
  'dispatch sent-record template is not ready for operator handoff',
  'launch outreach brief is not ready for operator handoff',
  'dispatch sent-record blank-template rejection is not proving pre-import safety',
  'review intake rehearsal is not proving incomplete evidence rejection',
  'review intake import rehearsal is not proving isolated completed-evidence imports',
  'public launch mode rehearsal is not proving strict public-blocker enforcement',
  'public launch threshold rehearsal is not proving completed-evidence readiness',
])
const hasOnlySelfReferentialPublicStatusGuardrails = publicStatusGuardrailIssues.length > 0 &&
  publicStatusGuardrailIssues.every((issue) => selfReferentialPublicStatusGuardrails.has(issue))
const acceptedBlockedStatusGuardrails = new Set([
  ...selfReferentialPublicStatusGuardrails,
  'beta human review command center is not fully prepared',
  'open accepted P2 launch risks are not aligned with current launch evidence counts',
])
const hasOnlyAcceptedBlockedStatusGuardrails = publicStatusGuardrailIssues.length > 0 &&
  publicStatusGuardrailIssues.every((issue) => acceptedBlockedStatusGuardrails.has(issue))
const expectedPublicStatusBlockerIds = []
if (Number(betaStatus.remaining || 0) > 0) {
  expectedPublicStatusBlockerIds.push('beta-human-review-threshold')
}
if (Number(visualStatus.remainingDistinctDates || 0) > 0) {
  expectedPublicStatusBlockerIds.push('production-visual-review-history')
}
const publicStatusShowsExpectedBlockers = publicStatus.publicLaunchReady === false &&
  expectedPublicStatusBlockerIds.length > 0 &&
  expectedPublicStatusBlockerIds.every((blockerId) => blockers.some((blocker) => blocker.id === blockerId))
const publicStatusReadyForBlockerBoard = (
  publicStatus.status === 'beta-ready-public-blocked' &&
  publicStatus.betaReady === true &&
  publicStatusShowsExpectedBlockers
) || (
  publicStatus.status === 'blocked' &&
  publicStatusShowsExpectedBlockers &&
  (hasOnlySelfReferentialPublicStatusGuardrails || hasOnlyAcceptedBlockedStatusGuardrails)
  ) || (
  publicStatus.status === 'blocked' &&
  publicStatusShowsExpectedBlockers &&
  !publicStatusGuardrailIssues.some((issue) => (
    issue.includes('production health') ||
    issue.includes('deployment currency') ||
    issue.includes('production is behind runtime commit')
  ))
)

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('public launch blocker board reads current blocked status', (
  publicStatusReadyForBlockerBoard
), {
  status: publicStatus.status || null,
  betaReady: publicStatus.betaReady ?? null,
  publicLaunchReady: publicStatus.publicLaunchReady ?? null,
  selfReferentialGuardrailCount: hasOnlySelfReferentialPublicStatusGuardrails ? publicStatusGuardrailIssues.length : 0,
  acceptedBlockedGuardrailCount: hasOnlyAcceptedBlockedStatusGuardrails ? publicStatusGuardrailIssues.length : 0,
  blockers,
})

addCheck('public launch blocker board covers all remaining beta review rows', (
  betaNextWaveOps.status === 'pass' &&
  betaAllWaveOps.status === 'pass' &&
  betaAllWaveOps.scope === 'all-waves' &&
  Number(betaAllWaveOps.operatorRowCount) === betaWorkRows.length &&
  betaWorkRows.length === Number(betaStatus.remaining || 0) &&
  Number(betaAllWaveOps.operatorWaveCount) >= Number(betaStatus.scheduleWaveCount || 0) &&
  betaWorkRows.every((row) => (
    hasText(row.urlOrCommand) &&
    hasText(row.packetOrArtifact) &&
    hasText(row.submissionPath) &&
    !row.submissionPath.endsWith('.template.json') &&
    hasText(row.sendBy) &&
    hasText(row.followUpAt) &&
    row.dispatchStatus === 'prepared-not-sent'
  ))
), {
  betaNextWaveOpsStatus: betaNextWaveOps.status || null,
  betaAllWaveOpsStatus: betaAllWaveOps.status || null,
  betaAllWaveOpsScope: betaAllWaveOps.scope || null,
  betaAllWaveOpsRows: betaWorkRows.length,
  expectedRemainingBetaReviews: betaStatus.remaining ?? null,
  betaAllWaveOpsWaveCount: betaAllWaveOps.operatorWaveCount ?? null,
  scheduleWaveCount: betaStatus.scheduleWaveCount ?? null,
})

addCheck('public launch blocker board exposes beta dispatch operations', (
  betaWorkRows.length > 0 &&
  betaRowsMissingDispatchOps.length === 0
), {
  rowsMissingDispatchOps: betaRowsMissingDispatchOps.map((row) => row.id || '(missing id)'),
  betaDispatchRowCount: betaWorkRows.length,
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

addCheck('public launch blocker board exposes visual review operations', (
  visualWorkRows.length > 0 &&
  visualRowsMissingReviewOps.length === 0
), {
  rowsMissingReviewOps: visualRowsMissingReviewOps.map((row) => row.id || '(missing id)'),
  visualReviewRowCount: visualWorkRows.length,
})

addCheck('public launch blocker board exposes time-aware operator actions', (
  rows.length > 0 &&
  betaRowsMissingTimingOps.length === 0 &&
  visualRowsMissingTimingOps.length === 0
), {
  betaRowsMissingTimingOps: betaRowsMissingTimingOps.map((row) => row.id || '(missing id)'),
  visualRowsMissingTimingOps: visualRowsMissingTimingOps.map((row) => row.id || '(missing id)'),
  betaOverdueActionRowCount: betaWorkRows.filter((row) => String(row.action || '').includes('overdue')).length,
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
  today,
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
      `- Dispatch status: ${row.dispatchStatus || 'missing'}`,
      `- Send by: ${row.sendBy || 'missing'}`,
      `- Send timing: ${row.sendTiming || 'missing'}`,
      `- Follow up: ${row.followUpAt || 'missing'}`,
      `- Follow-up timing: ${row.followUpTiming || 'missing'}`,
      `- Due: ${row.dueAt}`,
      `- Due timing: ${row.dueTiming || 'missing'}`,
      `- Next action: ${row.action}`,
      `- Timebox: ${row.timeboxMinutes || 'missing'} minutes`,
      `- Reviewer role: ${row.reviewerRole || 'missing'}`,
      `- Start URL: ${row.source?.startUrl || 'missing'}`,
      `- Packet: \`${row.source?.packetPath || 'missing'}\``,
      `- Template: \`${row.source?.submissionTemplatePath || 'missing'}\``,
      `- Completed evidence path: \`${row.submissionPath}\``,
      `- Validate: \`${row.validationCommand}\``,
      `- Import when clean: \`${row.importCommand}\``,
      `- Rule: ${row.evidenceRule}`,
      '',
      'Reviewer checklist:',
      markdownList(row.source?.reviewerChecklist || []),
      '',
      'Operator checklist:',
      markdownList(row.source?.operatorChecklist || []),
    ].join('\n')
  }

  return [
    `### ${row.id}: ${row.status}`,
    '',
    `- Due: ${row.dueAt}`,
    `- Due timing: ${row.dueTiming || 'missing'}`,
    `- Next action: ${row.action}`,
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
    '',
    'Reviewer checklist:',
    markdownList(row.source?.reviewerChecklist || []),
    '',
    'Operator checklist:',
    markdownList(row.source?.operatorChecklist || []),
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

| Blocker | Type | ID | Send By | Timing | Follow Up | Due | Owner | Dispatch | Status | Evidence Path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.map((row) => `| ${row.blockerId} | ${row.workType} | ${row.id} | ${row.sendBy || 'n/a'} | ${row.sendTiming || row.dueTiming || 'n/a'} | ${row.followUpAt || 'n/a'} | ${row.dueAt} | ${row.owner} | ${row.dispatchStatus || 'n/a'} | ${row.status} | \`${row.submissionPath}\` |`).join('\n') || '| none | none | none | none | none | none | none | none | none | none | none |'}

## Next Evidence Actions

${rows.map(markdownRowDetail).join('\n\n') || '- none'}

## Operator Rules

- Beta review rows are outreach assignments, not completed review evidence.
- Beta rows marked \`prepared-not-sent\` must be sent by \`sendBy\`, followed up by \`followUpAt\`, and then imported only after completed human evidence arrives.
- Production visual rows are scheduled review work, not completed visual history.
- Keep template files unchanged; completed evidence must be non-template JSON.
- Validate beta evidence with \`npm run qa:beta-review-intake\`; import only with \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\`.
- Validate visual evidence with \`npm run qa:visual-review-intake\`; import only with \`QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake\`.
- Re-run \`npm run qa:public-launch-blockers\`, \`npm run qa:launch-refresh\`, and \`npm run qa:launch-signoff\` after every import.

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
