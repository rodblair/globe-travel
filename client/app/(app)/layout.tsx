'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isTripStudio = Boolean(
    pathname?.startsWith('/trips/') && pathname !== '/trips/new'
  )

  return (
    <QueryProvider>
      <AuthProvider>
        <div className="flex h-screen bg-black text-white">
          {!isTripStudio && <Sidebar />}
          <main className={`flex-1 min-h-0 overflow-auto ${isTripStudio ? 'pb-0' : 'pb-16 md:pb-0'}`}>
            {children}
          </main>
          {!isTripStudio && <BottomNav />}
        </div>
      </AuthProvider>
    </QueryProvider>
  )
}
