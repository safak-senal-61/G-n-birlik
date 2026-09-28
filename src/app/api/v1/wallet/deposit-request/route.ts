import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/wallet/deposit-request — Para yatırma talebi (IBAN ile)
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const { amount, senderName, senderIban, senderBank, senderNote } = body

  if (!amount || typeof amount !== 'number' || amount < 50) {
    return fail('Tutar en az 50₺ olmalı.', 400)
  }

  const result = await walletService.createDepositRequest({
    userId: user.userId,
    amount,
    senderName,
    senderIban,
    senderBank,
    senderNote,
  })
  return ok(result, 'Para yatırma talebiniz alındı. Admin onayı sonrası bakiyenize yansıyacaktır.')
})
