/**
 * Email OTP Service — OneSignal Email ile OTP gönderimi
 *
 * OneSignal Email yapılandırması:
 *   From: noreply@gunubirlik.com
 *   Reply-to: destek@gunubirlik.com
 *
 * Kullanım tipleri:
 *   EMAIL_ACTIVATION — Kayıt sonrası hesap aktivasyonu
 *   PASSWORD_RESET — Şifre sıfırlama
 *   EMAIL_CHANGE — E-posta değişikliği
 *   LOGIN_VERIFY — Şüpheli giriş
 *   PHONE_VERIFY — Telefon değişikliği
 */
import { db } from '@/lib/db'
import { ApiError } from './auth.service'

const OTP_EXPIRY_MINUTES = 10
const MAX_ATTEMPTS = 5
const ONESIGNAL_APP_ID = '6bddc78e-79e7-4701-9e46-6fca772e402a'

const OTP_TEMPLATES: Record<string, { subject: string; title: string; body: (code: string, name?: string) => string }> = {
  EMAIL_ACTIVATION: {
    subject: '🎉 Hesabınızı Aktifleştirin',
    title: 'Hesap Aktivasyonu',
    body: (code, name) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981, #14b8a6); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Hoş geldiniz${name ? ', ' + name : ''}! 🎉</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Günübirlik İş Bul'a katıldığınız için teşekkürler</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px;">Hesabınızı aktifleştirmek için aşağıdaki 6 haneli kodu kullanın:</p>
          <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #047857; font-family: monospace;">${code}</div>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">⏰ Bu kod 10 dakika içinde sona erecek.</p>
          <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">Bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #9ca3af;">
          © 2024 Günübirlik İş Bul — Türkiye'nin günlük iş platformu
        </div>
      </div>
    `,
  },
  PASSWORD_RESET: {
    subject: '🔐 Şifre Sıfırlama Kodu',
    title: 'Şifre Sıfırlama',
    body: (code, name) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #ef4444, #f97316); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Şifre Sıfırlama 🔐</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Şifrenizi sıfırlamak için talepte bulundunuz</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px;">Şifrenizi sıfırlamak için aşağıdaki kodu kullanın:</p>
          <div style="background: #fef2f2; border: 2px dashed #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #991b1b; font-family: monospace;">${code}</div>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">⏰ Bu kod 10 dakika içinde sona erecek.</p>
          <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">Bu işlemi siz yapmadıysanız, şifrenizi değiştirmenize gerek yok.</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #9ca3af;">
          © 2024 Günübirlik İş Bul
        </div>
      </div>
    `,
  },
  EMAIL_CHANGE: {
    subject: '📧 E-posta Değişiklik Doğrulaması',
    title: 'E-posta Değişikliği',
    body: (code, name) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">E-posta Değişikliği 📧</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Yeni e-posta adresinizi doğrulayın</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px;">Yeni e-posta adresinizi doğrulamak için aşağıdaki kodu kullanın:</p>
          <div style="background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e40af; font-family: monospace;">${code}</div>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">⏰ Bu kod 10 dakika içinde sona erecek.</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #9ca3af;">
          © 2024 Günübirlik İş Bul
        </div>
      </div>
    `,
  },
  LOGIN_VERIFY: {
    subject: '🔒 Giriş Doğrulaması',
    title: 'Giriş Doğrulaması',
    body: (code, name) => `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; background: #f9fafb; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Giriş Doğrulaması 🔒</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Hesabınıza giriş yapmak için doğrulayın</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #4b5563; font-size: 14px; margin: 0 0 16px;">Güvenliğiniz için giriş doğrulama kodu:</p>
          <div style="background: #f5f3ff; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #5b21b6; font-family: monospace;">${code}</div>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">⏰ Bu kod 10 dakika içinde sona erecek.</p>
          <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0;">Bu giriş denemesi siz değilse hemen şifrenizi değiştirin.</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px 24px; text-align: center; font-size: 11px; color: #9ca3af;">
          © 2024 Günübirlik İş Bul
        </div>
      </div>
    `,
  },
}

class EmailOtpService {
  /**
   * OTP gönder — OneSignal Email API ile
   */
  async sendOtp(params: {
    email: string
    type: 'EMAIL_ACTIVATION' | 'PASSWORD_RESET' | 'EMAIL_CHANGE' | 'LOGIN_VERIFY' | 'PHONE_VERIFY'
    userId?: string
    userName?: string
    ipAddress?: string
  }): Promise<{ success: boolean; message: string }> {
    const { email, type, userId, userName, ipAddress } = params

    // Eski OTP'leri temizle (aynı e-posta + tip için)
    await db.emailOtp.deleteMany({
      where: { email: email.toLowerCase(), type, usedAt: null },
    })

    // 6 haneli kod üret
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // DB'ye kaydet
    await db.emailOtp.create({
      data: {
        email: email.toLowerCase(),
        code,
        type,
        expiresAt,
        userId: userId || null,
        ipAddress,
      },
    })

    // OneSignal Email API ile gönder
    const template = OTP_TEMPLATES[type]
    if (!template) {
      throw new ApiError('Geçersiz OTP tipi', 400)
    }

    // E-posta gönder — önce Resend dene, yoksa OneSignal Email
    const emailResult = await this.sendEmail({
      to: email,
      subject: template.subject,
      html: template.body(code, userName),
    })

    if (emailResult) {
      console.log(`[EmailOTP] ${type} kodu gönderildi: ${email} (${code})`)
      return { success: true, message: `${OTP_EXPIRY_MINUTES} dakika geçerli doğrulama kodu e-posta adresinize gönderildi.` }
    } else {
      // E-posta gönderilemedi — kodu logla (geliştirme modu)
      console.log(`[EmailOTP] E-posta gönderilemedi, kod: ${code} (${email})`)
      return { success: true, message: `Doğrulama kodunuz: ${code}` }
    }
  }

  /**
   * OTP doğrula
   */
  async verifyOtp(params: {
    email: string
    code: string
    type: string
  }): Promise<{ valid: boolean; userId?: string; message: string }> {
    const { email, code, type } = params

    const otp = await db.emailOtp.findFirst({
      where: {
        email: email.toLowerCase(),
        code,
        type,
        usedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      // Yanlış kod — deneme sayısını artır
      const recentOtp = await db.emailOtp.findFirst({
        where: { email: email.toLowerCase(), type, usedAt: null },
        orderBy: { createdAt: 'desc' },
      })
      if (recentOtp) {
        await db.emailOtp.update({
          where: { id: recentOtp.id },
          data: { attempts: { increment: 1 } },
        })
        if (recentOtp.attempts + 1 >= MAX_ATTEMPTS) {
          await db.emailOtp.update({
            where: { id: recentOtp.id },
            data: { usedAt: new Date() }, // Max deneme aşıldı, OTP iptal
          })
          return { valid: false, message: 'Çok fazla yanlış deneme. Yeni kod talep edin.' }
        }
      }
      return { valid: false, message: 'Geçersiz doğrulama kodu.' }
    }

    // Süre kontrolü
    if (otp.expiresAt < new Date()) {
      await db.emailOtp.update({
        where: { id: otp.id },
        data: { usedAt: new Date() },
      })
      return { valid: false, message: 'Doğrulama kodunun süresi dolmuş. Yeni kod talep edin.' }
    }

    // Başarılı — OTP'yi kullanıldı olarak işaretle
    await db.emailOtp.update({
      where: { id: otp.id },
      data: { usedAt: new Date() },
    })

    return { valid: true, userId: otp.userId || undefined, message: 'Doğrulama başarılı.' }
  }

  /**
   * E-posta gönder — önce Resend, sonra OneSignal Email dene
   */
  private async sendEmail(params: {
    to: string
    subject: string
    html: string
  }): Promise<boolean> {
    // Runtime'da env vars oku (production build'de modül seviyesinde çalışmıyor)
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY

    console.log('[EmailOTP] sendEmail başlatıldı ->', params.to)
    console.log('[EmailOTP] RESEND_API_KEY:', RESEND_API_KEY ? 'var' : 'yok')
    console.log('[EmailOTP] ONESIGNAL_REST_API_KEY:', ONESIGNAL_REST_API_KEY ? 'var' : 'yok')

    // 1. Resend ile dene (RESEND_API_KEY varsa)
    if (RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(RESEND_API_KEY)
        const { data, error } = await resend.emails.send({
          from: 'Günübirlik İş Bul <onboarding@resend.dev>',
          to: params.to,
          subject: params.subject,
          html: params.html,
        })
        if (!error && data?.id) {
          console.log('[EmailOTP] ✅ Resend ile gönderildi:', data.id, '->', params.to)
          return true
        }
        console.warn('[EmailOTP] Resend hatası:', error)
      } catch (e) {
        console.warn('[EmailOTP] Resend exception:', e)
      }
    }

    // 2. OneSignal Email ile dene
    if (ONESIGNAL_REST_API_KEY) {
      try {
        const res = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            include_email_tokens: [params.to],
            email_subject: params.subject,
            email_body: params.html,
            email_from_name: 'Günübirlik İş Bul',
            email_from_address: 'noreply@gunubirlik.com',
            email_reply_to_address: 'destek@gunubirlik.com',
          }),
        })

        const result = await res.json()
        console.log('[EmailOTP] OneSignal Email yanıt:', JSON.stringify(result).slice(0, 200))
        if (result.id) {
          console.log('[EmailOTP] ✅ OneSignal Email ile gönderildi:', result.id)
          return true
        }
        console.warn('[EmailOTP] OneSignal Email hatası:', result.errors || result)
      } catch (e) {
        console.warn('[EmailOTP] OneSignal Email exception:', e)
      }
    }

    // 3. Hiçbiri çalışmadı
    console.log('[EmailOTP] ❌ E-posta gönderilemedi — API key yok veya OneSignal Email kapalı')
    return false
  }
}

export const emailOtpService = new EmailOtpService()
