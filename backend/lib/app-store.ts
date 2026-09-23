/**
 * App View Store - Single-page app için sayfa yönetimi
 */
'use client'

import { create } from 'zustand'

export type View =
  | 'home'        // İş listesi (ana sayfa)
  | 'job-detail'  // İş detayı
  | 'post-job'    // İşveren: yeni ilan
  | 'my-jobs'     // İşveren: ilanlarım
  | 'applications' // İşçi: başvurularım
  | 'messages'    // Mesajlaşma
  | 'profile'     // Profil
  | 'notifications' // Bildirimler
  | 'saved-jobs'  // Kaydedilen ilanlar
  | 'api-docs'    // API dokümantasyonu

interface AppState {
  view: View
  selectedJobId: string | null
  selectedConversationId: string | null
  selectedUserId: string | null
  go: (view: View, params?: { jobId?: string; conversationId?: string; userId?: string }) => void
  back: () => void
  history: View[]
}

export const useApp = create<AppState>((set, get) => ({
  view: 'home',
  selectedJobId: null,
  selectedConversationId: null,
  selectedUserId: null,
  history: [],

  go: (view, params) => {
    const state = get()
    set({
      view,
      selectedJobId: params?.jobId ?? state.selectedJobId,
      selectedConversationId: params?.conversationId ?? state.selectedConversationId,
      selectedUserId: params?.userId ?? state.selectedUserId,
      history: [...state.history, state.view],
    })
    // Scroll to top
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  },

  back: () => {
    const state = get()
    if (state.history.length > 0) {
      const newHistory = [...state.history]
      const prev = newHistory.pop()!
      set({ view: prev, history: newHistory })
    } else {
      set({ view: 'home' })
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  },
}))
