'use client'

import React from 'react'
import { useApp } from '@/lib/app-store'
import { Lock, LogIn } from 'lucide-react'

interface AuthGateCardProps {
  title?: string
  description?: string
  actionLabel?: string
  targetRole?: 'WORKER' | 'EMPLOYER'
}

export default function AuthGateCard({
  title = 'Bu İşlem İçin Oturum Açın',
  description = 'İlan yayınlamak, başvuru yapmak veya cüzdan hareketlerinizi görüntülemek için hesabınıza giriş yapın.',
  actionLabel = 'Giriş Yap veya Kayıt Ol',
  targetRole,
}: AuthGateCardProps) {
  const { openAuthModal, go } = useApp()

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28] rounded-lg p-6 sm:p-8 space-y-5">
        <div className="w-10 h-10 rounded-md bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5] border border-[#C5DDD0] dark:border-[#244738] flex items-center justify-center">
          <Lock className="w-4 h-4" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-[#141615] dark:text-white tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-[#5C615E] dark:text-[#949B97] leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            type="button"
            className="w-full sm:w-auto h-10 px-5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            onClick={() =>
              openAuthModal({
                title,
                description,
                tab: targetRole === 'EMPLOYER' ? 'register' : 'login',
              })
            }
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{actionLabel}</span>
          </button>
          <button
            type="button"
            className="w-full sm:w-auto h-10 px-4 rounded-md border border-[#D6D3C9] dark:border-[#2B322E] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] hover:bg-[#F0EFEA] dark:hover:bg-[#1D2220] cursor-pointer"
            onClick={() => go('home')}
          >
            Açık İlanlara Dön
          </button>
        </div>
      </div>
    </div>
  )
}
