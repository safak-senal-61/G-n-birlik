import { NextRequest } from 'next/server'
import { getUserDetail } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/admin/users/[id] - Kullanıcı detayı
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const detail = await getUserDetail(id)
  return ok(detail)
})
