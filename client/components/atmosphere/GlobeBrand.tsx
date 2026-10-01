import { cn } from '@/lib/utils'

type GlobeBrandProps = {
  className?: string
  textClassName?: string
  markClassName?: string
  compact?: boolean
  /** Hide the wordmark and render the mark only. */
  markOnly?: boolean
}

/** Globe.travel mark: meridian globe with a route-red waypoint. */
export function GlobeMark({ className }: { className?: string }) {
  return (
    <svg role="img" aria-label="Globe.travel" viewBox="0 0 48 48" fill="none" className={cn('size-9 shrink-0 text-foreground', className)}>
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="22" cy="26" r="16" />
        <ellipse cx="22" cy="26" rx="6.5" ry="16" />
        <path d="M6 26h32M9 16.5h26M9 35.5h26" strokeWidth="1.6" />
      </g>
      <circle cx="37" cy="12" r="6.5" className="fill-primary stroke-[color:var(--mark-bg,var(--background))]" strokeWidth="3" />
    </svg>
  )
}

export function GlobeBrand({ className, textClassName, markClassName, compact = false, markOnly = false }: GlobeBrandProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 leading-none', className)}>
      <GlobeMark className={cn(compact ? 'size-8' : 'size-9', markClassName)} />
      {!markOnly && (
        <span
          className={cn(
            'font-serif font-semibold tracking-[-0.03em] text-current',
            compact ? 'text-xl' : 'text-[1.4rem]',
            textClassName,
          )}
        >
          Globe<span className="font-normal italic opacity-70">.travel</span>
        </span>
      )}
    </span>
  )
}
