import { NextRequest } from 'next/server'
import { listPendingJobs } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getNumberParam } from '@/server/lib/route'

// GET /api/v1/admin/jobs/pending - Onay bekleyen iş ilanları
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const page = getNumberParam(req, 'page', 1)!
  const pageSize = getNumberParam(req, 'pageSize', 20)!
  const result = await listPendingJobs(page, pageSize)
  return ok(result)
})
