import { NextRequest } from 'next/server'
import { reviewsService } from '@/server/services/reviews.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/users/me/rating-summary - Kendi puan özetim
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const summary = await reviewsService.getUserRatingSummary(user.userId)
  return ok(summary)
})
