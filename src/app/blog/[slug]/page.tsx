import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/shared/header'
import Logo from '@/components/shared/logo'
import { BreadcrumbSchema, ArticleSchema } from '@/components/shared/seo-schema'
import { BLOG_POSTS } from '@/lib/blog-data'
import {
  Calendar,
  Clock,
  User,
  ArrowLeft,
  Share2,
  Tag,
  CheckCircle2,
  Briefcase,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = BLOG_POSTS.find((p) => p.slug === slug)

  if (!post) {
    return {
      title: 'Yazı Bulunamadı | Günübirlik Blog',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${post.title} | Günübirlik Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `${BASE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${BASE_URL}/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = BLOG_POSTS.find((p) => p.slug === slug)

  if (!post) {
    notFound()
  }

  const breadcrumbItems = [
    { name: 'Ana Sayfa', url: BASE_URL },
    { name: 'Blog', url: `${BASE_URL}/blog` },
    { name: post.title, url: `${BASE_URL}/blog/${post.slug}` },
  ]

  // Diğer yazılar
  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2)

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <BreadcrumbSchema items={breadcrumbItems} />
      <ArticleSchema
        title={post.title}
        description={post.excerpt}
        url={`${BASE_URL}/blog/${post.slug}`}
        datePublished={post.date}
        author={post.author.name}
      />
      <Header />

      <main className="flex-1 pt-24 sm:pt-28 pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          
          {/* Geri Dön Butonu */}
          <div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Tüm Blog Yazılarına Dön
            </Link>
          </div>

          {/* Başlık Alanı */}
          <header className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                {post.category}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {post.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {post.readingTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
              {post.title}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {post.excerpt}
            </p>

            {/* Yazar Bilgisi */}
            <div className="flex items-center gap-3 pt-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center">
                {post.author.name[0]}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{post.author.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{post.author.role}</div>
              </div>
            </div>
          </header>

          {/* İçerik */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed space-y-6">
            <div className="whitespace-pre-line text-slate-700 dark:text-slate-300">
              {post.content}
            </div>
          </div>

          {/* Etiketler */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <Tag className="w-4 h-4 text-slate-400" />
            {post.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                #{t}
              </span>
            ))}
          </div>

          {/* İlgili Kategoriler & İlan Arama Banner */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-200 dark:border-emerald-800/40 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              Günübirlik İş Fırsatlarını Keşfedin
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Hemen şimdi konumunuza en yakın yevmiyeli iş ilanlarına göz atabilir veya acil eleman ihtiyacınız için ücretsiz ilan yayınlayabilirsiniz.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  Açık İlanları İncele
                </Button>
              </Link>
              <Link href="/is-arayanlar">
                <Button size="sm" variant="outline">
                  İş Arayan Rehberi
                </Button>
              </Link>
              <Link href="/isverenler">
                <Button size="sm" variant="outline">
                  İşveren Rehberi
                </Button>
              </Link>
            </div>
          </div>

          {/* Diğer Yazılar */}
          {otherPosts.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold">İlginizi Çekebilecek Diğer Rehberler</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {otherPosts.map((op) => (
                  <Link
                    key={op.slug}
                    href={`/blog/${op.slug}`}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 transition-colors block space-y-2 group"
                  >
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {op.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {op.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </article>
      </main>

      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo size="sm" variant="full" />
          <p>© 2026 Günübirlik • Konum Bazlı Günlük İş Platformu</p>
        </div>
      </footer>
    </div>
  )
}
