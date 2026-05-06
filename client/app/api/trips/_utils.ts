import { z } from 'zod'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase-server'
import { createServiceClient } from '@/lib/supabase-service'
import { GUEST_SESSION_COOKIE, createGuestUser, devUser, isDevAuthBypassEnabled } from '@/lib/dev-auth'
import { ensureGuestAccount } from '@/lib/guest-server'

export function randomSlug(length = 10) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

export const TripPaceSchema = z.enum(['relaxed', 'balanced', 'packed']).optional()
export const TripBudgetSchema = z.enum(['budget', 'mid', 'luxury']).optional()

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return { supabase, user }

  const guestId = (await cookies()).get(GUEST_SESSION_COOKIE)?.value
  if (guestId) {
    const serviceSupabase = await createServiceClient()
    await ensureGuestAccount(guestId, serviceSupabase)
    return { supabase: serviceSupabase, user: createGuestUser(guestId) }
  }

  return { supabase, user: isDevAuthBypassEnabled ? devUser : null }
}
