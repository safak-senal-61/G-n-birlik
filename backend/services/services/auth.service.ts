/**
 * Auth Service - Kimlik doğrulama işlemleri
 * Nest.js tarzı service katmanı. Controller'lar bu servisi çağırır.
 */
import { db } from '@/lib/db'
import {
  generateToken,
  hashPassword,
  verifyPassword,
  validateEmail,
  validatePhone,
} from '@/server/lib/auth'
import { Prisma } from '@prisma/client'

export interface RegisterDTO {
  email: string
  password: string
  fullName: string
  phone?: string
  role: 'WORKER' | 'EMPLOYER'
  city?: string
  district?: string
  companyName?: string
}

export interface LoginDTO {
  email: string
  password: string
}

export class AuthService {
  async register(dto: RegisterDTO) {
    if (!validateEmail(dto.email)) {
      throw new ApiError('Geçerli bir e-posta adresi girin.', 400)
    }
    if (dto.password.length < 6) {
      throw new ApiError('Şifre en az 6 karakter olmalı.', 400)
    }
    if (dto.phone && !validatePhone(dto.phone)) {
      throw new ApiError('Geçerli bir telefon numarası girin. (Örn: +905321234567)', 400)
    }
    if (dto.role === 'EMPLOYER' && !dto.companyName) {
      throw new ApiError('İşveren olarak kayıt için şirket adı zorunludur.', 400)
    }

    const existing = await db.user.findUnique({ where: { email: dto.email.toLowerCase() } })
    if (existing) {
      throw new ApiError('Bu e-posta zaten kayıtlı.', 409)
    }

    if (dto.phone) {
      const existingPhone = await db.user.findUnique({ where: { phone: dto.phone } })
      if (existingPhone) {
        throw new ApiError('Bu telefon numarası zaten kayıtlı.', 409)
      }
    }

    const user = await db.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashPassword(dto.password),
        fullName: dto.fullName,
        phone: dto.phone,
        role: dto.role,
        city: dto.city,
        district: dto.district,
        companyName: dto.role === 'EMPLOYER' ? dto.companyName : null,
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      user: this.sanitizeUser(user),
      token,
    }
  }

  async login(dto: LoginDTO) {
    const user = await db.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    })

    if (!user || !verifyPassword(dto.password, user.password)) {
      throw new ApiError('E-posta veya şifre hatalı.', 401)
    }

    // Aktiflik güncelle
    await db.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      user: this.sanitizeUser(user),
      token,
    }
  }

  async getProfile(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        jobsPosted: { orderBy: { createdAt: 'desc' }, take: 5 },
        applications: {
          include: { job: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    return this.sanitizeUser(user)
  }

  async updateProfile(userId: string, data: any) {
    const allowed = [
      'fullName',
      'phone',
      'bio',
      'city',
      'district',
      'address',
      'latitude',
      'longitude',
      'skills',
      'experienceYears',
      'hourlyWageMin',
      'hourlyWageMax',
      'isAvailable',
      'companyName',
      'avatarUrl',
      'fcmToken',
    ]

    const updateData: any = {}
    for (const key of allowed) {
      if (data[key] !== undefined) {
        if (key === 'skills' && Array.isArray(data[key])) {
          updateData[key] = JSON.stringify(data[key])
        } else {
          updateData[key] = data[key]
        }
      }
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
    })

    return this.sanitizeUser(user)
  }

  private sanitizeUser(user: any) {
    const { password, ...rest } = user
    const safe: any = { ...rest }
    if (typeof safe.skills === 'string') {
      try {
        safe.skills = JSON.parse(safe.skills)
      } catch {
        safe.skills = []
      }
    } else if (safe.skills === null) {
      safe.skills = []
    }
    return safe
  }
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message)
  }
}

export const authService = new AuthService()
