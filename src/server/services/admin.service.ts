/**
 * Admin Servisi - Yönetim paneli işlemleri
 *
 *  - Dashboard istatistikleri
 *  - Kullanıcı yönetimi (liste, detay, askıya alma, banlama)
 *  - Moderasyon bayrağı yönetimi (inceleme, çözümleme)
 *  - Audit log sorgulama
 *  - Moderasyon kuralı yönetimi
 *  - İş ilanı onaylama (yeni ilanlar inceleme kuyruğu)
 *  - Ödeme onaylama (COMPLETED işlerden oluşan ödeme talepleri)
 *  - İşveren doğrulama talepleri (onaylı rozet)
 */
import { db } from '@/lib/db'
import { safeJsonParse, createNotification } from '@/server/lib/auth'
import { ApiError } from './auth.service'

// ====================================================================
// Dashboard İstatistikleri
// ====================================================================

export async function getDashboardStats() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    newUsersToday,
    newUsersYesterday,
    activeUsersWeek,
    suspendedUsers,
    bannedUsers,
    pendingFlags,
    criticalFlags,
    highFlags,
    resolvedFlagsToday,
    totalConversations,
    messagesToday,
    filteredMessagesToday,
    totalRules,
    activeRules,
    auditLogsToday,
    pendingJobs,
    activeJobs,
    pendingPayments,
    pendingPaymentsTotalAmount,
    disputedPayments,
    completedPaymentsToday,
    pendingVerifications,
    verifiedEmployers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: todayStart } } }),
    db.user.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    db.user.count({ where: { lastActiveAt: { gte: weekAgo } } }),
    db.user.count({ where: { isSuspended: true, isPermanentlyBanned: false } }),
    db.user.count({ where: { isPermanentlyBanned: true } }),
    db.moderationFlag.count({ where: { status: 'PENDING' } }),
    db.moderationFlag.count({ where: { status: 'PENDING', severity: 'CRITICAL' } }),
    db.moderationFlag.count({ where: { status: 'PENDING', severity: 'HIGH' } }),
    db.moderationFlag.count({
      where: { status: { in: ['REVIEWED', 'ACTION_TAKEN'] }, reviewedAt: { gte: todayStart } },
    }),
    db.conversation.count(),
    db.message.count({ where: { createdAt: { gte: todayStart } } }),
    db.message.count({ where: { isFiltered: true, createdAt: { gte: todayStart } } }),
    db.moderationRule.count(),
    db.moderationRule.count({ where: { isEnabled: true } }),
    db.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
    // Yeni: iş onayı bekleyenler
    db.job.count({ where: { approvalStatus: 'PENDING' } }),
    db.job.count({ where: { status: 'OPEN', approvalStatus: 'APPROVED' } }),
    // Yeni: ödeme istatistikleri
    db.payment.count({ where: { status: 'PENDING' } }),
    db.payment.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
    }),
    db.payment.count({ where: { status: 'DISPUTED' } }),
    db.payment.count({ where: { status: 'RECEIVED', receivedAt: { gte: todayStart } } }),
    // Yeni: işveren doğrulama
    db.verificationRequest.count({ where: { status: 'PENDING' } }),
    db.user.count({ where: { role: 'EMPLOYER', isVerified: true } }),
  ])

  // Son 7 gün için trend verisi
  const dailyTrend: { date: string; flags: number; messages: number; users: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    const [flags, messages, users] = await Promise.all([
      db.moderationFlag.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      db.message.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
      db.user.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
    ])
    dailyTrend.push({
      date: dayStart.toISOString().slice(0, 10),
      flags,
      messages,
      users,
    })
  }

  // İhlal tiplerine göre dağılım (son 30 gün)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const flagTypeStats = await db.moderationFlag.groupBy({
    by: ['violationType'],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: true,
  })

  return {
    users: {
      total: totalUsers,
      newToday: newUsersToday,
      growthRate: newUsersYesterday > 0 ? ((newUsersToday - newUsersYesterday) / newUsersYesterday) * 100 : 0,
      activeWeek: activeUsersWeek,
      suspended: suspendedUsers,
      banned: bannedUsers,
    },
    moderation: {
      pendingFlags,
      criticalPending: criticalFlags,
      highPending: highFlags,
      resolvedToday: resolvedFlagsToday,
      totalRules,
      activeRules,
    },
    jobs: {
      pendingApproval: pendingJobs,
      active: activeJobs,
    },
    payments: {
      pending: pendingPayments,
      pendingTotalAmount: pendingPaymentsTotalAmount._sum.amount || 0,
      disputed: disputedPayments,
      completedToday: completedPaymentsToday,
    },
    verification: {
      pending: pendingVerifications,
      verifiedEmployers: verifiedEmployers,
    },
    activity: {
      totalConversations,
      messagesToday,
      filteredToday: filteredMessagesToday,
      filterRate: messagesToday > 0 ? (filteredMessagesToday / messagesToday) * 100 : 0,
      auditActionsToday: auditLogsToday,
    },
    trends: {
      daily: dailyTrend,
      violationTypes: flagTypeStats.map((s) => ({
        type: s.violationType,
        count: s._count,
      })),
    },
  }
}

