/**
 * WebSocket Service - Socket.io client
 *
 * Gerçek zamanlı mesajlaşma, bildirimler, online durum
 *
 * Bağlantı: ws://host:3004 (XTransformPort ile Caddy gateway)
 */

import { io, Socket } from 'socket.io-client'
import { CONFIG } from '../config'
import { tokenStorage } from './client'

type EventHandler = (...args: any[]) => void

class SocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Set<EventHandler>> = new Map()

  async connect(token: string): Promise<Socket> {
    if (this.socket?.connected) {
      this.socket.disconnect()
    }

    // XTransformPort query parametresi ile Caddy gateway'e bağlan
    this.socket = io(`${CONFIG.WS_URL}/?XTransformPort=${CONFIG.WS_PORT}`, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      auth: { token },
    })

    this.socket.on('connect', () => {
      console.log('[WS] Bağlandı')
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Ayrıldı:', reason)
    })

    this.socket.on('connect_error', (err) => {
      console.error('[WS] Bağlantı hatası:', err.message)
    })

    // Önceki listener'ları yeniden bağla
    for (const [event, handlers] of this.listeners.entries()) {
      for (const handler of handlers) {
        this.socket.on(event, handler)
      }
    }

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    }
  }

  on(event: string, handler: EventHandler): () => void {
    // Listener'ı kaydet
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler)

    // Socket'e bağla
    if (this.socket) {
      this.socket.on(event, handler)
    }

    // Cleanup function
    return () => {
      this.listeners.get(event)?.delete(handler)
      this.socket?.off(event, handler)
    }
  }

  off(event: string, handler?: EventHandler) {
    if (this.socket) {
      if (handler) {
        this.socket.off(event, handler)
        this.listeners.get(event)?.delete(handler)
      } else {
        this.socket.removeAllListeners(event)
        this.listeners.delete(event)
      }
    }
  }
}

export const socketService = new SocketService()
