import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/header'
import Logo from '@/components/shared/logo'
import { BreadcrumbSchema } from '@/components/shared/seo-schema'
import {
  Wallet,
  ShieldCheck,
  Compass,
  Zap,
  GraduationCap,
  Clock,
  ArrowRight,
  CheckCircle2,
  Check,
  BadgePercent,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr'

export const metadata: Metadata = {
  title: 'İş Arayanlar & Öğrenciler İçin Günübirlik Yevmiyeli İşler',
  description:
    'Öğrenciler, ek gelir arayanlar ve günübirlik çalışanlar için güvenli iş platformu. %100 emanet ödeme güvencesiyle aynı gün yevmiye kazan.',
  alternates: {
    canonical: `${BASE_URL}/is-arayanlar`,
  },
  openGraph: {
    title: 'İş Arayanlar İçin Günlük İş Platformu | Günübirlik',
    description: 'Sabah başla, akşam yevmiyeni sıfır komisyon kesintisiyle doğrudan cüzdanına al.',
    url: `${BASE_URL}/is-arayanlar`,
  },
}

export default function IsArayanlarPage() {
  const breadcrumbItems = [
    { name: 'Ana Sayfa', url: BASE_URL },
    { name: 'İş Arayanlar İçin', url: `${BASE_URL}/is-arayanlar` },
  ]

  const benefits = [
    {
      title: 'Aynı Gün Net Yevmiye',
      desc: 'Haftalarca maaş bekleme derdi yok. Mesai bittiğinde yevmiyen anında cüzdanına ve banka hesabına aktarılır.',
      icon: Wallet,
    },
    {
      title: 'Emanet Kasası Güvencesi',
      desc: 'İşveren ücreti iş başlamadan kasaya yatırır. Paran sistemde kilitlidir; emeğin asla karşılıksız kalmaz.',
      icon: ShieldCheck,
    },
    {
      title: '%0 Çalışan Komisyonu',
      desc: 'Kazandığın yevmiyeden tek kuruş kesilmez. Ne anlaştıysan net olarak onu alırsın.',
      icon: BadgePercent,
    },
    {
      title: 'Esnek Çalışma Saatleri',
      desc: 'İster sadece hafta sonları, ister derslerinden sonra, ister boş günlerinde çalış. Tamamen özgürsün.',
      icon: Clock,
    },
    {
      title: 'Konumuna En Yakın İşler',
      desc: 'GPS radarı sayesinde yol parası ve saatlerce toplu taşıma çilesi çekmeden yürüme mesafesinde iş bul.',
      icon: MapPin,
    },
    {
      title: 'Öğrenci Dostu Deneyim',
      desc: 'Garsonluk, tanıtım, anketörlük, kuryelik ve etkinlik gibi öğrencilere uygun yüzlerce günlük fırsat.',
      icon: GraduationCap,
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
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              🎓 Öğrenciler & Günlük Çalışanlar İçin
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Boş günlerinde çalış, akşam yevmiyeni cebine koy.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Uzun mülakatlar, haftalarca süren iş arayışları yok. Sana en yakın işi seç, QR ile başla, emanet kasadan yevmiyeni aynı gün al.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link href="/">
                <Button size="lg" className="h-12 px-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
                  Açık İlanları Gör
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Avantajlar Grid */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Neden Günübirlik?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {benefits.map((b, i) => {
                const Icon = b.icon
                return (
                  <div
                    key={i}
                    className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
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

          {/* 3 Adımda Nasıl Başlarsın? */}
          <section className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-8">
            <h2 className="text-2xl font-bold text-center">Nasıl Başlarım? (3 Basit Adım)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black text-lg mx-auto flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-base">Ücretsiz Profil Aç</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Telefon numaranla saniyeler içinde kaydol. Hangi işlerde çalışmak istediğini seç.
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black text-lg mx-auto flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-base">İlana Başvur & Kabul Al</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Semtindeki iş ilanlarını incele. Şartları uyan işe tek tıkla başvur, işverenden anında onay al.
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-black text-lg mx-auto flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-base">Mesaiyi Tamamla, Paranı Al</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sabah giriş QR&apos;ı, akşam çıkış QR&apos;ı okut. Yevmiyen emanet kasadan anında cüzdanına geçsin.
                </p>
              </div>
            </div>
          </section>

          {/* CTA Banner */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white text-center space-y-4 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Bugün Çalışmaya Başlayın</h2>
            <p className="text-slate-300 max-w-xl mx-auto text-sm">
              İstanbul, Trabzon, Ankara, İzmir ve tüm Türkiye&apos;de binlerce günlük iş seni bekliyor.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button size="lg" className="h-12 px-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                  İlanlara Göz At
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
