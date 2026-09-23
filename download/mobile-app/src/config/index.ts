/**
 * Uygulama Yapılandırması
 *
 * API_BASE_URL: Backend API URL (production'da kendi domainini gir)
 * WS_URL: WebSocket sunucu URL
 *
 * Development: localhost yerine kendi bilgisayar IP'ni kullan (örn: 192.168.1.100)
 * Expo Go ile test ederken localhost ÇALIŞMAZ!
 */

import Constants from 'expo-constants'

// Expo extra'dan veya environment variable'dan al
const extra = Constants.expoConfig?.extra || {}

export const CONFIG = {
  // Backend API - bu ortamın public IP'si
  API_BASE_URL: 'http://21.0.9.75:3000/api/v1',

  // WebSocket
  WS_URL: 'http://21.0.9.75:3000',
  WS_PORT: '3004',
}

// Renk paleti (web ile uyumlu)
export const COLORS = {
  primary: '#10b981',      // emerald-600
  primaryDark: '#059669',  // emerald-700
  primaryLight: '#d1fae5', // emerald-100
  secondary: '#14b8a6',    // teal-600
  accent: '#f59e0b',       // amber-500
  danger: '#ef4444',       // red-500
  success: '#22c55e',      // green-500
  warning: '#f59e0b',      // amber-500
  info: '#3b82f6',         // blue-500

  background: '#f9fafb',   // gray-50
  surface: '#ffffff',
  text: '#111827',         // gray-900
  textSecondary: '#6b7280',// gray-500
  textMuted: '#9ca3af',    // gray-400
  border: '#e5e7eb',       // gray-200
}

// Kategori renkleri
export const CATEGORY_COLORS: Record<string, string> = {
  INSAAT: '#f59e0b',
  RESTAURANT: '#ef4444',
  TEMIZLIK: '#06b6d4',
  NAKLIYE: '#8b5cf6',
  TARIM: '#84cc16',
  TEKNIK: '#0ea5e9',
  SAGLIK: '#ec4899',
  DIGER: '#6b7280',
}

export const CATEGORIES = [
  { value: 'INSAAT', label: 'İnşaat & Yapı', icon: '🔨' },
  { value: 'RESTAURANT', label: 'Restoran', icon: '🍽️' },
  { value: 'TEMIZLIK', label: 'Temizlik', icon: '✨' },
  { value: 'NAKLIYE', label: 'Nakliyat', icon: '🚚' },
  { value: 'TARIM', label: 'Tarım', icon: '🌾' },
  { value: 'TEKNIK', label: 'Teknik', icon: '🔧' },
  { value: 'SAGLIK', label: 'Sağlık', icon: '❤️' },
  { value: 'DIGER', label: 'Diğer', icon: '💼' },
]
