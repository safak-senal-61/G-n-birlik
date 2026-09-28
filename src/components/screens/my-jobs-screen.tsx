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
    try {
      await jobsApi.updateStatus(jobId, status)
      toast.success('İlan durumu güncellendi.')
      loadJobs()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (jobId: string) => {
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">İlanlarım</h1>
          <p className="text-gray-600 mt-1 text-sm truncate">Yayınladığınız ilanları ve gelen başvuruları yönetin</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm" onClick={() => go('post-job')}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni İlan
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="ALL">Tümü</TabsTrigger>
          <TabsTrigger value="OPEN">Aktif</TabsTrigger>
          <TabsTrigger value="FILLED">Dolu</TabsTrigger>
          <TabsTrigger value="CLOSED">Kapalı</TabsTrigger>
          <TabsTrigger value="CANCELLED">İptal</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 sm:p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Henüz ilan vermediniz</h3>
            <p className="text-gray-600 mb-4">İlk iş ilanınızı vererek iş arayanlarla buluşun.</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => go('post-job')}>
              <Plus className="w-4 h-4 mr-2" />
              İlk İlanı Ver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const apps = applications[job.id] || []
            const pendingApps = apps.filter((a) => a.status === 'PENDING').length
            const acceptedApps = apps.filter((a) => a.status === 'ACCEPTED').length
            const status = statusLabel(job.status)

            return (
              <Card key={job.id} className="hover:shadow-md transition">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {categoryIcon(job.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="font-semibold text-gray-900 cursor-pointer hover:text-emerald-700"
                          onClick={() => go('job-detail', { jobId: job.id })}
                        >
                          {job.title}
                        </h3>
                        <Badge variant="outline" className={status.color + ' border flex-shrink-0'}>
                          {status.text}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="font-medium text-emerald-700">{formatWage(job.wageAmount, job.wageType)}</span>
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
                          className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
                        >
                          <Users className="w-4 h-4" />
                          {apps.length} Başvuru
                        </button>
                        {pendingApps > 0 && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            {pendingApps} Beklemede
                          </Badge>
                        )}
                        {acceptedApps > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            {acceptedApps} Onaylanan
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-gray-50">
                          {job.openingsFilled}/{job.openingsTotal} dolu
                        </Badge>
                      </div>

                      {/* Aksiyonlar */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 text-xs sm:text-sm"
                          onClick={() => setAppDialog({ job, apps })}
                          disabled={apps.length === 0}
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Başvuruları Gör
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm">
                              Durum Değiştir
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'OPEN')}>
                              Aktif Yap
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'FILLED')}>
                              Dolu İşaretle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'CLOSED')}>
                              Kapat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(job.id, 'CANCELLED')} className="text-red-600">
                              İptal Et
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(job.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Başvurular Dialog */}
      <Dialog open={!!appDialog} onOpenChange={(v) => !v && setAppDialog(null)}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{appDialog?.job.title} - Başvurular</DialogTitle>
            <DialogDescription>
              {appDialog?.apps.length || 0} başvuru var. Onaylamak veya reddetmek için aksiyon alın.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {appDialog?.apps.map((app) => {
              const status = statusLabel(app.status)
              return (
                <Card key={app.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                          {initials(app.worker?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-gray-900 truncate">{app.worker?.fullName}</h4>
                          <Badge variant="outline" className={status.color + ' border flex-shrink-0'}>
                            {status.text}
                          </Badge>
                        </div>

                        {app.workerSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {app.workerSkills.slice(0, 3).map((s: string) => (
                              <Badge key={s} variant="secondary" className="text-[10px] bg-gray-100">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {app.message && (
                          <p className="text-sm text-gray-600 mt-2 italic">"{app.message}"</p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
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
                              className="bg-green-600 hover:bg-green-700 h-9 text-xs sm:text-sm"
                              onClick={() => handleAppStatus(app.id, 'ACCEPTED')}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Onayla
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 text-red-600 hover:text-red-700 text-xs sm:text-sm"
                              onClick={() => handleAppStatus(app.id, 'REJECTED')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reddet
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 text-xs sm:text-sm"
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
                            <div className="w-full p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 mb-1">
                              ✅ Onaylandı. İşçi işe başlatmak için check-in QR kodu üretin.
                            </div>
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 h-9 text-xs sm:text-sm"
                              onClick={() => handleGenerateQr(app.id, 'CHECK_IN')}
                              disabled={qrLoading}
                            >
                              {qrLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <QrCode className="w-3 h-3 mr-1" />}
                              Check-in QR Üret
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 text-xs sm:text-sm"
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
                            <div className="w-full p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-800 mb-1">
                              🔵 İş devam ediyor. İş bitirildiğinde check-out QR üretin.
                            </div>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 h-9 text-xs sm:text-sm"
                              onClick={() => handleGenerateQr(app.id, 'CHECK_OUT')}
                              disabled={qrLoading}
                            >
                              {qrLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <QrCode className="w-3 h-3 mr-1" />}
                              Check-out QR Üret
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 text-xs sm:text-sm"
                              onClick={() => { setAppDialog(null); go('messages') }}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Mesaj
                            </Button>
                          </div>
                        )}

                        {/* COMPLETED: Ödeme bilgisi */}
                        {app.status === 'COMPLETED' && (
                          <div className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 mt-3">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-indigo-600" />
              {qrModal?.type === 'CHECK_IN' ? 'Check-in QR Kodu' : 'Check-out QR Kodu'}
            </DialogTitle>
            <DialogDescription>
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
                className="w-64 h-64 mx-auto rounded-xl border-2 border-indigo-200"
              />
              <div className="mt-4 space-y-1">
                <p className="text-lg font-bold text-gray-900">
                  {qrData.application?.job?.title || 'İş'}
                </p>
                <p className="text-sm text-gray-600">
                  İşçi: {qrData.application?.worker?.fullName}
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  ⏰ Geçerlilik: {new Date(qrData.expiresAt).toLocaleTimeString('tr-TR')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-indigo-600" />
              <p className="text-sm text-gray-500 mt-2">QR kodu üretiliyor...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
