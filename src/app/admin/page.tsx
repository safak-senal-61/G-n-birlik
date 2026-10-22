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
  Sparkles,
  Globe,
  FileText,
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
      <div className="p-5 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded-md text-[#C84B31] text-sm font-medium">
        Hata: {error}
      </div>
    )
  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Architectural Header */}
      <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-[#0D6847] dark:text-[#27AB78] bg-[#0D6847]/10 px-2 py-0.5 rounded mb-1.5">
            01 / MERKEZİ OPERASYON DEFTERİ
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#111312] dark:text-[#F3F4F3] tracking-tight">
            Yönetim & Moderasyon Genel Bakış
          </h1>
          <p className="text-[#5A605D] dark:text-[#8E9893] mt-0.5 text-xs sm:text-sm">
            Canlı platform metrikleri, finansal onay kuyruğu, SEO indeksleme ve güvenlik denetimi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => router.push('/admin/seo')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#0D6847] hover:bg-[#094D34] !text-white text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            SEO & Blog Yönetimi
          </button>
          <button
            onClick={() => router.push('/admin/payments')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-[#111312] dark:text-[#F3F4F3] hover:border-[#0D6847] text-xs font-semibold transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#0D6847]" />
            Cüzdan & Ödemeler
          </button>
        </div>
      </div>

      {/* Stat Cards (01 - 04) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          code="01"
          label="Toplam Kullanıcı"
          value={stats.users.total}
          subtext={`Bugün +${stats.users.newToday} yeni kayıt`}
          trend={stats.users.growthRate}
          icon={UsersIcon}
        />
        <StatCard
          code="02"
          label="Bekleyen İhlal"
          value={stats.moderation.pendingFlags}
          subtext={`${stats.moderation.criticalPending} kritik · ${stats.moderation.highPending} yüksek`}
          icon={Flag}
          alert={stats.moderation.pendingFlags > 0}
        />
        <StatCard
          code="03"
          label="Askıya Alınmış"
          value={stats.users.suspended}
          subtext={`${stats.users.banned} kalıcı engelli`}
          icon={Ban}
        />
        <StatCard
          code="04"
          label="Bugünkü Mesaj"
          value={stats.activity.messagesToday}
          subtext={`${stats.activity.filteredToday} filtrelendi (%${stats.activity.filterRate.toFixed(1)})`}
          icon={MessageSquare}
        />
      </div>

      {/* Action Queue Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#5A605D] dark:text-[#8E9893]">
            02 / BEKLEYEN ONAY & OPERASYON KUYRUĞU
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <ActionCard
            code="A1"
            title="İlan Onayı Bekleyen"
            value={stats.jobs?.pendingApproval || 0}
            subtext={`${stats.jobs?.active || 0} aktif ilan yayında`}
            icon={Briefcase}
            href="/admin/jobs"
            alert={(stats.jobs?.pendingApproval || 0) > 0}
          />
          <ActionCard
            code="A2"
            title="Bakiye Yükleme Talebi"
            value={stats.payments?.pendingDeposits || 0}
            subtext={`${(stats.payments?.pendingDepositsTotalAmount || 0).toLocaleString('tr-TR')} ₺ EFT/Havale onayı`}
            icon={ArrowDownCircle}
            href="/admin/payments?tab=deposits"
            alert={(stats.payments?.pendingDeposits || 0) > 0}
          />
          <ActionCard
            code="A3"
            title="İş Ödemesi & Çekim"
            value={stats.payments?.pending || 0}
            subtext={`${(stats.payments?.pendingTotalAmount || 0).toLocaleString('tr-TR')} ₺ · ${stats.payments?.disputed || 0} itiraz`}
            icon={CreditCard}
            href="/admin/payments?tab=payments"
            alert={(stats.payments?.pending || 0) > 0}
          />
          <ActionCard
            code="A4"
            title="Doğrulama Bekleyen"
            value={stats.verification?.pending || 0}
            subtext={`${stats.verification?.verifiedEmployers || 0} onaylı işveren`}
            icon={BadgeCheck}
            href="/admin/verifications"
            alert={(stats.verification?.pending || 0) > 0}
          />
        </div>
      </div>

      {/* SEO & Blog Management Banner */}
      <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-md bg-[#0D6847]/10 border border-[#0D6847]/30 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 text-[#0D6847] dark:text-[#27AB78]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0D6847] dark:text-[#27AB78]">
                03 / SEO & İÇERİK MOTORU
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#0D6847] !text-white rounded">
                AKTİF
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#111312] dark:text-[#F3F4F3] mt-0.5">
              SEO Blog Yazı Ekleme, Meta Yapılandırma & 81 İl Programatik İndeksleme
            </h3>
            <p className="text-xs text-[#5A605D] dark:text-[#8E9893] mt-0.5">
              Yeni blog makaleleri yayınlayın, hedef anahtar kelimeleri yönetin, Google SERP önizlemesini ve Schema.org JSON-LD ayarlarını düzenleyin.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => router.push('/admin/seo')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-md bg-[#0D6847] hover:bg-[#094D34] !text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Blog Yazısı Ekle / SEO Ayarları
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Trend + Violation Breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E2E0D8] dark:border-[#252B28]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0D6847] dark:text-[#27AB78]">
                04 / ZAMAN SERİSİ
              </span>
              <h3 className="font-bold text-sm sm:text-base text-[#111312] dark:text-[#F3F4F3]">
                Son 7 Gün Platform Aktivitesi
              </h3>
            </div>
            <Activity className="w-4 h-4 text-[#0D6847]" />
          </div>
          <TrendChart data={stats.trends.daily} />
        </div>

        <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E2E0D8] dark:border-[#252B28]">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C84B31]">
                05 / GÜVENLİK DAĞILIMI
              </span>
              <h3 className="font-bold text-sm sm:text-base text-[#111312] dark:text-[#F3F4F3]">
                İhlal Tipleri (30 Gün)
              </h3>
            </div>
            <AlertTriangle className="w-4 h-4 text-[#C84B31]" />
          </div>
          <ViolationTypes data={stats.trends.violationTypes} />
        </div>
      </div>

      {/* Bottom Mini Ledger Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MiniStat label="Aktif Kullanıcı (7g)" value={stats.users.activeWeek} icon={TrendingUp} />
        <MiniStat label="Toplam Sohbet" value={stats.activity.totalConversations} icon={MessageSquare} />
        <MiniStat
          label="Aktif Kural"
          value={`${stats.moderation.activeRules}/${stats.moderation.totalRules}`}
          icon={Shield}
        />
        <MiniStat label="Bugünkü Denetim" value={stats.activity.auditActionsToday} icon={Activity} />
      </div>
    </div>
  )
}

function StatCard({
  code,
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  alert,
}: {
  code: string
  label: string
  value: number
  subtext?: string
  trend?: number
  icon: any
  alert?: boolean
}) {
  return (
    <div
      className={`bg-white dark:bg-[#141716] border rounded-md p-3.5 sm:p-5 transition-colors ${
        alert
          ? 'border-[#C84B31]/60 bg-[#C84B31]/[0.02]'
          : 'border-[#E2E0D8] dark:border-[#252B28]'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-[#5A605D] dark:text-[#8E9893]">
            {code} /
          </span>
          <div
            className={`w-8 h-8 rounded-md flex items-center justify-center ${
              alert
                ? 'bg-[#C84B31]/15 text-[#C84B31]'
                : 'bg-[#0D6847]/10 text-[#0D6847] dark:text-[#27AB78]'
            }`}
          >
            <Icon className="w-4 h-4" strokeWidth={2.2} />
          </div>
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-1 text-[11px] font-mono font-bold ${
              trend >= 0 ? 'text-[#0D6847] dark:text-[#27AB78]' : 'text-[#C84B31]'
            }`}
          >
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
        {alert && (
          <span className="px-1.5 py-0.5 rounded bg-[#C84B31] !text-white text-[9px] font-mono font-bold">
            KRİTİK
          </span>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-mono font-bold text-[#111312] dark:text-[#F3F4F3] tracking-tight">
        {value.toLocaleString('tr-TR')}
      </p>
      <p className="text-xs font-bold text-[#111312] dark:text-[#F3F4F3] mt-1">{label}</p>
      {subtext && (
        <p className="text-[11px] text-[#5A605D] dark:text-[#8E9893] mt-1 truncate">{subtext}</p>
      )}
    </div>
  )
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md p-3.5 flex items-center gap-3">
      <div className="w-9 h-9 rounded-md bg-[#EFECE6] dark:bg-[#1A1E1C] border border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[#0D6847] dark:text-[#27AB78]" />
      </div>
      <div className="min-w-0">
        <p className="text-base sm:text-lg font-mono font-bold text-[#111312] dark:text-[#F3F4F3] leading-tight">
          {value}
        </p>
        <p className="text-[11px] text-[#5A605D] dark:text-[#8E9893] truncate">{label}</p>
      </div>
    </div>
  )
}

function ActionCard({
  code,
  title,
  value,
  subtext,
  icon: Icon,
  href,
  alert,
}: {
  code: string
  title: string
  value: number
  subtext?: string
  icon: any
  href: string
  alert?: boolean
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.push(href)}
      className={`w-full text-left bg-white dark:bg-[#141716] border rounded-md p-4 transition-all hover:border-[#0D6847] group ${
        alert ? 'border-[#C84B31]/60' : 'border-[#E2E0D8] dark:border-[#252B28]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] font-mono font-bold text-[#5A605D] dark:text-[#8E9893]">
              {code}
            </span>
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center ${
                alert
                  ? 'bg-[#C84B31] !text-white'
                  : 'bg-[#0D6847] !text-white'
              }`}
            >
              <Icon className="w-4 h-4 !text-white" strokeWidth={2.2} />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-[#111312] dark:text-[#F3F4F3] tracking-tight">
            {value.toLocaleString('tr-TR')}
          </p>
          <p className="text-xs font-bold text-[#111312] dark:text-[#F3F4F3] mt-1">{title}</p>
          {subtext && (
            <p className="text-[11px] text-[#5A605D] dark:text-[#8E9893] mt-1 truncate">{subtext}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {alert && (
            <span className="px-1.5 py-0.5 rounded bg-[#C84B31]/15 text-[#C84B31] text-[10px] font-mono font-bold">
              BEKLİYOR
            </span>
          )}
          <ArrowUpRight className="w-4 h-4 text-[#5A605D] group-hover:text-[#0D6847] transition-colors" />
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
        const day = new Date(d.date).toLocaleDateString('tr-TR', {
          weekday: 'short',
          day: 'numeric',
        })
        return (
          <div key={d.date} className="grid grid-cols-[75px_1fr] items-center gap-3">
            <span className="text-xs font-mono text-[#5A605D] dark:text-[#8E9893]">{day}</span>
            <div className="space-y-1.5">
              <div className="flex gap-1 h-2 bg-[#EFECE6] dark:bg-[#1A1E1C] rounded-xs overflow-hidden">
                <div
                  className="bg-[#0D6847] rounded-xs"
                  style={{ width: `${(d.messages / max) * 100}%` }}
                  title={`Mesaj: ${d.messages}`}
                />
              </div>
              <div className="flex gap-1 h-1.5">
                <div
                  className="bg-[#C84B31] rounded-xs"
                  style={{ width: `${(d.flags / max) * 100}%` }}
                  title={`İhlal: ${d.flags}`}
                />
                <div
                  className="bg-[#111312] dark:bg-[#8E9893] rounded-xs"
                  style={{ width: `${(d.users / max) * 100}%` }}
                  title={`Yeni kullanıcı: ${d.users}`}
                />
              </div>
            </div>
          </div>
        )
      })}
      <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-[#E2E0D8] dark:border-[#252B28] text-[11px] font-mono text-[#5A605D] dark:text-[#8E9893]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#0D6847]" /> Mesaj Trafiği
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#C84B31]" /> İhlal Kaydı
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#111312] dark:bg-[#8E9893]" /> Yeni Üye
        </span>
      </div>
    </div>
  )
}

function ViolationTypes({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-xs font-mono text-[#5A605D] dark:text-[#8E9893]">
        SON 30 GÜNDE İHLAL KAYDEDİLMEDİ.
      </div>
    )
  }
  const total = data.reduce((s, d) => s + d.count, 0)
  const labels: Record<string, string> = {
    PROFANITY: 'Küfür / Hakaret',
    PHONE: 'Telefon Numarası',
    EMAIL: 'E-posta Adresi',
    URL: 'Harici Link / URL',
    SOCIAL_HANDLE: 'Sosyal Medya',
    IBAN: 'IBAN Paylaşımı',
    ADDRESS: 'Açık Adres',
    SPAM: 'Spam İçerik',
    THREAT: 'Tehdit / Şantaj',
    OTHER: 'Diğer',
  }
  const sorted = [...data].sort((a, b) => b.count - a.count)

  return (
    <div className="space-y-3">
      {sorted.map((d) => {
        const pct = (d.count / total) * 100
        return (
          <div key={d.type}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-[#111312] dark:text-[#F3F4F3]">
                {labels[d.type] || d.type}
              </span>
              <span className="text-[#5A605D] dark:text-[#8E9893] font-mono font-bold">
                {d.count}
              </span>
            </div>
            <div className="h-2 bg-[#EFECE6] dark:bg-[#1A1E1C] rounded-xs overflow-hidden">
              <div
                className="h-full bg-[#C84B31] rounded-xs"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
      <div className="pt-2.5 border-t border-[#E2E0D8] dark:border-[#252B28] flex justify-between text-xs font-mono">
        <span className="text-[#5A605D] dark:text-[#8E9893]">TOPLAM İHLAL</span>
        <span className="text-[#111312] dark:text-[#F3F4F3] font-bold">{total}</span>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-24 bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md animate-pulse"
          />
        ))}
      </div>
    </div>
  )
}
