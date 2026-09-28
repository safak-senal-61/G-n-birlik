/**
 * Suggest (Autocomplete) API
 * GET /api/v1/geocode/suggest?q=Kadı&limit=5
 *
 * Adres arama kutusu için autocomplete önerileri
 * Kullanım: Kullanıcı yazdıkça bu endpoint çağrılır, dropdown önerileri gösterilir
 *
 * Not: Bu endpoint içsel olarak search ile aynıdır, ancak kısa query'ler için
 * optimize edilmiştir (3 karakterden kısa boş array döner).
 */
import { NextRequest } from 'next/server'
import { suggestLocations } from '@/lib/geocode'
import { ok } from '@/server/lib/auth'
import { withErrorHandler, getQueryParam, getNumberParam } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const query = getQueryParam(req, 'q') || ''
  const limit = getNumberParam(req, 'limit', 5)!

  // 3 karakterden kısa ise boş array dön (rate limit'i korumak için)
  if (!query || query.trim().length < 3) {
    return ok({ query, count: 0, items: [] })
  }

  const results = await suggestLocations(query, Math.min(limit, 10))
  return ok({
    query: query.trim(),
    count: results.length,
    items: results,
  })
})
