import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/shared/header'
import Logo from '@/components/shared/logo'
import { BreadcrumbSchema, ArticleSchema } from '@/components/shared/seo-schema'
import { BLOG_POSTS } from '@/lib/blog-data'
import { ArrowLeft, ArrowRight } from 'lucide-react'

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
      title: 'Yazı Bulunamadı | Günübirlik',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: `${post.title} | Günübirlik Yevmiye Rehberi`,
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
    { name: 'Yevmiye Rehberi', url: `${BASE_URL}/blog` },
    { name: post.title, url: `${BASE_URL}/blog/${post.slug}` },
  ]

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2)

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F5F2] dark:bg-[#0C0E0D] text-[#141615] dark:text-[#F2F1ED]">
      <BreadcrumbSchema items={breadcrumbItems} />
      <ArticleSchema
        title={post.title}
        description={post.excerpt}
        url={`${BASE_URL}/blog/${post.slug}`}
        datePublished={post.date}
        author={post.author.name}
      />
      <Header />

      <main className="flex-1 pt-8 sm:pt-12 pb-16">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#5C615E] hover:text-[#141615] dark:text-[#949B97] dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Yevmiye Rehberine Dön</span>
            </Link>
          </div>

          <header className="space-y-4 border-b border-[#D8D5CC] dark:border-[#262C29] pb-6">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
              <span className="px-2 py-0.5 rounded bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5] font-semibold">
                {post.category.toUpperCase()}
              </span>
              <span>•</span>
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readingTime} okuma</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight text-[#141615] dark:text-white">
              {post.title}
            </h1>

            <p className="text-sm sm:text-base text-[#5C615E] dark:text-[#949B97] leading-relaxed">
              {post.excerpt}
            </p>

            <div className="pt-2 text-xs text-[#5C615E] dark:text-[#949B97]">
              Yazar: <strong className="text-[#141615] dark:text-white">{post.author.name}</strong> ({post.author.role})
            </div>
          </header>

          {/* Makale Gövdesi */}
          <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-6 sm:p-8">
            <div className="whitespace-pre-line text-[15px] sm:text-base leading-relaxed text-[#252927] dark:text-[#DCE0DD]">
              {post.content}
            </div>

            <div className="mt-8 pt-4 border-t border-[#E2E0D8] dark:border-[#252B28] flex flex-wrap items-center gap-1.5">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-[#F0EFEA] dark:bg-[#1E2421] font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>

          {/* İlan Panosu Yönlendirmesi */}
          <div className="p-6 rounded-lg bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-mono text-[11px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                CANLI İLAN PANOSU
              </div>
              <h2 className="text-base font-bold text-[#141615] dark:text-white">
                Semtinizdeki güncel yevmiyeli işleri inceleyin
              </h2>
              <p className="text-xs text-[#5C615E] dark:text-[#949B97]">
                Açık ilanlara göz atabilir veya işletmeniz için aynı gün eleman ilanı oluşturabilirsiniz.
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-1.5 flex-shrink-0"
            >
              <span>Açık İlanları Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Diğer Rehberler */}
          {otherPosts.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#D8D5CC] dark:border-[#262C29]">
              <h2 className="text-sm font-mono uppercase tracking-wider text-[#5C615E] dark:text-[#949B97] font-semibold">
                Diğer Saha Rehberleri
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {otherPosts.map((op) => (
                  <Link
                    key={op.slug}
                    href={`/blog/${op.slug}`}
                    className="p-4 rounded-lg bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847] transition-colors block space-y-1"
                  >
                    <span className="font-mono text-[10px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                      {op.category.toUpperCase()}
                    </span>
                    <h3 className="font-bold text-sm text-[#141615] dark:text-white line-clamp-2">
                      {op.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <footer className="mt-auto bg-white dark:bg-[#141716] border-t border-[#E2E0D8] dark:border-[#252B28] py-6 px-4 text-xs text-[#5C615E] dark:text-[#949B97]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Logo size="sm" variant="full" />
          <span className="font-mono text-[11px]">© 2026 Günübirlik • Günlük ve Yevmiyeli İş Panosu</span>
        </div>
      </footer>
    </div>
  )
}
