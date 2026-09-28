import { NextRequest } from 'next/server'
import { rejectJob } from '@/server/services/admin.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/admin/jobs/pending/[id]/reject - İlanı reddet
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json()
  if (!body.reason || body.reason.trim().length < 3) {
    return fail('Red gerekçesi en az 3 karakter olmalı.', 400)
  }
  const clientInfo = getClientInfo(req)
  const result = await rejectJob({
    jobId: id,
    adminId: user.userId,
    reason: body.reason.trim(),
    ...clientInfo,
  })
  return ok(result, 'İlan reddedildi.')
})
