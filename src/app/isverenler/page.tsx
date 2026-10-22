import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/header'
import Logo from '@/components/shared/logo'
import { BreadcrumbSchema } from '@/components/shared/seo-schema'
import {
  Building2,
  Users,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr'

export const metadata: Metadata = {
  title: 'İşverenler İçin Acil Günübirlik Eleman Temini — Günübirlik',
  description:
    'Restoran, kafe, inşaat, etkinlik ve temizlik sektörlerinde aynı gün güvenilir yevmiyeli eleman bulun. Emanet ödeme sistemiyle sıfır risk.',
  alternates: {
    canonical: `${BASE_URL}/isverenler`,
  },
  openGraph: {
    title: 'Acil Günlük Eleman mı Lazım? | Günübirlik İşveren Platformu',
    description: 'Dakikalar içinde yevmiyeli garson, usta, kurye veya temizlik personeli bulun.',
    url: `${BASE_URL}/isverenler`,
  },
}

export default function IsverenlerPage() {
  const breadcrumbItems = [
    { name: 'Ana Sayfa', url: BASE_URL },
    { name: 'İşverenler İçin', url: `${BASE_URL}/isverenler` },
  ]

  const employerBenefits = [
    {
      title: 'Dakikalar İçinde Eleman',
      desc: 'Acil durumlarda, yoğun hafta sonlarında veya ani sipariş patlamalarında aynı gün personel bulun.',
      icon: Clock,
    },
    {
      title: 'Kimliği Doğrulanmış Adaylar',
      desc: 'T.C. kimlik ve telefon doğrulaması yapılmış, referans puanı yüksek güvenilir adaylarla çalışın.',
      icon: UserCheck,
    },
    {
      title: 'Emanet Sistemi ile Sıfır Risk',
      desc: 'Ücret çalışma gerçekleşmeden serbest bırakılmaz. Taahhüt edilen iş tamamlandığında onaylarsınız.',
      icon: ShieldCheck,
    },
    {
      title: 'Yerel ve Hızlı Eşleşme',
      desc: 'İş yerinizin yakınındaki adaylara anında anlık bildirim gider; yol masrafı ve gecikme riski minimuma iner.',
      icon: Zap,
    },
    {
      title: 'Esnek Maliyet Yönetimi',
      desc: 'Sabit personel yükü ve yüksek bordro maliyetleri yerine sadece ihtiyacınız olduğu gün kadar ödeyin.',
      icon: TrendingUp,
    },
    {
      title: 'QR Mesai Doğrulaması',
      desc: 'İşe başlama ve bitiş saatleri QR kodla anlık takip edilir. Kaç saat çalışıldığı net ve şeffaftır.',
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <BreadcrumbSchema items={breadcrumbItems} />
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
          
          {/* Hero */}
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300">
              🏢 İşletmeler & Yöneticiler İçin
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Acil eleman ihtiyacınızı dakikalar içinde karşılayın.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Restoranlar, kafeler, şantiyeler ve organizasyonlar için güvenilir günübirlik eleman temini.
              İlanınızı açın, bölgenizdeki yüzlerce adaya anında ulaşın.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link href="/">
                <Button size="lg" className="h-12 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
                  Ücretsiz İlan Yayınla
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Sektörel Çözümler */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Hangi Sektörlerde Çözüm Sunuyoruz?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-3xl mb-1">🍽️</div>
                <h3 className="font-bold text-sm">Restoran & Kafe</h3>
                <p className="text-xs text-slate-500">Garson, komi, bulaşıkçı, barista</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-3xl mb-1">🏗️</div>
                <h3 className="font-bold text-sm">İnşaat & Tadilat</h3>
                <p className="text-xs text-slate-500">Usta, kalfalar, taşıma personeli</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-3xl mb-1">🧹</div>
                <h3 className="font-bold text-sm">Temizlik & Hizmet</h3>
                <p className="text-xs text-slate-500">Ofis, ev, inşaat sonrası temizlik</p>
              </div>
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="text-3xl mb-1">📦</div>
                <h3 className="font-bold text-sm">Depo & Lojistik</h3>
                <p className="text-xs text-slate-500">Paketleme, yükleme, acil kurye</p>
              </div>
            </div>
          </section>

          {/* Avantajlar */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center">İşletmenize Sağlanan Avantajlar</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {employerBenefits.map((b, i) => {
                const Icon = b.icon
                return (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{b.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {b.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Alt Banner */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white text-center space-y-5 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Bugün İlk İlanınızı Yayınlayın</h2>
            <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base">
              Dakikalar içinde kayıt olun, acil eleman ihtiyacınızı emanet güvencesiyle aynı gün çözün.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button size="lg" className="h-12 px-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                  Hemen Başla
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo size="sm" variant="full" />
          <p>© 2026 Günübirlik • Konum Bazlı Günlük İş Platformu</p>
        </div>
      </footer>
    </div>
  )
}
