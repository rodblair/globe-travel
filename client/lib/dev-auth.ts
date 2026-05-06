import type { User } from '@supabase/supabase-js'

export const isDevAuthBypassEnabled = process.env.NODE_ENV === 'development'
export const GUEST_SESSION_COOKIE = 'globe_travel_guest'

export function getGuestIdFromCookieHeader(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GUEST_SESSION_COOKIE}=`))
  return match ? decodeURIComponent(match.slice(GUEST_SESSION_COOKIE.length + 1)) : null
}

export function createGuestUser(guestId: string) {
  return {
    id: guestId,
    aud: 'authenticated',
    role: 'authenticated',
    email: `guest-${guestId.slice(0, 8)}@globe-travel.local`,
    app_metadata: { provider: 'guest', providers: ['guest'] },
    user_metadata: { full_name: 'Guest Traveler' },
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  } as User
}

export function createGuestProfile(guestId: string) {
  return {
    id: guestId,
    username: 'guest-traveler',
    display_name: 'Guest Traveler',
    avatar_url: null,
    bio: 'Guest session for trying Globe Travel.',
    travel_style: 'group city breaks',
    onboarding_completed: true,
    countries_count: 0,
    places_count: 0,
    streak_days: 0,
  }
}

export const devUser = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'dev@globe-travel.local',
  app_metadata: { provider: 'dev', providers: ['dev'] },
  user_metadata: { full_name: 'Dev Traveler' },
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
} as User

export const devProfile = {
  id: devUser.id,
  username: 'dev-traveler',
  display_name: 'Dev Traveler',
  avatar_url: null,
  bio: 'Local development profile for QA walkthroughs.',
  travel_style: 'group city breaks',
  onboarding_completed: true,
  countries_count: 0,
  places_count: 0,
  streak_days: 0,
}
