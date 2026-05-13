'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import {
  GUEST_SESSION_COOKIE,
  createGuestProfile,
  createGuestUser,
  devProfile,
  devUser,
  getGuestIdFromCookieHeader,
  isDevAuthBypassEnabled,
} from '@/lib/dev-auth'
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

function getBrowserGuestId() {
  if (typeof document === 'undefined') return null
  return getGuestIdFromCookieHeader(document.cookie)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async (userId: string) => {
    const guestId = getBrowserGuestId()
    if (guestId) {
      setProfile(createGuestProfile(guestId))
      return
    }
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
    const guestId = getBrowserGuestId()
    if (guestId) {
      setProfile(createGuestProfile(guestId))
      return
    }
    if (isDevAuthBypassEnabled) {
      setProfile(devProfile)
      return
    }
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  useEffect(() => {
    let cancelled = false

    const getUser = async () => {
      const guestId = getBrowserGuestId()
      if (guestId) {
        if (!cancelled) {
          setUser(createGuestUser(guestId))
          setProfile(createGuestProfile(guestId))
          setIsLoading(false)
        }
        return
      }

      if (isDevAuthBypassEnabled) {
        if (!cancelled) {
          setUser(devUser)
          setProfile(devProfile)
          setIsLoading(false)
        }
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
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

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const signOut = async () => {
    if (getBrowserGuestId()) {
      document.cookie = `${GUEST_SESSION_COOKIE}=; path=/; max-age=0`
      setUser(null)
      setProfile(null)
      return
    }
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
