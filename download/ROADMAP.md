# 🗺️ Günübirlik İş Bul — Product Roadmap

> **Son Güncelleme:** 23 Eylül 2026  
> **Mevcut Sürüm:** v1.0.0 (MVP)  
> **Hedef Sürüm:** v2.0.0 (Production)

---

## 📌 Mevcut Durum (v1.0.0 - Tamamlandı)

### ✅ Tamamlanan Özellikler

| Kategori | Özellik | Durum |
|----------|---------|-------|
| 🔐 Auth | Email/şifre kayıt & giriş | ✅ |
| 🔐 Auth | Google OAuth ile giriş | ✅ |
| 🔐 Auth | 2FA (Google Authenticator) | ✅ |
| 🔐 Auth | Şifre sıfırlama (e-posta kodu) | ✅ |
| 🔐 Auth | E-posta değiştirme (2 adımlı) | ✅ |
| 🔐 Auth | Profil fotoğrafı (Cloudinary) | ✅ |
| 🔐 Güvenlik | bcrypt (12 rounds) şifre hashleme | ✅ |
| 🔐 Güvenlik | JWT (HS256) token | ✅ |
| 🔐 Güvenlik | Rate limiting (5/dk auth, 100/dk API) | ✅ |
| 🔐 Güvenlik | Audit log (20 action tipi) | ✅ |
| 🗺️ Konum | GPS ile yakındaki işler | ✅ |
| 🗺️ Konum | Haversine mesafe hesabı | ✅ |
| 🗺️ Konum | Radius filtresi (5-250 km) | ✅ |
| 🗺️ Konum | Reverse geocoding (Nominatim) | ✅ |
| 🗺️ Konum | Leaflet interaktif harita | ✅ |
| 🗺️ Konum | 8 kategori filtresi | ✅ |
| 💼 İş İlanları | İlan verme, düzenleme, silme | ✅ |
| 💼 İş İlanları | Ücret türleri (saatlik/günlük/sabit) | ✅ |
| 💼 İş İlanları | Pazarlık açık/kapalı | ✅ |
| 💼 İş İlanları | Aciliyet seviyeleri | ✅ |
| 💼 İş İlanları | Kaydet/favori | ✅ |
| 📝 Başvuru | Tek tıkla başvuru + mesaj | ✅ |
| 📝 Başvuru | Ücret teklifi (pazarlık) | ✅ |
| 📝 Başvuru | Durum takibi (6 durum) | ✅ |
| 📝 Başvuru | Değerlendirme (1-5 yıldız) | ✅ |
| 📝 Başvuru | Geri çekme | ✅ |
| 💬 Mesajlaşma | Gerçek zamanlı chat (WebSocket) | ✅ |
| 💬 Mesajlaşma | Yazıyor göstergesi | ✅ |
| 💬 Mesajlaşma | Okundu işareti | ✅ |
| 💬 Mesajlaşma | Online durum | ✅ |
| 🔔 Bildirimler | Anlık bildirim (WebSocket) | ✅ |
| 🔔 Bildirimler | Okundu/okunmadı | ✅ |
| 🔔 Bildirimler | Toplu okundu | ✅ |
| 💳 Ödeme | Escrow (emanet) sistemi | ✅ |
| 💳 Ödeme | QR kod doğrulama (3 adım) | ✅ |
| 💳 Ödeme | %5 platform komisyonu | ✅ |
| 💳 Ödeme | Anlaşmazlık (dispute) sistemi | ✅ |
| 💳 Ödeme | Admin dispute çözüm | ✅ |
| 💳 Ödeme | Cüzdan bakiyesi | ✅ |
| 💳 Ödeme | Ödeme geçmişi | ✅ |
| 📱 Mobil | React Native (Expo) app | ✅ |
| 📱 Mobil | 12 ekran (Login, Jobs, Chat, Profile vb.) | ✅ |
| 📱 Mobil | API entegrasyonu | ✅ |
| 📱 Mobil | WebSocket entegrasyonu | ✅ |
| 🖥️ Web | Responsive (mobil + desktop) | ✅ |
| 🖥️ Web | API dokümantasyonu (/dokuman) | ✅ |
| 📧 E-posta | Resend entegrasyonu | ✅ |
| 📧 E-posta | 4 şablon (şifre sıfırlama, hoş geldin vb.) | ✅ |

