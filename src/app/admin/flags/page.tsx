'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  Flag,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Ban,
  Pause,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCircle,
  MessageSquare,
  Shield,
  Loader2,
} from 'lucide-react'

interface FlagItem {
  id: string
  messageId: string
  conversationId: string
  senderId: string
  violationType: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  matchedText: string
  status: string
  createdAt: string
  sender: {
    id: string
    fullName: string
    email: string
    avatarUrl: string | null
    role: string
    flagCount: number
    isSuspended: boolean
    isPermanentlyBanned: boolean
  }
  message: {
    id: string
    content: string
    originalContent: string | null
    conversationId: string
    createdAt: string
  }
}

export default function AdminFlagsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [flags, setFlags] = useState<FlagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('PENDING')
  const [severity, setSeverity] = useState('ALL')
  const [violationType, setViolationType] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [resolveModal, setResolveModal] = useState<FlagItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        status,
        severity,
        violationType,
      })
      const res = await adminFetch(`/api/v1/admin/flags?${params}`)
      setFlags(res.data.items)
      setTotal(res.data.pagination.total)
      setTotalPages(res.data.pagination.totalPages)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, status, severity, violationType])

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated, load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          İhlal Kuyruğu
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {total.toLocaleString('tr-TR')} kayıt • Otomatik filtrelenen mesajları incele ve aksiyon al
        </p>
      </div>

      {/* Filtreler */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="PENDING">Bekleyen</option>
          <option value="ACTION_TAKEN">İşlem Yapıldı</option>
          <option value="REVIEWED">İncelendi</option>
          <option value="DISMISSED">Reddedildi</option>
          <option value="ALL">Tümü</option>
        </select>
        <select
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Tüm Şiddet Seviyeleri</option>
          <option value="LOW">Düşük</option>
          <option value="MEDIUM">Orta</option>
          <option value="HIGH">Yüksek</option>
          <option value="CRITICAL">Kritik</option>
        </select>
        <select
          value={violationType}
          onChange={(e) => {
            setViolationType(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Tüm İhlal Tipleri</option>
          <option value="PROFANITY">Küfür/Hakaret</option>
          <option value="PHONE">Telefon</option>
          <option value="EMAIL">E-posta</option>
          <option value="URL">URL/Link</option>
          <option value="SOCIAL_HANDLE">Sosyal Medya</option>
          <option value="IBAN">IBAN</option>
          <option value="ADDRESS">Adres</option>
          <option value="THREAT">Tehdit</option>
          <option value="SPAM">Spam</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Liste */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : flags.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <Flag className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Bu filtrede ihlal bulunmuyor.</p>
            <p className="text-xs mt-1">Tüm ihlaller işlenmiş veya filtreleri değiştirin.</p>
          </div>
        ) : (
          flags.map((flag) => <FlagCard key={flag.id} flag={flag} onResolve={() => setResolveModal(flag)} />)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">
            Sayfa {page} / {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {resolveModal && (
        <ResolveModal
          flag={resolveModal}
          onClose={() => setResolveModal(null)}
          onSuccess={() => {
            setResolveModal(null)
            load()
          }}
        />
      )}
    </div>
  )
}

const SEVERITY_STYLES = {
  LOW: {
    badge: 'bg-blue-950/50 border-blue-800/50 text-blue-300',
    bar: 'from-blue-500 to-cyan-500',
    label: 'Düşük',
  },
  MEDIUM: {
    badge: 'bg-amber-950/50 border-amber-800/50 text-amber-300',
    bar: 'from-amber-500 to-yellow-500',
    label: 'Orta',
  },
  HIGH: {
    badge: 'bg-orange-950/50 border-orange-800/50 text-orange-300',
    bar: 'from-orange-500 to-red-500',
    label: 'Yüksek',
  },
  CRITICAL: {
    badge: 'bg-red-950/50 border-red-800/50 text-red-300',
    bar: 'from-red-500 to-rose-600',
    label: 'Kritik',
  },
} as const

const TYPE_LABELS: Record<string, string> = {
  PROFANITY: 'Küfür/Hakaret',
  PHONE: 'Telefon Numarası',
  EMAIL: 'E-posta Adresi',
  URL: 'Web Sitesi/Link',
  SOCIAL_HANDLE: 'Sosyal Medya',
  IBAN: 'IBAN Numarası',
  ADDRESS: 'Adres Bilgisi',
  SPAM: 'Spam',
  THREAT: 'Tehdit',
  OTHER: 'Diğer',
}

function FlagCard({ flag, onResolve }: { flag: FlagItem; onResolve: () => void }) {
  const sev = SEVERITY_STYLES[flag.severity]
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
      <div className={`h-1 bg-gradient-to-r ${sev.bar}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center shrink-0">
              <UserCircle className="w-6 h-6 text-slate-300" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white truncate">{flag.sender.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{flag.sender.email}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                <span className={`px-1.5 py-0.5 rounded ${sev.badge} border text-[10px] font-semibold`}>
                  {sev.label}
                </span>
                <span>·</span>
                <span>{TYPE_LABELS[flag.violationType] || flag.violationType}</span>
                <span>·</span>
                <span>{new Date(flag.createdAt).toLocaleString('tr-TR')}</span>
              </div>
            </div>
          </div>
          {flag.status === 'PENDING' && (
            <button
              onClick={onResolve}
              className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors shrink-0"
            >
              İncele
            </button>
          )}
          {flag.status !== 'PENDING' && (
            <span className="text-xs text-slate-500 shrink-0">
              {flag.status === 'ACTION_TAKEN' ? '✓ İşlem Yapıldı' : flag.status === 'REVIEWED' ? '✓ İncelendi' : '✗ Reddedildi'}
            </span>
          )}
        </div>

        {/* Mesaj içeriği */}
        <div className="space-y-2">
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Alıcının gördüğü (filtrelenmiş):</p>
            <p className="text-sm text-slate-200">{flag.message.content}</p>
          </div>
          {flag.message.originalContent && (
            <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl">
              <p className="text-xs text-amber-400 mb-1">Orijinal içerik (admin görür):</p>
              <p className="text-sm text-amber-200">{flag.message.originalContent}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span title="Kullanıcının toplam ihlali">
              🚩 {flag.sender.flagCount} toplam
            </span>
            {flag.sender.isPermanentlyBanned && (
              <span className="text-red-400 font-medium">• Banlı</span>
            )}
            {flag.sender.isSuspended && !flag.sender.isPermanentlyBanned && (
              <span className="text-amber-400 font-medium">• Askıda</span>
            )}
          </div>
          <span className="font-mono">{flag.id.slice(-8)}</span>
        </div>
      </div>
    </div>
  )
}

function ResolveModal({
  flag,
  onClose,
  onSuccess,
}: {
  flag: FlagItem
  onClose: () => void
  onSuccess: () => void
}) {
  const [action, setAction] = useState<'DISMISS' | 'WARN' | 'SUSPEND' | 'BAN' | 'NONE'>('WARN')
  const [suspendHours, setSuspendHours] = useState(24)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      await adminFetch(`/api/v1/admin/flags/${flag.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          note: note.trim() || undefined,
          suspendDurationHours: action === 'SUSPEND' ? suspendHours : undefined,
        }),
      })
      onSuccess()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h3 className="font-semibold text-white">İhlali Çözümle</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Bilgi */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Kullanıcı</span>
              <span className="text-white font-medium">{flag.sender.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">İhlal</span>
              <span className="text-white">{TYPE_LABELS[flag.violationType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Şiddet</span>
              <span className={`px-2 py-0.5 rounded ${SEVERITY_STYLES[flag.severity].badge} border text-xs font-semibold`}>
                {SEVERITY_STYLES[flag.severity].label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kullanıcının toplam ihlali</span>
              <span className="text-red-400 font-bold">{flag.sender.flagCount}</span>
            </div>
          </div>

          {/* Orijinal mesaj */}
          {flag.message.originalContent && (
            <div>
              <p className="text-xs text-amber-400 mb-1">Orijinal mesaj:</p>
              <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl text-sm text-amber-200">
                {flag.message.originalContent}
              </div>
            </div>
          )}

          {/* Aksiyon seçimi */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Aksiyon</label>
            <div className="space-y-2">
              {[
                { v: 'DISMISS', label: 'Reddet', desc: 'İhlali geçersiz say, işlem yapma', icon: X, color: 'text-slate-400' },
                { v: 'NONE', label: 'Sadece incelemeyi kapat', desc: 'İşlem yok, sadece "incelendi" olarak işaretle', icon: CheckCircle2, color: 'text-blue-400' },
                { v: 'WARN', label: 'Uyarı gönder', desc: 'Kullanıcıya uyarı bildirimi gönder', icon: AlertCircle, color: 'text-amber-400' },
                { v: 'SUSPEND', label: 'Askıya al', desc: 'Hesabı geçici olarak askıya al', icon: Pause, color: 'text-orange-400' },
                { v: 'BAN', label: 'Kalıcı banla', desc: 'Hesabı kalıcı olarak kapat', icon: Ban, color: 'text-red-400' },
              ].map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.v}
                    onClick={() => setAction(opt.v as any)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      action === opt.v
                        ? 'bg-indigo-500/15 border-indigo-500/40'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 ${opt.color}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{opt.label}</p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 mt-1 ${
                        action === opt.v ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Askıya alma süresi */}
          {action === 'SUSPEND' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Süre</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { h: 1, label: '1 Saat' },
                  { h: 24, label: '1 Gün' },
                  { h: 24 * 7, label: '1 Hafta' },
                  { h: 24 * 30, label: '1 Ay' },
                ].map((opt) => (
                  <button
                    key={opt.h}
                    onClick={() => setSuspendHours(opt.h)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      suspendHours === opt.h
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Not */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Not (opsiyonel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Bu aksiyon için ek not (kullanıcıya iletilir)..."
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-red-200 text-xs">
              <Shield className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-800 sticky bottom-0 bg-slate-900">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Uygulanıyor...' : 'Uygula'}
          </button>
        </div>
      </div>
    </div>
  )
}
