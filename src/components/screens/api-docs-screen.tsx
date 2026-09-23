'use client'

import { useState } from 'react'
import { useApp } from '@/lib/app-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Copy, Check, Smartphone, Globe, Zap, Database, Shield, MapPin, Bell, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

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
        path: '/api/v1/auth/register',
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
        path: '/api/v1/auth/login',
        desc: 'Mevcut kullanıcı girişi. Token hem cookie hem response body olarak döner.',
        auth: false,
        body: `{ "email": "worker1@example.com", "password": "123456" }`,
        response: `{ "success": true, "data": { "user": {...}, "token": "eyJ..." } }`,
      },
      {
        method: 'POST',
        path: '/api/v1/auth/logout',
        desc: 'Oturumu kapatır, cookie temizlenir. Mobilde token client-side silinir.',
        auth: true,
      },
      {
        method: 'GET',
        path: '/api/v1/auth/me',
        desc: 'Mevcut kullanıcı bilgilerini döner. Token doğrulama için kullanılır.',
        auth: true,
        response: `{ "success": true, "data": { "id": "...", "email": "...", "role": "WORKER", "skills": [], ... } }`,
      },
    ],
  },
  {
    title: 'İş İlanları',
    icon: Database,
    color: 'bg-blue-100 text-blue-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/jobs',
        desc: 'İş ilanlarını listeler. Sayfalama, filtreleme, konum bazlı arama destekler.',
        auth: false,
        query: `page=1&pageSize=10
category=INSAAT|RESTAURANT|TEMIZLIK|NAKLIYE|TARIM|TEKNIK|SAGLIK|DIGER
city=İstanbul&district=Kadıköy
search=garson
lat=41.0082&lng=28.9784&radiusKm=50  (konum bazlı)
minWage=1000&maxWage=5000
workDateFrom=2024-01-01&workDateTo=2024-12-31
sortBy=NEWEST|OLDEST|WAGE_HIGH|WAGE_LOW|NEAREST|URGENT`,
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
        path: '/api/v1/jobs/{id}',
        desc: 'Tek bir iş ilanının detayını döner. Görüntülenme sayısını artırır.',
        auth: false,
      },
      {
        method: 'POST',
        path: '/api/v1/jobs',
        desc: 'Yeni iş ilanı oluştur. Sadece işveren rolü.',
        auth: true,
        role: 'EMPLOYER',
        body: `{
  "title": "İnşaat İşçisi Aranıyor",
  "description": "Açıklama metni (min 20 karakter)",
  "category": "INSAAT",
  "requiredSkills": ["İnşaat işçisi", "Kalıpçı"],
  "workDate": "2024-12-25",
  "startTime": "08:00",
  "endTime": "17:00",
  "durationHours": 9,
  "wageAmount": 2500,
  "wageType": "DAILY",
  "isWageNegotiable": true,
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
        desc: 'İlanı sil. Sadece ilanı veren işveren.',
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
        desc: 'İş kategorilerini listeler (ikon ve etiket ile).',
        auth: false,
      },
    ],
  },
  {
    title: 'Başvurular',
    icon: Check,
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
        method: 'GET',
        path: '/api/v1/applications/by-job?jobId={id}',
        desc: 'Bir ilana yapılan tüm başvuruları listeler. İşveren yetkisi.',
        auth: true,
        role: 'EMPLOYER',
      },
      {
        method: 'PUT',
        path: '/api/v1/applications/{id}',
        desc: 'Başvuru durumunu güncelle (ACCEPT, REJECT, COMPLETE).',
        auth: true,
        body: `{ "status": "ACCEPTED", "employerNote": "Yarın 08:00'te gelin" }`,
      },
      {
        method: 'POST',
        path: '/api/v1/applications/{id}/rate',
        desc: 'Tamamlanan iş için 1-5 arası puan ve yorum.',
        auth: true,
        body: `{ "rating": 5, "comment": "Çok titiz çalıştı, tavsiye ederim" }`,
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
        path: '/api/v1/conversations',
        desc: 'Kullanıcının tüm konuşmalarını listeler (son mesaj ve okunmamış sayısı ile).',
        auth: true,
      },
      {
        method: 'POST',
        path: '/api/v1/conversations',
        desc: 'Yeni konuşma başlat veya mevcut konuşmaya mesaj gönder.',
        auth: true,
        body: `{
  "recipientId": "ck...",
  "jobId": "ck...",
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
      {
        method: 'POST',
        path: '/api/v1/conversations/read',
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
        path: '/api/v1/notifications',
        desc: 'Kullanıcının bildirimlerini listeler. Okunmamış sayısı dahil.',
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
    ],
  },
  {
    title: 'Kullanıcılar',
    icon: Globe,
    color: 'bg-teal-100 text-teal-700',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/users/{id}',
        desc: 'Kullanıcı herkse açık profil bilgisi (rating, yorumlar, aktif ilanlar).',
        auth: false,
      },
      {
        method: 'PUT',
        path: '/api/v1/auth/me',
        desc: 'Profil güncelle (skills, bio, konum, FCM token vb.).',
        auth: true,
        body: `{
  "fullName": "Ad Soyad",
  "phone": "+905321234567",
  "bio": "Açıklama",
  "city": "İstanbul",
  "district": "Kadıköy",
  "latitude": 40.99,
  "longitude": 29.02,
  "skills": ["İnşaat", "Boyacı"],
  "experienceYears": 8,
  "isAvailable": true,
  "fcmToken": "FirebaseMessagingToken..."
}`,
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
        desc: 'Sistem sağlık kontrolü. Mobilde app açılışında kontrol edilebilir.',
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

export default function ApiDocsScreen() {
  const { go } = useApp()

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">
      {/* Hero */}
      <div className="mb-5 sm:mb-6 bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <Smartphone className="w-5 h-5 sm:w-7 sm:h-7 flex-shrink-0" />
              <span className="truncate">API Dokümantasyonu</span>
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm max-w-2xl">
              Mobil uygulamanızın entegre olması için tüm REST API endpoint'leri, WebSocket olayları ve entegrasyon örnekleri.
            </p>
          </div>
          <Badge className="bg-emerald-500 text-white flex-shrink-0">v1.0</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
          <div className="bg-white/10 rounded-lg p-2 sm:p-3">
            <div className="text-base sm:text-2xl font-bold truncate">/api/v1</div>
            <div className="text-[10px] sm:text-xs text-gray-300">Base URL</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 sm:p-3">
            <div className="text-base sm:text-2xl font-bold">JWT</div>
            <div className="text-[10px] sm:text-xs text-gray-300">Auth</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 sm:p-3">
            <div className="text-base sm:text-2xl font-bold">REST</div>
            <div className="text-[10px] sm:text-xs text-gray-300">+ WebSocket</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 sm:p-3">
            <div className="text-base sm:text-2xl font-bold">JSON</div>
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

        {/* REST API Tab */}
        <TabsContent value="rest" className="space-y-4">
          {/* Auth info */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-3 sm:p-4">
              <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Shield className="w-4 h-4 flex-shrink-0" />
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

          {/* Endpoint Groups */}
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
                          <Badge className={`${methodColors[ep.method]} border font-mono text-[10px] sm:text-xs flex-shrink-0`}>
                            {ep.method}
                          </Badge>
                          <code className="text-[11px] sm:text-sm font-mono break-all leading-tight">{ep.path}</code>
                          <div className="flex gap-1 flex-shrink-0">
                            {ep.auth && (
                              <Badge variant="outline" className="text-[9px] sm:text-xs">Auth</Badge>
                            )}
                            {ep.role && (
                              <Badge variant="outline" className="text-[9px] sm:text-xs bg-purple-50">
                                {ep.role}
                              </Badge>
                            )}
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

        {/* WebSocket Tab */}
        <TabsContent value="websocket" className="space-y-4">
          <Card className="border-pink-200 bg-pink-50">
            <CardContent className="p-3 sm:p-4">
              <h3 className="font-semibold text-pink-900 mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Zap className="w-4 h-4 flex-shrink-0" />
                WebSocket Bağlantısı
              </h3>
              <p className="text-xs sm:text-sm text-pink-800 mb-3">
                Socket.io kullanır. Mesajlaşma, bildirimler, yazıyor göstergesi ve online durum için.
              </p>
              <CodeBlock code={`// Mobil (React Native / Flutter)
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
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Olaylar (Events)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
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
                      <Badge variant={e.dir.startsWith('client') ? 'default' : 'secondary'} className="text-[10px] sm:text-xs flex-shrink-0">
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

        {/* Mobile Integration Tab */}
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
import AsyncStorage from "@react-native-async-storage/async-storage"

export const api = axios.create({
  baseURL: "https://your-domain.com/api/v1",
  timeout: 15000,
})

// Request interceptor: token ekle
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token")
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`
  }
  return config
})

// Response interceptor: 401'de login'e at
api.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  (err) => {
    if (err.response?.status === 401) {
      AsyncStorage.removeItem("auth_token")
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

          <Card className="border-purple-200">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MapPin className="w-5 h-5 text-purple-600 flex-shrink-0" />
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

          <Card className="border-emerald-200">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Bell className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                Push Bildirim (FCM) Entegrasyonu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-xs sm:text-sm text-gray-600 mb-3">
                Firebase Cloud Messaging token'ını backend'e kaydetme:
              </p>
              <CodeBlock code={`// App.tsx açılışta
import messaging from "@react-native-firebase/messaging"
import { api } from "./api/client"

async function registerPushNotifications() {
  const authStatus = await messaging().requestPermission()
  if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
    const token = await messaging().getToken()

    // Backend'e kaydet
    await api.put("/auth/me", { fcmToken: token })

    // Token yenilenirse
    messaging().onTokenRefresh((newToken) => {
      api.put("/auth/me", { fcmToken: newToken })
    })
  }
}

// Bildirim alındığında
messaging().onMessage(async (remoteMessage) => {
  const { title, body } = remoteMessage.notification
  // In-app banner göster
})

// Background'da bildirim
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  // Push notification otomatik gösterilir
})`} />
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
                    <li>• Socket.io (mini-service, port 3004)</li>
                    <li>• SHA-256 hash + JWT-like token</li>
                    <li>• Caddy gateway (port yönlendirme)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-blue-700">Production Geçişi</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Nest.js'e taşıma: service katmanı hazır, sadece controller wrapper gerekli</li>
                    <li>• PostgreSQL: schema.prisma'da provider="postgresql"</li>
                    <li>• bcrypt: hashPassword fonksiyonunu değiştirin</li>
                    <li>• jsonwebtoken: generateToken/verifyToken değiştirin</li>
                    <li>• Redis: Socket.io adapter için</li>
                    <li>• PostGIS: konum sorgularını DB seviyesine taşıyın</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => go('home')} className="h-11">
              Ana Sayfaya Dön
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
