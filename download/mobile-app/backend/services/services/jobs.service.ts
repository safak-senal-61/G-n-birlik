/**
 * Jobs Service - İş ilanı işlemleri
 * Liste, detay, oluşturma, güncelleme, konum bazlı arama
 */
import { db } from '@/lib/db'
import { calculateDistance, safeJsonParse } from '@/server/lib/auth'
import { ApiError } from './auth.service'

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

    const where: any = { status: query.status || 'OPEN' }
    
    if (query.category) where.category = query.category
    if (query.city) where.city = query.city
    if (query.district) where.district = query.district
    if (query.employerId) where.employerId = query.employerId
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

    // Konum bazlı filtreleme + mesafe hesabı
    let enrichedJobs = jobs.map((j) => this.transformJob(j))
    if (query.lat !== undefined && query.lng !== undefined) {
      const radius = query.radiusKm || 50
      enrichedJobs = enrichedJobs
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

      if (query.sortBy === 'NEAREST') {
        enrichedJobs.sort((a, b) => a.distanceKm - b.distanceKm)
      }
    }

    return {
      items: enrichedJobs,
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

    const job = await db.job.create({
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
      },
      include: { employer: { select: { fullName: true, companyName: true } } },
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
    const existing = await db.job.findUnique({ where: { id } })
    if (!existing) throw new ApiError('İş ilanı bulunamadı.', 404)
    if (existing.employerId !== employerId) {
      throw new ApiError('Yetkisiz işlem.', 403)
    }

    const validStatuses = ['OPEN', 'FILLED', 'CLOSED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      throw new ApiError('Geçersiz durum.', 400)
    }

    const job = await db.job.update({ where: { id }, data: { status } })
    return this.transformJob(job)
  }

  async delete(id: string, employerId: string) {
    const existing = await db.job.findUnique({ where: { id } })
    if (!existing) throw new ApiError('İş ilanı bulunamadı.', 404)
    if (existing.employerId !== employerId) {
      throw new ApiError('Yetkisiz işlem.', 403)
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
