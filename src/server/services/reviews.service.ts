/**
 * Reviews Service - Değerlendirme sistemi
 * Kullanıcı puanları, yorumları ve ortalama hesaplama
 *
 * İki yönü vardır:
 *   - WORKER_TO_EMPLOYER: İşçi, işvereni puanlar
 *   - EMPLOYER_TO_WORKER: İşveren, işçiyi puanlar
 *
 * Puanlama sadece COMPLETED durumundaki başvurular için yapılabilir
 * (applications.service.ts > rate() metodu).
 *
 * Bu servis, puanları listelemek ve istatistik vermek içindir.
 */
import { db } from '@/lib/db'
import { ApiError } from './auth.service'

export interface ReviewListFilters {
  receiverId?: string
  reviewerId?: string
  reviewType?: 'WORKER_TO_EMPLOYER' | 'EMPLOYER_TO_WORKER'
  page?: number
  pageSize?: number
}

export class ReviewsService {
  /**
   * Bir kullanıcının aldığı tüm değerlendirmeleri listele (herkese açık)
   * Pagination destekler, en yeni önce sıralar.
   */
  async listReceivedByUser(userId: string, filters: Omit<ReviewListFilters, 'receiverId' | 'reviewerId'> = {}) {
    const { reviewType, page = 1, pageSize = 20 } = filters
    const where: any = { receiverId: userId }
    if (reviewType) where.reviewType = reviewType

    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      db.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          reviewType: true,
          createdAt: true,
          jobId: true,
          applicationId: true,
          reviewer: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              companyName: true,
              isVerified: true,
              role: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              category: true,
              city: true,
              district: true,
            },
          },
        },
      }),
      db.review.count({ where }),
    ])

    // Yıldız dağılımı (1-5)
    const distribution = await db.review.groupBy({
      by: ['rating'],
      where: { receiverId: userId },
      _count: { rating: true },
    })
    const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    distribution.forEach((d) => {
      distMap[d.rating] = d._count.rating
    })

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      distribution: distMap,
    }
  }

  /**
   * Bir kullanıcının verdiği tüm değerlendirmeleri listele (sahibi)
   */
  async listGivenByUser(userId: string, filters: Omit<ReviewListFilters, 'receiverId' | 'reviewerId'> = {}) {
    const { reviewType, page = 1, pageSize = 20 } = filters
    const where: any = { reviewerId: userId }
    if (reviewType) where.reviewType = reviewType

    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      db.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          reviewType: true,
          createdAt: true,
          jobId: true,
          applicationId: true,
          receiver: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              companyName: true,
              isVerified: true,
              role: true,
            },
          },
          job: {
            select: {
              id: true,
              title: true,
              category: true,
              city: true,
              district: true,
            },
          },
        },
      }),
      db.review.count({ where }),
    ])

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Tek bir değerlendirme getir (sahibi veya alıcı görebilir)
   */
  async getById(reviewId: string, requesterId: string) {
    const review = await db.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: {
          select: {
            id: true, fullName: true, avatarUrl: true, companyName: true,
            isVerified: true, role: true,
          },
        },
        receiver: {
          select: {
            id: true, fullName: true, avatarUrl: true, companyName: true,
            isVerified: true, role: true,
          },
        },
        job: {
          select: {
            id: true, title: true, category: true, city: true, district: true,
          },
        },
      },
    })

    if (!review) throw new ApiError('Değerlendirme bulunamadı.', 404)

    // Gizlilik: sadece alıcı veya veren görebilir
    if (review.reviewerId !== requesterId && review.receiverId !== requesterId) {
      throw new ApiError('Bu değerlendirmeyi görüntüleme yetkiniz yok.', 403)
    }

    return review
  }

  /**
   * Kullanıcı için özet istatistik - ortalama, sayı, doğrulma durumu
   */
  async getUserRatingSummary(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        role: true,
        isVerified: true,
        ratingAvg: true,
        ratingCount: true,
        companyName: true,
        avatarUrl: true,
      },
    })

    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    // Son 30 gün ortalaması (trend için)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recent = await db.review.aggregate({
      where: {
        receiverId: userId,
        createdAt: { gte: thirtyDaysAgo },
      },
      _avg: { rating: true },
      _count: { rating: true },
    })

    // Tüm zamanlar dağılımı
    const distribution = await db.review.groupBy({
      by: ['rating'],
      where: { receiverId: userId },
      _count: { rating: true },
    })
    const distMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    distribution.forEach((d) => {
      distMap[d.rating] = d._count.rating
    })

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        role: user.role,
        companyName: user.companyName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      recent30Days: {
        avg: recent._avg.rating ? Math.round(recent._avg.rating * 10) / 10 : 0,
        count: recent._count.rating,
      },
      distribution: distMap,
    }
  }
}

