import { NextRequest } from 'next/server'
import { listFlags } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getQueryParam, getNumberParam } from '@/server/lib/route'

// GET /api/v1/admin/flags - Moderasyon bayraklarını listele
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const filters = {
    status: (getQueryParam(req, 'status', 'PENDING') as any) || 'PENDING',
    severity: (getQueryParam(req, 'severity', 'ALL') as any) || 'ALL',
    violationType: getQueryParam(req, 'violationType', 'ALL'),
    page: getNumberParam(req, 'page', 1),
    pageSize: getNumberParam(req, 'pageSize', 20),
  }

  const result = await listFlags(filters)
  return ok(result)
})
