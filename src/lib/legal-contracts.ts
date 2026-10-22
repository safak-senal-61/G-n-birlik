export type LegalContractId = 'mesafeli-satis' | 'kullanici' | 'kvkk' | 'gizlilik'

export interface LegalContractSection {
  heading: string
  body: string
  bullets?: string[]
}

export interface LegalContract {
  id: LegalContractId
  path: string
  code: string
  shortTitle: string
  title: string
  updatedAt: string
  summary: string
  sections: LegalContractSection[]
}

export const LEGAL_CONTRACTS: LegalContract[] = [
  {
    id: 'gizlilik',
    path: '/gizlilik-politikasi',
    code: 'LAW-04',
    shortTitle: 'Gizlilik Politikası',
    title: 'Gizlilik, Çerez, Saha Güvenliği ve Google OAuth Kullanıcı Verileri Politikası',
    updatedAt: '23 Ekim 2026',
    summary:
      'Günübirlik platformunun (https://gunubirlik.qrders.com.tr) kullanıcı verilerini, Google OAuth 2.0 kimlik bilgilerini, konum verilerini, çerezleri ve finansal kayıtları hangi güvenlik standartlarıyla topladığını, işlediğini, koruduğunu ve sildiğini açıklar.',
    sections: [
      {
        heading: 'MADDE 1 — GİRİŞ, KAPSAM VE VERİ SORUMLUSU',
        body: 'İşbu Gizlilik Politikası ("Politika"), Günübirlik Dijital İstihdam ve Teknoloji Platformu ("Günübirlik", "Platform" veya "Uygulama") tarafından https://gunubirlik.qrders.com.tr web sitesi ve bağlı mobil/web uygulamaları üzerinden sunulan hizmetler kapsamında toplanan kişisel verilerin, kimlik doğrulama bilgilerinin, konum verilerinin ve işlem kayıtlarının işlenme, saklanma, korunma ve silinme esaslarını düzenler. Platformu ziyaret eden veya üye olan tüm Çalışanlar ("İşçi") ve İşverenler ("İşletme") bu Politikada belirtilen veri işleme kuralları hakkında bilgilendirilmiş sayılır.',
      },
      {
        heading: 'MADDE 2 — TOPLANAN KİŞİSEL VERİLER VE VERİ KATEGORİLERİ',
        body: 'Günübirlik, platformun temel işlevi olan konum bazlı günlük iş eşleştirmesi, güvenli vardiya takibi ve emanet (escrow) ödeme işlemlerini yürütebilmek için yalnızca hizmetin gerektirdiği asgari verileri toplar:',
        bullets: [
          'Kimlik ve Profil Bilgileri: Ad, soyad, kullanıcı rolü (Çalışan/İşçi veya İşveren/İşletme), işletme/firma adı (İşverenler için), profil fotoğrafı.',
          'İletişim Bilgileri: E-posta adresi, cep telefonu numarası, bağlı bulunulan şehir ve ilçe bilgisi.',
          'Google OAuth 2.0 Kimlik Bilgileri (Google ile Giriş Yapılması Halinde): Google hesabınıza ait benzersiz kullanıcı kimliği (sub/Google ID), doğrulanmış e-posta adresiniz, ad-soyad bilginiz ve açık profil fotoğrafı bağlantınız.',
          'Konum Bilgileri: Yakındaki günlük iş ilanlarını listelemek ve harita üzerinde mesafe hesaplamak amacıyla yalnızca kullanıcının açık izniyle alınan yaklaşık veya hassas coğrafi konum (GPS/IP tabanlı şehir-ilçe koordinatı) verisi.',
          'Finansal ve Emanet (Escrow) Cüzdan Kayıtları: Yevmiye ödemelerinin aktarılacağı banka/IBAN bilgisi, cüzdan bakiye hareketleri, emanet bloke kayıtları ve ödeme dekont özetleri (Kredi kartı numarası veya CVV bilgileri Günübirlik sunucularında kesinlikle saklanmaz).',
          'Saha Güvenlik ve İşlem Kayıtları: Vardiya başlangıç/bitiş QR kod okutma zaman damgaları, uygulama içi mesajlaşma kayıtları, IP adresi, tarayıcı/cihaz bilgisi ve oturum güvenlik günlükleri.',
        ],
      },
      {
        heading: 'MADDE 3 — GOOGLE OAUTH 2.0 VE GOOGLE API HİZMETLERİ KULLANICI VERİLERİ POLİTİKASI (LIMITED USE COMPLIANCE)',
        body: 'Günübirlik, kullanıcıların hızlı ve güvenli şekilde oturum açabilmesi için "Google ile Giriş Yap" (Google Sign-In / OAuth 2.0) özelliğini sunar. Uygulamamızın Google API\'lerinden aldığı bilgileri kullanması ve başka herhangi bir uygulamaya aktarması, Sınırlı Kullanım (Limited Use) gereklilikleri de dahil olmak üzere "Google API Hizmetleri Kullanıcı Verileri Politikası"na (Google API Services User Data Policy) tam uyumludur:',
        bullets: [
          'Talep Edilen Google İzinleri (Scopes): Uygulamamız yalnızca "openid", "email" ve "profile" temel kimlik doğrulama izinlerini talep eder. Gmail mesajlarınıza, Google Drive dosyalarınıza, rehberinize veya takviminize kesinlikle erişilmez.',
          'Google Verilerinin Kullanım Amacı: Google OAuth üzerinden alınan e-posta adresi, ad-soyad ve profil fotoğrafı yalnızca Günübirlik üzerinde kullanıcı hesabınızı oluşturmak, mevcut hesabınızla güvenli oturum açmanızı sağlamak ve sahte hesapları önlemek amacıyla kullanılır.',
          'Üçüncü Taraflarla Paylaşmama ve Satmama Taahhüdü: Google OAuth aracılığıyla elde edilen kullanıcı verileri hiçbir koşulda üçüncü taraf veri simsarlarına satılmaz, reklam ağlarına aktarılmaz, hedefli reklamcılık/pazarlama amacıyla kullanılmaz ve kredi uygunluğu değerlendirmesi için paylaşılmaz.',
          'Yapay Zeka / Model Eğitimi Yasağı: Google API\'lerinden alınan kullanıcı verileri hiçbir şekilde genel amaçlı yapay zeka veya makine öğrenimi modellerinin eğitimi için kullanılmaz.',
          'Google Bağlantısını Kaldırma: Kullanıcılar diledikleri zaman Google Hesap Güvenlik Ayarları (https://myaccount.google.com/permissions) üzerinden Günübirlik uygulamasının erişim iznini tek tıkla kaldırabilirler.',
        ],
      },
      {
        heading: 'MADDE 4 — VERİLERİN KULLANIM AMAÇLARI',
        body: 'Toplanan kişisel verileriniz yalnızca aşağıdaki meşru ve belirli amaçlar doğrultusunda işlenmektedir:',
        bullets: [
          'Çalışan (İşçi) ve İşveren (İşletme) hesaplarının oluşturulması, doğrulanması ve iki aşamalı güvenlik (2FA / OTP) süreçlerinin yürütülmesi,',
          'Konumunuza en yakın günübirlik ve part-time iş ilanlarının listelenmesi ve işverenlerle çalışanların eşleştirilmesi,',
          'Emanet (Escrow) ödeme havuzunda bloke edilen günlük yevmiye tutarlarının vardiya sonunda doğru çalışanın cüzdanına ve IBAN hesabına aktarılması,',
          'Saha güvenliğinin sağlanması, QR kodlu vardiya giriş-çıkışlarının doğrulanması ve olası iş/ücret uyuşmazlıklarının çözümlenmesi,',
          '6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun, 6698 sayılı KVKK ve 5651 sayılı Kanun kapsamındaki yasal yükümlülüklerin yerine getirilmesi.',
        ],
      },
      {
        heading: 'MADDE 5 — VERİ GÜVENLİĞİ, ŞİFRELEME VE SAKLAMA STANDARTLARI',
        body: 'Günübirlik, kullanıcı verilerini yetkisiz erişime, değiştirmeye, ifşaya veya imhaya karşı korumak için endüstri standardı teknik ve idari tedbirler uygular:',
        bullets: [
          'Uçtan Uca Aktarım Güvenliği: Tarayıcınız/cihazınız ile https://gunubirlik.qrders.com.tr sunucuları arasındaki tüm veri trafiği 256-bit TLS/SSL (HTTPS) protokolü ile şifrelenir.',
          'Parola ve Kimlik Güvenliği: Kullanıcı şifreleri düz metin olarak asla saklanmaz; kriptografik özetleme (bcrypt/PBKDF2) algoritmaları ile tek yönlü olarak şifrelenir.',
          'İki Aşamalı Doğrulama (2FA): Kullanıcılar hesaplarını TOTP (Google Authenticator vb.) ve e-posta OTP doğrulama katmanlarıyla koruyabilirler.',
          'Erişim Kontrolü ve Denetim İzi (Audit Log): Veritabanı erişimleri rol tabanlı yetkilendirme ile sınırlandırılmış olup kritik tüm işlemler denetim günlüklerinde kayıt altına alınır.',
        ],
      },
      {
        heading: 'MADDE 6 — VERİLERİN ÜÇÜNCÜ TARAFLARLA PAYLAŞIMI',
        body: 'Kişisel verileriniz, açık rızanız olmaksızın üçüncü kişilere pazarlama veya reklam amacıyla kesinlikle aktarılmaz. Veriler yalnızca hizmetin ifası için zorunlu olan aşağıdaki sınırlı durumlarda paylaşılır:',
        bullets: [
          'İş Eşleşmesi Tarafları: Bir ilana başvurduğunuzda ve başvurunuz kabul edildiğinde, vardiya koordinasyonunun sağlanması amacıyla ad-soyad ve iletişim bilginiz ilgili İşveren ile paylaşılır.',
          'Ödeme ve Bankacılık Altyapısı: Cüzdandan banka hesabına (IBAN) yapılan yevmiye çekim işlemleri ve emanet tahsilatları için BDDK lisanslı ödeme kuruluşları ve bankalarla yalnızca işlem için zorunlu bilgiler paylaşılır.',
          'Yetkili Kamu Kurumları: Mahkemeler, savcılıklar veya düzenleyici kurumlar tarafından usulüne uygun olarak talep edilmesi halinde yasal zorunluluk kapsamında paylaşım yapılır.',
        ],
      },
      {
        heading: 'MADDE 7 — ÇEREZ (COOKIE) VE YEREL DEPOLAMA POLİTİKASI',
        body: 'Günübirlik, reklam veya üçüncü taraf takip çerezleri kullanmaz. Platformda yalnızca hizmetin çalışması için zorunlu olan birinci taraf (first-party) teknik çerezler ve yerel depolama anahtarları kullanılır:',
        bullets: [
          'Oturum Çerezi (auth_token): Güvenli oturumunuzun devamlılığını sağlayan HttpOnly, SameSite=Lax güvenlik bayraklı kimlik doğrulama çerezidir.',
          'Arayüz Tercihleri: Açık/Koyu tema (Dark Mode) seçimi ve bildirim ayarlarınızı hatırlayan tarayıcı yerel kayıtlarıdır.',
        ],
      },
      {
        heading: 'MADDE 8 — VERİ SAKLAMA SÜRELERİ, HESAP SİLME VE UNUTULMA HAKKI',
        body: 'Kullanıcılar, diledikleri zaman "Profil > Güvenlik > Hesabımı Sil" menüsünden veya destek@qrders.com.tr adresine e-posta göndererek hesaplarının ve tüm kişisel verilerinin (Google OAuth bağlantısı dahil) kalıcı olarak silinmesini talep edebilirler. Hesap silme talebi onaylandığında kullanıcının profil verileri, iletişim bilgileri ve Google OAuth kimlik eşleşmesi derhal silinir veya anonimleştirilir. Yalnızca finansal işlemler ve emanet cüzdan hareketlerine ilişkin yasal muhasebe kayıtları ilgili mevzuatın (VUK ve TTK) öngördüğü kanuni süre boyunca şifreli arşivde muhafaza edilir.',
      },
      {
        heading: 'MADDE 9 — İLETİŞİM VE VERİ KORUMA BAŞVURU KANALLARI',
        body: 'Gizlilik Politikamız, Google OAuth veri kullanımı veya kişisel verilerinizle ilgili her türlü soru, veri silme talebi ve başvurularınız için bizimle doğrudan iletişime geçebilirsiniz:',
        bullets: [
          'Platform Web Adresi: https://gunubirlik.qrders.com.tr',
          'Gizlilik Politikası Resmi Bağlantısı: https://gunubirlik.qrders.com.tr/gizlilik-politikasi',
          'Resmi E-posta Adresi: destek@qrders.com.tr',
          'Uygulama İçi Kanal: "Profil > Yardım & Destek" üzerinden 7/24 kayıtlı başvuru oluşturabilirsiniz.',
        ],
      },
    ],
  },
  {
    id: 'kullanici',
    path: '/kullanim-kosullari',
    code: 'LAW-02',
    shortTitle: 'Kullanım Koşulları & Üyelik',
    title: 'Kullanım Koşulları, İşçi ve İşveren Platform Üyelik Sözleşmesi',
    updatedAt: '23 Ekim 2026',
    summary:
      'Günübirlik platformuna üye olan Çalışan (İşçi) ve İşveren (İşletme) hesaplarının kayıt şartlarını, Google OAuth ile kayıt kurallarını, vardiya disiplinini, değerlendirme sistemini ve kullanım koşullarını düzenler.',
    sections: [
      {
        heading: 'MADDE 1 — TARAFLAR VE AMAÇ',
        body: 'İşbu Kullanım Koşulları ve Platform Üyelik Sözleşmesi ("Sözleşme"), https://gunubirlik.qrders.com.tr adresinde faaliyet gösteren Günübirlik Platformu ile platforma Çalışan ("İşçi") veya İşveren ("İşletme") sıfatıyla kayıt olan gerçek veya tüzel kişi ("Üye") arasında elektronik ortamda onaylanarak yürürlüğe girmiştir.',
      },
      {
        heading: 'MADDE 2 — ÜYELİK KOŞULLARI VE ZORUNLU ROL SEÇİMİ',
        body: 'Platforma üye olabilmek için 18 yaşını doldurmuş olmak, medeni hakları kullanma ehliyetine sahip bulunmak ve kayıt esnasında talep edilen bilgileri doğru, güncel ve eksiksiz beyan etmek zorunludur:',
        bullets: [
          'Zorunlu Hesap Türü Seçimi: Gerek e-posta/şifre ile yapılan kayıtlarda gerekse "Google ile Giriş Yap" (Google OAuth) kullanılarak başlatılan yeni kayıtlarda, kullanıcının "Çalışan / İşçi" veya "İşveren / İşletme" rollerinden birini seçmesi, telefon numarasını, şehir/ilçe bilgisini (ve İşveren ise işletme adını) doldurması ve işbu sözleşmeleri onaylaması zorunludur. Bu adımlar tamamlanmadan kayıt geçerli sayılmaz.',
          'Bilgi Doğruluğu: Üye, kayıt formunda beyan ettiği ad-soyad, telefon numarası, IBAN ve firma bilgilerinin kendisine ait ve doğru olduğunu kabul eder. Yanıltıcı veya sahte bilgi verilmesi halinde Günübirlik hesabı askıya alma hakkına sahiptir.',
        ],
      },
      {
        heading: 'MADDE 3 — ÇALIŞAN (İŞÇİ) HAK VE YÜKÜMLÜLÜKLERİ',
        body: 'Platform üzerinde Çalışan (İşçi) rolüyle faaliyet gösteren üyeler aşağıdaki kurallara uymayı kabul ve taahhüt eder:',
        bullets: [
          'Kabul edildiği vardiyaya ilanda belirtilen tarih, saat ve konumda zamanında katılım sağlamak,',
          'Vardiya başlangıcında ve bitişinde saha doğrulaması için QR kod okutma işlemini gerçekleştirmek,',
          'İş yerinin iş sağlığı ve güvenliği kurallarına, hijyen standartlarına ve mesleki etiğe uygun hareket etmek,',
          'Mazeretsiz olarak vardiyaya gitmeme ("No-Show") durumunda platform güven puanının düşeceğini ve tekrarında hesabının kısıtlanabileceğini kabul etmek.',
        ],
      },
      {
        heading: 'MADDE 4 — İŞVEREN (İŞLETME) HAK VE YÜKÜMLÜLÜKLERİ',
        body: 'Platform üzerinde İşveren (İşletme) rolüyle ilan yayınlayan üyeler aşağıdaki kurallara uymayı kabul ve taahhüt eder:',
        bullets: [
          'İlanlarda görev tanımını, çalışma saatlerini, açık adresi ve net günlük yevmiye tutarını gerçeğe uygun olarak belirtmek,',
          '6331 sayılı İş Sağlığı ve Güvenliği Kanunu ile ilgili mevzuat çerçevesinde çalışana güvenli, sağlıklı ve insan onuruna yakışır bir çalışma ortamı sunmak,',
          'Kararlaştırılan yevmiye tutarını emanet (escrow) ödeme sistemine yatırmak ve vardiya tamamlandığında ödemeyi zamanında onaylamak,',
          'Yasalara, genel ahlaka aykırı veya yanıltıcı iş ilanı yayınlamamak.',
        ],
      },
      {
        heading: 'MADDE 5 — PLATFORM DIŞI İŞLEM VE KOMİSYON ATLATMA YASAĞI',
        body: 'Günübirlik üzerinden tanışan Çalışan ve İşverenlerin, emanet ödeme güvencesini ve saha güvenlik kayıtlarını devre dışı bırakacak şekilde platform dışı ödeme teklif etmeleri veya komisyon atlatmaya yönelik girişimde bulunmaları yasaktır. Bu durumlarda Günübirlik, ortaya çıkabilecek ücret kaybı veya dolandırıcılık zararlarından sorumlu tutulamaz.',
      },
      {
        heading: 'MADDE 6 — FİKRİ MÜLKİYET HAKLARI',
        body: 'https://gunubirlik.qrders.com.tr alan adı, Günübirlik markası, logosu, arayüz tasarımları, yazılım kodları ve içeriklerinin tüm fikri ve sınai mülkiyet hakları Günübirlik\'e aittir. İzinsiz kopyalanamaz, çoğaltılamaz veya tersine mühendislik işlemine tabi tutulamaz.',
      },
      {
        heading: 'MADDE 7 — SÖZLEŞMENİN FESHİ VE HESAP KAPATMA',
        body: 'Üye, dilediği zaman hiçbir gerekçe göstermeksizin profil ayarlarından hesabını kapatabilir. Günübirlik, kullanım koşullarını ihlal eden, saha güvenliğini tehlikeye atan veya sahte bildirimde bulunan hesapları geçici veya kalıcı olarak askıya alma hakkını saklı tutar.',
      },
    ],
  },
  {
    id: 'mesafeli-satis',
    path: '/mesafeli-satis-sozlesmesi',
    code: 'LAW-01',
    shortTitle: 'Mesafeli Satış Sözleşmesi',
    title: 'Mesafeli Hizmet Satış ve Emanet (Escrow) Ödeme Sözleşmesi',
    updatedAt: '23 Ekim 2026',
    summary:
      '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve 6098 sayılı Türk Borçlar Kanunu kapsamında; Günübirlik platformu üzerinden sağlanan dijital eşleştirme, emanet ödeme (escrow) ve komisyon hizmetlerinin mesafeli satış şartlarını düzenler.',
    sections: [
      {
        heading: 'MADDE 1 — TARAFLAR VE TANIMLAR',
        body: 'İşbu Mesafeli Hizmet Satış ve Emanet Ödeme Sözleşmesi ("Sözleşme"); bir tarafta dijital pazar yeri, konum bazlı vardiya eşleştirme ve emanet ödeme altyapısı sağlayıcısı olarak Günübirlik Platformu ("Platform" - https://gunubirlik.qrders.com.tr), diğer tarafta Platforma elektronik ortamda kayıt olarak hizmet alan Çalışan ("İşçi") ve İşveren ("İşletme") arasında, 6502 sayılı Kanun, Mesafeli Sözleşmeler Yönetmeliği, 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve 6098 sayılı Türk Borçlar Kanunu hükümlerine uygun olarak elektronik ortamda kurulmuştur.',
      },
      {
        heading: 'MADDE 2 — SÖZLEŞMENİN KONUSU VE HİZMETİN NİTELİĞİ',
        body: 'İşbu Sözleşmenin konusu; İşverenlerin yayınladığı günübirlik, saatlik veya part-time iş ilanlarına Çalışanların başvurması, tarafların eşleşmesi, vardiya başlangıç ve bitişlerinin QR kod ve konum doğrulaması ile kayıt altına alınması ve işveren tarafından yatırılan günlük yevmiye bedelinin Emanet (Escrow) Hesapta bloke edilerek iş bitiminde çalışanın cüzdanına/banka hesabına aktarılmasına ilişkin aracılık ve teknoloji hizmetlerinin şartlarının belirlenmesidir.',
      },
      {
        heading: 'MADDE 3 — EMANET (ESCROW) ÖDEME VE YEVMİYE GÜVENCESİ İŞLEYİŞİ',
        body: 'Platform üzerinden gerçekleştirilen tüm finansal işlemler kayıt altındadır ve aşağıdaki kurallara tabidir:',
        bullets: [
          'Yevmiye Blokesi: İşveren, ilana başvuran çalışanın başvurusunu onayladığında veya vardiya başlatıldığında, ilanda belirtilen net yevmiye tutarı + platform hizmet bedeli İşverenin cüzdan bakiyesinden veya ödeme aracından tahsil edilerek Emanet (Escrow) Havuzuna alınır.',
          'QR Kodlu Vardiya Doğrulaması: Çalışan iş yerine ulaştığında vardiya başlangıç QR kodunu, mesai tamamlandığında ise bitiş QR kodunu okutarak çalışmayı doğrular.',
          'Ödemenin Serbest Bırakılması: Vardiya tamamlanıp İşveren tarafından onaylandığında (veya itiraz süresi içinde herhangi bir uyuşmazlık bildirilmediğinde), emanetteki net yevmiye tutarı kesintisiz olarak Çalışanın Günübirlik Cüzdanına aktarılır.',
          'Banka / IBAN Çekim İşlemleri: Çalışan, cüzdanındaki kullanılabilir bakiyeyi kendi adına kayıtlı TR IBAN hesabına çekme talebi oluşturabilir.',
        ],
      },
      {
        heading: 'MADDE 4 — İPTAL, CAYMA HAKKI VE İADE KOŞULLARI',
        body: 'Mesafeli hizmet satışlarında iptal, cayma ve iade süreçleri aşağıdaki şekilde yürütülür:',
        bullets: [
          'Vardiya Başlamadan Önce İptal: İşveren, vardiya başlangıç saatinden en az 4 saat öncesine kadar ilanı veya eşleşmeyi iptal ederse, emanet havuzunda bloke edilen tutar kesintisiz olarak İşveren cüzdanına iade edilir.',
          'Çalışanın Mazeretsiz Gelmemesi (No-Show): Çalışanın vardiyaya katılmadığı QR kayıtları ve saha denetimi ile tespit edildiğinde, bloke edilen yevmiye tutarı İşverene tam olarak iade edilir.',
          'İfa Edilmiş Hizmet İstisnası: Mesafeli Sözleşmeler Yönetmeliği Madde 15/1-(ğ) uyarınca, elektronik ortamda anında ifa edilen aracılık hizmetleri ile fiilen tamamlanmış vardiyalarda hizmet ifa edilmiş sayıldığından geriye dönük cayma hakkı kullanılamaz.',
        ],
      },
      {
        heading: 'MADDE 5 — UYUŞMAZLIK ÇÖZÜMÜ VE YETKİLİ MERCİLER',
        body: 'Vardiya sırasında veya ödeme aşamasında taraflar arasında doğabilecek uyuşmazlıklarda, Platformun "Uyuşmazlık / Destek Merkezi" kayıtları, QR okutma logları, konum zaman damgaları ve uygulama içi mesajlaşma kayıtları 6100 sayılı HMK Madde 193 uyarınca kesin delil niteliğindedir. Tüketici sıfatını haiz kullanıcılar uyuşmazlıklarda Tüketici Hakem Heyetlerine ve Tüketici Mahkemelerine, tacir/işletme sıfatını haiz kullanıcılar ise İstanbul (Çağlayan) Mahkemeleri ve İcra Dairelerine başvurabilir.',
      },
    ],
  },
  {
    id: 'kvkk',
    path: '/kvkk-aydinlatma-metni',
    code: 'LAW-03',
    shortTitle: 'KVKK Aydınlatma Metni',
    title: '6698 Sayılı Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni ve Açık Rıza Beyanı',
    updatedAt: '23 Ekim 2026',
    summary:
      '6698 sayılı KVKK uyarınca kişisel verilerinizin hangi hukuki sebeplerle işlendiğini, kimlere aktarıldığını ve Kanun’un 11. maddesi kapsamındaki yasal haklarınızı detaylandırır.',
    sections: [
      {
        heading: 'MADDE 1 — VERİ SORUMLUSUNUN KİMLİĞİ',
        body: '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla Günübirlik Platformu (https://gunubirlik.qrders.com.tr) tarafından aşağıda açıklanan kapsamda, hukuka ve dürüstlük kurallarına uygun, doğru ve güncel, belirli, açık ve meşru amaçlar için işlenmektedir.',
      },
      {
        heading: 'MADDE 2 — İŞLENEN KİŞİSEL VERİ KATEGORİLERİ VE HUKUKİ SEBEPLER',
        body: 'Kişisel verileriniz KVKK Madde 5/2-(c) "Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması", Madde 5/2-(ç) "Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi" ve Madde 5/2-(f) "İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla meşru menfaat" hukuki sebeplerine dayanarak işlenmektedir:',
        bullets: [
          'Kimlik Verisi: Ad, soyad, Google OAuth benzersiz kullanıcı kimliği (Google ile girişte), TC kimlik doğrulama durumu.',
          'İletişim Verisi: E-posta adresi, cep telefonu numarası, şehir ve ilçe bilgisi.',
          'Finansal Veri: Cüzdan bakiye kayıtları, emanet ödeme hareketleri, para çekme işlemleri için beyan edilen IBAN ve hesap sahibi adı.',
          'Konum ve İşlem Güvenliği Verisi: Yakındaki iş ilanlarını listelemek için kullanılan konum bilgisi, QR vardiya giriş/çıkış kayıtları, IP adresi ve oturum logları.',
        ],
      },
      {
        heading: 'MADDE 3 — KİŞİSEL VERİLERİN AKTARILMASI',
        body: 'Kişisel verileriniz; yalnızca başvurulan iş ilanının ilgili İşvereni veya Çalışanı ile eşleşmenin yürütülmesi, ödeme kuruluşları/bankalar aracılığıyla yevmiye ödemelerinin gerçekleştirilmesi ve kanunen yetkili kamu kurum ve kuruluşlarının taleplerinin karşılanması amaçlarıyla KVKK Madde 8 ve 9\'a uygun olarak aktarılabilir.',
      },
      {
        heading: 'MADDE 4 — İLGİLİ KİŞİNİN KVKK MADDE 11 KAPSAMINDAKİ HAKLARI',
        body: 'KVKK’nın 11. maddesi uyarınca her kullanıcı Günübirlik’e başvurarak;',
        bullets: [
          'Kişisel verisinin işlenip işlenmediğini öğrenme ve işlenmişse buna ilişkin bilgi talep etme,',
          'Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,',
          'Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme,',
          'Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,',
          'KVKK’nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme,',
          'İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme haklarına sahiptir.',
        ],
      },
    ],
  },
]

export function getLegalContractById(id: string): LegalContract {
  return LEGAL_CONTRACTS.find((c) => c.id === id) || LEGAL_CONTRACTS[0]
}
