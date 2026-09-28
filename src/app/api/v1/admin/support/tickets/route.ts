import { NextRequest } from 'next/server'
import { supportService } from '@/server/services/support.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getNumberParam, getQueryParam } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const result = await supportService.listAllTickets({
    status: getQueryParam(req, 'status', 'ALL')!,
    category: getQueryParam(req, 'category', 'ALL'),
    page: getNumberParam(req, 'page', 1)!,
    pageSize: getNumberParam(req, 'pageSize', 20)!,
  })
  return ok(result)
})
