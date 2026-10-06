'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { jobsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { useAuth } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  MapPin, Search, SlidersHorizontal, Map as MapIcon, List, Star, Clock, Users,
  Loader2, Navigation, X, Briefcase, Building2, Calendar, Wallet, Sparkles, TrendingUp,
  Crosshair, RefreshCw, CheckCircle2, ShieldCheck, Zap,
} from 'lucide-react'
import { Card3D } from '@/components/shared/card-3d'
import { InteractiveHero3D } from '@/components/landing/interactive-hero-3d'
import {
  formatWage, formatDate, categoryLabel, categoryIcon, urgencyLabel, daysUntil,
  formatDistance, initials,
} from '@/lib/format'
import {
  reverseGeocode, formatShortLocation, formatStreetLocation, formatVeryShortLocation,
  type ReverseGeocodeResult,
} from '@/lib/geocode'
import { toast } from 'sonner'

// Leaflet haritasını dinamik import ile yükle (SSR'siz)
const JobMap = dynamic(() => import('@/components/shared/job-map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100 rounded-xl">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
        <p className="text-sm text-gray-600">Harita yükleniyor...</p>
      </div>
    </div>
  ),
})

const TURKEY_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Aksaray', 'Amasya', 'Ankara', 'Antalya', 'Ardahan', 'Artvin',
  'Aydın', 'Balıkesir', 'Bartın', 'Batman', 'Bayburt', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur',
  'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Düzce', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkâri', 'Hatay', 'Iğdır', 'Isparta', 'İstanbul',
  'İzmir', 'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis', 'Kırıkkale', 'Kırklareli',
  'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde', 'Ordu', 'Osmaniye', 'Rize', 'Sakarya', 'Samsun', 'Şanlıurfa', 'Siirt', 'Sinop',
  'Sivas', 'Şırnak', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Uşak', 'Van', 'Yalova', 'Yozgat', 'Zonguldak'
]

interface JobItem {
  id: string
  title: string
  description: string
  category: string
  workDate: string
  startTime: string
  endTime: string
  durationHours: number
  wageAmount: number
  wageType: string
  isWageNegotiable: boolean
  city: string
  district: string
  address?: string
  latitude: number
  longitude: number
  locationNote?: string
  openingsTotal: number
  openingsFilled: number
  status: string
  urgency: string
  viewCount: number
  employer: any
  applicationCount: number
  distanceKm?: number
}

