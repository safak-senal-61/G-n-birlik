import { NextRequest } from 'next/server'
import { walletService } from '@/server/services/wallet.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getNumberParam } from '@/server/lib/route'

// GET /api/v1/wallet/withdraw-requests — Para çekme taleplerim
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const page = getNumberParam(req, 'page', 1)!
  const result = await walletService.listWithdrawalRequests(user.userId, page)
  return ok(result)
})
