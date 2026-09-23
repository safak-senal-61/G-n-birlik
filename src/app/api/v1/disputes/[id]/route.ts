import { NextRequest } from 'next/server'
import { paymentService } from '@/server/services/payment.service'
import { requireAuth, requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, withRateLimit } from '@/server/lib/route'
import { authLimiter } from '@/server/lib/rate-limit'
import { db } from '@/lib/db'

// GET /api/v1/disputes/[id] - Anlaşmazlık detayı
// Yetki: anlaşmazlığı açan, karşı taraf veya admin görebilir
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const dispute = await db.dispute.findUnique({
    where: { id },
    include: {
      job: { select: { id: true, title: true, city: true, district: true } },
      application: { select: { id: true, status: true, workerId: true } },
      payment: { select: { id: true, amount: true, workerAmount: true, platformFee: true, status: true } },
      opener: { select: { id: true, fullName: true, avatarUrl: true } },
      against: { select: { id: true, fullName: true, avatarUrl: true } },
    },
  })

  if (!dispute) return fail('Anlaşmazlık bulunamadı.', 404)

  // Yetki kontrolü: açan, karşı taraf veya admin
  const isAdmin = user.role === 'ADMIN'
  const isOpener = dispute.openedBy === user.userId
  const isAgainst = dispute.againstId === user.userId
  if (!isAdmin && !isOpener && !isAgainst) {
    return fail('Bu anlaşmazlığı görüntüleme yetkiniz yok.', 403)
  }

  return ok(dispute)
})
