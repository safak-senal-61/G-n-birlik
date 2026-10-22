'use client'

import { useState, useEffect } from 'react'
import { notificationsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  CheckCheck,
  Trash2,
  Settings,
  Briefcase,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  MapPin,
  AlertCircle,
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

const CODE_MAP: Record<string, string> = {
  JOB_APPLIED: 'BAŞVURU',
  APPLICATION_ACCEPTED: 'ONAY',
  APPLICATION_REJECTED: 'RET',
  APPLICATION_WITHDRAWN: 'İPTAL',
  NEW_MESSAGE: 'MESAJ',
  JOB_REMINDER: 'VARDİYA',
  JOB_NEARBY: 'KONUM',
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
      const hasUnread =
        (result.unreadCount && result.unreadCount > 0) ||
        result.items.some((n: any) => !n.isRead)

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications-read'))
    }
    load()
  }, [unreadOnly])

  const handleMarkAll = async () => {
    try {
      await notificationsApi.markAllRead()
      toast.success('Tüm bildirimler okundu olarak işaretlendi.')
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications-read'))
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleClick = async (notif: any) => {
    if (!notif.isRead) {
      try {
        await notificationsApi.markRead(notif.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        )
      } catch {}
    }

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Üst Başlık / Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8D5CC] dark:border-[#262C29] pb-5">
        <div className="space-y-1">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
            SİSTEM KAYITLARI • BİLDİRİM MERKEZİ
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141615] dark:text-white">
            Bildirimler
          </h1>
          <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
            Başvuru onayları, vardiya hatırlatmaları ve mesaj güncellemeleri.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`h-9 px-3 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
              unreadOnly
                ? 'bg-[#0D6847] text-white border-[#0D6847]'
                : 'bg-white dark:bg-[#141716] text-[#141615] dark:text-[#F2F1ED] border-[#D6D3C9] dark:border-[#2B322E] hover:bg-[#F0EFEA] dark:hover:bg-[#1D2220]'
            }`}
          >
            Sadece Okunmamış
          </button>

          <button
            type="button"
            onClick={handleMarkAll}
            className="h-9 px-3 rounded-md text-xs font-semibold bg-white dark:bg-[#141716] text-[#141615] dark:text-[#F2F1ED] border border-[#D6D3C9] dark:border-[#2B322E] hover:bg-[#F0EFEA] dark:hover:bg-[#1D2220] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
            <span>Tümünü Okundu İşaretle</span>
          </button>

          <button
            type="button"
            onClick={() => go('notification-settings')}
            className="h-9 w-9 rounded-md bg-white dark:bg-[#141716] text-[#141615] dark:text-[#F2F1ED] border border-[#D6D3C9] dark:border-[#2B322E] hover:bg-[#F0EFEA] dark:hover:bg-[#1D2220] inline-flex items-center justify-center transition-colors cursor-pointer"
            title="Bildirim Ayarları"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg bg-[#E9E7E0] dark:bg-[#181C1A]" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-8 sm:p-12 text-center space-y-3">
          <div className="w-10 h-10 rounded-md bg-[#F0EFEA] dark:bg-[#1E2421] border border-[#E2E0D8] dark:border-[#2C3330] flex items-center justify-center mx-auto text-[#5C615E] dark:text-[#949B97]">
            <Bell className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-[#141615] dark:text-white">
            {unreadOnly ? 'Okunmamış bildiriminiz bulunmuyor' : 'Henüz bildiriminiz yok'}
          </h3>
          <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97] max-w-sm mx-auto">
            {unreadOnly
              ? 'Tüm bildirim geçmişini görüntülemek için filtreyi kapatabilirsiniz.'
              : 'İlanlara başvurduğunuzda veya vardiya durumu değiştiğinde burada listelenir.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg divide-y divide-[#E2E0D8] dark:divide-[#252B28] overflow-hidden">
          {notifications.map((notif) => {
            const Icon = ICON_MAP[notif.type] || Bell
            const code = CODE_MAP[notif.type] || 'BİLDİRİM'

            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors cursor-pointer ${
                  !notif.isRead
                    ? 'bg-[#EAF3EE]/40 dark:bg-[#162921]/30 hover:bg-[#EAF3EE]/70 dark:hover:bg-[#162921]/50'
                    : 'hover:bg-[#F9F8F6] dark:hover:bg-[#181C1A]'
                }`}
              >
                <div className="w-9 h-9 rounded-md bg-[#F0EFEA] dark:bg-[#1E2421] border border-[#E2E0D8] dark:border-[#2C3330] text-[#0D6847] dark:text-[#5CD6A5] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#F0EFEA] dark:bg-[#1E2421] text-[#454A47] dark:text-[#B8C0BC] border border-[#E2E0D8] dark:border-[#2C3330] shrink-0">
                        {code}
                      </span>
                      <h4 className="font-bold text-sm text-[#141615] dark:text-white truncate">
                        {notif.title}
                      </h4>
                    </div>
                    <span className="font-mono text-[11px] text-[#5C615E] dark:text-[#949B97] shrink-0">
                      {formatRelative(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                    {notif.body}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(e, notif.id)}
                  className="h-8 w-8 rounded border border-transparent hover:border-[#E2E0D8] dark:hover:border-[#252B28] text-[#8A8F8C] hover:text-[#C84B31] flex items-center justify-center shrink-0 transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
