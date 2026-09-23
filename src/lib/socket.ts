/**
 * Frontend WebSocket client - Günübirlik İş Platformu
 * Tüm gerçek zamanlı özellikler için merkezi Socket.io yöneticisi
 */
'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket | null {
  return socket
}

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    socket.disconnect()
  }

  socket = io('/?XTransformPort=3004', {
    transports: ['websocket', 'polling'],
    forceNew: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
    auth: { token },
  })

  socket.on('connect', () => {
    console.log('[WS] Bağlandı')
  })

  socket.on('disconnect', (reason) => {
    console.log('[WS] Ayrıldı:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('[WS] Bağlantı hatası:', err.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function emit(event: string, data: any) {
  if (socket?.connected) {
    socket.emit(event, data)
  }
}

export function on(event: string, callback: (...args: any[]) => void) {
  if (socket) {
    socket.on(event, callback)
    return () => socket?.off(event, callback)
  }
  return () => {}
}

export function off(event: string, callback?: (...args: any[]) => void) {
  if (socket) {
    if (callback) socket.off(event, callback)
    else socket.removeAllListeners(event)
  }
}
