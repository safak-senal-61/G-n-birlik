import { NextRequest } from 'next/server'
import { paymentService } from '@/server/services/payment.service'
import { requireAuth, requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, withRateLimit } from '@/server/lib/route'
import { authLimiter } from '@/server/lib/rate-limit'

// POST /api/v1/disputes/[id]/resolve - Anlaşmazlık çöz (sadece admin)
export const POST = withRateLimit(
  authLimiter,
  async (req: NextRequest, ctx: any) => {
    const { id } = await ctx.params
    const { user, error } = await requireRole(req, ['ADMIN'])
    if (error || !user) return error || fail('Bu işlem için yetkiniz yok.', 403)

    const body = await req.json()
    if (!body?.resolution) return fail('resolution gereklidir.', 400)

    const validResolutions = ['RESOLVED_WORKER', 'RESOLVED_EMPLOYER', 'RESOLVED_SPLIT']
    if (!validResolutions.includes(body.resolution)) {
      return fail(
        'Geçersiz resolution. RESOLVED_WORKER | RESOLVED_EMPLOYER | RESOLVED_SPLIT olmalı.',
        400
      )
    }
    if (!body?.resolutionNote) return fail('resolutionNote gereklidir.', 400)

    const result = await paymentService.resolveDispute(
      user.userId,
      id,
      body.resolution,
      body.resolutionNote
    )
    return ok(result, 'Anlaşmazlık çözüldü.')
  }
)
