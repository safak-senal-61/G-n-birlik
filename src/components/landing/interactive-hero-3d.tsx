'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Compass,
  ShieldCheck,
  Zap,
  QrCode,
  ArrowRight,
  MapPin,
  Building2,
  Wallet,
  CheckCircle2,
  Lock,
  BadgePercent,
  Clock,
  Sparkles,
  Search,
  Briefcase,
  Users,
} from 'lucide-react'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'

interface InteractiveHero3DProps {
  onExploreClick?: () => void
  totalJobs?: number
}

const QUICK_CATEGORIES = [
  { key: 'RESTAURANT', label: 'Garson & Komi', icon: '🍽️' },
  { key: 'TEMIZLIK', label: 'Temizlik', icon: '🧹' },
  { key: 'NAKLIYE', label: 'Kurye & Dağıtım', icon: '📦' },
  { key: 'INSAAT', label: 'İnşaat & Tadilat', icon: '🔨' },
  { key: 'TARIM', label: 'Tarım & Bahçe', icon: '🌾' },
  { key: 'DIGER', label: 'Etkinlik & Tanıtım', icon: '🎪' },
]

export function InteractiveHero3D({ onExploreClick, totalJobs = 48 }: InteractiveHero3DProps) {
  const { go, openAuthModal } = useApp()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'worker' | 'employer'>('worker')

  return (
    <section className="relative w-full overflow-hidden pt-3 sm:pt-6 pb-8 sm:pb-14">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        
        {/* Güven Bandı */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Türkiye Geneli Canlı Günlük İş Platformu
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Emanet Ödeme Koruması
          </span>
        </div>

        {/* Hero Ana Başlık & Açıklama */}
        <div className="max-w-3xl space-y-5">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
            Sabah başla, <br className="hidden sm:inline" />
            akşam yevmiyeni güvenle al.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl">
            Konumuna en yakın günübirlik ve part-time işleri haritada gör, aynı gün başvur.
            İşverenin yatırdığı ücret emanet kasasında güvence altında tutulur; mesai bitiminde tek kuruş kesinti olmadan hesabına geçer.
          </p>

          {/* Aksiyon Butonları */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="lg"
              className="h-12 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              onClick={onExploreClick}
            >
              <Compass className="w-5 h-5" />
              <span>Açık İşleri Keşfet</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            {user?.role === 'EMPLOYER' || user?.role === 'ADMIN' ? (
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 rounded-full font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => go('post-job')}
              >
                <Building2 className="w-4 h-4 mr-2 text-emerald-600" />
                İlan Yayınla
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 rounded-full font-semibold border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => {
                  if (user) {
                    go('wallet')
                  } else {
                    openAuthModal({
                      title: 'İşveren İlanı Yayınlayın',
                      description: 'Acil personel ve günübirlik usta ihtiyacınızı karşılamak için işveren olarak kayıt olun.',
                      tab: 'register',
                    })
                  }
                }}
              >
                <Building2 className="w-4 h-4 mr-2 text-emerald-600" />
                {user ? 'Cüzdanım' : 'Eleman Arıyorum (İlan Ver)'}
              </Button>
            )}

            <Link
              href="/nasil-calisir"
              className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-2 transition-colors inline-flex items-center gap-1"
            >
              Sistem Nasıl Çalışır?
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Hızlı Kategori Seçimi */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
            Popüler Günlük İş Kategorileri:
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  onExploreClick?.()
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-500 dark:hover:text-emerald-400 transition-all shadow-xs"
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3 Güven Temeli (Reel ve somut) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Emanet Havuzu Güvencesi
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              İşveren ilanı açarken yevmiye tutarı emanet kasasında kilitlenir. Emeğin asla karşılıksız kalmaz.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Yakındaki İşler & Konum Radarı
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              GPS radarı sayesinde yol parası ve zaman harcamadan semtindeki en yakın işleri haritada gör.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Aynı Gün Komisyonsuz Ödeme
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mesai bitiminde çıkış QR koduyla teyit alınır. Yevmiyen kesintisiz ve net olarak cüzdanına yansır.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}
