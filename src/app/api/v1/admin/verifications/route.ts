import { NextRequest } from 'next/server'
import { listVerificationRequests } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getQueryParam, getNumberParam } from '@/server/lib/route'

// GET /api/v1/admin/verifications - Doğrulama taleplerini listele
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const result = await listVerificationRequests({
    status: getQueryParam(req, 'status', 'PENDING') || 'PENDING',
    page: getNumberParam(req, 'page', 1),
    pageSize: getNumberParam(req, 'pageSize', 20),
  })
  return ok(result)
})
