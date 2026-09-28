import { NextRequest } from 'next/server'
import { accountDeletionService } from '@/server/services/support.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)
  const { id } = await ctx.params
  const result = await accountDeletionService.approveDeletion({ deletionId: id, adminId: user.userId })
  return ok(result, 'Hesap silindi.')
})