// ====================================================================
// Kullanıcı Listesi (filtreli + sayfalı)
// ====================================================================

export interface UserListFilters {
  search?: string
  role?: string
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'ALL'
  sortBy?: 'createdAt' | 'fullName' | 'lastActiveAt' | 'flagCount'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export async function listUsers(filters: UserListFilters = {}) {
  const {
    search,
    role,
    status = 'ALL',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = 20,
  } = filters

  const where: any = {}
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { companyName: { contains: search } },
    ]
  }
  if (role && role !== 'ALL') where.role = role
  if (status === 'SUSPENDED') {
    where.isSuspended = true
    where.isPermanentlyBanned = false
  } else if (status === 'BANNED') {
    where.isPermanentlyBanned = true
  } else if (status === 'ACTIVE') {
    where.isSuspended = false
    where.isPermanentlyBanned = false
  }

  const skip = (page - 1) * pageSize
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        email: true,
        phone: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        companyName: true,
        isVerified: true,
        city: true,
        district: true,
        isSuspended: true,
        suspendedUntil: true,
        suspensionReason: true,
        isPermanentlyBanned: true,
        bannedReason: true,
        flagCount: true,
        warningCount: true,
        lastFlagAt: true,
        lastActiveAt: true,
        createdAt: true,
      },
    }),
    db.user.count({ where }),
  ])

  return {
    items: users.map((u) => ({
      ...u,
      status: u.isPermanentlyBanned
        ? 'BANNED'
        : u.isSuspended
        ? 'SUSPENDED'
        : 'ACTIVE',
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ====================================================================
// Kullanıcı Detayı
// ====================================================================

export async function getUserDetail(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      fullName: true,
      role: true,
      avatarUrl: true,
      bio: true,
      companyName: true,
      companyTaxId: true,
      isVerified: true,
      city: true,
      district: true,
      address: true,
      isSuspended: true,
      suspendedUntil: true,
      suspensionReason: true,
      suspendedById: true,
      suspendedAt: true,
      isPermanentlyBanned: true,
      bannedAt: true,
      bannedReason: true,
      bannedById: true,
      warningCount: true,
      flagCount: true,
      lastFlagAt: true,
      emailVerified: true,
      twoFactorEnabled: true,
      isAvailable: true,
      ratingAvg: true,
      ratingCount: true,
      lastActiveAt: true,
      createdAt: true,
    },
  })

  if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

  const [flags, suspensions, auditLogs, messageCount, conversationCount, jobCount, applicationCount] =
    await Promise.all([
      db.moderationFlag.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          message: {
            select: { content: true, originalContent: true, createdAt: true, conversationId: true },
          },
        },
      }),
      db.suspension.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.auditLog.findMany({
        where: {
          OR: [{ targetType: 'USER', targetId: userId }, { actorId: userId }],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.message.count({ where: { senderId: userId } }),
      db.conversationParticipant.count({ where: { userId } }),
      db.job.count({ where: { employerId: userId } }),
      db.application.count({ where: { workerId: userId } }),
    ])

  return {
    user: {
      ...user,
      status: user.isPermanentlyBanned
        ? 'BANNED'
        : user.isSuspended
        ? 'SUSPENDED'
        : 'ACTIVE',
    },
    stats: {
      totalMessages: messageCount,
      totalConversations: conversationCount,
      totalJobs: jobCount,
      totalApplications: applicationCount,
    },
    recentFlags: flags,
    suspensions,
    auditLogs,
  }
}

// ====================================================================
// Kullanıcı Askıya Al
// ====================================================================

export async function suspendUser(params: {
  userId: string
  adminId: string
  durationHours: number | null // null = kalıcı
  reason: string
  ipAddress?: string
  userAgent?: string
}) {
  const { userId, adminId, durationHours, reason, ipAddress, userAgent } = params

  if (userId === adminId) {
    throw new ApiError('Kendinizi askıya alamazsınız.', 400)
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)
  if (user.role === 'ADMIN') {
    throw new ApiError('Admin kullanıcıları askıya alamazsınız.', 400)
  }

  const isPermanent = durationHours === null
  const suspendedUntil = isPermanent ? null : new Date(Date.now() + durationHours! * 60 * 60 * 1000)

  // Transaction: kullanıcıyı güncelle + kayıt oluştur + audit log
  const [updatedUser, suspension, auditLog] = await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        isSuspended: !isPermanent, // geçicide true, kalıcıda false ama banned=true
        suspendedUntil,
        suspensionReason: reason,
        suspendedById: adminId,
        suspendedAt: new Date(),
        isPermanentlyBanned: isPermanent,
        ...(isPermanent && {
          bannedAt: new Date(),
          bannedReason: reason,
          bannedById: adminId,
        }),
      },
    }),
    db.suspension.create({
      data: {
        userId,
        adminId,
        type: isPermanent ? 'PERMANENT' : 'TEMPORARY',
        reason,
        durationHours: isPermanent ? null : durationHours,
        endsAt: suspendedUntil,
      },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: isPermanent ? 'USER_BAN' : 'USER_SUSPEND',
        targetType: 'USER',
        targetId: userId,
        metadata: JSON.stringify({ reason, durationHours, isPermanent }),
        ipAddress,
        userAgent,
      },
    }),
  ])

  // Kullanıcıya bildirim (DB + WebSocket + OneSignal Push)
  await createNotification({
    userId,
    type: 'ACCOUNT_SUSPENDED',
    title: isPermanent ? 'Hesabınız Kalıcı Olarak Kapatıldı' : 'Hesabınız Askıya Alındı',
    body: isPermanent
      ? `Hesabınız şu gerekçe ile kalıcı olarak kapatıldı: ${reason}`
      : `Hesabınız ${durationHours} saat süreyle askıya alındı. Gerekçe: ${reason}. Askıya alma bitişi: ${suspendedUntil?.toLocaleString('tr-TR')}`,
    data: {
      suspensionId: suspension.id,
      reason,
      durationHours: isPermanent ? null : durationHours,
      endsAt: suspendedUntil?.toISOString(),
      isPermanent,
    },
  })

  return {
    user: { id: updatedUser.id, isSuspended: updatedUser.isSuspended, isPermanentlyBanned: updatedUser.isPermanentlyBanned },
    suspension,
    auditLogId: auditLog.id,
  }
}

