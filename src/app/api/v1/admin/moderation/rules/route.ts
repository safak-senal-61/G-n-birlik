import { NextRequest } from 'next/server'
import {
  listModerationRules,
  createModerationRule,
} from '@/server/services/admin.service'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/admin/moderation/rules - Tüm kurallar
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const rules = await listModerationRules()
  return ok(rules)
})

// POST /api/v1/admin/moderation/rules - Yeni kural oluştur
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const { name, description, type, pattern, severity, action, isEnabled } = body

  if (!name || !type || !pattern || !severity || !action) {
    return fail('Eksik alan: name, type, pattern, severity, action gerekli.', 400)
  }

  const rule = await createModerationRule({
    name,
    description,
    type,
    pattern,
    severity,
    action,
    isEnabled: isEnabled !== undefined ? !!isEnabled : true,
  })
  return ok(rule, 'Kural oluşturuldu.')
})
