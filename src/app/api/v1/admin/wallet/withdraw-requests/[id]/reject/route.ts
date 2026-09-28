import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/admin/wallet/withdraw-requests/[id]/reject
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json()
  if (!body.reason || body.reason.trim().length < 3) {
    return fail('Ret gerekçesi gerekli.', 400)
  }
  const clientInfo = getClientInfo(req)
  const result = await walletService.rejectWithdrawalRequest({
    requestId: id,
    adminId: user.userId,
    reason: body.reason.trim(),
    ...clientInfo,
  })
  return ok(result, 'Para çekme talebi reddedildi. Para cüzdana iade edildi.')
})
