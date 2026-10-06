'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'
import { on, connectSocket, getSocket } from '@/lib/socket'
import Header from '@/components/shared/header'
import AuthScreen from '@/components/screens/auth-screen'
import dynamic from 'next/dynamic'

const JobsListScreen = dynamic(() => import('@/components/screens/jobs-list-screen'))
const JobDetailScreen = dynamic(() => import('@/components/screens/job-detail-screen'))
const PostJobScreen = dynamic(() => import('@/components/screens/post-job-screen'))
const MyJobsScreen = dynamic(() => import('@/components/screens/my-jobs-screen'))
const ApplicationsScreen = dynamic(() => import('@/components/screens/applications-screen'))
const MessagesScreen = dynamic(() => import('@/components/screens/messages-screen'))
const ProfileScreen = dynamic(() => import('@/components/screens/profile-screen'))
const NotificationsScreen = dynamic(() => import('@/components/screens/notifications-screen'))
const SavedJobsScreen = dynamic(() => import('@/components/screens/saved-jobs-screen'))
const ApiDocsScreen = dynamic(() => import('@/components/screens/api-docs-screen'))
const WalletScreen = dynamic(() => import('@/components/screens/wallet-screen'))
const NotificationSettingsScreen = dynamic(() => import('@/components/screens/notification-settings-screen'))
const HelpScreen = dynamic(() => import('@/components/screens/help-screen'))
const MaintenanceScreen = dynamic(() => import('@/components/maintenance-screen'))
import { Bell, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import Logo from '@/components/shared/logo'

export default function Home() {
  const { user, token, isLoading, isAuthenticated, initialize } = useAuth()
  const { view } = useApp()
  const [authChecked, setAuthChecked] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceChecked, setMaintenanceChecked] = useState(false)

  // Bakım modu ve auth kontrolü (paralel ve gecikmesiz)
  useEffect(() => {
    // 1. Bakım kontrolü
    fetch('/api/v1/maintenance/status', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.maintenanceMode) {
          setMaintenanceMode(true)
        }
      })
      .catch(() => {})
      .finally(() => setMaintenanceChecked(true))

    // 2. Auth kontrolü
    initialize().finally(() => setAuthChecked(true))
  }, [initialize])

  // Supabase Realtime global olay dinleyicileri (bildirim, başvuru, mesaj)
  useEffect(() => {
    if (!user) return
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    // Supabase Realtime bağla
    connectSocket(authToken || user.id)

    const offNotification = on('notification:new', (data: any) => {
      toast(data.title, {
        description: data.body,
        icon: <Bell className="w-4 h-4" />,
        duration: 5000,
      })
    })

    const offAppNotification = on('notification:application', (data: any) => {
      toast(data.title, {
        description: data.body,
        duration: 6000,
      })
    })

    const offJobNearby = on('job:new_nearby', (data: any) => {
      toast(`Yakında yeni iş: ${data.title}`, {
        description: `${data.district}, ${data.city} • ${data.wageAmount}₺`,
        duration: 6000,
        icon: <MessageSquare className="w-4 h-4" />,
      })
    })

    return () => {
      offNotification?.()
      offAppNotification?.()
      offJobNearby?.()
    }
  }, [user])

  // Bakım modu açıksa ve kullanıcı admin değilse bakım ekranı göster
  if (maintenanceMode && user?.role !== 'ADMIN') {
    return <MaintenanceScreen />
  }

  // Token doğrulanırken bekleme ekranı (yalnızca önceden token kaydedilmişse gösterilir)
  const hasStoredToken = typeof window !== 'undefined' ? !!localStorage.getItem('auth_token') : false
  if (!authChecked && hasStoredToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="text-center flex flex-col items-center">
          <div className="mb-4 animate-bounce">
            <Logo size="lg" variant="full" />
          </div>
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <span>Günübirlik İş Bul yükleniyor...</span>
          </div>
        </div>
      </div>
    )
  }

  // Auth değilse login ekranı
  if (!isAuthenticated || !user) {
    return <AuthScreen />
  }

  // Header + ana içerik
  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 relative selection:bg-emerald-500 selection:text-white transition-colors duration-300">

      {maintenanceMode && user?.role === 'ADMIN' && (
        <div className="relative z-50 bg-amber-500/90 backdrop-blur-md text-amber-950 text-xs font-bold px-4 py-2 text-center border-b border-amber-600/30 shadow-sm">
          ⚠️ Bakım modu aktif. Sadece admin olarak erişebiliyorsunuz. Normal kullanıcılar bakım ekranı görüyor.
        </div>
      )}
      <Header />
      <main className="flex-1 relative z-10 pt-20 sm:pt-22">
        {view === 'home' && <JobsListScreen />}
        {view === 'job-detail' && <JobDetailScreen />}
        {view === 'post-job' && <PostJobScreen />}
        {view === 'my-jobs' && <MyJobsScreen />}
        {view === 'applications' && <ApplicationsScreen />}
        {view === 'messages' && <MessagesScreen />}
        {view === 'profile' && <ProfileScreen />}
        {view === 'notifications' && <NotificationsScreen />}
        {view === 'notification-settings' && <NotificationSettingsScreen />}
        {view === 'saved-jobs' && <SavedJobsScreen />}
        {view === 'wallet' && <WalletScreen />}
        {view === 'help' && <HelpScreen />}
        {view === 'api-docs' && <ApiDocsScreen />}
      </main>
      <footer className="mt-auto relative z-10 acrylic-3d border-t border-slate-200/60 dark:border-white/5 py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <Logo size="sm" variant="full" />
          <p className="font-medium text-[11px] text-gray-500 dark:text-gray-400">
            © 2026 Günübirlik İş Bul • Konum Bazlı Günlük İş Platformu
          </p>
        </div>
      </footer>
    </div>
  )
}
