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
  initialize: () => void
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
        }
        set({ token, user, isAuthenticated: true })
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token')
        }
        set({ token: null, user: null, isAuthenticated: false })
      },
      initialize: () => {
        if (typeof window === 'undefined') return
        const token = localStorage.getItem('admin_token')
        if (token) {
          try {
            const parts = token.split('.')
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]))
              if (payload.role === 'ADMIN' && payload.exp * 1000 > Date.now()) {
                set({
                  token,
                  user: {
                    userId: payload.userId,
                    email: payload.email,
                    role: payload.role,
                    fullName: payload.fullName || 'Yönetici',
                  },
                  isAuthenticated: true,
                })
                return
              }
            }
            localStorage.removeItem('admin_token')
          } catch {
            localStorage.removeItem('admin_token')
          }
        }
      },
    }),
    { name: 'admin-auth-store' }
  )
)

// API fetch yardımcı fonksiyonu
export async function adminFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data
}
