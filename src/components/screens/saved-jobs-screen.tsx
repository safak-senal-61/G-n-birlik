'use client'

import { useState, useEffect } from 'react'
import { jobsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { Skeleton } from '@/components/ui/skeleton'
import { Bookmark, MapPin, Clock, Briefcase, Trash2, ArrowUpRight } from 'lucide-react'
import { formatWage, categoryLabel, daysUntil } from '@/lib/format'
import { toast } from 'sonner'

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
      toast.success('Kayıtlı ilanlardan çıkarıldı.')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Üst Başlık / Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-[#D8D5CC] dark:border-[#262C29] pb-5">
        <div className="space-y-1">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
            KAYITLI VARDİYALAR • FAVORİ LİSTESİ
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141615] dark:text-white">
            Kaydettiğim İş İlanları
          </h1>
          <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
            Sonradan başvurmak üzere işaretlediğiniz açık günlük işler.
          </p>
        </div>
        <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] text-[#141615] dark:text-[#F2F1ED] self-start sm:self-auto">
          {jobs.length} KAYIT
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg bg-[#E9E7E0] dark:bg-[#181C1A]" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-8 sm:p-12 text-center space-y-4">
          <div className="w-10 h-10 rounded-md bg-[#F0EFEA] dark:bg-[#1E2421] border border-[#E2E0D8] dark:border-[#2C3330] flex items-center justify-center mx-auto text-[#5C615E] dark:text-[#949B97]">
            <Bookmark className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="font-bold text-base text-[#141615] dark:text-white">
              Henüz kaydedilmiş ilanınız yok
            </h3>
            <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
              İlan panosunda ilgilendiğiniz vardiyaları kaydederek buradan hızlıca takip edebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => go('home')}
            className="h-10 px-5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Açık İlanları İncele</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {jobs.map((job) => {
            const catCode = CATEGORY_SHORT_CODE[job.category] || 'İŞ'
            return (
              <article
                key={job.id}
                onClick={() => go('job-detail', { jobId: job.id })}
                className="group bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847] dark:hover:border-[#5CD6A5] rounded-lg p-4 sm:p-5 transition-colors cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#F0EFEA] dark:bg-[#1E2421] text-[#454A47] dark:text-[#B8C0BC] border border-[#E2E0D8] dark:border-[#2C3330]">
                        {catCode} • {categoryLabel(job.category)}
                      </span>
                      <span className="text-xs text-[#5C615E] dark:text-[#949B97] inline-flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#0D6847] dark:text-[#5CD6A5]" />
                        {job.district}
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Kayıtlardan çıkar"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnsave(job.id)
                      }}
                      className="h-7 w-7 rounded border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#C84B31] text-[#5C615E] hover:text-[#C84B31] flex items-center justify-center transition-colors"
                      title="Kayıtlardan Çıkar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-[#141615] dark:text-white group-hover:text-[#0D6847] dark:group-hover:text-[#5CD6A5] transition-colors line-clamp-1">
                    {job.title}
                  </h3>
                </div>

                <div className="pt-3 border-t border-[#ECEAE4] dark:border-[#222624] flex items-center justify-between gap-2">
                  <div className="font-mono font-bold text-base text-[#0D6847] dark:text-[#5CD6A5]">
                    {formatWage(job.wageAmount, job.wageType)}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#5C615E] dark:text-[#949B97]">
                    <span className="font-mono text-[11px] inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {daysUntil(job.workDate)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 font-semibold text-[#141615] dark:text-white group-hover:text-[#0D6847] dark:group-hover:text-[#5CD6A5]">
                      <span>İncele</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
