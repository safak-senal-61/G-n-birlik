import { NextRequest } from 'next/server'
import { listWithdrawalRequests } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getQueryParam, getNumberParam } from '@/server/lib/route'

// GET /api/v1/admin/withdrawal-requests - Para çekme taleplerini listele
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const result = await listWithdrawalRequests({
    status: getQueryParam(req, 'status', 'PENDING') || 'PENDING',
    search: getQueryParam(req, 'search', '') || undefined,
    page: getNumberParam(req, 'page', 1),
    pageSize: getNumberParam(req, 'pageSize', 20),
  })
  return ok(result)
})
