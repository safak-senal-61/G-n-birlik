/**
 * OneSignal Helper — Client side
 * Kullanıcı login/logout olduğunda OneSignal'a login, tag ekle/kaldır, email bağla
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
 * OneSignalDeferred push ile login, email ve tag ekle (init sonrası otomatik çalışır)
 */
function isOneSignalSupported(): boolean {
  if (typeof window === 'undefined') return false
  const hostname = window.location.hostname
  return hostname === 'gunubirlik.space-z.ai' || hostname.endsWith('.space-z.ai')
}

/**
 * Kullanıcı login olduğunda çağrılır
 * OneSignalDeferred push ile login, email ve tag ekle (init sonrası otomatik çalışır)
 */
export async function registerOneSignalUser(userId: string, role: string, email?: string) {
  if (!isOneSignalSupported()) return

  try {
    const applyUser = async (OneSignal: any) => {
      try {
        if (!OneSignal) return
        if (typeof OneSignal.login === 'function') {
          await OneSignal.login(userId).catch(() => {})
        }
        if (OneSignal.User) {
          await OneSignal.User.addTag?.('user_id', userId)?.catch?.(() => {})
          await OneSignal.User.addTag?.('role', role)?.catch?.(() => {})
          if (email && typeof OneSignal.User.addEmail === 'function') {
            await OneSignal.User.addEmail(email)?.catch?.(() => {})
          }
        }
      } catch {
        // Sessizce devam et
      }
    }

    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(applyUser)
    } else if (window.OneSignal) {
      await applyUser(window.OneSignal)
    }
  } catch {
    // Sessizce devam et
  }
}

/**
 * Kullanıcı logout olduğunda çağrılır
 */
export async function unregisterOneSignalUser() {
  if (!isOneSignalSupported()) return

  try {
    const applyLogout = async (OneSignal: any) => {
      try {
        if (!OneSignal) return
        // OneSignal Web SDK v16: Sadece OneSignal hazırsa ve metot varsa güvenle dene
        if (typeof OneSignal.logout === 'function') {
          try {
            await OneSignal.logout()
          } catch {
            // SDK başlatılmamışsa veya oturum yoksa sessizce geç
          }
        }
        if (OneSignal.User) {
          try {
            await OneSignal.User.removeTag?.('user_id')?.catch?.(() => {})
            await OneSignal.User.removeTag?.('role')?.catch?.(() => {})
          } catch {
            // Sessizce geç
          }
        }
      } catch {
        // Sessizce devam et
      }
    }

    if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(applyLogout)
    } else if (window.OneSignal) {
      await applyLogout(window.OneSignal)
    }
  } catch {
    // Sessizce devam et
  }
}
