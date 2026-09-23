/**
 * Rate Limiting - In-memory rate limiter
 *
 * Production'da Redis ile kullanılması önerilir.
 * Geliştirme için in-memory yeterlidir.
 *
 * Kullanım:
 *   const limiter = new RateLimiter(5, 60 * 1000) // 5 istek/dakika
 *   if (!limiter.hit(identifier)) {
 *     return fail('Çok fazla istek.', 429)
 *   }
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  /**
   * İstek sayısını artır
   * @returns true = izin ver, false = limit aşıldı
   */
  hit(identifier: string): boolean {
    const now = Date.now()
    const entry = this.store.get(identifier)

    // İlk istek veya pencere doldu
    if (!entry || entry.resetAt < now) {
      this.store.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      })
      return true
    }

    // Limit aşıldı
    if (entry.count >= this.maxRequests) {
      return false
    }

    // Sayacı artır
    entry.count++
    return true
  }

  /**
   * Kalan istek sayısı
   */
  remaining(identifier: string): number {
    const entry = this.store.get(identifier)
    if (!entry || entry.resetAt < Date.now()) {
      return this.maxRequests
    }
    return Math.max(0, this.maxRequests - entry.count)
  }

  /**
   * Reset süresi (saniye)
   */
  resetIn(identifier: string): number {
    const entry = this.store.get(identifier)
    if (!entry) return 0
    return Math.max(0, Math.ceil((entry.resetAt - Date.now()) / 1000))
  }

  /**
   * Süresi dolmuş kayıtları temizle (periodik çağrılabilir)
   */
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key)
      }
    }
  }
}

// ============================================================
// Hazır limiter'lar
// ============================================================

// Auth: 5 istek/dakika (login, register, forgot-password)
export const authLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_AUTH || '5'),
  60 * 1000
)

// API: 100 istek/dakika
export const apiLimiter = new RateLimiter(
  parseInt(process.env.RATE_LIMIT_API || '100'),
  60 * 1000
)

// Password reset: 3 istek/saat
export const passwordResetLimiter = new RateLimiter(3, 60 * 60 * 1000)

// 2FA: 5 deneme/dakika
export const twoFALimiter = new RateLimiter(5, 60 * 1000)

// Periodik cleanup (her 5 dakika)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    authLimiter.cleanup()
    apiLimiter.cleanup()
    passwordResetLimiter.cleanup()
    twoFALimiter.cleanup()
  }, 5 * 60 * 1000)
}
