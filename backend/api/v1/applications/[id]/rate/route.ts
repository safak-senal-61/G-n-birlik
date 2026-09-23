import { NextRequest } from 'next/server'
import { applicationsService } from '@/server/services/applications.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/applications/[id]/rate - İşçi/işveren puanlama
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const review = await applicationsService.rate(
    id,
    user.userId,
    user.role,
    body.rating,
    body.comment
  )
  return ok(review, 'Değerlendirmeniz kaydedildi.')
})
