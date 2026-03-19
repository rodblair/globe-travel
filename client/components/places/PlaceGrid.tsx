'use client'

import { PlaceCard } from './PlaceCard'

type Place = {
  id: string
  name: string
  country: string
  status: 'visited' | 'bucket_list' | 'planning'
  photo_url?: string
  rating?: number
  reason?: string
}

type PlaceGridProps = {
  places: Place[]
  onPlaceClick?: (place: Place) => void
}

export function PlaceGrid({ places, onPlaceClick }: PlaceGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {places.map((place, index) => (
        <div
          key={place.id}
          className={index % 5 === 0 ? 'sm:col-span-2 lg:col-span-2' : ''}
        >
          <PlaceCard
            name={place.name}
            country={place.country}
            status={place.status}
            photo_url={place.photo_url}
            rating={place.rating}
            reason={place.reason}
            onClick={() => onPlaceClick?.(place)}
          />
        </div>
      ))}
    </div>
  )
}
