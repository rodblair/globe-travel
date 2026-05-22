import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { currentQaDate, daysBetween, requestedOrCurrentDate } from './qa-date-utils.mjs'

const root = resolve(process.cwd(), '..')
const requestedDate = process.env.QA_LAUNCH_TODAY_DATE || ''
const requestedToday = process.env.QA_LAUNCH_TODAY || ''
const publicStatusPath = process.env.QA_PUBLIC_LAUNCH_STATUS || 'qa/public-launch-status-2026-05-21.json'
const blockerBoardPath = process.env.QA_PUBLIC_LAUNCH_BLOCKER_BOARD || 'qa/public-launch-blocker-board-2026-05-21.json'
const betaDispatchOutboxPath = process.env.QA_BETA_REVIEW_DISPATCH_OUTBOX || 'qa/beta-human-review-dispatch-outbox-2026-05-21.json'
const betaDispatchLogPath = process.env.QA_BETA_REVIEW_DISPATCH_LOG || 'qa/beta-human-review-dispatch-log-2026-05-21.json'
const visualDispatchLogPath = process.env.QA_VISUAL_REVIEW_DISPATCH_LOG || 'qa/production-visual-review-dispatch-log-2026-05-21.json'

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
    'followUpAt',
    'dueAt',
    'daysUntilDue',
    'sendStatus',
    'reviewerAlias',
    'action',
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

const allRows = Array.isArray(blockerBoard.rows) ? blockerBoard.rows : []
const betaRows = allRows.filter((row) => row.workType === 'beta-human-review')
const visualRows = allRows.filter((row) => row.workType === 'production-visual-review')
const betaMessageRows = Array.isArray(betaDispatchOutbox.messageRows) ? betaDispatchOutbox.messageRows : []
const messageById = new Map(betaMessageRows.map((row) => [row.id, row]))
const betaDispatchLogRows = Array.isArray(betaDispatchLog.dispatchRows) ? betaDispatchLog.dispatchRows : []
const visualDispatchLogRows = Array.isArray(visualDispatchLog.dispatchRows) ? visualDispatchLog.dispatchRows : []
const betaDispatchLogById = new Map(betaDispatchLogRows.map((row) => [row.id, row]))
const visualDispatchLogById = new Map(visualDispatchLogRows.map((row) => [row.id, row]))

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
    followUpAt: row.followUpAt,
    dueAt: row.dueAt,
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
    followUpAt: '',
    dueAt: row.dueAt,
    daysUntilDue: daysBetween(today, row.dueAt),
    sendStatus: dispatchLog.sendStatus || '',
    reviewerAlias: dispatchLog.reviewerAlias || '',
    contactRecordLocation: dispatchLog.contactRecordLocation || '',
    action,
    messageFile: dispatchLog.messageFile || '',
    startUrlOrCommand: row.urlOrCommand || '',
    packetOrArtifact: row.packetOrArtifact || '',
    submissionPath: row.submissionPath || '',
    validateCommand: row.validationCommand || 'npm run qa:visual-review-intake',
    importCommand: row.importCommand || 'QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake',
    reviewerRole: row.reviewerRole || '',
    messageSubject: row.id,
  }
}

const betaDispatchDueToday = betaRows
  .filter((row) => daysBetween(today, row.sendBy) === 0 && !rowIsSent(betaDispatchLogById.get(row.id)))
  .map((row) => betaActionRow(row, 'P0', 'Send beta review invite today.'))
const betaDispatchOverdue = betaRows
  .filter((row) => Number.isFinite(daysBetween(today, row.sendBy)) && daysBetween(today, row.sendBy) < 0 && !rowIsSent(betaDispatchLogById.get(row.id)))
  .map((row) => betaActionRow(row, 'P0', 'Dispatch is overdue; send invite immediately or reassign.'))
const betaFollowUpsDueSoon = betaRows
  .filter((row) => {
    const delta = daysBetween(today, row.followUpAt)
    return Number.isFinite(delta) && delta >= 0 && delta <= 2
  })
  .map((row) => betaActionRow(row, 'P1', 'Prepare follow-up; send on or before the follow-up date.'))
const betaReviewsDueSoon = betaRows
  .filter((row) => {
    const delta = daysBetween(today, row.dueAt)
    return Number.isFinite(delta) && delta >= 0 && delta <= 3
  })
  .map((row) => betaActionRow(row, 'P1', 'Track completed reviewer JSON and intake readiness.'))
