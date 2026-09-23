import { NextRequest } from 'next/server'
import { paymentService } from '@/server/services/payment.service'
import { requireAuth, requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, withRateLimit } from '@/server/lib/route'
import { authLimiter } from '@/server/lib/rate-limit'
import { db } from '@/lib/db'

// POST /api/v1/disputes - Anlaşmazlık aç
export const POST = withRateLimit(authLimiter, async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  if (!body?.jobId) return fail('jobId gereklidir.', 400)
  if (!body?.reason) return fail('reason gereklidir.', 400)
  if (!body?.description) return fail('description gereklidir.', 400)

  const result = await paymentService.openDispute(user.userId, {
    jobId: body.jobId,
    applicationId: body.applicationId,
    reason: body.reason,
    description: body.description,
    evidence: body.evidence,
  })
  return ok(result, 'Anlaşmazlık açıldı.')
})

// GET /api/v1/disputes - Anlaşmazlık listesi
// Admin: tüm anlaşmazlıklar | Kullanıcı: açtığı veya aleyhine olanlar
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const isAdmin = user.role === 'ADMIN'
  const where = isAdmin
    ? {}
    : { OR: [{ openedBy: user.userId }, { againstId: user.userId }] }

  const disputes = await db.dispute.findMany({
    where,
    include: {
      job: { select: { id: true, title: true, city: true, district: true } },
      opener: { select: { id: true, fullName: true, avatarUrl: true } },
      against: { select: { id: true, fullName: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return ok(disputes)
})