// ====================================================================
// Askıya Almayı Kaldır
// ====================================================================

export async function unsuspendUser(params: {
  userId: string
  adminId: string
  reason: string
  ipAddress?: string
  userAgent?: string
}) {
  const { userId, adminId, reason, ipAddress, userAgent } = params

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

  // Aktif askıya almayı bul ve liftedAt ver
  const activeSuspension = await db.suspension.findFirst({
    where: { userId, liftedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspendedUntil: null,
        suspensionReason: null,
        suspendedById: null,
        suspendedAt: null,
        isPermanentlyBanned: false,
        bannedAt: null,
        bannedReason: null,
        bannedById: null,
      },
    }),
    ...(activeSuspension
      ? [
          db.suspension.update({
            where: { id: activeSuspension.id },
            data: { liftedAt: new Date(), liftedById: adminId, liftedReason: reason },
          }),
        ]
      : []),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: user.isPermanentlyBanned ? 'USER_UNBAN' : 'USER_UNSUSPEND',
        targetType: 'USER',
        targetId: userId,
        metadata: JSON.stringify({ reason }),
        ipAddress,
        userAgent,
      },
    }),
  ])

  await createNotification({
    userId,
    type: 'ACCOUNT_REACTIVATED',
    title: 'Hesabınız Yeniden Aktif',
    body: `Hesabınızın askıya alınması kaldırıldı. Sebep: ${reason}`,
  })

  return { userId, reactivated: true }
}

// ====================================================================
// Moderasyon Bayraklarını Listele
// ====================================================================

export interface FlagListFilters {
  status?: 'PENDING' | 'REVIEWED' | 'DISMISSED' | 'ACTION_TAKEN' | 'ALL'
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'ALL'
  violationType?: string
  page?: number
  pageSize?: number
}

