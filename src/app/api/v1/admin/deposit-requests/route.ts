import { NextRequest } from 'next/server'
import { listDepositRequests } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getQueryParam, getNumberParam } from '@/server/lib/route'

// GET /api/v1/admin/deposit-requests - Para yatırma taleplerini listele
// ?status=PENDING|APPROVED|REJECTED|ALL&search=...&page=1&pageSize=20
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const result = await listDepositRequests({
    status: getQueryParam(req, 'status', 'PENDING') || 'PENDING',
    search: getQueryParam(req, 'search', '') || undefined,
    page: getNumberParam(req, 'page', 1),
    pageSize: getNumberParam(req, 'pageSize', 20),
  })
  return ok(result)
})
