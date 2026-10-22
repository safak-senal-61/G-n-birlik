'use client'

import React from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowRight, Plus, ShieldCheck, QrCode, Wallet } from 'lucide-react'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'

const CircularGlbStage = dynamic(
  () => import('@/components/landing/circular-glb-stage'),
  {
    ssr: false,
    loading: () => <div className="h-[340px] sm:h-[400px] bg-transparent" />,
  }
)

interface InteractiveHero3DProps {
  onExploreClick?: () => void
  onSelectCategory?: (categoryKey: string) => void
  totalJobs?: number
}

const VISUAL_SECTORS = [
  {
    key: 'RESTAURANT',
    code: 'RST',
    label: 'Restoran & Kafe',
    sub: 'Garson, komi, barista, mutfak',
    wage: '1.200₺ – 1.850₺',
    image:
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=640&q=80',
  },
  {
    key: 'INSAAT',
    code: 'İNŞ',
    label: 'İnşaat & Tadilat',
    sub: 'Boya, alçı, tesisat, şantiye',
    wage: '2.000₺ – 3.500₺',
    image:
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=640&q=80',
  },
  {
    key: 'TEMIZLIK',
    code: 'TMZ',
    label: 'Temizlik & Düzen',
    sub: 'Ofis, konut, inşaat sonrası',
    wage: '1.400₺ – 2.300₺',
    image:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&q=80',
  },
  {
    key: 'NAKLIYE',
    code: 'NKL',
    label: 'Depo & Lojistik',
    sub: 'Paketleme, yükleme, kurye',
    wage: '1.350₺ – 2.200₺',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=640&q=80',
  },
]

const EXTRA_SECTORS = [
  { key: 'TEKNIK', code: 'TKN', label: 'Teknik & Montaj' },
  { key: 'TARIM', code: 'TRM', label: 'Tarım & Bahçe' },
  { key: 'SAGLIK', code: 'BKM', label: 'Bakım & Destek' },
  { key: 'DIGER', code: 'GNL', label: 'Genel Saha İşi' },
]

