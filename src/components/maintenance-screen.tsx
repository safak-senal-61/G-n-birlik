'use client'

import { useEffect, useState } from 'react'
import {
  Wrench,
  Clock,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Twitter,
  Globe,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'

interface MaintenanceData {
  maintenanceMode: boolean
  maintenanceTitle: string
  maintenanceMessage: string
  maintenanceEndTime: string | null
  maintenanceStartedAt: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactWhatsapp: string | null
  contactInstagram: string | null
  contactTwitter: string | null
  contactWebsite: string | null
  siteName: string
}

export default function MaintenanceScreen() {
  const [data, setData] = useState<MaintenanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/v1/maintenance/status', { cache: 'no-store' })
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        }
      } catch (e) {
        // Hata durumunda varsayılan mesaj göster
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    // Her 60 saniyede bir kontrol et (bakım bitti mi?)
    const interval = setInterval(fetchData, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Geri sayım için sayaç
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 animate-pulse">
            <Wrench className="w-10 h-10 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const title = data?.maintenanceTitle || 'Bakım Çalışması Devam Ediyor'
  const message = data?.maintenanceMessage || 'Daha iyi bir deneyim sunabilmek için sistemimizi güncelliyoruz. Kısa süre sonra tekrar hizmetinizde olacağız.'
  const siteName = data?.siteName || 'Günübirlik İş Bul'
  const endTime = data?.maintenanceEndTime ? new Date(data.maintenanceEndTime) : null
  const startedAt = data?.maintenanceStartedAt ? new Date(data.maintenanceStartedAt) : null

  // Geri sayım hesapla
  let countdown: { days: number; hours: number; minutes: number; seconds: number } | null = null
  if (endTime && endTime > now) {
    const diff = endTime.getTime() - now.getTime()
    countdown = {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    }
  }

  // Bakım süresi (ne zamandır bakımda)
  const maintenanceDuration = startedAt
    ? Math.floor((now.getTime() - startedAt.getTime()) / (1000 * 60))
    : null

  const hasContacts =
    data?.contactEmail ||
    data?.contactPhone ||
    data?.contactWhatsapp ||
    data?.contactInstagram ||
    data?.contactTwitter ||
    data?.contactWebsite

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Logo & Başlık */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-6 animate-pulse">
              <Wrench className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
              {siteName}
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Bakım Modu Aktif
            </div>
          </div>

          {/* Ana kart */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
              {title}
            </h2>
            <p className="text-slate-300 text-center text-base md:text-lg leading-relaxed mb-8">
              {message}
            </p>

            {/* Geri sayım */}
            {countdown && (
              <div className="mb-8">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-3">
                  <Clock className="w-4 h-4" />
                  Tahmini Kalan Süre
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <TimeBox value={countdown.days} label="Gün" />
                  <TimeBox value={countdown.hours} label="Saat" />
                  <TimeBox value={countdown.minutes} label="Dakika" />
                  <TimeBox value={countdown.seconds} label="Saniye" />
                </div>
              </div>
            )}

            {/* Bakım süresi (ne zamandır bakımda) */}
            {maintenanceDuration !== null && !countdown && (
              <div className="mb-8 p-4 bg-slate-950/40 border border-slate-800 rounded-xl text-center">
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Bakıma Başlanalı
                </div>
                <p className="text-white font-semibold">
                  {maintenanceDuration < 60
                    ? `${maintenanceDuration} dakika`
                    : `${Math.floor(maintenanceDuration / 60)} saat ${maintenanceDuration % 60} dk`}
                </p>
              </div>
            )}

            {/* Yeniden dene butonu */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tekrar Kontrol Et
              </button>
            </div>

            {/* İletişim bilgileri */}
            {hasContacts && (
              <div className="pt-6 border-t border-slate-800">
                <p className="text-center text-slate-400 text-sm mb-4">
                  Acil durumlar için bizimle iletişime geçebilirsiniz:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {data?.contactEmail && (
                    <ContactLink
                      href={`mailto:${data.contactEmail}`}
                      icon={Mail}
                      label="E-posta"
                      value={data.contactEmail}
                    />
                  )}
                  {data?.contactPhone && (
                    <ContactLink
                      href={`tel:${data.contactPhone.replace(/\s/g, '')}`}
                      icon={Phone}
                      label="Telefon"
                      value={data.contactPhone}
                    />
                  )}
                  {data?.contactWhatsapp && (
                    <ContactLink
                      href={data.contactWhatsapp}
                      icon={MessageCircle}
                      label="WhatsApp"
                      value="Mesaj Gönder"
                      external
                    />
                  )}
                  {data?.contactInstagram && (
                    <ContactLink
                      href={data.contactInstagram}
                      icon={Instagram}
                      label="Instagram"
                      value="@gunubirlik"
                      external
                    />
                  )}
                  {data?.contactTwitter && (
                    <ContactLink
                      href={data.contactTwitter}
                      icon={Twitter}
                      label="Twitter"
                      value="@gunubirlik"
                      external
                    />
                  )}
                  {data?.contactWebsite && (
                    <ContactLink
                      href={data.contactWebsite}
                      icon={Globe}
                      label="Web Sitesi"
                      value="gunubirlik.com"
                      external
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Alt bilgi */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-xs flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Bu sayfa otomatik olarak 30 saniyede bir kontrol edilmektedir.
            </p>
            <p className="text-slate-600 text-xs mt-2">
              © 2024 {siteName} — Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
      <div className="text-2xl md:text-3xl font-bold text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  )
}

function ContactLink({
  href,
  icon: Icon,
  label,
  value,
  external,
}: {
  href: string
  icon: any
  label: string
  value: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="flex flex-col items-center gap-1.5 p-3 bg-slate-950/40 border border-slate-800 rounded-xl hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all group"
    >
      <div className="w-9 h-9 rounded-lg bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
        <Icon className="w-4 h-4 text-slate-300 group-hover:text-indigo-300" />
      </div>
      <div className="text-center">
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
        <div className="text-xs text-white font-medium truncate max-w-full">{value}</div>
      </div>
    </a>
  )
}
