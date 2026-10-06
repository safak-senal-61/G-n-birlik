'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Copy,
  CheckCheck,
  Search,
  User,
  Phone,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react'
import { TURKISH_BANKS } from '@/components/shared/bank-card'

const STATUS_INFO: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Beklemede', color: 'text-amber-300', bg: 'bg-amber-950/50 border-amber-800/50' },
  APPROVED: { label: 'Onaylandı', color: 'text-emerald-300', bg: 'bg-emerald-950/50 border-emerald-800/50' },
  REJECTED: { label: 'Reddedildi', color: 'text-red-300', bg: 'bg-red-950/50 border-red-800/50' },
  PAID: { label: 'Ödendi', color: 'text-blue-300', bg: 'bg-blue-950/50 border-blue-800/50' },
  RECEIVED: { label: 'Alındı', color: 'text-emerald-300', bg: 'bg-emerald-950/50 border-emerald-800/50' },
  DISPUTED: { label: 'İtiraz Var', color: 'text-red-300', bg: 'bg-red-950/50 border-red-800/50' },
  COMPLETED: { label: 'Tamamlandı', color: 'text-emerald-300', bg: 'bg-emerald-950/50 border-emerald-800/50' },
}

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>}>
      <PaymentsContent />
    </Suspense>
  )
}