export const reviewsService = new ReviewsService()

// ====================================================================
// DOĞRULAMA (VERIFICATION) SERVİSİ
// ====================================================================
// İşverenler şirket belgesi, vergi levhası, kimlik vb. yükleyerek
// "Doğrulanmış" rozeti alabilir. Admin manuel onaylar.
//
// Türler:
//   - COMPANY:  Şirket belgesi (tüzel kişi işveren)
//   - IDENTITY: Kimlik doğrulama (gerçek kişi)
//   - TAX:      Vergi levhası
// ====================================================================

export interface CreateVerificationRequestDTO {
  type: 'COMPANY' | 'IDENTITY' | 'TAX'
  documentUrl: string  // base64 data URL veya cloudinary URL
  documentNote?: string
}

export class VerificationService {
  /**
   * Yeni doğrulama talebi oluştur
   * - Maksimum 1 aktif PENDING talep olabilir
   * - Zaten verified kullanıcılar tekrar başvuramaz
   */
  async submit(userId: string, dto: CreateVerificationRequestDTO, ip?: string, ua?: string) {
    if (!['COMPANY', 'IDENTITY', 'TAX'].includes(dto.type)) {
      throw new ApiError('Geçersiz doğrulama türü. COMPANY, IDENTITY veya TAX olmalı.', 400)
    }
    if (!dto.documentUrl || dto.documentUrl.trim().length < 50) {
      throw new ApiError('Belge gereklidir (base64 veya URL).', 400)
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isVerified: true, role: true, fullName: true },
    })
    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)
    if (user.isVerified) {
      throw new ApiError('Hesabınız zaten doğrulanmış. Yeni talebe gerek yok.', 400)
    }

    // Aktif PENDING talep var mı?
    const existing = await db.verificationRequest.findFirst({
      where: { userId, status: 'PENDING' },
    })
    if (existing) {
      throw new ApiError(
        'Zaten bekleyen bir doğrulama talebiniz var. Sonucu bekleyin veya reddedildikten sonra yeniden başvurun.',
        400
      )
    }

    const request = await db.verificationRequest.create({
      data: {
        userId,
        type: dto.type,
        documentUrl: dto.documentUrl,
        documentNote: dto.documentNote,
        status: 'PENDING',
      },
    })

    // Admin'lere bildirim
    const admins = await db.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    })
    if (admins.length > 0) {
      const { createNotification } = await import('@/server/lib/auth')
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'VERIFICATION_REQUEST',
          title: 'Yeni Doğrulama Talebi',
          body: `${user.fullName} (${dto.type}) doğrulama talebi gönderdi.`,
          data: { requestId: request.id, userId, type: dto.type },
        })
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        actorId: userId,
        action: 'VERIFICATION_REQUEST_SUBMIT',
        targetType: 'USER',
        targetId: userId,
        metadata: JSON.stringify({ requestId: request.id, type: dto.type }),
        ipAddress: ip,
        userAgent: ua,
      },
    })

    return request
  }

  /**
   * Kullanıcının kendi doğrulama taleplerini listele
   */
  async listMyRequests(userId: string, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      db.verificationRequest.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          status: true,
          documentNote: true,
          reviewNote: true,
          createdAt: true,
          reviewedAt: true,
        },
      }),
      db.verificationRequest.count({ where: { userId } }),
    ])

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Aktif talebi getir (yoksa null)
   */
  async getMyActiveRequest(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, isVerified: true, role: true },
    })
    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    const pendingRequest = await db.verificationRequest.findFirst({
      where: { userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        documentNote: true,
        createdAt: true,
      },
    })

    const lastDecision = await db.verificationRequest.findFirst({
      where: { userId, status: { in: ['APPROVED', 'REJECTED'] } },
      orderBy: { reviewedAt: 'desc' },
      select: {
        id: true,
        type: true,
        status: true,
        reviewNote: true,
        reviewedAt: true,
        createdAt: true,
      },
    })

    return {
      isVerified: user.isVerified,
      pendingRequest,
      lastDecision,
    }
  }
}

export const verificationService = new VerificationService()