const visualDueSoon = visualRows
  .filter((row) => {
    const delta = daysBetween(today, row.dueAt)
    return row.status === 'required for public launch history' && Number.isFinite(delta) && delta >= 0 && delta <= 7 && !rowIsSent(visualDispatchLogById.get(row.id))
  })
  .map((row) => visualActionRow(row, 'P1', 'Send visual-review assignment or confirm scheduled reviewer time.'))
const visualOverdue = visualRows
  .filter((row) => {
    const delta = daysBetween(today, row.dueAt)
    return row.status === 'required for public launch history' && Number.isFinite(delta) && delta < 0 && !rowIsSent(visualDispatchLogById.get(row.id))
  })
  .map((row) => visualActionRow(row, 'P0', 'Production visual review is overdue; run and import evidence.'))

const betaDispatchLogDueTodayRows = preparedDueTodayRows(betaDispatchLogRows)
const betaDispatchLogOverdueRows = preparedOverdueRows(betaDispatchLogRows)
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
for (const row of [...betaDispatchOverdue, ...betaDispatchDueToday, ...betaFollowUpsDueSoon, ...betaReviewsDueSoon]) {
  upsertBetaAction(row)
}
const uniquePriorityRows = [
  ...betaActionById.values(),
  ...visualOverdue,
  ...visualDueSoon,
]

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

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

addCheck('launch today reads current blocked release status', (
  publicStatus.status === 'beta-ready-public-blocked' &&
  publicStatus.betaReady === true &&
  publicStatus.publicLaunchReady === false
), {
  status: publicStatus.status || null,
  betaReady: publicStatus.betaReady ?? null,
  publicLaunchReady: publicStatus.publicLaunchReady ?? null,
})

