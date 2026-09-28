/**
 * Next.js Middleware - Bakım modu kontrolü (OPTIMIZE EDİLDİ)
 *
 * ÖNCEKİ SORUN: Her istekte fetch yapıyordu, bu da dev modunda sürekli
 * "Compiling..." mesajlarına ve performans düşüklüğüne neden oluyordu.
 *
 * ÇÖZÜM: Middleware tamamen kaldırıldı. Bakım modu artık şu şekilde çalışıyor:
 *  1. Frontend (src/app/page.tsx) mount'ta /api/v1/maintenance/status çağırır
 *  2. Bakım modu açıksa MaintenanceScreen gösterir
 *  3. API istekleri: Backend route'ları zaten auth gerektiriyor,
 *     bakım modunda normal kullanıcılar token olmadan erişemez (401),
 *     adminler token ile erişir
 *
 * Middleware'i tamamen devre dışı bırakıyoruz — gerek yok.
 * Çünkü frontend zaten bakım kontrolü yapıyor.
 */

// Middleware'i devre dışı bırak — boş fonksiyon
export function middleware() {
  // No-op
}

export const config = {
  // Hiçbir yol için middleware çalışmasın
  matcher: [],
}
