'use client'

import { AuthProvider } from '@/components/providers/AuthProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex h-screen bg-black text-white">
          <Sidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  )
}
