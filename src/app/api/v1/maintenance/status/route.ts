/**
 * Public Maintenance Status API
 * GET /api/v1/maintenance/status
 *
 * Herkese açık. Bakım modu açık mı, mesaj, iletişim bilgileri.
 * Frontend bu endpoint'i çağırıp bakım ekranı gösterir.
 */
import { NextRequest } from 'next/server'
import { getPublicMaintenanceStatus } from '@/server/services/maintenance.service'
import { ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const status = await getPublicMaintenanceStatus()
  return ok(status)
})
