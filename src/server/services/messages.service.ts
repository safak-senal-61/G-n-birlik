/**
 * Messages Service - Mesajlaşma işlemleri
 * Sohbet listesi, mesaj gönderme, okundu işaretleme
 * WebSocket ile entegre çalışır (server events)
 */
import { db } from '@/lib/db'
import { createNotification, safeJsonParse } from '@/server/lib/auth'
import { ApiError } from './auth.service'

export interface SendMessageDTO {
  conversationId?: string
  recipientId?: string
  jobId?: string
  applicationId?: string
  content: string
  type?: 'TEXT' | 'IMAGE' | 'LOCATION' | 'SYSTEM'
  metadata?: any
}

export class MessagesService {
  /**
   * Konuşma oluştur veya var olanı getir
   */
  async ensureConversation(params: {
    userId: string
    recipientId: string
    jobId?: string
    applicationId?: string
  }): Promise<string> {
    if (params.userId === params.recipientId) {
      throw new ApiError('Kendinize mesaj gönderemezsiniz.', 400)
    }

    // Aynı kullanıcı çifti ve iş için konuşma var mı kontrol et
    if (params.jobId) {
      const existing = await db.conversation.findFirst({
        where: { jobId: params.jobId, type: 'DIRECT' },
        include: { participants: true },
      })
      if (existing) {
        const isParticipant = existing.participants.some(
          (p) => p.userId === params.userId
        )
        if (isParticipant) return existing.id
      }
    } else {
      // Direct conversation without job
      const conversations = await db.conversation.findMany({
        where: { type: 'DIRECT', jobId: null },
        include: { participants: true },
      })
      for (const c of conversations) {
        const userIds = c.participants.map((p) => p.userId)
        if (userIds.includes(params.userId) && userIds.includes(params.recipientId)) {
          return c.id
        }
      }
    }

    // Yeni konuşma oluştur
    const conversation = await db.conversation.create({
      data: {
        jobId: params.jobId,
        applicationId: params.applicationId,
        type: 'DIRECT',
        participants: {
          create: [
            { userId: params.userId },
            { userId: params.recipientId },
          ],
        },
      },
    })

    return conversation.id
  }

  async sendMessage(senderId: string, dto: SendMessageDTO) {
    if (!dto.content?.trim()) {
      throw new ApiError('Mesaj boş olamaz.', 400)
    }

    let conversationId = dto.conversationId

    if (!conversationId && dto.recipientId) {
      conversationId = await this.ensureConversation({
        userId: senderId,
        recipientId: dto.recipientId,
        jobId: dto.jobId,
        applicationId: dto.applicationId,
      })
    }

    if (!conversationId) {
      throw new ApiError('Konuşma ID veya alıcı ID gerekli.', 400)
    }

    // Katılımcı mı?
    const participant = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: senderId },
      },
    })
    if (!participant) {
      throw new ApiError('Bu konuşmaya mesaj gönderme yetkiniz yok.', 403)
    }

    const message = await db.message.create({
      data: {
        conversationId,
        senderId,
        content: dto.content,
        type: dto.type || 'TEXT',
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
      },
      include: {
        sender: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    })

    // Konuşma updatedAt güncelle
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Alıcıya bildirim
    const otherParticipants = await db.conversationParticipant.findMany({
      where: { conversationId, userId: { not: senderId } },
    })
    for (const p of otherParticipants) {
      await createNotification({
        userId: p.userId,
        type: 'NEW_MESSAGE',
        title: 'Yeni Mesaj',
        body: `${message.sender.fullName}: ${dto.content.substring(0, 60)}${dto.content.length > 60 ? '...' : ''}`,
        data: { conversationId, messageId: message.id, senderId },
      })
    }

    return this.transformMessage(message)
  }

  async listConversations(userId: string) {
    const conversations = await db.conversation.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                role: true,
                companyName: true,
                isVerified: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, fullName: true } },
          },
        },
        job: {
          select: { id: true, title: true, workDate: true, city: true, district: true },
        },
        _count: {
          select: {
            messages: { where: { senderId: { not: userId } } },
          },
        },
      },
    })

    // Okunmamış sayısı
    const withUnread = await Promise.all(
      conversations.map(async (c) => {
        const myParticipant = c.participants.find((p) => p.userId === userId)
        const lastReadAt = myParticipant?.lastReadAt || new Date(0)

        const unreadCount = await db.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: userId },
            createdAt: { gt: lastReadAt },
          },
        })

        const otherParticipant = c.participants.find((p) => p.userId !== userId)

        return {
          id: c.id,
          type: c.type,
          job: c.job,
          participant: otherParticipant?.user || null,
          lastMessage: c.messages[0] ? this.transformMessage(c.messages[0]) : null,
          unreadCount,
          updatedAt: c.updatedAt,
        }
      })
    )

    return withUnread
  }

  async getMessages(conversationId: string, userId: string, page = 1, pageSize = 50) {
    const participant = await db.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    })
    if (!participant) {
      throw new ApiError('Bu konuşmaya erişim yetkiniz yok.', 403)
    }

    const skip = (page - 1) * pageSize
    const [messages, total] = await Promise.all([
      db.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          sender: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      }),
      db.message.count({ where: { conversationId } }),
    ])

    // Okundu işaretle
    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    })

    return {
      items: messages.reverse().map((m) => this.transformMessage(m)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  async markAsRead(conversationId: string, userId: string) {
    await db.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    })
    return { conversationId, readAt: new Date() }
  }

  private transformMessage(msg: any) {
    return {
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      sender: msg.sender,
      content: msg.content,
      type: msg.type,
      metadata: msg.metadata ? safeJsonParse(msg.metadata, null) : null,
      createdAt: msg.createdAt,
    }
  }
}

export const messagesService = new MessagesService()
