import { cn } from '@/lib/utils'

type AlbatrossBrandProps = {
  className?: string
  textClassName?: string
  markClassName?: string
  compact?: boolean
}

function AlbatrossMark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <svg
      role="img"
      aria-label="Albatross logo mark"
      viewBox="0 0 64 64"
      fill="none"
      className={cn(
        'shrink-0 overflow-visible text-[var(--brass)]',
        compact ? 'h-8 w-8' : 'h-10 w-10',
        className
      )}
    >
      <circle
        cx="32"
        cy="32"
        r="29"
        fill="color-mix(in oklch, var(--paper-raised), transparent 4%)"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="32"
        cy="32"
        r="23.5"
        stroke="color-mix(in oklch, var(--ink), transparent 76%)"
        strokeWidth="0.9"
        strokeDasharray="2.2 4"
      />
      <path
        d="M10 35.5C19.8 25.9 29.3 24.1 37.2 31.2C39.3 33.1 42.7 33 45.1 31.1C50.1 27.1 54.3 28.3 58 35"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 35.7C18.5 30.6 28.2 31.9 37.2 39.6C42.4 34.4 49 32.8 58 35.7"
        stroke="color-mix(in oklch, var(--ink), transparent 20%)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M35.9 31.2C37.8 33.9 39.1 37.4 39.4 41.8"
        stroke="color-mix(in oklch, var(--ink), transparent 14%)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 47C27.6 50.1 38.1 50.2 44 47"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.42"
      />
    </svg>
  )
}

export function AlbatrossBrand({
  className,
  textClassName,
  markClassName,
  compact = false,
}: AlbatrossBrandProps) {
  return (
    <span className={cn('inline-flex items-center leading-none', compact ? 'gap-2' : 'gap-2.5', className)}>
      <AlbatrossMark className={markClassName} compact={compact} />
      <span className={cn('inline-flex flex-col', compact ? 'gap-0.5' : 'gap-1')}>
        <span
          className={cn(
            't-serif font-semibold tracking-[-0.035em] text-foreground',
            compact ? 'text-[1.0625rem]' : 'text-[1.25rem]',
            textClassName
          )}
        >
          Globe<span className="text-ink-3">.travel</span>
        </span>
        {!compact && (
          <span className="t-mono text-[0.5rem] font-semibold uppercase tracking-[0.22em] text-[var(--brass)]">
            Group trip maps
          </span>
        )}
      </span>
    </span>
  )
}
