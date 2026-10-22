'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Plus } from 'lucide-react'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'

interface InteractiveHero3DProps {
  onExploreClick?: () => void
  onSelectCategory?: (categoryKey: string) => void
  totalJobs?: number
}

const SECTORS = [
  { key: 'RESTAURANT', code: 'RST', label: 'Restoran & Servis' },
  { key: 'INSAAT', code: 'İNŞ', label: 'İnşaat & Yapı' },
  { key: 'TEMIZLIK', code: 'TMZ', label: 'Temizlik & Düzen' },
  { key: 'NAKLIYE', code: 'NKL', label: 'Nakliyat & Taşıma' },
  { key: 'TEKNIK', code: 'TKN', label: 'Teknik & Montaj' },
  { key: 'TARIM', code: 'TRM', label: 'Tarım & Bahçe' },
]

export function InteractiveHero3D({
  onExploreClick,
  onSelectCategory,
  totalJobs = 48,
}: InteractiveHero3DProps) {
  const { go, openAuthModal } = useApp()
  const { user } = useAuth()

  return (
    <section className="w-full border-b border-[#E2E0D8] dark:border-[#252B28] pb-8 pt-2 sm:pt-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sol Sütun: Ana İlan Panosu Başlığı */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-3 text-xs text-[#5C615E] dark:text-[#949B97]">
            <span className="font-mono font-semibold text-[#0D6847] dark:text-[#5CD6A5] bg-[#EAF3EE] dark:bg-[#162921] px-2 py-0.5 rounded-sm border border-[#C5DDD0] dark:border-[#244738]">
              CANLI PANO
            </span>
            <span>Türkiye geneli yevmiyeli iş ve acil personel ağı</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-[-0.025em] text-[#141615] dark:text-[#F2F1ED] leading-[1.12]">
            Sabah vardiyaya başla, akşam yevmiyeni net al.
          </h1>

          <p className="text-[15px] sm:text-base text-[#4A4F4C] dark:text-[#A5ACA8] leading-relaxed max-w-[62ch]">
            Semtindeki açık günlük işleri incele, şartları uyan vardiyaya başvur. İşveren ücreti
            mesai başlamadan emanet kasasına yatırır; akşam çıkış QR onayıyla tutar kesintisiz
            hesabına geçer.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onExploreClick}
              className="h-11 px-5 rounded-md bg-[#141615] hover:bg-[#272B29] dark:bg-[#F2F1ED] dark:hover:bg-white text-white dark:text-[#141615] text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Açık İlanlara Göz At</span>
              <span className="font-mono text-xs opacity-75">({totalJobs})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (user?.role === 'EMPLOYER' || user?.role === 'ADMIN') {
                  go('post-job')
                } else if (user) {
                  go('wallet')
                } else {
                  openAuthModal({
                    title: 'İşveren İlanı Oluşturun',
                    description:
                      'Restoran, şantiye, depo veya temizlik işleriniz için aynı gün personel bulmak üzere giriş yapın.',
                    tab: 'register',
                  })
                }
              }}
              className="h-11 px-5 rounded-md bg-white dark:bg-[#141716] hover:bg-[#F0EFEA] dark:hover:bg-[#1D2220] text-[#141615] dark:text-[#F2F1ED] border border-[#D6D3C9] dark:border-[#2B322E] text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5]" />
              <span>{user ? 'Emanet & Cüzdan' : 'Eleman Arıyorum (İlan Aç)'}</span>
            </button>

            <Link
              href="/nasil-calisir"
              className="text-xs font-semibold text-[#5C615E] dark:text-[#949B97] hover:text-[#141615] dark:hover:text-white px-2 py-2 inline-flex items-center gap-1 transition-colors"
            >
              <span>Emanet sistemi nasıl işler?</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Sektör Fihristi */}
          <div className="pt-4 border-t border-[#E2E0D8] dark:border-[#252B28]">
            <div className="flex flex-wrap items-center gap-1.5">
              {SECTORS.map((sec) => (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => {
                    onSelectCategory?.(sec.key)
                    onExploreClick?.()
                  }}
                  className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847] dark:hover:border-[#5CD6A5] text-xs font-medium text-[#141615] dark:text-[#F2F1ED] transition-colors cursor-pointer"
                >
                  <span className="font-mono text-[10px] font-semibold text-[#5C615E] dark:text-[#949B97]">
                    {sec.code}
                  </span>
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sağ Sütun: Saha & Emanet Protokolü Tablosu */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28] rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-[#F0EFEA] dark:bg-[#1A1F1D] border-b border-[#D8D5CC] dark:border-[#252B28] flex items-center justify-between">
              <span className="text-xs font-semibold text-[#141615] dark:text-white">
                Günlük Yevmiye Güvence Protokolü
              </span>
              <span className="font-mono text-[11px] text-[#0D6847] dark:text-[#5CD6A5] font-medium">
                ESCROW / QR
              </span>
            </div>

            <div className="divide-y divide-[#ECEAE4] dark:divide-[#222624]">
              <div className="p-4 flex items-start gap-3.5">
                <span className="font-mono text-xs font-semibold text-[#0D6847] dark:text-[#5CD6A5] pt-0.5">
                  01
                </span>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-[#141615] dark:text-white">
                    İlan Açılışında Emanet Blokajı
                  </div>
                  <p className="text-xs text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                    İşveren ilanı yayınlarken günlük yevmiye tutarı emanet hesabına alınır; karşılıksız ilan açılmaz.
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-3.5">
                <span className="font-mono text-xs font-semibold text-[#0D6847] dark:text-[#5CD6A5] pt-0.5">
                  02
                </span>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-[#141615] dark:text-white">
                    Sabah Saha Girişi (QR Teyit)
                  </div>
                  <p className="text-xs text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                    Çalışan iş yerine ulaştığında QR kod okutulur; vardiya başlangıç saati ve konum kayda geçer.
                  </p>
                </div>
              </div>

              <div className="p-4 flex items-start gap-3.5">
                <span className="font-mono text-xs font-semibold text-[#0D6847] dark:text-[#5CD6A5] pt-0.5">
                  03
                </span>
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-[#141615] dark:text-white">
                    Mesai Bitimi Doğrudan Ödeme
                  </div>
                  <p className="text-xs text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                    Akşam çıkış onayıyla emanetteki tutar komisyon kesintisi olmadan çalışanın hesabına aktarılır.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-[#F6F5F2] dark:bg-[#101312] border-t border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between text-[11px] font-mono text-[#5C615E] dark:text-[#949B97]">
              <span>Çalışan Komisyonu: %0</span>
              <span>Ödeme: Aynı Gün Net</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
