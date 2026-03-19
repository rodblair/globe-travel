'use client'

import { useEffect, useRef, useCallback } from 'react'
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
  onStopClick?: (stop: TripStop) => void
  flyToRef?: React.MutableRefObject<((lat: number, lng: number, zoom?: number) => void) | null>
  className?: string
}

export default function TripGlobe({
  stops,
  routeGeojson,
  onStopClick,
  flyToRef,
  className,
}: TripGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const spinEnabled = useRef(true)
  const userInteracting = useRef(false)

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

    mapboxgl.accessToken = token

    const map = new mapboxgl.Map({
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
  }, [spinGlobe, flyToRef, routeGeojson])

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

    const validStops = (stops || []).filter((s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude))

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

    if (validStops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds()
      for (const s of validStops) bounds.extend([s.longitude, s.latitude])
      map.fitBounds(bounds, { padding: 120, maxZoom: 6, duration: 1400 })
    }
  }, [stops, onStopClick])

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />
}

