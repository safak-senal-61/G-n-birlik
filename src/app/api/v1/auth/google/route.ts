import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/auth/google
// Body: { idToken, completeRegistration?, role?, fullName?, phone?, city?, district?, companyName?, acceptedContracts? }
export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json()
  const token = body.idToken || body.accessToken

  if (!token) {
    return fail('Google kimlik doğrulama bilgisi (token) gerekli.', 400)
  }

  const result = await securityService.googleAuth(token, {
    completeRegistration: Boolean(body.completeRegistration),
    role: body.role,
    fullName: body.fullName,
    phone: body.phone,
    city: body.city,
    district: body.district,
    companyName: body.companyName,
    acceptedContracts: Boolean(body.acceptedContracts),
  })

  // Yeni kullanıcı ise ve henüz rol/bilgi seçimi yapmadıysa kaydı oluşturmadan onboarding iste
  if (result.requiresRegistration) {
    return ok(
      {
        requiresRegistration: true,
        googleProfile: result.googleProfile,
        user: null,
        token: '',
        isNewUser: true,
      },
      'Google hesabınız doğrulandı. Kaydınızı tamamlamak için hesap türünüzü ve bilgilerinizi girin.'
    )
  }

  const response = ok(
    {
      requiresRegistration: false,
      user: result.user,
      token: result.token,
      isNewUser: result.isNewUser,
    },
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
