import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/wallet/qr-pay/scan - QR ödeme tara
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const { token } = body

  if (!token || typeof token !== 'string') {
    return fail('token zorunludur.', 400)
  }

  const result = await walletService.scanQrPayment({
    token,
    scannerId: user.userId,
  })
  return ok(result, 'Ödeme başarıyla alındı!')
})
