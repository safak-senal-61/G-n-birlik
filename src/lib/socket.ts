/**
 * Frontend Realtime Client - Günübirlik İş Platformu
 * Supabase Realtime kullanarak:
 *  - Anlık bildirimler (notification:new, notification:application)
 *  - Gerçek zamanlı mesajlaşma (message:new, message:read)
 *  - Yazıyor... göstergesi (typing:start, typing:stop)
 *  - Sistem yayınları (broadcast)
 *
 * Socket.io yerine 100% Supabase Realtime WebSocket altyapısı kullanılır.
 */
'use client'

import { createClient, RealtimeChannel } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dyiqfounesugdljzzebh.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_irls6ujUsDGr3ImADjaKMA_pgxe-_hy'

// Singleton Supabase client
let supabaseClient: any = null
function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    })
  }
  return supabaseClient
}

// Global event registry for on / off
const eventListeners = new Map<string, Set<(...args: any[]) => void>>()

function triggerEvent(event: string, ...args: any[]) {
  const listeners = eventListeners.get(event)
  if (listeners) {
    listeners.forEach((cb) => {
      try {
        cb(...args)
      } catch (err) {
        console.error(`[Supabase Realtime] Listener hatası (${event}):`, err)
      }
    })
  }
}

// Active channels
let globalChannel: RealtimeChannel | null = null
let userChannel: RealtimeChannel | null = null
const conversationChannels = new Map<string, RealtimeChannel>()
let currentUserId: string | null = null

// Parse JWT safely to get userId
function extractUserIdFromToken(token: string): string | null {
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
      const payload = JSON.parse(payloadStr)
      return payload.userId || payload.sub || payload.id || null
    }
  } catch {}
  return null
}

export interface RealtimeSocket {
  connected: boolean
  id?: string
  on: (event: string, callback: (...args: any[]) => void) => RealtimeSocket
  off: (event: string, callback?: (...args: any[]) => void) => RealtimeSocket
  emit: (event: string, data?: any) => void
  disconnect: () => void
}

let socketInstance: RealtimeSocket | null = null

export function getSocket(): RealtimeSocket | null {
  return socketInstance
}

export function connectSocket(token?: string): RealtimeSocket {
  if (typeof window === 'undefined') {
    return {
      connected: false,
      on: () => ({} as any),
      off: () => ({} as any),
      emit: () => {},
      disconnect: () => {},
    }
  }

  const supabase = getSupabaseClient()
  const userId = token ? extractUserIdFromToken(token) : currentUserId
  if (userId) currentUserId = userId

  if (socketInstance?.connected) {
    return socketInstance
  }

  const socket: RealtimeSocket = {
    connected: false,
    id: `sb_${userId || 'guest'}_${Date.now()}`,

    on(event: string, callback: (...args: any[]) => void) {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, new Set())
      }
      eventListeners.get(event)!.add(callback)
      return socket
    },

    off(event: string, callback?: (...args: any[]) => void) {
      if (!callback) {
        eventListeners.delete(event)
      } else {
        eventListeners.get(event)?.delete(callback)
      }
      return socket
    },

    emit(event: string, data: any = {}) {
      // 1. Konuşmaya katılma
      if (event === 'conversation:join' && data.conversationId) {
        joinConversationChannel(data.conversationId)
        return
      }

      // 2. Mesaj gönderme
      if (event === 'message:send' && data.conversationId) {
        const convChannel = joinConversationChannel(data.conversationId)
        convChannel.send({
          type: 'broadcast',
          event: 'message:new',
          payload: {
            ...data,
            senderId: userId || currentUserId,
            createdAt: new Date().toISOString(),
          },
        })
        return
      }

      // 3. Yazıyor bildirimleri
      if ((event === 'typing:start' || event === 'typing:stop') && data.conversationId) {
        const convChannel = joinConversationChannel(data.conversationId)
        convChannel.send({
          type: 'broadcast',
          event,
          payload: {
            conversationId: data.conversationId,
            userId: userId || currentUserId,
          },
        })
        return
      }

      // 4. Genel broadcast
      if (globalChannel) {
        globalChannel.send({
          type: 'broadcast',
          event,
          payload: data,
        })
      }
    },

    disconnect() {
      disconnectSocket()
    },
  }

  socketInstance = socket

  // 1. Global kanal aboneliği (sistem duyuruları, yakın işler)
  if (!globalChannel) {
    const gCh = supabase.channel('gunubirlik:global', {
      config: { broadcast: { self: true } },
    })
    globalChannel = gCh

    gCh.on('broadcast', { event: '*' }, ({ event, payload }: any) => {
      triggerEvent(event, payload)
    })

    gCh.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        socket.connected = true
        console.log('[Supabase Realtime] Bağlandı (Global kanal aktif)')
        triggerEvent('connect')
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        socket.connected = false
        console.log('[Supabase Realtime] Bağlantı durumu:', status)
        triggerEvent('disconnect')
      }
    })
  }

  // 2. Kullanıcıya özel bildirim kanalı
  if (userId && !userChannel) {
    const uCh = supabase.channel(`user:${userId}`, {
      config: { broadcast: { self: true } },
    })
    userChannel = uCh

    uCh.on('broadcast', { event: '*' }, ({ event, payload }: any) => {
      triggerEvent(event, payload)
    })

    uCh.subscribe((status: string) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Supabase Realtime] Kullanıcı kanalı bağlandı: user:${userId}`)
      }
    })
  }

  return socket
}

export function joinConversationChannel(conversationId: string): RealtimeChannel {
  const supabase = getSupabaseClient()

  if (conversationChannels.has(conversationId)) {
    return conversationChannels.get(conversationId)!
  }

  const channel = supabase.channel(`conversation:${conversationId}`, {
    config: { broadcast: { self: true } },
  })

  channel.on('broadcast', { event: '*' }, ({ event, payload }) => {
    triggerEvent(event, payload)
  })

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Supabase Realtime] Konuşma kanalına katıldı: conversation:${conversationId}`)
    }
  })

  conversationChannels.set(conversationId, channel)
  return channel
}

export function disconnectSocket() {
  const supabase = getSupabaseClient()

  if (globalChannel) {
    supabase.removeChannel(globalChannel)
    globalChannel = null
  }

  if (userChannel) {
    supabase.removeChannel(userChannel)
    userChannel = null
  }

  for (const [, ch] of conversationChannels.entries()) {
    supabase.removeChannel(ch)
  }
  conversationChannels.clear()

  if (socketInstance) {
    socketInstance.connected = false
    triggerEvent('disconnect')
    socketInstance = null
  }
  console.log('[Supabase Realtime] Bağlantı sonlandırıldı')
}

export function emit(event: string, data?: any) {
  if (socketInstance) {
    socketInstance.emit(event, data)
  }
}

export function on(event: string, callback: (...args: any[]) => void) {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set())
  }
  eventListeners.get(event)!.add(callback)
  return () => {
    eventListeners.get(event)?.delete(callback)
  }
}

export function off(event: string, callback?: (...args: any[]) => void) {
  if (!callback) {
    eventListeners.delete(event)
  } else {
    eventListeners.get(event)?.delete(callback)
  }
}
