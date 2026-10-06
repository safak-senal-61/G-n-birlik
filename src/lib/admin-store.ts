'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AdminUser {
  userId: string
  email: string
  role: string
  fullName: string
}

interface AdminAuthState {
  token: string | null
  user: AdminUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: AdminUser) => void
  logout: () => void
  initialize: () => Promise<void>
}

// Base64URL uyumlu ve hataya dayanıklı JWT payload çözümleyici
function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', token)
          localStorage.setItem('auth_token', token)
        }
        set({ token, user, isAuthenticated: true })
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token')
        }
        set({ token: null, user: null, isAuthenticated: false })
      },
      initialize: async () => {
        if (typeof window === 'undefined') return

        // 1. Önce admin_token kontrol et
        let token = localStorage.getItem('admin_token')

        // 2. admin_token yoksa auth_token kontrol et (ana siteden giriş yapılmış olabilir)
        if (!token) {
          token = localStorage.getItem('auth_token')
        }

        // 3. Token varsa çöz ve ADMIN rolünü doğrula
        if (token) {
          const payload = parseJwtPayload(token)
          if (payload && payload.role === 'ADMIN' && (!payload.exp || payload.exp * 1000 > Date.now())) {
            localStorage.setItem('admin_token', token)
            set({
              token,
              user: {
                userId: payload.userId || payload.id,
                email: payload.email,
                role: payload.role,
                fullName: payload.fullName || 'Yönetici',
              },
              isAuthenticated: true,
            })
            return
          }
        }

        // 4. Token yoksa veya parse edilemediyse cookie üzerinden /api/v1/auth/me kontrol et
        try {
          const res = await fetch('/api/v1/auth/me', { credentials: 'include' })
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.data?.role === 'ADMIN') {
              const u = data.data
              if (token) localStorage.setItem('admin_token', token)
              set({
                token: token || null,
                user: {
                  userId: u.id,
                  email: u.email,
                  role: u.role,
                  fullName: u.fullName || 'Yönetici',
                },
                isAuthenticated: true,
              })
              return
            }
          }
        } catch {
          // Sessizce geç
        }

        // Hiçbiri tutmadıysa oturumu temizle
        set({ token: null, user: null, isAuthenticated: false })
      },
    }),
    { name: 'admin-auth-store' }
  )
)

// API fetch yardımcı fonksiyonu
export async function adminFetch(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('admin_token') || localStorage.getItem('auth_token')
      : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers, credentials: 'include' })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data
}