---

## 🚀 v1.1.0 — Ödeme & Finans (Q4 2026)

### 🔴 Yüksek Öncelik

| # | Özellik | Açıklama | Zorluk |
|---|---------|----------|--------|
| 1 | **Gerçek ödeme (Iyzico)** | Kredi kartı ile gerçek ödeme. Iyzico/PayTR entegrasyonu. İşveren cüzdanına para yükler, escrow gerçek para ile çalışır. | 🔴 Yüksek |
| 2 | **Para çekme (Withdrawal)** | İşçi cüzdanındaki parayı IBAN'a çekme talebi. Admin onayı sonrası transfer. | 🟡 Orta |
| 3 | **Para yükleme (Top-up)** | İşveren cüzdanına kredi kartıyla anında para yükleme. | 🟡 Orta |
| 4 | **Otomatik ödeme release** | İş bittikten 48 saat sonra otomatik ödeme (işveren onaylamasa bile). Cron job. | 🟡 Orta |
| 5 | **Para çekme limitleri** | Günlük/aylık çekme limitleri, minimum çekme tutarı. | 🟢 Düşük |
| 6 | **İşlem makbuzu** | Ödeme alındı makbuzu (PDF), e-posta gönderimi. | 🟢 Düşük |

### 📋 Teknik Detaylar
- **Ödeme Gateway:** Iyzico (Türkiye) veya PayTR
- **IBAN doğrulama:** TC kimlik no + IBAN eşleştirme
- **Cron job:** Otomatik release için (node-cron veya Vercel Cron)
- **Veritabanı:** `Withdrawal` modeli eklenecek

---

## 🚀 v1.2.0 — Admin Panel & Yönetim (Q4 2026)

| # | Özellik | Açıklama | Zorluk |
|---|---------|----------|--------|
| 7 | **Admin paneli** | Kullanıcı yönetimi, ilan onayı, dispute çözüm, istatistikler. `/admin` route. | 🔴 Yüksek |
| 8 | **İçerik moderasyonu** | Yasaklı kelime filtresi, otomatik spam tespiti, ilan onay süreci. | 🟡 Orta |
| 9 | **Ban/suspend sistemi** | Kural ihlali yapan kullanıcıları geçici/kalıcı askıya alma. Sebep + süre. | 🟡 Orta |
| 10 | **Analytics dashboard** | Aktif kullanıcı, ilan sayısı, ödeme hacmi, kategori dağılımı grafikleri. | 🟡 Orta |
| 11 | **Log viewer** | Audit log görüntüleme arayüzü, filtreleme, arama. | 🟢 Düşük |
| 12 | **Manuel ödeme işlemi** | Admin manuel para ekleme/çıkarma (para çekme onayı vb.) | 🟢 Düşük |

---

## 🚀 v1.3.0 — Sosyal & Değerlendirme (Q1 2027)

| # | Özellik | Açıklama | Zorluk |
|---|---------|----------|--------|
| 13 | **Çift yönlü değerlendirme** | İşçi de işvereni puanlar + yorum. İşveren puanı ilanlarda gösterilir. | 🟡 Orta |
| 14 | **Yorum sistemi** | Puanla birlikte yazılı yorum, yanıt hakkı, şikayet. | 🟡 Orta |
| 15 | **Doğrulama rozetleri** | TC kimlik doğrulama, telefon doğrulama, şirket vergi no doğrulama. Rozet profilde. | 🔴 Yüksek |
| 16 | **İşçi portföyü** | Daha önce yaptığı işler, fotoğraflar, referanslar. Profil sekmesi. | 🟡 Orta |
| 17 | **Favori işçi listesi** | İşveren beğendiği işçileri kaydeder, yeni ilan verince öncelikli bildirim. | 🟢 Düşük |
| 18 | **İşçi seviye sistemi** | Tamamlanan iş sayısına göre seviye (Bronz, Gümüş, Altın, Platin). | 🟢 Düşük |

