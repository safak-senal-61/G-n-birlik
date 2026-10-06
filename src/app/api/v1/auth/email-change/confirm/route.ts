import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/auth/email-change/confirm
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Oturum açmanız gerekiyor', 401)

  const { code } = await req.json()
  const result = await securityService.confirmEmailChange(user.userId, code)
  return ok(result, 'E-posta adresiniz güncellendi.')
})
