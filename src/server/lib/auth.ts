/**
 * Backend yardımcı fonksiyonları - Nest.js tarzı mimari
 * Tüm API servisleri ve controller'lar bu kütüphaneleri kullanır.
 *
 * GÜVENLİK: bcrypt + jsonwebtoken kullanır (production-ready)
 */
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// ====================================================================
// JWT Token Sistemi (gerçek jsonwebtoken)
// ====================================================================

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

const TOKEN_SECRET = process.env.JWT_SECRET || 'gunubirlik_is_platformu_secret_2024_please_change_in_production'
const TOKEN_EXPIRY_HOURS = 24 * 7 // 7 gün

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, TOKEN_SECRET, {
    expiresIn: TOKEN_EXPIRY_HOURS * 3600, // saniye cinsinden
    issuer: 'gunubirlik-is-bul',
    audience: 'gunubirlik-users',
  } as jwt.SignOptions)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, TOKEN_SECRET, {
      issuer: 'gunubirlik-is-bul',
      audience: 'gunubirlik-users',
    }) as JWTPayload
    return decoded
  } catch {
    return null
  }
}

// ====================================================================
// Password Hashing (gerçek bcrypt)
// ====================================================================

const BCRYPT_ROUNDS = 12

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS)
}

export function verifyPassword(password: string, hashed: string): boolean {
  // Eski SHA-256 formatını destekle (migrasyon için)
  if (hashed.length === 64 && !hashed.startsWith('$2')) {
    const oldHash = crypto
      .createHash('sha256')
      .update(password + 'gunubirlik_salt_2024')
      .digest('hex')
    return oldHash === hashed
  }
  return bcrypt.compareSync(password, hashed)
}

// ====================================================================
// Auth Helper - Request'ten kullanıcıyı çıkarır
// ====================================================================

export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get('authorization')
  let token: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    const cookieToken = req.cookies.get('auth_token')?.value
    if (cookieToken) token = cookieToken
  }

  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(req: NextRequest): Promise<{ user: JWTPayload | null; error?: NextResponse }> {
  const user = await getAuthUser(req)
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'Yetkisiz erişim. Lütfen giriş yapın.' },
        { status: 401 }
      ),
    }
  }
  return { user }
}

export async function requireRole(
  req: NextRequest,
  roles: string[]
): Promise<{ user: JWTPayload | null; error?: NextResponse }> {
  const { user, error } = await requireAuth(req)
  if (error || !user) return { user: null, error }
  if (!roles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'Bu işlem için yetkiniz yok.' },
        { status: 403 }
      ),
    }
  }
  return { user }
}

// ====================================================================
// API Response Helpers
// ====================================================================

export function ok(data: any, message?: string) {
  return NextResponse.json({ success: true, data, message })
}

export function fail(error: string, status = 400, details?: any) {
  return NextResponse.json({ success: false, error, details }, { status })
}

export function paginate(items: any[], page: number, pageSize: number, total: number) {
  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      hasNext: page * pageSize < total,
      hasPrev: page > 1,
    },
  }
}

// ====================================================================
// Geolocation Helper - Haversine Formülü
// ====================================================================

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ====================================================================
// Validation Helpers
// ====================================================================

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePhone(phone: string): boolean {
  return /^(\+90|0)?5\d{9}$/.test(phone.replace(/\s/g, ''))
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// ====================================================================
// Bildirim Helper - DB'ye kaydeder, WS ile anlık iletir, OneSignal push atar
// ====================================================================
//
// 3 kanal:
//   1. DB              → "Bildirimler" sayfasında görünecek (in-app)
//   2. WebSocket       → Online kullanıcılara anlık toast/push (real-time)
//   3. OneSignal Push  → Offline kullanıcılara native push (mobile + web push)
//
// OneSignal REST_API_KEY yoksa sessizce atlar (sadece DB + WS çalışır).
// WebSocket server (port 3004) kapalıysa sessizce atlar (sadece DB + Push çalışır).
// ====================================================================

// WebSocket server URL — Next.js API'den internal HTTP çağrısı yapar
// Not: Socket.io port 3004, internal HTTP API port 3005 (aynı process, ayrı server)
const WS_INTERNAL_URL = process.env.WS_INTERNAL_URL || 'http://localhost:3005'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'gunubirlik_internal_2024'

export async function createNotification(params: {
  userId: string
  type: string
  title: string
  body: string
  data?: any
}) {
  // 0. Kullanıcının bildirim ayarını kontrol et
  try {
    const { notificationSettingsService } = await import('@/server/services/notification-settings.service')
    const isEnabled = await notificationSettingsService.isNotificationEnabled(params.userId, params.type)
    if (!isEnabled) {
      // Bildirim kapalı — DB'ye de kaydetme, push da gönderme
      return null
    }
  } catch {
    // Ayar kontrolü hatası — bildirimi yine de gönder
  }

  // 1. DB'ye bildirim kaydet
  const notification = await (await import('@/lib/db')).db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data ? JSON.stringify(params.data) : null,
    },
  })

  // 2. WebSocket ile anlık ilet (online kullanıcılara toast/push)
  //    WS server kapalıysa veya kullanıcı offline ise sessizce atlar
  sendWebSocketNotification({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: { ...params.data, notificationId: notification.id },
  }).catch(() => {})

  // 3. OneSignal native push gönder (offline kullanıcılara cihaz bildirimi)
  //    REST API key yoksa sessizce atlar
  sendOneSignalPushSafe({
    userId: params.userId,
    title: params.title,
    message: params.body,
    data: { ...params.data, notificationId: notification.id, type: params.type },
  }).catch(() => {})

  return notification
}

