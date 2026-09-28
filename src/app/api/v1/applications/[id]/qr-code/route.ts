/**
 * QR Kod Oluşturma API
 * POST /api/v1/applications/{id}/qr-code
 *
 * İşveren, kabul ettiği işçi için check-in veya check-out QR kodu üretir.
 * Body: { "type": "CHECK_IN" | "CHECK_OUT" }
 *
 * QR 5 dakika geçerli, tek kullanımlık. Base64 PNG görsel döner.
 */
import { NextRequest } from 'next/server'
import { qrCheckinService } from '@/server/services/qr-checkin.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json()
  const { type } = body

  if (!['CHECK_IN', 'CHECK_OUT'].includes(type)) {
    return fail('type "CHECK_IN" veya "CHECK_OUT" olmalı.', 400)
  }

  const result = await qrCheckinService.generateQrCode({
    applicationId: id,
    employerId: user.userId,
    type,
  })

  return ok(result, `${type === 'CHECK_IN' ? 'Check-in' : 'Check-out'} QR kodu oluşturuldu. 5 dakika geçerli.`)
})
