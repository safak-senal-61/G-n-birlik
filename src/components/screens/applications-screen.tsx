'use client'

import { useState, useEffect, useCallback } from 'react'
import { applicationsApi, walletApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import QrScannerCamera from '@/components/qr-scanner-camera'
import {
  Briefcase, MessageSquare, Star, XCircle, CheckCircle2, Clock,
  MapPin, Wallet, Calendar, ChevronRight, CheckCircle, XCircle as XIcon,
  AlertCircle, FileText, QrCode, Loader2, ArrowRight, Phone, Camera,
} from 'lucide-react'
import { formatWage, formatDate, categoryIcon, statusLabel, daysUntil, initials } from '@/lib/format'
import { toast } from 'sonner'

// ====================================================================
// İş akışı adımları (stepper için)
// ====================================================================
const JOB_STEPS = [
  { key: 'PENDING', label: 'Başvuruldu', icon: FileText, color: 'amber' },
  { key: 'ACCEPTED', label: 'Onaylandı', icon: CheckCircle, color: 'emerald' },
  { key: 'IN_PROGRESS', label: 'İşe Başlandı', icon: QrCode, color: 'indigo' },
  { key: 'COMPLETED', label: 'Tamamlandı', icon: CheckCircle2, color: 'blue' },
  { key: 'PAID', label: 'Ödendi', icon: Wallet, color: 'emerald' },
] as const

function getStepIndex(status: string): number {
  const idx = JOB_STEPS.findIndex((s) => s.key === status)
  if (status === 'REJECTED' || status === 'WITHDRAWN' || status === 'NO_SHOW') return -1
  return idx >= 0 ? idx : 0
}

// ====================================================================
// Ana component
// ====================================================================
export default function ApplicationsScreen() {
  const { go } = useApp()
  const { user } = useAuth()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [qrScanOpen, setQrScanOpen] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrManualMode, setQrManualMode] = useState(false) // kamera yoksa manuel token girişi

  const loadApps = useCallback(async () => {
    setLoading(true)
    try {
      const result = await applicationsApi.mine(statusFilter === 'ALL' ? undefined : statusFilter)
      setApps(result)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (user) loadApps()
  }, [user, loadApps])

  const handleWithdraw = async (appId: string) => {
    if (!confirm('Başvurunuzu geri çekmek istediğinize emin misiniz?')) return
    try {
      await applicationsApi.updateStatus(appId, 'WITHDRAWN')
      toast.success('Başvuru geri çekildi.')
      loadApps()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSendMessage = async (job: any) => {
    try {
      const { conversationsApi } = await import('@/lib/api')
      await conversationsApi.sendMessage({
        recipientId: job.employer.id,
        jobId: job.id,
        content: `Merhaba, "${job.title}" ilanına yaptığım başvuru hakkında konuşmak istiyorum.`,
      })
      go('messages')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // QR check-in/check-out tara (işçi tarafı) — kamera ile
  const handleQrCameraScan = async (token: string) => {
    setQrLoading(true)
    try {
      const res = await fetch('/api/v1/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.data.message || 'QR tarandı!')
        setQrScanOpen(false)
        setQrToken('')
        loadApps()
      } else {
        toast.error(data.error || 'QR tarama başarısız')
        setQrScanOpen(false)
      }
    } catch (e: any) {
      toast.error(e.message)
      setQrScanOpen(false)
    } finally {
      setQrLoading(false)
    }
  }

  // Manuel token ile tara (kamera yoksa)
  const handleQrManualScan = async () => {
    if (!qrToken || qrToken.length < 10) {
      toast.error('Geçerli bir QR token girin')
      return
    }
    setQrLoading(true)
    try {
      const res = await fetch('/api/v1/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ token: qrToken }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.data.message || 'QR tarandı!')
        setQrScanOpen(false)
        setQrToken('')
        setQrManualMode(false)
        loadApps()
      } else {
        toast.error(data.error || 'QR tarama başarısız')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setQrLoading(false)
    }
  }

  const statusCounts = {
    ALL: apps.length,
    PENDING: apps.filter((a) => a.status === 'PENDING').length,
    ACCEPTED: apps.filter((a) => a.status === 'ACCEPTED').length,
    IN_PROGRESS: apps.filter((a) => a.status === 'IN_PROGRESS').length,
    COMPLETED: apps.filter((a) => a.status === 'COMPLETED').length,
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Başvurularım</h1>
        <p className="text-gray-600 mt-1 text-xs sm:text-sm">İş başvurularınızı takip edin, QR ile işe başlayın</p>
      </div>

      {/* Filter Tabs - 3D Tactile Buttons */}
      <div className="mb-5 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-min pb-1">
          {[
            { v: 'ALL', l: 'Tümü', c: statusCounts.ALL },
            { v: 'PENDING', l: 'Beklemede', c: statusCounts.PENDING },
            { v: 'ACCEPTED', l: 'Onaylandı', c: statusCounts.ACCEPTED },
            { v: 'IN_PROGRESS', l: 'İşe Başladı', c: statusCounts.IN_PROGRESS },
            { v: 'COMPLETED', l: 'Tamamlandı', c: statusCounts.COMPLETED },
          ].map((t) => {
            const isActive = statusFilter === t.v
            return (
              <button
                key={t.v}
                onClick={() => setStatusFilter(t.v)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'btn-3d-emerald btn-3d-pill z-10'
                    : 'btn-3d-white btn-3d-pill text-slate-700'
                }`}
              >
                <span>{t.l}</span>
                {t.c > 0 && (
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {t.c}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed border-2 border-gray-200 dark:border-white/10 bg-gradient-to-br from-gray-50 to-white dark:from-slate-900/90 dark:to-slate-950/90 shadow-sm">
          <CardContent className="p-6 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200/50 dark:border-emerald-800/50 mb-4 shadow-sm">
              <FileText className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-1 text-base sm:text-lg">
              {statusFilter === 'ALL' ? 'Henüz başvurunuz yok' : 'Bu durumda başvuru yok'}
            </h3>
            <p className="text-gray-500 dark:text-slate-400 mb-5 text-sm max-w-xs mx-auto">
              {statusFilter === 'ALL'
                ? 'İş ilanlarına göz atıp ilk başvurunuzu yapın.'
                : 'Farklı bir filtre deneyin.'}
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6 text-sm text-white" onClick={() => go('home')}>
              <Briefcase className="w-4 h-4 mr-2" />
              İşleri Keşfet
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Application Cards */
        <div className="space-y-3 sm:space-y-4">
          {apps.map((app) => {
            const job = app.job
            if (!job) return null
            const stepIndex = getStepIndex(app.status)
            const isNegative = ['REJECTED', 'WITHDRAWN', 'NO_SHOW'].includes(app.status)

            return (
              <Card
                key={app.id}
                className="overflow-hidden border border-gray-200 dark:border-white/10 dark:bg-slate-900/90 card-3d-spatial hover:shadow-lg transition-all duration-300"
              >
                {/* Status Color Bar */}
                <div className={`h-1 ${
                  app.status === 'PENDING' ? 'bg-amber-400' :
                  app.status === 'ACCEPTED' ? 'bg-emerald-400' :
                  app.status === 'IN_PROGRESS' ? 'bg-indigo-400' :
                  app.status === 'COMPLETED' ? 'bg-blue-400' :
                  app.status === 'REJECTED' || app.status === 'NO_SHOW' ? 'bg-red-400' :
                  'bg-gray-300'
                }`} />

                <CardContent className="p-3 sm:p-4">
                  {/* Job Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-900 border border-emerald-300/40 dark:border-emerald-700/40 flex items-center justify-center text-lg sm:text-2xl flex-shrink-0">
                      {categoryIcon(job.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => go('job-detail', { jobId: job.id })}
                        className="font-semibold text-gray-900 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors text-left text-sm sm:text-base line-clamp-1"
                      >
                        {job.title}
                      </button>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs">
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <Wallet className="w-3 h-3" />
                          {formatWage(job.wageAmount, job.wageType)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {daysUntil(job.workDate)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{job.district}, {job.city}</span>
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`flex-shrink-0 text-[10px] sm:text-xs font-semibold ${
                        app.status === 'PENDING' ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' :
                        app.status === 'ACCEPTED' ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' :
                        app.status === 'IN_PROGRESS' ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60' :
                        app.status === 'COMPLETED' ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60' :
                        app.status === 'REJECTED' || app.status === 'NO_SHOW' ? 'bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60' :
                        'bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700'
                      }`}
                    >
                      {statusLabel(app.status).text}
                    </Badge>
                  </div>

                  {/* Stepper - İş Akışı (sadece pozitif durumlar için) */}
                  {!isNegative && (
                    <div className="mt-3 mb-2 px-0.5">
                      <div className="flex items-center justify-between">
                        {JOB_STEPS.map((step, i) => {
                          const isDone = i < stepIndex
                          const isCurrent = i === stepIndex
                          const Icon = step.icon
                          const shortLabels = ['Başvuru', 'Onay', 'Başladı', 'Bitti', 'Ödendi']
                          return (
                            <div key={step.key} className="flex items-center flex-1 last:flex-none">
                              {/* Step Circle */}
                              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                                <div
                                  className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all ${
                                    isDone
                                      ? 'bg-emerald-500 text-white'
                                      : isCurrent
                                      ? 'bg-indigo-500 text-white ring-2 ring-indigo-100 dark:ring-indigo-900 animate-pulse'
                                      : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                                  }`}
                                >
                                  <Icon className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                </div>
                                <span className={`text-[7px] sm:text-[9px] font-medium text-center leading-tight ${
                                  isDone ? 'text-emerald-700 dark:text-emerald-400' : isCurrent ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'
                                }`}>
                                  {shortLabels[i] || step.label}
                                </span>
                              </div>
                              {/* Connector Line */}
                              {i < JOB_STEPS.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-0.5 sm:mx-1 mb-3 rounded-full ${
                                  isDone ? 'bg-emerald-400 dark:bg-emerald-600' : 'bg-gray-200 dark:bg-slate-800'
                                }`} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Negatif durum mesajı */}
                  {isNegative && (
                    <div className={`mt-3 p-2.5 rounded-lg text-xs sm:text-sm ${
                      app.status === 'REJECTED' || app.status === 'NO_SHOW'
                        ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/40'
                        : 'bg-gray-50 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 border border-transparent dark:border-white/10'
                    }`}>
                      {app.status === 'REJECTED' && (app.employerNote ? `⚠️ ${app.employerNote}` : '❌ Başvurunuz reddedildi veya iş iptal edildi.')}
                      {app.status === 'NO_SHOW' && '❌ İş gününe gelinmedi olarak işaretlendi.'}
                      {app.status === 'WITHDRAWN' && 'ℹ️ Başvurunuzu geri çektiniz.'}
                    </div>
                  )}

                  {/* Durum bazlı bilgi kutusu */}
                  {app.status === 'ACCEPTED' && (
                    <div className="mt-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                      <QrCode className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">İşvereniniz QR ile işe başlatacak</p>
                        <p className="mt-0.5">İş gününde işvereniniz check-in QR kodu üretecek. Siz taradığınızda işe başlamış olacaksınız.</p>
                      </div>
                    </div>
                  )}
                  {app.status === 'IN_PROGRESS' && (
                    <div className="mt-2 p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 rounded-lg text-xs text-indigo-800 dark:text-indigo-300 flex items-start gap-2">
                      <Clock className="w-4 h-4 mt-0.5 shrink-0 animate-pulse" />
                      <div>
                        <p className="font-semibold">İş devam ediyor</p>
                        <p className="mt-0.5">İş bitiminde işvereniniz check-out QR kodu üretecek. Taradığınızda iş tamamlanacak ve ödeme talebi oluşturulacak.</p>
                      </div>
                    </div>
                  )}
                  {app.status === 'COMPLETED' && (
                    <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                      <Wallet className="w-4 h-4 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold">Ödeme onay bekliyor</p>
                        <p className="mt-0.5">{job.wageAmount.toLocaleString('tr-TR')}₺ ödemeniz admin onayı sonrası cüzdanınıza yansıyacak.</p>
                      </div>
                    </div>
                  )}

                  {/* Employer info */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
                    <Avatar className="w-7 h-7 flex-shrink-0 border border-gray-200 dark:border-white/10">
                      <AvatarFallback className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                        {initials(job.employer?.companyName || job.employer?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-xs text-gray-700 dark:text-slate-300 truncate font-medium">
                        {job.employer?.companyName || job.employer?.fullName}
                      </span>
                      {job.employer?.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-slate-500 flex-shrink-0">
                      {formatDate(app.createdAt)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex gap-2">
                    {/* PENDING */}
                    {app.status === 'PENDING' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-10 text-xs sm:text-sm border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-200"
                          onClick={() => handleSendMessage(job)}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          Mesaj
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-3 text-xs sm:text-sm text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/40"
                          onClick={() => handleWithdraw(app.id)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          <span className="hidden sm:inline">Geri Çek</span>
                          <span className="sm:hidden">Çek</span>
                        </Button>
                      </>
                    )}

                    {/* ACCEPTED */}
                    {app.status === 'ACCEPTED' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 h-10 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleSendMessage(job)}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          Mesaj Gönder
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-3 text-xs sm:text-sm border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          onClick={() => setQrScanOpen(true)}
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1.5" />
                          <span className="hidden sm:inline">QR Tara</span>
                          <span className="sm:hidden">QR</span>
                        </Button>
                      </>
                    )}

                    {/* IN_PROGRESS */}
                    {app.status === 'IN_PROGRESS' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-10 text-xs sm:text-sm border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-200"
                          onClick={() => handleSendMessage(job)}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          Mesaj
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-3 text-xs sm:text-sm border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          onClick={() => setQrScanOpen(true)}
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1.5" />
                          <span className="hidden sm:inline">QR Tara (Çıkış)</span>
                          <span className="sm:hidden">QR</span>
                        </Button>
                      </>
                    )}

                    {/* COMPLETED */}
                    {app.status === 'COMPLETED' && !app.rating && (
                      <Button
                        size="sm"
                        className="flex-1 h-10 text-xs sm:text-sm bg-amber-500 hover:bg-amber-600 text-white font-medium"
                        onClick={() => go('job-detail', { jobId: job.id })}
                      >
                        <Star className="w-3.5 h-3.5 mr-1.5" />
                        Değerlendir
                      </Button>
                    )}
                    {app.status === 'COMPLETED' && app.rating && (
                      <div className="flex-1 flex items-center justify-center gap-1 px-3 h-10 bg-gray-50 dark:bg-slate-800/80 rounded-lg border border-transparent dark:border-white/10">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600 dark:text-slate-300">Puanladınız: {app.rating}/5</span>
                      </div>
                    )}

                    {/* REJECTED / WITHDRAWN / NO_SHOW */}
                    {(app.status === 'REJECTED' || app.status === 'WITHDRAWN' || app.status === 'NO_SHOW') && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 text-xs sm:text-sm border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800 dark:text-slate-200"
                        onClick={() => go('job-detail', { jobId: job.id })}
                      >
                        İlanı Görüntüle
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* QR Camera Scanner (full screen) */}
      {qrScanOpen && !qrManualMode && (
        <QrScannerCamera
          onScan={handleQrCameraScan}
          onClose={() => setQrScanOpen(false)}
          loading={qrLoading}
          title="QR Kod Tara"
          description="İşvereninizin gösterdiği QR kodunu kamera ile tarayın"
          onSwitchManual={() => setQrManualMode(true)}
        />
      )}

      {/* QR Manual Token Dialog (fallback) */}
      <Dialog open={qrScanOpen && qrManualMode} onOpenChange={(v) => { if (!v) { setQrScanOpen(false); setQrManualMode(false) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              Manuel Token Girişi
            </DialogTitle>
            <DialogDescription>
              Kamera çalışmıyorsa QR tokenı manuel olarak girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>QR Token</Label>
              <Input
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="a1b2c3d4..."
              />
            </div>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={handleQrManualScan}
              disabled={qrLoading}
            >
              {qrLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4 mr-2" />
              )}
              {qrLoading ? 'Taranıyor...' : 'QR Tara'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setQrManualMode(false)}
            >
              <Camera className="w-4 h-4 mr-2" />
              Kamera ile Tara
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
