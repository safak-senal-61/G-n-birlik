import { NextRequest } from 'next/server'
import { listAuditLogs } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getQueryParam, getNumberParam } from '@/server/lib/route'

// GET /api/v1/admin/audit - Audit log listesi
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const filters = {
    action: getQueryParam(req, 'action'),
    actorId: getQueryParam(req, 'actorId'),
    targetType: getQueryParam(req, 'targetType'),
    page: getNumberParam(req, 'page', 1),
    pageSize: getNumberParam(req, 'pageSize', 30),
  }

  const result = await listAuditLogs(filters)
  return ok(result)
})
