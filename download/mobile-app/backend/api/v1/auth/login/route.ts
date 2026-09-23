import { NextRequest, NextResponse } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { withRateLimit } from '@/server/lib/route'
import { ok, fail, generateToken, verifyPassword } from '@/server/lib/auth'
import { authLimiter } from '@/server/lib/rate-limit'
import { db } from '@/lib/db'
import { auditLogger, getRequestInfo } from '@/server/services/audit.service'

export const POST = withRateLimit(authLimiter, async (req: NextRequest) => {
  const body = await req.json()
  const { ip } = getRequestInfo(req)

  // 1. Kullanıcıyı bul
  const user = await db.user.findUnique({
    where: { email: body.email.toLowerCase() },
  })

  if (!user || !user.password) {
    auditLogger.log({
      action: 'LOGIN_FAILED',
      ip,
      details: { email: body.email, reason: 'user_not_found' },
    })
    return fail('E-posta veya şifre hatalı.', 401)
  }

  // 2. Şifre kontrolü
  if (!verifyPassword(body.password, user.password)) {
    auditLogger.log({
      userId: user.id,
      action: 'LOGIN_FAILED',
      ip,
      details: { reason: 'wrong_password' },
    })
    return fail('E-posta veya şifre hatalı.', 401)
  }

  // 3. 2FA kontrolü (şifre doğru ama 2FA aktif)
  if (user.twoFactorEnabled) {
    if (!body.twoFactorCode) {
      // 2FA kodu gerekli - frontend'e haber ver (başarısız response değil!)
      return NextResponse.json({
        success: false,
        requiresTwoFactor: true,
        message: 'İki faktörlü doğrulama kodu gerekli.',
        userId: user.id,
      }, { status: 200 }) // 200 dön ki frontend hata olarak yakalamasın
    }

    // 2FA kodunu doğrula
    const valid = await securityService.verify2FALogin(user.id, body.twoFactorCode)
    if (!valid) {
      auditLogger.log({
        userId: user.id,
        action: '2FA_LOGIN_FAILED',
        ip,
      })
      return fail('Geçersiz 2FA kodu.', 401)
    }
  }

  // 4. Aktiflik güncelle
  await db.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  })

  // 5. Token üret
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  })

  // 6. Audit log
  auditLogger.log({
    userId: user.id,
    action: 'LOGIN',
    ip,
  })

  // 7. Response (şifre ve hassas alanları temizle)
  const { password, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = user
  const result = { user: { ...safeUser, skills: safeUser.skills ? JSON.parse(safeUser.skills as string) : [] }, token }

  const response = ok(result, 'Giriş başarılı.')
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return response
})
