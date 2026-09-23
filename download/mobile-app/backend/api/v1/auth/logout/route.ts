import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/server/lib/route'

export const POST = withErrorHandler(async (req: NextRequest) => {
  const response = NextResponse.json({ success: true, message: 'Çıkış yapıldı.' })
  response.cookies.delete('auth_token')
  return response
})
