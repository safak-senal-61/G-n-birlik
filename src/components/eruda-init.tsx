'use client'

import { useEffect } from 'react'

/**
 * Eruda Debug Console Loader
 * Mobil ve web tarayıcılarda debug console gösterir.
 * Sağ alt köşede küçük bir buton belirir, tıklayınca console açılır.
 *
 * npm ile yüklenen eruda kullanılır (CDN sorunları için).
 */
export default function ErudaInit() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Eruda zaten yüklü mü kontrol
    if ((window as any).__erudaInitialized) return
    ;(window as any).__erudaInitialized = true

    try {
      // Dynamically import eruda (npm package)
      import('eruda').then((erudaModule) => {
        const eruda = erudaModule.default || erudaModule
        if (eruda && typeof eruda.init === 'function') {
          eruda.init({
            tool: ['console', 'network', 'elements', 'resources', 'sources', 'info'],
          })
          console.log('[Eruda] Debug console aktif (npm)')
        }
      }).catch((e) => {
        console.error('[Eruda] Import hatası:', e)
      })
    } catch (e) {
      console.error('[Eruda] Init hatası:', e)
    }
  }, [])

  return null
}
