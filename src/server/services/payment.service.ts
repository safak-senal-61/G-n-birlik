/**
 * Payment Service - Escrow ödeme sistemi + QR doğrulama
 *
 * Akış:
 * 1. İşveren ilan verir → escrow fonlar (ücret emanete alınır)
 * 2. İşçi başvurur → işveren onaylar
 * 3. İş başlangıcı → işveren QR gösterir → işçi tarar → CHECK_IN
 * 4. İş bitişi → işveren QR gösterir → işçi tarar → CHECK_OUT (WORK_DONE)
 * 5. Ödeme → işveren QR gösterir → işçi tarar → ödeme release (PAID)
 * 6. Anlaşmazlık → herhangi bir taraf dispute açar → admin çözer
 *
 * Güvenlik:
 * - QR token'lar JWT ile imzalanır, 5 dk geçerli, tek kullanımlık
 * - QR kopyalanamaz (sadece web'de gösterilir, indirme engelli)
 * - Konum doğrulama (işçi iş yerinde mi?)
 * - Platform komisyonu %5
 */
import { db } from '@/lib/db'
import { generateToken, calculateDistance, createNotification } from '@/server/lib/auth'
import { ApiError } from '@/server/services/auth.service'
import crypto from 'crypto'

const PLATFORM_FEE_PERCENT = 0.05 // %5
const QR_EXPIRY_MINUTES = 5

export class PaymentService {
  // ============================================================
  // 1. ESCROW FONLAMA
  // ============================================================

