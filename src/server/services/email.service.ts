/**
 * E-posta Servisi - Resend & OneSignal Email kullanarak gerçek e-posta gönderimi
 *
 * 1. Resend (RESEND_API_KEY varsa)
 * 2. OneSignal Email (ONESIGNAL_REST_API_KEY ile)
 * 3. Dev modu fallback (kodu log'a yazar)
 */
import { Resend } from 'resend'
import { ApiError } from '@/server/services/auth.service'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const FROM_EMAIL = process.env.EMAIL_FROM || 'Günübirlik İş Bul <onboarding@resend.dev>'

export interface EmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailResult {
  preview: string // Boş string = gönderildi, dolu = gönderilemedi (dev modu)
  sent: boolean
}

export class EmailService {
  /**
   * E-posta gönder
   * 1. Resend API
   * 2. OneSignal Email API
   * 3. Dev modu console fallback
   */
  async send(params: EmailParams): Promise<{ preview: string; sent: boolean }> {
    console.log(`📧 [EMAIL] Gönderim başlatıldı → ${params.to}`)
    console.log(`   Subject: ${params.subject}`)

    // 1. Resend ile dene (varsa)
    if (resend) {
      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text,
        })

        if (!error && data?.id) {
          console.log(`✅ [EMAIL] Resend ile gönderildi! ID: ${data?.id}`)
          return { preview: '', sent: true }
        }
        console.warn('⚠️ [EMAIL] Resend hatası:', error)
      } catch (err: any) {
        console.warn('⚠️ [EMAIL] Resend exception:', err.message)
      }
    }

    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || ''
    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''

    if (ONESIGNAL_REST_API_KEY) {
      try {
        const authHeader = (ONESIGNAL_REST_API_KEY.startsWith('os_v2_') ? 'Key ' : 'Bearer ') + ONESIGNAL_REST_API_KEY
        const res = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader,
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

        const result = await res.json() as any
        if (result.id) {
          console.log(`✅ [EMAIL] OneSignal Email ile gönderildi! ID: ${result.id} → ${params.to}`)
          return { preview: '', sent: true }
        }
        console.warn('⚠️ [EMAIL] OneSignal Email hatası:', result.errors || result)
      } catch (err: any) {
        console.warn('⚠️ [EMAIL] OneSignal Email exception:', err.message)
      }
    }

    // 3. Dev modu fallback
    console.log(`   ⚠️  E-posta gönderilemedi (dev modu fallback)`)
    console.log(`   📝 İçerik önizleme: ${(params.text || params.html.substring(0, 200))}`)
    return { preview: '', sent: false }
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
