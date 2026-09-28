import { NextRequest } from 'next/server'
import { jobsService } from '@/server/services/jobs.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/jobs/saved - Kaydedilen ilanlar
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const jobs = await jobsService.listSaved(user.userId)
  return ok(jobs)
})
