import { NextRequest } from 'next/server'
import { notificationSettingsService } from '@/server/services/notification-settings.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/notifications/settings/reset — Tüm ayarları varsayılana sıfırla
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const settings = await notificationSettingsService.resetToDefault(user.userId)
  return ok(settings, 'Bildirim ayarları varsayılana sıfırlandı.')
})
