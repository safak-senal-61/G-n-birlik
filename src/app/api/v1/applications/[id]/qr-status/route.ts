/**
 * QR Durum Sorgulama API
 * GET /api/v1/applications/{id}/qr-status
 *
 * Bir application için aktif QR'ları ve son kullanılan QR'ı getirir.
 * Hem işçi hem işveren erişebilir.
 */
import { NextRequest } from 'next/server'
import { qrCheckinService } from '@/server/services/qr-checkin.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const result = await qrCheckinService.getActiveQr(id, user.userId)
  return ok(result)
})
