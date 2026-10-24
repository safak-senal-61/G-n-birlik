'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  ArrowLeft,
  User as UserIcon,
  Flag,
  Ban,
  Pause,
  Play,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MessageSquare,
  Briefcase,
  Star,
  Shield,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAdminAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !id) return
    ;(async () => {
      try {
        const res = await adminFetch(`/api/v1/admin/users/${id}`)
        setData(res.data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [isAuthenticated, id])

  if (loading)
    return (
      <div className="space-y-4">
        <div className="h-10 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-48 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    )
  if (error)
    return (
      <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200">
        Hata: {error}
      </div>
    )
  if (!data) return null

  const { user, stats, recentFlags, suspensions, auditLogs } = data

  return (
    <div className="space-y-6">
      {/* Geri butonu */}
      <button
        onClick={() => router.push('/admin/users')}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Kullanıcı listesine dön
      </button>

      {/* Üst kart */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-600/40 via-purple-600/30 to-slate-900" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-900 bg-slate-800 shrink-0 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 border-4 border-slate-900 flex items-center justify-center text-white font-bold text-3xl shrink-0 shadow-lg">
                {user.fullName[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{user.fullName}</h1>
                {user.isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                )}
                <StatusPill status={user.status} />
              </div>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
            <div className="flex gap-2 pb-2">
              {user.status === 'ACTIVE' && user.role !== 'ADMIN' && (
                <>
                  <button
                    onClick={() => router.push(`/admin/users?suspend=${user.id}`)}
                    className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Pause className="w-3.5 h-3.5" /> Askıya Al
                  </button>
                  <button
                    onClick={() => router.push(`/admin/users?ban=${user.id}`)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" /> Banla
                  </button>
                </>
              )}
              {(user.status === 'SUSPENDED' || user.status === 'BANNED') && (
                <button
                  onClick={() => router.push(`/admin/users?reactivate=${user.id}`)}
                  className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" /> Aktifleştir
                </button>
              )}
            </div>
          </div>

          {/* Bilgi satırı */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <InfoChip icon={UserIcon} label="Rol" value={user.role === 'WORKER' ? 'İş Arayan' : user.role === 'EMPLOYER' ? 'İşveren' : user.role} />
            <InfoChip icon={Mail} label="E-posta" value={user.email} />
            <InfoChip icon={Phone} label="Telefon" value={user.phone || '—'} />
            <InfoChip icon={MapPin} label="Konum" value={user.city ? `${user.district || ''} ${user.city}`.trim() : '—'} />
            <InfoChip icon={Calendar} label="Kayıt" value={new Date(user.createdAt).toLocaleDateString('tr-TR')} />
            <InfoChip icon={Clock} label="Son Aktif" value={new Date(user.lastActiveAt).toLocaleString('tr-TR')} />
            <InfoChip icon={Flag} label="İhlal Sayısı" value={user.flagCount} highlight={user.flagCount > 0} />
            <InfoChip icon={AlertTriangle} label="Uyarı Sayısı" value={user.warningCount} highlight={user.warningCount > 0} />
          </div>

          {/* Askıya alma bilgisi */}
          {(user.isSuspended || user.isPermanentlyBanned) && (
            <div className={`mt-4 p-4 rounded-xl border ${
              user.isPermanentlyBanned
                ? 'bg-red-950/40 border-red-800/50 text-red-200'
                : 'bg-amber-950/40 border-amber-800/50 text-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                {user.isPermanentlyBanned ? <Ban className="w-5 h-5 mt-0.5" /> : <Pause className="w-5 h-5 mt-0.5" />}
                <div className="flex-1 text-sm">
                  <p className="font-semibold mb-1">
                    {user.isPermanentlyBanned ? 'Kalıcı Ban' : 'Geçici Askıya Almış'}
                  </p>
                  <p className="text-xs opacity-80">{user.suspensionReason || user.bannedReason}</p>
                  {user.suspendedUntil && (
                    <p className="text-xs mt-1 opacity-70">
                      Bitiş: {new Date(user.suspendedUntil).toLocaleString('tr-TR')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox icon={MessageSquare} label="Toplam Mesaj" value={stats.totalMessages} color="from-blue-500 to-cyan-500" />
        <StatBox icon={Briefcase} label="Toplam İş İlanı" value={stats.totalJobs} color="from-emerald-500 to-teal-500" />
        <StatBox icon={Briefcase} label="Başvurular" value={stats.totalApplications} color="from-indigo-500 to-purple-500" />
        <StatBox icon={Star} label="Değerlendirme" value={`${user.ratingAvg.toFixed(1)} (${user.ratingCount})`} color="from-amber-500 to-orange-500" />
      </div>

      {/* Son İhlaller & Yaptırım Geçmişi */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-400" /> Son İhlaller & İhlal Kaynağı
            </h3>
            <span className="text-xs text-slate-500">{recentFlags.length} kayıt</span>
          </div>
          <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
            {recentFlags.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">İhlal kaydı yok.</div>
            ) : (
              recentFlags.map((flag: any) => {
                const sevStyle =
                  flag.severity === 'CRITICAL'
                    ? 'bg-red-950/60 border-red-800/60 text-red-300'
                    : flag.severity === 'HIGH'
                    ? 'bg-orange-950/60 border-orange-800/60 text-orange-300'
                    : flag.severity === 'MEDIUM'
                    ? 'bg-amber-950/60 border-amber-800/60 text-amber-300'
                    : 'bg-blue-950/60 border-blue-800/60 text-blue-300';

                return (
                  <div key={flag.id} className="p-4 hover:bg-slate-800/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${sevStyle}`}>
                          {flag.severity}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {flag.violationType === 'URL'
                            ? 'Web Sitesi / Link'
                            : flag.violationType === 'PHONE'
                            ? 'Telefon Numarası'
                            : flag.violationType === 'EMAIL'
                            ? 'E-posta'
                            : flag.violationType === 'PROFANITY'
                            ? 'Küfür / Hakaret'
                            : flag.violationType}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(flag.createdAt).toLocaleString('tr-TR')}
                      </span>
                    </div>

                    {/* İhlal Kaynağı / Tetikleyen İfade */}
                    {flag.matchedText && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-amber-400 font-medium">Tetikleyen İfade:</span>
                        <code className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-200 font-mono text-[11px]">
                          {flag.matchedText}
                        </code>
                      </div>
                    )}

                    {/* Mesaj İçeriği */}
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80">
                      <p className="text-[11px] text-slate-400 mb-0.5">
                        {flag.message?.originalContent ? 'Orijinal Mesaj:' : 'Mesaj Metni:'}
                      </p>
                      <p className="text-xs text-slate-200">
                        {flag.message?.originalContent || flag.message?.content || 'Mesaj detayı bulunamadı.'}
                      </p>
                    </div>

                    {/* Konuşmaya Git */}
                    {flag.conversationId && (
                      <div className="flex items-center justify-between text-xs pt-1">
                        <button
                          onClick={() => router.push(`/admin/conversations?id=${flag.conversationId}`)}
                          className="text-indigo-400 hover:text-indigo-300 text-[11px] font-medium flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> İlgili Konuşmayı İncele
                        </button>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {flag.id.slice(-6)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Askıya alma geçmişi */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" /> Yaptırım Geçmişi
            </h3>
            <span className="text-xs text-slate-500">{suspensions.length} kayıt</span>
          </div>
          <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
            {suspensions.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">Yaptırım kaydı yok.</div>
            ) : (
              suspensions.map((s: any) => (
                <div key={s.id} className="p-3 hover:bg-slate-800/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium ${
                      s.type === 'PERMANENT' ? 'text-red-300' : s.type === 'WARNING' ? 'text-amber-300' : 'text-orange-300'
                    }`}>
                      {s.type === 'PERMANENT' ? 'Kalıcı Ban' : s.type === 'WARNING' ? 'Uyarı' : 'Geçici Askı'}
                    </span>
                    <span className="text-[10px] text-slate-500">{new Date(s.createdAt).toLocaleString('tr-TR')}</span>
                  </div>
                  <p className="text-xs text-slate-400">{s.reason}</p>
                  {s.endsAt && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Bitiş: {new Date(s.endsAt).toLocaleString('tr-TR')}
                      {s.liftedAt && ' (kaldırıldı)'}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Son İşlemler & Aktivite Geçmişi */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Son İşlemler & Aktivite Geçmişi
          </h3>
          <span className="text-xs text-slate-500">{(data.recentOperations || auditLogs).length} kayıt</span>
        </div>
        <div className="divide-y divide-slate-800 max-h-96 overflow-y-auto">
          {(data.recentOperations || auditLogs).length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">İşlem kaydı yok.</div>
          ) : (
            (data.recentOperations || auditLogs).map((op: any) => {
              const badgeColor =
                op.type === 'APPLICATION'
                  ? 'bg-blue-950/60 border-blue-800/60 text-blue-300'
                  : op.type === 'JOB_POST'
                  ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                  : op.type === 'WALLET'
                  ? 'bg-purple-950/60 border-purple-800/60 text-purple-300'
                  : op.type === 'SUSPENSION'
                  ? 'bg-amber-950/60 border-amber-800/60 text-amber-300'
                  : op.type === 'ADMIN_ACTION'
                  ? 'bg-orange-950/60 border-orange-800/60 text-orange-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300';

              return (
                <div key={op.id} className="p-3.5 hover:bg-slate-800/30 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}>
                        {op.type === 'APPLICATION'
                          ? 'Başvuru'
                          : op.type === 'JOB_POST'
                          ? 'İş İlanı'
                          : op.type === 'WALLET'
                          ? 'Cüzdan'
                          : op.type === 'SUSPENSION'
                          ? 'Yaptırım'
                          : op.type === 'ADMIN_ACTION'
                          ? 'Admin'
                          : op.type === 'REGISTRATION'
                          ? 'Kayıt'
                          : op.title}
                      </span>
                      <p className="text-xs font-semibold text-white truncate">{op.title}</p>
                    </div>
                    {op.description && (
                      <p className="text-xs text-slate-400">{op.description}</p>
                    )}
                    <p className="text-[10px] text-slate-500">
                      Yapan: {op.actor || 'Sistem'}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">
                    {new Date(op.createdAt).toLocaleString('tr-TR')}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  )
}

function InfoChip({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: any
  label: string
  value: any
  highlight?: boolean
}) {
  return (
    <div className={`p-3 rounded-xl border flex items-center gap-3 ${
      highlight ? 'bg-amber-950/30 border-amber-800/40' : 'bg-slate-950/40 border-slate-800'
    }`}>
      <Icon className={`w-4 h-4 ${highlight ? 'text-amber-400' : 'text-slate-500'}`} />
      <div className="min-w-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium truncate ${highlight ? 'text-amber-200' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  )
}

function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  if (status === 'BANNED')
    return (
      <span className="px-2 py-0.5 rounded-md bg-red-950/50 border border-red-800/50 text-red-300 text-xs font-medium">
        Banlı
      </span>
    )
  if (status === 'SUSPENDED')
    return (
      <span className="px-2 py-0.5 rounded-md bg-amber-950/50 border border-amber-800/50 text-amber-300 text-xs font-medium">
        Askıda
      </span>
    )
  return (
    <span className="px-2 py-0.5 rounded-md bg-emerald-950/50 border border-emerald-800/50 text-emerald-300 text-xs font-medium">
      Aktif
    </span>
  )
}
