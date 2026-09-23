'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  Copy, Check, Smartphone, Globe, Zap, Database, Shield, MapPin, Bell, 
  MessageSquare, Briefcase, ArrowLeft, Code, Webhook, KeyRound, Mail,
  Lock, UserPlus, LogIn, FileText, Send, CreditCard, QrCode, Gavel, Wallet
} from 'lucide-react'
import { toast } from 'sonner'

const API_BASE = '/api/v1'

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
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
        path: '/auth/register',
        desc: 'Yeni kullanıcı kaydı (işçi veya işveren). Başarılı girişte JWT token döner.',
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
        path: '/auth/login',
        desc: 'Kullanıcı girişi. 2FA aktifse requiresTwoFactor: true döner, twoFactorCode ile tekrar istek atılır.',
        auth: false,
        body: `{ "email": "worker1@example.com", "password": "123456" }`,
        response: `{
  "success": true,
  "data": { "user": {...}, "token": "eyJ..." }
}`,
      },
      {
        method: 'POST',
        path: '/auth/login (2FA)',
        desc: '2FA aktif kullanıcılar için. twoFactorCode alanı eklenir.',
        auth: false,
        body: `{
  "email": "worker1@example.com",
  "password": "123456",
  "twoFactorCode": "123456"
}`,
      },
      {
        method: 'POST',
        path: '/auth/logout',
        desc: 'Oturumu kapatır, cookie temizlenir.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/auth/me',
        desc: 'Mevcut kullanıcı bilgilerini döner.',
        auth: true,
        response: `{ "success": true, "data": { "id": "...", "email": "...", "role": "WORKER", "skills": [] } }`,
      },
      {
        method: 'POST',
        path: '/auth/forgot-password',
        desc: 'Şifre sıfırlama kodu e-posta olarak gönderilir. Rate limit: 3 istek/saat.',
        auth: false,
        body: `{ "email": "user@example.com" }`,
        response: `{ "success": true, "data": { "preview": "...", "sent": true } }`,
      },
      {
        method: 'POST',
        path: '/auth/reset-password',
        desc: 'Sıfırlama kodu ile yeni şifre belirle.',
        auth: false,
        body: `{ "code": "123456", "newPassword": "yenisifre" }`,
      },
      {
        method: 'POST',
        path: '/auth/change-password',
        desc: 'Mevcut şifreyi doğrulayıp yeni şifre belirle.',
        auth: true,
        body: `{ "currentPassword": "123456", "newPassword": "yenisifre" }`,
      },
      {
        method: 'POST',
        path: '/auth/google',
        desc: 'Google ID token ile giriş/kayıt. Frontend Google Sign-In SDKdan alınan token gönderilir.',
        auth: false,
        body: `{ "idToken": "eyJhbGc..." }`,
      },
      {
        method: 'POST',
        path: '/auth/avatar',
        desc: 'Profil fotoğrafı yükle (Cloudinary\'e). Max 5MB, JPG/PNG/WebP.',
        auth: true,
        body: `{ "base64": "iVBORw0KG...", "mimeType": "image/jpeg" }`,
        response: `{ "success": true, "data": { "avatarUrl": "https://res.cloudinary.com/..." } }`,
      },
    ],
  },
  {
    title: '2FA (İki Faktörlü Doğrulama)',
    icon: KeyRound,
    color: 'bg-purple-100 text-purple-700',
    endpoints: [
      {
        method: 'POST',
        path: '/auth/2fa/setup',
        desc: 'TOTP secret üret, QR kod döner. Google Authenticator ile tara.',
        auth: true,
        response: `{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "secret": "JNBH26KAGY3QSCCV",
    "backupCodes": ["A1B2C3D4", "E5F6G7H8", ...]
  }
}`,
      },
      {
        method: 'POST',
        path: '/auth/2fa/verify',
        desc: '6 haneli kodu doğrula, 2FA\'yı aktif et.',
        auth: true,
        body: `{ "code": "123456" }`,
      },
      {
        method: 'POST',
        path: '/auth/2fa/disable',
        desc: '2FA\'yı devre dışı bırak. Kod veya backup kod gerekli.',
        auth: true,
        body: `{ "code": "123456" }`,
      },
    ],
  },
  {
    title: 'E-posta Değiştirme',
    icon: Mail,
    color: 'bg-blue-100 text-blue-700',
    endpoints: [
      {
        method: 'POST',
        path: '/auth/email-change/request',
        desc: 'Yeni e-posta adresine doğrulama kodu gönder.',
        auth: true,
        body: `{ "newEmail": "yeni@email.com" }`,
      },
      {
        method: 'POST',
        path: '/auth/email-change/confirm',
        desc: 'Doğrulama kodu ile e-postayı güncelle.',
        auth: true,
        body: `{ "code": "123456" }`,
      },
    ],
  },
  {
    title: 'İş İlanları',
    icon: Briefcase,
    color: 'bg-amber-100 text-amber-700',
    endpoints: [
      {
        method: 'GET',
        path: '/jobs',
        desc: 'İş ilanlarını listeler. Sayfalama, filtreleme, konum bazlı arama destekler.',
        auth: false,
        query: `page=1&pageSize=10
category=INSAAT|RESTAURANT|TEMIZLIK|NAKLIYE|TARIM|TEKNIK|SAGLIK|DIGER
city=İstanbul&district=Kadıköy
search=garson
lat=41.0082&lng=28.9784&radiusKm=50
minWage=1000&maxWage=5000
sortBy=NEWEST|WAGE_HIGH|WAGE_LOW|NEAREST|URGENT`,
        response: `{
  "success": true,
  "data": {
    "items": [{
      "id": "ck...",
      "title": "İnşaat İşçisi",
      "wageAmount": 2500,
      "wageType": "DAILY",
      "latitude": 40.99,
      "longitude": 29.02,
      "distanceKm": 2.3,
      "employer": { "companyName": "...", "isVerified": true },
      "applicationCount": 5
    }],
    "pagination": { "page": 1, "total": 42, "hasNext": true }
  }
}`,
      },
      {
        method: 'GET',
        path: '/jobs/{id}',
        desc: 'Tek bir iş ilanının detayını döner.',
        auth: false,
      },
      {
        method: 'POST',
        path: '/jobs',
        desc: 'Yeni iş ilanı oluştur. Sadece işveren.',
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
  "latitude": 40.9904,
  "longitude": 29.0291,
  "city": "İstanbul",
  "district": "Kadıköy",
  "openingsTotal": 3,
  "urgency": "HIGH"
}`,
      },
      {
        method: 'PUT',
        path: '/jobs/{id}',
        desc: 'İlan güncelle veya durum değiştir (OPEN, FILLED, CLOSED, CANCELLED).',
        auth: true,
        role: 'EMPLOYER',
        body: `{ "status": "CLOSED" }`,
      },
      {
        method: 'DELETE',
        path: '/jobs/{id}',
        desc: 'İlanı sil.',
        auth: true,
        role: 'EMPLOYER',
      },
      {
        method: 'POST',
        path: '/jobs/{id}/save',
        desc: 'İlanı kaydet / kayıttan çıkar (toggle).',
        auth: true,
      },
      {
        method: 'GET',
        path: '/jobs/saved',
        desc: 'Kaydedilen ilanları listeler.',
        auth: true,
      },
    ],
  },
  {
    title: 'Başvurular',
    icon: FileText,
    color: 'bg-cyan-100 text-cyan-700',
    endpoints: [
      {
        method: 'POST',
        path: '/applications',
        desc: 'İlana başvuru yap. İşçi rolü gerekli.',
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
        path: '/applications',
        desc: 'İşçi: kendi başvuruları. İşveren: ilanlarına yapılan başvurular.',
        auth: true,
        query: `status=PENDING|ACCEPTED|REJECTED|WITHDRAWN|COMPLETED`,
      },
      {
        method: 'GET',
        path: '/applications/by-job?jobId={id}',
        desc: 'Bir ilana yapılan başvurular. İşveren yetkisi.',
        auth: true,
        role: 'EMPLOYER',
      },
      {
        method: 'PUT',
        path: '/applications/{id}',
        desc: 'Başvuru durumunu güncelle (ACCEPTED, REJECTED, COMPLETED).',
        auth: true,
        body: `{ "status": "ACCEPTED", "employerNote": "Yarın 08:00'te gelin" }`,
      },
      {
        method: 'POST',
        path: '/applications/{id}/rate',
        desc: 'Tamamlanan iş için 1-5 puan ve yorum.',
        auth: true,
        body: `{ "rating": 5, "comment": "Çok titiz çalıştı" }`,
      },
    ],
  },
  {
    title: 'Mesajlaşma',
    icon: MessageSquare,
    color: 'bg-pink-100 text-pink-700',
    endpoints: [
      {
        method: 'GET',
        path: '/conversations',
        desc: 'Kullanıcının tüm konuşmalarını listeler.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/conversations',
        desc: 'Yeni konuşma başlat veya mesaj gönder.',
        auth: true,
        body: `{
  "recipientId": "ck...",
  "jobId": "ck...",
  "content": "Merhaba, ilanınızı gördüm"
}`,
      },
      {
        method: 'GET',
        path: '/conversations/{id}/messages',
        desc: 'Konuşmadaki mesajları listeler.',
        auth: true,
        query: `page=1&pageSize=50`,
      },
      {
        method: 'POST',
        path: '/conversations/read',
        desc: 'Konuşmayı okundu olarak işaretle.',
        auth: true,
        body: `{ "conversationId": "ck..." }`,
      },
    ],
  },
  {
    title: 'Bildirimler',
    icon: Bell,
    color: 'bg-orange-100 text-orange-700',
    endpoints: [
      {
        method: 'GET',
        path: '/notifications',
        desc: 'Bildirimleri listeler. Okunmamış sayısı dahil.',
        auth: true,
        query: `unread=true&page=1`,
        response: `{
  "success": true,
  "data": {
    "items": [{
      "id": "ck...",
      "type": "APPLICATION_ACCEPTED",
      "title": "Başvurunuz Onaylandı!",
      "body": "...",
      "isRead": false,
      "createdAt": "2024-..."
    }],
    "unreadCount": 3
  }
}`,
      },
      {
        method: 'PUT',
        path: '/notifications/{id}',
        desc: 'Bildirimi okundu olarak işaretle.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/notifications/read-all',
        desc: 'Tüm bildirimleri okundu olarak işaretle.',
        auth: true,
      },
      {
        method: 'DELETE',
        path: '/notifications/{id}',
        desc: 'Bildirimi sil.',
        auth: true,
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
        path: '/health',
        desc: 'Sistem saglik kontrolu. Mobil app acilisinda kontrol edilebilir.',
        auth: false,
        response: `{ "success": true, "data": { "status": "healthy", "version": "1.0.0" } }`,
      },
    ],
  },
  {
    title: 'Odeme & Escrow (Emanet)',
    icon: CreditCard,
    color: 'bg-green-100 text-green-700',
    endpoints: [
      {
        method: 'POST',
        path: '/payments/escrow',
        desc: 'Isveren is ucretini emanete (escrow) alir. Is ilani yayinlandiginda cagrilir. %5 platform komisyonu islenir.',
        auth: true,
        role: 'EMPLOYER',
        body: `{ "jobId": "ck..." }`,
        response: `{
  "success": true,
  "data": {
    "paymentId": "ck...",
    "amount": 7500,
    "platformFee": 375,
    "workerAmount": 7125,
    "status": "ESCROW"
  }
}`,
      },
      {
        method: 'GET',
        path: '/payments/status/{jobId}',
        desc: 'Isin odeme durumunu getirir. Escrow durumu, odeme detaylari, application durumu.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/payments/wallet',
        desc: 'Kullanici cuzdan bakiyesi. Mevcut bakiye + emanette tutulan.',
        auth: true,
        response: `{
  "success": true,
  "data": {
    "balance": 0,
    "locked": 7500,
    "available": 0,
    "total": 7500
  }
}`,
      },
      {
        method: 'GET',
        path: '/payments/history',
        desc: 'Kullanici odeme gecmisi. Gonderilen ve alinan tum odemeler.',
        auth: true,
      },
    ],
  },
  {
    title: 'QR Dogrulama (Is Akisi)',
    icon: QrCode,
    color: 'bg-indigo-100 text-indigo-700',
    endpoints: [
      {
        method: 'POST',
        path: '/payments/qr/generate',
        desc: 'Isveren QR kod uretir. QR sadece web sitesinde gosterilir, kopyalanamaz, 5 dk gecerli, tek kullanimlik. Step: CHECK_IN (is baslangici), CHECK_OUT (is bitisi), PAYMENT (odeme).',
        auth: true,
        role: 'EMPLOYER',
        body: `{
  "jobId": "ck...",
  "step": "CHECK_IN",
  "applicationId": "ck..."
}`,
        response: `{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "step": "CHECK_IN",
    "expiresAt": "2024-01-01T12:05:00Z",
    "qrData": "{\\"v\\":\\"1.0\\",\\"token\\":\\"eyJ...\\",\\"jobId\\":\\"ck...\\",\\"step\\":\\"CHECK_IN\\"}"
  }
}`,
      },
      {
        method: 'POST',
        path: '/payments/qr/verify',
        desc: 'Isci QR tarar. Token dogrulanir, application status guncellenir. CHECK_IN -> CHECKED_IN, CHECK_OUT -> WORK_DONE, PAYMENT -> PAID (odeme release). Konum dogrulama opsiyonel.',
        auth: true,
        body: `{
  "token": "eyJhbGc...",
  "lat": 41.0082,
  "lng": 28.9784
}`,
        response: `{
  "success": true,
  "data": {
    "step": "CHECK_IN",
    "newStatus": "CHECKED_IN",
    "jobId": "ck...",
    "jobTitle": "Insaat Iscisi",
    "message": "Is baslatildi!"
  }
}`,
      },
    ],
  },
  {
    title: 'Anlasmazlik (Dispute)',
    icon: Gavel,
    color: 'bg-red-100 text-red-700',
    endpoints: [
      {
        method: 'POST',
        path: '/disputes',
        desc: 'Anlasmazlik ac. Herhangi bir taraf acabilir. Odeme ESCROW durumundaysa DISPUTED olur ve dondurulur. Reason: WORKER_NO_SHOW, EMPLOYER_NO_PAY, QUALITY_ISSUE, SAFETY, OTHER.',
        auth: true,
        body: `{
  "jobId": "ck...",
  "applicationId": "ck...",
  "reason": "EMPLOYER_NO_PAY",
  "description": "Is tamamlandi ama odeme yapilmadi",
  "evidence": ["https://res.cloudinary.com/..."]
}`,
        response: `{
  "success": true,
  "data": {
    "id": "ck...",
    "status": "OPEN",
    "reason": "EMPLOYER_NO_PAY"
  }
}`,
      },
      {
        method: 'GET',
        path: '/disputes',
        desc: 'Anlasmazlik listesi. Admin tumunu, kullanici sadece kendisiyle ilgili olanlari gorur.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/disputes/{id}',
        desc: 'Anlasmazlik detayi. Acan, karsi taraf veya admin gorebilir.',
        auth: true,
      },
      {
        method: 'POST',
        path: '/disputes/{id}/resolve',
        desc: 'Admin anlasmazligi cozer. Resolution: RESOLVED_WORKER (tumunu isciye), RESOLVED_EMPLOYER (tumunu iade), RESOLVED_SPLIT (yari yariya).',
        auth: true,
        role: 'ADMIN',
        body: `{
  "resolution": "RESOLVED_WORKER",
  "resolutionNote": "Isci isi tamamlamis, odeme yapilmali"
}`,
        response: `{
  "success": true,
  "data": {
    "disputeId": "ck...",
    "resolution": "RESOLVED_WORKER",
    "resolutionNote": "Isci isi tamamlamis"
  }
}`,
      },
    ],
  },
]

const WS_EVENTS = [
  { dir: 'client→server', event: 'conversation:join', data: '{ conversationId: "ck..." }', desc: 'Konuşma odasına katıl' },
  { dir: 'client→server', event: 'message:send', data: '{ conversationId, content, type, clientMessageId }', desc: 'Mesaj gönder' },
  { dir: 'client→server', event: 'typing:start', data: '{ conversationId }', desc: 'Yazıyor göstergesi başlat' },
  { dir: 'client→server', event: 'message:read', data: '{ conversationId, messageIds }', desc: 'Mesajları okundu işaretle' },
  { dir: 'server→client', event: 'message:new', data: '{ id, senderId, content, createdAt }', desc: 'Yeni mesaj alındı' },
  { dir: 'server→client', event: 'typing:start', data: '{ userId, conversationId }', desc: 'Karşı taraf yazıyor' },
  { dir: 'server→client', event: 'notification:new', data: '{ type, title, body }', desc: 'Anlık bildirim' },
  { dir: 'server→client', event: 'job:new_nearby', data: '{ jobId, title, latitude, longitude }', desc: 'Yakında yeni iş ilanı' },
  { dir: 'server→client', event: 'user:status', data: '{ userId, isOnline, lastActiveAt }', desc: 'Online durum değişti' },
]

const methodColors: Record<string, string> = {
  GET: 'bg-blue-100 text-blue-700 border-blue-300',
  POST: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  PUT: 'bg-amber-100 text-amber-700 border-amber-300',
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

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="font-bold text-sm sm:text-lg text-gray-900">Günübirlik İş Bul</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-700 text-xs">API v1.0</Badge>
              <Link href="/">
                <Button variant="outline" size="sm" className="h-9">
                  <ArrowLeft className="w-3 h-3 mr-1" />
                  Ana Sayfa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">
        {/* Hero */}
        <div className="mb-5 sm:mb-6 bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
            <Code className="w-5 h-5 sm:w-7 sm:h-7" />
            API Dokümantasyonu
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm max-w-2xl">
            Günübirlik İş Bulma Platformu REST API ve WebSocket dokümantasyonu. Mobil uygulama entegrasyonu için tüm endpoint'ler, örnek kodlar ve güvenlik bilgileri.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-sm sm:text-lg font-bold">/api/v1</div>
              <div className="text-[10px] sm:text-xs text-gray-300">Base URL</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-sm sm:text-lg font-bold">JWT</div>
              <div className="text-[10px] sm:text-xs text-gray-300">Auth</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-sm sm:text-lg font-bold">REST</div>
              <div className="text-[10px] sm:text-xs text-gray-300">+ WebSocket</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-sm sm:text-lg font-bold">JSON</div>
              <div className="text-[10px] sm:text-xs text-gray-300">Response</div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="rest" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="rest" className="text-xs sm:text-sm py-2">REST API</TabsTrigger>
            <TabsTrigger value="websocket" className="text-xs sm:text-sm py-2">WebSocket</TabsTrigger>
            <TabsTrigger value="mobile" className="text-xs sm:text-sm py-2">Mobil</TabsTrigger>
          </TabsList>

          {/* REST API */}
          <TabsContent value="rest" className="space-y-4">
            {/* Auth info */}
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-3 sm:p-4">
                <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  Kimlik Doğrulama
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 mb-2">
                  Tüm korumalı endpoint'ler JWT token gerektirir. Token'ı iki şekilde gönderin:
                </p>
                <div className="grid sm:grid-cols-2 gap-2 sm:gap-3 mt-3">
                  <div>
                    <div className="text-xs font-semibold text-emerald-900 mb-1">Web (Cookie)</div>
                    <code className="block bg-white rounded p-2 text-[11px] sm:text-xs text-emerald-700 break-all">
                      Cookie: auth_token=eyJ...
                    </code>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-900 mb-1">Mobil (Bearer)</div>
                    <code className="block bg-white rounded p-2 text-[11px] sm:text-xs text-emerald-700 break-all">
                      Authorization: Bearer eyJ...
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {API_GROUPS.map((group) => (
              <Card key={group.title}>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${group.color} flex-shrink-0`}>
                      <group.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="truncate">{group.title}</span>
                    <Badge variant="outline" className="ml-auto flex-shrink-0 text-xs">{group.endpoints.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <Accordion type="single" collapsible>
                    {group.endpoints.map((ep, idx) => (
                      <AccordionItem key={idx} value={`item-${idx}`}>
                        <AccordionTrigger className="hover:no-underline py-3">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 text-left min-w-0 flex-wrap">
                            <Badge className={`${methodColors[ep.method.split(' ')[0]]} border font-mono text-[10px] sm:text-xs flex-shrink-0`}>
                              {ep.method}
                            </Badge>
                            <code className="text-[11px] sm:text-sm font-mono break-all leading-tight">{ep.path}</code>
                            <div className="flex gap-1 flex-shrink-0">
                              {ep.auth && <Badge variant="outline" className="text-[9px] sm:text-xs">Auth</Badge>}
                              {ep.role && <Badge variant="outline" className="text-[9px] sm:text-xs bg-purple-50">{ep.role}</Badge>}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3">{ep.desc}</p>
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

          {/* WebSocket */}
          <TabsContent value="websocket" className="space-y-4">
            <Card className="border-pink-200 bg-pink-50">
              <CardContent className="p-3 sm:p-4">
                <h3 className="font-semibold text-pink-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Webhook className="w-4 h-4 flex-shrink-0" />
                  WebSocket Bağlantısı
                </h3>
                <p className="text-xs sm:text-sm text-pink-800 mb-3">
                  Socket.io kullanır. Mesajlaşma, bildirimler, yazıyor göstergesi ve online durum için.
                </p>
                <CodeBlock code={`// Mobil (React Native / Flutter)\nconst socket = io("https://k1qxs7ywutz0-d.space-z.ai/?XTransformPort=3004", {\n  transports: ["websocket"],\n  auth: { token: jwtToken }\n})\n\nsocket.on("connect", () => console.log("Bağlandı"))\nsocket.on("message:new", (msg) => {/* Yeni mesaj */})\nsocket.on("notification:new", (n) => {/* Yeni bildirim */})`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Olaylar (Events)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3">
                  {WS_EVENTS.map((e, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant={e.dir.startsWith('client') ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                          {e.dir}
                        </Badge>
                        <code className="text-xs sm:text-sm font-mono font-semibold text-pink-700 break-all">{e.event}</code>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{e.desc}</p>
                      <code className="text-[11px] sm:text-xs text-gray-500 break-all">{e.data}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mobile */}
          <TabsContent value="mobile" className="space-y-4">
            <Card className="border-blue-200">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Smartphone className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  React Native Entegrasyonu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  Axios + Socket.io-client ile hazır mobil HTTP istemci örneği:
                </p>
                <CodeBlock code={`// api/client.ts
import axios from "axios"
import * as SecureStore from "expo-secure-store"

export const api = axios.create({
  baseURL: "https://k1qxs7ywutz0-d.space-z.ai/api/v1",
  timeout: 15000,
})

// Request interceptor: token ekle
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("auth_token")
  if (token) {
    config.headers.Authorization = "Bearer " + token
  }
  return config
})

// Response interceptor: 401'de login'e at
api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  (err) => {
    if (err.response?.status === 401) {
      SecureStore.deleteItemAsync("auth_token")
      navigationRef.navigate("Login")
    }
    return Promise.reject(err.response?.data?.error || err)
  }
)

// Kullanım
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
}

export const jobsApi = {
  list: (params = {}) => api.get("/jobs", { params }),
  nearby: (lat: number, lng: number, radiusKm = 50) =>
    api.get("/jobs", { params: { lat, lng, radiusKm, sortBy: "NEAREST" } }),
  apply: (jobId: string, message: string) =>
    api.post("/applications", { jobId, message }),
}`} />
              </CardContent>
            </Card>

            <Card className="border-emerald-200">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  Konum Bazlı İş Arama (Mobil)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  Cihaz GPS'ini kullanarak yakındaki işleri bulma:
                </p>
                <CodeBlock code={`// hooks/useNearbyJobs.ts
import * as Location from "expo-location"

export function useNearbyJobs(radiusKm = 25) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") return

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const result = await jobsApi.list({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        radiusKm,
        sortBy: "NEAREST",
        pageSize: 50,
      })
      setJobs(result.items)
      setLoading(false)
    })()
  }, [radiusKm])

  return { jobs, loading }
}`} />
              </CardContent>
            </Card>

            <Card className="border-amber-200">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Teknoloji Yığını & Geçiş Planı</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid md:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div>
                    <h4 className="font-semibold mb-2 text-emerald-700">Mevcut (Geliştirme)</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Next.js 16 (App Router) — API route'ları</li>
                      <li>• Prisma ORM + SQLite</li>
                      <li>• Socket.io (port 3004)</li>
                      <li>• bcrypt + JWT</li>
                      <li>• Google OAuth</li>
                      <li>• Cloudinary (dosya)</li>
                      <li>• Resend (e-posta)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-700">Production Geçişi</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• PostgreSQL: provider="postgresql"</li>
                      <li>• Redis: Socket.io adapter</li>
                      <li>• PostGIS: konum sorguları DB'de</li>
                      <li>• Domain doğrula (Resend)</li>
                      <li>• EAS Build: APK/IPA üret</li>
                      <li>• App Store / Play Store</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Accounts */}
        <Card className="mt-6 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2 text-sm">
              <UserPlus className="w-4 h-4" />
              Test Hesapları
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white rounded-lg p-2">
                <div className="font-semibold text-gray-900">👷 İşçi</div>
                <code className="text-gray-600">worker1@example.com / 123456</code>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="font-semibold text-gray-900">🏢 İşveren</div>
                <code className="text-gray-600">ahmet@insaat.com / 123456</code>
              </div>
              <div className="bg-white rounded-lg p-2">
                <div className="font-semibold text-gray-900">🔐 Admin</div>
                <code className="text-gray-600">admin@gunubirlik.com / admin123</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>© 2024 Günübirlik İş Bul — Konum Bazlı Günlük İş Platformu</p>
          <p className="mt-1">Next.js + Prisma + PostgreSQL + WebSocket • Mobil uyumlu REST API</p>
        </div>
      </div>
    </div>
  )
}
