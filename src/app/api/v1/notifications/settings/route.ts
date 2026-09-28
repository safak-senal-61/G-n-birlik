import { NextRequest } from 'next/server'
import { notificationSettingsService } from '@/server/services/notification-settings.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/notifications/settings — Ayarları getir
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const settings = await notificationSettingsService.getSettings(user.userId)
  return ok(settings)
})

// PUT /api/v1/notifications/settings — Ayarları güncelle
export const PUT = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()

  // Sadece boolean alanları al
  const allowedFields = [
    'jobApplied', 'applicationAccepted', 'applicationRejected',
    'jobReminder', 'jobNearby', 'newMessage',
    'paymentReceived', 'paymentApproved', 'paymentRejected',
    'walletDeposit', 'walletWithdraw',
    'workStarted', 'workCompleted', 'escrowDisputed',
    'systemUpdate', 'maintenance', 'promotional',
    'pushEnabled',
  ]

  const updateData: any = {}
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = !!body[field]
    }
  }

  if (Object.keys(updateData).length === 0) {
    return fail('Güncellenecek alan yok.', 400)
  }

  const settings = await notificationSettingsService.updateSettings(user.userId, updateData)
  return ok(settings, 'Bildirim ayarları güncellendi.')
})
