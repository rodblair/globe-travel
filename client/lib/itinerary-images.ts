type ItineraryImageInput = {
  title?: string | null
  type?: string | null
  placeName?: string | null
  country?: string | null
  photoUrl?: string | null
}

type ItineraryImage = {
  src: string
  alt: string
}

const UNSPLASH_PARAMS = 'auto=format&fit=crop&w=640&q=78'

function unsplashPhoto(id: string) {
  return `https://images.unsplash.com/photo-${id}?${UNSPLASH_PARAMS}`
}

const PLACE_IMAGE_RULES: Array<{ pattern: RegExp; src: string }> = [
  { pattern: /couleur locale|coleur locale/i, src: 'https://www.thisisathens.org/sites/default/files/styles/social_share/public/2019-10/AKV-RooftopBars-CouleurLocale.jpg?itok=1zzWn1pc' },
  { pattern: /\bmani mani\b|\bmanimani\b|\bmanh\s*manh\b/i, src: 'https://www.thisisathens.org/sites/default/files/styles/social_share/public/2019-03/OWN_Restaurants_ManiMani.jpg?itok=e2pVJROw' },
  { pattern: /athinaikon|athinakon|mitropoleos/i, src: 'https://athinaikon.gr/wp-content/uploads/2023/03/DSC_0330-min-1.jpg' },
  { pattern: /acropolis|parthenon|ancient agora|athens/i, src: unsplashPhoto('1603565816030-6b389eeb23cb') },
  { pattern: /museum|gallery|cultural center|stavros niarchos|snfcc/i, src: unsplashPhoto('1564399579883-451a5d44ec08') },
  { pattern: /marina|riviera|flisvos|piraeus|harbor|harbour|waterfront/i, src: unsplashPhoto('1519046904884-53103b34b206') },
  { pattern: /beach|lake|vouliagmeni|coast|sea|island/i, src: unsplashPhoto('1507525428034-b723cf961d3e') },
  { pattern: /hotel|marriott|inn|resort|lodging|stay/i, src: unsplashPhoto('1500530855697-b586d89ba3ee') },
  { pattern: /sunset|viewpoint|hill|lookout|rooftop|lycabettus|sounion|poseidon/i, src: unsplashPhoto('1500534314209-a25ddb2bd429') },
  { pattern: /walk|street|neighborhood|neighbourhood|plaka|psiri|monastiraki|square/i, src: unsplashPhoto('1526772662000-3f88f10405ff') },
  { pattern: /venice|canal|ferry|boat|cruise/i, src: unsplashPhoto('1523906834658-6e24ef2386f9') },
]

const MEAL_FALLBACK_IMAGES = [
  unsplashPhoto('1517248135467-4c7edcad34c4'),
  unsplashPhoto('1519671482749-fd09be7ccebf'),
  unsplashPhoto('1548013146-72479768bada'),
]

const TYPE_IMAGE_RULES: Record<string, string | string[]> = {
  lodging: unsplashPhoto('1500530855697-b586d89ba3ee'),
  meal: MEAL_FALLBACK_IMAGES,
  activity: unsplashPhoto('1548013146-72479768bada'),
  transport: unsplashPhoto('1526772662000-3f88f10405ff'),
  transit: unsplashPhoto('1526772662000-3f88f10405ff'),
  note: unsplashPhoto('1500534314209-a25ddb2bd429'),
}

const DESTINATION_IMAGE_RULES: Array<{ pattern: RegExp; src: string }> = [
  { pattern: /greece|athens|aegina|santorini|crete/i, src: unsplashPhoto('1603565816030-6b389eeb23cb') },
  { pattern: /italy|rome|florence|venice|naples/i, src: unsplashPhoto('1523906834658-6e24ef2386f9') },
  { pattern: /portugal|lisbon|porto/i, src: unsplashPhoto('1528127269322-539801943592') },
  { pattern: /beach|coast|island/i, src: unsplashPhoto('1507525428034-b723cf961d3e') },
]

const DEFAULT_IMAGE = unsplashPhoto('1500534314209-a25ddb2bd429')

function imageAlt(input: ItineraryImageInput) {
  const label = input.placeName || input.title || 'Itinerary stop'
  const country = input.country ? ` in ${input.country}` : ''
  return `${label}${country}`
}

function stableIndex(value: string, length: number) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return length > 0 ? hash % length : 0
}

export function getItineraryItemImage(input: ItineraryImageInput): ItineraryImage {
  const savedPhoto = input.photoUrl?.trim()
  if (savedPhoto) return { src: savedPhoto, alt: imageAlt(input) }

  const searchText = [input.title, input.placeName, input.country, input.type].filter(Boolean).join(' ')
  const placeMatch = PLACE_IMAGE_RULES.find((rule) => rule.pattern.test(searchText))
  if (placeMatch) return { src: placeMatch.src, alt: imageAlt(input) }

  const typeImage = input.type ? TYPE_IMAGE_RULES[input.type] : null
  if (Array.isArray(typeImage)) {
    return { src: typeImage[stableIndex(searchText, typeImage.length)] || DEFAULT_IMAGE, alt: imageAlt(input) }
  }
  if (typeImage) return { src: typeImage, alt: imageAlt(input) }

  const destinationMatch = DESTINATION_IMAGE_RULES.find((rule) => rule.pattern.test(searchText))
  if (destinationMatch) return { src: destinationMatch.src, alt: imageAlt(input) }

  return { src: DEFAULT_IMAGE, alt: imageAlt(input) }
}
