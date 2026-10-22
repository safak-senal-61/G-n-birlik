'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'
import { on, connectSocket, getSocket } from '@/lib/socket'
import Header from '@/components/shared/header'
import AuthScreen from '@/components/screens/auth-screen'
import AuthModal from '@/components/shared/auth-modal'
import AuthGateCard from '@/components/shared/auth-gate-card'
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

  // Header + ana içerik (Misafirler de tüm arayüzü görebilir, işlemler için girişe yönlendirilir)
  return (
    <div className="w-full min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 relative selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Global Auth Modal */}
      <AuthModal />

      {maintenanceMode && user?.role === 'ADMIN' && (
        <div className="relative z-50 bg-amber-500/90 backdrop-blur-md text-amber-950 text-xs font-bold px-4 py-2 text-center border-b border-amber-600/30 shadow-sm">
          ⚠️ Bakım modu aktif. Sadece admin olarak erişebiliyorsunuz. Normal kullanıcılar bakım ekranı görüyor.
        </div>
      )}
      <Header />
      <main className="flex-1 relative z-10 pt-20 sm:pt-22">
        {view === 'home' && <JobsListScreen />}
        {view === 'job-detail' && <JobDetailScreen />}
        {view === 'post-job' &&
          (user ? (
            <PostJobScreen />
          ) : (
            <AuthGateCard
              title="İlan Yayınlamak İçin Giriş Yapın"
              description="İş ilanı vermek, acil eleman bulmak ve yevmiyeli çalışanlarla iletişime geçmek için lütfen işveren hesabınızla giriş yapın."
              targetRole="EMPLOYER"
            />
          ))}
        {view === 'my-jobs' &&
          (user ? (
            <MyJobsScreen />
          ) : (
            <AuthGateCard
              title="İlanlarınızı Yönetmek İçin Giriş Yapın"
              description="Yayınladığınız ilanları, gelen başvuruları ve çalışma durumlarını takip etmek için giriş yapın."
              targetRole="EMPLOYER"
            />
          ))}
        {view === 'applications' &&
          (user ? (
            <ApplicationsScreen />
          ) : (
            <AuthGateCard
              title="Başvurularınızı Görmek İçin Giriş Yapın"
              description="Yaptığınız iş başvurularını, kabul durumlarını ve onaylanan yevmiyelerinizi görmek için giriş yapın."
            />
          ))}
        {view === 'messages' &&
          (user ? (
            <MessagesScreen />
          ) : (
            <AuthGateCard
              title="Mesajlaşmak İçin Giriş Yapın"
              description="İşverenler veya adaylarla anlık görüşmek ve adres detaylarını öğrenmek için lütfen giriş yapın."
            />
          ))}
        {view === 'profile' &&
          (user ? (
            <ProfileScreen />
          ) : (
            <AuthGateCard title="Profilinizi Düzenlemek İçin Giriş Yapın" />
          ))}
        {view === 'notifications' &&
          (user ? (
            <NotificationsScreen />
          ) : (
            <AuthGateCard title="Bildirimlerinizi Görmek İçin Giriş Yapın" />
          ))}
        {view === 'notification-settings' &&
          (user ? (
            <NotificationSettingsScreen />
          ) : (
            <AuthGateCard title="Bildirim Ayarları İçin Giriş Yapın" />
          ))}
        {view === 'saved-jobs' &&
          (user ? (
            <SavedJobsScreen />
          ) : (
            <AuthGateCard
              title="Kaydettiğiniz İlanlar İçin Giriş Yapın"
              description="Beğendiğiniz ve sonradan başvurmak istediğiniz işleri saklamak için hesabınıza giriş yapın."
            />
          ))}
        {view === 'wallet' &&
          (user ? (
            <WalletScreen />
          ) : (
            <AuthGateCard
              title="Cüzdan ve Yevmiye Bakiyeniz İçin Giriş Yapın"
              description="Kazandığınız yevmiyeleri, emanet havuzundaki tutarları ve banka transferlerini yönetmek için giriş yapın."
            />
          ))}
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
