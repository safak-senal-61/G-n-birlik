import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/wallet/transfer - Kullanıcılar arası transfer
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const { recipientId, amount, description, note } = body

  if (!recipientId) return fail('Alıcı ID gerekli.', 400)
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return fail('Geçerli bir tutar girin.', 400)
  }

  const result = await walletService.transfer({
    senderId: user.userId,
    recipientId,
    amount,
    description,
    note,
  })
  return ok(result, 'Transfer başarılı.')
})
