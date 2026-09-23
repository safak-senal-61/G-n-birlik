/**
 * Günübirlik İş Bulma - Gerçek Zamanlı Servis
 *
 * Socket.io kullanarak:
 *  - Mesajlaşma (gerçek zamanlı chat)
 *  - Bildirimler (anlık push)
 *  - Online status
 *  - Yazıyor... göstergesi
 *  - Okundu işareti
 *
 * Mobil uygulama doğrudan bu servise bağlanır:
 *   io("/?XTransformPort=3004", { auth: { token: "JWT_TOKEN" } })
 *
 * GÜVENLİK: Gerçek jsonwebtoken ile JWT doğrulaması yapar
 */
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

const PORT = 3004
const TOKEN_SECRET = process.env.JWT_SECRET || 'gunubirlik_is_platformu_secret_2024_please_change_in_production'

// ============================================================
// Token Doğrulama (gerçek jsonwebtoken)
// ============================================================
interface UserPayload {
  userId: string
  email: string
  role: string
  exp: number
}

function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, TOKEN_SECRET, {
      issuer: 'gunubirlik-is-bul',
      audience: 'gunubirlik-users',
    }) as UserPayload
    return decoded
  } catch {
    return null
  }
}

// ============================================================
// Online kullanıcı yönetimi
// ============================================================
interface OnlineUser {
  userId: string
  email: string
  role: string
  socketIds: Set<string>
  lastActiveAt: number
}

const onlineUsers = new Map<string, OnlineUser>()
const socketToUser = new Map<string, string>() // socketId -> userId
const userRooms = new Map<string, Set<string>>() // userId -> Set of conversationIds

function emitUserStatus(userId: string) {
  const user = onlineUsers.get(userId)
  io.emit('user:status', {
    userId,
    isOnline: !!user,
    lastActiveAt: user?.lastActiveAt || Date.now(),
  })
}

// ============================================================
// Socket.io Server
// ============================================================
const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Auth middleware
io.use((socket: Socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token
  if (!token) {
    return next(new Error('Token gerekli'))
  }
  const payload = verifyToken(token as string)
  if (!payload) {
    return next(new Error('Geçersiz veya süresi dolmuş token'))
  }
  ;(socket as any).user = payload
  next()
})

