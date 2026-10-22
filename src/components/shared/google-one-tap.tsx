'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '411578437442-gs1rck2124rgr516fe9dn9tuu15ge9ig.apps.googleusercontent.com'

export const GOOGLE_PENDING_KEY = 'gb_google_pending_registration'

/**
 * Google One Tap: giriş yapmamış ziyaretçilere tarayıcıda oturum açık olan
 * Google hesaplarını (Gmail) tek tıkla giriş için gösterir.
 */
export default function GoogleOneTap() {
  const pathname = usePathname()
  const { isAuthenticated, isLoading, loginWithGoogle } = useAuth()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isLoading || isAuthenticated) return
    if (pathname?.startsWith('/admin')) return

    let cancelled = false

    const init = () => {
      const gid = (window as any).google?.accounts?.id
      if (!gid || cancelled) return

      gid.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: false,
        cancel_on_tap_outside: false,
        itp_support: true,
        use_fedcm_for_prompt: true,
        callback: async (response: any) => {
          if (!response?.credential) return
          try {
            const res = await loginWithGoogle(response.credential)
            if (res?.requiresRegistration) {
              // Yeni kullanıcı: rol seçimi + bilgi + sözleşme onayı zorunlu
              sessionStorage.setItem(
                GOOGLE_PENDING_KEY,
                JSON.stringify({ token: response.credential, profile: res.googleProfile })
              )
              useApp.getState().openAuthModal({
                title: 'Google Kaydınızı Tamamlayın',
                tab: 'register',
              })
              return
            }
            useApp.getState().closeAuthModal()
            toast.success('Google ile giriş yapıldı')
          } catch (err: any) {
            toast.error('Google ile giriş yapılamadı', { description: err?.message })
          }
        },
      })
      gid.prompt()
    }

    if ((window as any).google?.accounts?.id) {
      init()
    } else {
      let script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      ) as HTMLScriptElement | null
      if (!script) {
        script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
      script.addEventListener('load', init, { once: true })
    }

    return () => {
      cancelled = true
      try {
        ;(window as any).google?.accounts?.id?.cancel()
      } catch {
        // ignore
      }
    }
  }, [isAuthenticated, isLoading, pathname, loginWithGoogle])

  return null
}
