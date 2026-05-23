const CITY_COUNTRY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bAthens Greece\b/gi, 'Athens, Greece'],
  [/\bLisbon Portugal\b/gi, 'Lisbon, Portugal'],
  [/\bBarcelona Spain\b/gi, 'Barcelona, Spain'],
  [/\bParis France\b/gi, 'Paris, France'],
  [/\bIstanbul Turkey\b/gi, 'Istanbul, Turkey'],
  [/\bSeoul South Korea\b/gi, 'Seoul, South Korea'],
  [/\bBangkok Thailand\b/gi, 'Bangkok, Thailand'],
  [/\bMarrakech Morocco\b/gi, 'Marrakech, Morocco'],
  [/\bCape Town South Africa\b/gi, 'Cape Town, South Africa'],
  [/\bSydney Australia\b/gi, 'Sydney, Australia'],
  [/\bVancouver Canada\b/gi, 'Vancouver, Canada'],
  [/\bRio de Janeiro Brazil\b/gi, 'Rio de Janeiro, Brazil'],
  [/\bReykjavik Iceland\b/gi, 'Reykjavik, Iceland'],
  [/\bCrete Greece\b/gi, 'Crete, Greece'],
  [/\bDubai UAE\b/gi, 'Dubai, UAE'],
  [/\bDubai United Arab Emirates\b/gi, 'Dubai, United Arab Emirates'],
  [/\bKyoto Japan\b/gi, 'Kyoto, Japan'],
  [/\bBali Indonesia\b/gi, 'Bali, Indonesia'],
  [/\bNairobi Kenya\b/gi, 'Nairobi, Kenya'],
  [/\bWashington DC\b/gi, 'Washington, DC'],
  [/\bMexico City Mexico\b/gi, 'Mexico City, Mexico'],
  [/\bLondon England\b/gi, 'London, England'],
  [/\bLondon UK\b/gi, 'London, UK'],
  [/\bRome Italy\b/gi, 'Rome, Italy'],
  [/\bTokyo Japan\b/gi, 'Tokyo, Japan'],
  [/\bCopenhagen Denmark\b/gi, 'Copenhagen, Denmark'],
  [/\bBerlin Germany\b/gi, 'Berlin, Germany'],
]

const MONTH_NAMES: Record<string, string> = {
  jan: 'January',
  january: 'January',
  feb: 'February',
  february: 'February',
  mar: 'March',
  march: 'March',
  apr: 'April',
  april: 'April',
  may: 'May',
  jun: 'June',
  june: 'June',
  jul: 'July',
  july: 'July',
  aug: 'August',
  august: 'August',
  sep: 'September',
  sept: 'September',
  september: 'September',
  oct: 'October',
  october: 'October',
  nov: 'November',
  november: 'November',
  dec: 'December',
  december: 'December',
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function stripBrandSuffix(value: string) {
  let cleaned = compactWhitespace(value)
  const brandSuffixPattern = /\s+(?:[|·-]\s*)?Globe\.travel\s*$/i

  while (brandSuffixPattern.test(cleaned)) {
    cleaned = compactWhitespace(cleaned.replace(brandSuffixPattern, ''))
  }

  return cleaned || 'Trip'
}

function titleCaseSmallPhrase(value: string) {
  return value.replace(/\b([a-z])([a-z']*)/gi, (word, first: string, rest: string) => {
    if (/^(and|or|of|the|a|an|to|in|for|with)$/i.test(word)) return word.toLowerCase()
    return `${first.toUpperCase()}${rest.toLowerCase()}`
  })
}

function polishMonthPhrases(value: string) {
  return value
    .replace(/\b(early|mid|late)\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi, (_match, modifier: string, month: string) => {
      const monthName = MONTH_NAMES[month.toLowerCase()] || titleCaseSmallPhrase(month)
      const cleanModifier = modifier.toLowerCase()
      return cleanModifier === 'mid' ? `mid\u2011${monthName}` : `${cleanModifier} ${monthName}`
    })
    .replace(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t)?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/gi, (match) => MONTH_NAMES[match.toLowerCase()] || match)
}

export function formatTripTitleForDisplay(title: string | null | undefined) {
  let formatted = stripBrandSuffix(title || 'Trip')
  for (const [pattern, replacement] of CITY_COUNTRY_REPLACEMENTS) {
    formatted = formatted.replace(pattern, replacement)
  }
  formatted = polishMonthPhrases(formatted)
  formatted = formatted.replace(/\b(in\s+[^,]+,\s+(?:Greece|Portugal|Spain|France|Turkey|South Korea|Thailand|Morocco|South Africa|Australia|Canada|Brazil|Iceland|UAE|United Arab Emirates|Japan|Indonesia|Kenya|DC|Mexico|England|UK|Italy|Denmark|Germany))\s+in\s+((?:early|late)\s+[A-Z][a-z]+|mid[\u2011-][A-Z][a-z]+)/g, '$1, $2')
  return compactWhitespace(formatted)
}

export function splitTripTitleTiming(displayTitle: string | null | undefined) {
  const title = compactWhitespace(displayTitle || 'Trip')
  const timingMatch = title.match(/^(.*?),\s+((?:early|late)\s+[A-Z][a-z]+|mid[\u2011-][A-Z][a-z]+)$/)

  if (!timingMatch) {
    return { title, timing: null }
  }

  return {
    title: compactWhitespace(timingMatch[1]),
    timing: compactWhitespace(timingMatch[2]),
  }
}

export function formatDestinationForDisplay(destination: string | null | undefined) {
  let formatted = compactWhitespace(destination || 'this trip')
  for (const [pattern, replacement] of CITY_COUNTRY_REPLACEMENTS) {
    formatted = formatted.replace(pattern, replacement)
  }
  return compactWhitespace(polishMonthPhrases(formatted))
}

export function getTripKeepsakeMeta(title: string) {
  const displayTitle = formatTripTitleForDisplay(title)
  const dayMatch = displayTitle.match(/(\d+)[-\s]?(?:day|days)\b/i)
  const days = dayMatch ? Number(dayMatch[1]) : null
  const destinationPatterns = [
    /^\d+\s+Days?\s+in\s+(.+?)(?:\s+[-–—]\s+.*)?$/i,
    /^Trip to\s+(.+)$/i,
    /^(.+?)\s+(?:City\s+Break|Escape|Trip)$/i,
  ]

  for (const pattern of destinationPatterns) {
    const match = displayTitle.match(pattern)
    if (match?.[1]) return { days, destination: formatDestinationForDisplay(match[1]) }
  }

  return { days, destination: formatDestinationForDisplay(displayTitle) }
}
