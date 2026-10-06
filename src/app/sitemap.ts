import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.space-z.ai'
  const now = new Date()

  // 1. Ana Statik Sayfalar
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
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

  return [...staticRoutes, ...cityRoutes, ...categoryRoutes, ...jobRoutes]
}
