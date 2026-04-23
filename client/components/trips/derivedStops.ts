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
  country?: string
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
    pattern: /acropolis.*parthenon|parthenon.*acropolis/i,
    stops: [
      { title: 'Acropolis of Athens', latitude: 37.97153, longitude: 23.72575, country: 'Greece' },
      { title: 'Parthenon', latitude: 37.97153, longitude: 23.72672, country: 'Greece' },
    ],
  },
  { pattern: /acropolis museum/i, stops: [{ title: 'Acropolis Museum', latitude: 37.96845, longitude: 23.72853, country: 'Greece' }] },
  { pattern: /long lunch in plaka|lunch.*plaka/i, stops: [{ title: 'Plaka', latitude: 37.97308, longitude: 23.73051, country: 'Greece' }] },
  {
    pattern: /plaka.*anafiotika|anafiotika.*plaka/i,
    stops: [
      { title: 'Plaka', latitude: 37.97308, longitude: 23.73051, country: 'Greece' },
      { title: 'Anafiotika', latitude: 37.97233, longitude: 23.72786, country: 'Greece' },
    ],
  },
  { pattern: /rooftop dinner.*acropolis|acropolis views/i, stops: [{ title: 'A for Athens Rooftop', latitude: 37.97615, longitude: 23.72566, country: 'Greece' }] },
  { pattern: /coffee.*monastiraki|walk through monastiraki/i, stops: [{ title: 'Monastiraki Square', latitude: 37.97608, longitude: 23.72557, country: 'Greece' }] },
  { pattern: /central market|food stroll/i, stops: [{ title: 'Athens Central Market', latitude: 37.98005, longitude: 23.72672, country: 'Greece' }] },
  { pattern: /lunch in psiri|\bpsiri\b|\bpsyri\b/i, stops: [{ title: 'Psiri', latitude: 37.97855, longitude: 23.72328, country: 'Greece' }] },
  { pattern: /ermou street/i, stops: [{ title: 'Ermou Street', latitude: 37.97682, longitude: 23.7247, country: 'Greece' }] },
  {
    pattern: /national garden.*syntagma|syntagma.*national garden/i,
    stops: [
      { title: 'National Garden', latitude: 37.97393, longitude: 23.73624, country: 'Greece' },
      { title: 'Syntagma Square', latitude: 37.97554, longitude: 23.7348, country: 'Greece' },
    ],
  },
  { pattern: /koukaki/i, stops: [{ title: 'Koukaki', latitude: 37.96393, longitude: 23.72141, country: 'Greece' }] },
  { pattern: /brunch in kolonaki|\bkolonaki\b/i, stops: [{ title: 'Kolonaki', latitude: 37.97798, longitude: 23.74132, country: 'Greece' }] },
  { pattern: /museum stop|boutique browsing/i, stops: [{ title: 'Benaki Museum', latitude: 37.97595, longitude: 23.74029, country: 'Greece' }] },
  { pattern: /pangrati/i, stops: [{ title: 'Pangrati', latitude: 37.96991, longitude: 23.74531, country: 'Greece' }] },
  { pattern: /lycabettus/i, stops: [{ title: 'Lycabettus Hill', latitude: 37.98178, longitude: 23.74306, country: 'Greece' }] },
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
          country: item.place?.country || stop.country || 'Italy',
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
