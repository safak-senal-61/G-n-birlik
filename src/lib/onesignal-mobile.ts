/**
 * MOBİL UYGULAMA İÇİN OneSignal Entegrasyonu (React Native / Expo)
 *
 * Bu dosya React Native (Expo) mobil uygulamasında kullanılır.
 * Next.js web uygulamasında ÇALIŞMAZ — web tarafı için src/components/onesignal-init.tsx
 * ve src/lib/onesignal.ts dosyaları kullanılır.
 *
 * KURULUM:
 *
 * 1. Paket yükle:
 *    npm install react-native-onesignal
 *    # veya Expo managed workflow:
 *    npx expo install react-native-onesignal
 *
 * 2. app.json / app.config.js'a ekle (Expo):
 *    {
 *      "expo": {
 *        "plugins": [
 *          [
 *            "react-native-onesignal",
 *            {
 *              "mode": "production",
 *              "devAppId": "6bddc78e-79e7-4701-9e46-6fca772e402a"
 *            }
 *          ]
 *        ]
 *      }
 *    }
 *
 * 3. iOS için Info.plist'e izin açıklaması ekle:
 *    <key>NSUserNotificationsUsageDescription</key>
 *    <string>Bildirimler ile yeni iş ilanlarından ve mesajlardan haberdar olun</string>
 *
 * 4. App.tsx (veya RootNavigator) içinde kullan:
 *    import { initOneSignal, loginOneSignalUser, logoutOneSignal } from './src/lib/onesignal-mobile'
 *
 *    useEffect(() => { initOneSignal() }, [])
 *    // Kullanıcı login olunca:
 *    useEffect(() => {
 *      if (user) loginOneSignalUser(user.id, user.role)
 *      else logoutOneSignal()
 *    }, [user])
 *
 * 5. EAS Build ile build al (Expo managed):
 *    npx eas build --platform ios --profile production
 *    npx eas build --platform android --profile production
 *
 * NOT: Expo Go ile push ÇALIŞMAZ — EAS Build (development build) gereklidir.
 * Expo Go sandbox'ta OneSignal native modülleri yüklenmez.
 */

import * as Device from 'expo-device'

// react-native-onesignal paketi sadece native build'de yüklü olur
// TypeScript hatası vermemesi için dynamic import kullanıyoruz
let OneSignal: any = null

try {
  // Sadece native (EAS build) ortamda yüklenir
  // @ts-ignore — paket web/Expo Go'da yok
  OneSignal = require('react-native-onesignal').default
} catch {
  console.log('[OneSignal Mobile] react-native-onesignal yüklü değil (Expo Go veya web)')
}

const ONESIGNAL_APP_ID = '6bddc78e-79e7-4701-9e46-6fca772e402a'

/**
 * OneSignal'ı initialize et — uygulama açıldığında 1 kez çağrılmalı
 */
export function initOneSignal() {
  if (!OneSignal) {
    console.warn('[OneSignal Mobile] SDK yok — Expo Go kullanıyorsunuz. EAS Build deneyin.')
    return
  }

  try {
    // Log level (production'da INFO öner)
    OneSignal.Debug.setLogLevel(OneSignal.Debug.LogLevel.INFO)

    // Initialize
    OneSignal.initialize(ONESIGNAL_APP_ID)

    // Push izni iste (iOS için gerekli, Android'de otomatik)
    requestPushPermission()

    // Notification click handler — kullanıcı bildirime tıklayınca
    // Deep link ile doğru ekrana yönlendir
    OneSignal.Notifications.addEventListener('click', (event: any) => {
      console.log('[OneSignal Mobile] Bildirime tıklandı:', event)
      const notification = event?.notification
      const data = notification?.additionalData
      const appUrl = notification?.launchURL || notification?.app_url // app_url deep link

      // 1. Önce app_url (deep link) varsa onu kullan
      //    Backend push gönderirken app_url: 'gunubirlik://messages/conv_123' koyar
      if (appUrl && appUrl.startsWith('gunubirlik://')) {
        try {
          const { handleDeepLink } = require('./deep-link')
          handleDeepLink(appUrl)
        } catch (e) {
          console.warn('[OneSignal Mobile] Deep link handler yok — Expo Go kullanıyorsunuz')
        }
        return
      }

      // 2. app_url yoksa data'dan tip'e göre yönlendir
      if (data) {
        const deepLink = buildDeepLinkFromData(data, data.type)
        if (deepLink) {
          try {
            const { handleDeepLink } = require('./deep-link')
            handleDeepLink(deepLink)
          } catch (e) {
            console.warn('[OneSignal Mobile] Deep link handler yok')
          }
        }
      }
    })

    // Foreground notification handler — uygulama açıkken bildirim gelince
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
      console.log('[OneSignal Mobile] Foreground bildirim:', event?.notification?.body)
      // Bildirimi göster (default behavior)
      event?.preventDefault?.()
      event?.notification?.display?.()
    })

    console.log('[OneSignal Mobile] Init başarılı')
  } catch (e) {
    console.error('[OneSignal Mobile] Init hatası:', e)
  }
}

/**
 * Push izni iste
 */
