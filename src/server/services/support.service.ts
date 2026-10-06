/**
 * Support Service — Şikayet, öneri, bug bildirimi
 * Broadcast Service — Toplu mail + push gönderimi
 * Account Deletion Service — Hesap silme talebi
 */
import { db } from '@/lib/db'
import { createNotification, safeJsonParse } from '@/server/lib/auth'
import { ApiError } from './auth.service'

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '6bddc78e-79e7-4701-9e46-6fca772e402a'

// ================================================================
// SUPPORT SERVICE
// ================================================================

export class SupportService {
  async createTicket(params: {
    userId: string
    category: string
    subject: string
    message: string
    priority?: string
  }) {
    const { userId, category, subject, message, priority } = params
    if (!subject || subject.trim().length < 3) throw new ApiError('Konu en az 3 karakter', 400)
    if (!message || message.trim().length < 10) throw new ApiError('Mesaj en az 10 karakter', 400)

    const ticket = await db.supportTicket.create({
      data: {
        userId,
        category: category || 'OTHER',
        subject: subject.trim(),
        message: message.trim(),
        priority: priority || 'NORMAL',
        status: 'OPEN',
      },
    })

    // Admin'lere bildirim
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', isPermanentlyBanned: false, isSuspended: false },
      select: { id: true },
    })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'SYSTEM_UPDATE',
        title: 'Yeni Destek Talebi 🎫',
        body: `${subject} (${category})`,
        data: { ticketId: ticket.id },
      })
    }

    return ticket
  }

  async listUserTickets(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      db.supportTicket.findMany({ where: { userId }, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      db.supportTicket.count({ where: { userId } }),
    ])
    return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
  }

  async listAllTickets(filters: { status?: string; category?: string; page?: number; pageSize?: number } = {}) {
    const { status = 'ALL', category, page = 1, pageSize = 20 } = filters
    const where: any = {}
    if (status !== 'ALL') where.status = status
    if (category && category !== 'ALL') where.category = category

    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      db.supportTicket.findMany({
        where, skip, take: pageSize,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
      }),
      db.supportTicket.count({ where }),
    ])
    return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
  }

  async replyTicket(params: { ticketId: string; adminId: string; reply: string }) {
    const { ticketId, adminId, reply } = params
    if (!reply || reply.trim().length < 3) throw new ApiError('Yanıt en az 3 karakter', 400)

    const ticket = await db.supportTicket.findUnique({ where: { id: ticketId } })
    if (!ticket) throw new ApiError('Talep bulunamadı', 404)

    const updated = await db.supportTicket.update({
      where: { id: ticketId },
      data: {
        adminReply: reply.trim(),
        repliedById: adminId,
        repliedAt: new Date(),
        status: 'RESOLVED',
      },
    })

    await createNotification({
      userId: ticket.userId,
      type: 'SYSTEM_UPDATE',
      title: 'Destek Talebinize Yanıt Geldi 💬',
      body: `"${ticket.subject}" talebiniz yanıtlandı.`,
      data: { ticketId },
    })

    return updated
  }

  async updateTicketStatus(ticketId: string, status: string) {
    return db.supportTicket.update({ where: { id: ticketId }, data: { status } })
  }
}

// ================================================================
// BROADCAST SERVICE — Toplu mail + push
// ================================================================

