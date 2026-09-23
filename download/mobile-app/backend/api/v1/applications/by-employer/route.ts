import { NextRequest } from 'next/server'
import { applicationsService } from '@/server/services/applications.service'
import { requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getQueryParam } from '@/server/lib/route'

// GET /api/v1/applications/by-employer - İşverenin tüm ilanlarına başvurular
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireRole(req, ['EMPLOYER', 'ADMIN'])
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const status = getQueryParam(req, 'status')
  const apps = await applicationsService.listByEmployer(user.userId, status)
  return ok(apps)
})