---

## 🚀 v1.4.0 — Bildirim & İletişim (Q1 2027)

| # | Özellik | Açıklama | Zorluk |
|---|---------|----------|--------|
| 19 | **SMS bildirimleri** | NetGSM/Twilio ile SMS. Kritik işlemler (iş başladı, ödeme alındı). | 🟡 Orta |
| 20 | **Push notification (mobil)** | expo-notifications tam entegrasyon. FCM token kayıt + bildirim gönderimi. | 🟡 Orta |
| 21 | **Bildirim tercihleri** | Kullanıcı hangi bildirimleri alacağını seçer (SMS, e-posta, push). Ayarlar sayfası. | 🟢 Düşük |
| 22 | **E-posta şablonları** | Daha fazla şablon: iş hatırlatma, ödeme alındı, yeni mesaj özeti. | 🟢 Düşük |
| 23 | **İn-app bildirim merkezi** | Web'de gerçek zamanlı bildirim paneli (WebSocket), okundu/okunmadı. | 🟡 Orta |
| 24 | **Bildirim zamanlaması** | İş başlama saati 1 saat önce hatırlatma, 1 gün önce hatırlatma. | 🟢 Düşük |

---

## 🚀 v1.5.0 — Arama & Keşif (Q2 2027)

| # | Özellik | Açıklama | Zorluk |
|---|---------|----------|--------|
| 25 | **Akıllı eşleştirme** | İşçi becerileri + iş gereksinimleri eşleştirme algoritması. Uygunluk skoru. | 🔴 Yüksek |
| 26 | **Akıllı öneriler** | "Sana uygun işler" tavsiye motoru. Geçmiş başvurular + konum + beceri. | 🔴 Yüksek |
| 27 | **Gelişmiş arama** | PostgreSQL full-text search. Kelime bazlı arama, typo toleransı. | 🟡 Orta |
| 28 | **Kayıtlı aramalar** | Kullanıcı arama filtresi kaydeder, yeni ilan gelince anlık bildirim. | 🟡 Orta |
| 29 | **Trend kategoriler** | En çok aranan kategoriler, popüler ilanlar, trend işler. | 🟢 Düşük |
| 30 | **Benzer ilanlar** | Bir ilanın detayında "benzer işler" önerisi. | 🟢 Düşük |

---

## 🚀 v1.6.0 — Konum & Harita (Q2 2027)

| # | Özellik | Açıklama | Zorluk |
|---|---------|----------|--------|
| 31 | **Rota tarifi** | İş yerine Google Maps/Yandex Maps navigation. "Yol tarifi al" butonu. | 🟢 Düşük |
| 32 | **İşçi canlı konum** | İş başlama saatinde işçinin canlı konumu (WebSocket). "İşçi yolda" durumu. | 🟡 Orta |
| 33 | **Geofence** | İş yeri 500m yarıçapında otomatik check-in. GPS ile geldiğini doğrula. | 🔴 Yüksek |
| 34 | **Harita kümeleme** | Yakın ilanları kümele (cluster), zoom'da ayrış. 100+ ilan performansı. | 🟡 Orta |
| 35 | **Çoklu konum filtresi** | Birden fazla ilçe/seçim yapabilme. "Kadıköy VE Beşiktaş" | 🟢 Düşük |

---

## 🚀 v1.7.0 — Mesajlaşma++ (Q3 2027)

