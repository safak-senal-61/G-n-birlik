'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  Wrench,
  Save,
  Loader2,
  Clock,
  Mail,
  Phone,
  MessageCircle,
  Instagram,
  Twitter,
  Globe,
  AlertCircle,
  CheckCircle2,
  Power,
  Calendar,
} from 'lucide-react'

interface Settings {
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

export default function AdminSettingsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState<Settings>({
    maintenanceMode: false,
    maintenanceTitle: 'Bakım Çalışması Devam Ediyor',
    maintenanceMessage:
      'Daha iyi bir deneyim sunabilmek için sistemimizi güncelliyoruz. Kısa süre sonra tekrar hizmetinizde olacağız.',
    maintenanceEndTime: null,
    maintenanceStartedAt: null,
    contactEmail: '',
    contactPhone: '',
    contactWhatsapp: '',
    contactInstagram: '',
    contactTwitter: '',
    contactWebsite: '',
    siteName: 'Günübirlik İş Bul',
  })

  // datetime-local için format
  const [endTimeLocal, setEndTimeLocal] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminFetch('/api/v1/admin/settings')
      const s = res.data
      setSettings(s)
      setForm({
        maintenanceMode: s.maintenanceMode,
        maintenanceTitle: s.maintenanceTitle,
        maintenanceMessage: s.maintenanceMessage,
        maintenanceEndTime: s.maintenanceEndTime,
        maintenanceStartedAt: s.maintenanceStartedAt,
        contactEmail: s.contactEmail || '',
        contactPhone: s.contactPhone || '',
        contactWhatsapp: s.contactWhatsapp || '',
        contactInstagram: s.contactInstagram || '',
        contactTwitter: s.contactTwitter || '',
        contactWebsite: s.contactWebsite || '',
        siteName: s.siteName,
      })
      // datetime-local formatına çevir
      if (s.maintenanceEndTime) {
        const d = new Date(s.maintenanceEndTime)
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
        setEndTimeLocal(local)
      } else {
        setEndTimeLocal('')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated, load])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await adminFetch('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          maintenanceMode: form.maintenanceMode,
          maintenanceTitle: form.maintenanceTitle,
          maintenanceMessage: form.maintenanceMessage,
          maintenanceEndTime: endTimeLocal ? new Date(endTimeLocal).toISOString() : null,
          contactEmail: form.contactEmail || null,
          contactPhone: form.contactPhone || null,
          contactWhatsapp: form.contactWhatsapp || null,
          contactInstagram: form.contactInstagram || null,
          contactTwitter: form.contactTwitter || null,
          contactWebsite: form.contactWebsite || null,
          siteName: form.siteName,
        }),
      })
      setSuccess(
        form.maintenanceMode
          ? '✓ Bakım modu aktif edildi! Normal kullanıcılar artık bakım ekranı görüyor.'
          : '✓ Ayarlar kaydedildi. Bakım modu kapalı.'
      )
      await load()
      // 3 saniye sonra success mesajını temizle
      setTimeout(() => setSuccess(null), 5000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleMaintenance = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const newMode = !form.maintenanceMode
      await adminFetch('/api/v1/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          maintenanceMode: newMode,
          maintenanceTitle: form.maintenanceTitle,
          maintenanceMessage: form.maintenanceMessage,
          maintenanceEndTime: endTimeLocal ? new Date(endTimeLocal).toISOString() : null,
          contactEmail: form.contactEmail || null,
          contactPhone: form.contactPhone || null,
          contactWhatsapp: form.contactWhatsapp || null,
          contactInstagram: form.contactInstagram || null,
          contactTwitter: form.contactTwitter || null,
          contactWebsite: form.contactWebsite || null,
          siteName: form.siteName,
        }),
      })
      setSuccess(
        newMode
          ? '🔴 Bakım modu AKTİF! Tüm normal kullanıcılar bakım ekranı görüyor.'
          : '🟢 Bakım modu KAPALI. Sistem normal çalışıyor.'
      )
      await load()
      setTimeout(() => setSuccess(null), 5000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="h-96 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200">
        Hata: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          Site Ayarları
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Bakım modu, mesaj ve iletişim bilgilerini yönet
        </p>
      </div>

      {/* Success/Error mesajları */}
      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-200 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bakım Modu Durum Kartı */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 ${
          form.maintenanceMode
            ? 'bg-gradient-to-br from-red-950/60 to-amber-950/40 border-red-800/50'
            : 'bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border-emerald-800/40'
        }`}
      >
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                form.maintenanceMode
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {form.maintenanceMode ? 'Bakım Modu Aktif' : 'Sistem Aktif'}
              </h2>
              <p className="text-sm text-slate-300">
                {form.maintenanceMode
                  ? 'Normal kullanıcılar şu anda bakım ekranı görüyor. Admin olarak erişebilirsiniz.'
                  : 'Sistem normal çalışıyor. Tüm kullanıcılar erişebilir.'}
              </p>
              {form.maintenanceStartedAt && form.maintenanceMode && (
                <p className="text-xs text-amber-300 mt-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Başlangıç: {new Date(form.maintenanceStartedAt).toLocaleString('tr-TR')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={toggleMaintenance}
            disabled={saving}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shrink-0 ${
              form.maintenanceMode
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30'
            } disabled:opacity-60`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            {form.maintenanceMode ? 'Bakımı Kapat' : 'Bakımı Aç'}
          </button>
        </div>
      </div>

      {/* Bakım Mesajı */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-indigo-400" />
          Bakım Mesajı
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Başlık</label>
            <input
              type="text"
              value={form.maintenanceTitle}
              onChange={(e) => setForm({ ...form, maintenanceTitle: e.target.value })}
              placeholder="Bakım Çalışması Devam Ediyor"
              className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Mesaj</label>
            <textarea
              value={form.maintenanceMessage}
              onChange={(e) => setForm({ ...form, maintenanceMessage: e.target.value })}
              rows={4}
              placeholder="Daha iyi bir deneyim için..."
              className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tahmini Bitiş Zamanı (opsiyonel)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="datetime-local"
                value={endTimeLocal}
                onChange={(e) => setEndTimeLocal(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Bakım ekranında geri sayım olarak gösterilir. Boş bırakırsanız geri sayım görünmez.
            </p>
          </div>
        </div>
      </div>

      {/* İletişim Bilgileri */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4 text-indigo-400" />
          İletişim Bilgileri
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Bakım ekranında "Acil durumlar için" bölümünde gösterilir. İstediğin alanları doldur, boş bıraktıkların görünmez.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <ContactInput
            icon={Mail}
            label="E-posta"
            placeholder="destek@gunubirlik.com"
            value={form.contactEmail || ''}
            onChange={(v) => setForm({ ...form, contactEmail: v })}
          />
          <ContactInput
            icon={Phone}
            label="Telefon"
            placeholder="+90 850 123 45 67"
            value={form.contactPhone || ''}
            onChange={(v) => setForm({ ...form, contactPhone: v })}
          />
          <ContactInput
            icon={MessageCircle}
            label="WhatsApp (tam URL)"
            placeholder="https://wa.me/908501234567"
            value={form.contactWhatsapp || ''}
            onChange={(v) => setForm({ ...form, contactWhatsapp: v })}
          />
          <ContactInput
            icon={Instagram}
            label="Instagram (tam URL)"
            placeholder="https://instagram.com/gunubirlik"
            value={form.contactInstagram || ''}
            onChange={(v) => setForm({ ...form, contactInstagram: v })}
          />
          <ContactInput
            icon={Twitter}
            label="Twitter/X (tam URL)"
            placeholder="https://twitter.com/gunubirlik"
            value={form.contactTwitter || ''}
            onChange={(v) => setForm({ ...form, contactTwitter: v })}
          />
          <ContactInput
            icon={Globe}
            label="Web Sitesi (tam URL)"
            placeholder="https://gunubirlik.com"
            value={form.contactWebsite || ''}
            onChange={(v) => setForm({ ...form, contactWebsite: v })}
          />
        </div>
      </div>

      {/* Site Bilgileri */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400" />
          Site Bilgileri
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Site Adı</label>
          <input
            type="text"
            value={form.siteName}
            onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            placeholder="Günübirlik İş Bul"
            className="w-full px-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Kaydet Butonu */}
      <div className="flex justify-end gap-3 sticky bottom-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </button>
      </div>
    </div>
  )
}

function ContactInput({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: any
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>
  )
}
