import { Metadata } from 'next'
import Link from 'next/link'
import Logo from '@/components/shared/logo'
import { notFound } from 'next/navigation'
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
  Coins,
  ShieldCheck,
  ChevronRight,
  PlusCircle,
  Search,
} from 'lucide-react'
import { formatWage } from '@/lib/format'

const CITY_NAME_MAP: Record<string, string> = {
  trabzon: 'Trabzon',
  istanbul: 'İstanbul',
  ankara: 'Ankara',
  izmir: 'İzmir',
  bursa: 'Bursa',
  antalya: 'Antalya',
  kocaeli: 'Kocaeli',
  adana: 'Adana',
  samsun: 'Samsun',
  gaziantep: 'Gaziantep',
  konya: 'Konya',
  eskisehir: 'Eskişehir',
  sakarya: 'Sakarya',
  rize: 'Rize',
  ordu: 'Ordu',
  giresun: 'Giresun',
}

interface PageProps {
  params: Promise<{ city: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params
  const rawCity = city.toLowerCase()
  const cityName = CITY_NAME_MAP[rawCity] || rawCity.charAt(0).toUpperCase() + rawCity.slice(1)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.space-z.ai'

  return {
    title: `${cityName} Günlük İş İlanları & Yevmiyeli İşler`,
    description: `${cityName} ve ilçelerinde en güncel günlük, part-time ve acil yevmiyeli iş ilanları. Güvenli emanet ödeme ile hemen başvur, aynı gün kazan.`,
    alternates: {
      canonical: `${baseUrl}/sehir/${rawCity}`,
    },
    openGraph: {
      title: `${cityName} Günlük İş İlanları | Günübirlik`,
      description: `${cityName} genelinde günlük garson, inşaat, temizlik, nakliye ve part-time işler.`,
      url: `${baseUrl}/sehir/${rawCity}`,
    },
  }
}

export default async function CityJobsPage({ params }: PageProps) {
  const { city } = await params
  const rawCity = city.toLowerCase()
  const cityName = CITY_NAME_MAP[rawCity] || rawCity.charAt(0).toUpperCase() + rawCity.slice(1)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.space-z.ai'

  // Veritabanından ilgili şehrin aktif ilanlarını çek
  let jobs: any[] = []
  try {
    jobs = await db.job.findMany({
      where: {
        status: 'OPEN',
        city: {
          contains: cityName,
          mode: 'insensitive',
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
    console.error(`[CityJobsPage] ${cityName} için ilanlar çekilemedi:`, err)
  }

  const breadcrumbs = [
    { name: 'Ana Sayfa', url: baseUrl },
    { name: 'Şehirler', url: `${baseUrl}/#sehirler` },
    { name: `${cityName} Günlük İş İlanları`, url: `${baseUrl}/sehir/${rawCity}` },
  ]

  const faqs = [
    {
      question: `${cityName}'da günlük iş nasıl bulunur?`,
      answer: `Günübirlik platformuna ücretsiz kayıt olarak ${cityName} ve çevre ilçelerindeki günlük iş ilanlarını harita üzerinde görüntüleyebilir, tek tıkla başvuru yapabilirsiniz.`,
    },
    {
      question: `${cityName}'da günlük yevmiyeler ne kadar?`,
      answer: `${cityName} genelinde günlük iş ücretleri sektöre göre (garsonluk, nakliyat, inşaat, temizlik) günlük ortalama 1.000 TL ile 3.000 TL arasında değişmektedir. Ücretler emanet havuzunda güvence altına alınır.`,
    },
    {
      question: `Ödememi aynı gün alabilir miyim?`,
      answer: `Evet! Günübirlik'te işveren işi onayladığında ücret emanet sisteminden anında cüzdanınıza aktarılır ve aynı gün IBAN'ınıza çekebilirsiniz.`,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground">
      {/* Schema.org Structured Data */}
      <BreadcrumbSchema items={breadcrumbs} />
      <FAQSchema faqs={faqs} />
      {jobs.slice(0, 5).map((job) => (
        <JobPostingSchema key={job.id} job={job} />
      ))}

      {/* Üst Navigasyon */}
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

      {/* Hero / Başlık Bölümü */}
      <section className="bg-gradient-to-b from-indigo-50/50 via-white to-transparent dark:from-indigo-950/20 dark:via-background border-b pt-24 pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb Görseli */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            <Link href="/" className="hover:underline">Ana Sayfa</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-foreground">{cityName} Günlük İş İlanları</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {cityName} Günlük İş İlanları
              </h1>
              <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                {cityName} ve tüm ilçelerinde acil yevmiyeli, part-time ve günübirlik iş fırsatları.
                Emanet sistemiyle paranız güvende, ödemeniz aynı gün hesabınızda.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm font-medium">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>%100 Emanet Ödeme Güvencesi</span>
            </div>
          </div>
        </div>
      </section>

      {/* İlan Listesi Bölümü */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>Aktif İlanlar ({jobs.length})</span>
          </h2>
          <Link
            href={`/?city=${encodeURIComponent(cityName)}`}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>Haritada Filtrele</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border rounded-2xl p-10 text-center max-w-md mx-auto">
            <div className="text-4xl mb-3">📍</div>
            <h3 className="text-lg font-bold mb-1">{cityName}'da Şu An Açık İlan Yok</h3>
            <p className="text-sm text-muted-foreground mb-6">
              İlk ilanı sen vererek {cityName}'daki binlerce iş arayana anında ulaşabilirsin.
            </p>
            <Link
              href="/?action=post-job"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:bg-primary/90 transition"
            >
              <PlusCircle className="w-4 h-4" />
              {cityName}'da İlan Yayınla
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
                      {job.category}
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

        {/* Yerel SSS Bölümü */}
        <section className="mt-16 bg-white dark:bg-slate-900 border rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-bold mb-6">
            {cityName} Günlük İşleri Hakkında Sıkça Sorulan Sorular
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-slate-100 dark:border-slate-800 pb-4 last:border-0 last:pb-0">
                <h3 className="text-sm md:text-base font-semibold text-slate-900 dark:text-white mb-1">
                  {faq.question}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
