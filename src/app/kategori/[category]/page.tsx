import { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/shared/logo'
import { db } from '@/lib/db'
import {
  BreadcrumbSchema,
  FAQSchema,
  JobPostingSchema,
} from '@/components/shared/seo-schema'
import {
  Briefcase,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  ArrowLeft,
} from 'lucide-react'
import { formatWage } from '@/lib/format'

const CATEGORY_META: Record<string, { label: string; title: string; desc: string }> = {
  insaat: {
    label: 'İnşaat & Tadilat',
    title: 'Günlük İnşaat, Usta ve Amele İş İlanları',
    desc: 'Türkiye genelinde günlük inşaat, boyacı, sıva, kalıpçı, alçı ve yardımcı eleman iş ilanları.',
  },
  restaurant: {
    label: 'Restoran & Cafe',
    title: 'Günlük Garson, Komi & Restoran İş İlanları',
    desc: 'Cafe, restoran, düğün ve etkinlikler için günlük yevmiyeli garson, bulaşıkçı ve mutfak elemanı işleri.',
  },
  temizlik: {
    label: 'Temizlik',
    title: 'Günlük Ev ve Ofis Temizliği İş İlanları',
    desc: 'Ev temizliği, ofis temizliği ve inşaat sonrası temizlik için güvenilir günlük iş fırsatları.',
  },
  nakliye: {
    label: 'Nakliye & Taşıma',
    title: 'Günlük Nakliye, Taşıma & Depo İş İlanları',
    desc: 'Evden eve nakliyat, hamal, eşya taşıma ve depo elemanı günlük yevmiyeli iş ilanları.',
  },
  tarim: {
    label: 'Tarım & Hasat',
    title: 'Günlük Tarım, Fındık & Hasat İş İlanları',
    desc: 'Fındık toplama, çay hasadı, bahçe bakımı ve mevsimlik tarım işçisi günlük ilanları.',
  },
  teknik: {
    label: 'Teknik & Tamirat',
    title: 'Günlük Elektrik, Tesisat & Montaj İş İlanları',
    desc: 'Klima montajı, su tesisatı, elektrik tamiri ve usta yardımcısı yevmiyeli iş fırsatları.',
  },
  saglik: {
    label: 'Sağlık & Bakım',
    title: 'Günlük Hasta, Yaşlı ve Çocuk Bakımı İşleri',
    desc: 'Günübirlik refakatçi, hasta bakımı ve bebek/çocuk bakımı güvenilir ilanları.',
  },
  diger: {
    label: 'Diğer İşler',
    title: 'Günlük Ek İş ve Part-Time İş İlanları',
    desc: 'Anketörlük, broşür dağıtımı, vale, kurye ve acil ek iş fırsatları.',
  },
}

interface PageProps {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const rawCat = category.toLowerCase()
  const info = CATEGORY_META[rawCat] || {
    label: rawCat,
    title: `${rawCat.toUpperCase()} Günlük İş İlanları`,
    desc: `En güncel günlük ve part-time ${rawCat} iş ilanları.`,
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.space-z.ai'

  return {
    title: `${info.title} (2026)`,
    description: `${info.desc} Emanet ödeme güvencesiyle hemen başvur, aynı gün kazan.`,
    alternates: {
      canonical: `${baseUrl}/kategori/${rawCat}`,
    },
    openGraph: {
      title: `${info.title} | Günübirlik`,
      description: info.desc,
      url: `${baseUrl}/kategori/${rawCat}`,
    },
  }
}

export default async function CategoryJobsPage({ params }: PageProps) {
  const { category } = await params
  const rawCat = category.toLowerCase()
  const info = CATEGORY_META[rawCat] || {
    label: rawCat,
    title: `${rawCat.toUpperCase()} Günlük İş İlanları`,
    desc: `En güncel günlük ve part-time ${rawCat} iş ilanları.`,
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.space-z.ai'

  let jobs: any[] = []
  try {
    jobs = await db.job.findMany({
      where: {
        status: 'OPEN',
        category: {
          equals: rawCat.toUpperCase() as any,
        },
      },
      include: {
        employer: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            isVerified: true,
            ratingAvg: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  } catch (err) {
    console.error(`[CategoryJobsPage] ${rawCat} ilanları çekilemedi:`, err)
  }

  const breadcrumbs = [
    { name: 'Ana Sayfa', url: baseUrl },
    { name: 'Kategoriler', url: `${baseUrl}/#kategoriler` },
    { name: info.label, url: `${baseUrl}/kategori/${rawCat}` },
  ]

  const faqs = [
    {
      question: `${info.label} sektöründe günlük yevmiyeler ne kadar?`,
      answer: `Günlük yevmiyeler işin niteliğine ve çalışma saatine göre genellikle 1.200 TL ile 3.500 TL arasında değişir. Ödemeler Günübirlik emanet havuzunda güvence altındadır.`,
    },
    {
      question: `Başvuru yaptıktan sonra ne kadar sürede geri dönüş alırım?`,
      answer: `İşverenler acil ihtiyaç duydukları için başvuruları dakikalar içinde inceler ve onaylandığında anında bildirim alırsınız.`,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground">
      <BreadcrumbSchema items={breadcrumbs} />
      <FAQSchema faqs={faqs} />
      {jobs.slice(0, 5).map((job) => (
        <JobPostingSchema key={job.id} job={job} />
      ))}

      {/* Header */}
      <header className="fixed top-2 sm:top-3 left-0 right-0 z-50 px-3 transition-all pointer-events-none">
        <div className="max-w-6xl mx-auto rounded-2xl bg-background/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-lg px-4 py-2 flex items-center justify-between pointer-events-auto">
          <Logo size="sm" href="/" variant="full" />
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground hidden sm:inline"
            >
              Tüm İlanlar
            </Link>
            <Link
              href="/?action=post-job"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              İlan Ver
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-indigo-50/50 via-white to-transparent dark:from-indigo-950/20 dark:via-background border-b pt-24 pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Link href="/" className="hover:underline">Ana Sayfa</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground">{info.label} İş İlanları</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {info.title}
              </h1>
              <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                {info.desc}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm font-medium">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Günübirlik Emanet Güvencesi</span>
            </div>
          </div>
        </div>
      </section>

      {/* İlan Listesi */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">
            Açık İlanlar ({jobs.length})
          </h2>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-10 text-center max-w-md mx-auto">
            <div className="text-4xl mb-3">🧰</div>
            <h3 className="text-lg font-bold mb-1">Bu Kategoride Henüz İlan Yok</h3>
            <p className="text-sm text-muted-foreground mb-6">
              İlk ilanı oluşturarak ihtiyaç duyduğun elemana dakikalar içinde ulaş.
            </p>
            <Link
              href="/?action=post-job"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:bg-primary/90 transition"
            >
              <PlusCircle className="w-4 h-4" />
              {info.label} İlanı Ver
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {job.city}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md">
                      {formatWage(job.wageAmount, job.wageType)}
                    </span>
                  </div>

                  <Link href={`/ilan/${job.id}`}>
                    <h3 className="font-bold text-base group-hover:text-primary transition line-clamp-2">
                      {job.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{job.district ? `${job.district}, ` : ''}{job.city}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {new Date(job.workDate).toLocaleDateString('tr-TR')} · {job.startTime}–{job.endTime}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {job.employer?.companyName || job.employer?.fullName || 'İşveren'}
                  </span>
                  <Link
                    href={`/ilan/${job.id}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white transition"
                  >
                    Detayı Gör
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
