export const qaTimeZone = process.env.QA_TIME_ZONE ||
  process.env.QA_RELEASE_TIME_ZONE ||
  process.env.TZ ||
  'America/Vancouver'

export function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '').trim()) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
}

export function dateOnly(value) {
  const match = String(value || '').match(/\d{4}-\d{2}-\d{2}/)
  return match && isDate(match[0]) ? match[0] : ''
}

export function currentQaDate(timeZone = qaTimeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())
    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
    if (byType.year && byType.month && byType.day) {
      return `${byType.year}-${byType.month}-${byType.day}`
    }
  } catch {
    // Fall through to UTC if the host does not recognize the configured zone.
  }
  return new Date().toISOString().slice(0, 10)
}

export function requestedOrCurrentDate(value, timeZone = qaTimeZone) {
  return isDate(value) ? String(value).trim() : currentQaDate(timeZone)
}

export function daysBetween(startDate, endDate) {
  const start = Date.parse(`${startDate}T00:00:00Z`)
  const end = Date.parse(`${endDate}T00:00:00Z`)
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null
  return Math.round((end - start) / 86400000)
}

export function subtractDays(dateValue, days) {
  const parsed = Date.parse(`${dateValue}T00:00:00Z`)
  if (!Number.isFinite(parsed)) return ''
  return new Date(parsed - days * 86400000).toISOString().slice(0, 10)
}
