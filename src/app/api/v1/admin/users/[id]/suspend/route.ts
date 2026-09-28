import { NextRequest } from 'next/server'
import { suspendUser } from '@/server/services/admin.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/admin/users/[id]/suspend - Kullanıcıyı askıya al (geçici/kalıcı)
// Body: { durationHours: number | null, reason: string }
// durationHours null = kalıcı ban
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json()
  const { durationHours, reason } = body

  if (!reason || typeof reason !== 'string' || reason.trim().length < 3) {
    return fail('Geçerli bir gerekçe giriniz (en az 3 karakter).', 400)
  }

  const clientInfo = getClientInfo(req)
  const result = await suspendUser({
    userId: id,
    adminId: user.userId,
    durationHours: durationHours === null || durationHours === undefined ? null : Number(durationHours),
    reason: reason.trim(),
    ...clientInfo,
  })

  return ok(result, 'Kullanıcı askıya alındı.')
})
