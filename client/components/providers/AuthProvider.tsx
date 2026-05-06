'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { devProfile, devUser, isDevAuthBypassEnabled } from '@/lib/dev-auth'
import type { User } from '@supabase/supabase-js'

type Profile = {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  travel_style: string | null
  onboarding_completed: boolean
  countries_count: number
  places_count: number
  streak_days: number
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(isDevAuthBypassEnabled ? devUser : null)
  const [profile, setProfile] = useState<Profile | null>(isDevAuthBypassEnabled ? devProfile : null)
  const [isLoading, setIsLoading] = useState(!isDevAuthBypassEnabled)
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    if (isDevAuthBypassEnabled) {
      setProfile(devProfile)
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    if (isDevAuthBypassEnabled) {
      setProfile(devProfile)
      return
    }
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    if (isDevAuthBypassEnabled) {
      return
    }

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) await fetchProfile(user.id)
      setIsLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  const signOut = async () => {
    if (isDevAuthBypassEnabled) {
      setUser(null)
      setProfile(null)
      return
    }

    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
