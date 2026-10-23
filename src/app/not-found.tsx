import Link from 'next/link'
import type { Metadata } from 'next'
import Logo from '@/components/shared/logo'
import NotFoundAnimation from '@/components/shared/not-found-player'
import { Home, Search, HelpCircle, ArrowRight, ShieldCheck, MapPin, Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: '404 — Sayfa Bulunamadı | Günübirlik',
  description: 'Aradığınız sayfa veya ilan kaydı bulunamadı. Günübirlik ana sayfasına dönerek güncel yevmiyeli iş ilanlarına göz atabilirsiniz.',
  robots: {
    index: false,
    follow: false,
  },
}

const POPULAR_SEARCHES = [
  { label: 'İstanbul İlanları', href: '/sehir/istanbul', icon: MapPin },
  { label: 'Trabzon İlanları', href: '/sehir/trabzon', icon: MapPin },
  { label: 'Ankara İlanları', href: '/sehir/ankara', icon: MapPin },
  { label: 'İnşaat Yevmiyeleri', href: '/kategori/insaat', icon: Briefcase },
  { label: 'Restoran & Kafe', href: '/kategori/restaurant', icon: Briefcase },
  { label: 'Temizlik İşleri', href: '/kategori/temizlik', icon: Briefcase },
]

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#0C0E0D] text-[#141615] dark:text-[#F2F1ED] flex flex-col justify-between selection:bg-[#0D6847] selection:text-white">
      {/* Üst Şerit */}
      <header className="border-b border-[#D8D5CC] dark:border-[#242926] bg-[#F6F5F2]/90 dark:bg-[#0C0E0D]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="Günübirlik Ana Sayfa">
            <Logo size="sm" variant="full" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EAF3EE] dark:bg-[#162921] border border-[#0D6847]/20 font-mono text-[10px] font-bold text-[#0D6847] dark:text-[#5CD6A5] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D6847] dark:bg-[#5CD6A5] animate-pulse" />
              STATUS_404
            </span>
          </div>
        </div>
      </header>

      {/* Ana Gövde */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center text-center">
        {/* Lottie 404 Animasyonu */}
        <div className="w-full mb-4">
          <NotFoundAnimation />
        </div>

        {/* Tipografi ve Bilgi */}
        <div className="max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#262C29] font-mono text-[11px] font-semibold text-[#5C615E] dark:text-[#949B97]">
            <span className="text-[#C84B31] dark:text-[#FF7A5C] font-bold">HATA KODU</span>
            <span>•</span>
            <span>404_PAGE_NOT_FOUND</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#141615] dark:text-white">
            Aradığınız sayfa veya vardiya bulunamadı
          </h1>

          <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97] leading-relaxed">
            Gezinmeye çalıştığınız bağlantı adresi değişmiş, ilanın başvuru süresi dolmuş veya sayfa sistemden kaldırılmış olabilir.
          </p>
        </div>

        {/* Aksiyon Butonları */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
          <Link
            href="/"
            className="flex-1 sm:flex-initial h-11 px-6 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white text-xs sm:text-sm font-bold tracking-wide inline-flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Ana Sayfaya Dön</span>
          </Link>

          <Link
            href="/nasil-calisir"
            className="flex-1 sm:flex-initial h-11 px-5 rounded-md border border-[#D8D5CC] dark:border-[#2A302D] bg-white dark:bg-[#141716] hover:bg-[#EFECE6] dark:hover:bg-[#1C211F] text-xs sm:text-sm font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5]" />
            <span>Nasıl Çalışır?</span>
          </Link>
        </div>

        {/* Hızlı Rotalar ve Popüler Aramalar */}
        <div className="mt-10 pt-8 border-t border-[#D8D5CC] dark:border-[#242926] w-full max-w-2xl">
          <div className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#5C615E] dark:text-[#949B97] mb-3">
            Popüler Sayfalara Göz Atın
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POPULAR_SEARCHES.map((item, idx) => {
              const Icon = item.icon
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className="p-2.5 rounded-md bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#262C29] hover:border-[#0D6847] text-left flex items-center justify-between text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] transition-colors group"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-[#8A8F8C] group-hover:text-[#0D6847] dark:group-hover:text-[#5CD6A5] transition-colors shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      </main>

      {/* Alt Bilgi */}
      <footer className="border-t border-[#D8D5CC] dark:border-[#242926] bg-white dark:bg-[#141716] py-5 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#5C615E] dark:text-[#949B97]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5]" />
            <span>Günübirlik Emanet (Escrow) ve Saha Güvenliği</span>
          </div>
          <div className="font-mono text-[11px]">
            © {new Date().getFullYear()} Günübirlik • https://gunubirlik.qrders.com.tr
          </div>
        </div>
      </footer>
    </div>
  )
}
