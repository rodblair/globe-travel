'use client'

import type { KeyboardEvent, WheelEvent } from 'react'
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
  forceStatic?: boolean
  className?: string
  ariaLabel?: string
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

function applyMapCanvasAccessibility(map: mapboxgl.Map, label: string) {
  const canvas = map.getCanvas()
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', label)
}

function normalizeWheelDelta(event: WheelEvent<HTMLDivElement>) {
  if (event.deltaMode === 1) {
    return { x: event.deltaX * 16, y: event.deltaY * 16 }
  }

  if (event.deltaMode === 2) {
    return { x: event.deltaX * window.innerWidth, y: event.deltaY * window.innerHeight }
  }

  return { x: event.deltaX, y: event.deltaY }
}

function canScrollElement(element: HTMLElement, deltaY: number, deltaX: number) {
  const style = window.getComputedStyle(element)
  const canScrollY = /(auto|scroll|overlay)/.test(style.overflowY) && element.scrollHeight > element.clientHeight
  const canScrollX = /(auto|scroll|overlay)/.test(style.overflowX) && element.scrollWidth > element.clientWidth
  const canMoveY =
    canScrollY &&
    ((deltaY < 0 && element.scrollTop > 0) ||
      (deltaY > 0 && element.scrollTop + element.clientHeight < element.scrollHeight))
  const canMoveX =
    canScrollX &&
    ((deltaX < 0 && element.scrollLeft > 0) ||
      (deltaX > 0 && element.scrollLeft + element.clientWidth < element.scrollWidth))

  return canMoveY || canMoveX
}

