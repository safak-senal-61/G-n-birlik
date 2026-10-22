'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, Cookie, X } from 'lucide-react'

export interface CookiePreferences {
  essential: true
  functional: boolean
  analytics: boolean
  decidedAt: string
  decisionType: 'accepted_all' | 'declined_non_essential' | 'custom'
}

const STORAGE_KEY = 'gunubirlik_cookie_consent_v1'

export function openCookiePreferencesModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gunubirlik:open-cookie-preferences'))
  }
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative w-9 h-5 rounded-full shrink-0 transition-colors cursor-pointer ${
        on ? 'bg-[#0D6847]' : 'bg-[#3A423E]'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          on ? 'translate-x-4' : ''
        }`}
      />
    </button>
  )
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [functional, setFunctional] = useState(true)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const load = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved) as CookiePreferences
          setFunctional(Boolean(parsed.functional))
          setAnalytics(Boolean(parsed.analytics))
          return true
        }
      } catch {
        // ignore
      }
      return false
    }
    if (!load()) setVisible(true)

    const handleReopen = () => {
      load()
      setCustomizeOpen(true)
      setVisible(true)
    }
    window.addEventListener('gunubirlik:open-cookie-preferences', handleReopen)
    return () => window.removeEventListener('gunubirlik:open-cookie-preferences', handleReopen)
  }, [])

  const save = (
    type: CookiePreferences['decisionType'],
    fn: boolean,
    an: boolean
  ) => {
    const prefs: CookiePreferences = {
      essential: true,
      functional: fn,
      analytics: an,
      decidedAt: new Date().toISOString(),
      decisionType: type,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      document.cookie = `gb_cookie_consent=${type}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    } catch {
      // ignore
    }
    setFunctional(fn)
    setAnalytics(an)
    setVisible(false)
    setCustomizeOpen(false)
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Çerez Tercihleri"
      className="fixed z-[90] bottom-3 left-3 right-3 sm:right-auto sm:bottom-4 sm:left-4 sm:w-[360px] rounded-md border border-[#2B332F] bg-[#141716] text-[#F2F1ED] shadow-xl max-h-[85dvh] overflow-y-auto"
    >
      <div className="p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Cookie className="w-4 h-4 text-[#5CD6A5]" />
            <h2 className="text-[13px] font-bold text-white">Çerez tercihleri</h2>
          </div>
          <button
            type="button"
            aria-label="Kapat ve zorunlu olmayanları reddet"
            onClick={() => save('declined_non_essential', false, false)}
            className="text-[#949B97] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!customizeOpen ? (
          <>
            <p className="text-[11px] leading-relaxed text-[#B8BFBC]">
              Güvenli oturum ve ödeme için zorunlu çerezler kullanıyoruz. Tercihlerinizi hatırlamak ve
              anonim istatistik için diğer çerezlere izin verebilirsiniz.{' '}
              <Link href="/gizlilik-politikasi" className="text-[#5CD6A5] underline underline-offset-2">
                Detaylar
              </Link>
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => save('accepted_all', true, true)}
                className="h-8 rounded-xs bg-[#0D6847] hover:bg-[#0F7A53] text-white text-[11px] font-bold cursor-pointer"
              >
                Kabul Et
              </button>
              <button
                type="button"
                onClick={() => save('declined_non_essential', false, false)}
                className="h-8 rounded-xs bg-white hover:bg-[#EAE8E1] text-[#141615] text-[11px] font-bold cursor-pointer"
              >
                Reddet
              </button>
              <button
                type="button"
                onClick={() => setCustomizeOpen(true)}
                className="h-8 rounded-xs border border-[#3A423E] bg-[#1C211F] hover:bg-[#262C29] text-[11px] font-semibold cursor-pointer"
              >
                Özelleştir
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 p-2 rounded-xs bg-[#1A1F1D] border border-[#2B332F]">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#5CD6A5]" /> Zorunlu
                  </div>
                  <p className="text-[10px] text-[#949B97] leading-snug">Oturum, güvenlik, ödeme.</p>
                </div>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#0D6847]/30 text-[#5CD6A5] font-bold shrink-0">
                  HER ZAMAN
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 p-2 rounded-xs bg-[#1A1F1D] border border-[#2B332F]">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold">İşlevsel</div>
                  <p className="text-[10px] text-[#949B97] leading-snug">Tema, şehir ve bildirim tercihleri.</p>
                </div>
                <Toggle on={functional} onClick={() => setFunctional(!functional)} label="İşlevsel çerezler" />
              </div>

              <div className="flex items-center justify-between gap-3 p-2 rounded-xs bg-[#1A1F1D] border border-[#2B332F]">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold">Performans</div>
                  <p className="text-[10px] text-[#949B97] leading-snug">Anonim hız ve hata istatistikleri.</p>
                </div>
                <Toggle on={analytics} onClick={() => setAnalytics(!analytics)} label="Performans çerezleri" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => save('custom', functional, analytics)}
                className="h-8 rounded-xs border border-[#5CD6A5] text-[#5CD6A5] text-[11px] font-bold cursor-pointer"
              >
                Kaydet
              </button>
              <button
                type="button"
                onClick={() => save('accepted_all', true, true)}
                className="h-8 rounded-xs bg-[#0D6847] hover:bg-[#0F7A53] text-white text-[11px] font-bold cursor-pointer"
              >
                Tümünü Kabul Et
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
