import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { requireAuth, ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/auth/2fa/setup
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error

  const result = await securityService.setup2FA(user.userId)
  return ok(result, 'QR kodu authenticator uygulamanızla tarayın.')
})
