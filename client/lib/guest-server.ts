import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createGuestProfile, createGuestUser } from '@/lib/dev-auth'

export async function ensureGuestAccount(guestId: string, supabase: SupabaseClient) {
  const user = createGuestUser(guestId)
  const profile = createGuestProfile(guestId)

  const { data: existingUser, error: lookupError } = await supabase.auth.admin.getUserById(guestId)
  if (lookupError && !lookupError.message.toLowerCase().includes('not found')) {
    throw new Error(lookupError.message)
  }

  if (!existingUser.user) {
    const { error } = await supabase.auth.admin.createUser({
      id: guestId,
      email: user.email,
      email_confirm: true,
      password: crypto.randomUUID(),
      user_metadata: {
        full_name: profile.display_name,
        is_guest: true,
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

  return user
}
