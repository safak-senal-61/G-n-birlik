'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, SlidersHorizontal, Check, X, Cookie } from 'lucide-react'

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

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const [functional, setFunctional] = useState(true)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) {
        setVisible(true)
      } else {
        const parsed = JSON.parse(saved) as CookiePreferences
        setFunctional(Boolean(parsed.functional))
        setAnalytics(Boolean(parsed.analytics))
      }
    } catch {
      setVisible(true)
    }

    const handleReopen = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved) as CookiePreferences
          setFunctional(Boolean(parsed.functional))
          setAnalytics(Boolean(parsed.analytics))
        }
      } catch {
        // ignore
      }
      setCustomizeOpen(true)
      setVisible(true)
    }

    window.addEventListener('gunubirlik:open-cookie-preferences', handleReopen)
    return () => {
      window.removeEventListener('gunubirlik:open-cookie-preferences', handleReopen)
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
      document.cookie = `gb_cookie_consent=${prefs.decisionType}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    } catch {
      // ignore storage errors
    }
    setVisible(false)
    setCustomizeOpen(false)
  }

  const handleAcceptAll = () => {
    setFunctional(true)
    setAnalytics(true)
    savePreferences({
      essential: true,
      functional: true,
      analytics: true,
      decidedAt: new Date().toISOString(),
      decisionType: 'accepted_all',
    })
  }

  const handleDeclineNonEssential = () => {
    setFunctional(false)
    setAnalytics(false)
    savePreferences({
      essential: true,
      functional: false,
      analytics: false,
      decidedAt: new Date().toISOString(),
      decisionType: 'declined_non_essential',
    })
  }

  const handleSaveCustom = () => {
    savePreferences({
      essential: true,
      functional,
      analytics,
      decidedAt: new Date().toISOString(),
      decisionType: 'custom',
    })
  }

  if (!visible) return null

  return (
    <div
      role="region"
      aria-label="Çerez Tercihleri Bildirimi"
      className="fixed bottom-0 inset-x-0 z-[90] border-t-2 border-[#0D6847] dark:border-[#5CD6A5] bg-[#141716]/98 dark:bg-[#0C0E0D]/98 text-[#F2F1ED] shadow-[0_-12px_36px_rgba(0,0,0,0.45)] backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
        {!customizeOpen ? (
          /* ANA ÇEREZ BANNER GÖRÜNÜMÜ (AWS / MİMARİ KAYIT DEFTERİ STİLİ) */
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-8">
            {/* Sol Metin Alanı */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-[#0D6847]/25 border border-[#0D6847]/50 font-mono text-[10px] font-bold uppercase tracking-widest text-[#5CD6A5]">
                  <Cookie className="w-3 h-3" />
                  KVKK &amp; ÇEREZ TERCİHLERİ
                </span>
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
                  Çerez tercihlerinizi seçin
                </h2>
              </div>

              <p className="text-xs text-[#C4C9C6] leading-relaxed">
                Sitemizi, güvenli oturum açma (Google OAuth &amp; 2FA) ve emanet (escrow) ödeme
                hizmetlerimizi sunmak için <strong>zorunlu güvenlik çerezlerini</strong> kullanıyoruz.
                Kullanıcılarımızın platformu nasıl kullandığını anlamak ve saha deneyimini iyileştirmek
                için anonim performans çerezlerinden yararlanıyoruz. Zorunlu çerezler devre dışı
                bırakılamaz; ancak performans ve işlevsel çerezleri reddetmek için{' '}
                <strong className="text-white">&ldquo;Reddet&rdquo;</strong> veya detaylı seçim yapmak için{' '}
                <strong className="text-white">&ldquo;Özelleştir&rdquo;</strong> seçeneğini kullanabilirsiniz.
              </p>

              <p className="text-[11px] text-[#949B97] leading-relaxed">
                Onay vermeniz halinde Günübirlik, şehir/ilçe filtrelerinizi, tema tercihlerinizi ve
                bildirim ayarlarınızı hatırlamak için de çerezleri kullanacaktır. Zorunlu olmayan tüm
                çerezleri kabul etmek veya reddetmek için sağdaki butonları kullanabilir, detaylar için{' '}
                <Link
                  href="/gizlilik-politikasi"
                  className="text-[#5CD6A5] font-semibold underline underline-offset-2 hover:text-white"
                >
                  Gizlilik ve Çerez Politikası
                </Link>{' '}
                ile{' '}
                <Link
                  href="/kvkk-aydinlatma-metni"
                  className="text-[#5CD6A5] font-semibold underline underline-offset-2 hover:text-white"
                >
                  KVKK Aydınlatma Metni
                </Link>
                &apos;ni inceleyebilirsiniz.
              </p>
            </div>

            {/* Sağ Buton Grubu (AWS gibi 3'lü Dikey/Responsive Blok) */}
            <div className="w-full lg:w-64 shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2">
              <button
                type="button"
                onClick={handleAcceptAll}
                className="w-full h-9 px-4 rounded-xs bg-[#0D6847] hover:bg-[#0F7A53] text-white text-xs font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Kabul Et</span>
              </button>

              <button
                type="button"
                onClick={handleDeclineNonEssential}
                className="w-full h-9 px-4 rounded-xs bg-white hover:bg-[#EAE8E1] text-[#141615] text-xs font-bold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reddet</span>
              </button>

              <button
                type="button"
                onClick={() => setCustomizeOpen(true)}
                className="w-full h-9 px-4 rounded-xs border border-[#3A423E] bg-[#1C211F] hover:bg-[#262C29] text-[#F2F1ED] text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#5CD6A5]" />
                <span>Özelleştir</span>
              </button>
            </div>
          </div>
        ) : (
          /* DETAYLI ÇEREZ ÖZELLEŞTİRME PANELİ */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#252B28] pb-3">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#5CD6A5] font-bold">
                  ÇEREZ KATEGORİLERİ VE İZİN YÖNETİMİ
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  Çerez Tercihlerinizi Özelleştirin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCustomizeOpen(false)}
                className="text-xs font-mono text-[#949B97] hover:text-white cursor-pointer"
              >
                ← Geri Dön
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 1. Zorunlu Çerezler */}
              <div className="p-3.5 rounded-md bg-[#1A1F1D] border border-[#2B332F] flex flex-col justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#5CD6A5]" />
                      1. Zorunlu Güvenlik Çerezleri
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#0D6847]/30 text-[#5CD6A5] font-bold">
                      HER ZAMAN AKTİF
                    </span>
                  </div>
                  <p className="text-[11px] text-[#949B97] leading-relaxed">
                    Oturum güvenliği (`auth_token`), Google OAuth doğrulaması, 2FA ve emanet cüzdan
                    işlemleri için zorunludur. Devre dışı bırakılamaz.
                  </p>
                </div>
              </div>

              {/* 2. İşlevsel Çerezler */}
              <div className="p-3.5 rounded-md bg-[#1A1F1D] border border-[#2B332F] flex flex-col justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">
                      2. İşlevsel ve Tercih Çerezleri
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={functional}
                      onClick={() => setFunctional(!functional)}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold transition-colors cursor-pointer ${
                        functional
                          ? 'bg-[#0D6847] text-white'
                          : 'bg-[#2A302D] text-[#949B97]'
                      }`}
                    >
                      {functional ? 'AÇIK' : 'KAPALI'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#949B97] leading-relaxed">
                    Açık/Koyu tema seçiminizi, son baktığınız şehir/ilçe filtrelerini ve bildirim
                    ayarlarınızı hatırlamak için kullanılır.
                  </p>
                </div>
              </div>

              {/* 3. Performans ve Analitik Çerezleri */}
              <div className="p-3.5 rounded-md bg-[#1A1F1D] border border-[#2B332F] flex flex-col justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white">
                      3. Performans ve İstatistik
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={analytics}
                      onClick={() => setAnalytics(!analytics)}
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold transition-colors cursor-pointer ${
                        analytics
                          ? 'bg-[#0D6847] text-white'
                          : 'bg-[#2A302D] text-[#949B97]'
                      }`}
                    >
                      {analytics ? 'AÇIK' : 'KAPALI'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[#949B97] leading-relaxed">
                    Sayfa yükleme hızlarını ve uygulama hatalarını anonim olarak ölçerek saha
                    performansını geliştirmemize yardımcı olur.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleDeclineNonEssential}
                className="h-9 px-3.5 rounded-xs bg-white hover:bg-[#EAE8E1] text-[#141615] text-xs font-bold cursor-pointer"
              >
                Zorunlu Olmayanları Reddet
              </button>
              <button
                type="button"
                onClick={handleSaveCustom}
                className="h-9 px-4 rounded-xs border border-[#5CD6A5] bg-[#1C211F] hover:bg-[#262C29] text-[#5CD6A5] text-xs font-bold cursor-pointer"
              >
                Seçimlerimi Kaydet
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="h-9 px-4 rounded-xs bg-[#0D6847] hover:bg-[#0F7A53] text-white text-xs font-bold cursor-pointer"
              >
                Tümünü Kabul Et
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
