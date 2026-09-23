import { NextRequest } from 'next/server'
import { authService } from '@/server/services/auth.service'
import { getAuthUser, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const payload = await getAuthUser(req)
  if (!payload) return fail('Yetkisiz.', 401)

  const user = await authService.getProfile(payload.userId)
  return ok(user)
})

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const payload = await getAuthUser(req)
  if (!payload) return fail('Yetkisiz.', 401)

  const body = await req.json()
  const user = await authService.updateProfile(payload.userId, body)
  return ok(user, 'Profil güncellendi.')
})