addCheck('launch today has actionable beta or visual work', uniquePriorityRows.length > 0, {
  actionRowCount: uniquePriorityRows.length,
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

addCheck('launch today beta actions have message files', missingMessageFiles.length === 0, {
  missingMessageFiles: missingMessageFiles.map((row) => row.id),
})

addCheck('launch today visual actions have message files', missingVisualMessageFiles.length === 0, {
  missingVisualMessageFiles: missingVisualMessageFiles.map((row) => row.id),
})

addCheck('launch today send actions match dispatch logs', (
  betaDispatchDueToday.length === betaDispatchLogDueTodayRows.length &&
  betaDispatchOverdue.length === betaDispatchLogOverdueRows.length &&
  visualDueSoon.length === visualDispatchLogDueSoonRows.filter((row) => row.requiredForPublicLaunch).length &&
  visualOverdue.length === visualDispatchLogOverdueRows.filter((row) => row.requiredForPublicLaunch).length
), {
  betaDispatchDueToday: betaDispatchDueToday.map((row) => row.id),
  betaDispatchLogDueToday: betaDispatchLogDueTodayRows.map((row) => row.id),
  betaDispatchOverdue: betaDispatchOverdue.map((row) => row.id),
  betaDispatchLogOverdue: betaDispatchLogOverdueRows.map((row) => row.id),
  visualDueSoon: visualDueSoon.map((row) => row.id),
  visualDispatchLogDueSoon: visualDispatchLogDueSoonRows.filter((row) => row.requiredForPublicLaunch).map((row) => row.id),
  visualOverdue: visualOverdue.map((row) => row.id),
  visualDispatchLogOverdue: visualDispatchLogOverdueRows.filter((row) => row.requiredForPublicLaunch).map((row) => row.id),
})

addCheck('launch today has no overdue launch execution rows', (
  betaDispatchOverdue.length === 0 &&
  visualOverdue.length === 0
), {
  betaDispatchOverdue: betaDispatchOverdue.map((row) => row.id),
  visualOverdue: visualOverdue.map((row) => row.id),
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
  blockerBoardArtifact: qaDisplayPath(blockerBoardPath),
  betaDispatchOutboxArtifact: qaDisplayPath(betaDispatchOutboxPath),
  betaDispatchLogArtifact: qaDisplayPath(betaDispatchLogPath),
  visualDispatchLogArtifact: qaDisplayPath(visualDispatchLogPath),
  publicLaunchStatus: publicStatus.status || null,
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
  betaDispatchDueTodayCount: betaDispatchDueToday.length,
  betaDispatchOverdueCount: betaDispatchOverdue.length,
  betaDispatchLogPreparedDueTodayCount: betaDispatchLogDueTodayRows.length,
  betaDispatchLogPreparedOverdueCount: betaDispatchLogOverdueRows.length,
  betaDispatchLogPreparedNotSentCount: betaDispatchLogRows.filter((row) => !rowIsSent(row)).length,
  betaDispatchLogSentCount: betaDispatchLogRows.filter((row) => rowIsSent(row)).length,
  betaFollowUpsDueSoonCount: betaFollowUpsDueSoon.length,
  betaReviewsDueSoonCount: betaReviewsDueSoon.length,
  visualDueSoonCount: visualDueSoon.length,
  visualOverdueCount: visualOverdue.length,
  visualDispatchLogPreparedDueSoonCount: visualDispatchLogDueSoonRows.length,
  visualDispatchLogPreparedOverdueCount: visualDispatchLogOverdueRows.length,
  visualDispatchLogRequiredPreparedNotSentCount: visualDispatchLogRows.filter((row) => !rowIsSent(row) && row.requiredForPublicLaunch).length,
  visualDispatchLogSentCount: visualDispatchLogRows.filter((row) => rowIsSent(row)).length,
  actionRows: uniquePriorityRows,
  messageFileChecks,
  visualMessageFileChecks,
  checks,
  failures,
  jsonArtifact: `qa/${jsonName}`,
  reportArtifact: `qa/${reportName}`,
  csvArtifact: `qa/${csvName}`,
}

function actionRowsTable(rows) {
  if (!rows.length) return '| none | none | none | none | none | none | none | none |\n'
  return rows.map((row) => `| ${row.priority} | ${row.workType} | ${row.id} | ${row.dueAt || 'n/a'} | ${row.sendStatus || 'n/a'} | ${row.action} | \`${row.messageFile || row.startUrlOrCommand || 'n/a'}\` | \`${row.submissionPath || 'n/a'}\` |`).join('\n')
}

const report = `# Launch Operator Today

Date: ${date}
Today: ${today}
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Public launch status: ${summary.publicLaunchStatus}
- Beta reviews: ${summary.betaReviews?.completed ?? 0}/${summary.betaReviews?.minimumForPublicLaunch ?? 0}, ${summary.betaReviews?.remaining ?? 0} remaining
- Production visual-review history: ${summary.productionVisualReviews?.distinctHistoryDateCount ?? 0}/${summary.productionVisualReviews?.minimumForPublicLaunch ?? 0}, ${summary.productionVisualReviews?.remainingDistinctDates ?? 0} remaining
- Beta invites due today: ${summary.betaDispatchDueTodayCount}
- Beta invite send log: ${summary.betaDispatchLogSentCount} sent, ${summary.betaDispatchLogPreparedNotSentCount} prepared not sent
- Beta follow-ups due soon: ${summary.betaFollowUpsDueSoonCount}
- Beta review submissions due soon: ${summary.betaReviewsDueSoonCount}
- Required production visual reviews due soon: ${summary.visualDueSoonCount}
- Production visual send log: ${summary.visualDispatchLogSentCount} sent, ${summary.visualDispatchLogRequiredPreparedNotSentCount} required prepared not sent
- Overdue launch execution rows: ${summary.betaDispatchOverdueCount + summary.visualOverdueCount}

## Do Today

| Priority | Type | ID | Due | Send Status | Action | Source | Evidence Path |
| --- | --- | --- | --- | --- | --- | --- | --- |
${actionRowsTable(uniquePriorityRows)}

## Operating Rules

- Send beta invite messages from the listed message files; do not treat sent messages as completed review evidence.
- Record reviewer names and contact details outside the repo.
- After sending an invite or visual-review assignment, update the matching dispatch log row with \`sendStatus: "sent"\`, a non-sensitive reviewer alias, delivery channel, sent timestamp, and external contact-record pointer.
- Completed beta reviews must be non-template JSON files, validated with \`npm run qa:beta-review-intake\`, then imported only with \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\`.
- Production visual reviews must be inspected by a human, validated with \`npm run qa:visual-review-intake\`, then imported only with \`QA_VISUAL_REVIEW_IMPORT=1 npm run qa:visual-review-intake\`.
- Re-run \`npm run qa:launch-today\`, \`npm run qa:public-launch-status\`, and \`npm run qa:launch-signoff\` after each import.

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
