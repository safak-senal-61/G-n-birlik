'use client'

import dynamic from 'next/dynamic'

const ScrollMotoRunner = dynamic(
  () => import('@/components/landing/scroll-moto-runner'),
  {
    ssr: false,
  }
)

export default function ScrollMotoClient() {
  return <ScrollMotoRunner />
}
