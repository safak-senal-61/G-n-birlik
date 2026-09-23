/**
 * Notifications Service - Bildirim işlemleri
 */
import { db } from '@/lib/db'
import { safeJsonParse } from '@/server/lib/auth'
import { ApiError } from './auth.service'

export class NotificationsService {
  async list(userId: string, onlyUnread = false, page = 1, pageSize = 20) {
    const where: any = { userId }
    if (onlyUnread) where.isRead = false

    const skip = (page - 1) * pageSize
    const [items, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId, isRead: false } }),
    ])

    return {
      items: items.map((n) => ({
        ...n,
        data: n.data ? safeJsonParse(n.data, null) : null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      unreadCount,
    }
  }

  async markAsRead(id: string, userId: string) {
    const notif = await db.notification.findUnique({ where: { id } })
    if (!notif) throw new ApiError('Bildirim bulunamadı.', 404)
    if (notif.userId !== userId) throw new ApiError('Yetkisiz işlem.', 403)

    return db.notification.update({ where: { id }, data: { isRead: true } })
  }

  async markAllAsRead(userId: string) {
    const result = await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    })
    return { updated: result.count }
  }

  async delete(id: string, userId: string) {
    const notif = await db.notification.findUnique({ where: { id } })
    if (!notif) throw new ApiError('Bildirim bulunamadı.', 404)
    if (notif.userId !== userId) throw new ApiError('Yetkisiz işlem.', 403)

    await db.notification.delete({ where: { id } })
    return { id }
  }
}

export const notificationsService = new NotificationsService()
