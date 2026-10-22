'use client'

import { useEffect, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { toast } from 'sonner'

const DISMISS_KEY = 'gunubirlik_push_prompt_dismissed_at'
const COOKIE_KEY = 'gunubirlik_cookie_consent_v1'
const DISMISS_DAYS = 7

/**
 * Bildirim izni için küçük bir ön-izin kartı. "İzin Ver" tıklanınca
 * tarayıcının "site bildirim göndermek istiyor" penceresi kullanıcı etkileşimiyle açılır.
 */
export default function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'default') return

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0)
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400000) return

    const timer = setInterval(() => {
      // Çerez kartı kapandıktan sonra göster (üst üste binmesin)
      if (localStorage.getItem(COOKIE_KEY)) {
        clearInterval(timer)
        setTimeout(() => setShow(true), 4000)
      }
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  const allow = async () => {
    setShow(false)
    try {
      const OS = (window as any).OneSignal
      let granted = false
      if (OS?.Notifications?.requestPermission) {
        await OS.Notifications.requestPermission()
        granted = Notification.permission === 'granted'
      } else {
        granted = (await Notification.requestPermission()) === 'granted'
      }
      if (granted) {
        toast.success('Bildirimler açıldı', { description: 'Yeni ilan ve başvuru haberlerini alacaksınız.' })
      } else {
        localStorage.setItem(DISMISS_KEY, String(Date.now()))
      }
    } catch {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    }
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-label="Bildirim izni"
      className="fixed z-[85] top-3 left-3 right-3 sm:left-auto sm:right-4 sm:top-4 sm:w-[340px] rounded-md border border-[#2B332F] bg-[#141716] text-[#F2F1ED] shadow-xl p-3.5"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded bg-[#0D6847]/25 text-[#5CD6A5] flex items-center justify-center shrink-0">
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-bold text-white">Bildirimleri açın</h3>
          <p className="text-[11px] text-[#B8BFBC] leading-relaxed mt-0.5">
            Yakınınızdaki yeni ilanlardan, başvuru sonuçlarından ve mesajlardan anında haberdar olun.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Kapat"
          className="text-[#949B97] hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-3">
        <button
          type="button"
          onClick={dismiss}
          className="h-8 rounded-xs border border-[#3A423E] bg-[#1C211F] hover:bg-[#262C29] text-[11px] font-semibold cursor-pointer"
        >
          Şimdi Değil
        </button>
        <button
          type="button"
          onClick={allow}
          className="h-8 rounded-xs bg-[#0D6847] hover:bg-[#0F7A53] text-white text-[11px] font-bold cursor-pointer"
        >
          İzin Ver
        </button>
      </div>
    </div>
  )
}
