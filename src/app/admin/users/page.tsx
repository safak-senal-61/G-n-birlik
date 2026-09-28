'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  Users,
  Search,
  Ban,
  Pause,
  Play,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'

interface UserItem {
  id: string
  email: string
  phone: string | null
  fullName: string
  role: string
  avatarUrl: string | null
  companyName: string | null
  isVerified: boolean
  city: string | null
  district: string | null
  isSuspended: boolean
  suspendedUntil: string | null
  suspensionReason: string | null
  isPermanentlyBanned: boolean
  bannedReason: string | null
  flagCount: number
  warningCount: number
  lastFlagAt: string | null
  lastActiveAt: string
  createdAt: string
  status: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
}

export default function AdminUsersPage() {
  const { isAuthenticated } = useAdminAuth()
  const router = useRouter()

  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [suspendModal, setSuspendModal] = useState<{ user: UserItem; isBan: boolean } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: '20',
        role,
        status,
      })
      if (search) params.set('search', search)
      const res = await adminFetch(`/api/v1/admin/users?${params}`)
      setUsers(res.data.items)
      setTotal(res.data.pagination.total)
      setTotalPages(res.data.pagination.totalPages)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, role, status, search])

  useEffect(() => {
    if (!isAuthenticated) return
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [isAuthenticated, load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          Kullanıcı Yönetimi
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {total.toLocaleString('tr-TR')} kullanıcı • Askıya al, banla, uyarı ver
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="İsim, e-posta, telefon veya firma ara..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Tüm Roller</option>
          <option value="WORKER">İş Arayan</option>
          <option value="EMPLOYER">İşveren</option>
          <option value="ADMIN">Yönetici</option>
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
          className="px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">Tüm Durumlar</option>
          <option value="ACTIVE">Aktif</option>
          <option value="SUSPENDED">Askıya Alınmış</option>
          <option value="BANNED">Banlı</option>
        </select>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-950/40 border-b border-slate-800">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Kullanıcı</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Rol / Konum</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">İhlal</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Durum</th>
                <th className="text-right text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-10 bg-slate-800/60 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    Kullanıcı bulunamadı.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {u.fullName[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                            {u.fullName}
                            {u.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-800 text-xs text-slate-300">
                        {u.role === 'WORKER' ? 'İş Arayan' : u.role === 'EMPLOYER' ? 'İşveren' : u.role === 'ADMIN' ? 'Yönetici' : u.role}
                      </span>
                      {u.city && (
                        <p className="text-xs text-slate-500 mt-1">
                          {u.district ? `${u.district}, ` : ''}{u.city}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex gap-3 text-xs">
                        <span className="text-amber-400" title="Uyarı sayısı">
                          ⚠ {u.warningCount}
                        </span>
                        <span className="text-red-400" title="İhlal sayısı">
                          🚩 {u.flagCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/users/${u.id}`)}
                          title="Detay"
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {u.status === 'ACTIVE' && u.role !== 'ADMIN' && (
                          <>
                            <button
                              onClick={() => setSuspendModal({ user: u, isBan: false })}
                              title="Askıya Al"
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSuspendModal({ user: u, isBan: true })}
                              title="Kalıcı Ban"
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {(u.status === 'SUSPENDED' || u.status === 'BANNED') && (
                          <button
                            onClick={() => setSuspendModal({ user: u, isBan: false })}
                            title="Aktifleştir"
                            className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Sayfa {page} / {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {suspendModal && (
        <SuspendModal
          user={suspendModal.user}
          isBan={suspendModal.isBan}
          onClose={() => setSuspendModal(null)}
          onSuccess={() => {
            setSuspendModal(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' }) {
  if (status === 'BANNED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-medium">
        <Ban className="w-3 h-3" /> Banlı
      </span>
    )
  }
  if (status === 'SUSPENDED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/50 border border-amber-800/50 text-amber-300 text-xs font-medium">
        <Pause className="w-3 h-3" /> Askıda
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs font-medium">
      <CheckCircle2 className="w-3 h-3" /> Aktif
    </span>
  )
}

function SuspendModal({
  user,
  isBan,
  onClose,
  onSuccess,
}: {
  user: UserItem
  isBan: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const isCurrentlySuspended = user.status === 'SUSPENDED' || user.status === 'BANNED'
  const [duration, setDuration] = useState<number>(24)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isUnsuspend = isCurrentlySuspended

  const handleSubmit = async () => {
    setError(null)
    if (!reason.trim() || reason.trim().length < 3) {
      setError('Lütfen en az 3 karakterlik bir gerekçe girin.')
      return
    }
    setLoading(true)
    try {
      if (isUnsuspend) {
        await adminFetch(`/api/v1/admin/users/${user.id}/unsuspend`, {
          method: 'POST',
          body: JSON.stringify({ reason: reason.trim() }),
        })
      } else {
        await adminFetch(`/api/v1/admin/users/${user.id}/suspend`, {
          method: 'POST',
          body: JSON.stringify({
            durationHours: isBan ? null : duration,
            reason: reason.trim(),
          }),
        })
      }
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
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isUnsuspend
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isBan
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isUnsuspend ? <Play className="w-5 h-5" /> : isBan ? <Ban className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-white">
                {isUnsuspend ? 'Hesabı Aktifleştir' : isBan ? 'Kalıcı Banla' : 'Askıya Al'}
              </h3>
              <p className="text-xs text-slate-500">{user.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-400">
              <p className="font-medium text-slate-300 mb-1">{user.fullName}</p>
              <p>
                {user.flagCount} ihlal, {user.warningCount} uyarı.{' '}
                {user.lastFlagAt && (
                  <>Son ihlal: {new Date(user.lastFlagAt).toLocaleDateString('tr-TR')}</>
                )}
              </p>
            </div>
          </div>

          {!isUnsuspend && !isBan && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Süre
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { h: 1, label: '1 Saat' },
                  { h: 24, label: '1 Gün' },
                  { h: 24 * 7, label: '1 Hafta' },
                  { h: 24 * 30, label: '1 Ay' },
                ].map((opt) => (
                  <button
                    key={opt.h}
                    onClick={() => setDuration(opt.h)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      duration === opt.h
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                Bitiş: {new Date(Date.now() + duration * 3600 * 1000).toLocaleString('tr-TR')}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {isUnsuspend ? 'Aktifleştirme Gerekçesi' : 'Gerekçe'}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={
                isUnsuspend
                  ? 'Askıya almayı kaldırma sebebiniz...'
                  : isBan
                  ? 'Kalıcı ban gerekçesi (kullanıcıya bildirilecek)...'
                  : 'Askıya alma gerekçesi (kullanıcıya bildirilecek)...'
              }
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/50 rounded-lg text-red-200 text-xs">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!isUnsuspend && isBan && (
            <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-900/50 rounded-lg text-red-300 text-xs">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong>Dikkat:</strong> Kalıcı ban, kullanıcının hesabına erişimini tamamen kapatır. Bu işlem geri alınabilir ancak kullanıcının tüm verileri korunur.
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-slate-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-60 ${
              isUnsuspend
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/25'
                : isBan
                ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/25'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/25'
            }`}
          >
            {loading ? 'İşleniyor...' : isUnsuspend ? 'Aktifleştir' : isBan ? 'Kalıcı Banla' : 'Askıya Al'}
          </button>
        </div>
      </div>
    </div>
  )
}
