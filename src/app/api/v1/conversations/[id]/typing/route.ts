import { NextRequest } from 'next/server'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'
import { broadcastToConversation } from '@/server/lib/realtime'
import { db } from '@/lib/db'

// POST /api/v1/conversations/[id]/typing - Yazıyor / durdu bildirimi gönder
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json().catch(() => ({}))
  const isTyping = Boolean(body.isTyping)

  // Katılımcı doğrula
  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId: user.userId } },
    include: { user: { select: { fullName: true, companyName: true } } },
  })

  if (!participant) {
    return fail('Bu konuşmaya erişim yetkiniz yok.', 403)
  }

  const event = isTyping ? 'typing:start' : 'typing:stop'
  const userName = participant.user.fullName || participant.user.companyName

  broadcastToConversation(id, event, {
    conversationId: id,
    userId: user.userId,
    userName,
  }).catch(() => {})

  return ok({ success: true, event })
})