export default function JobsListScreen() {
  const { go } = useApp()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  // Filtreler
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [sortBy, setSortBy] = useState('NEWEST')
  const [useMyLocation, setUseMyLocation] = useState(false)
  const [radiusKm, setRadiusKm] = useState(50)
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [myLocation, setMyLocation] = useState<ReverseGeocodeResult | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [locating, setLocating] = useState(false)

  const loadJobs = useCallback(async (resetPage = false) => {
    setLoading(true)
    const currentPage = resetPage ? 1 : page
    try {
      const params: any = {
        page: currentPage,
        pageSize: 10,
        sortBy,
      }
      if (search) params.search = search
      if (category !== 'ALL') params.category = category
      // Konum bazlı arama aktifse şehir filtresini kaldır (mesafe filtresi daha spesifik)
      if (useMyLocation && myCoords) {
        params.lat = myCoords.lat
        params.lng = myCoords.lng
        params.radiusKm = radiusKm
        params.sortBy = 'NEAREST'
      } else {
        if (city && city !== 'ALL') params.city = city
        if (district) params.district = district
      }

      const result = await jobsApi.list(params)
      if (resetPage || currentPage === 1) {
        setJobs(result.items)
      } else {
        setJobs((prev) => [...prev, ...result.items])
      }
      setHasMore(result.pagination.hasNext)
      setTotal(result.pagination.total)
    } catch (err: any) {
      toast.error('İşler yüklenemedi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, category, city, district, sortBy, useMyLocation, myCoords, radiusKm])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadJobs(true)
    }, search ? 400 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, city, district, sortBy, useMyLocation, myCoords, radiusKm])

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tarayıcınız konum desteklemiyor.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        setMyCoords(coords)
        setUseMyLocation(true)
        setLocating(false)

        // Reverse geocode - kullanıcı konumunun adresini al
        try {
          const loc = await reverseGeocode(coords.lat, coords.lng)
          setMyLocation(loc)
          toast.success(
            `Konumunuz alındı! ${formatVeryShortLocation(loc)}`,
            { description: formatStreetLocation(loc), duration: 4000 }
          )
        } catch (err) {
          toast.success('Konumunuz alındı!', {
            description: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
          })
        }
      },
      (err) => {
        setLocating(false)
        let msg = 'Konum alınamadı.'
        if (err.code === 1) msg = 'Konum izni reddedildi. Tarayıcı ayarlarından izin verin.'
        else if (err.code === 2) msg = 'Konum bilgisi kullanılamıyor.'
        else if (err.code === 3) msg = 'Konum zaman aşımına uğradı.'
        toast.error(msg)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    )
  }

  const clearLocation = () => {
    setUseMyLocation(false)
    setMyCoords(null)
    setMyLocation(null)
  }

  const categories = [
    { value: 'ALL', label: 'Tümü', icon: '🌐' },
    { value: 'INSAAT', label: 'İnşaat', icon: '🔨' },
    { value: 'RESTAURANT', label: 'Restoran', icon: '🍽️' },
    { value: 'TEMIZLIK', label: 'Temizlik', icon: '✨' },
    { value: 'NAKLIYE', label: 'Nakliyat', icon: '🚚' },
    { value: 'TARIM', label: 'Tarım', icon: '🌾' },
    { value: 'TEKNIK', label: 'Teknik', icon: '🔧' },
    { value: 'SAGLIK', label: 'Sağlık', icon: '❤️' },
    { value: 'DIGER', label: 'Diğer', icon: '💼' },
  ]

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
      {/* 21st.dev + Three.js + Framer Motion 3D Master Hero */}
      {page === 1 && !search && (
        <div className="mb-8">
          <InteractiveHero3D
            totalJobs={total || jobs.length}
            onExploreClick={() => {
              const el = document.getElementById('jobs-search-section')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }}
          />
        </div>
      )}

      {/* Target anchor for smooth scroll from 3D Hero */}
      <div id="jobs-search-section" className="scroll-mt-6" />

      {/* Konum Kartı - 3D Spatial */}
      {useMyLocation && myCoords && (
        <div className="mb-5 card-3d-spatial rounded-2xl border-blue-300/80 bg-gradient-to-r from-blue-50/90 via-sky-50/60 to-emerald-50/80 p-4 shadow-md preserve-3d">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.35)] border-t border-white/40 border-b-2 border-blue-800 translate-z-4">
              <Navigation className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-extrabold text-slate-900 text-sm">Mevcut Canlı Konumunuz</span>
                <span className="badge-3d-emerald px-2 py-0.5 rounded-full text-[10px] font-black">GPS AKTİF</span>
              </div>
              {myLocation ? (
                <>
                  <p className="text-sm text-slate-800 font-bold">
                    {myLocation.neighbourhood
                      ? myLocation.neighbourhood.replace(' Mahallesi', ' Mah.')
                      : myLocation.district || 'Bilinmeyen mahalle'}
                    {myLocation.district && `, ${myLocation.district}`}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">
                    {myLocation.street && <span>{myLocation.street} • </span>}
                    {myLocation.city}
                    {myLocation.state && myLocation.state !== myLocation.city && `, ${myLocation.state}`}
                    {myLocation.postcode && ` • ${myLocation.postcode}`}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    {myCoords.lat.toFixed(5)}, {myCoords.lng.toFixed(5)} • ±{radiusKm}km radar
                  </p>
                </>
              ) : (
                <p className="text-sm text-slate-600 flex items-center gap-1.5 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" /> Adres hesaplanıyor...
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button
                type="button"
                className="btn-3d-white btn-3d-pill px-3 py-1 text-xs font-bold flex items-center gap-1"
                onClick={getLocation}
                disabled={locating}
              >
                <RefreshCw className={`w-3 h-3 ${locating ? 'animate-spin' : ''}`} />
                Yenile
              </button>
              <button
                type="button"
                className="btn-3d-white btn-3d-pill px-3 py-1 text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                onClick={clearLocation}
              >
                <X className="w-3 h-3" />
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Arama ve Görünüm Değiştirme - 3D Tactile */}
      <div className="mb-5 space-y-3.5">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0 inset-3d rounded-2xl flex items-center">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700" />
            <Input
              placeholder="İş ara... (garson, inşaat, kurye, temizlik)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-sm sm:text-base border-0 bg-transparent shadow-none focus-visible:ring-0 text-slate-900 placeholder:text-slate-400 font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Aramayı Temizle"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobilde filtreler Sheet */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Filtreler"
                className="btn-3d-white h-12 w-12 rounded-2xl md:hidden flex items-center justify-center flex-shrink-0 text-slate-700 dark:text-slate-200"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[90vh] flex flex-col p-0 rounded-t-3xl dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
              <SheetHeader className="px-5 pt-5 pb-3 border-b border-gray-100 dark:border-white/10 flex-row items-center justify-between space-y-0">
                <SheetTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Filtreler
                </SheetTitle>
                {(city || district || sortBy !== 'NEWEST' || useMyLocation) && (
                  <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 text-[10px]">
                    Aktif
                  </Badge>
                )}
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
                <FilterPanel
                  city={city} setCity={setCity}
                  district={district} setDistrict={setDistrict}
                  sortBy={sortBy} setSortBy={setSortBy}
                  useMyLocation={useMyLocation}
                  radiusKm={radiusKm} setRadiusKm={setRadiusKm}
                  onGetLocation={getLocation}
                  onClearLocation={clearLocation}
                  locating={locating}
                />
              </div>
              {/* Sticky action buttons */}
              <div className="border-t border-gray-100 dark:border-white/10 p-3 flex gap-2 bg-white dark:bg-slate-900 sticky bottom-0">
                <button
                  type="button"
                  className="btn-3d-white flex-1 h-11 rounded-xl text-sm font-bold"
                  onClick={() => {
                    setCity('')
                    setDistrict('')
                    setSortBy('NEWEST')
                    if (useMyLocation) clearLocation()
                    toast.success('Filtreler temizlendi')
                  }}
                >
                  Temizle
                </button>
                <button
                  type="button"
                  className="btn-3d-emerald flex-1 h-11 rounded-xl text-sm font-bold"
                  onClick={() => {
                    setFiltersOpen(false)
                    toast.success('Filtreler uygulandı')
                  }}
                >
                  Uygula
                </button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop'ta filtre butonu (toggle) - 3D */}
          <button
            type="button"
            className="btn-3d-white h-12 w-12 rounded-2xl hidden md:flex items-center justify-center flex-shrink-0 text-slate-700"
            onClick={() => setFiltersOpen(!filtersOpen)}
            title="Detaylı Filtreler"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Görünüm Değiştirme (Liste / Harita) - 3D Tactile */}
          <button
            type="button"
            className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
              view === 'list' ? 'btn-3d-emerald' : 'btn-3d-white text-slate-700'
            }`}
            onClick={() => setView('list')}
            title="Liste Görünümü"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            className={`h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
              view === 'map' ? 'btn-3d-emerald' : 'btn-3d-white text-slate-700'
            }`}
            onClick={() => setView('map')}
            title="Harita Görünümü"
          >
            <MapIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Hızlı kategori filtreleri - 3D Tactile Buttons */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          {categories.map((cat) => {
            const isActive = category === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'btn-3d-emerald btn-3d-pill z-10'
                    : 'btn-3d-white btn-3d-pill text-slate-700'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
          <div className="flex-shrink-0 w-1 sm:hidden" />
        </div>

        {/* Detaylı Filtreler - Sadece Desktop'ta inline */}
        {filtersOpen && (
          <Card className="border-emerald-100 hidden md:block">
            <CardContent className="p-4">
              <FilterPanel
                city={city} setCity={setCity}
                district={district} setDistrict={setDistrict}
                sortBy={sortBy} setSortBy={setSortBy}
                useMyLocation={useMyLocation}
                radiusKm={radiusKm} setRadiusKm={setRadiusKm}
                onGetLocation={getLocation}
                onClearLocation={clearLocation}
                locating={locating}
              />
            </CardContent>
          </Card>
        )}

        {/* Sonuç sayısı ve hızlı işlemler */}
        <div className="flex items-center justify-between text-sm text-gray-600 flex-wrap gap-2">
          <span className="flex items-center gap-2 flex-wrap">
            <strong className="text-gray-900">{total}</strong> iş ilanı
            {city && (
              <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                {city}
              </Badge>
            )}
            {useMyLocation && myCoords && (
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 flex items-center gap-1.5 py-0.5">
                <MapPin className="w-3 h-3" />
                <span>{radiusKm} km içinde</span>
                <button
                  type="button"
                  onClick={clearLocation}
                  className="w-4 h-4 rounded-full hover:bg-blue-200/60 inline-flex items-center justify-center text-blue-700 hover:text-red-600 font-bold text-xs"
                  title="Konum filtresini kaldır ve tüm Türkiye ilanlarını gör"
                >
                  ×
                </button>
              </Badge>
            )}
          </span>
          {(search || category !== 'ALL' || city || district || useMyLocation) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSearch('')
                setCategory('ALL')
                setCity('')
                setDistrict('')
                if (useMyLocation) clearLocation()
              }}
            >
              <X className="w-3 h-3 mr-1" />
              Filtreleri Temizle
            </Button>
          )}
        </div>
      </div>

      {/* İçerik */}
      {view === 'list' ? (
        <ListView jobs={jobs} loading={loading} onSelect={(id) => go('job-detail', { jobId: id })} />
      ) : (
        <MapView
          jobs={jobs}
          loading={loading}
          myCoords={myCoords}
          radiusKm={useMyLocation ? radiusKm : undefined}
          onSelect={(id) => go('job-detail', { jobId: id })}
        />
      )}

      {/* Load More */}
      {!loading && hasMore && view === 'list' && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => {
              setPage((p) => p + 1)
              loadJobs(false)
            }}
          >
            Daha Fazla Yükle
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 mb-4">
            <Search className="w-10 h-10 text-gray-400 dark:text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">İlan bulunamadı</h3>
          <p className="text-gray-600 dark:text-slate-300 mb-4 max-w-md mx-auto">
            {useMyLocation
              ? `${radiusKm} km mesafede uygun ilan yok. Mesafeyi artırmayı deneyin.`
              : 'Arama kriterlerinizi değiştirip tekrar deneyin.'}
          </p>
          <Button
            variant="outline"
            className="dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={() => {
              setSearch('')
              setCategory('ALL')
              setDistrict('')
              if (useMyLocation) setRadiusKm(100)
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Filtreleri Genişlet
          </Button>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Filtre Paneli
// ============================================================
function FilterPanel({
  city, setCity, district, setDistrict, sortBy, setSortBy,
  useMyLocation, radiusKm, setRadiusKm, onGetLocation, onClearLocation, locating,
}: any) {
  return (
    <div className="space-y-5">
      {/* Konum bazlı arama - öne çıkar */}
      <div className={`rounded-xl border-2 transition-all ${
        useMyLocation
          ? 'border-emerald-300 dark:border-emerald-700/60 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40'
          : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-slate-850'
      }`}>
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                useMyLocation ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-700'
              }`}>
                <Crosshair className={`w-4 h-4 ${useMyLocation ? 'text-white' : 'text-gray-600 dark:text-slate-300'}`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">Konum Bazlı Arama</div>
                <div className="text-[11px] text-gray-500 dark:text-slate-400">GPS ile yakındaki işler</div>
              </div>
            </div>
            {useMyLocation && (
              <Badge className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Aktif
              </Badge>
            )}
          </div>

          <Button
            type="button"
            variant={useMyLocation ? 'default' : 'outline'}
            onClick={onGetLocation}
            disabled={locating}
            className={`w-full h-11 ${useMyLocation ? 'bg-emerald-600 hover:bg-emerald-700' : 'dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700'}`}
          >
            {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Crosshair className="w-4 h-4 mr-2" />}
            {locating ? 'Konum alınıyor...' : useMyLocation ? 'Konumum Aktif ✓' : 'Konumumu Al'}
          </Button>

          {useMyLocation && (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Mesafe (km)</Label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 25, 50, 100, 250].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusKm(r)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      radiusKm === r
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Şehir/ilçe filtreleri devre dışı
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearLocation}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <X className="w-3 h-3 mr-1" />
                  Kapat
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Şehir ve İlçe */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Şehir</Label>
          <Select value={city || 'ALL'} onValueChange={(val) => setCity(val === 'ALL' ? '' : val)} disabled={useMyLocation}>
            <SelectTrigger className={`h-11 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100 ${useMyLocation ? 'opacity-50' : ''}`}>
              <SelectValue placeholder="Tüm Türkiye" />
            </SelectTrigger>
            <SelectContent className="max-h-60 dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
              <SelectItem value="ALL">🌐 Tüm Türkiye (Tümü)</SelectItem>
              {TURKEY_CITIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300">İlçe</Label>
          <Input
            placeholder="İlçe adı"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={useMyLocation}
            className={`h-11 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100 ${useMyLocation ? 'opacity-50' : ''}`}
          />
        </div>
      </div>

      {/* Sıralama */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Sıralama</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-11 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
            <SelectItem value="NEWEST">📅 En Yeni</SelectItem>
            <SelectItem value="OLDEST">📂 En Eski</SelectItem>
            <SelectItem value="WAGE_HIGH">💰 Ücret (Yüksek→Düşük)</SelectItem>
            <SelectItem value="WAGE_LOW">💳 Ücret (Düşük→Yüksek)</SelectItem>
            <SelectItem value="URGENT">🔥 Acil Olanlar</SelectItem>
            {useMyLocation && <SelectItem value="NEAREST">📍 En Yakın</SelectItem>}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ============================================================
// Liste Görünümü
// ============================================================
function ListView({ jobs, loading, onSelect }: { jobs: JobItem[]; loading: boolean; onSelect: (id: string) => void }) {
  if (loading && jobs.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onClick={() => onSelect(job.id)} />
      ))}
    </div>
  )
}

