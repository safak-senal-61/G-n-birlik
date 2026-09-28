'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Bell, Briefcase, MessageSquare, Wallet, QrCode,
  Settings, RefreshCw, Loader2, ChevronLeft,
  CheckCircle2, XCircle, BellOff,
} from 'lucide-react'
import { toast } from 'sonner'

interface Settings {
  pushEnabled: boolean
  // İş
  jobApplied: boolean
  applicationAccepted: boolean
  applicationRejected: boolean
  jobReminder: boolean
  jobNearby: boolean
  // Mesaj
  newMessage: boolean
  // Ödeme
  paymentReceived: boolean
  paymentApproved: boolean
  paymentRejected: boolean
  walletDeposit: boolean
  walletWithdraw: boolean
  // QR / İş akışı
  workStarted: boolean
  workCompleted: boolean
  escrowDisputed: boolean
  // Sistem
  systemUpdate: boolean
  maintenance: boolean
  promotional: boolean
}

const DEFAULT_SETTINGS: Settings = {
  pushEnabled: true,
  jobApplied: true, applicationAccepted: true, applicationRejected: true,
  jobReminder: true, jobNearby: true,
  newMessage: true,
  paymentReceived: true, paymentApproved: true, paymentRejected: true,
  walletDeposit: true, walletWithdraw: true,
  workStarted: true, workCompleted: true, escrowDisputed: true,
  systemUpdate: true, maintenance: true, promotional: true,
}

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/notifications/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      })
      const data = await res.json()
      if (data.success) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.data })
      }
    } catch (e: any) {
      toast.error('Ayarlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const updateSetting = async (key: keyof Settings, value: boolean) => {
    // Optimistic update
    setSettings((prev) => ({ ...prev, [key]: value }))

    try {
      const res = await fetch('/api/v1/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ [key]: value }),
      })
      const data = await res.json()
      if (!data.success) {
        // Revert on error
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
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      })
      const data = await res.json()
      if (data.success) {
        setSettings({ ...DEFAULT_SETTINGS, ...data.data })
        toast.success('Ayarlar sıfırlandı')
      }
    } catch {
      toast.error('Sıfırlama hatası')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            Bildirim Ayarları
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Bildirim tercihlerinizi yönetin</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={handleReset}
          disabled={resetting}
        >
          {resetting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
          Sıfırla
        </Button>
      </div>

      {/* Genel Push Anahtarı */}
      <Card className={`mb-3 sm:mb-4 border-2 ${settings.pushEnabled ? 'border-indigo-200 bg-indigo-50/50' : 'border-gray-200 bg-gray-50'}`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
                settings.pushEnabled ? 'bg-indigo-100' : 'bg-gray-200'
              }`}>
                {settings.pushEnabled ? (
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                ) : (
                  <BellOff className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm sm:text-base text-gray-900">
                  Tüm Bildirimler
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {settings.pushEnabled ? 'Aktif — tüm bildirimler açık' : 'Kapalı — hiçbir bildirim alınmaz'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.pushEnabled}
              onCheckedChange={(v) => updateSetting('pushEnabled', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tüm push kapalıysa uyarı */}
      {!settings.pushEnabled && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 mb-3 sm:mb-4 text-center">
          🔕 Tüm bildirimler kapalı. Bildirim almak için yukarıdaki anahtarı açın.
        </div>
      )}

      {/* Bildirim Kategorileri */}
      <div className={`space-y-3 sm:space-y-4 ${!settings.pushEnabled ? 'opacity-50 pointer-events-none' : ''}`}>

        {/* İş Bildirimleri */}
        <SettingGroup
          icon={Briefcase}
          title="İş Bildirimleri"
          color="bg-blue-100 text-blue-600"
          items={[
            { key: 'jobApplied', label: 'Yeni İş Başvurusu', desc: 'İlanınıza başvuru geldiğinde' },
            { key: 'applicationAccepted', label: 'Başvuru Onaylandı', desc: 'Başvurunuz onaylandığında' },
            { key: 'applicationRejected', label: 'Başvuru Reddedildi', desc: 'Başvurunuz reddedildiğinde' },
            { key: 'jobReminder', label: 'İş Hatırlatması', desc: 'İş günü yaklaştığında hatırlatma' },
            { key: 'jobNearby', label: 'Yakında Yeni İş', desc: 'Konumunuza yakın yeni ilanlar' },
          ]}
          settings={settings}
          onToggle={updateSetting}
        />

        {/* Mesaj Bildirimleri */}
        <SettingGroup
          icon={MessageSquare}
          title="Mesaj Bildirimleri"
          color="bg-pink-100 text-pink-600"
          items={[
            { key: 'newMessage', label: 'Yeni Mesaj', desc: 'Size yeni mesaj geldiğinde' },
          ]}
          settings={settings}
          onToggle={updateSetting}
        />

        {/* Ödeme Bildirimleri */}
        <SettingGroup
          icon={Wallet}
          title="Ödeme & Cüzdan"
          color="bg-emerald-100 text-emerald-600"
          items={[
            { key: 'paymentReceived', label: 'Ödeme Alındı', desc: 'Cüzdanınıza para geldiğinde' },
            { key: 'paymentApproved', label: 'Ödeme Onaylandı', desc: 'Ödeme talebiniz onaylandığında' },
            { key: 'paymentRejected', label: 'Ödeme Reddedildi', desc: 'Ödeme talebiniz reddedildiğinde' },
            { key: 'walletDeposit', label: 'Bakiye Yüklendi', desc: 'Bakiye yatırma işleminiz onaylandığında' },
            { key: 'walletWithdraw', label: 'Para Çekme Durumu', desc: 'Çekme talebinizin durumu değiştiğinde' },
          ]}
          settings={settings}
          onToggle={updateSetting}
        />

        {/* QR / İş Akışı */}
        <SettingGroup
          icon={QrCode}
          title="İş Akışı & QR"
          color="bg-indigo-100 text-indigo-600"
          items={[
            { key: 'workStarted', label: 'İşe Başlandı', desc: 'QR ile işe başlatıldığında' },
            { key: 'workCompleted', label: 'İş Tamamlandı', desc: 'QR ile iş tamamlandığında' },
            { key: 'escrowDisputed', label: 'İş İhtilafı', desc: 'İş ile ilgili ihtilaf bildirildiğinde' },
          ]}
          settings={settings}
          onToggle={updateSetting}
        />

        {/* Sistem Bildirimleri */}
        <SettingGroup
          icon={Settings}
          title="Sistem & Duyurular"
          color="bg-slate-100 text-slate-600"
          items={[
            { key: 'systemUpdate', label: 'Sistem Güncellemesi', desc: 'Yeni özellikler ve güncellemeler' },
            { key: 'maintenance', label: 'Bakım Bildirimi', desc: 'Sistem bakımı ve planlı kesintiler' },
            { key: 'promotional', label: 'Promosyon & Duyuru', desc: 'Özel fırsatlar ve kampanyalar' },
          ]}
          settings={settings}
          onToggle={updateSetting}
        />
      </div>

      {/* Alt bilgi */}
      <div className="mt-6 p-3 bg-gray-50 rounded-xl text-center">
        <p className="text-[11px] text-gray-400">
          🔔 Ayarlarınız anında kaydedilir. Mobil uygulama da aynı ayarları kullanır.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Setting Group Component
// ============================================================
function SettingGroup({
  icon: Icon,
  title,
  color,
  items,
  settings,
  onToggle,
}: {
  icon: any
  title: string
  color: string
  items: { key: keyof Settings; label: string; desc: string }[]
  settings: Settings
  onToggle: (key: keyof Settings, value: boolean) => void
}) {
  return (
    <Card className="overflow-hidden">
      {/* Group Header */}
      <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-b border-gray-100">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-sm sm:text-base text-gray-900">{title}</h3>
      </div>

      {/* Items */}
      <div className="divide-y divide-gray-50">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
            <Switch
              checked={settings[item.key] as boolean}
              onCheckedChange={(v) => onToggle(item.key, v)}
            />
          </div>
        ))}
      </div>
    </Card>
  )
}