export async function listFlags(filters: FlagListFilters = {}) {
  const {
    status = 'PENDING',
    severity = 'ALL',
    violationType,
    page = 1,
    pageSize = 20,
  } = filters

  const where: any = {}
  if (status !== 'ALL') where.status = status
  if (severity !== 'ALL') where.severity = severity
  if (violationType && violationType !== 'ALL') where.violationType = violationType

  const skip = (page - 1) * pageSize
  const [flags, total] = await Promise.all([
    db.moderationFlag.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            role: true,
            flagCount: true,
            isSuspended: true,
            isPermanentlyBanned: true,
          },
        },
        message: {
          select: {
            id: true,
            content: true,
            originalContent: true,
            conversationId: true,
            createdAt: true,
          },
        },
      },
    }),
    db.moderationFlag.count({ where }),
  ])

  return {
    items: flags,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ====================================================================
// Flag'i Çözümle (review)
// ====================================================================

export async function resolveFlag(params: {
  flagId: string
  adminId: string
  action: 'DISMISS' | 'WARN' | 'SUSPEND' | 'BAN' | 'NONE'
  note?: string
  suspendDurationHours?: number | null
  ipAddress?: string
  userAgent?: string
}) {
  const { flagId, adminId, action, note, suspendDurationHours, ipAddress, userAgent } = params

  const flag = await db.moderationFlag.findUnique({
    where: { id: flagId },
    include: { sender: true, message: true },
  })
  if (!flag) throw new ApiError('Bayrak bulunamadı.', 404)

  const statusMap = {
    DISMISS: 'DISMISSED',
    WARN: 'ACTION_TAKEN',
    SUSPEND: 'ACTION_TAKEN',
    BAN: 'ACTION_TAKEN',
    NONE: 'REVIEWED',
  } as const

  await db.$transaction([
    db.moderationFlag.update({
      where: { id: flagId },
      data: {
        status: statusMap[action],
        action,
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    }),
    db.message.update({
      where: { id: flag.messageId },
      data: { isReviewed: true, reviewedById: adminId, reviewedAt: new Date() },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: action === 'DISMISS' ? 'FLAG_DISMISS' : 'FLAG_RESOLVE',
        targetType: 'FLAG',
        targetId: flagId,
        metadata: JSON.stringify({
          flagId,
          messageId: flag.messageId,
          senderId: flag.senderId,
          action,
          note,
        }),
        ipAddress,
        userAgent,
      },
    }),
  ])

  // Eğer uyarı/askıya alma/ban istendiyse uygula
  if (action === 'WARN') {
    await db.user.update({
      where: { id: flag.senderId },
      data: { warningCount: { increment: 1 } },
    })
    await createNotification({
      userId: flag.senderId,
      type: 'ACCOUNT_WARNING',
      title: 'Hesap Uyarısı',
      body: `Gönderdiğiniz bir mesaj kural ihlali içeriyordu. ${note || 'Lütfen platform kurallarına uyunuz.'}`,
    })
  } else if (action === 'SUSPEND' && flag.sender) {
    await suspendUser({
      userId: flag.senderId,
      adminId,
      durationHours: suspendDurationHours ?? 24,
      reason: note || `Otomatik yaptırım: ${flag.violationType} ihlali (Flag: ${flag.id})`,
      ipAddress,
      userAgent,
    })
  } else if (action === 'BAN' && flag.sender) {
    await suspendUser({
      userId: flag.senderId,
      adminId,
      durationHours: null, // kalıcı
      reason: note || `Kalıcı ban: ${flag.violationType} ihlali (Flag: ${flag.id})`,
      ipAddress,
      userAgent,
    })
  }

  return { flagId, status: statusMap[action], action }
}

// ====================================================================
// Audit Log Listele
// ====================================================================

export async function listAuditLogs(filters: {
  action?: string
  actorId?: string
  targetType?: string
  page?: number
  pageSize?: number
} = {}) {
  const { action, actorId, targetType, page = 1, pageSize = 30 } = filters
  const where: any = {}
  if (action) where.action = action
  if (actorId) where.actorId = actorId
  if (targetType) where.targetType = targetType

  const skip = (page - 1) * pageSize
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
        },
      },
    }),
    db.auditLog.count({ where }),
  ])

  return {
    items: logs.map((l) => ({
      ...l,
      metadata: safeJsonParse(l.metadata, null),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ====================================================================
// Moderasyon Kuralları Yönetimi
// ====================================================================

export async function listModerationRules() {
  return db.moderationRule.findMany({
    orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
  })
}

export async function createModerationRule(data: {
  name: string
  description?: string
  type: string
  pattern: string
  severity: string
  action: string
  isEnabled?: boolean
}) {
  // Regex geçerliliğini kontrol et
  try {
    new RegExp(data.pattern)
  } catch {
    throw new ApiError('Geçersiz regex deseni.', 400)
  }
  return db.moderationRule.create({ data: { ...data, isSystem: false } })
}

export async function updateModerationRule(id: string, data: Partial<{
  name: string
  description: string
  pattern: string
  severity: string
  action: string
  isEnabled: boolean
}>) {
  const rule = await db.moderationRule.findUnique({ where: { id } })
  if (!rule) throw new ApiError('Kural bulunamadı.', 404)
  if (rule.isSystem && data.pattern !== undefined) {
    throw new ApiError('Sistem kurallarının deseni değiştirilemez. Yeni kural oluşturun.', 400)
  }
  if (data.pattern) {
    try {
      new RegExp(data.pattern)
    } catch {
      throw new ApiError('Geçersiz regex deseni.', 400)
    }
  }
  return db.moderationRule.update({ where: { id }, data })
}

export async function deleteModerationRule(id: string) {
  const rule = await db.moderationRule.findUnique({ where: { id } })
  if (!rule) throw new ApiError('Kural bulunamadı.', 404)
  if (rule.isSystem) throw new ApiError('Sistem kuralları silinemez.', 400)
  return db.moderationRule.delete({ where: { id } })
}

// ====================================================================
// Konuşma Mesajlarını Admin Görünümünde Getir
// (filtrelenmiş + orijinal içerik birlikte)
// ====================================================================

export async function getConversationMessagesForAdmin(conversationId: string, page = 1, pageSize = 50) {
  const skip = (page - 1) * pageSize
  const [messages, total] = await Promise.all([
    db.message.findMany({
      where: { conversationId },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
        },
        flags: true,
      },
    }),
    db.message.count({ where: { conversationId } }),
  ])

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
          },
        },
      },
      job: { select: { id: true, title: true, city: true, district: true } },
    },
  })

  return {
    conversation,
    items: messages.reverse().map((m) => ({
      ...m,
      filterReasons: safeJsonParse(m.filterReasons, null),
      metadata: safeJsonParse(m.metadata, null),
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// ====================================================================
// İŞ İLANI ONAYLAMA SİSTEMİ
// ====================================================================

export async function listPendingJobs(page = 1, pageSize = 20) {
  const where = { approvalStatus: 'PENDING' as const }
  const skip = (page - 1) * pageSize
  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'asc' },
      include: {
        employer: {
          select: {
            id: true, fullName: true, email: true, phone: true,
            companyName: true, isVerified: true, avatarUrl: true,
            ratingAvg: true, ratingCount: true, role: true,
            isSuspended: true, isPermanentlyBanned: true,
            flagCount: true,
          },
        },
        _count: { select: { applications: true } },
      },
    }),
    db.job.count({ where }),
  ])

  return {
    items: jobs,
    pagination: {
      page, pageSize, total, totalPages: Math.ceil(total / pageSize),
    },
  }
}

