'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
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
  UserCheck,
} from 'lucide-react'
import { MagneticButton } from './magnetic-button'
import { SpotlightCard } from './spotlight-card'
import { TextReveal } from './text-reveal'
import { StatsTicker } from './stats-ticker'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'

interface InteractiveHero3DProps {
  onExploreClick?: () => void
  totalJobs?: number
}

export function InteractiveHero3D({ onExploreClick, totalJobs = 48 }: InteractiveHero3DProps) {
  const { go } = useApp()
  const { user } = useAuth()
  const [activeStep, setActiveStep] = useState(0)

  const steps = [
    {
      num: '01',
      title: 'Konum Radarıyla İşi Gör',
      desc: 'Canlı GPS radarı ile 10 km çapındaki acil ve planlı işleri harita üzerinde gör. Sana en yakın, yol parası harcamayacağın işi tek dokunuşla seç.',
      icon: Compass,
      tag: 'Canlı Mesafe Radarı',
    },
    {
      num: '02',
      title: 'Yevmiye Kasada Kilitlensin',
      desc: 'İşveren ilanı oluştururken günlük ücreti platformun Emanet Kasasına yatırır. Para çalışırken havuzda kilitli ve hazır tutulur; emeğin asla riske girmez.',
      icon: Lock,
      tag: '%100 Emanet Güvencesi',
    },
    {
      num: '03',
      title: 'Sabah QR ile İşe Başla',
      desc: 'İş yerine vardığında işverenin QR kodunu telefonunla okut. Sistem anında mesai başlangıcını ve konumunu onaylar, taraflar güvence altına alınır.',
      icon: QrCode,
      tag: 'Dijital Check-in',
    },
    {
      num: '04',
      title: 'Akşam Anında Hesabında',
      desc: 'Mesai bittiğinde çıkış QR kodu onaylanır. Emanet kasadaki yevmiyen komisyonsuz, kesintisiz ve saniyeler içinde cüzdanına ve IBAN hesabına aktarılır.',
      icon: Zap,
      tag: 'Anında Tahsilat',
    },
  ]

  return (
    <section className="relative w-full overflow-hidden pt-2 sm:pt-4 pb-8 sm:pb-12">
      <div className="container mx-auto px-3 sm:px-4 max-w-6xl relative z-10">
        {/* Top Trust Bar */}
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>TÜRKİYE GENELİ GÜNÜBİRLİK İŞ RADARI & EMANET HAVUZU</span>
          </div>
        </div>

        {/* 1. HERO MAIN: Clean & High-Impact Editorial Layout */}
        <div className="space-y-6 text-left max-w-4xl">
          {/* Main Headline */}
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-slate-900 dark:text-white">
              <TextReveal text="Sabah Başla," />
              <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent">
                Akşam Yevmiyeni Al.
              </span>
            </h1>
          </div>

          {/* Clear, purposeful lead text */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-medium">
            Konumuna en yakın günübirlik işleri harita üzerinde gör. Yevmiyen baştan emanet havuzunda
            kilitlenir; akşam mesai bittiğinde QR doğrulamayla tek kuruş kesinti olmadan doğrudan hesabına aktarılır.
          </p>

          {/* Key Value Guarantee Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 max-w-2xl">
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">%100 Emanet Kasası</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Yevmiyen baştan kilitli</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">10 km Konum Radarı</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Yürüme mesafesinde işler</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-xs text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex-shrink-0">
                <BadgePercent className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white">0% Komisyon</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Kesintisiz tam tahsilat</div>
              </div>
            </div>
          </div>

          {/* Magnetic CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <MagneticButton
              onClick={onExploreClick}
              className="btn-3d-emerald btn-3d-pill px-6 py-3.5 text-sm sm:text-base font-black shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2.5 text-white"
            >
              <Compass className="w-5 h-5 text-emerald-200" />
              <span>Yakındaki İşleri Keşfet</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </MagneticButton>

            {user?.role === 'EMPLOYER' || user?.role === 'ADMIN' ? (
              <MagneticButton
                onClick={() => go('post-job')}
                className="btn-3d-white btn-3d-pill px-6 py-3.5 text-sm sm:text-base font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-100"
              >
                <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Hemen İlan Ver (0% Komisyon)</span>
              </MagneticButton>
            ) : (
              <MagneticButton
                onClick={() => go('wallet')}
                className="btn-3d-white btn-3d-pill px-6 py-3.5 text-sm sm:text-base font-extrabold flex items-center gap-2 text-slate-800 dark:text-slate-100"
              >
                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Cüzdan & Yevmiye Takibi</span>
              </MagneticButton>
            )}
          </div>

          {/* Real Stats Telemetry */}
          <div className="grid grid-cols-3 gap-4 pt-5 border-t border-slate-200/80 dark:border-white/10 max-w-lg">
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                <StatsTicker value={totalJobs > 0 ? totalJobs : 148} suffix="+" />
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                Canlı Günlük İlan
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                <StatsTicker value={1450} suffix=" ₺" />
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ortalama Yevmiye
              </div>
            </div>

            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-500 dark:text-amber-400">
                <StatsTicker value={12} suffix=" dk" />
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                Ortalama Eşleşme
              </div>
            </div>
          </div>
        </div>

        {/* 2. HOW IT WORKS: 4-Step Interactive Ecosystem */}
        <div className="mt-12 sm:mt-16 space-y-8">
          <div className="text-left max-w-2xl space-y-1.5">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              GÜVENLİ VE ŞEFFAF İŞLEYİŞ
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Günübirlik İş Bul Nasıl Çalışır?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Hem iş arayanın emeğini hem işverenin parasını koruyan 4 adımlı güvenli süreç.
            </p>
          </div>

          {/* Interactive Step Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {steps.map((st, i) => {
              const Icon = st.icon
              const isCurrent = activeStep === i
              return (
                <SpotlightCard
                  key={st.num}
                  onClick={() => setActiveStep(i)}
                  className={`cursor-pointer p-5 transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'ring-2 ring-emerald-500/60 dark:ring-emerald-400/80 border-emerald-500'
                      : 'hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                          isCurrent
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-slate-400">{st.num}</span>
                    </div>

                    <div className="inline-block text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                      {st.tag}
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-2 leading-snug">
                      {st.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {st.desc}
                    </p>
                  </div>
                </SpotlightCard>
              )
            })}
          </div>
        </div>

        {/* 3. BENTO GRID: Core Platform Guarantees */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Bento Item 1: Location Radar */}
          <SpotlightCard className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                Metre Metre Konum Radarı
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                Sadece il veya ilçe değil; mahalle ve cadde mesafene göre anlık sıralama. Otobüse veya
                metroya binmeden, yol parası harcamadan yürüyerek gidebileceğin işleri harita üzerinde gör.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>±10 km Canlı Çevre Taraması</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </SpotlightCard>

          {/* Bento Item 2: Safe Escrow Pool */}
          <SpotlightCard className="md:col-span-5 p-6 sm:p-7 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                %100 Korumalı Emanet Kasası
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                İş bitiminde &apos;Paramı alamadım&apos; derdi tarihe karıştı. İlan açıldığında yevmiye platform
                kasasında kilitlenir; mesai tamamlanıp QR doğrulanınca anında hesaba geçer.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>Sıfır Riskli Günlük Yevmiye</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  )
}

export default InteractiveHero3D