| # | Özellik | Açıklama | Zorluk |
|---|---------|----------|--------|
| 36 | **Sesli mesaj** | Ses kaydı gönderme (mobil), dalga formu görseli, oynatma. | 🟡 Orta |
| 37 | **Dosya paylaşımı** | PDF, görsel, konum paylaşımı. Cloudinary'ye yükleme. | 🟡 Orta |
| 38 | **Grup sohbeti** | İş ilanı bazlı grup (tüm işçiler + işveren). Duyuru, toplu mesaj. | 🟡 Orta |
| 39 | **Mesaj arama** | Eski mesajlarda arama, tarih filtresi, kişi filtresi. | 🟡 Orta |
| 40 | **Hızlı yanıtlar** | "İşe başladım", "Yolda geliyorum", "İş tamamlandı" tek tıkla. | 🟢 Düşük |
| 41 | **Mesaj silme** | Kendi mesajını silme (her iki taraftan). "Bu mesaj silindi". | 🟢 Düşük |
| 42 | **Okundu raporu** | Karşı tarafın ne zaman okuduğunu görme (timestamp). | 🟢 Düşük |

---

## 🚀 v1.8.0 — Güvenlik++ (Q3 2027)

| # | Özellik | Açıklama | Zorluk |
|---|---------|----------|--------|
| 43 | **Kimlik doğrulama** | TC kimlik no doğrulama (e-Devlet entegrasyonu veya NVI API). | 🔴 Yüksek |
| 44 | **Şikayet sistemi** | Kullanıcı şikayet etme (harassment, fraud, spam). Kategori + açıklama + kanıt. | 🟡 Orta |
| 45 | **Otomatik fraud tespiti** | Şüpheli aktivite algılama: çoklu hesap, hızlı işlem, IP analizi. | 🔴 Yüksek |
| 46 | **IP bazlı engelleme** | Kötü niyetli IP'leri otomatik engelleme, rate limit aşımı. | 🟡 Orta |
| 47 | **2FA zorunluluğu** | Belirli işlemler için 2FA zorunlu (para çekme, büyük tutarlı ilan). | 🟢 Düşük |
| 48 | **Session yönetimi** | Aktif oturumları görme, uzaktan çıkış, cihaz listesi. | 🟡 Orta |
| 49 | **Oturum zaman aşımı** | 30 dk hareketsizlikte otomatik çıkış (mobil). | 🟢 Düşük |

---

## 🚀 v1.9.0 — Mobil++ (Q4 2027)

| # | Özellik | Açıklama | Zorluk |
|---|---------|----------|--------|
| 50 | **Offline mod** | İnternet yokken cache'lenen ilanları görme, başvuru kuyruğa alınır. | 🔴 Yüksek |
| 51 | **Widget** | Ana ekranda "Yakındaki işler" widget'ı, hızlı başvuru. | 🟡 Orta |
| 52 | **Hızlı başvuru** | Tek dokunuşla başvuru (öne ayarlı profil, otomatik mesaj). | 🟢 Düşük |
| 53 | **Karanlık mod** | Dark theme, sistem ayarına uyumlu. | 🟢 Düşük |
| 54 | **Dil desteği** | İngilizce, Kürtçe, Arapça. i18n entegrasyonu. | 🟡 Orta |
| 55 | **QR tarayıcı** | Uygulama içi QR kamera tarayıcı (işçi check-in/check-out için). | 🟡 Orta |
| 56 | **Push notification derin link** | Bildirime tıklayınca ilgili ekrana gitme (job detail, chat). | 🟡 Orta |
| 57 | **Haptik feedback** | Buton tıklamada titreşim, başarı/hata geri bildirimi. | 🟢 Düşük |

---

## 🚀 v2.0.0 — Kurumsal & Ölçeklendirme (Q1 2028)

