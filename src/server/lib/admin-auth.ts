/**
 * Admin yetkilendirme yardımcı fonksiyonu
 * Tüm admin API rotalarında kullanılır.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireRole, ok, fail } from '@/server/lib/auth'

export async function requireAdmin(req: NextRequest) {
  return requireRole(req, ['ADMIN'])
}

export { ok, fail }

export function getClientInfo(req: NextRequest) {
  return {
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  }
}
