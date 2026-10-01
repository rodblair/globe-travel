'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { LogOut, MoreHorizontal, Plus, Settings, Sparkles, UserPlus } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { GlobeBrand } from '@/components/atmosphere/GlobeBrand'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useSubscription } from '@/hooks/useSubscription'
import { APP_NAV } from '@/lib/nav'
import { PLANS } from '@/lib/plans'
import { cn } from '@/lib/utils'

type RecentTrip = { id: string; title: string | null }

function useRecentTrips() {
  return useQuery<RecentTrip[]>({
    queryKey: ['recent-trips'],
    queryFn: async () => {
      const res = await fetch('/api/trips')
      if (!res.ok) return []
      const json = await res.json()
      const trips: RecentTrip[] = Array.isArray(json) ? json : json.trips ?? []
      return trips.slice(0, 5)
    },
    staleTime: 1000 * 60,
  })
}

function initials(name: string | null | undefined) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'T'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

export function Sidebar() {
  const pathname = usePathname() ?? ''
  const router = useRouter()
  const { profile, isLoading, isGuest, signOut } = useAuth()
  const { isPro } = useSubscription()
  const { data: recents } = useRecentTrips()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const displayName = isGuest ? 'Guest' : profile?.display_name || 'Traveler'

  return (
    <aside
      aria-label="Primary app navigation"
      className="hidden h-dvh w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex"
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/chat" aria-label="Globe.travel planner" className="inline-flex rounded-lg">
          <GlobeBrand />
        </Link>
      </div>

      <div className="px-3">
        <Button asChild className="w-full justify-start rounded-lg" size="lg">
          <Link href="/chat">
            <Plus />
            New trip
          </Link>
        </Button>
      </div>

      <nav aria-label="Main" className="mt-4 space-y-0.5 px-3">
        {APP_NAV.map((item) => {
          const isActive = item.matches(pathname)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
        {recents && recents.length > 0 ? (
          <>
            <p className="px-3 pb-2 text-xs font-medium text-muted-foreground">Recent trips</p>
            <ul className="space-y-0.5">
              {recents.map((trip) => {
                const href = `/trips/${trip.id}`
                const active = pathname === href
                return (
                  <li key={trip.id}>
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'block truncate rounded-lg px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                      )}
                    >
                      {trip.title || 'Untitled trip'}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        ) : null}
      </div>

      {!isPro && !isGuest && (
        <div className="px-3 pb-3">
          <Link
            href="/pricing"
            className="flex items-center gap-3 rounded-xl border bg-card p-3 shadow-xs transition-shadow hover:shadow-sm"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium leading-tight">Try {PLANS.pro.name}</span>
              <span className="block text-xs text-muted-foreground">7-day free trial</span>
            </span>
          </Link>
        </div>
      )}

      {isGuest && (
        <div className="px-3 pb-3">
          <div className="rounded-xl border bg-card p-3 shadow-xs">
            <p className="text-sm font-medium">You&apos;re browsing as a guest</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Create a free account to keep your trips.</p>
            <Button asChild size="sm" className="mt-3 w-full">
              <Link href="/signup?next=%2Fchat">
                <UserPlus />
                Create account
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="border-t p-3">
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                aria-label="Account menu"
              >
                {isLoading ? (
                  <>
                    <Skeleton className="size-9 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </>
                ) : (
                  <>
                    <Avatar className="size-9">
                      {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                      <AvatarFallback>{initials(displayName)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium leading-tight">{displayName}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {isGuest ? 'Guest session' : isPro ? PLANS.pro.name : PLANS.free.name}
                      </span>
                    </span>
                    <MoreHorizontal className="size-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="flex items-center justify-between">
                {displayName}
                {isPro ? <Badge variant="brass">Pro</Badge> : null}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/account')}>
                <Settings /> Account & billing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut /> {isGuest ? 'End guest session' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
