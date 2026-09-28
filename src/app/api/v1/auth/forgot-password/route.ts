import { NextRequest, NextResponse } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'
import { passwordResetLimiter } from '@/server/lib/rate-limit'

// POST /api/v1/auth/forgot-password — Kademeli rate limit (e-posta bazlı)
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { email } = await req.json()
  if (!email) {
    return ok({ message: 'E-posta gerekli.' }, 'E-posta adresinize kod gönderildi (geçerliyse).')
  }

  // Rate limit — e-posta bazlı (IP değil)
  const rateLimitKey = `forgot:${email.toLowerCase()}`
  const rateCheck = passwordResetLimiter.check(rateLimitKey)
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

  try {
    const result = await securityService.requestPasswordReset(email)
    return ok(
      { preview: result.preview, sent: result.sent },
      result.sent
        ? 'Şifre sıfırlama kodu e-posta adresinize gönderildi.'
        : 'E-posta gönderilemedi (geliştirme modu).'
    )
  } catch (err: any) {
    return fail(err.message || 'İstek başarısız.', err.statusCode || 400)
  }
})
