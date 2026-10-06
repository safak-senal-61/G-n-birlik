'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  Users as UsersIcon,
  Flag,
  Ban,
  MessageSquare,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  CreditCard,
  BadgeCheck,
  ArrowDownCircle,
} from 'lucide-react'

export default function AdminDashboard() {
  const { isAuthenticated } = useAdminAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    ;(async () => {
      try {
        const res = await adminFetch('/api/v1/admin/stats')
        setStats(res.data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [isAuthenticated])

  if (loading) return <DashboardSkeleton />
  if (error)
    return (
      <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200">
        Hata: {error}
      </div>
    )
  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          Genel Bakış
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Platform moderasyon özeti ve gerçek zamanlı istatistikler
        </p>
      </div>

      {/* Stat kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Toplam Kullanıcı"
          value={stats.users.total}
          subtext={`Bugün ${stats.users.newToday} yeni`}
          trend={stats.users.growthRate}
          icon={UsersIcon}
          gradient="from-indigo-500 to-blue-500"
        />
        <StatCard
          label="Bekleyen İhlal"
          value={stats.moderation.pendingFlags}
          subtext={`${stats.moderation.criticalPending} kritik · ${stats.moderation.highPending} yüksek`}
          icon={Flag}
          gradient="from-amber-500 to-red-500"
          alert={stats.moderation.pendingFlags > 0}
        />
        <StatCard
          label="Askıya Alınmış"
          value={stats.users.suspended}
          subtext={`${stats.users.banned} kalıcı ban`}
          icon={Ban}
          gradient="from-orange-500 to-red-600"
        />
        <StatCard
          label="Bugünkü Mesaj"
          value={stats.activity.messagesToday}
          subtext={`${stats.activity.filteredToday} filtrelendi (${stats.activity.filterRate.toFixed(1)}%)`}
          icon={MessageSquare}
          gradient="from-emerald-500 to-teal-500"
        />
      </div>

      {/* Yönetim aksiyon kartları (iş onayı, bakiye yükleme, iş ödemesi, doğrulama) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionCard
          title="İlan Onayı Bekleyen"
          value={stats.jobs?.pendingApproval || 0}
          subtext={`${stats.jobs?.active || 0} aktif ilan yayında`}
          icon={Briefcase}
          gradient="from-blue-500 to-cyan-500"
          href="/admin/jobs"
          alert={(stats.jobs?.pendingApproval || 0) > 0}
        />
        <ActionCard
          title="Bakiye Yükleme Talebi"
          value={stats.payments?.pendingDeposits || 0}
          subtext={`${(stats.payments?.pendingDepositsTotalAmount || 0).toLocaleString('tr-TR')}₺ EFT/Havale onayı`}
          icon={ArrowDownCircle}
          gradient="from-emerald-500 to-teal-500"
          href="/admin/payments?tab=deposits"
          alert={(stats.payments?.pendingDeposits || 0) > 0}
        />
        <ActionCard
          title="İş Ödemesi Bekleyen"
          value={stats.payments?.pending || 0}
          subtext={`${(stats.payments?.pendingTotalAmount || 0).toLocaleString('tr-TR')}₺ · ${stats.payments?.disputed || 0} itiraz`}
          icon={CreditCard}
          gradient="from-indigo-500 to-purple-500"
          href="/admin/payments?tab=payments"
          alert={(stats.payments?.pending || 0) > 0}
        />
        <ActionCard
          title="Doğrulama Bekleyen"
          value={stats.verification?.pending || 0}
          subtext={`${stats.verification?.verifiedEmployers || 0} onaylı işveren`}
          icon={BadgeCheck}
          gradient="from-purple-500 to-pink-500"
          href="/admin/verifications"
          alert={(stats.verification?.pending || 0) > 0}
        />
      </div>

      {/* Trend + İhlal Dağılımı */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Trend grafiği */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white">Son 7 Gün Aktivitesi</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mesaj, ihlal ve yeni kullanıcı trendi
              </p>
            </div>
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <TrendChart data={stats.trends.daily} />
        </div>

        {/* İhlal tipleri */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-white">İhlal Tipleri</h3>
              <p className="text-xs text-slate-500 mt-0.5">Son 30 gün</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <ViolationTypes data={stats.trends.violationTypes} />
        </div>
      </div>

      {/* Alt istatistikler */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat label="Aktif Kullanıcı (7g)" value={stats.users.activeWeek} icon={TrendingUp} />
        <MiniStat label="Toplam Sohbet" value={stats.activity.totalConversations} icon={MessageSquare} />
        <MiniStat label="Aktif Kural" value={`${stats.moderation.activeRules}/${stats.moderation.totalRules}`} icon={Shield} />
        <MiniStat label="Bugünkü İşlem" value={stats.activity.auditActionsToday} icon={Activity} />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  gradient,
  alert,
}: {
  label: string
  value: number
  subtext?: string
  trend?: number
  icon: any
  gradient: string
  alert?: boolean
}) {
  return (
    <div
      className={`relative bg-slate-900/60 border rounded-2xl p-5 overflow-hidden transition-all hover:border-slate-700 ${
        alert ? 'border-amber-800/50' : 'border-slate-800'
      }`}
    >
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          {trend !== undefined && (
            <div
              className={`flex items-center gap-1 text-xs font-semibold ${
                trend >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
          {alert && (
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Aktif
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-white tracking-tight">{value.toLocaleString('tr-TR')}</p>
        <p className="text-sm text-slate-400 mt-1">{label}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1.5">{subtext}</p>}
      </div>
    </div>
  )
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-300" />
      </div>
      <div>
        <p className="text-lg font-bold text-white leading-tight">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function ActionCard({
  title,
  value,
  subtext,
  icon: Icon,
  gradient,
  href,
  alert,
}: {
  title: string
  value: number
  subtext?: string
  icon: any
  gradient: string
  href: string
  alert?: boolean
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className={`relative w-full text-left bg-slate-900/60 border rounded-2xl p-5 overflow-hidden transition-all hover:border-slate-700 hover:bg-slate-900/80 group ${
        alert ? 'border-amber-800/50' : 'border-slate-800'
      }`}
    >
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg mb-3`}>
            <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <p className="text-3xl font-bold text-white tracking-tight">{value.toLocaleString('tr-TR')}</p>
          <p className="text-sm text-slate-400 mt-1">{title}</p>
          {subtext && <p className="text-xs text-slate-500 mt-1.5">{subtext}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {alert && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Aktif
            </span>
          )}
          <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
        </div>
      </div>
    </button>
  )
}

function TrendChart({ data }: { data: any[] }) {
  const max = Math.max(...data.map((d) => Math.max(d.messages, d.flags, d.users, 1)))
  return (
    <div className="space-y-3">
      {data.map((d) => {
        const day = new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric' })
        return (
          <div key={d.date} className="grid grid-cols-[80px_1fr] items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">{day}</span>
            <div className="space-y-1">
              <div className="flex gap-1 h-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  style={{ width: `${(d.messages / max) * 100}%` }}
                  title={`Mesaj: ${d.messages}`}
                />
              </div>
              <div className="flex gap-1 h-1.5">
                <div
                  className="bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                  style={{ width: `${(d.flags / max) * 100}%` }}
                  title={`İhlal: ${d.flags}`}
                />
                <div
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"
                  style={{ width: `${(d.users / max) * 100}%` }}
                  title={`Yeni kullanıcı: ${d.users}`}
                />
              </div>
            </div>
          </div>
        )
      })}
      <div className="flex items-center gap-4 pt-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Mesaj
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> İhlal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Yeni Kullanıcı
        </span>
      </div>
    </div>
  )
}

function ViolationTypes({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-slate-500">
        Son 30 günde ihlal kaydedilmedi.
      </div>
    )
  }
  const total = data.reduce((s, d) => s + d.count, 0)
  const labels: Record<string, string> = {
    PROFANITY: 'Küfür/Hakaret',
    PHONE: 'Telefon',
    EMAIL: 'E-posta',
    URL: 'URL/Link',
    SOCIAL_HANDLE: 'Sosyal Medya',
    IBAN: 'IBAN',
    ADDRESS: 'Adres',
    SPAM: 'Spam',
    THREAT: 'Tehdit',
    OTHER: 'Diğer',
  }
  const colors: Record<string, string> = {
    PROFANITY: 'bg-red-500',
    PHONE: 'bg-blue-500',
    EMAIL: 'bg-cyan-500',
    URL: 'bg-indigo-500',
    SOCIAL_HANDLE: 'bg-purple-500',
    IBAN: 'bg-amber-500',
    ADDRESS: 'bg-emerald-500',
    SPAM: 'bg-orange-500',
    THREAT: 'bg-rose-600',
    OTHER: 'bg-slate-500',
  }
  const sorted = [...data].sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-3">
      {sorted.map((d) => {
        const pct = (d.count / total) * 100
        return (
          <div key={d.type}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300">{labels[d.type] || d.type}</span>
              <span className="text-slate-400 font-mono">{d.count}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${colors[d.type] || 'bg-slate-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
      <div className="pt-2 border-t border-slate-800 flex justify-between text-xs">
        <span className="text-slate-500">Toplam</span>
        <span className="text-white font-bold">{total}</span>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-48 bg-slate-800 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        <div className="h-80 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}