/**
 * WebSocket server'a internal HTTP POST yapar.
 * WS server online kullanıcıya notification:new event'ini emit eder.
 * Offline kullanıcı için sessizce atlar (DB'ye zaten kaydedildi).
 */
async function sendWebSocketNotification(params: {
  userId: string
  type: string
  title: string
  body: string
  data?: any
}) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000) // 3 sn timeout

    const res = await fetch(`${WS_INTERNAL_URL}/internal/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data || {},
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (res.ok) {
      const result = await res.json()
      if (result.online && result.delivered > 0) {
        console.log(`[WS] Bildirim anlık iletildi → ${params.userId} (${result.delivered} socket)`)
      }
      // Online değilse sessiz — DB'ye zaten kaydedildi, kullanıcı giriş yapınca görecek
    }
  } catch (e: any) {
    // WS server kapalı olabilir — kritik değil, DB'ye kaydedildi zaten
    if (e?.name !== 'AbortError' && e?.code !== 'ECONNREFUSED') {
      console.error('[WS] Internal notify hatası:', e?.message || e)
    }
  }
}

/**
 * Bildirim türüne göre mobil deep link oluştur
 *
 * URL scheme: gunubirlik://
 * Mobil uygulama app.config.js'de bu scheme'ı tanımlar
 * Expo Linking ile parse edip doğru ekrana gider
 *
 * Örnekler:
 *   gunubirlik://notifications                → Bildirimler ekranı
 *   gunubirlik://messages                     → Mesajlar listesi
 *   gunubirlik://messages/conv_123            → Belirli konuşma
 *   gunubirlik://applications                 → Başvurularım
 *   gunubirlik://applications/app_123         → Belirli başvuru
 *   gunubirlik://jobs/job_123                 → İlan detayı
 *   gunubirlik://wallet                       → Cüzdan
 *   gunubirlik://verification                 → Doğrulama durumu
 */
function buildDeepLink(data: any, type: string): string {
  const BASE = 'gunubirlik://'

  // Tip'e göre ana ekran
  const screenByType: Record<string, string> = {
    // İş başvuru
    JOB_APPLIED: 'applications',
    APPLICATION_ACCEPTED: 'applications',
    APPLICATION_REJECTED: 'applications',
    APPLICATION_WITHDRAWN: 'applications',
    WORK_STARTED: 'applications',
    WORK_COMPLETED: 'applications',

    // Mesaj
    NEW_MESSAGE: 'messages',

    // Cüzdan / ödeme
    PAYMENT_PENDING: 'wallet',
    PAYMENT_APPROVED: 'wallet',
    PAYMENT_REJECTED: 'wallet',
    PAYMENT_DISPUTE_RESOLVED: 'wallet',
    WALLET_DEPOSIT: 'wallet',
    WALLET_WITHDRAW_PENDING: 'wallet',
    WALLET_WITHDRAW_COMPLETED: 'wallet',
    WALLET_WITHDRAW_REJECTED: 'wallet',
    WALLET_TRANSFER_RECEIVED: 'wallet',
    WALLET_QR_PAYMENT_SENT: 'wallet',
    WALLET_QR_PAYMENT_RECEIVED: 'wallet',

    // İş
    JOB_REMINDER: 'jobs',
    JOB_NEARBY: 'jobs',
    JOB_PENDING_APPROVAL: 'jobs',
    JOB_APPROVED: 'jobs',
    JOB_REJECTED: 'jobs',

    // Hesap
    ACCOUNT_SUSPENDED: 'profile',
    ACCOUNT_WARNING: 'profile',
    ACCOUNT_REACTIVATED: 'profile',
    VERIFICATION_APPROVED: 'verification',
    VERIFICATION_REJECTED: 'verification',
    VERIFICATION_REQUEST: 'verification',

    // Sistem
    SYSTEM_UPDATE: 'notifications',
    SETTINGS_UPDATE: 'notifications',
    MAINTENANCE_ENABLED: 'notifications',
    MAINTENANCE_DISABLED: 'notifications',

    // Broadcast
    ANNOUNCEMENT: 'notifications',
    UPDATE: 'notifications',
    HOLIDAY: 'notifications',
    PROMOTION: 'notifications',
    CUSTOM: 'notifications',

    // Diğer
    ESCROW_DISPUTED: 'wallet',
    DEPOSIT_REQUEST: 'wallet',
    WITHDRAWAL_REQUEST: 'wallet',
    DEPOSIT_REJECTED: 'wallet',
  }

  const screen = screenByType[type] || 'notifications'

  // data içinde ID varsa, deep link'e parametre olarak ekle
  // Örnek: data: { applicationId: 'app_123' } → gunubirlik://applications/app_123
  if (data) {
    if (data.applicationId) return `${BASE}${screen}/${data.applicationId}`
    if (data.conversationId) return `${BASE}${screen}/${data.conversationId}`
    if (data.jobId) return `${BASE}${screen}/${data.jobId}`
    if (data.paymentId) return `${BASE}${screen}/${data.paymentId}`
    if (data.requestId && screen === 'verification') return `${BASE}${screen}/${data.requestId}`
  }

  return `${BASE}${screen}`
}

/**
 * OneSignal push gönder (server-side)
 *
 * OneSignal'a kayıtlı cihazlara native push gönderir:
 *   - Web (Chrome, Firefox, Safari) — onesignal-init.tsx ile kayıt olur
 *   - iOS — react-native-onesignal ile kayıt olur
 *   - Android — react-native-onesignal ile kayıt olur
 *
 * Kullanıcı kaydı için 2 yöntem desteklenir (ikisi de denenir):
 *   1. external_id (modern):  OneSignal.login(userId) ile set edilir
 *   2. tag (eski):            OneSignal.User.addTag('user_id', userId)
 *
 * Eğer kullanıcı hiçbir cihazdan OneSignal'a kaydolmamışsa push sessizce atlanır
 * (DB'ye zaten kaydedildi, kullanıcı uygulamayı açınca görecek).
 *
 * ONESIGNAL_REST_API_KEY env var yoksa hiç denemez.
 */
async function sendOneSignalPushSafe(params: {
  userId: string
  title: string
  message: string
  data?: any
}) {
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY
  const ONESIGNAL_APP_ID = '6bddc78e-79e7-4701-9e46-6fca772e402a'

  if (!ONESIGNAL_REST_API_KEY) {
    // API key yoksa push gönderme, sadece DB'ye kaydet
    return
  }

  try {
    // Önce external_id (modern yöntem) ile dene
    // Mobil cihazlar OneSignal.login(userId) çağırdığında external_id set olur
    const res = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        // Modern yöntem: external_id alias (OneSignal.login(userId) ile set edilir)
        include_aliases: [{ external_id: params.userId }],
        target_channel: 'push',
        headings: { en: params.title, tr: params.title },
        contents: { en: params.message, tr: params.message },
        data: params.data || {},
        // Web için tıklanınca açılacak URL
        web_url: '/',
        // Mobil için deep link — uygulama otomatik açılır
        // URL scheme: gunubirlik://  (app.config.js'de tanımlanacak)
        // Türüne göre doğru ekrana yönlendir
        app_url: buildDeepLink(params.data, params.type),
      }),
    })

    const result = await res.json() as any

    // Eğer external_id ile başarılı olduysa (recipients > 0)
    if (result.id && result.recipients > 0) {
      console.log(`[OneSignal] Push gönderildi (external_id): ${result.id} → ${params.userId} (${result.recipients} cihaz)`)
      return
    }

    // external_id ile başarısız — tag yöntemini dene (eski yöntem)
    // Web SDK tag ekliyor, mobil de ekleyebilir
    if (!result.id || result.recipients === 0) {
      const res2 = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          filters: [
            { field: 'tag', key: 'user_id', relation: '=', value: params.userId },
          ],
          headings: { en: params.title, tr: params.title },
          contents: { en: params.message, tr: params.message },
          url: '/',
          data: params.data || {},
          web_push_routing: 'web',
        }),
      })

      const result2 = await res2.json() as any
      if (result2.id && result2.recipients > 0) {
        console.log(`[OneSignal] Push gönderildi (tag): ${result2.id} → ${params.userId} (${result2.recipients} cihaz)`)
        return
      }
      // Her iki yöntem de başarısız — kullanıcı henüz hiçbir cihazdan OneSignal'a kaydolmamış
      console.warn(`[OneSignal] Push alıcı yok → user ${params.userId} (henüz OneSignal'a kayıtlı cihaz yok)`)
    }
  } catch (e) {
    console.error('[OneSignal] Push hatası:', e)
  }
}
