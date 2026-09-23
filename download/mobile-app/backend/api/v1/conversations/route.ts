import { NextRequest } from 'next/server'
import { messagesService } from '@/server/services/messages.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/conversations - Kullanıcının konuşmalarını listele
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const conversations = await messagesService.listConversations(user.userId)
  return ok(conversations)
})

// POST /api/v1/conversations - Mesaj gönder (yeni konuşma veya var olana)
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const message = await messagesService.sendMessage(user.userId, body)
  return ok(message, 'Mesaj gönderildi.')
})
