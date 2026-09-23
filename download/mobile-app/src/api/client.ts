/**
 * API Client - Axios ile merkezi HTTP istemcisi
 *
 * - Token yönetimi otomatik (SecureStore)
 * - 401 hatasında otomatik logout
 * - Merkezi hata yönetimi
 * - Tüm API endpoint'leri burada
 */

import axios, { AxiosInstance, AxiosError } from 'axios'
import * as SecureStore from 'expo-secure-store'
import { CONFIG } from '../config'

const TOKEN_KEY = 'auth_token'

// Token helper'ları
export const tokenStorage = {
  async get(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY)
    } catch {
      return null
    }
  },
  async set(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
  },
  async remove(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY)
  },
}

// Axios instance
const api: AxiosInstance = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: token ekle
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: 401'de logout
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await tokenStorage.remove()
      // Auth store'u sıfırla
      // (circular dependency önlemek için dinamik import)
      const { useAuthStore } = await import('../store/auth')
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

// ============================================================
// Response tipleri
// ============================================================
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  requiresTwoFactor?: boolean
  userId?: string
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

// ============================================================
// Auth API
// ============================================================
export const authApi = {
  register: async (data: {
    email: string
    password: string
    fullName: string
    phone?: string
    role: 'WORKER' | 'EMPLOYER'
    city?: string
    district?: string
    companyName?: string
  }) => {
    const res = await api.post<ApiResponse<{ user: any; token: string }>>('/auth/register', data)
    return res.data.data!
  },

  login: async (email: string, password: string, twoFactorCode?: string) => {
    const res = await api.post<ApiResponse<{ user: any; token: string }>>('/auth/login', {
      email,
      password,
      twoFactorCode,
    })
    // 2FA gerekli mi
    if (res.data.requiresTwoFactor) {
      const err = new Error('2FA_REQUIRED') as any
      err.requiresTwoFactor = true
      err.userId = res.data.userId
      throw err
    }
    if (!res.data.success) {
      throw new Error(res.data.error || 'Giriş başarısız.')
    }
    return res.data.data!
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch {}
  },

  me: async () => {
    const res = await api.get<ApiResponse<any>>('/auth/me')
    return res.data.data!
  },

  updateProfile: async (data: any) => {
    const res = await api.put<ApiResponse<any>>('/auth/me', data)
    return res.data.data!
  },

  // Şifre sıfırlama
  forgotPassword: async (email: string) => {
    const res = await api.post<ApiResponse<any>>('/auth/forgot-password', { email })
    return res.data.data!
  },

  resetPassword: async (code: string, newPassword: string) => {
    const res = await api.post<ApiResponse<any>>('/auth/reset-password', { code, newPassword })
    return res.data.data!
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.post<ApiResponse<any>>('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return res.data.data!
  },

  // E-posta değiştirme
  requestEmailChange: async (newEmail: string) => {
    const res = await api.post<ApiResponse<any>>('/auth/email-change/request', { newEmail })
    return res.data.data!
  },

  confirmEmailChange: async (code: string) => {
    const res = await api.post<ApiResponse<any>>('/auth/email-change/confirm', { code })
    return res.data.data!
  },

  // 2FA
  setup2FA: async () => {
    const res = await api.post<ApiResponse<any>>('/auth/2fa/setup')
    return res.data.data!
  },

  verify2FA: async (code: string) => {
    const res = await api.post<ApiResponse<any>>('/auth/2fa/verify', { code })
    return res.data.data!
  },

  disable2FA: async (code: string) => {
    const res = await api.post<ApiResponse<any>>('/auth/2fa/disable', { code })
    return res.data.data!
  },

  // Google OAuth
  googleAuth: async (idToken: string) => {
    const res = await api.post<ApiResponse<{ user: any; token: string; isNewUser: boolean }>>(
      '/auth/google',
      { idToken }
    )
    return res.data.data!
  },

  // Avatar
  uploadAvatar: async (base64: string, mimeType: string) => {
    const res = await api.post<ApiResponse<{ avatarUrl: string }>>('/auth/avatar', {
      base64,
      mimeType,
    })
    return res.data.data!
  },

  // Güvenlik bilgileri
  getSecurityInfo: async () => {
    const res = await api.get<ApiResponse<any>>('/auth/security-info')
    return res.data.data!
  },
}

// ============================================================
// Jobs API
// ============================================================
export const jobsApi = {
  list: async (params: {
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
    const res = await api.get<ApiResponse<PaginatedResponse<any>>>('/jobs', { params })
    return res.data.data!
  },

  get: async (id: string) => {
    const res = await api.get<ApiResponse<any>>(`/jobs/${id}`)
    return res.data.data!
  },

  create: async (data: any) => {
    const res = await api.post<ApiResponse<any>>('/jobs', data)
    return res.data.data!
  },

  update: async (id: string, data: any) => {
    const res = await api.put<ApiResponse<any>>(`/jobs/${id}`, data)
    return res.data.data!
  },

  updateStatus: async (id: string, status: string) => {
    const res = await api.put<ApiResponse<any>>(`/jobs/${id}`, { status })
    return res.data.data!
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<{ id: string }>>(`/jobs/${id}`)
    return res.data.data!
  },

  save: async (id: string) => {
    const res = await api.post<ApiResponse<any>>(`/jobs/${id}/save`)
    return res.data.data!
  },

  saved: async () => {
    const res = await api.get<ApiResponse<any[]>>('/jobs/saved')
    return res.data.data!
  },

  categories: async () => {
    const res = await api.get<ApiResponse<any[]>>('/jobs/categories')
    return res.data.data!
  },
}

// ============================================================
// Applications API
// ============================================================
export const applicationsApi = {
  create: async (data: { jobId: string; message?: string; proposedWage?: number }) => {
    const res = await api.post<ApiResponse<any>>('/applications', data)
    return res.data.data!
  },

  mine: async (status?: string) => {
    const params = status ? { status } : {}
    const res = await api.get<ApiResponse<any[]>>('/applications', { params })
    return res.data.data!
  },

  byJob: async (jobId: string) => {
    const res = await api.get<ApiResponse<any[]>>(`/applications/by-job?jobId=${jobId}`)
    return res.data.data!
  },

  byEmployer: async (status?: string) => {
    const params = status ? { status } : {}
    const res = await api.get<ApiResponse<any[]>>('/applications/by-employer', { params })
    return res.data.data!
  },

  updateStatus: async (id: string, status: string, employerNote?: string) => {
    const res = await api.put<ApiResponse<any>>(`/applications/${id}`, { status, employerNote })
    return res.data.data!
  },

  rate: async (id: string, rating: number, comment?: string) => {
    const res = await api.post<ApiResponse<any>>(`/applications/${id}/rate`, { rating, comment })
    return res.data.data!
  },
}

// ============================================================
// Conversations / Messages API
// ============================================================
export const conversationsApi = {
  list: async () => {
    const res = await api.get<ApiResponse<any[]>>('/conversations')
    return res.data.data!
  },

  sendMessage: async (data: {
    conversationId?: string
    recipientId?: string
    jobId?: string
    content: string
    type?: string
  }) => {
    const res = await api.post<ApiResponse<any>>('/conversations', data)
    return res.data.data!
  },

  messages: async (conversationId: string, page = 1, pageSize = 50) => {
    const res = await api.get<ApiResponse<{ items: any[]; pagination: any }>>(
      `/conversations/${conversationId}/messages?page=${page}&pageSize=${pageSize}`
    )
    return res.data.data!
  },

  markRead: async (conversationId: string) => {
    const res = await api.post<ApiResponse<any>>('/conversations/read', { conversationId })
    return res.data.data!
  },
}

// ============================================================
// Notifications API
// ============================================================
export const notificationsApi = {
  list: async (onlyUnread = false, page = 1) => {
    const res = await api.get<ApiResponse<{ items: any[]; unreadCount: number; pagination: any }>>(
      `/notifications?unread=${onlyUnread}&page=${page}`
    )
    return res.data.data!
  },

  markRead: async (id: string) => {
    const res = await api.put<ApiResponse<any>>(`/notifications/${id}`)
    return res.data.data!
  },

  markAllRead: async () => {
    const res = await api.post<ApiResponse<{ updated: number }>>('/notifications/read-all')
    return res.data.data!
  },

  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<any>>(`/notifications/${id}`)
    return res.data.data!
  },
}

// ============================================================
// Users API
// ============================================================
export const usersApi = {
  get: async (id: string) => {
    const res = await api.get<ApiResponse<any>>(`/users/${id}`)
    return res.data.data!
  },
}

// Hata mesajı çıkarıcı
export function getErrorMessage(error: any): string {
  if (error?.response?.data?.error) return error.response.data.error
  if (error?.message) return error.message
  return 'Bir hata oluştu.'
}
