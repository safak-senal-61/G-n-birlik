import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/admin/wallet/deposit - Admin: kullanıcıya bakiye yükle
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const { userId, amount, description, reference, note } = body

  if (!userId) return fail('userId zorunludur.', 400)
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return fail('Geçerli bir tutar girin.', 400)
  }

  const clientInfo = getClientInfo(req)
  const result = await walletService.deposit({
    userId,
    amount,
    description,
    reference,
    note,
    adminId: user.userId,
    ...clientInfo,
  })
  return ok(result, 'Bakiye yüklendi.')
})
