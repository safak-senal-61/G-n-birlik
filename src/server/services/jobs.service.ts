/**
 * Jobs Service - İş ilanı işlemleri
 * Liste, detay, oluşturma, güncelleme, konum bazlı arama
 */
import { db } from '@/lib/db'
import { calculateDistance, safeJsonParse, createNotification } from '@/server/lib/auth'
import { ApiError } from './auth.service'
import { walletService } from './wallet.service'

export interface CreateJobDTO {
  title: string
  description: string
  category: string
  requiredSkills?: string[]
  workDate: string
  startTime: string
  endTime: string
  durationHours: number
  wageAmount: number
  wageType?: 'HOURLY' | 'DAILY' | 'FIXED'
  isWageNegotiable?: boolean
  city: string
  district: string
  address?: string
  latitude: number
  longitude: number
  locationNote?: string
  openingsTotal: number
  urgency?: string
}

export interface JobQuery {
  page?: number
  pageSize?: number
  category?: string
  city?: string
  district?: string
  status?: string
  search?: string
  lat?: number
  lng?: number
  radiusKm?: number
  minWage?: number
  maxWage?: number
  workDateFrom?: string
  workDateTo?: string
  employerId?: string
  sortBy?: 'NEWEST' | 'OLDEST' | 'WAGE_HIGH' | 'WAGE_LOW' | 'NEAREST' | 'URGENT'
}

export class JobsService {
  async list(query: JobQuery) {
    const page = Math.max(1, query.page || 1)
    const pageSize = Math.min(50, Math.max(1, query.pageSize || 10))
    const skip = (page - 1) * pageSize

    // employerId verilirse (kullanıcı kendi ilanlarını görüyor) tüm durumları göster
    // yoksa (herkese açık liste) sadece APPROVED ilanlar
    const where: any = {}
    if (query.employerId) {
      where.employerId = query.employerId
      if (query.status) where.status = query.status
    } else {
      where.status = query.status || 'OPEN'
      where.approvalStatus = 'APPROVED'
    }
    
    if (query.category) where.category = query.category
    if (query.city && query.city !== 'ALL') where.city = query.city
    if (query.district) where.district = query.district
    if (query.minWage || query.maxWage) {
      where.wageAmount = {}
      if (query.minWage) where.wageAmount.gte = query.minWage
      if (query.maxWage) where.wageAmount.lte = query.maxWage
    }
    if (query.workDateFrom || query.workDateTo) {
      where.workDate = {}
      if (query.workDateFrom) where.workDate.gte = new Date(query.workDateFrom)
      if (query.workDateTo) where.workDate.lte = new Date(query.workDateTo)
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { description: { contains: query.search } },
      ]
    }

    let orderBy: any = { createdAt: 'desc' }
    if (query.sortBy === 'OLDEST') orderBy = { createdAt: 'asc' }
    else if (query.sortBy === 'WAGE_HIGH') orderBy = { wageAmount: 'desc' }
    else if (query.sortBy === 'WAGE_LOW') orderBy = { wageAmount: 'asc' }
    else if (query.sortBy === 'URGENT') orderBy = [{ urgency: 'desc' }, { createdAt: 'desc' }]

