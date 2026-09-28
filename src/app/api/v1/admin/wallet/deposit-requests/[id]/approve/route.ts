import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/admin/wallet/deposit-requests/[id]/approve
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const clientInfo = getClientInfo(req)
  const result = await walletService.approveDepositRequest({
    requestId: id,
    adminId: user.userId,
    note: body.note,
    ...clientInfo,
  })
  return ok(result, 'Para yatırma talebi onaylandı.')
})
