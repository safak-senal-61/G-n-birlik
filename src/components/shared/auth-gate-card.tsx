'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-store'
import { ShieldCheck, Lock, UserPlus, LogIn, ArrowRight } from 'lucide-react'

interface AuthGateCardProps {
  title?: string
  description?: string
  actionLabel?: string
  targetRole?: 'WORKER' | 'EMPLOYER'
}

export default function AuthGateCard({
  title = 'Giriş Yapmanız Gerekiyor',
  description = 'Bu sayfayı görüntülemek, ilan vermek veya başvurularınızı yönetmek için lütfen hesabınıza giriş yapın.',
  actionLabel = 'Giriş Yap veya Kayıt Ol',
  targetRole,
}: AuthGateCardProps) {
  const { openAuthModal, go } = useApp()

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <Card className="rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
        <CardContent className="p-8 sm:p-10 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              {description}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              className="w-full sm:w-auto h-11 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
              onClick={() =>
                openAuthModal({
                  title,
                  description,
                  tab: targetRole === 'EMPLOYER' ? 'register' : 'login',
                })
              }
            >
              <LogIn className="w-4 h-4 mr-2" />
              {actionLabel}
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto h-11 px-6 rounded-full font-medium"
              onClick={() => go('home')}
            >
              İlanlara Dön
            </Button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Ücretsiz Kayıt
            </span>
            <span>•</span>
            <span>Aynı Gün Yevmiye</span>
            <span>•</span>
            <span>Emanet Ödeme</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
