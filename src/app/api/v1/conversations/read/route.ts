import { NextRequest } from 'next/server'
import { messagesService } from '@/server/services/messages.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/conversations/read - Konuşmayı okundu işaretle
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const result = await messagesService.markAsRead(body.conversationId, user.userId)
  return ok(result)
})
