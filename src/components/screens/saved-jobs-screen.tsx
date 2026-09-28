'use client'

import { useState, useEffect } from 'react'
import { jobsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Heart, MapPin, Clock, Wallet, Users, Briefcase } from 'lucide-react'
import { formatWage, formatDate, categoryLabel, categoryIcon, urgencyLabel, daysUntil, initials } from '@/lib/format'
import { toast } from 'sonner'

export default function SavedJobsScreen() {
  const { go } = useApp()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const result = await jobsApi.saved()
      setJobs(result)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleUnsave = async (id: string) => {
    try {
      await jobsApi.save(id)
      setJobs((prev) => prev.filter((j) => j.id !== id))
      toast.success('Kayıttan kaldırıldı.')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          Kaydettiklerim
        </h1>
        <p className="text-gray-600 mt-1 text-sm">Sonra başvurmak için kaydettiğiniz iş ilanları</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 sm:p-12 text-center">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">Henüz kaydedilmiş iş yok</h3>
            <p className="text-gray-600 mb-4 text-sm">Beğendiğiniz iş ilanlarını kaydedin, buradan hızlı erişin.</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-xs sm:text-sm" onClick={() => go('home')}>
              <Briefcase className="w-4 h-4 mr-2" />
              İşleri Keşfet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const urgency = urgencyLabel(job.urgency)
            return (
              <Card key={job.id} className="hover:shadow-md transition cursor-pointer" onClick={() => go('job-detail', { jobId: job.id })}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {categoryIcon(job.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1 min-w-0">{job.title}</h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 -mr-2 -mt-1 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleUnsave(job.id)
                          }}
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1 min-w-0">
                        <span className="font-medium text-emerald-700 truncate">{categoryLabel(job.category)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 truncate min-w-0">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{job.district}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 gap-2">
                        <div className="font-bold text-emerald-700 text-sm sm:text-base truncate">{formatWage(job.wageAmount, job.wageType)}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {daysUntil(job.workDate)}
                        </div>
                      </div>
                    </div>
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
