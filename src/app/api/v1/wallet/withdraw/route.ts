import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/wallet/withdraw - Para çekme talebi
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const { amount, bankInfo, note } = body

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return fail('Geçerli bir tutar girin.', 400)
  }

  const result = await walletService.withdraw({
    userId: user.userId,
    amount,
    bankInfo,
    note,
  })
  return ok(result, 'Para çekme talebi oluşturuldu.')
})
