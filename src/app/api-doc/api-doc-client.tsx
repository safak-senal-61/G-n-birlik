'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Copy,
  Check,
  Globe,
  Zap,
  Database,
  Shield,
  Bell,
  MessageSquare,
  Lock,
  FileText,
  CreditCard,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  MapPin,
  QrCode,
  Wrench,
  Wallet,
  LifeBuoy,
  Megaphone,
  Trash2,
  Star,
  BadgeCheck,
} from 'lucide-react'
import { toast } from 'sonner'

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  desc: string
  auth: boolean
  role?: string
  body?: string
  response?: string
  query?: string
}

const API_GROUPS: { title: string; icon: any; color: string; endpoints: Endpoint[] }[] = [
  {
    title: 'Kimlik Doğrulama',
    icon: Shield,
    color: 'bg-emerald-100 text-emerald-700',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/auth/register',
        desc: 'Yeni kullanıcı kaydı (işçi, işveren). Başarılı girişte JWT token döner.',
        auth: false,
        body: `{
  "email": "user@example.com",
  "password": "123456",
  "fullName": "Ad Soyad",
  "phone": "+905321234567",
  "role": "WORKER",
  "city": "İstanbul",
  "district": "Kadıköy",
  "companyName": "Şirket Ltd."
}`,
        response: `{
  "success": true,
  "data": {
    "user": { "id": "ck...", "email": "...", "role": "WORKER" },
    "token": "eyJhbGc..."
  }
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        desc: 'Mevcut kullanıcı girişi. Askıya alınmış veya banlı kullanıcılar (admin hariç) giriş yapamaz.',
        auth: false,
        body: `{ "email": "user@example.com", "password": "123456" }`,
        response: `{ "success": true, "data": { "user": {...}, "token": "eyJ..." } }`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/logout',
        desc: 'Oturumu kapatır, cookie temizlenir.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/v1/auth/me',
        desc: 'Mevcut kullanıcı bilgilerini döner.',
        auth: true,
      },
      {
        method: 'PUT',
        path: '/api/v1/auth/me',
        desc: 'Profil güncelle (skills, bio, konum vb.).',
        auth: true,
        body: `{
  "fullName": "Ad Soyad",
  "phone": "+905321234567",
  "city": "İstanbul",
  "skills": ["İnşaat", "Boyacı"]
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/google',
        desc: 'Google OAuth ile giriş/kayıt. Frontend Google Sign-In ID tokenı gönderir.',
        auth: false,
        body: `{ "idToken": "eyJhbGc... (Google ID token)" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/forgot-password',
        desc: 'Şifre sıfırlama talebi. OneSignal Email ile 6 haneli kod gönderir (EmailOtp tablosuna kaydedilir, 10 dk geçerli). Kademeli rate limit: 3 deneme serbest, sonra 15dk/30dk/1saat bekleme. Rate limit e-posta bazlıdır (IP değil).',
        auth: false,
        body: `{ "email": "user@example.com" }`,
        response: `{
  "success": true,
  "data": { "preview": "", "sent": true },
  "message": "Şifre sıfırlama kodu e-posta adresinize gönderildi."
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/reset-password',
        desc: 'Sıfırlama kodu ile yeni şifre belirle. Kod hem EmailOtp tablosunda (yeni sistem — OneSignal Email ile gönderilen) hem de PasswordReset tablosunda (eski sistem) aranır. Şifre en az 6 karakter.',
        auth: false,
        body: `{ "code": "123456", "newPassword": "yeniSifre123" }`,
        response: `{
  "success": true,
  "data": { "success": true },
  "message": "Şifreniz başarıyla güncellendi."
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/avatar',
        desc: 'Avatar yükle (base64). Cloudinary veya local storage.',
        auth: true,
        body: `{ "base64": "data:image/png;base64,...", "mimeType": "image/png" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/send-otp',
        desc: 'OneSignal Email ile OTP (tek kullanımlık şifre) gönderir. 5 tip: EMAIL_ACTIVATION (hesap aktivasyonu), PASSWORD_RESET (şifre sıfırlama), EMAIL_CHANGE (e-posta değişikliği), LOGIN_VERIFY (şüpheli giriş), PHONE_VERIFY (telefon değişikliği). 6 haneli kod, 10 dakika geçerli, max 5 yanlış deneme. E-posta OneSignal üzerinden gönderilir: From: noreply@gunubirlik.com, Reply-to: destek@gunubirlik.com',
        auth: false,
        body: `{
  "email": "user@example.com",
  "type": "EMAIL_ACTIVATION"
}`,
        response: `{
  "success": true,
  "data": { "success": true, "message": "10 dakika geçerli doğrulama kodu e-posta adresinize gönderildi." },
  "message": "10 dakika geçerli doğrulama kodu..."
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/verify-email',
        desc: 'E-posta aktivasyonu — kayıt sonrası hesabı doğrula. send-otp ile EMAIL_ACTIVATION tipinde gönderilen kod doğrulanır. Başarılı olursa user.emailVerified = true yapılır.',
        auth: false,
        body: `{ "email": "user@example.com", "code": "123456" }`,
        response: `{
  "success": true,
  "data": { "verified": true, "userId": "cmu..." },
  "message": "E-posta adresiniz doğrulandı! Hesabınız aktif."
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/resend-activation',
        desc: 'Aktivasyon e-postasını yeniden gönder. E-posta doğrulanmamış kullanıcılar için. Zaten doğrulanmışsa hata döner.',
        auth: false,
        body: `{ "email": "user@example.com" }`,
        response: `{
  "success": true,
  "data": { "success": true, "message": "Aktivasyon kodu gönderildi." }
}`,
      },
    ],
  },
  {
    title: 'Güvenlik (2FA & E-posta)',
    icon: Lock,
    color: 'bg-rose-100 text-rose-700',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/auth/2fa/setup',
        desc: '2FA için TOTP secret üret ve QR kod döndür.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/2fa/verify',
        desc: '2FA kurulumunu doğrula ve aktif et.',
        auth: true,
        body: `{ "code": "123456" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/2fa/disable',
        desc: '2FAyı devre dışı bırak.',
        auth: true,
        body: `{ "code": "123456" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/email-change/request',
        desc: 'E-posta değişiklik talebi. Yeni e-postaya OneSignal Email ile 6 haneli kod gönderir (EmailOtp tablosu, tip: EMAIL_CHANGE, 10 dk geçerli). ÖNEMLİ: Mevcut e-posta adresi doğrulanmış olmalıdır (emailVerified = true), aksi halde 403 hatası.',
        auth: true,
        body: `{ "newEmail": "yeni@email.com" }`,
        response: `{
  "success": true,
  "data": { "preview": "", "sent": true },
  "message": "..."
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/email-change/confirm',
        desc: 'E-posta değişikliğini doğrula. Kod hem EmailOtp tablosunda (yeni sistem) hem de EmailVerification tablosunda (eski sistem) aranır. Başarılı olursa user.email güncellenir ve emailVerified = true yapılır.',
        auth: true,
        body: `{ "code": "123456" }`,
        response: `{
  "success": true,
  "data": { "email": "yeni@email.com" },
  "message": "E-posta adresiniz güncellendi."
}`,
      },
    ],
  },
  {
    title: 'İş İlanları',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/jobs',
        desc: 'İş ilanlarını listeler. Sadece APPROVED durumundaki ilanlar görünür. Sayfalama, filtreleme, konum bazlı arama destekler.',
        auth: false,
        query: `page=1&pageSize=10
category=INSAAT|RESTAURANT|TEMIZLIK|NAKLIYE|TARIM|TEKNIK|SAGLIK|DIGER
city=İstanbul&district=Kadıköy
search=garson
lat=41.0082&lng=28.9784&radiusKm=50  (konum bazlı)
minWage=1000&maxWage=5000
sortBy=NEWEST|OLDEST|WAGE_HIGH|WAGE_LOW|NEAREST|URGENT`,
      },
      {
        method: 'GET',
        path: '/api/v1/jobs/{id}',
        desc: 'Tek bir ilanın detayını getir.',
        auth: false,
      },
      {
        method: 'POST',
        path: '/api/v1/jobs',
        desc: 'Yeni iş ilanı oluştur. Onaylı işverenler anında yayına alınır, diğerleri admin onayı bekler.',
        auth: true,
        role: 'EMPLOYER',
        body: `{
  "title": "İnşaat İşçisi Aranıyor",
  "description": "Açıklama metni (min 20 karakter)",
  "category": "INSAAT",
  "workDate": "2024-12-25",
  "startTime": "08:00",
  "endTime": "17:00",
  "durationHours": 9,
  "wageAmount": 2500,
  "wageType": "DAILY",
  "city": "İstanbul",
  "district": "Kadıköy",
  "latitude": 40.9904,
  "longitude": 29.0291,
  "openingsTotal": 3,
  "urgency": "HIGH"
}`,
      },
      {
        method: 'PUT',
        path: '/api/v1/jobs/{id}',
        desc: 'İlan güncelle. Sadece ilanı veren işveren.',
        auth: true,
        role: 'EMPLOYER',
      },
      {
        method: 'DELETE',
        path: '/api/v1/jobs/{id}',
        desc: 'İlanı sil.',
        auth: true,
        role: 'EMPLOYER',
      },
      {
        method: 'POST',
        path: '/api/v1/jobs/{id}/save',
        desc: 'İlanı kaydet / kayıttan çıkar (toggle).',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/v1/jobs/saved',
        desc: 'Kullanıcının kaydettiği ilanları listeler.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/v1/jobs/categories',
        desc: 'İş kategorilerini listeler.',
        auth: false,
      },
    ],
  },
  {
    title: 'Başvurular',
    icon: CheckCircle2,
    color: 'bg-purple-100 text-purple-700',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/applications',
        desc: 'Bir ilana başvuru yap. İşçi rolü gerekli.',
        auth: true,
        role: 'WORKER',
        body: `{
  "jobId": "ck...",
  "message": "8 yıllık deneyimliyim...",
  "proposedWage": 2800
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/applications',
        desc: 'İşçi: kendi başvuruları. İşveren: ilanlarına yapılan başvurular.',
        auth: true,
        query: `status=PENDING|ACCEPTED|REJECTED|WITHDRAWN|COMPLETED|NO_SHOW`,
      },
      {
        method: 'PUT',
        path: '/api/v1/applications/{id}',
        desc: 'Başvuru durumunu güncelle. COMPLETED yapıldığında otomatik ödeme kaydı oluşturulur ve admin onayı bekler.',
        auth: true,
        body: `{ "status": "ACCEPTED", "employerNote": "Yarın 08:00te gelin" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/applications/{id}/rate',
        desc: 'Tamamlanan iş için 1-5 arası puan ve yorum. İşçi işvereni, işveren işçiyi puanlar. Aynı başvuru iki kez puanlanamaz. Alıcının ratingAvg/ratingCount alanları otomatik güncellenir. (Detaylı kullanım için "Değerlendirme Sistemi" grubuna bakın.)',
        auth: true,
        body: `{ "rating": 5, "comment": "Çok titiz çalıştı" }`,
        response: `{
  "success": true,
  "data": {
    "id": "cmr...",
    "applicationId": "cmu...",
    "jobId": "cmj...",
    "reviewerId": "user_ahmet",
    "receiverId": "user_mehmet",
    "rating": 5,
    "comment": "Çok titiz çalıştı",
    "reviewType": "EMPLOYER_TO_WORKER",
    "createdAt": "2026-09-28T10:00:00.000Z"
  },
  "message": "Değerlendirmeniz kaydedildi."
}`,
      },
    ],
  },
  {
    title: 'Değerlendirme Sistemi',
    icon: Star,
    color: 'bg-yellow-100 text-yellow-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/users/{id}/reviews',
        desc: 'Bir kullanıcının aldığı tüm değerlendirmeleri listele (herkese açık). Yıldız dağılımı (1-5) ve pagination ile döner. Profil sayfasında gösterilen yorumlar bu endpointten gelir. query: type=WORKER_TO_EMPLOYER|EMPLOYER_TO_WORKER (opsiyonel filtre), page, pageSize.',
        auth: false,
        query: `type=WORKER_TO_EMPLOYER&page=1&pageSize=20`,
        response: `{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cmr...",
        "rating": 5,
        "comment": "İşini titiz yaptı, zamanında geldi.",
        "reviewType": "EMPLOYER_TO_WORKER",
        "createdAt": "2026-09-28T10:00:00.000Z",
        "jobId": "cmj...",
        "applicationId": "cmu...",
        "reviewer": {
          "id": "user_ahmet",
          "fullName": "Ahmet Yapı Ltd.",
          "avatarUrl": "https://res.cloudinary.com/...",
          "companyName": "Ahmet Yapı Ltd.",
          "isVerified": true,
          "role": "EMPLOYER"
        },
        "job": {
          "id": "cmj...",
          "title": "İnşaat İşçisi",
          "category": "INSAAT",
          "city": "İstanbul",
          "district": "Kadıköy"
        }
      }
    ],
    "pagination": { "page": 1, "pageSize": 20, "total": 14, "totalPages": 1 },
    "distribution": { "1": 0, "2": 1, "3": 1, "4": 3, "5": 9 }
  }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/users/{id}/rating-summary',
        desc: 'Kullanıcının puan özeti — ortalama, toplam sayı, son 30 gün trendi, yıldız dağılımı, doğrulanma durumu. Profil kartının üst kısmındaki rozet + puan kutusunda gösterilir. Herkese açık.',
        auth: false,
        response: `{
  "success": true,
  "data": {
    "user": {
      "id": "user_mehmet",
      "fullName": "Mehmet Yılmaz",
      "role": "WORKER",
      "companyName": null,
      "avatarUrl": "https://...",
      "isVerified": false
    },
    "ratingAvg": 4.6,
    "ratingCount": 14,
    "recent30Days": { "avg": 4.8, "count": 5 },
    "distribution": { "1": 0, "2": 1, "3": 1, "4": 3, "5": 9 }
  }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/users/me/reviews/received',
        desc: 'Bana yapılan tüm değerlendirmeler (kendi profime). "Değerlendirmelerim" sekmesinde gösterilir. Yıldız dağılımı + pagination içerir.',
        auth: true,
        query: `type=WORKER_TO_EMPLOYER|EMPLOYER_TO_WORKER&page=1&pageSize=20`,
      },
      {
        method: 'GET',
        path: '/api/v1/users/me/reviews/given',
        desc: 'Benim yaptığım tüm değerlendirmeler. Hangi işçiyi/işvereni kaça puanladığımı görürüm. Geçmiş işlerim sekmesinde kullanılır.',
        auth: true,
        query: `type=WORKER_TO_EMPLOYER|EMPLOYER_TO_WORKER&page=1&pageSize=20`,
      },
      {
        method: 'GET',
        path: '/api/v1/users/me/rating-summary',
        desc: 'Kendi puan özetim (ratingAvg, ratingCount, son 30 gün, dağılım). Profilim sayfasının üst kısmındaki kutu için.',
        auth: true,
      },
    ],
  },
  {
    title: 'Doğrulama & Rozetler',
    icon: BadgeCheck,
    color: 'bg-blue-100 text-blue-700',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/users/me/verification-request',
        desc: 'Doğrulanmış rozeti için belge yükle. İşverenler şirket belgesi / vergi levhası / kimlik yükleyip admin onayına gönderir. Onaylanınca kullanıcı isVerified=true olur, profilde mavi onay rozeti görünür. Aynı anda yalnızca 1 PENDING talep olabilir. Zaten verified kullanıcı tekrar başvuramaz.',
        auth: true,
        body: `{
  "type": "COMPANY",
  "documentUrl": "data:image/png;base64,iVBORw0KGgo...",
  "documentNote": "Vergi levhamız ektedir. 2024 yılı."
}`,
        response: `{
  "success": true,
  "data": {
    "id": "cmv...",
    "userId": "user_ahmet",
    "type": "COMPANY",
    "status": "PENDING",
    "documentNote": "Vergi levhamız ektedir. 2024 yılı.",
    "createdAt": "2026-09-28T10:00:00.000Z",
    "updatedAt": "2026-09-28T10:00:00.000Z"
  },
  "message": "Doğrulama talebiniz alındı. Admin onayını bekliyor."
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/users/me/verification-request',
        desc: 'Geçmiş tüm doğrulama taleplerim (PENDING, APPROVED, REJECTED hepsi). "Hesabım > Doğrulama" sekmesinde tablo olarak gösterilir. Reddedilen taleplerde reviewNote alanında admin gerekçesi yazar.',
        auth: true,
        query: `page=1&pageSize=10`,
        response: `{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cmv...",
        "type": "COMPANY",
        "status": "PENDING",
        "documentNote": "Vergi levhamız ektedir.",
        "reviewNote": null,
        "createdAt": "2026-09-28T10:00:00.000Z",
        "reviewedAt": null
      },
      {
        "id": "cmv_old...",
        "type": "TAX",
        "status": "REJECTED",
        "documentNote": "Eski belge.",
        "reviewNote": "Belge okunmuyor, yeniden yükleyin.",
        "createdAt": "2026-09-20T08:00:00.000Z",
        "reviewedAt": "2026-09-22T14:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "pageSize": 10, "total": 2, "totalPages": 1 }
  }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/users/me/verification-status',
        desc: 'Aktif doğrulama durumum — verified mi, PENDING talep var mı, son karar neydi. Header rozet göstergesi ve profil sayfası bu endpointi çağırır. Her 30 saniyede bir poll edilebilir.',
        auth: true,
        response: `{
  "success": true,
  "data": {
    "isVerified": false,
    "pendingRequest": {
      "id": "cmv...",
      "type": "COMPANY",
      "status": "PENDING",
      "documentNote": "Vergi levhamız ektedir.",
      "createdAt": "2026-09-28T10:00:00.000Z"
    },
    "lastDecision": {
      "id": "cmv_old...",
      "type": "TAX",
      "status": "REJECTED",
      "reviewNote": "Belge okunmuyor, yeniden yükleyin.",
      "reviewedAt": "2026-09-22T14:00:00.000Z",
      "createdAt": "2026-09-20T08:00:00.000Z"
    }
  }
}`,
      },
    ],
  },
  {
    title: 'QR ile İşe Başlama',
    icon: QrCode,
    color: 'bg-cyan-100 text-cyan-700',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/applications/{id}/qr-code',
        desc: 'İşveren, kabul ettiği işçi için check-in veya check-out QR kodu üretir. Sadece işin sahibi işveren üretebilir. QR 5 dakika geçerli, tek kullanımlık. Base64 PNG görsel döner (frontend direkt <img src=...> ile gösterir).',
        auth: true,
        role: 'EMPLOYER',
        body: `{ "type": "CHECK_IN" }  // veya "CHECK_OUT"`,
        response: `{
  "success": true,
  "data": {
    "qrId": "cmu...",
    "token": "a1b2c3d4e5f6...",
    "qrImageDataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "expiresAt": "2026-09-26T12:35:00.000Z",
    "type": "CHECK_IN",
    "application": {
      "id": "cmu...",
      "status": "ACCEPTED",
      "worker": { "id": "...", "fullName": "Ahmet Yılmaz" },
      "job": {
        "id": "...", "title": "İnşaat İşçisi",
        "workDate": "2026-12-25",
        "startTime": "08:00", "endTime": "17:00",
        "wageAmount": 2500, "wageType": "DAILY"
      }
    }
  },
  "message": "Check-in QR kodu oluşturuldu. 5 dakika geçerli."
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/qr/scan',
        desc: 'İşçi (veya işveren) QR kodunu tarar. Token doğrulanır, application durumu güncellenir. CHECK_IN → IN_PROGRESS, CHECK_OUT → COMPLETED + otomatik ödeme talebi oluşturulur. Her iki tarafa da bildirim gönderilir.',
        auth: true,
        body: `{ "token": "a1b2c3d4e5f6... (QR içindeki token)" }`,
        response: `{
  "success": true,
  "data": {
    "success": true,
    "type": "CHECK_IN",
    "newStatus": "IN_PROGRESS",
    "application": {
      "id": "cmu...",
      "status": "IN_PROGRESS",
      "worker": { "id": "...", "fullName": "Ahmet Yılmaz" },
      "job": { "id": "...", "title": "İnşaat İşçisi", "wageAmount": 2500, "wageType": "DAILY" }
    },
    "message": "İşe başladınız: \\"İnşaat İşçisi\\""
  },
  "message": "İşe başladınız: \\"İnşaat İşçisi\\""
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/applications/{id}/qr-status',
        desc: 'Bir başvuru için aktif QR kodlarını ve son kullanılan QRı getirir. Hem işçi hem işveren erişebilir. UI, aktif QR varsa gösterir, yoksa "QR Üret" butonu gösterir.',
        auth: true,
        response: `{
  "success": true,
  "data": {
    "activeQrs": [
      {
        "id": "cmu...",
        "type": "CHECK_IN",
        "token": "a1b2c3d4...",
        "qrImageDataUrl": "data:image/png;base64,...",
        "expiresAt": "2026-09-26T12:35:00.000Z",
        "createdAt": "2026-09-26T12:30:00.000Z"
      }
    ],
    "lastUsedQr": {
      "id": "cmu...",
      "type": "CHECK_IN",
      "usedAt": "2026-09-26T11:30:00.000Z",
      "scannedById": "cmu..."
    },
    "applicationStatus": "ACCEPTED"
  }
}`,
      },
    ],
  },
  {
    title: 'Mesajlaşma (Moderasyonlu)',
    icon: MessageSquare,
    color: 'bg-pink-100 text-pink-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/conversations',
        desc: 'Kullanıcının tüm konuşmalarını listeler.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/v1/conversations',
        desc: 'Yeni konuşma başlat veya mesaj gönder. Mesaj içeriği otomatik moderasyondan geçer: küfür, telefon, e-posta, URL, sosyal medya, IBAN, adres, tehdit tespit edilir ve maskelenir. İhlal sayısına göre otomatik yaptırım (uyarı, askıya alma, ban).',
        auth: true,
        body: `{
  "recipientId": "ck...",
  "content": "Merhaba, ilanınızı gördüm",
  "type": "TEXT"
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/conversations/{id}/messages',
        desc: 'Bir konuşmadaki mesajları sayfalanmış olarak listeler.',
        auth: true,
        query: `page=1&pageSize=50`,
      },
    ],
  },
  {
    title: 'Bildirimler & Ayarlar',
    icon: Bell,
    color: 'bg-orange-100 text-orange-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/notifications',
        desc: 'Kullanıcının bildirimlerini listeler. Okunmamış sayısı dahil.',
        auth: true,
        query: `unread=true&page=1`,
        response: `{
  "success": true,
  "data": {
    "items": [{
      "id": "cmu...",
      "type": "APPLICATION_ACCEPTED",
      "title": "Başvurunuz Onaylandı!",
      "body": "...",
      "isRead": false,
      "createdAt": "2026-..."
    }],
    "unreadCount": 3,
    "pagination": {...}
  }
}`,
      },
      {
        method: 'PUT',
        path: '/api/v1/notifications/{id}',
        desc: 'Bildirimi okundu olarak işaretle.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/v1/notifications/read-all',
        desc: 'Tüm bildirimleri okundu olarak işaretle.',
        auth: true,
      },
      {
        method: 'DELETE',
        path: '/api/v1/notifications/{id}',
        desc: 'Bildirimi sil.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/v1/notifications/settings',
        desc: 'Kullanıcının bildirim ayarlarını getirir. 18 kategori + genel push anahtarı. Kullanıcı ayarı yoksa otomatik oluşturulur (tümü açık). Mobil uygulama da bu API\'yi kullanır.',
        auth: true,
        response: `{
  "success": true,
  "data": {
    "pushEnabled": true,
    "jobApplied": true,
    "applicationAccepted": true,
    "applicationRejected": true,
    "jobReminder": true,
    "jobNearby": true,
    "newMessage": true,
    "paymentReceived": true,
    "paymentApproved": true,
    "paymentRejected": true,
    "walletDeposit": true,
    "walletWithdraw": true,
    "workStarted": true,
    "workCompleted": true,
    "escrowDisputed": true,
    "systemUpdate": true,
    "maintenance": true,
    "promotional": true
  }
}`,
      },
      {
        method: 'PUT',
        path: '/api/v1/notifications/settings',
        desc: 'Bildirim ayarlarını günceller. Tek tek veya toplu güncelleme. Sadece boolean alanlar kabul edilir. Ayar anında kaydedilir, createNotification() her bildirim öncesi kontrol eder — kapalı kategori için bildirim gönderilmez.',
        auth: true,
        body: `{
  "newMessage": false,
  "promotional": false,
  "pushEnabled": true,
  "paymentReceived": true
}`,
        response: `{
  "success": true,
  "data": { ...updated settings },
  "message": "Bildirim ayarları güncellendi."
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/notifications/settings/reset',
        desc: 'Tüm bildirim ayarlarını varsayılana sıfırlar (tümü açık).',
        auth: true,
        response: `{
  "success": true,
  "data": { ...all true },
  "message": "Bildirim ayarları varsayılana sıfırlandı."
}`,
      },
    ],
  },
  {
    title: 'Cüzdan & Ödemeler',
    icon: Wallet,
    color: 'bg-emerald-100 text-emerald-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/wallet/balance',
        desc: 'Kullanıcının cüzdan bakiyesini getirir.',
        auth: true,
        response: `{
  "success": true,
  "data": {
    "balance": 1500.50,
    "currency": "TRY",
    "updatedAt": "2026-09-26T12:00:00.000Z"
  }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/wallet/transactions',
        desc: 'Cüzdan işlem geçmişini listeler. Filtreleme desteklenir.',
        auth: true,
        query: `type=ALL|DEPOSIT|WITHDRAW|TRANSFER|QR_PAYMENT|JOB_PAYMENT|REFUND|FEE|BONUS
page=1&pageSize=20`,
      },
      {
        method: 'POST',
        path: '/api/v1/wallet/withdraw',
        desc: 'Para çekme talebi oluşturur. Min 50₺. Talep PENDING olarak kaydedilir, admin onayı bekler (1-3 iş günü).',
        auth: true,
        body: `{
  "amount": 500,
  "bankInfo": "Ahmet Yılmaz - TR99 0001 2345 6789",
  "note": "Acil ihtiyaç"
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/wallet/transfer',
        desc: 'Başka bir kullanıcıya para transferi. Min 10₺. Anında gerçekleşir, her iki tarafa işlem kaydı ve bildirim gönderilir.',
        auth: true,
        body: `{
  "recipientId": "cmu...",
  "amount": 250,
  "description": "İnşaat işçisi ücreti",
  "note": "Bugünkü iş için"
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/wallet/qr-pay/generate',
        desc: 'QR ile ödeme kodu üretir. İşveren işçiye ödemek için kullanır. 5 dakika geçerli, tek kullanımlık. Base64 PNG görsel döner. Gönderenin bakiyesi kontrol edilir.',
        auth: true,
        body: `{
  "amount": 2500,
  "description": "İnşaat işçisi günlük ücret"
}`,
        response: `{
  "success": true,
  "data": {
    "qrId": "cmu...",
    "token": "a1b2c3d4e5f6...",
    "qrImageDataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "expiresAt": "2026-09-26T12:35:00.000Z",
    "amount": 2500,
    "description": "İnşaat işçisi günlük ücret",
    "generator": { "id": "...", "fullName": "Ahmet" }
  }
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/wallet/qr-pay/scan',
        desc: 'QR ödeme kodunu tarar. Token doğrulanır, gönderenin bakiyesinden düşülüp alıcının bakiyesine eklenir. Her iki tarafa WalletTransaction kaydı ve bildirim gönderilir.',
        auth: true,
        body: `{ "token": "a1b2c3d4e5f6..." }`,
        response: `{
  "success": true,
  "data": {
    "transactionId": "cmu...",
    "balanceAfter": 2750,
    "amount": 2500,
    "type": "QR_PAYMENT",
    "status": "COMPLETED",
    "qrPayment": {
      "id": "cmu...",
      "amount": 2500,
      "description": "İnşaat işçisi günlük ücret",
      "generator": { "id": "...", "fullName": "Ahmet" }
    }
  }
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/wallet/deposit',
        desc: 'Admin: Kullanıcıya bakiye yükler. DEPOSIT işlemi oluşturur, anında bakiyeye yansır. Kullanıcıya bildirim gönderilir.',
        auth: true,
        role: 'ADMIN',
        body: `{
  "userId": "cmu...",
  "amount": 1000,
  "description": "Manuel bakiye yükleme",
  "reference": "MANUAL_001",
  "note": "Telefon ile ödeme"
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/wallet/deposit-request',
        desc: 'Para yatırma talebi oluşturur. Kullanıcı kendi banka hesabından EFT/Havale ile para yatıracak. IBAN, Ad Soyad ve banka adı girer. Talep PENDING olarak kaydedilir, admin EFT geldiğini onaylayınca bakiyeye yansır. Min 50₺.',
        auth: true,
        body: `{
  "amount": 1000,
  "senderName": "Ahmet Yılmaz",
  "senderIban": "TR99 0001 2345 6789 0123 4567 89",
  "senderBank": "İş Bankası",
  "senderNote": "Telefon numaram: 0532..."
}`,
        response: `{
  "success": true,
  "data": {
    "id": "cmu...",
    "userId": "cmu...",
    "amount": 1000,
    "senderName": "Ahmet Yılmaz",
    "senderIban": "TR99...6789",
    "status": "PENDING",
    "createdAt": "2026-09-26T..."
  },
  "message": "Para yatırma talebiniz alındı..."
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/wallet/deposit-requests',
        desc: 'Kullanıcının para yatırma taleplerini listeler (geçmiş + durum).',
        auth: true,
        query: `page=1`,
      },
      {
        method: 'POST',
        path: '/api/v1/wallet/withdraw-request',
        desc: 'Para çekme talebi oluşturur. Cüzdan bakiyesini IBAN\'a çekmek için. Bakiyeden hemen düşülür (emanete alınır), admin onayı sonrası IBAN\'a gönderilir. Reddedilirse para iade edilir. Min 50₺. 3-5 iş günü.',
        auth: true,
        body: `{
  "amount": 500,
  "recipientName": "Ahmet Yılmaz",
  "recipientIban": "TR99 0001 2345 6789 0123 4567 89",
  "recipientBank": "İş Bankası",
  "recipientNote": "Acil ihtiyaç"
}`,
        response: `{
  "success": true,
  "data": {
    "request": { "id": "cmu...", "status": "PENDING", "amount": 500 },
    "transaction": { "id": "cmu...", "type": "WITHDRAW", "amount": -500 },
    "balanceAfter": 16500
  },
  "message": "Para çekme talebiniz alındı. 3-5 iş günü..."
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/wallet/withdraw-requests',
        desc: 'Kullanıcının para çekme taleplerini listeler (geçmiş + durum).',
        auth: true,
        query: `page=1`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/wallet/deposit-requests',
        desc: 'Admin: Tüm para yatırma taleplerini listeler. Filtreli (PENDING/APPROVED/REJECTED/ALL).',
        auth: true,
        role: 'ADMIN',
        query: `status=PENDING|APPROVED|REJECTED|ALL&page=1&pageSize=20`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/wallet/deposit-requests/{id}/approve',
        desc: 'Admin: Para yatırma talebini onaylar. Kullanıcı bakiyesine tutar eklenir, WalletTransaction (DEPOSIT) oluşturulur, kullanıcıya bildirim gönderilir. EFT/Havale geldiğini teyit eden admin çağırır.',
        auth: true,
        role: 'ADMIN',
        body: `{ "note": "EFT teyit edildi, dekont: 12345" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/wallet/deposit-requests/{id}/reject',
        desc: 'Admin: Para yatırma talebini reddeder. Bakiye değişmez. Kullanıcıya ret gerekçesi bildirilir.',
        auth: true,
        role: 'ADMIN',
        body: `{ "reason": "EFT bulunamadı, dekont gönderin" }`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/wallet/withdraw-requests',
        desc: 'Admin: Tüm para çekme taleplerini listeler. Filtreli (PENDING/COMPLETED/REJECTED/ALL). IBAN, alıcı adı ve tutar bilgisi ile birlikte gelir.',
        auth: true,
        role: 'ADMIN',
        query: `status=PENDING|COMPLETED|REJECTED|ALL&page=1&pageSize=20`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/wallet/withdraw-requests/{id}/approve',
        desc: 'Admin: Para çekme talebini onaylar. Ödeme IBAN\'a gönderildiğini teyit eder. Transaction COMPLETED yapılır, kullanıcıya bildirim gönderilir.',
        auth: true,
        role: 'ADMIN',
        body: `{ "note": "IBAN'a gönderildi, dekont: 67890" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/wallet/withdraw-requests/{id}/reject',
        desc: 'Admin: Para çekme talebini reddeder. Tutulan tutar kullanıcı cüzdanına iade edilir. REFUND işlemi oluşturulur.',
        auth: true,
        role: 'ADMIN',
        body: `{ "reason": "IBAN hatalı, kontrol edin" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/wallet/escrow/{jobId}/resolve',
        desc: 'Admin: İş emanet ihtilafını çözer. İş ortasında kavga/iptal olduysa, emanetteki parayı işçiye veya işverene verir. jobId parametresi kullanılır. İki seçenek: RELEASE_TO_WORKER (işçi lehine) veya REFUND_TO_EMPLOYER (işveren lehine). Audit log kaydedilir.',
        auth: true,
        role: 'ADMIN',
        body: `{
  "resolution": "RELEASE_TO_WORKER",
  "note": "İşçi işi yapmış, işveren haksız"
}`,
        response: `{
  "success": true,
  "data": {
    "resolution": "RELEASED_TO_WORKER",
    "workerBalanceAfter": 2500,
    "transactionId": "cmu..."
  },
  "message": "İhtilaf çözüldü."
}`,
      },
    ],
  },
  {
    title: 'Yönetim Paneli (Admin)',
    icon: Shield,
    color: 'bg-indigo-100 text-indigo-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/admin/stats',
        desc: 'Dashboard istatistikleri: kullanıcı, bekleyen ihlal, askıda, mesaj, iş onayı, ödeme, doğrulama, 7 günlük trend.',
        auth: true,
        role: 'ADMIN',
      },
      {
        method: 'GET',
        path: '/api/v1/admin/users',
        desc: 'Kullanıcı listesi (filtreli + sayfalı).',
        auth: true,
        role: 'ADMIN',
        query: `search=ahmet&role=WORKER&status=ACTIVE|SUSPENDED|BANNED|ALL
sortBy=createdAt|fullName|lastActiveAt|flagCount
sortOrder=asc|desc&page=1&pageSize=20`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/users/{id}/suspend',
        desc: 'Kullanıcıyı askıya al (geçici) veya banla (kalıcı).',
        auth: true,
        role: 'ADMIN',
        body: `{
  "durationHours": 24,  // null = kalıcı ban
  "reason": "Çok sayıda küfür"
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/users/{id}/unsuspend',
        desc: 'Askıya almayı veya banı kaldır.',
        auth: true,
        role: 'ADMIN',
        body: `{ "reason": "İnceleme sonucu" }`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/jobs/pending',
        desc: 'Onay bekleyen iş ilanlarını listeler.',
        auth: true,
        role: 'ADMIN',
        query: `page=1&pageSize=20`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/jobs/pending/{id}/approve',
        desc: 'İlanı onayla ve yayına al.',
        auth: true,
        role: 'ADMIN',
        body: `{ "note": "Uygun görüldü" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/jobs/pending/{id}/reject',
        desc: 'İlanı reddet (yayından kalkar).',
        auth: true,
        role: 'ADMIN',
        body: `{ "reason": "Uygunsuz içerik" }`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/payments',
        desc: 'Ödeme taleplerini listeler. Toplam tutar ve adet bilgisi döner.',
        auth: true,
        role: 'ADMIN',
        query: `status=PENDING|APPROVED|REJECTED|PAID|RECEIVED|DISPUTED|ALL
page=1&pageSize=20`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/payments/{id}/approve',
        desc: 'Ödemeyi onayla (işveren ödemeye hazır).',
        auth: true,
        role: 'ADMIN',
        body: `{ "note": "Onaylandı" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/payments/{id}/reject',
        desc: 'Ödemeyi reddet.',
        auth: true,
        role: 'ADMIN',
        body: `{ "reason": "Ücret bilgisi hatalı" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/payments/{id}/resolve-dispute',
        desc: 'İtirazlı ödemeyi çözümle (APPROVED= işçi lehine, REJECTED= işveren lehine).',
        auth: true,
        role: 'ADMIN',
        body: `{
  "resolution": "APPROVED",
  "note": "İşçi haklı, ödeme yapılsın"
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/verifications',
        desc: 'İşveren doğrulama taleplerini listeler.',
        auth: true,
        role: 'ADMIN',
        query: `status=PENDING|APPROVED|REJECTED|ALL&page=1`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/verifications/{id}/approve',
        desc: 'Doğrulama talebini onayla (işverene onaylı rozeti verilir).',
        auth: true,
        role: 'ADMIN',
        body: `{ "note": "Belgeler doğrulandı" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/verifications/{id}/reject',
        desc: 'Doğrulama talebini reddet.',
        auth: true,
        role: 'ADMIN',
        body: `{ "reason": "Belge okunamıyor" }`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/flags',
        desc: 'Moderasyon ihlal kuyruğu.',
        auth: true,
        role: 'ADMIN',
        query: `status=PENDING|REVIEWED|DISMISSED|ACTION_TAKEN|ALL
severity=LOW|MEDIUM|HIGH|CRITICAL|ALL
violationType=PROFANITY|PHONE|EMAIL|URL|SOCIAL_HANDLE|IBAN|ADDRESS|THREAT|SPAM|ALL`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/flags/{id}/resolve',
        desc: 'İhlal bayrağını çözümle.',
        auth: true,
        role: 'ADMIN',
        body: `{
  "action": "WARN|SUSPEND|BAN|DISMISS|NONE",
  "note": "Açıklama",
  "suspendDurationHours": 24
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/audit',
        desc: 'Tüm admin işlemlerinin kaydı.',
        auth: true,
        role: 'ADMIN',
        query: `action=USER_SUSPEND|JOB_APPROVE|PAYMENT_APPROVE|...&page=1`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/moderation/rules',
        desc: 'Tüm moderasyon kurallarını listeler.',
        auth: true,
        role: 'ADMIN',
      },
      {
        method: 'POST',
        path: '/api/v1/admin/moderation/rules',
        desc: 'Yeni moderasyon kuralı oluştur (özel regex).',
        auth: true,
        role: 'ADMIN',
        body: `{
  "name": "WhatsApp engelle",
  "type": "URL",
  "pattern": "wa\\\\.me\\/[a-zA-Z0-9]+",
  "severity": "LOW",
  "action": "FILTER"
}`,
      },
      {
        method: 'PATCH',
        path: '/api/v1/admin/moderation/rules/{id}',
        desc: 'Kural güncelle (sistem kuralları sadece açıp kapatılabilir).',
        auth: true,
        role: 'ADMIN',
        body: `{ "isEnabled": false }`,
      },
      {
        method: 'DELETE',
        path: '/api/v1/admin/moderation/rules/{id}',
        desc: 'Özel kuralı sil (sistem kuralları silinemez).',
        auth: true,
        role: 'ADMIN',
      },
    ],
  },
  {
    title: 'Konum & Geocoding',
    icon: MapPin,
    color: 'bg-cyan-100 text-cyan-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/geocode/reverse',
        desc: 'Koordinatı adrese çevirir (reverse geocoding). "Konum Al" butonuna basıldığında bu endpoint çağrılır. Mahalle, ilçe, şehir, sokak/cadde, posta kodu bilgisini döner. 5 dakika cache\'lenir.',
        auth: false,
        query: `lat=41.0082  (zorunlu, Türkiye sınırları içinde olmalı: 35-43)
lng=28.9784  (zorunlu, Türkiye sınırları içinde olmalı: 25-45)`,
        response: `{
  "success": true,
  "data": {
    "displayName": "Moda Mah. Caferağa, Kadıköy, İstanbul, 34710, Türkiye",
    "street": "Moda Caddesi",
    "neighbourhood": "Caferağa Mahallesi",
    "district": "Kadıköy",
    "city": "İstanbul",
    "state": "İstanbul",
    "country": "Türkiye",
    "postcode": "34710"
  },
  "message": "Konum bilgisi başarıyla alındı."
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/geocode/search',
        desc: 'Adres/metin aramasından koordinat çıkarır (forward geocoding). İş ilanı oluştururken veya profil düzenlerken konum seçimi için kullanılır. Sadece Türkiye adreslerini döner.',
        auth: false,
        query: `q=Kadıköy İstanbul  (zorunlu, min 3 karakter) veya query=...
limit=5  (opsiyonel, 1-40 arası, varsayılan 5)`,
        response: `{
  "success": true,
  "data": {
    "query": "Kadıköy İstanbul",
    "count": 3,
    "items": [
      {
        "displayName": "Kadıköy, İstanbul, Türkiye",
        "lat": 40.9904,
        "lng": 29.0291,
        "city": "İstanbul",
        "district": "Kadıköy",
        "neighbourhood": null,
        "street": null,
        "postcode": null,
        "type": "administrative",
        "importance": 0.7
      }
    ]
  },
  "message": "3 sonuç bulundu."
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/geocode/suggest',
        desc: 'Adres arama kutusu için autocomplete önerileri (forward geocoding varyantı). Kullanıcı yazdıkça bu endpoint çağrılır ve dropdown önerileri gösterilir. 3 karakterden kısa sorgularda boş array döner (rate limit\'i korur).',
        auth: false,
        query: `q=Kadı  (min 3 karakter, kısa sorgular için optimize)
limit=5  (opsiyonel, max 10)`,
        response: `{
  "success": true,
  "data": {
    "query": "Kadı",
    "count": 5,
    "items": [
      { "displayName": "Kadıköy, İstanbul, ...", "lat": 40.99, "lng": 29.02, ... },
      { "displayName": "Kadınhanı, Konya, ...", "lat": 38.21, "lng": 32.21, ... }
    ]
  }
}`,
      },
    ],
  },
  {
    title: 'Bakım Modu',
    icon: Wrench,
    color: 'bg-amber-100 text-amber-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/maintenance/status',
        desc: 'Herkese açık. Bakım modu açık mı, mesaj, tahmini bitiş zamanı ve iletişim bilgileri. Frontend bu endpointi çağırıp bakım ekranı gösterir. Bakım modu açıkken diğer API endpointleri 503 döner.',
        auth: false,
        response: `{
  "success": true,
  "data": {
    "maintenanceMode": true,
    "maintenanceTitle": "Bakım Çalışması Devam Ediyor",
    "maintenanceMessage": "Daha iyi bir deneyim için güncelliyoruz...",
    "maintenanceEndTime": "2026-09-26T15:00:00.000Z",
    "maintenanceStartedAt": "2026-09-26T12:00:00.000Z",
    "contactEmail": "destek@gunubirlik.com",
    "contactPhone": "+90 850 123 45 67",
    "contactWhatsapp": "https://wa.me/908501234567",
    "contactInstagram": "https://instagram.com/gunubirlik",
    "contactTwitter": "https://twitter.com/gunubirlik",
    "contactWebsite": "https://gunubirlik.com",
    "siteName": "Günübirlik İş Bul"
  }
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/settings',
        desc: 'Admin için mevcut site ayarlarını getirir. Sadece ADMIN rolü.',
        auth: true,
        role: 'ADMIN',
      },
      {
        method: 'PUT',
        path: '/api/v1/admin/settings',
        desc: 'Bakım modu aç/kapa, mesaj, tahmini bitiş zamanı, iletişim bilgileri ve site adını günceller. Bakım modu açıldığında tüm normal kullanıcılar bakım ekranı görür, adminler erişmeye devam eder. Tüm API istekleri (auth/maintenance/admin hariç) 503 döner.',
        auth: true,
        role: 'ADMIN',
        body: `{
  "maintenanceMode": true,
  "maintenanceTitle": "Bakım Çalışması Devam Ediyor",
  "maintenanceMessage": "Daha iyi bir deneyim için güncelliyoruz...",
  "maintenanceEndTime": "2026-09-26T15:00:00.000Z",
  "contactEmail": "destek@gunubirlik.com",
  "contactPhone": "+90 850 123 45 67",
  "contactWhatsapp": "https://wa.me/908501234567",
  "contactInstagram": "https://instagram.com/gunubirlik",
  "contactTwitter": "https://twitter.com/gunubirlik",
  "contactWebsite": "https://gunubirlik.com",
  "siteName": "Günübirlik İş Bul"
}`,
        response: `{
  "success": true,
  "data": { ...updated settings },
  "message": "Site ayarları güncellendi."
}`,
      },
    ],
  },
  {
    title: 'Yardım & Destek',
    icon: LifeBuoy,
    color: 'bg-cyan-100 text-cyan-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/support/tickets',
        desc: 'Kullanıcının destek taleplerini listeler.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/v1/support/tickets',
        desc: 'Yeni destek talebi oluştur (şikayet, öneri, bug, hesap, ödeme, diğer). Adminlere bildirim gönderilir.',
        auth: true,
        body: `{
  "category": "COMPLAINT",
  "subject": "Şikayet konusu",
  "message": "Detaylı açıklama",
  "priority": "NORMAL"
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/auth/delete-account',
        desc: 'Hesap silme talebinin durumunu getirir.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/delete-account',
        desc: 'Hesap silme talebi oluştur. Admin onayı sonrası hesap ve tüm verileri silinir (cascade).',
        auth: true,
        body: `{
  "reason": "Artık kullanmıyorum",
  "feedback": "İyi uygulama ama ihtiyacım kalmadı"
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/support/tickets',
        desc: 'Admin: Tüm destek taleplerini listeler (filtreli).',
        auth: true,
        role: 'ADMIN',
        query: `status=ALL|OPEN|RESOLVED|CLOSED&category=ALL&page=1`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/support/tickets/{id}/reply',
        desc: 'Admin: Destek talebini yanıtla. Talep RESOLVED durumuna geçer, kullanıcıya bildirim gönderilir.',
        auth: true,
        role: 'ADMIN',
        body: `{ "reply": "Yanıt metniniz" }`,
      },
    ],
  },
  {
    title: 'Broadcast (Toplu Bildirim)',
    icon: Megaphone,
    color: 'bg-purple-100 text-purple-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/admin/broadcast',
        desc: 'Admin: Tüm broadcastları listeler.',
        auth: true,
        role: 'ADMIN',
      },
      {
        method: 'POST',
        path: '/api/v1/admin/broadcast',
        desc: 'Admin: Yeni broadcast oluştur (DRAFT). HTML içerik, hedef kitle, push/email kanal seçimi. Şablon olarak kaydedilebilir.',
        auth: true,
        role: 'ADMIN',
        body: `{
  "title": "🚀 Yeni Güncelleme!",
  "message": "Kısa push mesajı",
  "htmlContent": "<h1>HTML mail içeriği</h1>",
  "type": "UPDATE",
  "target": "ALL",
  "sendPush": true,
  "sendEmail": true,
  "isTemplate": false
}`,
      },
      {
        method: 'POST',
        path: '/api/v1/admin/broadcast/{id}/send',
        desc: 'Admin: Broadcastı gönder. Tüm bildirim kanallarına paralel olarak iletilir: (1) DB — in-app bildirim, (2) WebSocket — online kullanıcılara anlık toast, (3) OneSignal Push — offline kullanıcılara native push, (4) Email — Resend ile gerçek e-posta. channels objesi her kanaldan kaç kişiye ulaştığını gösterir.',
        auth: true,
        role: 'ADMIN',
        response: `{
  "success": true,
  "data": {
    "sentCount": 150,
    "channels": {
      "db": 150,       // In-app bildirim (herkes)
      "ws": 23,        // WebSocket ile anlık toast (online olanlar)
      "push": 150,     // OneSignal native push (offline cihazlar)
      "email": 145     // Resend email (geçerli e-postası olanlar)
    }
  },
  "message": "Broadcast gönderildi! 150 kişiye ulaştı."
}`,
      },
      {
        method: 'GET',
        path: '/api/v1/admin/broadcast/templates',
        desc: 'Admin: Şablon olarak kaydedilmiş broadcastları listeler.',
        auth: true,
        role: 'ADMIN',
      },
    ],
  },
  {
    title: 'Hesap Silme (Admin)',
    icon: Trash2,
    color: 'bg-red-100 text-red-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/admin/account-deletions',
        desc: 'Admin: Tüm hesap silme taleplerini listeler.',
        auth: true,
        role: 'ADMIN',
      },
      {
        method: 'POST',
        path: '/api/v1/admin/account-deletions/{id}/approve',
        desc: 'Admin: Hesap silme talebini onayla. Kullanıcı ve tüm verileri cascade ile silinir. Geri alınamaz!',
        auth: true,
        role: 'ADMIN',
      },
      {
        method: 'POST',
        path: '/api/v1/admin/account-deletions/{id}/reject',
        desc: 'Admin: Hesap silme talebini reddet. Kullanıcıya ret gerekçesi bildirilir.',
        auth: true,
        role: 'ADMIN',
        body: `{ "note": "Geçerli sebep yok" }`,
      },
    ],
  },
  {
    title: 'Sistem',
    icon: Zap,
    color: 'bg-gray-100 text-gray-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/health',
        desc: 'Sistem sağlık kontrolü.',
        auth: false,
        response: `{ "success": true, "data": { "status": "ok", "timestamp": "..." } }`,
      },
    ],
  },
]

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700 border-blue-300',
  POST: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  PUT: 'bg-amber-100 text-amber-700 border-amber-300',
  PATCH: 'bg-purple-100 text-purple-700 border-purple-300',
  DELETE: 'bg-red-100 text-red-700 border-red-300',
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Kopyalandı!')
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </Button>
  )
}

function CodeBlock({ code }: { code: string }) {
  if (!code) return null
  return (
    <div className="relative mt-2">
      <div className="absolute top-2 right-2 z-10">
        <CopyButton text={code} />
      </div>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto max-h-80">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function ApiDocsClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">API Dokümantasyonu</h1>
              <p className="text-white/80 text-sm mt-1">
                Günübirlik İş Bul platformu — REST API ve WebSocket referansı
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-xl md:text-2xl font-bold">/api/v1</div>
              <div className="text-xs text-white/70">Base URL</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-xl md:text-2xl font-bold">JWT</div>
              <div className="text-xs text-white/70">Auth</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-xl md:text-2xl font-bold">REST</div>
              <div className="text-xs text-white/70">+ WebSocket</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <div className="text-xl md:text-2xl font-bold">JSON</div>
              <div className="text-xs text-white/70">Response</div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 text-sm">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4" />
              Ana Sayfaya Dön
            </a>
            <a
              href="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-lg transition-colors"
            >
              <Shield className="w-4 h-4" />
              Yönetim Paneli
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Tabs defaultValue="rest" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-auto">
            <TabsTrigger value="rest" className="text-sm py-2">REST API</TabsTrigger>
            <TabsTrigger value="websocket" className="text-sm py-2">WebSocket</TabsTrigger>
          </TabsList>

          {/* REST API Tab */}
          <TabsContent value="rest" className="space-y-4">
            {/* Auth info */}
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Kimlik Doğrulama
                </h3>
                <p className="text-sm text-emerald-800 mb-2">
                  Tüm korumalı endpointler JWT token gerektirir. Tokenı iki şekilde gönderin:
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <div className="text-xs font-semibold text-emerald-900 mb-1">Web (Cookie)</div>
                    <code className="block bg-white rounded p-2 text-xs text-emerald-700 break-all">
                      Cookie: auth_token=eyJ...
                    </code>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-900 mb-1">Mobil (Bearer)</div>
                    <code className="block bg-white rounded p-2 text-xs text-emerald-700 break-all">
                      Authorization: Bearer eyJ...
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Moderasyon bilgisi */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Otomatik Moderasyon Sistemi
                </h3>
                <p className="text-sm text-amber-800 mb-2">
                  Mesajlaşma endpointlerinde (POST /conversations) içerik otomatik olarak filtrelenir:
                </p>
                <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
                  <li><strong>Küfür:</strong> TR + EN, leetspeak ile birlikte (HIGH severity)</li>
                  <li><strong>Telefon:</strong> +90 5xx, 0 5xx, sabit hat (LOW)</li>
                  <li><strong>E-posta:</strong> Tüm formatlar (LOW)</li>
                  <li><strong>URL / Sosyal Medya:</strong> wa.me, instagram.com, @handle (LOW)</li>
                  <li><strong>IBAN:</strong> TR99 ... formatı (LOW)</li>
                  <li><strong>Adres:</strong> Mah/Cad/Sokak ifadeleri (LOW)</li>
                  <li><strong>Tehdit:</strong> Otomatik mesaj engelleme (CRITICAL)</li>
                </ul>
                <p className="text-sm text-amber-800 mt-2">
                  <strong>Otomatik yaptırım:</strong> 5 LOW = 24s, 3 MEDIUM = 24s, 2 HIGH = 7g, 1 CRITICAL = 30g, 20+ toplam = ban incelemesi.
                </p>
              </CardContent>
            </Card>

            {/* Ödeme akışı */}
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Ödeme Akışı
                </h3>
                <ol className="text-sm text-emerald-800 space-y-1 ml-4 list-decimal">
                  <li>İşveren işi <code className="bg-white px-1 rounded">COMPLETED</code> yapar → otomatik <code className="bg-white px-1 rounded">PENDING</code> ödeme oluşur</li>
                  <li>Admin <code className="bg-white px-1 rounded">APPROVED</code> veya <code className="bg-white px-1 rounded">REJECTED</code> yapar</li>
                  <li>İşveren ödemeyi <code className="bg-white px-1 rounded">PAID</code> (ödendi) işaretler</li>
                  <li>İşçi <code className="bg-white px-1 rounded">RECEIVED</code> (aldı) onaylar → kapanır</li>
                  <li>İtiraz durumunda <code className="bg-white px-1 rounded">DISPUTED</code> → admin çözümler</li>
                </ol>
              </CardContent>
            </Card>

            {/* İş onayı akışı */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  İş İlanı Onay Akışı
                </h3>
                <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                  <li>İşveren ilan oluşturur</li>
                  <li>Onaylı işveren ise → anında <code className="bg-white px-1 rounded">APPROVED</code> (yayında)</li>
                  <li>Değilse → <code className="bg-white px-1 rounded">PENDING</code> (admin onayı bekler)</li>
                  <li>Admin onaylar (<code className="bg-white px-1 rounded">APPROVED</code>) veya reddeder (<code className="bg-white px-1 rounded">REJECTED</code>)</li>
                </ol>
              </CardContent>
            </Card>

            {/* Konum entegrasyonu */}
            <Card className="border-cyan-200 bg-cyan-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Konum Entegrasyonu ("Konum Al" Butonu)
                </h3>
                <p className="text-sm text-cyan-800 mb-2">
                  "Konum Al" butonuna basıldığında tarayıcı/mobil GPS'ten alınan koordinatlar
                  reverse geocoding API'sine gönderilir ve mahalle, ilçe, şehir, sokak, posta kodu bilgisi alınır:
                </p>
                <ol className="text-sm text-cyan-800 space-y-1 ml-4 list-decimal mb-3">
                  <li>İstemci <code className="bg-white px-1 rounded">navigator.geolocation.getCurrentPosition()</code> çağırır (web) veya <code className="bg-white px-1 rounded">expo-location</code> (mobil)</li>
                  <li>Alınan <code className="bg-white px-1 rounded">lat</code> ve <code className="bg-white px-1 rounded">lng</code> ile <code className="bg-white px-1 rounded">GET /api/v1/geocode/reverse</code> çağrılır</li>
                  <li>Dönen adres bilgisi (mahalle, ilçe, şehir) forma otomatik doldurulur</li>
                </ol>
                <p className="text-xs text-cyan-700 mb-2">
                  <strong>Web örneği (JavaScript):</strong>
                </p>
                <CodeBlock code={`// "Konum Al" butonu onclick
async function konumAl() {
  // 1. Tarayıcı GPS'ini kullan
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords

    // 2. Reverse geocoding API'sine gönder
    const res = await fetch(
      \`/api/v1/geocode/reverse?lat=\${latitude}&lng=\${longitude}\`
    )
    const data = await res.json()

    if (data.success) {
      // 3. Forma doldur
      const loc = data.data
      document.getElementById('city').value = loc.city || ''
      document.getElementById('district').value = loc.district || ''
      document.getElementById('neighbourhood').value = loc.neighbourhood || ''
      document.getElementById('street').value = loc.street || ''
      document.getElementById('postcode').value = loc.postcode || ''
    }
  }, (err) => {
    alert('Konum alınamadı: ' + err.message)
  }, { enableHighAccuracy: true, timeout: 10000 })
}`} />
                <p className="text-xs text-cyan-700 mt-3 mb-2">
                  <strong>Mobil örneği (React Native + expo-location):</strong>
                </p>
                <CodeBlock code={`// hooks/useCurrentLocation.ts
import * as Location from 'expo-location'
import { useState } from 'react'

export function useCurrentLocation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getCurrent = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. İzin iste
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') throw new Error('Konum izni reddedildi')

      // 2. Konumu al
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      // 3. Reverse geocoding
      const res = await fetch(
        \`https://your-domain.com/api/v1/geocode/reverse?lat=\${loc.coords.latitude}&lng=\${loc.coords.longitude}\`
      )
      const data = await res.json()

      if (data.success) {
        return data.data  // { city, district, neighbourhood, street, postcode, ... }
      }
      throw new Error('Adres çözümlenemedi')
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { getCurrent, loading, error }
}

// Kullanım:
// const { getCurrent, loading } = useCurrentLocation()
// <Button onPress={async () => {
//   const loc = await getCurrent()
//   if (loc) {
//     setForm({ city: loc.city, district: loc.district, ... })
//   }
// }}>`} />
                <p className="text-xs text-cyan-700 mt-3">
                  <strong>Adres arama (autocomplete) için:</strong> Kullanıcı yazdıkça <code className="bg-white px-1 rounded">GET /api/v1/geocode/suggest?q=...</code> çağrılır, dönen öneriler dropdown'da gösterilir. Seçilen öğenin <code className="bg-white px-1 rounded">lat</code>/<code className="bg-white px-1 rounded">lng</code> değeri forma yazılır.
                </p>
              </CardContent>
            </Card>

            {/* QR ile işe başlama */}
            <Card className="border-cyan-200 bg-cyan-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-cyan-900 mb-2 flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  QR ile İşe Başlama (Check-in / Check-out)
                </h3>
                <p className="text-sm text-cyan-800 mb-2">
                  İşveren işçiyi kabul ettikten sonra, iş günü geldiğinde QR ile işe başlatır ve bitirir.
                  Bu sistem sahtekarlığı önler — sadece fiziksel olarak iş yerinde olan kişi QR'ı tarayabilir.
                </p>
                <ol className="text-sm text-cyan-800 space-y-1 ml-4 list-decimal mb-3">
                  <li>İşveren applicationı <code className="bg-white px-1 rounded">ACCEPTED</code> yapar (zaten var)</li>
                  <li>İş günü geldiğinde işveren <code className="bg-white px-1 rounded">POST /api/v1/applications/{`{id}`}/qr-code</code> ile <code className="bg-white px-1 rounded">CHECK_IN</code> QR üretir</li>
                  <li>İşçi kendi telefonunda QR tarayıcı ile QR'ı tarar (veya işveren işçinin ekranında QR gösterir)</li>
                  <li>İşçi <code className="bg-white px-1 rounded">POST /api/v1/qr/scan</code> çağırır → application <code className="bg-white px-1 rounded">IN_PROGRESS</code> olur</li>
                  <li>İş bitiminde işveren <code className="bg-white px-1 rounded">CHECK_OUT</code> QR üretir, işçi tarar</li>
                  <li>application <code className="bg-white px-1 rounded">COMPLETED</code> olur + otomatik <code className="bg-white px-1 rounded">PENDING</code> ödeme talebi oluşur</li>
                  <li>Admin ödeme talebini onaylar → işveren öder → işçi alır</li>
                </ol>
                <p className="text-xs text-cyan-700 mb-2">
                  <strong>Web örneği (İşveren QR üretir ve gösterir):</strong>
                </p>
                <CodeBlock code={`// Employer: "Check-in QR Üret" butonu
async function generateCheckInQr(applicationId: string) {
  const res = await fetch(\`/api/v1/applications/\${applicationId}/qr-code\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`  // veya cookie
    },
    body: JSON.stringify({ type: 'CHECK_IN' })
  })
  const data = await res.json()

  if (data.success) {
    // QR görselini göster (5 dakika geçerli)
    const img = document.getElementById('qr-image') as HTMLImageElement
    img.src = data.data.qrImageDataUrl

    // Geri sayım başlat
    startCountdown(data.data.expiresAt)
  }
}`} />
                <p className="text-xs text-cyan-700 mt-3 mb-2">
                  <strong>Web örneği (İşçi QR tarar — kamera ile):</strong>
                </p>
                <CodeBlock code={`// Worker: Kamerayı aç, QR tara
import { Html5Qrcode } from 'html5-qrcode'

async function startScanning() {
  const scanner = new Html5Qrcode('qr-reader')
  await scanner.start(
    { facingMode: 'environment' },  // arka kamera
    { fps: 10, qrbox: { width: 250, height: 250 } },
    async (decodedText) => {
      // QR bulundu!
      scanner.stop()

      // QR içeriği JSON: { type, token, applicationId, expiresAt }
      const payload = JSON.parse(decodedText)

      // Backend'e gönder
      const res = await fetch('/api/v1/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ token: payload.token })
      })
      const data = await res.json()

      if (data.success) {
        alert(data.data.message)
        // "İşe başladınız: İnşaat İşçisi"
      } else {
        alert(data.error)
      }
    },
    (err) => console.warn('Tarama hatası:', err)
  )
}`} />
                <p className="text-xs text-cyan-700 mt-3 mb-2">
                  <strong>Mobil örneği (React Native +expo-camera):</strong>
                </p>
                <CodeBlock code={`// Mobilde işveren QR üretir
async function generateQr(applicationId: string, type: 'CHECK_IN' | 'CHECK_OUT') {
  const res = await fetch(\`https://your-domain.com/api/v1/applications/\${applicationId}/qr-code\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify({ type })
  })
  const data = await res.json()
  if (data.success) {
    // qrImageDataUrl'i <Image source={{ uri: data.data.qrImageDataUrl }} /> ile göster
    setQrImage(data.data.qrImageDataUrl)
    setExpiresAt(data.data.expiresAt)
  }
}

// Mobilde işçi kamera ile tarar (expo-camera + barcodescanner)
import { CameraView, useCameraPermissions } from 'expo-camera'

function QrScanner() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true)
    try {
      const payload = JSON.parse(data)
      const res = await fetch('https://your-domain.com/api/v1/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ token: payload.token })
      })
      const result = await res.json()
      if (result.success) {
        Alert.alert('Başarılı', result.data.message)
        navigation.goBack()
      } else {
        Alert.alert('Hata', result.error)
        setScanned(false)
      }
    } catch (e) {
      Alert.alert('Hata', 'Geçersiz QR kodu')
      setScanned(false)
    }
  }

  if (!permission?.granted) {
    return <Button title="Kamera İzni Ver" onPress={requestPermission} />
  }

  return (
    <CameraView
      onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
    />
  )
}`} />
                <p className="text-xs text-cyan-700 mt-3">
                  <strong>QR güvenlik notları:</strong> Her QR 5 dakika geçerli, tek kullanımlık. Token <code className="bg-white px-1 rounded">crypto.randomBytes(32)</code> ile üretilir. Aynı application için yeni QR üretildiğinde eskiler otomatik expire olur. Sadece ilgili işçi veya işveren tarayabilir.
                </p>
              </CardContent>
            </Card>

            {/* Değerlendirme & Doğrulama Rozetleri */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Değerlendirme & Doğrulama Rozetleri
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Platformda iki güven/sinyal mekanizması vardır: <strong>yıldız puanı</strong> (iş bitiminde
                  karşılıklı verilir) ve <strong>mavi onay rozeti</strong> (admin belge incelemesi sonrası verilir).
                  Bir kullanıcı profilinde her ikisi de görünür — puan iş kalitesini, rozet ise kimlik/şirket
                  doğruluğunu gösterir.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div className="bg-white rounded-lg p-3 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                      <strong className="text-yellow-900 text-sm">Yıldız Puanı (1-5)</strong>
                    </div>
                    <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                      <li>Sadece <code className="bg-yellow-100 px-1 rounded">COMPLETED</code> başvurularda verilir</li>
                      <li>İşçi işvereni, işveren işçiyi puanlar</li>
                      <li>Aynı başvuru iki kez puanlanamaz</li>
                      <li><code className="bg-yellow-100 px-1 rounded">ratingAvg</code> + <code className="bg-yellow-100 px-1 rounded">ratingCount</code> otomatik güncellenir</li>
                      <li>Reddetme/iptal durumunda puan verilemez</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <BadgeCheck className="w-4 h-4 text-blue-500" />
                      <strong className="text-blue-900 text-sm">Mavi Onay Rozeti</strong>
                    </div>
                    <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                      <li>3 belge türü: <code className="bg-blue-100 px-1 rounded">COMPANY</code>, <code className="bg-blue-100 px-1 rounded">IDENTITY</code>, <code className="bg-blue-100 px-1 rounded">TAX</code></li>
                      <li>İşveren belgeyi yükler, admin inceler</li>
                      <li>Onay: <code className="bg-blue-100 px-1 rounded">isVerified=true</code> + bildirim</li>
                      <li>Red: gerekçe ile birlikte kullanıcya iletilir</li>
                      <li>Tek kullanıcıda aynı anda en fazla 1 PENDING talep</li>
                    </ul>
                  </div>
                </div>

                <p className="text-xs text-yellow-700 mb-2">
                  <strong>Puanlama akışı (Web örneği — iş bitiminde puanlama ekranı):</strong>
                </p>
                <CodeBlock code={`// applications.service.ts > rate() çağrısı
// Frontend: "İş Tamamlandı" ekranında yıldız seçici + yorum kutusu

async function rateApplication(applicationId: string, rating: number, comment?: string) {
  const res = await fetch(\`/api/v1/applications/\${applicationId}/rate\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify({ rating, comment })
  })
  const data = await res.json()

  if (data.success) {
    // ratingAvg ve ratingCount otomatik güncellendi
    // Backend reviewType'ı role'e göre belirler (WORKER_TO_EMPLOYER veya EMPLOYER_TO_WORKER)
    toast.success('Değerlendirmeniz kaydedildi')
  } else {
    toast.error(data.error)
    // Olası hatalar:
    //   "Sadece tamamlanmış işler puanlanabilir."
    //   "Bu başvuru zaten puanlanmış."
    //   "Bu işlem için yetkiniz yok."
  }
}

// Yıldız seçici (örnek)
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-3xl"
        >
          {(hover || value) >= star ? '★' : '☆'}
        </button>
      ))}
    </div>
  )
}`} />

                <p className="text-xs text-yellow-700 mt-3 mb-2">
                  <strong>Profil sayfasında değerlendirmeleri gösterme:</strong>
                </p>
                <CodeBlock code={`// Kullanıcı profil sayfası — herkese açık
async function loadUserReviews(userId: string) {
  const res = await fetch(\`/api/v1/users/\${userId}/reviews?page=1&pageSize=10\`)
  const data = await res.json()

  if (data.success) {
    const { items, pagination, distribution } = data.data

    // Yıldız dağılımı (1-5) — sağ tarafta göster
    // distribution = { "1": 0, "2": 1, "3": 1, "4": 3, "5": 9 }

    // Yorum kartları
    items.forEach((review) => {
      console.log(\`\${review.reviewer.fullName}: \${review.rating}★ — \${review.comment}\`)
      console.log(\`İş: \${review.job.title} (\${review.job.city})\`)
    })
  }
}

// Puan özeti kutusu (profil üst kısmı)
async function loadRatingSummary(userId: string) {
  const res = await fetch(\`/api/v1/users/\${userId}/rating-summary\`)
  const data = await res.json()
  if (data.success) {
    const s = data.data
    // s.ratingAvg       -> 4.6
    // s.ratingCount     -> 14
    // s.recent30Days    -> { avg: 4.8, count: 5 }  (son 30 gün trendi)
    // s.distribution    -> { "1": 0, "2": 1, "3": 1, "4": 3, "5": 9 }
    // s.user.isVerified -> true/false (mavi rozet için)
  }
}`} />

                <p className="text-xs text-blue-700 mt-3 mb-2">
                  <strong>Doğrulama talebi gönderme (İşveren — belge yükleme):</strong>
                </p>
                <CodeBlock code={`// "Hesabım > Doğrulama" sayfası
// 1. Kullanıcı dosya seçer (input type=file)
// 2. Dosyayı base64'e çevir
// 3. Backend'e gönder

async function uploadVerificationDocument(file: File, type: 'COMPANY' | 'IDENTITY' | 'TAX') {
  // 1. Dosyayı base64'e çevir
  const reader = new FileReader()
  const documentUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  // 2. Backend'e gönder
  const res = await fetch('/api/v1/users/me/verification-request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${token}\`
    },
    body: JSON.stringify({
      type,                       // COMPANY, IDENTITY veya TAX
      documentUrl,                // data:image/png;base64,...
      documentNote: '2024 vergi levhası'
    })
  })
  const data = await res.json()

  if (data.success) {
    toast.success('Talebiniz alındı, admin onayı bekleniyor')
    // Status PENDING — /admin/verifications sayfasında görünecek
  } else {
    toast.error(data.error)
    // Olası hatalar:
    //   "Hesabınız zaten doğrulanmış. Yeni talebe gerek yok."
    //   "Zaten bekleyen bir doğrulama talebiniz var."
    //   "Geçersiz doğrulama türü. COMPANY, IDENTITY veya TAX olmalı."
  }
}

// Aktif durumu poll et (profil sayfası açıldığında)
async function checkVerificationStatus() {
  const res = await fetch('/api/v1/users/me/verification-status', {
    headers: { 'Authorization': \`Bearer \${token}\` }
  })
  const data = await res.json()
  if (data.success) {
    const s = data.data
    // s.isVerified       -> true (mavi rozeti göster)
    // s.pendingRequest   -> { ... } (PENDING varsa "İnceleniyor" rozeti)
    // s.lastDecision     -> { status: 'REJECTED', reviewNote: 'Belge okunmuyor...' }
  }
}`} />

                <p className="text-xs text-yellow-700 mt-3">
                  <strong>Güven/sinyal notları:</strong> Yıldız puanı silinemez (sadece admin moderation ile).
                  Puan güncellenemez — sadece tek seferlik. Mavi onay rozeti kalıcıdır (admin manuel kaldırana kadar).
                  <code className="bg-white px-1 rounded mx-1">isVerified</code> alanı
                  <code className="bg-white px-1 rounded mx-1">GET /api/v1/users/[id]</code> endpointinde de döner
                  ve frontend header'da / profil kartında rozet olarak gösterilir.
                </p>
              </CardContent>
            </Card>

            {/* Bildirim Kanalları */}
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Bildirim Kanalları (4 Katmanlı Push Sistemi)
                </h3>
                <p className="text-sm text-orange-800 mb-3">
                  Her bildirim (broadcast, iş başvurusu, mesaj, ödeme, sistem güncellemesi) <strong>4 kanala paralel</strong> olarak iletilir.
                  Bir kullanıcı mesajı "sadece uygulama içinde" görür diye bir şey yoktur — online ise anlık toast alır,
                  offline ise cihazına native push gelir, ayrıca e-posta da gönderilir.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🗄️</span>
                      <strong className="text-orange-900 text-sm">1. DB (In-App)</strong>
                    </div>
                    <p className="text-xs text-orange-700">
                      Bildirimler tablosuna kaydedilir. "Bildirimler" sayfasında görüntülenir. Kullanıcı giriş yaptığında tüm geçmiş bildirimleri görür.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">⚡</span>
                      <strong className="text-purple-900 text-sm">2. WebSocket</strong>
                    </div>
                    <p className="text-xs text-purple-700">
                      Online kullanıcılara <code className="bg-purple-100 px-1 rounded">notification:new</code> event'i olarak anlık iletilir. Frontend toast olarak gösterir. Offline kullanıcıya iletilmez (DB'de zaten durur).
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📱</span>
                      <strong className="text-blue-900 text-sm">3. OneSignal Push</strong>
                    </div>
                    <p className="text-xs text-blue-700">
                      Native cihaz bildirimi (mobile + web push). Kullanıcı uygulamayı kapatsa bile cihazına düşer. <code className="bg-blue-100 px-1 rounded">ONESIGNAL_REST_API_KEY</code> env var gerekli.
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-emerald-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📧</span>
                      <strong className="text-emerald-900 text-sm">4. E-posta (OneSignal)</strong>
                    </div>
                    <p className="text-xs text-emerald-700">
                      OneSignal Email API ile toplu e-posta. Broadcast ve önemli olaylar (hesap askıya alma, ödeme onayı vb.) için gönderilir. Push ile aynı <code className="bg-emerald-100 px-1 rounded">ONESIGNAL_REST_API_KEY</code> kullanılır — <code className="bg-emerald-100 px-1 rounded">include_email_tokens</code> ile alıcılar belirtilir.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-orange-700 mb-2">
                  <strong>Mimari:</strong> Next.js API (port 3000) ↔ Internal HTTP (port 3005) ↔ WebSocket Server (port 3004)
                </p>
                <CodeBlock code={`┌─────────────────────┐
│  Next.js API (3000) │  createNotification() çağrılır
└──────────┬──────────┘
           │
           ├──→ 1. DB'ye kaydet (Prisma)
           │
           ├──→ 2. POST http://localhost:3005/internal/notify
           │       │
           │       ▼
           │    ┌─────────────────────┐
           │    │  Internal HTTP (3005)│  WS server'a ilet
           │    └──────────┬──────────┘
           │                │
           │                ▼
           │    ┌─────────────────────┐
           │    │  Socket.io (3004)    │  onlineUsers.get(userId)
           │    │  → emit              │  → socket.emit('notification:new')
           │    └─────────────────────┘
           │
           ├──→ 3. OneSignal REST API
           │       POST https://onesignal.com/api/v1/notifications
           │       filters: [{ tag: 'user_id', relation: '=', value: userId }]  (push)
           │       include_email_tokens: ['user1@email.com', ...]              (email)
           │
           └──→ 4. OneSignal Email API (broadcast ve önemli olaylar)
                   POST https://onesignal.com/api/v1/notifications
                   app_id + include_email_tokens + email_subject + email_body`} />

                <p className="text-xs text-orange-700 mt-3 mb-2">
                  <strong>Frontend dinleyicisi (notification:new event):</strong>
                </p>
                <CodeBlock code={`// src/app/page.tsx — uygulama açıldığında WebSocket bağlanır
import { connectSocket, on } from '@/lib/socket'

useEffect(() => {
  if (!token) return
  if (!getSocket()?.connected) connectSocket(token)

  // Bildirim geldiğinde anlık toast göster
  const off = on('notification:new', (data) => {
    toast(data.title, {
      description: data.body,
      icon: <Bell className="w-4 h-4" />,
      duration: 5000,
    })
    
    // Opsiyonel: bildirim sayısını artır, ses çal, badge güncelle
    setUnreadCount(prev => prev + 1)
  })

  return () => off?.()
}, [token])

// data yapısı:
// {
//   id: 'notif_...',
//   userId: 'cmu...',
//   type: 'APPLICATION_ACCEPTED' | 'NEW_MESSAGE' | 'SYSTEM_UPDATE' | ...,
//   title: 'Başvurunuz Onaylandı!',
//   body: 'İnşaat İşçisi ilanına başvurunuz onaylandı.',
//   data: { applicationId, jobId, ... },
//   timestamp: 1695900000000
// }`} />

                <p className="text-xs text-orange-700 mt-3 mb-2">
                  <strong>Broadcast gönderme akışı (admin paneli):</strong>
                </p>
                <CodeBlock code={`// Admin → /admin/broadcast sayfası
// 1. Broadcast oluştur (DRAFT)
const broadcast = await fetch('/api/v1/admin/broadcast', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Yeni Özellik Duyurusu',
    message: 'Uygulamamıza QR ile işe başlama özelliği eklendi!',
    htmlContent: '<h2>Yeni Özellik!</h2><p>QR ile işe başlama...</p>',
    type: 'SYSTEM_UPDATE',
    target: 'ALL',           // ALL | WORKERS | EMPLOYERS | SPECIFIC
    sendPush: true,          // DB + WS + OneSignal Push
    sendEmail: true,         // Resend ile email
    // targetUserIds: ['id1', 'id2']  // target=SPECIFIC ise gerekli
  })
})

// 2. Broadcast gönder (tüm kanallara paralel)
const result = await fetch(\`/api/v1/admin/broadcast/\${broadcast.data.id}/send\`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + adminToken }
})

// result.data.channels:
// {
//   db: 150,        // 150 kullanıcıya DB'ye kaydedildi
//   ws: 23,         // 23 online kullanıcıya anlık toast
//   push: 150,      // 150 kullanıcıya OneSignal push
//   email: 145      // 145 e-posta (OneSignal Email ile, 5 kullanıcıda e-posta yok)
// }`} />

                <p className="text-xs text-orange-700 mt-3">
                  <strong>Gerekli env var'lar:</strong>
                  <ul className="ml-4 mt-1 space-y-1 list-disc">
                    <li><code className="bg-white px-1 rounded">ONESIGNAL_REST_API_KEY</code> — OneSignal push + email için (yoksa her ikisi de atlanır, sadece DB+WS)</li>
                    <li><code className="bg-white px-1 rounded">ONESIGNAL_APP_ID</code> — OneSignal app ID (kodda hardcoded: <code className="bg-white px-1 rounded">6bddc78e-79e7-4701-9e46-6fca772e402a</code>)</li>
                    <li><code className="bg-white px-1 rounded">INTERNAL_API_KEY</code> — Next.js ↔ WS server arası shared secret (default: <code className="bg-white px-1 rounded">gunubirlik_internal_2024</code>)</li>
                    <li><code className="bg-white px-1 rounded">WS_INTERNAL_URL</code> — WS server internal HTTP URL (default: <code className="bg-white px-1 rounded">http://localhost:3005</code>)</li>
                  </ul>
                </p>
                <p className="text-xs text-orange-700 mt-3">
                  <strong>WS Server başlatma:</strong> <code className="bg-white px-1 rounded">npx tsx mini-services/job-realtime/index.ts</code> — Socket.io (3004) + Internal HTTP (3005) aynı process'te çalışır.
                </p>

                <div className="mt-5 p-4 bg-white rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    Mobil Push Kurulumu (React Native / Expo)
                  </h4>
                  <p className="text-xs text-purple-800 mb-3">
                    Push bildirimleri mobil cihazlara gitmesi için mobil uygulamanın OneSignal'a subscribe olması gerekir.
                    Backend push gönderir ama <strong>cihaz kayıtlı değilse "All included players are not subscribed"</strong> hatası alırsınız.
                    Aşağıdaki adımları izleyerek mobil uygulamayı OneSignal'a bağlayın.
                  </p>

                  <p className="text-xs text-purple-700 mb-1 mt-3"><strong>1. Paket yükle:</strong></p>
                  <CodeBlock code={`# React Native / Expo
npm install react-native-onesignal

# Expo managed workflow — app.config.js'a plugin ekle
# (aşağıdaki 2. adımda gösteriliyor)`} />

                  <p className="text-xs text-purple-700 mb-1 mt-3"><strong>2. app.config.js (Expo) — OneSignal plugin ekle:</strong></p>
                  <CodeBlock code={`// app.config.js
export default {
  expo: {
    name: "Günübirlik İş Bul",
    slug: "gunubirlik-is-bul",
    plugins: [
      [
        "react-native-onesignal",
        {
          mode: "production",
          devAppId: "6bddc78e-79e7-4701-9e46-6fca772e402a",
        },
      ],
    ],
    // iOS push notification entitlement
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gunubirlik.app",
      // EAS Build otomatik push capability ekler
    },
    android: {
      package: "com.gunubirlik.app",
      googleServicesFile: "./google-services.json",
      // FCM gereklidir — Firebase Console'dan alın
    },
  },
};`} />

                  <p className="text-xs text-purple-700 mb-1 mt-3"><strong>3. Firebase Console kurulumu (Android için):</strong></p>
                  <ul className="text-xs text-purple-700 ml-4 list-disc space-y-1 mb-3">
                    <li><a href="https://console.firebase.google.com" className="text-purple-600 underline" target="_blank">console.firebase.google.com</a>'da proje aç</li>
                    <li>Android app ekle → package name: <code className="bg-purple-100 px-1 rounded">com.gunubirlik.app</code></li>
                    <li><code className="bg-purple-100 px-1 rounded">google-services.json</code> indir, proje köküne koy</li>
                    <li>OneSignal Dashboard → Settings → Google Android → Server API Key + Sender ID yapıştır</li>
                  </ul>

                  <p className="text-xs text-purple-700 mb-1 mt-3"><strong>4. iOS APNs kurulumu (iOS için):</strong></p>
                  <ul className="text-xs text-purple-700 ml-4 list-disc space-y-1 mb-3">
                    <li>Apple Developer Console → Identifiers → App ID → Push Notifications capability</li>
                    <li>Auth Key (p8) oluştur → OneSignal Dashboard → Settings → Apple iOS → upload</li>
                    <li>Bundle ID: <code className="bg-purple-100 px-1 rounded">com.gunubirlik.app</code></li>
                  </ul>

                  <p className="text-xs text-purple-700 mb-1 mt-3"><strong>5. App.tsx — OneSignal initialize:</strong></p>
                  <CodeBlock code={`// App.tsx (React Native / Expo)
import { initOneSignal, loginOneSignalUser, logoutOneSignal } from './src/lib/onesignal-mobile'

export default function App() {
  const { user, initialize, isLoading } = useAuthStore()

  useEffect(() => {
    initialize().finally(() => setReady(true))
    // OneSignal'ı başlat — uygulama açıldığında 1 kez
    initOneSignal()
  }, [])

  // Kullanıcı login/logout olduğunda OneSignal'a bildir
  useEffect(() => {
    if (user) {
      loginOneSignalUser(user.id, user.role)
    } else {
      logoutOneSignal()
    }
  }, [user])

  if (isLoading) return <LoadingScreen />

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  )
}`} />

                  <p className="text-xs text-purple-700 mb-1 mt-3"><strong>6. onesignal-mobile.ts — yardımcı fonksiyonlar:</strong></p>
                  <p className="text-xs text-purple-700 mb-1">
                    Bu dosya <code className="bg-purple-100 px-1 rounded">src/lib/onesignal-mobile.ts</code> olarak hazır.
                    İçindeki fonksiyonlar:
                  </p>
                  <ul className="text-xs text-purple-700 ml-4 list-disc space-y-1 mb-3">
                    <li><code className="bg-purple-100 px-1 rounded">initOneSignal()</code> — SDK başlat, click handler ekle</li>
                    <li><code className="bg-purple-100 px-1 rounded">loginOneSignalUser(userId, role)</code> — Kullanıcıyı external_id ile OneSignal'a kaydet</li>
                    <li><code className="bg-purple-100 px-1 rounded">logoutOneSignal()</code> — Kullanıcı çıkış yapınca OneSignal'dan da çık</li>
                    <li><code className="bg-purple-100 px-1 rounded">requestPushPermission()</code> — Push izni iste (iOS zorunlu)</li>
                    <li><code className="bg-purple-100 px-1 rounded">getOneSignalSubscriptionId()</code> — Cihazın subscription ID'si (debug)</li>
                  </ul>

                  <p className="text-xs text-purple-700 mb-1 mt-3"><strong>7. Build alma (önemli!):</strong></p>
                  <CodeBlock code={`# Expo Go ile push ÇALIŞMAZ — EAS Build gereklidir
# Development build (test için):
npx eas build --platform ios --profile development
npx eas build --platform android --profile development

# Production build:
npx eas build --platform ios --profile production
npx eas build --platform android --profile production

# Build indikten sonra cihaza yükle ve test et
# Uygulama açıldığında OneSignal'a otomatik subscribe olur
# Login olunca user_id tag ve external_id set edilir`} />

                  <p className="text-xs text-purple-700 mb-1 mt-3"><strong>8. Test — push çalışıyor mu?</strong></p>
                  <CodeBlock code={`// 1. Mobil uygulamayı cihaza yükle (EAS build)
// 2. Login ol (OneSignal.login(userId) çağrılır)
// 3. Backend'den test bildirimi gönder:

// Admin panel → Broadcast → "Send Push" tickle
// veya API ile:
curl -X POST https://your-domain.com/api/v1/admin/broadcast/{id}/send \\
  -H "Authorization: Bearer {adminToken}"

// 4. Beklenen log (backend):
// [OneSignal] Push gönderildi (external_id): xxx → userId (1 cihaz)

// 5. Eğer hâlâ "Push alıcı yok" hatası alırsanız:
//    - Mobil cihazda OneSignal'a subscribe olunmamış
//    - EAS Build yerine Expo Go kullanıyorsunuz (push çalışmaz)
//    - iOS'da push izni verilmemiş
//    - Android'de google-services.json eksik`} />

                  <p className="text-xs text-purple-700 mt-3 mb-1">
                    <strong>Backend'in push gönderme akışı (2 yöntem):</strong>
                  </p>
                  <ol className="text-xs text-purple-700 ml-4 list-decimal space-y-1">
                    <li><strong>external_id (modern):</strong> <code className="bg-purple-100 px-1 rounded">include_aliases: [{"{ external_id: userId }"}]</code> — Mobil cihazlar <code className="bg-purple-100 px-1 rounded">OneSignal.login(userId)</code> ile set eder</li>
                    <li><strong>tag (fallback):</strong> <code className="bg-purple-100 px-1 rounded">filters: [{"{ tag: 'user_id', value: userId }"}]</code> — Web SDK ve eski mobil kod bu yöntemi kullanır</li>
                  </ol>
                  <p className="text-xs text-purple-700 mt-2">
                    Backend her ikisini de dener — ilkinde başarılı olursa ikinciyi atlar. Bu sayede mobil ve web cihazların ikisi de push alır.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Deep Link */}
            <Card className="border-indigo-200 bg-indigo-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">🔗</span>
                  Deep Link — Push'a Tıklanınca Mobil Uygulamayı Açma
                </h3>
                <p className="text-sm text-indigo-800 mb-3">
                  Backend her push gönderirken <code className="bg-white px-1 rounded">app_url</code> parametresine
                  <code className="bg-white px-1 rounded mx-1">gunubirlik://</code>
                  scheme'ı ile deep link koyar. Mobil uygulama push'a tıklanınca bu linki yakalayıp doğru ekrana gider.
                  Web'de tıklanınca ise <code className="bg-white px-1 rounded">web_url</code> açılır.
                </p>

                <div className="bg-white rounded-lg p-3 border border-indigo-200 mb-3">
                  <p className="text-xs font-semibold text-indigo-900 mb-2">Deep Link Şemaları:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div><code className="bg-indigo-100 px-1 rounded">gunubirlik://notifications</code> → Bildirimler</div>
                    <div><code className="bg-indigo-100 px-1 rounded">gunubirlik://messages</code> → Mesajlar listesi</div>
                    <div><code className="bg-indigo-100 px-1 rounded">gunubirlik://messages/{`{id}`}</code> → Konuşma detayı</div>
                    <div><code className="bg-indigo-100 px-1 rounded">gunubirlik://applications</code> → Başvurular</div>
                    <div><code className="bg-indigo-100 px-1 rounded">gunubirlik://applications/{`{id}`}</code> → Başvuru detayı</div>
                    <div><code className="bg-indigo-100 px-1 rounded">gunubirlik://jobs/{`{id}`}</code> → İlan detayı</div>
                    <div><code className="bg-indigo-100 px-1 rounded">gunubirlik://wallet</code> → Cüzdan</div>
                    <div><code className="bg-indigo-100 px-1 rounded">gunubirlik://verification</code> → Doğrulama</div>
                    <div><code className="bg-indigo-100 px-1 rounded">gunubirlik://profile</code> → Profil</div>
                  </div>
                </div>

                <p className="text-xs text-indigo-700 mb-2"><strong>Backend otomatik oluşturuyor (örnekler):</strong></p>
                <CodeBlock code={`// NEW_MESSAGE tipinde push:
// data: { conversationId: 'conv_123' }
// → app_url: "gunubirlik://messages/conv_123"

// APPLICATION_ACCEPTED:
// data: { applicationId: 'app_456' }
// → app_url: "gunubirlik://applications/app_456"

// PAYMENT_APPROVED:
// data: { paymentId: 'pay_789' }
// → app_url: "gunubirlik://wallet"

// Broadcast (ANNOUNCEMENT):
// data: { broadcastId: 'b_001' }
// → app_url: "gunubirlik://notifications"`} />

                <p className="text-xs text-indigo-700 mt-3 mb-2"><strong>1. app.config.js — URL scheme tanımla:</strong></p>
                <CodeBlock code={`// app.config.js (Expo)
export default {
  expo: {
    scheme: "gunubirlik",  // ← bu satır ekle
    name: "Günübirlik İş Bul",
    // ... diğer config
    plugins: [
      ["react-native-onesignal", { mode: "production", devAppId: "6bddc78e-..." }],
    ],
  },
};`} />

                <p className="text-xs text-indigo-700 mt-3 mb-2"><strong>2. App.tsx — Deep link handler'ı başlat:</strong></p>
                <CodeBlock code={`// App.tsx (React Native / Expo)
import { NavigationContainer } from '@react-navigation/native'
import { initDeepLinking } from './src/lib/deep-link'

export default function App() {
  const navigationRef = useNavigationContainerRef()

  useEffect(() => {
    // Deep link handler'ı başlat — push tıklanınca doğru ekrana gider
    const cleanup = initDeepLinking(navigationRef)
    return cleanup
  }, [])

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  )
}`} />

                <p className="text-xs text-indigo-700 mt-3 mb-2"><strong>3. src/lib/deep-link.ts — hazır dosya:</strong></p>
                <p className="text-xs text-indigo-700 mb-2">
                  Bu dosya projede hazır (<code className="bg-white px-1 rounded">src/lib/deep-link.ts</code>).
                  İçindeki fonksiyonlar:
                </p>
                <ul className="text-xs text-indigo-700 ml-4 list-disc space-y-1 mb-3">
                  <li><code className="bg-indigo-100 px-1 rounded">initDeepLinking(navRef)</code> — Handler'ı başlat, cold start + warm start linklerini yakala</li>
                  <li><code className="bg-indigo-100 px-1 rounded">handleDeepLink(url)</code> — URL'i parse et, doğru ekrana navigate et</li>
                  <li><code className="bg-indigo-100 px-1 rounded">setNavigationRef(ref)</code> — Navigation ref'ini set et</li>
                </ul>

                <p className="text-xs text-indigo-700 mt-3 mb-2"><strong>4. onesignal-mobile.ts — click handler entegre:</strong></p>
                <CodeBlock code={`// src/lib/onesignal-mobile.ts — OneSignal click event
OneSignal.Notifications.addEventListener('click', (event) => {
  const appUrl = event?.notification?.launchURL
  
  // 1. app_url deep link ile başlıyorsa → handleDeepLink çağır
  if (appUrl && appUrl.startsWith('gunubirlik://')) {
    const { handleDeepLink } = require('./deep-link')
    handleDeepLink(appUrl)  // → doğru ekrana navigate
    return
  }
  
  // 2. Fallback: data'dan tip'e göre deep link oluştur
  const data = event?.notification?.additionalData
  if (data?.type) {
    const deepLink = buildDeepLinkFromData(data, data.type)
    handleDeepLink(deepLink)
  }
})`} />

                <p className="text-xs text-indigo-700 mt-3 mb-2"><strong>5. Test akışı:</strong></p>
                <CodeBlock code={`// 1. Mobil uygulama cihazda açık (EAS Build ile yüklenmiş)
// 2. Backend bir bildirim gönderir (örn: yeni mesaj)
//    → createNotification() → OneSignal Push
//    → app_url: "gunubirlik://messages/conv_123"

// 3. Kullanıcı push'a tıklar
// 4. OneSignal app'i foreground'a getirir
// 5. click event tetiklenir → handleDeepLink("gunubirlik://messages/conv_123")
// 6. Expo Linking parse eder → { screen: 'messages', param: 'conv_123' }
// 7. navigationRef.navigate('Conversation', { conversationId: 'conv_123' })
// 8. Konuşma detay ekranı açılır ✓

// Test:
// - Admin panel → Broadcast → Send Push
// - Push cihaza gelir
// - Tıkla → uygulama açılır → Bildirimler ekranına gider`} />

                <p className="text-xs text-indigo-700 mt-3">
                  <strong>Önemli:</strong> Bu sadece mobilde çalışır. Web'de push'a tıklanınca
                  <code className="bg-white px-1 rounded mx-1">web_url</code>
                  açılır (ana sayfa). Deep link
                  <code className="bg-white px-1 rounded mx-1">gunubirlik://</code>
                  scheme'ı mobil uygulama açıksa onu yakalar, açıksa açar.
                </p>
              </CardContent>
            </Card>

            {/* Endpoint Groups */}
            {API_GROUPS.map((group) => (
              <Card key={group.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${group.color}`}>
                      <group.icon className="w-4 h-4" />
                    </div>
                    <span>{group.title}</span>
                    <Badge variant="outline" className="ml-auto">{group.endpoints.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    {group.endpoints.map((ep, idx) => (
                      <AccordionItem key={idx} value={`item-${idx}`}>
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-3 flex-1 text-left min-w-0 flex-wrap">
                            <Badge className={`${methodColors[ep.method]} border font-mono text-xs`}>
                              {ep.method}
                            </Badge>
                            <code className="text-sm font-mono break-all">{ep.path}</code>
                            <div className="flex gap-1">
                              {ep.auth && <Badge variant="outline" className="text-xs">Auth</Badge>}
                              {ep.role && (
                                <Badge variant="outline" className="text-xs bg-purple-50">{ep.role}</Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-sm text-gray-600 mb-3">{ep.desc}</p>
                          {ep.query && (
                            <div>
                              <div className="text-xs font-semibold text-gray-700 mb-1">Query Params:</div>
                              <CodeBlock code={ep.query} />
                            </div>
                          )}
                          {ep.body && (
                            <div>
                              <div className="text-xs font-semibold text-gray-700 mb-1">Request Body:</div>
                              <CodeBlock code={ep.body} />
                            </div>
                          )}
                          {ep.response && (
                            <div>
                              <div className="text-xs font-semibold text-gray-700 mb-1">Response:</div>
                              <CodeBlock code={ep.response} />
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* WebSocket Tab */}
          <TabsContent value="websocket" className="space-y-4">
            <Card className="border-pink-200 bg-pink-50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-pink-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  WebSocket Bağlantısı
                </h3>
                <p className="text-sm text-pink-800 mb-3">
                  Socket.io kullanır. Mesajlaşma, bildirimler, yazıyor göstergesi ve online durum için.
                </p>
                <CodeBlock code={`// Mobil (React Native / Flutter) veya Web
const socket = io("https://your-domain.com/?XTransformPort=3004", {
  transports: ["websocket"],
  auth: { token: jwtToken }
})

socket.on("connect", () => console.log("Bağlandı"))
socket.on("message:new", (msg) => {/* Yeni mesaj */})
socket.on("notification:new", (n) => {/* Yeni bildirim */})`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Olaylar (Events)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { dir: 'client→server', event: 'conversation:join', data: '{ conversationId: "ck..." }', desc: 'Konuşma odasına katıl' },
                    { dir: 'client→server', event: 'message:send', data: '{ conversationId, content, type, clientMessageId }', desc: 'Mesaj gönder' },
                    { dir: 'client→server', event: 'typing:start', data: '{ conversationId }', desc: 'Yazıyor göstergesi başlat' },
                    { dir: 'client→server', event: 'message:read', data: '{ conversationId, messageIds }', desc: 'Mesajları okundu işaretle' },
                    { dir: 'server→client', event: 'message:new', data: '{ id, senderId, content, createdAt }', desc: 'Yeni mesaj alındı' },
                    { dir: 'server→client', event: 'typing:start', data: '{ userId, conversationId }', desc: 'Karşı taraf yazıyor' },
                    { dir: 'server→client', event: 'notification:new', data: '{ type, title, body }', desc: 'Anlık bildirim' },
                    { dir: 'server→client', event: 'job:new_nearby', data: '{ jobId, title, latitude, longitude }', desc: 'Yakında yeni iş ilanı' },
                    { dir: 'server→client', event: 'user:status', data: '{ userId, isOnline, lastActiveAt }', desc: 'Online durum değişti' },
                    { dir: 'server→client', event: 'conversation:unread', data: '{ conversationId }', desc: 'Okunmamış mesaj var' },
                  ].map((e, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={e.dir.startsWith('client') ? 'default' : 'secondary'} className="text-xs">
                          {e.dir}
                        </Badge>
                        <code className="text-sm font-mono font-semibold text-pink-700">{e.event}</code>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{e.desc}</p>
                      <code className="text-xs text-gray-500">{e.data}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
          <p className="font-medium text-gray-700">Günübirlik İş Bul — API v1.0</p>
          <p className="mt-1">
            Next.js 16 + Prisma + JWT + Socket.io + Resend + Cloudinary
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a href="/" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700">
              <Globe className="w-3.5 h-3.5" /> Ana Sayfa
            </a>
            <span>·</span>
            <a href="/admin" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700">
              <Shield className="w-3.5 h-3.5" /> Yönetim Paneli
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
