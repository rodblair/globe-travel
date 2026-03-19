'use client'

import { useEffect, useMemo, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { cn } from '@/lib/utils'

type TripDayMapStop = {
  id: string
  title: string
  latitude: number
  longitude: number
  index: number
}

type TripDayMapProps = {
  stops: TripDayMapStop[]
  routeGeojson?: GeoJSON.FeatureCollection | GeoJSON.Feature | null
  title: string
  subtitle?: string | null
  active?: boolean
  onClick?: () => void
  className?: string
}

export default function TripDayMap({
  stops,
  routeGeojson,
  title,
  subtitle,
  active = false,
  onClick,
  className,
}: TripDayMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const validStops = useMemo(
    () => stops.filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)),
    [stops]
  )

  useEffect(() => {
    if (!containerRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20],
      zoom: 1.25,
      attributionControl: false,
      interactive: false,
    })

    mapRef.current = map

    map.on('load', () => {
      map.addSource('day-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'day-route-line',
        type: 'line',
        source: 'day-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': 'rgba(125,211,252,0.85)',
          'line-width': 2.75,
          'line-blur': 0.3,
        },
      })
    })

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const source = map.getSource('day-route') as mapboxgl.GeoJSONSource | undefined
    if (source) {
      source.setData(routeGeojson || { type: 'FeatureCollection', features: [] })
    }

    if (map.getLayer('day-route-line')) {
      map.setPaintProperty(
        'day-route-line',
        'line-color',
        active ? 'rgba(251,191,36,0.95)' : 'rgba(125,211,252,0.85)'
      )
      map.setPaintProperty('day-route-line', 'line-width', active ? 3.5 : 2.75)
    }
  }, [routeGeojson, active])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    validStops.forEach((stop) => {
      const element = document.createElement('div')
      element.innerHTML = `
        <div style="
          width:20px;
          height:20px;
          border-radius:999px;
          background:${active ? 'rgba(251,191,36,0.92)' : 'rgba(125,211,252,0.9)'};
          color:#050510;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:10px;
          font-weight:700;
          box-shadow:0 0 0 2px rgba(5,5,16,0.8);
        ">${stop.index}</div>
      `

      const marker = new mapboxgl.Marker({ element, anchor: 'center' })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map)

      markersRef.current.push(marker)
    })

    if (validStops.length === 0) {
      map.flyTo({ center: [0, 20], zoom: 1.15, duration: 0 })
      return
    }

    const bounds = new mapboxgl.LngLatBounds()
    validStops.forEach((stop) => bounds.extend([stop.longitude, stop.latitude]))

    if (validStops.length === 1) {
      map.flyTo({
        center: [validStops[0].longitude, validStops[0].latitude],
        zoom: 10,
        duration: 0,
      })
      return
    }

    map.fitBounds(bounds, {
      padding: 42,
      maxZoom: 11,
      duration: 0,
    })
  }, [validStops, active])

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group min-w-[220px] overflow-hidden rounded-2xl border bg-black/40 text-left transition-colors',
        active
          ? 'border-amber-500/30 bg-amber-500/[0.06]'
          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.04]',
        className
      )}
    >
      <div className="relative h-32 w-full overflow-hidden">
        <div ref={containerRef} className="h-full w-full" />
        {validStops.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-center">
            <p className="max-w-[160px] text-xs text-white/45">
              Add place-aware activities to draw this day on the map.
            </p>
          </div>
        )}
      </div>

      <div className="px-3 py-3">
        <p className="text-xs font-medium text-white/80 truncate">{title}</p>
        <p className="mt-1 text-[11px] text-white/35 truncate">
          {subtitle || `${validStops.length} mapped stop${validStops.length === 1 ? '' : 's'}`}
        </p>
      </div>
    </button>
  )
}
