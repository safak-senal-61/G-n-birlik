/**
 * Route handler wrapper - Nest.js interceptor tarzı
 * Hata yönetimi, loglama ve rate limiting merkezi yapılır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { ApiError } from '@/server/services/auth.service'
import { RateLimiter } from '@/server/lib/rate-limit'

export type RouteHandler = (
  req: NextRequest,
  ctx: any
) => Promise<NextResponse> | NextResponse

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (err: any) {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { success: false, error: err.message },
          { status: err.statusCode }
        )
      }
      console.error('API Error:', err)
      return NextResponse.json(
        { success: false, error: 'Sunucu hatası oluştu.', details: err.message },
        { status: 500 }
      )
    }
  }
}

/**
 * Rate limiting ile sarmalanmış route handler
 * Kullanım:
 *   export const POST = withRateLimit(authLimiter, async (req) => { ... })
 */
export function withRateLimit(
  limiter: RateLimiter,
  handler: RouteHandler,
  identifierExtractor?: (req: NextRequest) => string
): RouteHandler {
  return async (req, ctx) => {
    // IP veya kullanıcı ID'sini al
    const identifier = identifierExtractor
      ? identifierExtractor(req)
      : req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'anonymous'

    if (!limiter.hit(identifier)) {
      const retryAfter = limiter.resetIn(identifier)
      return NextResponse.json(
        {
          success: false,
          error: `Çok fazla istek. ${retryAfter} saniye sonra tekrar deneyin.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    return withErrorHandler(handler)(req, ctx)
  }
}

export function getQueryParam(req: NextRequest, key: string, fallback?: string): string | undefined {
  const value = req.nextUrl.searchParams.get(key)
  return value ?? fallback
}

export function getNumberParam(req: NextRequest, key: string, fallback?: number): number | undefined {
  const value = req.nextUrl.searchParams.get(key)
  if (value === null) return fallback
  const num = Number(value)
  return isNaN(num) ? fallback : num
}

export function getBooleanParam(req: NextRequest, key: string, fallback = false): boolean {
  const value = req.nextUrl.searchParams.get(key)
  if (value === null) return fallback
  return value === 'true' || value === '1'
}
