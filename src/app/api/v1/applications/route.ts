import { NextRequest } from 'next/server'
import { applicationsService } from '@/server/services/applications.service'
import { requireRole, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/applications - Yeni başvuru oluştur
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireRole(req, ['WORKER', 'ADMIN'])
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const app = await applicationsService.create(user.userId, body)
  return ok(app, 'Başvurunuz alındı.')
})

// GET /api/v1/applications - İşçinin kendi başvurularını listele
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireRole(req, ['WORKER', 'EMPLOYER', 'ADMIN'])
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const status = req.nextUrl.searchParams.get('status') || undefined
  
  if (user.role === 'WORKER') {
    const apps = await applicationsService.listByWorker(user.userId, status)
    return ok(apps)
  } else {
    const apps = await applicationsService.listByEmployer(user.userId, status)
    return ok(apps)
  }
})
