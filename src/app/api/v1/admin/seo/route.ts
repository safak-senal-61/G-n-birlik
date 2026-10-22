import { NextRequest } from 'next/server'
import { requireAdmin, ok, fail } from '@/server/lib/admin-auth'
import { withErrorHandler } from '@/server/lib/route'
import {
  getAllSeoBlogPosts,
  getSeoSettings,
  updateSeoSettings,
  upsertSeoBlogPost,
  deleteSeoBlogPost,
} from '@/server/services/seo-blog.service'

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const [settings, posts] = await Promise.all([
    getSeoSettings(),
    getAllSeoBlogPosts(true),
  ])

  return ok({
    settings,
    posts,
    stats: {
      totalPosts: posts.length,
      publishedPosts: posts.filter((p) => p.isPublished).length,
      draftPosts: posts.filter((p) => !p.isPublished).length,
      cityLandingPages: 81,
      categoryLandingPages: 8,
    },
  })
})

export const PUT = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  const updated = await updateSeoSettings(body)
  return ok(updated, 'SEO yapılandırması kaydedildi.')
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const body = await req.json()
  if (!body.title || !body.title.trim()) {
    return fail('Yazı başlığı zorunludur.', 400)
  }
  if (!body.excerpt || !body.excerpt.trim()) {
    return fail('Kısa özet (Meta Description) zorunludur.', 400)
  }
  if (!body.content || !body.content.trim()) {
    return fail('Makale içeriği zorunludur.', 400)
  }

  const post = await upsertSeoBlogPost({
    id: body.id,
    slug: body.slug,
    title: body.title,
    excerpt: body.excerpt,
    content: body.content,
    category: body.category,
    readingTime: body.readingTime,
    coverImage: body.coverImage,
    authorName: body.authorName,
    authorRole: body.authorRole,
    tags: Array.isArray(body.tags)
      ? body.tags
      : typeof body.tags === 'string'
      ? body.tags
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [],
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
    canonicalUrl: body.canonicalUrl,
    schemaType: body.schemaType,
    isPublished: body.isPublished ?? true,
    isFeatured: body.isFeatured ?? false,
    date: body.date,
  })

  return ok(post, 'Blog yazısı kaydedildi ve yayına alındı.')
})

export const DELETE = withErrorHandler(async (req: NextRequest) => {
  const { user, error } = await requireAdmin(req)
  if (error || !user) return error || fail('Yetkisiz.', 401)

  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return fail('Silinecek yazı slug parametresi gerekli.', 400)

  await deleteSeoBlogPost(slug)
  return ok({ deleted: slug }, 'Blog yazısı silindi.')
})
