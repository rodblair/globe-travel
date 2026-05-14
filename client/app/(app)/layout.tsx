'use client'

import { AuthProvider } from '@/components/providers/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="app-shell flex bg-background text-foreground">
          <Sidebar />
          <main className="app-main flex-1">
            {children}
          </main>
          <BottomNav />
        </div>
      </AuthProvider>
    </QueryProvider>
  )
}
