'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Globe,
  Map,
  Compass,
  MessageCircle,
  Calendar,
  Star,
  BookOpen,
  User,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/components/providers/AuthProvider'

const navItems = [
  { href: '/globe', label: 'Globe', icon: Globe },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/chat', label: 'Group Planner', icon: MessageCircle },
  { href: '/trips', label: 'City Breaks', icon: Calendar },
  { href: '/bucket-list', label: 'Bucket List', icon: Star },
  { href: '/journal', label: 'Journal', icon: BookOpen },
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
    <aside className="hidden md:flex w-64 flex-col bg-black/80 backdrop-blur-xl border-r border-white/10 h-full">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/globe" className="flex items-center gap-2.5">
          <span className="text-xl">🌍</span>
          <span className="text-lg font-serif font-semibold tracking-tight text-white">
            Globe Travel
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Upgrade CTA */}
      {!isPro && (
        <div className="px-3 pb-3">
          <Link
            href="/pricing"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all duration-200 group"
          >
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-300 leading-tight">Upgrade to Pro</p>
              <p className="text-[10px] text-amber-500/60 leading-tight">7-day free trial</p>
            </div>
          </Link>
        </div>
      )}

      {/* User Section */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2 px-2 py-2">
          <Link href="/profile" className="relative w-8 h-8 rounded-full bg-white/10 overflow-hidden flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-amber-500/40 transition-all">
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
          <Link
            href="/settings"
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-200"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
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
