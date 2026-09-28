import { NextRequest } from 'next/server'
import { notificationsService } from '@/server/services/notifications.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// PUT /api/v1/notifications/[id] - Bildirimi okundu işaretle
export const PUT = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const notif = await notificationsService.markAsRead(id, user.userId)
  return ok(notif)
})

// DELETE /api/v1/notifications/[id]
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  await notificationsService.delete(id, user.userId)
  return ok({ id }, 'Bildirim silindi.')
})
