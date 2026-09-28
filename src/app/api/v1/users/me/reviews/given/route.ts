import { NextRequest } from 'next/server'
import { reviewsService } from '@/server/services/reviews.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getNumberParam, getQueryParam } from '@/server/lib/route'

// GET /api/v1/users/me/reviews/given - Verdiğim değerlendirmeler
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const result = await reviewsService.listGivenByUser(user.userId, {
    reviewType: getQueryParam(req, 'type') as any,
    page: getNumberParam(req, 'page', 1),
    pageSize: getNumberParam(req, 'pageSize', 20),
  })

  return ok(result)
})
