import { db } from '@/lib/db'
import { BLOG_POSTS, BlogPost } from '@/lib/blog-data'

export interface SeoBlogPostRecord {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  readingTime: string
  coverImage?: string
  authorName: string
  authorRole: string
  tags: string[]
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  schemaType: string
  isPublished: boolean
  isFeatured: boolean
  date: string
  createdAt?: string
  updatedAt?: string
}

export interface SeoSettingsRecord {
  siteTitleTemplate: string
  defaultMetaTitle: string
  defaultMetaDescription: string
  defaultKeywords: string
  canonicalBaseUrl: string
  googleVerificationCode: string
  bingVerificationCode: string
  yandexVerificationCode: string
  googleAnalyticsId: string
  indexNowKey: string
  robotsAllowAll: boolean
  customRobotsTxt: string
  enableJobPostingSchema: boolean
  enableOrganizationSchema: boolean
  enableFaqSchema: boolean
  enableBreadcrumbSchema: boolean
  enableProgrammaticCityPages: boolean
  enableProgrammaticCategoryPages: boolean
  ogDefaultImage: string
  twitterHandle: string
  updatedAt?: string
}

export const DEFAULT_SEO_SETTINGS: SeoSettingsRecord = {
  siteTitleTemplate: '%s | Günübirlik — Günlük & Yevmiyeli İş Panosu',
  defaultMetaTitle: 'Günübirlik — Türkiye Günlük Yevmiyeli İş İlanları & Saha Panosu',
  defaultMetaDescription:
    '81 ilde günlük, saatlik ve yevmiyeli iş ilanları. Emanet kasa güvencesi, QR vardiya doğrulaması ve aynı gün nakit/IBAN hakediş.',
  defaultKeywords:
    'günlük iş, yevmiyeli iş, part time iş, günlük iş ilanları, aynı gün ödeme iş, garson iş ilanları, depo paketleme iş, kurye iş ilanları, öğrenci ek iş',
  canonicalBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://gunubirlik.qrders.com.tr',
  googleVerificationCode: '',
  bingVerificationCode: '',
  yandexVerificationCode: '',
  googleAnalyticsId: '',
  indexNowKey: '',
  robotsAllowAll: true,
  customRobotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/',
  enableJobPostingSchema: true,
  enableOrganizationSchema: true,
  enableFaqSchema: true,
  enableBreadcrumbSchema: true,
  enableProgrammaticCityPages: true,
  enableProgrammaticCategoryPages: true,
  ogDefaultImage: '/images/hero-workers.png',
  twitterHandle: '@gunubirlik',
}

let tablesInitialized = false

export async function ensureSeoTables(): Promise<void> {
  if (tablesInitialized) return
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SeoBlogPost" (
        "id" TEXT PRIMARY KEY,
        "slug" TEXT UNIQUE NOT NULL,
        "title" TEXT NOT NULL,
        "excerpt" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'Yevmiye Rehberi',
        "readingTime" TEXT NOT NULL DEFAULT '5 dk okuma',
        "coverImage" TEXT,
        "authorName" TEXT NOT NULL DEFAULT 'Günübirlik Saha Ekibi',
        "authorRole" TEXT NOT NULL DEFAULT 'Piyasa Araştırmaları',
        "tagsJson" TEXT NOT NULL DEFAULT '[]',
        "metaTitle" TEXT,
        "metaDescription" TEXT,
        "canonicalUrl" TEXT,
        "schemaType" TEXT NOT NULL DEFAULT 'Article',
        "isPublished" BOOLEAN NOT NULL DEFAULT true,
        "isFeatured" BOOLEAN NOT NULL DEFAULT false,
        "date" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SeoSetting" (
        "id" TEXT PRIMARY KEY,
        "payloadJson" TEXT NOT NULL,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await db.$executeRawUnsafe(`
      INSERT INTO "SeoSetting" ("id", "payloadJson", "updatedAt")
      VALUES ('singleton', $1, CURRENT_TIMESTAMP)
      ON CONFLICT ("id") DO NOTHING
    `, JSON.stringify(DEFAULT_SEO_SETTINGS))

    // Seed initial blog posts if table is empty
    const countRes = await db.$queryRawUnsafe<Array<{ cnt: bigint | number }>>(
      `SELECT COUNT(*)::int as cnt FROM "SeoBlogPost"`
    )
    const count = Number(countRes?.[0]?.cnt ?? 0)
    if (count === 0) {
      for (let i = 0; i < BLOG_POSTS.length; i++) {
        const p = BLOG_POSTS[i]
        const id = `seed_${i + 1}_${Date.now()}`
        await db.$executeRawUnsafe(
          `INSERT INTO "SeoBlogPost" (
            "id", "slug", "title", "excerpt", "content", "category", "readingTime",
            "coverImage", "authorName", "authorRole", "tagsJson", "metaTitle",
            "metaDescription", "schemaType", "isPublished", "isFeatured", "date"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
          ON CONFLICT ("slug") DO NOTHING`,
          id,
          p.slug,
          p.title,
          p.excerpt,
          p.content.trim(),
          p.category,
          p.readingTime,
          p.coverImage || null,
          p.author.name,
          p.author.role,
          JSON.stringify(p.tags || []),
          `${p.title} | Günübirlik Yevmiye Rehberi`,
          p.excerpt,
          'Article',
          true,
          i === 0,
          p.date
        )
      }
    }

    tablesInitialized = true
  } catch (err) {
    console.error('ensureSeoTables warning:', err)
  }
}

