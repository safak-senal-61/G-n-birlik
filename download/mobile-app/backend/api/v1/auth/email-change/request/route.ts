import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { requireAuth, ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/auth/email-change/request
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error

  const { newEmail } = await req.json()
  const result = await securityService.requestEmailChange(user.userId, newEmail)
  return ok({ preview: result.preview }, 'Doğrulama kodu e-posta adresinize gönderildi.')
})
