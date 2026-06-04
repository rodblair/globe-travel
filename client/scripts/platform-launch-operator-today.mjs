import { readdirSync } from 'node:fs'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate, daysBetween, qaTimeZone, requestedOrCurrentDate } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_LAUNCH_TODAY_DATE || ''
const requestedToday = process.env.QA_LAUNCH_TODAY || ''
const publicStatusPath = process.env.QA_PUBLIC_LAUNCH_STATUS || 'qa/public-launch-status-2026-05-21.json'
const blockerBoardPath = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD || 'qa/public-launch-blocker-board-2026-05-21.json'
const betaDispatchOutboxPath = process.env.QA_BETA_REVIEW_OPERATOR_DISPATCH_OUTBOX ||
  process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX ||
  latestQaArtifact(/^beta-human-review-dispatch-outbox-all-wave-\d{4}-\d{2}-\d{2}\.json$/, 'qa/beta-human-review-dispatch-outbox-2026-05-21.json')
const betaDispatchLogPath = process.env.QA_BETA_REVIEW_OPERATOR_DISPATCH_LOG ||
  process.env.QA_BETA_REVIEW_DISPATCH_LOG ||
  latestQaArtifact(/^beta-human-review-dispatch-log-all-wave-\d{4}-\d{2}-\d{2}\.json$/, 'qa/beta-human-review-dispatch-log-2026-05-21.json')
const visualDispatchLogPath = process.env.QA_VISUAL_REVIEW_DISPATCH_LOG ||
  latestQaArtifact(/^production-visual-review-dispatch-log-\d{4}-\d{2}-\d{2}\.json$/, 'qa/production-visual-review-dispatch-log-2026-05-21.json')

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

