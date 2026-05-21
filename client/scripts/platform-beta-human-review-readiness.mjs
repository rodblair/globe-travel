import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), '..')
const date = process.env.QA_BETA_REVIEW_DATE || new Date().toISOString().slice(0, 10)
const registerPath = process.env.QA_BETA_REVIEW_REGISTER || '../qa/beta-human-review-register.json'
const minCompletedReviews = Number(process.env.QA_BETA_REVIEW_MIN_COMPLETED || '0')
const thresholdSuffix = minCompletedReviews > 0 ? `-min-${minCompletedReviews}` : ''
const reportName = process.env.QA_BETA_REVIEW_REPORT || `beta-human-review-readiness-${date}${thresholdSuffix}.md`
const writeReviewerPackets = ['1', 'true', 'yes'].includes(String(process.env.QA_BETA_REVIEW_WRITE_PACKETS || '').toLowerCase())
const reviewerPacketDir = process.env.QA_BETA_REVIEW_PACKET_DIR || `../qa/beta-human-review-packets-${date}`
const reviewerPacketManifestName = process.env.QA_BETA_REVIEW_PACKET_MANIFEST || `beta-human-review-packet-manifest-${date}.json`
const reviewerAssignmentCsvName = process.env.QA_BETA_REVIEW_ASSIGNMENT_CSV || `beta-human-review-assignments-${date}.csv`
const reviewerAssignmentReportName = process.env.QA_BETA_REVIEW_ASSIGNMENT_REPORT || `beta-human-review-assignments-${date}.md`
const reviewerBaseUrl = process.env.QA_BETA_REVIEW_BASE_URL || 'https://globe-travel-two.vercel.app'
const submissionTemplateDir = process.env.QA_BETA_REVIEW_SUBMISSION_TEMPLATE_DIR || `../qa/beta-human-review-submissions-${date}`
const writeSubmissionTemplates = writeReviewerPackets || ['1', 'true', 'yes'].includes(String(process.env.QA_BETA_REVIEW_WRITE_SUBMISSION_TEMPLATES || '').toLowerCase())

