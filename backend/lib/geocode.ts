/**
 * Reverse Geocoding - OpenStreetMap Nominatim API
 * Verilen lat/lng koordinatından şehir, ilçe, mahalle, sokak bilgisini çıkarır.
 *
 * Not: Nominatim ücretsiz bir servistir. Production'da:
 *  - 1 saniyede 1 istek limiti var
 *  - User-Agent header'ı zorunlu
 *  - Yüksek hacim için kendi Nominatim sunucunuzu kurmanız önerilir
 */

export interface ReverseGeocodeResult {
  /** Formatlanmış tam adres: "Moda Mah. Caferağa, Kadıköy, İstanbul, Türkiye" */
  displayName: string
  /** Sokak + kapı no: "Moda Cad. No:42" */
  street?: string
  /** Mahalle: "Caferağa Mahallesi" */
  neighbourhood?: string
  /** İlçe: "Kadıköy" */
  district?: string
  /** Şehir: "İstanbul" */
  city?: string
  /** Eyalet/İl: "İstanbul" */
  state?: string
  /** Ülka: "Türkiye" */
  country?: string
  /** Posta kodu: "34710" */
  postcode?: string
}

// Basit in-memory cache (5 dakika)
const cache = new Map<string, { data: ReverseGeocodeResult; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000

/**
 * Koordinatları adrese çevirir (reverse geocoding)
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<ReverseGeocodeResult> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=tr&addressdetails=1`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'GunubirlikIsBulma/1.0 (contact@gunubirlik.com)',
    },
    signal,
  })

  if (!res.ok) {
    throw new Error(`Geocoding hatası: ${res.status}`)
  }

  const data = await res.json()
  const addr = data.address || {}

  const result: ReverseGeocodeResult = {
    displayName: data.display_name || '',
    street: addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path,
    neighbourhood:
      addr.neighbourhood || addr.suburb || addr.quarter || addr.city_district || addr.residential,
    district: addr.city_district || addr.borough || addr.county || addr.suburb,
    city: addr.city || addr.town || addr.village || addr.municipality,
    state: addr.state,
    country: addr.country,
    postcode: addr.postcode,
  }

  // Türkiye için district/city düzeltmesi
  // Nominatim bazen "İstanbul"u state olarak veriyor, city boş kalıyor
  if (!result.city && result.state) {
    result.city = result.state
  }

  cache.set(cacheKey, { data: result, ts: Date.now() })
  return result
}

/**
 * Kısa konum açıklaması döner
 * Örnek: "Caferağa Mah., Kadıköy / İstanbul"
 */
export function formatShortLocation(loc: ReverseGeocodeResult): string {
  const parts: string[] = []
  if (loc.neighbourhood) parts.push(loc.neighbourhood.replace(' Mahallesi', ' Mah.'))
  if (loc.district) parts.push(loc.district)
  if (loc.city && loc.city !== loc.district) parts.push(loc.city)

  if (parts.length === 0) return loc.displayName.split(',').slice(0, 3).join(',')

  return parts.join(', ')
}

/**
 * Çok kısa konum açıklaması (kartlarda kullanım için)
 * Örnek: "Kadıköy, İstanbul"
 */
export function formatVeryShortLocation(loc: ReverseGeocodeResult): string {
  const parts: string[] = []
  if (loc.district) parts.push(loc.district)
  if (loc.city && loc.city !== loc.district) parts.push(loc.city)
  return parts.join(', ') || loc.displayName.split(',').slice(0, 2).join(', ')
}

/**
 * Sokak seviyesinde adres döner
 * Örnek: "Moda Cad. No:42, Caferağa Mah."
 */
export function formatStreetLocation(loc: ReverseGeocodeResult): string {
  const parts: string[] = []
  if (loc.street) parts.push(loc.street)
  if (loc.neighbourhood) parts.push(loc.neighbourhood.replace(' Mahallesi', ' Mah.'))
  return parts.join(', ') || formatShortLocation(loc)
}
