export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  date: string
  readingTime: string
  category: string
  coverImage?: string
  tags: string[]
  author: {
    name: string
    role: string
    avatar?: string
  }
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: '2026-gunluk-yevmiye-ucretleri-ve-piyasa-rehberi',
    title: '2026 Günlük Yevmiye Fiyatları: Garson, Temizlik, İnşaat ve Kurye Rehberi',
    excerpt:
      'Türkiye genelinde 2026 yılı güncel yevmiye tarifeleri ne kadar? Şehirlere ve mesleklere göre ortalama günlük ücretler, yol/yemek hakları ve piyasa analizi.',
    date: '2026-10-15',
    readingTime: '6 dk okuma',
    category: 'Yevmiye Rehberi',
    coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80',
    tags: ['yevmiye', 'günlük iş', 'garson yevmiyesi', 'inşaat yevmiyesi', 'fiyatlar'],
    author: {
      name: 'Günübirlik Piyasa Araştırma Ekibi',
      role: 'İş Gücü Piyasası Analistleri',
    },
    content: `
## 2026 Yılında Günlük Yevmiye Piyasası Nasıl Şekillendi?

Türkiye'de enflasyon dinamikleri, asgari ücret artışları ve esnek çalışma modellerine olan yoğun talep, 2026 yılında günübirlik yevmiye piyasasını doğrudan etkilemiştir. Özellikle büyükşehirlerde (İstanbul, Ankara, İzmir, Bursa, Antalya ve Trabzon) günlük iş gücü talebi hızla artmaktadır.

Günlük yevmiyeli çalışmada en kritik avantaj, çalışanların **aynı gün akşamında nakit veya banka transferiyle kazançlarını alabilmesidir**. 

### Sektörlere Göre 2026 Ortalama Günlük Yevmiyeler

Aşağıdaki veriler, Günübirlik platformunda son 6 ayda yayınlanan 10.000'den fazla aktif ilanın piyasa ortalaması alınarak derlenmiştir:

| Meslek / Pozisyon | Ortalama Yevmiye (Net) | Çalışma Süresi | Ek Haklar (Yol/Yemek) |
| :--- | :--- | :--- | :--- |
| **Garson & Servis Elemanı** | ₺1.200 – ₺1.600 | 8 – 9 Saat | Yemek Dahil, Bahşiş |
| **Komi & Bulaşıkhane** | ₺1.100 – ₺1.400 | 8 Saat | Yemek Dahil |
| **İnşaat / Ağır İşçilik** | ₺1.800 – ₺2.500 | 8 Saat | Yemek + Yol Desteği |
| **Boya & Alçı Ustası** | ₺2.200 – ₺3.200 | 8 Saat | Malzeme & Yol |
| **Ev / Ofis Temizliği** | ₺1.400 – ₺1.900 | 6 – 8 Saat | Yol Desteği |
| **Motorlu Kurye (Kendi Motoruyla)**| ₺2.000 – ₺3.000 | 8 – 10 Saat | Benzin Desteği |
| **Depo & Yükleme Personeli** | ₺1.300 – ₺1.700 | 8 Saat | Yemek + Servis |
| **Fuar & Tanıtım Hostesi** | ₺1.500 – ₺2.200 | 7 – 8 Saat | Yemek Dahil |

---

## Yevmiyeli Çalışırken Dikkat Edilmesi Gereken 4 Temel Kural

1. **Ödemenin Güvenceye Alınması:** Birçok günübirlik çalışan akşam saatlerinde parasını alamama riskiyle karşılaşmaktadır. Günübirlik platformunda uygulanan **Emanet Kasası (Escrow)** sayesinde, işveren ilan açarken ücreti sisteme yatırır ve paranız mesai bitene kadar havuzda bloke edilir.
2. **Mesai Saatlerinin Baştan Netleşmesi:** Sabah kaçta başlanacağı, mola süreleri ve akşam kaçta çıkılacağı baştan sözleşilmelidir.
3. **Yol ve Yemek Detayları:** İlanda yemek verilip verilmediği, yol parasının yevmiyeye dahil olup olmadığı mutlaka teyit edilmelidir.
4. **QR Check-in Kullanımı:** Dijital teyit sistemi sayesinde saatleriniz kayıt altına alınır ve olası anlaşmazlıkların önüne geçilir.
    `,
  },
  {
    slug: 'ogrenciler-icin-gunubirlik-is-bulma-tuyolari',
    title: 'Üniversite Öğrencileri İçin Hafta Sonu ve Boş Günlerde Ek Gelir Rehberi',
    excerpt:
      'Ders programınızı aksatmadan harçlığınızı çıkarabileceğiniz en popüler günlük işler, zaman yönetimi ve güvenli iş bulma yolları.',
    date: '2026-10-18',
    readingTime: '5 dk okuma',
    category: 'Öğrenci Rehberi',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    tags: ['öğrenci işleri', 'ek gelir', 'part-time', 'hafta sonu iş', 'üniversite'],
    author: {
      name: 'Merve Demir',
      role: 'Kariyer ve Öğrenci Danışmanı',
    },
    content: `
## Üniversite Hayatında Finansal Özgürlük Mümkün Mü?

Üniversite öğrencileri için en büyük zorluklardan biri, sabit vardiyalı part-time işlerin sınav haftaları veya değişen ders programlarıyla çakışmasıdır. Bu noktada **günübirlik yevmiyeli işler**, öğrencilere benzersiz bir esneklik sunar.

Yalnızca dersinizin olmadığı günlerde veya hafta sonları çalışarak, bursunuza veya ailenizden gelen harçlığa ihtiyaç duymadan kendi masraflarınızı karşılayabilirsiniz.

### Öğrencilere En Uygun Günübirlik İş Fırsatları

1. **Etkinlik ve Konser Görevlileri:** Hafta sonu festivallerinde, konserlerde bilet kontrolü, karşılama veya sahne arkası destek görevleri. Hem eğlenceli bir ortam hem de günlük net ₺1.500 civarı kazanç.
2. **Kafelerde Hafta Sonu Ekip Desteği:** Cuma akşamları ve cumartesi-pazar günleri yoğunlaşan kafe ve restoranlarda ek garson veya barista desteği.
3. **Stand & Tanıtım Elemanı:** AVM'lerde veya süpermarketlerde ürün tadımı ve tanıtım görevleri.
4. **Paketleme ve E-Ticaret Depo Desteği:** İndirim dönemlerinde kargo ve e-ticaret depolarında gece veya gündüz esnek vardiyalı kutulama işleri.

### Öğrenciler İçin Güvenlik Önerileri

- Tanımadığınız kişilerden sosyal medya grupları üzerinden ödemesi belirsiz iş tekliflerini kabul etmeyin.
- Her zaman **Günübirlik** gibi emanet kasası ve T.C. kimlik doğrulaması olan kurumsal platformları tercih edin.
- Mesai başlangıcınızı ve bitişinizi sistem üzerinden QR kodla teyit edin.
    `,
  },
  {
    slug: 'isverenler-icin-acil-yevmiyeli-eleman-bulma-rehberi',
    title: 'Acil Eleman Lazım Olduğunda Aynı Gün Güvenilir İşçi Bulma Yöntemleri',
    excerpt:
      'Personeliniz son dakika gelmediğinde veya ani bir iş yoğunluğu oluştuğunda 30 dakika içinde nasıl güvenilir usta ve eleman bulabilirsiniz?',
    date: '2026-10-19',
    readingTime: '4 dk okuma',
    category: 'İşveren Rehberi',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    tags: ['acil eleman', 'işveren', 'restoran personeli', 'günübirlik işçi', 'yevmiye'],
    author: {
      name: 'Kaan Tekin',
      role: 'Operasyon ve İnsan Kaynakları Direktörü',
    },
    content: `
## Restoran ve İşletmelerin En Büyük Kabusu: Son Dakika Gelmeyen Personel

Restoran, kafe, şantiye veya etkinlik işletmeciliği yapan herkes bu durumu yaşamıştır: Akşam için 200 kişilik rezervasyonunuz vardır veya teslim edilmesi gereken bir inşaat projesi bulunmaktadır, fakat sabah personellerden biri telefonunu açmaz veya mazeret bildirir.

Geleneksel ilan sitelerinde eleman ilanı vermek ve başvuru beklemek günler sürer. Oysa işletmenin ihtiyacı **hemen, 1-2 saat içinde kapıda olacak** güvenilir bir çalışandır.

### Günübirlik Sistemiyle 30 Dakikada Nasıl Eleman Bulunur?

1. **Hedef Konumu Belirleyin:** İlanınızı açarken iş yerinizin konumunu girin. Sistem otomatik olarak 5-10 km çapındaki aktif çalışanlara anlık mobil bildirim yollar.
2. **Net ve Cazip Yevmiye Belirleyin:** Acil durumlarda piyasa ortalamasının %10-15 üzerinde bir yevmiye teklif etmek, ilanınızın ilk 10 dakika içinde onlarca başvuru almasını sağlar.
3. **Adayın Profil ve Puanını İnceleyin:** Başvuran adayların daha önceki işverenlerden aldığı 5 yıldızlı puanları ve yorumları anında görüntüleyin.
4. **Emanet Havuzu Güvencesi:** Aday da parasını alacağından emin olduğu için işi yarıda bırakmaz veya gelmemezlik yapmaz.
    `,
  },
  {
    slug: 'yevmiyeli-calisanlarin-haklari-ve-emanet-odeme-sistemi',
    title: 'Günübirlik Çalışanların Hakları ve Güvenli Emanet Ödeme Sistemi Nedir?',
    excerpt:
      'Günübirlik çalışanların yasal hakları, sigorta uygulamaları ve Günübirlik Emanet Sistemi ile çalışan güvenliğinin nasıl sağlandığı hakkında detaylı kılavuz.',
    date: '2026-10-20',
    readingTime: '5 dk okuma',
    category: 'Hukuk & Güvenlik',
    coverImage: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80',
    tags: ['emanet kasa', 'yasal haklar', 'işçi hakları', 'güvenli ödeme', 'sigorta'],
    author: {
      name: 'Av. Zeynep Kaya',
      role: 'İş Hukuku Danışmanı',
    },
    content: `
## Günlük Çalışmada Güvenlik Sorunu Tarihe Karışıyor

Geleneksel yevmiye kültürünün en büyük yarası, taraflar arasındaki sözlü anlaşmaların suistimale açık olmasıydı. Akşam olduğunda "Yarın gel al", "Haftaya havale ederiz" gibi bahanelerle emekçilerin parası geciktirilebiliyor veya eksik ödenebiliyordu.

Günübirlik platformu, bu güvensizlik ortamını **Dijital Emanet Ödeme (Escrow)** altyapısıyla kökten çözmektedir.

### Emanet Sistemi Nasıl Çalışır?

- **Adım 1:** İşveren ilanı onaylarken taahhüt ettiği yevmiye tutarı banka/kart altyapısıyla Emanet Havuzuna aktarılır.
- **Adım 2:** Çalışan iş yerine vardığında yevmiyenin kasada olduğunu sistemde görür.
- **Adım 3:** İş bitiminde her iki taraf da QR doğrulaması yapar.
- **Adım 4:** Tutar tek kuruş komisyon veya gizli ücret kesilmeden çalışanın cüzdanına anında yansır.

Bu sistem hem çalışanın emeğini garanti altına alır hem de işverenin parasını taahhüt edilen hizmet teslim edilene kadar korur.
    `,
  },
  {
    slug: 'part-time-vs-gunubirlik-is-hangisi-daha-karli',
    title: 'Part-Time İş mi, Günübirlik Yevmiyeli İş mi? Kazanç ve Esneklik Karşılaştırması',
    excerpt:
      'Aylık sabit maaşlı part-time bir işte çalışmak mı, yoksa haftalık günübirlik yevmiyeli işler seçmek mi daha avantajlı? Kapsamlı analiz.',
    date: '2026-10-21',
    readingTime: '4 dk okuma',
    category: 'Kariyer & Analiz',
    coverImage: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
    tags: ['part-time', 'yevmiye', 'karşılaştırma', 'ek kazanç', 'serbest çalışma'],
    author: {
      name: 'Günübirlik Analiz Masası',
      role: 'Piyasa Araştırmaları',
    },
    content: `
## Esnek Çalışma Modellerinin Karşılaştırması

Günümüzde birçok kişi sabit bir işte tam zamanlı çalışmak yerine, kendi programını belirleyebileceği modelleri tercih ediyor. Peki part-time bir sözleşme mi daha kazançlı, yoksa günübirlik yevmiyeler mi?

### 1. Kazanç Hızı
- **Part-Time:** Ayda bir veya 15 günde bir ödeme yapılır.
- **Günübirlik:** Akşam mesai bittiğinde paranız anında elinizdedir. Acil nakit ihtiyaçları için idealdir.

### 2. Saatlik Verimlilik ve Ücret
- **Part-Time:** Genelde asgari ücretin saatlik karşılığı üzerinden hesaplanır (ortalama saatlik ₺90 - ₺120).
- **Günübirlik:** Acil işlerde ve yoğun günlerde saatlik kazanç ₺150 - ₺250 seviyesine kadar çıkabilir.

### 3. Esneklik ve Özgürlük
- **Part-Time:** Haftalık vardiya çizelgesine uymak zorundasınız. İzin almak zordur.
- **Günübirlik:** Canınız ne zaman isterse o gün çalışırsınız; istemediğiniz gün ilana başvurmazsınız.

Sonuç olarak: Düzenli ve sabit bir gelir arayanlar için part-time uygun olabilirken; maksimum esneklik, yüksek günlük getiri ve aynı gün nakit tahsilat isteyenler için günübirlik model açık ara öndedir.
    `,
  },
]
