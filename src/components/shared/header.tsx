'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Briefcase,
  Bell,
  MessageSquare,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Plus,
  Heart,
  FileText,
  BookOpen,
  LayoutGrid,
  ChevronDown,
  Wallet,
  LifeBuoy,
  Share2,
  QrCode,
  Copy,
  Check,
} from 'lucide-react'
import { initials } from '@/lib/format'
import { useEffect, useState } from 'react'
import { notificationsApi } from '@/lib/api'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import Logo from '@/components/shared/logo'
import AuthModal from '@/components/shared/auth-modal'
import { WhatsAppIcon, TelegramIcon, TwitterXIcon } from '@/components/shared/social-icons'

export default function Header() {
  const { user, logout } = useAuth()
  const { view, go, openAuthModal } = useApp()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const siteUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://gunubirlik.qrders.com.tr'

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl)
      setCopied(true)
      toast.success('Bağlantı kopyalandı')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Kopyalanamadı')
    }
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'Günübirlik İş Bul',
          text: 'Türkiye geneli günlük ve yevmiyeli iş panosu.',
          url: siteUrl,
        })
      } catch {
        // Kullanıcı iptal etti
      }
    } else {
      handleCopyLink()
    }
  }

  useEffect(() => {
    if (!user) return
    const loadUnread = async () => {
      try {
        if (view === 'notifications') {
          setUnreadCount(0)
          return
        }
        const res = await notificationsApi.list(true)
        setUnreadCount(res.unreadCount)
      } catch {}
    }
    loadUnread()
    const interval = setInterval(loadUnread, 30000)
    return () => clearInterval(interval)
  }, [user, view])

  useEffect(() => {
    if (view === 'notifications') {
      setUnreadCount(0)
    }
    const handleRead = () => setUnreadCount(0)
    window.addEventListener('notifications-read', handleRead)
    return () => window.removeEventListener('notifications-read', handleRead)
  }, [view])

  const publicLinks = [
    { href: '/', label: 'Açık İlanlar', isHome: true },
    { href: '/nasil-calisir', label: 'İşleyiş' },
    { href: '/is-arayanlar', label: 'Çalışanlar' },
    { href: '/isverenler', label: 'İşverenler' },
    { href: '/blog', label: 'Yevmiye Rehberi' },
  ]

  if (!user) {
    return (
      <>
        <AuthModal />
        <header className="sticky top-0 z-50 w-full bg-[#F6F5F2]/95 dark:bg-[#0C0E0D]/95 backdrop-blur-md border-b border-[#E2E0D8] dark:border-[#252B28]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link
              href="/"
              onClick={() => go('home')}
              className="flex items-center flex-shrink-0"
              aria-label="Günübirlik — Ana Sayfa"
            >
              <Logo size="sm" variant="full" />
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Ana Gezinti">
              {publicLinks.map((link) => {
                const active = link.isHome
                  ? pathname === '/' && view === 'home'
                  : pathname?.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      if (link.isHome) go('home')
                    }}
                    className={`px-3 py-1.5 rounded-md text-[13px] transition-colors ${
                      active
                        ? 'text-[#141615] dark:text-white font-semibold bg-[#E9E7E0] dark:bg-[#1D2220]'
                        : 'text-[#5C615E] dark:text-[#949B97] hover:text-[#141615] dark:hover:text-white font-medium'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" />

            <button
              type="button"
              onClick={() => openAuthModal({ title: 'Hesabınıza Giriş Yapın', tab: 'login' })}
              className="px-3.5 py-1.5 rounded-md text-[13px] font-semibold text-[#141615] dark:text-[#F2F1ED] hover:bg-[#EAE8E1] dark:hover:bg-[#1D2220] transition-colors cursor-pointer"
            >
              Giriş Yap
            </button>

            <button
              type="button"
              onClick={() =>
                openAuthModal({
                  title: 'Yeni İş İlanı Yayınla',
                  description:
                    'Acil personel veya günübirlik usta ihtiyacınız için işveren hesabıyla giriş yapın.',
                  tab: 'register',
                })
              }
              className="px-3.5 py-1.5 rounded-md text-[13px] font-semibold bg-[#0D6847] hover:bg-[#095237] text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>İlan Aç</span>
            </button>

            <button
              type="button"
              className="md:hidden p-2 rounded-md text-[#141615] dark:text-[#F2F1ED] hover:bg-[#EAE8E1] dark:hover:bg-[#1D2220]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menü"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E0D8] dark:border-[#252B28] bg-[#F6F5F2] dark:bg-[#0C0E0D] px-4 py-3 space-y-1">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  if (link.isHome) go('home')
                  setMobileMenuOpen(false)
                }}
                className="block px-3 py-2 rounded-md text-sm font-medium text-[#141615] dark:text-[#F2F1ED] hover:bg-[#EAE8E1] dark:hover:bg-[#1D2220]"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-[#E2E0D8] dark:border-[#252B28] grid grid-cols-2 gap-2">
              <button
                type="button"
                className="py-2 rounded-md border border-[#D6D3C9] dark:border-[#2B322E] text-xs font-semibold text-[#141615] dark:text-white"
                onClick={() => {
                  setMobileMenuOpen(false)
                  openAuthModal({ title: 'Hesabınıza Giriş Yapın', tab: 'login' })
                }}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                className="py-2 rounded-md bg-[#0D6847] text-white text-xs font-semibold"
                onClick={() => {
                  setMobileMenuOpen(false)
                  openAuthModal({
                    title: 'İş İlanı Yayınla',
                    tab: 'register',
                    description: 'İşveren hesabı açarak hemen ilan yayınlayın.',
                  })
                }}
              >
                Kayıt Ol / İlan Aç
              </button>
            </div>
          </div>
        )}
        </header>
      </>
    )
  }

  const isWorker = user.role === 'WORKER'
  const isEmployer = user.role === 'EMPLOYER'

  const navItems: Array<{ key: any; label: string; icon: any; roles?: string[] }> = [
    { key: 'home', label: 'Açık İlanlar', icon: LayoutGrid },
    ...(isWorker ? [{ key: 'applications', label: 'Başvurularım', icon: FileText }] : []),
    ...(isWorker ? [{ key: 'saved-jobs', label: 'Kaydedilenler', icon: Heart }] : []),
    ...(isEmployer ? [{ key: 'my-jobs', label: 'İlanlarım', icon: Briefcase }] : []),
    ...(isEmployer ? [{ key: 'post-job', label: 'İlan Aç', icon: Plus }] : []),
    { key: 'messages', label: 'Mesajlar', icon: MessageSquare },
    { key: 'notifications', label: 'Bildirimler', icon: Bell },
    { key: 'profile', label: 'Profil', icon: UserIcon },
    { key: 'api-docs', label: 'API', icon: BookOpen, roles: ['EMPLOYER', 'ADMIN'] },
    { key: 'help', label: 'Destek', icon: LifeBuoy },
  ]

  const visibleNav = navItems.filter((n) => !n.roles || n.roles.includes(user.role))

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F6F5F2]/95 dark:bg-[#0C0E0D]/95 backdrop-blur-md border-b border-[#E2E0D8] dark:border-[#252B28]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-5 min-w-0">
          <button
            type="button"
            onClick={() => go('home')}
            className="flex items-center flex-shrink-0 text-left cursor-pointer"
            title="Günübirlik — Ana Sayfa"
            aria-label="Günübirlik — Ana Sayfa"
          >
            <Logo size="sm" variant="full" />
          </button>

          <nav className="hidden lg:flex items-center gap-1 min-w-0" aria-label="Ana Gezinti Menüsü">
            {visibleNav.slice(0, 7).map((item) => {
              const isActive = view === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => go(item.key)}
                  aria-label={item.label}
                  className={`relative px-3 py-1.5 rounded-md text-[13px] flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#141615] dark:bg-[#F2F1ED] text-white dark:text-[#141615] font-semibold'
                      : 'text-[#5C615E] dark:text-[#949B97] hover:text-[#141615] dark:hover:text-white hover:bg-[#EAE8E1] dark:hover:bg-[#1D2220] font-medium'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.key === 'notifications' && unreadCount > 0 && (
                    <span className="ml-1 bg-[#C84B31] text-white text-[10px] font-mono font-semibold px-1.5 rounded-sm min-w-[16px] h-[16px] flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => go('wallet')}
            className="btn-3d-white rounded-md flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer"
            title="Cüzdanım"
            aria-label="Cüzdanım"
          >
            <Wallet className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
            <span className="hidden sm:inline">Emanet & Cüzdan</span>
          </button>

          <ThemeToggle variant="icon" />

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 rounded-md relative"
            onClick={() => go('notifications')}
            aria-label="Bildirimler"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 bg-[#C84B31] text-white text-[9px] px-1 min-w-[15px] h-[15px] flex items-center justify-center rounded-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 rounded-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hidden lg:flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] hover:border-[#B8C4BE] transition-colors cursor-pointer"
                aria-label="Kullanıcı Menüsü"
              >
                <Avatar className="w-6 h-6 rounded-sm">
                  <AvatarFallback className="rounded-sm bg-[#EAF3EE] dark:bg-[#1D2E27] text-[#0D6847] dark:text-[#5CD6A5] font-mono font-semibold text-[11px]">
                    {initials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-[#141615] dark:text-white max-w-[90px] truncate leading-tight">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-[#5C615E] dark:text-[#949B97] leading-none">
                    {user.role === 'WORKER' ? 'Çalışan' : user.role === 'EMPLOYER' ? 'İşveren' : 'Yönetici'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#5C615E]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-64 rounded-lg shadow-lg border border-[#E2E0D8] dark:border-[#252B28] p-1.5 bg-white dark:bg-[#141716]"
            >
              <DropdownMenuLabel className="p-2.5 rounded-md bg-[#F6F5F2] dark:bg-[#1A1F1D] mb-1 border border-[#E2E0D8] dark:border-[#252B28]">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-8 h-8 rounded-sm">
                    <AvatarFallback className="rounded-sm bg-[#0D6847] text-white font-mono font-semibold text-xs">
                      {initials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-xs text-[#141615] dark:text-white truncate">
                      {user.fullName}
                    </span>
                    <span className="text-[11px] text-[#5C615E] dark:text-[#949B97] truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => go('profile')} className="rounded-md text-xs font-medium cursor-pointer py-2 px-2.5">
                <UserIcon className="w-3.5 h-3.5 mr-2 text-[#5C615E]" />
                <span>Profil Bilgileri</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => go('wallet')} className="rounded-md text-xs font-medium cursor-pointer py-2 px-2.5">
                <Wallet className="w-3.5 h-3.5 mr-2 text-[#5C615E]" />
                <span>Emanet & Cüzdan</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => go('notifications')} className="rounded-md text-xs font-medium cursor-pointer py-2 px-2.5">
                <Bell className="w-3.5 h-3.5 mr-2 text-[#5C615E]" />
                <span>Bildirimler</span>
                {unreadCount > 0 && (
                  <Badge className="ml-auto bg-[#C84B31] text-white text-[10px] py-0 px-1.5 rounded-sm">
                    {unreadCount}
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => go('help')} className="rounded-md text-xs font-medium cursor-pointer py-2 px-2.5">
                <LifeBuoy className="w-3.5 h-3.5 mr-2 text-[#5C615E]" />
                <span>Yardım & Destek</span>
              </DropdownMenuItem>
              {['EMPLOYER', 'ADMIN'].includes(user.role) && (
                <DropdownMenuItem onClick={() => go('api-docs')} className="rounded-md text-xs font-medium cursor-pointer py-2 px-2.5">
                  <BookOpen className="w-3.5 h-3.5 mr-2 text-[#5C615E]" />
                  <span>API Dokümantasyonu</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="my-1" />
              <div className="px-2 py-1.5 space-y-1.5">
                <span className="text-[11px] font-medium text-[#5C615E]">Görünüm</span>
                <ThemeToggle variant="segmented" className="w-full" />
              </div>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={() => logout()}
                className="rounded-md text-xs font-semibold text-[#C84B31] focus:text-[#C84B31] cursor-pointer py-2 px-2.5"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                <span>Oturumu Kapat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E2E0D8] dark:border-[#252B28] bg-[#F6F5F2] dark:bg-[#0C0E0D] px-4 py-3 space-y-1">
          {visibleNav.map((item) => {
            const isActive = view === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  go(item.key)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-semibold ${
                  isActive
                    ? 'bg-[#141615] text-white dark:bg-white dark:text-[#141615]'
                    : 'text-[#141615] dark:text-[#F2F1ED] hover:bg-[#EAE8E1] dark:hover:bg-[#1D2220]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.key === 'notifications' && unreadCount > 0 && (
                  <span className="text-[10px] font-mono bg-[#C84B31] text-white px-1.5 rounded-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => {
              logout()
              setMobileMenuOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-[#C84B31] mt-2 border-t border-[#E2E0D8] dark:border-[#252B28] pt-2.5"
          >
            <LogOut className="w-4 h-4" />
            Oturumu Kapat
          </button>
        </div>
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#0D6847]" />
              Bağlantıyı Paylaş
            </DialogTitle>
            <DialogDescription>
              Günübirlik iş panosunu paylaşın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              <Input
                value={siteUrl}
                readOnly
                className="flex-1 h-10 text-sm font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="icon" variant="outline" className="h-10 w-10" onClick={handleCopyLink}>
                {copied ? <Check className="w-4 h-4 text-[#0D6847]" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button className="w-full bg-[#0D6847] hover:bg-[#095237] text-white" onClick={handleNativeShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Paylaş
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
