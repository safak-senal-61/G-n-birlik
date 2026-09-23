import { NextRequest } from 'next/server'
import { paymentService } from '@/server/services/payment.service'
import { requireAuth, requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, withRateLimit } from '@/server/lib/route'
import { authLimiter } from '@/server/lib/rate-limit'

// GET /api/v1/payments/status/[jobId] - İşin ödeme durumu
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { jobId } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const result = await paymentService.getPaymentStatus(jobId, user.userId)
  return ok(result)
})
