import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createGuestProfile, createGuestUser, devProfile, devUser } from '@/lib/dev-auth'

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
  const { data: existingUser, error: lookupError } = await supabase.auth.admin.getUserById(id)
  if (lookupError && !lookupError.message.toLowerCase().includes('not found')) {
    throw new Error(lookupError.message)
  }

  if (!existingUser.user) {
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

    if (error && !/already|duplicate|registered/i.test(error.message)) {
      throw new Error(error.message)
    }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        travel_style: profile.travel_style,
        onboarding_completed: profile.onboarding_completed,
      },
      { onConflict: 'id' }
    )

  if (profileError) {
    throw new Error(profileError.message)
  }

  return profile
}

export async function ensureGuestAccount(guestId: string, supabase: SupabaseClient) {
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
