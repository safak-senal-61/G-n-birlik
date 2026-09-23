import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { requireAuth, ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/auth/2fa/verify
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error

  const { code } = await req.json()
  const result = await securityService.verify2FA(user.userId, code)
  return ok(result, 'İki faktörlü doğrulama aktif edildi! 🎉')
})
