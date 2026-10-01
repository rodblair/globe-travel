import { cn } from '@/lib/utils'

/**
 * Procedural map plate: sea, a landmass with contour rings, a faint graticule
 * and a numbered route. It is the visual signature of Globe.travel and is
 * deterministic per `seed`, so every trip gets its own stable "place".
 * Colours come from theme tokens only.
 */

function hash(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: string) {
  let a = hash(seed)
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Pt = [number, number]

/** Closed smooth path through points (Catmull-Rom converted to cubic Bezier). */
function smoothClosed(points: Pt[]) {
  const n = points.length
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return `${d}Z`
}

function smoothOpen(points: Pt[]) {
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}

const W = 400
const H = 300

export function CartographicPlate({
  seed,
  stops = 5,
  showRoute = true,
  showPins = true,
  className,
  label,
}: {
  seed: string
  stops?: number
  showRoute?: boolean
  showPins?: boolean
  className?: string
  /** Accessible description; decorative when omitted. */
  label?: string
}) {
  const r = rng(seed)
  const cx = W * (0.46 + r() * 0.1)
  const cy = H * (0.46 + r() * 0.1)
  const baseR = 108 + r() * 18

  const ring = (scale: number, ox: number, oy: number, wobble: number) => {
    const pts: Pt[] = []
    const n = 12
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2
      const rr = baseR * scale * (1 + (r() - 0.5) * wobble)
      pts.push([cx + ox + Math.cos(a) * rr * 1.18, cy + oy + Math.sin(a) * rr * 0.84])
    }
    return smoothClosed(pts)
  }

  const land = ring(1, 0, 0, 0.5)
  const contours = [0.82, 0.64, 0.46, 0.3].map((s, i) => ring(s, (r() - 0.5) * 14 * (i + 1), (r() - 0.5) * 10 * (i + 1), 0.35))

  const count = Math.max(2, Math.min(stops, 9))
  const stopPts: Pt[] = []
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const x = cx - baseR * 0.62 + t * baseR * 1.24 + (r() - 0.5) * 10
    const y = cy + Math.sin(t * Math.PI * (1.2 + r() * 0.8) + r() * 3) * baseR * 0.34 + (r() - 0.5) * 12
    stopPts.push([x, y])
  }

  const meridians = [60, 130, 200, 270, 340]
  const parallels = [50, 110, 170, 230]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn('block h-full w-full', className)}
    >
      <rect width={W} height={H} className="fill-chart-2/20" />
      <g className="stroke-foreground/10" strokeWidth="1" fill="none">
        {meridians.map((x, i) => (
          <path key={`m${x}`} d={`M${x + (i - 2) * 8} 0 Q ${x + 20} ${H / 2} ${x - (i - 2) * 8} ${H}`} />
        ))}
        {parallels.map((y) => (
          <path key={`p${y}`} d={`M0 ${y} Q ${W / 2} ${y - 14} ${W} ${y}`} />
        ))}
      </g>
      <path d={land} className="fill-card stroke-foreground/40" strokeWidth="1.25" />
      <g className="stroke-foreground/25" strokeWidth="1" fill="none">
        {contours.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {showRoute && (
        <>
          <path d={smoothOpen(stopPts)} className="stroke-card" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path
            d={smoothOpen(stopPts)}
            className="stroke-primary"
            strokeWidth="2.75"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="1 7"
          />
        </>
      )}
      {showPins &&
        stopPts.map(([x, y], i) => (
          <g key={i} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            <circle r="11" className="fill-card stroke-foreground" strokeWidth="1.5" />
            <circle r="7.5" className="fill-primary" />
            <text textAnchor="middle" dy="3.6" className="fill-primary-foreground text-[10px] font-semibold">
              {i + 1}
            </text>
          </g>
        ))}
    </svg>
  )
}
