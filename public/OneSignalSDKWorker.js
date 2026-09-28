/**
 * OneSignal v16 Service Worker
 * OneSignal SDK tarafından otomatik yüklenir
 * importScripts yerine direkt yüklenir (evaluation error fix)
 */

// OneSignal worker'ını yükle
try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.worker.js");
} catch (e) {
  // Yükleme başarısız olursa sessizce devam et
  console.error("OneSignal ServiceWorker yüklenemedi:", e);
}
