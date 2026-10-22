'use client'

import { useState, useEffect } from 'react'
import { jobsApi, applicationsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Plus,
  Users,
  Clock,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  MessageSquare,
  QrCode,
  Loader2,
  ChevronDown,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const CATEGORY_SHORT_CODE: Record<string, string> = {
  INSAAT: 'İNŞ',
  RESTAURANT: 'RST',
  TEMIZLIK: 'TMZ',
  NAKLIYE: 'NKL',
  TARIM: 'TRM',
  TEKNIK: 'TKN',
  SAGLIK: 'BKM',
  DIGER: 'GNL',
}

export default function MyJobsScreen() {
  const { go } = useApp()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [appDialog, setAppDialog] = useState<{ job: any; apps: any[] } | null>(null)
  const [qrModal, setQrModal] = useState<{ appId: string; type: 'CHECK_IN' | 'CHECK_OUT' } | null>(
    null
  )
  const [qrData, setQrData] = useState<any>(null)
  const [qrLoading, setQrLoading] = useState(false)

  const loadJobs = async () => {
    setLoading(true)
    try {
      const result = await jobsApi.list({
        employerId: user!.id,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        pageSize: 50,
      })
      setJobs(result.items)

      const appsMap: Record<string, any[]> = {}
      await Promise.all(
        result.items.map(async (job: any) => {
          try {
            const apps = await applicationsApi.byJob(job.id)
            appsMap[job.id] = apps
          } catch {
            appsMap[job.id] = []
          }
        })
      )
      setApplications(appsMap)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadJobs()
  }, [user, statusFilter])

  const handleStatusChange = async (jobId: string, status: string) => {
    const apps = applications[jobId] || []
    const hasInProgress = apps.some((a) => a.status === 'IN_PROGRESS')
    const hasAccepted = apps.some((a) => a.status === 'ACCEPTED')

    if (status === 'CANCELLED') {
      if (hasInProgress) {
        toast.error('Çalışan giriş yapmış ve mesai başlamıştır. Devam eden bir iş iptal edilemez.')
        return
      }
      if (hasAccepted) {
        const confirmCancel = confirm(
          'DİKKAT: Bu ilanda onaylanmış çalışan bulunmaktadır!\n\n' +
            '• İşi iptal ederseniz ve iş başlangıç saatine 12 saatten az kalmışsa, çalışanın yol ve zaman mağduriyetini karşılamak adına emanetten %30 yol tazminatı çalışanın cüzdanına aktarılır.\n' +
            '• Kalan emanet tutarı cüzdanınıza iade edilir.\n\n' +
            'İlanı yine de iptal etmek istiyor musunuz?'
        )
        if (!confirmCancel) return
      } else {
        if (
          !confirm(
            'Bu ilanı iptal etmek istediğinize emin misiniz? Emanet tutarı cüzdanınıza iade edilecektir.'
          )
        )
          return
      }
    } else if (status === 'CLOSED') {
      if (hasAccepted) {
        toast.info(
          'İlan yeni başvurulara kapatıldı. Onaylanmış çalışanınızla vardiya planlandığı gibi devam edecektir.'
        )
      }
    }

    try {
      await jobsApi.updateStatus(jobId, status)
      toast.success('İlan durumu güncellendi.')
      loadJobs()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (jobId: string) => {
    const apps = applications[jobId] || []
    const hasAcceptedOrActive = apps.some((a) =>
      ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status)
    )
    if (hasAcceptedOrActive) {
      toast.error(
        'Onaylanmış veya devam eden çalışanı olan ilanlar silinemez. İptal etmek için Durum Değiştir menüsünü kullanabilirsiniz.'
      )
      return
    }
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return
    try {
      await jobsApi.delete(jobId)
      toast.success('İlan silindi.')
      loadJobs()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleAppStatus = async (appId: string, status: string) => {
    try {
      await applicationsApi.updateStatus(appId, status)
      toast.success('Başvuru durumu güncellendi.')
      if (appDialog) {
        const updated = appDialog.apps.map((a) => (a.id === appId ? { ...a, status } : a))
        setAppDialog({ ...appDialog, apps: updated })
      }
      loadJobs()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleGenerateQr = async (appId: string, type: 'CHECK_IN' | 'CHECK_OUT') => {
    setQrLoading(true)
    setQrData(null)
    try {
      const res = await fetch(`/api/v1/applications/${appId}/qr-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (data.success) {
        setQrData(data.data)
        setQrModal({ appId, type })
      } else {
        toast.error(data.error || 'QR üretilemedi')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setQrLoading(false)
    }
  }

  const FILTERS = [
    { value: 'ALL', label: 'Tüm İlanlar' },
    { value: 'OPEN', label: 'Aktif' },
    { value: 'FILLED', label: 'Kadrosu Dolu' },
    { value: 'CLOSED', label: 'Kapalı' },
    { value: 'CANCELLED', label: 'İptal' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8D5CC] dark:border-[#262C29] pb-5">
        <div className="space-y-1">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
            İŞVEREN VARDİYA MASASI • İLAN & ADAY YÖNETİMİ
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141615] dark:text-white">
            İlanlarım ve Başvurular
          </h1>
          <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
            Yayınladığınız vardiyaları, emanet blokajlarını ve QR mesai giriş-çıkışlarını yönetin.
          </p>
        </div>
        <button
          type="button"
          onClick={() => go('post-job')}
          className="h-10 px-4 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni İlan Yayınla</span>
        </button>
      </div>

      {/* Filtre Sekmeleri */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map((f) => {
          const active = statusFilter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`h-9 px-3.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                active
                  ? 'bg-[#141615] text-white border-[#141615] dark:bg-[#F2F1ED] dark:text-[#141615] dark:border-[#F2F1ED]'
                  : 'bg-white dark:bg-[#141716] text-[#5C615E] dark:text-[#949B97] border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg bg-[#E9E7E0] dark:bg-[#181C1A]" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-8 sm:p-12 text-center space-y-4">
          <div className="w-10 h-10 rounded-md bg-[#F0EFEA] dark:bg-[#1E2421] border border-[#E2E0D8] dark:border-[#2C3330] flex items-center justify-center mx-auto text-[#5C615E] dark:text-[#949B97]">
            <Users className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-bold text-base text-[#141615] dark:text-white">
              Bu filtrede ilanınız bulunmuyor
            </h3>
            <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
              Yeni bir günlük iş ilanı açarak semtinizdeki doğrulanmış çalışanlara hemen bildirim gönderebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => go('post-job')}
            className="h-10 px-5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>İlk İlanı Oluştur</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {jobs.map((job) => {
            const apps = applications[job.id] || []
            const pendingApps = apps.filter((a) => a.status === 'PENDING').length
            const acceptedApps = apps.filter((a) => a.status === 'ACCEPTED').length
            const status = statusLabel(job.status)
            const catCode = CATEGORY_SHORT_CODE[job.category] || 'İŞ'

            return (
              <article
                key={job.id}
                className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#F0EFEA] dark:bg-[#1E2421] text-[#454A47] dark:text-[#B8C0BC] border border-[#E2E0D8] dark:border-[#2C3330]">
                        {catCode} • {categoryLabel(job.category)}
                      </span>
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#EAF3EE] text-[#0D6847] border border-[#C5DDD0] dark:bg-[#162921] dark:text-[#5CD6A5] dark:border-[#244738]">
                        {status.text}
                      </span>
                      {job.escrowStatus === 'HELD' && (
                        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#EAF3EE] text-[#0D6847] border border-[#C5DDD0] dark:bg-[#162921] dark:text-[#5CD6A5] dark:border-[#244738]">
                          EMANET: {(job.escrowAmount || 0).toLocaleString('tr-TR')}₺
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => go('job-detail', { jobId: job.id })}
                      className="text-base sm:text-lg font-bold text-[#141615] dark:text-white hover:text-[#0D6847] dark:hover:text-[#5CD6A5] cursor-pointer transition-colors"
                    >
                      {job.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#5C615E] dark:text-[#949B97]">
                      <span>
                        {job.district}, {job.city}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {daysUntil(job.workDate)}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[11px] inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {job.viewCount} görüntülenme
                      </span>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="font-mono text-lg font-bold text-[#0D6847] dark:text-[#5CD6A5]">
                      {formatWage(job.wageAmount, job.wageType)}
                    </div>
                    <div className="font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
                      KADRO: {job.openingsFilled}/{job.openingsTotal} DOLU
                    </div>
                  </div>
                </div>

                {/* Alt Cetvel: Başvuru Özeti ve Aksiyonlar */}
                <div className="pt-3.5 border-t border-[#ECEAE4] dark:border-[#222624] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAppDialog({ job, apps })}
                      className="h-8 px-3 rounded-md bg-[#F0EFEA] dark:bg-[#1E2421] hover:border-[#0D6847] border border-[#E2E0D8] dark:border-[#2C3330] font-mono text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
                      <span>{apps.length} Başvuru</span>
                    </button>

                    {pendingApps > 0 && (
                      <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-sm bg-[#FBEEE9] dark:bg-[#2A1915] text-[#B43B21] dark:text-[#F28B73] border border-[#EFC7BD] dark:border-[#4A251D]">
                        {pendingApps} Bekleyen
                      </span>
                    )}

                    {acceptedApps > 0 && (
                      <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-sm bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5] border border-[#C5DDD0] dark:border-[#244738]">
                        {acceptedApps} Onaylı
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAppDialog({ job, apps })}
                      disabled={apps.length === 0}
                      className="h-9 px-3.5 rounded-md bg-[#0D6847] hover:bg-[#095237] disabled:opacity-40 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Adayları Yönet</span>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-9 px-3 rounded-md bg-white dark:bg-[#141716] border border-[#D6D3C9] dark:border-[#2B322E] hover:bg-[#F0EFEA] dark:hover:bg-[#1D2220] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Durum Değiştir</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28]">
                        <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'OPEN')}>
                          Aktif Yap
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'FILLED')}>
                          Dolu İşaretle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'CLOSED')}>
                          Kapat
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(job.id, 'CANCELLED')}
                          className="text-[#C84B31] dark:text-[#F28B73]"
                        >
                          İptal Et
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <button
                      type="button"
                      onClick={() => handleDelete(job.id)}
                      className="h-9 w-9 rounded-md border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#C84B31] text-[#5C615E] hover:text-[#C84B31] flex items-center justify-center transition-colors cursor-pointer"
                      title="İlanı Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Adaylar & QR Yönetimi Dialog */}
      <Dialog open={!!appDialog} onOpenChange={(v) => !v && setAppDialog(null)}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-[#141615] dark:text-white">
              {appDialog?.job.title} — Başvurular
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97]">
              Toplam {appDialog?.apps.length || 0} aday başvurdu. Onay, ret ve QR mesai işlemlerini buradan yönetebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[62vh] overflow-y-auto pr-1">
            {appDialog?.apps.map((app) => {
              const status = statusLabel(app.status)
              return (
                <div
                  key={app.id}
                  className="p-4 rounded-lg bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="w-9 h-9 rounded-md border border-[#E2E0D8] dark:border-[#252B28]">
                        <AvatarFallback className="rounded-md bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5] font-mono text-xs font-bold">
                          {initials(app.worker?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-[#141615] dark:text-white truncate">
                          {app.worker?.fullName}
                        </h4>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
                          {app.worker?.ratingAvg > 0 && (
                            <span>
                              PUAN: {app.worker?.ratingAvg} ({app.worker?.ratingCount})
                            </span>
                          )}
                          <span>• {formatDate(app.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] text-[#141615] dark:text-[#F2F1ED] shrink-0">
                      {status.text}
                    </span>
                  </div>

                  {app.message && (
                    <p className="text-xs text-[#4A4F4C] dark:text-[#A5ACA8] bg-white dark:bg-[#141716] p-2.5 rounded border border-[#ECEAE4] dark:border-[#222624]">
                      &ldquo;{app.message}&rdquo;
                    </p>
                  )}

                  {app.status === 'PENDING' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAppStatus(app.id, 'ACCEPTED')}
                        className="h-9 px-3.5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Onayla</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAppStatus(app.id, 'REJECTED')}
                        className="h-9 px-3.5 rounded-md border border-[#EFC7BD] dark:border-[#4A251D] bg-[#FBEEE9] dark:bg-[#2A1915] text-[#B43B21] dark:text-[#F28B73] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reddet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAppDialog(null)
                          go('messages')
                        }}
                        className="h-9 px-3 rounded-md border border-[#D6D3C9] dark:border-[#2B322E] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Mesaj</span>
                      </button>
                    </div>
                  )}

                  {app.status === 'ACCEPTED' && (
                    <div className="space-y-2 pt-1">
                      <div className="p-2.5 rounded bg-[#EAF3EE] dark:bg-[#162921] border border-[#C5DDD0] dark:border-[#244738] text-xs text-[#0D6847] dark:text-[#5CD6A5]">
                        Aday onaylandı. Sabah vardiya başlangıcında Check-in QR kodu üretip çalışana okutun.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleGenerateQr(app.id, 'CHECK_IN')}
                          disabled={qrLoading}
                          className="h-9 px-3.5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {qrLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <QrCode className="w-3.5 h-3.5" />
                          )}
                          <span>Giriş (Check-in) QR Üret</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAppDialog(null)
                            go('messages')
                          }}
                          className="h-9 px-3 rounded-md border border-[#D6D3C9] dark:border-[#2B322E] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Mesaj</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {app.status === 'IN_PROGRESS' && (
                    <div className="space-y-2 pt-1">
                      <div className="p-2.5 rounded bg-[#F0EFEA] dark:bg-[#1E2421] border border-[#E2E0D8] dark:border-[#2C3330] text-xs text-[#141615] dark:text-[#F2F1ED]">
                        Mesai devam ediyor. Vardiya bittiğinde Çıkış (Check-out) QR kodu üretin.
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleGenerateQr(app.id, 'CHECK_OUT')}
                          disabled={qrLoading}
                          className="h-9 px-3.5 rounded-md bg-[#141615] dark:bg-[#F2F1ED] text-white dark:text-[#141615] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {qrLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <QrCode className="w-3.5 h-3.5" />
                          )}
                          <span>Çıkış (Check-out) QR Üret</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAppDialog(null)
                            go('messages')
                          }}
                          className="h-9 px-3 rounded-md border border-[#D6D3C9] dark:border-[#2B322E] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Mesaj</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {app.status === 'COMPLETED' && (
                    <div className="p-2.5 rounded bg-[#EAF3EE] dark:bg-[#162921] border border-[#C5DDD0] dark:border-[#244738] text-xs text-[#0D6847] dark:text-[#5CD6A5]">
                      Vardiya tamamlandı. Emanet ödeme aktarımı işleme alındı.
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Gösterim Modal */}
      <Dialog
        open={!!qrModal}
        onOpenChange={(v) => {
          if (!v) {
            setQrModal(null)
            setQrData(null)
          }
        }}
      >
        <DialogContent className="max-w-md bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28] rounded-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#141615] dark:text-white">
              <QrCode className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5]" />
              {qrModal?.type === 'CHECK_IN' ? 'Vardiya Giriş QR Kodu' : 'Vardiya Çıkış QR Kodu'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97]">
              Çalışanın kendi ekranından bu QR kodu okutması gerekir. Kod 5 dakika boyunca geçerlidir.
            </DialogDescription>
          </DialogHeader>
          {qrData ? (
            <div className="text-center py-4 space-y-3">
              <img
                src={qrData.qrImageDataUrl}
                alt="QR Kod"
                className="w-60 h-60 mx-auto rounded-lg border border-[#D8D5CC] bg-white p-2"
              />
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#141615] dark:text-white">
                  {qrData.application?.job?.title || 'Vardiya'}
                </p>
                <p className="text-xs text-[#5C615E] dark:text-[#949B97]">
                  Çalışan: {qrData.application?.worker?.fullName}
                </p>
                <p className="font-mono text-[11px] text-[#0D6847] dark:text-[#5CD6A5]">
                  SON GEÇERLİLİK: {new Date(qrData.expiresAt).toLocaleTimeString('tr-TR')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#0D6847]" />
              <p className="text-xs text-[#5C615E] mt-2">QR kodu oluşturuluyor...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
