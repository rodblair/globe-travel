import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/app/api/trips/_utils'

const optionalText = (maxLength: number) =>
  z.preprocess(
    (value) => {
      if (value == null) return null
      if (typeof value !== 'string') return value
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    },
    z.string().max(maxLength).nullable(),
  )

const ProfilePatchSchema = z.object({
  display_name: optionalText(80).optional(),
  username: z.preprocess(
    (value) => {
      if (value == null) return null
      if (typeof value !== 'string') return value
      const trimmed = value.trim().toLowerCase()
      return trimmed.length > 0 ? trimmed : null
    },
    z.string()
      .min(3, 'Use 3-30 lowercase letters, numbers, hyphens, or underscores for username.')
      .max(30, 'Use 3-30 lowercase letters, numbers, hyphens, or underscores for username.')
      .regex(/^[a-z0-9_-]+$/, 'Use 3-30 lowercase letters, numbers, hyphens, or underscores for username.')
      .nullable(),
  ).optional(),
  bio: optionalText(240).optional(),
  avatar_url: z.preprocess(
    (value) => {
      if (value == null) return null
      if (typeof value !== 'string') return value
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    },
    z.string().url().nullable(),
  ).optional(),
  travel_style: optionalText(80).optional(),
  onboarding_completed: z.boolean().optional(),
})

export async function GET() {
  const { supabase, user } = await requireUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const { supabase, user } = await requireUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = ProfilePatchSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid profile update.'
    return NextResponse.json({ error: firstError, details: parsed.error.flatten() }, { status: 400 })
  }

  const updates = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined),
  )

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No profile fields to update.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