const requiredAudiences = ['friend-group', 'couple', 'family', 'solo']
const requiredStyles = ['budget', 'premium', 'food', 'nightlife', 'outdoors', 'culture']
const requiredRegions = ['Africa', 'Asia', 'Europe', 'Latin America', 'North America', 'Oceania']
const completedStatuses = new Set(['passed', 'failed', 'accepted-risk'])
const blockingSeverities = new Set(['P0', 'P1'])
const requiredScorecardFields = [
  'firstMinuteClarity',
  'itineraryUsefulness',
  'mapTrust',
  'editAndSwapConfidence',
  'saveReopenConfidence',
  'shareRecipientClarity',
  'feedbackLoopClarity',
  'mobileUsability',
  'paidValueCredibility',
]
const requiredCompletedReviewFields = [
  'reviewerRole',
  'routeOrShareUrl',
  'viewport',
  'device',
  'prompt',
  'completedAt',
  'firstMinuteOutcome',
  'mapTrustNotes',
  'shareFeedbackOutcome',
  'scorecard',
  'findings',
]
const allowedFindingSeverities = new Set(['P0', 'P1', 'P2', 'P3'])
const allowedFindingStatuses = new Set(['open', 'closed', 'accepted-risk'])
const reviewDeviceViewports = {
  phone: '390x844',
  desktop: '1440x950',
}
const surfaceTasks = {
  planner: 'Start from a clean session, use the assigned prompt, and note whether the first minute is clear.',
  'trip-studio': 'Open the generated Trip Studio and inspect day structure, editing confidence, and copy clarity.',
  map: 'Review mapped stops, route shape, country consistency, duplicate pins, and any map fallback messaging.',
  'public-share': 'Open the public share page as a logged-out recipient and verify itinerary clarity, metadata, and share controls.',
  feedback: 'Submit or inspect friend feedback and record whether the loop is useful to the organizer.',
  'save-reopen': 'Save the trip, reopen it from saved trips, and confirm work preservation is trustworthy.',
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function missingFrom(values, required) {
  const set = new Set(values)
  return required.filter((value) => !set.has(value))
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isReviewComplete(review) {
  return completedStatuses.has(review.status)
}

function isRating(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5
}

function isHttpUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function isViewport(value) {
  return /^\d{3,4}x\d{3,4}$/.test(String(value || '').trim())
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim()) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

function completedReviewEvidenceIssues(review) {
  const issues = []

  for (const field of requiredCompletedReviewFields) {
    if (field === 'scorecard') {
      if (!review.scorecard || typeof review.scorecard !== 'object' || Array.isArray(review.scorecard)) {
        issues.push('scorecard')
      }
      continue
    }

    if (field === 'findings') {
      if (!Array.isArray(review.findings)) issues.push('findings')
      continue
    }

    if (!isNonEmptyString(review[field])) issues.push(field)
  }

  if (isNonEmptyString(review.routeOrShareUrl) && !isHttpUrl(review.routeOrShareUrl)) {
    issues.push('routeOrShareUrl must be http(s)')
  }

  if (isNonEmptyString(review.viewport) && !isViewport(review.viewport)) {
    issues.push('viewport must look like 390x844')
  }

  if (isNonEmptyString(review.completedAt) && !isDate(review.completedAt)) {
    issues.push('completedAt must be YYYY-MM-DD')
  }

  const scorecard = review.scorecard || {}
  const missingRatings = requiredScorecardFields.filter((field) => !isRating(scorecard[field]))
  if (missingRatings.length > 0) {
    issues.push(`scorecard ratings missing or out of range: ${missingRatings.join(', ')}`)
  }

  const malformedFindings = Array.isArray(review.findings)
    ? review.findings.filter((finding) => (
      !allowedFindingSeverities.has(String(finding.severity || '').toUpperCase()) ||
      !allowedFindingStatuses.has(String(finding.status || '').toLowerCase()) ||
      !isNonEmptyString(finding.surface) ||
      !isNonEmptyString(finding.title) ||
      !isNonEmptyString(finding.notes)
    ))
    : []
  if (malformedFindings.length > 0) {
    issues.push(`${malformedFindings.length} malformed finding(s)`)
  }

  return issues
}

function markdownList(items) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- none'
}

function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function qaDisplayPath(value) {
  return String(value || '').replace(/^\.\.\/qa\//, 'qa/').replace(/^\.\.\//, '')
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function packetPathForReview(review) {
  return `${review.id}-${slugify(review.destination)}.md`
}

function submissionTemplatePathForReview(review) {
  return `${review.id}-${slugify(review.destination)}.template.json`
}

function buildPlannerUrl(prompt) {
  const url = new URL('/chat', reviewerBaseUrl)
  url.searchParams.set('q', prompt)
  return url.toString()
}

function packetIssuesForReview(review) {
  const issues = []
  if (!reviewDeviceViewports[review.device]) issues.push(`unsupported device: ${review.device || '(missing)'}`)
  if (!Array.isArray(review.primarySurfaces) || review.primarySurfaces.length === 0) {
    issues.push('primarySurfaces missing')
  }
  const unknownSurfaces = Array.isArray(review.primarySurfaces)
    ? review.primarySurfaces.filter((surface) => !surfaceTasks[surface])
    : []
  if (unknownSurfaces.length > 0) issues.push(`unknown surfaces: ${unknownSurfaces.join(', ')}`)
  if (Array.isArray(review.primarySurfaces) && review.primarySurfaces.includes('feedback') && !review.primarySurfaces.includes('public-share')) {
    issues.push('feedback review must include public-share surface')
  }
  return issues
}

function packetRecordForReview(review) {
  const viewport = reviewDeviceViewports[review.device] || ''
  const packetFile = packetPathForReview(review)
  const submissionTemplateFile = submissionTemplatePathForReview(review)
  return {
    id: review.id,
    packetFile,
    submissionTemplateFile,
    destination: review.destination,
    prompt: review.prompt,
    audience: review.audience,
    style: review.style,
    region: review.region,
    device: review.device,
    viewport,
    surfaces: review.primarySurfaces || [],
    sourceActualId: review.sourceActualId,
    startUrl: buildPlannerUrl(review.prompt || ''),
  }
}

function submissionTemplateForReview(record) {
  return {
    id: record.id,
    sourceActualId: record.sourceActualId,
    reviewerRole: '',
    routeOrShareUrl: record.startUrl,
    viewport: record.viewport,
    device: record.device,
    prompt: record.prompt,
    status: 'passed',
    completedAt: '',
    firstMinuteOutcome: '',
    mapTrustNotes: '',
    shareFeedbackOutcome: '',
    scorecard: Object.fromEntries(requiredScorecardFields.map((field) => [field, null])),
    findings: [],
    reviewerNotes: `Use this template after completing ${record.id}. Replace blank fields and null scorecard ratings before intake.`,
  }
}

function packetMarkdown(record) {
  const surfaceChecklist = record.surfaces
    .map((surface) => `- [ ] ${surface}: ${surfaceTasks[surface] || 'Review this assigned surface and record any friction.'}`)
    .join('\n')

  return `# ${record.id}: ${record.destination} Beta Review Packet

Date: ${date}

## Assignment

- Destination: ${record.destination}
- Audience: ${record.audience}
- Trip style: ${record.style}
- Region: ${record.region}
- Device lens: ${record.device}
- Viewport: ${record.viewport}
- Source actual: ${record.sourceActualId}
- Start URL: ${record.startUrl}

## Prompt

${record.prompt}

## Journey Checklist

${surfaceChecklist}

## Required Scorecard

Record a 1-5 rating for every field:

${requiredScorecardFields.map((field) => `- [ ] ${field}`).join('\n')}

## Required Written Evidence

- [ ] reviewerRole
- [ ] routeOrShareUrl
- [ ] viewport
- [ ] device
- [ ] completedAt
- [ ] firstMinuteOutcome
- [ ] mapTrustNotes
- [ ] shareFeedbackOutcome
- [ ] findings

## Submission Template

Fill the matching JSON template after the review: \`${qaDisplayPath(submissionTemplateDir)}/${record.submissionTemplateFile}\`

## Findings Format

Use severities P0, P1, P2, or P3 and statuses open, closed, or accepted-risk. Public launch is blocked by any unresolved P0/P1 finding.
`
}

function reviewLabel(review) {
  return `${review.id} (${review.destination}, ${review.audience}, ${review.style}, ${review.region}, ${review.device})`
}

function assignmentCsv(records) {
  const columns = [
    'id',
    'destination',
    'audience',
    'style',
    'region',
    'device',
    'viewport',
    'surfaces',
    'startUrl',
    'packetPath',
    'submissionTemplatePath',
    'assignee',
    'reviewWindow',
    'status',
    'submissionPath',
    'notes',
  ]
  const rows = records.map((record) => ({
    ...record,
    surfaces: record.surfaces.join('|'),
    packetPath: `${qaDisplayPath(reviewerPacketDir)}/${record.packetFile}`,
    submissionTemplatePath: `${qaDisplayPath(submissionTemplateDir)}/${record.submissionTemplateFile}`,
    assignee: '',
    reviewWindow: '',
    status: 'unassigned',
    submissionPath: '',
    notes: '',
  }))
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(',')),
  ].join('\n') + '\n'
}

function assignmentMarkdown(records) {
  return `# Beta Human Review Assignment Board

Date: ${date}
Base URL: ${reviewerBaseUrl}
Status: ready for assignment

## Operator Instructions

- Assign each row to one reviewer, or split rows across reviewer cohorts while preserving the assigned device lens.
- Send the reviewer the packet path and matching JSON submission template path.
- Keep template files ending in \`.template.json\` unchanged; save completed reviews as non-template \`.json\` files in \`${qaDisplayPath(submissionTemplateDir)}\`.
- After submissions arrive, run \`npm run qa:beta-review-intake\`, then \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\` only when validation is clean.
- Run \`npm run qa:beta-review-progress\` and \`npm run qa:public-launch-status\` after import.

## Assignment Matrix

| ID | Destination | Audience | Style | Region | Device | Surfaces | Packet | Submission Template |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
${records.map((record) => (
  `| ${record.id} | ${record.destination} | ${record.audience} | ${record.style} | ${record.region} | ${record.device} ${record.viewport} | ${record.surfaces.join(', ')} | \`${qaDisplayPath(reviewerPacketDir)}/${record.packetFile}\` | \`${qaDisplayPath(submissionTemplateDir)}/${record.submissionTemplateFile}\` |`
)).join('\n')}

