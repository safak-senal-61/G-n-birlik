'use client'

import { useState, useEffect } from 'react'
import { notificationsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell, BellRing, CheckCheck, Trash2, Settings,
  Briefcase, CheckCircle2, XCircle, MessageSquare, Clock, MapPin, AlertCircle
} from 'lucide-react'
import { formatRelative } from '@/lib/format'
import { toast } from 'sonner'

const ICON_MAP: Record<string, any> = {
  JOB_APPLIED: Briefcase,
  APPLICATION_ACCEPTED: CheckCircle2,
  APPLICATION_REJECTED: XCircle,
  APPLICATION_WITHDRAWN: AlertCircle,
  NEW_MESSAGE: MessageSquare,
  JOB_REMINDER: Clock,
  JOB_NEARBY: MapPin,
}

const COLOR_MAP: Record<string, string> = {
  JOB_APPLIED: 'bg-blue-100 text-blue-700',
  APPLICATION_ACCEPTED: 'bg-green-100 text-green-700',
  APPLICATION_REJECTED: 'bg-red-100 text-red-700',
  APPLICATION_WITHDRAWN: 'bg-gray-100 text-gray-700',
  NEW_MESSAGE: 'bg-emerald-100 text-emerald-700',
  JOB_REMINDER: 'bg-yellow-100 text-yellow-700',
  JOB_NEARBY: 'bg-purple-100 text-purple-700',
}

export default function NotificationsScreen() {
  const { go } = useApp()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadOnly, setUnreadOnly] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const result = await notificationsApi.list(unreadOnly)

      // Bildirimler ekranı açıldığında okunmamış bildirimler doğrudan görüldü olarak işaretlenir:
      // 1. Üstteki '2' rozeti ve sayaç anında silinir
      // 2. Backend'de tümü okundu olarak kaydedilir
      // 3. Ekranda '• Yeni' durumu doğrudan 'Okundu'ya çevrilir
      const hasUnread = (result.unreadCount && result.unreadCount > 0) || result.items.some((n: any) => !n.isRead)

      if (hasUnread) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('notifications-read'))
        }
        notificationsApi.markAllRead().catch(() => {})
        setNotifications(result.items.map((n: any) => ({ ...n, isRead: true })))
      } else {
        setNotifications(result.items)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Sayfa görüntülendiği anda rozeti hemen sıfırla
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications-read'))
    }
    load()
  }, [unreadOnly])

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead()
      toast.success('Tüm bildirimler okundu.')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications-read'))
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleClick = async (notif: any) => {
    // Okundu işaretle
    if (!notif.isRead) {
      try {
        await notificationsApi.markRead(notif.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        )
      } catch {}
    }

    // Yönlendir
    if (notif.data) {
      try {
        const data = typeof notif.data === 'string' ? JSON.parse(notif.data) : notif.data
        if (data.jobId) {
          go('job-detail', { jobId: data.jobId })
        } else if (data.conversationId) {
          go('messages')
        } else if (data.applicationId) {
          go('applications')
        }
      } catch {}
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    try {
      await notificationsApi.delete(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      toast.success('Bildirim silindi.')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Bildirimler</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1 text-sm truncate">Başvuru güncellemeleri, mesajlar ve daha fazlası</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={unreadOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`h-9 text-xs sm:text-sm ${unreadOnly ? 'bg-emerald-600' : 'dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700'}`}
          >
            <BellRing className="w-4 h-4 mr-2" />
            Okunmamış
          </Button>
          <Button variant="outline" size="sm" onClick={handleMarkAll} className="h-9 text-xs sm:text-sm dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700">
            <CheckCheck className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Tümünü Okundu İşaretle</span>
            <span className="sm:hidden">Tümünü Okundu</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => go('notification-settings')}
            className="h-9 text-xs sm:text-sm dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Bildirim Ayarları"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed dark:bg-slate-900/90 dark:border-slate-800">
          <CardContent className="p-4 sm:p-12 text-center">
            <Bell className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">
              {unreadOnly ? 'Okunmamış bildirim yok' : 'Bildirim yok'}
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm">
              {unreadOnly
                ? 'Tüm bildirimleri görmek için filtreyi kaldırın.'
                : 'Henüz hiç bildiriminiz yok. İş ilanlarına başvurdukça bildirimler burada görünecek.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const Icon = ICON_MAP[notif.type] || Bell
            const colorClass = COLOR_MAP[notif.type] || 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300'

            return (
              <Card
                key={notif.id}
                className={`cursor-pointer transition hover:shadow-md dark:border-white/10 ${
                  !notif.isRead ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/40' : 'bg-white dark:bg-slate-900/90'
                }`}
                onClick={() => handleClick(notif)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{notif.title}</h4>
                        <span className="text-xs text-gray-400 dark:text-slate-400 flex-shrink-0">
                          {formatRelative(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-300 mt-0.5 line-clamp-2">{notif.body}</p>

                      <div className="flex items-center justify-between mt-2">
                        {!notif.isRead ? (
                          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 text-[10px] sm:text-xs">
                            <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mr-1" />
                            Yeni
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-slate-500">Okundu</span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-rose-400 h-9 w-9"
                          onClick={(e) => handleDelete(e, notif.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