export class BroadcastService {
  async createBroadcast(params: {
    adminId: string
    title: string
    message: string
    htmlContent?: string  // opsiyonel — yoksa message'dan oluşturulur
    type: string
    target?: string
    targetUserIds?: string[]
    sendEmail?: boolean
    sendPush?: boolean
    isTemplate?: boolean
    templateName?: string
  }) {
    // htmlContent yoksa message'dan basit HTML oluştur
    const htmlContent = params.htmlContent && params.htmlContent.trim().length > 0
      ? params.htmlContent
      : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>${params.title}</h2><p>${params.message}</p><hr><p style="color:#888;font-size:12px">Bu e-posta Günübirlik İş Bul platformundan gönderilmiştir.</p></div>`

    const broadcast = await db.broadcast.create({
      data: {
        adminId: params.adminId,
        title: params.title,
        message: params.message,
        htmlContent,
        type: params.type,
        target: params.target || 'ALL',
        targetUserIds: params.targetUserIds ? JSON.stringify(params.targetUserIds) : null,
        sendEmail: params.sendEmail ?? true,
        sendPush: params.sendPush ?? true,
        isTemplate: params.isTemplate || false,
        templateName: params.templateName || null,
        status: 'DRAFT',
      },
    })
    return broadcast
  }

  async sendBroadcast(broadcastId: string): Promise<{ sentCount: number; channels: { db: number; ws: number; push: number; email: number } }> {
    const broadcast = await db.broadcast.findUnique({ where: { id: broadcastId } })
    if (!broadcast) throw new ApiError('Broadcast bulunamadı', 404)
    if (broadcast.status === 'SENT') throw new ApiError('Zaten gönderildi', 400)

    // Hedef kullanıcıları belirle
    let users: any[] = []
    if (broadcast.target === 'ALL') {
      users = await db.user.findMany({ where: { isPermanentlyBanned: false, isSuspended: false }, select: { id: true, email: true, fullName: true } })
    } else if (broadcast.target === 'WORKERS') {
      users = await db.user.findMany({ where: { role: 'WORKER', isPermanentlyBanned: false }, select: { id: true, email: true, fullName: true } })
    } else if (broadcast.target === 'EMPLOYERS') {
      users = await db.user.findMany({ where: { role: 'EMPLOYER', isPermanentlyBanned: false }, select: { id: true, email: true, fullName: true } })
    } else if (broadcast.target === 'SPECIFIC' && broadcast.targetUserIds) {
      const ids = safeJsonParse(broadcast.targetUserIds, [])
      users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, fullName: true } })
    }

    const channels = { db: 0, ws: 0, push: 0, email: 0 }

    // 1. DB + WebSocket + OneSignal Push (createNotification hepsini yapar)
    //    Her kullanıcı için ayrı try/catch — biri başarısız olursa diğerleri devam eder
    if (broadcast.sendPush) {
      for (const user of users) {
        try {
          await createNotification({
            userId: user.id,
            type: broadcast.type,
            title: broadcast.title,
            body: broadcast.message,
            data: { broadcastId },
          })
          channels.db++
        } catch (e: any) {
          console.error(`[Broadcast] createNotification hatası (user ${user.id}):`, e?.message || e)
          // Devam et — diğer kullanıcılara gönder
        }
      }
    }

    // 2. Supabase Realtime toplu broadcast — online kullanıcılara anlık toast
    try {
      const { broadcastToAll } = await import('@/server/lib/realtime')
      await broadcastToAll('notification:new', {
        type: broadcast.type,
        title: broadcast.title,
        body: broadcast.message,
        data: { broadcastId },
      })
      channels.ws = users.length
      console.log(`[Broadcast] Supabase Realtime yayını tamamlandı (${users.length} alıcı)`)
    } catch (e: any) {
      console.warn(`[Broadcast] Realtime yayını hatası: ${e?.message || e}`)
    }

    // 3. Email gönder — OneSignal Email API ile
    //    OneSignal Email aktive edilmemişse 400 hatası döner — ama bizim için kritik değil
    if (broadcast.sendEmail && users.length > 0) {
      const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || ''
      if (ONESIGNAL_REST_API_KEY) {
        try {
          const authHeader = (ONESIGNAL_REST_API_KEY.startsWith('os_v2_') ? 'Key ' : 'Bearer ') + ONESIGNAL_REST_API_KEY
          // Tüm geçerli e-postaları topla
          const emails = users.filter((u) => u.email).map((u) => u.email)

          if (emails.length === 0) {
            console.warn('[Broadcast] Email gönderilemedi — hiç geçerli e-posta yok')
          } else {
            // Batch halinde gönder (OneSignal limit: 2000 alıcı/istek)
            for (let i = 0; i < emails.length; i += 100) {
              const batch = emails.slice(i, i + 100)
              try {
                const res = await fetch('https://onesignal.com/api/v1/notifications', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                  },
                  body: JSON.stringify({
                    app_id: ONESIGNAL_APP_ID,
                    include_email_tokens: batch,
                    email_subject: broadcast.title,
                    email_body: broadcast.htmlContent || `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><h2>${broadcast.title}</h2><div>${broadcast.message}</div><hr><p style="color:#888;font-size:12px">Bu e-posta Günübirlik İş Bul platformundan gönderilmiştir.</p></div>`,
                    email_from_name: 'Günübirlik İş Bul',
                    email_from_address: 'noreply@gunubirlik.com',
                    email_reply_to_address: 'destek@gunubirlik.com',
                  }),
                })

                const result = await res.json() as any
                if (result.id) {
                  channels.email += batch.length
                  console.log(`[Broadcast] OneSignal Email batch ${Math.floor(i / 100) + 1}: ${batch.length} alıcıya gönderildi (id: ${result.id})`)
                } else {
                  // OneSignal email aktive edilmemiş olabilir — uyarı ver ama devam et
                  console.warn(`[Broadcast] OneSignal Email batch hatası:`, result.errors || result.error || result)
                  // İlk batch hatasıysa, sonraki batch'leri atla (muhtemelen hepsi aynı hatayı verir)
                  if (i === 0) {
                    console.warn('[Broadcast] OneSignal Email muhtemelen aktive edilmemiş — email kanalı atlanıyor')
                    console.warn('[Broadcast] OneSignal Dashboard → Email → Activate gerekli')
                    break
                  }
                }
              } catch (batchErr: any) {
                console.error(`[Broadcast] Email batch ${Math.floor(i / 100) + 1} exception:`, batchErr?.message || batchErr)
                // Devam et — diğer batch'ler denenebilir
              }
            }
            console.log(`[Broadcast] Email toplam: ${channels.email}/${emails.length} alıcı`)
          }
        } catch (e: any) {
          console.error('[Broadcast] Email hatası (devam ediliyor):', e?.message || e)
          // Email hatası tüm broadcast'i bozmamalı — DB ve push zaten gönderildi
        }
      } else {
        console.warn('[Broadcast] ONESIGNAL_REST_API_KEY yok — email atlandı')
      }
    }

    // 4. OneSignal Push istatistik (createNotification içinde gönderilir, ama log için)
    channels.push = broadcast.sendPush ? channels.db : 0

    // Broadcast'i SENT yap
    await db.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'SENT', sentAt: new Date(), sentCount: channels.db },
    })

    console.log(`[Broadcast] Tamamlandı:`, channels)
    return { sentCount: channels.db, channels }
  }

  async listBroadcasts(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      db.broadcast.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' }, include: { admin: { select: { fullName: true } } } }),
      db.broadcast.count(),
    ])
    return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
  }

  async listTemplates() {
    return db.broadcast.findMany({ where: { isTemplate: true }, orderBy: { createdAt: 'desc' } })
  }
}

// ================================================================
// ACCOUNT DELETION SERVICE
// ================================================================

export class AccountDeletionService {
  async requestDeletion(params: { userId: string; reason: string; feedback?: string }) {
    const { userId, reason, feedback } = params
    if (!reason || reason.trim().length < 3) throw new ApiError('Sebep gerekli', 400)

    // Mevcut talep var mı kontrol
    const existing = await db.accountDeletion.findUnique({ where: { userId } })
    if (existing && existing.status === 'PENDING') {
      throw new ApiError('Zaten bekleyen bir silme talebiniz var.', 400)
    }

    // Upsert (eski talep varsa güncelle)
    const deletion = await db.accountDeletion.upsert({
      where: { userId },
      update: { reason: reason.trim(), feedback: feedback?.trim(), status: 'PENDING', reviewedAt: null, reviewNote: null },
      create: { userId, reason: reason.trim(), feedback: feedback?.trim(), status: 'PENDING' },
    })

    // Admin'lere bildirim
    const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'SYSTEM_UPDATE',
        title: 'Hesap Silme Talebi 🗑️',
        body: `Kullanıcı hesabını silmek istiyor: ${reason.substring(0, 50)}`,
        data: { deletionId: deletion.id },
      })
    }

    return deletion
  }

  async getDeletionStatus(userId: string) {
    return db.accountDeletion.findUnique({ where: { userId } })
  }

  async approveDeletion(params: { deletionId: string; adminId: string }) {
    const { deletionId, adminId } = params
    const deletion = await db.accountDeletion.findUnique({ where: { id: deletionId } })
    if (!deletion) throw new ApiError('Talep bulunamadı', 404)
    if (deletion.status !== 'PENDING') throw new ApiError('Zaten işlenmiş', 400)

    // Kullanıcıyı sil (cascade)
    await db.user.delete({ where: { id: deletion.userId } })

    await db.accountDeletion.update({
      where: { id: deletionId },
      data: { status: 'COMPLETED', reviewedById: adminId, reviewedAt: new Date(), deletedAt: new Date() },
    })

    return { deleted: true }
  }

  async rejectDeletion(params: { deletionId: string; adminId: string; note: string }) {
    const { deletionId, adminId, note } = params
    const deletion = await db.accountDeletion.findUnique({ where: { id: deletionId } })
    if (!deletion) throw new ApiError('Talep bulunamadı', 404)

    const updated = await db.accountDeletion.update({
      where: { id: deletionId },
      data: { status: 'REJECTED', reviewedById: adminId, reviewedAt: new Date(), reviewNote: note },
    })

    await createNotification({
      userId: deletion.userId,
      type: 'SYSTEM_UPDATE',
      title: 'Hesap Silme Talebi Reddedildi',
      body: `Hesap silme talebiniz reddedildi. Sebep: ${note}`,
    })

    return updated
  }

  async listAllDeletions(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      db.accountDeletion.findMany({
        skip, take: pageSize, orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, fullName: true, email: true, avatarUrl: true } } },
      }),
      db.accountDeletion.count(),
    ])
    return { items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } }
  }
}

export const supportService = new SupportService()
export const broadcastService = new BroadcastService()
export const accountDeletionService = new AccountDeletionService()
