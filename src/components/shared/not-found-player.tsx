'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { useState } from 'react'

export default function NotFoundAnimation() {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="w-full max-w-[320px] aspect-square mx-auto flex flex-col items-center justify-center p-6 rounded-2xl bg-[#EAF3EE] dark:bg-[#162921] border border-[#0D6847]/30 text-center">
        <span className="font-mono text-6xl font-black text-[#0D6847] dark:text-[#5CD6A5] tracking-tight">
          404
        </span>
        <span className="mt-2 text-xs font-mono uppercase tracking-wider text-[#5C615E] dark:text-[#949B97]">
          Kayıt Bulunamadı
        </span>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-[360px] sm:max-w-[420px] mx-auto aspect-square flex items-center justify-center">
      {/* İnce arka plan ışıması */}
      <div className="absolute inset-0 bg-[#0D6847]/10 dark:bg-[#5CD6A5]/10 rounded-full blur-3xl pointer-events-none" />
      <DotLottieReact
        src="/animations/error-404.lottie"
        loop
        autoplay
        onError={() => setHasError(true)}
        className="w-full h-full relative z-10 drop-shadow-sm"
      />
    </div>
  )
}
