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
    ...options.headers,
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

export const api = {
  get: <T = any>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  put: <T = any>(path: string, body?: any) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
  delete: <T = any>(path: string) => request<T>(path, { method: 'DELETE' }),
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

export { ApiError }