export async function approveJob(params: {
  jobId: string
  adminId: string
  note?: string
  ipAddress?: string
  userAgent?: string
}) {
  const { jobId, adminId, note, ipAddress, userAgent } = params
  const job = await db.job.findUnique({ where: { id: jobId }, include: { employer: true } })
  if (!job) throw new ApiError('İş ilanı bulunamadı.', 404)
  if (job.approvalStatus === 'APPROVED') {
    throw new ApiError('Bu ilan zaten onaylanmış.', 400)
  }

  const [updated, auditLog] = await db.$transaction([
    db.job.update({
      where: { id: jobId },
      data: {
        approvalStatus: 'APPROVED',
        approvalNote: note,
        approvedById: adminId,
        approvedAt: new Date(),
        rejectedAt: null,
      },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: 'JOB_APPROVE',
        targetType: 'JOB',
        targetId: jobId,
        metadata: JSON.stringify({ note, employerId: job.employerId }),
        ipAddress, userAgent,
      },
    }),
  ])

  // İşverene bildirim (DB + WebSocket + OneSignal Push)
  await createNotification({
    userId: job.employerId,
    type: 'JOB_APPROVED',
    title: 'İlanınız Onaylandı! ✅',
    body: `"${job.title}" ilanınız yayına alındı. Artık başvuruları alabilirsiniz.`,
    data: { jobId, auditLogId: auditLog.id },
  })

  return { job: { id: updated.id, approvalStatus: updated.approvalStatus }, auditLogId: auditLog.id }
}

