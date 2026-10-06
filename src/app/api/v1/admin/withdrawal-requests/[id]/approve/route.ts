import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'
import { db } from '@/lib/db'

// POST /api/v1/admin/withdrawal-requests/[id]/approve - Çekme talebini onayla (ödendi olarak işaretle)
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const clientInfo = getClientInfo(req)

  const result = await walletService.approveWithdrawalRequest({
    requestId: id,
    adminId: user.userId,
    note: body.note,
  })

  // Audit log kaydı
  await db.auditLog.create({
    data: {
      actorId: user.userId,
      action: 'WITHDRAWAL_APPROVE',
      targetType: 'WITHDRAWAL_REQUEST',
      targetId: id,
      metadata: JSON.stringify({
        requestId: id,
        note: body.note,
      }),
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    },
  })

  return ok(result, 'Para çekme talebi onaylandı ve ödendi olarak işaretlendi.')
})
