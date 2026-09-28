/**
 * Reverse Geocoding API
 * GET /api/v1/geocode/reverse?lat=41.0082&lng=28.9784
 *
 * Verilen koordinatları adrese çevirir (mahalle, ilçe, şehir, sokak, posta kodu)
 * Kullanım: "Konum Al" butonuna basıldığında bu endpoint çağrılır
 */
import { NextRequest } from 'next/server'
import { reverseGeocode } from '@/lib/geocode'
import { ok, fail } from '@/server/lib/auth'
import { withErrorHandler, getNumberParam } from '@/server/lib/route'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const lat = getNumberParam(req, 'lat')
  const lng = getNumberParam(req, 'lng')

  if (lat === undefined || lng === undefined) {
    return fail('lat ve lng parametreleri zorunludur. Örnek: /api/v1/geocode/reverse?lat=41.0082&lng=28.9784', 400)
  }

  // Türkiye sınırları kontrolü (yaklaşık)
  if (lat < 35 || lat > 43 || lng < 25 || lng > 45) {
    return fail('Koordinatlar Türkiye sınırları dışında. Sistem sadece Türkiye adreslerini destekler.', 400)
  }

  const result = await reverseGeocode(lat, lng)
  return ok(result, 'Konum bilgisi başarıyla alındı.')
})
