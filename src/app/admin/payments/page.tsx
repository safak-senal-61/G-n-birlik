'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  CreditCard,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  Wallet,
  MessageSquare,
  Shield,
} from 'lucide-react'

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Beklemede', color: 'text-amber-300', bg: 'bg-amber-950/50 border-amber-800/50' },
  APPROVED: { label: 'Onaylandı', color: 'text-emerald-300', bg: 'bg-emerald-950/50 border-emerald-800/50' },
  REJECTED: { label: 'Reddedildi', color: 'text-red-300', bg: 'bg-red-950/50 border-red-800/50' },
  PAID: { label: 'Ödendi', color: 'text-blue-300', bg: 'bg-blue-950/50 border-blue-800/50' },
  RECEIVED: { label: 'Alındı', color: 'text-emerald-300', bg: 'bg-emerald-950/50 border-emerald-800/50' },
  DISPUTED: { label: 'İtiraz Var', color: 'text-red-300', bg: 'bg-red-950/50 border-red-800/50' },
}

export default function AdminPaymentsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [disputeModal, setDisputeModal] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminFetch(`/api/v1/admin/payments?status=${status}&page=${page}&pageSize=20`)
      setPayments(res.data.items)
      setTotal(res.data.pagination.total)
      setTotalPages(res.data.pagination.totalPages)
      setSummary(res.data.summary)
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

  const handleApprove = async (paymentId: string) => {
    setActionLoading(paymentId + '-approve')
    try {
      await adminFetch(`/api/v1/admin/payments/${paymentId}/approve`, {
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

  const handleReject = async (paymentId: string) => {
    const reason = prompt('Ödeme reddetme gerekçesi:')
    if (!reason || reason.trim().length < 3) return
    setActionLoading(paymentId + '-reject')
    try {
      await adminFetch(`/api/v1/admin/payments/${paymentId}/reject`, {
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

  const handleDisputeResolve = async (paymentId: string, resolution: 'APPROVED' | 'REJECTED', note: string) => {
    setActionLoading(paymentId + '-dispute')
    try {
      await adminFetch(`/api/v1/admin/payments/${paymentId}/resolve-dispute`, {
        method: 'POST',
        body: JSON.stringify({ resolution, note }),
      })
      setDisputeModal(null)
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
            Ödeme Onayları
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {total.toLocaleString('tr-TR')} ödeme kaydı • İş tamamlandığında otomatik oluşturulur
          </p>
        </div>
        {summary.count > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500">Toplam Tutar</p>
            <p className="text-2xl font-bold text-emerald-400">
              {summary.totalAmount.toLocaleString('tr-TR')}₺
            </p>
            <p className="text-xs text-slate-500">{summary.count} kayıt</p>
          </div>
        )}
      </div>

      {/* Filtre */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3">
        {Object.entries(STATUS_INFO).map(([key, info]) => (
          <button
            key={key}
            onClick={() => { setStatus(key); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              status === key
                ? 'bg-indigo-500/20 border-indigo-500/40 text-white'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            {info.label}
          </button>
        ))}
        <button
          onClick={() => { setStatus('ALL'); setPage(1) }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            status === 'ALL'
              ? 'bg-indigo-500/20 border-indigo-500/40 text-white'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
          }`}
        >
          Tümü
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : payments.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Bu durumda ödeme kaydı yok.</p>
          </div>
        ) : (
          payments.map((payment) => {
            const info = STATUS_INFO[payment.status] || STATUS_INFO.PENDING
            return (
              <div key={payment.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-white truncate">{payment.job?.title}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${info.bg} ${info.color}`}>
                        {info.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Ödeme ID: {payment.id.slice(-8)} · Oluşturma: {new Date(payment.createdAt).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold text-emerald-400">
                      {payment.amount.toLocaleString('tr-TR')}₺
                    </div>
                    <div className="text-xs text-slate-500">
                      {payment.wageType === 'DAILY' ? 'Günlük ücret' : payment.wageType === 'HOURLY' ? 'Saatlik ücret' : 'Sabit ücret'}
                    </div>
                  </div>
                </div>

                {/* İşçi ve işveren kartları */}
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">İşçi (Alıcı)</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-xs">
                        {payment.worker?.fullName?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{payment.worker?.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{payment.worker?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">İşveren (Gönderen)</p>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs">
                        {payment.employer?.fullName?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate flex items-center gap-1">
                          {payment.employer?.fullName}
                          {payment.employer?.isVerified && <Check className="w-3 h-3 text-emerald-400" />}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {payment.employer?.companyName || payment.employer?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Red gerekçesi (eğer reddedildiyse) */}
                {payment.status === 'REJECTED' && payment.rejectionReason && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 mb-3">
                    <strong>Red Sebebi:</strong> {payment.rejectionReason}
                  </div>
                )}

                {/* İtiraz bilgisi */}
                {payment.status === 'DISPUTED' && payment.disputeReason && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 mb-3">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    <strong>İtiraz Sebebi:</strong> {payment.disputeReason}
                  </div>
                )}

                {/* Aksiyon butonları - duruma göre */}
                {payment.status === 'PENDING' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(payment.id)}
                      disabled={actionLoading === payment.id + '-approve'}
                      className="flex-1 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {actionLoading === payment.id + '-approve' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Ödemeyi Onayla
                    </button>
                    <button
                      onClick={() => handleReject(payment.id)}
                      disabled={actionLoading === payment.id + '-reject'}
                      className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {actionLoading === payment.id + '-reject' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      Reddet
                    </button>
                  </div>
                )}

                {payment.status === 'DISPUTED' && (
                  <button
                    onClick={() => setDisputeModal(payment)}
                    className="w-full px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    İtirazı Çözümle
                  </button>
                )}

                {payment.status === 'APPROVED' && (
                  <div className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-2">
                    ✓ Onaylandı ({payment.adminApprovedAt && new Date(payment.adminApprovedAt).toLocaleString('tr-TR')}) — İşveren ödemeyi yapacak
                  </div>
                )}
                {payment.status === 'RECEIVED' && (
                  <div className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-2">
                    ✓ İşlem tamamlandı — İşçi ödemeyi aldı ({payment.receivedAt && new Date(payment.receivedAt).toLocaleString('tr-TR')})
                  </div>
                )}
              </div>
            )
          })
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

      {/* İtiraz çözümleme modalı */}
      {disputeModal && (
        <DisputeResolveModal
          payment={disputeModal}
          loading={actionLoading === disputeModal.id + '-dispute'}
          onClose={() => setDisputeModal(null)}
          onSubmit={(resolution, note) => handleDisputeResolve(disputeModal.id, resolution, note)}
        />
      )}
    </div>
  )
}

function DisputeResolveModal({
  payment,
  loading,
  onClose,
  onSubmit,
}: {
  payment: any
  loading: boolean
  onClose: () => void
  onSubmit: (resolution: 'APPROVED' | 'REJECTED', note: string) => void
}) {
  const [resolution, setResolution] = useState<'APPROVED' | 'REJECTED'>('APPROVED')
  const [note, setNote] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-semibold text-white">İtirazı Çözümle</h3>
          <p className="text-xs text-slate-500 mt-1">
            {payment.amount.toLocaleString('tr-TR')}₺ · {payment.job?.title}
          </p>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            <strong>İtiraz:</strong> {payment.disputeReason}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Karar</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setResolution('APPROVED')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  resolution === 'APPROVED'
                    ? 'bg-emerald-500/20 border-emerald-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <Check className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                <p className="text-xs font-medium text-white">İşçi Lehine</p>
                <p className="text-[10px] text-slate-500">Ödeme yapılacak</p>
              </button>
              <button
                onClick={() => setResolution('REJECTED')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  resolution === 'REJECTED'
                    ? 'bg-red-500/20 border-red-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <X className="w-4 h-4 mx-auto mb-1 text-red-400" />
                <p className="text-xs font-medium text-white">İşveren Lehine</p>
                <p className="text-[10px] text-slate-500">İtiraz reddedilecek</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Açıklama</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Kararınızın gerekçesi..."
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-800">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors">
            İptal
          </button>
          <button
            onClick={() => note.trim().length >= 3 && onSubmit(resolution, note.trim())}
            disabled={loading || note.trim().length < 3}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Çözümle
          </button>
        </div>
      </div>
    </div>
  )
}