function mapRowToBlogPost(row: any): SeoBlogPostRecord {
  let tags: string[] = []
  try {
    tags = row.tagsJson ? JSON.parse(row.tagsJson) : []
  } catch {
    tags = []
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category || 'Yevmiye Rehberi',
    readingTime: row.readingTime || '5 dk okuma',
    coverImage: row.coverImage || undefined,
    authorName: row.authorName || 'Günübirlik Saha Ekibi',
    authorRole: row.authorRole || 'Piyasa Araştırmaları',
    tags,
    metaTitle: row.metaTitle || undefined,
    metaDescription: row.metaDescription || undefined,
    canonicalUrl: row.canonicalUrl || undefined,
    schemaType: row.schemaType || 'Article',
    isPublished: Boolean(row.isPublished),
    isFeatured: Boolean(row.isFeatured),
    date: row.date || new Date().toISOString().slice(0, 10),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : undefined,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : undefined,
  }
}

export async function getAllSeoBlogPosts(includeDrafts = false): Promise<SeoBlogPostRecord[]> {
  try {
    await ensureSeoTables()
    const query = includeDrafts
      ? `SELECT * FROM "SeoBlogPost" ORDER BY "isFeatured" DESC, "date" DESC, "createdAt" DESC`
      : `SELECT * FROM "SeoBlogPost" WHERE "isPublished" = true ORDER BY "isFeatured" DESC, "date" DESC, "createdAt" DESC`
    const rows = await db.$queryRawUnsafe<any[]>(query)
    if (rows && rows.length > 0) {
      return rows.map(mapRowToBlogPost)
    }
  } catch (err) {
    console.error('getAllSeoBlogPosts fallback to static:', err)
  }

  // Fallback to static BLOG_POSTS
  return BLOG_POSTS.map((p, idx) => ({
    id: `static_${idx}`,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    category: p.category,
    readingTime: p.readingTime,
    coverImage: p.coverImage,
    authorName: p.author.name,
    authorRole: p.author.role,
    tags: p.tags,
    metaTitle: `${p.title} | Günübirlik Yevmiye Rehberi`,
    metaDescription: p.excerpt,
    schemaType: 'Article',
    isPublished: true,
    isFeatured: idx === 0,
    date: p.date,
  }))
}

export async function getSeoBlogPostBySlug(
  slug: string,
  includeDrafts = false
): Promise<SeoBlogPostRecord | null> {
  try {
    await ensureSeoTables()
    const rows = await db.$queryRawUnsafe<any[]>(
      `SELECT * FROM "SeoBlogPost" WHERE "slug" = $1 LIMIT 1`,
      slug
    )
    if (rows && rows.length > 0) {
      const mapped = mapRowToBlogPost(rows[0])
      if (!includeDrafts && !mapped.isPublished) return null
      return mapped
    }
  } catch (err) {
    console.error('getSeoBlogPostBySlug fallback:', err)
  }

  const found = BLOG_POSTS.find((p) => p.slug === slug)
  if (!found) return null
  return {
    id: `static_${found.slug}`,
    slug: found.slug,
    title: found.title,
    excerpt: found.excerpt,
    content: found.content,
    category: found.category,
    readingTime: found.readingTime,
    coverImage: found.coverImage,
    authorName: found.author.name,
    authorRole: found.author.role,
    tags: found.tags,
    metaTitle: `${found.title} | Günübirlik Yevmiye Rehberi`,
    metaDescription: found.excerpt,
    schemaType: 'Article',
    isPublished: true,
    isFeatured: false,
    date: found.date,
  }
}

