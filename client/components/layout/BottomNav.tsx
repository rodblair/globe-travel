'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Globe2, Map, Compass, MessageCircle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/globe', icon: Globe2, label: 'Globe' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/chat', icon: MessageCircle, label: 'Chat' },
  { href: '/trips', icon: Calendar, label: 'Trips' },
  { href: '/map', icon: Map, label: 'Map' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[48px]',
                isActive ? 'text-amber-400' : 'text-white/40'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
