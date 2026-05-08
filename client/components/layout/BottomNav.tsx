'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Map, MessageCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    href: '/chat',
    icon: MessageCircle,
    label: 'Planner',
    matches: (pathname: string) =>
      pathname === '/chat' ||
      pathname === '/explore' ||
      pathname === '/globe',
  },
  {
    href: '/saved',
    icon: Map,
    label: 'Trips',
    matches: (pathname: string) =>
      pathname === '/saved' ||
      pathname.startsWith('/trips/') ||
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[rgba(4,4,5,0.86)] shadow-[0_-18px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname ? item.matches(pathname) : false
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[58px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[10px] font-semibold transition-all duration-200',
                isActive
                  ? 'bg-amber-400/12 text-amber-200 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.16)]'
                  : 'text-white/42 hover:bg-white/6 hover:text-white/70'
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.7} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
