/**
 * Maintenance Service - Bakım modu yönetimi
 *
 * Bakım modu açıkken:
 *  - Normal kullanıcılar ana sayfada bakım ekranı görür
 *  - Tüm API istekleri (auth/maintenance/admin/api-doc hariç) 503 döner
 *  - Admin kullanıcıları her şeye erişebilir
 *
 * Tek satır SiteSettings kaydı kullanılır (id="singleton").
 */
import { db } from '@/lib/db'

const SINGLETON_ID = 'singleton'

// Cache (5 saniye) - her istekte DB'ye gitmemek için
let cachedSettings: any = null
let cacheTs = 0
const CACHE_TTL = 5 * 1000 // 5 saniye

export interface MaintenanceStatus {
  maintenanceMode: boolean
  maintenanceTitle: string
  maintenanceMessage: string
  maintenanceEndTime: Date | null
  maintenanceStartedAt: Date | null
  contactEmail: string | null
  contactPhone: string | null
  contactWhatsapp: string | null
  contactInstagram: string | null
  contactTwitter: string | null
  contactWebsite: string | null
  siteName: string
}

/**
 * Singleton SiteSettings kaydını getir (yoksa oluştur)
 */
export async function getSiteSettings(forceRefresh = false): Promise<MaintenanceStatus> {
  // Cache kontrolü
  if (!forceRefresh && cachedSettings && Date.now() - cacheTs < CACHE_TTL) {
    return cachedSettings
  }

  // DB'den getir, yoksa oluştur
  let settings = await db.siteSettings.findUnique({ where: { id: SINGLETON_ID } })
  if (!settings) {
    settings = await db.siteSettings.create({ data: { id: SINGLETON_ID } })
  }

  cachedSettings = settings
  cacheTs = Date.now()
  return settings
}

/**
 * Sadece bakım modu durumunu getir (hafif)
 */
export async function getMaintenanceStatus(): Promise<{
  maintenanceMode: boolean
  maintenanceTitle: string
  maintenanceMessage: string
  maintenanceEndTime: Date | null
  maintenanceStartedAt: Date | null
}> {
  const s = await getSiteSettings()
  return {
    maintenanceMode: s.maintenanceMode,
    maintenanceTitle: s.maintenanceTitle,
    maintenanceMessage: s.maintenanceMessage,
    maintenanceEndTime: s.maintenanceEndTime,
    maintenanceStartedAt: s.maintenanceStartedAt,
  }
}

/**
 * Herkese açık bakım durumu (iletişim bilgileri dahil)
 */
export async function getPublicMaintenanceStatus(): Promise<MaintenanceStatus> {
  return getSiteSettings()
}

/**
 * Bakım modunu güncelle (admin)
 */
export async function updateMaintenanceSettings(params: {
  adminId: string
  maintenanceMode?: boolean
  maintenanceTitle?: string
  maintenanceMessage?: string
  maintenanceEndTime?: Date | null
  contactEmail?: string | null
  contactPhone?: string | null
  contactWhatsapp?: string | null
  contactInstagram?: string | null
  contactTwitter?: string | null
  contactWebsite?: string | null
  siteName?: string
}): Promise<MaintenanceStatus> {
  const {
    adminId,
    maintenanceMode,
    maintenanceTitle,
    maintenanceMessage,
    maintenanceEndTime,
    contactEmail,
    contactPhone,
    contactWhatsapp,
    contactInstagram,
    contactTwitter,
    contactWebsite,
    siteName,
  } = params

  const current = await getSiteSettings(true)
  const now = new Date()

  // Bakım modu açılıyorsa startedAt set et, kapanıyorsa temizle
  let startedAt = current.maintenanceStartedAt
  if (maintenanceMode === true && !current.maintenanceMode) {
    startedAt = now
  } else if (maintenanceMode === false) {
    startedAt = null
  }

  const updated = await db.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    update: {
      ...(maintenanceMode !== undefined && { maintenanceMode }),
      ...(maintenanceTitle !== undefined && { maintenanceTitle }),
      ...(maintenanceMessage !== undefined && { maintenanceMessage }),
      ...(maintenanceEndTime !== undefined && { maintenanceEndTime }),
      maintenanceStartedAt: startedAt,
      maintenanceUpdatedById: adminId,
      ...(contactEmail !== undefined && { contactEmail }),
      ...(contactPhone !== undefined && { contactPhone }),
      ...(contactWhatsapp !== undefined && { contactWhatsapp }),
      ...(contactInstagram !== undefined && { contactInstagram }),
      ...(contactTwitter !== undefined && { contactTwitter }),
      ...(contactWebsite !== undefined && { contactWebsite }),
      ...(siteName !== undefined && { siteName }),
    },
    create: {
      id: SINGLETON_ID,
      maintenanceMode: maintenanceMode ?? false,
      maintenanceTitle: maintenanceTitle ?? 'Bakım Çalışması Devam Ediyor',
      maintenanceMessage: maintenanceMessage ?? 'Daha iyi bir deneyim için güncelliyoruz.',
      maintenanceEndTime,
      maintenanceStartedAt: startedAt,
      maintenanceUpdatedById: adminId,
      contactEmail,
      contactPhone,
      contactWhatsapp,
      contactInstagram,
      contactTwitter,
      contactWebsite,
      siteName: siteName ?? 'Günübirlik İş Bul',
    },
  })

  // Cache'i temizle
  cachedSettings = null
  cacheTs = 0

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: adminId,
      action: maintenanceMode === true ? 'MAINTENANCE_ENABLED' : maintenanceMode === false ? 'MAINTENANCE_DISABLED' : 'SETTINGS_UPDATE',
      targetType: 'SETTINGS',
      targetId: SINGLETON_ID,
      metadata: JSON.stringify({
        maintenanceMode: updated.maintenanceMode,
        title: updated.maintenanceTitle,
        endTime: updated.maintenanceEndTime,
      }),
    },
  })

  return updated
}

/**
 * Verilen yol bakım modundan muaf mi?
 * (auth, maintenance, admin, api-doc, health endpoint'leri her zaman açık)
 */
export function isMaintenanceExemptPath(pathname: string): boolean {
  const exemptPatterns = [
    '/api/v1/auth/login',        // admin giriş yapabilmeli
    '/api/v1/auth/logout',
    '/api/v1/auth/me',
    '/api/v1/maintenance',       // bakım durumu herkese açık
    '/api/v1/admin',             // admin tüm endpoint'lere erişebilmeli
    '/api/v1/health',
    '/api-doc',
    '/admin',                    // admin panel sayfası
    '/_next',                    // Next.js statik dosyaları
    '/favicon',
    '/logo',
  ]

  return exemptPatterns.some((p) => pathname.startsWith(p))
}

/**
 * Verilen token admin mi kontrol et
 */
export async function isAdminToken(req: Request): Promise<boolean> {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) return false
    const token = authHeader.substring(7)
    // JWT verify et
    const { verifyToken } = await import('@/server/lib/auth')
    const payload = verifyToken(token)
    return payload?.role === 'ADMIN'
  } catch {
    return false
  }
}
