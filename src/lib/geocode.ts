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
  /** Kapı / Bina No: "42" veya "15C" */
  houseNumber?: string
  /** Mahalle: "Caferağa Mahallesi" */
  neighbourhood?: string
  /** İlçe: "Kadıköy" veya "Ortahisar" */
  district?: string
  /** Şehir: "İstanbul" veya "Trabzon" */
  city?: string
  /** Eyalet/İl: "İstanbul" */
  state?: string
  /** Ülke: "Türkiye" */
  country?: string
  /** Posta kodu: "34710" */
  postcode?: string
  /** Input için derlenmiş açık adres: "Caferağa Mah., Moda Cad. No:42" */
  formattedAddress?: string
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

  const road = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path || ''
  const houseNumber = addr.house_number || ''
  const streetWithNumber = road ? (houseNumber ? `${road} No:${houseNumber}` : road) : ''

  const neighbourhood =
    addr.neighbourhood ||
    addr.quarter ||
    (addr.suburb && addr.suburb !== addr.town && addr.suburb !== addr.county ? addr.suburb : '') ||
    addr.residential ||
    ''

  const rawDistrict =
    addr.town ||
    addr.county ||
    addr.city_district ||
    addr.borough ||
    (addr.suburb !== neighbourhood ? addr.suburb : '') ||
    ''

  const rawCity = addr.province || addr.city || addr.state || addr.municipality || ''
  const cleanCity = rawCity.replace(/ (İli|Ili|Province|Büyükşehir Belediyesi)$/i, '').trim()
  const cleanDistrict = rawDistrict.replace(/ (İlçesi|Ilcesi|District)$/i, '').trim()

  const formattedParts: string[] = []
  if (neighbourhood) {
    formattedParts.push(neighbourhood.replace(/ Mahallesi$/i, ' Mah.'))
  }
  if (streetWithNumber) {
    formattedParts.push(streetWithNumber)
  }

  const formattedAddress =
    formattedParts.join(', ') ||
    (data.display_name ? data.display_name.split(',').slice(0, 3).join(', ').trim() : '')

  const result: ReverseGeocodeResult = {
    displayName: data.display_name || '',
    street: streetWithNumber || undefined,
    houseNumber: houseNumber || undefined,
    neighbourhood: neighbourhood || undefined,
    district: cleanDistrict || undefined,
    city: cleanCity || undefined,
    state: addr.state,
    country: addr.country,
    postcode: addr.postcode,
    formattedAddress: formattedAddress || undefined,
  }

  // Türkiye için fallback
  if (!result.city && result.state) {
    result.city = result.state.replace(/ (İli|Ili|Province)$/i, '').trim()
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

// ====================================================================
// FORWARD GEOCODING - Adres → Koordinat
// ====================================================================

export interface ForwardGeocodeResult {
  /** Formatlanmış tam adres */
  displayName: string
  /** Enlem */
  lat: number
  /** Boylam */
  lng: number
  /** Şehir */
  city?: string
  /** İlçe */
  district?: string
  /** Mahalle */
  neighbourhood?: string
  /** Sokak/cadde */
  street?: string
  /** Posta kodu */
  postcode?: string
  /** Bulunan sonucun tipi (city, residential, road vb.) */
  type?: string
  /** Bulunan sonucun önem derecesi (0-1) */
  importance?: number
}

// Forward cache
const forwardCache = new Map<string, { data: ForwardGeocodeResult[]; ts: number }>()

/**
 * Adres/metin aramasından koordinat çıkarır (forward geocoding)
 * Örnek: "Kadıköy İstanbul" → [{ lat: 40.99, lng: 29.02, ... }]
 *
 * @param query Arama metni (mahalle, sokak, şehir adı)
 * @param limit Maksimum sonuç sayısı (varsayılan 5)
 * @param countryCodes Ülke kodları (varsayılan: tr)
 */
export async function forwardGeocode(
  query: string,
  limit = 5,
  countryCodes = 'tr'
): Promise<ForwardGeocodeResult[]> {
  if (!query || query.trim().length < 3) return []

  const cacheKey = `${query.trim().toLowerCase()}:${limit}:${countryCodes}`
  const cached = forwardCache.get(cacheKey)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data
  }

  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
    query
  )}&limit=${limit}&countrycodes=${countryCodes}&accept-language=tr&addressdetails=1`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'GunubirlikIsBulma/1.0 (contact@gunubirlik.com)',
    },
  })

  if (!res.ok) {
    throw new Error(`Forward geocoding hatası: ${res.status}`)
  }

  const data = (await res.json()) as any[]
  const results: ForwardGeocodeResult[] = data.map((item) => {
    const addr = item.address || {}
    return {
      displayName: item.display_name || '',
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      city: addr.city || addr.town || addr.village || addr.municipality || addr.state,
      district: addr.city_district || addr.borough || addr.county || addr.suburb,
      neighbourhood: addr.neighbourhood || addr.suburb || addr.quarter || addr.residential,
      street: addr.road || addr.pedestrian || addr.footway || addr.cycleway,
      postcode: addr.postcode,
      type: item.type,
      importance: item.importance,
    }
  })

  forwardCache.set(cacheKey, { data: results, ts: Date.now() })
  return results
}

/**
 * Suggest (autocomplete) - Yazdıkça öneri getirir
 * Kısa query'ler için optimize edilmiştir
 */
export async function suggestLocations(
  query: string,
  limit = 5
): Promise<ForwardGeocodeResult[]> {
  // 3 karakterden kısa ise öneri getirme
  if (!query || query.trim().length < 3) return []
  // Çok uzun query'leri kısalt
  const trimmedQuery = query.trim().slice(0, 100)
  return forwardGeocode(trimmedQuery, limit, 'tr')
}
