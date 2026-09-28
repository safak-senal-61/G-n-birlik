import { NextRequest } from 'next/server'
import { jobsService } from '@/server/services/jobs.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/jobs/[id]/save - İlanı kaydet/kaydı kaldır
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const result = await jobsService.saveJob(user.userId, id)
  return ok(result, result.removed ? 'İlan kayıtlardan kaldırıldı.' : 'İlan kaydedildi.')
})
