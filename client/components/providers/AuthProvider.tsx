'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase-browser'
import {
  clearBrowserGuestSession,
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

async function fetchGuestProfile(guestId: string): Promise<Profile> {
  try {
    const response = await fetch('/api/profile', { cache: 'no-store' })
    if (response.ok) {
      return await response.json() as Profile
    }
  } catch {
    // Fall through to the local guest profile so protected routes remain usable offline.
  }

  return createGuestProfile(guestId)
}

function getBrowserGuestId() {
  if (typeof document === 'undefined') return null
  return getGuestIdFromCookieHeader(document.cookie)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      setProfile(data)
      return
    }

    const guestId = getBrowserGuestId()
    if (guestId) {
      setProfile(await fetchGuestProfile(guestId))
      return
    }

    if (isDevAuthBypassEnabled) {
      setProfile(devProfile)
      return
    }
  }, [supabase])

  const refreshProfile = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      setUser(authUser)
      await fetchProfile()
      return
    }

    const guestId = getBrowserGuestId()
    if (guestId) {
      setUser(createGuestUser(guestId))
      setProfile(await fetchGuestProfile(guestId))
      return
    }
    if (isDevAuthBypassEnabled) {
      setProfile(devProfile)
      return
    }
    if (user) await fetchProfile()
  }, [user, supabase, fetchProfile])

  useEffect(() => {
    let cancelled = false

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (user) {
        setUser(user)
        await fetchProfile()
        setIsLoading(false)
        return
      }

      const guestId = getBrowserGuestId()
      if (guestId) {
        const guestProfile = await fetchGuestProfile(guestId)
        if (cancelled) return
        setUser(createGuestUser(guestId))
        setProfile(guestProfile)
        setIsLoading(false)
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

      setUser(user)
      setIsLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchProfile()
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
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      clearBrowserGuestSession()
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      return
    }

    if (getBrowserGuestId()) {
      clearBrowserGuestSession()
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
