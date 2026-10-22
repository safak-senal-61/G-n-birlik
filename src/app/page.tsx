'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'
import { on, connectSocket, getSocket } from '@/lib/socket'
import Header from '@/components/shared/header'
import AuthScreen from '@/components/screens/auth-screen'
import AuthModal from '@/components/shared/auth-modal'
import AuthGateCard from '@/components/shared/auth-gate-card'
import { openCookiePreferencesModal } from '@/components/shared/cookie-consent-banner'
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
      <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] dark:bg-[#0C0E0D]">
        <div className="text-center flex flex-col items-center gap-3">
          <Logo size="md" variant="full" />
          <span className="text-xs font-mono text-[#5C615E] dark:text-[#949B97]">
            Yükleniyor...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F6F5F2] dark:bg-[#0C0E0D] text-[#141615] dark:text-[#F2F1ED] relative selection:bg-[#0D6847] selection:text-white">
      {maintenanceMode && user?.role === 'ADMIN' && (
        <div className="relative z-50 bg-[#C84B31] text-white text-xs font-semibold px-4 py-2 text-center">
          Bakım modu aktif. Yalnızca yönetici hesabıyla görüntüleniyor.
        </div>
      )}
      <Header />
      <main className="flex-1 relative z-10 pt-2">
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
      <footer className="mt-auto relative z-10 bg-white dark:bg-[#141716] border-t border-[#E2E0D8] dark:border-[#252B28] py-6 px-4 text-xs text-[#5C615E] dark:text-[#949B97]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" variant="full" />
            <span className="text-[#C5C1B6] dark:text-[#3A443F]">•</span>
            <span className="text-[12px] text-[#5C615E] dark:text-[#949B97]">
              Günlük ve yevmiyeli iş panosu
            </span>
          </div>
          <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-x-5 gap-y-2 text-[12px] font-medium pt-3 sm:pt-0 border-t sm:border-t-0 border-[#ECEAE4] dark:border-[#222624]">
            <div className="flex flex-wrap items-center gap-4">
              <a href="/nasil-calisir" className="hover:text-[#141615] dark:hover:text-white">İşleyiş</a>
              <a href="/is-arayanlar" className="hover:text-[#141615] dark:hover:text-white">Çalışanlar</a>
              <a href="/isverenler" className="hover:text-[#141615] dark:hover:text-white">İşverenler</a>
              <a href="/blog" className="hover:text-[#141615] dark:hover:text-white">Yevmiye Rehberi</a>
              <a href="/gizlilik-politikasi" className="hover:text-[#141615] dark:hover:text-white">Gizlilik Politikası</a>
              <a href="/kullanim-kosullari" className="hover:text-[#141615] dark:hover:text-white">Kullanım Koşulları</a>
              <a href="/mesafeli-satis-sozlesmesi" className="hover:text-[#141615] dark:hover:text-white">Mesafeli Satış Sözleşmesi</a>
              <a href="/kvkk-aydinlatma-metni" className="hover:text-[#141615] dark:hover:text-white">KVKK Aydınlatma Metni</a>
              <button
                type="button"
                onClick={openCookiePreferencesModal}
                className="hover:text-[#141615] dark:hover:text-white cursor-pointer"
              >
                Çerez Tercihleri
              </button>
            </div>
            <span className="font-mono text-[11px] text-[#8A8F8C]">© 2026 Günübirlik</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
