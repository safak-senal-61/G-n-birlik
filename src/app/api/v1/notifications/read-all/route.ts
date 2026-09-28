import { NextRequest } from 'next/server'
import { notificationsService } from '@/server/services/notifications.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/notifications/read-all - Tüm bildirimleri okundu işaretle
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const result = await notificationsService.markAllAsRead(user.userId)
  return ok(result, `${result.updated} bildirim okundu olarak işaretlendi.`)
})
