/**
 * Security Service - Şifre sıfırlama, 2FA (TOTP), e-posta doğrulama
 *
 * 2FA için Google Authenticator, Authy, Microsoft Authenticator gibi
 * TOTP uygulamalarıyla uyumlu RFC 6238 kodları üretir.
 */
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, generateToken } from '@/server/lib/auth'
import { ApiError } from '@/server/services/auth.service'
import { emailService } from '@/server/services/email.service'
import { fileUploadService } from '@/server/services/file-upload.service'
import { authenticator, totp } from '@otplib/preset-default'
import { OAuth2Client } from 'google-auth-library'
import QRCode from 'qrcode'
import crypto from 'crypto'

const ISSUER = 'Günübirlik İş Bul'
const RESET_EXPIRY_HOURS = 1
const VERIFICATION_EXPIRY_HOURS = 24

// ====================================================================
// ŞİFRE SIFIRLAMA
// ====================================================================

export class SecurityService {
  /**
   * Şifre sıfırlama talebi - e-posta adresine 6 haneli kod gönderir
   * RESEND_API_KEY varsa gerçek e-posta gönderir, yoksa preview döner
   */
  async requestPasswordReset(email: string): Promise<{ preview: string; sent: boolean }> {
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      // Güvenlik: Kullanıcı var mı diye belli etme - ama yine de "gönderildi" de
      throw new ApiError('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.', 404)
    }

    // Eski talepleri temizle
    await db.passwordReset.deleteMany({
      where: { userId: user.id, usedAt: null },
    })

