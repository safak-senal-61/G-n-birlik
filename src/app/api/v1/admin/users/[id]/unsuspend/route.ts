import { NextRequest } from 'next/server'
import { unsuspendUser } from '@/server/services/admin.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/admin/users/[id]/unsuspend - Askıya almayı kaldır
// Body: { reason: string }
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json()
  const { reason } = body

  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    return fail('Geçerli bir gerekçe giriniz.', 400)
  }

  const clientInfo = getClientInfo(req)
  const result = await unsuspendUser({
    userId: id,
    adminId: user.userId,
    reason: reason.trim(),
    ...clientInfo,
  })

  return ok(result, 'Askıya alma kaldırıldı.')
})
