import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/shared/header'
import Logo from '@/components/shared/logo'
import { BreadcrumbSchema } from '@/components/shared/seo-schema'
import { BLOG_POSTS } from '@/lib/blog-data'
import { Calendar, Clock, BookOpen, ArrowRight, Tag, Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr'

export const metadata: Metadata = {
  title: 'Blog & Günlük İş Rehberi — Yevmiye Tarifeleri, Öğrenci İşleri ve Piyasa Analizleri',
  description:
    '2026 günlük yevmiye fiyatları, öğrenci ek iş tavsiyeleri, acil işçi bulma rehberleri ve günlük çalışanların hakları hakkında en kapsamlı makaleler.',
  alternates: {
    canonical: `${BASE_URL}/blog`,
  },
  openGraph: {
    title: 'Günübirlik Blog — Günlük İş ve Yevmiye Rehberi',
    description: 'En güncel yevmiye tarifeleri, öğrenci part-time rehberleri ve piyasa analizleri.',
    url: `${BASE_URL}/blog`,
  },
}

export default function BlogIndexPage() {
  const breadcrumbItems = [
    { name: 'Ana Sayfa', url: BASE_URL },
    { name: 'Blog', url: `${BASE_URL}/blog` },
  ]

  const featured = BLOG_POSTS[0]
  const rest = BLOG_POSTS.slice(1)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <BreadcrumbSchema items={breadcrumbItems} />
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <BookOpen className="w-3.5 h-3.5" />
              Günübirlik Bilgi Merkezi & Rehberler
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Günübirlik Blog
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400">
              Güncel yevmiye piyasası, öğrenci rehberleri, işveren tavsiyeleri ve esnek çalışma modelleri.
            </p>
          </div>

          {/* Öne Çıkan Yazı */}
          {featured && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-md hover:border-emerald-500/60 transition-all group">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                      {featured.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featured.readingTime}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {featured.date}
                    </span>
                  </div>

                  <Link href={`/blog/${featured.slug}`}>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {featured.title}
                    </h2>
                  </Link>

                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                    {featured.excerpt}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Yazar: <span className="font-semibold text-slate-700 dark:text-slate-300">{featured.author.name}</span>
                    </div>
                    <Link
                      href={`/blog/${featured.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:gap-2.5 transition-all"
                    >
                      Devamını Oku
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Diğer Yazılar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rest.map((post) => (
              <article
                key={post.slug}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                      {post.category}
                    </span>
                    <span>•</span>
                    <span>{post.readingTime}</span>
                  </div>

                  <Link href={`/blog/${post.slug}`}>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{post.date}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline"
                  >
                    Makaleyi Oku
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Alt Banner */}
          <div className="p-8 rounded-3xl bg-emerald-600 text-white text-center space-y-4 shadow-lg">
            <h2 className="text-2xl font-bold">Hemen İş Bulun veya İlan Verin</h2>
            <p className="text-emerald-100 text-sm max-w-lg mx-auto">
              Rehberleri incelediniz mi? Şimdi semtinizdeki güncel ilanlara göz atın veya eleman ihtiyacınızı dakikalar içinde karşılayın.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button size="lg" className="rounded-full bg-white text-emerald-800 hover:bg-emerald-50 font-bold">
                  Canlı İlanları Gör
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
