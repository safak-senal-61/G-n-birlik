import { NextRequest } from 'next/server'
import { getDashboardStats } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/admin/stats - Dashboard istatistikleri
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const stats = await getDashboardStats()
  return ok(stats)
})
