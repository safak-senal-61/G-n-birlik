import { NextRequest } from 'next/server'
import { authService } from '@/server/services/auth.service'
import { withRateLimit } from '@/server/lib/route'
import { ok } from '@/server/lib/auth'
import { authLimiter } from '@/server/lib/rate-limit'
import { emailService } from '@/server/services/email.service'

export const POST = withRateLimit(authLimiter, async (req: NextRequest) => {
  const body = await req.json()
  const result = await authService.register(body)

  // Hoş geldin e-postası gönder (arka planda, hata olursa görmezden gel)
  emailService.sendWelcome(result.user.email, result.user.fullName).catch(() => {})

  const response = ok(result, 'Kayıt başarılı. Hoş geldiniz!')
  response.cookies.set('auth_token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
})