    // 6 haneli kod ve token üret
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000)

    await db.passwordReset.create({
      data: {
        userId: user.id,
        token,
        code,
        expiresAt,
      },
    })

    // Gerçek e-posta gönder
    const emailResult = await emailService.sendPasswordResetCode(user.email, code, expiresAt)
    return emailResult
  }

  /**
   * Şifre sıfırlama kodunu doğrula ve yeni şifreyi kaydet
   */
  async resetPassword(code: string, newPassword: string): Promise<{ success: boolean }> {
    if (newPassword.length < 6) {
      throw new ApiError('Şifre en az 6 karakter olmalı.', 400)
    }

    const reset = await db.passwordReset.findFirst({
      where: { code, usedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    if (!reset) {
      throw new ApiError('Geçersiz veya kullanılmış kod.', 400)
    }

    if (reset.expiresAt < new Date()) {
      throw new ApiError('Kodun süresi dolmuş. Yeni kod talep edin.', 400)
    }

    const user = await db.user.findUnique({ where: { id: reset.userId } })
    if (!user) {
      throw new ApiError('Kullanıcı bulunamadı.', 404)
    }

    // Şifreyi güncelle ve kodu işaretle
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashPassword(newPassword) },
      }),
      db.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
    ])

    return { success: true }
  }

  /**
   * Mevcut şifreyi doğrula ve yeni şifre belirle
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (newPassword.length < 6) {
      throw new ApiError('Yeni şifre en az 6 karakter olmalı.', 400)
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || !user.password) {
      throw new ApiError('Kullanıcı bulunamadı.', 404)
    }

    if (!verifyPassword(currentPassword, user.password)) {
      throw new ApiError('Mevcut şifre hatalı.', 401)
    }

    await db.user.update({
      where: { id: userId },
      data: { password: hashPassword(newPassword) },
    })
  }

  // ====================================================================
  // E-POSTA DOĞRULAMA VE GÜNCELLEME
  // ====================================================================

  /**
   * Yeni e-posta adresi için doğrulama kodu gönder
   */
  async requestEmailChange(userId: string, newEmail: string): Promise<{ preview: string; sent: boolean }> {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      throw new ApiError('Geçerli bir e-posta adresi girin.', 400)
    }

    const existing = await db.user.findUnique({ where: { email: newEmail.toLowerCase() } })
    if (existing && existing.id !== userId) {
      throw new ApiError('Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.', 409)
    }

    // Eski talepleri temizle
    await db.emailVerification.deleteMany({
      where: { userId, usedAt: null },
    })

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000)

    await db.emailVerification.create({
      data: {
        userId,
        email: newEmail.toLowerCase(),
        code,
        expiresAt,
      },
    })

    // Yeni e-postaya doğrulama kodu gönder
    const emailResult = await emailService.sendEmailChangeCode(newEmail, code)
    return emailResult
  }

  /**
   * E-posta değişiklik kodunu doğrula ve e-postayı güncelle
   */
  async confirmEmailChange(userId: string, code: string): Promise<{ email: string }> {
    const verification = await db.emailVerification.findFirst({
      where: { userId, code, usedAt: null },
      orderBy: { createdAt: 'desc' },
    })

    if (!verification) {
      throw new ApiError('Geçersiz kod.', 400)
    }

    if (verification.expiresAt < new Date()) {
      throw new ApiError('Kodun süresi dolmuş.', 400)
    }

    // E-posta başka kullanıcı tarafından alınmış mı kontrol et
    const existing = await db.user.findUnique({ where: { email: verification.email } })
    if (existing && existing.id !== userId) {
      throw new ApiError('Bu e-posta artık kullanılamıyor.', 409)
    }

    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { email: verification.email, emailVerified: true },
      }),
      db.emailVerification.update({
        where: { id: verification.id },
        data: { usedAt: new Date() },
      }),
    ])

    return { email: verification.email }
  }

  // ====================================================================
  // 2FA (İki Faktörlü Doğrulama) - TOTP / Google Authenticator
  // ====================================================================

  /**
   * 2FA için TOTP secret üret ve QR kod döndür
   */
  async setup2FA(userId: string): Promise<{ qrCode: string; secret: string; backupCodes: string[] }> {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    // Yeni secret üret
    const secret = authenticator.generateSecret()

    // OTP auth URL (Google Authenticator formatında)
    const otpauth = authenticator.keyuri(user.email, ISSUER, secret)

    // QR kodu base64 olarak üret
    const qrCode = await QRCode.toDataURL(otpauth, {
      width: 240,
      margin: 1,
      color: { dark: '#10b981', light: '#ffffff' },
    })

    // Backup kodları üret (10 adet)
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    )

    // Secret'ı geçici olarak kaydet (henüz aktif değil)
    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    })

    return { qrCode, secret, backupCodes }
  }

  /**
   * 2FA kurulumunu doğrula ve aktif et
   */
  async verify2FA(userId: string, code: string): Promise<{ enabled: boolean }> {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || !user.twoFactorSecret) {
      throw new ApiError('Önce 2FA kurulumu başlatın.', 400)
    }

    // Kodu doğrula
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    })

    if (!isValid) {
      throw new ApiError('Geçersiz doğrulama kodu.', 400)
    }

    // 2FA'yı aktif et
    await db.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    })

    return { enabled: true }
  }

  /**
   * 2FA'yı devre dışı bırak
   */
  async disable2FA(userId: string, code: string): Promise<{ enabled: boolean }> {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || !user.twoFactorEnabled) {
      throw new ApiError('2FA zaten devre dışı.', 400)
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret!,
    })

    // Backup kodu kontrol et
    let backupValid = false
    if (!isValid && user.twoFactorBackupCodes) {
      const codes: string[] = JSON.parse(user.twoFactorBackupCodes)
      const idx = codes.indexOf(code.toUpperCase())
      if (idx >= 0) {
        codes.splice(idx, 1)
        backupValid = true
        await db.user.update({
          where: { id: userId },
          data: { twoFactorBackupCodes: JSON.stringify(codes) },
        })
      }
    }

    if (!isValid && !backupValid) {
      throw new ApiError('Geçersiz doğrulama kodu.', 400)
    }

    await db.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    })

    return { enabled: false }
  }

  /**
   * Giriş sırasında 2FA doğrulaması
   */
  async verify2FALogin(userId: string, code: string): Promise<boolean> {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return true
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    })

    if (isValid) return true

    // Backup kodu kontrol et
    if (user.twoFactorBackupCodes) {
      const codes: string[] = JSON.parse(user.twoFactorBackupCodes)
      const idx = codes.indexOf(code.toUpperCase())
      if (idx >= 0) {
        codes.splice(idx, 1)
        await db.user.update({
          where: { id: userId },
          data: { twoFactorBackupCodes: JSON.stringify(codes) },
        })
        return true
      }
    }

    return false
  }

  // ====================================================================
  // GOOGLE OAUTH
  // ====================================================================

  // Google OAuth2 client (lazy init, sadece GOOGLE_CLIENT_ID varsa)
  private googleClient: OAuth2Client | null = null

  private getGoogleClient(): OAuth2Client {
    if (!this.googleClient) {
      const clientId = process.env.GOOGLE_CLIENT_ID
      if (!clientId) {
        throw new ApiError('Google OAuth yapılandırılmamış. GOOGLE_CLIENT_ID eksik.', 500)
      }
      this.googleClient = new OAuth2Client(clientId)
    }
    return this.googleClient
  }

  /**
   * Google OAuth ile giriş/kayıt
   * Frontend Google Sign-In'den aldığı ID token'ı gönderir
   * Backend token'ı doğrular ve kullanıcıyı oluşturur/bağlar
   */
  async googleAuth(idToken: string): Promise<{ user: any; token: string; isNewUser: boolean }> {
    // 1. Google ID token'ı doğrula
    let ticket
    try {
      ticket = await this.getGoogleClient().verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      })
    } catch (err: any) {
      throw new ApiError('Geçersiz Google token: ' + err.message, 401)
    }

    const payload = ticket.getPayload()
    if (!payload) {
      throw new ApiError('Google token payload alınamadı.', 401)
    }

    const googleId = payload.sub
    const email = payload.email!
    const fullName = payload.name || email.split('@')[0]
    const avatarUrl = payload.picture

    // 2. Google ID ile kullanıcı ara
    let user = await db.user.findUnique({
      where: { googleId },
    })

    let isNewUser = false

    // 3. Yoksa e-posta ile ara, Google ID'yi bağla
    if (!user) {
      user = await db.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (user) {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            googleId,
            provider: 'GOOGLE',
            emailVerified: true,
            avatarUrl: user.avatarUrl || avatarUrl,
          },
        })
      } else {
        // 4. Yeni kullanıcı oluştur
        isNewUser = true
        user = await db.user.create({
          data: {
            email: email.toLowerCase(),
            fullName,
            googleId,
            provider: 'GOOGLE',
            emailVerified: true,
            avatarUrl,
            role: 'WORKER',
            // Şifre yok - sadece Google ile giriş
          },
        })

        // Hoş geldin e-postası gönder
        await emailService.sendWelcome(user.email, user.fullName).catch(() => {})
      }
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Aktiflik güncelle
    await db.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })

    // Hassas alanları temizle
    const { password, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = user as any
    return { user: safeUser, token, isNewUser }
  }

  // ====================================================================
  // AVATAR YÜKLEME
  // ====================================================================

  /**
   * Avatar yükle
   * Mod local ise base64 olarak DB'ye, cloudinary ise CDN'e yükler
   */
  async uploadAvatar(userId: string, base64Data: string, mimeType: string): Promise<{ avatarUrl: string }> {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    // Eski avatar'ı sil (cloudinary ise)
    if (user.avatarUrl && user.avatarUrl.startsWith('http')) {
      await fileUploadService.deleteFile(user.avatarUrl)
    }

    // Yeni avatar'ı yükle
    const result = await fileUploadService.uploadAvatar(userId, base64Data, mimeType)

    await db.user.update({
      where: { id: userId },
      data: { avatarUrl: result.url },
    })

    return { avatarUrl: result.url }
  }

  /**
   * Kullanıcının güvenlik ayarlarını getir
   */
  async getSecurityInfo(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        twoFactorEnabled: true,
        provider: true,
        googleId: true,
        password: true,
      },
    })

    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    const { password, ...safe } = user
    return { ...safe, hasPassword: !!password }
  }
}

export const securityService = new SecurityService()
