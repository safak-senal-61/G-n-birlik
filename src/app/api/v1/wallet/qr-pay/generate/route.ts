import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/wallet/qr-pay/generate - QR ödeme kodu üret
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const { amount, description } = body

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return fail('Geçerli bir tutar girin.', 400)
  }
  if (!description || description.trim().length < 3) {
    return fail('Açıklama en az 3 karakter olmalı.', 400)
  }

  const result = await walletService.generateQrPayment({
    generatorId: user.userId,
    amount,
    description: description.trim(),
  })
  return ok(result, 'QR ödeme kodu oluşturuldu. 5 dakika geçerli.')
})
