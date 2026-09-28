'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
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
} from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Genel Bakış', icon: LayoutDashboard },
  { href: '/admin/jobs', label: 'İlan Onayları', icon: Briefcase, badgeKey: 'pendingJobs' },
  { href: '/admin/payments', label: 'Ödeme Onayları', icon: CreditCard, badgeKey: 'pendingPayments' },
  { href: '/admin/verifications', label: 'Doğrulamalar', icon: BadgeCheck, badgeKey: 'pendingVerifications' },
  { href: '/admin/broadcast', label: 'Broadcast', icon: Megaphone },
  { href: '/admin/support', label: 'Destek Talepleri', icon: LifeBuoy },
  { href: '/admin/account-deletions', label: 'Hesap Silme', icon: Trash2 },
  { href: '/admin/users', label: 'Kullanıcılar', icon: Users },
  { href: '/admin/flags', label: 'İhlal Kuyruğu', icon: Flag, badgeKey: 'pendingFlags' },
  { href: '/admin/audit', label: 'İşlem Günlüğü', icon: ScrollText },
  { href: '/admin/rules', label: 'Moderasyon Kuralları', icon: Shield },
  { href: '/admin/conversations', label: 'Sohbetler', icon: Settings2 },
  { href: '/admin/settings', label: 'Site Ayarları', icon: Settings },
]

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAdminAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-900/70 backdrop-blur-xl border-r border-slate-800 flex flex-col z-40 transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Yönetim Paneli</p>
              <p className="text-[10px] text-slate-500 leading-tight">Günübirlik İş Bul</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            // Badge değerini ilgili stats grubundan al
            let badge: number | null = null
            if (item.badgeKey === 'pendingFlags' && stats?.moderation?.pendingFlags > 0) {
              badge = stats.moderation.pendingFlags
            } else if (item.badgeKey === 'pendingJobs' && stats?.jobs?.pendingApproval > 0) {
              badge = stats.jobs.pendingApproval
            } else if (item.badgeKey === 'pendingPayments' && stats?.payments?.pending > 0) {
              badge = stats.payments.pending
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
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 text-white border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon
                  className={`w-4.5 h-4.5 ${active ? 'text-indigo-400' : ''}`}
                  strokeWidth={2}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {badge ? (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-500 text-white">
                    {badge}
                  </span>
                ) : null}
                {active && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
              </button>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-800 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950/40">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.fullName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Çıkış"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 flex items-center px-4 lg:px-8 gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 flex items-center gap-3">
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Kullanıcı ara... (kullanıcılar sekmesinde çalışır)"
                onFocus={() => router.push('/admin/users')}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api-doc"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60 rounded-lg transition-colors"
              title="Herkese açık API dokümantasyonu"
            >
              <FileText className="w-3.5 h-3.5" />
              API Dok
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-indigo-300 hover:bg-slate-800/60 rounded-lg transition-colors"
              title="Ana siteyi yeni sekmede aç"
            >
              <Globe className="w-3.5 h-3.5" />
              Site
            </a>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono">
                {now.toLocaleTimeString('tr-TR')}
              </span>
            </div>
            <button
              onClick={() => router.push('/admin/flags')}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
              title="Bekleyen ihlaller"
            >
              <Bell className="w-5 h-5" />
              {stats?.moderation?.pendingFlags > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {stats.moderation.pendingFlags > 99 ? '99+' : stats.moderation.pendingFlags}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