export async function rejectJob(params: {
  jobId: string
  adminId: string
  reason: string
  ipAddress?: string
  userAgent?: string
}) {
  const { jobId, adminId, reason, ipAddress, userAgent } = params
  if (!reason || reason.trim().length < 3) {
    throw new ApiError('Red gerekçesi en az 3 karakter olmalı.', 400)
  }
  const job = await db.job.findUnique({ where: { id: jobId }, include: { employer: true } })
  if (!job) throw new ApiError('İş ilanı bulunamadı.', 404)

  const [updated, auditLog] = await db.$transaction([
    db.job.update({
      where: { id: jobId },
      data: {
        approvalStatus: 'REJECTED',
        approvalNote: reason,
        approvedById: adminId,
        rejectedAt: new Date(),
        approvedAt: null,
        status: 'CANCELLED', // Reddedilen ilan yayından kalkar
      },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: 'JOB_REJECT',
        targetType: 'JOB',
        targetId: jobId,
        metadata: JSON.stringify({ reason, employerId: job.employerId }),
        ipAddress, userAgent,
      },
    }),
  ])

  await createNotification({
    userId: job.employerId,
    type: 'JOB_REJECTED',
    title: 'İlanınız Reddedildi ❌',
    body: `"${job.title}" ilanınız reddedildi. Sebep: ${reason}`,
    data: { jobId, auditLogId: auditLog.id },
  })

  return { job: { id: updated.id, approvalStatus: updated.approvalStatus }, auditLogId: auditLog.id }
}

// ====================================================================
// ÖDEME ONAYLAMA SİSTEMİ
// ====================================================================

export async function listPayments(filters: {
  status?: string
  page?: number
  pageSize?: number
} = {}) {
  const { status = 'PENDING', page = 1, pageSize = 20 } = filters
  const where: any = {}
  if (status !== 'ALL') where.status = status

  const skip = (page - 1) * pageSize
  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        job: { select: { id: true, title: true, workDate: true, city: true, district: true, wageAmount: true } },
        worker: { select: { id: true, fullName: true, email: true, avatarUrl: true, phone: true, ratingAvg: true } },
        employer: { select: { id: true, fullName: true, email: true, companyName: true, avatarUrl: true, phone: true, isVerified: true } },
        application: { select: { id: true, status: true, completedAt: true, employerNote: true } },
      },
    }),
    db.payment.count({ where }),
  ])

  // Toplam tutar (status filtreye göre)
  const amountAgg = await db.payment.aggregate({
    where,
    _sum: { amount: true },
    _count: true,
  })

  return {
    items: payments,
    pagination: {
      page, pageSize, total, totalPages: Math.ceil(total / pageSize),
    },
    summary: {
      totalAmount: amountAgg._sum.amount || 0,
      count: amountAgg._count,
    },
  }
}

export async function approvePayment(params: {
  paymentId: string
  adminId: string
  note?: string
  ipAddress?: string
  userAgent?: string
}) {
  const { paymentId, adminId, note, ipAddress, userAgent } = params
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { job: true, worker: true, employer: true },
  })
  if (!payment) throw new ApiError('Ödeme kaydı bulunamadı.', 404)
  if (payment.status !== 'PENDING') {
    throw new ApiError(`Bu ödeme şu an ${payment.status} durumunda, onaylanamaz.`, 400)
  }

  const [updated, auditLog] = await db.$transaction([
    db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'APPROVED',
        adminApprovedById: adminId,
        adminApprovedAt: new Date(),
        rejectionReason: null,
      },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: 'PAYMENT_APPROVE',
        targetType: 'PAYMENT',
        targetId: paymentId,
        metadata: JSON.stringify({
          amount: payment.amount, jobId: payment.jobId,
          workerId: payment.workerId, employerId: payment.employerId, note,
        }),
        ipAddress, userAgent,
      },
    }),
  ])

  // Hem işverene hem işçiye bildirim (DB + WebSocket + OneSignal Push)
  await createNotification({
    userId: payment.employerId,
    type: 'PAYMENT_APPROVED',
    title: 'Ödeme Onaylandı ✅',
    body: `"${payment.job.title}" işi için ${payment.amount}₺ ödeme talebiniz onaylandı. İşçiye ödeme yapabilirsiniz.`,
    data: { paymentId, amount: payment.amount },
  })
  await createNotification({
    userId: payment.workerId,
    type: 'PAYMENT_APPROVED',
    title: 'Ödemeniz Onaylandı ✅',
    body: `"${payment.job.title}" işi için ${payment.amount}₺ ödemeniz onaylandı. İşvereniniz ödemeyi yapacaktır.`,
    data: { paymentId, amount: payment.amount },
  })

  return { payment: { id: updated.id, status: updated.status }, auditLogId: auditLog.id }
}

