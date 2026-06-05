'use client'

export type TripItemLike = {
  id: string
  title: string
  type?: string | null
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

export const WALK_ROUTE_MAX_METERS = 8500

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

  if (/\blisbon\b|\blisboa\b/.test(normalized)) {
    return {
      title: 'Lisbon',
      latitude: 38.7223,
      longitude: -9.1393,
    }
  }

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

  if (/\bathens\b|\bathina\b/.test(normalized)) {
    return {
      title: 'Athens',
      latitude: 37.9838,
      longitude: 23.7275,
    }
  }

  if (/\baegina\b/.test(normalized)) {
    return {
      title: 'Aegina',
      latitude: 37.7468,
      longitude: 23.4278,
    }
  }

  return null
}

function timeToMinutes(value: string | null | undefined) {
  const match = value?.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

function sortByOrderIndex<T extends TripItemLike>(items: T[]) {
  return [...items].sort((a, b) => a.order_index - b.order_index)
}

export function sortTripItemsForDisplay<T extends TripItemLike>(items: T[]) {
  return sortByOrderIndex(items).sort((a, b) => {
    const aMinutes = timeToMinutes(a.start_time)
    const bMinutes = timeToMinutes(b.start_time)

    if (aMinutes != null && bMinutes != null && aMinutes !== bMinutes) {
      return aMinutes - bMinutes
    }

    if (aMinutes != null && bMinutes == null) return -1
    if (aMinutes == null && bMinutes != null) return 1
    return a.order_index - b.order_index
  })
}

export function hasScheduleOrderConflict<T extends TripItemLike>(items: T[]) {
  const orderedIds = sortByOrderIndex(items).map((item) => item.id)
  const scheduledIds = sortTripItemsForDisplay(items).map((item) => item.id)

  return orderedIds.some((id, index) => id !== scheduledIds[index])
}

export function hasTransitRouteCue<T extends TripItemLike>(items: T[]) {
  return items.some((item) => {
    const title = item.title || ''
    return item.type === 'transit' || item.type === 'transport' || /\bferry\b|\bflight\b|\btrain\b|\bbus\b|\btransfer\b|\bshuttle\b|\bairport\b/i.test(title)
  })
}

export function getRouteFallbackLabel<T extends TripItemLike>(
  items: T[],
  route: { distance_m?: number | null } | null | undefined,
  usesDerivedStops: boolean
) {
  if (hasTransitRouteCue(items)) return 'Transit or split route recommended'
  if (route?.distance_m != null && route.distance_m > WALK_ROUTE_MAX_METERS) return 'Split route recommended'
  if (usesDerivedStops) return 'Verified stop sequence'
  return 'Mapped stops ready'
}

export function shouldUseSavedRoute<T extends TripItemLike>(
  items: T[],
  route: { distance_m?: number | null } | null | undefined,
  usesDerivedStops: boolean
) {
  if (!route || usesDerivedStops) return false
  if (hasScheduleOrderConflict(items)) return false
  if (hasTransitRouteCue(items)) return false

  // Saved walk lines become misleading on island/transit days and can also
  // distort the map if old geometry was generated before itinerary edits.
  if (route.distance_m == null || route.distance_m <= 0 || route.distance_m > WALK_ROUTE_MAX_METERS) return false

  return true
}

const DERIVED_STOP_RULES: Array<{ pattern: RegExp; stops: DerivedStop[] }> = [
  { pattern: /dear breakfast/i, stops: [{ title: 'Dear Breakfast Chiado', latitude: 38.71082, longitude: -9.14363, country: 'Portugal' }] },
  { pattern: /lisbon cathedral|sé de lisboa|se de lisboa/i, stops: [{ title: 'Lisbon Cathedral', latitude: 38.70975, longitude: -9.13349, country: 'Portugal' }] },
  { pattern: /castelo de são jorge|castelo de sao jorge|castle of são jorge|castle of sao jorge/i, stops: [{ title: 'Castelo de São Jorge', latitude: 38.71391, longitude: -9.13348, country: 'Portugal' }] },
  { pattern: /taberna sal grosso/i, stops: [{ title: 'Taberna Sal Grosso', latitude: 38.71468, longitude: -9.1245, country: 'Portugal' }] },
  { pattern: /tram 28e|tram 28/i, stops: [{ title: 'Praça Martim Moniz', latitude: 38.71691, longitude: -9.13664, country: 'Portugal' }] },
  { pattern: /\bramiro\b|cervejaria ramiro/i, stops: [{ title: 'Cervejaria Ramiro', latitude: 38.72178, longitude: -9.13543, country: 'Portugal' }] },
  { pattern: /pensão amor|pensao amor/i, stops: [{ title: 'Pensão Amor', latitude: 38.70708, longitude: -9.14321, country: 'Portugal' }] },
  { pattern: /ponto final/i, stops: [{ title: 'Ponto Final', latitude: 38.68495, longitude: -9.14718, country: 'Portugal' }] },
  { pattern: /by the wine/i, stops: [{ title: 'By The Wine', latitude: 38.71047, longitude: -9.14355, country: 'Portugal' }] },
  { pattern: /pink street|rua nova do carvalho/i, stops: [{ title: 'Pink Street', latitude: 38.70728, longitude: -9.14323, country: 'Portugal' }] },
  { pattern: /hello,?\s*kristof/i, stops: [{ title: 'Hello, Kristof', latitude: 38.71007, longitude: -9.15159, country: 'Portugal' }] },
  { pattern: /cascais historic center|cascais historic centre/i, stops: [{ title: 'Cascais Historic Center', latitude: 38.69792, longitude: -9.42149, country: 'Portugal' }] },
  { pattern: /mar do inferno/i, stops: [{ title: 'Mar do Inferno', latitude: 38.69322, longitude: -9.42918, country: 'Portugal' }] },
  { pattern: /praia da rainha/i, stops: [{ title: 'Praia da Rainha', latitude: 38.69986, longitude: -9.41819, country: 'Portugal' }] },
  { pattern: /boca do inferno/i, stops: [{ title: 'Boca do Inferno', latitude: 38.69161, longitude: -9.43134, country: 'Portugal' }] },
  { pattern: /ferry from piraeus to aegina|return ferry to piraeus/i, stops: [{ title: 'Port of Piraeus', latitude: 37.94486, longitude: 23.64082, country: 'Greece' }] },
  { pattern: /aegina harbor|aegina port|aegina town|pistachio market/i, stops: [{ title: 'Aegina Town', latitude: 37.74679, longitude: 23.42775, country: 'Greece' }] },
  { pattern: /temple of aphaia/i, stops: [{ title: 'Temple of Aphaia', latitude: 37.75448, longitude: 23.53313, country: 'Greece' }] },
  { pattern: /agia marina|afternoon swim and beach time/i, stops: [{ title: 'Agia Marina, Aegina', latitude: 37.74417, longitude: 23.53374, country: 'Greece' }] },
  { pattern: /island breakfast by aegina/i, stops: [{ title: 'Aegina Harbor', latitude: 37.74679, longitude: 23.42775, country: 'Greece' }] },
  { pattern: /mikrolimano/i, stops: [{ title: 'Mikrolimano', latitude: 37.94073, longitude: 23.66403, country: 'Greece' }] },
  { pattern: /stavros niarchos/i, stops: [{ title: 'Stavros Niarchos Foundation Cultural Center', latitude: 37.93952, longitude: 23.69165, country: 'Greece' }] },
  { pattern: /flisvos marina/i, stops: [{ title: 'Flisvos Marina', latitude: 37.93183, longitude: 23.68647, country: 'Greece' }] },
  { pattern: /praça do comércio|praca do comercio|commerce square/i, stops: [{ title: 'Praça do Comércio', latitude: 38.70775, longitude: -9.13659, country: 'Portugal' }] },
  { pattern: /pastel de nata breakfast|nata breakfast|breakfast stop/i, stops: [{ title: 'Manteigaria Chiado', latitude: 38.71089, longitude: -9.14327, country: 'Portugal' }] },
  {
    pattern: /santa justa.*chiado|chiado.*santa justa/i,
    stops: [
      { title: 'Santa Justa Lift', latitude: 38.71211, longitude: -9.13947, country: 'Portugal' },
      { title: 'Chiado', latitude: 38.71067, longitude: -9.14389, country: 'Portugal' },
    ],
  },
  { pattern: /cervejaria ramiro|seafood lunch in lisbon/i, stops: [{ title: 'Cervejaria Ramiro', latitude: 38.72178, longitude: -9.13543, country: 'Portugal' }] },
  {
    pattern: /alfama.*cathedral|cathedral.*alfama/i,
    stops: [
      { title: 'Lisbon Cathedral', latitude: 38.70975, longitude: -9.13349, country: 'Portugal' },
      { title: 'Alfama', latitude: 38.71391, longitude: -9.12963, country: 'Portugal' },
    ],
  },
  { pattern: /sunset viewpoint/i, stops: [{ title: 'Miradouro de Santa Luzia', latitude: 38.71237, longitude: -9.13086, country: 'Portugal' }] },
  { pattern: /fado dinner/i, stops: [{ title: 'Clube de Fado', latitude: 38.71017, longitude: -9.13253, country: 'Portugal' }] },
  { pattern: /jerónimos monastery|jeronimos monastery/i, stops: [{ title: 'Jerónimos Monastery', latitude: 38.6979, longitude: -9.20673, country: 'Portugal' }] },
  { pattern: /pastry break/i, stops: [{ title: 'Pastéis de Belém', latitude: 38.69748, longitude: -9.20322, country: 'Portugal' }] },
  { pattern: /belém tower|belem tower/i, stops: [{ title: 'Belém Tower', latitude: 38.69158, longitude: -9.21604, country: 'Portugal' }] },
  { pattern: /\bmaat\b/i, stops: [{ title: 'MAAT', latitude: 38.69578, longitude: -9.19468, country: 'Portugal' }] },
  { pattern: /lunch by the river|riverside lunch/i, stops: [{ title: 'Doca de Santo Amaro', latitude: 38.7015, longitude: -9.17377, country: 'Portugal' }] },
  { pattern: /monument area/i, stops: [{ title: 'Padrão dos Descobrimentos', latitude: 38.69361, longitude: -9.20571, country: 'Portugal' }] },
  { pattern: /alcântara|alcantara/i, stops: [{ title: 'LX Factory', latitude: 38.70334, longitude: -9.17839, country: 'Portugal' }] },
  { pattern: /príncipe real|principe real/i, stops: [{ title: 'Jardim do Príncipe Real', latitude: 38.71672, longitude: -9.14859, country: 'Portugal' }] },
  { pattern: /^scenic stop$/i, stops: [{ title: 'Miradouro de São Pedro de Alcântara', latitude: 38.71508, longitude: -9.14443, country: 'Portugal' }] },
  { pattern: /classic lunch/i, stops: [{ title: 'Bairro do Avillez', latitude: 38.71097, longitude: -9.14223, country: 'Portugal' }] },
  { pattern: /market browsing|casual food stop|time out market/i, stops: [{ title: 'Time Out Market Lisboa', latitude: 38.70697, longitude: -9.14562, country: 'Portugal' }] },
  { pattern: /tram viewpoint|viewpoint ride/i, stops: [{ title: 'Elevador da Bica', latitude: 38.70912, longitude: -9.14625, country: 'Portugal' }] },
  { pattern: /group dinner/i, stops: [{ title: 'Bairro Alto', latitude: 38.7131, longitude: -9.14456, country: 'Portugal' }] },
  { pattern: /drinks with a view/i, stops: [{ title: 'Park Bar Lisboa', latitude: 38.71058, longitude: -9.1453, country: 'Portugal' }] },
  { pattern: /castle visit/i, stops: [{ title: 'Castelo de São Jorge', latitude: 38.71391, longitude: -9.13348, country: 'Portugal' }] },
  { pattern: /viewpoint walk/i, stops: [{ title: 'Miradouro da Graça', latitude: 38.71634, longitude: -9.13085, country: 'Portugal' }] },
  { pattern: /traditional lunch/i, stops: [{ title: 'Zé da Mouraria', latitude: 38.71699, longitude: -9.13504, country: 'Portugal' }] },
  { pattern: /slow afternoon in graça|slow afternoon in graca/i, stops: [{ title: 'Graça', latitude: 38.71742, longitude: -9.12958, country: 'Portugal' }] },
  { pattern: /final scenic stop/i, stops: [{ title: 'Miradouro da Senhora do Monte', latitude: 38.71912, longitude: -9.13274, country: 'Portugal' }] },
  { pattern: /farewell dinner/i, stops: [{ title: 'Taberna da Rua das Flores', latitude: 38.70947, longitude: -9.1441, country: 'Portugal' }] },
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
  { pattern: /a for athens rooftop/i, stops: [{ title: 'A for Athens Rooftop', latitude: 37.97615, longitude: 23.72566, country: 'Greece' }] },
  { pattern: /\blotte\b/i, stops: [{ title: 'Lotte Cafe-Bistrot', latitude: 37.97075, longitude: 23.72794, country: 'Greece' }] },
  { pattern: /\bman[iy] mani\b/i, stops: [{ title: 'Mani Mani', latitude: 37.96758, longitude: 23.72739, country: 'Greece' }] },
  { pattern: /\bbrettos\b/i, stops: [{ title: 'Brettos', latitude: 37.97347, longitude: 23.73064, country: 'Greece' }] },
  { pattern: /point a bar/i, stops: [{ title: 'Point a Bar and Restaurant', latitude: 37.96856, longitude: 23.72819, country: 'Greece' }] },
  { pattern: /karamanlidika/i, stops: [{ title: 'Karamanlidika', latitude: 37.98005, longitude: 23.72563, country: 'Greece' }] },
  { pattern: /queen bee/i, stops: [{ title: 'Queen Bee', latitude: 37.97842, longitude: 23.74174, country: 'Greece' }] },
  { pattern: /\bdiporto\b/i, stops: [{ title: 'Diporto', latitude: 37.97993, longitude: 23.72628, country: 'Greece' }] },
  { pattern: /\batlantikos\b/i, stops: [{ title: 'Atlantikos', latitude: 37.97873, longitude: 23.72301, country: 'Greece' }] },
  { pattern: /varoulko seaside/i, stops: [{ title: 'Varoulko Seaside', latitude: 37.93988, longitude: 23.66447, country: 'Greece' }] },
  { pattern: /kalamaki bar/i, stops: [{ title: 'Kalamaki Bar', latitude: 37.96411, longitude: 23.72164, country: 'Greece' }] },
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
  { pattern: /ancient agora/i, stops: [{ title: 'Ancient Agora of Athens', latitude: 37.97569, longitude: 23.72247, country: 'Greece' }] },
  { pattern: /panathenaic stadium/i, stops: [{ title: 'Panathenaic Stadium', latitude: 37.96833, longitude: 23.74114, country: 'Greece' }] },
  { pattern: /brunch in kolonaki|\bkolonaki\b/i, stops: [{ title: 'Kolonaki', latitude: 37.97798, longitude: 23.74132, country: 'Greece' }] },
  { pattern: /museum stop|boutique browsing/i, stops: [{ title: 'Benaki Museum', latitude: 37.97595, longitude: 23.74029, country: 'Greece' }] },
  { pattern: /pangrati/i, stops: [{ title: 'Pangrati', latitude: 37.96991, longitude: 23.74531, country: 'Greece' }] },
  { pattern: /lycabettus/i, stops: [{ title: 'Lycabettus Hill', latitude: 37.98178, longitude: 23.74306, country: 'Greece' }] },
  { pattern: /cape sounion|temple of poseidon/i, stops: [{ title: 'Temple of Poseidon, Cape Sounion', latitude: 37.65062, longitude: 24.0246, country: 'Greece' }] },
  { pattern: /vouliagmeni|athens riviera/i, stops: [{ title: 'Lake Vouliagmeni', latitude: 37.80789, longitude: 23.78598, country: 'Greece' }] },
  { pattern: /\bglyfada\b/i, stops: [{ title: 'Glyfada', latitude: 37.86289, longitude: 23.7551, country: 'Greece' }] },
  { pattern: /\bpiraeus\b/i, stops: [{ title: 'Port of Piraeus', latitude: 37.94486, longitude: 23.64082, country: 'Greece' }] },
  {
    pattern: /colosseum.*roman forum|roman forum.*colosseum/i,
    stops: [
      { title: 'Colosseum', latitude: 41.89021, longitude: 12.49223, country: 'Italy' },
      { title: 'Roman Forum', latitude: 41.89246, longitude: 12.48533, country: 'Italy' },
    ],
  },
  {
    pattern: /vatican museums.*sistine chapel|sistine chapel.*vatican museums/i,
    stops: [
      { title: 'Vatican Museums', latitude: 41.90649, longitude: 12.45362, country: 'Vatican City' },
      { title: 'Sistine Chapel', latitude: 41.90293, longitude: 12.45486, country: 'Vatican City' },
    ],
  },
  { pattern: /la taverna dei fori imperiali/i, stops: [{ title: 'La Taverna dei Fori Imperiali', latitude: 41.89303, longitude: 12.48923, country: 'Italy' }] },
  { pattern: /piazza navona/i, stops: [{ title: 'Piazza Navona', latitude: 41.89893, longitude: 12.47307, country: 'Italy' }] },
  { pattern: /pizzarium bonci|bonci/i, stops: [{ title: 'Pizzarium Bonci', latitude: 41.90708, longitude: 12.44645, country: 'Italy' }] },
  { pattern: /st\.?\s*peter'?s basilica/i, stops: [{ title: "St. Peter's Basilica", latitude: 41.90217, longitude: 12.45394, country: 'Vatican City' }] },
  { pattern: /pantheon/i, stops: [{ title: 'Pantheon', latitude: 41.89861, longitude: 12.47687, country: 'Italy' }] },
  { pattern: /panino divino/i, stops: [{ title: 'Panino Divino', latitude: 41.90623, longitude: 12.45742, country: 'Italy' }] },
  { pattern: /trevi fountain/i, stops: [{ title: 'Trevi Fountain', latitude: 41.90093, longitude: 12.48331, country: 'Italy' }] },
  { pattern: /spanish steps/i, stops: [{ title: 'Spanish Steps', latitude: 41.90599, longitude: 12.48278, country: 'Italy' }] },
  { pattern: /villa borghese/i, stops: [{ title: 'Villa Borghese Gardens', latitude: 41.9142, longitude: 12.49232, country: 'Italy' }] },
  { pattern: /casina valadier/i, stops: [{ title: 'Casina Valadier', latitude: 41.91398, longitude: 12.48617, country: 'Italy' }] },
  { pattern: /galleria borghese/i, stops: [{ title: 'Galleria Borghese', latitude: 41.91421, longitude: 12.49217, country: 'Italy' }] },
  { pattern: /via del corso/i, stops: [{ title: 'Via del Corso', latitude: 41.90263, longitude: 12.47918, country: 'Italy' }] },
  { pattern: /passeggiata del gianicolo|gianicolo/i, stops: [{ title: 'Passeggiata del Gianicolo', latitude: 41.89137, longitude: 12.46143, country: 'Italy' }] },
  { pattern: /tonnarello/i, stops: [{ title: 'Tonnarello', latitude: 41.88934, longitude: 12.47103, country: 'Italy' }] },
  { pattern: /jerry thomas/i, stops: [{ title: 'Jerry Thomas Speakeasy', latitude: 41.89543, longitude: 12.47445, country: 'Italy' }] },
  { pattern: /freni e frizioni/i, stops: [{ title: 'Freni e Frizioni', latitude: 41.88908, longitude: 12.47014, country: 'Italy' }] },
  { pattern: /roscioli salumeria|roscioli/i, stops: [{ title: 'Roscioli Salumeria con Cucina', latitude: 41.89553, longitude: 12.47225, country: 'Italy' }] },
  { pattern: /trastevere/i, stops: [{ title: 'Trastevere', latitude: 41.88802, longitude: 12.46984, country: 'Italy' }] },
  { pattern: /senso-ji|sensō-ji|sensoji/i, stops: [{ title: 'Senso-ji Temple', latitude: 35.71476, longitude: 139.79666, country: 'Japan' }] },
  { pattern: /nakamise/i, stops: [{ title: 'Nakamise-dori', latitude: 35.71184, longitude: 139.79642, country: 'Japan' }] },
  { pattern: /daikokuya/i, stops: [{ title: 'Daikokuya Tempura', latitude: 35.71195, longitude: 139.79469, country: 'Japan' }] },
  { pattern: /tokyo national museum/i, stops: [{ title: 'Tokyo National Museum', latitude: 35.71884, longitude: 139.77652, country: 'Japan' }] },
  { pattern: /izakaya toyo/i, stops: [{ title: 'Izakaya Toyo', latitude: 35.67513, longitude: 139.77316, country: 'Japan' }] },
  { pattern: /meiji jingu/i, stops: [{ title: 'Meiji Jingu', latitude: 35.6764, longitude: 139.69933, country: 'Japan' }] },
  { pattern: /afuri harajuku/i, stops: [{ title: 'AFURI Harajuku', latitude: 35.67091, longitude: 139.70375, country: 'Japan' }] },
  { pattern: /shibuya sky/i, stops: [{ title: 'Shibuya Sky', latitude: 35.65854, longitude: 139.70208, country: 'Japan' }] },
  { pattern: /teamlab/i, stops: [{ title: 'teamLab Planets TOKYO', latitude: 35.64915, longitude: 139.78975, country: 'Japan' }] },
  { pattern: /uobei/i, stops: [{ title: 'Uobei Shibuya Dogenzaka', latitude: 35.66064, longitude: 139.69775, country: 'Japan' }] },
  { pattern: /tsukiji/i, stops: [{ title: 'Tsukiji Outer Market', latitude: 35.66549, longitude: 139.77074, country: 'Japan' }] },
  { pattern: /sushi daiwa|daiwa sushi/i, stops: [{ title: 'Daiwa Sushi', latitude: 35.64344, longitude: 139.7821, country: 'Japan' }] },
  { pattern: /nezu museum/i, stops: [{ title: 'Nezu Museum', latitude: 35.66229, longitude: 139.71693, country: 'Japan' }] },
  { pattern: /omotesando/i, stops: [{ title: 'Omotesando', latitude: 35.66525, longitude: 139.71232, country: 'Japan' }] },
  { pattern: /maisen aoyama/i, stops: [{ title: 'Maisen Aoyama', latitude: 35.66863, longitude: 139.71172, country: 'Japan' }] },
  { pattern: /ginza/i, stops: [{ title: 'Ginza', latitude: 35.67175, longitude: 139.76502, country: 'Japan' }] },
  { pattern: /imperial palace/i, stops: [{ title: 'Imperial Palace East Gardens', latitude: 35.68518, longitude: 139.75445, country: 'Japan' }] },
  { pattern: /ramen street/i, stops: [{ title: 'Tokyo Ramen Street', latitude: 35.68159, longitude: 139.7673, country: 'Japan' }] },
  { pattern: /golden gai/i, stops: [{ title: 'Shinjuku Golden Gai', latitude: 35.69412, longitude: 139.70464, country: 'Japan' }] },
  { pattern: /easy evening stroll/i, stops: [{ title: 'Sumida Park', latitude: 35.71013, longitude: 139.80336, country: 'Japan' }] },
  { pattern: /^day$/i, stops: [{ title: 'Shinjuku Golden Gai', latitude: 35.69412, longitude: 139.70464, country: 'Japan' }] },
]

export function buildDisplayStops<T extends TripItemLike>(items: T[]) {
  const sortedItems = sortTripItemsForDisplay(items)
  const displayStops: DisplayStop<T>[] = []

  for (const item of sortedItems) {
    const timeLabel = [item.start_time, item.end_time].filter(Boolean).join('–') || null
    const latitude = coerceCoordinate(item.place?.latitude)
    const longitude = coerceCoordinate(item.place?.longitude)

    if (latitude != null && longitude != null) {
      displayStops.push({
        id: item.id,
        title: item.title || item.place?.name || 'Untitled stop',
        latitude,
        longitude,
        index: displayStops.length + 1,
        item,
        placeName: item.place?.name || null,
        country: item.place?.country || null,
        timeLabel,
        mapped: true,
      })
      continue
    }

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
          country: stop.country || item.place?.country || null,
          timeLabel,
          mapped: true,
        })
      }
      continue
    }

    displayStops.push({
      id: item.id,
      title: item.title || item.place?.name || 'Untitled stop',
      latitude: 0,
      longitude: 0,
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
