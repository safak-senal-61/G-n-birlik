import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { ok } from '@/server/lib/auth'
import { withRateLimit } from '@/server/lib/route'
import { passwordResetLimiter } from '@/server/lib/rate-limit'

// POST /api/v1/auth/forgot-password
export const POST = withRateLimit(passwordResetLimiter, async (req: NextRequest) => {
  const { email } = await req.json()
  if (!email) {
    return ok({ message: 'E-posta gerekli.' }, 'E-posta adresinize kod gönderildi (geçerliyse).')
  }
  const result = await securityService.requestPasswordReset(email)
  // Dev modunda preview döndür, production'da boş
  return ok(
    { preview: result.preview, sent: result.sent },
    result.sent
      ? 'Şifre sıfırlama kodu e-posta adresinize gönderildi.'
      : 'E-posta gönderilemedi (geliştirme modu).'
  )
})
