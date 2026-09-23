/**
 * Auth Store - Zustand ile global kimlik durumu
 *
 * - Token SecureStore'da saklanır (güvenli)
 * - Otomatik initialize (app açılışında)
 * - 2FA desteği
 * - Google OAuth desteği
 * - WebSocket otomatik bağlanma
 */

import { create } from 'zustand'
import { authApi, tokenStorage } from '../api/client'
import { socketService } from '../api/socket'

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
  twoFactorEnabled?: boolean
  provider?: string
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    try {
      const token = await tokenStorage.get()
      if (token) {
        // Token varsa kullanıcı bilgilerini al
        const user = await authApi.me()
        set({ user, token, isAuthenticated: true, isLoading: false })
        // WebSocket bağla
        socketService.connect(token)
      } else {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      }
    } catch {
      await tokenStorage.remove()
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (email, password, twoFactorCode) => {
    set({ isLoading: true })
    try {
      const result = await authApi.login(email, password, twoFactorCode)
      await tokenStorage.set(result.token)
      socketService.connect(result.token)
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
      await tokenStorage.set(result.token)
      socketService.connect(result.token)
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
      await tokenStorage.set(result.token)
      socketService.connect(result.token)
      set({ user: result.user, token: result.token, isAuthenticated: true, isLoading: false })
    } catch (e) {
      set({ isLoading: false })
      throw e
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {}
    await tokenStorage.remove()
    socketService.disconnect()
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
