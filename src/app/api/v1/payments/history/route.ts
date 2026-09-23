import { NextRequest } from 'next/server'
import { paymentService } from '@/server/services/payment.service'
import { requireAuth, requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, withRateLimit } from '@/server/lib/route'
import { authLimiter } from '@/server/lib/rate-limit'

// GET /api/v1/payments/history - Kullanıcının ödeme geçmişi
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const result = await paymentService.getMyPayments(user.userId)
  return ok(result)
})
