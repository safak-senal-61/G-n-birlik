import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { requireAuth, ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/auth/change-password
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || ok({ error: 'Yetkisiz' })

  const { currentPassword, newPassword } = await req.json()
  await securityService.changePassword(user.userId, currentPassword, newPassword)
  return ok({ success: true }, 'Şifreniz güncellendi.')
})
