import { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/shared/logo'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import {
  BreadcrumbSchema,
  JobPostingSchema,
} from '@/components/shared/seo-schema'
import {
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Building,
  Star,
  Users,
} from 'lucide-react'
import { formatWage } from '@/lib/format'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.space-z.ai'

  try {
    const job = await db.job.findUnique({
      where: { id },
      include: { employer: true },
    })

    if (!job) {
      return {
        title: 'İlan Bulunamadı | Günübirlik',
        robots: { index: false, follow: false },
      }
    }

    const wage = formatWage(job.wageAmount, job.wageType)
    const employerName = job.employer?.companyName || job.employer?.fullName || 'İşveren'

    return {
      title: `${job.title} — ${job.city} (${wage})`,
      description: `${job.city}, ${job.district || ''} bölgesinde ${wage} ücretle ${job.title} iş ilanı. ${job.description.slice(0, 140)}...`,
      alternates: {
        canonical: `${baseUrl}/ilan/${job.id}`,
      },
      openGraph: {
        title: `${job.title} — ${job.city} Günlük İş İlanı`,
        description: `${job.city} bölgesinde ${wage} yevmiyeli iş ilanı. Emanet ödeme güvencesiyle hemen başvur.`,
        url: `${baseUrl}/ilan/${job.id}`,
        type: 'article',
      },
    }
  } catch {
    return {
      title: 'İş İlanı | Günübirlik',
    }
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  const { id } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.space-z.ai'

  let job: any = null
  try {
    job = await db.job.findUnique({
      where: { id },
      include: {
        employer: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            isVerified: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
    })
  } catch (err) {
    console.error(`[JobDetailPage] İlan (${id}) çekilemedi:`, err)
  }

  if (!job) {
    notFound()
  }

  const breadcrumbs = [
    { name: 'Ana Sayfa', url: baseUrl },
    { name: `${job.city} İş İlanları`, url: `${baseUrl}/sehir/${job.city.toLowerCase()}` },
    { name: job.title, url: `${baseUrl}/ilan/${job.id}` },
  ]

  let parsedSkills: string[] = []
  if (job.requiredSkills) {
    try {
      parsedSkills = typeof job.requiredSkills === 'string'
        ? JSON.parse(job.requiredSkills)
        : job.requiredSkills
    } catch {
      parsedSkills = [job.requiredSkills]
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground">
      {/* Schema.org Structured Data for Google for Jobs */}
      <BreadcrumbSchema items={breadcrumbs} />
      <JobPostingSchema job={job} />

      {/* Header */}
      <header className="fixed top-2 sm:top-3 left-0 right-0 z-50 px-3 transition-all pointer-events-none">
        <div className="max-w-4xl mx-auto rounded-2xl bg-background/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-lg px-4 py-2 flex items-center justify-between pointer-events-auto">
          <Logo size="sm" href="/" variant="full" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Tüm İlanlara Dön
          </Link>
        </div>
      </header>

      {/* İçerik */}
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-12">
        {/* Breadcrumb Görseli */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:underline">Ana Sayfa</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link href={`/sehir/${job.city.toLowerCase()}`} className="hover:underline">
            {job.city}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold text-foreground truncate">{job.title}</span>
        </nav>

        {/* Ana Kart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              {job.category}
            </span>
            <span className="text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-1.5 rounded-xl">
              {formatWage(job.wageAmount, job.wageType)}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
            {job.title}
          </h1>

          {/* İşveren Bilgisi */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm flex items-center gap-1.5">
                <span>{job.employer?.companyName || job.employer?.fullName || 'İşveren'}</span>
                {job.employer?.isVerified && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                    ✓ Onaylı
                  </span>
                )}
              </div>
              {job.employer?.ratingAvg > 0 && (
                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{job.employer.ratingAvg.toFixed(1)} ({job.employer.ratingCount} değerlendirme)</span>
                </div>
              )}
            </div>
          </div>

          {/* Meta Izgara */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs md:text-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>{job.district ? `${job.district}, ` : ''}{job.city}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{new Date(job.workDate).toLocaleDateString('tr-TR')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{job.startTime} – {job.endTime} ({job.durationHours} saat)</span>
            </div>
          </div>

          {/* İş Açıklaması */}
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
              İş Tanımı
            </h2>
            <p className="text-sm md:text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Beceriler */}
          {parsedSkills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Aranan Beceriler & Nitelikler
              </h2>
              <div className="flex flex-wrap gap-2">
                {parsedSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Güvenlik Kutusu */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs md:text-sm mb-6">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">Emanet Sistemi ile Güvence Altında</p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                İşveren ödemeyi peşin olarak emanet havuzuna aktarmıştır. İş bitiminde onaylandığı an cüzdanınıza geçer.
              </p>
            </div>
          </div>

          {/* CTA Butonu */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t">
            <Link
              href={`/?apply=${job.id}`}
              className="w-full sm:w-auto flex-1 text-center py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm md:text-base shadow hover:bg-primary/90 transition"
            >
              Bu İşe Başvur
            </Link>
            <Link
              href={`/sehir/${job.city.toLowerCase()}`}
              className="w-full sm:w-auto text-center py-3.5 px-5 rounded-xl border font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {job.city} İlanlarını Gör
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
