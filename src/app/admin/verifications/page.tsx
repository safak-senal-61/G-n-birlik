'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  BadgeCheck,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  CheckCircle2,
} from 'lucide-react'

export default function AdminVerificationsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminFetch(`/api/v1/admin/verifications?status=${status}&page=${page}&pageSize=20`)
      setRequests(res.data.items)
      setTotal(res.data.pagination.total)
      setTotalPages(res.data.pagination.totalPages)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated, load])

  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId + '-approve')
    try {
      await adminFetch(`/api/v1/admin/verifications/${requestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (requestId: string) => {
    const reason = prompt('Doğrulama reddetme gerekçesi:')
    if (!reason || reason.trim().length < 3) return
    setActionLoading(requestId + '-reject')
    try {
      await adminFetch(`/api/v1/admin/verifications/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() }),
      })
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      COMPANY: 'Şirket Belgesi',
      IDENTITY: 'Kimlik Belgesi',
      TAX: 'Vergi Levhası',
    }
    return map[type] || type
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          İşveren Doğrulamaları
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {total.toLocaleString('tr-TR')} talep • Onaylanan işverenler "onaylı" rozeti alır ve ilanları otomatik yayına çıkar
        </p>
      </div>

      {/* Filtre */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3">
        {[
          { v: 'PENDING', l: 'Bekleyen' },
          { v: 'APPROVED', l: 'Onaylanan' },
          { v: 'REJECTED', l: 'Reddedilen' },
          { v: 'ALL', l: 'Tümü' },
        ].map((opt) => (
          <button
            key={opt.v}
            onClick={() => { setStatus(opt.v); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              status === opt.v
                ? 'bg-indigo-500/20 border-indigo-500/40 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            {opt.l}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : requests.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <BadgeCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Bu durumda doğrulama talebi yok.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-purple-950/50 border border-purple-800/50 text-purple-300 text-xs font-medium">
                      {typeLabel(req.type)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(req.createdAt).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  {req.documentNote && (
                    <p className="text-xs text-slate-400 italic mt-1">"{req.documentNote}"</p>
                  )}
                </div>
                {req.status === 'PENDING' && (
                  <span className="text-xs text-amber-300 bg-amber-950/50 border border-amber-800/50 px-2 py-0.5 rounded-md">
                    Beklemede
                  </span>
                )}
                {req.status === 'APPROVED' && (
                  <span className="text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Onaylandı
                  </span>
                )}
                {req.status === 'REJECTED' && (
                  <span className="text-xs text-red-300 bg-red-950/50 border border-red-800/50 px-2 py-0.5 rounded-md">
                    Reddedildi
                  </span>
                )}
              </div>

              {/* Kullanıcı bilgileri */}
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase mb-2">İşveren</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                      {req.user?.fullName?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{req.user?.fullName}</p>
                      {req.user?.companyName && (
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {req.user.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{req.user?.email}</p>
                    {req.user?.phone && (
                      <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{req.user.phone}</p>
                    )}
                    {req.user?.city && (
                      <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{req.user.district}, {req.user.city}</p>
                    )}
                  </div>
                </div>

                {/* Belge */}
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-500 uppercase mb-2">Yüklenen Belge</p>
                  <div className="flex items-center gap-2 p-2 bg-slate-900/60 rounded-lg">
                    <FileText className="w-8 h-8 text-indigo-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">{req.documentUrl?.slice(0, 40)}...</p>
                      <a
                        href={req.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Belgeyi Görüntüle →
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Red gerekçesi */}
              {req.status === 'REJECTED' && req.reviewNote && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 mb-3">
                  <strong>Red Sebebi:</strong> {req.reviewNote}
                </div>
              )}

              {/* Aksiyon butonları */}
              {req.status === 'PENDING' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(req.id)}
                    disabled={actionLoading === req.id + '-approve'}
                    className="flex-1 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {actionLoading === req.id + '-approve' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Onayla (Rozet Ver)
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoading === req.id + '-reject'}
                    className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {actionLoading === req.id + '-reject' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Reddet
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Sayfa {page} / {totalPages}</p>
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
