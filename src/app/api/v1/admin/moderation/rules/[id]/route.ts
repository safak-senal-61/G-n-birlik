import { NextRequest } from 'next/server'
import {
  updateModerationRule,
  deleteModerationRule,
} from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// PATCH /api/v1/admin/moderation/rules/[id] - Kural güncelle
export const PATCH = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  const body = await req.json()
  const rule = await updateModerationRule(id, body)
  return ok(rule, 'Kural güncellendi.')
})

// DELETE /api/v1/admin/moderation/rules/[id] - Kural sil
export const DELETE = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { id } = await ctx.params
  await deleteModerationRule(id)
  return ok({ id }, 'Kural silindi.')
})
