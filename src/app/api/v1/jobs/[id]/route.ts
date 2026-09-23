import { NextRequest } from 'next/server'
import { jobsService } from '@/server/services/jobs.service'
import { requireAuth, getAuthUser, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/jobs/[id]
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const viewer = await getAuthUser(req)
  const job = await jobsService.getById(id, viewer?.userId)
  return ok(job)
})

// PUT /api/v1/jobs/[id]
export const PUT = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  
  // Status update endpoint
  if (body.status && Object.keys(body).length === 1) {
    const job = await jobsService.updateStatus(id, user.userId, body.status)
    return ok(job, 'İlan durumu güncellendi.')
  }

  const job = await jobsService.update(id, user.userId, body)
  return ok(job, 'İş ilanı güncellendi.')
})

// DELETE /api/v1/jobs/[id]
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  await jobsService.delete(id, user.userId)
  return ok({ id }, 'İş ilanı silindi.')
})
