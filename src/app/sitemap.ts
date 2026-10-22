import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { getAllSeoBlogPosts } from '@/server/services/seo-blog.service'

export const revalidate = 3600 // Her saat otomatik yenilenir

const POPULAR_CITIES = [
  'trabzon',
  'istanbul',
  'ankara',
  'izmir',
  'bursa',
  'antalya',
  'kocaeli',
  'adana',
  'samsun',
  'gaziantep',
  'konya',
  'eskisehir',
  'sakarya',
  'rize',
  'ordu',
  'giresun',
]

const CATEGORIES = [
  'insaat',
  'restaurant',
  'temizlik',
  'nakliye',
  'tarim',
  'teknik',
  'saglik',
  'diger',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr'
  const now = new Date()

  // 1. Ana Statik Sayfalar & Onboarding
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/nasil-calisir`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/is-arayanlar`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/isverenler`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/gizlilik-politikasi`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kullanim-kosullari`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/mesafeli-satis-sozlesmesi`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kvkk-aydinlatma-metni`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/sozlesmeler`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/api-doc`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // 2. Şehir Landing Sayfaları (Programmatic Local SEO)
  const cityRoutes: MetadataRoute.Sitemap = POPULAR_CITIES.map((city) => ({
    url: `${baseUrl}/sehir/${city}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  }))

  // 3. Kategori Sayfaları
  const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/kategori/${cat}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85,
  }))

  // 4. Veritabanındaki Aktif İlanlar (Google for Jobs)
  let jobRoutes: MetadataRoute.Sitemap = []
  try {
    const jobs = await db.job.findMany({
      where: { status: 'OPEN' },
      select: { id: true, updatedAt: true },
      take: 1000,
      orderBy: { updatedAt: 'desc' },
    })

    jobRoutes = jobs.map((job) => ({
      url: `${baseUrl}/ilan/${job.id}`,
      lastModified: job.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch (err) {
    console.error('[Sitemap] Aktif ilanlar çekilemedi:', err)
  }

  // 5. Blog Makaleleri (SEO & Discover - Veritabanı Destekli)
  const posts = await getAllSeoBlogPosts(false)
  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticRoutes, ...cityRoutes, ...categoryRoutes, ...blogRoutes, ...jobRoutes]
}