## Launch Rule

Public launch still requires 25 completed reviews, zero unresolved P0/P1 findings, complete scorecard evidence, and passing intake/progress artifacts. This board is an assignment aid, not completed review evidence.
`
}

const raw = await readFile(resolve(process.cwd(), registerPath), 'utf8')
const register = JSON.parse(raw)
const plannedReviews = Array.isArray(register.plannedReviews) ? register.plannedReviews : []
const completedReviews = plannedReviews.filter(isReviewComplete)
const unresolvedBlockingReviews = completedReviews.filter((review) => {
  const issues = Array.isArray(review.findings) ? review.findings : []
  return issues.some((issue) => (
    blockingSeverities.has(String(issue.severity || '').toUpperCase()) &&
    String(issue.status || '').toLowerCase() !== 'closed'
  ))
})
const completedReviewEvidenceGaps = completedReviews
  .map((review) => ({
    id: review.id || '(missing id)',
    issues: completedReviewEvidenceIssues(review),
  }))
  .filter((review) => review.issues.length > 0)

const checks = []
function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok: Boolean(ok), ...detail })
}

const audiences = unique(plannedReviews.map((review) => review.audience))
const styles = unique(plannedReviews.map((review) => review.style))
const regions = unique(plannedReviews.map((review) => review.region))
const devices = unique(plannedReviews.map((review) => review.device))
const primarySurfaces = unique(plannedReviews.flatMap((review) => review.primarySurfaces || []))

const missingAudiences = missingFrom(audiences, requiredAudiences)
const missingStyles = missingFrom(styles, requiredStyles)
const missingRegions = missingFrom(regions, requiredRegions)
const missingScorecardFields = missingFrom(register.scorecardFields || [], requiredScorecardFields)

const malformedReviews = plannedReviews.filter((review) => (
  !isNonEmptyString(review.id) ||
  !isNonEmptyString(review.sourceActualId) ||
  !isNonEmptyString(review.destination) ||
  !isNonEmptyString(review.prompt) ||
  !isNonEmptyString(review.audience) ||
  !isNonEmptyString(review.style) ||
  !isNonEmptyString(review.region) ||
  !isNonEmptyString(review.device) ||
  !Array.isArray(review.primarySurfaces) ||
  review.primarySurfaces.length === 0 ||
  !isNonEmptyString(review.status)
))
const reviewerPacketIssues = plannedReviews
  .map((review) => ({
    id: review.id || '(missing id)',
    issues: packetIssuesForReview(review),
  }))
  .filter((review) => review.issues.length > 0)
const reviewerPackets = plannedReviews.map(packetRecordForReview)

addCheck('beta human review register is owned and dated', (
  isNonEmptyString(register.owner) &&
  isNonEmptyString(register.reviewedAt) &&
  isNonEmptyString(register.status)
), {
  owner: register.owner || null,
  reviewedAt: register.reviewedAt || null,
  status: register.status || null,
})

addCheck('beta human review plan has at least 25 planned reviews', plannedReviews.length >= 25, {
  plannedReviewCount: plannedReviews.length,
  requiredMinimum: 25,
})

addCheck('beta human review plan covers required audiences', missingAudiences.length === 0, {
  audiences,
  requiredAudiences,
  missingAudiences,
})

addCheck('beta human review plan covers required trip styles', missingStyles.length === 0, {
  styles,
  requiredStyles,
  missingStyles,
})

addCheck('beta human review plan covers required regions', missingRegions.length === 0, {
  regions,
  requiredRegions,
  missingRegions,
})

addCheck('beta human review plan includes phone and desktop lenses', (
  devices.includes('phone') &&
  devices.includes('desktop')
), {
  devices,
})

addCheck('beta human review plan includes core journey surfaces', (
  ['planner', 'trip-studio', 'map', 'public-share', 'feedback', 'save-reopen'].every((surface) => primarySurfaces.includes(surface))
), {
  primarySurfaces,
})

addCheck('beta human review scorecard has required fields', missingScorecardFields.length === 0, {
  requiredScorecardFields,
  missingScorecardFields,
})

addCheck('every planned beta review has required metadata', malformedReviews.length === 0, {
  malformedReviews: malformedReviews.map((review) => review.id || '(missing id)'),
})

addCheck('every planned beta review can produce a reviewer packet', reviewerPacketIssues.length === 0, {
  reviewerPacketCount: reviewerPackets.length,
  reviewerPacketIssues,
  reviewerBaseUrl,
})

addCheck('completed beta reviews meet requested threshold', completedReviews.length >= minCompletedReviews, {
  completedReviewCount: completedReviews.length,
  requestedMinimum: minCompletedReviews,
})

addCheck('completed beta reviews include required reviewer evidence', completedReviewEvidenceGaps.length === 0, {
  completedReviewCount: completedReviews.length,
  requiredCompletedReviewFields,
  completedReviewEvidenceGaps,
})

addCheck('completed beta reviews have no unresolved P0/P1 findings', unresolvedBlockingReviews.length === 0, {
  unresolvedBlockingReviews: unresolvedBlockingReviews.map((review) => ({
    id: review.id,
    findings: (review.findings || []).filter((issue) => (
      blockingSeverities.has(String(issue.severity || '').toUpperCase()) &&
      String(issue.status || '').toLowerCase() !== 'closed'
    )),
  })),
})

const failures = checks.filter((check) => !check.ok)
const summary = {
  date,
  registerPath,
  reportPath: `qa/${reportName}`,
  plannedReviewCount: plannedReviews.length,
  completedReviewCount: completedReviews.length,
  minCompletedReviews,
  status: failures.length === 0 ? 'pass' : 'fail',
  checked: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  reviewerPacketDir: qaDisplayPath(reviewerPacketDir),
  reviewerPacketManifest: `qa/${reviewerPacketManifestName}`,
  reviewerAssignmentCsv: `qa/${reviewerAssignmentCsvName}`,
  reviewerAssignmentReport: `qa/${reviewerAssignmentReportName}`,
  reviewerPacketCount: reviewerPackets.length,
  reviewerPacketsWritten: writeReviewerPackets,
  submissionTemplateDir: qaDisplayPath(submissionTemplateDir),
  submissionTemplateCount: reviewerPackets.length,
  submissionTemplatesWritten: writeSubmissionTemplates,
  checks,
  failures,
}

const report = `# Beta Human Review Readiness

