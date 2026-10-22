import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/header'
import Logo from '@/components/shared/logo'
import { BreadcrumbSchema } from '@/components/shared/seo-schema'
import { ArrowRight } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr'

export const metadata: Metadata = {
  title: 'İşverenler İçin Acil Günübirlik Eleman Temini — Günübirlik',
  description:
    'Restoran, kafe, inşaat, etkinlik ve temizlik sektörlerinde aynı gün güvenilir yevmiyeli eleman bulun. Emanet ödeme sistemiyle sıfır risk.',
  alternates: {
    canonical: `${BASE_URL}/isverenler`,
  },
  openGraph: {
    title: 'Acil Günlük Eleman Temini | Günübirlik İşveren Panosu',
    description: 'Dakikalar içinde yevmiyeli garson, usta, depo elemanı veya temizlik personeli bulun.',
    url: `${BASE_URL}/isverenler`,
  },
}

export default function IsverenlerPage() {
  const breadcrumbItems = [
    { name: 'Ana Sayfa', url: BASE_URL },
    { name: 'İşverenler', url: `${BASE_URL}/isverenler` },
  ]

  const sectors = [
    {
      code: 'RST',
      title: 'Restoran, Kafe & Organizasyon',
      roles: 'Garson, komi, bulaşıkçı, barista, banket görevlisi',
    },
    {
      code: 'İNŞ',
      title: 'İnşaat, Şantiye & Tadilat',
      roles: 'Boya ustası, alçıpan, tesisat, kırım ve taşıma ekibi',
    },
    {
      code: 'TMZ',
      title: 'Temizlik & Tesis Yönetimi',
      roles: 'Ofis temizliği, inşaat sonrası temizlik, kat görevlisi',
    },
    {
      code: 'NKL',
      title: 'Depo, Lojistik & Sevkiyat',
      roles: 'Yükleme-boşaltma, kolileme, etiketleme, saha kuryesi',
    },
  ]

  const advantages = [
    {
      code: 'AVANTAJ 01',
      title: 'Aynı Gün Personel Eşleşmesi',
      desc: 'Rapor alan personel, hafta sonu yoğunluğu veya ani sevkiyat durumlarında ilanınız bölgedeki aktif çalışanlara anında iletilir.',
    },
    {
      code: 'AVANTAJ 02',
      title: 'Emanet Havuzu ile Kontrollü Ödeme',
      desc: 'Yevmiye tutarı vardiya başında bloke edilir; ancak personel QR kod ile giriş yapıp mesaiyi tamamlamadan ödeme serbest bırakılmaz.',
    },
    {
      code: 'AVANTAJ 03',
      title: 'Geçmiş Puan ve Referans Takibi',
      desc: 'Başvuran adayların daha önce tamamladığı vardiya sayısını, işe zamanında geliş oranını ve önceki işveren yorumlarını görürsünüz.',
    },
    {
      code: 'AVANTAJ 04',
      title: 'Sadece Çalışılan Gün Kadar Maliyet',
      desc: 'Sabit personel gideri altına girmeden, yalnızca iş yoğunluğunuzun arttığı günlerde bütçenize uygun yevmiye ile destek alırsınız.',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F2] dark:bg-[#0C0E0D] text-[#141615] dark:text-[#F2F1ED]">
      <BreadcrumbSchema items={breadcrumbItems} />
      <Header />

      <main className="flex-1 pt-8 sm:pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Masthead */}
          <div className="border-b border-[#D8D5CC] dark:border-[#262C29] pb-8">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#C84B31] dark:text-[#F28B73] font-semibold mb-2">
              İŞVEREN & İŞLETME ÇÖZÜMLERİ • ACİL VARDİYA DESTEĞİ
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-8 space-y-3">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#141615] dark:text-white leading-[1.15]">
                  Acil eleman ihtiyacınızı aynı gün, doğrulanmış adaylarla çözün.
                </h1>
                <p className="text-sm sm:text-base text-[#5C615E] dark:text-[#9AA19D] max-w-2xl leading-relaxed">
                  Restoran, şantiye, depo ve organizasyonlarda yaşanan anlık personel eksikliklerini konum tabanlı bildirim ve emanet ödeme güvencesiyle kapatın.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <Link
                  href="/"
                  className="px-4 py-2.5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <span>Panoya Git & İlan Aç</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Sektörel Kapsam */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-[#141615] dark:text-white">
                En Çok Eleman Temin Edilen Sektörler
              </h2>
              <span className="font-mono text-xs text-[#5C615E] dark:text-[#949B97]">
                AKTİF KATEGORİLER
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sectors.map((s) => (
                <div
                  key={s.code}
                  className="p-5 rounded-lg bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] space-y-2"
                >
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F0EFEA] dark:bg-[#1E2421] text-[#454A47] dark:text-[#B8C0BC] border border-[#E2E0D8] dark:border-[#2C3330] inline-block">
                    {s.code}
                  </span>
                  <h3 className="text-[15px] font-bold text-[#141615] dark:text-white">
                    {s.title}
                  </h3>
                  <p className="text-[13px] text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                    {s.roles}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* İşveren Avantajları */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-[#141615] dark:text-white">
                Operasyonel Güvence ve Kontrol
              </h2>
              <span className="font-mono text-xs text-[#5C615E] dark:text-[#949B97]">
                İŞVEREN STANDARTLARI
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {advantages.map((a) => (
                <div
                  key={a.code}
                  className="p-5 rounded-lg bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] space-y-2"
                >
                  <div className="font-mono text-[11px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                    {a.code}
                  </div>
                  <h3 className="text-[15px] font-bold text-[#141615] dark:text-white">
                    {a.title}
                  </h3>
                  <p className="text-[13px] text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                    {a.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-auto bg-white dark:bg-[#141716] border-t border-[#E2E0D8] dark:border-[#252B28] py-6 px-4 text-xs text-[#5C615E] dark:text-[#949B97]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo size="sm" variant="full" />
          <span className="font-mono text-[11px]">© 2026 Günübirlik • Günlük ve Yevmiyeli İş Panosu</span>
        </div>
      </footer>
    </div>
  )
}
