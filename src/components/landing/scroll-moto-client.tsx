'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useApp } from '@/lib/app-store'

const ScrollMotoRunner = dynamic(
  () => import('@/components/landing/scroll-moto-runner'),
  {
    ssr: false,
  }
)

export default function ScrollMotoClient() {
  const pathname = usePathname()
  const { view } = useApp()

  // Sadece ana sayfa iş listesi ve genel iniş sayfasında gösterilir.
  // Chat (messages), admin, cüzdan veya form ekranlarında arayüzü kapatmaması için gizlenir.
  if (pathname !== '/' || (view && view !== 'jobs')) {
    return null
  }

  return <ScrollMotoRunner />
}
