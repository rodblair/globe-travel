import type { User } from '@supabase/supabase-js'

export const isDevAuthBypassEnabled = process.env.NODE_ENV === 'development'
export const GUEST_SESSION_COOKIE = 'globe_travel_guest'

export function isValidGuestId(value: string | null | undefined) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim())
}

export function getGuestIdFromCookieHeader(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return null
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GUEST_SESSION_COOKIE}=`))
  if (!match) return null

  try {
    const guestId = decodeURIComponent(match.slice(GUEST_SESSION_COOKIE.length + 1)).trim()
    return isValidGuestId(guestId) ? guestId : null
  } catch {
    return null
  }
}

export function clearBrowserGuestSession() {
  if (typeof document === 'undefined') return
  document.cookie = `${GUEST_SESSION_COOKIE}=; path=/; max-age=0`
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
    username: `guest-${guestId.slice(0, 8)}`,
    display_name: 'Guest Traveler',
    avatar_url: null,
    bio: 'Guest session for trying Globe.travel.',
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
