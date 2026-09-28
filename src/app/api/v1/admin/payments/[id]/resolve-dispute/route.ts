import { NextRequest } from 'next/server'
import { resolveDispute } from '@/server/services/admin.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/admin/payments/[id]/resolve-dispute - İtirazı çözümle
// Body: { resolution: 'APPROVED' | 'REJECTED', note: string }
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json()
  if (!['APPROVED', 'REJECTED'].includes(body.resolution)) {
    return fail("resolution 'APPROVED' veya 'REJECTED' olmalı.", 400)
  }
  if (!body.note || body.note.trim().length < 3) {
    return fail('Açıklama en az 3 karakter olmalı.', 400)
  }
  const clientInfo = getClientInfo(req)
  const result = await resolveDispute({
    paymentId: id,
    adminId: user.userId,
    resolution: body.resolution,
    note: body.note.trim(),
    ...clientInfo,
  })
  return ok(result, 'İtiraz çözüldü.')
})
