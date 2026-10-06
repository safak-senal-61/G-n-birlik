import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'
import { db } from '@/lib/db'

// POST /api/v1/admin/deposit-requests/[id]/approve - Para yatırma talebini onayla ve bakiyeye yansıt
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
  })

  // Audit log kaydı
  await db.auditLog.create({
    data: {
      actorId: user.userId,
      action: 'DEPOSIT_APPROVE',
      targetType: 'DEPOSIT_REQUEST',
      targetId: id,
      metadata: JSON.stringify({
        amount: result.transaction?.amount,
        userId: result.request?.userId,
        balanceAfter: result.balanceAfter,
        note: body.note,
      }),
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
    },
  })

  return ok(result, 'Bakiye yükleme talebi onaylandı ve kullanıcı cüzdanına başarıyla aktarıldı.')
})