export async function rejectPayment(params: {
  paymentId: string
  adminId: string
  reason: string
  ipAddress?: string
  userAgent?: string
}) {
  const { paymentId, adminId, reason, ipAddress, userAgent } = params
  if (!reason || reason.trim().length < 3) {
    throw new ApiError('Red gerekçesi en az 3 karakter olmalı.', 400)
  }
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { job: true },
  })
  if (!payment) throw new ApiError('Ödeme kaydı bulunamadı.', 404)
  if (payment.status !== 'PENDING') {
    throw new ApiError(`Bu ödeme şu an ${payment.status} durumunda, reddedilemez.`, 400)
  }

  const [updated, auditLog] = await db.$transaction([
    db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'REJECTED',
        adminApprovedById: adminId,
        adminRejectedAt: new Date(),
        rejectionReason: reason,
      },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: 'PAYMENT_REJECT',
        targetType: 'PAYMENT',
        targetId: paymentId,
        metadata: JSON.stringify({ reason, amount: payment.amount, jobId: payment.jobId }),
        ipAddress, userAgent,
      },
    }),
  ])

  await createNotification({
    userId: payment.employerId,
    type: 'PAYMENT_REJECTED',
    title: 'Ödeme Reddedildi ❌',
    body: `"${payment.job.title}" işi için ${payment.amount}₺ ödeme talebi reddedildi. Sebep: ${reason}`,
    data: { paymentId },
  })
  await createNotification({
    userId: payment.workerId,
    type: 'PAYMENT_REJECTED',
    title: 'Ödeme Talebi Reddedildi ❌',
    body: `"${payment.job.title}" işi için ödeme talebi reddedildi. Detaylar için işvereninizle iletişime geçin.`,
    data: { paymentId },
  })

  return { payment: { id: updated.id, status: updated.status }, auditLogId: auditLog.id }
}

export async function resolveDispute(params: {
  paymentId: string
  adminId: string
  resolution: 'APPROVED' | 'REJECTED'
  note: string
  ipAddress?: string
  userAgent?: string
}) {
  const { paymentId, adminId, resolution, note, ipAddress, userAgent } = params
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { job: true },
  })
  if (!payment) throw new ApiError('Ödeme kaydı bulunamadı.', 404)
  if (payment.status !== 'DISPUTED') {
    throw new ApiError('Bu ödeme itiraz durumunda değil.', 400)
  }

  // APPROVED: itiraz haklı bulundu, işveren ödeme yapacak → APPROVED
  // REJECTED: itiraz reddedildi, mevcut akış devam eder (RECEIVED olarak kapat)
  const newStatus = resolution === 'APPROVED' ? 'APPROVED' : 'RECEIVED'

  const [updated, auditLog] = await db.$transaction([
    db.payment.update({
      where: { id: paymentId },
      data: {
        status: newStatus,
        adminApprovedById: adminId,
        adminApprovedAt: new Date(),
        // Eğer REJECTED ise receivedAt de set et (kapatılmış sayılır)
        ...(resolution === 'REJECTED' && { receivedAt: new Date() }),
      },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: 'PAYMENT_DISPUTE_RESOLVE',
        targetType: 'PAYMENT',
        targetId: paymentId,
        metadata: JSON.stringify({
          resolution, note, amount: payment.amount, newStatus,
        }),
        ipAddress, userAgent,
      },
    }),
  ])

  // Her iki tarafa bildirim
  const title = resolution === 'APPROVED'
    ? 'İtirazınız Onaylandı ✅'
    : 'İtiraz Reddedildi ❌'
  const body = resolution === 'APPROVED'
    ? `"${payment.job.title}" işi için ödeme itirazınız haklı bulundu. ${payment.amount}₺ ödeme yapılacaktır. Not: ${note}`
    : `"${payment.job.title}" işi için ödeme itirazınız reddedildi. Not: ${note}`

  await createNotification({
    userId: payment.workerId,
    type: 'PAYMENT_DISPUTE_RESOLVED',
    title,
    body,
    data: { paymentId, resolution },
  })
  await createNotification({
    userId: payment.employerId,
    type: 'PAYMENT_DISPUTE_RESOLVED',
    title,
    body: resolution === 'APPROVED'
      ? `"${payment.job.title}" işi için ödeme itirazı işçi lehine çözüldü. ${payment.amount}₺ ödeme yapmanız gerekmektedir. Not: ${note}`
      : `"${payment.job.title}" işi için ödeme itirazı reddedildi. Not: ${note}`,
    data: { paymentId, resolution },
  })

  return { payment: { id: updated.id, status: updated.status }, auditLogId: auditLog.id }
}

