import { cn } from '@/lib/utils'

type GlobeBrandProps = {
  className?: string
  textClassName?: string
  markClassName?: string
  compact?: boolean
  /** Hide the wordmark and render the mark only. */
  markOnly?: boolean
}

/** The Globe.travel mark: a globe with a route pin. Colours follow the theme tokens. */
export function GlobeMark({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      aria-label="Globe.travel"
      viewBox="0 0 64 64"
      fill="none"
      className={cn('size-9 shrink-0', className)}
    >
      <rect width="64" height="64" rx="16" className="fill-primary" />
      <g className="stroke-primary-foreground" strokeWidth="3.4" strokeLinecap="round">
        <circle cx="32" cy="33" r="17" />
        <ellipse cx="32" cy="33" rx="7.5" ry="17" />
        <path d="M15 33h34" />
      </g>
      <circle cx="46" cy="18" r="6.2" className="stroke-primary" strokeWidth="3" fill="#ffb84d" />
    </svg>
  )
}

export function GlobeBrand({
  className,
  textClassName,
  markClassName,
  compact = false,
  markOnly = false,
}: GlobeBrandProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 leading-none', className)}>
      <GlobeMark className={cn(compact ? 'size-8' : 'size-9', markClassName)} />
      {!markOnly && (
        <span
          className={cn(
            'font-semibold tracking-tight text-foreground',
            compact ? 'text-base' : 'text-lg',
            textClassName,
          )}
        >
          Globe<span className="text-muted-foreground">.travel</span>
        </span>
      )}
    </span>
  )
}
