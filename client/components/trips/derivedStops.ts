'use client'

export type TripItemLike = {
  id: string
  title: string
  start_time?: string | null
  end_time?: string | null
  order_index: number
  place?: {
    name?: string | null
    country?: string | null
    latitude?: number | string | null
    longitude?: number | string | null
  } | null
}

export type DisplayStop<T extends TripItemLike = TripItemLike> = {
  id: string
  title: string
  latitude: number
  longitude: number
  index: number
  item: T
  placeName: string | null
  country: string | null
  timeLabel: string | null
  mapped: boolean
}

type DerivedStop = {
  title: string
  latitude: number
  longitude: number
}

export function coerceCoordinate(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function getDestinationFallback(title: string | null | undefined) {
  const normalized = title?.trim().toLowerCase() || ''

  if (/\brome\b/.test(normalized)) {
    return {
      title: 'Rome',
      latitude: 41.9028,
      longitude: 12.4964,
    }
  }

  if (/\bvatican\b/.test(normalized)) {
    return {
      title: 'Vatican City',
      latitude: 41.9029,
      longitude: 12.4534,
    }
  }

  return null
}

const DERIVED_STOP_RULES: Array<{ pattern: RegExp; stops: DerivedStop[] }> = [
  {
    pattern: /colosseum.*roman forum|roman forum.*colosseum/i,
    stops: [
      { title: 'Colosseum', latitude: 41.89021, longitude: 12.49223 },
      { title: 'Roman Forum', latitude: 41.89246, longitude: 12.48533 },
    ],
  },
  {
    pattern: /vatican museums.*sistine chapel|sistine chapel.*vatican museums/i,
    stops: [
      { title: 'Vatican Museums', latitude: 41.90649, longitude: 12.45362 },
      { title: 'Sistine Chapel', latitude: 41.90293, longitude: 12.45486 },
    ],
  },
  { pattern: /la taverna dei fori imperiali/i, stops: [{ title: 'La Taverna dei Fori Imperiali', latitude: 41.89303, longitude: 12.48923 }] },
  { pattern: /piazza navona/i, stops: [{ title: 'Piazza Navona', latitude: 41.89893, longitude: 12.47307 }] },
  { pattern: /pizzarium bonci|bonci/i, stops: [{ title: 'Pizzarium Bonci', latitude: 41.90708, longitude: 12.44645 }] },
  { pattern: /st\.?\s*peter'?s basilica/i, stops: [{ title: "St. Peter's Basilica", latitude: 41.90217, longitude: 12.45394 }] },
  { pattern: /pantheon/i, stops: [{ title: 'Pantheon', latitude: 41.89861, longitude: 12.47687 }] },
  { pattern: /panino divino/i, stops: [{ title: 'Panino Divino', latitude: 41.90623, longitude: 12.45742 }] },
  { pattern: /trevi fountain/i, stops: [{ title: 'Trevi Fountain', latitude: 41.90093, longitude: 12.48331 }] },
  { pattern: /spanish steps/i, stops: [{ title: 'Spanish Steps', latitude: 41.90599, longitude: 12.48278 }] },
  { pattern: /villa borghese/i, stops: [{ title: 'Villa Borghese Gardens', latitude: 41.9142, longitude: 12.49232 }] },
  { pattern: /casina valadier/i, stops: [{ title: 'Casina Valadier', latitude: 41.91398, longitude: 12.48617 }] },
  { pattern: /trastevere/i, stops: [{ title: 'Trastevere', latitude: 41.88802, longitude: 12.46984 }] },
]

export function buildDisplayStops<T extends TripItemLike>(items: T[]) {
  const sortedItems = [...items].sort((a, b) => a.order_index - b.order_index)
  const displayStops: DisplayStop<T>[] = []

  for (const item of sortedItems) {
    const timeLabel = [item.start_time, item.end_time].filter(Boolean).join('–') || null
    const derivedStops = DERIVED_STOP_RULES.find((entry) => entry.pattern.test(item.title))?.stops || null

    if (derivedStops) {
      for (const stop of derivedStops) {
        displayStops.push({
          id: `${item.id}:${stop.title}`,
          title: stop.title,
          latitude: stop.latitude,
          longitude: stop.longitude,
          index: displayStops.length + 1,
          item,
          placeName: stop.title,
          country: item.place?.country || 'Italy',
          timeLabel,
          mapped: true,
        })
      }
      continue
    }

    const latitude = coerceCoordinate(item.place?.latitude)
    const longitude = coerceCoordinate(item.place?.longitude)

    displayStops.push({
      id: item.id,
      title: item.place?.name || item.title,
      latitude: latitude || 0,
      longitude: longitude || 0,
      index: displayStops.length + 1,
      item,
      placeName: item.place?.name || null,
      country: item.place?.country || null,
      timeLabel,
      mapped: latitude != null && longitude != null,
    })
  }

  return displayStops
}
