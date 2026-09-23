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
import { Badge } from '@/components/ui/badge'
import { Briefcase, Bell, MessageSquare, User as UserIcon, LogOut, Menu, X, Plus, Heart, FileText, BookOpen, LayoutGrid, ChevronLeft } from 'lucide-react'
import { initials } from '@/lib/format'
import { useEffect, useState } from 'react'
import { notificationsApi } from '@/lib/api'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { user, logout } = useAuth()
  const { view, go, back, history } = useApp()
  const [unreadCount, setUnreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!user) return
    const loadUnread = async () => {
      try {
        const res = await notificationsApi.list(true)
        setUnreadCount(res.unreadCount)
      } catch {}
    }
    loadUnread()
    const interval = setInterval(loadUnread, 30000)
    return () => clearInterval(interval)
  }, [user, view])

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
  ]

  const visibleNav = navItems.filter((n) => !n.roles || n.roles.includes(user.role))

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            {history.length > 0 && (
              <Button variant="ghost" size="icon" onClick={back} className="h-10 w-10 flex-shrink-0" title="Geri">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}
            <button
              onClick={() => go('home')}
              className="flex items-center gap-2 hover:opacity-80 transition min-w-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="hidden sm:block font-bold text-base lg:text-lg text-gray-900 truncate">
                Günübirlik İş Bul
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center min-w-0">
            {visibleNav.slice(0, 7).map((item) => (
              <Button
                key={item.key}
                variant={view === item.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => go(item.key)}
                className={
                  view === item.key
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'text-gray-700'
                }
              >
                <item.icon className="w-4 h-4 mr-1.5" />
                <span className="truncate">{item.label}</span>
                {item.key === 'notifications' && unreadCount > 0 && (
                  <Badge className="ml-1.5 bg-red-500 text-white text-xs px-1.5 min-w-[18px] h-[18px] flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Quick notifications button - mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 relative"
              onClick={() => go('notifications')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] px-1.5 min-w-[16px] h-[16px] flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden lg:flex items-center gap-2 hover:bg-gray-100 rounded-full p-1 transition">
                  <Avatar className="w-9 h-9 border border-emerald-200">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                      {initials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 sm:w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-semibold truncate">{user.fullName}</span>
                    <span className="text-xs text-gray-500 truncate">{user.email}</span>
                    <Badge variant="outline" className="mt-1 w-fit">
                      {user.role === 'WORKER' ? 'İş Arayan' : user.role === 'EMPLOYER' ? 'İşveren' : 'Admin'}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go('profile')}>
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profilim
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('notifications')}>
                  <Bell className="w-4 h-4 mr-2" />
                  Bildirimler
                  {unreadCount > 0 && <Badge className="ml-auto bg-red-500">{unreadCount}</Badge>}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('api-docs')}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  API Dokümantasyonu
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-3 space-y-1 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {/* User info at top of mobile menu */}
            <div className="flex items-center gap-3 px-2 pb-3 mb-2 border-b border-gray-100">
              <Avatar className="w-10 h-10 border border-emerald-200 flex-shrink-0">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold text-sm">
                  {initials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{user.fullName}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {user.role === 'WORKER' ? 'İş Arayan' : user.role === 'EMPLOYER' ? 'İşveren' : 'Admin'}
              </Badge>
            </div>

            {visibleNav.map((item) => (
              <Button
                key={item.key}
                variant={view === item.key ? 'default' : 'ghost'}
                onClick={() => {
                  go(item.key)
                  setMobileMenuOpen(false)
                }}
                className={`w-full justify-start h-11 ${
                  view === item.key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                }`}
              >
                <item.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.key === 'notifications' && unreadCount > 0 && (
                  <Badge className="ml-auto bg-red-500">{unreadCount}</Badge>
                )}
              </Button>
            ))}
            <Button
              variant="ghost"
              onClick={() => {
                logout()
                setMobileMenuOpen(false)
              }}
              className="w-full justify-start h-11 text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
              Çıkış Yap
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
