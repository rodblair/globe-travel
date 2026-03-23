'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  routeSummary?: string | null
  stopPreview?: string[]
  interactive?: boolean
  mapHeightClassName?: string
  showDetails?: boolean
  active?: boolean
  onClick?: () => void
  className?: string
}

export default function TripDayMap({
  stops,
  routeGeojson,
  title,
  subtitle,
  routeSummary,
  stopPreview = [],
  interactive = false,
  mapHeightClassName = 'h-32',
  showDetails = true,
  active = false,
  onClick,
  className,
}: TripDayMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)

  const validStops = useMemo(
    () => stops.filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)),
    [stops]
  )

  const fitMapToStops = useCallback((map: mapboxgl.Map) => {
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
      padding: interactive ? 56 : 42,
      maxZoom: interactive ? 13 : 11,
      duration: 0,
    })
  }, [interactive, validStops])

  useEffect(() => {
    if (!containerRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: [0, 20],
      zoom: 1.25,
      attributionControl: false,
      interactive,
      dragRotate: false,
      touchZoomRotate: interactive ? { around: 'center' } : false,
    })

    mapRef.current = map
    if (interactive) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    }

    map.on('load', () => {
      setMapReady(true)
      map.addSource('day-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addSource('day-stops', {
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

      map.addLayer({
        id: 'day-stop-outline',
        type: 'circle',
        source: 'day-stops',
        paint: {
          'circle-radius': interactive ? 18 : 12,
          'circle-color': 'rgba(125,211,252,0.12)',
          'circle-stroke-width': interactive ? 2 : 1.5,
          'circle-stroke-color': 'rgba(125,211,252,0.75)',
        },
      })

      map.addLayer({
        id: 'day-stop-fill',
        type: 'circle',
        source: 'day-stops',
        paint: {
          'circle-radius': interactive ? 6 : 4,
          'circle-color': 'rgba(125,211,252,0.92)',
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(5,5,16,0.9)',
        },
      })

      map.addLayer({
        id: 'day-stop-labels',
        type: 'symbol',
        source: 'day-stops',
        layout: {
          'text-field': ['get', 'title'],
          'text-size': interactive ? 11 : 10,
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          visibility: interactive ? 'visible' : 'none',
        },
        paint: {
          'text-color': 'rgba(255,255,255,0.82)',
          'text-halo-color': 'rgba(5,5,16,0.92)',
          'text-halo-width': 1.1,
        },
      })
    })

    return () => {
      setMapReady(false)
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [interactive])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

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
  }, [routeGeojson, active, mapReady])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const stopSource = map.getSource('day-stops') as mapboxgl.GeoJSONSource | undefined
    if (stopSource) {
      stopSource.setData({
        type: 'FeatureCollection',
        features: validStops.map((stop) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [stop.longitude, stop.latitude],
          },
          properties: {
            id: stop.id,
            index: stop.index,
            title: stop.title,
          },
        })),
      } as GeoJSON.FeatureCollection)
    }

    if (map.getLayer('day-stop-outline')) {
      map.setPaintProperty(
        'day-stop-outline',
        'circle-color',
        active ? 'rgba(251,191,36,0.1)' : 'rgba(125,211,252,0.12)'
      )
      map.setPaintProperty(
        'day-stop-outline',
        'circle-stroke-color',
        active ? 'rgba(251,191,36,0.78)' : 'rgba(125,211,252,0.75)'
      )
      map.setPaintProperty('day-stop-outline', 'circle-radius', interactive ? 18 : 12)
    }

    if (map.getLayer('day-stop-fill')) {
      map.setPaintProperty(
        'day-stop-fill',
        'circle-color',
        active ? 'rgba(251,191,36,0.92)' : 'rgba(125,211,252,0.92)'
      )
      map.setPaintProperty('day-stop-fill', 'circle-radius', interactive ? 6 : 4)
    }

    if (map.getLayer('day-stop-labels')) {
      map.setLayoutProperty('day-stop-labels', 'visibility', interactive ? 'visible' : 'none')
      map.setLayoutProperty('day-stop-labels', 'text-size', interactive ? 11 : 10)
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    validStops.forEach((stop) => {
      const element = document.createElement('div')
      element.innerHTML = `
        <div style="
          width:${interactive ? 24 : 20}px;
          height:${interactive ? 24 : 20}px;
          border-radius:999px;
          background:${active ? 'rgba(251,191,36,0.92)' : 'rgba(125,211,252,0.9)'};
          color:#050510;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${interactive ? 11 : 10}px;
          font-weight:700;
          box-shadow:0 0 0 2px rgba(5,5,16,0.8);
        ">${stop.index}</div>
      `

      const marker = new mapboxgl.Marker({ element, anchor: 'center' })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map)

      markersRef.current.push(marker)
    })

    fitMapToStops(map)
  }, [validStops, active, mapReady, interactive, fitMapToStops])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    const frame = window.requestAnimationFrame(() => {
      map.resize()
      fitMapToStops(map)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [mapHeightClassName, mapReady, interactive, validStops, fitMapToStops])

  return (
    <div
      onClick={onClick}
      className={cn(
        'group min-w-[220px] overflow-hidden rounded-2xl border bg-black/40 text-left transition-colors',
        active
          ? 'border-amber-500/30 bg-amber-500/[0.06]'
          : 'border-white/10 hover:border-white/20 hover:bg-white/[0.04]',
        onClick ? 'cursor-pointer' : '',
        className
      )}
    >
      <div className={cn('relative w-full overflow-hidden', mapHeightClassName)}>
        <div ref={containerRef} className="h-full w-full" />
        {validStops.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-center">
            <p className="max-w-[160px] text-xs text-white/45">
              Add place-aware activities to draw this day on the map.
            </p>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="px-3 py-3">
          <p className="text-xs font-medium text-white/80 truncate">{title}</p>
          <p className="mt-1 text-[11px] text-white/35 truncate">
            {subtitle || `${validStops.length} mapped stop${validStops.length === 1 ? '' : 's'}`}
          </p>
          {routeSummary && (
            <p className="mt-1 text-[11px] text-amber-300/80 truncate">
              {routeSummary}
            </p>
          )}
          {stopPreview.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stopPreview.slice(0, 3).map((stop, index) => (
                <span
                  key={`${stop}-${index}`}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/55"
                >
                  <span className="text-amber-300/80">{index + 1}</span>
                  <span className="truncate max-w-[120px]">{stop}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