// ====================================================================
// İŞVEREN DOĞRULAMA SİSTEMİ
// ====================================================================

export async function listVerificationRequests(filters: {
  status?: string
  page?: number
  pageSize?: number
} = {}) {
  const { status = 'PENDING', page = 1, pageSize = 20 } = filters
  const where: any = {}
  if (status !== 'ALL') where.status = status

  const skip = (page - 1) * pageSize
  const [requests, total] = await Promise.all([
    db.verificationRequest.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
      include: {
        user: {
          select: {
            id: true, fullName: true, email: true, phone: true, avatarUrl: true,
            companyName: true, companyTaxId: true, isVerified: true, role: true,
            city: true, district: true, createdAt: true,
          },
        },
      },
    }),
    db.verificationRequest.count({ where }),
  ])

  return {
    items: requests,
    pagination: {
      page, pageSize, total, totalPages: Math.ceil(total / pageSize),
    },
  }
}

export async function approveVerification(params: {
  requestId: string
  adminId: string
  note?: string
  ipAddress?: string
  userAgent?: string
}) {
  const { requestId, adminId, note, ipAddress, userAgent } = params
  const req = await db.verificationRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  })
  if (!req) throw new ApiError('Doğrulama talebi bulunamadı.', 404)
  if (req.status !== 'PENDING') {
    throw new ApiError('Bu talep zaten işlenmiş.', 400)
  }

  const [updated, auditLog] = await db.$transaction([
    db.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNote: note,
      },
    }),
    // Kullanıcıyı verified yap
    db.user.update({
      where: { id: req.userId },
      data: { isVerified: true },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: 'VERIFICATION_APPROVE',
        targetType: 'USER',
        targetId: req.userId,
        metadata: JSON.stringify({
          requestId, verificationType: req.type, note,
        }),
        ipAddress, userAgent,
      },
    }),
  ])

  await createNotification({
    userId: req.userId,
    type: 'VERIFICATION_APPROVED',
    title: 'Hesabınız Onaylandı! ✅',
    body: 'Doğrulama talebiniz onaylandı. Artık "onaylı işveren" rozetiniz var.',
    data: { requestId, auditLogId: auditLog.id },
  })

  return { request: { id: updated.id, status: updated.status }, auditLogId: auditLog.id }
}

export async function rejectVerification(params: {
  requestId: string
  adminId: string
  reason: string
  ipAddress?: string
  userAgent?: string
}) {
  const { requestId, adminId, reason, ipAddress, userAgent } = params
  if (!reason || reason.trim().length < 3) {
    throw new ApiError('Red gerekçesi en az 3 karakter olmalı.', 400)
  }
  const req = await db.verificationRequest.findUnique({
    where: { id: requestId },
    include: { user: true },
  })
  if (!req) throw new ApiError('Doğrulama talebi bulunamadı.', 404)
  if (req.status !== 'PENDING') {
    throw new ApiError('Bu talep zaten işlenmiş.', 400)
  }

  const [updated, auditLog] = await db.$transaction([
    db.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNote: reason,
      },
    }),
    db.auditLog.create({
      data: {
        actorId: adminId,
        action: 'VERIFICATION_REJECT',
        targetType: 'USER',
        targetId: req.userId,
        metadata: JSON.stringify({ requestId, reason, verificationType: req.type }),
        ipAddress, userAgent,
      },
    }),
  ])

  await createNotification({
    userId: req.userId,
    type: 'VERIFICATION_REJECTED',
    title: 'Doğrulama Talebi Reddedildi ❌',
    body: `Doğrulama talebiniz reddedildi. Sebep: ${reason}`,
    data: { requestId },
  })

  return { request: { id: updated.id, status: updated.status }, auditLogId: auditLog.id }
}
