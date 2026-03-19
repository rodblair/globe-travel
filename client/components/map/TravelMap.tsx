'use client'

import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

type Place = {
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
  status: 'visited' | 'bucket_list' | 'planning'
  visit_date?: string
  rating?: number
  notes?: string
  photo_url?: string
}

type TravelMapProps = {
  places: Place[]
  onMarkerClick?: (place: Place) => void
  className?: string
}

const statusColors = {
  visited: '#F59E0B',
  bucket_list: '#06B6D4',
  planning: '#A855F7',
}

export function TravelMap({ places, onMarkerClick, className }: TravelMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const createMarkerElement = useCallback((place: Place) => {
    const el = document.createElement('div')
    el.style.width = '32px'
    el.style.height = '32px'
    el.style.cursor = 'pointer'

    const color = statusColors[place.status] || statusColors.visited
    const isVisited = place.status === 'visited'
    const isBucket = place.status === 'bucket_list'

    el.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${isVisited ? color : 'transparent'}"
          stroke="${color}" stroke-width="${place.status === 'planning' ? '2' : '2.5'}"
          ${place.status === 'planning' ? 'stroke-dasharray="4 3"' : ''} />
        ${isVisited ? `
          <path d="M11 16.5L14.5 20L21 13" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        ` : ''}
        ${isBucket ? `
          <path d="M16 11L17.5 14.5L21 15L18.5 17.5L19 21L16 19.5L13 21L13.5 17.5L11 15L14.5 14.5Z" fill="${color}" stroke="${color}" stroke-width="0.5"/>
        ` : ''}
        ${place.status === 'planning' ? `
          <circle cx="16" cy="16" r="4" fill="${color}"/>
        ` : ''}
      </svg>
    `

    // Glow effect
    el.style.filter = `drop-shadow(0 0 6px ${color}40)`

    return el
  }, [])

  useEffect(() => {
    if (!mapContainerRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 1.5,
      projection: 'globe',
    })

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(10, 10, 15)',
        'high-color': 'rgb(20, 20, 40)',
        'horizon-blend': 0.08,
        'space-color': 'rgb(5, 5, 10)',
        'star-intensity': 0.6,
      })
    })

    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    // Add new markers
    const validPlaces = places.filter((p) => p.latitude && p.longitude)

    validPlaces.forEach((place) => {
      const el = createMarkerElement(place)
      if (onMarkerClick) {
        el.addEventListener('click', () => onMarkerClick(place))
      }

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([place.longitude, place.latitude])
        .addTo(map)

      markersRef.current.push(marker)
    })

    // Fit bounds
    if (validPlaces.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      validPlaces.forEach((p) => bounds.extend([p.longitude, p.latitude]))

      if (validPlaces.length === 1) {
        map.flyTo({ center: [validPlaces[0].longitude, validPlaces[0].latitude], zoom: 5 })
      } else {
        map.fitBounds(bounds, { padding: 80, maxZoom: 12 })
      }
    }
  }, [places, onMarkerClick, createMarkerElement])

  return (
    <div ref={mapContainerRef} className={className} style={{ width: '100%', height: '100%' }} />
  )
}
