'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'
import { on, connectSocket, getSocket } from '@/lib/socket'
import Header from '@/components/shared/header'
import AuthScreen from '@/components/screens/auth-screen'
import JobsListScreen from '@/components/screens/jobs-list-screen'
import JobDetailScreen from '@/components/screens/job-detail-screen'
import PostJobScreen from '@/components/screens/post-job-screen'
import MyJobsScreen from '@/components/screens/my-jobs-screen'
import ApplicationsScreen from '@/components/screens/applications-screen'
import MessagesScreen from '@/components/screens/messages-screen'
import ProfileScreen from '@/components/screens/profile-screen'
import NotificationsScreen from '@/components/screens/notifications-screen'
import SavedJobsScreen from '@/components/screens/saved-jobs-screen'
import ApiDocsScreen from '@/components/screens/api-docs-screen'
import WalletScreen from '@/components/screens/wallet-screen'
import NotificationSettingsScreen from '@/components/screens/notification-settings-screen'
import HelpScreen from '@/components/screens/help-screen'
import MaintenanceScreen from '@/components/maintenance-screen'
import { Bell, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

export default function Home() {
  const { user, token, isLoading, isAuthenticated, initialize } = useAuth()
  const { view } = useApp()
  const [authChecked, setAuthChecked] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceChecked, setMaintenanceChecked] = useState(false)

  // Bakım modu kontrolü (auth'dan önce)
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/v1/maintenance/status', { cache: 'no-store' })
        const json = await res.json()
        if (json.success && json.data?.maintenanceMode) {
          setMaintenanceMode(true)
        }
      } catch {
        // Hata durumunda bakım modunu kapalı say
      } finally {
        setMaintenanceChecked(true)
      }
    }
    checkMaintenance()
  }, [])

  // Bakım modu açıksa bakım ekranı göster (admin'ler hariç)
  useEffect(() => {
    if (maintenanceMode && user?.role === 'ADMIN') {
      // Admin bakım modunda da erişebilir
      return
    }
  }, [maintenanceMode, user])

  // İlk açılışta kimlik kontrolü
  useEffect(() => {
    if (!maintenanceChecked) return
    initialize().finally(() => setAuthChecked(true))
  }, [initialize, maintenanceChecked])

  // WebSocket global olay dinleyicileri (bildirim, mesaj)
  useEffect(() => {
    if (!token) return

    // Token varsa WebSocket bağla
    if (!getSocket()?.connected) {
      connectSocket(token)
    }

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
  }, [token])

  // Bakım modu yükleniyor
  if (!maintenanceChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-slate-300 font-medium">Kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  // Bakım modu açıksa ve kullanıcı admin değilse bakım ekranı göster
  if (maintenanceMode && user?.role !== 'ADMIN') {
    return <MaintenanceScreen />
  }

  // Auth yüklenirken loading screen (sadece ilk initialize'da, register/login sırasında değil)
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-gray-600 font-medium">Günübirlik İş Bul yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Admin bakım modunda bile bir uyarı göster (ama erişime izin ver)
  // Auth değilse login ekranı
  if (!isAuthenticated || !user) {
    return <AuthScreen />
  }

  // Header + ana içerik
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {maintenanceMode && user?.role === 'ADMIN' && (
        <div className="bg-amber-500 text-amber-950 text-xs font-medium px-4 py-2 text-center">
          ⚠️ Bakım modu aktif. Sadece admin olarak erişebiliyorsunuz. Normal kullanıcılar bakım ekranı görüyor.
        </div>
      )}
      <Header />
      <main className="flex-1">
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
      <footer className="mt-auto bg-white border-t border-gray-200 py-4 px-4 text-center text-xs text-gray-500">
        <p>© 2024 Günübirlik İş Bul — Konum Bazlı Günlük İş Platformu</p>
        <p className="mt-1">Next.js + Prisma + PostgreSQL + WebSocket • REST API + WebSocket</p>
      </footer>
    </div>
  )
}
