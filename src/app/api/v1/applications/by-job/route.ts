import { NextRequest } from 'next/server'
import { applicationsService } from '@/server/services/applications.service'
import { requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getQueryParam } from '@/server/lib/route'

// GET /api/v1/applications/by-job?jobId=xxx - Bir ilana gelen başvurular (employer)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireRole(req, ['EMPLOYER', 'ADMIN'])
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const jobId = getQueryParam(req, 'jobId')
  if (!jobId) return fail('jobId parametresi gerekli.', 400)

  const apps = await applicationsService.listByJob(jobId, user.userId)
  return ok(apps)
})
