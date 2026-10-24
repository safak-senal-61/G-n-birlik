'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function MessagesRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const c = searchParams.get('c') || searchParams.get('conversationId') || ''
    const target = c ? `/?view=messages&c=${encodeURIComponent(c)}` : '/?view=messages'
    router.replace(target)
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] dark:bg-[#0C0E0D]">
      <div className="animate-pulse text-sm text-[#5C615E] dark:text-[#949B97]">Sohbetler açılıyor...</div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesRedirect />
    </Suspense>
  )
}
