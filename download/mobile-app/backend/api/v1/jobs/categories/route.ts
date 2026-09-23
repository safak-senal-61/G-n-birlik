import { jobsService } from '@/server/services/jobs.service'
import { ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/jobs/categories
export const GET = withErrorHandler(async () => {
  return ok(await jobsService.getCategories())
})
