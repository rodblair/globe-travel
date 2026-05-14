'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Map as MapIcon, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/chat',
    icon: Compass,
    label: 'Plan',
    matches: (pathname: string) =>
      pathname === '/chat' || pathname === '/explore' || pathname === '/globe',
  },
  {
    href: '/saved',
    icon: MapIcon,
    label: 'Trips',
    matches: (pathname: string) =>
      pathname === '/saved' ||
      pathname.startsWith('/trips') ||
      pathname === '/map' ||
      pathname === '/bucket-list' ||
      pathname === '/journal',
  },
  {
    href: '/account',
    icon: User,
    label: 'Account',
    matches: (pathname: string) =>
      pathname === '/account' ||
      pathname === '/settings' ||
      pathname === '/profile' ||
      pathname === '/pricing',
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'border-t border-rule bg-paper-raised/95 backdrop-blur-md',
        'shadow-[0_-2px_8px_rgba(12,31,51,0.05)]',
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid max-w-md grid-cols-3 px-1 py-2">
        {navItems.map((item) => {
          const isActive = pathname ? item.matches(pathname) : false
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-3 py-1.5',
                'transition-colors duration-150',
                isActive
                  ? 'text-foreground'
                  : 'text-ink-3 hover:text-foreground',
              )}
            >
              {/* active brass dot */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--brass)]"
                />
              )}
              <Icon className="h-5 w-5" strokeWidth={isActive ? 1.6 : 1.3} />
              <span className="text-[0.625rem] font-medium tracking-[0.04em] uppercase">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
