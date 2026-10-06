/**
 * Auth Store - Zustand ile global kimlik durumu
 */
'use client'

import { create } from 'zustand'
import { authApi } from './api'
import { connectSocket, disconnectSocket } from './socket'

interface AuthUser {
  id: string
  email: string
  fullName: string
  role: 'WORKER' | 'EMPLOYER' | 'ADMIN'
  avatarUrl?: string
  phone?: string
  companyName?: string
  isVerified?: boolean
  city?: string
  district?: string
  bio?: string
  skills?: string[]
  ratingAvg?: number
  ratingCount?: number
  [key: string]: any
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean

  initialize: () => Promise<void>
  login: (email: string, password: string, twoFactorCode?: string) => Promise<void>
  register: (data: any) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  updateUser: (data: Partial<AuthUser>) => void
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      return
    }
    try {
      const user = await authApi.me()
      if (typeof window !== 'undefined' && user?.id) {
        import('@/lib/onesignal').then(({ registerOneSignalUser }) => {
          registerOneSignalUser(user.id, user.role, user.email)
        })
      }
      set({ user, token, isAuthenticated: true, isLoading: false })
    } catch {
      if (typeof window !== 'undefined') localStorage.removeItem('auth_token')
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (email, password, twoFactorCode) => {
    set({ isLoading: true })
    try {
      const result = await authApi.login(email, password, twoFactorCode)
      // 2FA gerekli mi kontrol et
      if ((result as any).requiresTwoFactor) {
        throw new Error('2FA_REQUIRED')
      }
      // Web tarafında cookie httpOnly olduğu için JS erişemez
      // Mobil token localStorage'a kaydedilir
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', result.token)
      }
      // WebSocket bağla
      connectSocket(result.token)
      // OneSignal'a kayıt (User ID, Role, Email)
      if (typeof window !== 'undefined') {
        import('@/lib/onesignal').then(({ registerOneSignalUser }) => {
          registerOneSignalUser(result.user.id, result.user.role, result.user.email)
        })
      }
      set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true })
    try {
      const result = await authApi.googleAuth(idToken)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', result.token)
      }
      connectSocket(result.token)
      // OneSignal'a kayıt (User ID, Role, Email)
      if (typeof window !== 'undefined') {
        import('@/lib/onesignal').then(({ registerOneSignalUser }) => {
          registerOneSignalUser(result.user.id, result.user.role, result.user.email)
        })
      }
      set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const result = await authApi.register(data)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', result.token)
      }
      connectSocket(result.token)
      // OneSignal'a kayıt (User ID, Role, Email)
      if (typeof window !== 'undefined') {
        import('@/lib/onesignal').then(({ registerOneSignalUser }) => {
          registerOneSignalUser(result.user.id, result.user.role, result.user.email)
        })
      }
      set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false })
      // Admin rolü için admin paneline yönlendir
      if (result.user.role === 'ADMIN' && typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.href = '/admin'
        }, 800)
      }
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
    disconnectSocket()
    // OneSignal'dan çık
    if (typeof window !== 'undefined') {
      import('@/lib/onesignal').then(({ unregisterOneSignalUser }) => {
        unregisterOneSignalUser()
      })
    }
    set({ user: null, token: null, isAuthenticated: false, isLoading: false })
  },

  refresh: async () => {
    try {
      const user = await authApi.me()
      set({ user, isAuthenticated: true })
    } catch {
      get().logout()
    }
  },

  updateUser: (data) => {
    set((state) => ({ user: { ...state.user!, ...data } }))
  },
}))
