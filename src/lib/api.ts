/**
 * API Client - Frontend'in backend ile iletişim katmanı
 * Tüm istekler merkezi buradan geçer. Token yönetimi otomatik.
 */
'use client'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message)
  }
}

const API_BASE = '/api/v1'

function getToken(): string | null {
  if (typeof document === 'undefined') return null
  // Token cookie'de httpOnly, JS erişemez. Bu yüzden header'da taşımıyoruz.
  // Cookie otomatik gönderilir. Mobil uygulama için token localStorage'tan alınır.
  return null
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // Mobil token desteği (web'de cookie yeterli)
  if (typeof window !== 'undefined') {
    const mobileToken = localStorage.getItem('auth_token')
    if (mobileToken) {
      headers['Authorization'] = `Bearer ${mobileToken}`
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  const json: ApiResponse<T> = await res.json()

  // 2FA özel durum: success=false ama requiresTwoFactor varsa özel error fırlat
  // Bu error frontend'de yakalanıp 2FA dialog açılır
  if ((json as any).requiresTwoFactor) {
    const err = new ApiError(res.status, '2FA_REQUIRED')
    ;(err as any).requiresTwoFactor = true
    ;(err as any).userId = (json as any).userId
    throw err
  }

  if (!res.ok || !json.success) {
    throw new ApiError(res.status, json.error || 'İstek başarısız.', json.details)
  }

  return json.data as T
}

// ====================================================================
// Akıllı İstemci Önbelleği (Client-Side Memory Cache & SWR)
// ====================================================================
export interface RequestOptions extends RequestInit {
  bypassCache?: boolean
  ttl?: number
}

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
}

// In-Memory GET Cache
const apiCache = new Map<string, CacheEntry>()
// Aktif (in-flight) istekleri tekilleştirme (Promise deduplication)
const inFlightRequests = new Map<string, Promise<any>>()

// Endpoint'lere göre varsayılan TTL (Milisaniye)
const DEFAULT_TTL = 30 * 1000 // 30 saniye
const CACHE_CONFIGS: Array<{ pattern: RegExp; ttl: number }> = [
  { pattern: /^\/jobs(\?|$)/, ttl: 45 * 1000 }, // 45 saniye
  { pattern: /^\/jobs\/[a-zA-Z0-9_-]+$/, ttl: 60 * 1000 }, // 1 dakika (ilan detayı)
  { pattern: /^\/wallet\/balance/, ttl: 30 * 1000 }, // 30 saniye
  { pattern: /^\/wallet\/transactions/, ttl: 45 * 1000 },
  { pattern: /^\/wallet\/deposit-requests/, ttl: 30 * 1000 },
  { pattern: /^\/wallet\/withdraw-requests/, ttl: 30 * 1000 },
  { pattern: /^\/auth\/me/, ttl: 60 * 1000 },
  { pattern: /^\/auth\/security-info/, ttl: 60 * 1000 },
  { pattern: /^\/notifications(\?|$)/, ttl: 30 * 1000 },
  { pattern: /^\/conversations(\?|$)/, ttl: 20 * 1000 },
  { pattern: /^\/geocode\//, ttl: 10 * 60 * 1000 }, // 10 dakika
]

function getTtlForPath(path: string): number {
  for (const cfg of CACHE_CONFIGS) {
    if (cfg.pattern.test(path)) return cfg.ttl
  }
  return DEFAULT_TTL
}

function clearCacheMatching(pattern: RegExp) {
  for (const key of apiCache.keys()) {
    if (pattern.test(key)) {
      apiCache.delete(key)
    }
  }
}

export function invalidateCache(mutatedPath: string) {
  if (mutatedPath.startsWith('/jobs') || mutatedPath.startsWith('/saved')) {
    clearCacheMatching(/^\/jobs/)
  } else if (mutatedPath.startsWith('/wallet')) {
    clearCacheMatching(/^\/wallet/)
  } else if (mutatedPath.startsWith('/notifications')) {
    clearCacheMatching(/^\/notifications/)
  } else if (mutatedPath.startsWith('/applications')) {
    clearCacheMatching(/^\/applications/)
    clearCacheMatching(/^\/jobs/)
  } else if (mutatedPath.startsWith('/conversations')) {
    clearCacheMatching(/^\/conversations/)
  } else if (mutatedPath.startsWith('/auth') || mutatedPath.startsWith('/users')) {
    clearCacheMatching(/^\/auth/)
    clearCacheMatching(/^\/users/)
  } else {
    const prefix = mutatedPath.split('/')[1]
    if (prefix) {
      clearCacheMatching(new RegExp(`^\\/${prefix}`))
    }
  }
}

async function cachedGet<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const cacheKey = path
  const now = Date.now()
  const bypass = options.bypassCache === true

  if (!bypass) {
    const cached = apiCache.get(cacheKey)
    if (cached) {
      const isFresh = now - cached.timestamp < cached.ttl
      if (isFresh) {
        // Taze önbellek: Ağ isteği atmadan 0ms içinde anında dön!
        return cached.data as T
      }

      // Stale-While-Revalidate: Ömrü yeni dolmuşsa kullanıcıyı bekletme, eskiyi anında dön ve arka planda tazele
      if (now - cached.timestamp < cached.ttl * 4) {
        if (!inFlightRequests.has(cacheKey)) {
          const bgPromise = request<T>(path, { ...options, method: 'GET' })
            .then((freshData) => {
              apiCache.set(cacheKey, {
                data: freshData,
                timestamp: Date.now(),
                ttl: options.ttl || getTtlForPath(path),
              })
              return freshData
            })
            .catch(() => {})
            .finally(() => {
              inFlightRequests.delete(cacheKey)
            })
          inFlightRequests.set(cacheKey, bgPromise)
        }
        return cached.data as T
      }
    }

    // Aynı anda giden mükerrer istekleri tek bir ağ çağrısında birleştir
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey)! as Promise<T>
    }
  }

  const reqPromise = request<T>(path, { ...options, method: 'GET' })
    .then((data) => {
      if (!bypass) {
        apiCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: options.ttl || getTtlForPath(path),
        })
      }
      return data
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey)
    })

  if (!bypass) {
    inFlightRequests.set(cacheKey, reqPromise)
  }

  return reqPromise
}

