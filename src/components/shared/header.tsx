'use client'

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
import { Briefcase, Bell, MessageSquare, User as UserIcon, LogOut, Menu, X, Plus, Heart, FileText, BookOpen, LayoutGrid, ChevronLeft, ChevronDown, Wallet, LifeBuoy, Share2, QrCode, Copy, Check, Sparkles } from 'lucide-react'
import { initials } from '@/lib/format'
import { useEffect, useState } from 'react'
import { notificationsApi } from '@/lib/api'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import Logo from '@/components/shared/logo'
import { WhatsAppIcon, TelegramIcon, TwitterXIcon } from '@/components/shared/social-icons'

export default function Header() {
  const { user, logout } = useAuth()
  const { view, go, back, history } = useApp()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Site URL — production'da gerçek domain, dev'de localhost
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gunubirlik.com'

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl)
      setCopied(true)
      toast.success('Link kopyalandı! 📋')
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
          text: 'Türkiye\'nin günübirlik iş bulma platformu. İlanları gör, hemen iş bul!',
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

  // Bildirimler sayfasına girildiğinde veya okundu eventi tetiklendiğinde sayacı hemen sıfırla
  useEffect(() => {
    if (view === 'notifications') {
      setUnreadCount(0)
    }
    const handleRead = () => setUnreadCount(0)
    window.addEventListener('notifications-read', handleRead)
    return () => window.removeEventListener('notifications-read', handleRead)
  }, [view])

  if (!user) return null

  const isWorker = user.role === 'WORKER'
  const isEmployer = user.role === 'EMPLOYER'

  const navItems: Array<{ key: any; label: string; icon: any; roles?: string[] }> = [
    { key: 'home', label: 'İşleri Keşfet', icon: LayoutGrid },
    ...(isWorker ? [{ key: 'applications', label: 'Başvurularım', icon: FileText }] : []),
    ...(isWorker ? [{ key: 'saved-jobs', label: 'Kaydettiklerim', icon: Heart }] : []),
    ...(isEmployer ? [{ key: 'my-jobs', label: 'İlanlarım', icon: Briefcase }] : []),
    ...(isEmployer ? [{ key: 'post-job', label: 'İlan Ver', icon: Plus }] : []),
    { key: 'messages', label: 'Mesajlar', icon: MessageSquare },
    { key: 'notifications', label: 'Bildirimler', icon: Bell },
    { key: 'profile', label: 'Profil', icon: UserIcon },
    { key: 'api-docs', label: 'API Dokümantasyonu', icon: BookOpen, roles: ['EMPLOYER', 'ADMIN'] },
    { key: 'help', label: 'Yardım & Destek', icon: LifeBuoy },
  ]

  const visibleNav = navItems.filter((n) => !n.roles || n.roles.includes(user.role))

  return (
    <header className="fixed top-2 sm:top-3.5 left-0 right-0 z-50 px-2.5 sm:px-4 transition-all pointer-events-none">
      <div className="max-w-7xl mx-auto rounded-2xl sm:rounded-full acrylic-3d border border-white/70 dark:border-white/10 shadow-[0_8px_32px_rgba(15,23,42,0.18),0_1px_0_0_rgba(255,255,255,0.85)] px-3 sm:px-4 py-1.5 sm:py-2 pointer-events-auto">
        <div className="flex items-center justify-between h-10 sm:h-11 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <button
              type="button"
              onClick={() => go('home')}
              className="flex items-center group transition-transform active:scale-95 min-w-0 text-left flex-shrink-0"
              title="Günübirlik — Ana Sayfa"
              aria-label="Günübirlik — Ana Sayfa"
            >
              <Logo size="md" variant="full" />
            </button>
          </div>

          {/* Desktop Navigation - 3D Inset Tactile Pill Bar */}
          <nav className="hidden lg:flex items-center p-1 rounded-full inset-3d gap-1 min-w-0" aria-label="Ana Gezinti Menüsü">
            {visibleNav.slice(0, 7).map((item) => {
              const isActive = view === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => go(item.key)}
                  aria-label={item.label}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'btn-3d-emerald rounded-full shadow-sm z-10'
                      : 'text-gray-600 dark:text-gray-300 hover:text-emerald-800 dark:hover:text-emerald-400 hover:bg-white/90 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <item.icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                  <span>{item.label}</span>
                  {item.key === 'notifications' && unreadCount > 0 && (
                    <span className="ml-1 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] h-[16px] flex items-center justify-center shadow-[0_2px_6px_rgba(244,63,94,0.4)] animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User Menu & Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Wallet Button Chip - 3D Tactile */}
            <button
              type="button"
              onClick={() => go('wallet')}
              className="btn-3d-white btn-3d-pill flex items-center gap-1.5 px-3 py-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
              title="Cüzdanım"
              aria-label="Cüzdanım"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 drop-shadow-xs" />
              <span className="hidden sm:inline">Cüzdan</span>
            </button>

            {/* Dark Mode Theme Toggle - 3D Tactile */}
            <ThemeToggle variant="icon" />

            {/* Quick notifications button - mobile 3D */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-full relative hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 active:scale-95"
              onClick={() => go('notifications')}
              aria-label="Bildirimler"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] px-1 min-w-[15px] h-[15px] flex items-center justify-center rounded-full shadow-[0_2px_4px_rgba(244,63,94,0.4)]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 active:scale-95"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* User Dropdown Pill Menu - 3D Spatial */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="hidden lg:flex items-center gap-2 pl-1 pr-3 py-1 rounded-full card-3d-spatial hover:shadow-md transition-shadow group cursor-pointer"
                  aria-label="Kullanıcı Menüsü"
                >
                  <Avatar className="w-7 h-7 border-2 border-emerald-500/50 shadow-[0_2px_6px_rgba(16,185,129,0.3)]">
                    <AvatarFallback className="bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-900 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px]">
                      {initials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-800 dark:text-slate-100 max-w-[85px] truncate leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {user.fullName.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 leading-none">
                      {user.role === 'WORKER' ? 'İş Arayan' : user.role === 'EMPLOYER' ? 'İşveren' : 'Yönetici'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-72 sm:w-80 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-white/10 p-2 bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-100 backdrop-blur-2xl">
                <DropdownMenuLabel className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-slate-800/90 dark:via-emerald-950/40 dark:to-slate-800/90 rounded-xl mb-1.5 border border-emerald-100/70 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-emerald-400 dark:border-emerald-500 shadow-xs">
                      <AvatarFallback className="bg-emerald-600 text-white font-black text-sm">
                        {initials(user.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{user.fullName}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</span>
                      <Badge variant="outline" className="mt-1 w-fit text-[9px] border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 bg-white/80 dark:bg-slate-900/80 py-0.5 px-2 font-bold">
                        {user.role === 'WORKER' ? '👷 İş Arayan' : user.role === 'EMPLOYER' ? '🏢 İşveren' : '🛡️ Yönetici'}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1 dark:bg-slate-800" />
                <DropdownMenuItem onClick={() => go('profile')} className="rounded-xl text-xs font-semibold cursor-pointer py-2.5 px-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 focus:bg-slate-100 dark:focus:bg-slate-800/90 transition-all flex items-center">
                  <UserIcon className="w-4 h-4 mr-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Profilim</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('wallet')} className="rounded-xl text-xs font-semibold cursor-pointer py-2.5 px-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 focus:bg-slate-100 dark:focus:bg-slate-800/90 transition-all flex items-center">
                  <Wallet className="w-4 h-4 mr-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Cüzdanım</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('notifications')} className="rounded-xl text-xs font-semibold cursor-pointer py-2.5 px-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 focus:bg-slate-100 dark:focus:bg-slate-800/90 transition-all flex items-center">
                  <Bell className="w-4 h-4 mr-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Bildirimler</span>
                  {unreadCount > 0 && <Badge className="ml-auto bg-rose-500 text-white text-[10px] py-0 px-1.5 font-bold shadow-xs">{unreadCount}</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('help')} className="rounded-xl text-xs font-semibold cursor-pointer py-2.5 px-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 focus:bg-slate-100 dark:focus:bg-slate-800/90 transition-all flex items-center">
                  <LifeBuoy className="w-4 h-4 mr-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Yardım & Destek</span>
                </DropdownMenuItem>
                {['EMPLOYER', 'ADMIN'].includes(user.role) && (
                  <DropdownMenuItem onClick={() => go('api-docs')} className="rounded-xl text-xs font-semibold cursor-pointer py-2.5 px-3 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/90 focus:bg-slate-100 dark:focus:bg-slate-800/90 transition-all flex items-center">
                    <BookOpen className="w-4 h-4 mr-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>API Dokümantasyonu</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="my-1.5 dark:bg-slate-800" />
                <div className="px-2.5 py-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Görünüm Teması</span>
                  </div>
                  <ThemeToggle variant="segmented" className="w-full" />
                </div>
                <DropdownMenuSeparator className="my-1.5 dark:bg-slate-800" />
                <DropdownMenuItem onClick={() => logout()} className="rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 focus:bg-red-50 dark:focus:bg-red-950/40 cursor-pointer py-2.5 px-3 transition-all flex items-center">
                  <LogOut className="w-4 h-4 mr-2.5 text-red-500 dark:text-red-400 shrink-0" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/80 dark:border-slate-800 py-3 space-y-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User info at top of mobile menu */}
            <div className="flex items-center gap-3 p-2.5 mb-2 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-slate-900/50 dark:to-blue-950/40 border border-emerald-100 dark:border-emerald-900/30">
              <Avatar className="w-10 h-10 border border-emerald-300 flex-shrink-0 shadow-xs">
                <AvatarFallback className="bg-emerald-600 text-white font-bold text-sm">
                  {initials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{user.fullName}</div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
              </div>
              <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-900 font-semibold py-0.5 px-2 flex-shrink-0">
                {user.role === 'WORKER' ? 'İş Arayan' : user.role === 'EMPLOYER' ? 'İşveren' : 'Yönetici'}
              </Badge>
            </div>

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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/90 dark:hover:bg-slate-800/80 hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.key === 'notifications' && unreadCount > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] h-[16px] flex items-center justify-center ${
                      isActive ? 'bg-white text-emerald-800' : 'bg-rose-500 text-white'
                    }`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Tema Tercihi (Mobil) */}
            <div className="p-3 my-2 rounded-xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-200/60 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300">Tema Tercihi</span>
              <ThemeToggle variant="segmented" className="w-full" />
            </div>

            <button
              type="button"
              onClick={() => {
                logout()
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors mt-2 border-t border-gray-100 dark:border-slate-800 pt-3"
            >
              <LogOut className="w-4 h-4 flex-shrink-0 text-red-500" />
              Çıkış Yap
            </button>
          </div>
        )}
      </div>

      {/* Site Paylaş Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600" />
              Siteyi Paylaş
            </DialogTitle>
            <DialogDescription>
              Günübirlik İş Bul platformunu arkadaşlarınla paylaş
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* URL Preview */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-white/10">
              <Input
                value={siteUrl}
                readOnly
                className="flex-1 h-10 bg-white dark:bg-slate-800 text-sm dark:text-slate-100 dark:border-white/10"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 flex-shrink-0 dark:border-white/10 dark:hover:bg-slate-800"
                onClick={handleCopyLink}
                title="Linki Kopyala"
                aria-label="Linki Kopyala"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Native Share Button (mobilde WhatsApp/Telegram vb. açar) */}
            <Button
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold"
              onClick={handleNativeShare}
            >
              <Share2 className="w-5 h-5 mr-2" />
              Paylaş (WhatsApp, Telegram, SMS...)
            </Button>

            {/* Quick share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Günübirlik İş Bul — Türkiye\'nin günübirlik iş bulma platformu! ' + siteUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-gray-200 dark:border-white/10 hover:border-emerald-500/50 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition-all text-gray-700 dark:text-slate-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[11px] font-semibold">WhatsApp</span>
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent('Günübirlik İş Bul')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-gray-200 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all text-gray-700 dark:text-slate-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 dark:text-blue-400 flex items-center justify-center transition-transform group-hover:scale-110">
                  <TelegramIcon className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[11px] font-semibold">Telegram</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Günübirlik İş Bul — Türkiye\'nin günübirlik iş bulma platformu!')}&url=${encodeURIComponent(siteUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border border-gray-200 dark:border-white/10 hover:border-slate-500/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/50 transition-all text-gray-700 dark:text-slate-200 group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-500/10 dark:bg-slate-500/20 text-slate-800 dark:text-slate-200 flex items-center justify-center transition-transform group-hover:scale-110">
                  <TwitterXIcon className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-[11px] font-semibold">X (Twitter)</span>
              </a>
            </div>

            {/* QR Kod ile hızlı erişim */}
            <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                <QrCode className="w-4 h-4" />
                QR Kod ile Eriş
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(siteUrl)}`}
                alt="QR Kod"
                className="w-44 h-44 bg-white p-2 rounded-lg shadow-sm"
              />
              <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center">
                Telefon kamerasıyla tara, siteye anında eriş
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
