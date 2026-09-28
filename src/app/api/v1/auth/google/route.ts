import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/auth/google
// Body: { idToken } - Google Sign-In'den alınan ID token
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { idToken } = await req.json()

  if (!idToken) {
    return fail('Google ID token gerekli.', 400)
  }

  // GOOGLE_CLIENT_ID yoksa hata döndür (kurulum yapılmamış)
  if (!process.env.GOOGLE_CLIENT_ID) {
    return fail(
      'Google OAuth henüz yapılandırılmamış. .env dosyasına GOOGLE_CLIENT_ID ekleyin.',
      500
    )
  }

  const result = await securityService.googleAuth(idToken)
  const response = ok(
    { user: result.user, token: result.token, isNewUser: result.isNewUser },
    result.isNewUser ? 'Google ile kayıt başarılı! Hoş geldiniz.' : 'Google ile giriş yapıldı.'
  )
  // Token'ı cookie'ye de yaz (web için)
  response.cookies.set('auth_token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 gün
    path: '/',
  })
  return response
})
