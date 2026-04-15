type DestinationProfile = {
  city: string
  country: string
  tags: string[]
  budget: 'budget' | 'mid' | 'luxury'
  walkability: number
  nightlife: number
  food: number
  culture: number
  relaxation: number
  weekendEase: number
}

const DESTINATIONS: DestinationProfile[] = [
  { city: 'Lisbon', country: 'Portugal', tags: ['food and wine', 'nightlife energy', 'walkable highlights', 'relaxed and cute'], budget: 'mid', walkability: 8, nightlife: 8, food: 9, culture: 8, relaxation: 7, weekendEase: 9 },
  { city: 'Barcelona', country: 'Spain', tags: ['food and wine', 'nightlife energy', 'design and culture', 'walkable highlights'], budget: 'mid', walkability: 8, nightlife: 9, food: 9, culture: 8, relaxation: 6, weekendEase: 8 },
  { city: 'Copenhagen', country: 'Denmark', tags: ['design and culture', 'walkable highlights', 'relaxed and cute'], budget: 'luxury', walkability: 9, nightlife: 6, food: 8, culture: 8, relaxation: 8, weekendEase: 8 },
  { city: 'Rome', country: 'Italy', tags: ['food and wine', 'design and culture', 'walkable highlights'], budget: 'mid', walkability: 7, nightlife: 6, food: 10, culture: 10, relaxation: 6, weekendEase: 8 },
  { city: 'Paris', country: 'France', tags: ['design and culture', 'food and wine', 'relaxed and cute'], budget: 'luxury', walkability: 9, nightlife: 7, food: 9, culture: 10, relaxation: 7, weekendEase: 8 },
  { city: 'Berlin', country: 'Germany', tags: ['nightlife energy', 'design and culture'], budget: 'mid', walkability: 7, nightlife: 10, food: 7, culture: 8, relaxation: 5, weekendEase: 7 },
  { city: 'Amsterdam', country: 'Netherlands', tags: ['walkable highlights', 'food and wine', 'relaxed and cute'], budget: 'luxury', walkability: 9, nightlife: 7, food: 8, culture: 8, relaxation: 7, weekendEase: 8 },
  { city: 'Budapest', country: 'Hungary', tags: ['budget-friendly', 'nightlife energy', 'walkable highlights'], budget: 'budget', walkability: 7, nightlife: 8, food: 7, culture: 7, relaxation: 6, weekendEase: 8 },
  { city: 'Madrid', country: 'Spain', tags: ['food and wine', 'nightlife energy', 'walkable highlights'], budget: 'mid', walkability: 7, nightlife: 9, food: 9, culture: 7, relaxation: 6, weekendEase: 8 },
  { city: 'Florence', country: 'Italy', tags: ['design and culture', 'food and wine', 'relaxed and cute'], budget: 'mid', walkability: 9, nightlife: 5, food: 8, culture: 9, relaxation: 8, weekendEase: 8 },
]

function normalize(input: string) {
  return input.trim().toLowerCase()
}

function budgetScore(destinationBudget: DestinationProfile['budget'], requestedBudget?: string | null) {
  if (!requestedBudget) return 7
  const normalizedBudget = normalize(requestedBudget)
  if (normalizedBudget.includes(destinationBudget)) return 10
  if (normalizedBudget === 'mid' && destinationBudget !== 'luxury') return 8
  if (normalizedBudget === 'budget' && destinationBudget === 'mid') return 5
  if (normalizedBudget === 'luxury' && destinationBudget === 'mid') return 8
  return 4
}

function vibeScore(destination: DestinationProfile, vibe?: string | null) {
  if (!vibe) return 7
  const normalizedVibe = normalize(vibe)
  if (destination.tags.some((tag) => normalizedVibe.includes(normalize(tag)) || normalize(tag).includes(normalizedVibe))) return 10
  if (normalizedVibe.includes('food')) return destination.food
  if (normalizedVibe.includes('night')) return destination.nightlife
  if (normalizedVibe.includes('design') || normalizedVibe.includes('culture')) return destination.culture
  if (normalizedVibe.includes('relaxed') || normalizedVibe.includes('cute')) return destination.relaxation
  if (normalizedVibe.includes('walk')) return destination.walkability
  return 7
}

function groupScore(groupSize?: number | null) {
  if (!groupSize) return 7
  if (groupSize <= 4) return 9
  if (groupSize <= 6) return 8
  return 6
}

function summarizeReasons(destination: DestinationProfile, vibe?: string | null, budget?: string | null) {
  const reasons = [
    `great for ${destination.tags.slice(0, 2).join(' and ')}`,
    `weekend ease ${destination.weekendEase}/10`,
    `walkability ${destination.walkability}/10`,
  ]
  if (vibe) reasons.push(`strong match for "${vibe}"`)
  if (budget) reasons.push(`budget fit ${budgetScore(destination.budget, budget)}/10`)
  return reasons
}

export function listScoredDestinations(input: {
  groupSize?: number | null
  budget?: string | null
  vibe?: string | null
  limit?: number
}) {
  const { groupSize, budget, vibe, limit = 5 } = input

  return DESTINATIONS
    .map((destination) => {
      const score =
        destination.weekendEase * 0.25 +
        destination.walkability * 0.2 +
        vibeScore(destination, vibe) * 0.25 +
        budgetScore(destination.budget, budget) * 0.2 +
        groupScore(groupSize) * 0.1

      return {
        city: destination.city,
        country: destination.country,
        score: Math.round(score * 10) / 10,
        reasons: summarizeReasons(destination, vibe, budget),
        tags: destination.tags,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function compareDestinations(input: {
  cities: string[]
  groupSize?: number | null
  budget?: string | null
  vibe?: string | null
}) {
  const requested = input.cities.map(normalize)
  const matches = DESTINATIONS.filter((destination) => requested.includes(normalize(destination.city)))

  return matches
    .map((destination) => ({
      city: destination.city,
      country: destination.country,
      score:
        Math.round((
          destination.weekendEase * 0.25 +
          destination.walkability * 0.2 +
          vibeScore(destination, input.vibe) * 0.25 +
          budgetScore(destination.budget, input.budget) * 0.2 +
          groupScore(input.groupSize) * 0.1
        ) * 10) / 10,
      strengths: summarizeReasons(destination, input.vibe, input.budget),
      caution:
        destination.budget === 'luxury' && input.budget === 'budget'
          ? 'May feel expensive for this group.'
          : destination.walkability < 7
            ? 'Requires a bit more transit planning.'
            : 'No major caution.',
    }))
    .sort((a, b) => b.score - a.score)
}
