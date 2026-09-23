/**
 * Backend yardımcı fonksiyonları - Nest.js tarzı mimari
 * Tüm API servisleri ve controller'lar bu kütüphaneleri kullanır.
 *
 * GÜVENLİK: bcrypt + jsonwebtoken kullanır (production-ready)
 */
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// ====================================================================
// JWT Token Sistemi (gerçek jsonwebtoken)
// ====================================================================

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat: number
  exp: number
}

const TOKEN_SECRET = process.env.JWT_SECRET || 'gunubirlik_is_platformu_secret_2024_please_change_in_production'
const TOKEN_EXPIRY_HOURS = 24 * 7 // 7 gün

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, TOKEN_SECRET, {
    expiresIn: TOKEN_EXPIRY_HOURS * 3600, // saniye cinsinden
    issuer: 'gunubirlik-is-bul',
    audience: 'gunubirlik-users',
  } as jwt.SignOptions)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, TOKEN_SECRET, {
      issuer: 'gunubirlik-is-bul',
      audience: 'gunubirlik-users',
    }) as JWTPayload
    return decoded
  } catch {
    return null
  }
}

// ====================================================================
// Password Hashing (gerçek bcrypt)
// ====================================================================

const BCRYPT_ROUNDS = 12

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS)
}

export function verifyPassword(password: string, hashed: string): boolean {
  // Eski SHA-256 formatını destekle (migrasyon için)
  if (hashed.length === 64 && !hashed.startsWith('$2')) {
    const oldHash = crypto
      .createHash('sha256')
      .update(password + 'gunubirlik_salt_2024')
      .digest('hex')
    return oldHash === hashed
  }
  return bcrypt.compareSync(password, hashed)
}

// ====================================================================
// Auth Helper - Request'ten kullanıcıyı çıkarır
// ====================================================================

export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get('authorization')
  let token: string | null = null

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    const cookieToken = req.cookies.get('auth_token')?.value
    if (cookieToken) token = cookieToken
  }

  if (!token) return null
  return verifyToken(token)
}

export async function requireAuth(req: NextRequest): Promise<{ user: JWTPayload | null; error?: NextResponse }> {
  const user = await getAuthUser(req)
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'Yetkisiz erişim. Lütfen giriş yapın.' },
        { status: 401 }
      ),
    }
  }
  return { user }
}

export async function requireRole(
  req: NextRequest,
  roles: string[]
): Promise<{ user: JWTPayload | null; error?: NextResponse }> {
  const { user, error } = await requireAuth(req)
  if (error || !user) return { user: null, error }
  if (!roles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, error: 'Bu işlem için yetkiniz yok.' },
        { status: 403 }
      ),
    }
  }
  return { user }
}

// ====================================================================
// API Response Helpers
// ====================================================================

export function ok(data: any, message?: string) {
  return NextResponse.json({ success: true, data, message })
}

export function fail(error: string, status = 400, details?: any) {
  return NextResponse.json({ success: false, error, details }, { status })
}

export function paginate(items: any[], page: number, pageSize: number, total: number) {
  return {
    items,
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

// ====================================================================
// Geolocation Helper - Haversine Formülü
// ====================================================================

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ====================================================================
// Validation Helpers
// ====================================================================

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePhone(phone: string): boolean {
  return /^(\+90|0)?5\d{9}$/.test(phone.replace(/\s/g, ''))
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

// ====================================================================
// Bildirim Helper - DB'ye kaydeder ve (gerçek ortamda) push atar
// ====================================================================

export async function createNotification(params: {
  userId: string
  type: string
  title: string
  body: string
  data?: any
}) {
  return (await import('@/lib/db')).db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data ? JSON.stringify(params.data) : null,
    },
  })
}
