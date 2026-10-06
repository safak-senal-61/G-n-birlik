'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { jobsApi, applicationsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MapPin, Clock, Users, Star, Briefcase, Calendar, Wallet, MessageSquare, Heart, Share2, AlertCircle, CheckCircle2, Loader2, Phone, Navigation } from 'lucide-react'
import { formatWage, formatDate, categoryLabel, categoryIcon, urgencyLabel, daysUntil, statusLabel, initials } from '@/lib/format'
import { toast } from 'sonner'

// Leaflet haritasını dinamik import ile yükle (SSR'siz)
const JobMap = dynamic(() => import('@/components/shared/job-map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
    </div>
  ),
})

export default function JobDetailScreen() {
  const { selectedJobId, go, back } = useApp()
  const { user } = useAuth()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [applyDialog, setApplyDialog] = useState(false)
  const [applyMessage, setApplyMessage] = useState('')
  const [proposedWage, setProposedWage] = useState('')
  const [applying, setApplying] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!selectedJobId) return
    loadJob()
  }, [selectedJobId])

  const loadJob = async () => {
    setLoading(true)
    try {
      const data = await jobsApi.get(selectedJobId!)
      setJob(data)
    } catch (err: any) {
      toast.error('İlan yüklenemedi: ' + err.message)
      back()
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    setApplying(true)
    try {
      await applicationsApi.create({
        jobId: selectedJobId!,
        message: applyMessage,
        proposedWage: proposedWage ? Number(proposedWage) : undefined,
      })
      toast.success('Başvurunuz gönderildi! 🎉')
      setApplyDialog(false)
      setApplyMessage('')
      setProposedWage('')
      loadJob()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setApplying(false)
    }
  }

  const handleSave = async () => {
    try {
      const result = await jobsApi.save(selectedJobId!)
      setSaved(!result.removed)
      toast.success(result.removed ? 'Kayıtlardan kaldırıldı.' : 'İlan kaydedildi! ❤️')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSendMessage = async () => {
    if (!job?.employer) return
    try {
      await import('@/lib/api').then(({ conversationsApi }) =>
        conversationsApi.sendMessage({
          recipientId: job.employer.id,
          jobId: job.id,
          content: `Merhaba, "${job.title}" ilanınız hakkında bilgi almak istiyorum.`,
        })
      )
      toast.success('Mesaj gönderildi!')
      go('messages')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!job) return null

  const isOwner = user?.id === job.employerId
  const myApplication = job.myApplication
  const urgency = urgencyLabel(job.urgency)
  const remaining = job.openingsTotal - job.openingsFilled
  const canApply = user?.role === 'WORKER' && !isOwner && !myApplication && job.status === 'OPEN'

  // Job'ı JobMap'in beklediği formata çevir
  const jobForMap = job ? [{
    id: job.id,
    title: job.title,
    description: job.description,
    category: job.category,
    workDate: job.workDate,
    startTime: job.startTime,
    endTime: job.endTime,
    wageAmount: job.wageAmount,
    wageType: job.wageType,
    isWageNegotiable: job.isWageNegotiable,
    city: job.city,
    district: job.district,
    address: job.address,
    latitude: job.latitude,
    longitude: job.longitude,
    urgency: job.urgency,
    openingsTotal: job.openingsTotal,
    openingsFilled: job.openingsFilled,
    distanceKm: job.distanceKm,
    employer: job.employer,
  }] : []

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Sol: Ana içerik */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Başlık kartı - 3D Spatial */}
          <div className="card-3d-spatial rounded-3xl p-5 sm:p-7 border border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-md preserve-3d">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-950/60 dark:to-teal-950/40 border-t border-white/90 dark:border-emerald-500/40 border-b-2 border-emerald-300 dark:border-b-emerald-600 flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.2)] translate-z-4">
                {categoryIcon(job.category)}
              </div>
              <div className="flex-1 min-w-0 preserve-3d">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight translate-z-2">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 translate-z-2">
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60">
                    {categoryLabel(job.category)}
                  </span>
                  <span className="hidden sm:inline text-slate-400">•</span>
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="truncate">{job.district}, {job.city}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] sm:text-xs ${urgency.color} border`}>
                    {urgency.text}
                  </span>
                  {job.employer?.isVerified && (
                    <span className="badge-3d-emerald px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      ONAYLI İŞVEREN
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-white/10">
                  <span>{formatDate(job.createdAt)} yayınlandı</span>
                  <span>•</span>
                  <span>{job.viewCount} görüntülenme</span>
                  <span>•</span>
                  <span>{job.applicationCount} başvuru</span>
                </div>
              </div>
            </div>

            {/* Aksiyonlar - 3D Tactile Buttons */}
            {!isOwner && (
              <div className="flex gap-2.5 mt-5 sm:mt-6 flex-wrap preserve-3d">
                {canApply && (
                  <button
                    type="button"
                    className="btn-3d-emerald btn-3d-pill flex-1 min-w-[180px] h-12 text-sm font-black flex items-center justify-center gap-2 translate-z-4"
                    onClick={() => setApplyDialog(true)}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Bu İşe Başvur</span>
                  </button>
                )}
                {myApplication && (
                  <button
                    type="button"
                    className="btn-3d-white btn-3d-pill flex-1 min-w-[180px] h-12 text-sm font-bold flex items-center justify-center gap-2 text-slate-900 dark:text-slate-100"
                    disabled
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Başvuru Durumu: {statusLabel(myApplication.status).text}</span>
                  </button>
                )}
                <button
                  type="button"
                  className="btn-3d-white h-12 w-12 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-red-600"
                  onClick={handleSave}
                  title={saved ? 'Kaydedilenlerden Çıkar' : 'Kaydet'}
                  aria-label={saved ? 'Kaydedilenlerden Çıkar' : 'İlanı Kaydet'}
                >
                  <Heart className={`w-5 h-5 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                </button>
                <button
                  type="button"
                  className="btn-3d-white h-12 w-12 rounded-2xl flex items-center justify-center text-slate-700 dark:text-slate-200"
                  onClick={() => toast.success('Paylaşım linki kopyalandı! 📋')}
                  title="Paylaş"
                  aria-label="İlanı Paylaş"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            )}

            {isOwner && (
              <div className="card-3d-spatial bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-800/60 rounded-2xl p-4 mt-5 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
                  Bu ilan size ait. Başvuruları yönetmek için{' '}
                  <button type="button" className="font-bold underline text-amber-800 dark:text-amber-300" onClick={() => go('my-jobs')}>
                    İlanlarım
                  </button>{' '}
                  bölümüne geçebilirsiniz.
                </p>
              </div>
            )}
          </div>

          {/* Açıklama */}
          <Card className="rounded-2xl border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 card-3d-spatial overflow-hidden">
            <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/10">
              <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-slate-100">İş Tanımı</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-4">
              <p className="text-sm sm:text-base text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{job.description}</p>

              {job.requiredSkills?.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Aranan Yetenekler</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {job.requiredSkills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Konum kartı - Gerçek Leaflet haritası */}
          <Card className="rounded-2xl border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 card-3d-spatial overflow-hidden">
            <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/10">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                İş Konumu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-4">
              <div className="rounded-xl overflow-hidden mb-3 h-[200px] sm:h-[280px] border border-slate-200 dark:border-white/10">
                <JobMap
                  jobs={jobForMap}
                  userCoords={null}
                  height="100%"
                />
              </div>
              <div className="space-y-1 text-sm">
                {job.address && (
                  <p className="font-medium text-gray-900 dark:text-slate-100 flex items-start gap-1.5">
                    <Navigation className="w-3.5 h-3.5 mt-0.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <span>{job.address}</span>
                  </p>
                )}
                <p className="text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {job.district}, {job.city}
                </p>
                {job.locationNote && (
                  <p className="text-gray-700 dark:text-amber-200 italic mt-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 p-2.5 rounded-xl">💡 {job.locationNote}</p>
                )}
                <div className="text-xs text-gray-400 dark:text-slate-500 mt-2 font-mono">
                  📍 {job.latitude.toFixed(5)}, {job.longitude.toFixed(5)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ: Yan panel - özet bilgiler */}
        <div className="space-y-4">
          {/* Ücret - 3D Gold / Emerald Vault Card */}
          <div className="card-3d-spatial rounded-3xl p-5 border border-emerald-300/80 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-500/10 dark:from-emerald-950/40 via-teal-500/5 dark:via-teal-950/20 to-white dark:to-slate-900 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.15)] preserve-3d">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-wider mb-1 translate-z-2">
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Net Günlük Yevmiye</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight break-all translate-z-4">
              {formatWage(job.wageAmount, job.wageType)}
            </div>
            {job.isWageNegotiable && (
              <span className="inline-block mt-2 badge-3d-emerald px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                Pazarlık Edilebilir
              </span>
            )}
            <div className="mt-3.5 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Emanet Güvencesi: Yevmiye havuzda rezerve edilmiştir</span>
            </div>
          </div>

          {/* Tarih ve saat - 3D Spatial */}
          <div className="card-3d-spatial rounded-3xl p-5 border border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
                <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">İş Tarihi</div>
                <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">{formatDate(job.workDate)}</div>
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">{daysUntil(job.workDate)}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Mesai Saatleri</div>
                <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">{job.startTime} - {job.endTime}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">{job.durationHours} saat toplam süre</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Kontenjan Durumu</div>
                <div className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">{remaining} / {job.openingsTotal} kişi kaldı</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{job.applicationCount} başvuru yapıldı</div>
              </div>
            </div>
          </div>

          {/* İşveren kartı - 3D Spatial */}
          <div className="card-3d-spatial rounded-3xl p-5 border border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm">
            <div className="text-[11px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mb-2.5">İşveren Profili</div>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 border-2 border-emerald-400 shadow-sm flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-950/80 dark:to-teal-950/60 text-emerald-800 dark:text-emerald-300 font-black">
                  {initials(job.employer?.companyName || job.employer?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-slate-900 dark:text-slate-100 truncate text-sm sm:text-base">
                  {job.employer?.companyName || job.employer?.fullName}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-0.5 font-bold text-slate-700 dark:text-slate-300">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    {job.employer?.ratingAvg || '0.0'} ({job.employer?.ratingCount || 0})
                  </span>
                  {job.employer?.isVerified && (
                    <span className="badge-3d-emerald px-1.5 py-0.2 rounded-full text-[9px] font-black">
                      ONAYLI
                    </span>
                  )}
                </div>
              </div>
            </div>

            {job.employer?.bio && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 line-clamp-3 leading-relaxed">{job.employer.bio}</p>
            )}

            {!isOwner && (
              <button
                type="button"
                className="btn-3d-white btn-3d-pill w-full mt-4 h-11 text-xs font-bold flex items-center justify-center gap-2 text-slate-800 dark:text-slate-200"
                onClick={handleSendMessage}
              >
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>İşverene Mesaj Gönder</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Başvuru Dialog - Mobil uyumlu */}
      <Dialog open={applyDialog} onOpenChange={setApplyDialog}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg dark:text-slate-100">İş Başvurusu</DialogTitle>
            <DialogDescription className="text-sm dark:text-slate-400">
              "{job.title}" ilanına başvurun. İşverene kendinizden bahsedin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm dark:text-slate-300">Başvuru Mesajı</Label>
              <Textarea
                placeholder="Merhaba, bu işe uygun adayım çünkü..."
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={5}
                className="text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400">Kendinizi tanıtın, deneyim ve yeteneklerinizi paylaşın.</p>
            </div>

            {job.isWageNegotiable && (
              <div className="space-y-2">
                <Label className="text-sm dark:text-slate-300">Teklif Ettiğiniz Ücret (₺) - Opsiyonel</Label>
                <input
                  type="number"
                  className="flex h-11 w-full rounded-md border border-input bg-background dark:bg-slate-800 dark:border-white/10 dark:text-white px-3 py-2 text-sm"
                  placeholder="örn: 2500"
                  value={proposedWage}
                  onChange={(e) => setProposedWage(e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-slate-400">İlan pazarlık açık. Kendi ücret teklifinizi belirtebilirsiniz.</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setApplyDialog(false)} className="w-full sm:w-auto h-11 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200">İptal</Button>
            <Button onClick={handleApply} disabled={applying} className="w-full sm:w-auto h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Başvuruyu Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
