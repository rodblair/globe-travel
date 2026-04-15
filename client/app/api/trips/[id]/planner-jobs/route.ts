import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '../../_utils'
import { enqueuePlannerWorkflowJob, listPlannerWorkflowJobs } from '@/lib/planner/jobs'

const CreatePlannerJobSchema = z.object({
  type: z.enum(['decision_memo', 'generate_variants', 'feedback_refresh']),
})

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  return NextResponse.json(listPlannerWorkflowJobs(id))
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { supabase, user } = await requireUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const json = await req.json().catch(() => null)
  const parsed = CreatePlannerJobSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const job = await enqueuePlannerWorkflowJob({
    db: supabase,
    userId: user.id,
    tripId: id,
    type: parsed.data.type,
  })

  return NextResponse.json(job, { status: 202 })
}