function PaymentsContent() {
  const { isAuthenticated } = useAdminAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Aktif sekme: 'deposits' (Bakiye Yükleme), 'payments' (İş Ödemeleri), 'withdrawals' (Para Çekme)
  const [activeTab, setActiveTab] = useState<'deposits' | 'payments' | 'withdrawals'>('deposits')

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'payments' || tabParam === 'withdrawals' || tabParam === 'deposits') {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const handleTabChange = (tab: 'deposits' | 'payments' | 'withdrawals') => {
    setActiveTab(tab)
    router.replace(`/admin/payments?tab=${tab}`)
  }

  return (
    <div className="space-y-6">
      {/* Üst Sekmeler */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => handleTabChange('deposits')}
          className={`flex items-center gap-2.5 px-4 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'deposits'
              ? 'text-emerald-400 border-emerald-500 bg-emerald-500/10'
              : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          <span>Bakiye Yükleme Talepleri (Havale/EFT)</span>
        </button>

        <button
          onClick={() => handleTabChange('payments')}
          className={`flex items-center gap-2.5 px-4 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'payments'
              ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10'
              : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>İş & Hakediş Ödemeleri</span>
        </button>

        <button
          onClick={() => handleTabChange('withdrawals')}
          className={`flex items-center gap-2.5 px-4 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
            activeTab === 'withdrawals'
              ? 'text-red-400 border-red-500 bg-red-500/10'
              : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-900/40'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          <span>Para Çekme Talepleri (IBAN)</span>
        </button>
      </div>

      {activeTab === 'deposits' && <DepositRequestsTab isAuthenticated={isAuthenticated} />}
      {activeTab === 'payments' && <JobPaymentsTab isAuthenticated={isAuthenticated} />}
      {activeTab === 'withdrawals' && <WithdrawalRequestsTab isAuthenticated={isAuthenticated} />}
    </div>
  )
}

// ====================================================================
// TAB 1: BAKIYE YÜKLEME TALEPLERİ (HAVALE / EFT ONAYLARI)
// ====================================================================
function DepositRequestsTab({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('PENDING')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Modallar
  const [approveModal, setApproveModal] = useState<any>(null)
  const [rejectModal, setRejectModal] = useState<any>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q = new URLSearchParams({
        status,
        page: String(page),
        pageSize: '20',
      })
      if (search.trim()) q.set('search', search.trim())

      const res = await adminFetch(`/api/v1/admin/deposit-requests?${q.toString()}`)
      setItems(res.data.items)
      setTotal(res.data.pagination.total)
      setTotalPages(res.data.pagination.totalPages)
      setSummary(res.data.summary)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [status, page, search])

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated, load])

  const copyIban = (iban: string, id: string) => {
    navigator.clipboard.writeText(iban)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleApproveConfirm = async (requestId: string, note?: string) => {
    setActionLoading(requestId + '-approve')
    try {
      await adminFetch(`/api/v1/admin/deposit-requests/${requestId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      })
      setApproveModal(null)
      await load()
    } catch (e: any) {
      alert('Onaylama sırasında hata oluştu: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectConfirm = async (requestId: string, reason: string) => {
    setActionLoading(requestId + '-reject')
    try {
      await adminFetch(`/api/v1/admin/deposit-requests/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      })
      setRejectModal(null)
      await load()
    } catch (e: any) {
      alert('Reddetme sırasında hata oluştu: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Başlık ve Özet */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Bakiye Yükleme Talepleri</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              EFT / Havale
            </span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Kullanıcıların şirket hesabına gönderdiği ödemeleri onaylayarak cüzdan bakiyelerine aktarın.
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-500">Filtrelenen Tutar</p>
            <p className="text-2xl font-bold text-emerald-400">
              {summary.totalAmount.toLocaleString('tr-TR')}₺
            </p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <p className="text-xs text-slate-500">Talep Sayısı</p>
            <p className="text-xl font-bold text-slate-200">{total} kayıt</p>
          </div>
        </div>
      </div>

      {/* Arama & Filtreler */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'PENDING', label: 'Beklemede' },
            { key: 'APPROVED', label: 'Onaylandı' },
            { key: 'REJECTED', label: 'Reddedildi' },
            { key: 'ALL', label: 'Tümü' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatus(tab.key)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                status === tab.key
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="İsim, IBAN, banka ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Talepler Listesi */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <ArrowDownCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-400" />
            <p className="font-medium text-slate-400">Bu filtreye uygun bakiye yükleme talebi bulunamadı.</p>
            <p className="text-xs text-slate-600 mt-1">Kullanıcılar para yükleme talebi oluşturduğunda burada listelenir.</p>
          </div>
        ) : (
          items.map((item) => {
            const statusStyle = STATUS_INFO[item.status] || STATUS_INFO.PENDING
            const bankObj = TURKISH_BANKS.find(
              (b) => b.name.toLowerCase() === item.senderBank?.toLowerCase() || b.shortName.toLowerCase() === item.senderBank?.toLowerCase()
            )

            return (
              <div
                key={item.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-lg"
              >
                {/* Üst Kısım: Tutar ve Durum */}
                <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <ArrowDownCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-emerald-400 tracking-tight">
                          +{item.amount.toLocaleString('tr-TR')} ₺
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.color}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Talep ID: <span className="font-mono text-slate-400">{item.id.slice(-8)}</span> • {new Date(item.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  {/* Banka Bilgisi Rozeti */}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      {item.senderBank || 'Banka Belirtilmedi'}
                    </span>
                  </div>
                </div>

                {/* Orta Kısım: Gönderen Bilgileri & Cüzdan Sahibi */}
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  {/* Sol: Gönderici Banka & Transfer Bilgisi */}
                  <div className="p-3.5 bg-slate-950/50 border border-slate-800/70 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        EFT/Havale Gönderen Bilgileri
                      </p>
                      {item.senderBank && (
                        <span className="text-[11px] text-emerald-400 font-medium">{item.senderBank}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">
                        {item.senderName}
                      </p>
                      
                      {/* IBAN ve Kopyalama */}
                      <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-lg">
                        <span className="font-mono text-xs text-emerald-300 font-medium tracking-wider select-all truncate">
                          {item.senderIban}
                        </span>
                        <button
                          onClick={() => copyIban(item.senderIban, item.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors shrink-0"
                          title="IBAN Kopyala"
                        >
                          {copiedId === item.id ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {item.senderNote && (
                        <p className="text-xs text-slate-400 pt-1">
                          <strong className="text-slate-300">Açıklama:</strong> {item.senderNote}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sağ: Platform Kullanıcısı & Cüzdanı */}
                  <div className="p-3.5 bg-slate-950/50 border border-slate-800/70 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Hedef Cüzdan Sahibi (Kullanıcı)
                      </p>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                        {item.user?.role === 'EMPLOYER' ? 'İşveren' : item.user?.role === 'WORKER' ? 'İşçi' : 'Yönetici'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {item.user?.fullName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                          {item.user?.fullName}
                          {item.user?.isVerified && (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{item.user?.email}</p>
                        {item.user?.phone && (
                          <p className="text-xs text-slate-500 truncate">{item.user?.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between border-t border-slate-800/60 text-xs">
                      <span className="text-slate-400">Şu Anki Cüzdan Bakiyesi:</span>
                      <span className="font-bold text-slate-200">
                        {item.user?.walletBalance !== undefined
                          ? `${item.user.walletBalance.toLocaleString('tr-TR')} ₺`
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* İnceleme Bilgisi (Onaylandı/Reddedildi ise) */}
                {item.status === 'APPROVED' && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-xs text-emerald-200 flex items-center justify-between flex-wrap gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>Onaylandı:</strong> {item.reviewedAt ? new Date(item.reviewedAt).toLocaleString('tr-TR') : ''}
                        {item.reviewedBy && ` • Onaylayan: ${item.reviewedBy.fullName}`}
                        {item.reviewNote && ` • Not: ${item.reviewNote}`}
                      </span>
                    </div>
                    {item.transactionId && (
                      <span className="text-[11px] font-mono text-emerald-400/80">
                        İşlem ID: {item.transactionId.slice(-8)}
                      </span>
                    )}
                  </div>
                )}

                {item.status === 'REJECTED' && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-200 flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>
                      <strong>Reddedildi:</strong> {item.reviewNote || 'Gerekçe belirtilmedi.'}
                      {item.reviewedBy && ` (İnceleyen: ${item.reviewedBy.fullName})`}
                    </span>
                  </div>
                )}

                {/* Aksiyon Butonları (PENDING ise) */}
                {item.status === 'PENDING' && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => setApproveModal(item)}
                      disabled={actionLoading === item.id + '-approve'}
                      className="flex-1 min-w-[200px] px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === item.id + '-approve' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <Check className="w-4 h-4 stroke-[3]" />
                      )}
                      <span>Onayla & Bakiyeye Yansıt (+{item.amount.toLocaleString('tr-TR')}₺)</span>
                    </button>

                    <button
                      onClick={() => setRejectModal(item)}
                      disabled={actionLoading === item.id + '-reject'}
                      className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === item.id + '-reject' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>Reddet</span>
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Sayfalama */}
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

      {/* Onaylama Modalı */}
      {approveModal && (
        <ApproveDepositModal
          item={approveModal}
          loading={actionLoading === approveModal.id + '-approve'}
          onClose={() => setApproveModal(null)}
          onConfirm={(note) => handleApproveConfirm(approveModal.id, note)}
        />
      )}

      {/* Reddetme Modalı */}
      {rejectModal && (
        <RejectDepositModal
          item={rejectModal}
          loading={actionLoading === rejectModal.id + '-reject'}
          onClose={() => setRejectModal(null)}
          onConfirm={(reason) => handleRejectConfirm(rejectModal.id, reason)}
        />
      )}
    </div>
  )
}

function ApproveDepositModal({
  item,
  loading,
  onClose,
  onConfirm,
}: {
  item: any
  loading: boolean
  onClose: () => void
  onConfirm: (note?: string) => void
}) {
  const [note, setNote] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Bakiye Yüklemesini Onayla</h3>
            <p className="text-xs text-slate-400">Tutar anında kullanıcının cüzdanına yansıyacaktır.</p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Yüklenecek Tutar:</span>
            <span className="font-bold text-emerald-400 text-sm">{item.amount.toLocaleString('tr-TR')} ₺</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Kullanıcı:</span>
            <span className="font-medium text-slate-200">{item.user?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Gönderen Adı:</span>
            <span className="font-medium text-slate-200">{item.senderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Banka:</span>
            <span className="font-medium text-slate-200">{item.senderBank || '-'}</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Yönetici Onay Notu (Opsiyonel / Dekont No vb.)
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Örn: Garanti dekont kontrol edildi, bakiye yüklendi"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
          >
            Vazgeç
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Check className="w-4 h-4" />}
            <span>Onayla ve Bakiyeye Yansıt</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function RejectDepositModal({
  item,
  loading,
  onClose,
  onConfirm,
}: {
  item: any
  loading: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Talebi Reddet</h3>
            <p className="text-xs text-slate-400">Kullanıcıya ret sebebi bildirilecektir.</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Red Gerekçesi *
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Örn: Banka hesabımızda bu tutara ait gelen transfer bulunamadı."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
          >
            Vazgeç
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <X className="w-4 h-4" />}
            <span>Talebi Reddet</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ====================================================================
// TAB 2: İŞ VE HAKEDİŞ ÖDEMELERİ (MEVCUT SİSTEM)
// ====================================================================
function JobPaymentsTab({ isAuthenticated }: { isAuthenticated: boolean }) {
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
            İş & Hakediş Ödeme Onayları
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
        {Object.entries(STATUS_INFO)
          .filter(([key]) => ['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'RECEIVED', 'DISPUTED'].includes(key))
          .map(([key, info]) => (
            <button
              key={key}
              onClick={() => {
                setStatus(key)
                setPage(1)
              }}
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
          onClick={() => {
            setStatus('ALL')
            setPage(1)
          }}
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

                {payment.status === 'REJECTED' && payment.rejectionReason && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 mb-3">
                    <strong>Red Sebebi:</strong> {payment.rejectionReason}
                  </div>
                )}

                {payment.status === 'DISPUTED' && payment.disputeReason && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 mb-3">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    <strong>İtiraz Sebebi:</strong> {payment.disputeReason}
                  </div>
                )}

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

// ====================================================================
// TAB 3: PARA ÇEKME TALEPLERİ (WITHDRAWAL REQUESTS)
// ====================================================================
function WithdrawalRequestsTab({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('PENDING')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({ totalAmount: 0, count: 0 })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q = new URLSearchParams({
        status,
        page: String(page),
        pageSize: '20',
      })
      if (search.trim()) q.set('search', search.trim())

      const res = await adminFetch(`/api/v1/admin/withdrawal-requests?${q.toString()}`)
      setItems(res.data.items)
      setTotal(res.data.pagination.total)
      setTotalPages(res.data.pagination.totalPages)
      setSummary(res.data.summary)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [status, page, search])

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated, load])

  const copyIban = (iban: string, id: string) => {
    navigator.clipboard.writeText(iban)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const handleApprove = async (id: string) => {
    if (!confirm('Bu çekim talebinin banka transferini yaptığınızı onaylıyor musunuz?')) return
    setActionLoading(id + '-approve')
    try {
      await adminFetch(`/api/v1/admin/withdrawal-requests/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      await load()
    } catch (e: any) {
      alert('Hata: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Çekme talebi red gerekçesi (Para kullanıcının cüzdanına iade edilecektir):')
    if (!reason || reason.trim().length < 3) return
    setActionLoading(id + '-reject')
    try {
      await adminFetch(`/api/v1/admin/withdrawal-requests/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason.trim() }),
      })
      await load()
    } catch (e: any) {
      alert('Hata: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Para Çekme Talepleri</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
              IBAN&apos;a Çekim
            </span>
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            İşçilerin cüzdan bakiyelerini banka hesaplarına çekme talepleri. Onaylandığında işlem tamamlanır, reddedilirse tutar cüzdana iade edilir.
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-500">Filtrelenen Tutar</p>
            <p className="text-2xl font-bold text-red-400">
              {summary.totalAmount.toLocaleString('tr-TR')}₺
            </p>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <p className="text-xs text-slate-500">Talep Sayısı</p>
            <p className="text-xl font-bold text-slate-200">{total} kayıt</p>
          </div>
        </div>
      </div>

      {/* Arama & Filtreler */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'PENDING', label: 'Beklemede' },
            { key: 'COMPLETED', label: 'Tamamlandı' },
            { key: 'REJECTED', label: 'Reddedildi' },
            { key: 'ALL', label: 'Tümü' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatus(tab.key)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                status === tab.key
                  ? 'bg-red-500/20 border-red-500/40 text-red-200 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="İsim, IBAN, banka ara..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Liste */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          ))
        ) : items.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            <ArrowUpCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-red-400" />
            <p className="font-medium text-slate-400">Bu filtreye uygun para çekme talebi bulunamadı.</p>
          </div>
        ) : (
          items.map((item) => {
            const statusStyle = STATUS_INFO[item.status] || STATUS_INFO.PENDING
            return (
              <div
                key={item.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700/80 transition-all shadow-lg"
              >
                <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                      <ArrowUpCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-red-400 tracking-tight">
                          -{item.amount.toLocaleString('tr-TR')} ₺
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.color}`}>
                          {statusStyle.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Talep ID: <span className="font-mono text-slate-400">{item.id.slice(-8)}</span> • {new Date(item.createdAt).toLocaleString('tr-TR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <Building2 className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-semibold text-slate-200">
                      {item.recipientBank || 'Banka Belirtilmedi'}
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="p-3.5 bg-slate-950/50 border border-slate-800/70 rounded-xl space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Alıcı Hesap Bilgileri (IBAN)
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{item.recipientName}</p>
                      <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-lg">
                        <span className="font-mono text-xs text-red-300 font-medium tracking-wider select-all truncate">
                          {item.recipientIban}
                        </span>
                        <button
                          onClick={() => copyIban(item.recipientIban, item.id)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors shrink-0"
                          title="IBAN Kopyala"
                        >
                          {copiedId === item.id ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {item.recipientNote && (
                        <p className="text-xs text-slate-400 pt-1">
                          <strong className="text-slate-300">Not:</strong> {item.recipientNote}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-950/50 border border-slate-800/70 rounded-xl space-y-2">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Talep Eden Kullanıcı
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {item.user?.fullName?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{item.user?.fullName}</p>
                        <p className="text-xs text-slate-400 truncate">{item.user?.email}</p>
                        {item.user?.phone && (
                          <p className="text-xs text-slate-500 truncate">{item.user?.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {item.status === 'COMPLETED' && (
                  <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>✓ Ödeme bankadan gönderildi ve tamamlandı ({item.completedAt ? new Date(item.completedAt).toLocaleString('tr-TR') : ''})</span>
                  </div>
                )}

                {item.status === 'REJECTED' && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-300 mb-3">
                    <strong>Red Sebebi:</strong> {item.reviewNote || 'Gerekçe belirtilmedi.'} (Tutar kullanıcı cüzdanına iade edildi)
                  </div>
                )}

                {item.status === 'PENDING' && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={actionLoading === item.id + '-approve'}
                      className="flex-1 min-w-[200px] px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === item.id + '-approve' ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <Check className="w-4 h-4 stroke-[3]" />
                      )}
                      <span>Havale Yapıldı, Onayla</span>
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      disabled={actionLoading === item.id + '-reject'}
                      className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading === item.id + '-reject' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      <span>Reddet (İade Et)</span>
                    </button>
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
          <p className="text-xs text-slate-400 mt-1">
            İş: {payment.job?.title} · Tutar: {payment.amount}₺
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl text-xs text-red-200">
            <strong>İtiraz Sebebi:</strong> {payment.disputeReason}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-2">Karar</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResolution('APPROVED')}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  resolution === 'APPROVED'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                İşçi Haklı (Ödeme Yapılsın)
              </button>
              <button
                type="button"
                onClick={() => setResolution('REJECTED')}
                className={`p-3 rounded-xl border text-xs font-semibold transition-all ${
                  resolution === 'REJECTED'
                    ? 'bg-red-500/20 border-red-500 text-red-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400'
                }`}
              >
                İtiraz Red (Kapat)
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Gerekçe / Not (taraflara iletilecek)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Kararınızın gerekçesini yazın..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Vazgeç
          </button>
          <button
            onClick={() => onSubmit(resolution, note)}
            disabled={loading || !note.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Kararı Uygula
          </button>
        </div>
      </div>
    </div>
  )
}
