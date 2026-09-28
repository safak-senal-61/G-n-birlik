/**
 * Forward Geocoding API
 * GET /api/v1/geocode/search?q=Kadıköy İstanbul&limit=5
 *
 * Adres/metin aramasından koordinat çıkarır
 * Kullanım: Adres arama kutusu, iş ilanı oluştururken konum seçimi
 */
import { NextRequest } from 'next/server'
import { forwardGeocode } from '@/lib/geocode'
import { ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getQueryParam, getNumberParam } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const query = getQueryParam(req, 'q') || getQueryParam(req, 'query')
  const limit = getNumberParam(req, 'limit', 5)!

  if (!query || query.trim().length < 3) {
    return fail('Arama metni en az 3 karakter olmalı. Örnek: /api/v1/geocode/search?q=Kadıköy', 400)
  }

  if (limit < 1 || limit > 40) {
    return fail('limit 1-40 arası olmalı.', 400)
  }

  const results = await forwardGeocode(query, limit, 'tr')
  return ok({
    query: query.trim(),
    count: results.length,
    items: results,
  }, `${results.length} sonuç bulundu.`)
})
