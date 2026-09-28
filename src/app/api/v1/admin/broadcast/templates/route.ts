import { NextRequest } from 'next/server'
import { broadcastService } from '@/server/services/support.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const templates = await broadcastService.listTemplates()
  return ok(templates)
})