    // Konum bazlı arama (GPS lat/lng varsa)
    const hasGeo = query.lat !== undefined && query.lng !== undefined
    if (hasGeo) {
      const radius = query.radiusKm || 50
      const allCandidates = await db.job.findMany({
        where,
        orderBy,
        include: {
          employer: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              isVerified: true,
              ratingAvg: true,
              ratingCount: true,
              avatarUrl: true,
            },
          },
          _count: { select: { applications: true } },
        },
      })

      let enrichedJobs = allCandidates
        .map((j) => this.transformJob(j))
        .map((j) => ({
          ...j,
          distanceKm: calculateDistance(
            query.lat!,
            query.lng!,
            j.latitude,
            j.longitude
          ),
        }))
        .filter((j) => j.distanceKm <= radius)

      if (query.sortBy === 'NEAREST' || !query.sortBy) {
        enrichedJobs.sort((a, b) => a.distanceKm - b.distanceKm)
      }

      const totalGeo = enrichedJobs.length
      const pagedJobs = enrichedJobs.slice(skip, skip + pageSize)

      return {
        items: pagedJobs,
        pagination: {
          page,
          pageSize,
          total: totalGeo,
          totalPages: Math.ceil(totalGeo / pageSize),
          hasNext: page * pageSize < totalGeo,
          hasPrev: page > 1,
        },
      }
    }

    // Normal (Konum dışı) arama
    const [jobs, total] = await Promise.all([
      db.job.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          employer: {
            select: {
              id: true,
              fullName: true,
              companyName: true,
              isVerified: true,
              ratingAvg: true,
              ratingCount: true,
              avatarUrl: true,
            },
          },
          _count: { select: { applications: true } },
        },
      }),
      db.job.count({ where }),
    ])

    return {
      items: jobs.map((j) => this.transformJob(j)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrev: page > 1,
      },
    }
  }

  async getById(id: string, viewerId?: string) {
    const job = await db.job.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            isVerified: true,
            ratingAvg: true,
            ratingCount: true,
            avatarUrl: true,
            phone: true,
            bio: true,
          },
        },
        applications: viewerId
          ? {
              where: { workerId: viewerId },
              select: { id: true, status: true, createdAt: true },
            }
          : false,
        _count: {
          select: { applications: true, savedBy: true },
        },
      },
    })

    if (!job) throw new ApiError('İş ilanı bulunamadı.', 404)

    // Görüntülenme artır
    await db.job.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })

    return this.transformJob(job)
  }

  async create(employerId: string, dto: CreateJobDTO) {
    // Validation
    if (!dto.title || dto.title.length < 5) {
      throw new ApiError('İlan başlığı en az 5 karakter olmalı.', 400)
    }
    if (!dto.description || dto.description.length < 20) {
      throw new ApiError('İlan açıklaması en az 20 karakter olmalı.', 400)
    }
    if (dto.wageAmount <= 0) {
      throw new ApiError('Ücret 0\'dan büyük olmalı.', 400)
    }
    if (dto.openingsTotal < 1) {
      throw new ApiError('Açık pozisyon sayısı en az 1 olmalı.', 400)
    }
    if (!dto.latitude || !dto.longitude) {
      throw new ApiError('Konum bilgisi zorunludur.', 400)
    }

    const workDate = new Date(dto.workDate)
    if (isNaN(workDate.getTime())) {
      throw new ApiError('Geçersiz iş tarihi.', 400)
    }
    if (workDate < new Date()) {
      throw new ApiError('İş tarihi geçmiş bir tarih olamaz.', 400)
    }

    // İşverenin cüzdan bakiyesini kontrol et
    const employer = await db.user.findUnique({
      where: { id: employerId },
      select: { id: true, role: true, walletBalance: true, fullName: true, companyName: true },
    })
    if (!employer) throw new ApiError('İşveren bulunamadı.', 404)

    const openings = Math.max(1, Number(dto.openingsTotal) || 1)
    const requiredEscrow = Number(dto.wageAmount) * openings

    if (employer.role === 'EMPLOYER' || employer.role === 'ADMIN') {
      if (employer.walletBalance < requiredEscrow) {
        throw new ApiError(
          `Yetersiz bakiye! Bu ilan için ${requiredEscrow.toLocaleString('tr-TR')} ₺ iş emanet bütçesi gereklidir. Mevcut cüzdan bakiyeniz: ${employer.walletBalance.toLocaleString('tr-TR')} ₺. Lütfen cüzdanınıza para yatırın.`,
          400
        )
      }
    }

    const approvalStatus = 'APPROVED'
    const balanceAfter = Math.max(0, employer.walletBalance - requiredEscrow)

    // İlanı oluştur ve emanet tutarını cüzdandan bloke et (Atomik Transaction)
    const [job] = await db.$transaction([
      db.job.create({
        data: {
          employerId,
          title: dto.title,
          description: dto.description,
          category: dto.category,
          requiredSkills: dto.requiredSkills ? JSON.stringify(dto.requiredSkills) : null,
          workDate,
          startTime: dto.startTime,
          endTime: dto.endTime,
          durationHours: dto.durationHours,
          wageAmount: dto.wageAmount,
          wageType: dto.wageType || 'DAILY',
          currency: 'TRY',
          isWageNegotiable: dto.isWageNegotiable || false,
          city: dto.city,
          district: dto.district,
          address: dto.address,
          latitude: dto.latitude,
          longitude: dto.longitude,
          locationNote: dto.locationNote,
          openingsTotal: dto.openingsTotal,
          openingsFilled: 0,
          status: 'OPEN',
          urgency: dto.urgency || 'NORMAL',
          approvalStatus,
          approvedAt: new Date(),
          escrowAmount: requiredEscrow,
          escrowStatus: 'HELD',
          escrowHeldAt: new Date(),
        },
        include: { employer: { select: { fullName: true, companyName: true, isVerified: true } } },
      }),
      db.user.update({
        where: { id: employerId },
        data: {
          walletBalance: balanceAfter,
          walletUpdatedAt: new Date(),
        },
      }),
      db.walletTransaction.create({
        data: {
          userId: employerId,
          type: 'JOB_PAYMENT',
          amount: -requiredEscrow,
          balanceAfter,
          description: `İş ilanı emaneti ayrıldı: "${dto.title}" (${openings} kişi x ${dto.wageAmount}₺)`,
          status: 'COMPLETED',
        },
      }),
    ])

    // İşverene bilgilendirme bildirimi gönder
    await createNotification({
      userId: employerId,
      type: 'WALLET_DEPOSIT',
      title: 'İlan Açıldı & Bakiye Emanete Alındı 🔒',
      body: `"${dto.title}" ilanınız için ${requiredEscrow.toLocaleString('tr-TR')} ₺ iş güvencesi olarak emanete alındı. Kalan bakiyeniz: ${balanceAfter.toLocaleString('tr-TR')} ₺.`,
      data: { jobId: job.id },
    })

    return this.transformJob(job)
  }

  async update(id: string, employerId: string, dto: Partial<CreateJobDTO>) {
    const existing = await db.job.findUnique({ where: { id } })
    if (!existing) throw new ApiError('İş ilanı bulunamadı.', 404)
    if (existing.employerId !== employerId) {
      throw new ApiError('Bu ilanı düzenleme yetkiniz yok.', 403)
    }
    if (existing.status === 'CLOSED') {
      throw new ApiError('Kapalı ilan düzenlenemez.', 400)
    }

    const allowed: (keyof CreateJobDTO)[] = [
      'title', 'description', 'category', 'requiredSkills',
      'workDate', 'startTime', 'endTime', 'durationHours',
      'wageAmount', 'wageType', 'isWageNegotiable',
      'city', 'district', 'address', 'latitude', 'longitude',
      'locationNote', 'openingsTotal', 'urgency',
    ]
    const updateData: any = {}
    for (const key of allowed) {
      if (dto[key] !== undefined) {
        if (key === 'requiredSkills' && Array.isArray(dto[key])) {
          updateData[key] = JSON.stringify(dto[key])
        } else if (key === 'workDate') {
          updateData[key] = new Date(dto[key] as string)
        } else {
          updateData[key] = dto[key]
        }
      }
    }

    const job = await db.job.update({ where: { id }, data: updateData })
    return this.transformJob(job)
  }

  async updateStatus(id: string, employerId: string, status: string) {
    const existing = await db.job.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            worker: {
              select: { id: true, fullName: true, phone: true, walletBalance: true },
            },
          },
        },
      },
    })
    if (!existing) throw new ApiError('İş ilanı bulunamadı.', 404)
    if (existing.employerId !== employerId) {
      throw new ApiError('Yetkisiz işlem.', 403)
    }

    const validStatuses = ['OPEN', 'FILLED', 'CLOSED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      throw new ApiError('Geçersiz durum.', 400)
    }

    // Devam eden (IN_PROGRESS - QR check-in yapılmış) çalışan kontrolü
    const inProgressApps = existing.applications.filter((a) => a.status === 'IN_PROGRESS')
    if (status === 'CANCELLED' && inProgressApps.length > 0) {
      throw new ApiError(
        'İşçi check-in yapmış ve mesai başlamıştır. Devam eden bir iş tek taraflı iptal edilemez! İş bittiğinde ödeme onaylanmalı veya uyuşmazlık bildirilmelidir.',
        400
      )
    }

    // Tamamlanmış iş kontrolü
    const completedApps = existing.applications.filter((a) => a.status === 'COMPLETED')
    if (status === 'CANCELLED' && completedApps.length > 0) {
      throw new ApiError('Tamamlanmış veya ödemesi yapılmış olan bir iş ilanı iptal edilemez.', 400)
    }

    // İlan iptal ediliyorsa
    if (status === 'CANCELLED') {
      const acceptedApps = existing.applications.filter((a) => a.status === 'ACCEPTED')

      if (acceptedApps.length > 0) {
        // İşe başlama saatine kalan süreyi hesapla
        const jobStart = new Date(existing.workDate)
        if (existing.startTime) {
          const [h, m] = existing.startTime.split(':').map(Number)
          if (!isNaN(h)) jobStart.setHours(h, isNaN(m) ? 0 : m, 0, 0)
        }
        const now = new Date()
        const diffHours = (jobStart.getTime() - now.getTime()) / (1000 * 60 * 60)

        // Son 12 saat içinde iptal veya iş günü iptali (Ahmet yola çıkmış olabilir)
        const isLateCancel = diffHours < 12

        if (isLateCancel && existing.escrowStatus === 'HELD' && existing.escrowAmount > 0) {
          // İşçi başına yol ve zaman tazminatı (%30 veya asgari 250₺, emanet payını aşmayacak)
          const compPerWorker = Math.min(
            Math.max(250, Math.round(existing.wageAmount * 0.3)),
            Math.floor(existing.escrowAmount / acceptedApps.length)
          )
          const totalCompensation = compPerWorker * acceptedApps.length
          const remainingEscrow = Math.max(0, existing.escrowAmount - totalCompensation)

          for (const app of acceptedApps) {
            const workerBalanceAfter = app.worker.walletBalance + compPerWorker

            await db.$transaction([
              db.user.update({
                where: { id: app.workerId },
                data: { walletBalance: workerBalanceAfter, walletUpdatedAt: new Date() },
              }),
              db.walletTransaction.create({
                data: {
                  userId: app.workerId,
                  type: 'JOB_PAYMENT',
                  amount: compPerWorker,
                  balanceAfter: workerBalanceAfter,
                  description: `Son dakika iş iptali yol/zaman tazminatı - ${existing.title}`,
                  status: 'COMPLETED',
                  jobId: existing.id,
                  applicationId: app.id,
                  counterpartyId: employerId,
                },
              }),
              db.application.update({
                where: { id: app.id },
                data: {
                  status: 'REJECTED',
                  employerNote: `İşveren tarafından son anda iptal edildi (${compPerWorker.toLocaleString('tr-TR')}₺ yol tazminatı ödendi)`,
                },
              }),
            ])

            // İşçiye bildirim
            await createNotification({
              userId: app.workerId,
              type: 'JOB_CANCELLED',
              title: 'İş Son Anda İptal Edildi - Tazminat Yatırıldı ⚠️',
              body: `"${existing.title}" işi işveren tarafından son anda iptal edildi. Mağduriyetiniz için ${compPerWorker.toLocaleString('tr-TR')}₺ yol ve zaman tazminatı cüzdanınıza aktarıldı.`,
              data: { jobId: existing.id, compensation: compPerWorker },
            })
          }

          // Kalan emaneti işverene iade et
          if (remainingEscrow > 0) {
            await walletService.refundEscrow({
              jobId: id,
              employerId,
              amount: remainingEscrow,
              reason: `Son dakika iptal (işçi yol tazminatları düşüldükten sonra kalan: ${remainingEscrow.toLocaleString('tr-TR')}₺)`,
            })
          } else {
            await db.job.update({
              where: { id },
              data: { escrowStatus: 'REFUNDED', escrowRefundedAt: new Date() },
            })
          }

          // İşverene bildirim
          await createNotification({
            userId: employerId,
            type: 'JOB_CANCELLED',
            title: 'İlan İptal Edildi (Tazminat Kesildi) ⚠️',
            body: `Onaylı işçiniz varken son anda iptal ettiğiniz için ${totalCompensation.toLocaleString('tr-TR')}₺ yol tazminatı emanetten kesilerek işçiye aktarıldı. Kalan ${remainingEscrow.toLocaleString('tr-TR')}₺ cüzdanınıza iade edildi.`,
            data: { jobId: existing.id },
          })
        } else {
          // Erken iptal (>= 12 saat) veya emanet yok
          for (const app of acceptedApps) {
            await db.application.update({
              where: { id: app.id },
              data: {
                status: 'REJECTED',
                employerNote: 'İşveren tarafından önceden iptal edildi',
              },
            })
            await createNotification({
              userId: app.workerId,
              type: 'JOB_CANCELLED',
              title: 'İş İlanı İptal Edildi ℹ️',
              body: `"${existing.title}" işi işveren tarafından iptal edildi. Başvurabileceğiniz diğer güncel ilanlara göz atabilirsiniz.`,
              data: { jobId: existing.id },
            })
          }

          if (existing.escrowStatus === 'HELD' && existing.escrowAmount > 0) {
            await walletService.refundEscrow({
              jobId: id,
              employerId,
              amount: existing.escrowAmount,
              reason: 'İş ilanı işveren tarafından iptal edildi',
            })
          }
        }
      } else {
        // Kabul edilmiş işçi yoksa emaneti doğrudan iade et
        if (existing.escrowStatus === 'HELD' && existing.escrowAmount > 0) {
          await walletService.refundEscrow({
            jobId: id,
            employerId,
            amount: existing.escrowAmount,
            reason: 'İş ilanı işveren tarafından iptal edildi',
          })
        }
      }

      // Beklemedeki başvuruları bilgilendir
      const pendingApps = existing.applications.filter((a) => a.status === 'PENDING')
      for (const p of pendingApps) {
        await createNotification({
          userId: p.workerId,
          type: 'JOB_CANCELLED',
          title: 'İlan İptal Edildi',
          body: `Başvurduğunuz "${existing.title}" ilanı işveren tarafından iptal edildi.`,
          data: { jobId: existing.id },
        })
      }
    }

    const job = await db.job.update({ where: { id }, data: { status } })
    return this.transformJob(job)
  }

  async delete(id: string, employerId: string) {
    const existing = await db.job.findUnique({
      where: { id },
      include: { applications: true },
    })
    if (!existing) throw new ApiError('İş ilanı bulunamadı.', 404)
    if (existing.employerId !== employerId) {
      throw new ApiError('Yetkisiz işlem.', 403)
    }

    // Onaylanmış, devam eden veya tamamlanmış çalışanı olan ilanlar SİLİNEMEZ!
    const activeOrDone = existing.applications.filter((a) =>
      ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status)
    )
    if (activeOrDone.length > 0) {
      throw new ApiError(
        'Onaylanmış veya devam eden çalışanı olan ilanlar silinemez! İşçi haklarının ve sözleşme kaydının korunması için bu ilanı silemezsiniz. İptal etmek isterseniz lütfen Durum Değiştir menüsünden "İptal Et" seçeneğini kullanın.',
        400
      )
    }

    // Silinen ilanda emanet tutuluyorsa işverene iade et
    if (existing.escrowStatus === 'HELD' && existing.escrowAmount > 0) {
      await walletService.refundEscrow({
        jobId: id,
        employerId,
        amount: existing.escrowAmount,
        reason: 'İş ilanı silindi',
      })
    }

    await db.job.delete({ where: { id } })
    return { id }
  }

  async saveJob(userId: string, jobId: string) {
    const job = await db.job.findUnique({ where: { id: jobId } })
    if (!job) throw new ApiError('İş ilanı bulunamadı.', 404)

    try {
      return await db.savedJob.create({ data: { userId, jobId } })
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Already saved - remove
        await db.savedJob.delete({ where: { userId_jobId: { userId, jobId } } })
        return { removed: true }
      }
      throw e
    }
  }

  async listSaved(userId: string) {
    const saved = await db.savedJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { job: { include: { employer: { select: { fullName: true, companyName: true, isVerified: true } } } } },
    })
    return saved.map((s) => this.transformJob(s.job))
  }

  async getCategories() {
    return [
      { value: 'INSAAT', label: 'İnşaat & Yapı', icon: 'building' },
      { value: 'RESTAURANT', label: 'Restoran & Gastronomi', icon: 'utensils' },
      { value: 'TEMIZLIK', label: 'Temizlik & Hijyen', icon: 'sparkles' },
      { value: 'NAKLIYE', label: 'Nakliyat & Lojistik', icon: 'truck' },
      { value: 'TARIM', label: 'Tarım & Hayvancılık', icon: 'leaf' },
      { value: 'TEKNIK', label: 'Teknik & Servis', icon: 'wrench' },
      { value: 'SAGLIK', label: 'Sağlık & Bakım', icon: 'heart' },
      { value: 'DIGER', label: 'Diğer', icon: 'briefcase' },
    ]
  }

  private transformJob(job: any) {
    return {
      id: job.id,
      employerId: job.employerId,
      employer: job.employer,
      title: job.title,
      description: job.description,
      category: job.category,
      requiredSkills: safeJsonParse<string[]>(job.requiredSkills, []),
      workDate: job.workDate,
      startTime: job.startTime,
      endTime: job.endTime,
      durationHours: job.durationHours,
      wageAmount: job.wageAmount,
      wageType: job.wageType,
      currency: job.currency,
      isWageNegotiable: job.isWageNegotiable,
      city: job.city,
      district: job.district,
      address: job.address,
      latitude: job.latitude,
      longitude: job.longitude,
      locationNote: job.locationNote,
      openingsTotal: job.openingsTotal,
      openingsFilled: job.openingsFilled,
      status: job.status,
      urgency: job.urgency,
      viewCount: job.viewCount,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      applicationCount: job._count?.applications || 0,
      savedCount: job._count?.savedBy || 0,
      myApplication: job.applications?.[0] || null,
    }
  }
}

export const jobsService = new JobsService()
