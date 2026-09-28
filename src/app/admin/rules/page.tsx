'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  Shield,
  Plus,
  Trash2,
  Power,
  X,
  Loader2,
  Lock,
  AlertTriangle,
} from 'lucide-react'

interface Rule {
  id: string
  name: string
  description: string | null
  type: string
  pattern: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  action: 'FILTER' | 'BLOCK' | 'FLAG_ONLY'
  isEnabled: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

const TYPE_LABELS: Record<string, string> = {
  PROFANITY: 'Küfür',
  PHONE: 'Telefon',
  EMAIL: 'E-posta',
  URL: 'URL',
  SOCIAL_HANDLE: 'Sosyal Medya',
  IBAN: 'IBAN',
  ADDRESS: 'Adres',
  CUSTOM_REGEX: 'Özel Regex',
  KEYWORD: 'Anahtar Kelime',
}

const SEV_STYLES = {
  LOW: 'bg-blue-950/50 text-blue-300 border-blue-800/50',
  MEDIUM: 'bg-amber-950/50 text-amber-300 border-amber-800/50',
  HIGH: 'bg-orange-950/50 text-orange-300 border-orange-800/50',
  CRITICAL: 'bg-red-950/50 text-red-300 border-red-800/50',
} as const

const ACTION_STYLES = {
  FILTER: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50',
  BLOCK: 'bg-red-950/50 text-red-300 border-red-800/50',
  FLAG_ONLY: 'bg-indigo-950/50 text-indigo-300 border-indigo-800/50',
} as const

export default function AdminRulesPage() {
  const { isAuthenticated } = useAdminAuth()
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminFetch('/api/v1/admin/moderation/rules')
      setRules(res.data)
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

  const toggleRule = async (rule: Rule) => {
    try {
      await adminFetch(`/api/v1/admin/moderation/rules/${rule.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: !rule.isEnabled }),
      })
      load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const deleteRule = async (rule: Rule) => {
    if (!confirm(`"${rule.name}" kuralını silmek istediğinize emin misiniz?`)) return
    try {
      await adminFetch(`/api/v1/admin/moderation/rules/${rule.id}`, { method: 'DELETE' })
      load()
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Moderasyon Kuralları
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {rules.length} kural • Sohbet filtreleme kurallarını yönet
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Yeni Kural
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Bilgi kartı */}
      <div className="bg-gradient-to-br from-indigo-950/40 to-purple-950/30 border border-indigo-800/40 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-sm text-slate-300">
            <p className="font-semibold text-white mb-1">Akıllı Filtreleme Sistemi</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bu kurallar sohbet mesajları gönderilirken otomatik olarak uygulanır. Kurala uyan içerikler
              maskelenir (örn. <code className="text-indigo-300">[telefon]</code>) ve yönetici paneline
              <strong className="text-amber-300"> ihlal bayrağı</strong> olarak iletilir. Şiddet seviyesine
              göre otomatik yaptırım uygulanır (uyarı, askıya alma, ban).
            </p>
          </div>
        </div>
      </div>

      {/* Kurallar */}
      <div className="grid lg:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-slate-900/60 border rounded-2xl p-5 transition-all ${
                rule.isEnabled ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">{rule.name}</h3>
                    {rule.isSystem && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-medium">
                        <Lock className="w-2.5 h-2.5" /> Sistem
                      </span>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">{rule.description}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleRule(rule)}
                  title={rule.isEnabled ? 'Devre dışı bırak' : 'Etkinleştir'}
                  className={`p-1.5 rounded-lg transition-colors ${
                    rule.isEnabled
                      ? 'text-emerald-400 hover:bg-emerald-500/10'
                      : 'text-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Regex Deseni</p>
                  <code className="block px-2 py-1 bg-slate-950/60 border border-slate-800 rounded text-xs text-emerald-300 font-mono break-all">
                    {rule.pattern}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-xs text-slate-300">
                  {TYPE_LABELS[rule.type] || rule.type}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${SEV_STYLES[rule.severity]}`}>
                  {rule.severity}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${ACTION_STYLES[rule.action]}`}>
                  {rule.action === 'FILTER' ? 'Filtrele' : rule.action === 'BLOCK' ? 'Engelle' : 'Sadece İşaretle'}
                </span>
                {!rule.isSystem && (
                  <button
                    onClick={() => deleteRule(rule)}
                    className="ml-auto p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <CreateRuleModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            load()
          }}
        />
      )}
    </div>
  )
}

function CreateRuleModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('CUSTOM_REGEX')
  const [pattern, setPattern] = useState('')
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM')
  const [action, setAction] = useState<'FILTER' | 'BLOCK' | 'FLAG_ONLY'>('FILTER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testInput, setTestInput] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  const testPattern = () => {
    setTestResult(null)
    if (!pattern || !testInput) return
    try {
      const re = new RegExp(pattern, 'gi')
      const matches = testInput.match(re)
      if (matches && matches.length > 0) {
        setTestResult(`✓ Eşleşme bulundu: ${matches.length} sonuç → ${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''}`)
      } else {
        setTestResult('✗ Eşleşme yok')
      }
    } catch (e: any) {
      setTestResult(`✗ Geçersiz regex: ${e.message}`)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    if (!name || !pattern) {
      setError('İsim ve regex deseni zorunludur.')
      return
    }
    try {
      new RegExp(pattern, 'gi')
    } catch (e: any) {
      setError(`Geçersiz regex: ${e.message}`)
      return
    }
    setLoading(true)
    try {
      await adminFetch('/api/v1/admin/moderation/rules', {
        method: 'POST',
        body: JSON.stringify({ name, description, type, pattern, severity, action, isEnabled: true }),
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
          <h3 className="font-semibold text-white">Yeni Moderasyon Kuralı</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Kural Adı *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: WhatsApp bağlantısı engelle"
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Bu kural ne yapıyor?"
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">İhlal Tipi</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Şiddet</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="LOW">Düşük</option>
                <option value="MEDIUM">Orta</option>
                <option value="HIGH">Yüksek</option>
                <option value="CRITICAL">Kritik</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Aksiyon</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'FILTER', l: 'Filtrele', d: 'Mask + ilet' },
                { v: 'BLOCK', l: 'Engelle', d: 'Mesajı durdur' },
                { v: 'FLAG_ONLY', l: 'İşaretle', d: 'İlet + işaretle' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setAction(opt.v as any)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    action === opt.v
                      ? 'bg-indigo-500/20 border-indigo-500/50'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <p className="text-xs font-medium text-white">{opt.l}</p>
                  <p className="text-[10px] text-slate-500">{opt.d}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Regex Deseni * <span className="text-xs text-slate-500">(JavaScript regex)</span>
            </label>
            <input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Örn: (wa\\.me|whatsapp)\\/[a-zA-Z0-9]+"
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-emerald-300 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Test alanı */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
            <p className="text-xs text-slate-400">Deseni test et:</p>
            <input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Test edilecek metin..."
              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={testPattern}
              type="button"
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium"
            >
              Test Et
            </button>
            {testResult && (
              <p className="text-xs text-slate-400 font-mono">{testResult}</p>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-red-200 text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
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
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Oluşturuluyor...' : 'Kuralı Oluştur'}
          </button>
        </div>
      </div>
    </div>
  )
}
