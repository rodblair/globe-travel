'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Map,
  MessageCircle,
  Calendar,
  User,
  LogOut,
  Zap,
} from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/components/providers/AuthProvider'

const navItems = [
  {
    href: '/chat',
    label: 'Planner',
    icon: MessageCircle,
    matches: (pathname: string) =>
      pathname === '/chat' ||
      pathname === '/explore' ||
      pathname === '/globe',
  },
  {
    href: '/trips',
    label: 'Trips',
    icon: Calendar,
    matches: (pathname: string) =>
      pathname === '/trips' ||
      pathname === '/trips/new' ||
      pathname.startsWith('/trips/'),
  },
  {
    href: '/saved',
    label: 'Saved',
    icon: Map,
    matches: (pathname: string) =>
      pathname === '/saved' ||
      pathname === '/map' ||
      pathname === '/bucket-list' ||
      pathname === '/journal',
  },
  {
    href: '/account',
    label: 'Account',
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
    <aside className="hidden md:flex h-full w-64 flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(9,9,9,0.98),rgba(2,2,2,0.98))]">
      <div className="p-6 pb-5">
        <Link href="/chat" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-amber-400/20 bg-amber-400/10 text-lg">🌍</span>
          <span className="text-lg font-serif font-semibold tracking-tight text-white">
            Globe Travel
          </span>
        </Link>
        <p className="mt-4 text-[11px] leading-relaxed text-white/34">
          One calm place to turn group travel ideas into a plan friends can react to.
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => {
          const isActive = pathname ? item.matches(pathname) : false
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500/12 text-amber-300 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.16)]'
                  : 'text-white/55 hover:text-white hover:bg-white/6'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {!isPro && (
        <div className="px-3 pb-3">
          <Link
            href="/account?tab=billing"
            className="group flex items-center gap-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-3 transition-all duration-200 hover:bg-amber-500/15"
          >
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-300 leading-tight">Upgrade to Pro</p>
              <p className="text-[10px] text-amber-500/60 leading-tight">7-day free trial</p>
            </div>
          </Link>
        </div>
      )}

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-2xl bg-white/[0.025] px-2 py-2">
          <Link href="/account" className="relative w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-amber-500/40 transition-all">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name || 'User'}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-white/40" />
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.display_name || 'Traveler'}
            </p>
            <p className="text-xs text-white/40 truncate">
              {profile?.username ? `@${profile.username}` : 'Set up profile'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-200"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
