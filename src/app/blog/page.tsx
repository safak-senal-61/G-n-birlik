import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/header'
import Logo from '@/components/shared/logo'
import { BreadcrumbSchema } from '@/components/shared/seo-schema'
import { BLOG_POSTS } from '@/lib/blog-data'
import { ArrowRight } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr'

export const metadata: Metadata = {
  title: 'Yevmiye Rehberi & Saha Notları — Günübirlik',
  description:
    '2026 günlük yevmiye tarifeleri, öğrenci ek iş rehberleri, acil işçi temini ve günlük çalışanların hakları üzerine saha incelemeleri.',
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
  openGraph: {
    title: 'Günübirlik Yevmiye Rehberi — Saha Notları ve Piyasa Cetveli',
    description: 'Güncel yevmiye tarifeleri, öğrenci part-time rehberleri ve sektörel analizler.',
    url: `${BASE_URL}/blog`,
  },
}

export default function BlogIndexPage() {
  const breadcrumbItems = [
    { name: 'Ana Sayfa', url: BASE_URL },
    { name: 'Yevmiye Rehberi', url: `${BASE_URL}/blog` },
  ]

  const featured = BLOG_POSTS[0]
  const rest = BLOG_POSTS.slice(1)

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F2] dark:bg-[#0C0E0D] text-[#141615] dark:text-[#F2F1ED]">
      <BreadcrumbSchema items={breadcrumbItems} />
      <Header />

      <main className="flex-1 pt-8 sm:pt-12 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
          {/* Masthead */}
          <div className="border-b border-[#D8D5CC] dark:border-[#262C29] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5] font-semibold mb-1.5">
                SAHA REHBERİ • PİYASA ANALİZİ & MEVZUAT
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#141615] dark:text-white">
                Yevmiye Rehberi & Bülten
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97] max-w-md">
              Sektörel günlük ücret cetvelleri, öğrenci vardiya rehberleri ve işletmeler için personel yönetimi notları.
            </p>
          </div>

          {/* Manşet Dosya */}
          {featured && (
            <article className="p-6 sm:p-8 rounded-lg bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847] transition-colors">
              <div className="space-y-4 max-w-4xl">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
                  <span className="px-2 py-0.5 rounded bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5] font-semibold">
                    DOSYA • {featured.category.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>{featured.date}</span>
                  <span>•</span>
                  <span>{featured.readingTime} okuma</span>
                </div>

                <Link href={`/blog/${featured.slug}`} className="block group">
                  <h2 className="text-xl sm:text-3xl font-bold text-[#141615] dark:text-white group-hover:text-[#0D6847] dark:group-hover:text-[#5CD6A5] transition-colors leading-snug">
                    {featured.title}
                  </h2>
                </Link>

                <p className="text-sm sm:text-base text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                  {featured.excerpt}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-[#E2E0D8] dark:border-[#252B28]">
                  <span className="text-xs text-[#5C615E] dark:text-[#949B97]">
                    Hazırlayan: <strong className="text-[#141615] dark:text-white">{featured.author.name}</strong>
                  </span>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D6847] dark:text-[#5CD6A5] hover:underline"
                  >
                    <span>Yazıyı Oku</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          )}

          {/* Diğer Yazılar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rest.map((post, idx) => (
              <article
                key={post.slug}
                className="p-5 sm:p-6 rounded-lg bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847] transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
                    <span className="font-semibold text-[#141615] dark:text-[#D5D9D7]">
                      0{idx + 2} / {post.category.toUpperCase()}
                    </span>
                    <span>{post.readingTime}</span>
                  </div>

                  <Link href={`/blog/${post.slug}`} className="block group">
                    <h3 className="font-bold text-base sm:text-lg text-[#141615] dark:text-white group-hover:text-[#0D6847] dark:group-hover:text-[#5CD6A5] transition-colors leading-snug">
                      {post.title}
                    </h3>
                  </Link>

                  <p className="text-[13px] text-[#5C615E] dark:text-[#949B97] line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#8A8F8C]">{post.date}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D6847] dark:text-[#5CD6A5] hover:underline"
                  >
                    <span>İncele</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
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
