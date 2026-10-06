'use client'

import { useState, useEffect } from 'react'
import { jobsApi, walletApi, geocodeApi } from '@/lib/api'
import { useApp } from '@/lib/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Calendar,
  Clock,
  Wallet,
  Users,
  Loader2,
  AlertCircle,
  Navigation,
  X,
  Plus,
  Minus,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Trophy,
  Flame,
  Check,
  Briefcase,
  Edit3,
  Zap,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { categoryLabel, categoryIcon, formatWage } from '@/lib/format'
import { toast } from 'sonner'

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

interface CategoryTemplate {
  title: string
  description: string
}

interface CategoryData {
  id: string
  name: string
  icon: string
  desc: string
  templates: CategoryTemplate[]
  skills: string[]
}

const CATEGORY_DATA: Record<string, CategoryData> = {
  INSAAT: {
    id: 'INSAAT',
    name: 'İnşaat & Yapı',
    icon: '🔨',
    desc: 'Usta, amele, boya, yıkım',
    templates: [
      {
        title: 'Günlük İnşaat İşçisi Aranıyor',
        description: 'Şantiye sahamızda malzeme taşıma, harç hazırlama ve genel saha düzenlemesinde görev alacak fiziksel gücü yerinde ekip arkadaşları arıyoruz. Öğle yemeği ve koruyucu ekipman temin edilir.',
      },
      {
        title: 'Alçı, Boya ve Badana Ustası',
        description: 'Daire içi tadilat işinde tavan ve duvar alçı tamiratı yapabilecek, 2 kat silikonlu iç cephe boyası uygulayacak tecrübeli usta aranmaktadır. Tüm malzemeler iş sahasında mevcuttur.',
      },
      {
        title: 'Kalıp ve İnşaat Demiri Ustası',
        description: 'Temel ve kolon betonu öncesi ahşap/çelik kalıp çakımı ile demir bağlama işlerinde çalışacak deneyimli ustalar aranıyor. Günlük hak ediş gün sonunda teslim edilir.',
      },
      {
        title: 'Moloz Atımı & Kırım / Yıkım Elemanı',
        description: 'Daire içi banyo ve mutfak seramik kırımından çıkan molozların çuvallanıp araca taşınması işidir. Ağır yük kaldırabilen güçlü çalışma arkadaşları aranmaktadır.',
      },
      {
        title: 'Şantiye Kaba Temizlik & Destek Elemanı',
        description: 'İnşaat bitimi sonrası katlardaki moloz ve harç artıklarının süpürülmesi, ambalaj atıklarının toplanması için günlük personel aranıyor.',
      },
    ],
    skills: ['Fiziki Güç', 'Boya & Badana', 'Alçı & Sıva', 'Kalıpçılık', 'Demir Bağlama', 'Kırım & Yıkım', 'Şantiye Tecrübesi', 'İş Güvenliği'],
  },
  RESTAURANT: {
    id: 'RESTAURANT',
    name: 'Restoran & Cafe',
    icon: '🍽️',
    desc: 'Garson, komi, bulaşık',
    templates: [
      {
        title: 'Restoran İçin Acil Komi & Garson',
        description: 'Akşam servis yoğunluğunda masaların toplanması, sipariş servisi ve müşteri karşılama süreçlerinde yardımcı olacak güler yüzlü ekip arkadaşı arıyoruz. Yemek dahildir.',
      },
      {
        title: 'Bulaşıkçı & Mutfak Hijyen Elemanı',
        description: 'Mutfak bölümünde sanayi tipi bulaşık makinesini kullanacak, tabak, tencere ve mutfak ekipmanlarının temizliğini sağlayacak çalışma arkadaşı aranıyor.',
      },
      {
        title: 'Cafe Barista & Servis Elemanı',
        description: 'Espresso bazlı sıcak/soğuk kahve çeşitlerini hazırlayabilecek, müşteri ilişkileri güçlü ve dinamik barista/servis elemanı aranmaktadır.',
      },
      {
        title: 'Düğün / Davet Organizasyon Garsonu',
        description: 'Hafta sonu gerçekleşecek davet organizasyonumuzda masalara yemek ve içecek servisi yapacak prezentabl ve hızlı garsonlar arıyoruz.',
      },
      {
        title: 'Mutfak Ön Hazırlık & Doğrama Elemanı',
        description: 'Mutfak şefimize yardımcı olacak, sebze doğrama, malzeme hazırlığı ve mutfak düzeni işlerinde çalışacak pratik personel aranmaktadır.',
      },
    ],
    skills: ['Garsonluk', 'Komi', 'Bulaşık & Hijyen', 'Hızlı Servis', 'Diksiyon', 'Barista', 'Mutfak Destek', 'Kasa & Sipariş'],
  },
  TEMIZLIK: {
    id: 'TEMIZLIK',
    name: 'Temizlik',
    icon: '✨',
    desc: 'Ev, ofis, inşaat sonrası',
    templates: [
      {
        title: 'Ev Temizliği (Gündelik Eleman)',
        description: '3+1 dairede yerlerin silinmesi, camların temizlenmesi, toz alma, banyo ve mutfak detaylı temizliğini yapacak güvenilir ve titiz yardımcı aranmaktadır. Tüm malzemeler evde mevcuttur.',
      },
      {
        title: 'İnşaat / Tadilat Sonrası Daire Temizliği',
        description: 'Tadilatı yeni biten boş dairede harç, boya kalıntılarının temizlenmesi, zeminlerin kazınması ve cam etiketlerinin sökülmesi işidir.',
      },
      {
        title: 'Ofis & İş Yeri Detaylı Temizlik Elemanı',
        description: 'Şirket ofisimizin çalışma masaları, zeminleri, mutfak ve ortak alanlarının temizliğini gerçekleştirecek düzenli ve titiz personel aranıyor.',
      },
      {
        title: 'Koltuk & Yatak Yıkama Yardımcısı',
        description: 'Mobil buharlı yıkama makinesi ile yerinde koltuk ve yatak temizliğinde operatöre destek sağlayacak çalışma arkadaşı aranmaktadır.',
      },
      {
        title: 'Bina Merdiven & Ortak Alan Temizliği',
        description: 'Apartman merdivenleri, tırabzanlar ve bina girişinin paspaslanıp temizlenmesi için yarım günlük temizlik personeli aranıyor.',
      },
    ],
    skills: ['Ev Temizliği', 'Ofis Temizliği', 'Cam Silme', 'Detaylı Temizlik', 'Hızlı & Titiz', 'Makine Kullanımı', 'Buharlı Yıkama', 'Hijyen Kuralları'],
  },
  NAKLIYE: {
    id: 'NAKLIYE',
    name: 'Nakliye & Taşıma',
    icon: '🚚',
    desc: 'Hamal, koli, kurye',
    templates: [
      {
        title: 'Evden Eve Eşya Taşıma / Hamal',
        description: 'Ev taşıma sürecinde mobilya, beyaz eşya ve kolilerin kamyona yüklenmesi ve yeni adrese taşınması işidir. Ağır yük kaldırabilen güçlü takım arkadaşları arıyoruz.',
      },
      {
        title: 'Koli Yükleme & Boşaltma Personeli',
        description: 'Depomuza gelen kamyondan tekstil/gıda kolilerinin indirilip paletlere dizilmesi için günlük yükleme-boşaltma elemanları aranmaktadır.',
      },
      {
        title: 'Panelvan İçi Eşya Taşıma / Dağıtım Elemanı',
        description: 'Şehir içi sevkiyatlarda şoförümüze eşlik edecek, teslimat noktalarında ürünlerin araçtan indirilip müşteriye tesliminde çalışacak eleman aranıyor.',
      },
      {
        title: 'Mobilya Demontaj & Paketleme / Taşıma',
        description: 'Taşınacak gardırop ve masaların sökülmesi, balonlu naylonla sarılması ve araca güvenle taşınması işidir.',
      },
      {
        title: 'Depo İçi Mal Kabul & Transpalet Elemanı',
        description: 'Lojistik depomuzda gelen malların transpalet ile taşınması, barkodlanması ve raflara yerleştirilmesi işidir.',
      },
    ],
    skills: ['Fiziki Güç', 'Eşya Taşıma', 'Koli Yükleme', 'Mobilya Demontaj', 'Paketleme & Streç', 'Transpalet', 'Ağır Yük', 'Hızlı Çalışma'],
  },
  TEKNIK: {
    id: 'TEKNIK',
    name: 'Teknik & Tamirat',
    icon: '🔧',
    desc: 'Elektrik, su, montaj',
    templates: [
      {
        title: 'Elektrik Tesisatı & Arıza Tamir Ustası',
        description: 'Daire içi priz, aydınlatma, sigorta panosu değişimi ve kablo çekimi işlerinde görev alacak işinin ehli elektrik ustası aranmaktadır.',
      },
      {
        title: 'Su Tesisatı & Batarya / Gider Montajı',
        description: 'Banyo ve mutfak su borusu tamiratı, batarya değişimi ve lavabo gider bağlantılarının yapılması için tesisat ustası aranıyor.',
      },
      {
        title: 'Mobilya & Dolap Kurulum Montaj Ustası',
        description: 'Demonte gelen gardırop, TV ünitesi ve mutfak dolaplarının şarjlı matkap ile kurulumunu yapacak montaj ustası aranmaktadır.',
      },
      {
        title: 'Klima Montaj & Bakım Yardımcısı',
        description: 'Split klima montajı, bakır boru çekimi ve dış ünite montajında klima teknisyenine destek olacak çalışma arkadaşı aranıyor.',
      },
      {
        title: 'Kaynak & Profil Demir İmalat Elemanı',
        description: 'Atölyemizde demir profil kesimi, taşlama ve elektrot kaynak işlerinde çalışacak deneyimli kaynakçı aranmaktadır.',
      },
    ],
    skills: ['Elektrik', 'Su Tesisatı', 'Mobilya Montajı', 'Şarjlı Matkap', 'Kaynak', 'Klima/Kombi', 'Usta Belgesi', 'Pratik Tamirat'],
  },
  TARIM: {
    id: 'TARIM',
    name: 'Tarım & Bahçe',
    icon: '🌾',
    desc: 'Hasat, budama, bahçıvan',
    templates: [
      {
        title: 'Bahçe Bakımı & Çim Biçme Elemanı',
        description: 'Müstakil evimizin bahçesinde çimlerin biçilmesi, yabani otların temizlenmesi ve genel peyzaj düzenlemesi için günlük bahçıvan aranıyor.',
      },
      {
        title: 'Meyve / Sebze Hasat & Toplama İşçisi',
        description: 'Bahçemizdeki meyvelerin toplanması, kasalanması ve araca yüklenmesi işidir. Günlük servis ve öğle yemeği sağlanacaktır.',
      },
      {
        title: 'Ağaç Budama & Dal Temizleme Elemanı',
        description: 'Bahçe içindeki meyve ve zeytin ağaçlarının budanması, kesilen dalların toplanıp istiflenmesi için deneyimli bahçıvan aranmaktadır.',
      },
      {
        title: 'Sera İçi Fide Dikimi & Bakım Elemanı',
        description: 'Seramızda fide dikimi, sulama ve çapa işlerinde görev alacak dikkatli ve çalışkan tarım personelleri aranıyor.',
      },
      {
        title: 'Toprak Çapalama & Gübreleme Elemanı',
        description: 'Ekim öncesi toprağın bellenmesi, havalandırılması ve doğal gübre serimi işleri için günlük eleman aranmaktadır.',
      },
    ],
    skills: ['Bahçıvanlık', 'Çim Biçme Makinesi', 'Budama', 'Hasat & Toplama', 'Çapalama', 'Sulama', 'Fiziki Dayanıklılık', 'Açık Hava'],
  },
  SAGLIK: {
    id: 'SAGLIK',
    name: 'Sağlık & Bakım',
    icon: '❤️',
    desc: 'Hasta, yaşlı, refakatçi',
    templates: [
      {
        title: 'Hastanede Günlük Refakatçi',
        description: 'Hastanede yatan hastamızın yanında gece/gündüz refakat edecek, su/yemek ve temel ihtiyaçlarına yardımcı olacak şefkatli refakatçi aranıyor.',
      },
      {
        title: 'Evde Yaşlı Bakımı ve İlaç Takibi',
        description: 'Gündüz saatlerinde yaşlı aile büyüğümüzle ilgilenecek, tansiyon/şeker ilacı saatlerini takip edecek, sohbet edecek güler yüzlü yardımcı aranmaktadır.',
      },
      {
        title: 'Yatalak Hasta Öz Bakım Destek Elemanı',
        description: 'Hastamızın kişisel hijyeni, alt değişimi, pozisyon değişimi ve beslenmesine destek sağlayacak deneyimli refakatçi aranıyor.',
      },
      {
        title: 'Çocuk Bakıcısı (Günlük / Etkinlik Boyunca)',
        description: 'Özel bir organizasyon veya yoğun iş günümüzde çocuğumuzla oyun oynayacak, güvenliğini sağlayacak güvenilir bakıcı aranmaktadır.',
      },
      {
        title: 'Fizik Tedavi & Yürüyüş Eşlikçisi',
        description: 'Ameliyat sonrası iyileşme sürecindeki hastamıza ev içi ve bahçe yürüyüşlerinde refakat edecek, düşme riskini önleyecek refakatçi aranıyor.',
      },
    ],
    skills: ['Hasta Refakat', 'Yaşlı Bakımı', 'İlaç Takibi', 'İlk Yardım', 'Sabırlı & Şefkatli', 'Güler Yüzlü', 'Hijyen & Özbakım', 'İletişim'],
  },
  DIGER: {
    id: 'DIGER',
    name: 'Diğer İşler',
    icon: '💼',
    desc: 'Etkinlik, fuar, tanıtım',
    templates: [
      {
        title: 'Fuar & Etkinlik Stand Görevlisi',
        description: 'Kongre/fuar alanında standımızda ziyaretçilere katalog dağıtacak, ikramlarda bulunacak ve iletişim bilgisi alacak prezentabl ekip arkadaşları arıyoruz.',
      },
      {
        title: 'Broşür & El İlanı Dağıtım Elemanı',
        description: 'İşlek meydan ve cadde üzerinde tanıtım broşürlerimizin dağıtımını gerçekleştirecek enerjik ve güler yüzlü gençler aranmaktadır.',
      },
      {
        title: 'Depo Sayım & Barkod Kontrol Personeli',
        description: 'Yıl sonu/dönemlik mağaza envanter sayımında görev alacak, ürünleri sayıp listelere işleyecek dikkatli personel aranıyor.',
      },
      {
        title: 'Dizi / Film Seti Prodüksiyon Asistanı',
        description: 'Çekim setinde ekipmanların taşınması, çay/kahve servisi ve set düzeni işlerinde koşturacak dinamik yardımcılar aranmaktadır.',
      },
      {
        title: 'Mağaza İçi Raf Düzenleme & Askı Elemanı',
        description: 'Tekstil mağazamızda indirim dönemi kıyafetlerin katlanması, askılanması ve reyonların toparlanmasında çalışacak eleman aranıyor.',
      },
    ],
    skills: ['Prezentabl', 'İletişim & Diksiyon', 'Broşür Dağıtımı', 'Stand Görevlisi', 'Barkod / Sayım', 'Dinamik', 'Güler Yüzlü', 'Hızlı'],
  },
}

