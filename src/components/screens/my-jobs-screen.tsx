'use client'

import { useState, useEffect } from 'react'
import { jobsApi, applicationsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, Users, Clock, Wallet, Eye, Trash2, CheckCircle2, XCircle, MessageSquare, QrCode, Loader2 } from 'lucide-react'
import { formatWage, formatDate, categoryLabel, categoryIcon, statusLabel, daysUntil, initials } from '@/lib/format'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export default function MyJobsScreen() {
  const { go } = useApp()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [appDialog, setAppDialog] = useState<{ job: any; apps: any[] } | null>(null)
  const [qrModal, setQrModal] = useState<{ appId: string; type: 'CHECK_IN' | 'CHECK_OUT' } | null>(null)
  const [qrData, setQrData] = useState<any>(null)
  const [qrLoading, setQrLoading] = useState(false)

  const loadJobs = async () => {
    setLoading(true)
    try {
      const result = await jobsApi.list({ employerId: user!.id, status: statusFilter === 'ALL' ? undefined : statusFilter, pageSize: 50 })
      setJobs(result.items)

      // Her ilan için başvuruları getir
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
        toast.error('İşçi check-in yapmış ve mesai başlamıştır. Devam eden bir iş iptal edilemez!')
        return
      }
      if (hasAccepted) {
        const confirmCancel = confirm(
          '⚠️ DİKKAT: Bu ilanda onaylanmış işçi bulunmaktadır!\n\n' +
          '• İşi iptal ederseniz ve iş başlangıç saatine 12 saatten az kalmışsa, işçinin yol ve zaman mağduriyetini karşılamak adına emanetten yol tazminatı (yevmiyenin %30\'u) işçinin cüzdanına aktarılacaktır.\n' +
          '• Kalan emanet tutarı cüzdanınıza iade edilecektir.\n\n' +
          'İlanı yine de iptal etmek istiyor musunuz?'
        )
        if (!confirmCancel) return
      } else {
        if (!confirm('Bu ilanı iptal etmek istediğinize emin misiniz? Emanet tutarı cüzdanınıza iade edilecektir.')) return
      }
    } else if (status === 'CLOSED') {
      if (hasAccepted) {
        toast.info('İlan yeni başvurulara kapatıldı. Onaylanmış işçinizle iş planlandığı gibi devam edecektir.')
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
    const hasAcceptedOrActive = apps.some((a) => ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status))
    if (hasAcceptedOrActive) {
      toast.error('Onaylanmış veya devam eden işçisi olan ilanlar silinemez! İptal etmek için Durum Değiştir menüsünü kullanabilirsiniz.')
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

  // QR check-in/check-out üret (işveren)
  const handleGenerateQr = async (appId: string, type: 'CHECK_IN' | 'CHECK_OUT') => {
    setQrLoading(true)
    setQrData(null)
    try {
      const res = await fetch(`/api/v1/applications/${appId}/qr-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
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

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">İlanlarım</h1>
          <p className="text-gray-600 dark:text-slate-400 mt-1 text-sm truncate">Yayınladığınız ilanları ve gelen başvuruları yönetin</p>
        </div>
        <button
          type="button"
          className="btn-3d-emerald btn-3d-pill px-5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-sm"
          onClick={() => go('post-job')}
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>Yeni İlan Ver</span>
        </button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-5">
        <TabsList className="flex-wrap inset-3d rounded-2xl p-1 gap-1">
          <TabsTrigger value="ALL" className="rounded-xl data-[state=active]:btn-3d-white data-[state=active]:text-emerald-800 font-bold">Tümü</TabsTrigger>
          <TabsTrigger value="OPEN" className="rounded-xl data-[state=active]:btn-3d-white data-[state=active]:text-emerald-800 font-bold">Aktif</TabsTrigger>
          <TabsTrigger value="FILLED" className="rounded-xl data-[state=active]:btn-3d-white data-[state=active]:text-emerald-800 font-bold">Dolu</TabsTrigger>
          <TabsTrigger value="CLOSED" className="rounded-xl data-[state=active]:btn-3d-white data-[state=active]:text-emerald-800 font-bold">Kapalı</TabsTrigger>
          <TabsTrigger value="CANCELLED" className="rounded-xl data-[state=active]:btn-3d-white data-[state=active]:text-emerald-800 font-bold">İptal</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card-3d-spatial rounded-3xl border-dashed border-2 border-slate-300 dark:border-slate-700 p-8 sm:p-12 text-center">
          <Users className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="font-extrabold text-slate-900 dark:text-white mb-1 text-base">Henüz ilan vermediniz</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm">İlk iş ilanınızı yayınlayarak bölgenizdeki kalifiye adaylara anında ulaşın.</p>
          <button
            type="button"
            className="btn-3d-emerald btn-3d-pill px-6 py-2.5 text-sm font-black inline-flex items-center gap-2"
            onClick={() => go('post-job')}
          >
            <Plus className="w-4 h-4" />
            <span>İlk İlanı Hemen Ver</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const apps = applications[job.id] || []
            const pendingApps = apps.filter((a) => a.status === 'PENDING').length
            const acceptedApps = apps.filter((a) => a.status === 'ACCEPTED').length
            const status = statusLabel(job.status)

            return (
              <div key={job.id} className="card-3d-spatial rounded-3xl p-5 border border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm hover:border-emerald-400/80 transition-all preserve-3d">
                <div>
                  <div className="flex items-start gap-4">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-950/70 dark:to-teal-950/70 border-t border-white/80 dark:border-white/10 border-b-2 border-emerald-300 dark:border-emerald-700/60 flex items-center justify-center text-2xl flex-shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.2)] translate-z-4">
                      {categoryIcon(job.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400"
                          onClick={() => go('job-detail', { jobId: job.id })}
                        >
                          {job.title}
                        </h3>
                        <Badge variant="outline" className={status.color + ' border flex-shrink-0'}>
                          {status.text}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-1">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">{formatWage(job.wageAmount, job.wageType)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {daysUntil(job.workDate)}
                        </span>
                        <span>•</span>
                        <span>{job.district}, {job.city}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {job.viewCount}
                        </span>
                      </div>

                      {/* Başvuru istatistikleri */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3">
                        <button
                          onClick={() => setAppDialog({ job, apps })}
                          className="flex items-center gap-1.5 text-sm bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                        >
                          <Users className="w-4 h-4" />
                          {apps.length} Başvuru
                        </button>
                        {pendingApps > 0 && (
                          <Badge variant="outline" className="bg-yellow-50 dark:bg-amber-950/60 text-yellow-700 dark:text-amber-300 border-yellow-300 dark:border-amber-700/60">
                            {pendingApps} Beklemede
                          </Badge>
                        )}
                        {acceptedApps > 0 && (
                          <Badge variant="outline" className="bg-green-50 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-300 border-green-300 dark:border-emerald-700/60">
                            {acceptedApps} Onaylanan
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-gray-50 dark:bg-slate-800 dark:text-slate-300 dark:border-white/10">
                          {job.openingsFilled}/{job.openingsTotal} dolu
                        </Badge>
                        {job.escrowStatus === 'HELD' && (
                          <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60">
                            🛡️ ₺{(job.escrowAmount || 0).toLocaleString('tr-TR')} Emanette
                          </Badge>
                        )}
                        {job.escrowStatus === 'RELEASED' && (
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700/60">
                            ✓ Emanet Ödendi
                          </Badge>
                        )}
                        {job.escrowStatus === 'REFUNDED' && (
                          <Badge variant="outline" className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-300 dark:border-slate-700">
                            ↩ Emanet İade Edildi
                          </Badge>
                        )}
                      </div>

                      {/* Aksiyonlar */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs sm:text-sm dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700"
                          onClick={() => setAppDialog({ job, apps })}
                          disabled={apps.length === 0}
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Başvuruları Gör
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700">
                              Durum Değiştir
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'OPEN')}>
                              Aktif Yap
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'FILLED')}>
                              Dolu İşaretle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'CLOSED')}>
                              Kapat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'CANCELLED')} className="text-red-600 dark:text-rose-400">
                              İptal Et
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {apps.some((a) => ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status)) ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 text-gray-300 dark:text-slate-600 hover:text-gray-400 cursor-not-allowed"
                            title="Onaylı işçisi olan ilanlar silinemez"
                            onClick={() => toast.error('Onaylanmış veya çalışan işçisi bulunan ilanlar silinemez! İptal için Durum Değiştir menüsünü kullanın.')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 text-red-600 hover:text-red-700 dark:hover:bg-red-950/40"
                            onClick={() => handleDelete(job.id)}
                            title="İlanı Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                  </div>
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {/* Başvurular Dialog */}
      <Dialog open={!!appDialog} onOpenChange={(v) => !v && setAppDialog(null)}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">{appDialog?.job.title} - Başvurular</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-slate-400">
              {appDialog?.apps.length || 0} başvuru var. Onaylamak veya reddetmek için aksiyon alın.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {appDialog?.apps.map((app) => {
              const status = statusLabel(app.status)
              return (
                <Card key={app.id} className="border-gray-200 dark:border-white/10 dark:bg-slate-850">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs">
                          {initials(app.worker?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white truncate">{app.worker?.fullName}</h4>
                          <Badge variant="outline" className={status.color + ' border flex-shrink-0'}>
                            {status.text}
                          </Badge>
                        </div>

                        {app.workerSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.workerSkills.slice(0, 3).map((s: string) => (
                              <Badge key={s} variant="secondary" className="text-[10px] bg-gray-100 dark:bg-slate-800 dark:text-slate-300">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {app.message && (
                          <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 italic">"{app.message}"</p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-slate-400 mt-2">
                          {app.worker?.ratingAvg > 0 && (
                            <span>⭐ {app.worker?.ratingAvg} ({app.worker?.ratingCount})</span>
                          )}
                          {app.proposedWage && (
                            <span>Teklif: ₺{app.proposedWage}</span>
                          )}
                          <span>{formatDate(app.createdAt)}</span>
                        </div>

                        {app.status === 'PENDING' && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-9 text-xs sm:text-sm font-semibold"
                              onClick={() => handleAppStatus(app.id, 'ACCEPTED')}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Onayla
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 text-red-600 hover:text-red-700 text-xs sm:text-sm dark:bg-slate-800 dark:border-white/10 dark:hover:bg-slate-700"
                              onClick={() => handleAppStatus(app.id, 'REJECTED')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reddet
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 text-xs sm:text-sm dark:text-slate-300 dark:hover:bg-slate-800"
                              onClick={() => {
                                setAppDialog(null)
                                go('messages')
                              }}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Mesaj
                            </Button>
                          </div>
                        )}

                        {/* ACCEPTED: QR Check-in üret */}
                        {app.status === 'ACCEPTED' && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            <div className="w-full p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 mb-1">
                              ✅ Onaylandı. İşçi işe başlatmak için check-in QR kodu üretin.
                            </div>
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs sm:text-sm font-semibold"
                              onClick={() => handleGenerateQr(app.id, 'CHECK_IN')}
                              disabled={qrLoading}
                            >
                              {qrLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <QrCode className="w-3 h-3 mr-1" />}
                              Check-in QR Üret
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 text-xs sm:text-sm dark:text-slate-300 dark:hover:bg-slate-800"
                              onClick={() => { setAppDialog(null); go('messages') }}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Mesaj
                            </Button>
                          </div>
                        )}

                        {/* IN_PROGRESS: QR Check-out üret */}
                        {app.status === 'IN_PROGRESS' && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            <div className="w-full p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs text-indigo-800 dark:text-indigo-300 mb-1">
                              🔵 İş devam ediyor. İş bitirildiğinde check-out QR üretin.
                            </div>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs sm:text-sm font-semibold"
                              onClick={() => handleGenerateQr(app.id, 'CHECK_OUT')}
                              disabled={qrLoading}
                            >
                              {qrLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <QrCode className="w-3 h-3 mr-1" />}
                              Check-out QR Üret
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 text-xs sm:text-sm dark:text-slate-300 dark:hover:bg-slate-800"
                              onClick={() => { setAppDialog(null); go('messages') }}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Mesaj
                            </Button>
                          </div>
                        )}

                        {/* COMPLETED: Ödeme bilgisi */}
                        {app.status === 'COMPLETED' && (
                          <div className="w-full p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg text-xs text-blue-800 dark:text-blue-300 mt-3">
                            ✅ İş tamamlandı. Ödeme talebi otomatik oluşturuldu, admin onayı bekleniyor.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Check-in/Check-out Modal */}
      <Dialog open={!!qrModal} onOpenChange={(v) => { if (!v) { setQrModal(null); setQrData(null) } }}>
        <DialogContent className="max-w-md dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {qrModal?.type === 'CHECK_IN' ? 'Check-in QR Kodu' : 'Check-out QR Kodu'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-slate-400">
              {qrModal?.type === 'CHECK_IN'
                ? 'İşçinin bu QR kodunu taraması gerekir. İşe başlamış sayılır.'
                : 'İşçinin bu QR kodunu taraması gerekir. İş tamamlanır ve ödeme talebi oluşturulur.'}
              <br />
              ⏰ QR 5 dakika geçerlidir.
            </DialogDescription>
          </DialogHeader>
          {qrData ? (
            <div className="text-center py-4">
              <img
                src={qrData.qrImageDataUrl}
                alt="QR Kod"
                className="w-64 h-64 mx-auto rounded-xl border-2 border-indigo-200 dark:border-indigo-800/80 bg-white p-2"
              />
              <div className="mt-4 space-y-1">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {qrData.application?.job?.title || 'İş'}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  İşçi: {qrData.application?.worker?.fullName}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ⏰ Geçerlilik: {new Date(qrData.expiresAt).toLocaleTimeString('tr-TR')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">QR kodu üretiliyor...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
