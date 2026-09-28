/**
 * Rate Limiting - In-memory rate limiter with progressive backoff
 *
 * Escalation (kademeli bekleme):
 *   1-3 deneme: anında (15 dk pencere)
 *   4-5 deneme: 15 dk bekle
 *   6-7 deneme: 30 dk bekle
 *   8+ deneme:  1 saat bekle
 */

interface RateLimitEntry {
  count: number
  resetAt: number
  lockoutUntil: number // 0 = kilitli değil
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

    // Lockout kontrolü
    if (entry && entry.lockoutUntil > now) {
      return false
    }

    // İlk istek veya pencere doldu
    if (!entry || entry.resetAt < now) {
      this.store.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
        lockoutUntil: 0,
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
    if (!entry) return this.maxRequests
    return Math.max(0, this.maxRequests - entry.count)
  }

  /**
   * Reset süresi (saniye)
   */
  resetIn(identifier: string): number {
    const entry = this.store.get(identifier)
    if (!entry) return 0
    return Math.ceil((entry.resetAt - Date.now()) / 1000)
  }

  /**
   * Kilitli mi? Kaç saniye sonra açılır?
   */
  lockoutRemaining(identifier: string): number {
    const entry = this.store.get(identifier)
    if (!entry || entry.lockoutUntil <= Date.now()) return 0
    return Math.ceil((entry.lockoutUntil - Date.now()) / 1000)
  }

  /**
   * Belirli bir identifier için lockout uygula
   */
  lockout(identifier: string, durationMs: number) {
    const entry = this.store.get(identifier) || {
      count: 0,
      resetAt: Date.now() + this.windowMs,
      lockoutUntil: 0,
    }
    entry.lockoutUntil = Date.now() + durationMs
    this.store.set(identifier, entry)
  }

  /**
   * Sayacı sıfırla
   */
  reset(identifier: string) {
    this.store.delete(identifier)
  }

  /**
   * Süresi dolmuş kayıtları temizle
   */
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now && entry.lockoutUntil < now) {
        this.store.delete(key)
      }
    }
  }
}

// ============================================================
// Progressive Rate Limiter — kademeli bekleme süresi
// ============================================================
// 1-3 deneme: serbest (15 dk pencerede 3 deneme)
// 4. deneme: 15 dk bekle
// 5. deneme: 30 dk bekle
// 6+ deneme: 1 saat bekle
const PROGRESSIVE_STEPS = [
  { maxAttempts: 3, windowMs: 15 * 60 * 1000, lockoutMs: 0 },           // 1-3: serbest
  { maxAttempts: 4, windowMs: 15 * 60 * 1000, lockoutMs: 15 * 60 * 1000 }, // 4: 15 dk
  { maxAttempts: 5, windowMs: 30 * 60 * 1000, lockoutMs: 30 * 60 * 1000 }, // 5: 30 dk
  { maxAttempts: 99, windowMs: 60 * 60 * 1000, lockoutMs: 60 * 60 * 1000 }, // 6+: 1 saat
]

export class ProgressiveRateLimiter {
  private store = new Map<string, { count: number; firstAttemptAt: number; lockoutUntil: number }>()

  /**
   * İstek kontrolü — kademeli bekleme uygular
   * @returns { allowed: boolean, waitSeconds: number, message: string }
   */
  check(identifier: string): { allowed: boolean; waitSeconds: number; message: string } {
    const now = Date.now()
    const entry = this.store.get(identifier)

    // Lockout kontrolü
    if (entry && entry.lockoutUntil > now) {
      const waitSec = Math.ceil((entry.lockoutUntil - now) / 1000)
      return {
        allowed: false,
        waitSeconds: waitSec,
        message: this.formatWaitMessage(waitSec),
      }
    }

    // İlk istek veya pencere doldu (1 saat sonra sıfırla)
    if (!entry || (now - entry.firstAttemptAt) > 60 * 60 * 1000) {
      this.store.set(identifier, { count: 1, firstAttemptAt: now, lockoutUntil: 0 })
      return { allowed: true, waitSeconds: 0, message: '' }
    }

    // Sayacı artır
    entry.count++

    // Hangi adımdayız?
    for (const step of PROGRESSIVE_STEPS) {
      if (entry.count <= step.maxAttempts) {
        if (step.lockoutMs > 0) {
          // Lockout uygula
          entry.lockoutUntil = now + step.lockoutMs
          this.store.set(identifier, entry)
          const waitSec = Math.ceil(step.lockoutMs / 1000)
          return {
            allowed: false,
            waitSeconds: waitSec,
            message: this.formatWaitMessage(waitSec),
          }
        }
        // Serbest
        return { allowed: true, waitSeconds: 0, message: '' }
      }
    }

    // Fallback: 1 saat
    entry.lockoutUntil = now + 60 * 60 * 1000
    this.store.set(identifier, entry)
    return {
      allowed: false,
      waitSeconds: 3600,
      message: 'Çok fazla deneme. 1 saat sonra tekrar deneyin.',
    }
  }

  private formatWaitMessage(seconds: number): string {
    if (seconds < 60) return `${seconds} saniye sonra tekrar deneyin.`
    const minutes = Math.ceil(seconds / 60)
    if (minutes < 60) return `${minutes} dakika sonra tekrar deneyin.`
    const hours = Math.ceil(minutes / 60)
    return `${hours} saat sonra tekrar deneyin.`
  }

  reset(identifier: string) {
    this.store.delete(identifier)
  }

  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.lockoutUntil < now && (now - entry.firstAttemptAt) > 60 * 60 * 1000) {
        this.store.delete(key)
      }
    }
  }
}

// ============================================================
// Hazır limiter'lar
// ============================================================

// Auth: 5 istek/dakika (login, register)
export const authLimiter = new RateLimiter(5, 60 * 1000)

// API: 100 istek/dakika
export const apiLimiter = new RateLimiter(100, 60 * 1000)

// Password reset: KADEMELİ — 3 deneme serbest, sonra 15dk/30dk/1saat
export const passwordResetLimiter = new ProgressiveRateLimiter()

// 2FA: 5 deneme/dakika
export const twoFALimiter = new RateLimiter(5, 60 * 1000)

// OTP: Kademeli — 3 deneme serbest, sonra 15dk/30dk/1saat
export const otpLimiter = new ProgressiveRateLimiter()

// Periodik cleanup (her 5 dakika)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    authLimiter.cleanup()
    apiLimiter.cleanup()
    twoFALimiter.cleanup()
    passwordResetLimiter.cleanup()
    otpLimiter.cleanup()
  }, 5 * 60 * 1000)
}
