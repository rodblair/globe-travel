import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createGuestProfile, createGuestUser, devProfile, devUser, isValidGuestId } from '@/lib/dev-auth'

async function userExists(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase.auth.admin.getUserById(id)
  if (error && !error.message.toLowerCase().includes('not found')) {
    throw new Error(error.message)
  }
  return Boolean(data.user)
}

async function ensureProfileBackedAccount({
  supabase,
  id,
  email,
  displayName,
  isGuest,
  profile,
}: {
  supabase: SupabaseClient
  id: string
  email: string
  displayName: string
  isGuest: boolean
  profile: ReturnType<typeof createGuestProfile>
}) {
  if (!(await userExists(supabase, id))) {
    const { error } = await supabase.auth.admin.createUser({
      id,
      email,
      email_confirm: true,
      password: crypto.randomUUID(),
      user_metadata: {
        full_name: displayName,
        is_guest: isGuest,
      },
    })

    // Parallel guest route fetches can race: one request creates the auth user
    // while another receives Supabase's generic "Database error creating new user".
    // Re-check the explicit id before treating the create response as fatal.
    if (error && !/already|duplicate|registered/i.test(error.message) && !(await userExists(supabase, id))) {
      throw new Error(error.message)
    }
  }

  const { data: existingProfile, error: existingProfileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', profile.id)
    .maybeSingle()

  if (existingProfileError) {
    throw new Error(existingProfileError.message)
  }

  if (existingProfile) {
    return profile
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: profile.id,
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      bio: profile.bio,
      travel_style: profile.travel_style,
      onboarding_completed: profile.onboarding_completed,
    })

  if (profileError && !/duplicate|already exists/i.test(profileError.message)) {
    throw new Error(profileError.message)
  }

  return profile
}

export async function ensureGuestAccount(guestId: string, supabase: SupabaseClient) {
  if (!isValidGuestId(guestId)) {
    throw new Error('Invalid guest session id')
  }

  const user = createGuestUser(guestId)
  await ensureProfileBackedAccount({
    supabase,
    id: user.id,
    email: user.email || `guest-${guestId.slice(0, 8)}@globe-travel.local`,
    displayName: 'Guest Traveler',
    isGuest: true,
    profile: createGuestProfile(guestId),
  })
  return user
}

export async function ensureDevAccount(supabase: SupabaseClient) {
  await ensureProfileBackedAccount({
    supabase,
    id: devUser.id,
    email: devUser.email || 'dev@globe-travel.local',
    displayName: 'Dev Traveler',
    isGuest: false,
    profile: devProfile,
  })
  return devUser
}
