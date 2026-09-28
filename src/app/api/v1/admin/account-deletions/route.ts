import { NextRequest } from 'next/server'
import { accountDeletionService } from '@/server/services/support.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getNumberParam } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const result = await accountDeletionService.listAllDeletions(getNumberParam(req, 'page', 1)!, getNumberParam(req, 'pageSize', 20)!)
  return ok(result)
})
