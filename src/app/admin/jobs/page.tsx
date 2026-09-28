'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  Briefcase,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

export default function AdminJobsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminFetch(`/api/v1/admin/jobs/pending?page=${page}&pageSize=20`)
      setJobs(res.data.items)
      setTotal(res.data.pagination.total)
      setTotalPages(res.data.pagination.totalPages)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated, load])

  const handleApprove = async (jobId: string) => {
    setActionLoading(jobId + '-approve')
    try {
      await adminFetch(`/api/v1/admin/jobs/pending/${jobId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note: 'İlan onaylandı' }),
      })
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (jobId: string, title: string) => {
    const reason = prompt(`"${title}" ilanını reddetme gerekçeniz:`)
    if (!reason || reason.trim().length < 3) return
    setActionLoading(jobId + '-reject')
    try {
      await adminFetch(`/api/v1/admin/jobs/pending/${jobId}/reject`, {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          İlan Onayları
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {total.toLocaleString('tr-TR')} ilan onay bekliyor • İşveren onaylı değilse ilanlar buraya düşer
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : jobs.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-60" />
            <p className="font-medium text-white">Onay bekleyen ilan yok</p>
            <p className="text-xs mt-1">Tüm ilanlar işleme alınmış veya onaylı işverenler tarafından otomatik yayına alınmış.</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5">
                {/* Üst başlık */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{job.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{job.category}</span>
                      <span>·</span>
                      <span>{new Date(job.createdAt).toLocaleString('tr-TR')}</span>
                      <span>·</span>
                      <span>{job._count?.applications || 0} başvuru</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-emerald-400">
                      {job.wageAmount.toLocaleString('tr-TR')}₺
                    </div>
                    <div className="text-xs text-slate-500">{job.wageType === 'DAILY' ? 'Günlük' : job.wageType === 'HOURLY' ? 'Saatlik' : 'Sabit'}</div>
                  </div>
                </div>

                {/* Açıklama */}
                <p className="text-sm text-slate-300 line-clamp-2 mb-4">{job.description}</p>

                {/* Detaylar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <DetailChip icon={MapPin} label="Konum" value={`${job.district}, ${job.city}`} />
                  <DetailChip icon={Calendar} label="Tarih" value={new Date(job.workDate).toLocaleDateString('tr-TR')} />
                  <DetailChip icon={Clock} label="Saat" value={`${job.startTime} - ${job.endTime}`} />
                  <DetailChip icon={Briefcase} label="Pozisyon" value={`${job.openingsTotal} kişi`} />
                </div>

                {/* İşveren bilgisi */}
                <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl mb-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {job.employer.fullName[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                      {job.employer.fullName}
                      {job.employer.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {job.employer.companyName ? `${job.employer.companyName} · ` : ''}{job.employer.email}
                    </p>
                  </div>
                  {job.employer.flagCount > 0 && (
                    <span className="text-xs text-red-400" title="İhlal sayısı">🚩 {job.employer.flagCount}</span>
                  )}
                </div>

                {/* Aksiyon butonları */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleApprove(job.id)}
                    disabled={actionLoading === job.id + '-approve'}
                    className="flex-1 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {actionLoading === job.id + '-approve' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Onayla ve Yayına Al
                  </button>
                  <button
                    onClick={() => handleReject(job.id, job.title)}
                    disabled={actionLoading === job.id + '-reject'}
                    className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {actionLoading === job.id + '-reject' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    Reddet
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-500">Sayfa {page} / {totalPages}</p>
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
  )
}

function DetailChip({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-slate-950/40 border border-slate-800 rounded-lg">
      <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 uppercase">{label}</p>
        <p className="text-xs text-white truncate">{value}</p>
      </div>
    </div>
  )
}
