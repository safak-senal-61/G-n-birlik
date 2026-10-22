'use client'

import { useState, useEffect, useCallback } from 'react'
import { applicationsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import QrScannerCamera from '@/components/qr-scanner-camera'
import {
  Briefcase,
  MessageSquare,
  Star,
  XCircle,
  CheckCircle2,
  Clock,
  MapPin,
  Wallet,
  Calendar,
  ChevronRight,
  CheckCircle,
  FileText,
  QrCode,
  Loader2,
  Camera,
} from 'lucide-react'
import {
  formatWage,
  formatDate,
  categoryLabel,
  statusLabel,
  daysUntil,
  initials,
} from '@/lib/format'
import { toast } from 'sonner'

const JOB_STEPS = [
  { key: 'PENDING', label: 'Başvuru', icon: FileText },
  { key: 'ACCEPTED', label: 'Onay', icon: CheckCircle },
  { key: 'IN_PROGRESS', label: 'Mesaide', icon: QrCode },
  { key: 'COMPLETED', label: 'Tamamlandı', icon: CheckCircle2 },
  { key: 'PAID', label: 'Ödendi', icon: Wallet },
] as const

function getStepIndex(status: string): number {
  const idx = JOB_STEPS.findIndex((s) => s.key === status)
  if (status === 'REJECTED' || status === 'WITHDRAWN' || status === 'NO_SHOW') return -1
  return idx >= 0 ? idx : 0
}

export default function ApplicationsScreen() {
  const { go } = useApp()
  const { user } = useAuth()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [qrScanOpen, setQrScanOpen] = useState(false)
  const [qrToken, setQrToken] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrManualMode, setQrManualMode] = useState(false)

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
        content: `Merhaba, "${job.title}" ilanına yaptığım başvuru hakkında görüşmek istiyorum.`,
      })
      go('messages')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleQrCameraScan = async (token: string) => {
    setQrLoading(true)
    try {
      const res = await fetch('/api/v1/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.data.message || 'QR doğrulandı!')
        setQrScanOpen(false)
        setQrToken('')
        loadApps()
      } else {
        toast.error(data.error || 'QR okutma başarısız')
        setQrScanOpen(false)
      }
    } catch (e: any) {
      toast.error(e.message)
      setQrScanOpen(false)
    } finally {
      setQrLoading(false)
    }
  }

  const handleQrManualScan = async () => {
    if (!qrToken || qrToken.length < 10) {
      toast.error('Geçerli bir QR kodu girin')
      return
    }
    setQrLoading(true)
    try {
      const res = await fetch('/api/v1/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ token: qrToken }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.data.message || 'QR doğrulandı!')
        setQrScanOpen(false)
        setQrToken('')
        setQrManualMode(false)
        loadApps()
      } else {
        toast.error(data.error || 'QR doğrulama başarısız')
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8D5CC] dark:border-[#262C29] pb-5">
        <div className="space-y-1">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
            ÇALIŞAN VARDİYA ÇİZELGESİ • QR GİRİŞ & ÇIKIŞ
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141615] dark:text-white">
            Başvurularım ve Aktif Vardiyalar
          </h1>
          <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
            Başvuru onaylarını takip edin, mesai saatinde QR kodu okutarak vardiyayı başlatın.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setQrScanOpen(true)}
          className="h-10 px-4 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
          <span>Saha QR Kodu Okut</span>
        </button>
      </div>

      {/* Filtre Sekmeleri */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          { v: 'ALL', l: 'Tümü', c: statusCounts.ALL },
          { v: 'PENDING', l: 'Beklemede', c: statusCounts.PENDING },
          { v: 'ACCEPTED', l: 'Onaylandı', c: statusCounts.ACCEPTED },
          { v: 'IN_PROGRESS', l: 'Mesaide', c: statusCounts.IN_PROGRESS },
          { v: 'COMPLETED', l: 'Tamamlandı', c: statusCounts.COMPLETED },
        ].map((t) => {
          const isActive = statusFilter === t.v
          return (
            <button
              key={t.v}
              type="button"
              onClick={() => setStatusFilter(t.v)}
              className={`h-9 px-3.5 rounded-md text-xs font-semibold border inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#141615] text-white border-[#141615] dark:bg-[#F2F1ED] dark:text-[#141615] dark:border-[#F2F1ED]'
                  : 'bg-white dark:bg-[#141716] text-[#5C615E] dark:text-[#949B97] border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847]'
              }`}
            >
              <span>{t.l}</span>
              {t.c > 0 && (
                <span className="font-mono text-[10px] opacity-80">({t.c})</span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-lg bg-[#E9E7E0] dark:bg-[#181C1A]" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-8 sm:p-12 text-center space-y-4">
          <div className="w-10 h-10 rounded-md bg-[#F0EFEA] dark:bg-[#1E2421] border border-[#E2E0D8] dark:border-[#2C3330] flex items-center justify-center mx-auto text-[#5C615E] dark:text-[#949B97]">
            <FileText className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-bold text-base text-[#141615] dark:text-white">
              {statusFilter === 'ALL' ? 'Henüz başvurunuz bulunmuyor' : 'Bu filtrede başvuru yok'}
            </h3>
            <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
              Açık günlük iş ilanlarını inceleyip uygun vardiyalara başvurabilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => go('home')}
            className="h-10 px-5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Açık İlanlara Göz At</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {apps.map((app) => {
            const job = app.job
            if (!job) return null
            const stepIndex = getStepIndex(app.status)
            const isNegative = ['REJECTED', 'WITHDRAWN', 'NO_SHOW'].includes(app.status)

            return (
              <article
                key={app.id}
                className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-4 sm:p-5 space-y-4"
              >
                {/* Başlık ve Ücret */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#F0EFEA] dark:bg-[#1E2421] text-[#454A47] dark:text-[#B8C0BC] border border-[#E2E0D8] dark:border-[#2C3330]">
                        {categoryLabel(job.category)}
                      </span>
                      <span
                        className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${
                          isNegative
                            ? 'bg-[#FBEEE9] text-[#B43B21] border-[#EFC7BD] dark:bg-[#2A1915] dark:text-[#F28B73] dark:border-[#4A251D]'
                            : 'bg-[#EAF3EE] text-[#0D6847] border-[#C5DDD0] dark:bg-[#162921] dark:text-[#5CD6A5] dark:border-[#244738]'
                        }`}
                      >
                        {statusLabel(app.status).text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => go('job-detail', { jobId: job.id })}
                      className="text-left text-base sm:text-lg font-bold text-[#141615] dark:text-white hover:text-[#0D6847] dark:hover:text-[#5CD6A5] transition-colors cursor-pointer"
                    >
                      {job.title}
                    </button>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#5C615E] dark:text-[#949B97]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {daysUntil(job.workDate)}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.district}, {job.city}
                      </span>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="font-mono text-lg font-bold text-[#0D6847] dark:text-[#5CD6A5]">
                      {formatWage(job.wageAmount, job.wageType)}
                    </div>
                    <div className="font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
                      NET YEVMİYE
                    </div>
                  </div>
                </div>

                {/* 5 Adımlı Vardiya İlerleme Çizelgesi */}
                {!isNegative && (
                  <div className="py-2.5 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#ECEAE4] dark:border-[#222624]">
                    <div className="flex items-center justify-between">
                      {JOB_STEPS.map((step, i) => {
                        const isDone = i < stepIndex
                        const isCurrent = i === stepIndex
                        const Icon = step.icon
                        return (
                          <div key={step.key} className="flex items-center flex-1 last:flex-none">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <div
                                className={`w-6 h-6 rounded flex items-center justify-center border ${
                                  isDone || isCurrent
                                    ? 'bg-[#0D6847] text-white border-[#0D6847]'
                                    : 'bg-white dark:bg-[#141716] text-[#8A8F8C] border-[#E2E0D8] dark:border-[#252B28]'
                                }`}
                              >
                                <Icon className="w-3 h-3" />
                              </div>
                              <span
                                className={`hidden sm:inline font-mono text-[10px] font-semibold ${
                                  isDone || isCurrent
                                    ? 'text-[#141615] dark:text-white'
                                    : 'text-[#8A8F8C]'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                            {i < JOB_STEPS.length - 1 && (
                              <div
                                className={`flex-1 h-px mx-2 ${
                                  isDone ? 'bg-[#0D6847]' : 'bg-[#E2E0D8] dark:bg-[#252B28]'
                                }`}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Durum Mesajları */}
                {app.status === 'ACCEPTED' && (
                  <div className="p-3 rounded-md bg-[#EAF3EE] dark:bg-[#162921] border border-[#C5DDD0] dark:border-[#244738] text-xs text-[#0D6847] dark:text-[#5CD6A5] flex items-center justify-between gap-2">
                    <span>
                      Başvurunuz onaylandı. Sabah iş yerine vardığınızda işverenin Check-in QR kodunu okutun.
                    </span>
                  </div>
                )}

                {app.status === 'IN_PROGRESS' && (
                  <div className="p-3 rounded-md bg-[#F0EFEA] dark:bg-[#1E2421] border border-[#E2E0D8] dark:border-[#2C3330] text-xs text-[#141615] dark:text-[#F2F1ED] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0D6847] shrink-0" />
                    <span>
                      Mesai devam ediyor. Vardiya bitiminde işverenin Çıkış (Check-out) QR kodunu okutarak ödemeyi tetikleyin.
                    </span>
                  </div>
                )}

                {/* Alt Satır: İşveren & Aksiyonlar */}
                <div className="pt-3 border-t border-[#ECEAE4] dark:border-[#222624] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar className="w-7 h-7 rounded border border-[#E2E0D8] dark:border-[#252B28]">
                      <AvatarFallback className="rounded bg-[#F0EFEA] dark:bg-[#1E2421] text-[#0D6847] dark:text-[#5CD6A5] font-mono text-[10px] font-bold">
                        {initials(job.employer?.companyName || job.employer?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] truncate">
                      {job.employer?.companyName || job.employer?.fullName}
                    </span>
                    <span className="font-mono text-[11px] text-[#8A8F8C]">
                      • {formatDate(app.createdAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {app.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSendMessage(job)}
                          className="h-9 px-3 rounded-md bg-white dark:bg-[#141716] border border-[#D6D3C9] dark:border-[#2B322E] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Mesaj</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWithdraw(app.id)}
                          className="h-9 px-3 rounded-md border border-[#EFC7BD] dark:border-[#4A251D] bg-[#FBEEE9] dark:bg-[#2A1915] text-xs font-semibold text-[#B43B21] dark:text-[#F28B73] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Geri Çek</span>
                        </button>
                      </>
                    )}

                    {(app.status === 'ACCEPTED' || app.status === 'IN_PROGRESS') && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSendMessage(job)}
                          className="h-9 px-3 rounded-md bg-white dark:bg-[#141716] border border-[#D6D3C9] dark:border-[#2B322E] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Mesaj</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setQrScanOpen(true)}
                          className="h-9 px-3.5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>{app.status === 'IN_PROGRESS' ? 'Çıkış QR Okut' : 'Giriş QR Okut'}</span>
                        </button>
                      </>
                    )}

                    {app.status === 'COMPLETED' && !app.rating && (
                      <button
                        type="button"
                        onClick={() => go('job-detail', { jobId: job.id })}
                        className="h-9 px-3.5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>İşvereni Değerlendir</span>
                      </button>
                    )}

                    {isNegative && (
                      <button
                        type="button"
                        onClick={() => go('job-detail', { jobId: job.id })}
                        className="h-9 px-3 rounded-md border border-[#D6D3C9] dark:border-[#2B322E] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>İlan Detayı</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Kamera QR Tarayıcı */}
      {qrScanOpen && !qrManualMode && (
        <QrScannerCamera
          onScan={handleQrCameraScan}
          onClose={() => setQrScanOpen(false)}
          loading={qrLoading}
          title="Saha QR Kod Okut"
          description="İşverenin gösterdiği vardiya QR kodunu kamerayla okutun"
          onSwitchManual={() => setQrManualMode(true)}
        />
      )}

      {/* Manuel QR Token Girişi */}
      <Dialog
        open={qrScanOpen && qrManualMode}
        onOpenChange={(v) => {
          if (!v) {
            setQrScanOpen(false)
            setQrManualMode(false)
          }
        }}
      >
        <DialogContent className="max-w-md bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28] rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#141615] dark:text-white">
              <QrCode className="w-4 h-4 text-[#0D6847]" />
              Manuel QR Kodu Girişi
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97]">
              Kameraya erişilemiyorsa doğrulama kodunu aşağıya girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold">QR Doğrulama Kodu</Label>
              <Input
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="Kod değerini yapıştırın..."
                className="h-10 mt-1 font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleQrManualScan}
              disabled={qrLoading}
              className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              {qrLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <QrCode className="w-3.5 h-3.5" />
              )}
              <span>Doğrula</span>
            </button>
            <button
              type="button"
              onClick={() => setQrManualMode(false)}
              className="w-full h-10 rounded-md border border-[#D6D3C9] dark:border-[#2B322E] text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera ile Okut</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
