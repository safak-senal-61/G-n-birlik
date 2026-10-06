import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'
import { db } from '@/lib/db'

// POST /api/v1/admin/deposit-requests/[id]/reject - Para yatırma talebini reddet
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const reason = body.reason || 'Admin tarafından uygun görülmedi.'
  const clientInfo = getClientInfo(req)

  const result = await walletService.rejectDepositRequest({
    requestId: id,
    adminId: user.userId,
    reason,
  })

  // Audit log kaydı
  await db.auditLog.create({
    data: {
      actorId: user.userId,
      action: 'DEPOSIT_REJECT',
      targetType: 'DEPOSIT_REQUEST',
      targetId: id,
      metadata: JSON.stringify({
        requestId: id,
        reason,
      }),
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    },
  })

  return ok(result, 'Para yatırma talebi reddedildi.')
})
