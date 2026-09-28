/**
 * OneSignal Helper — Client side
 * Kullanıcı login/logout olduğunda OneSignal'a tag ekle/kaldır
 * Tüm çağrılar try/catch ile sarmalanır — hata durumunda sessizce devam eder
 */

declare global {
  interface Window {
    OneSignalDeferred?: any[]
    OneSignal?: any
  }
}

/**
 * Kullanıcı login olduğunda çağrılır
 * OneSignalDeferred push ile tag ekle (init sonrası otomatik çalışır)
 */
export async function registerOneSignalUser(userId: string, role: string) {
  if (typeof window === 'undefined') return

  try {
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          await OneSignal.User.addTag('user_id', userId)
          await OneSignal.User.addTag('role', role)
          console.log('[OneSignal] User registered:', userId, role)
        } catch (e) {
          console.warn('[OneSignal] Tag ekleme hatası (deferred):', e)
        }
      })
    } else if (window.OneSignal) {
      try {
        await window.OneSignal.User.addTag('user_id', userId)
        await window.OneSignal.User.addTag('role', role)
        console.log('[OneSignal] User registered:', userId, role)
      } catch (e) {
        console.warn('[OneSignal] Tag ekleme hatası:', e)
      }
    }
  } catch (e) {
    console.warn('[OneSignal] Register error:', e)
  }
}

/**
 * Kullanıcı logout olduğunda çağrılır
 */
export async function unregisterOneSignalUser() {
  if (typeof window === 'undefined') return

  try {
    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async function (OneSignal: any) {
        try {
          await OneSignal.User.removeTag('user_id')
          await OneSignal.User.removeTag('role')
          console.log('[OneSignal] User unregistered')
        } catch (e) {
          console.warn('[OneSignal] Tag silme hatası (deferred):', e)
        }
      })
    } else if (window.OneSignal) {
      try {
        await window.OneSignal.User.removeTag('user_id')
        await window.OneSignal.User.removeTag('role')
        console.log('[OneSignal] User unregistered')
      } catch (e) {
        console.warn('[OneSignal] Tag silme hatası:', e)
      }
    }
  } catch (e) {
    console.warn('[OneSignal] Unregister error:', e)
  }
}
