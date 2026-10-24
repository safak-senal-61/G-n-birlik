'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function NotificationsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/?view=notifications')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] dark:bg-[#0C0E0D]">
      <div className="animate-pulse text-sm text-[#5C615E] dark:text-[#949B97]">Bildirimler açılıyor...</div>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={null}>
      <NotificationsRedirect />
    </Suspense>
  )
}