Date: ${date}
Register: \`${registerPath.replace(/^\.\.\//, '')}\`
Status: ${summary.status}

## Result

- Checked: ${summary.checked}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Planned reviews: ${summary.plannedReviewCount}
- Completed reviews: ${summary.completedReviewCount}
- Requested completed-review threshold: ${summary.minCompletedReviews}
- Reviewer packets: ${summary.reviewerPacketCount}${writeReviewerPackets ? ` written to \`${summary.reviewerPacketDir}\`` : ''}
- Submission templates: ${summary.submissionTemplateCount}${writeSubmissionTemplates ? ` written to \`${summary.submissionTemplateDir}\`` : ''}
- Assignment board: ${writeReviewerPackets ? `\`${summary.reviewerAssignmentReport}\` and \`${summary.reviewerAssignmentCsv}\`` : 'not written'}

## Coverage

- Audiences: ${audiences.join(', ')}
- Styles: ${styles.join(', ')}
- Regions: ${regions.join(', ')}
- Devices: ${devices.join(', ')}
- Surfaces: ${primarySurfaces.join(', ')}

## Checks

${checks.map((check) => `- ${check.ok ? 'Pass' : 'Fail'}: ${check.name}`).join('\n')}

## Planned Review Queue

${plannedReviews.map((review) => `- ${reviewLabel(review)} — ${review.status}`).join('\n')}

