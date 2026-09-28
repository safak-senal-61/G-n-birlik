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
          {/* Başlık kartı */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-emerald-100 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                  {categoryIcon(job.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">{job.title}</h1>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs sm:text-sm text-gray-600">
                    <span className="font-medium text-emerald-700">{categoryLabel(job.category)}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{job.district}, {job.city}</span>
                    </span>
                    <Badge variant="outline" className={urgency.color + ' border text-[10px] sm:text-xs'}>
                      {urgency.text}
                    </Badge>
                    {job.employer?.isVerified && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px] sm:text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1 flex-shrink-0" />
                        Doğrulanmış
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-2">
                    <span>{formatDate(job.createdAt)} yayınlandı</span>
                    <span>•</span>
                    <span>{job.viewCount} görüntülenme</span>
                    <span>•</span>
                    <span>{job.applicationCount} başvuru</span>
                  </div>
                </div>
              </div>

              {/* Aksiyonlar */}
              {!isOwner && (
                <div className="flex gap-2 mt-4 sm:mt-6 flex-wrap">
                  {canApply && (
                    <Button
                      className="flex-1 min-w-[160px] h-11 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setApplyDialog(true)}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Bu İşe Başvur
                    </Button>
                  )}
                  {myApplication && (
                    <Button variant="outline" className="flex-1 min-w-[160px] h-11" disabled>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {statusLabel(myApplication.status).text}
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="h-11 w-11" onClick={handleSave}>
                    <Heart className={`w-4 h-4 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => toast.success('Paylaşım linki kopyalandı!')}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {isOwner && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-900">
                    Bu ilan size ait. Başvuruları görmek için <Button variant="link" className="p-0 h-auto text-amber-700 underline" onClick={() => go('my-jobs')}>İlanlarım</Button> sayfasına gidin.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Açıklama */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">İş Tanımı</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">{job.description}</p>

              {job.requiredSkills?.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Aranan Yetenekler</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {job.requiredSkills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="bg-emerald-50 text-emerald-700">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Konum kartı - Gerçek Leaflet haritası */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                İş Konumu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="rounded-lg overflow-hidden mb-3 h-[200px] sm:h-[280px]">
                <JobMap
                  jobs={jobForMap}
                  userCoords={null}
                  height="100%"
                />
              </div>
              <div className="space-y-1 text-sm">
                {job.address && (
                  <p className="font-medium text-gray-900 flex items-start gap-1.5">
                    <Navigation className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                    <span>{job.address}</span>
                  </p>
                )}
                <p className="text-gray-600 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  {job.district}, {job.city}
                </p>
                {job.locationNote && (
                  <p className="text-gray-500 italic mt-2 bg-amber-50 p-2 rounded">💡 {job.locationNote}</p>
                )}
                <div className="text-xs text-gray-400 mt-2 font-mono">
                  📍 {job.latitude.toFixed(5)}, {job.longitude.toFixed(5)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ: Yan panel - özet bilgiler */}
        <div className="space-y-4">
          {/* Ücret */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium mb-1">
                <Wallet className="w-4 h-4" />
                Ücret
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-700 break-all">
                {formatWage(job.wageAmount, job.wageType)}
              </div>
              {job.isWageNegotiable && (
                <Badge variant="outline" className="mt-2 bg-white">
                  Pazarlık Edilebilir
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Tarih ve saat */}
          <Card>
            <CardContent className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">İş Tarihi</div>
                  <div className="font-semibold text-sm sm:text-base">{formatDate(job.workDate)}</div>
                  <div className="text-xs sm:text-sm text-emerald-600 font-medium">{daysUntil(job.workDate)}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Çalışma Saatleri</div>
                  <div className="font-semibold text-sm sm:text-base">{job.startTime} - {job.endTime}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{job.durationHours} saat</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">Açık Pozisyon</div>
                  <div className="font-semibold text-sm sm:text-base">{remaining} / {job.openingsTotal} kişi</div>
                  <div className="text-xs sm:text-sm text-gray-500">{job.applicationCount} başvuru alındı</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* İşveren kartı */}
          <Card>
            <CardContent className="p-4 sm:p-5">
              <div className="text-xs text-gray-500 mb-2">İşveren</div>
              <div className="flex items-center gap-3">
                <Avatar className="w-11 h-11 sm:w-12 sm:h-12 border-2 border-emerald-200 flex-shrink-0">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                    {initials(job.employer?.companyName || job.employer?.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                    {job.employer?.companyName || job.employer?.fullName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {job.employer?.ratingAvg || '0.0'} ({job.employer?.ratingCount || 0})
                    </span>
                    {job.employer?.isVerified && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px]">
                        Doğrulanmış
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {job.employer?.bio && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">{job.employer.bio}</p>
              )}

              {!isOwner && (
                <Button variant="outline" className="w-full mt-4 h-11" onClick={handleSendMessage}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Mesaj Gönder
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Başvuru Dialog - Mobil uyumlu */}
      <Dialog open={applyDialog} onOpenChange={setApplyDialog}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">İş Başvurusu</DialogTitle>
            <DialogDescription className="text-sm">
              "{job.title}" ilanına başvurun. İşverene kendinizden bahsedin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Başvuru Mesajı</Label>
              <Textarea
                placeholder="Merhaba, bu işe uygun adayım çünkü..."
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={5}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">Kendinizi tanıtın, deneyim ve yeteneklerinizi paylaşın.</p>
            </div>

            {job.isWageNegotiable && (
              <div className="space-y-2">
                <Label className="text-sm">Teklif Ettiğiniz Ücret (₺) - Opsiyonel</Label>
                <input
                  type="number"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="örn: 2500"
                  value={proposedWage}
                  onChange={(e) => setProposedWage(e.target.value)}
                />
                <p className="text-xs text-gray-500">İlan pazarlık açık. Kendi ücret teklifinizi belirtebilirsiniz.</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setApplyDialog(false)} className="w-full sm:w-auto h-11">İptal</Button>
            <Button onClick={handleApply} disabled={applying} className="w-full sm:w-auto h-11 bg-emerald-600 hover:bg-emerald-700">
              {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Başvuruyu Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
