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

function coerceCoordinate(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
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

function getStopRole(index: number, total: number) {
  if (total <= 1) return 'solo' as const
  if (index === 0) return 'start' as const
  if (index === total - 1) return 'finish' as const
  return 'waypoint' as const
}

function getRoleColors(role: ReturnType<typeof getStopRole>, active: boolean) {
  if (role === 'start') {
    return {
      outline: active ? 'rgba(110,231,183,0.92)' : 'rgba(110,231,183,0.82)',
      halo: active ? 'rgba(110,231,183,0.2)' : 'rgba(110,231,183,0.14)',
      fill: active ? 'rgba(110,231,183,1)' : 'rgba(110,231,183,0.95)',
    }
  }

  if (role === 'finish') {
    return {
      outline: active ? 'rgba(251,191,36,0.95)' : 'rgba(251,191,36,0.84)',
      halo: active ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.14)',
      fill: active ? 'rgba(251,191,36,1)' : 'rgba(251,191,36,0.95)',
    }
  }

  return {
    outline: active ? 'rgba(125,211,252,0.92)' : 'rgba(125,211,252,0.82)',
    halo: active ? 'rgba(125,211,252,0.16)' : 'rgba(125,211,252,0.12)',
    fill: active ? 'rgba(125,211,252,0.98)' : 'rgba(125,211,252,0.94)',
  }
}

