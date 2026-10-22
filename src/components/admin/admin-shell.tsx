'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import Logo from '@/components/shared/logo'
import {
  LayoutDashboard,
  Users,
  Flag,
  ScrollText,
  Shield,
  Settings2,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronRight,
  Briefcase,
  CreditCard,
  BadgeCheck,
  FileText,
  Globe,
  Settings,
  Megaphone,
  LifeBuoy,
  Trash2,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react'

const NAV = [
  { code: '01', href: '/admin', label: 'Genel Bakış', icon: LayoutDashboard },
  { code: '02', href: '/admin/jobs', label: 'İlan Onayları', icon: Briefcase, badgeKey: 'pendingJobs' },
  { code: '03', href: '/admin/payments', label: 'Ödeme Onayları', icon: CreditCard, badgeKey: 'pendingPayments' },
  { code: '04', href: '/admin/seo', label: 'SEO & Blog Yönetimi', icon: Sparkles },
  { code: '05', href: '/admin/verifications', label: 'Doğrulamalar', icon: BadgeCheck, badgeKey: 'pendingVerifications' },
  { code: '06', href: '/admin/broadcast', label: 'Broadcast Duyuru', icon: Megaphone },
  { code: '07', href: '/admin/support', label: 'Destek Talepleri', icon: LifeBuoy },
  { code: '08', href: '/admin/account-deletions', label: 'Hesap Silme', icon: Trash2 },
  { code: '09', href: '/admin/users', label: 'Kullanıcılar', icon: Users },
  { code: '10', href: '/admin/flags', label: 'İhlal Kuyruğu', icon: Flag, badgeKey: 'pendingFlags' },
  { code: '11', href: '/admin/audit', label: 'İşlem Günlüğü', icon: ScrollText },
  { code: '12', href: '/admin/rules', label: 'Moderasyon Kuralları', icon: Shield },
  { code: '13', href: '/admin/conversations', label: 'Sohbetler', icon: Settings2 },
  { code: '14', href: '/admin/settings', label: 'Site Ayarları', icon: Settings },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { user, logout } = useAdminAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [now, setNow] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const load = async () => {
      try {
        const res = await adminFetch('/api/v1/admin/stats')
        setStats(res.data)
      } catch {}
    }
    load()
    const i = setInterval(load, 30000)
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(i)
      clearInterval(t)
    }
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/admin')
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const currentNav = NAV.find((item) => isActive(item.href)) || NAV[0]
  const isDark = mounted ? resolvedTheme === 'dark' : true

  return (
    <div className="admin-ledger-root min-h-screen bg-[#F6F5F2] dark:bg-[#0C0E0D] text-[#111312] dark:text-[#F3F4F3] flex">
      {/* Architectural Ledger global overrides for all admin sub-pages */}
      <style jsx global>{`
        .dark .admin-ledger-root {
          color-scheme: dark;
        }
        .admin-ledger-root select,
        .admin-ledger-root input[type="date"],
        .admin-ledger-root input[type="datetime-local"] {
          color-scheme: light;
        }
        .dark .admin-ledger-root select,
        .dark .admin-ledger-root option,
        .dark .admin-ledger-root input[type="date"],
        .dark .admin-ledger-root input[type="datetime-local"] {
          color-scheme: dark;
          background-color: #0C0E0D;
          color: #F3F4F3;
        }
        .admin-ledger-root .bg-slate-950,
        .admin-ledger-root .bg-slate-950\/60,
        .admin-ledger-root .bg-slate-950\/40,
        .admin-ledger-root .bg-slate-950\/80 {
          background-color: #F6F5F2 !important;
        }
        .dark .admin-ledger-root .bg-slate-950,
        .dark .admin-ledger-root .bg-slate-950\/60,
        .dark .admin-ledger-root .bg-slate-950\/40,
        .dark .admin-ledger-root .bg-slate-950\/80 {
          background-color: #0C0E0D !important;
        }
        .admin-ledger-root .bg-slate-900,
        .admin-ledger-root .bg-slate-900\/60,
        .admin-ledger-root .bg-slate-900\/70,
        .admin-ledger-root .bg-slate-900\/40,
        .admin-ledger-root .bg-slate-900\/80,
        .admin-ledger-root .bg-slate-900\/90 {
          background-color: #FFFFFF !important;
        }
        .dark .admin-ledger-root .bg-slate-900,
        .dark .admin-ledger-root .bg-slate-900\/60,
        .dark .admin-ledger-root .bg-slate-900\/70,
        .dark .admin-ledger-root .bg-slate-900\/40,
        .dark .admin-ledger-root .bg-slate-900\/80,
        .dark .admin-ledger-root .bg-slate-900\/90 {
          background-color: #141716 !important;
        }
        .admin-ledger-root .bg-slate-800,
        .admin-ledger-root .bg-slate-800\/50,
        .admin-ledger-root .bg-slate-800\/60,
        .admin-ledger-root .bg-slate-800\/40,
        .admin-ledger-root .bg-slate-800\/80 {
          background-color: #EFECE6 !important;
        }
        .dark .admin-ledger-root .bg-slate-800,
        .dark .admin-ledger-root .bg-slate-800\/50,
        .dark .admin-ledger-root .bg-slate-800\/60,
        .dark .admin-ledger-root .bg-slate-800\/40,
        .dark .admin-ledger-root .bg-slate-800\/80 {
          background-color: #1A1E1C !important;
        }
        .admin-ledger-root .border-slate-800,
        .admin-ledger-root .border-slate-800\/60,
        .admin-ledger-root .border-slate-700,
        .admin-ledger-root .divide-slate-800 > :not([hidden]) ~ :not([hidden]) {
          border-color: #E2E0D8 !important;
        }
        .dark .admin-ledger-root .border-slate-800,
        .dark .admin-ledger-root .border-slate-800\/60,
        .dark .admin-ledger-root .border-slate-700,
        .dark .admin-ledger-root .divide-slate-800 > :not([hidden]) ~ :not([hidden]) {
          border-color: #252B28 !important;
        }
        .admin-ledger-root .text-slate-100,
        .admin-ledger-root .text-slate-200 {
          color: #111312 !important;
        }
        .dark .admin-ledger-root .text-slate-100,
        .dark .admin-ledger-root .text-slate-200 {
          color: #F3F4F3 !important;
        }
        .admin-ledger-root .text-white:not(button):not(a):not(span) {
          color: #111312 !important;
        }
        .dark .admin-ledger-root .text-white:not(button):not(a):not(span) {
          color: #F3F4F3 !important;
        }
        .admin-ledger-root .text-slate-300,
        .admin-ledger-root .text-slate-400,
        .admin-ledger-root .text-slate-500 {
          color: #5A605D !important;
        }
        .dark .admin-ledger-root .text-slate-300,
        .dark .admin-ledger-root .text-slate-400,
        .dark .admin-ledger-root .text-slate-500 {
          color: #8E9893 !important;
        }
        .admin-ledger-root .bg-indigo-600,
        .admin-ledger-root .bg-indigo-500,
        .admin-ledger-root .from-indigo-500,
        .admin-ledger-root .from-indigo-600 {
          background-color: #0D6847 !important;
          background-image: none !important;
          color: #FFFFFF !important;
        }
        .admin-ledger-root .bg-indigo-600 *,
        .admin-ledger-root .bg-indigo-500 *,
        .admin-ledger-root .bg-emerald-600 *,
        .admin-ledger-root .bg-red-600 *,
        .admin-ledger-root .bg-[#0D6847] *,
        .admin-ledger-root .bg-[#C84B31] * {
          color: #FFFFFF !important;
        }
        .admin-ledger-root .bg-indigo-600,
        .admin-ledger-root .bg-indigo-500,
        .admin-ledger-root .bg-emerald-600,
        .admin-ledger-root .bg-red-600,
        .admin-ledger-root .bg-amber-600,
        .admin-ledger-root .bg-[#0D6847],
        .admin-ledger-root .bg-[#C84B31] {
          color: #FFFFFF !important;
        }
        .admin-ledger-root .text-indigo-400,
        .admin-ledger-root .text-indigo-300,
        .admin-ledger-root .text-purple-400,
        .admin-ledger-root .text-blue-400,
        .admin-ledger-root .text-blue-300 {
          color: #0D6847 !important;
        }
        .dark .admin-ledger-root .text-indigo-400,
        .dark .admin-ledger-root .text-indigo-300,
        .dark .admin-ledger-root .text-purple-400,
        .dark .admin-ledger-root .text-blue-400,
        .dark .admin-ledger-root .text-blue-300 {
          color: #27AB78 !important;
        }
        .admin-ledger-root .border-indigo-500,
        .admin-ledger-root .border-indigo-500\/30,
        .admin-ledger-root .border-indigo-500\/40,
        .admin-ledger-root .border-indigo-800\/50,
        .admin-ledger-root .border-blue-800\/50 {
          border-color: rgba(13, 104, 71, 0.4) !important;
        }
        .admin-ledger-root .bg-indigo-500\/10,
        .admin-ledger-root .bg-indigo-500\/15,
        .admin-ledger-root .bg-indigo-500\/20,
        .admin-ledger-root .bg-indigo-950\/50,
        .admin-ledger-root .bg-blue-950\/50,
        .admin-ledger-root .bg-purple-500\/10,
        .admin-ledger-root .bg-purple-500\/15 {
          background-color: rgba(13, 104, 71, 0.14) !important;
        }
        .admin-ledger-root .bg-emerald-950\/50,
        .admin-ledger-root .bg-emerald-950\/40,
        .admin-ledger-root .bg-emerald-950\/30 {
          background-color: rgba(13, 104, 71, 0.15) !important;
        }
        .admin-ledger-root .bg-red-950\/50,
        .admin-ledger-root .bg-red-950\/40,
        .admin-ledger-root .bg-amber-950\/50,
        .admin-ledger-root .bg-amber-950\/40,
        .admin-ledger-root .bg-orange-950\/50 {
          background-color: rgba(200, 75, 49, 0.15) !important;
        }
        .admin-ledger-root .rounded-2xl,
        .admin-ledger-root .rounded-xl {
          border-radius: 0.375rem !important;
        }
      `}</style>

      {/* Sidebar - Viewport'a tam sabitlenmiş (fixed inset-y-0 left-0 h-dvh), sayfa kaydırıldığında asla hareket etmez */}
      <aside
        className={`fixed inset-y-0 left-0 h-dvh w-72 bg-white dark:bg-[#141716] border-r border-[#E2E0D8] dark:border-[#252B28] flex flex-col z-40 transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Ledger Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E0D8] dark:border-[#252B28] bg-[#EFECE6]/50 dark:bg-[#1A1E1C]/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" variant="icon" showText={false} />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-extrabold text-xs tracking-tight text-[#111312] dark:text-[#F3F4F3]">
                  YÖNETİM PANELİ
                </p>
                <span className="px-1 py-0.5 text-[9px] font-mono font-bold bg-[#0D6847]/15 text-[#0D6847] dark:text-[#27AB78] rounded">
                  V2
                </span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#5A605D] dark:text-[#8E9893]">
                GÜNÜBİRLİK İŞ BUL
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-md border border-[#E2E0D8] dark:border-[#252B28] text-[#5A605D] hover:text-[#111312] dark:hover:text-[#F3F4F3]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 min-h-0 px-2.5 py-3 space-y-1 overflow-y-auto">
          <div className="px-2 pb-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#5A605D] dark:text-[#8E9893]">
            MİMARİ MODÜLLER (14)
          </div>
          {NAV.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            let badge: number | null = null
            if (item.badgeKey === 'pendingFlags' && stats?.moderation?.pendingFlags > 0) {
              badge = stats.moderation.pendingFlags
            } else if (item.badgeKey === 'pendingJobs' && stats?.jobs?.pendingApproval > 0) {
              badge = stats.jobs.pendingApproval
            } else if (item.badgeKey === 'pendingPayments') {
              const totalPending =
                (stats?.payments?.pending || 0) +
                (stats?.payments?.pendingDeposits || 0) +
                (stats?.payments?.pendingWithdrawals || 0)
              if (totalPending > 0) badge = totalPending
            } else if (item.badgeKey === 'pendingVerifications' && stats?.verification?.pending > 0) {
              badge = stats.verification.pending
            }
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href)
                  setMobileOpen(false)
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-semibold transition-all group border ${
                  active
                    ? 'bg-[#0D6847] !text-white border-[#0D6847]'
                    : 'text-[#5A605D] dark:text-[#8E9893] hover:text-[#111312] dark:hover:text-[#F3F4F3] hover:bg-[#F6F5F2] dark:hover:bg-[#1A1E1C] border-transparent'
                }`}
              >
                <span
                  className={`text-[10px] font-mono font-bold ${
                    active ? '!text-white/80' : 'text-[#5A605D]/70 dark:text-[#8E9893]/70'
                  }`}
                >
                  {item.code}
                </span>
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? '!text-white' : 'text-[#0D6847] dark:text-[#27AB78]'
                  }`}
                  strokeWidth={2}
                />
                <span className={`flex-1 text-left truncate ${active ? '!text-white' : ''}`}>
                  {item.label}
                </span>
                {badge ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-[#C84B31] !text-white">
                    {badge}
                  </span>
                ) : null}
                {active && <ChevronRight className="w-3.5 h-3.5 !text-white shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* User Footer - Her zaman en altta sabit */}
        <div className="mt-auto p-3 border-t border-[#E2E0D8] dark:border-[#252B28] bg-[#EFECE6]/40 dark:bg-[#1A1E1C]/40 shrink-0">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28]">
            <div className="w-8 h-8 rounded-md bg-[#0D6847] flex items-center justify-center !text-white font-mono font-bold text-xs shrink-0">
              {user?.fullName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#111312] dark:text-[#F3F4F3] truncate">
                {user?.fullName || 'Sistem Yöneticisi'}
              </p>
              <p className="text-[10px] font-mono text-[#5A605D] dark:text-[#8E9893] truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Çıkış Yap"
              className="p-1.5 text-[#5A605D] hover:text-[#C84B31] hover:bg-[#C84B31]/10 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col lg:pl-72 pt-16">
        {/* Topbar - Sabit üst bar */}
        <header className="h-16 fixed top-0 right-0 left-0 lg:left-72 z-20 bg-white/95 dark:bg-[#141716]/95 backdrop-blur-md border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between px-3.5 sm:px-6 lg:px-8 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-md border border-[#E2E0D8] dark:border-[#252B28] text-[#111312] dark:text-[#F3F4F3] hover:bg-[#EFECE6] dark:hover:bg-[#1A1E1C]"
              aria-label="Menüyü Aç"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#0D6847] dark:text-[#27AB78]">
                  MODÜL {currentNav.code}
                </span>
                <span className="text-[#E2E0D8] dark:text-[#252B28]">/</span>
                <span className="text-xs sm:text-sm font-extrabold text-[#111312] dark:text-[#F3F4F3] truncate">
                  {currentNav.label}
                </span>
              </div>
              <p className="text-[10px] font-mono text-[#5A605D] dark:text-[#8E9893] hidden sm:block">
                GÜNÜBİRLİK İŞ BUL // MERKEZİ DENETİM VE SEO KAYIT DEFTERİ
              </p>
            </div>
          </div>

          <div className="flex-1 max-w-sm hidden xl:block mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A605D]" />
              <input
                type="text"
                placeholder="Kullanıcı veya işlem ara..."
                onFocus={() => router.push('/admin/users')}
                className="w-full h-9 pl-9 pr-3 bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] rounded-md text-xs text-[#111312] dark:text-[#F3F4F3] placeholder-[#5A605D] focus:outline-none focus:border-[#0D6847]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push('/admin/seo')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono font-bold bg-[#0D6847]/15 text-[#0D6847] dark:text-[#27AB78] border border-[#0D6847]/30 rounded-md hover:bg-[#0D6847]/25 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              SEO & BLOG
            </button>
            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono font-semibold text-[#5A605D] dark:text-[#8E9893] bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847]/40 rounded-md transition-colors"
              title="Blog sayfasını yeni sekmede aç"
            >
              <FileText className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#27AB78]" />
              BLOG
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-mono font-semibold text-[#5A605D] dark:text-[#8E9893] bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847]/40 rounded-md transition-colors"
              title="Ana siteyi yeni sekmede aç"
            >
              <Globe className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#27AB78]" />
              <span className="hidden sm:inline">SİTE</span>
            </a>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#EFECE6] dark:bg-[#1A1E1C] border border-[#E2E0D8] dark:border-[#252B28] text-[11px] font-mono text-[#111312] dark:text-[#F3F4F3]">
              <span className="w-2 h-2 rounded-full bg-[#0D6847] dark:bg-[#27AB78] animate-pulse" />
              <span>{now.toLocaleTimeString('tr-TR')}</span>
            </div>
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-md bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-[#5A605D] dark:text-[#8E9893] hover:text-[#111312] dark:hover:text-[#F3F4F3] hover:border-[#0D6847]/40 transition-colors"
              title={isDark ? 'Aydınlık Temaya Geç' : 'Koyu Temaya Geç'}
            >
              {isDark ? <Sun className="w-4 h-4 text-[#27AB78]" /> : <Moon className="w-4 h-4 text-[#0D6847]" />}
            </button>
            <button
              onClick={() => router.push('/admin/flags')}
              className="relative p-2 rounded-md bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-[#5A605D] dark:text-[#8E9893] hover:text-[#111312] dark:hover:text-[#F3F4F3] transition-colors"
              title="Bekleyen ihlaller"
            >
              <Bell className="w-4 h-4" />
              {stats?.moderation?.pendingFlags > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded bg-[#C84B31] !text-white text-[9px] font-mono font-bold flex items-center justify-center">
                  {stats.moderation.pendingFlags > 99 ? '99+' : stats.moderation.pendingFlags}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-x-hidden max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
