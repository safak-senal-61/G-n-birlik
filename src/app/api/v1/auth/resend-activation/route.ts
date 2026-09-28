import { NextRequest } from 'next/server'
import { emailOtpService } from '@/server/services/email-otp.service'
import { db } from '@/lib/db'
import { ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

/**
 * POST /api/v1/auth/resend-activation
 * Aktivasyon e-postasını yeniden gönder
 *
 * Body: { "email": "user@example.com" }
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json()
  const { email } = body

  if (!email) {
    return fail('email zorunludur.', 400)
  }

  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) {
    return fail('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.', 404)
  }

  if (user.emailVerified) {
    return fail('E-posta adresiniz zaten doğrulanmış.', 400)
  }

  const result = await emailOtpService.sendOtp({
    email,
    type: 'EMAIL_ACTIVATION',
    userId: user.id,
    userName: user.fullName,
    ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
  })

  return ok(result, result.message)
})
