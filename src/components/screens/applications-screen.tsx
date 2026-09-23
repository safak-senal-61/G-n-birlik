'use client'

import { useState, useEffect } from 'react'
import { applicationsApi, jobsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Briefcase, MessageSquare, Star, XCircle, CheckCircle2, Clock,
  MapPin, Wallet, Calendar, ChevronRight, CheckCircle, XCircle as XIcon,
  AlertCircle, FileText,
} from 'lucide-react'
import { formatWage, formatDate, categoryLabel, categoryIcon, statusLabel, daysUntil, initials } from '@/lib/format'
import { toast } from 'sonner'

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  PENDING: { icon: Clock, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ACCEPTED: { icon: CheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  REJECTED: { icon: XIcon, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  WITHDRAWN: { icon: AlertCircle, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' },
  COMPLETED: { icon: CheckCircle2, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  NO_SHOW: { icon: XCircle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
}

export default function ApplicationsScreen() {
  const { go } = useApp()
  const { user } = useAuth()
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  const loadApps = async () => {
    setLoading(true)
    try {
      const result = await applicationsApi.mine(statusFilter === 'ALL' ? undefined : statusFilter)
      setApps(result)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadApps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter])

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

  // Status sayaçları
  const statusCounts = {
    ALL: apps.length,
    PENDING: apps.filter(a => a.status === 'PENDING').length,
    ACCEPTED: apps.filter(a => a.status === 'ACCEPTED').length,
    REJECTED: apps.filter(a => a.status === 'REJECTED').length,
    COMPLETED: apps.filter(a => a.status === 'COMPLETED').length,
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Başvurularım</h1>
        <p className="text-gray-600 mt-1 text-sm">Yaptığınız iş başvurularını takip edin</p>
      </div>

      {/* Status Filter Tabs - Modern pill style */}
      <div className="mb-4 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto no-scrollbar">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="flex-nowrap bg-gray-100 p-1 h-auto gap-1">
            <FilterTab value="ALL" label="Tümü" count={statusCounts.ALL} active={statusFilter === 'ALL'} />
            <FilterTab value="PENDING" label="Beklemede" count={statusCounts.PENDING} active={statusFilter === 'PENDING'} />
            <FilterTab value="ACCEPTED" label="Onaylanan" count={statusCounts.ACCEPTED} active={statusFilter === 'ACCEPTED'} />
            <FilterTab value="REJECTED" label="Reddedilen" count={statusCounts.REJECTED} active={statusFilter === 'REJECTED'} />
            <FilterTab value="COMPLETED" label="Tamamlanan" count={statusCounts.COMPLETED} active={statusFilter === 'COMPLETED'} />
          </TabsList>
        </Tabs>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : apps.length === 0 ? (
        /* Empty State - Modern */
        <Card className="border-dashed border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="p-6 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 mb-4">
              <FileText className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1 text-base sm:text-lg">
              {statusFilter === 'ALL' ? 'Henüz başvurunuz yok' : 'Bu durumda başvuru yok'}
            </h3>
            <p className="text-gray-500 mb-5 text-sm max-w-xs mx-auto">
              {statusFilter === 'ALL'
                ? 'İş ilanlarına göz atıp ilk başvurunuzu yapın.'
                : 'Farklı bir filtre deneyin veya tüm başvuruları görüntüleyin.'}
            </p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6 text-sm"
              onClick={() => go('home')}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              İşleri Keşfet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const status = statusLabel(app.status)
            const job = app.job
            if (!job) return null
            const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.PENDING
            const StatusIcon = statusConfig.icon

            return (
              <Card
                key={app.id}
                className={`overflow-hidden border ${statusConfig.border} hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}
              >
                {/* Status strip at top */}
                <div className={`h-1 ${statusConfig.bg.replace('50', '500').replace('bg-', 'bg-')}`} />

                <CardContent className="p-3 sm:p-4">
                  {/* Header row: category icon + title + status */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                      {categoryIcon(job.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => go('job-detail', { jobId: job.id })}
                          className="font-semibold text-gray-900 hover:text-emerald-700 transition-colors truncate text-left text-sm sm:text-base"
                        >
                          {job.title}
                        </button>
                        <Badge
                          variant="outline"
                          className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border flex-shrink-0 text-[10px] sm:text-xs font-semibold`}
                        >
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.text}
                        </Badge>
                      </div>

                      {/* Meta info - clean grid */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-2">
                        <span className="flex items-center gap-1 font-semibold text-emerald-700">
                          <Wallet className="w-3 h-3" />
                          {formatWage(job.wageAmount, job.wageType)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {daysUntil(job.workDate)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{job.district}, {job.city}</span>
                        </span>
                      </div>

                      {/* Application message */}
                      {app.message && (
                        <div className="mt-2.5 p-2.5 bg-gray-50 rounded-lg border-l-2 border-emerald-300">
                          <p className="text-xs text-gray-600 italic line-clamp-2 leading-relaxed">"{app.message}"</p>
                        </div>
                      )}

                      {/* Proposed wage */}
                      {app.proposedWage && (
                        <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[11px] font-medium">
                          <Wallet className="w-3 h-3" />
                          Teklif: ₺{app.proposedWage}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Employer info + date - clean footer */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Avatar className="w-7 h-7 flex-shrink-0 border border-gray-200">
                      <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold">
                        {initials(job.employer?.companyName || job.employer?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-xs text-gray-700 truncate font-medium">
                        {job.employer?.companyName || job.employer?.fullName}
                      </span>
                      {job.employer?.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      )}
                      {job.employer?.ratingAvg > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-gray-500 flex-shrink-0">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {job.employer.ratingAvg.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {formatDate(app.createdAt)}
                    </span>
                  </div>

                  {/* Actions - Status based */}
                  <div className="mt-3 flex gap-2">
                    {/* PENDING: Withdraw + Message */}
                    {app.status === 'PENDING' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-10 text-xs sm:text-sm border-gray-200 hover:bg-gray-50"
                          onClick={() => handleSendMessage(job)}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          Mesaj Gönder
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-3 text-xs sm:text-sm text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          onClick={() => handleWithdraw(app.id)}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1.5" />
                          <span className="hidden sm:inline">Geri Çek</span>
                          <span className="sm:hidden">Çek</span>
                        </Button>
                      </>
                    )}

                    {/* ACCEPTED: Success banner + Message button */}
                    {app.status === 'ACCEPTED' && (
                      <>
                        <div className="flex-1 flex items-center gap-2 px-3 h-10 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-emerald-800 font-medium truncate">
                            Onaylandı! İletişime geçin.
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="h-10 px-4 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                          onClick={() => handleSendMessage(job)}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                          <span className="hidden sm:inline">Mesaj Gönder</span>
                          <span className="sm:hidden">Mesaj</span>
                        </Button>
                      </>
                    )}

                    {/* REJECTED: Just view job */}
                    {app.status === 'REJECTED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 text-xs sm:text-sm border-gray-200 hover:bg-gray-50"
                        onClick={() => go('job-detail', { jobId: job.id })}
                      >
                        İlanı Tekrar Görüntüle
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    )}

                    {/* COMPLETED: Rate button */}
                    {app.status === 'COMPLETED' && !app.rating && (
                      <Button
                        size="sm"
                        className="flex-1 h-10 text-xs sm:text-sm bg-amber-500 hover:bg-amber-600 shadow-sm"
                        onClick={() => go('job-detail', { jobId: job.id })}
                      >
                        <Star className="w-3.5 h-3.5 mr-1.5" />
                        Değerlendir
                      </Button>
                    )}

                    {/* COMPLETED with rating */}
                    {app.status === 'COMPLETED' && app.rating && (
                      <div className="flex-1 flex items-center justify-center gap-1 px-3 h-10 bg-gray-50 rounded-lg">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">Puanladınız: {app.rating}/5</span>
                      </div>
                    )}

                    {/* WITHDRAWN: View job */}
                    {app.status === 'WITHDRAWN' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 text-xs sm:text-sm text-gray-500 border-gray-200"
                        onClick={() => go('job-detail', { jobId: job.id })}
                        disabled
                      >
                        Geri Çekildi
                      </Button>
                    )}

                    {/* Default: Message */}
                    {!['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'WITHDRAWN'].includes(app.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-10 text-xs sm:text-sm"
                        onClick={() => handleSendMessage(job)}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        Mesaj Gönder
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// Filter Tab Component - Modern pill style
// ============================================================
function FilterTab({ value, label, count, active }: { value: string; label: string; count: number; active: boolean }) {
  return (
    <TabsTrigger
      value={value}
      className={`flex-shrink-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-800`}
    >
      {label}
      {count > 0 && (
        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
          active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </TabsTrigger>
  )
}
