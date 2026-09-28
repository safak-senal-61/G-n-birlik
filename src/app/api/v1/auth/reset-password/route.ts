import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/auth/reset-password
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { code, newPassword } = await req.json()
  await securityService.resetPassword(code, newPassword)
  return ok({ success: true }, 'Şifreniz başarıyla sıfırlandı.')
})
