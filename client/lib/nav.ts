import { Compass, Map as MapIcon, User, type LucideIcon } from 'lucide-react'

export type AppNavItem = {
  href: string
  label: string
  icon: LucideIcon
  /** Extra route prefixes (aliases and children) that should highlight this item. */
  matches: (pathname: string) => boolean
}

/** Single source of truth for the signed-in app navigation (sidebar + bottom bar). */
export const APP_NAV: AppNavItem[] = [
  {
    href: '/chat',
    label: 'Plan',
    icon: Compass,
    matches: (pathname) => pathname === '/chat' || pathname === '/explore' || pathname === '/globe',
  },
  {
    href: '/trips',
    label: 'Trips',
    icon: MapIcon,
    matches: (pathname) =>
      pathname === '/saved' ||
      pathname.startsWith('/trips') ||
      pathname === '/map' ||
      pathname === '/bucket-list' ||
      pathname === '/journal',
  },
  {
    href: '/account',
    label: 'Account',
    icon: User,
    matches: (pathname) =>
      pathname === '/account' ||
      pathname === '/settings' ||
      pathname === '/profile',
  },
]
