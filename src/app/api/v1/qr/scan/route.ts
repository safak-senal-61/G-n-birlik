/**
 * QR Tarama API
 * POST /api/v1/qr/scan
 *
 * İşçi (veya işveren) QR kodunu tarar.
 * Token doğrulanır, application durumu güncellenir:
 *   - CHECK_IN → IN_PROGRESS
 *   - CHECK_OUT → COMPLETED + payment oluşturulur
 *
 * Body: { "token": "qr_token_string" }
 */
import { NextRequest } from 'next/server'
import { qrCheckinService } from '@/server/services/qr-checkin.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const { token } = body

  if (!token || typeof token !== 'string') {
    return fail('token zorunludur.', 400)
  }

  const result = await qrCheckinService.scanQrCode({
    token,
    scannedById: user.userId,
    scannedByRole: user.role,
  })

  return ok(result, result.message)
})
