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
  Crosshair, RefreshCw, CheckCircle2,
} from 'lucide-react'
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
  const [city, setCity] = useState('İstanbul')
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
        if (city) params.city = city
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
      {/* Hero - Sadece ana sayfada ve kullanıcı işçi ise */}
      {user?.role === 'WORKER' && page === 1 && !search && (
        <div className="mb-5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 sm:p-6 text-white overflow-hidden relative">
          <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
          <div className="absolute right-12 bottom-0 w-24 h-24 bg-white/10 rounded-full -mb-12" />
          <div className="relative">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
              Merhaba {user.fullName.split(' ')[0]}! 👋
            </h1>
            <p className="text-emerald-50 text-sm sm:text-base">Konumunuza en yakın günlük işleri keşfedin</p>
            {!useMyLocation && (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3 bg-white text-emerald-700 hover:bg-emerald-50"
                onClick={getLocation}
                disabled={locating}
              >
                {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Crosshair className="w-4 h-4 mr-2" />}
                Konumumu Kullan
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Konum Kartı - Konum algılandığında göster */}
      {useMyLocation && myCoords && (
        <Card className="mb-4 border-blue-200 bg-gradient-to-br from-blue-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm">Mevcut Konumunuz</span>
                  <Badge className="bg-blue-100 text-blue-700 text-[10px]">GPS Aktif</Badge>
                </div>
                {myLocation ? (
                  <>
                    <p className="text-sm text-gray-800 font-medium">
                      {myLocation.neighbourhood
                        ? myLocation.neighbourhood.replace(' Mahallesi', ' Mah.')
                        : myLocation.district || 'Bilinmeyen mahalle'}
                      {myLocation.district && `, ${myLocation.district}`}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {myLocation.street && <span>{myLocation.street} • </span>}
                      {myLocation.city}
                      {myLocation.state && myLocation.state !== myLocation.city && `, ${myLocation.state}`}
                      {myLocation.postcode && ` • ${myLocation.postcode}`}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 font-mono">
                      {myCoords.lat.toFixed(5)}, {myCoords.lng.toFixed(5)} • ±{radiusKm}km
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Adres hesaplanıyor...
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  onClick={getLocation}
                  disabled={locating}
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${locating ? 'animate-spin' : ''}`} />
                  Yenile
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-red-600"
                  onClick={clearLocation}
                >
                  <X className="w-3 h-3 mr-1" />
                  Kapat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Arama ve Görünüm Değiştirme - Mobil Uyumlu */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="İş ara... (garson, inşaat, temizlik)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-12 text-base"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobilde filtreler Sheet olarak açılır */}
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-12 w-12 md:hidden flex-shrink-0">
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[90vh] flex flex-col p-0">
              <SheetHeader className="px-5 pt-5 pb-3 border-b border-gray-100 flex-row items-center justify-between space-y-0">
                <SheetTitle className="text-base font-bold flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  Filtreler
                </SheetTitle>
                {(city !== 'İstanbul' || district || sortBy !== 'NEWEST' || useMyLocation) && (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
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
              <div className="border-t border-gray-100 p-3 flex gap-2 bg-white sticky bottom-0">
                <Button
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => {
                    setCity('İstanbul')
                    setDistrict('')
                    setSortBy('NEWEST')
                    if (useMyLocation) clearLocation()
                    toast.success('Filtreler temizlendi')
                  }}
                >
                  Temizle
                </Button>
                <Button
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setFiltersOpen(false)
                    toast.success('Filtreler uygulandı')
                  }}
                >
                  Uygula
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop'ta filtre butonu (toggle) */}
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 hidden md:flex flex-shrink-0"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>

          {/* Görünüm değiştirme */}
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size="icon"
            className="h-12 w-12 flex-shrink-0"
            onClick={() => setView('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={view === 'map' ? 'default' : 'outline'}
            size="icon"
            className={`h-12 w-12 flex-shrink-0 ${view === 'map' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
            onClick={() => setView('map')}
          >
            <MapIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Hızlı kategori filtreleri - Mobil yatay scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition flex-shrink-0 ${
                category === cat.value
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
              }`}
            >
              <span className="text-base">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
          {/* Sağ padding için boşluk */}
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
          <span className="flex items-center gap-2">
            <strong className="text-gray-900">{total}</strong> iş ilanı
            {useMyLocation && myCoords && (
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                <MapPin className="w-3 h-3 mr-1" />
                {radiusKm} km içinde
              </Badge>
            )}
          </span>
          {(search || category !== 'ALL' || district || useMyLocation) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setSearch('')
                setCategory('ALL')
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
            <Search className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">İlan bulunamadı</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            {useMyLocation
              ? `${radiusKm} km mesafede uygun ilan yok. Mesafeyi artırmayı deneyin.`
              : 'Arama kriterlerinizi değiştirip tekrar deneyin.'}
          </p>
          <Button
            variant="outline"
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
          ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50'
          : 'border-gray-200 bg-gray-50/50'
      }`}>
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                useMyLocation ? 'bg-emerald-500' : 'bg-gray-300'
              }`}>
                <Crosshair className={`w-4 h-4 ${useMyLocation ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Konum Bazlı Arama</div>
                <div className="text-[11px] text-gray-500">GPS ile yakındaki işler</div>
              </div>
            </div>
            {useMyLocation && (
              <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
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
            className={`w-full h-11 ${useMyLocation ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
          >
            {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Crosshair className="w-4 h-4 mr-2" />}
            {locating ? 'Konum alınıyor...' : useMyLocation ? 'Konumum Aktif ✓' : 'Konumumu Al'}
          </Button>

          {useMyLocation && (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-xs font-semibold text-gray-700">Mesafe (km)</Label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 25, 50, 100, 250].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusKm(r)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all ${
                      radiusKm === r
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-emerald-300'
                    }`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-gray-500">
                  Şehir/ilçe filtreleri devre dışı
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClearLocation}
                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
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
          <Label className="text-xs font-semibold text-gray-700">Şehir</Label>
          <Select value={city} onValueChange={setCity} disabled={useMyLocation}>
            <SelectTrigger className={`h-11 ${useMyLocation ? 'opacity-50' : ''}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya'].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">İlçe</Label>
          <Input
            placeholder="İlçe adı"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            disabled={useMyLocation}
            className={`h-11 ${useMyLocation ? 'opacity-50' : ''}`}
          />
        </div>
      </div>

      {/* Sıralama */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700">Sıralama</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
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

  // Kategori renkleri
  const categoryColors: Record<string, string> = {
    INSAAT: 'bg-amber-100 text-amber-700',
    RESTAURANT: 'bg-red-100 text-red-700',
    TEMIZLIK: 'bg-cyan-100 text-cyan-700',
    NAKLIYE: 'bg-violet-100 text-violet-700',
    TARIM: 'bg-lime-100 text-lime-700',
    TEKNIK: 'bg-sky-100 text-sky-700',
    SAGLIK: 'bg-pink-100 text-pink-700',
    DIGER: 'bg-gray-100 text-gray-700',
  }
  const catColor = categoryColors[job.category] || 'bg-emerald-100 text-emerald-700'

  return (
    <Card
      className={`group relative hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden ${
        isUrgent
          ? 'border-red-200 bg-gradient-to-br from-red-50/50 to-white'
          : isHigh
          ? 'border-orange-200 bg-gradient-to-br from-orange-50/30 to-white'
          : 'border-gray-200 hover:border-emerald-300'
      }`}
      onClick={onClick}
    >
      {/* Aciliyet şeridi */}
      {isUrgent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
      )}
      {isHigh && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-amber-400" />
      )}

      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 transition-transform group-hover:scale-110 ${catColor}`}>
            {categoryIcon(job.category)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm sm:text-base">{job.title}</h3>
              <Badge
                variant="outline"
                className={`${urgency.color} border flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0`}
              >
                {urgency.text}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1 flex-wrap">
              <span className={`font-medium ${catColor.split(' ')[1]}`}>{categoryLabel(job.category)}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{job.district}, {job.city}</span>
              </span>
              {job.distanceKm !== undefined && (
                <>
                  <span>•</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-0.5 flex-shrink-0 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <Navigation className="w-3 h-3" />
                    {formatDistance(job.distanceKm)}
                  </span>
                </>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 gap-2">
              <div className="flex items-center gap-2 sm:gap-3 text-sm flex-wrap">
                <div className="flex items-center gap-1 font-bold text-emerald-700">
                  <Wallet className="w-3.5 h-3.5" />
                  {formatWage(job.wageAmount, job.wageType)}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysUntil(job.workDate)}
                </div>
                {remaining > 0 && (
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {remaining} kişi
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                <Avatar className="w-5 h-5">
                  <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700">
                    {initials(job.employer?.companyName || job.employer?.fullName)}
                  </AvatarFallback>
                </Avatar>
                {job.employer?.isVerified && (
                  <span title="Onaylı işveren" className="text-blue-500">
                    <CheckCircle2 className="w-3 h-3 fill-blue-100 text-blue-600" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">Gösterilecek iş ilanı yok.</p>
        <p className="text-sm text-gray-500">Filtreleri değiştirip tekrar deneyin.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
      {/* Harita */}
      <div className="lg:col-span-2">
        <Card className="overflow-hidden border-gray-200 h-[400px] sm:h-[500px] lg:h-[600px]">
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
