import { NextRequest } from 'next/server'
import { reviewsService } from '@/server/services/reviews.service'
import { ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getNumberParam, getQueryParam } from '@/server/lib/route'

// GET /api/v1/users/[id]/reviews - Bir kullanıcının aldığı tüm değerlendirmeler (herkese açık)
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params

  const result = await reviewsService.listReceivedByUser(id, {
    reviewType: getQueryParam(req, 'type') as any,
    page: getNumberParam(req, 'page', 1),
    pageSize: getNumberParam(req, 'pageSize', 20),
  })

  return ok(result)
})
