/**
 * QR Check-in/Check-out Service
 *
 * İşveren işçiyi işe alır (ACCEPTED), iş günü geldiğinde:
 *  1. CHECK_IN QR üretir → işçi tarar → IN_PROGRESS
 *  2. İş bitiminde CHECK_OUT QR üretir → işçi tarar → COMPLETED + payment
 *
 * QR 5 dakika geçerli, tek kullanımlık. Token crypto.randomBytes ile üretilir.
 * QR içeriği: { type, token, applicationId, expiresAt }
 */
import { db } from '@/lib/db'
import { createNotification } from '@/server/lib/auth'
import { ApiError } from './auth.service'
import { applicationsService } from './applications.service'
import { walletService } from './wallet.service'
import QRCode from 'qrcode'
import crypto from 'crypto'

const QR_EXPIRY_MINUTES = 5

export interface QrPayload {
  type: 'CHECK_IN' | 'CHECK_OUT'
  token: string
  applicationId: string
  expiresAt: string
}

export class QrCheckinService {
  /**
   * İşveren için check-in veya check-out QR kodu üretir
   * Sadece application'ın sahibi işveren üretebilir
   */
  async generateQrCode(params: {
    applicationId: string
    employerId: string
    type: 'CHECK_IN' | 'CHECK_OUT'
  }): Promise<{
    qrId: string
    token: string
    qrImageDataUrl: string
    expiresAt: Date
    type: string
    application: any
  }> {
    const { applicationId, employerId, type } = params

    // Application'ı getir
    const app = await db.application.findUnique({
      where: { id: applicationId },
      include: { job: true, worker: { select: { id: true, fullName: true, avatarUrl: true } } },
    })
    if (!app) throw new ApiError('Başvuru bulunamadı.', 404)

    // Yetki kontrolü - sadece işveren üretebilir
    if (app.job.employerId !== employerId) {
      throw new ApiError('Bu işlem için yetkiniz yok.', 403)
    }

    // Durum kontrolleri
    if (type === 'CHECK_IN') {
      if (app.status !== 'ACCEPTED') {
        throw new ApiError(
          `Check-in QR üretmek için başvuru ACCEPTED durumunda olmalı. Mevcut: ${app.status}`,
          400
        )
      }
    } else if (type === 'CHECK_OUT') {
      if (app.status !== 'IN_PROGRESS') {
        throw new ApiError(
          `Check-out QR üretmek için başvuru IN_PROGRESS durumunda olmalı. Mevcut: ${app.status}`,
          400
        )
      }
    }

    // Eski aktif QR'ları pasif yap (expire et)
    await db.qrCheckin.updateMany({
      where: {
        applicationId,
        type,
        status: 'ACTIVE',
      },
      data: { status: 'EXPIRED' },
    })

    // Yeni token üret
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000)

    // QR payload (işçi taradığında bu veriyi gönderecek)
    const payload: QrPayload = {
      type,
      token,
      applicationId,
      expiresAt: expiresAt.toISOString(),
    }

