import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/header'
import Logo from '@/components/shared/logo'
import { BreadcrumbSchema } from '@/components/shared/seo-schema'
import { ArrowRight } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr'

export const metadata: Metadata = {
  title: 'İşleyiş & Emanet Ödeme Sistemi — Günübirlik',
  description:
    'Günübirlik iş bulma ve yevmiyeli eleman temin süreci nasıl işler? Emanet kasa güvencesi, QR mesai doğrulaması ve aynı gün ödeme sistemi.',
  alternates: {
    canonical: `${BASE_URL}/nasil-calisir`,
  },
  openGraph: {
    title: 'Günübirlik İşleyiş Rehberi — Emanet Kasa ve QR Mesai Sistemi',
    description: 'Emanet ödeme, konum eşleşmesi ve QR doğrulama ile aynı gün yevmiye ödemesi.',
    url: `${BASE_URL}/nasil-calisir`,
  },
}

export default function NasilCalisirPage() {
  const breadcrumbItems = [
    { name: 'Ana Sayfa', url: BASE_URL },
    { name: 'İşleyiş', url: `${BASE_URL}/nasil-calisir` },
  ]

  const workerSteps = [
    {
      code: 'ADIM 01',
      title: 'Semtindeki İlanı Seç ve Başvur',
      desc: 'İlan panosunda günlük yevmiye tutarı, vardiya saati ve ilçe bilgisi açıkça yazar. Şartları sana uyan ilana tek tıkla başvurunu ilet.',
    },
    {
      code: 'ADIM 02',
      title: 'Giriş QR Kodunu Okutarak Mesaiye Başla',
      desc: 'Sabah iş yerine vardığında işverenin ekranındaki QR kodu okutursun. Mesai başlangıç saatin ve konumun sistem kayıtlarına geçer.',
    },
    {
      code: 'ADIM 03',
      title: 'Vardiya Bitiminde Net Yevmiyeni Al',
      desc: 'Akşam mesai bittiğinde çıkış onayı verilir. İşverenin önceden Emanet Kasası’na yatırdığı tutar kesintisiz olarak cüzdanına aktarılır.',
    },
  ]

  const employerSteps = [
    {
      code: 'ADIM 01',
      title: 'İhtiyacı ve Günlük Ücreti Tanımla',
      desc: 'Aradığınız pozisyonu, kişi sayısını, çalışma saatlerini ve net yevmiye bedelini belirterek ilanı yayına alın. Çevredeki uygun adaylara anında bildirim gider.',
    },
    {
      code: 'ADIM 02',
      title: 'Yevmiye Bedelini Emanet Kasaya Bloke Et',
      desc: 'Kabul ettiğiniz adayın günlük ücreti güvenli havuzda bloke edilir. İş tamamlanana kadar tutar güvendedir; aday ise parasının hazır olduğunu bilerek vaktinde işe gelir.',
    },
    {
      code: 'ADIM 03',
      title: 'QR Doğrulama ile Hizmeti Onayla',
      desc: 'Giriş ve çıkış saatleri QR kod ile kayıt altına alınır. Vardiya sorunsuz tamamlandığında ödeme serbest bırakılır ve adayı puanlayabilirsiniz.',
    },
  ]

  const faqs = [
    {
      code: 'SORU 01',
      q: 'Yevmiyemin ödeneceğinden nasıl emin olabilirim?',
      a: 'İşveren başvurunuzu onayladığında günlük yevmiye tutarını Emanet Kasası havuzuna yatırır. Siz mesaiye başladığınızda para zaten sistemde bloke edilmiştir; vardiya bitip çıkış QR kodu onaylandığında doğrudan hesabınıza geçer.',
    },
    {
      code: 'SORU 02',
      q: 'Çalışanlardan komisyon veya üyelik ücreti alınıyor mu?',
      a: 'Hayır. Günübirlik üzerinde iş arayanlar, öğrenciler ve yevmiyeli ustalar için üyelik ve başvuru tamamen ücretsizdir. İlanda yazan net yevmiye tutarından kesinti yapılmaz.',
    },
    {
      code: 'SORU 03',
      q: 'Acil eleman ilanlarına ne kadar sürede dönüş oluyor?',
      a: 'İlan yayınlandığı anda o ilçedeki aktif adaylara bildirim gönderilir. Restoran, kafe, temizlik ve depo ilanlarında ortalama ilk başvuru süresi 15 ila 30 dakikadır.',
    },
    {
      code: 'SORU 04',
      q: 'Aday işe gelmezse işverenin yatırdığı tutar ne olur?',
      a: 'Giriş QR kodu okutulmadığı ve vardiya başlamadığı takdirde Emanet Kasası’ndaki blokaj kaldırılır ve tutar işverenin bakiyesine eksiksiz iade edilir.',
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F2] dark:bg-[#0C0E0D] text-[#141615] dark:text-[#F2F1ED]">
      <BreadcrumbSchema items={breadcrumbItems} />
      <Header />

      <main className="flex-1 pt-8 sm:pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Üst Başlık / Masthead */}
          <div className="border-b border-[#D8D5CC] dark:border-[#262C29] pb-8">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5] font-semibold mb-2">
              SİSTEM İŞLEYİŞ KILAVUZU • EMANET & QR PROTOKOLÜ
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-8">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#141615] dark:text-white leading-[1.15]">
                  Emeği ve ödemeyi güvenceye alan iki taraflı çalışma düzeni.
                </h1>
              </div>
              <div className="lg:col-span-4">
                <p className="text-sm text-[#5C615E] dark:text-[#9AA19D] leading-relaxed">
                  Günübirlik, sözlü anlaşmazlıkları ortadan kaldırmak için ön provizyonlu emanet kasa ve QR vardiya doğrulamasıyla çalışır.
                </p>
              </div>
            </div>
          </div>

          {/* İki Sütunlu Süreç Tablosu */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Çalışan Süreci */}
            <section className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#181C1A] flex items-center justify-between">
                <div>
                  <span className="font-mono text-[11px] font-semibold text-[#0D6847] dark:text-[#5CD6A5] uppercase">
                    TARAF A • ÇALIŞANLAR & ÖĞRENCİLER
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#141615] dark:text-white mt-0.5">
                    Sabah Başla, Akşam Yevmiyeni Al
                  </h2>
                </div>
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5]">
                  %0 KOMİSYON
                </span>
              </div>

              <div className="divide-y divide-[#E2E0D8] dark:divide-[#252B28]">
                {workerSteps.map((s) => (
                  <div key={s.code} className="p-5 space-y-1.5">
                    <div className="font-mono text-[11px] font-semibold text-[#5C615E] dark:text-[#949B97]">
                      {s.code}
                    </div>
                    <h3 className="text-[15px] font-bold text-[#141615] dark:text-white">
                      {s.title}
                    </h3>
                    <p className="text-[13px] text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* İşveren Süreci */}
            <section className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#181C1A] flex items-center justify-between">
                <div>
                  <span className="font-mono text-[11px] font-semibold text-[#C84B31] dark:text-[#F28B73] uppercase">
                    TARAF B • İŞLETMELER & ŞANTİYELER
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#141615] dark:text-white mt-0.5">
                    Aynı Gün Doğrulanmış Eleman Temini
                  </h2>
                </div>
                <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-[#FBEEE9] dark:bg-[#2A1915] text-[#B43B21] dark:text-[#F28B73]">
                  ORT. 20 DK
                </span>
              </div>

              <div className="divide-y divide-[#E2E0D8] dark:divide-[#252B28]">
                {employerSteps.map((s) => (
                  <div key={s.code} className="p-5 space-y-1.5">
                    <div className="font-mono text-[11px] font-semibold text-[#5C615E] dark:text-[#949B97]">
                      {s.code}
                    </div>
                    <h3 className="text-[15px] font-bold text-[#141615] dark:text-white">
                      {s.title}
                    </h3>
                    <p className="text-[13px] text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sıkça Sorulan Sorular */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between border-b border-[#D8D5CC] dark:border-[#262C29] pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-[#141615] dark:text-white">
                Sıkça Sorulan Sorular
              </h2>
              <span className="font-mono text-xs text-[#5C615E] dark:text-[#949B97]">
                KURALLAR & GÜVENCE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {faqs.map((f) => (
                <div
                  key={f.code}
                  className="p-5 rounded-lg bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] space-y-2"
                >
                  <div className="font-mono text-[11px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                    {f.code}
                  </div>
                  <h3 className="font-bold text-[15px] text-[#141615] dark:text-white">
                    {f.q}
                  </h3>
                  <p className="text-[13px] text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                    {f.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Alt Yönlendirme */}
          <div className="p-6 sm:p-8 rounded-lg bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#141615] dark:text-white">
                Açık iş ilanlarını hemen inceleyin
              </h2>
              <p className="text-[13px] text-[#5C615E] dark:text-[#949B97]">
                Kayıt olmadan tüm şehirlerdeki aktif vardiyaları ve yevmiye tutarlarını görebilirsiniz.
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-md bg-[#141615] hover:bg-[#292D2B] dark:bg-[#F2F1ED] dark:hover:bg-white text-white dark:text-[#141615] text-xs font-semibold inline-flex items-center gap-2 flex-shrink-0 transition-colors"
            >
              <span>İlan Panosuna Git</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
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