export const api = {
  get: <T = any>(path: string, options?: RequestOptions) => cachedGet<T>(path, options),
  post: async <T = any>(path: string, body?: any) => {
    const res = await request<T>(path, { method: 'POST', body: JSON.stringify(body || {}) })
    invalidateCache(path)
    return res
  },
  put: async <T = any>(path: string, body?: any) => {
    const res = await request<T>(path, { method: 'PUT', body: JSON.stringify(body || {}) })
    invalidateCache(path)
    return res
  },
  delete: async <T = any>(path: string) => {
    const res = await request<T>(path, { method: 'DELETE' })
    invalidateCache(path)
    return res
  },
  invalidate: (pattern: string | RegExp) => {
    if (typeof pattern === 'string') {
      clearCacheMatching(new RegExp(`^${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`))
    } else {
      clearCacheMatching(pattern)
    }
  },
  clearCache: () => {
    apiCache.clear()
    inFlightRequests.clear()
  },
}

// ====================================================================
// Auth API
// ====================================================================
export const authApi = {
  register: (data: {
    email: string
    password: string
    fullName: string
    phone?: string
    role: 'WORKER' | 'EMPLOYER' | 'ADMIN'
    city?: string
    district?: string
    companyName?: string
    adminSecret?: string
  }) => api.post<{ user: any; token: string }>('/auth/register', data),

  login: (email: string, password: string, twoFactorCode?: string) =>
    api.post<{ user: any; token: string; requiresTwoFactor?: boolean; userId?: string }>(
      '/auth/login', { email, password, twoFactorCode }
    ),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<any>('/auth/me'),

  updateProfile: (data: any) => api.put<any>('/auth/me', data),

  // Şifre sıfırlama
  forgotPassword: (email: string) =>
    api.post<any>('/auth/forgot-password', { email }),

  resetPassword: (code: string, newPassword: string) =>
    api.post<any>('/auth/reset-password', { code, newPassword }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<any>('/auth/change-password', { currentPassword, newPassword }),

  // E-posta değiştirme
  requestEmailChange: (newEmail: string) =>
    api.post<any>('/auth/email-change/request', { newEmail }),

  confirmEmailChange: (code: string) =>
    api.post<any>('/auth/email-change/confirm', { code }),

  // 2FA
  setup2FA: () => api.post<any>('/auth/2fa/setup'),
  verify2FA: (code: string) => api.post<any>('/auth/2fa/verify', { code }),
  disable2FA: (code: string) => api.post<any>('/auth/2fa/disable', { code }),

  // Google OAuth
  googleAuth: (idToken: string) =>
    api.post<{ user: any; token: string; isNewUser: boolean }>('/auth/google', { idToken }),

  // Avatar
  uploadAvatar: (base64: string, mimeType: string) =>
    api.post<{ avatarUrl: string }>('/auth/avatar', { base64, mimeType }),

  // Güvenlik bilgileri
  getSecurityInfo: () => api.get<any>('/auth/security-info'),
}

// ====================================================================
// Jobs API
// ====================================================================
export const jobsApi = {
  list: (params: {
    page?: number
    pageSize?: number
    category?: string
    city?: string
    district?: string
    search?: string
    lat?: number
    lng?: number
    radiusKm?: number
    minWage?: number
    maxWage?: number
    workDateFrom?: string
    workDateTo?: string
    sortBy?: string
    employerId?: string
    status?: string
  } = {}) => {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) q.set(k, String(v))
    })
    return api.get<PaginatedResponse<any>>(`/jobs?${q.toString()}`)
  },

  get: (id: string) => api.get<any>(`/jobs/${id}`),

  create: (data: any) => api.post<any>('/jobs', data),

  update: (id: string, data: any) => api.put<any>(`/jobs/${id}`, data),

  updateStatus: (id: string, status: string) =>
    api.put<any>(`/jobs/${id}`, { status }),

  delete: (id: string) => api.delete<{ id: string }>(`/jobs/${id}`),

  save: (id: string) => api.post<any>(`/jobs/${id}/save`),

  saved: () => api.get<any[]>('/jobs/saved'),

  categories: () => api.get<any[]>('/jobs/categories'),
}