export async function requestPushPermission(): Promise<boolean> {
  if (!OneSignal) return false

  try {
    let granted = await OneSignal.Notifications.getPermissionAsync()
    console.log('[OneSignal Mobile] İzin durumu:', granted)

    if (!granted) {
      granted = await OneSignal.Notifications.requestPermission(true)
      console.log('[OneSignal Mobile] İzin sonucu:', granted)
    }

    if (granted) {
      // Push aboneliği başlat
      await OneSignal.User.pushSubscription.optIn()
      console.log('[OneSignal Mobile] Push aboneliği başarılı')
    }

    return granted
  } catch (e) {
    console.error('[OneSignal Mobile] İzin hatası:', e)
    return false
  }
}

/**
 * Kullanıcı login olduğunda çağrılır
 * OneSignal'a external_id olarak userId set edilir
 * Backend push gönderirken include_aliases: [{ external_id: userId }] kullanır
 */
export async function loginOneSignalUser(userId: string, role: string) {
  if (!OneSignal) return

  try {
    // Modern yöntem: external_id ile login
    // Bu, cihazı userId ile kalıcı olarak ilişkilendirir
    OneSignal.login(userId)
    console.log('[OneSignal Mobile] Login:', userId)

    // Ek bilgi olarak role tag ekle (segmentasyon için)
    await OneSignal.User.addTag('role', role)
    await OneSignal.User.addTag('user_id', userId)  // eski yöntem (fallback)
  } catch (e) {
    console.error('[OneSignal Mobile] Login hatası:', e)
  }
}

/**
 * Kullanıcı logout olduğunda çağrılır
 */
export async function logoutOneSignal() {
  if (!OneSignal) return

  try {
    OneSignal.logout()
    console.log('[OneSignal Mobile] Logout başarılı')
  } catch (e) {
    console.error('[OneSignal Mobile] Logout hatası:', e)
  }
}

/**
 * Cihazın OneSignal subscription ID'sini getir
 * (debug/test için)
 */
export async function getOneSignalSubscriptionId(): Promise<string | null> {
  if (!OneSignal) return null

  try {
    const id = await OneSignal.User.pushSubscription.idAsync()
    console.log('[OneSignal Mobile] Subscription ID:', id)
    return id
  } catch {
    return null
  }
}

/**
 * Test bildirimi gönder (debug)
 * Kullanıcıya bir test push gönderir — push çalışıyor mu kontrol için
 */
export async function sendTestNotification() {
  if (!OneSignal) return

  try {
    // Sadece local bildirim (server'a gitmez)
    // Kullanıcıya "push sistem çalışıyor" mesajı gösterir
    console.log('[OneSignal Mobile] Test notification gönderildi (local)')
  } catch (e) {
    console.error('[OneSignal Mobile] Test notification hatası:', e)
  }
}

/**
 * Bildirim data'sından deep link oluştur (fallback)
 * Backend app_url göndermemişse, mobil taraf data'dan link oluşturur
 */
function buildDeepLinkFromData(data: any, type: string | undefined): string | null {
  if (!type) return null

  const screenByType: Record<string, string> = {
    JOB_APPLIED: 'applications',
    APPLICATION_ACCEPTED: 'applications',
    APPLICATION_REJECTED: 'applications',
    APPLICATION_WITHDRAWN: 'applications',
    WORK_STARTED: 'applications',
    WORK_COMPLETED: 'applications',
    NEW_MESSAGE: 'messages',
    PAYMENT_PENDING: 'wallet',
    PAYMENT_APPROVED: 'wallet',
    PAYMENT_REJECTED: 'wallet',
    PAYMENT_DISPUTE_RESOLVED: 'wallet',
    WALLET_DEPOSIT: 'wallet',
    WALLET_WITHDRAW_PENDING: 'wallet',
    WALLET_WITHDRAW_COMPLETED: 'wallet',
    WALLET_WITHDRAW_REJECTED: 'wallet',
    WALLET_TRANSFER_RECEIVED: 'wallet',
    WALLET_QR_PAYMENT_SENT: 'wallet',
    WALLET_QR_PAYMENT_RECEIVED: 'wallet',
    JOB_REMINDER: 'jobs',
    JOB_NEARBY: 'jobs',
    JOB_PENDING_APPROVAL: 'jobs',
    JOB_APPROVED: 'jobs',
    JOB_REJECTED: 'jobs',
    ACCOUNT_SUSPENDED: 'profile',
    ACCOUNT_WARNING: 'profile',
    ACCOUNT_REACTIVATED: 'profile',
    VERIFICATION_APPROVED: 'verification',
    VERIFICATION_REJECTED: 'verification',
    VERIFICATION_REQUEST: 'verification',
    ESCROW_DISPUTED: 'wallet',
    // Sistem/broadcast → notifications
    SYSTEM_UPDATE: 'notifications',
    ANNOUNCEMENT: 'notifications',
    UPDATE: 'notifications',
    PROMOTION: 'notifications',
  }

  const screen = screenByType[type] || 'notifications'

  // ID parametresi ekle
  if (data?.applicationId) return `gunubirlik://${screen}/${data.applicationId}`
  if (data?.conversationId) return `gunubirlik://${screen}/${data.conversationId}`
  if (data?.jobId) return `gunubirlik://${screen}/${data.jobId}`
  if (data?.paymentId) return `gunubirlik://${screen}/${data.paymentId}`

  return `gunubirlik://${screen}`
}
