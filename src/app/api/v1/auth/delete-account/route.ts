import { NextRequest } from 'next/server'
import { accountDeletionService } from '@/server/services/support.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const status = await accountDeletionService.getDeletionStatus(user.userId)
  return ok(status)
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const body = await req.json()
  const result = await accountDeletionService.requestDeletion({ userId: user.userId, ...body })
  return ok(result, 'Hesap silme talebiniz alındı. Admin onayı sonrası hesabınız silinecektir.')
})
