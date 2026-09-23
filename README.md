# 💼 Günübirlik İş Bul — Konum Bazlı İş Platformu

<p align="center">
  <strong>Türkiye'nin günübirlik iş bulma platformu</strong><br>
  Konumunu seç, hemen iş bul. İnşaat, restoran, temizlik, nakliyat ve daha fazlası.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React_Native-0.76-blue?logo=react" alt="React Native">
  <img src="https://img.shields.io/badge/Expo-52-purple?logo=expo" alt="Expo">
  <img src="https://img.shields.io/badge/Prisma-6-green?logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/PostgreSQL-ready-blue?logo=postgresql" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/WebSocket-Socket.io-black?logo=socket.io" alt="Socket.io">
</p>

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Proje Yapısı](#-proje-yapısı)
- [Kurulum](#-kurulum)
- [Mobil Uygulama](#-mobil-uygulama)
- [Backend API](#-backend-api)
- [Güvenlik](#-güvenlik)
- [Test Hesapları](#-test-hesapları)
- [Production Dağıtım](#-production-dağıtım)
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Lisans](#-lisans)

---

## ✨ Özellikler

### 👤 Kullanıcı Sistemi
- ✅ **İki rol:** İş Arayan (Worker) ve İşveren (Employer)
- ✅ **Kayıt & Giriş:** E-posta + şifre ile
- ✅ **Google ile Giriş:** OAuth 2.0 entegrasyonu
- ✅ **2FA:** Google Authenticator / Authy / Microsoft Authenticator desteği
- ✅ **Şifre Sıfırlama:** E-posta doğrulama kodu ile
- ✅ **E-posta Değiştirme:** 2 adımlı doğrulama ile
- ✅ **Profil Fotoğrafı:** Cloudinary CDN'ine yükleme

### 🗺️ Konum Bazlı İş Arama
- ✅ **GPS ile yakındaki işler:** Cihaz konumunu kullan
- ✅ **Mesafe hesabı:** Haversine formülü ile km cinsinden
- ✅ **Radius filtresi:** 5/10/25/50/100/250 km seçenekleri
- ✅ **Reverse geocoding:** Şehir/mahalle/sokak otomatik gösterimi
- ✅ **Harita görünümü:** İnteraktif Leaflet/OpenStreetMap
- ✅ **Kategori filtreleri:** 8 kategori (İnşaat, Restoran, Temizlik, Nakliyat, Tarım, Teknik, Sağlık, Diğer)

### 💼 İş İlanları
- ✅ **İlan verme:** İşverenler detaylı ilan oluşturur
- ✅ **Ücret türleri:** Saatlik, günlük, sabit
- ✅ **Pazarlık:** Açık/kapalı ücret pazarlığı
- ✅ **Aciliyet seviyeleri:** Düşük, Normal, Yüksek, Acil
- ✅ **Kontenjan:** Birden fazla kişi arama
- ✅ **Kaydet:** Favori ilanları kaydetme

### 📝 Başvuru Yönetimi
- ✅ **Tek tıkla başvuru:** Mesaj ile birlikte
- ✅ **Ücret teklifi:** Pazarlık açıkken kendi teklifini sun
- ✅ **Durum takibi:** Beklemede → Onaylandı / Reddedildi → Tamamlandı
- ✅ **Değerlendirme:** 1-5 yıldız + yorum
- ✅ **Geri çekme:** Beklemedeki başvuruyu iptal et

### 💬 Gerçek Zamanlı Mesajlaşma
- ✅ **WebSocket (Socket.io):** Anlık mesajlaşma
- ✅ **Konuşma odaları:** İş ilanı bazlı sohbet
- ✅ **Yazıyor göstergesi:** Karşı taraf yazıyor...
- ✅ **Okundu işareti:** Mesajların okunduğunu gör
- ✅ **Online durum:** Kullanıcı çevrimiçi mi?
- ✅ **Mesaj tipleri:** Metin, görsel, konum

### 🔔 Bildirimler
- ✅ **Anlık bildirim:** WebSocket ile gerçek zamanlı
- ✅ **Push notification:** Mobil cihazlara (FCM)
- ✅ **Bildirim tipleri:** Yeni başvuru, kabul, reddetme, yeni mesaj, yakında iş
- ✅ **Okundu/okunmadı:** Durum takibi
- ✅ **Toplu okundu:** Tek tıkla tümünü okundu işaretle

### 🛡️ Güvenlik
- ✅ **bcrypt:** Şifre hashleme (12 rounds)
- ✅ **JWT:** Gerçek jsonwebtoken (HS256 imza)
- ✅ **Rate Limiting:** Brute-force koruması (5 giriş/dk)
- ✅ **2FA (TOTP):** RFC 6238 uyumlu
- ✅ **Audit Log:** Tüm kullanıcı işlemleri kaydı
- ✅ **CORS:** Cross-origin koruması
- ✅ **SecureStore:** Mobil'de token güvenli saklama

### 📱 Mobil Uygulama (React Native + Expo)
- ✅ **iOS + Android:** Tek kod tabanı
- ✅ **Offline desteği:** Cache mekanizması
- ✅ **Push notification:** expo-notifications
- ✅ **Konum servisi:** expo-location
- ✅ **Galeri/Kamera:** expo-image-picker
- ✅ **Gerçek zamanlı:** Socket.io-client

---

## 🛠️ Teknoloji Yığını

### Frontend (Web)
| Teknoloji | Sürüm | Kullanım |
|-----------|-------|----------|
| Next.js | 16 | React framework (App Router) |
| React | 18 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Stil |
| shadcn/ui | - | UI component library |
| Zustand | 4 | State yönetimi |
| Leaflet | 1.9 | İnteraktif harita |
| Socket.io-client | 4 | WebSocket |

### Mobile (React Native)
| Teknoloji | Sürüm | Kullanım |
|-----------|-------|----------|
| Expo | 52 | Mobile framework |
| React Native | 0.76 | Mobile UI |
| React Navigation | 6 | Navigation |
| Axios | 1.7 | HTTP client |
| Zustand | 4 | State yönetimi |
| Socket.io-client | 4 | WebSocket |
| expo-location | 16 | GPS |
| expo-image-picker | 15 | Galeri/kamera |
| expo-secure-store | 13 | Güvenli token saklama |
| react-native-maps | 1.18 | Harita |

### Backend
| Teknoloji | Sürüm | Kullanım |
|-----------|-------|----------|
| Node.js | 20+ | Runtime |
| Next.js API Routes | 16 | API server |
| Prisma ORM | 6 | Database ORM |
| SQLite | - | Development DB |
| PostgreSQL | - | Production DB |
| Socket.io | 4 | WebSocket server |
| bcryptjs | 3 | Şifre hashleme |
| jsonwebtoken | 9 | JWT |
| google-auth-library | 11 | Google OAuth |
| otplib | 12 | TOTP (2FA) |
| Resend | 6 | E-posta servisi |
| Cloudinary | 2 | Dosya yükleme |

### DevOps & Araçlar
| Araç | Kullanım |
|------|----------|
| Caddy | Reverse proxy / Gateway |
| Turbopack | Bundler |
| ESLint | Code linting |
| Prisma Studio | DB yönetimi |
| Nominatim | Reverse geocoding |
| OpenStreetMap | Harita tile'ları |

---

## 📁 Proje Yapısı

```
gunubirlik-is-bul/
├── 📱 mobile-app/                 # React Native (Expo) mobil uygulama
│   ├── App.tsx                    # Ana giriş
│   ├── app.json                   # Expo config
│   ├── package.json
│   ├── src/
│   │   ├── config/                # API URL, renkler, kategoriler
│   │   ├── api/                   # Axios client + Socket.io
│   │   ├── store/                 # Zustand auth store
│   │   ├── navigation/            # React Navigation
│   │   ├── screens/               # 12 ekran
│   │   ├── components/            # Yeniden kullanılabilir bileşenler
│   │   └── utils/                 # Format yardımcıları
│   └── README.md
│
├── 🖥️ backend/                    # Next.js API + Prisma
│   ├── prisma/                    # Database schema
│   ├── services/                  # Business logic (Nest.js pattern)
│   ├── api/                       # REST API routes
│   ├── lib/                       # Auth, rate limiting
│   ├── mini-services/             # WebSocket servisi (port 3004)
│   ├── seed.ts                    # Test verisi
│   ├── package.json
│   └── .env.example
│
└── 📖 README.md                   # Bu dosya
```

---

## 🚀 Kurulum

### Ön Gereksinimler
- Node.js 20+ ve npm/bun
- Expo CLI (`npm install -g expo-cli`)
- Expo Go (telefonda, test için)
- Git

### 1. Repoyu Klonla

```bash
git clone https://github.com/safak-senal-61/G-n-birlik.git
cd G-n-birlik
```

### 2. Backend Kurulumu

```bash
cd backend

# Bağımlılıkları yükle
npm install

# .env dosyasını oluştur
cp .env.example .env
# .env'i düzenle: JWT_SECRET, RESEND_API_KEY, GOOGLE_CLIENT_ID vb.

# Veritabanını oluştur
npx prisma db push

# Test verisini yükle
npx prisma db seed
# veya
npm run seed

# Backend'i başlat
npm run dev
# → http://localhost:3000
```

### 3. Mobil Uygulama Kurulumu

```bash
cd mobile-app

# Bağımlılıkları yükle
npm install

# API URL'ini ayarla
# src/config/index.ts dosyasını düzenle:
# API_BASE_URL: 'http://SENIN_IP:3000/api/v1'

# Expo'yu başlat
npx expo start
```

---

## 📱 Mobil Uygulama

### Expo Go ile Test (QR Kod)

1. **Expo Go** uygulamasını telefona yükle:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Bilgisayar ve telefon **aynı WiFi ağında** olmalı

3. `npx expo start` çalıştır → terminalde QR kod görünür

4. Expo Go ile QR kodu tara → uygulama açılır!

### Development Build

```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Tunnel (uzaktan erişim)
npx expo start --tunnel
```

### Production Build

```bash
# EAS CLI yükle
npm install -g eas-cli

# iOS Build
eas build --platform ios

# Android Build
eas build --platform android

# Mağazaya yükle
eas submit --platform ios
eas submit --platform android
```

---

## 🔌 Backend API

### REST API Endpoint'leri

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/v1/auth/register` | Kayıt ol |
| POST | `/api/v1/auth/login` | Giriş yap (2FA destekli) |
| POST | `/api/v1/auth/logout` | Çıkış yap |
| GET | `/api/v1/auth/me` | Profil bilgileri |
| POST | `/api/v1/auth/forgot-password` | Şifre sıfırlama kodu gönder |
| POST | `/api/v1/auth/reset-password` | Şifreyi sıfırla |
| POST | `/api/v1/auth/change-password` | Şifre değiştir |
| POST | `/api/v1/auth/email-change/request` | E-posta değişiklik kodu |
| POST | `/api/v1/auth/email-change/confirm` | E-postayı güncelle |
| POST | `/api/v1/auth/2fa/setup` | 2FA QR kod üret |
| POST | `/api/v1/auth/2fa/verify` | 2FA etkinleştir |
| POST | `/api/v1/auth/2fa/disable` | 2FA devre dışı bırak |
| POST | `/api/v1/auth/google` | Google ile giriş |
| POST | `/api/v1/auth/avatar` | Avatar yükle |
| GET | `/api/v1/auth/security-info` | Güvenlik durumu |
| GET | `/api/v1/jobs` | İş ilanlarını listele |
| GET | `/api/v1/jobs/:id` | İş detayı |
| POST | `/api/v1/jobs` | Yeni ilan oluştur |
| PUT | `/api/v1/jobs/:id` | İlan güncelle |
| DELETE | `/api/v1/jobs/:id` | İlan sil |
| POST | `/api/v1/jobs/:id/save` | İlan kaydet/kaldır |
| GET | `/api/v1/jobs/saved` | Kaydedilen ilanlar |
| POST | `/api/v1/applications` | Başvuru yap |
| GET | `/api/v1/applications` | Başvuruları listele |
| PUT | `/api/v1/applications/:id` | Başvuru durumu güncelle |
| POST | `/api/v1/applications/:id/rate` | Değerlendirme yap |
| GET | `/api/v1/conversations` | Konuşmaları listele |
| POST | `/api/v1/conversations` | Mesaj gönder |
| GET | `/api/v1/conversations/:id/messages` | Mesajları listele |
| GET | `/api/v1/notifications` | Bildirimleri listele |
| POST | `/api/v1/notifications/read-all` | Tümünü okundu işaretle |

### WebSocket Events

| Yön | Event | Açıklama |
|-----|-------|----------|
| Client → Server | `conversation:join` | Konuşmaya katıl |
| Client → Server | `message:send` | Mesaj gönder |
| Client → Server | `typing:start` | Yazıyor başlat |
| Client → Server | `message:read` | Okundu işaretle |
| Server → Client | `message:new` | Yeni mesaj |
| Server → Client | `typing:start` | Karşı taraf yazıyor |
| Server → Client | `notification:new` | Yeni bildirim |
| Server → Client | `job:new_nearby` | Yakında yeni iş |
| Server → Client | `user:status` | Online durum |

---

## 🛡️ Güvenlik

### Şifre Güvenliği
- **bcrypt** ile 12 rounds hashleme
- Eski SHA-256 şifreler otomatik migrate
- Minimum 6 karakter şifre zorunluluğu

### JWT Token
- **HS256** imza algoritması
- 7 gün geçerlilik
- Issuer + audience kontrolü
- HttpOnly cookie (web) + SecureStore (mobil)

### Rate Limiting
| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 istek/dakika |
| `/auth/register` | 5 istek/dakika |
| `/auth/forgot-password` | 3 istek/saat |
| Genel API | 100 istek/dakika |
| 2FA deneme | 5 deneme/dakika |

### 2FA (İki Faktörlü Doğrulama)
- **TOTP** (RFC 6238) standardı
- Google Authenticator, Authy, Microsoft Authenticator uyumlu
- 10 backup kod (telefon kaybı için)
- Login sırasında zorunlu

### Audit Log
Tüm kullanıcı işlemleri kaydedilir:
- LOGIN, LOGIN_FAILED, LOGOUT
- REGISTER, PASSWORD_CHANGE
- 2FA_ENABLE, 2FA_DISABLE
- GOOGLE_LOGIN, AVATAR_UPLOAD
- JOB_CREATE, APPLICATION_CREATE

---

## 🔑 Test Hesapları

Backend seed verisi ile gelir:

| Rol | E-posta | Şifre |
|-----|---------|--------|
| 👷 İş Arayan | `worker1@example.com` | `123456` |
| 👷 İş Arayan | `worker2@example.com` | `123456` |
| 🏢 İşveren | `ahmet@insaat.com` | `123456` |
| 🏢 İşveren | `mehmet@restaurant.com` | `123456` |
| 🔐 Admin | `admin@gunubirlik.com` | `admin123` |

---

## 🚀 Production Dağıtım

### 1. Environment Variables

`.env` dosyasını doldur:

```env
# Database (PostgreSQL önerilir)
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public

# JWT (zorunlu)
JWT_SECRET=your-96-char-secret

# E-posta (Resend)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@yourdomain.com
EMAIL_DEV_MODE=false

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
FILE_UPLOAD_MODE=cloudinary
```

### 2. PostgreSQL'e Geçiş

`prisma/schema.prisma` dosyasında:
```prisma
datasource db {
  provider = "postgresql"  // sqlite → postgresql
  url      = env("DATABASE_URL")
}
```

Sonra:
```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Domain Doğrulama

**Resend (e-posta):**
- https://resend.com/domains → domain ekle
- DNS kayıtlarını ekle (MX, SPF, DKIM)
- `EMAIL_FROM` değerini güncelle

**Google OAuth:**
- Google Cloud Console → Authorized JavaScript origins
- Production domain'ini ekle

### 4. Mobil App Store Dağıtım

```bash
# EAS yapılandırması
eas build:configure

# iOS App Store
eas build --platform ios --profile production
eas submit --platform ios

# Google Play Store
eas build --platform android --profile production
eas submit --platform android
```

---

## 📸 Ekran Görüntüleri

### Web Sürümü
- 🔐 Auth ekranı (login/register/2FA)
- 🏠 İş listesi (liste + harita görünümü)
- 📍 Konum bazlı arama
- 💼 İş detayı (Leaflet harita)
- ➕ İlan verme
- 📝 Başvuru takibi
- 💬 Gerçek zamanlı mesajlaşma
- 👤 Profil + güvenlik ayarları

### Mobil Sürümü (React Native)
- 📱 Tüm web özellikleri mobilde
- 🗺️ GPS ile konum bazlı arama
- 🔔 Push notification
- 📸 Galeri'den avatar yükleme
- 🔐 SecureStore ile token saklama
- 💬 Gerçek zamanlı chat

---

## 🤝 Katkıda Bulunma

1. Fork'la
2. Feature branch oluştur (`git checkout -b feature/yeni-ozellik`)
3. Commit'le (`git commit -m 'Yeni özellik eklendi'`)
4. Push'la (`git push origin feature/yeni-ozellik`)
5. Pull Request aç

---

## 📄 Lisans

MIT License — ticari kullanım dahil serbest.

---

## 📞 İletişim

- **Repo:** https://github.com/safak-senal-61/G-n-birlik
- **Teknoloji:** Next.js + React Native + Prisma + Socket.io

---

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/)
- [Expo](https://expo.dev/)
- [Prisma](https://www.prisma.io/)
- [Socket.io](https://socket.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Leaflet](https://leafletjs.com/)
- [Resend](https://resend.com/)
- [Cloudinary](https://cloudinary.com/)

---

<p align="center">
  <strong>Made with ❤️ in Turkey 🇹🇷</strong><br>
  <sub>Günübirlik İş Bul — Konum Bazlı Günlük İş Platformu</sub>
</p>
