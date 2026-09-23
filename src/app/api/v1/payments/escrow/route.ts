import { NextRequest } from 'next/server'
import { paymentService } from '@/server/services/payment.service'
import { requireAuth, requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, withRateLimit } from '@/server/lib/route'
import { authLimiter } from '@/server/lib/rate-limit'

// POST /api/v1/payments/escrow - Escrow fonla (işveren iş ücretini emanete alır)
export const POST = withRateLimit(authLimiter, async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  if (!body?.jobId) return fail('jobId gereklidir.', 400)

  const result = await paymentService.fundEscrow(body.jobId, user.userId)
  return ok(result, 'Escrow fonlandı.')
})
