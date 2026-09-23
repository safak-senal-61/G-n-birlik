import { NextRequest } from 'next/server'
import { paymentService } from '@/server/services/payment.service'
import { requireAuth, requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, withRateLimit } from '@/server/lib/route'
import { authLimiter } from '@/server/lib/rate-limit'

// POST /api/v1/payments/qr/verify - QR doğrula (işçi tarar)
export const POST = withRateLimit(authLimiter, async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  if (!body?.token) return fail('token gereklidir.', 400)

  // Konum opsiyonel: lat & lng birlikte gönderilirse doğrulamaya dahil edilir
  const scanLocation =
    typeof body.lat === 'number' && typeof body.lng === 'number'
      ? { lat: body.lat, lng: body.lng }
      : undefined

  const result = await paymentService.verifyQR(
    user.userId,
    body.token,
    scanLocation
  )
  return ok(result, 'QR doğrulandı.')
})
