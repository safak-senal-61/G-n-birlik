'use client'

import { useState } from 'react'
import { jobsApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Clock, Wallet, Users, Loader2, AlertCircle, Navigation, X, Plus } from 'lucide-react'
import { categoryLabel, categoryIcon } from '@/lib/format'
import { toast } from 'sonner'

const ISTANBUL_DISTRICTS = [
  'Kadıköy', 'Beşiktaş', 'Şişli', 'Bakırköy', 'Maltepe', 'Üsküdar',
  'Fatih', 'Beyoğlu', 'Ataşehir', 'Ümraniye', 'Pendik', 'Kartal',
  'Sarıyer', 'Beylikdüzü', 'Esenyurt', 'Başakşehir', 'Avcılar', 'Zeytinburnu'
]

export default function PostJobScreen() {
  const { go, back } = useApp()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'INSAAT',
    requiredSkills: [] as string[],
    workDate: '',
    startTime: '08:00',
    endTime: '17:00',
    durationHours: 9,
    wageAmount: '',
    wageType: 'DAILY',
    isWageNegotiable: false,
    city: 'İstanbul',
    district: 'Kadıköy',
    address: '',
    latitude: 40.9904,
    longitude: 29.0291,
    locationNote: '',
    openingsTotal: '1',
    urgency: 'NORMAL',
  })

  const [skillInput, setSkillInput] = useState('')
  const [gettingLocation, setGettingLocation] = useState(false)

  const update = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addSkill = () => {
    if (skillInput.trim() && !form.requiredSkills.includes(skillInput.trim())) {
      update('requiredSkills', [...form.requiredSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    update('requiredSkills', form.requiredSkills.filter((s) => s !== skill))
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tarayıcınız konum desteklemiyor.')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('latitude', pos.coords.latitude)
        update('longitude', pos.coords.longitude)
        toast.success('Konumunuz alındı!')
        setGettingLocation(false)
      },
      (err) => {
        toast.error('Konum alınamadı: ' + err.message)
        setGettingLocation(false)
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (form.title.length < 5) return toast.error('Başlık en az 5 karakter olmalı.')
    if (form.description.length < 20) return toast.error('Açıklama en az 20 karakter olmalı.')
    if (!form.workDate) return toast.error('İş tarihi gerekli.')
    if (Number(form.wageAmount) <= 0) return toast.error('Ücret 0\'dan büyük olmalı.')
    if (Number(form.openingsTotal) < 1) return toast.error('Pozisyon sayısı en az 1 olmalı.')

    setLoading(true)
    try {
      await jobsApi.create({
        ...form,
        wageAmount: Number(form.wageAmount),
        openingsTotal: Number(form.openingsTotal),
        durationHours: Number(form.durationHours),
        workDate: new Date(form.workDate).toISOString(),
      })
      toast.success('İlanınız yayınlandı! 🎉')
      go('my-jobs')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const categories = ['INSAAT', 'RESTAURANT', 'TEMIZLIK', 'NAKLIYE', 'TARIM', 'TEKNIK', 'SAGLIK', 'DIGER']

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Yeni İş İlanı Ver</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">İş arayanlara hızlı ulaşın, hemen işçi bulun.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Temel Bilgiler */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm flex items-center justify-center font-bold flex-shrink-0">1</span>
              İlan Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm">İlan Başlığı *</Label>
              <Input
                id="title"
                placeholder="örn: İnşaat İşçisi Aranıyor (Günlük)"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm">İş Tanımı *</Label>
              <Textarea
                id="description"
                placeholder="İşin detaylarını, beklentilerinizi ve sağlanan imkanları açıklayın..."
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={5}
                required
                className="text-sm"
              />
              <p className="text-xs text-gray-500">{form.description.length} / min 20 karakter</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Kategori *</Label>
                <Select value={form.category} onValueChange={(v) => update('category', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryIcon(c)} {categoryLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Aciliyet</Label>
                <Select value={form.urgency} onValueChange={(v) => update('urgency', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Düşük</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">Yüksek</SelectItem>
                    <SelectItem value="URGENT">Acil!</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Aranan Yetenekler (opsiyonel)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="örn: Boyacı, Tesisatçı"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                  className="h-11"
                />
                <Button type="button" variant="outline" onClick={addSkill} className="h-11 w-11 p-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {form.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-emerald-50 text-emerald-700">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarih ve Saat */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm flex items-center justify-center font-bold flex-shrink-0">2</span>
              Tarih ve Saat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  İş Tarihi *
                </Label>
                <Input
                  type="date"
                  min={today}
                  value={form.workDate}
                  onChange={(e) => update('workDate', e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Süre (saat)
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={form.durationHours}
                  onChange={(e) => update('durationHours', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Başlangıç Saati</Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => update('startTime', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Bitiş Saati</Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update('endTime', e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ücret */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm flex items-center justify-center font-bold flex-shrink-0">3</span>
              Ücret ve Pozisyon
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1">
                  <Wallet className="w-4 h-4" />
                  Ücret (₺) *
                </Label>
                <Input
                  type="number"
                  placeholder="örn: 2500"
                  value={form.wageAmount}
                  onChange={(e) => update('wageAmount', e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Ücret Tipi</Label>
                <Select value={form.wageType} onValueChange={(v) => update('wageType', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOURLY">Saatlik</SelectItem>
                    <SelectItem value="DAILY">Günlük</SelectItem>
                    <SelectItem value="FIXED">Net (Tek Seferlik)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                <Users className="w-4 h-4" />
                Açık Pozisyon Sayısı *
              </Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={form.openingsTotal}
                onChange={(e) => update('openingsTotal', e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
              <div className="min-w-0">
                <Label className="font-medium text-sm">Ücret Pazarlığı Açık</Label>
                <p className="text-xs text-gray-500">İşçiler kendi tekliflerini sunabilir</p>
              </div>
              <Switch
                checked={form.isWageNegotiable}
                onCheckedChange={(v) => update('isWageNegotiable', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Konum */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm flex items-center justify-center font-bold flex-shrink-0">4</span>
              Konum
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Şehir</Label>
                <Select value={form.city} onValueChange={(v) => update('city', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya'].map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">İlçe</Label>
                <Select value={form.district} onValueChange={(v) => update('district', v)}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISTANBUL_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Adres (opsiyonel)
              </Label>
              <Input
                placeholder="Mahalle, cadde, sokak..."
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Konum Notu (opsiyonel)</Label>
              <Input
                placeholder="örn: Metrobüs durağına 2 dk yürüme"
                value={form.locationNote}
                onChange={(e) => update('locationNote', e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Navigation className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-blue-900">GPS Koordinatları</div>
                <div className="text-xs text-blue-700">
                  Enlem: {form.latitude.toFixed(4)}, Boylam: {form.longitude.toFixed(4)}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getLocation}
                disabled={gettingLocation}
                className="h-10"
              >
                {gettingLocation ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
                Konumumu Al
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Submit - Mobilde tam genişlik */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end sticky bottom-4 bg-white/95 backdrop-blur p-3 -mx-3 sm:mx-0 sm:bg-transparent sm:p-0 sm:static rounded-lg sm:rounded-none border-t sm:border-0 border-gray-100">
          <Button type="button" variant="outline" onClick={back} className="h-11 sm:w-auto">
            İptal
          </Button>
          <Button type="submit" className="h-11 bg-emerald-600 hover:bg-emerald-700 sm:w-auto" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            İlanı Yayınla
          </Button>
        </div>
      </form>
    </div>
  )
}
