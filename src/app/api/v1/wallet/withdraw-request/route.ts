import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/wallet/withdraw-request — Para çekme talebi (IBAN ile)
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const { amount, recipientName, recipientIban, recipientBank, recipientNote } = body

  if (!amount || typeof amount !== 'number' || amount < 50) {
    return fail('Tutar en az 50₺ olmalı.', 400)
  }

  const result = await walletService.createWithdrawalRequest({
    userId: user.userId,
    amount,
    recipientName,
    recipientIban,
    recipientBank,
    recipientNote,
  })
  return ok(result, 'Para çekme talebiniz alındı. 3-5 iş günü içinde sonuçlanacaktır.')
})
