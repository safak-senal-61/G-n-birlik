import Link from 'next/link'
import { LEGAL_CONTRACTS, LegalContract } from '@/lib/legal-contracts'
import { ShieldCheck, FileText, ArrowLeft, Scale, Lock, CheckCircle2, Globe } from 'lucide-react'
import Logo from '@/components/shared/logo'

export default function LegalDocumentView({
  contract,
  showAllInOnePage = false,
}: {
  contract: LegalContract
  showAllInOnePage?: boolean
}) {
  const contractsToRender = showAllInOnePage ? LEGAL_CONTRACTS : [contract]

  return (
    <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#0C0E0D] text-[#141615] dark:text-[#F2F1ED]">
      {/* Üst Başlık Çubuğu */}
      <header className="sticky top-0 z-30 bg-[#F6F5F2]/95 dark:bg-[#0C0E0D]/95 backdrop-blur border-b border-[#D8D5CC] dark:border-[#242926]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center">
              <Logo size="sm" variant="full" />
            </Link>
            <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5] font-bold">
              {showAllInOnePage ? 'HUKUK & SÖZLEŞME MERKEZİ' : `${contract.code} • RESMİ METİN`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/sozlesmeler"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-[#D8D5CC] dark:border-[#2A302D] bg-[#EFECE6] dark:bg-[#181C1A] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] hover:border-[#0D6847] transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
              <span>Tüm Sözleşmeler</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-[#D8D5CC] dark:border-[#2A302D] bg-white dark:bg-[#141716] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] hover:border-[#0D6847] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ana Sayfa</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Ayrı Ayrı Sözleşme Sayfası Sekmeleri (Gerçek URL Bağlantıları) */}
        <nav
          aria-label="Yasal Sözleşmeler Navigasyonu"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5"
        >
          {LEGAL_CONTRACTS.map((item) => {
            const isActive = !showAllInOnePage && item.id === contract.id
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`p-3.5 rounded-md border transition-colors flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? 'bg-[#0D6847] border-[#0D6847] text-white shadow-xs'
                    : 'bg-white dark:bg-[#141716] border-[#D8D5CC] dark:border-[#262C29] text-[#141615] dark:text-[#F2F1ED] hover:border-[#0D6847]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-wider ${
                      isActive ? 'text-white/80' : 'text-[#0D6847] dark:text-[#5CD6A5]'
                    }`}
                  >
                    {item.code} • {item.path}
                  </span>
                  <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#8A8F8C]'}`} />
                </div>
                <div className="text-xs font-extrabold">{item.shortTitle}</div>
              </Link>
            )
          })}
        </nav>

        {/* Sözleşme İçerikleri (Tamamen SSR / Google Bot Uyumlu HTML) */}
        {contractsToRender.map((doc) => (
          <article
            key={doc.id}
            id={doc.id}
            className="scroll-mt-24 rounded-md bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#262C29] overflow-hidden shadow-2xs"
          >
            {/* Belge Üst Başlığı */}
            <div className="p-6 sm:p-8 bg-[#EFECE6]/70 dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
                  <Scale className="w-3.5 h-3.5" />
                  <span>
                    {doc.code} • RESMİ YASAL METİN ({doc.path})
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
                  Yürürlük ve Son Güncelleme: {doc.updatedAt}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#141615] dark:text-white">
                {doc.title}
              </h1>

              <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                {doc.summary}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#5C615E] dark:text-[#949B97]">
                <span className="inline-flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
                  Alan Adı: https://gunubirlik.qrders.com.tr
                </span>
                <span>•</span>
                <span>İletişim: destek@qrders.com.tr</span>
              </div>
            </div>

            {/* Maddeler */}
            <div className="p-6 sm:p-8 space-y-5">
              {doc.sections.map((sec, idx) => (
                <section
                  key={idx}
                  className="p-4 sm:p-5 rounded-md bg-[#F6F5F2] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] space-y-2.5"
                >
                  <h2 className="text-xs sm:text-sm font-extrabold text-[#141615] dark:text-white tracking-tight">
                    {sec.heading}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#424744] dark:text-[#B8BFBC] leading-relaxed">
                    {sec.body}
                  </p>
                  {sec.bullets && sec.bullets.length > 0 && (
                    <ul className="space-y-1.5 pt-1 pl-4 list-disc text-xs sm:text-sm text-[#424744] dark:text-[#B8BFBC] leading-relaxed">
                      {sec.bullets.map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>
        ))}

        {/* Alt Güvenlik Özeti */}
        <div className="p-5 sm:p-6 rounded-md bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#262C29] grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0D6847] dark:text-[#5CD6A5] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-extrabold text-[#141615] dark:text-white">
                Emanet (Escrow) Güvencesi
              </div>
              <p className="text-[11px] text-[#5C615E] dark:text-[#949B97] mt-0.5">
                Günlük yevmiyeler vardiya tamamlanana kadar güvenli emanet havuzunda korunur.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#0D6847] dark:text-[#5CD6A5] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-extrabold text-[#141615] dark:text-white">
                Google OAuth &amp; KVKK Uyumlu
              </div>
              <p className="text-[11px] text-[#5C615E] dark:text-[#949B97] mt-0.5">
                Google API Kullanıcı Verileri Politikası (Limited Use) ve 6698 sayılı KVKK standartlarına tam uyumludur.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#0D6847] dark:text-[#5CD6A5] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-extrabold text-[#141615] dark:text-white">
                Zorunlu Rol &amp; Sözleşme Onayı
              </div>
              <p className="text-[11px] text-[#5C615E] dark:text-[#949B97] mt-0.5">
                İşçi veya İşveren seçimi yapılmadan ve sözleşmeler onaylanmadan kayıt oluşturulmaz.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
