'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { APP_NAV } from '@/lib/nav'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname() ?? ''

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid max-w-md grid-cols-3 px-2 py-1.5">
        {APP_NAV.map((item) => {
          const isActive = item.matches(pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-3 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                  isActive && 'bg-primary/10',
                )}
              >
                <Icon className="size-5" />
              </span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
