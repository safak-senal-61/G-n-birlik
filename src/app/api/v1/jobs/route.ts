import { NextRequest } from 'next/server'
import { jobsService } from '@/server/services/jobs.service'
import { requireAuth, requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getNumberParam, getQueryParam } from '@/server/lib/route'

// GET /api/v1/jobs - Tüm iş ilanlarını listele (konum bazlı arama)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const query = {
    page: getNumberParam(req, 'page', 1),
    pageSize: getNumberParam(req, 'pageSize', 10),
    category: getQueryParam(req, 'category'),
    city: getQueryParam(req, 'city'),
    district: getQueryParam(req, 'district'),
    status: getQueryParam(req, 'status', 'OPEN'),
    search: getQueryParam(req, 'search'),
    lat: getNumberParam(req, 'lat'),
    lng: getNumberParam(req, 'lng'),
    radiusKm: getNumberParam(req, 'radiusKm', 50),
    minWage: getNumberParam(req, 'minWage'),
    maxWage: getNumberParam(req, 'maxWage'),
    workDateFrom: getQueryParam(req, 'workDateFrom'),
    workDateTo: getQueryParam(req, 'workDateTo'),
    employerId: getQueryParam(req, 'employerId'),
    sortBy: getQueryParam(req, 'sortBy', 'NEWEST') as any,
  }
  const result = await jobsService.list(query)
  return ok(result)
})

// POST /api/v1/jobs - Yeni iş ilanı oluştur (sadece employer)
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireRole(req, ['EMPLOYER', 'ADMIN'])
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const job = await jobsService.create(user.userId, body)
  return ok(job, 'İş ilanı oluşturuldu.')
})
