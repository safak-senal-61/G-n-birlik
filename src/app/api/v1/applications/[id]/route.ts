import { NextRequest } from 'next/server'
import { applicationsService } from '@/server/services/applications.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// PUT /api/v1/applications/[id] - Durum güncelle
export const PUT = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const updated = await applicationsService.updateStatus(
    id,
    user.userId,
    user.role,
    body.status,
    body.employerNote
  )
  return ok(updated, 'Başvuru durumu güncellendi.')
})

// GET /api/v1/applications/[id]
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  // Tek bir başvuru - worker veya employer görebilir
  // Service katmanı yetkiyi kontrol edecek
  const result = await applicationsService.listByJob(id, user.userId)
  return ok(result)
})
