import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/header'
import Logo from '@/components/shared/logo'
import { BreadcrumbSchema } from '@/components/shared/seo-schema'
import { ArrowRight } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr'

export const metadata: Metadata = {
  title: 'Çalışanlar & Öğrenciler İçin Günlük Yevmiyeli İşler — Günübirlik',
  description:
    'Öğrenciler, ek gelir arayanlar ve günübirlik ustalar için güvenli iş panosu. Emanet ödeme güvencesiyle aynı gün net yevmiye kazanın.',
  alternates: {
    canonical: `${BASE_URL}/is-arayanlar`,
  },
  openGraph: {
    title: 'Çalışanlar İçin Günlük İş Panosu | Günübirlik',
    description: 'Sabah başla, akşam yevmiyeni sıfır komisyon kesintisiyle doğrudan cüzdanına al.',
    url: `${BASE_URL}/is-arayanlar`,
  },
}

export default function IsArayanlarPage() {
  const breadcrumbItems = [
    { name: 'Ana Sayfa', url: BASE_URL },
    { name: 'Çalışanlar', url: `${BASE_URL}/is-arayanlar` },
  ]

  const specs = [
    {
      code: '01 / ÖDEME',
      title: 'Aynı Gün Net Yevmiye',
      desc: 'Haftalık veya aylık maaş beklemezsiniz. Vardiya bittiğinde ücretiniz doğrudan cüzdanınıza ve banka hesabınıza aktarılır.',
    },
    {
      code: '02 / GÜVENCE',
      title: 'Emanet Kasa Koruması',
      desc: 'İşveren ücreti vardiya başlamadan önce havuza yatırır. Çalıştığınız saatlerin karşılığı sistemde kilitli tutulur.',
    },
    {
      code: '03 / KESİNTİSİZ',
      title: '%0 Çalışan Komisyonu',
      desc: 'İlanda 1.500 ₺ yazıyorsa elinize net 1.500 ₺ geçer. Çalışanlardan hizmet bedeli veya komisyon kesilmez.',
    },
    {
      code: '04 / ZAMANLAMA',
      title: 'Zorunlu Mesai Yok',
      desc: 'Sadece müsait olduğunuz günlerde, ders aralarında veya hafta sonlarında açılan vardiyalara başvurursunuz.',
    },
    {
      code: '05 / KONUM',
      title: 'Semtinize Yakın Vardiyalar',
      desc: 'İlçe ve mesafe filtresiyle yürüme mesafesindeki restoran, depo, etkinlik veya temizlik işlerini listelersiniz.',
    },
    {
      code: '06 / SİCİL',
      title: 'Doğrulanmış Çalışan Puanı',
      desc: 'Zamanında gittiğiniz ve başarıyla tamamladığınız her iş puanınızı artırır; yüksek yevmiyeli ilanlarda öncelik kazanırsınız.',
    },
  ]

  const popularRoles = [
    { code: 'RST', name: 'Garson, Komi & Barista', wage: '1.100 ₺ – 1.800 ₺ / gün' },
    { code: 'NKL', name: 'Depo, Paketleme & Taşıma', wage: '1.300 ₺ – 2.200 ₺ / gün' },
    { code: 'TMZ', name: 'Ev, Ofis & İnşaat Sonrası Temizlik', wage: '1.400 ₺ – 2.400 ₺ / gün' },
    { code: 'İNŞ', name: 'Boya, Alçı, Montaj & Şantiye Ustası', wage: '2.000 ₺ – 3.500 ₺ / gün' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F2] dark:bg-[#0C0E0D] text-[#141615] dark:text-[#F2F1ED]">
      <BreadcrumbSchema items={breadcrumbItems} />
      <Header />

      <main className="flex-1 pt-8 sm:pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Masthead */}
          <div className="border-b border-[#D8D5CC] dark:border-[#262C29] pb-8 space-y-4">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5] font-semibold">
              ÇALIŞAN & ÖĞRENCİ REHBERİ • GÜNLÜK VARDİYA SİSTEMİ
            </div>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#141615] dark:text-white leading-[1.15]">
                  Boş günlerinizde çalışın, mesai bitiminde yevmiyenizi net olarak alın.
                </h1>
                <p className="text-sm sm:text-base text-[#5C615E] dark:text-[#9AA19D] max-w-2xl leading-relaxed">
                  Uzun özgeçmiş formları veya belirsiz mülakat süreçleri yok. Konumunuza yakın açık vardiyaları inceleyin, QR kod ile mesaiye başlayın.
                </p>
              </div>
              <Link
                href="/"
                className="px-4 py-2.5 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-2 shrink-0 self-start lg:self-auto transition-colors"
              >
                <span>Açık İlanları İncele</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 6'lı Teknik Tablo */}
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-[#141615] dark:text-white">
                Çalışan Hakları ve Sistem Standartları
              </h2>
              <span className="font-mono text-xs text-[#5C615E] dark:text-[#949B97]">
                6 TEMEL KURAL
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specs.map((item) => (
                <div
                  key={item.code}
                  className="p-5 rounded-lg bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] space-y-2"
                >
                  <div className="font-mono text-[11px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                    {item.code}
                  </div>
                  <h3 className="text-[15px] font-bold text-[#141615] dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-[13px] text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Güncel Yevmiye Cetveli */}
          <section className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#181C1A] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#141615] dark:text-white">
                  Sektörlere Göre Ortalama Günlük Yevmiye Aralıkları (2026)
                </h2>
                <p className="text-xs text-[#5C615E] dark:text-[#949B97]">
                  İlanlardaki net ödemeler şehir, vardiya süresi ve uzmanlık düzeyine göre belirlenir.
                </p>
              </div>
              <span className="font-mono text-[11px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                PİYASA CETVELİ
              </span>
            </div>

            <div className="divide-y divide-[#E2E0D8] dark:divide-[#252B28]">
              {popularRoles.map((role) => (
                <div
                  key={role.code}
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-[#F0EFEA] dark:bg-[#1E2421] text-[#454A47] dark:text-[#B8C0BC] border border-[#E2E0D8] dark:border-[#2C3330]">
                      {role.code}
                    </span>
                    <span className="text-sm font-semibold text-[#141615] dark:text-white">
                      {role.name}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#0D6847] dark:text-[#5CD6A5]">
                    {role.wage}
                  </span>
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
