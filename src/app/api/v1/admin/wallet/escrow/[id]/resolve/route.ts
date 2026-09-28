import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/admin/wallet/escrow/[id]/resolve
// id = jobId
// Body: { resolution: "RELEASE_TO_WORKER" | "REFUND_TO_EMPLOYER", note: string }
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params // jobId
  const body = await req.json()

  if (!['RELEASE_TO_WORKER', 'REFUND_TO_EMPLOYER'].includes(body.resolution)) {
    return fail('resolution "RELEASE_TO_WORKER" veya "REFUND_TO_EMPLOYER" olmalı.', 400)
  }
  if (!body.note || body.note.trim().length < 3) {
    return fail('Açıklama gerekli.', 400)
  }

  const clientInfo = getClientInfo(req)
  const result = await walletService.resolveEscrowDispute({
    jobId: id,
    adminId: user.userId,
    resolution: body.resolution,
    note: body.note.trim(),
    ...clientInfo,
  })
  return ok(result, 'İhtilaf çözüldü.')
})
