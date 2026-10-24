'use client'

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'

function WalletRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/?view=wallet')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] dark:bg-[#0C0E0D]">
      <div className="animate-pulse text-sm text-[#5C615E] dark:text-[#949B97]">Cüzdan açılıyor...</div>
    </div>
  )
}

export default function WalletPage() {
  return (
    <Suspense fallback={null}>
      <WalletRedirect />
    </Suspense>
  )
}
