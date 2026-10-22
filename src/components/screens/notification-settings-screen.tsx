'use client'

import { useEffect, useState, useCallback } from 'react'
import { Switch } from '@/components/ui/switch'
import {
  Bell,
  Briefcase,
  MessageSquare,
  Wallet,
  QrCode,
  Settings,
  RefreshCw,
  Loader2,
  BellOff,
} from 'lucide-react'
import { toast } from 'sonner'

interface SettingsState {
  pushEnabled: boolean
  jobApplied: boolean
  applicationAccepted: boolean
  applicationRejected: boolean
  jobReminder: boolean
  jobNearby: boolean
  newMessage: boolean
  paymentReceived: boolean
  paymentApproved: boolean
  paymentRejected: boolean
  walletDeposit: boolean
  walletWithdraw: boolean
  workStarted: boolean
  workCompleted: boolean
  escrowDisputed: boolean
  systemUpdate: boolean
  maintenance: boolean
  promotional: boolean
}

const DEFAULT_SETTINGS: SettingsState = {
  pushEnabled: true,
  jobApplied: true,
  applicationAccepted: true,
  applicationRejected: true,
  jobReminder: true,
  jobNearby: true,
  newMessage: true,
  paymentReceived: true,
  paymentApproved: true,
  paymentRejected: true,
  walletDeposit: true,
  walletWithdraw: true,
  workStarted: true,
  workCompleted: true,
  escrowDisputed: true,
  systemUpdate: true,
  maintenance: true,
  promotional: true,
}

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/notifications/settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      })
      const data = await res.json()
      if (data.success) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.data })
      }
    } catch {
      toast.error('Ayarlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateSetting = async (key: keyof SettingsState, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))

    try {
      const res = await fetch('/api/v1/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ [key]: value }),
      })
      const data = await res.json()
      if (!data.success) {
        setSettings((prev) => ({ ...prev, [key]: !value }))
        toast.error('Ayar güncellenemedi')
      }
    } catch {
      setSettings((prev) => ({ ...prev, [key]: !value }))
      toast.error('Bağlantı hatası')
    }
  }

  const handleReset = async () => {
    if (!confirm('Tüm bildirim ayarları varsayılana sıfırlansın mı?')) return
    setResetting(true)
    try {
      const res = await fetch('/api/v1/notifications/settings/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      })
      const data = await res.json()
      if (data.success) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.data })
        toast.success('Ayarlar varsayılana döndürüldü.')
      }
    } catch {
      toast.error('Sıfırlama hatası')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div className="h-20 bg-[#E9E7E0] dark:bg-[#181C1A] rounded-lg animate-pulse" />
        <div className="h-48 bg-[#E9E7E0] dark:bg-[#181C1A] rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8D5CC] dark:border-[#262C29] pb-5">
        <div className="space-y-1">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
            BİLDİRİM TERCİHLERİ • KANAL YÖNETİMİ
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141615] dark:text-white">
            Bildirim Ayarları
          </h1>
          <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
            Hangi durumlarda anlık bildirim almak istediğinizi seçin.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="h-9 px-3 rounded-md bg-white dark:bg-[#141716] border border-[#D6D3C9] dark:border-[#2B322E] hover:bg-[#F0EFEA] dark:hover:bg-[#1D2220] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
        >
          {resetting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
          )}
          <span>Varsayılana Sıfırla</span>
        </button>
      </div>

      {/* Ana Push Anahtarı */}
      <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${
              settings.pushEnabled
                ? 'bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5] border-[#C5DDD0] dark:border-[#244738]'
                : 'bg-[#F0EFEA] dark:bg-[#1E2421] text-[#5C615E] dark:text-[#949B97] border-[#E2E0D8] dark:border-[#2C3330]'
            }`}
          >
            {settings.pushEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm sm:text-base text-[#141615] dark:text-white">
              Tüm Anlık Bildirimler
            </div>
            <p className="text-xs text-[#5C615E] dark:text-[#949B97] mt-0.5">
              {settings.pushEnabled
                ? 'Aktif — seçili kategorilerde bildirim gönderilir'
                : 'Kapalı — hiçbir bildirim gönderilmez'}
            </p>
          </div>
        </div>
        <Switch
          checked={settings.pushEnabled}
          onCheckedChange={(v) => updateSetting('pushEnabled', v)}
        />
      </div>

      <div
        className={`space-y-4 ${
          !settings.pushEnabled ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        <SettingGroup
          code="01 / VARDİYA"
          icon={Briefcase}
          title="İş & Başvuru Bildirimleri"
          items={[
            { key: 'jobApplied', label: 'Yeni İş Başvurusu', desc: 'İlanınıza başvuru geldiğinde' },
            { key: 'applicationAccepted', label: 'Başvuru Onaylandı', desc: 'Başvurunuz işveren tarafından onaylandığında' },
            { key: 'applicationRejected', label: 'Başvuru Reddedildi', desc: 'Başvurunuz olumsuz sonuçlandığında' },
            { key: 'jobReminder', label: 'Vardiya Hatırlatması', desc: 'Mesai saati yaklaşırken hatırlatma' },
            { key: 'jobNearby', label: 'Semtte Yeni İlan', desc: 'Konumunuza yakın yeni vardiya açıldığında' },
          ]}
          settings={settings}
          onToggle={updateSetting}
        />

        <SettingGroup
          code="02 / İLETİŞİM"
          icon={MessageSquare}
          title="Mesaj Bildirimleri"
          items={[
            { key: 'newMessage', label: 'Yeni Mesaj', desc: 'İşveren veya adaydan mesaj geldiğinde' },
          ]}
          settings={settings}
          onToggle={updateSetting}
        />

        <SettingGroup
          code="03 / EMANET & CÜZDAN"
          icon={Wallet}
          title="Ödeme & Bakiye Bildirimleri"
          items={[
            { key: 'paymentReceived', label: 'Yevmiye Aktarıldı', desc: 'Cüzdanınıza ödeme geçtiğinde' },
            { key: 'paymentApproved', label: 'Ödeme Onaylandı', desc: 'Transfer talebiniz onaylandığında' },
            { key: 'paymentRejected', label: 'Ödeme Reddedildi', desc: 'Transfer talebiniz reddedildiğinde' },
            { key: 'walletDeposit', label: 'Bakiye Yüklendi', desc: 'Havuz bakiye yüklemeniz onaylandığında' },
            { key: 'walletWithdraw', label: 'IBAN Çekim Durumu', desc: 'Banka çekim talebiniz sonuçlandığında' },
          ]}
          settings={settings}
          onToggle={updateSetting}
        />

        <SettingGroup
          code="04 / SAHA QR"
          icon={QrCode}
          title="QR Vardiya Akışı"
          items={[
            { key: 'workStarted', label: 'Giriş QR Okutuldu', desc: 'Mesai başlangıcı onaylandığında' },
            { key: 'workCompleted', label: 'Çıkış QR Okutuldu', desc: 'Vardiya tamamlandığında' },
            { key: 'escrowDisputed', label: 'Emanet İhtilaf Kaydı', desc: 'Vardiya ile ilgili inceleme başlatıldığında' },
          ]}
          settings={settings}
          onToggle={updateSetting}
        />

        <SettingGroup
          code="05 / SİSTEM"
          icon={Settings}
          title="Sistem & Duyurular"
          items={[
            { key: 'systemUpdate', label: 'Platform Güncellemeleri', desc: 'Yeni özellik ve kural değişiklikleri' },
            { key: 'maintenance', label: 'Planlı Bakım', desc: 'Sistem bakım duyuruları' },
            { key: 'promotional', label: 'Bölgesel Bilgilendirme', desc: 'Yoğun vardiya dönemleri ve duyurular' },
          ]}
          settings={settings}
          onToggle={updateSetting}
        />
      </div>
    </div>
  )
}

function SettingGroup({
  code,
  icon: Icon,
  title,
  items,
  settings,
  onToggle,
}: {
  code: string
  icon: any
  title: string
  items: { key: keyof SettingsState; label: string; desc: string }[]
  settings: SettingsState
  onToggle: (key: keyof SettingsState, value: boolean) => void
}) {
  return (
    <section className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
      <div className="px-4 sm:px-5 py-3 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5]" />
          <h3 className="font-bold text-sm text-[#141615] dark:text-white">{title}</h3>
        </div>
        <span className="font-mono text-[10px] font-semibold text-[#5C615E] dark:text-[#949B97]">
          {code}
        </span>
      </div>

      <div className="divide-y divide-[#ECEAE4] dark:divide-[#222624]">
        {items.map((item) => (
          <div
            key={item.key}
            className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#141615] dark:text-white">
                {item.label}
              </div>
              <p className="text-xs text-[#5C615E] dark:text-[#949B97] mt-0.5">{item.desc}</p>
            </div>
            <Switch
              checked={settings[item.key] as boolean}
              onCheckedChange={(v) => onToggle(item.key, v)}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
