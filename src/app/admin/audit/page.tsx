'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  ScrollText,
  ChevronLeft,
  ChevronRight,
  User,
  Ban,
  Pause,
  Play,
  Flag,
  Shield,
  Settings2,
} from 'lucide-react'

interface AuditLogItem {
  id: string
  actorId: string
  action: string
  targetType: string
  targetId: string | null
  metadata: any
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  actor: {
    id: string
    fullName: string
    email: string
    avatarUrl: string | null
    role: string
  }
}

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  USER_SUSPEND: { label: 'Kullanıcı Askıya Alındı', icon: Pause, color: 'text-amber-400 bg-amber-500/10' },
  USER_UNSUSPEND: { label: 'Askıya Alma Kaldırıldı', icon: Play, color: 'text-emerald-400 bg-emerald-500/10' },
  USER_BAN: { label: 'Kullanıcı Banlandı', icon: Ban, color: 'text-red-400 bg-red-500/10' },
  USER_UNBAN: { label: 'Ban Kaldırıldı', icon: Play, color: 'text-emerald-400 bg-emerald-500/10' },
  FLAG_RESOLVE: { label: 'İhlal Çözümlendi', icon: Flag, color: 'text-indigo-400 bg-indigo-500/10' },
  FLAG_DISMISS: { label: 'İhlal Reddedildi', icon: Flag, color: 'text-slate-400 bg-slate-500/10' },
  RULE_UPDATE: { label: 'Kural Güncellendi', icon: Settings2, color: 'text-purple-400 bg-purple-500/10' },
  ADMIN_LOGIN: { label: 'Yönetici Girişi', icon: Shield, color: 'text-blue-400 bg-blue-500/10' },
}

export default function AdminAuditPage() {
  const { isAuthenticated } = useAdminAuth()
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '30',
      })
      if (actionFilter) params.set('action', actionFilter)
      const res = await adminFetch(`/api/v1/admin/audit?${params}`)
      setLogs(res.data.items)
      setTotal(res.data.pagination.total)
      setTotalPages(res.data.pagination.totalPages)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, actionFilter])

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated, load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          İşlem Günlüğü
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {total.toLocaleString('tr-TR')} kayıt • Yönetici panelindeki tüm işlemlerin kaydı
        </p>
      </div>

      {/* Filtre */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">Tüm İşlemler</option>
          <option value="USER_SUSPEND">Askıya Alma</option>
          <option value="USER_UNSUSPEND">Askıya Alma Kaldırma</option>
          <option value="USER_BAN">Banlama</option>
          <option value="USER_UNBAN">Ban Kaldırma</option>
          <option value="FLAG_RESOLVE">İhlal Çözümleme</option>
          <option value="FLAG_DISMISS">İhlal Reddetme</option>
          <option value="RULE_UPDATE">Kural Güncelleme</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-800/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Kayıt bulunamadı.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {logs.map((log) => {
              const info = ACTION_LABELS[log.action] || {
                label: log.action,
                icon: Shield,
                color: 'text-slate-400 bg-slate-500/10',
              }
              const Icon = info.icon
              return (
                <div key={log.id} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${info.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-sm font-medium text-white">{info.label}</p>
                      <span className="text-xs text-slate-500 font-mono shrink-0">
                        {new Date(log.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      <span>{log.actor.fullName}</span>
                      <span>·</span>
                      <span>{log.actor.email}</span>
                    </div>
                    {log.metadata && (
                      <div className="mt-2 p-2 bg-slate-950/40 border border-slate-800 rounded-lg text-xs text-slate-400 font-mono">
                        {typeof log.metadata === 'object' ? JSON.stringify(log.metadata) : log.metadata}
                      </div>
                    )}
                    {log.ipAddress && log.ipAddress !== 'unknown' && (
                      <p className="mt-1 text-xs text-slate-600">IP: {log.ipAddress}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
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
      </div>
    </div>
  )
}