| # | Özellik | Açıklama | Zorluk |
|---|---------|----------|--------|
| 58 | **Şirket hesapları** | Çoklu işveren kullanıcısı (şirket içinde rol bazlı: admin, manager, employee). | 🔴 Yüksek |
| 59 | **API anahtarları** | 3. parti entegrasyon için API key sistemi. Rate limit per key. | 🟡 Orta |
| 60 | **Webhook sistemi** | Olay bazlı webhook (iş başladı, ödeme yapıldı, başvuru alındı). | 🟡 Orta |
| 61 | **White-label** | Farklı markalar için özelleştirilebilir (logo, renk, domain). | 🔴 Yüksek |
| 62 | **Çoklu şube** | Zincir işletmeler için şube yönetimi, şube bazlı ilan, rapor. | 🟡 Orta |
| 63 | **Faturalama** | Elektronik fatura/e-arşive entegrasyonu. Şirketler için aylık fatura. | 🔴 Yüksek |
| 64 | **Vergi entegrasyonu** | Gelir vergisi, stopaj otomasyonu. İşçi için gelir beyannamesi. | 🔴 Yüksek |
| 65 | **SLA & Premium destek** | Kurumsal müşteriler için öncelikli destek, SLA garantisi. | 🟢 Düşük |

---

## 📊 Özet İstatistik

| Sürüm | Özellik Sayısı | Tahmini Tarih | Odak |
|-------|---------------|---------------|------|
| **v1.0.0** ✅ | 45+ | Tamamlandı | MVP |
| **v1.1.0** | 6 | Q4 2026 | Ödeme & Finans |
| **v1.2.0** | 6 | Q4 2026 | Admin Panel |
| **v1.3.0** | 6 | Q1 2027 | Sosyal & Değerlendirme |
| **v1.4.0** | 6 | Q1 2027 | Bildirim & İletişim |
| **v1.5.0** | 6 | Q2 2027 | Arama & Keşif |
| **v1.6.0** | 5 | Q2 2027 | Konum & Harita |
| **v1.7.0** | 7 | Q3 2027 | Mesajlaşma++ |
| **v1.8.0** | 7 | Q3 2027 | Güvenlik++ |
| **v1.9.0** | 8 | Q4 2027 | Mobil++ |
| **v2.0.0** | 8 | Q1 2028 | Kurumsal |
| **Toplam** | **110+** | | |

---

## 🏗️ Teknik Borç (Refactoring)

| # | Görev | Açıklama | Öncelik |
|---|-------|----------|---------|
| 1 | PostgreSQL'e geçiş | SQLite → PostgreSQL (Supabase/Neon). Schema hazır. | 🔴 |
| 2 | Redis ekleme | Rate limiting + WebSocket adapter için. | 🟡 |
| 3 | Nest.js'e taşıma | Service katmanı hazır, controller wrapper ekle. | 🟡 |
| 4 | PostGIS | Konum sorgularını DB seviyesine taşı. | 🟡 |
| 5 | CDN | Cloudflare CDN, statik dosyalar için. | 🟢 |
| 6 | Monitoring | Sentry (error tracking), Logtail (log aggregation). | 🟡 |
| 7 | CI/CD | GitHub Actions, otomatik test + deploy. | 🟡 |
| 8 | Test yazımı | Unit test (Jest), E2E test (Playwright). | 🟡 |
| 9 | API versioning | /api/v2 hazırlığı, backward compatibility. | 🟢 |
| 10 | Docker | Containerization, docker-compose. | 🟢 |

---

## 📝 Notlar

- **Tarihler tahminidir**, geliştirme hızına göre değişebilir
- **Öncelikler** kullanıcı geri bildirimine göre güncellenebilir
- **Teknik borç** her sprint'te bir miktar kapatılmalı
- **Güvenlik** her sürümde gözden geçirilmeli

---

> Bu roadmap canlı bir dokümandır. Geliştirme sürecinde güncellenecektir.  
> 📧 Geri bildirim: admin@gunubirlik.com