export function InteractiveHero3D({
  onExploreClick,
  onSelectCategory,
  totalJobs = 48,
}: InteractiveHero3DProps) {
  const { go, openAuthModal } = useApp()
  const { user } = useAuth()

  return (
    <section className="w-full border-b border-[#E2E0D8] dark:border-[#252B28] pb-8 pt-2 sm:pt-4 space-y-8">
      {/* Üst 12 Sütun: Sol Ana Pano & Sağ 3B Dairesel GLB Sahnesi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Sol Sütun (7 birim): Başlık, Aksiyonlar ve 3 Adımlı Emanet/QR Özeti */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-2.5 text-xs text-[#5C615E] dark:text-[#949B97]">
            <span className="font-mono font-semibold text-[#0D6847] dark:text-[#5CD6A5] bg-[#EAF3EE] dark:bg-[#162921] px-2 py-0.5 rounded-sm border border-[#C5DDD0] dark:border-[#244738]">
              CANLI PANO
            </span>
            <span>Türkiye geneli yevmiyeli iş ve acil personel ağı</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-bold tracking-[-0.025em] text-[#141615] dark:text-[#F2F1ED] leading-[1.12]">
            Sabah vardiyaya başla, akşam yevmiyeni net al.
          </h1>

          <p className="text-sm sm:text-base text-[#4A4F4C] dark:text-[#A5ACA8] leading-relaxed max-w-[60ch]">
            Semtindeki açık günlük işleri incele, şartları uyan vardiyaya başvur. İşveren ücreti
            mesai başlamadan emanet kasasına yatırır; akşam çıkış QR onayıyla tutar kesintisiz
            hesabına geçer.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onExploreClick}
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-md bg-[#141615] hover:bg-[#272B29] dark:bg-[#F2F1ED] dark:hover:bg-white text-white dark:text-[#141615] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
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
              className="h-10 sm:h-11 px-4 sm:px-5 rounded-md bg-white dark:bg-[#141716] hover:bg-[#F0EFEA] dark:hover:bg-[#1D2220] text-[#141615] dark:text-[#F2F1ED] border border-[#D6D3C9] dark:border-[#2B322E] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5]" />
              <span>{user ? 'Emanet & Cüzdan' : 'Eleman Arıyorum (İlan Aç)'}</span>
            </button>

            <Link
              href="/nasil-calisir"
              className="text-xs font-semibold text-[#5C615E] dark:text-[#949B97] hover:text-[#141615] dark:hover:text-white px-2 py-2 inline-flex items-center gap-1 transition-colors"
            >
              <span>Sistem işleyişi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 3 Sütunlu Kompakt Emanet & QR Güvence Cetveli */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="p-3 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                  01 / EMANET KASA
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
              </div>
              <div className="text-xs font-bold text-[#141615] dark:text-white">
                Ön Provizyonlu Ücret
              </div>
              <p className="text-[11px] text-[#5C615E] dark:text-[#949B97] leading-snug">
                Yevmiye iş başlamadan havuzda bloke edilir.
              </p>
            </div>

            <div className="p-3 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                  02 / SAHA GİRİŞİ
                </span>
                <QrCode className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
              </div>
              <div className="text-xs font-bold text-[#141615] dark:text-white">
                QR Vardiya Teyidi
              </div>
              <p className="text-[11px] text-[#5C615E] dark:text-[#949B97] leading-snug">
                Sabah giriş ve akşam çıkış saatleri QR ile tescillenir.
              </p>
            </div>

            <div className="p-3 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                  03 / %0 KOMİSYON
                </span>
                <Wallet className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
              </div>
              <div className="text-xs font-bold text-[#141615] dark:text-white">
                Aynı Gün Net Ödeme
              </div>
              <p className="text-[11px] text-[#5C615E] dark:text-[#949B97] leading-snug">
                Vardiya bitiminde kesintisiz cüzdana aktarılır.
              </p>
            </div>
          </div>
        </div>

        {/* Sağ Sütun (5 birim): 3B GLB Dairesel Scroll Sahnesi */}
        <div className="lg:col-span-5">
          <CircularGlbStage />
        </div>
      </div>

      {/* Alt Bölüm: Görselli Sektör Kartları (Fotoğraf + Günlük Yevmiye Cetveli) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
              SEKTÖREL VARDİYA VİTRİNİ
            </span>
            <span className="text-xs text-[#5C615E] dark:text-[#949B97]">
              • Kategoriye tıklayarak açık ilanları filtreleyin
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {EXTRA_SECTORS.map((sec) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => {
                  onSelectCategory?.(sec.key)
                  onExploreClick?.()
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847] text-[11px] font-medium text-[#141615] dark:text-[#F2F1ED] transition-colors cursor-pointer"
              >
                <span className="font-mono text-[10px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                  {sec.code}
                </span>
                <span>{sec.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {VISUAL_SECTORS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                onSelectCategory?.(item.key)
                onExploreClick?.()
              }}
              className="group text-left bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847] dark:hover:border-[#5CD6A5] rounded-lg overflow-hidden transition-colors cursor-pointer flex flex-col"
            >
              <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-[#181C1A]">
                <img
                  src={item.image}
                  alt={item.label}
                  loading="lazy"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141615]/80 via-[#141615]/20 to-transparent" />
                <span className="absolute top-2.5 left-2.5 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#141615]/85 text-white border border-white/15">
                  {item.code}
                </span>
                <span className="absolute bottom-2.5 right-2.5 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-[#0D6847] text-white">
                  {item.wage}
                </span>
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#141615] dark:text-white group-hover:text-[#0D6847] dark:group-hover:text-[#5CD6A5] transition-colors truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] text-[#5C615E] dark:text-[#949B97] truncate">
                    {item.sub}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#5C615E] group-hover:text-[#0D6847] shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