function rowsToCsv(rows) {
  const headers = [
    'priority',
    'workType',
    'id',
    'destination',
    'owner',
    'sendBy',
    'sendTiming',
    'followUpAt',
    'followUpTiming',
    'dueAt',
    'dueTiming',
    'daysUntilDue',
    'sendStatus',
    'reviewerAlias',
    'contactRecordLocation',
    'action',
    'messageSubject',
    'messageFile',
    'startUrlOrCommand',
    'packetOrArtifact',
    'submissionPath',
    'validateCommand',
    'importCommand',
  ]
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n')
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

function timingActionPrefix(row) {
  const timing = String(timingLabel(row.sendBy, 'send'))
    .replace(/^send overdue/, 'dispatch is overdue')
    .replace(/^send today/, 'dispatch is due today')
    .replace(/^send in/, 'dispatch is due in')
  return timing ? `${row.id} ${timing}; ` : ''
}

function sentenceStart(value) {
  const text = String(value || '')
  return text ? `${text[0].toUpperCase()}${text.slice(1)}` : text
}

const publicStatus = await readJson(publicStatusPath)
const blockerBoard = await readJson(blockerBoardPath)
const betaDispatchOutbox = await readJson(betaDispatchOutboxPath)
const betaDispatchLog = await readJson(betaDispatchLogPath)
const visualDispatchLog = await readJson(visualDispatchLogPath)
const today = requestedOrCurrentDate(requestedToday)
const date = requestedDate || (requestedToday ? today : currentQaDate())
const jsonName = process.env.QA_LAUNCH_TODAY_JSON || `launch-operator-today-${date}.json`
const reportName = process.env.QA_LAUNCH_TODAY_REPORT || `launch-operator-today-${date}.md`
const csvName = process.env.QA_LAUNCH_TODAY_CSV || `launch-operator-today-${date}.csv`
const dispatchSentRecordTemplateArtifact = `qa/dispatch-sent-record-template-${date}.json`
const dispatchSentRecordTemplateReport = `qa/dispatch-sent-record-template-${date}.md`
const dispatchSentRecordTemplateCsv = `qa/dispatch-sent-record-template-${date}.csv`
const dispatchSentRecordTemplateMarkSentEnv = [
  `QA_BETA_REVIEW_DISPATCH_LOG=${qaDisplayPath(betaDispatchLogPath)}`,
  `QA_VISUAL_REVIEW_DISPATCH_LOG=${qaDisplayPath(visualDispatchLogPath)}`,
].join(' ')
const dispatchSentRecordTemplateValidationCommand =
  `${dispatchSentRecordTemplateMarkSentEnv} QA_DISPATCH_MARK_SENT_RECORD=${dispatchSentRecordTemplateCsv} npm run qa:dispatch-mark-sent`
const dispatchSentRecordTemplateImportCommand =
  `${dispatchSentRecordTemplateMarkSentEnv} QA_DISPATCH_MARK_SENT_IMPORT=1 QA_DISPATCH_MARK_SENT_RECORD=${dispatchSentRecordTemplateCsv} npm run qa:dispatch-mark-sent`
const dispatchSentRecordTemplatePostImportCommands = [
  'npm run qa:launch-refresh',
  'npm run qa:launch-signoff',
]

const allRows = Array.isArray(blockerBoard.rows) ? blockerBoard.rows : []
const betaRows = allRows.filter((row) => row.workType === 'beta-human-review')
const visualRows = allRows.filter((row) => row.workType === 'production-visual-review')
const betaMessageRows = Array.isArray(betaDispatchOutbox.messageRows) ? betaDispatchOutbox.messageRows : []
const messageById = new Map(betaMessageRows.map((row) => [row.id, row]))
const betaDispatchLogRows = Array.isArray(betaDispatchLog.dispatchRows) ? betaDispatchLog.dispatchRows : []
const visualDispatchLogRows = Array.isArray(visualDispatchLog.dispatchRows) ? visualDispatchLog.dispatchRows : []
const betaDispatchLogById = new Map(betaDispatchLogRows.map((row) => [row.id, row]))
const visualDispatchLogById = new Map(visualDispatchLogRows.map((row) => [row.id, row]))
const betaRowsPreparedForDispatch = betaRows.filter((row) => betaDispatchLogById.has(row.id) && messageById.has(row.id))
const betaRowsDeferredUntilDispatchPrepared = betaRows.filter((row) => {
  if (betaDispatchLogById.has(row.id) && messageById.has(row.id)) return false
  const sendDelta = daysBetween(today, row.sendBy)
  const followUpDelta = daysBetween(today, row.followUpAt)
  const dueDelta = daysBetween(today, row.dueAt)
  return (
    (Number.isFinite(sendDelta) && sendDelta <= 2) ||
    (Number.isFinite(followUpDelta) && followUpDelta <= 2) ||
    (Number.isFinite(dueDelta) && dueDelta <= 3)
  )
})
const deploymentCurrency = publicStatus.deploymentCurrency || {}
const deploymentRuntimeCommitShort = deploymentCurrency.latestRuntimeCommitShort || deploymentCurrency.latestRuntimeCommit
const liveDeploymentCommitShort = publicStatus.liveDeployment?.commit
  ? String(publicStatus.liveDeployment.commit).slice(0, 7)
  : 'missing'
const deploymentRuntimeBlocked = deploymentCurrency.enforced === true && (
  deploymentCurrency.runtimeCommitAhead === true ||
  hasText(deploymentCurrency.error)
)

function rowIsSent(row) {
  return row?.sendStatus === 'sent'
}

function preparedDueTodayRows(rows, dateField = 'expectedSendBy') {
  return rows.filter((row) => !rowIsSent(row) && daysBetween(today, row[dateField]) === 0)
}

function preparedOverdueRows(rows, dateField = 'expectedSendBy') {
  return rows.filter((row) => {
    const delta = daysBetween(today, row[dateField])
    return !rowIsSent(row) && Number.isFinite(delta) && delta < 0
  })
}

function preparedDueSoonRows(rows, dateField = 'dueAt', windowDays = 7) {
  return rows.filter((row) => {
    const delta = daysBetween(today, row[dateField])
    return !rowIsSent(row) && Number.isFinite(delta) && delta >= 0 && delta <= windowDays
  })
}

function betaActionRow(row, priority, action) {
  const message = messageById.get(row.id) || {}
  const dispatchLog = betaDispatchLogById.get(row.id) || {}
  return {
    priority,
    workType: row.workType,
    id: row.id,
    destination: message.destination || row.source?.messageSubject?.replace(/^\[Globe\.travel beta\]\s*/, '') || '',
    owner: row.owner || 'Product',
    sendBy: row.sendBy,
    sendTiming: timingLabel(row.sendBy, 'send'),
    followUpAt: row.followUpAt,
    followUpTiming: timingLabel(row.followUpAt, 'follow-up'),
    dueAt: row.dueAt,
    dueTiming: timingLabel(row.dueAt, 'review'),
    daysUntilDue: daysBetween(today, row.dueAt),
    sendStatus: dispatchLog.sendStatus || row.dispatchStatus || '',
    reviewerAlias: dispatchLog.reviewerAlias || '',
    contactRecordLocation: dispatchLog.contactRecordLocation || '',
    action,
    messageFile: message.messageFile || '',
    startUrlOrCommand: row.source?.startUrl || row.urlOrCommand || '',
    packetOrArtifact: row.packetOrArtifact || '',
    submissionPath: row.submissionPath || '',
    validateCommand: row.validationCommand || 'npm run qa:beta-review-intake',
    importCommand: row.importCommand || 'QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake',
    reviewerRole: row.reviewerRole || message.reviewerRole || '',
    messageSubject: message.messageSubject || row.source?.messageSubject || '',
  }
}

function visualActionRow(row, priority, action) {
  const dispatchLog = visualDispatchLogById.get(row.id) || {}
  return {
    priority,
    workType: row.workType,
    id: row.id,
    destination: 'Production visual review',
    owner: row.owner || 'Product',
    sendBy: '',
    sendTiming: '',
    followUpAt: '',
    followUpTiming: '',
    dueAt: row.dueAt,
    dueTiming: timingLabel(row.dueAt, 'review'),
    daysUntilDue: daysBetween(today, row.dueAt),
    sendStatus: dispatchLog.sendStatus || '',
    reviewerAlias: dispatchLog.reviewerAlias || '',
    contactRecordLocation: dispatchLog.contactRecordLocation || '',
    action,
    messageFile: dispatchLog.messageFile || '',
    startUrlOrCommand: dispatchLog.command || row.urlOrCommand || '',
    packetOrArtifact: dispatchLog.expectedArtifactPrefix || row.packetOrArtifact || '',
    submissionPath: dispatchLog.completedSubmissionPath || row.submissionPath || '',
    validateCommand: row.validationCommand || 'npm run qa:visual-review-intake',
    importCommand: row.importCommand || 'QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake',
    reviewerRole: dispatchLog.reviewerRole || row.reviewerRole || '',
    messageSubject: dispatchLog.messageSubject || row.source?.messageSubject || row.id,
  }
}

function deploymentActionRow() {
  const action = deploymentCurrency.runtimeCommitAhead === true
    ? `Deploy runtime commit ${deploymentRuntimeCommitShort} to production, then rerun launch gates.`
    : `Resolve deployment-currency verification before relying on launch status: ${deploymentCurrency.error}`
  return {
    priority: 'P0',
    workType: 'production-runtime-deployment',
    id: 'production-runtime-deployment-currency',
    destination: 'Vercel production',
    owner: 'Release',
    sendBy: today,
    sendTiming: 'deploy today',
    followUpAt: today,
    followUpTiming: 'verify today',
    dueAt: today,
    dueTiming: 'deployment today',
    daysUntilDue: 0,
    sendStatus: deploymentCurrency.runtimeCommitAhead === true ? `production-on-${liveDeploymentCommitShort}` : 'verification-blocked',
    reviewerAlias: '',
    contactRecordLocation: '',
    action,
    messageFile: '',
    startUrlOrCommand: 'vercel deploy --prod --yes',
    packetOrArtifact: publicStatus.artifacts?.json || qaDisplayPath(publicStatusPath),
    submissionPath: '',
    validateCommand: 'npm run qa:launch-refresh',
    importCommand: 'npm run qa:launch-signoff',
    reviewerRole: '',
    messageSubject: 'Production runtime deployment currency',
  }
}

const betaDispatchDueToday = betaRowsPreparedForDispatch
  .filter((row) => daysBetween(today, row.sendBy) === 0 && !rowIsSent(betaDispatchLogById.get(row.id)))
  .map((row) => betaActionRow(row, 'P0', `${timingActionPrefix(row)}send beta review invite today and record sent proof.`))
const betaDispatchDueSoon = betaRowsPreparedForDispatch
  .filter((row) => {
    const delta = daysBetween(today, row.sendBy)
    return Number.isFinite(delta) && delta > 0 && delta <= 2 && !rowIsSent(betaDispatchLogById.get(row.id))
  })
  .map((row) => betaActionRow(row, 'P1', `${timingActionPrefix(row)}send beta review invite before the deadline and record sent proof.`))
const betaDispatchOverdue = betaRowsPreparedForDispatch
  .filter((row) => Number.isFinite(daysBetween(today, row.sendBy)) && daysBetween(today, row.sendBy) < 0 && !rowIsSent(betaDispatchLogById.get(row.id)))
  .map((row) => betaActionRow(row, 'P0', `${timingActionPrefix(row)}send invite immediately or reassign, then record sent proof.`))
const betaFollowUpsDueSoon = betaRowsPreparedForDispatch
  .filter((row) => {
    const delta = daysBetween(today, row.followUpAt)
    return Number.isFinite(delta) && delta <= 2 && !rowIsSent(betaDispatchLogById.get(row.id))
  })
  .map((row) => betaActionRow(row, 'P1', `${sentenceStart(timingLabel(row.followUpAt, 'follow-up'))}; draft the follow-up, but do not send it until the initial invite is recorded as sent.`))
const betaReviewsDueSoon = betaRowsPreparedForDispatch
  .filter((row) => {
    const delta = daysBetween(today, row.dueAt)
    return Number.isFinite(delta) && delta <= 3 && !rowIsSent(betaDispatchLogById.get(row.id))
  })
  .map((row) => betaActionRow(row, 'P1', `${sentenceStart(timingLabel(row.dueAt, 'review'))}; track completed reviewer JSON and intake readiness.`))
const visualDueSoon = visualRows
  .filter((row) => {
    const delta = daysBetween(today, row.dueAt)
    return row.status === 'required for public launch history' && Number.isFinite(delta) && delta >= 0 && delta <= 7 && !rowIsSent(visualDispatchLogById.get(row.id))
  })
  .map((row) => visualActionRow(row, 'P1', `${sentenceStart(timingLabel(row.dueAt, 'review'))}; send visual-review assignment or confirm scheduled reviewer time.`))
const visualOverdue = visualRows
  .filter((row) => {
    const delta = daysBetween(today, row.dueAt)
    return row.status === 'required for public launch history' && Number.isFinite(delta) && delta < 0 && !rowIsSent(visualDispatchLogById.get(row.id))
  })
  .map((row) => visualActionRow(row, 'P0', `${sentenceStart(timingLabel(row.dueAt, 'review'))}; run production visual review and import evidence.`))

const betaDispatchLogDueTodayRows = preparedDueTodayRows(betaDispatchLogRows)
const betaDispatchLogOverdueRows = preparedOverdueRows(betaDispatchLogRows)
const betaDispatchLogDueSoonRows = preparedDueSoonRows(betaDispatchLogRows, 'expectedSendBy', 2)
const visualDispatchLogDueSoonRows = preparedDueSoonRows(visualDispatchLogRows)
const visualDispatchLogOverdueRows = preparedOverdueRows(visualDispatchLogRows, 'dueAt')

const betaActionById = new Map()
function upsertBetaAction(row) {
  const existing = betaActionById.get(row.id)
  if (!existing) {
    betaActionById.set(row.id, row)
    return
  }
  const priorityRank = { P0: 0, P1: 1, P2: 2, P3: 3 }
  existing.priority = priorityRank[row.priority] < priorityRank[existing.priority] ? row.priority : existing.priority
  existing.action = Array.from(new Set([existing.action, row.action])).join(' ')
}
for (const row of [...betaDispatchOverdue, ...betaDispatchDueToday, ...betaDispatchDueSoon, ...betaFollowUpsDueSoon, ...betaReviewsDueSoon]) {
  upsertBetaAction(row)
}
const uniquePriorityRows = [
  ...(deploymentRuntimeBlocked ? [deploymentActionRow()] : []),
  ...betaActionById.values(),
  ...visualOverdue,
  ...visualDueSoon,
]
const betaFollowUpsBlockedUntilInitialSend = betaFollowUpsDueSoon.filter((row) => !rowIsSent(betaDispatchLogById.get(row.id)))
const operatorHandoffRows = uniquePriorityRows
  .filter((row) => row.workType === 'beta-human-review' || row.workType === 'production-visual-review')
  .map((row) => ({
    id: row.id,
    priority: row.priority,
    workType: row.workType,
    messageSubject: row.messageSubject,
    messageFile: row.messageFile,
    evidencePath: row.submissionPath,
    sendTiming: row.sendTiming || row.dueTiming || '',
    sendStatus: row.sendStatus || 'prepared-not-sent',
  }))
const rowsMissingTiming = uniquePriorityRows.filter((row) => (
  row.workType !== 'production-runtime-deployment' &&
  !hasText(row.sendTiming || row.dueTiming)
))
const overdueRowsMissingExplicitAction = uniquePriorityRows.filter((row) => (
  String(row.sendTiming || row.dueTiming || '').includes('overdue') &&
  !String(row.action || '').includes('overdue')
))

const messageFileChecks = await Promise.all(uniquePriorityRows
  .filter((row) => row.workType === 'beta-human-review')
  .map(async (row) => ({
    id: row.id,
    messageFile: row.messageFile,
    exists: hasText(row.messageFile) ? await fileExists(row.messageFile) : false,
  })))
const missingMessageFiles = messageFileChecks.filter((check) => !check.exists)
const visualMessageFileChecks = await Promise.all(uniquePriorityRows
  .filter((row) => row.workType === 'production-visual-review')
  .map(async (row) => ({
    id: row.id,
    messageFile: row.messageFile,
    exists: hasText(row.messageFile) ? await fileExists(row.messageFile) : false,
  })))
const missingVisualMessageFiles = visualMessageFileChecks.filter((check) => !check.exists)
const visualActionContextIssues = uniquePriorityRows
  .filter((row) => row.workType === 'production-visual-review')
  .flatMap((row) => {
    const dispatchLog = visualDispatchLogById.get(row.id)
    if (!dispatchLog) return [`${row.id} is missing from the visual dispatch log`]

    const issues = []
    const expectedFields = [
      ['messageFile', dispatchLog.messageFile],
      ['messageSubject', dispatchLog.messageSubject],
      ['startUrlOrCommand', dispatchLog.command],
      ['packetOrArtifact', dispatchLog.expectedArtifactPrefix],
      ['submissionPath', dispatchLog.completedSubmissionPath],
      ['reviewerRole', dispatchLog.reviewerRole],
    ]

    for (const [field, expectedValue] of expectedFields) {
      if (hasText(expectedValue) && row[field] !== expectedValue) {
        issues.push(`${row.id} ${field} does not match the visual dispatch log`)
      }
    }

    return issues
  })

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

const publicGuardrailIssues = Array.isArray(publicStatus.guardrailIssues) ? publicStatus.guardrailIssues : []
const launchOperatorSelfGuardrailIssues = new Set([
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
const onlyLaunchOperatorSelfGuardrails =
  publicGuardrailIssues.length > 0 &&
  publicGuardrailIssues.every((issue) => launchOperatorSelfGuardrailIssues.has(issue))
const launchOperatorAcceptedExternalGuardrailIssues = new Set([
  'beta human review command center is not fully prepared',
])
const onlyLaunchOperatorAcceptedExternalGuardrails =
  publicGuardrailIssues.length > 0 &&
  publicGuardrailIssues.every((issue) => (
    launchOperatorSelfGuardrailIssues.has(issue) ||
    launchOperatorAcceptedExternalGuardrailIssues.has(issue)
  ))
const releaseStatusIsActionable = (
  publicStatus.status === 'beta-ready-public-blocked' &&
  publicStatus.betaReady === true &&
  publicStatus.publicLaunchReady === false
) || (
  publicStatus.status === 'blocked' &&
  publicStatus.publicLaunchReady === false &&
  deploymentRuntimeBlocked
) || (
  publicStatus.status === 'blocked' &&
  publicStatus.publicLaunchReady === false &&
  !deploymentRuntimeBlocked &&
  (onlyLaunchOperatorSelfGuardrails || onlyLaunchOperatorAcceptedExternalGuardrails)
)
addCheck('launch today reads current blocked release status', releaseStatusIsActionable, {
  status: publicStatus.status || null,
  betaReady: publicStatus.betaReady ?? null,
  publicLaunchReady: publicStatus.publicLaunchReady ?? null,
  deploymentRuntimeBlocked,
  deploymentCurrencyError: deploymentCurrency.error || null,
  latestRuntimeCommit: deploymentRuntimeCommitShort || null,
  guardrailIssues: publicGuardrailIssues,
  onlyLaunchOperatorSelfGuardrails,
  onlyLaunchOperatorAcceptedExternalGuardrails,
})

addCheck('launch today has actionable deployment, beta, or visual work', uniquePriorityRows.length > 0, {
  actionRowCount: uniquePriorityRows.length,
})

addCheck('launch today exposes runtime deployment blocker when production is behind', (
  !deploymentRuntimeBlocked ||
  uniquePriorityRows.some((row) => row.id === 'production-runtime-deployment-currency')
), {
  deploymentRuntimeBlocked,
  latestRuntimeCommit: deploymentRuntimeCommitShort || null,
  liveCommit: publicStatus.liveDeployment?.commit || null,
})

addCheck('launch today reads aligned dispatch logs', (
  betaDispatchLog.status === 'pass' &&
  visualDispatchLog.status === 'pass' &&
  Number(betaDispatchLog.dispatchRowCount) === betaDispatchLogRows.length &&
  Number(visualDispatchLog.dispatchRowCount) === visualDispatchLogRows.length
), {
  betaDispatchLogArtifact: qaDisplayPath(betaDispatchLogPath),
  betaDispatchLogStatus: betaDispatchLog.status || null,
  betaDispatchLogRowCount: betaDispatchLog.dispatchRowCount ?? null,
  visualDispatchLogArtifact: qaDisplayPath(visualDispatchLogPath),
  visualDispatchLogStatus: visualDispatchLog.status || null,
  visualDispatchLogRowCount: visualDispatchLog.dispatchRowCount ?? null,
})

addCheck('launch today beta actions are backed by prepared dispatch packets', (
  uniquePriorityRows
    .filter((row) => row.workType === 'beta-human-review')
    .every((row) => betaDispatchLogById.has(row.id) && messageById.has(row.id))
), {
  betaPreparedDispatchRowCount: betaRowsPreparedForDispatch.length,
  deferredBetaRows: betaRowsDeferredUntilDispatchPrepared.map((row) => row.id),
  betaActionRowsMissingDispatchPacket: uniquePriorityRows
    .filter((row) => row.workType === 'beta-human-review')
    .filter((row) => !betaDispatchLogById.has(row.id) || !messageById.has(row.id))
    .map((row) => row.id),
})

addCheck('launch today beta actions have message files', missingMessageFiles.length === 0, {
  missingMessageFiles: missingMessageFiles.map((row) => row.id),
})

addCheck('launch today visual actions have message files', missingVisualMessageFiles.length === 0, {
  missingVisualMessageFiles: missingVisualMessageFiles.map((row) => row.id),
})

addCheck('launch today visual actions preserve dispatch context', visualActionContextIssues.length === 0, {
  visualActionContextIssues,
})

addCheck('launch today send actions match dispatch logs', (
  betaDispatchDueToday.length === betaDispatchLogDueTodayRows.length &&
  betaDispatchOverdue.length === betaDispatchLogOverdueRows.length &&
  betaDispatchDueSoon.length === betaDispatchLogDueSoonRows.length &&
  visualDueSoon.length === visualDispatchLogDueSoonRows.filter((row) => row.requiredForPublicLaunch).length &&
  visualOverdue.length === visualDispatchLogOverdueRows.filter((row) => row.requiredForPublicLaunch).length
), {
  betaDispatchDueToday: betaDispatchDueToday.map((row) => row.id),
  betaDispatchLogDueToday: betaDispatchLogDueTodayRows.map((row) => row.id),
  betaDispatchOverdue: betaDispatchOverdue.map((row) => row.id),
  betaDispatchLogOverdue: betaDispatchLogOverdueRows.map((row) => row.id),
  betaDispatchDueSoon: betaDispatchDueSoon.map((row) => row.id),
  betaDispatchLogDueSoon: betaDispatchLogDueSoonRows.map((row) => row.id),
  visualDueSoon: visualDueSoon.map((row) => row.id),
  visualDispatchLogDueSoon: visualDispatchLogDueSoonRows.filter((row) => row.requiredForPublicLaunch).map((row) => row.id),
  visualOverdue: visualOverdue.map((row) => row.id),
  visualDispatchLogOverdue: visualDispatchLogOverdueRows.filter((row) => row.requiredForPublicLaunch).map((row) => row.id),
})

addCheck('launch today exposes time-aware execution actions', (
  uniquePriorityRows.length > 0 &&
  rowsMissingTiming.length === 0 &&
  overdueRowsMissingExplicitAction.length === 0
), {
  rowsMissingTiming: rowsMissingTiming.map((row) => row.id),
  overdueRowsMissingExplicitAction: overdueRowsMissingExplicitAction.map((row) => row.id),
  timedActionRowCount: uniquePriorityRows.filter((row) => hasText(row.sendTiming || row.dueTiming)).length,
})

addCheck('launch today exposes exact sent-record handoff commands', (
  hasText(dispatchSentRecordTemplateCsv) &&
  dispatchSentRecordTemplateValidationCommand.includes(dispatchSentRecordTemplateCsv) &&
  dispatchSentRecordTemplateValidationCommand.includes('qa:dispatch-mark-sent') &&
  dispatchSentRecordTemplateImportCommand.includes('QA_DISPATCH_MARK_SENT_IMPORT=1') &&
  dispatchSentRecordTemplateImportCommand.includes(dispatchSentRecordTemplateCsv) &&
  dispatchSentRecordTemplatePostImportCommands.includes('npm run qa:launch-refresh') &&
  dispatchSentRecordTemplatePostImportCommands.includes('npm run qa:launch-signoff')
), {
  dispatchSentRecordTemplateArtifact,
  dispatchSentRecordTemplateReport,
  dispatchSentRecordTemplateCsv,
  dispatchSentRecordTemplateValidationCommand,
  dispatchSentRecordTemplateImportCommand,
  dispatchSentRecordTemplatePostImportCommands,
})

addCheck('launch today exposes a complete operator handoff summary', (
  operatorHandoffRows.length === uniquePriorityRows.filter((row) => (
    row.workType === 'beta-human-review' || row.workType === 'production-visual-review'
  )).length &&
  operatorHandoffRows.every((row) => (
    hasText(row.id) &&
    hasText(row.priority) &&
    hasText(row.messageSubject) &&
    hasText(row.messageFile) &&
    hasText(row.evidencePath) &&
    hasText(row.sendTiming) &&
    hasText(row.sendStatus)
  )) &&
  hasText(dispatchSentRecordTemplateCsv) &&
  hasText(dispatchSentRecordTemplateValidationCommand) &&
  hasText(dispatchSentRecordTemplateImportCommand) &&
  dispatchSentRecordTemplatePostImportCommands.length >= 2
), {
  handoffRowCount: operatorHandoffRows.length,
  missingHandoffFields: operatorHandoffRows
    .filter((row) => !hasText(row.id) || !hasText(row.priority) || !hasText(row.messageSubject) || !hasText(row.messageFile) || !hasText(row.evidencePath) || !hasText(row.sendTiming) || !hasText(row.sendStatus))
    .map((row) => row.id || 'unknown'),
  sentRecordTemplateCsv: dispatchSentRecordTemplateCsv,
  validationCommand: dispatchSentRecordTemplateValidationCommand,
  importCommand: dispatchSentRecordTemplateImportCommand,
  postImportCommands: dispatchSentRecordTemplatePostImportCommands,
})

addCheck('launch today keeps beta follow-ups gated by initial sent proof', (
  betaFollowUpsBlockedUntilInitialSend.length === betaFollowUpsDueSoon.length &&
  betaFollowUpsBlockedUntilInitialSend.every((row) => String(row.action || '').includes('do not send it until the initial invite is recorded as sent'))
), {
  followUpsDueSoon: betaFollowUpsDueSoon.map((row) => row.id),
  blockedUntilInitialSend: betaFollowUpsBlockedUntilInitialSend.map((row) => row.id),
  rowsMissingBlockedCopy: betaFollowUpsBlockedUntilInitialSend
    .filter((row) => !String(row.action || '').includes('do not send it until the initial invite is recorded as sent'))
    .map((row) => row.id),
})

addCheck('launch today has no overdue launch execution rows', (
  betaDispatchOverdue.length === 0 &&
  visualOverdue.length === 0
), {
  betaDispatchOverdue: betaDispatchOverdue.map((row) => row.id),
  visualOverdue: visualOverdue.map((row) => row.id),
})

const failures = checks.filter((check) => !check.ok)
const executionOrder = [
  `Send every P0/P1 message file in the Send Packet Index; ${plural(betaDispatchOverdue.length, 'beta invite')} overdue, ${plural(betaDispatchDueToday.length, 'beta invite')} due today, ${plural(betaDispatchDueSoon.length, 'beta invite')} due soon, and ${plural(visualDueSoon.length, 'production visual review')} due soon.`,
  `Record each real send in \`${dispatchSentRecordTemplateCsv}\` with reviewer alias, delivery channel, sent timestamp, and external contact/proof location.`,
  `Validate the filled sent-record CSV with \`${dispatchSentRecordTemplateValidationCommand}\`.`,
  `Import the sent state with \`${dispatchSentRecordTemplateImportCommand}\` only after validation passes.`,
  `Refresh launch evidence with \`${dispatchSentRecordTemplatePostImportCommands.join('` and `')}\`.`,
  'Collect completed non-template beta and visual review JSON, validate intake, import only after clean validation, then rerun launch gates.',
]
const summary = {
  date,
  today,
  timeZone: qaTimeZone,
  generatedAt: new Date().toISOString(),
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  publicStatusArtifact: qaDisplayPath(publicStatusPath),
  blockerBoardArtifact: qaDisplayPath(blockerBoardPath),
  betaDispatchOutboxArtifact: qaDisplayPath(betaDispatchOutboxPath),
  betaDispatchLogArtifact: qaDisplayPath(betaDispatchLogPath),
  visualDispatchLogArtifact: qaDisplayPath(visualDispatchLogPath),
  dispatchSentRecordTemplateArtifact,
  dispatchSentRecordTemplateReport,
  dispatchSentRecordTemplateCsv,
  dispatchSentRecordTemplateValidationCommand,
  dispatchSentRecordTemplateImportCommand,
  dispatchSentRecordTemplatePostImportCommands,
  deploymentRuntimeBlocked,
  deploymentRuntimeCommit: deploymentCurrency.latestRuntimeCommit || null,
  deploymentRuntimeCommitShort: deploymentRuntimeCommitShort || null,
  liveDeploymentCommit: publicStatus.liveDeployment?.commit || null,
  publicLaunchStatus: publicStatus.status || null,
  publicGuardrailIssues,
  publicOnlyLaunchOperatorSelfGuardrails: onlyLaunchOperatorSelfGuardrails,
  betaReviews: publicStatus.betaHumanReviews
    ? {
        completed: publicStatus.betaHumanReviews.completed,
        minimumForPublicLaunch: publicStatus.betaHumanReviews.minimumForPublicLaunch,
        remaining: publicStatus.betaHumanReviews.remaining,
      }
    : null,
  productionVisualReviews: publicStatus.productionVisualReviews
    ? {
        distinctHistoryDateCount: publicStatus.productionVisualReviews.distinctHistoryDateCount,
        minimumForPublicLaunch: publicStatus.productionVisualReviews.minimumForPublicLaunch,
        remainingDistinctDates: publicStatus.productionVisualReviews.remainingDistinctDates,
        nextReviewDueAt: publicStatus.productionVisualReviews.nextReviewDueAt,
      }
    : null,
  betaPreparedDispatchRowCount: betaRowsPreparedForDispatch.length,
  betaDeferredUntilDispatchPreparedCount: betaRowsDeferredUntilDispatchPrepared.length,
  betaDeferredUntilDispatchPreparedIds: betaRowsDeferredUntilDispatchPrepared.map((row) => row.id),
  betaDispatchDueTodayCount: betaDispatchDueToday.length,
  betaDispatchDueSoonCount: betaDispatchDueSoon.length,
  betaDispatchOverdueCount: betaDispatchOverdue.length,
  betaDispatchLogPreparedDueTodayCount: betaDispatchLogDueTodayRows.length,
  betaDispatchLogPreparedDueSoonCount: betaDispatchLogDueSoonRows.length,
  betaDispatchLogPreparedOverdueCount: betaDispatchLogOverdueRows.length,
  betaDispatchLogPreparedNotSentCount: betaDispatchLogRows.filter((row) => !rowIsSent(row)).length,
  betaDispatchLogSentCount: betaDispatchLogRows.filter((row) => rowIsSent(row)).length,
  betaFollowUpsDueSoonCount: betaFollowUpsDueSoon.length,
  betaFollowUpsBlockedUntilInitialSendCount: betaFollowUpsBlockedUntilInitialSend.length,
  betaReviewsDueSoonCount: betaReviewsDueSoon.length,
  visualDueSoonCount: visualDueSoon.length,
  visualOverdueCount: visualOverdue.length,
  visualDispatchLogPreparedDueSoonCount: visualDispatchLogDueSoonRows.filter((row) => row.requiredForPublicLaunch).length,
  visualDispatchLogPreparedOverdueCount: visualDispatchLogOverdueRows.filter((row) => row.requiredForPublicLaunch).length,
  visualDispatchLogRequiredPreparedNotSentCount: visualDispatchLogRows.filter((row) => !rowIsSent(row) && row.requiredForPublicLaunch).length,
  visualDispatchLogSentCount: visualDispatchLogRows.filter((row) => rowIsSent(row)).length,
  deploymentActionCount: deploymentRuntimeBlocked ? 1 : 0,
  operatorHandoff: {
    immediateExternalAction: betaDispatchOverdue.length > 0
      ? `Send or reassign ${plural(betaDispatchOverdue.length, 'overdue beta invite')} now${betaDispatchDueToday.length > 0 ? `, send ${plural(betaDispatchDueToday.length, 'beta invite')} due today` : ''}${betaDispatchDueSoon.length > 0 ? `, and prepare ${plural(betaDispatchDueSoon.length, 'beta invite')} due soon` : ''}.`
      : visualOverdue.length > 0
        ? `Run or reassign ${plural(visualOverdue.length, 'overdue production visual review')} now.`
        : betaDispatchDueToday.length > 0
          ? `Send ${plural(betaDispatchDueToday.length, 'beta invite')} due today${betaDispatchDueSoon.length > 0 ? `, and prepare ${plural(betaDispatchDueSoon.length, 'beta invite')} due soon` : ''}.`
          : betaDispatchDueSoon.length > 0
            ? `Prepare ${plural(betaDispatchDueSoon.length, 'beta invite')} due soon.`
          : visualDueSoon.length > 0
            ? `Confirm ${plural(visualDueSoon.length, 'due-soon production visual review')} before the due date.`
            : 'No overdue external launch action is currently queued.',
    overdueBetaInviteIds: betaDispatchOverdue.map((row) => row.id),
    dueTodayBetaInviteIds: betaDispatchDueToday.map((row) => row.id),
    dueSoonBetaInviteIds: betaDispatchDueSoon.map((row) => row.id),
    dueSoonVisualReviewIds: visualDueSoon.map((row) => row.id),
    followUpsBlockedUntilInitialSendIds: betaFollowUpsBlockedUntilInitialSend.map((row) => row.id),
    deferredBetaInviteIds: betaRowsDeferredUntilDispatchPrepared.map((row) => row.id),
    rows: operatorHandoffRows,
    sentRecordTemplateCsv: dispatchSentRecordTemplateCsv,
    validationCommand: dispatchSentRecordTemplateValidationCommand,
    importCommand: dispatchSentRecordTemplateImportCommand,
    postImportCommands: dispatchSentRecordTemplatePostImportCommands,
    privacyRule: 'Keep reviewer names and contact details in the external contact system; store only aliases and proof pointers in repo evidence.',
    completionRule: 'Sent proof is not completed review evidence. Public launch still requires completed beta and visual-review JSON intake imports.',
  },
  actionRows: uniquePriorityRows,
  messageFileChecks,
  visualMessageFileChecks,
  visualActionContextIssues,
  executionOrder,
  checks,
  failures,
  jsonArtifact: `qa/${jsonName}`,
  reportArtifact: `qa/${reportName}`,
  csvArtifact: `qa/${csvName}`,
}

function actionRowsTable(rows) {
  if (!rows.length) return '| none | none | none | none | none | none | none | none | none | none | none |\n'
  return rows.map((row) => `| ${row.priority} | ${row.workType} | ${row.id} | ${row.sendBy || 'n/a'} | ${row.sendTiming || row.dueTiming || 'n/a'} | ${row.dueAt || 'n/a'} | ${row.sendStatus || 'n/a'} | ${row.action} | ${row.messageSubject || 'n/a'} | \`${row.messageFile || row.startUrlOrCommand || 'n/a'}\` | \`${row.submissionPath || 'n/a'}\` |`).join('\n')
}

function sendPacketRowsTable(rows) {
  const sendRows = rows.filter((row) => (
    (row.workType === 'beta-human-review' || row.workType === 'production-visual-review') &&
    hasText(row.messageFile)
  ))
  if (!sendRows.length) return '| none | none | none | none | none | none |\n'
  return sendRows.map((row) => `| ${row.priority} | ${row.id} | ${row.workType} | ${row.messageSubject || 'n/a'} | \`${row.messageFile}\` | \`${row.submissionPath || 'n/a'}\` |`).join('\n')
}

const report = `# Launch Operator Today

Date: ${date}
Today: ${today}
Time zone: ${summary.timeZone}
Generated at: ${summary.generatedAt}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Public launch status: ${summary.publicLaunchStatus}
- Runtime deployment current: ${summary.deploymentRuntimeBlocked ? `no, ${summary.deploymentRuntimeCommitShort || 'latest runtime'} is waiting for production` : 'yes'}
- Beta reviews: ${summary.betaReviews?.completed ?? 0}/${summary.betaReviews?.minimumForPublicLaunch ?? 0}, ${summary.betaReviews?.remaining ?? 0} remaining
- Production visual-review history: ${summary.productionVisualReviews?.distinctHistoryDateCount ?? 0}/${summary.productionVisualReviews?.minimumForPublicLaunch ?? 0}, ${summary.productionVisualReviews?.remainingDistinctDates ?? 0} remaining
- Beta prepared dispatch rows: ${summary.betaPreparedDispatchRowCount}
- Beta rows deferred until current dispatch packet/log advances: ${summary.betaDeferredUntilDispatchPreparedCount}
- Beta invites due today: ${summary.betaDispatchDueTodayCount}
- Beta invites due soon: ${summary.betaDispatchDueSoonCount}
- Beta invite send log: ${summary.betaDispatchLogSentCount} sent, ${summary.betaDispatchLogPreparedNotSentCount} prepared not sent
- Beta follow-ups due soon: ${summary.betaFollowUpsDueSoonCount}
- Beta follow-ups blocked until initial sent proof: ${summary.betaFollowUpsBlockedUntilInitialSendCount}
- Beta review submissions due soon: ${summary.betaReviewsDueSoonCount}
- Required production visual reviews due soon: ${summary.visualDueSoonCount}
- Production visual send log: ${summary.visualDispatchLogSentCount} sent, ${summary.visualDispatchLogRequiredPreparedNotSentCount} required prepared not sent
- Runtime deployment actions: ${summary.deploymentActionCount}
- Overdue launch execution rows: ${summary.betaDispatchOverdueCount + summary.visualOverdueCount}

## Operator Handoff

- Immediate action: ${summary.operatorHandoff.immediateExternalAction}
- Overdue beta invite IDs: ${summary.operatorHandoff.overdueBetaInviteIds.join(', ') || 'none'}
- Beta invite IDs due today: ${summary.operatorHandoff.dueTodayBetaInviteIds.join(', ') || 'none'}
- Beta invite IDs due soon: ${summary.operatorHandoff.dueSoonBetaInviteIds.join(', ') || 'none'}
- Due-soon production visual-review IDs: ${summary.operatorHandoff.dueSoonVisualReviewIds.join(', ') || 'none'}
- Follow-ups blocked until initial sent proof: ${summary.operatorHandoff.followUpsBlockedUntilInitialSendIds.join(', ') || 'none'}
- Deferred beta invite IDs: ${summary.operatorHandoff.deferredBetaInviteIds.join(', ') || 'none'}
- Sent-record CSV: \`${summary.operatorHandoff.sentRecordTemplateCsv}\`
- Validate sent proof: \`${summary.operatorHandoff.validationCommand}\`
- Import sent proof: \`${summary.operatorHandoff.importCommand}\`
- Refresh after import: \`${summary.operatorHandoff.postImportCommands.join('` and `')}\`
- Privacy rule: ${summary.operatorHandoff.privacyRule}
- Completion rule: ${summary.operatorHandoff.completionRule}

## Execution Order

${executionOrder.map((item, index) => `${index + 1}. ${item}`).join('\n')}

## Send Packet Index

| Priority | ID | Type | Subject | Message File | Evidence Path |
| --- | --- | --- | --- | --- | --- |
${sendPacketRowsTable(uniquePriorityRows)}

## Do Today

| Priority | Type | ID | Send By | Timing | Due | Send Status | Action | Subject | Source | Evidence Path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${actionRowsTable(uniquePriorityRows)}

## Operating Rules

- Send beta invite messages from the listed message files; do not treat sent messages as completed review evidence.
- Do not send deferred beta rows until their dispatch packet and dispatch-log row are prepared; send or reassign the current prepared rows first.
- Record reviewer names and contact details outside the repo.
- Fill the generated sent-record template after real outreach: \`${dispatchSentRecordTemplateCsv}\` (report: \`${dispatchSentRecordTemplateReport}\`, JSON: \`${dispatchSentRecordTemplateArtifact}\`).
- Validate the filled sent-state update with \`${dispatchSentRecordTemplateValidationCommand}\`, then import it with \`${dispatchSentRecordTemplateImportCommand}\`.
- Completed beta reviews must be non-template JSON files, validated with \`npm run qa:beta-review-intake\`, then imported only with \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\`.
- Production visual reviews must be inspected by a human, validated with \`npm run qa:visual-review-intake\`, then imported only with \`QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake\`.
- Runtime deployment actions must run from the repo root; after Vercel accepts a production deploy, rerun \`npm run qa:launch-refresh\` and \`npm run qa:launch-signoff\`.
- Re-run \`${dispatchSentRecordTemplatePostImportCommands.join('` and `')}\` after each dispatch-log or review-evidence import.

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Failures

${markdownList(failures.map((failure) => failure.name))}
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', jsonName), `${JSON.stringify(summary, null, 2)}\n`)
await writeFile(resolve(root, 'qa', reportName), report)
await writeFile(resolve(root, 'qa', csvName), `${rowsToCsv(uniquePriorityRows)}\n`)

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
