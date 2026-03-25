'use client'

import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

export type TripStop = {
  id: string
  title: string
  latitude: number
  longitude: number
  index: number
}

type TripGlobeProps = {
  stops: TripStop[]
  routeGeojson?: any | null
  destinationLabel?: string | null
  destinationCenter?: { latitude: number; longitude: number } | null
  onStopClick?: (stop: TripStop) => void
  flyToRef?: React.MutableRefObject<((lat: number, lng: number, zoom?: number) => void) | null>
  className?: string
}

export default function TripGlobe({
  stops,
  routeGeojson,
  destinationLabel,
  destinationCenter,
  onStopClick,
  flyToRef,
  className,
}: TripGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const [globeUnavailable, setGlobeUnavailable] = useState(false)

  const spinEnabled = useRef(true)
  const userInteracting = useRef(false)
  const validStops = useMemo(
    () => (stops || []).filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude)),
    [stops]
  )
  const mapboxSupported = typeof window === 'undefined' ? true : mapboxgl.supported()

  const spinGlobe = useCallback(() => {
    const map = mapRef.current
    if (!map || userInteracting.current || !spinEnabled.current) return
    const center = map.getCenter()
    center.lng -= 0.2
    map.easeTo({ center, duration: 1000, easing: (n) => n })
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return
    if (!mapboxSupported) return

    mapboxgl.accessToken = token

    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/standard',
        config: {
          basemap: {
            lightPreset: 'night',
            showPointOfInterestLabels: false,
            showTransitLabels: false,
            showPlaceLabels: false,
            showRoadLabels: false,
          },
        },
        projection: 'globe',
        zoom: 1.35,
        center: [0, 25],
        attributionControl: false,
      })
    } catch {
      queueMicrotask(() => setGlobeUnavailable(true))
      return
    }

    mapRef.current = map

    map.on('style.load', () => {
      try {
        map.setConfigProperty('basemap', 'lightPreset', 'night')
        map.setConfigProperty('basemap', 'showPlaceLabels', false)
        map.setConfigProperty('basemap', 'showPointOfInterestLabels', false)
        map.setConfigProperty('basemap', 'showTransitLabels', false)
        map.setConfigProperty('basemap', 'showRoadLabels', false)
      } catch {
        // ignore
      }
      map.setFog({
        color: 'rgb(8, 8, 14)',
        'high-color': 'rgb(15, 18, 40)',
        'horizon-blend': 0.04,
        'space-color': 'rgb(4, 4, 10)',
        'star-intensity': 0.35,
      })
    })

    map.on('mousedown', () => { userInteracting.current = true })
    map.on('dragstart', () => { userInteracting.current = true })
    map.on('mouseup', () => {
      userInteracting.current = false
      spinGlobe()
    })
    map.on('touchstart', () => { userInteracting.current = true })
    map.on('touchend', () => {
      userInteracting.current = false
      spinGlobe()
    })
    map.on('moveend', () => {
      if (!userInteracting.current) spinGlobe()
    })

    map.on('load', () => {
      spinGlobe()

      if (flyToRef) {
        flyToRef.current = (lat: number, lng: number, zoom = 4) => {
          userInteracting.current = true
          map.flyTo({
            center: [lng, lat],
            zoom,
            duration: 1600,
            essential: true,
          })
          setTimeout(() => {
            userInteracting.current = false
          }, 2200)
        }
      }

      // Route layer
      if (!map.getSource('trip-route')) {
        map.addSource('trip-route', {
          type: 'geojson',
          data: routeGeojson || { type: 'FeatureCollection', features: [] },
        })
        map.addLayer({
          id: 'trip-route-line',
          type: 'line',
          source: 'trip-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': 'rgba(251,191,36,0.85)',
            'line-width': 3,
            'line-blur': 0.5,
          },
        })
      }
    })

    return () => {
      spinEnabled.current = false
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [spinGlobe, flyToRef, routeGeojson, mapboxSupported])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Update route geojson
    const src = map.getSource('trip-route') as mapboxgl.GeoJSONSource | undefined
    if (src) {
      src.setData(routeGeojson || { type: 'FeatureCollection', features: [] })
    }
  }, [routeGeojson])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    validStops.forEach((stop) => {
      const el = document.createElement('div')
      el.style.cssText = 'cursor:pointer;'
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          <div style="
            width:22px;height:22px;border-radius:999px;
            background:rgba(251,191,36,0.18);
            border:1px solid rgba(251,191,36,0.35);
            display:flex;align-items:center;justify-content:center;
            color:rgba(251,191,36,0.95);
            font-size:11px;font-weight:600;
            box-shadow:0 0 14px rgba(251,191,36,0.25);
          ">${stop.index}</div>
          <div style="
            font-size:10px;font-weight:500;letter-spacing:0.02em;
            font-family:Inter,system-ui,sans-serif;
            color:rgba(255,255,255,0.75);
            text-shadow:0 1px 6px rgba(0,0,0,0.9),0 0 3px rgba(0,0,0,0.8);
            white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis;
          ">${stop.title}</div>
        </div>
      `

      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onStopClick?.(stop)
        map.flyTo({ center: [stop.longitude, stop.latitude], zoom: 4, duration: 1200 })
      })

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([stop.longitude, stop.latitude])
        .addTo(map)
      markersRef.current.push(marker)
    })

    if (
      destinationLabel &&
      destinationCenter &&
      Number.isFinite(destinationCenter.latitude) &&
      Number.isFinite(destinationCenter.longitude)
    ) {
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <div style="
            width:12px;height:12px;border-radius:999px;
            background:rgba(251,191,36,0.95);
            box-shadow:0 0 0 4px rgba(251,191,36,0.18), 0 0 18px rgba(251,191,36,0.35);
          "></div>
          <div style="
            padding:4px 8px;border-radius:999px;
            background:rgba(5,5,16,0.82);
            border:1px solid rgba(251,191,36,0.22);
            color:rgba(255,255,255,0.88);
            font-size:11px;font-weight:600;letter-spacing:0.02em;
            font-family:Inter,system-ui,sans-serif;
            white-space:nowrap;
            text-shadow:0 1px 6px rgba(0,0,0,0.9);
          ">${destinationLabel}</div>
        </div>
      `

      const destinationMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([destinationCenter.longitude, destinationCenter.latitude])
        .addTo(map)

      markersRef.current.push(destinationMarker)
    }

    if (validStops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      for (const s of validStops) bounds.extend([s.longitude, s.latitude])
      map.fitBounds(bounds, { padding: 120, maxZoom: 6, duration: 1400 })
    }
  }, [validStops, onStopClick, destinationLabel, destinationCenter])

  if (!mapboxSupported || globeUnavailable) {
    return (
      <div
        className={className}
        style={{ width: '100%', height: '100%' }}
      >
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.12),transparent_45%),linear-gradient(180deg,rgba(6,6,16,0.96),rgba(3,4,10,0.98))]">
          <div className="rounded-3xl border border-white/10 bg-black/45 px-6 py-5 text-center backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/30">Trip Map</p>
            <p className="mt-2 text-lg font-medium text-white/85">{destinationLabel || 'Destination'}</p>
            <p className="mt-2 text-sm text-white/45">
              {validStops.length} mapped stop{validStops.length === 1 ? '' : 's'}
            </p>
            <p className="mt-4 text-xs text-white/35">
              Globe preview unavailable on this device. Day maps still render below.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />
}
