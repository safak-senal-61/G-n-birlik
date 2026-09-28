import { NextRequest } from 'next/server'
import { notificationsService } from '@/server/services/notifications.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getBooleanParam, getNumberParam } from '@/server/lib/route'

// GET /api/v1/notifications - Bildirim listesi
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const onlyUnread = getBooleanParam(req, 'unread', false)
  const page = getNumberParam(req, 'page', 1)!
  const pageSize = getNumberParam(req, 'pageSize', 20)!

  const result = await notificationsService.list(user.userId, onlyUnread, page, pageSize)
  return ok(result)
})
