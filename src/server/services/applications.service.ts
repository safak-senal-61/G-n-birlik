/**
 * Applications Service - İş başvuru işlemleri
 * Başvuru yapma, listeleme, durum güncelleme
 */
import { db } from '@/lib/db'
import { createNotification, safeJsonParse } from '@/server/lib/auth'
import { ApiError } from './auth.service'

export interface CreateApplicationDTO {
  jobId: string
  message?: string
  proposedWage?: number
}

export class ApplicationsService {
  async create(workerId: string, dto: CreateApplicationDTO) {
    const job = await db.job.findUnique({
      where: { id: dto.jobId },
      include: { employer: true },
    })

    if (!job) throw new ApiError('İş ilanı bulunamadı.', 404)
    if (job.status !== 'OPEN') {
      throw new ApiError('Bu ilana başvuru yapılamaz (ilan aktif değil).', 400)
    }
    if (job.employerId === workerId) {
      throw new ApiError('Kendi ilanınıza başvuramazsınız.', 400)
    }
    if (job.workDate < new Date()) {
      throw new ApiError('Geçmiş tarihli ilana başvuru yapılamaz.', 400)
    }

    const existing = await db.application.findUnique({
      where: { jobId_workerId: { jobId: dto.jobId, workerId } },
    })
    if (existing) {
      throw new ApiError('Bu ilana zaten başvurdunuz.', 409)
    }

    if (job.openingsFilled >= job.openingsTotal) {
      throw new ApiError('Bu ilan için tüm pozisyonlar dolu.', 400)
    }

    const application = await db.application.create({
      data: {
        jobId: dto.jobId,
        workerId,
        message: dto.message,
        proposedWage: dto.proposedWage,
        status: 'PENDING',
      },
      include: {
        job: true,
        worker: { select: { id: true, fullName: true, avatarUrl: true, ratingAvg: true, phone: true } },
      },
    })

    // İşverene bildirim
    await createNotification({
      userId: job.employerId,
      type: 'JOB_APPLIED',
      title: 'Yeni İş Başvurusu',
      body: `${application.worker.fullName} "${job.title}" ilanınıza başvurdu.`,
      data: { jobId: job.id, applicationId: application.id, workerId },
    })

    return this.transformApplication(application)
  }

  async listByWorker(workerId: string, status?: string) {
    const where: any = { workerId }
    if (status) where.status = status

    const apps = await db.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            employer: {
              select: {
                id: true,
                fullName: true,
                companyName: true,
                isVerified: true,
                ratingAvg: true,
                avatarUrl: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    return apps.map((a) => this.transformApplication(a))
  }

  async listByJob(jobId: string, employerId: string) {
    const job = await db.job.findUnique({ where: { id: jobId } })
    if (!job) throw new ApiError('İş ilanı bulunamadı.', 404)
    if (job.employerId !== employerId) {
      throw new ApiError('Bu ilanın başvurularını görme yetkiniz yok.', 403)
    }

    const apps = await db.application.findMany({
      where: { jobId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phone: true,
            bio: true,
            ratingAvg: true,
            ratingCount: true,
            experienceYears: true,
            skills: true,
            city: true,
            district: true,
            isAvailable: true,
          },
        },
      },
    })

    return apps.map((a) => this.transformApplication(a))
  }