export function slugifyTr(text: string): string {
  const trMap: Record<string, string> = {
    ç: 'c',
    Ç: 'c',
    ğ: 'g',
    Ğ: 'g',
    ı: 'i',
    I: 'i',
    İ: 'i',
    ö: 'o',
    Ö: 'o',
    ş: 's',
    Ş: 's',
    ü: 'u',
    Ü: 'u',
  }
  return text
    .split('')
    .map((ch) => trMap[ch] || ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function upsertSeoBlogPost(input: {
  id?: string
  slug?: string
  title: string
  excerpt: string
  content: string
  category?: string
  readingTime?: string
  coverImage?: string
  authorName?: string
  authorRole?: string
  tags?: string[]
  metaTitle?: string
  metaDescription?: string
  canonicalUrl?: string
  schemaType?: string
  isPublished?: boolean
  isFeatured?: boolean
  date?: string
}): Promise<SeoBlogPostRecord> {
  await ensureSeoTables()
  const cleanSlug = slugifyTr(input.slug || input.title)
  const id = input.id || `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const tagsJson = JSON.stringify(input.tags || [])
  const dateStr = input.date || new Date().toISOString().slice(0, 10)

  if (input.isFeatured) {
    await db.$executeRawUnsafe(`UPDATE "SeoBlogPost" SET "isFeatured" = false`)
  }

  await db.$executeRawUnsafe(
    `INSERT INTO "SeoBlogPost" (
      "id", "slug", "title", "excerpt", "content", "category", "readingTime",
      "coverImage", "authorName", "authorRole", "tagsJson", "metaTitle",
      "metaDescription", "canonicalUrl", "schemaType", "isPublished", "isFeatured", "date", "updatedAt"
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("slug") DO UPDATE SET
      "title" = EXCLUDED."title",
      "excerpt" = EXCLUDED."excerpt",
      "content" = EXCLUDED."content",
      "category" = EXCLUDED."category",
      "readingTime" = EXCLUDED."readingTime",
      "coverImage" = EXCLUDED."coverImage",
      "authorName" = EXCLUDED."authorName",
      "authorRole" = EXCLUDED."authorRole",
      "tagsJson" = EXCLUDED."tagsJson",
      "metaTitle" = EXCLUDED."metaTitle",
      "metaDescription" = EXCLUDED."metaDescription",
      "canonicalUrl" = EXCLUDED."canonicalUrl",
      "schemaType" = EXCLUDED."schemaType",
      "isPublished" = EXCLUDED."isPublished",
      "isFeatured" = EXCLUDED."isFeatured",
      "date" = EXCLUDED."date",
      "updatedAt" = CURRENT_TIMESTAMP`,
    id,
    cleanSlug,
    input.title.trim(),
    input.excerpt.trim(),
    input.content.trim(),
    input.category || 'Yevmiye Rehberi',
    input.readingTime || '5 dk okuma',
    input.coverImage || null,
    input.authorName || 'Günübirlik Saha Ekibi',
    input.authorRole || 'Piyasa Araştırmaları',
    tagsJson,
    input.metaTitle || `${input.title.trim()} | Günübirlik Yevmiye Rehberi`,
    input.metaDescription || input.excerpt.trim(),
    input.canonicalUrl || null,
    input.schemaType || 'Article',
    input.isPublished ?? true,
    input.isFeatured ?? false,
    dateStr
  )

  const saved = await getSeoBlogPostBySlug(cleanSlug, true)
  return saved!
}

export async function deleteSeoBlogPost(slugOrId: string): Promise<void> {
  await ensureSeoTables()
  await db.$executeRawUnsafe(
    `DELETE FROM "SeoBlogPost" WHERE "slug" = $1 OR "id" = $1`,
    slugOrId
  )
}

export async function getSeoSettings(): Promise<SeoSettingsRecord> {
  try {
    await ensureSeoTables()
    const rows = await db.$queryRawUnsafe<any[]>(
      `SELECT * FROM "SeoSetting" WHERE "id" = 'singleton' LIMIT 1`
    )
    if (rows && rows.length > 0 && rows[0].payloadJson) {
      const parsed = JSON.parse(rows[0].payloadJson)
      return {
        ...DEFAULT_SEO_SETTINGS,
        ...parsed,
        updatedAt: rows[0].updatedAt ? new Date(rows[0].updatedAt).toISOString() : undefined,
      }
    }
  } catch (err) {
    console.error('getSeoSettings error:', err)
  }
  return DEFAULT_SEO_SETTINGS
}

export async function updateSeoSettings(
  patch: Partial<SeoSettingsRecord>
): Promise<SeoSettingsRecord> {
  await ensureSeoTables()
  const current = await getSeoSettings()
  const merged: SeoSettingsRecord = {
    ...current,
    ...patch,
  }
  const payloadJson = JSON.stringify(merged)
  await db.$executeRawUnsafe(
    `INSERT INTO "SeoSetting" ("id", "payloadJson", "updatedAt")
     VALUES ('singleton', $1, CURRENT_TIMESTAMP)
     ON CONFLICT ("id") DO UPDATE SET
       "payloadJson" = EXCLUDED."payloadJson",
       "updatedAt" = CURRENT_TIMESTAMP`,
    payloadJson
  )
  return getSeoSettings()
}
