import { NextRequest, NextResponse } from 'next/server'
import { verificationService } from '@/server/services/reviews.service'
import { requireAuth, ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getNumberParam } from '@/server/lib/route'

// POST /api/v1/users/me/verification-request - Yeni doğrulama talebi gönder
// Body: { type: "COMPANY"|"IDENTITY"|"TAX", documentUrl: "data:..."|"https://...", documentNote?: "..." }
export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
  const ua = req.headers.get('user-agent') || undefined

  const request = await verificationService.submit(user.userId, {
    type: body.type,
    documentUrl: body.documentUrl,
    documentNote: body.documentNote,
  }, ip, ua)

  return ok(request, 'Doğrulama talebiniz alındı. Admin onayını bekliyor.')
})

// GET /api/v1/users/me/verification-request - Taleplerimi listele
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAuth(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const result = await verificationService.listMyRequests(
    user.userId,
    getNumberParam(req, 'page', 1),
    getNumberParam(req, 'pageSize', 10),
  )
  return ok(result)
})