  /**
   * İşveren escrow fonlar - iş ücretini emanete alır
   * Production'da gerçek ödeme entegrasyonu (Iyzico/Stripe) gerekir
   */
  async fundEscrow(jobId: string, employerId: string): Promise<any> {
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: { applications: { where: { status: 'ACCEPTED' } } },
    })

    if (!job) throw new ApiError('İş ilanı bulunamadı.', 404)
    if (job.employerId !== employerId) throw new ApiError('Yetkisiz.', 403)
    if (job.escrowStatus === 'FUNDED') throw new ApiError('Escrow zaten fonlanmış.', 400)

    const amount = job.wageAmount * job.openingsTotal
    const platformFee = Math.round(amount * PLATFORM_FEE_PERCENT * 100) / 100
    const workerAmount = amount - platformFee

    // Transaction: employer wallet'tan düş, escrow'a al
    const employer = await db.user.findUnique({ where: { id: employerId } })
    if (!employer) throw new ApiError('Kullanıcı bulunamadı.', 404)

    // Yeterli bakiye kontrolü (production'da ödeme gateway'i ile)
    // Şimdilik otomatik fonlama simülasyonu
    const payment = await db.payment.create({
      data: {
        jobId,
        fromUserId: employerId,
        amount,
        platformFee,
        workerAmount,
        status: 'ESCROW',
        type: 'ESCROW',
        escrowFundedAt: new Date(),
      },
    })

    // Job escrow status güncelle
    await db.job.update({
      where: { id: jobId },
      data: {
        escrowStatus: 'FUNDED',
        escrowAmount: amount,
        platformFee,
      },
    })

    // Employer wallet locked artır
    await db.user.update({
      where: { id: employerId },
      data: { walletLocked: { increment: amount } },
    })

    return {
      paymentId: payment.id,
      amount,
      platformFee,
      workerAmount,
      status: 'ESCROW',
    }
  }

  // ============================================================
  // 2. QR KOD ÜRETME
  // ============================================================

  /**
   * İşveren için QR kod üretir
   * Step: CHECK_IN | CHECK_OUT | PAYMENT
   * QR sadece işveren görebilir, 5 dk geçerli, tek kullanımlık
   */
  async generateQR(
    jobId: string,
    employerId: string,
    step: 'CHECK_IN' | 'CHECK_OUT' | 'PAYMENT',
    applicationId?: string
  ): Promise<{ token: string; step: string; expiresAt: Date; qrData: string }> {
    const job = await db.job.findUnique({ where: { id: jobId } })
    if (!job) throw new ApiError('İş ilanı bulunamadı.', 404)
    if (job.employerId !== employerId) throw new ApiError('Yetkisiz.', 403)
    if (job.escrowStatus !== 'FUNDED') throw new ApiError('Escrow fonlanmamış. Önce ödeme yapın.', 400)

    // Step kontrolü
    if (step === 'CHECK_IN') {
      // Accepted başvuru olmalı
      const app = await db.application.findFirst({
        where: { jobId, status: 'ACCEPTED' },
      })
      if (!app) throw new ApiError('Onaylanmış başvuru yok.', 400)
    } else if (step === 'CHECK_OUT') {
      const app = await db.application.findFirst({
        where: { jobId, status: 'CHECKED_IN' },
      })
      if (!app) throw new ApiError('İş başlatılmamış. Önce CHECK_IN yapın.', 400)
    } else if (step === 'PAYMENT') {
      const app = await db.application.findFirst({
        where: { jobId, status: 'WORK_DONE' },
      })
      if (!app) throw new ApiError('İş tamamlanmamış. Önce CHECK_OUT yapın.', 400)
    }

    // Eski aktif QR'ları expire et
    await db.jobVerification.updateMany({
      where: { jobId, step, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    })

    // Yeni token üret (JWT imzalı)
    const token = generateToken({
      jobId,
      step,
      employerId,
      applicationId: applicationId || '',
      type: 'QR_VERIFICATION',
    } as any)

    const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000)

    const verification = await db.jobVerification.create({
      data: {
        jobId,
        applicationId,
        token,
        step,
        status: 'ACTIVE',
        expiresAt,
      },
    })

    // QR data - mobil app bunu okuyacak
    const qrData = JSON.stringify({
      v: '1.0',
      token,
      jobId,
      step,
      expiresAt: expiresAt.toISOString(),
    })

    return {
      token,
      step,
      expiresAt,
      qrData,
    }
  }

  // ============================================================
  // 3. QR DOĞRULAMA (İşçi tarar)
  // ============================================================

  /**
   * İşçi QR tarar - token doğrulanır, application status güncellenir
   */
  async verifyQR(
    workerId: string,
    token: string,
    scanLocation?: { lat: number; lng: number }
  ): Promise<any> {
    // Token'ı veritabanında ara
    const verification = await db.jobVerification.findFirst({
      where: { token, status: 'ACTIVE' },
      include: { job: true },
    })

    if (!verification) {
      throw new ApiError('Geçersiz veya süresi dolmuş QR kod.', 400)
    }

    // Süre kontrolü
    if (verification.expiresAt < new Date()) {
      await db.jobVerification.update({
        where: { id: verification.id },
        data: { status: 'EXPIRED' },
      })
      throw new ApiError('QR kodun süresi dolmuş. İşverenden yeni QR isteyin.', 400)
    }

    // İşçi bu işe atanmış mı?
    const application = await db.application.findFirst({
      where: {
        jobId: verification.jobId,
        workerId,
        status: { in: ['ACCEPTED', 'CHECKED_IN', 'WORK_DONE'] },
      },
    })

    if (!application) {
      throw new ApiError('Bu işe atanmamışsınız veya iş durumu uygun değil.', 403)
    }

    // Konum doğrulama (opsiyonel)
    let scanDistance: number | undefined
    if (scanLocation && verification.job.latitude) {
      scanDistance = calculateDistance(
        scanLocation.lat,
        scanLocation.lng,
        verification.job.latitude,
        verification.job.longitude
      )
      // 500m'den uzaktaysa uyarı (ama engelleme)
      if (scanDistance > 0.5) {
        // Sadece logla, engelleme yok
        console.warn(`[QR] Uzak konum taraması: ${scanDistance} km`)
      }
    }

    // Step'e göre işlem yap
    const step = verification.step
    let newStatus: string
    let notificationType: string
    let notificationTitle: string
    let notificationBody: string

    if (step === 'CHECK_IN') {
      if (application.status !== 'ACCEPTED') {
        throw new ApiError('İş zaten başlatılmış.', 400)
      }
      newStatus = 'CHECKED_IN'
      notificationType = 'JOB_CHECKED_IN'
      notificationTitle = 'İş Başladı!'
      notificationBody = `${application.workerId} işe başladı. ${verification.job.title}`
    } else if (step === 'CHECK_OUT') {
      if (application.status !== 'CHECKED_IN') {
        throw new ApiError('İş başlatılmamış. Önce CHECK_IN yapın.', 400)
      }
      newStatus = 'WORK_DONE'
      notificationType = 'JOB_CHECKED_OUT'
      notificationTitle = 'İş Tamamlandı!'
      notificationBody = `${verification.job.title} işi tamamlandı. Ödeme bekleniyor.`
    } else if (step === 'PAYMENT') {
      if (application.status !== 'WORK_DONE') {
        throw new ApiError('İş tamamlanmamış. Önce CHECK_OUT yapın.', 400)
      }
      newStatus = 'PAID'
      notificationType = 'PAYMENT_RELEASED'
      notificationTitle = 'Ödeme Alındı!'
      notificationBody = `${verification.job.title} işi için ödemeniz hesabınıza yatırıldı.`
    } else {
      throw new ApiError('Geçersiz QR step.', 400)
    }

    // Transaction: verification + application + ödeme
    await db.$transaction(async (tx) => {
      // Verification'ı kullanılmış işaretle
      await tx.jobVerification.update({
        where: { id: verification.id },
        data: {
          status: 'USED',
          scannedBy: workerId,
          scannedAt: new Date(),
          scanLatitude: scanLocation?.lat,
          scanLongitude: scanLocation?.lng,
          scanDistance,
        },
      })

      // Application status güncelle
      const updateData: any = { status: newStatus }
      if (step === 'CHECK_IN') updateData.checkInAt = new Date()
      if (step === 'CHECK_OUT') updateData.checkOutAt = new Date()
      if (step === 'PAYMENT') {
        updateData.paidAt = new Date()
        updateData.finalWage = verification.job.wageAmount
        updateData.completedAt = new Date()
      }

      await tx.application.update({
        where: { id: application.id },
        data: updateData,
      })

      // Ödeme release
      if (step === 'PAYMENT') {
        const payment = await tx.payment.findFirst({
          where: { jobId: verification.jobId, status: 'ESCROW' },
        })

        if (payment) {
          // Payment'ı release et
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'RELEASED',
              toUserId: workerId,
              releasedAt: new Date(),
            },
          })

          // Job escrow status
          await tx.job.update({
            where: { id: verification.jobId },
            data: { escrowStatus: 'RELEASED' },
          })

          // Employer wallet locked düş
          await tx.user.update({
            where: { id: payment.fromUserId },
            data: { walletLocked: { decrement: payment.amount } },
          })

          // Worker wallet balance artır
          await tx.user.update({
            where: { id: workerId },
            data: { walletBalance: { increment: payment.workerAmount } },
          })
        }
      }
    })

    // Bildirim gönder (işverene)
    const job = verification.job
    await createNotification({
      userId: job.employerId,
      type: notificationType,
      title: notificationTitle,
      body: notificationBody,
      data: { jobId: job.id, step },
    })

    // İşçiye de bildirim
    await createNotification({
      userId: workerId,
      type: notificationType,
      title: notificationTitle,
      body: notificationBody,
      data: { jobId: job.id, step },
    })

    return {
      success: true,
      step,
      newStatus,
      jobId: job.id,
      jobTitle: job.title,
      message:
        step === 'CHECK_IN' ? 'İş başlatıldı!' :
        step === 'CHECK_OUT' ? 'İş tamamlandı! Ödeme bekleniyor.' :
        'Ödeme alındı! İşlem tamam.',
    }
  }

  // ============================================================
  // 4. ANLAŞMAZLIK (DISPUTE)
  // ============================================================

  /**
   * Anlaşmazlık aç - herhangi bir taraf açabilir
   */
  async openDispute(
    userId: string,
    data: {
      jobId: string
      applicationId?: string
      reason: string // WORKER_NO_SHOW | EMPLOYER_NO_PAY | QUALITY_ISSUE | SAFETY | OTHER
      description: string
      evidence?: string[] // image URLs
    }
  ): Promise<any> {
    const job = await db.job.findUnique({ where: { id: data.jobId } })
    if (!job) throw new ApiError('İş ilanı bulunamadı.', 404)

    // Kullanıcı bu işle ilgili mi?
    const isEmployer = job.employerId === userId
    const application = data.applicationId
      ? await db.application.findUnique({ where: { id: data.applicationId } })
      : await db.application.findFirst({
          where: {
            jobId: data.jobId,
            OR: [{ workerId: userId }, {}],
            status: { in: ['CHECKED_IN', 'WORK_DONE', 'COMPLETED'] },
          },
        })

    if (!isEmployer && (!application || application.workerId !== userId)) {
      throw new ApiError('Bu işle ilgili yetkiniz yok.', 403)
    }

    // Karşı taraf belirle
    const againstId = isEmployer
      ? application?.workerId
      : job.employerId

    if (!againstId) throw new ApiError('Karşı taraf bulunamadı.', 400)

    // Ödeme bul
    const payment = await db.payment.findFirst({
      where: { jobId: data.jobId, status: 'ESCROW' },
    })

    // Zaten açık dispute var mı?
    const existing = await db.dispute.findFirst({
      where: { jobId: data.jobId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
    })
    if (existing) throw new ApiError('Bu iş için zaten açık bir anlaşmazlık var.', 400)

    const dispute = await db.dispute.create({
      data: {
        jobId: data.jobId,
        applicationId: application?.id,
        paymentId: payment?.id,
        openedBy: userId,
        againstId,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence ? JSON.stringify(data.evidence) : null,
        status: 'OPEN',
      },
    })

    // Payment'ı DISPUTED işaretle
    if (payment) {
      await db.payment.update({
        where: { id: payment.id },
        data: { status: 'DISPUTED' },
      })
    }

    // Bildirim: karşı tarafa
    await createNotification({
      userId: againstId,
      type: 'DISPUTE_OPENED',
      title: 'Anlaşmazlık Açıldı',
      body: `"${job.title}" işi için anlaşmazlık açıldı. Sebep: ${data.reason}`,
      data: { disputeId: dispute.id, jobId: job.id },
    })

    // Admin'e bildirim
    const admins = await db.user.findMany({ where: { role: 'ADMIN' } })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'DISPUTE_OPENED',
        title: 'Yeni Anlaşmazlık',
        body: `"${job.title}" işi için anlaşmazlık açıldı. İnceleyin.`,
        data: { disputeId: dispute.id, jobId: job.id },
      })
    }

    return dispute
  }

  // ============================================================
  // 5. DISPUTE ÇÖZME (Admin)
  // ============================================================

  /**
   * Admin anlaşmazlığı çözer
   * resolution: RESOLVED_WORKER | RESOLVED_EMPLOYER | RESOLVED_SPLIT
   */
  async resolveDispute(
    adminId: string,
    disputeId: string,
    resolution: 'RESOLVED_WORKER' | 'RESOLVED_EMPLOYER' | 'RESOLVED_SPLIT',
    resolutionNote: string
  ): Promise<any> {
    const admin = await db.user.findUnique({ where: { id: adminId } })
    if (!admin || admin.role !== 'ADMIN') {
      throw new ApiError('Admin yetkisi gerekli.', 403)
    }

    const dispute = await db.dispute.findUnique({
      where: { id: disputeId },
      include: { payment: true, job: true },
    })

    if (!dispute) throw new ApiError('Anlaşmazlık bulunamadı.', 404)
    if (dispute.status !== 'OPEN' && dispute.status !== 'UNDER_REVIEW') {
      throw new ApiError('Bu anlaşmazlık zaten çözülmüş.', 400)
    }

    await db.$transaction(async (tx) => {
      // Dispute'u çöz
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: resolution,
          resolution: resolutionNote,
          resolvedBy: adminId,
          resolvedAt: new Date(),
        },
      })

      if (dispute.payment) {
        const payment = dispute.payment

        if (resolution === 'RESOLVED_WORKER') {
          // Tamamı işçiye
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'RELEASED', releasedAt: new Date() },
          })
          await tx.user.update({
            where: { id: payment.fromUserId },
            data: { walletLocked: { decrement: payment.amount } },
          })
          // Worker'a öde
          const app = await tx.application.findFirst({
            where: { jobId: dispute.jobId, status: { in: ['CHECKED_IN', 'WORK_DONE'] } },
          })
          if (app) {
            await tx.user.update({
              where: { id: app.workerId },
              data: { walletBalance: { increment: payment.workerAmount } },
            })
            await tx.payment.update({
              where: { id: payment.id },
              data: { toUserId: app.workerId },
            })
          }
        } else if (resolution === 'RESOLVED_EMPLOYER') {
          // Tamamı işverene iade
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'REFUNDED', refundedAt: new Date() },
          })
          await tx.user.update({
            where: { id: payment.fromUserId },
            data: {
              walletLocked: { decrement: payment.amount },
              walletBalance: { increment: payment.amount },
            },
          })
        } else if (resolution === 'RESOLVED_SPLIT') {
          // Yarı yarıya
          const half = payment.amount / 2
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: 'RELEASED', releasedAt: new Date() },
          })
          await tx.user.update({
            where: { id: payment.fromUserId },
            data: {
              walletLocked: { decrement: payment.amount },
              walletBalance: { increment: half },
            },
          })
          const app = await tx.application.findFirst({
            where: { jobId: dispute.jobId, status: { in: ['CHECKED_IN', 'WORK_DONE'] } },
          })
          if (app) {
            await tx.user.update({
              where: { id: app.workerId },
              data: { walletBalance: { increment: half } },
            })
            await tx.payment.update({
              where: { id: payment.id },
              data: { toUserId: app.workerId },
            })
          }
        }
      }
    })

    // Bildirim: her iki tarafa
    await createNotification({
      userId: dispute.openedBy,
      type: 'DISPUTE_RESOLVED',
      title: 'Anlaşmazlık Çözüldü',
      body: `"${dispute.job?.title}" işi için anlaşmazlık çözüldü. ${resolutionNote}`,
      data: { disputeId, resolution },
    })

    await createNotification({
      userId: dispute.againstId,
      type: 'DISPUTE_RESOLVED',
      title: 'Anlaşmazlık Çözüldü',
      body: `"${dispute.job?.title}" işi için anlaşmazlık çözüldü. ${resolutionNote}`,
      data: { disputeId, resolution },
    })

    return { disputeId, resolution, resolutionNote }
  }

  // ============================================================
  // 6. ÖDEME DURUMU
  // ============================================================

  /**
   * İşin ödeme durumunu getir
   */
  async getPaymentStatus(jobId: string, userId: string): Promise<any> {
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: {
        payments: true,
        applications: {
          where: {
            OR: [{ workerId: userId }, {}],
          },
        },
      },
    })

    if (!job) throw new ApiError('İş ilanı bulunamadı.', 404)

    // Yetki kontrolü
    const isEmployer = job.employerId === userId
    const isWorker = job.applications.some((a) => a.workerId === userId)
    if (!isEmployer && !isWorker) throw new ApiError('Yetkisiz.', 403)

    const payment = job.payments[0]
    const application = job.applications.find((a) => a.workerId === userId)

    return {
      jobId: job.id,
      jobTitle: job.title,
      escrowStatus: job.escrowStatus,
      escrowAmount: job.escrowAmount,
      platformFee: job.platformFee,
      payment: payment
        ? {
            id: payment.id,
            amount: payment.amount,
            platformFee: payment.platformFee,
            workerAmount: payment.workerAmount,
            status: payment.status,
            escrowFundedAt: payment.escrowFundedAt,
            releasedAt: payment.releasedAt,
          }
        : null,
      application: application
        ? {
            status: application.status,
            checkInAt: application.checkInAt,
            checkOutAt: application.checkOutAt,
            paidAt: application.paidAt,
            finalWage: application.finalWage,
          }
        : null,
    }
  }

  /**
   * Kullanıcının cüzdan bakiyesi
   */
  async getWallet(userId: string): Promise<any> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        walletBalance: true,
        walletLocked: true,
      },
    })

    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    return {
      balance: user.walletBalance,
      locked: user.walletLocked,
      available: user.walletBalance,
      total: user.walletBalance + user.walletLocked,
    }
  }

  /**
   * Kullanıcının tüm ödemeleri
   */
  async getMyPayments(userId: string): Promise<any[]> {
    const payments = await db.payment.findMany({
      where: {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
      },
      include: {
        job: { select: { id: true, title: true, city: true, district: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return payments.map((p) => ({
      id: p.id,
      jobId: p.jobId,
      jobTitle: p.job.title,
      amount: p.amount,
      platformFee: p.platformFee,
      workerAmount: p.workerAmount,
      status: p.status,
      type: p.type,
      role: p.fromUserId === userId ? 'EMPLOYER' : 'WORKER',
      escrowFundedAt: p.escrowFundedAt,
      releasedAt: p.releasedAt,
      refundedAt: p.refundedAt,
      createdAt: p.createdAt,
    }))
  }
}

export const paymentService = new PaymentService()
