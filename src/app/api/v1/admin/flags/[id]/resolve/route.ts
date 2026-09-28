import { NextRequest } from 'next/server'
import { resolveFlag } from '@/server/services/admin.service'
import { requireAdmin, ok, fail, getClientInfo } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// POST /api/v1/admin/flags/[id]/resolve - Bir flag'i çözümle
// Body: { action: 'DISMISS'|'WARN'|'SUSPEND'|'BAN'|'NONE', note?: string, suspendDurationHours?: number|null }
export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json()
  const { action, note, suspendDurationHours } = body

  const validActions = ['DISMISS', 'WARN', 'SUSPEND', 'BAN', 'NONE']
  if (!validActions.includes(action)) {
    return fail(`Geçersiz aksiyon. Şunlardan biri olmalı: ${validActions.join(', ')}`, 400)
  }

  const clientInfo = getClientInfo(req)
  const result = await resolveFlag({
    flagId: id,
    adminId: user.userId,
    action,
    note,
    suspendDurationHours,
    ...clientInfo,
  })

  return ok(result, 'Bayrak çözümlandü.')
})
