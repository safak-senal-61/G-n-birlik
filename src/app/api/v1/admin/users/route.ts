import { NextRequest } from 'next/server'
import { listUsers } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getQueryParam, getNumberParam } from '@/server/lib/route'

// GET /api/v1/admin/users - Kullanıcı listesi (filtreli + sayfalı)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const filters = {
    search: getQueryParam(req, 'search'),
    role: getQueryParam(req, 'role', 'ALL'),
    status: (getQueryParam(req, 'status', 'ALL') as any) || 'ALL',
    sortBy: (getQueryParam(req, 'sortBy', 'createdAt') as any) || 'createdAt',
    sortOrder: (getQueryParam(req, 'sortOrder', 'desc') as any) || 'desc',
    page: getNumberParam(req, 'page', 1),
    pageSize: getNumberParam(req, 'pageSize', 20),
  }

  const result = await listUsers(filters)
  return ok(result)
})
