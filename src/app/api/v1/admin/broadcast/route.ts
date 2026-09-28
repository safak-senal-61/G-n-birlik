import { NextRequest } from 'next/server'
import { broadcastService } from '@/server/services/support.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler, getNumberParam } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const result = await broadcastService.listBroadcasts(getNumberParam(req, 'page', 1)!, getNumberParam(req, 'pageSize', 20)!)
  return ok(result)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const body = await req.json()
  if (!body.title || !body.message) return fail('Başlık ve mesaj gerekli', 400)
  const result = await broadcastService.createBroadcast({ adminId: user.userId, ...body })
  return ok(result, 'Broadcast oluşturuldu.')
})
