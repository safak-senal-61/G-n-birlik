import { NextRequest } from 'next/server'
import { messagesService } from '@/server/services/messages.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getNumberParam } from '@/server/lib/route'

// GET /api/v1/conversations/[id]/messages - Bir konuşmadaki mesajlar
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const page = getNumberParam(req, 'page', 1)!
  const pageSize = getNumberParam(req, 'pageSize', 50)!
  
  const result = await messagesService.getMessages(id, user.userId, page, pageSize)
  return ok(result)
})
