'use client'

type BookingItemType = 'activity' | 'meal' | 'lodging' | 'transport' | 'transit' | 'note'

const KNOWN_LODGING_PROPERTIES = [
  {
    pattern: /aeginitik[oo]n?\s+archontik[oo]n?|aeginitik[oo]n?\s+arhontik[oo]n?/i,
    href: 'https://www.guestreservations.com/aeginitikon-arhontikon-stylish-boutique-hotel/booking',
    provider: 'Guest Reservations' as const,
  },
]

export type BookingLinkItem = {
  type?: BookingItemType | string | null
  title: string
  start_time?: string | null
  place?: {
    name?: string | null
    country?: string | null
  } | null
  metadata?: Record<string, unknown> | null
}

export type TravelBookingAction = {
  provider: 'booking.com' | 'Guest Reservations' | 'opentable'
  kind: 'hotel' | 'restaurant'
  label: string
  shortLabel: string
  href: string
  helperText: string
  ariaLabel: string
}

function getMetadataUrl(metadata: Record<string, unknown> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key]
    if (typeof value !== 'string') continue

    try {
      const parsed = new URL(value)
      if (parsed.protocol === 'https:') return parsed.toString()
    } catch {
      // Ignore malformed URLs and fall back to provider search links.
    }
  }

  return null
}

function compactTime(value: string | null | undefined) {
  const match = value?.match(/^(\d{1,2}):(\d{2})/)
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function buildQuery(item: BookingLinkItem, destination?: string | null) {
  const placeName = item.place?.name?.trim()
  const title = item.title.trim()
  const country = item.place?.country?.trim()
  const primaryLabel = placeName || title
  const destinationContext = inferItemDestinationContext(item) || normalizeDestinationContext(destination)
  const context = destinationContext && !labelIncludesContext(primaryLabel, destinationContext)
    ? destinationContext
    : null
  const countryLabel = country && !context?.toLowerCase().includes(country.toLowerCase())
    ? country
    : null

  return [primaryLabel, context, countryLabel].filter(Boolean).join(', ')
}

function normalizeDestinationContext(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const patterns = [
    /^\d+\s+Days?\s+in\s+(.+)$/i,
    /^Trip to\s+(.+)$/i,
    /^(.+?)\s+Trip$/i,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match?.[1]) return match[1].replace(/\s+with\s+.+$/i, '').trim()
  }

  if (trimmed.includes(',') || /flow|route|morning|afternoon|farewell|island|overnight/i.test(trimmed)) {
    return null
  }

  return trimmed
}

function labelIncludesContext(label: string, context: string) {
  const city = context.split(',')[0]?.trim()
  if (!city) return false

  return new RegExp(`\\b${escapeRegExp(city)}\\b`, 'i').test(label)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function inferItemDestinationContext(item: BookingLinkItem) {
  const haystack = [
    item.title,
    item.place?.name,
    item.place?.country,
  ].filter(Boolean).join(' ')

  if (/\baegina\b|aeginitik[oo]n?\s+archontik[oo]n?|aeginitik[oo]n?\s+arhontik[oo]n?|inn on the beach|skotadis|akrogialia|temple of aphaia/i.test(haystack)) {
    return 'Aegina, Greece'
  }

  return null
}

function buildBookingDotComHref(item: BookingLinkItem, dayDate?: string | null, destination?: string | null) {
  const override = getMetadataUrl(item.metadata, ['booking_url', 'bookingUrl', 'bookingComUrl'])
  if (override) return override

  const url = new URL('https://www.booking.com/searchresults.html')
  url.searchParams.set('ss', buildQuery(item, destination))
  url.searchParams.set('group_adults', '2')
  url.searchParams.set('no_rooms', '1')

  const affiliateId = process.env.NEXT_PUBLIC_BOOKING_COM_AFFILIATE_ID?.trim()
  if (affiliateId) url.searchParams.set('aid', affiliateId)

  if (dayDate) {
    const checkout = addDays(dayDate, 1)
    if (checkout) {
      url.searchParams.set('checkin', dayDate)
      url.searchParams.set('checkout', checkout)
    }
  }

  return url.toString()
}

function getKnownLodgingPropertyAction(item: BookingLinkItem, dayDate?: string | null): TravelBookingAction | null {
  const haystack = [item.title, item.place?.name].filter(Boolean).join(' ')
  const property = KNOWN_LODGING_PROPERTIES.find((entry) => entry.pattern.test(haystack))
  if (!property) return null

  const url = new URL(property.href)

  if (dayDate) {
    const checkout = addDays(dayDate, 1)
    if (checkout) {
      url.searchParams.set('checkin', dayDate)
      url.searchParams.set('checkout', checkout)
    }
  }

  return {
    provider: property.provider,
    kind: 'hotel',
    label: 'Book room',
    shortLabel: 'Book',
    href: url.toString(),
    helperText: `${property.provider} hotel page`,
    ariaLabel: `Book ${item.title} on ${property.provider}`,
  }
}

function buildOpenTableHref(item: BookingLinkItem, dayDate?: string | null, destination?: string | null) {
  const override = getMetadataUrl(item.metadata, ['opentable_url', 'openTableUrl', 'reservation_url', 'reservationUrl'])
  if (override) return override

  const url = new URL('https://www.opentable.com/s')
  url.searchParams.set('term', buildQuery(item, destination))
  url.searchParams.set('covers', '2')

  const time = compactTime(item.start_time)
  if (dayDate && time) {
    url.searchParams.set('dateTime', `${dayDate}T${time}`)
  }

  return url.toString()
}

export function getTravelBookingAction({
  item,
  dayDate,
  destination,
}: {
  item: BookingLinkItem
  dayDate?: string | null
  destination?: string | null
}): TravelBookingAction | null {
  if (item.type === 'lodging') {
    const knownPropertyAction = getKnownLodgingPropertyAction(item, dayDate)
    if (knownPropertyAction) return knownPropertyAction

    return {
      provider: 'booking.com',
      kind: 'hotel',
      label: 'Check availability',
      shortLabel: 'Availability',
      href: buildBookingDotComHref(item, dayDate, destination),
      helperText: 'Booking.com hotel search',
      ariaLabel: `Check Booking.com availability for ${item.title}`,
    }
  }

  if (item.type === 'meal') {
    return {
      provider: 'opentable',
      kind: 'restaurant',
      label: 'Reserve table',
      shortLabel: 'Reserve',
      href: buildOpenTableHref(item, dayDate, destination),
      helperText: 'OpenTable restaurant search',
      ariaLabel: `Reserve a table for ${item.title} on OpenTable`,
    }
  }

  return null
}