function findNearestPageScrollSurface(startElement: HTMLElement, deltaY: number, deltaX: number) {
  let parent = startElement.parentElement

  while (parent && parent !== document.body) {
    if (canScrollElement(parent, deltaY, deltaX)) {
      return parent
    }

    parent = parent.parentElement
  }

  const scrollingElement = document.scrollingElement
  if (scrollingElement instanceof HTMLElement && canScrollElement(scrollingElement, deltaY, deltaX)) {
    return scrollingElement
  }

  return null
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
  forceStatic = false,
  className,
  ariaLabel,
}: TripDayMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapFailed, setMapFailed] = useState(false)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const shouldRenderMap = Boolean(mapboxToken) && !mapFailed && !forceStatic

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
        .filter((stop): stop is TripDayMapStop => stop !== null)
        .map((stop, index) => ({
          ...stop,
          index: index + 1,
        })),
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
  const usingStaticFallback = !shouldRenderMap && validStops.length > 0
  const mapLabel = usingStaticFallback
    ? 'Static Route'
    : routeGeojson && routeSummary?.includes('min walk')
      ? 'Walking Map'
      : 'Trip Map'
  const canvasAriaLabel =
    ariaLabel ||
    `${title} ${mapLabel.toLowerCase()} with ${validStops.length} mapped stop${validStops.length === 1 ? '' : 's'}`
  const canvasAriaLabelRef = useRef(canvasAriaLabel)

  const handleCardKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onClick()
  }, [onClick])

  const handleMapWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    if (event.ctrlKey || event.metaKey) return

    const { x, y } = normalizeWheelDelta(event)
    if (Math.abs(x) < 1 && Math.abs(y) < 1) return

    const scrollSurface = findNearestPageScrollSurface(event.currentTarget, y, x)
    if (!scrollSurface) return

    const previousScrollTop = scrollSurface.scrollTop
    const previousScrollLeft = scrollSurface.scrollLeft

    window.requestAnimationFrame(() => {
      if (!scrollSurface.isConnected) return
      const nativeScrollHandled =
        scrollSurface.scrollTop !== previousScrollTop || scrollSurface.scrollLeft !== previousScrollLeft

      if (!nativeScrollHandled) {
        scrollSurface.scrollBy({ top: y, left: x, behavior: 'auto' })
      }
    })
  }, [])

  useEffect(() => {
    canvasAriaLabelRef.current = canvasAriaLabel
  }, [canvasAriaLabel])

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
      maxZoom: interactive ? 14 : 13,
      duration: 0,
    })
  }, [interactive, validStops])

  useEffect(() => {
    if (!containerRef.current) return
    if (!mapboxToken || forceStatic) return

    mapboxgl.accessToken = mapboxToken

    let map: mapboxgl.Map
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [0, 20],
        zoom: 1.25,
        attributionControl: false,
        // Wheel/trackpad gestures should keep scrolling the page even when the
        // cursor is over the map. Zoom remains available through map controls.
        scrollZoom: false,
        // Non-interactive maps must NOT capture pointer events — doing so
        // prevents the parent page/panel from scrolling between days.
        interactive,
        dragRotate: false,
        touchZoomRotate: interactive ? { around: 'center' } : false,
      })
    } catch {
      queueMicrotask(() => setMapFailed(true))
      return
    }

    mapRef.current = map
    applyMapCanvasAccessibility(map, canvasAriaLabelRef.current)
    if (interactive) map.dragRotate.disable()

    // +/− zoom buttons work programmatically even on non-interactive maps.
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

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
          'line-color': 'rgba(159,105,32,0.88)',
          'line-width': 2.75,
          'line-blur': 0.3,
        },
      })

      map.addLayer({
        id: 'day-stop-labels',
        type: 'symbol',
        source: 'day-stops',
        layout: {
          'text-field': ['to-string', ['get', 'index']],
          'text-size': interactive ? 12 : 10,
          'text-offset': [0, 0.05],
          'text-anchor': 'center',
          visibility: 'visible',
        },
        paint: {
          'text-color': 'rgba(28,42,55,0.94)',
          'text-halo-color': 'rgba(255,252,244,0.96)',
          'text-halo-width': 0.9,
        },
      })
    })

    return () => {
      setMapReady(false)
      map.remove()
      mapRef.current = null
    }
  }, [interactive, mapboxToken, forceStatic])

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
        active ? 'rgba(159,105,32,0.95)' : 'rgba(44,117,134,0.82)'
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

    if (map.getLayer('day-stop-labels')) {
      map.setLayoutProperty('day-stop-labels', 'visibility', 'visible')
      map.setLayoutProperty('day-stop-labels', 'text-size', interactive ? 12 : 10)
      map.setPaintProperty('day-stop-labels', 'text-color', active ? 'rgba(112,73,26,0.96)' : 'rgba(28,42,55,0.94)')
    }

    fitMapToStops(map)
  }, [validStops, active, mapReady, interactive, fitMapToStops, title])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    applyMapCanvasAccessibility(map, canvasAriaLabel)
  }, [canvasAriaLabel, mapReady])

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
      onKeyDown={handleCardKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-current={onClick && active ? 'true' : undefined}
      aria-label={onClick ? `${title}${subtitle ? `: ${subtitle}` : ''}. ${canvasAriaLabel}` : undefined}
      className={cn(
        'group min-w-[220px] overflow-hidden rounded-[24px] border bg-paper-raised/85 text-left transition-colors shadow-[var(--panel-shadow)]',
        active
          ? 'border-[color:var(--brass)]/30 bg-[var(--brass-subtle)]'
          : 'border-rule hover:border-rule hover:bg-paper-recessed/60',
        onClick ? 'cursor-pointer' : '',
        className
      )}
    >
      <div
        className={cn('relative w-full overflow-hidden border-b border-rule bg-[var(--paper-recessed)]', mapHeightClassName)}
        onWheelCapture={handleMapWheel}
      >
        <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-center justify-between gap-2">
          <span className="rounded-full border border-rule bg-paper-raised/88 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/78 shadow-[0_10px_20px_rgba(28,42,55,0.08)]">
            {mapLabel}
          </span>
          <span className="rounded-full border border-rule bg-paper-raised/88 px-2.5 py-1 text-[10px] font-medium tabular-nums text-foreground/76 shadow-[0_10px_20px_rgba(28,42,55,0.08)]">
            {validStops.length} stop{validStops.length === 1 ? '' : 's'}
          </span>
        </div>
        {routeSummary && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10">
            <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-rule bg-paper-raised/90 px-3 py-1.5 shadow-[0_10px_20px_rgba(28,42,55,0.1)]">
              <span className={cn('h-2 w-2 rounded-full', active ? 'bg-[var(--brass)]' : 'bg-[var(--horizon)]')} />
              <span className="truncate text-[11px] font-medium tracking-[0.01em] text-foreground/84">{routeSummary}</span>
            </div>
          </div>
        )}
        {interactive && validStops.length > 1 && (
          <div className="pointer-events-none absolute left-3 top-12 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--pillar-nature-wash)] bg-paper-raised/88 px-2.5 py-1 text-[10px] font-medium text-[var(--moss)]">
              <span className="h-2 w-2 rounded-full bg-[var(--moss)]" />
              Start: {startStop?.title}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brass)]/30 bg-paper-raised/88 px-2.5 py-1 text-[10px] font-medium text-[var(--brass)]">
              <span className="h-2 w-2 rounded-full bg-[var(--brass)]" />
              Finish: {endStop?.title}
            </span>
          </div>
        )}
        {shouldRenderMap ? (
          <div ref={containerRef} className="h-full w-full" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,color-mix(in_oklch,var(--horizon),transparent_82%),transparent_58%),linear-gradient(180deg,var(--paper-raised),var(--paper-recessed))]">
            <div className="absolute inset-0 bg-[linear-gradient(color-mix(in_oklch,var(--ink-3),transparent_88%)_1px,transparent_1px),linear-gradient(90deg,color-mix(in_oklch,var(--ink-3),transparent_88%)_1px,transparent_1px)] bg-[size:28px_28px] opacity-45" />
            {(previewGeometry || stopOnlyPreview) && (
              <svg viewBox="0 0 100 100" role="img" aria-label={canvasAriaLabel} className="h-full w-full">
                {(previewGeometry || stopOnlyPreview)?.linePoints && (
                  <polyline
                    points={(previewGeometry || stopOnlyPreview)!.linePoints}
                    fill="none"
                    stroke={active ? 'rgba(159,105,32,0.95)' : 'rgba(44,117,134,0.86)'}
                    strokeWidth="2.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {(previewGeometry || stopOnlyPreview)!.pointNodes.map((point) => {
                  return (
                  <g key={point.id}>
                    <text
                      x={point.x}
                      y={point.y + 0.8}
                      textAnchor="middle"
                      fontSize="5"
                      fontWeight="800"
                      fill={active ? 'rgba(112,73,26,0.96)' : 'rgba(28,42,55,0.94)'}
                      paintOrder="stroke"
                      stroke="rgba(255,252,244,0.96)"
                      strokeWidth="1.15"
                    >
                      {point.index}
                    </text>
                  </g>
                )})}
              </svg>
            )}
          </div>
        )}
        {validStops.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper-raised/85 text-center">
            <p className="max-w-[160px] text-xs text-foreground/45">
              Add place-aware activities to draw this day on the map.
            </p>
          </div>
        )}
        {!shouldRenderMap && !previewGeometry && !stopOnlyPreview && validStops.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper-raised/85 text-center">
            <p className="max-w-[180px] text-xs text-foreground/45">
              Day preview could not be drawn from the current stop geometry.
            </p>
          </div>
        )}
        {usingStaticFallback && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full border border-[color:var(--brass)]/30 bg-[rgba(8,10,18,0.82)] px-2.5 py-1 text-[10px] font-medium text-[var(--brass)]">
            Static route preview
          </div>
        )}
      </div>

      {showDetails && (
        <div className="px-3.5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium tracking-[0.01em] text-foreground">{title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-foreground/62 truncate">
                {subtitle || `${validStops.length} mapped stop${validStops.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <span className="inline-flex flex-shrink-0 rounded-full border border-rule bg-paper-recessed px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/62">
              Day
            </span>
          </div>
          {!routeSummary && (
            <p className="mt-2 text-[11px] font-medium text-foreground/76">
              {validStops.length > 0 ? 'Route ready to review' : 'No mapped stops yet'}
            </p>
          )}
          {routeSummary && (
            <p className="mt-2 text-[11px] font-medium text-[var(--brass)] truncate">
              {routeSummary}
            </p>
          )}
          {startStop && endStop && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--pillar-nature-wash)] bg-[var(--moss)]/[0.08] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--moss)]">Start</p>
                <p className="mt-1 truncate text-xs font-medium text-foreground">{startStop.title}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--brass)]/30 bg-[var(--brass-subtle)] px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brass)]">Finish</p>
                <p className="mt-1 truncate text-xs font-medium text-foreground">{endStop.title}</p>
              </div>
            </div>
          )}
          {stopPreview.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {stopPreview.slice(0, 3).map((stop, index) => (
                <span
                  key={`${stop}-${index}`}
                  className="inline-flex max-w-[142px] items-center gap-1 rounded-full border border-rule bg-paper-recessed px-2.5 py-1 text-[10px] text-foreground/72"
                >
                  <span className="font-semibold tabular-nums text-[var(--brass)]">{index + 1}</span>
                  <span className="truncate">{stop}</span>
                </span>
              ))}
              {stopPreview.length > 3 && (
                <span className="inline-flex items-center rounded-full border border-rule bg-paper-raised/85 px-2.5 py-1 text-[10px] text-foreground/55">
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
