import { NextRequest } from 'next/server'
import { reviewsService } from '@/server/services/reviews.service'
import { ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/users/[id]/rating-summary - Kullanıcının puan özeti (herkese açık)
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const summary = await reviewsService.getUserRatingSummary(id)
  return ok(summary)
})
