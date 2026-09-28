/**
 * MOBİL UYGULAMA İÇİN Deep Link Handler (React Native / Expo)
 *
 * Bu dosya React Native (Expo) mobil uygulamasında kullanılır.
 * Next.js web uygulamasında ÇALIŞMAZ.
 *
 * Backend push gönderirken app_url parametresine deep link koyar:
 *   gunubirlik://notifications
 *   gunubirlik://messages/conv_123
 *   gunubirlik://applications/app_456
 *   gunubirlik://wallet
 *   gunubirlik://jobs/job_789
 *   gunubirlik://verification
 *
 * Mobil uygulama:
 *   1. Push bildirime tıklanınca OneSignal app_url'yi alır
 *   2. Expo Linking ile gunubirlik:// scheme'ını yakalar
 *   3. Aşağıdaki handler URL'i parse eder
 *   4. Doğru ekrana navigate eder
 *
 * KURULUM:
 *
 * 1. app.config.js'e URL scheme ekle:
 *    export default {
 *      expo: {
 *        scheme: "gunubirlik",
 *        // ... diğer config
 *      }
 *    }
 *
 * 2. App.tsx'te handler'ı çağır:
 *    import { initDeepLinking, handleDeepLink } from './src/lib/deep-link'
 *
 *    useEffect(() => {
 *      initDeepLinking(navigationRef)
 *      return () => {}
 *    }, [])
 *
 * 3. NavigationRef oluştur (React Navigation):
 *    const navigationRef = useNavigationContainerRef()
 */

import { Linking } from 'react-native'
import * as ExpoLinking from 'expo-linking'

// Navigation ref — React Navigation'dan gelir
let navigationRef: any = null

export function setNavigationRef(ref: any) {
  navigationRef = ref
}

/**
 * Deep link handler'ı başlat
 * - Uygulama cold start ile açıldığında gelen linki yakala
 * - Uygulama açıkken gelen linki yakala
 *
 * @param navigationRef React Navigation container ref
 */
export function initDeepLinking(navRef: any) {
  setNavigationRef(navRef)

  // 1. Uygulama kapalıyken bildirime tıklandı, açıldı
  (async () => {
    try {
      const initialUrl = await Linking.getInitialURL()
      if (initialUrl) {
        console.log('[DeepLink] Initial URL:', initialUrl)
        handleDeepLink(initialUrl)
      }
    } catch (e) {
      console.warn('[DeepLink] Initial URL alınamadı:', e)
    }
  })()

  // 2. Uygulama açıkken bildirime tıklandı
  const subscription = Linking.addEventListener('url', ({ url }) => {
    console.log('[DeepLink] URL event:', url)
    handleDeepLink(url)
  })

  return () => {
    subscription.remove()
  }
}

/**
 * Deep link'i parse edip doğru ekrana navigate et
 *
 * Örnekler:
 *   gunubirlik://notifications              → navigate('Notifications')
 *   gunubirlik://messages                   → navigate('Messages')
 *   gunubirlik://messages/conv_123          → navigate('Conversation', { id: 'conv_123' })
 *   gunubirlik://applications               → navigate('Applications')
 *   gunubirlik://applications/app_456       → navigate('ApplicationDetail', { id: 'app_456' })
 *   gunubirlik://jobs                       → navigate('Jobs')
 *   gunubirlik://jobs/job_789               → navigate('JobDetail', { id: 'job_789' })
 *   gunubirlik://wallet                     → navigate('Wallet')
 *   gunubirlik://verification               → navigate('Verification')
 *   gunubirlik://profile                    → navigate('Profile')
 */
export function handleDeepLink(url: string) {
  if (!url) return

  try {
    // URL'i parse et
    // gunubirlik://messages/conv_123 → { hostname: 'messages', path: '/conv_123' }
    const parsed = ExpoLinking.parse(url)
    const screen = parsed.hostname || parsed.path?.split('/')[0] || 'notifications'
    const param = parsed.path?.split('/')[1] || null

    console.log('[DeepLink] Parse:', { screen, param, raw: url })

    if (!navigationRef) {
      console.warn('[DeepLink] navigationRef yok — setNavigationRef çağrılmamış')
      return
    }

    // Screen'e göre navigate
    switch (screen) {
      case 'notifications':
        navigationRef.navigate('Notifications')
        break

      case 'messages':
        if (param) {
          // Belirli konuşma
          navigationRef.navigate('Conversation', { conversationId: param })
        } else {
          // Mesajlar listesi
          navigationRef.navigate('Messages')
        }
        break

      case 'applications':
        if (param) {
          // Başvuru detayı
          navigationRef.navigate('ApplicationDetail', { applicationId: param })
        } else {
          // Başvurular listesi
          navigationRef.navigate('Applications')
        }
        break

      case 'jobs':
        if (param) {
          // İlan detayı
          navigationRef.navigate('JobDetail', { jobId: param })
        } else {
          // İş ilanları listesi
          navigationRef.navigate('Jobs')
        }
        break

      case 'wallet':
        navigationRef.navigate('Wallet')
        break

      case 'verification':
        navigationRef.navigate('Verification')
        break

      case 'profile':
        navigationRef.navigate('Profile')
        break

      default:
        console.warn('[DeepLink] Bilinmeyen screen:', screen)
        // Default olarak notifications'a git
        navigationRef.navigate('Notifications')
    }
  } catch (e) {
    console.error('[DeepLink] Parse hatası:', e, 'URL:', url)
    // Hata durumunda ana ekrana dön
    if (navigationRef) {
      navigationRef.navigate('Home')
    }
  }
}

/**
 * Web URL'i deep link'e çevir (test için)
 * Örnek: https://gunubirlik.com/messages → gunubirlik://messages
 */
export function webUrlToDeepLink(webUrl: string): string {
  try {
    const url = new URL(webUrl)
    const path = url.pathname.replace(/^\//, '')
    return `gunubirlik://${path}`
  } catch {
    return 'gunubirlik://notifications'
  }
}
