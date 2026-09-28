'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'

const ONESIGNAL_APP_ID = '6bddc78e-79e7-4701-9e46-6fca772e402a'
const ONESIGNAL_SAFARI_WEB_ID = 'web.onesignal.auto.15375e9b-dec0-4164-84de-dd8ada8f8fb7'

export default function OneSignalInit() {
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isAuthenticated || !user) return

    let initialized = false

    const setupOneSignal = async () => {
      // SDK yüklü mü bekle
      const waitForSDK = () => {
        return new Promise<void>((resolve) => {
          let attempts = 0
          const check = () => {
            attempts++
            if (attempts > 30) {
              console.warn('[OneSignal] SDK yüklenemedi (30 deneme)')
              resolve()
              return
            }
            if ((window as any).OneSignal) {
              resolve()
            } else {
              setTimeout(check, 300)
            }
          }
          check()
        })
      }

      await waitForSDK()

      const OneSignal = (window as any).OneSignal
      if (!OneSignal) {
        console.warn('[OneSignal] SDK bulunamadı')
        return
      }

      // Daha önce init edildiyse tekrar etme
      if (initialized) return
      initialized = true

      try {
        // v16: OneSignalDeferred ile init
        window.OneSignalDeferred = window.OneSignalDeferred || []

        window.OneSignalDeferred.push(async function (OS: any) {
          try {
            await OS.init({
              appId: ONESIGNAL_APP_ID,
              safari_web_id: ONESIGNAL_SAFARI_WEB_ID,
              notifyButton: {
                enable: true,
                position: 'bottom-left',
                size: 'medium',
                showCredit: false,
                text: {
                  'tip.state.unsubscribed': 'Bildirimlere abone ol',
                  'tip.state.subscribed': 'Bildirimlere abonesiniz ✓',
                  'tip.state.blocked': 'Bildirimleri engellediniz',
                  'message.prenotify': 'Bildirimlere abone olmak için tıklayın',
                  'message.action.subscribed': 'Abone olduğunuz için teşekkürler! 🎉',
                  'message.action.resubscribed': 'Bildirimlere tekrar abone oldunuz',
                  'message.action.unsubscribed': 'Artık bildirim almayacaksınız',
                  'dialog.main.title': 'Bildirimleri Yönet',
                  'dialog.main.button.subscribe': 'Abone Ol',
                  'dialog.main.button.unsubscribe': 'Aboneliği İptal Et',
                },
              },
              serviceWorker: {
                path: '/OneSignalSDKWorker.js',
                registrationScope: '/',
              },
              allowLocalhostAsSecureOrigin: true,
            })

            console.log('[OneSignal] Init başarılı')

            // Tag'leri ekle — try/catch ile sarmala
            try {
              await OS.User.addTag('user_id', user.id)
              await OS.User.addTag('role', user.role || 'WORKER')
              console.log('[OneSignal] Tag eklendi:', user.id, user.role)
            } catch (tagErr) {
              console.warn('[OneSignal] Tag ekleme hatası:', tagErr)
            }

            // Push izni kontrol et — v16 API
            try {
              const permission = await OS.Notifications.permission
              console.log('[OneSignal] İzin durumu:', permission)

              if (permission === 'default') {
                // 3 sn sonra otomatik izin iste
                setTimeout(async () => {
                  try {
                    const granted = await OS.Notifications.requestPermission()
                    console.log('[OneSignal] İzin sonucu:', granted)
                    if (granted) {
                      await OS.Notifications.subscribe()
                      console.log('[OneSignal] Abone olundu!')
                    }
                  } catch (permErr) {
                    console.warn('[OneSignal] İzin isteme hatası:', permErr)
                  }
                }, 3000)
              }
            } catch (permErr) {
              console.warn('[OneSignal] Permission API hatası:', permErr)
            }
          } catch (initErr) {
            console.error('[OneSignal] Init hatası:', initErr)
            // Fallback: tag'leri yine eklemeye çalış
            try {
              await OS.User.addTag('user_id', user.id)
              await OS.User.addTag('role', user.role || 'WORKER')
            } catch {}
          }
        })
      } catch (e) {
        console.error('[OneSignal] Setup hatası:', e)
      }
    }

    setupOneSignal()
  }, [isAuthenticated, user])

  return null
}
