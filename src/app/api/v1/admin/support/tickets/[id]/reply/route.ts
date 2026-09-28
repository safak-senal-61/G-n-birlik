import { NextRequest } from 'next/server'
import { supportService } from '@/server/services/support.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const { id } = await ctx.params
  const body = await req.json()
  if (!body.reply || body.reply.trim().length < 3) return fail('Yanıt gerekli', 400)
  const result = await supportService.replyTicket({ ticketId: id, adminId: user.userId, reply: body.reply })
  return ok(result, 'Yanıt gönderildi.')
})
