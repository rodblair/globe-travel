import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * A globe rising over the horizon with glowing dotted routes. Sits at the
 * bottom of a dusk sky; the parent clips it. `labels` adds city pills.
 */
export function HorizonGlobe({
  className,
  labels = true,
}: {
  className?: string
  labels?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const grad = `hg-${uid}`
  const clip = `hc-${uid}`
  const blur = `hb-${uid}`
  return (
    <svg
      viewBox="0 0 1600 440"
      fill="none"
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="A globe rising over the horizon with glowing routes between Lisbon, Athens and Kyoto"
      className={cn('block w-full', className)}
    >
      <defs>
        <radialGradient id={grad} cx="800" cy="250" r="920" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2F8594" />
          <stop offset="0.45" stopColor="#17495C" />
          <stop offset="1" stopColor="#0F2431" />
        </radialGradient>
        <clipPath id={clip}>
          <circle cx="800" cy="1580" r="1400" />
        </clipPath>
        <filter id={blur} x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <circle cx="800" cy="1580" r="1400" stroke="#FF9A62" strokeWidth="30" opacity="0.55" filter={`url(#${blur})`} />
      <circle cx="800" cy="1580" r="1400" fill={`url(#${grad})`} />
      <g clipPath={`url(#${clip})`}>
        {['M0 230 Q800 120 1600 230', 'M0 300 Q800 200 1600 300', 'M0 380 Q800 290 1600 380', 'M800 170 L800 440', 'M800 170 Q690 300 560 440', 'M800 170 Q910 300 1040 440', 'M800 170 Q580 300 300 440', 'M800 170 Q1020 300 1300 440'].map((d) => (
          <path key={d} d={d} stroke="#A5DCD2" strokeOpacity="0.16" strokeWidth="1.5" />
        ))}
        <path d="M390 304 Q430 252 520 264 Q592 272 612 322 Q560 362 480 354 Q410 348 390 304Z" fill="#3FA29F" opacity="0.9" />
        <path d="M792 258 Q850 234 920 246 Q992 258 1004 302 Q944 326 882 308 Q824 296 792 258Z" fill="#3FA29F" opacity="0.9" />
        <path d="M1190 272 Q1242 250 1292 292 Q1304 342 1252 362 Q1202 332 1190 272Z" fill="#3FA29F" opacity="0.9" />
        <path d="M0 350 Q100 306 220 336 Q300 364 330 440 H0Z" fill="#2F8594" opacity="0.8" />
        <path d="M1420 306 Q1520 294 1600 334 V440 H1440 Q1400 384 1420 306Z" fill="#2F8594" opacity="0.8" />
      </g>
      <circle cx="800" cy="1580" r="1400" stroke="#FFC58A" strokeWidth="3" opacity="0.95" />
      <path d="M470 304 Q690 112 902 280" stroke="#FF7A4E" strokeWidth="9" opacity="0.28" strokeLinecap="round" />
      <path d="M902 280 Q1092 120 1242 312" stroke="#FF7A4E" strokeWidth="9" opacity="0.28" strokeLinecap="round" />
      <path d="M470 304 Q690 112 902 280" stroke="#FFD48A" strokeWidth="3.4" strokeDasharray="1 9" strokeLinecap="round" />
      <path d="M902 280 Q1092 120 1242 312" stroke="#FFD48A" strokeWidth="3.4" strokeDasharray="1 9" strokeLinecap="round" />
      {[[470, 304], [902, 280], [1242, 312]].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="8" fill="#FFF8EC" stroke="#EE5B3C" strokeWidth="4.5" />
      ))}
      {labels
        ? [
            { x: 470, y: 322, w: 80, t: 'Lisbon' },
            { x: 902, y: 298, w: 80, t: 'Athens' },
            { x: 1242, y: 330, w: 76, t: 'Kyoto' },
          ].map((l) => (
            <g key={l.t}>
              <rect x={l.x - l.w / 2} y={l.y} width={l.w} height="30" rx="15" fill="#FFF8EC" />
              <text x={l.x} y={l.y + 20} textAnchor="middle" fontFamily="var(--font-instrument), sans-serif" fontSize="15" fontWeight="600" fill="#0F2431">
                {l.t}
              </text>
            </g>
          ))
        : null}
    </svg>
  )
}

/** Scattered stars for the top of a dusk sky. */
export function Stars({ className }: { className?: string }) {
  const dots = [[120, 60, 1.8], [260, 130, 1.4], [410, 40, 2], [560, 110, 1.4], [700, 52, 1.8], [860, 24, 1.4], [980, 96, 2], [1100, 40, 1.4], [1210, 150, 1.8], [1330, 70, 1.4], [60, 200, 1.4], [640, 220, 1.2]]
  return (
    <svg viewBox="0 0 1440 260" fill="none" aria-hidden preserveAspectRatio="xMidYMin slice" className={cn('block w-full', className)}>
      {dots.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill="#FFF1D6" />
      ))}
    </svg>
  )
}
