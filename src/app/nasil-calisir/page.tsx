import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/header'
import Logo from '@/components/shared/logo'
import { BreadcrumbSchema } from '@/components/shared/seo-schema'
import {
  Compass,
  Lock,
  QrCode,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building2,
  HelpCircle,
  ArrowRight,
  Briefcase,
  Smartphone,
  CreditCard,
  MapPin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr'

export const metadata: Metadata = {
  title: 'Günübirlik Nasıl Çalışır? — Adım Adım Güvenli Yevmiye Rehberi',
  description:
    'Günübirlik iş bulma ve yevmiyeli eleman temin süreci nasıl işler? Emanet kasa güvencesi, QR check-in ve aynı gün ödeme sistemi hakkında merak edilen her şey.',
  alternates: {
    canonical: `${BASE_URL}/nasil-calisir`,
  },
  openGraph: {
    title: 'Günübirlik Nasıl Çalışır? — Güvenli Yevmiyeli İş Rehberi',
    description: 'Emanet ödeme, GPS konumu ve QR doğrulama ile aynı gün kazanç sağlayan sistem.',
    url: `${BASE_URL}/nasil-calisir`,
  },
}

export default function NasilCalisirPage() {
  const breadcrumbItems = [
    { name: 'Ana Sayfa', url: BASE_URL },
    { name: 'Nasıl Çalışır?', url: `${BASE_URL}/nasil-calisir` },
  ]

  const faqs = [
    {
      q: 'Yevmiyemin ödeneceğinden nasıl emin olabilirim?',
      a: 'Günübirlik sisteminde işveren ilan oluştururken yevmiye bedelini Emanet Kasası havuzuna yatırır. Para çalışırken sistemde kilitli tutulur ve mesai bitip çıkış QR kodu onaylandığında komisyonsuz olarak hesabınıza aktarılır.',
    },
    {
      q: 'İş arayanlardan komisyon alınıyor mu?',
      a: 'Hayır. Günübirlik platformunda çalışanlar ve yevmiyeli iş arayanlar için hizmet %100 ücretsizdir. Kazandığınız ücretin tamamı cebinize girer.',
    },
    {
      q: 'İşverenler için acil eleman bulma süresi ne kadardır?',
      a: 'Konum bazlı anlık bildirim sistemi ve GPS radarı sayesinde yayınlanan ilanlar çevredeki aktif çalışanlara anında iletilir. İlanların ortalama yanıt süresi 15 ila 30 dakika arasındadır.',
    },
    {
      q: 'QR Check-in nedir ve nasıl kullanılır?',
      a: 'Sabah iş yerine vardığınızda işverenin sunduğu QR kodu telefon kamerasıyla okutarak mesai başlangıcını tescillersiniz. Akşam mesai bitiminde çıkış QR kodu okutularak ödeme otomatik serbest bırakılır.',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <BreadcrumbSchema items={breadcrumbItems} />
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
          
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              Şeffaf, Güvenilir & Hızlı
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Günübirlik Platformu Nasıl Çalışır?
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Hem iş arayanın emeğini hem de işverenin bütçesini %100 koruma altına alan modern yevmiye ekosistemi.
            </p>
          </div>

          {/* İş Arayanlar İçin Süreç */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h2 className="text-2xl font-bold">İş Arayanlar İçin: Sabah Başla, Akşam Kazan</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Ücretsiz üye ol, aynı gün para kazanmaya başla.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">1. Haritadan İşi Seç</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Konumuna yakın semtteki işleri incele. Yevmiye tutarı, çalışma saati ve adres bilgilerini şeffafça görerek tek tıkla başvur.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">2. QR ile İşe Başla</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  İş yerine vardığında işverenin QR kodunu okut. Mesai başlangıcın ve konumun anında sistem tarafından tescillensin.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">3. Gün Sonu Ödemeni Al</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Mesai bitiminde çıkış onayı verilir. Emanet kasadaki ücretin sıfır komisyon kesintisiyle doğrudan cüzdanına ve IBAN&apos;ına yansır.
                </p>
              </div>
            </div>
          </section>

          {/* İşverenler İçin Süreç */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h2 className="text-2xl font-bold">İşverenler İçin: Dakikalar İçinde Güvenilir Personel</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Restoran, organizasyon, şantiye veya temizlik için anında çözüm.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">1. İlanını Oluştur</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Gereken eleman sayısını, çalışma saatini ve yevmiye tutarını belirle. İlanın bölgedeki uygun çalışanlara saniyeler içinde ulaşsın.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">2. Emanet Kasası Güvencesi</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Yevmiye tutarı emanet hesabında bloke edilir. Çalışan güvenle işine başlar, işveren ise taahhüt edilen hizmeti almadan ödeme onaylanmaz.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">3. İş Bitimi Onayı</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  İş bitiminde çalışanın QR onayını ver. Puanla ve değerlendir; güvenilir çalışan portföyünü her geçen gün büyüt.
                </p>
              </div>
            </div>
          </section>

          {/* Sıkça Sorulan Sorular */}
          <section className="space-y-6 pt-4">
            <h2 className="text-2xl font-bold text-center">Sıkça Sorulan Sorular</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((f, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    {f.q}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Alt Banner CTA */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center space-y-5 shadow-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold">Hemen Başlamaya Hazır mısınız?</h2>
            <p className="text-emerald-100 max-w-xl mx-auto text-sm sm:text-base">
              İster bugün yevmiyeli işe başlayın, ister işletmeniz için aynı gün güvenilir eleman bulun.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href="/">
                <Button size="lg" className="h-12 px-8 rounded-full bg-white text-emerald-800 hover:bg-emerald-50 font-bold shadow-md">
                  Açık İlanları İncele
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