const CATEGORY_ITEMS = Object.values(CATEGORY_DATA)

const URGENCY_OPTIONS = [
  { id: 'NORMAL', label: 'Normal', icon: '🟢', desc: 'Standart iş ilanı' },
  { id: 'HIGH', label: 'Yüksek', icon: '🟡', desc: 'Öncelikli listelenir' },
  { id: 'URGENT', label: 'Acil!', icon: '🔴', desc: 'İşçilere anında bildirim' },
  { id: 'LOW', label: 'Düşük', icon: '⚪', desc: 'Esnek zamanlı' },
]

const TOTAL_LEVELS = 5

export default function PostJobScreen() {
  const { go, back } = useApp()
  const [level, setLevel] = useState(1)
  const [highestLevelUnlocked, setHighestLevelUnlocked] = useState(1)
  const [loading, setLoading] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [insufficientModalOpen, setInsufficientModalOpen] = useState(false)
  const [levelUpEffect, setLevelUpEffect] = useState(false)

  // Cüzdan Bakiyesi Çek
  useEffect(() => {
    walletApi
      .balance()
      .then((res) => setWalletBalance(res.balance))
      .catch(() => setWalletBalance(0))
      .finally(() => setLoadingBalance(false))
  }, [])

  // Form State
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
    wageType: 'DAILY' as 'HOURLY' | 'DAILY' | 'FIXED',
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

  const currentCategory = CATEGORY_DATA[form.category] || CATEGORY_DATA.INSAAT

  const applyTemplate = (tpl: CategoryTemplate) => {
    setForm((prev) => ({
      ...prev,
      title: tpl.title,
      description: prev.description.trim().length < 25 ? tpl.description : prev.description,
    }))
    toast.success(`"${tpl.title}" şablonu seçildi! ✨`)
  }

  const update = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const addSkill = (val?: string) => {
    const toAdd = (val || skillInput).trim()
    if (toAdd && !form.requiredSkills.includes(toAdd)) {
      update('requiredSkills', [...form.requiredSkills, toAdd])
      if (!val) setSkillInput('')
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
    const toastId = toast.loading('GPS konumu alınıyor...')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        try {
          toast.loading('Adres bilgileri çözümleniyor...', { id: toastId })
          const geoRes = await geocodeApi.reverse(lat, lng)

          if (geoRes) {
            const city = geoRes.city || geoRes.state || ''
            const district = geoRes.district || ''
            const address =
              geoRes.formattedAddress ||
              geoRes.street ||
              (geoRes.displayName ? geoRes.displayName.split(',').slice(0, 3).join(', ') : '')

            setForm((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lng,
              city: city || prev.city,
              district: district || prev.district,
              address: address || prev.address,
            }))

            toast.success(
              `${district ? district + ', ' : ''}${city || 'Konum'} bilgileri alanlara aktarıldı! 📍`,
              { id: toastId }
            )
          } else {
            update('latitude', lat)
            update('longitude', lng)
            toast.success('Koordinatlar başarıyla kaydedildi! 📍', { id: toastId })
          }
        } catch (e) {
          console.error('Reverse geocode hatası:', e)
          update('latitude', lat)
          update('longitude', lng)
          toast.success('Koordinatlar kaydedildi (Adres manuel girilebilir). 📍', { id: toastId })
        } finally {
          setGettingLocation(false)
        }
      },
      (err) => {
        toast.error('Konum alınamadı: ' + err.message, { id: toastId })
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    )
  }

  // Escrow ve Bakiye Hesabı
  const wage = Number(form.wageAmount) || 0
  const openings = Math.max(1, Number(form.openingsTotal) || 1)
  const totalEscrowRequired = wage * openings
  const isBalanceSufficient = walletBalance !== null && walletBalance >= totalEscrowRequired
  const missingAmount = Math.max(0, totalEscrowRequired - (walletBalance || 0))

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  // Seviye Geçiş Doğrulamaları
  const validateLevel = (currentLvl: number): boolean => {
    if (currentLvl === 1) {
      if (form.title.trim().length < 5) {
        toast.error('İlan başlığı en az 5 karakter olmalıdır.')
        return false
      }
      if (form.description.trim().length < 20) {
        toast.error(`İş tanımı en az 20 karakter olmalıdır (Şu an: ${form.description.trim().length} karakter).`)
        return false
      }
      if (!form.category) {
        toast.error('Lütfen bir kategori seçin.')
        return false
      }
      return true
    }

    if (currentLvl === 2) {
      if (!form.workDate) {
        toast.error('Lütfen iş tarihini belirleyin.')
        return false
      }
      if (Number(form.durationHours) <= 0) {
        toast.error('Çalışma süresi 0\'dan büyük olmalıdır.')
        return false
      }
      return true
    }

    if (currentLvl === 3) {
      if (Number(form.wageAmount) <= 0) {
        toast.error('Lütfen geçerli bir ücret tutarı girin.')
        return false
      }
      if (Number(form.openingsTotal) < 1) {
        toast.error('Açık pozisyon sayısı en az 1 olmalıdır.')
        return false
      }
      return true
    }

    if (currentLvl === 4) {
      if (!form.city || !form.district) {
        toast.error('Lütfen şehir ve ilçe seçin.')
        return false
      }
      return true
    }

    return true
  }

  // Bir sonraki seviyeye atla (Level Up!)
  const handleNextLevel = () => {
    if (!validateLevel(level)) return

    const nextLvl = level + 1
    if (nextLvl <= TOTAL_LEVELS) {
      setLevel(nextLvl)
      if (nextLvl > highestLevelUnlocked) {
        setHighestLevelUnlocked(nextLvl)
      }
      // Gamified trigger
      setLevelUpEffect(true)
      setTimeout(() => setLevelUpEffect(false), 1200)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevLevel = () => {
    if (level > 1) {
      setLevel(level - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const jumpToLevel = (targetLvl: number) => {
    if (targetLvl <= highestLevelUnlocked) {
      setLevel(targetLvl)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      toast.info('Önce mevcut seviyeyi tamamlamalısınız 🔒')
    }
  }

  // Nihai Form Gönderimi (Level 5)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Bakiye kontrolü
    if (walletBalance !== null && walletBalance < totalEscrowRequired) {
      setInsufficientModalOpen(true)
      return
    }

    setLoading(true)
    try {
      await jobsApi.create({
        ...form,
        wageAmount: Number(form.wageAmount),
        openingsTotal: Number(form.openingsTotal),
        durationHours: Number(form.durationHours),
        workDate: new Date(form.workDate).toISOString(),
      })
      toast.success('Tebrikler! İlanınız başarıyla yayınlandı ve emanet tutarı ayrıldı! 🎉🚀')
      go('my-jobs')
    } catch (err: any) {
      if (err.message && (err.message.toLowerCase().includes('yetersiz') || err.message.toLowerCase().includes('bakiye'))) {
        setInsufficientModalOpen(true)
      }
      toast.error(err.message || 'İlan oluşturulamadı.')
    } finally {
      setLoading(false)
    }
  }

  // XP ve Yüzde Hesaplama
  const xpPercent = Math.round((level / TOTAL_LEVELS) * 100)

  const LEVEL_NAMES = [
    { num: 1, title: 'Görev Tanımı', icon: '🎯' },
    { num: 2, title: 'Zaman Planı', icon: '⏰' },
    { num: 3, title: 'Ücret & Emanet', icon: '💰' },
    { num: 4, title: 'Konum', icon: '📍' },
    { num: 5, title: 'Onay & Yayın', icon: '🚀' },
  ]

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
      {/* Üst Başlık & XP Seviye Çubuğu */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                SEVİYE {level} / {TOTAL_LEVELS}
              </span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                %{xpPercent} XP Tamamlandı
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1 flex items-center gap-2">
              <span>{LEVEL_NAMES[level - 1].icon}</span>
              <span>{LEVEL_NAMES[level - 1].title}</span>
            </h1>
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-500 font-medium">Bakiye: </span>
            <span className="text-sm font-bold text-emerald-700">
              {loadingBalance ? '...' : `₺${(walletBalance ?? 0).toLocaleString('tr-TR')}`}
            </span>
          </div>
        </div>

        {/* Level Up Animasyon Bildirimi */}
        {levelUpEffect && (
          <div className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-md flex items-center justify-center gap-2 text-xs font-bold animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>Tebrikler! Seviye Atlandı! Seviye {level}&apos;e ulaştınız ⚡</span>
          </div>
        )}

        {/* Gamified XP Progress Bar */}
        <div className="w-full bg-gray-200/80 rounded-full h-3 overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 transition-all duration-500 ease-out shadow-xs relative"
            style={{ width: `${xpPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>

        {/* Seviye Adımları Navigasyonu (3D Tactile Buttons) */}
        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {LEVEL_NAMES.map((lvl) => {
            const isCompleted = lvl.num < level
            const isCurrent = lvl.num === level
            const isUnlocked = lvl.num <= highestLevelUnlocked

            return (
              <button
                key={lvl.num}
                type="button"
                onClick={() => jumpToLevel(lvl.num)}
                disabled={!isUnlocked}
                className={`py-2 px-1 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isCurrent
                    ? 'btn-3d-emerald rounded-2xl shadow-sm z-10 font-black'
                    : isCompleted
                    ? 'btn-3d-white rounded-2xl text-emerald-800 font-extrabold'
                    : 'bg-slate-50 border border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs">{lvl.icon}</span>
                  {isCompleted && <Check className="w-3 h-3 text-emerald-600" />}
                </div>
                <span className="text-[10px] font-bold truncate max-w-full leading-tight">
                  {lvl.title.split(' ')[0]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SEVİYE 1: GÖREV TANIMI & KATEGORİ                                   */}
      {/* ==================================================================== */}
      {level === 1 && (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 dark:border dark:border-white/10 animate-in fade-in-50 duration-300">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">
                🎯
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">Seviye 1: Görevi Tanımla</h2>
                <p className="text-xs text-emerald-100">İşçilerin ne yapacağını ve hangi kategoride olduğunu belirtin.</p>
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* 1. Kategori Seçimi - Görsel Kartlar (İlk Adım) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                  1. İş Kategorisi Seçin *
                </Label>
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                  <span>{currentCategory.icon}</span>
                  <span>{currentCategory.name}</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CATEGORY_ITEMS.map((cat) => {
                  const isSelected = form.category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => update('category', cat.id)}
                      className={`p-3 rounded-xl text-left transition-all border flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/60 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{cat.icon}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-emerald-950 dark:text-emerald-300' : 'text-gray-900 dark:text-slate-100'}`}>
                          {cat.name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-1">{cat.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. İlan Başlığı & Kategoriye Özel Hızlı Şablonlar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                  2. İlan Başlığı *
                </Label>
                <span className="text-xs text-gray-400">
                  {form.title.length} / min 5 karakter
                </span>
              </div>
              <Input
                id="title"
                placeholder={`Örn: ${currentCategory.templates[0]?.title || 'İlan başlığı yazın...'}`}
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                className="h-11 text-sm font-medium"
                autoFocus
              />

              {/* Seçilen Kategoriye Ait Hızlı Şablonlar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span>💡</span>
                    <span>
                      <strong className="text-emerald-700 dark:text-emerald-400">{currentCategory.name}</strong> İçin Hızlı Şablonlar:
                    </span>
                  </p>
                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    Tıklayarak başlık ve açıklamayı otomatik doldurun
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentCategory.templates.map((tpl, idx) => {
                    const isSelected = form.title === tpl.title
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => applyTemplate(tpl)}
                        className={`text-xs px-3 py-1.5 rounded-xl transition-all border text-left flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
                            : 'bg-gray-50/80 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-white/10'
                        }`}
                      >
                        <span>{currentCategory.icon}</span>
                        <span>{tpl.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 3. İş Tanımı ve Beklentiler */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                  3. İş Tanımı ve Beklentiler *
                </Label>
                <div className="flex items-center gap-2">
                  {currentCategory.templates.some((t) => t.title === form.title) && (
                    <button
                      type="button"
                      onClick={() => {
                        const matched = currentCategory.templates.find((t) => t.title === form.title)
                        if (matched) {
                          update('description', matched.description)
                          toast.success('Şablon açıklaması aktarıldı! 📋')
                        }
                      }}
                      className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1 transition-colors"
                    >
                      <span>📋</span> Şablon Açıklamasını Yaz
                    </button>
                  )}
                  <span
                    className={`text-xs font-semibold ${
                      form.description.length >= 20 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {form.description.length} / min 20 karakter
                  </span>
                </div>
              </div>
              <Textarea
                id="description"
                placeholder={`${currentCategory.name} işinin detaylarını, çalışma koşullarını, yemek/yol durumunu ve tam olarak ne yapılacağını açıklayın...`}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={4}
                className="text-sm leading-relaxed"
              />
            </div>

            {/* 4. Aciliyet Durumu */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                4. İlan Aciliyeti
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {URGENCY_OPTIONS.map((urg) => {
                  const isSelected = form.urgency === urg.id
                  return (
                    <button
                      key={urg.id}
                      type="button"
                      onClick={() => update('urgency', urg.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-300 ring-1 ring-emerald-500'
                          : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span>{urg.icon}</span>
                        <span>{urg.label}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{urg.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 5. Aranan Beceriler (Opsiyonel) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                5. Aranan Beceriler (Opsiyonel)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Yetenek yazıp Enter'a basın..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                  className="h-10 text-sm"
                />
                <Button type="button" variant="outline" onClick={() => addSkill()} className="h-10 px-3 dark:border-white/10 dark:hover:bg-slate-800">
                  <Plus className="w-4 h-4 mr-1" /> Ekle
                </Button>
              </div>

              {/* Seçilen Yetenekler */}
              {form.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.requiredSkills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 gap-1 text-xs py-1">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}>
                        <X className="w-3 h-3 hover:text-red-600" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Seçilen Kategoriye Özel Önerilen Yetenekler */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 flex items-center gap-1.5">
                  <span>✨</span>
                  <span>
                    <strong className="text-emerald-700 dark:text-emerald-400">{currentCategory.name}</strong> İçin Önerilen Beceriler:
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {currentCategory.skills.map((s) => {
                    const isAdded = form.requiredSkills.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSkill(s)}
                        disabled={isAdded}
                        className={`text-[11px] px-2.5 py-1 rounded-lg transition-all border font-medium ${
                          isAdded
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 opacity-60 cursor-default'
                            : 'bg-gray-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-white/10'
                        }`}
                      >
                        {isAdded ? `✓ ${s}` : `+ ${s}`}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* SEVİYE 2: ZAMAN & ÇALIŞMA PLANI                                      */}
      {/* ==================================================================== */}
      {level === 2 && (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 dark:border dark:border-white/10 animate-in fade-in-50 duration-300">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">
                ⏰
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">Seviye 2: Zaman & Çalışma Planı</h2>
                <p className="text-xs text-blue-100">İşçilerin ne zaman ve kaç saat çalışacağını belirleyin.</p>
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* İş Tarihi */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                İş Tarihi *
              </Label>
              <Input
                type="date"
                min={today}
                value={form.workDate}
                onChange={(e) => update('workDate', e.target.value)}
                className="h-11 text-sm font-medium"
              />

              {/* Hızlı Tarih Butonları */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => update('workDate', today)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    form.workDate === today
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300'
                  }`}
                >
                  ⚡ Bugün ({new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })})
                </button>
                <button
                  type="button"
                  onClick={() => update('workDate', tomorrow)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${
                    form.workDate === tomorrow
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300'
                  }`}
                >
                  📅 Yarın
                </button>
              </div>
            </div>

            {/* Çalışma Saatleri */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Başlangıç Saati
                </Label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => update('startTime', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Bitiş Saati
                </Label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => update('endTime', e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-800 dark:text-slate-100">
                  Tahmini Süre (Saat)
                </Label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={form.durationHours}
                  onChange={(e) => update('durationHours', e.target.value)}
                  className="h-11 font-bold"
                />
              </div>
            </div>

            {/* Bilgilendirici İpucu Kutusu */}
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs text-blue-900 dark:text-blue-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>💡</span> Zamanlama İpucu
              </p>
              <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                İş başlama saatinden 15 dakika önce işçiye otomatik bildirim iletilecektir. İş başlangıcında ve bitişinde tek tıkla QR kod okutarak iş güvenle tamamlanır.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* SEVİYE 3: ÜCRET & GÜVENLİ EMANET HAVUZU                              */}
      {/* ==================================================================== */}
      {level === 3 && (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900 rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 dark:border dark:border-white/10 animate-in fade-in-50 duration-300">
          <div className="bg-gradient-to-r from-amber-600 to-emerald-700 p-4 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">
                💰
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">Seviye 3: Hak Ediş & Emanet Havuzu</h2>
                <p className="text-xs text-amber-100">İşçi ücretini ve kaç kişilik kadro aradığınızı belirleyin.</p>
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* Ücret Tipi Butonları */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-800 dark:text-slate-100">Ücret Tipi</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'DAILY', label: 'Günlük Ücret' },
                  { id: 'HOURLY', label: 'Saatlik Ücret' },
                  { id: 'FIXED', label: 'Net (Tek Seferlik)' },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => update('wageType', type.id)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition ${
                      form.wageType === type.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ücret Tutarı (₺) */}
            <div className="space-y-2">
              <Label htmlFor="wageAmount" className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Kişi Başı Ücret (₺) *
              </Label>
              <div className="relative">
                <Input
                  id="wageAmount"
                  type="number"
                  placeholder="Örn: 2000"
                  value={form.wageAmount}
                  onChange={(e) => update('wageAmount', e.target.value)}
                  className="h-12 text-lg font-black pl-8"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-slate-400 font-bold text-base">
                  ₺
                </span>
              </div>

              {/* Hızlı Tutar Seçenekleri */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[500, 1000, 1500, 2000, 2500, 3000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => update('wageAmount', String(amt))}
                    className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 text-gray-700 dark:text-slate-200 font-medium border border-gray-200 dark:border-white/10"
                  >
                    {amt.toLocaleString('tr-TR')} ₺
                  </button>
                ))}
              </div>
            </div>

            {/* Açık Pozisyon Sayısı (Kişi Sayısı Stepper) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Kaç Kişi Aranıyor? (Kontenjan) *
              </Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => update('openingsTotal', String(Math.max(1, Number(form.openingsTotal) - 1)))}
                  className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-slate-200 font-bold transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl h-11 flex items-center justify-center font-black text-lg text-gray-900 dark:text-slate-100">
                  {form.openingsTotal} Kişi
                </div>
                <button
                  type="button"
                  onClick={() => update('openingsTotal', String(Number(form.openingsTotal) + 1))}
                  className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center text-gray-700 dark:text-slate-200 font-bold transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pazarlık Seçeneği */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-white/10 gap-3">
              <div>
                <Label className="font-bold text-xs sm:text-sm text-gray-900 dark:text-slate-100">Ücret Pazarlığına Açık</Label>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">İşçiler başvuru yaparken karşı teklif sunabilir</p>
              </div>
              <Switch
                checked={form.isWageNegotiable}
                onCheckedChange={(v) => update('isWageNegotiable', v)}
              />
            </div>

            {/* GÜVENLİ EMANET HAVUZU (ESCROW) VE BAKİYE KONTROLÜ */}
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200 font-bold text-sm">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Güvenli Emanet Havuzu (Escrow)</span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  %100 Garanti
                </Badge>
              </div>

              <div className="bg-white dark:bg-slate-850 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/40 space-y-2 text-xs shadow-xs">
                <div className="flex justify-between items-center text-gray-600 dark:text-slate-400">
                  <span>Mevcut Cüzdan Bakiyeniz:</span>
                  <span className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                    {loadingBalance ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin inline text-emerald-600" />
                    ) : (
                      `₺${(walletBalance ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center text-gray-600 dark:text-slate-400">
                  <span>
                    Gereken Emanet Tutarı ({openings} kişi x ₺{wage.toLocaleString('tr-TR')}):
                  </span>
                  <span className="font-black text-emerald-700 dark:text-emerald-400 text-base">
                    ₺{totalEscrowRequired.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {totalEscrowRequired > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                    {isBalanceSufficient ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold py-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Bakiyeniz yeterli! İlan onaylandığında bu tutar emanet havuzuna ayrılır.</span>
                      </div>
                    ) : (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/40">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div className="text-xs leading-snug">
                            Cüzdan bakiyeniz yetersiz. İlanı yayına almak için{' '}
                            <strong className="text-amber-950 dark:text-amber-200">
                              ₺{missingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                            </strong>{' '}
                            bakiye yüklemeniz gerekmektedir.
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => go('wallet')}
                          className="w-full h-9 bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold gap-2"
                        >
                          <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Cüzdana Para Yükle</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-auto text-amber-600 dark:text-amber-400" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* SEVİYE 4: GÖREV LOKASYONU & KONUM                                    */}
      {/* ==================================================================== */}
      {level === 4 && (
        <Card className="border-0 shadow-lg bg-white dark:bg-slate-900/90 dark:ring-white/10 dark:border-white/10 rounded-2xl overflow-hidden ring-1 ring-black/5 animate-in fade-in-50 duration-300">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-4 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-lg">
                📍
              </div>
              <div>
                <h2 className="font-bold text-base leading-tight">Seviye 4: Görev Lokasyonu</h2>
                <p className="text-xs text-purple-100">İşçilerin adresi kolay bulması için konum detaylarını girin.</p>
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-6 space-y-5">
            {/* Şehir ve İlçe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-800 dark:text-slate-200">Şehir *</Label>
                <Select value={form.city} onValueChange={(v) => update('city', v)}>
                  <SelectTrigger className="h-11 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100">
                    <SelectValue placeholder="Şehir seçin" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
                    {Array.from(new Set([form.city, ...TURKEY_CITIES].filter(Boolean))).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="district" className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                    İlçe *
                  </Label>
                  <span className="text-[10px] text-gray-400 dark:text-slate-400">Konumla otomatik dolar</span>
                </div>
                <Input
                  id="district"
                  placeholder="Örn: Ortahisar, Kadıköy, Çankaya..."
                  value={form.district}
                  onChange={(e) => update('district', e.target.value)}
                  className="h-11 text-sm font-medium dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Açık Adres */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="address" className="text-sm font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Açık Adres (Opsiyonel)
                </Label>
                {form.address && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Adres Tanımlı
                  </span>
                )}
              </div>
              <Input
                id="address"
                placeholder="Mahalle, cadde, sokak, bina no..."
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                className="h-11 text-sm font-medium dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
              />
            </div>

            {/* Konum / Yol Tarifi Notu */}
            <div className="space-y-2">
              <Label htmlFor="locationNote" className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                Ulaşım & Konum Notu (Opsiyonel)
              </Label>
              <Input
                id="locationNote"
                placeholder="Örn: Metrobüs durağına 3 dk yürüme mesafesinde"
                value={form.locationNote}
                onChange={(e) => update('locationNote', e.target.value)}
                className="h-11 text-sm dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
              />
            </div>

            {/* GPS Otomatik Konum Belirleme */}
            <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50/50 dark:from-purple-950/40 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-purple-950 dark:text-purple-200">GPS ile Tam Konum</p>
                    {form.address && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-md font-semibold">
                        Adres Aktarıldı ✓
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300 font-mono">
                    Enlem: {form.latitude.toFixed(4)}, Boylam: {form.longitude.toFixed(4)}
                  </p>
                  {form.address && (
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 line-clamp-1">
                      📍 {form.address}
                    </p>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getLocation}
                disabled={gettingLocation}
                className="h-9 bg-white dark:bg-slate-800 border-purple-300 dark:border-purple-700/60 text-purple-900 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-slate-700 font-semibold"
              >
                {gettingLocation ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-purple-600 dark:text-purple-400" /> : null}
                {gettingLocation ? 'Konum Alınıyor...' : 'Konumumu Al'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ==================================================================== */}
      {/* SEVİYE 5: FİNAL ÖNİZLEME & ONAY                                       */}
      {/* ==================================================================== */}
      {level === 5 && (
        <div className="space-y-5 animate-in fade-in-50 duration-300">
          <Card className="border-0 shadow-lg bg-white dark:bg-slate-900/90 dark:ring-white/10 dark:border-white/10 rounded-2xl overflow-hidden ring-1 ring-black/5">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-xs">
                  🚀
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase bg-white/20 px-2 py-0.5 rounded-full">
                      Boss Seviyesi • 100% Hazır
                    </span>
                  </div>
                  <h2 className="font-black text-lg sm:text-xl tracking-tight mt-0.5">
                    İlan Önizlemesi & Son Onay
                  </h2>
                  <p className="text-xs text-emerald-100">
                    İşçiler ilanınızı aşağıdaki şekilde görecektir. Lütfen son kontrollerinizi yapın.
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-4 sm:p-6 space-y-5">
              {/* Önizleme Kartı (İşçi Gözünden) */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl shadow-xl space-y-4 border border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{categoryIcon(form.category)}</span>
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        {categoryLabel(form.category)}
                      </span>
                      <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                        {form.title}
                      </h3>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {form.urgency === 'URGENT' ? '🔴 Acil' : form.urgency === 'HIGH' ? '🟡 Yüksek Öncelik' : '🟢 Normal'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                  {form.description}
                </p>

                {/* Önemli Detay Rozetleri */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Tarih</span>
                    <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      {form.workDate ? new Date(form.workDate).toLocaleDateString('tr-TR') : '-'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Saat & Süre</span>
                    <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      {form.startTime} - {form.endTime} ({form.durationHours}s)
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Konum</span>
                    <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {form.district}, {form.city}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 block">Kontenjan</span>
                    <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      {openings} Kişi
                    </span>
                  </div>
                </div>

                {/* Yetenekler */}
                {form.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {form.requiredSkills.map((sk) => (
                      <span key={sk} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        #{sk}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ücret ve Toplam Emanet */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400">Kişi Başı Ücret:</span>
                    <p className="text-xl font-black text-emerald-400">
                      {wage.toLocaleString('tr-TR')} ₺ <span className="text-xs text-slate-400 font-normal">/ {form.wageType === 'DAILY' ? 'gün' : form.wageType === 'HOURLY' ? 'saat' : 'net'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Emanete Alınacak Tutar:</span>
                    <p className="text-xl font-black text-amber-400">
                      ₺{totalEscrowRequired.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hızlı Düzenle Butonları */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setLevel(1)} className="text-xs gap-1 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700">
                  <Edit3 className="w-3 h-3" /> 1. Görevi Düzenle
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setLevel(2)} className="text-xs gap-1 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700">
                  <Edit3 className="w-3 h-3" /> 2. Zamanı Düzenle
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setLevel(3)} className="text-xs gap-1 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700">
                  <Edit3 className="w-3 h-3" /> 3. Ücreti Düzenle
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setLevel(4)} className="text-xs gap-1 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700">
                  <Edit3 className="w-3 h-3" /> 4. Konumu Düzenle
                </Button>
              </div>

              {/* Bakiye Yetersizlik Uyarısı (Seviye 5'te) */}
              {!isBalanceSufficient && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      Cüzdanınızda <strong>₺{missingAmount.toLocaleString('tr-TR')}</strong> eksik bakiye bulunmaktadır.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => go('wallet')}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-8 text-xs"
                  >
                    Bakiye Yükle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ALT SEVİYE NAVİGASYON ÇUBUĞU (PREV / NEXT / SUBMIT)                  */}
      {/* ==================================================================== */}
      <div className="mt-6 flex items-center justify-between gap-3 sticky bottom-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-gray-200 dark:border-white/10">
        <div>
          {level > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevLevel}
              className="h-11 px-4 text-xs sm:text-sm font-semibold gap-1.5 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Geri</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={back}
              className="h-11 px-3 text-xs text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
            >
              Vazgeç
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {level < TOTAL_LEVELS ? (
            <Button
              type="button"
              onClick={handleNextLevel}
              className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md gap-2"
            >
              <span>Sonraki Seviye</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={loading}
              className="h-11 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg shadow-emerald-500/20 gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>İlanı Onayla ve Yayına Al 🚀</span>
            </Button>
          )}
        </div>
      </div>

      {/* Yetersiz Bakiye Modal */}
      <Dialog open={insufficientModalOpen} onOpenChange={setInsufficientModalOpen}>
        <DialogContent className="sm:max-w-md dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
          <DialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/70 flex items-center justify-center mb-2">
              <Wallet className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-gray-900 dark:text-white">
              Yetersiz Cüzdan Bakiyesi
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600 dark:text-slate-400 pt-1">
              İlanı yayınlayabilmek için toplam iş ücretinin emanet havuzuna aktarılması gerekmektedir.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 dark:bg-slate-950/70 rounded-xl p-4 my-2 space-y-2.5 text-sm border border-gray-100 dark:border-white/10">
            <div className="flex justify-between items-center text-gray-600 dark:text-slate-400">
              <span>Gerekli Emanet Tutarı ({openings} kişi):</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₺{totalEscrowRequired.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-600 dark:text-slate-400">
              <span>Mevcut Cüzdan Bakiyeniz:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₺{(walletBalance ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-slate-800 my-1" />
            <div className="flex justify-between items-center font-bold text-red-600 dark:text-rose-400">
              <span>Eksik Tutar:</span>
              <span>
                ₺{missingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-slate-400 text-center px-2">
            Cüzdanınıza para yatırdıktan sonra ilanı anında yayınlayabilirsiniz. Çalışanlar işe gelip işi tamamlayana kadar paranız güvende kalır.
          </p>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInsufficientModalOpen(false)}
              className="w-full sm:w-auto dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              onClick={() => {
                setInsufficientModalOpen(false)
                go('wallet')
              }}
              className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
            >
              Cüzdana Git & Para Yatır
              <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
