'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Compass,
  Map as MapIcon,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/components/providers/AuthProvider'
import { GlobeBrand } from '@/components/atmosphere/GlobeBrand'
import { PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/chat',
    label: 'Plan',
    sub: 'Conversations & ideas',
    icon: Compass,
    matches: (pathname: string) =>
      pathname === '/chat' || pathname === '/explore' || pathname === '/globe',
  },
  {
    href: '/saved',
    label: 'Trips',
    sub: 'Itineraries & notes',
    icon: MapIcon,
    matches: (pathname: string) =>
      pathname === '/saved' ||
      pathname.startsWith('/trips') ||
      pathname === '/map' ||
      pathname === '/bucket-list' ||
      pathname === '/journal',
  },
  {
    href: '/account',
    label: 'Account',
    sub: 'Profile & settings',
    icon: User,
    matches: (pathname: string) =>
      pathname === '/account' ||
      pathname === '/settings' ||
      pathname === '/profile' ||
      pathname === '/pricing',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()
  const { isPro } = useSubscription()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <aside
      aria-label="Primary app navigation"
      className={cn(
        'hidden h-dvh w-64 flex-shrink-0 md:flex flex-col',
        'border-r border-rule bg-[var(--sidebar-bg)] text-foreground',
        'relative',
      )}
    >
      {/* paper grain */}
      <div className="paper-grain absolute inset-0 pointer-events-none" />

      {/* Brand */}
      <div className="relative px-6 pt-6 pb-5">
        <Link href="/chat" className="inline-flex min-h-11 items-center group">
          <GlobeBrand compact />
        </Link>
      </div>

      <div className="hairline mx-3" />

      {/* Nav */}
      <nav className="relative flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname ? item.matches(pathname) : false
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex min-h-12 items-center gap-3 rounded-md px-3 py-2.5',
                'transition-colors duration-200',
                isActive
                  ? 'bg-[var(--sidebar-accent)] text-foreground'
                  : 'text-ink-2 hover:bg-[var(--sidebar-hover)] hover:text-foreground',
              )}
            >
              {/* active brass left rule */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute left-0 top-2 bottom-2 w-[2px] rounded-r-sm bg-[var(--brass)]"
                />
              )}
              <Icon
                className="h-[18px] w-[18px] shrink-0"
                strokeWidth={isActive ? 1.6 : 1.25}
              />
              <span className="flex-1 min-w-0">
                <span
                  className={cn(
                    'block text-[0.875rem] font-medium leading-tight',
                  )}
                >
                  {item.label}
                </span>
                <span className="block text-[0.6875rem] text-ink-3 leading-tight mt-0.5">
                  {item.sub}
                </span>
              </span>
            </Link>
          )
        })}
      </nav>

      {!isPro && (
        <div className="relative px-3 pb-3">
          <Link
            href="/pricing"
            className={cn(
              'group flex min-h-12 items-center gap-2.5 rounded-md',
              'border border-rule px-3 py-2.5',
              'bg-[var(--brass-subtle)] hover:bg-[color-mix(in_oklch,var(--brass),transparent_82%)]',
              'transition-colors',
            )}
          >
            <Sparkles className="w-4 h-4 text-[var(--brass)] shrink-0" strokeWidth={1.5} />
            <div className="min-w-0">
              <p className="text-[0.8125rem] font-medium text-foreground leading-tight">
                {PLANS.pro.name}
              </p>
              <p className="t-mono text-[0.625rem] tracking-[0.08em] text-ink-3 leading-tight mt-0.5">
                7-DAY FREE TRIAL
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Account row */}
      <div className="relative border-t border-rule p-3">
        <div className="flex min-h-12 items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-[var(--sidebar-hover)]">
          <Link
            href="/account"
            aria-label="Open account settings"
            className={cn(
              'relative w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0',
              'border border-rule bg-[var(--paper-recessed)]',
              'hover:ring-2 hover:ring-[var(--brass-glow)] transition-all',
            )}
          >
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name || 'User'}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-ink-3" strokeWidth={1.5} />
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[0.8125rem] font-medium text-foreground truncate leading-tight">
              {profile?.display_name || 'Traveler'}
            </p>
            <p className="t-mono text-[0.625rem] text-ink-3 truncate leading-tight mt-0.5">
              {profile?.username ? `@${profile.username}` : 'Username not set'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="touch-target inline-flex rounded-md p-1.5 text-ink-3 transition-colors hover:bg-[var(--paper-hover)] hover:text-foreground"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </aside>
  )
}
