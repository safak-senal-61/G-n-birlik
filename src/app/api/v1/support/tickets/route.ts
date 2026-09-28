import { NextRequest } from 'next/server'
import { supportService } from '@/server/services/support.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getNumberParam } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const result = await supportService.listUserTickets(user.userId, getNumberParam(req, 'page', 1)!, getNumberParam(req, 'pageSize', 20)!)
  return ok(result)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const body = await req.json()
  const ticket = await supportService.createTicket({ userId: user.userId, ...body })
  return ok(ticket, 'Destek talebiniz oluşturuldu.')
})
