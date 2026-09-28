import { NextRequest } from 'next/server'
import { getConversationMessagesForAdmin } from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getNumberParam } from '@/server/lib/route'

// GET /api/v1/admin/conversations/[id]/messages - Admin görünümünde konuşma mesajları
// (filtered + original içerik birlikte)
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const page = getNumberParam(req, 'page', 1)!
  const pageSize = getNumberParam(req, 'pageSize', 50)!

  const result = await getConversationMessagesForAdmin(id, page, pageSize)
  return ok(result)
})