function JobCard({ job, onClick }: { job: JobItem; onClick: () => void }) {
  const urgency = urgencyLabel(job.urgency)
  const remaining = job.openingsTotal - job.openingsFilled
  const isUrgent = job.urgency === 'URGENT'
  const isHigh = job.urgency === 'HIGH'

  // Kategori renkleri & 3D bevels
  const categoryStyles: Record<string, { bg: string; border: string }> = {
    INSAAT: { bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700/60' },
    RESTAURANT: { bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-700/60' },
    TEMIZLIK: { bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-700/60' },
    NAKLIYE: { bg: 'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-700/60' },
    TARIM: { bg: 'bg-lime-100 text-lime-800 dark:bg-lime-950/70 dark:text-lime-300', border: 'border-lime-300 dark:border-lime-700/60' },
    TEKNIK: { bg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700/60' },
    SAGLIK: { bg: 'bg-pink-100 text-pink-800 dark:bg-pink-950/70 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700/60' },
    DIGER: { bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800/80 dark:text-slate-200', border: 'border-slate-300 dark:border-slate-700/60' },
  }
  const catStyle = categoryStyles[job.category] || { bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700/60' }

  return (
    <Card3D maxTilt={5} scale={1} glare={true} className="h-full">
      <div
        className={`card-3d-spatial rounded-2xl h-full p-4 sm:p-5 flex flex-col justify-between group cursor-pointer overflow-hidden border ${
          isUrgent
            ? 'border-red-300/80 dark:border-red-800/60 bg-gradient-to-br from-red-50/40 dark:from-red-950/30 via-white dark:via-slate-900 to-white dark:to-slate-900'
            : isHigh
            ? 'border-orange-300/80 dark:border-orange-800/60 bg-gradient-to-br from-orange-50/30 dark:from-orange-950/30 via-white dark:via-slate-900 to-white dark:to-slate-900'
            : 'border-slate-200/90 dark:border-white/10 hover:border-emerald-400/80 dark:hover:border-emerald-500/50'
        }`}
        onClick={onClick}
      >
        {/* Aciliyet 3D Üst Şerit */}
        {isUrgent && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 shadow-[0_2px_8px_rgba(239,68,68,0.4)]" />
        )}
        {isHigh && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400" />
        )}

        <div className="flex items-start gap-3.5 preserve-3d">
          {/* 3D Extruded Kategori Rozeti */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${catStyle.bg} border-t border-white/80 dark:border-white/15 border-b-2 ${catStyle.border} shadow-[0_6px_14px_-2px_rgba(0,0,0,0.08),inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[0_6px_14px_-2px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)] translate-z-4`}
          >
            {categoryIcon(job.category)}
          </div>

          <div className="flex-1 min-w-0 preserve-3d">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 text-sm sm:text-base translate-z-2">
                {job.title}
              </h3>
              <span
                className={`flex-shrink-0 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold translate-z-2 ${
                  isUrgent
                    ? 'badge-3d-urgent'
                    : isHigh
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 shadow-xs'
                    : `${urgency.color} border`
                }`}
              >
                {urgency.text}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap translate-z-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">{categoryLabel(job.category)}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 truncate text-slate-600 dark:text-slate-400">
                <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                <span className="truncate">{job.district}, {job.city}</span>
              </span>
              {job.distanceKm !== undefined && (
                <>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-0.5 flex-shrink-0 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full shadow-2xs">
                    <Navigation className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {formatDistance(job.distanceKm)}
                  </span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
              {job.description}
            </p>
          </div>
        </div>

        {/* Alt Bilgi & 3D Yevmiye Rozeti */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/90 dark:border-white/10 gap-2 preserve-3d">
          <div className="flex items-center gap-2 sm:gap-3 text-sm flex-wrap">
            {/* 3D Tactile Yevmiye Rozeti */}
            <div className="badge-3d-emerald px-3 py-1 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 translate-z-4">
              <Wallet className="w-3.5 h-3.5 drop-shadow-xs" />
              <span>{formatWage(job.wageAmount, job.wageType)}</span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium translate-z-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {daysUntil(job.workDate)}
            </div>

            {remaining > 0 && (
              <div className="text-[11px] text-slate-700 dark:text-slate-200 font-bold bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-white/10 px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs translate-z-2">
                <Users className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                {remaining} kişi
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 translate-z-2">
            <Avatar className="w-6 h-6 border border-emerald-500/30 shadow-2xs">
              <AvatarFallback className="text-[10px] font-extrabold bg-gradient-to-tr from-emerald-100 to-teal-100 dark:from-emerald-950 dark:to-teal-900 text-emerald-800 dark:text-emerald-300">
                {initials(job.employer?.companyName || job.employer?.fullName)}
              </AvatarFallback>
            </Avatar>
            {job.employer?.isVerified && (
              <span title="Onaylı işveren" className="text-blue-500 dark:text-blue-400">
                <CheckCircle2 className="w-3.5 h-3.5 fill-blue-100 dark:fill-blue-950/60 text-blue-600 dark:text-blue-400" />
              </span>
            )}
          </div>
        </div>
      </div>
    </Card3D>
  )
}

// ============================================================
// Harita Görünümü - Leaflet ile gerçek harita
// ============================================================
function MapView({
  jobs,
  loading,
  myCoords,
  radiusKm,
  onSelect,
}: {
  jobs: JobItem[]
  loading: boolean
  myCoords: { lat: number; lng: number } | null
  radiusKm?: number
  onSelect: (id: string) => void
}) {
  const [selected, setSelected] = useState<JobItem | null>(null)

  if (loading && jobs.length === 0) {
    return <Skeleton className="h-[400px] sm:h-[600px] w-full" />
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 dark:bg-slate-900/60 dark:border dark:border-white/10 rounded-xl">
        <MapIcon className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
        <p className="text-gray-600 dark:text-slate-300 mb-2">Gösterilecek iş ilanı yok.</p>
        <p className="text-sm text-gray-500 dark:text-slate-400">Filtreleri değiştirip tekrar deneyin.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Harita */}
      <div className="lg:col-span-2">
        <Card className="overflow-hidden border-gray-200 dark:border-white/10 dark:bg-slate-900 h-[400px] sm:h-[500px] lg:h-[600px]">
          <CardContent className="p-0 h-full">
            <JobMap
              jobs={jobs}
              userCoords={myCoords}
              radiusKm={radiusKm}
              onSelectJob={onSelect}
              height="100%"
            />
          </CardContent>
        </Card>
      </div>

      {/* Seçili iş veya uyarı */}
      <div className="lg:col-span-1">
        {selected ? (
          <div className="space-y-3">
            <JobCard job={selected} onClick={() => onSelect(selected.id)} />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSelected(null)}
            >
              Seçimi Temizle
            </Button>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-gray-500">
              <MapPin className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="font-medium mb-1">Detay için</p>
              <p className="text-sm mb-3">haritadaki bir işaretçiyi seçin</p>
              <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-500">{jobs.length} iş haritada</span>
                {myCoords && (
                  <span className="text-xs text-blue-600">• Konumunuz merkezde</span>
                )}
              </div>
              {/* Kategori renk açıklaması */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-left">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span>İnşaat</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span>Restoran</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-cyan-500"></span>Temizlik</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-500"></span>Nakliyat</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-lime-500"></span>Tarım</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-sky-500"></span>Teknik</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-pink-500"></span>Sağlık</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>Acil</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