// ====================================================================
// Applications API
// ====================================================================
export const applicationsApi = {
  create: (data: { jobId: string; message?: string; proposedWage?: number }) =>
    api.post<any>('/applications', data),

  mine: (status?: string) => {
    const q = status ? `?status=${status}` : ''
    return api.get<any[]>(`/applications${q}`)
  },

  byJob: (jobId: string) =>
    api.get<any[]>(`/applications/by-job?jobId=${jobId}`),

  byEmployer: (status?: string) => {
    const q = status ? `?status=${status}` : ''
    return api.get<any[]>(`/applications${q}`)
  },

  updateStatus: (id: string, status: string, employerNote?: string) =>
    api.put<any>(`/applications/${id}`, { status, employerNote }),

  rate: (id: string, rating: number, comment?: string) =>
    api.post<any>(`/applications/${id}/rate`, { rating, comment }),
}

// ====================================================================
// Conversations / Messages API
// ====================================================================
export const conversationsApi = {
  list: () => api.get<any[]>('/conversations'),

  sendMessage: (data: {
    conversationId?: string
    recipientId?: string
    jobId?: string
    content: string
    type?: string
    metadata?: any
  }) => api.post<any>('/conversations', data),

  messages: (conversationId: string, page = 1, pageSize = 50) =>
    api.get<{ items: any[]; pagination: any }>(
      `/conversations/${conversationId}/messages?page=${page}&pageSize=${pageSize}`
    ),

  markRead: (conversationId: string) =>
    api.post('/conversations/read', { conversationId }),
}

// ====================================================================
// Notifications API
// ====================================================================
export const notificationsApi = {
  list: (onlyUnread = false, page = 1) =>
    api.get<{ items: any[]; unreadCount: number; pagination: any }>(
      `/notifications?unread=${onlyUnread}&page=${page}`
    ),

  markRead: (id: string) => api.put<any>(`/notifications/${id}`),

  markAllRead: () => api.post<{ updated: number }>('/notifications/read-all'),

  delete: (id: string) => api.delete(`/notifications/${id}`),
}

// ====================================================================
// Users API
// ====================================================================
export const usersApi = {
  get: (id: string) => api.get<any>(`/users/${id}`),
}

// ====================================================================
// Wallet API
// ====================================================================
export const walletApi = {
  balance: () => api.get<{ balance: number; currency: string; updatedAt: string | null }>('/wallet/balance'),

  transactions: (params: { type?: string; page?: number; pageSize?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.type) q.set('type', params.type)
    if (params.page) q.set('page', String(params.page))
    if (params.pageSize) q.set('pageSize', String(params.pageSize))
    return api.get<{ items: any[]; pagination: any }>(`/wallet/transactions?${q.toString()}`)
  },

  withdraw: (amount: number, bankInfo?: string, note?: string) =>
    api.post<any>('/wallet/withdraw', { amount, bankInfo, note }),

  transfer: (recipientId: string, amount: number, description?: string, note?: string) =>
    api.post<any>('/wallet/transfer', { recipientId, amount, description, note }),

  generateQrPayment: (amount: number, description: string) =>
    api.post<{ qrId: string; token: string; qrImageDataUrl: string; expiresAt: string; amount: number; description: string; generator: any }>(
      '/wallet/qr-pay/generate',
      { amount, description }
    ),

  scanQrPayment: (token: string) =>
    api.post<any>('/wallet/qr-pay/scan', { token }),

  // Para yatırma talebi (IBAN ile)
  createDepositRequest: (data: {
    amount: number
    senderName: string
    senderIban: string
    senderBank?: string
    senderNote?: string
  }) => api.post<any>('/wallet/deposit-request', data),

  depositRequests: (page = 1) =>
    api.get<any>(`/wallet/deposit-requests?page=${page}`),

  // Para çekme talebi (IBAN ile)
  createWithdrawRequest: (data: {
    amount: number
    recipientName: string
    recipientIban: string
    recipientBank?: string
    recipientNote?: string
  }) => api.post<any>('/wallet/withdraw-request', data),

  withdrawRequests: (page = 1) =>
    api.get<any>(`/wallet/withdraw-requests?page=${page}`),
}

// ====================================================================
// Geocode API
// ====================================================================
export const geocodeApi = {
  reverse: (lat: number, lng: number) =>
    api.get<any>(`/geocode/reverse?lat=${lat}&lng=${lng}`),
  search: (query: string, limit = 5) =>
    api.get<any[]>(`/geocode/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  suggest: (query: string, limit = 5) =>
    api.get<any[]>(`/geocode/suggest?q=${encodeURIComponent(query)}&limit=${limit}`),
}

export { ApiError }

