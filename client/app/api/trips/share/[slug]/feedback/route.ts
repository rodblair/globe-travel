import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'

const CreateFeedbackSchema = z.object({
  author_name: z.string().trim().min(1).max(60),
  author_email: z.string().trim().email().max(120).optional().or(z.literal('')),
  sentiment: z.enum(['love_it', 'curious', 'practical']),
  comment: z.string().trim().min(8).max(600),
})

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const supabase = await createClient()

  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('id')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .maybeSingle()

  if (tripErr) return NextResponse.json({ error: tripErr.message }, { status: 500 })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('trip_feedback')
    .select('id,author_name,sentiment,comment,created_at')
    .eq('trip_id', trip.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params
  const supabase = await createClient()

  const { data: trip, error: tripErr } = await supabase
    .from('trips')
    .select('id,is_public')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .maybeSingle()

  if (tripErr) return NextResponse.json({ error: tripErr.message }, { status: 500 })
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const json = await req.json().catch(() => null)
  const parsed = CreateFeedbackSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid feedback', details: parsed.error.flatten() }, { status: 400 })
  }

  const payload = parsed.data
  const { data, error } = await supabase
    .from('trip_feedback')
    .insert({
      trip_id: trip.id,
      author_name: payload.author_name,
      author_email: payload.author_email || null,
      sentiment: payload.sentiment,
      comment: payload.comment,
    })
    .select('id,author_name,sentiment,comment,created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