## Missing Or Blocking Detail

Missing audiences:
${markdownList(missingAudiences)}

Missing styles:
${markdownList(missingStyles)}

Missing regions:
${markdownList(missingRegions)}

Missing scorecard fields:
${markdownList(missingScorecardFields)}

Malformed reviews:
${markdownList(malformedReviews.map((review) => review.id || '(missing id)'))}

Reviewer packet issues:
${markdownList(reviewerPacketIssues.map((review) => `${review.id}: ${review.issues.join('; ')}`))}

Completed review evidence gaps:
${markdownList(completedReviewEvidenceGaps.map((review) => `${review.id}: ${review.issues.join('; ')}`))}

Unresolved P0/P1 findings:
${markdownList(unresolvedBlockingReviews.map((review) => review.id))}

## Notes

- This gate does not pretend the invite beta has happened. With the default \`QA_BETA_REVIEW_MIN_COMPLETED=0\`, it proves the review plan, matrix, and scorecard are operationally ready.
- Run \`QA_BETA_REVIEW_WRITE_PACKETS=1 npm run qa:beta-review-readiness\` to generate reviewer-ready packets, one JSON submission template per planned review, and a machine-readable packet manifest.
- For public-launch approval, run with \`QA_BETA_REVIEW_MIN_COMPLETED=25\` or higher and keep unresolved P0/P1 findings at zero.
- Completed review records must include reviewer role, route or share URL, viewport, device, completed date, outcome notes, complete 1-5 scorecard ratings, and findings with severity, status, surface, title, and notes.
`

