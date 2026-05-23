'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullscreenFlow = pathname === '/onboarding'

  return (
    <QueryProvider>
      <AuthProvider>
        {isFullscreenFlow ? (
          <main className="h-dvh overflow-hidden bg-paper text-foreground">
            {children}
          </main>
        ) : (
          <div className="app-shell flex bg-background text-foreground">
            <Sidebar />
            <main className="app-main flex-1">
              {children}
            </main>
            <BottomNav />
          </div>
        )}
      </AuthProvider>
    </QueryProvider>
  )
}