  async listByEmployer(employerId: string, status?: string) {
    const where: any = { job: { employerId } }
    if (status) where.status = status

    const apps = await db.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { id: true, title: true, workDate: true, wageAmount: true, city: true, district: true } },
        worker: { select: { id: true, fullName: true, avatarUrl: true, ratingAvg: true, phone: true } },
      },
    })

    return apps.map((a) => this.transformApplication(a))
  }

  async updateStatus(
    applicationId: string,
    userId: string,
    userRole: string,
    newStatus: string,
    employerNote?: string
  ) {
    const app = await db.application.findUnique({
      where: { id: applicationId },
      include: { job: true, worker: true },
    })
    if (!app) throw new ApiError('Başvuru bulunamadı.', 404)

    const validStatuses = ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COMPLETED', 'NO_SHOW']
    if (!validStatuses.includes(newStatus)) {
      throw new ApiError('Geçersiz durum.', 400)
    }

    // Yetki kontrolü
    if (newStatus === 'WITHDRAWN') {
      if (userRole !== 'WORKER' || app.workerId !== userId) {
        throw new ApiError('Sadece başvuru sahibi geri çekebilir.', 403)
      }
    } else if (userRole === 'EMPLOYER' && app.job.employerId === userId) {
      // İşveren işlemi - ACCEPTED/REJECTED/COMPLETED/NO_SHOW
    } else {
      throw new ApiError('Bu işlem için yetkiniz yok.', 403)
    }

    // İşlem kuralları
    if (app.status === 'COMPLETED' || app.status === 'NO_SHOW') {
      throw new ApiError('Tamamlanmış başvurunun durumu değiştirilemez.', 400)
    }
    if (app.status === 'WITHDRAWN') {
      throw new ApiError('Geri çekilmiş başvuru güncellenemez.', 400)
    }

    const updated = await db.application.update({
      where: { id: applicationId },
      data: {
        status: newStatus,
        employerNote,
        respondedAt: ['ACCEPTED', 'REJECTED'].includes(newStatus) ? new Date() : app.respondedAt,
        completedAt: ['COMPLETED', 'NO_SHOW'].includes(newStatus) ? new Date() : null,
      },
      include: { job: true, worker: { select: { fullName: true, phone: true } } },
    })

    // Kabul edilirse openingsFilled artır
    if (newStatus === 'ACCEPTED') {
      await db.job.update({
        where: { id: app.jobId },
        data: { openingsFilled: { increment: 1 } },
      })
      // Tüm pozisyonlar dolduysa durumu FILLED yap
      const job = await db.job.findUnique({ where: { id: app.jobId } })
      if (job && job.openingsFilled >= job.openingsTotal) {
        await db.job.update({ where: { id: app.jobId }, data: { status: 'FILLED' } })
      }
    }

    // Bildirimler
    if (newStatus === 'ACCEPTED') {
      await createNotification({
        userId: app.workerId,
        type: 'APPLICATION_ACCEPTED',
        title: 'Başvurunuz Onaylandı! 🎉',
        body: `${app.job.employer ? '' : ''}"${app.job.title}" ilanına başvurunuz onaylandı.`,
        data: { jobId: app.jobId, applicationId },
      })
    } else if (newStatus === 'REJECTED') {
      await createNotification({
        userId: app.workerId,
        type: 'APPLICATION_REJECTED',
        title: 'Başvuru Durumu',
        body: `"${app.job.title}" ilanına başvurunuz reddedildi.`,
        data: { jobId: app.jobId, applicationId },
      })
    } else if (newStatus === 'WITHDRAWN') {
      await createNotification({
        userId: app.job.employerId,
        type: 'APPLICATION_WITHDRAWN',
        title: 'Başvuru Geri Çekildi',
        body: `"${app.job.title}" ilanınıza yapılan bir başvuru geri çekildi.`,
        data: { jobId: app.jobId, applicationId },
      })
    }

    return this.transformApplication(updated)
  }

  async rate(applicationId: string, userId: string, userRole: string, rating: number, comment?: string) {
    if (rating < 1 || rating > 5) {
      throw new ApiError('Puan 1-5 arası olmalı.', 400)
    }

    const app = await db.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    })
    if (!app) throw new ApiError('Başvuru bulunamadı.', 404)
    if (app.status !== 'COMPLETED') {
      throw new ApiError('Sadece tamamlanmış işler puanlanabilir.', 400)
    }

    let reviewType: string
    let reviewerId = userId
    let receiverId: string

    if (userRole === 'WORKER' && app.workerId === userId) {
      reviewType = 'WORKER_TO_EMPLOYER'
      receiverId = app.job.employerId
    } else if (userRole === 'EMPLOYER' && app.job.employerId === userId) {
      reviewType = 'EMPLOYER_TO_WORKER'
      receiverId = app.workerId
    } else {
      throw new ApiError('Bu işlem için yetkiniz yok.', 403)
    }

    // Daha önce puanlanmış mı?
    const existing = await db.review.findFirst({
      where: { applicationId, reviewerId },
    })
    if (existing) throw new ApiError('Bu başvuru zaten puanlanmış.', 400)

    const review = await db.review.create({
      data: {
        applicationId,
        jobId: app.jobId,
        reviewerId,
        receiverId,
        rating,
        comment,
        reviewType,
      },
    })

    // Alıcı ortalama puanını güncelle
    const reviews = await db.review.findMany({
      where: { receiverId },
      select: { rating: true },
    })
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    await db.user.update({
      where: { id: receiverId },
      data: { ratingAvg: Math.round(avg * 10) / 10, ratingCount: reviews.length },
    })

    return review
  }

  private transformApplication(app: any) {
    return {
      id: app.id,
      jobId: app.jobId,
      workerId: app.workerId,
      job: app.job,
      worker: app.worker,
      status: app.status,
      message: app.message,
      proposedWage: app.proposedWage,
      employerNote: app.employerNote,
      rating: app.rating,
      ratedAt: app.ratedAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      respondedAt: app.respondedAt,
      completedAt: app.completedAt,
      workerSkills: app.worker?.skills ? safeJsonParse<string[]>(app.worker.skills, []) : [],
    }
  }
}

export const applicationsService = new ApplicationsService()
