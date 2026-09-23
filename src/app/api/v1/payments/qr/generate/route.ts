import { NextRequest } from 'next/server'
import { paymentService } from '@/server/services/payment.service'
import { requireAuth, requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, withRateLimit } from '@/server/lib/route'
import { authLimiter } from '@/server/lib/rate-limit'

// POST /api/v1/payments/qr/generate - QR kod üret (işveren gösterir, işçi tarar)
export const POST = withRateLimit(authLimiter, async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  if (!body?.jobId) return fail('jobId gereklidir.', 400)
  if (!body?.step) return fail('step gereklidir.', 400)

  const validSteps = ['CHECK_IN', 'CHECK_OUT', 'PAYMENT']
  if (!validSteps.includes(body.step)) {
    return fail('Geçersiz step. CHECK_IN | CHECK_OUT | PAYMENT olmalı.', 400)
  }

  const result = await paymentService.generateQR(
    body.jobId,
    user.userId,
    body.step,
    body.applicationId
  )
  return ok(result, 'QR kod üretildi.')
})
