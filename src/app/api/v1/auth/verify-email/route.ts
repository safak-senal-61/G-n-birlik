import { NextRequest } from 'next/server'
import { emailOtpService } from '@/server/services/email-otp.service'
import { db } from '@/lib/db'
import { ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

/**
 * POST /api/v1/auth/verify-email
 * E-posta aktivasyonu — kayıt sonrası hesabı doğrula
 *
 * Body: { "email": "user@example.com", "code": "123456" }
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json()
  const { email, code } = body

  if (!email || !code) {
    return fail('email ve code zorunludur.', 400)
  }

  // OTP doğrula
  const result = await emailOtpService.verifyOtp({
    email,
    code,
    type: 'EMAIL_ACTIVATION',
  })

  if (!result.valid) {
    return fail(result.message, 400)
  }

  // Kullanıcıyı aktifleştir
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user) {
    return fail('Kullanıcı bulunamadı.', 404)
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  })

  return ok({ verified: true, userId: user.id }, 'E-posta adresiniz doğrulandı! Hesabınız aktif.')
})
