import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getNumberParam } from '@/server/lib/route'

// GET /api/v1/admin/wallet/withdraw-requests — Tüm para çekme talepleri
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const page = getNumberParam(req, 'page', 1)!
  const pageSize = getNumberParam(req, 'pageSize', 20)!
  const status = req.nextUrl.searchParams.get('status') || 'PENDING'

  const where = status === 'ALL' ? {} : { status }
  const skip = (page - 1) * pageSize
  const [items, total] = await Promise.all([
    db.withdrawalRequest.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    }),
    db.withdrawalRequest.count({ where }),
  ])

  return ok({
    items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  })
})
