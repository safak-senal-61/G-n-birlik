/**
 * E-posta Servisi - Resend kullanarak gerçek e-posta gönderimi
 *
 * Geliştirme modunda (EMAIL_DEV_MODE=true):
 *  - E-posta göndermez
 *  - İçeriği konsola yazdırır ve preview olarak döndürür
 *
 * Production modunda:
 *  - RESEND_API_KEY ile gerçek e-posta gönderir
 *  - EMAIL_FROM adresinden gönderir (Resend'de doğrulanmış olmalı)
 *
 * Resend kurulumu: https://resend.com
 * 1. Ücretsiz hesap aç (100 e-posta/ay ücretsiz)
 * 2. API Keys → Create API Key
 * 3. .env dosyasına RESEND_API_KEY=re_xxx ekle
 * 4. Domain doğrula (veya onboarding@resend.dev kullan test için)
 */
import { Resend } from 'resend'
import { ApiError } from '@/server/services/auth.service'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const DEV_MODE = process.env.EMAIL_DEV_MODE === 'true' || !RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'Günübirlik İş Bul <onboarding@resend.dev>'

export interface EmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  /**
   * E-posta gönder
   * Dev modunda: preview döndürür
   * Production'da: gerçek e-posta gönderir
   */
  async send(params: EmailParams): Promise<{ preview: string; sent: boolean }> {
    console.log(`📧 [EMAIL] ${DEV_MODE ? 'DEV MODE' : 'PRODUCTION'} → ${params.to}`)
    console.log(`   Subject: ${params.subject}`)

    if (DEV_MODE) {
      const preview = `[DEV] E-posta gönderilemedi (RESEND_API_KEY yok). İçerik:\n${params.text || params.html.substring(0, 200)}`
      console.log(`   ${preview}`)
      return { preview, sent: false }
    }

    try {
      const { data, error } = await resend!.emails.send({
        from: FROM_EMAIL,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      })

      if (error) {
        console.error('❌ [EMAIL] Gönderim hatası:', error)
        throw new ApiError(`E-posta gönderilemedi: ${error.message}`, 500)
      }

      console.log(`✅ [EMAIL] Gönderildi! ID: ${data?.id}`)
      return { preview: '', sent: true }
    } catch (err: any) {
      console.error('❌ [EMAIL] Hata:', err.message)
      throw new ApiError(`E-posta gönderilemedi: ${err.message}`, 500)
    }
  }

  // ====================================================================
  // Hazır Şablonlar
  // ====================================================================

  /**
   * Şifre sıfırlama kodu e-postası
   */
  async sendPasswordResetCode(email: string, code: string, expiresAt: Date): Promise<{ preview: string; sent: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Şifre Sıfırlama</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #10b981, #14b8a6); padding: 24px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">🔐</div>
            <h1 style="color: white; margin: 0; font-size: 20px;">Şifre Sıfırlama</h1>
          </div>
          <div style="padding: 24px;">
            <p style="color: #4b5563; margin: 0 0 16px;">Merhaba,</p>
            <p style="color: #4b5563; margin: 0 0 24px;">Şifrenizi sıfırlamak için bir talepte bulundunuz. Aşağıdaki 6 haneli kodu kullanarak şifrenizi yenileyebilirsiniz:</p>
            <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #047857; font-family: monospace;">${code}</div>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 0;">⏰ Bu kod <strong>${expiresAt.toLocaleString('tr-TR')}</strong> tarihinde sona erecek.</p>
            <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0;">Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          </div>
          <div style="background: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
            © 2024 Günübirlik İş Bul — Türkiye'nin günlük iş platformu
          </div>
        </div>
      </body>
      </html>
    `
    const text = `Şifre Sıfırlama Kodunuz: ${code}\n\nBu kod ${expiresAt.toLocaleString('tr-TR')} tarihinde sona erecek.\n\nGünübirlik İş Bul`

    return this.send({
      to: email,
      subject: '🔐 Şifre Sıfırlama Kodunuz',
      html,
      text,
    })
  }

  /**
   * E-posta değişiklik doğrulama kodu
   */
  async sendEmailChangeCode(email: string, code: string): Promise<{ preview: string; sent: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>E-posta Değişikliği</title></head>
      <body style="font-family: -apple-system, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 24px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 8px;">📧</div>
            <h1 style="color: white; margin: 0; font-size: 20px;">E-posta Doğrulama</h1>
          </div>
          <div style="padding: 24px;">
            <p style="color: #4b5563; margin: 0 0 16px;">Merhaba,</p>
            <p style="color: #4b5563; margin: 0 0 24px;">Hesabınızın e-posta adresini değiştirmek için doğrulama kodunuz:</p>
            <div style="background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af; font-family: monospace;">${code}</div>
            </div>
            <p style="color: #6b7280; font-size: 13px; margin: 0;">Bu kodu kimseyle paylaşmayın.</p>
          </div>
          <div style="background: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
            © 2024 Günübirlik İş Bul
          </div>
        </div>
      </body>
      </html>
    `
    return this.send({
      to: email,
      subject: '📧 E-posta Doğrulama Kodunuz',
      html,
      text: `E-posta doğrulama kodunuz: ${code}`,
    })
  }

  /**
   * Hoş geldin e-postası
   */
  async sendWelcome(email: string, fullName: string): Promise<{ preview: string; sent: boolean }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Hoş Geldiniz</title></head>
      <body style="font-family: -apple-system, sans-serif; background: #f3f4f6; padding: 20px; margin: 0;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <div style="background: linear-gradient(135deg, #10b981, #14b8a6); padding: 32px 24px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
            <h1 style="color: white; margin: 0; font-size: 24px;">Hoş geldiniz, ${fullName}!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Günübirlik İş Bul'a katıldığınız için teşekkürler</p>
          </div>
          <div style="padding: 24px;">
            <p style="color: #4b5563; margin: 0 0 16px;">Artık konumunuza en yakın günlük işleri keşfedebilir, hızlıca başvurabilir ve aynı gün ödeme alabilirsiniz!</p>
            <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; color: #047857; font-size: 14px;">💡 <strong>Hızlı başlangıç:</strong></p>
              <ul style="margin: 8px 0 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
                <li>Profilinizi tamamlayın</li>
                <li>Konumunuzu ekleyin</li>
                <li>Yakındaki işleri keşfedin</li>
              </ul>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
            © 2024 Günübirlik İş Bul
          </div>
        </div>
      </body>
      </html>
    `
    return this.send({
      to: email,
      subject: '🎉 Günübirlik İş Bul - Hoş Geldiniz!',
      html,
      text: `Hoş geldiniz ${fullName}! Günübirlik İş Bul platformuna katıldığınız için teşekkürler.`,
    })
  }

  /**
   * 2FA devre dışı bırakıldı bildirimi
   */
  async send2FADisabled(email: string): Promise<{ preview: string; sent: boolean }> {
    return this.send({
      to: email,
      subject: '⚠️ 2FA Devre Dışı Bırakıldı',
      html: `<p>Hesabınızda 2FA devre dışı bırakıldı. Bu siz değilseniz hemen şifrenizi değiştirin.</p>`,
      text: 'Hesabınızda 2FA devre dışı bırakıldı.',
    })
  }
}

export const emailService = new EmailService()
