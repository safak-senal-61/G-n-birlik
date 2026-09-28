import { NextRequest, NextResponse } from 'next/server'
import { emailOtpService } from '@/server/services/email-otp.service'
import { db } from '@/lib/db'
import { ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'
import { otpLimiter } from '@/server/lib/rate-limit'

/**
 * POST /api/v1/auth/send-otp
 * OTP gönder — rate limit e-posta+tip bazlı (IP bazlı değil)
 * Aynı e-posta için aynı tipte 3 deneme serbest, sonra kademeli bekleme
 * Farklı e-posta/Tip kombinasyonları birbirini etkilemez
 */
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json()
  const { email, type } = body

  if (!email || !type) {
    return fail('email ve type zorunludur.', 400)
  }

  const validTypes = ['EMAIL_ACTIVATION', 'PASSWORD_RESET', 'EMAIL_CHANGE', 'LOGIN_VERIFY', 'PHONE_VERIFY']
  if (!validTypes.includes(type)) {
    return fail(`Geçersiz tip. Şunlardan biri: ${validTypes.join(', ')}`, 400)
  }

  // Rate limit — e-posta + tip bazlı (IP değil)
  const rateLimitKey = `${email.toLowerCase()}:${type}`
  const rateCheck = otpLimiter.check(rateLimitKey)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Çok fazla deneme. ${rateCheck.message}`,
        retryAfter: rateCheck.waitSeconds,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateCheck.waitSeconds) },
      }
    )
  }

  // Kullanıcıyı bul
  let user = null
  if (type !== 'EMAIL_ACTIVATION') {
    user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      return ok({ sent: true }, 'Doğrulama kodu gönderildi (e-posta kayıtlıysa).')
    }
  } else {
    user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  }

  const result = await emailOtpService.sendOtp({
    email,
    type,
    userId: user?.id,
    userName: user?.fullName,
    ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
  })

  return ok(result, result.message)
})
