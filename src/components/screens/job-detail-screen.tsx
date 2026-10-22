'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { jobsApi, applicationsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  MapPin,
  Clock,
  Users,
  Star,
  Briefcase,
  Calendar,
  Wallet,
  MessageSquare,
  Heart,
  Share2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Navigation,
  ArrowLeft,
} from 'lucide-react'
import {
  formatWage,
  formatDate,
  categoryLabel,
  categoryIcon,
  daysUntil,
  statusLabel,
  initials,
} from '@/lib/format'
import { toast } from 'sonner'

const JobMap = dynamic(() => import('@/components/shared/job-map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#F0EFEA] dark:bg-[#181C1A] rounded-md">
      <Loader2 className="w-5 h-5 animate-spin text-[#0D6847]" />
    </div>
  ),
})

export default function JobDetailScreen() {
  const { selectedJobId, go, back, openAuthModal } = useApp()
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
      toast.success('Başvurunuz iletildi')
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
    if (!user) {
      openAuthModal({
        title: 'İlanı Kaydetmek İçin Giriş Yapın',
        description:
          'İlanları kaydetmek ve daha sonra hızlıca ulaşmak için hesabınıza giriş yapın.',
      })
      return
    }
    try {
      const result = await jobsApi.save(selectedJobId!)
      setSaved(!result.removed)
      toast.success(result.removed ? 'Kayıtlardan çıkarıldı' : 'İlan kaydedildi')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSendMessage = async () => {
    if (!user) {
      openAuthModal({
        title: 'İşverenle İletişim İçin Giriş Yapın',
        description:
          'İşveren ile mesajlaşmak ve vardiya detaylarını sormak için oturum açın.',
      })
      return
    }
    if (!job?.employer) return
    try {
      await import('@/lib/api').then(({ conversationsApi }) =>
        conversationsApi.sendMessage({
          recipientId: job.employer.id,
          jobId: job.id,
          content: `Merhaba, "${job.title}" ilanınız hakkında bilgi almak istiyorum.`,
        })
      )
      toast.success('Mesaj gönderildi')
      go('messages')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[#E2E0D8] dark:bg-[#252B28] rounded w-48" />
          <div className="h-32 bg-[#E2E0D8] dark:bg-[#252B28] rounded-lg" />
          <div className="h-48 bg-[#E2E0D8] dark:bg-[#252B28] rounded-lg" />
        </div>
      </div>
    )
  }

  if (!job) return null

  const isOwner = user?.id === job.employerId
  const myApplication = job.myApplication
  const isUrgent = job.urgency === 'URGENT'
  const remaining = job.openingsTotal - job.openingsFilled
  const canApply = user?.role === 'WORKER' && !isOwner && !myApplication && job.status === 'OPEN'

  const jobForMap = job
    ? [
        {
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
        },
      ]
    : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5">
      {/* Üst Geri Dönüş Çubuğu */}
      <div>
        <button
          type="button"
          onClick={back}
          className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#5C615E] hover:text-[#141615] dark:text-[#949B97] dark:hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>İlan Panosuna Dön</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sol Sütun: İlan Detayı ve Harita */}
        <div className="lg:col-span-8 space-y-5">
          {/* İlan Başlık Kartı */}
          <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-[#F0EFEA] dark:bg-[#1D2220] text-[#141615] dark:text-[#F2F1ED] border border-[#D8D5CC] dark:border-[#2E3633]">
                  {categoryIcon(job.category)}
                </span>
                <span className="font-semibold text-[#4A4F4C] dark:text-[#A5ACA8]">
                  {categoryLabel(job.category)}
                </span>
                <span className="text-[#C5C1B6] dark:text-[#3A443F]">/</span>
                <span className="text-[#5C615E] dark:text-[#949B97] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0D6847]" />
                  <span>{job.district}, {job.city}</span>
                </span>
              </div>

              {isUrgent && (
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-[#FBEEE9] text-[#B43B21] border border-[#EFC7BD] dark:bg-[#2E1611] dark:text-[#F5937E] dark:border-[#5C281E]">
                  ACİL VARDİYA
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#141615] dark:text-white leading-snug">
              {job.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-[#5C615E] dark:text-[#949B97] pt-3 border-t border-[#ECEAE4] dark:border-[#222624]">
              <span>Yayın: {formatDate(job.createdAt)}</span>
              <span>•</span>
              <span>{job.viewCount} görüntülenme</span>
              <span>•</span>
              <span>{job.applicationCount} başvuru</span>
            </div>

            {/* Aksiyon Butonları */}
            {!isOwner && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2">
                {!user && job.status === 'OPEN' && (
                  <button
                    type="button"
                    className="flex-1 h-11 px-5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    onClick={() =>
                      openAuthModal({
                        title: 'Bu İşe Başvurmak İçin Giriş Yapın',
                        description: `"${job.title}" ilanına başvurmak için hesabınıza giriş yapın veya ücretsiz kayıt olun.`,
                        tab: 'login',
                      })
                    }
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>Giriş Yap ve Hemen Başvur</span>
                  </button>
                )}

                {canApply && (
                  <button
                    type="button"
                    className="flex-1 h-11 px-5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    onClick={() => setApplyDialog(true)}
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>Bu İşe Başvur</span>
                  </button>
                )}

                {myApplication && (
                  <button
                    type="button"
                    className="flex-1 h-11 px-4 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-[#F6F5F2] dark:bg-[#181C1A] text-xs font-semibold flex items-center justify-center gap-2 text-[#141615] dark:text-white"
                    disabled
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#0D6847]" />
                    <span>Başvuru Durumu: {statusLabel(myApplication.status).text}</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex-1 sm:flex-none h-11 px-3.5 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] hover:bg-[#F0EFEA] dark:hover:bg-[#222825] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] cursor-pointer"
                    onClick={handleSave}
                    aria-label={saved ? 'Kaydedilenlerden Çıkar' : 'İlanı Kaydet'}
                  >
                    <Heart className={`w-4 h-4 ${saved ? 'fill-[#C84B31] text-[#C84B31]' : ''}`} />
                    <span className="sm:hidden">{saved ? 'Kaydedildi' : 'Kaydet'}</span>
                  </button>
                  <button
                    type="button"
                    className="flex-1 sm:flex-none h-11 px-3.5 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] hover:bg-[#F0EFEA] dark:hover:bg-[#222825] flex items-center justify-center gap-1.5 text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] cursor-pointer"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(window.location.href)
                      }
                      toast.success('İlan bağlantısı kopyalandı')
                    }}
                    aria-label="İlanı Paylaş"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="sm:hidden">Paylaş</span>
                  </button>
                </div>
              </div>
            )}

            {isOwner && (
              <div className="bg-[#FDF6E7] dark:bg-[#2B210B] border border-[#EAD29C] dark:border-[#523E14] rounded-md p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#946200] dark:text-[#E5B85B] mt-0.5 shrink-0" />
                <p className="text-xs text-[#141615] dark:text-[#F2F1ED]">
                  Bu ilan size ait. Gelen başvuruları değerlendirmek için{' '}
                  <button
                    type="button"
                    className="font-bold underline text-[#0D6847] dark:text-[#5CD6A5]"
                    onClick={() => go('my-jobs')}
                  >
                    İlanlarım
                  </button>{' '}
                  sayfasına gidebilirsiniz.
                </p>
              </div>
            )}
          </div>

          {/* İş Tanımı */}
          <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#181C1A]">
              <h2 className="text-sm font-bold text-[#141615] dark:text-white">
                İş Tanımı ve Beklentiler
              </h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-sm text-[#252927] dark:text-[#DCE0DD] whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>

              {job.requiredSkills?.length > 0 && (
                <div className="pt-3 border-t border-[#ECEAE4] dark:border-[#222624]">
                  <div className="font-mono text-[11px] font-semibold text-[#5C615E] dark:text-[#949B97] mb-2">
                    ARANAN BECERİLER
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 rounded bg-[#F0EFEA] dark:bg-[#1D2220] text-xs font-medium text-[#141615] dark:text-[#F2F1ED] border border-[#D8D5CC] dark:border-[#2E3633]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Konum ve Harita */}
          <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#181C1A] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#141615] dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0D6847]" />
                <span>Çalışma Konumu</span>
              </h2>
              <span className="font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
                {job.district}, {job.city}
              </span>
            </div>
            <div className="p-5 space-y-3">
              <div className="rounded-md overflow-hidden h-[220px] sm:h-[260px] border border-[#D8D5CC] dark:border-[#2B322E]">
                <JobMap jobs={jobForMap} userCoords={null} height="100%" />
              </div>
              <div className="space-y-1 text-xs text-[#5C615E] dark:text-[#949B97]">
                {job.address && (
                  <p className="font-semibold text-[#141615] dark:text-white flex items-start gap-1.5">
                    <Navigation className="w-3.5 h-3.5 mt-0.5 text-[#0D6847] shrink-0" />
                    <span>{job.address}</span>
                  </p>
                )}
                {job.locationNote && (
                  <p className="p-2.5 rounded bg-[#F6F5F2] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] text-[#141615] dark:text-[#DCE0DD]">
                    Not: {job.locationNote}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Sütun: Yevmiye Cetveli & İşveren */}
        <div className="lg:col-span-4 space-y-5">
          {/* Yevmiye Kartı */}
          <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
            <div className="px-5 py-3.5 bg-[#EAF3EE] dark:bg-[#162921] border-b border-[#C5DDD0] dark:border-[#244738] flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5] flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span>NET GÜNLÜK YEVMİYE</span>
              </span>
              {job.isWageNegotiable && (
                <span className="font-mono text-[10px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                  TEKLİFE AÇIK
                </span>
              )}
            </div>
            <div className="p-5 space-y-4">
              <div className="font-mono text-2xl sm:text-3xl font-bold text-[#141615] dark:text-white">
                {formatWage(job.wageAmount, job.wageType)}
              </div>

              <div className="pt-3 border-t border-[#ECEAE4] dark:border-[#222624] divide-y divide-[#ECEAE4] dark:divide-[#222624] text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#5C615E] dark:text-[#949B97] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Vardiya Tarihi</span>
                  </span>
                  <span className="font-mono font-semibold text-[#141615] dark:text-white">
                    {daysUntil(job.workDate)}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#5C615E] dark:text-[#949B97] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Çalışma Saatleri</span>
                  </span>
                  <span className="font-mono font-semibold text-[#141615] dark:text-white">
                    {job.startTime} – {job.endTime} ({job.durationHours}s)
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-[#5C615E] dark:text-[#949B97] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Açık Kontenjan</span>
                  </span>
                  <span className="font-mono font-semibold text-[#141615] dark:text-white">
                    {remaining} / {job.openingsTotal} kişi
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#F6F5F2] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] flex items-center gap-2 text-[11px] font-medium text-[#0D6847] dark:text-[#5CD6A5]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Emanet Kasa & QR vardiya güvencesi</span>
              </div>
            </div>
          </div>

          {/* İşveren Bilgisi */}
          <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-5 space-y-4">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#5C615E] dark:text-[#949B97]">
              İŞVEREN KAYDI
            </div>

            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] shrink-0">
                <AvatarFallback className="rounded-md bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5] font-mono font-bold text-xs">
                  {initials(job.employer?.companyName || job.employer?.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-[#141615] dark:text-white truncate flex items-center gap-1.5">
                  <span className="truncate">{job.employer?.companyName || job.employer?.fullName}</span>
                  {job.employer?.isVerified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5] shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#5C615E] dark:text-[#949B97] mt-0.5">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#D97706] text-[#D97706]" />
                    <span>{job.employer?.ratingAvg || '0.0'}</span>
                  </span>
                  <span>•</span>
                  <span>{job.employer?.ratingCount || 0} değerlendirme</span>
                </div>
              </div>
            </div>

            {job.employer?.bio && (
              <p className="text-xs text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                {job.employer.bio}
              </p>
            )}

            {!isOwner && (
              <button
                type="button"
                className="w-full h-10 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-[#F6F5F2] dark:bg-[#181C1A] hover:bg-[#EAE8E1] dark:hover:bg-[#222825] text-xs font-semibold text-[#141615] dark:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
                onClick={handleSendMessage}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
                <span>İşverene Soru Sor</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Başvuru Dialog */}
      <Dialog open={applyDialog} onOpenChange={setApplyDialog}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-md rounded-lg bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#141615] dark:text-white">
              Vardiya Başvurusu
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97]">
              &ldquo;{job.title}&rdquo; ilanı için işverene kısa bir not iletin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Başvuru Notunuz</Label>
              <Textarea
                placeholder="Deneyiminizi ve vardiyaya uygunluğunuzu kısaca belirtin..."
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={4}
                className="text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E]"
              />
            </div>

            {job.isWageNegotiable && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Teklif Ettiğiniz Günlük Ücret (₺) — İsteğe Bağlı</Label>
                <input
                  type="number"
                  className="flex h-10 w-full rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] px-3 py-2 text-sm font-mono"
                  placeholder="Örn: 1800"
                  value={proposedWage}
                  onChange={(e) => setProposedWage(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setApplyDialog(false)} className="w-full sm:w-auto h-10 text-xs">
              İptal
            </Button>
            <Button
              onClick={handleApply}
              disabled={applying}
              className="w-full sm:w-auto h-10 bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold"
            >
              {applying ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              Başvuruyu Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
