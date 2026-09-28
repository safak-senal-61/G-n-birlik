/**
 * Admin Settings API
 * GET /api/v1/admin/settings - Mevcut ayarları getir
 * PUT /api/v1/admin/settings - Bakım modu + iletişim bilgilerini güncelle
 *
 * Sadece ADMIN rolü erişebilir.
 */
import { NextRequest } from 'next/server'
import {
  getSiteSettings,
  updateMaintenanceSettings,
} from '@/server/services/maintenance.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// GET - Mevcut ayarları getir
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const settings = await getSiteSettings(true)
  return ok(settings)
})

// PUT - Ayarları güncelle
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const clientInfo = getClientInfo(req)

  // maintenanceEndTime: ISO string veya null
  let endTime: Date | null | undefined = undefined
  if (body.maintenanceEndTime !== undefined) {
    if (body.maintenanceEndTime === null || body.maintenanceEndTime === '') {
      endTime = null
    } else {
      const d = new Date(body.maintenanceEndTime)
      if (isNaN(d.getTime())) {
        return fail('Geçersiz maintenanceEndTime formatı. ISO 8601 kullanın.', 400)
      }
      endTime = d
    }
  }

  const updated = await updateMaintenanceSettings({
    adminId: user.userId,
    maintenanceMode: body.maintenanceMode,
    maintenanceTitle: body.maintenanceTitle,
    maintenanceMessage: body.maintenanceMessage,
    maintenanceEndTime: endTime,
    contactEmail: body.contactEmail,
    contactPhone: body.contactPhone,
    contactWhatsapp: body.contactWhatsapp,
    contactInstagram: body.contactInstagram,
    contactTwitter: body.contactTwitter,
    contactWebsite: body.contactWebsite,
    siteName: body.siteName,
  })

  return ok(updated, 'Site ayarları güncellendi.')
})