io.on('connection', (socket: Socket) => {
  const user = (socket as any).user as UserPayload
  console.log(`[+] ${user.email} bağlandı (${socket.id})`)

  // Online listesine ekle
  if (!onlineUsers.has(user.userId)) {
    onlineUsers.set(user.userId, {
      userId: user.userId,
      email: user.email,
      role: user.role,
      socketIds: new Set(),
      lastActiveAt: Date.now(),
    })
    emitUserStatus(user.userId)
  }
  onlineUsers.get(user.userId)!.socketIds.add(socket.id)
  socketToUser.set(socket.id, user.userId)

  socket.emit('connected', {
    userId: user.userId,
    serverTime: Date.now(),
    onlineCount: onlineUsers.size,
  })

  // ============================================================
  // Konuşma odasına katıl
  // ============================================================
  socket.on('conversation:join', (data: { conversationId: string }) => {
    const { conversationId } = data
    if (!conversationId) return
    socket.join(`conv:${conversationId}`)
    if (!userRooms.has(user.userId)) userRooms.set(user.userId, new Set())
    userRooms.get(user.userId)!.add(conversationId)
    console.log(`[JOIN] ${user.email} → conv:${conversationId}`)
  })

  socket.on('conversation:leave', (data: { conversationId: string }) => {
    socket.leave(`conv:${data.conversationId}`)
    userRooms.get(user.userId)?.delete(data.conversationId)
  })

  // ============================================================
  // Gerçek zamanlı mesajlaşma
  // ============================================================
  socket.on('message:send', (data: {
    conversationId: string
    content: string
    type?: 'TEXT' | 'IMAGE' | 'LOCATION'
    metadata?: any
    // Optimistic UI için client msgId
    clientMessageId?: string
  }) => {
    if (!data?.conversationId || !data?.content?.trim()) return

    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      conversationId: data.conversationId,
      senderId: user.userId,
      sender: {
        id: user.userId,
        fullName: user.email.split('@')[0],
      },
      content: data.content,
      type: data.type || 'TEXT',
      metadata: data.metadata || null,
      createdAt: new Date().toISOString(),
      clientMessageId: data.clientMessageId,
    }

    // Konuşmadaki herkese ilet
    io.to(`conv:${data.conversationId}`).emit('message:new', message)
    
    // Okundu bilgisini sıfırla
    socket.to(`conv:${data.conversationId}`).emit('conversation:unread', {
      conversationId: data.conversationId,
    })

    console.log(`[MSG] ${user.email} → conv:${data.conversationId}: ${data.content.substring(0, 40)}`)
  })

  // ============================================================
  // Yazıyor... göstergesi
  // ============================================================
  socket.on('typing:start', (data: { conversationId: string }) => {
    socket.to(`conv:${data.conversationId}`).emit('typing:start', {
      userId: user.userId,
      conversationId: data.conversationId,
    })
  })

  socket.on('typing:stop', (data: { conversationId: string }) => {
    socket.to(`conv:${data.conversationId}`).emit('typing:stop', {
      userId: user.userId,
      conversationId: data.conversationId,
    })
  })

  // ============================================================
  // Okundu işaretleme
  // ============================================================
  socket.on('message:read', (data: { conversationId: string; messageIds: string[] }) => {
    socket.to(`conv:${data.conversationId}`).emit('message:read', {
      conversationId: data.conversationId,
      readBy: user.userId,
      messageIds: data.messageIds,
      readAt: new Date().toISOString(),
    })
  })

  // ============================================================
  // Yeni iş ilanı bildirimi (yakındaki kullanıcılara push)
  // ============================================================
  socket.on('job:posted', (data: {
    jobId: string
    title: string
    category: string
    city: string
    district: string
    latitude: number
    longitude: number
    wageAmount: number
  }) => {
    // Tüm online işçilere bildir (production'da konum bazlı filtreleme yapılır)
    io.emit('job:new_nearby', {
      ...data,
      timestamp: Date.now(),
    })
    console.log(`[JOB] Yeni ilan broadcast: ${data.title}`)
  })

  // ============================================================
  // Başvuru durumu bildirimi
  // ============================================================
  socket.on('application:status_changed', (data: {
    applicationId: string
    workerId: string
    status: string
    jobTitle: string
  }) => {
    // İşçiye özel bildir
    const worker = onlineUsers.get(data.workerId)
    if (worker) {
      for (const sid of worker.socketIds) {
        io.to(sid).emit('notification:application', {
          type: 'APPLICATION_' + data.status,
          title: data.status === 'ACCEPTED' ? 'Başvurunuz Onaylandı! 🎉' : 'Başvuru Durumu',
          body: `"${data.jobTitle}" ilanına başvurunuz ${data.status === 'ACCEPTED' ? 'onaylandı' : 'güncellendi'}.`,
          data: { applicationId: data.applicationId },
          timestamp: Date.now(),
        })
      }
    }
  })

  // ============================================================
  // Genel bildirim gönder (admin/test için)
  // ============================================================
  socket.on('notification:send', (data: { userId: string; type: string; title: string; body: string }) => {
    const target = onlineUsers.get(data.userId)
    if (target) {
      for (const sid of target.socketIds) {
        io.to(sid).emit('notification:new', {
          ...data,
          timestamp: Date.now(),
        })
      }
    }
  })

  // ============================================================
  // Ping/Pong (özel)
  // ============================================================
  socket.on('app:ping', () => {
    socket.emit('app:pong', { timestamp: Date.now() })
  })

  // ============================================================
  // Online kullanıcı listesi
  // ============================================================
  socket.on('users:online', () => {
    socket.emit('users:online_list', {
      count: onlineUsers.size,
      userIds: Array.from(onlineUsers.keys()),
    })
  })

  // ============================================================
  // Disconnect
  // ============================================================
  socket.on('disconnect', () => {
    console.log(`[-] ${user.email} ayrıldı (${socket.id})`)
    socketToUser.delete(socket.id)

    const online = onlineUsers.get(user.userId)
    if (online) {
      online.socketIds.delete(socket.id)
      if (online.socketIds.size === 0) {
        // Son bağlantı kapandı, 5 saniye bekle sonra offline işaretle
        setTimeout(() => {
          const u = onlineUsers.get(user.userId)
          if (u && u.socketIds.size === 0) {
            onlineUsers.delete(user.userId)
            emitUserStatus(user.userId)
          }
        }, 5000)
      }
    }
  })

  socket.on('error', (err: any) => {
    console.error(`Socket error (${user.email}):`, err)
  })
})

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Günübirlik İş WebSocket Servisi çalışıyor`)
  console.log(`   Port: ${PORT}`)
  console.log(`   Tarih: ${new Date().toLocaleString('tr-TR')}\n`)
})

// Graceful shutdown
const shutdown = (sig: string) => {
  console.log(`\n${sig} alındı, kapatılıyor...`)
  io.close(() => {
    httpServer.close(() => {
      console.log('Sunucu kapandı.')
      process.exit(0)
    })
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