function buildStopPath(stops: TripDayMapStop[]) {
  if (stops.length === 0) return null

  const longitudes = stops.map((stop) => stop.longitude)
  const latitudes = stops.map((stop) => stop.latitude)
  const minLng = Math.min(...longitudes)
  const maxLng = Math.max(...longitudes)
  const minLat = Math.min(...latitudes)
  const maxLat = Math.max(...latitudes)
  const lngSpan = Math.max(maxLng - minLng, 0.01)
  const latSpan = Math.max(maxLat - minLat, 0.01)
  const padding = 18
  const width = 100
  const height = 100

  const project = (longitude: number, latitude: number) => {
    const x = padding + ((longitude - minLng) / lngSpan) * (width - padding * 2)
    const y = height - padding - ((latitude - minLat) / latSpan) * (height - padding * 2)
    return [x, y] as const
  }

  const pointNodes = stops.map((stop) => {
    const [x, y] = project(stop.longitude, stop.latitude)
    return { ...stop, x, y }
  })

  return {
    linePoints: pointNodes.map((point) => `${point.x},${point.y}`).join(' '),
    pointNodes,
  }
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
  const [mapFailed, setMapFailed] = useState(false)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const shouldRenderInteractive = interactive && Boolean(mapboxToken) && !mapFailed

  const validStops = useMemo(
    () =>
      stops
        .map((stop) => {
          const latitude = coerceCoordinate(stop.latitude)
          const longitude = coerceCoordinate(stop.longitude)
          if (latitude == null || longitude == null) return null
          return {
            ...stop,
            latitude,
            longitude,
          }
        })
        .filter((stop): stop is TripDayMapStop => stop !== null),
    [stops]
  )

  const previewGeometry = useMemo(() => {
    const lineFeature =
      routeGeojson && routeGeojson.type === 'Feature'
        ? routeGeojson
        : routeGeojson &&
            routeGeojson.type === 'FeatureCollection' &&
            routeGeojson.features.find((feature) => feature.geometry?.type === 'LineString')
          ? routeGeojson.features.find((feature) => feature.geometry?.type === 'LineString')
          : null

    const lineCoordinates: [number, number][] =
      lineFeature?.geometry?.type === 'LineString'
        ? lineFeature.geometry.coordinates
            .filter((coordinate): coordinate is [number, number] => coordinate.length >= 2)
            .map((coordinate) => [coordinate[0], coordinate[1]])
        : validStops.map((stop) => [stop.longitude, stop.latitude] as [number, number])

    const points = validStops.map((stop) => ({
      ...stop,
      longitude: stop.longitude,
      latitude: stop.latitude,
    }))

    const allCoordinates = [
      ...lineCoordinates,
      ...points.map((point) => [point.longitude, point.latitude] as [number, number]),
    ]

    if (allCoordinates.length === 0) return null

    const longitudes = allCoordinates.map(([longitude]) => longitude)
    const latitudes = allCoordinates.map(([, latitude]) => latitude)
    const minLng = Math.min(...longitudes)
    const maxLng = Math.max(...longitudes)
    const minLat = Math.min(...latitudes)
    const maxLat = Math.max(...latitudes)
    const lngSpan = Math.max(maxLng - minLng, 0.01)
    const latSpan = Math.max(maxLat - minLat, 0.01)
    const padding = 24
    const width = 100
    const height = 100

    const project = ([longitude, latitude]: [number, number]) => {
      const x = padding + ((longitude - minLng) / lngSpan) * (width - padding * 2)
      const y = height - padding - ((latitude - minLat) / latSpan) * (height - padding * 2)
      return [x, y] as const
    }

    return {
      linePoints: lineCoordinates.map(project).map(([x, y]) => `${x},${y}`).join(' '),
      pointNodes: points.map((point) => {
        const [x, y] = project([point.longitude, point.latitude])
        return { ...point, x, y }
      }),
    }
  }, [routeGeojson, validStops])

  const stopOnlyPreview = useMemo(() => buildStopPath(validStops), [validStops])
  const startStop = validStops[0] || null
  const endStop = validStops.length > 1 ? validStops[validStops.length - 1] : validStops[0] || null

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
    if (!interactive) return
    if (!containerRef.current) return
    if (!mapboxToken) return

    mapboxgl.accessToken = mapboxToken

    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/navigation-night-v1',
        center: [0, 20],
        zoom: 1.25,
        attributionControl: false,
        interactive,
        dragRotate: false,
        touchZoomRotate: interactive ? { around: 'center' } : false,
      })
    } catch {
      queueMicrotask(() => setMapFailed(true))
      return
    }

    mapRef.current = map
    if (interactive) {
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
    }

    map.on('error', () => {
      setMapFailed(true)
    })

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
  }, [interactive, mapboxToken])

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
      const role = getStopRole(stop.index - 1, validStops.length)
      const colors = getRoleColors(role, active)
      const element = document.createElement('div')
      element.innerHTML = `
        <div style="
          width:${interactive ? 24 : 20}px;
          height:${interactive ? 24 : 20}px;
          border-radius:999px;
          background:${colors.fill};
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
        'group min-w-[220px] overflow-hidden rounded-[24px] border bg-black/40 text-left transition-colors shadow-[0_18px_60px_rgba(0,0,0,0.28)]',
        active
          ? 'border-amber-400/32 bg-amber-400/[0.06]'
          : 'border-white/12 hover:border-white/22 hover:bg-white/[0.045]',
        onClick ? 'cursor-pointer' : '',
        className
      )}
    >
      <div className={cn('relative w-full overflow-hidden border-b border-white/12 bg-[#060814]', mapHeightClassName)}>
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
          <span className="rounded-full border border-white/12 bg-[rgba(8,10,18,0.78)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/78 shadow-[0_10px_20px_rgba(0,0,0,0.22)]">
            Walking Map
          </span>
          <span className="rounded-full border border-white/12 bg-[rgba(8,10,18,0.78)] px-2.5 py-1 text-[10px] font-medium tabular-nums text-white/76 shadow-[0_10px_20px_rgba(0,0,0,0.22)]">
            {validStops.length} stop{validStops.length === 1 ? '' : 's'}
          </span>
        </div>
        {routeSummary && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-[rgba(8,10,18,0.8)] px-3 py-1.5 shadow-[0_10px_20px_rgba(0,0,0,0.24)]">
              <span className={cn('h-2 w-2 rounded-full', active ? 'bg-amber-300' : 'bg-sky-300')} />
              <span className="truncate text-[11px] font-medium tracking-[0.01em] text-white/84">{routeSummary}</span>
            </div>
          </div>
        )}
        {validStops.length > 1 && (
          <div className="pointer-events-none absolute left-3 top-12 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-[rgba(8,10,18,0.76)] px-2.5 py-1 text-[10px] font-medium text-emerald-100/92">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Start: {startStop?.title}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-[rgba(8,10,18,0.76)] px-2.5 py-1 text-[10px] font-medium text-amber-100/92">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Finish: {endStop?.title}
            </span>
          </div>
        )}
        {shouldRenderInteractive ? (
          <div ref={containerRef} className="h-full w-full" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.14),transparent_58%),linear-gradient(180deg,rgba(9,12,24,0.96),rgba(4,5,12,0.98))]">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:28px_28px] opacity-35" />
            {(previewGeometry || stopOnlyPreview) && (
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {(previewGeometry || stopOnlyPreview)?.linePoints && (
                  <polyline
                    points={(previewGeometry || stopOnlyPreview)!.linePoints}
                    fill="none"
                    stroke={active ? 'rgba(251,191,36,0.95)' : 'rgba(125,211,252,0.92)'}
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {(previewGeometry || stopOnlyPreview)!.pointNodes.map((point, index, points) => {
                  const role = getStopRole(index, points.length)
                  const colors = getRoleColors(role, active)
                  return (
                  <g key={point.id}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="4.8"
                      fill={colors.halo}
                      stroke={colors.outline}
                      strokeWidth="1.2"
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r="2.2"
                      fill={colors.fill}
                    />
                    <text
                      x={point.x}
                      y={point.y + 0.8}
                      textAnchor="middle"
                      fontSize="3.5"
                      fontWeight="700"
                      fill="rgba(5,5,16,0.95)"
                    >
                      {point.index}
                    </text>
                    {!interactive && (
                      <text
                        x={point.x}
                        y={point.y + 8}
                        textAnchor="middle"
                        fontSize="3.25"
                        fontWeight="600"
                        letterSpacing="0.02em"
                        fill="rgba(255,255,255,0.9)"
                      >
                        {point.title.slice(0, 18)}
                      </text>
                    )}
                  </g>
                )})}
              </svg>
            )}
          </div>
        )}
        {validStops.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-center">
            <p className="max-w-[160px] text-xs text-white/45">
              Add place-aware activities to draw this day on the map.
            </p>
          </div>
        )}
        {!shouldRenderInteractive && !previewGeometry && !stopOnlyPreview && validStops.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-center">
            <p className="max-w-[180px] text-xs text-white/45">
              Day preview could not be drawn from the current stop geometry.
            </p>
          </div>
        )}
        {interactive && !shouldRenderInteractive && validStops.length > 0 && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-amber-300/20 bg-[rgba(8,10,18,0.82)] px-2.5 py-1 text-[10px] font-medium text-amber-100/92">
            Static map fallback
          </div>
        )}
      </div>

      {showDetails && (
        <div className="px-3.5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium tracking-[0.01em] text-white">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/62 truncate">
                {subtitle || `${validStops.length} mapped stop${validStops.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <span className="inline-flex flex-shrink-0 rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/62">
              Day
            </span>
          </div>
          {!routeSummary && (
            <p className="mt-2 text-[11px] font-medium text-white/76">
              {validStops.length > 0 ? 'Route ready to review' : 'No mapped stops yet'}
            </p>
          )}
          {routeSummary && (
            <p className="mt-2 text-[11px] font-medium text-amber-200 truncate">
              {routeSummary}
            </p>
          )}
          {startStop && endStop && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.08] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-100/74">Start</p>
                <p className="mt-1 truncate text-xs font-medium text-white">{startStop.title}</p>
              </div>
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.08] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-100/74">Finish</p>
                <p className="mt-1 truncate text-xs font-medium text-white">{endStop.title}</p>
              </div>
            </div>
          )}
          {stopPreview.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stopPreview.slice(0, 3).map((stop, index) => (
                <span
                  key={`${stop}-${index}`}
                  className="inline-flex max-w-[142px] items-center gap-1 rounded-full border border-white/12 bg-white/8 px-2.5 py-1 text-[10px] text-white/72"
                >
                  <span className="font-semibold tabular-nums text-amber-200">{index + 1}</span>
                  <span className="truncate">{stop}</span>
                </span>
              ))}
              {stopPreview.length > 3 && (
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] text-white/55">
                  +{stopPreview.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
