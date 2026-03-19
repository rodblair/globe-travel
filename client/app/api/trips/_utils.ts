import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'

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
  return { supabase, user: user || null }
}
