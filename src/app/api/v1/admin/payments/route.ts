import { NextRequest } from 'next/server'
import { listPayments } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getQueryParam, getNumberParam } from '@/server/lib/route'

// GET /api/v1/admin/payments - Ödeme taleplerini listele
// ?status=PENDING|APPROVED|REJECTED|PAID|RECEIVED|DISPUTED|ALL
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const result = await listPayments({
    status: getQueryParam(req, 'status', 'PENDING') || 'PENDING',
    page: getNumberParam(req, 'page', 1),
    pageSize: getNumberParam(req, 'pageSize', 20),
  })
  return ok(result)
})
