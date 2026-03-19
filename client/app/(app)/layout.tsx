'use client'

import { AuthProvider } from '@/components/providers/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <div className="flex h-screen bg-black text-white">
          <Sidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </div>
      </AuthProvider>
    </QueryProvider>
  )
}