    // QR kodu base64 PNG olarak üret
    const qrImageDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 320,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })

    // DB'ye kaydet
    const qr = await db.qrCheckin.create({
      data: {
        applicationId,
        jobId: app.jobId,
        workerId: app.workerId,
        employerId,
        token,
        type,
        qrImageDataUrl,
        expiresAt,
        status: 'ACTIVE',
      },
    })

    return {
      qrId: qr.id,
      token,
      qrImageDataUrl,
      expiresAt,
      type,
      application: {
        id: app.id,
        status: app.status,
        worker: app.worker,
        job: {
          id: app.job.id,
          title: app.job.title,
          workDate: app.job.workDate,
          startTime: app.job.startTime,
          endTime: app.job.endTime,
          wageAmount: app.job.wageAmount,
          wageType: app.job.wageType,
        },
      },
    }
  }

  /**
   * İşçi (veya işveren) QR tarar
   * Token doğrulanır, süre kontrol edilir, application durumu güncellenir
   */
  async scanQrCode(params: {
    token: string
    scannedById: string
    scannedByRole: string
  }): Promise<{
    success: boolean
    type: string
    newStatus: string
    application: any
    message: string
  }> {
    const { token, scannedById, scannedByRole } = params

    if (!token || token.length < 10) {
      throw new ApiError('Geçersiz QR kodu.', 400)
    }

    // QR'ı bul
    const qr = await db.qrCheckin.findUnique({
      where: { token },
      include: {
        application: {
          include: {
            job: true,
            worker: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    })

    if (!qr) {
      throw new ApiError('QR kodu bulunamadı.', 404)
    }

    // Status kontrolü
    if (qr.status === 'USED') {
      throw new ApiError('Bu QR kodu zaten kullanılmış.', 400)
    }
    if (qr.status === 'EXPIRED') {
      throw new ApiError('Bu QR kodunun süresi dolmuş.', 400)
    }

    // Süre kontrolü
    if (qr.expiresAt < new Date()) {
      await db.qrCheckin.update({
        where: { id: qr.id },
        data: { status: 'EXPIRED' },
      })
      throw new ApiError('QR kodunun süresi dolmuş. Yeni QR talep edin.', 400)
    }

    // Yetki kontrolü:
    // - Worker kendi application'ını tarayabilir
    // - Employer kendi ilanının application'ını tarayabilir
    const isWorker = scannedById === qr.workerId
    const isEmployer = scannedById === qr.employerId
    if (!isWorker && !isEmployer) {
      throw new ApiError('Bu QR kodunu tarama yetkiniz yok.', 403)
    }

    // Application durum kontrolü
    const app = qr.application
    let newStatus: string
    let message: string

    if (qr.type === 'CHECK_IN') {
      if (app.status !== 'ACCEPTED') {
        throw new ApiError(
          `Check-in için başvuru ACCEPTED olmalı. Mevcut durum: ${app.status}`,
          400
        )
      }
      newStatus = 'IN_PROGRESS'
      message = `İşe başladınız: "${app.job.title}"`
    } else if (qr.type === 'CHECK_OUT') {
      if (app.status !== 'IN_PROGRESS') {
        throw new ApiError(
          `Check-out için başvuru IN_PROGRESS olmalı. Mevcut durum: ${app.status}`,
          400
        )
      }
      newStatus = 'COMPLETED'
      message = `İş tamamlandı: "${app.job.title}". Ödeme talebi oluşturuldu.`
    } else {
      throw new ApiError('Geçersiz QR tipi.', 400)
    }

    // Transaction: QR'ı used yap + application status güncelle
    await db.$transaction([
      db.qrCheckin.update({
        where: { id: qr.id },
        data: {
          status: 'USED',
          usedAt: new Date(),
          scannedById,
        },
      }),
      db.application.update({
        where: { id: app.id },
        data: {
          status: newStatus,
          ...(newStatus === 'COMPLETED' && { completedAt: new Date() }),
        },
      }),
    ])

    // CHECK_OUT ise ödeme talebi oluştur ve emanetten işçiye aktar
    if (newStatus === 'COMPLETED') {
      const existingPayment = await db.payment.findFirst({
        where: { applicationId: app.id },
      })
      if (!existingPayment) {
        await db.payment.create({
          data: {
            applicationId: app.id,
            jobId: app.jobId,
            workerId: app.workerId,
            employerId: qr.employerId,
            amount: app.job.wageAmount,
            wageType: app.job.wageType,
            status: 'COMPLETED',
          },
        })
      }

      // Emanette para varsa işçinin cüzdanına otomatik serbest bırak
      const currentJob = await db.job.findUnique({ where: { id: app.jobId } })
      if (currentJob && currentJob.escrowStatus === 'HELD' && currentJob.escrowAmount > 0) {
        try {
          const payoutAmount = Math.min(app.job.wageAmount, currentJob.escrowAmount)
          await walletService.releaseEscrow({
            jobId: app.jobId,
            workerId: app.workerId,
            employerId: qr.employerId,
            amount: payoutAmount,
          })
        } catch (e) {
          console.error('Check-out emanet aktarım hatası:', e)
        }
      }
    }

    // Bildirimler
    if (newStatus === 'IN_PROGRESS') {
      // İşçiye: işe başladı
      await createNotification({
        userId: app.workerId,
        type: 'WORK_STARTED',
        title: 'İşe Başladınız ✅',
        body: `"${app.job.title}" işine başladınız. İş bitiminde check-out yapmayı unutmayın.`,
        data: { applicationId: app.id, jobId: app.jobId },
      })
      // İşverene: işçi işe başladı
      await createNotification({
        userId: qr.employerId,
        type: 'WORK_STARTED',
        title: 'İşçi İşe Başladı ✅',
        body: `${app.worker.fullName} "${app.job.title}" işine başladı.`,
        data: { applicationId: app.id, jobId: app.jobId },
      })
    } else if (newStatus === 'COMPLETED') {
      // İşçiye: iş tamamlandı
      await createNotification({
        userId: app.workerId,
        type: 'WORK_COMPLETED',
        title: 'İş Tamamlandı 🎉',
        body: `"${app.job.title}" işini tamamladınız. ${app.job.wageAmount}₺ ödemeniz admin onayı bekliyor.`,
        data: { applicationId: app.id, jobId: app.jobId },
      })
      // İşverene: iş tamamlandı
      await createNotification({
        userId: qr.employerId,
        type: 'WORK_COMPLETED',
        title: 'İş Tamamlandı 🎉',
        body: `${app.worker.fullName} "${app.job.title}" işini tamamladı. ${app.job.wageAmount}₺ ödeme talebi oluşturuldu.`,
        data: { applicationId: app.id, jobId: app.jobId },
      })
      // Admin'lere bildirim (yeni ödeme talebi)
      const admins = await db.user.findMany({
        where: { role: 'ADMIN', isPermanentlyBanned: false, isSuspended: false },
        select: { id: true },
      })
      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          type: 'PAYMENT_PENDING',
          title: 'Yeni Ödeme Talebi 💰',
          body: `"${app.job.title}" işi tamamlandı. ${app.job.wageAmount}₺ ödeme onayı bekliyor.`,
          data: { applicationId: app.id, jobId: app.jobId },
        })
      }
    }

    return {
      success: true,
      type: qr.type,
      newStatus,
      application: {
        id: app.id,
        status: newStatus,
        worker: app.worker,
        job: {
          id: app.job.id,
          title: app.job.title,
          wageAmount: app.job.wageAmount,
          wageType: app.job.wageType,
        },
      },
      message,
    }
  }

  /**
   * Bir application için aktif QR var mı kontrol et
   */
  async getActiveQr(applicationId: string, userId: string) {
    const app = await db.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    })
    if (!app) throw new ApiError('Başvuru bulunamadı.', 404)

    // Yetki: worker veya employer görebilir
    if (app.workerId !== userId && app.job.employerId !== userId) {
      throw new ApiError('Bu işlem için yetkiniz yok.', 403)
    }

    const activeQrs = await db.qrCheckin.findMany({
      where: {
        applicationId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        token: true,
        qrImageDataUrl: true,
        expiresAt: true,
        createdAt: true,
      },
    })

    // Son kullanılan QR'ı da getir (geçmiş için)
    const lastUsedQr = await db.qrCheckin.findFirst({
      where: { applicationId, status: 'USED' },
      orderBy: { usedAt: 'desc' },
      select: {
        id: true,
        type: true,
        usedAt: true,
        scannedById: true,
      },
    })

    return {
      activeQrs,
      lastUsedQr,
      applicationStatus: app.status,
    }
  }
}

export const qrCheckinService = new QrCheckinService()
