import { NextRequest } from 'next/server'
import { verificationService } from '@/server/services/reviews.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/users/me/verification-status - Aktif doğrulama durumum
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const status = await verificationService.getMyActiveRequest(user.userId)
  return ok(status)
})
