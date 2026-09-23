import { NextRequest } from 'next/server'
import { securityService } from '@/server/services/security.service'
import { requireAuth, ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/auth/security-info
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error

  const result = await securityService.getSecurityInfo(user.userId)
  return ok(result)
})