await mkdir(resolve(root, 'qa'), { recursive: true })
await writeFile(resolve(root, 'qa', reportName), report)
if (writeReviewerPackets) {
  const packetDir = resolve(process.cwd(), reviewerPacketDir)
  await mkdir(packetDir, { recursive: true })
  for (const packet of reviewerPackets) {
    await writeFile(resolve(packetDir, packet.packetFile), packetMarkdown(packet))
  }
  await writeFile(resolve(root, 'qa', reviewerPacketManifestName), `${JSON.stringify({
    date,
    registerPath: qaDisplayPath(registerPath),
    reviewerBaseUrl,
    packetDir: qaDisplayPath(reviewerPacketDir),
    packetCount: reviewerPackets.length,
    assignmentCsv: `qa/${reviewerAssignmentCsvName}`,
    assignmentReport: `qa/${reviewerAssignmentReportName}`,
    submissionTemplateDir: qaDisplayPath(submissionTemplateDir),
    submissionTemplateCount: reviewerPackets.length,
    packets: reviewerPackets.map((packet) => ({
      ...packet,
      packetPath: `${qaDisplayPath(reviewerPacketDir)}/${packet.packetFile}`,
      submissionTemplatePath: `${qaDisplayPath(submissionTemplateDir)}/${packet.submissionTemplateFile}`,
    })),
  }, null, 2)}\n`)
  await writeFile(resolve(root, 'qa', reviewerAssignmentCsvName), assignmentCsv(reviewerPackets))
  await writeFile(resolve(root, 'qa', reviewerAssignmentReportName), assignmentMarkdown(reviewerPackets))
}
if (writeSubmissionTemplates) {
  const templateDir = resolve(process.cwd(), submissionTemplateDir)
  await mkdir(templateDir, { recursive: true })
  for (const packet of reviewerPackets) {
    await writeFile(
      resolve(templateDir, packet.submissionTemplateFile),
      `${JSON.stringify(submissionTemplateForReview(packet), null, 2)}\n`,
    )
  }
  await writeFile(resolve(templateDir, 'README.md'), `# Beta Human Review Submissions

Drop completed review JSON files in this directory after reviewers finish their assigned packets.

Each \`.template.json\` file is prefilled with the assigned review id, prompt, source actual, device, viewport, and start URL. Copy or rename the relevant template to a non-template \`.json\` file, fill every blank field, replace null scorecard ratings with 1-5 integers, and keep \`findings\` empty only when the reviewer found no issues.

Use \`npm run qa:beta-review-intake\` from \`client/\` to validate files without changing the canonical register. Use \`QA_BETA_REVIEW_IMPORT=1 npm run qa:beta-review-intake\` only after the report is clean and the submissions are ready to count toward public-launch review completion.

Template files ending in \`.template.json\` are ignored by the intake command.
`)
}

console.log(JSON.stringify(summary, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
