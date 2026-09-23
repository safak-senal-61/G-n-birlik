import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { requireAuth, ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/auth/avatar
// Body: { base64, mimeType }
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error

  const { base64, mimeType } = await req.json()
  if (!base64 || !mimeType) {
    return ok({ error: 'base64 ve mimeType gerekli' })
  }
  const result = await securityService.uploadAvatar(user.userId, base64, mimeType)
  return ok(result, 'Profil fotoğrafınız güncellendi.')
})
