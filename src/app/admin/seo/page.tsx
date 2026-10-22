'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/lib/admin-store'
import {
  Globe,
  FileText,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Search,
  Sparkles,
  Code2,
  Save,
  RefreshCw,
  Eye,
  Tag,
  Image as ImageIcon,
  Star,
  Check,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface BlogPostItem {
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
}

interface SeoSettings {
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
}

const PRESET_IMAGES = [
  { label: 'Saha & Lojistik', url: '/images/hero-workers.png' },
  { label: 'Garson & Restoran', url: '/images/waiter-service.png' },
  { label: 'Motorlu Kurye', url: '/images/courier-moto.png' },
  { label: 'Depo & Sevkiyat', url: '/images/warehouse-worker.png' },
  { label: 'Temizlik & Düzen', url: '/images/cleaning-staff.png' },
  { label: 'Barista & Öğrenci', url: '/images/student-barista.png' },
]

const CATEGORIES = [
  'Yevmiye Rehberi',
  'Öğrenci Rehberi',
  'İşveren Rehberi',
  'Hukuk & Güvenlik',
  'Kariyer & Analiz',
  'Saha Notları',
]

export default function AdminSeoPage() {
  const [activeTab, setActiveTab] = useState<'blog' | 'editor' | 'config' | 'programmatic'>('blog')
  const [loading, setLoading] = useState(true)
  const [savingPost, setSavingPost] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  const [posts, setPosts] = useState<BlogPostItem[]>([])
  const [settings, setSettings] = useState<SeoSettings>({
    siteTitleTemplate: '%s | Günübirlik — Günlük & Yevmiyeli İş Panosu',
    defaultMetaTitle: 'Günübirlik — Türkiye Günlük Yevmiyeli İş İlanları & Saha Panosu',
    defaultMetaDescription:
      '81 ilde günlük, saatlik ve yevmiyeli iş ilanları. Emanet kasa güvencesi, QR vardiya doğrulaması ve aynı gün nakit/IBAN hakediş.',
    defaultKeywords:
      'günlük iş, yevmiyeli iş, part time iş, günlük iş ilanları, aynı gün ödeme iş, garson iş ilanları',
    canonicalBaseUrl: 'https://gunubirlik.qrders.com.tr',
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
  })

  // Blog Editor Form
  const emptyPostForm = {
    id: '',
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    category: 'Yevmiye Rehberi',
    readingTime: '5 dk okuma',
    coverImage: '/images/hero-workers.png',
    authorName: 'Günübirlik Saha Ekibi',
    authorRole: 'Piyasa Araştırmaları',
    tagsInput: 'günlük iş, yevmiye, aynı gün ödeme',
    metaTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    schemaType: 'Article',
    isPublished: true,
    isFeatured: false,
    date: new Date().toISOString().slice(0, 10),
  }
  const [postForm, setPostForm] = useState(emptyPostForm)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/v1/admin/seo')
      if (res.data?.posts) setPosts(res.data.posts)
      if (res.data?.settings) setSettings(res.data.settings)
    } catch (err: any) {
      toast.error(err.message || 'SEO verileri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenNewPost = () => {
    setPostForm(emptyPostForm)
    setActiveTab('editor')
  }

  const handleEditPost = (post: BlogPostItem) => {
    setPostForm({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category || 'Yevmiye Rehberi',
      readingTime: post.readingTime || '5 dk okuma',
      coverImage: post.coverImage || '/images/hero-workers.png',
      authorName: post.authorName || 'Günübirlik Saha Ekibi',
      authorRole: post.authorRole || 'Piyasa Araştırmaları',
      tagsInput: (post.tags || []).join(', '),
      metaTitle: post.metaTitle || `${post.title} | Günübirlik Yevmiye Rehberi`,
      metaDescription: post.metaDescription || post.excerpt,
      canonicalUrl: post.canonicalUrl || '',
      schemaType: post.schemaType || 'Article',
      isPublished: post.isPublished ?? true,
      isFeatured: post.isFeatured ?? false,
      date: post.date || new Date().toISOString().slice(0, 10),
    })
    setActiveTab('editor')
  }

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postForm.title.trim()) {
      toast.error('Lütfen yazı başlığı girin')
      return
    }
    if (!postForm.excerpt.trim()) {
      toast.error('Lütfen kısa özet / meta açıklama girin')
      return
    }
    if (!postForm.content.trim()) {
      toast.error('Lütfen makale içeriğini girin')
      return
    }

    setSavingPost(true)
    try {
      await adminFetch('/api/v1/admin/seo', {
        method: 'POST',
        body: JSON.stringify({
          ...postForm,
          tags: postForm.tagsInput
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })
      toast.success('SEO Blog yazısı kaydedildi ve yayına alındı!')
      await loadData()
      setActiveTab('blog')
    } catch (err: any) {
      toast.error(err.message || 'Yazı kaydedilemedi')
    } finally {
      setSavingPost(false)
    }
  }

  const handleDeletePost = async (slug: string, title: string) => {
    if (!confirm(`"${title}" başlıklı yazıyı silmek istediğinize emin misiniz?`)) return
    try {
      await adminFetch(`/api/v1/admin/seo?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      })
      toast.success('Blog yazısı silindi')
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Silinemedi')
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingConfig(true)
    try {
      await adminFetch('/api/v1/admin/seo', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      toast.success('SEO yapılandırması kaydedildi!')
    } catch (err: any) {
      toast.error(err.message || 'SEO ayarları kaydedilemedi')
    } finally {
      setSavingConfig(false)
    }
  }

  const filteredPosts = posts.filter(
    (p) =>
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E0D8] dark:border-[#252B28] pb-5">
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#27A878] mb-1">
            ARAMA MOTORU & İÇERİK MERKEZİ • SEO / BLOG
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141716] dark:text-[#F0F2F1]">
            SEO Yapılandırma & Blog Yönetimi
          </h1>
          <p className="text-xs sm:text-sm text-[#535A56] dark:text-[#9DA6A0] mt-1">
            Yevmiye rehberi blog yazılarını yayınlayın, meta etiketlerini, Schema.org JSON-LD yapısal verilerini ve programatik SEO sayfalarını yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-3 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847] text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] inline-flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#27A878]" />
            <span>Canlı Blogu Aç</span>
          </a>
          <button
            type="button"
            onClick={handleOpenNewPost}
            className="h-9 px-4 rounded-md bg-[#0D6847] hover:bg-[#0A5238] !text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni SEO Blog Yazısı Ekle</span>
          </button>
        </div>
      </div>

      {/* Özet Metrik Şeridi */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28]">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0] block">
            YAYINDAKİ BLOG YAZILARI
          </span>
          <div className="font-mono text-2xl font-bold text-[#141716] dark:text-[#F0F2F1] mt-1">
            {posts.filter((p) => p.isPublished).length}
          </div>
          <span className="text-[11px] text-[#0D6847] dark:text-[#27A878] font-medium">
            Article Schema + Sitemap Aktif
          </span>
        </div>

        <div className="p-4 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28]">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0] block">
            PROGRAMATİK ŞEHİR SAYFALARI
          </span>
          <div className="font-mono text-2xl font-bold text-[#141716] dark:text-[#F0F2F1] mt-1">
            81 İl
          </div>
          <span className="text-[11px] text-[#535A56] dark:text-[#9DA6A0]">
            /sehir/[il] otomatik indeksleme
          </span>
        </div>

        <div className="p-4 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28]">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0] block">
            SEKTÖREL KATEGORİ SAYFALARI
          </span>
          <div className="font-mono text-2xl font-bold text-[#141716] dark:text-[#F0F2F1] mt-1">
            8 Sektör
          </div>
          <span className="text-[11px] text-[#535A56] dark:text-[#9DA6A0]">
            /kategori/[sektor] dizinleri
          </span>
        </div>

        <div className="p-4 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28]">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0] block">
            YAPISAL VERİ (JSON-LD)
          </span>
          <div className="font-mono text-2xl font-bold text-[#0D6847] dark:text-[#27A878] mt-1">
            4 Şema
          </div>
          <span className="text-[11px] text-[#535A56] dark:text-[#9DA6A0]">
            JobPosting • Article • FAQ • Org
          </span>
        </div>
      </div>

      {/* Sekme Navigasyonu */}
      <div className="bg-[#EFECE6] dark:bg-[#1A1E1C] p-1.5 rounded-md border border-[#E2E0D8] dark:border-[#252B28] grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {[
          { id: 'blog', label: '01 / Blog Yazıları', icon: FileText },
          { id: 'editor', label: postForm.id ? '02 / Yazı Düzenle' : '02 / Yeni Yazı Ekle', icon: Edit3 },
          { id: 'config', label: '03 / SEO Yapılandırma', icon: Globe },
          { id: 'programmatic', label: '04 / Sitemap & Şemalar', icon: Code2 },
        ].map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                active
                  ? 'bg-[#0D6847] !text-white border-[#0D6847] shadow-xs'
                  : 'bg-white dark:bg-[#141716] text-[#5A605D] dark:text-[#8E9893] border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847]/50 hover:text-[#111312] dark:hover:text-[#F3F4F3]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? '!text-white' : 'text-[#0D6847] dark:text-[#27AB78]'}`} />
              <span className={`truncate ${active ? '!text-white' : ''}`}>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ================================================================== */}
      {/* TAB 1: BLOG YAZILARI LİSTESİ */}
      {/* ================================================================== */}
      {activeTab === 'blog' && (
        <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md overflow-hidden">
          <div className="p-4 sm:px-5 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#141716] dark:text-[#F0F2F1]">
                Yevmiye Rehberi & SEO Makale Cetveli
              </h2>
              <p className="text-xs text-[#535A56] dark:text-[#9DA6A0]">
                Eklediğiniz tüm yazılar otomatik olarak `/blog` sayfasında ve `/sitemap.xml` haritasında yayınlanır.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#535A56] dark:text-[#9DA6A0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Başlık veya kategori ara..."
                className="w-full h-9 pl-8 pr-3 rounded-md bg-white dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-xs text-[#141716] dark:text-[#F0F2F1]"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-xs font-mono text-[#535A56] dark:text-[#9DA6A0]">
              YÜKLENİYOR...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1]">
                Kayıtlı blog yazısı bulunamadı.
              </p>
              <button
                type="button"
                onClick={handleOpenNewPost}
                className="h-9 px-4 rounded-md bg-[#0D6847] text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                İlk SEO Yazısını Oluştur
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E2E0D8] dark:divide-[#252B28]">
              {filteredPosts.map((post, idx) => (
                <div
                  key={post.slug}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#F6F5F2] dark:hover:bg-[#1A1E1C]/60 transition-colors"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {post.coverImage && (
                      <div className="w-16 h-16 rounded-md overflow-hidden border border-[#E2E0D8] dark:border-[#252B28] bg-[#EFECE6] dark:bg-[#0C0E0D] shrink-0 hidden sm:block">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover dark:brightness-90 dark:contrast-105"
                        />
                      </div>
                    )}
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-[#0D6847]/15 dark:bg-[#0D6847]/25 text-[#0D6847] dark:text-[#27AB78] border border-[#0D6847]/30 font-semibold uppercase">
                          0{idx + 1} / {post.category}
                        </span>
                        {post.isFeatured && (
                          <span className="px-2 py-0.5 rounded bg-[#C84B31]/15 dark:bg-[#C84B31]/25 text-[#C84B31] dark:text-[#FF7A5C] border border-[#C84B31]/30 font-semibold uppercase">
                            ★ MANŞET YAZISI
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded font-semibold uppercase border ${
                            post.isPublished
                              ? 'bg-[#0D6847]/15 dark:bg-[#0D6847]/25 text-[#0D6847] dark:text-[#27AB78] border-[#0D6847]/30'
                              : 'bg-[#EFECE6] dark:bg-[#1A1E1C] text-[#535A56] dark:text-[#9DA6A0] border-[#E2E0D8] dark:border-[#252B28]'
                          }`}
                        >
                          {post.isPublished ? 'YAYINDA' : 'TASLAK'}
                        </span>
                        <span className="text-[#535A56] dark:text-[#9DA6A0]">
                          {post.date} • {post.readingTime}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#141716] dark:text-[#F0F2F1] leading-snug">
                        {post.title}
                      </h3>

                      <p className="text-xs text-[#535A56] dark:text-[#9DA6A0] line-clamp-2">
                        {post.excerpt}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="font-mono text-[10px] text-[#535A56] dark:text-[#9DA6A0]">
                          URL: /blog/{post.slug}
                        </span>
                        {post.tags?.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-[#535A56] dark:text-[#9DA6A0]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <a
                      href={`/blog/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-3 rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-[#F6F5F2] dark:bg-[#1A1E1C] hover:border-[#0D6847] text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#27AB78]" />
                      <span>Görüntüle</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleEditPost(post)}
                      className="h-8 px-3 rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-[#F6F5F2] dark:bg-[#1A1E1C] hover:border-[#0D6847] text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#27AB78]" />
                      <span>Düzenle</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePost(post.slug, post.title)}
                      className="h-8 px-2.5 rounded-md border border-[#C84B31]/30 bg-[#C84B31]/10 dark:bg-[#C84B31]/20 text-[#C84B31] dark:text-[#FF7A5C] hover:bg-[#C84B31] hover:!text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================== */}
      {/* TAB 2: BLOG YAZISI EKLE / DÜZENLE EDİTÖRÜ */}
      {/* ================================================================== */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSavePost} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Sol: Makale İçerik Editörü (8 Kolon) */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md overflow-hidden">
              <div className="px-5 py-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
                <span className="font-semibold text-sm text-[#141716] dark:text-[#F0F2F1]">
                  {postForm.id ? 'SEO Blog Yazısını Düzenle' : 'Yeni SEO Blog Yazısı Oluştur'}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#0D6847] dark:text-[#27A878]">
                  MARKDOWN & HTML DESTEKLİ
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                    Makale Başlığı (H1) *
                  </label>
                  <input
                    type="text"
                    required
                    value={postForm.title}
                    onChange={(e) => {
                      const title = e.target.value
                      setPostForm((prev) => ({
                        ...prev,
                        title,
                        metaTitle: prev.metaTitle || `${title} | Günübirlik Yevmiye Rehberi`,
                      }))
                    }}
                    placeholder="Örn: 2026 İstanbul Günlük Garson ve Komi Yevmiye Ücretleri"
                    className="w-full h-10 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-sm font-semibold text-[#141716] dark:text-[#F0F2F1]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      URL Slug (Boş bırakılırsa başlıktan otomatik üretilir)
                    </label>
                    <div className="flex items-center rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] overflow-hidden">
                      <span className="px-2.5 py-2 bg-[#EFECE6] dark:bg-[#181C1A] font-mono text-xs text-[#535A56] dark:text-[#9DA6A0] border-r border-[#E2E0D8] dark:border-[#252B28]">
                        /blog/
                      </span>
                      <input
                        type="text"
                        value={postForm.slug}
                        onChange={(e) => setPostForm({ ...postForm, slug: e.target.value })}
                        placeholder="2026-istanbul-garson-yevmiye-ucretleri"
                        className="flex-1 h-10 px-3 bg-transparent font-mono text-xs text-[#141716] dark:text-[#F0F2F1] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      Kategori *
                    </label>
                    <select
                      value={postForm.category}
                      onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">
                      Kısa Özet & Meta Açıklaması (Excerpt) *
                    </label>
                    <span className="font-mono text-[10px] text-[#535A56] dark:text-[#9DA6A0]">
                      {postForm.excerpt.length} / 160 önerilen
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={postForm.excerpt}
                    onChange={(e) =>
                      setPostForm({
                        ...postForm,
                        excerpt: e.target.value,
                        metaDescription: e.target.value,
                      })
                    }
                    placeholder="Google arama sonuçlarında ve blog kartlarında görünecek 1-2 cümlelik özet..."
                    className="w-full p-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-xs sm:text-sm text-[#141716] dark:text-[#F0F2F1]"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">
                      Makale İçeriği *
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setPostForm((prev) => ({
                            ...prev,
                            content:
                              prev.content +
                              `\n\n## Sektörel Günlük Yevmiye Tablosu\n\nGünlük iş piyasasında vardiya ücretleri işin aciliyetine, konumuna ve mesai saatine göre belirlenmektedir.\n\n### Dikkat Edilmesi Gerekenler\n- Emanet kasa onayı olmadan vardiyaya başlamayın.\n- İş başlangıcında ve bitişinde QR kodu okutun.\n- Hakedişiniz aynı gün cüzdanınıza aktarılır.`,
                          }))
                        }
                        className="font-mono text-[10px] px-2 py-1 rounded bg-[#0D6847]/15 dark:bg-[#0D6847]/25 text-[#0D6847] dark:text-[#27AB78] border border-[#0D6847]/30 hover:bg-[#0D6847] hover:!text-white transition-colors"
                      >
                        + SEO Alt Başlık Şablonu Ekle
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={14}
                    required
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    placeholder="Makale metnini buraya yazın. Alt başlıklar için ## Başlık formatını kullanabilirsiniz..."
                    className="w-full p-3.5 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-sm leading-relaxed text-[#141716] dark:text-[#F0F2F1] font-sans"
                  />
                </div>

                {/* Kapak Görseli Seçimi */}
                <div className="space-y-2 pt-2 border-t border-[#E2E0D8] dark:border-[#252B28]">
                  <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">
                    Kapak Görseli URL veya Hazır Saha Fotoğrafı
                  </label>
                  <input
                    type="text"
                    value={postForm.coverImage}
                    onChange={(e) => setPostForm({ ...postForm, coverImage: e.target.value })}
                    placeholder="/images/hero-workers.png veya https://..."
                    className="w-full h-9 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => setPostForm({ ...postForm, coverImage: img.url })}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                          postForm.coverImage === img.url
                            ? 'bg-[#0D6847] !text-white border-[#0D6847]'
                            : 'bg-[#F6F5F2] dark:bg-[#1A1E1C] border-[#E2E0D8] dark:border-[#252B28] text-[#141716] dark:text-[#F0F2F1]'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ: SEO Ayarları & Google SERP Önizlemesi (4 Kolon) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Google SERP Canlı Önizleme */}
            <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md overflow-hidden">
              <div className="px-4 py-3 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#27A878]">
                  GOOGLE SERP ÖNİZLEMESİ
                </span>
                <Globe className="w-3.5 h-3.5 text-[#535A56] dark:text-[#9DA6A0]" />
              </div>
              <div className="p-4 space-y-1.5 bg-[#F6F5F2] dark:bg-[#0C0E0D]">
                <div className="text-[11px] font-mono text-[#5A605D] dark:text-[#8E9893] truncate">
                  gunubirlik.qrders.com.tr › blog › {postForm.slug || 'yeni-yazi'}
                </div>
                <div className="text-sm font-bold text-[#0D6847] dark:text-[#27AB78] line-clamp-2 leading-snug">
                  {postForm.metaTitle || postForm.title || 'Makale Başlığı Burada Görünecek'}
                </div>
                <div className="text-xs text-[#5A605D] dark:text-[#8E9893] line-clamp-3 leading-relaxed">
                  {postForm.metaDescription ||
                    postForm.excerpt ||
                    'Makalenizin meta açıklaması (description) Google arama sonuçlarında burada yer alır.'}
                </div>
              </div>
            </div>

            {/* Meta & Yayın Bilgileri */}
            <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md overflow-hidden">
              <div className="px-4 py-3 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28]">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#141716] dark:text-[#F0F2F1]">
                  YAYIN & META PARAMETRELERİ
                </span>
              </div>
              <div className="p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                    SEO Meta Başlığı (Title Tag)
                  </label>
                  <input
                    type="text"
                    value={postForm.metaTitle}
                    onChange={(e) => setPostForm({ ...postForm, metaTitle: e.target.value })}
                    placeholder="Özel SEO başlığı..."
                    className="w-full h-9 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-xs text-[#141716] dark:text-[#F0F2F1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                    Anahtar Kelimeler / Etiketler (Virgülle)
                  </label>
                  <input
                    type="text"
                    value={postForm.tagsInput}
                    onChange={(e) => setPostForm({ ...postForm, tagsInput: e.target.value })}
                    placeholder="günlük iş, yevmiye, garson, istanbul"
                    className="w-full h-9 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-xs text-[#141716] dark:text-[#F0F2F1]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      Okuma Süresi
                    </label>
                    <input
                      type="text"
                      value={postForm.readingTime}
                      onChange={(e) => setPostForm({ ...postForm, readingTime: e.target.value })}
                      className="w-full h-9 px-2.5 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      Yayın Tarihi
                    </label>
                    <input
                      type="date"
                      value={postForm.date}
                      onChange={(e) => setPostForm({ ...postForm, date: e.target.value })}
                      className="w-full h-9 px-2.5 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      Yazar Adı
                    </label>
                    <input
                      type="text"
                      value={postForm.authorName}
                      onChange={(e) => setPostForm({ ...postForm, authorName: e.target.value })}
                      className="w-full h-9 px-2.5 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-xs text-[#141716] dark:text-[#F0F2F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      Schema.org Türü
                    </label>
                    <select
                      value={postForm.schemaType}
                      onChange={(e) => setPostForm({ ...postForm, schemaType: e.target.value })}
                      className="w-full h-9 px-2 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                    >
                      <option value="Article">Article</option>
                      <option value="BlogPosting">BlogPosting</option>
                      <option value="NewsArticle">NewsArticle</option>
                      <option value="FAQPage">FAQPage</option>
                      <option value="HowTo">HowTo</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 space-y-2 border-t border-[#E2E0D8] dark:border-[#252B28]">
                  <label className="flex items-center justify-between p-2.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] cursor-pointer">
                    <span className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">
                      Hemen Yayınla (Aktif)
                    </span>
                    <input
                      type="checkbox"
                      checked={postForm.isPublished}
                      onChange={(e) => setPostForm({ ...postForm, isPublished: e.target.checked })}
                      className="w-4 h-4 accent-[#0D6847]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] cursor-pointer">
                    <span className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">
                      Manşet Dosyası Olarak Sabitle
                    </span>
                    <input
                      type="checkbox"
                      checked={postForm.isFeatured}
                      onChange={(e) => setPostForm({ ...postForm, isFeatured: e.target.checked })}
                      className="w-4 h-4 accent-[#0D6847]"
                    />
                  </label>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="submit"
                    disabled={savingPost}
                    className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingPost ? 'Kaydediliyor...' : 'Yazıyı Kaydet ve Yayınla'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('blog')}
                    className="w-full h-9 rounded-md border border-[#E2E0D8] dark:border-[#252B28] text-xs font-semibold text-[#535A56] dark:text-[#9DA6A0]"
                  >
                    Listeye Dön
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ================================================================== */}
      {/* TAB 3: DETAYLI TEKNİK SEO YAPILANDIRMASI */}
      {/* ================================================================== */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Global Meta Etiketleri */}
            <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md overflow-hidden">
              <div className="px-5 py-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1]">
                  Global Meta Başlık & Açıklama Şablonları
                </span>
                <span className="font-mono text-[10px] text-[#0D6847] dark:text-[#27A878]">01 / META</span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                    Sayfa Başlığı Şablonu (Title Template)
                  </label>
                  <input
                    type="text"
                    value={settings.siteTitleTemplate}
                    onChange={(e) => setSettings({ ...settings, siteTitleTemplate: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                    Ana Sayfa Varsayılan Meta Title
                  </label>
                  <input
                    type="text"
                    value={settings.defaultMetaTitle}
                    onChange={(e) => setSettings({ ...settings, defaultMetaTitle: e.target.value })}
                    className="w-full h-10 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-xs text-[#141716] dark:text-[#F0F2F1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                    Varsayılan Meta Description
                  </label>
                  <textarea
                    rows={3}
                    value={settings.defaultMetaDescription}
                    onChange={(e) => setSettings({ ...settings, defaultMetaDescription: e.target.value })}
                    className="w-full p-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] text-xs text-[#141716] dark:text-[#F0F2F1]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                    Hedef Anahtar Kelimeler (Keywords)
                  </label>
                  <textarea
                    rows={2}
                    value={settings.defaultKeywords}
                    onChange={(e) => setSettings({ ...settings, defaultKeywords: e.target.value })}
                    className="w-full p-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      Canonical Base URL
                    </label>
                    <input
                      type="text"
                      value={settings.canonicalBaseUrl}
                      onChange={(e) => setSettings({ ...settings, canonicalBaseUrl: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      Varsayılan OpenGraph Görseli
                    </label>
                    <input
                      type="text"
                      value={settings.ogDefaultImage}
                      onChange={(e) => setSettings({ ...settings, ogDefaultImage: e.target.value })}
                      className="w-full h-10 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Arama Motoru Doğrulama & Robots.txt */}
            <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md overflow-hidden">
              <div className="px-5 py-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1]">
                  Webmaster Doğrulama Kodları & Robots.txt
                </span>
                <span className="font-mono text-[10px] text-[#0D6847] dark:text-[#27A878]">02 / WEBMASTER</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      Google Search Console Kodu
                    </label>
                    <input
                      type="text"
                      value={settings.googleVerificationCode}
                      onChange={(e) =>
                        setSettings({ ...settings, googleVerificationCode: e.target.value })
                      }
                      placeholder="google-site-verification=..."
                      className="w-full h-10 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      Google Analytics 4 (GA4) ID
                    </label>
                    <input
                      type="text"
                      value={settings.googleAnalyticsId}
                      onChange={(e) => setSettings({ ...settings, googleAnalyticsId: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full h-10 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      Yandex Webmaster Kodu
                    </label>
                    <input
                      type="text"
                      value={settings.yandexVerificationCode}
                      onChange={(e) =>
                        setSettings({ ...settings, yandexVerificationCode: e.target.value })
                      }
                      placeholder="yandex-verification..."
                      className="w-full h-10 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                      IndexNow API Key (Anlık İndeksleme)
                    </label>
                    <input
                      type="text"
                      value={settings.indexNowKey}
                      onChange={(e) => setSettings({ ...settings, indexNowKey: e.target.value })}
                      placeholder="indexnow-key..."
                      className="w-full h-10 px-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-1">
                    Özel Robots.txt Kuralları
                  </label>
                  <textarea
                    rows={4}
                    value={settings.customRobotsTxt}
                    onChange={(e) => setSettings({ ...settings, customRobotsTxt: e.target.value })}
                    className="w-full p-3 rounded-md bg-[#FBFBF9] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] font-mono text-xs text-[#141716] dark:text-[#F0F2F1]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingConfig}
              className="h-10 px-6 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingConfig ? 'Kaydediliyor...' : 'Tüm SEO Yapılandırmasını Kaydet'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ================================================================== */}
      {/* TAB 4: SITEMAP, SCHEMA.ORG & PROGRAMATİK SEO */}
      {/* ================================================================== */}
      {activeTab === 'programmatic' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Schema.org Yapısal Veri Kontrolleri */}
          <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md overflow-hidden">
            <div className="px-5 py-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1]">
                Schema.org JSON-LD Yapısal Veri Modülleri
              </span>
              <span className="font-mono text-[10px] text-[#0D6847] dark:text-[#27A878]">JSON-LD</span>
            </div>
            <div className="p-5 space-y-3">
              {[
                {
                  key: 'enableJobPostingSchema',
                  title: 'Google Jobs (JobPosting) Şeması',
                  desc: 'Yayınlanan tüm iş ilanlarını Google İş İlanları (Google for Jobs) snippet formatında işaretler.',
                },
                {
                  key: 'enableOrganizationSchema',
                  title: 'Organization & WebSite SearchAction Şeması',
                  desc: 'Kurumsal bilgi paneli ve site içi arama kutusu yapısal verisini aktif tutar.',
                },
                {
                  key: 'enableFaqSchema',
                  title: 'FAQPage (Sıkça Sorulan Sorular) Şeması',
                  desc: 'Nasıl Çalışır ve Rehber sayfalarındaki SSS maddelerini zengin sonuç olarak işaretler.',
                },
                {
                  key: 'enableBreadcrumbSchema',
                  title: 'BreadcrumbList Hiyerarşi Şeması',
                  desc: 'Şehir, kategori ve blog sayfalarında sayfa yolu (breadcrumb) dizinini Google’a bildirir.',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start justify-between gap-3 p-3.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-[#141716] dark:text-[#F0F2F1]">{item.title}</div>
                    <div className="text-[11px] text-[#535A56] dark:text-[#9DA6A0] mt-0.5">{item.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={(settings as any)[item.key]}
                    onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                    className="w-4 h-4 mt-0.5 accent-[#0D6847]"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Programatik SEO & Sitemap Durumu */}
          <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md overflow-hidden">
            <div className="px-5 py-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1]">
                Programatik SEO & Dinamik Sitemap.xml
              </span>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] font-semibold text-[#0D6847] dark:text-[#27A878] hover:underline inline-flex items-center gap-1"
              >
                <span>/sitemap.xml</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="p-5 space-y-3">
              <div className="p-3.5 rounded-md bg-[#F6F5F2] dark:bg-[#1A1E1C] border border-[#E2E0D8] dark:border-[#252B28] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#141716] dark:text-[#F0F2F1]">
                    81 İl Programatik İlan Sayfaları (`/sehir/[city]`)
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0D6847]/15 dark:bg-[#0D6847]/25 text-[#0D6847] dark:text-[#27AB78] border border-[#0D6847]/30 font-semibold">
                    81 URL AKTİF
                  </span>
                </div>
                <p className="text-[11px] text-[#535A56] dark:text-[#9DA6A0]">
                  İstanbul, Ankara, İzmir, Bursa, Antalya, Trabzon dahil 81 il için özel başlık, açıklama ve yerel iş ilanı listesi otomatik üretilir.
                </p>
              </div>

              <div className="p-3.5 rounded-md bg-[#F6F5F2] dark:bg-[#1A1E1C] border border-[#E2E0D8] dark:border-[#252B28] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#141716] dark:text-[#F0F2F1]">
                    Sektörel Kategori Sayfaları (`/kategori/[category]`)
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0D6847]/15 dark:bg-[#0D6847]/25 text-[#0D6847] dark:text-[#27AB78] border border-[#0D6847]/30 font-semibold">
                    8 URL AKTİF
                  </span>
                </div>
                <p className="text-[11px] text-[#535A56] dark:text-[#9DA6A0]">
                  Garsonluk, Depo & Paketleme, Kurye, Temizlik, İnşaat ve Etkinlik kategorileri için özel açılış sayfaları.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingConfig}
                  className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Şema ve Programatik SEO Ayarlarını Kaydet</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
