'use client'

import { useState, useEffect, useRef } from 'react'
import { conversationsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageSquare, Circle, ArrowLeft, Phone, MapPin, Briefcase } from 'lucide-react'
import { formatRelative, formatTime, initials } from '@/lib/format'
import { toast } from 'sonner'
import { getSocket, connectSocket, on, off } from '@/lib/socket'

export default function MessagesScreen() {
  const { user } = useAuth()
  const { go } = useApp()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<any>()

  // WebSocket bağla
  useEffect(() => {
    if (!user) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      const socket = connectSocket(token)
      socket.on('connect', () => setConnected(true))
      socket.on('disconnect', () => setConnected(false))
    }

    const unsubNewMsg = on('message:new', (msg: any) => {
      if (msg.conversationId === selectedId) {
        setMessages((prev) => [...prev, msg])
        scrollToBottom()
      } else {
        // Konuşma listesinde unread count artır
        setConversations((prev) =>
          prev.map((c) =>
            c.id === msg.conversationId
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: msg }
              : c
          )
        )
      }
    })

    const unsubTypingStart = on('typing:start', (data: any) => {
      if (data.conversationId === selectedId) {
        setIsTyping(true)
      }
    })

    const unsubTypingStop = on('typing:stop', (data: any) => {
      if (data.conversationId === selectedId) {
        setIsTyping(false)
      }
    })

    const unsubRead = on('message:read', () => {
      // Okundu işaretlerini güncelle
    })

    return () => {
      unsubNewMsg?.()
      unsubTypingStart?.()
      unsubTypingStop?.()
      unsubRead?.()
    }
  }, [user, selectedId])

  // Konuşma listesi
  const loadConversations = async () => {
    setLoading(true)
    try {
      const result = await conversationsApi.list()
      setConversations(result)
      if (result.length > 0 && !selectedId) {
        selectConversation(result[0].id)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadConversations()
  }, [user])

  // Mesajlar
  const selectConversation = async (id: string) => {
    setSelectedId(id)
    setLoadingMessages(true)
    try {
      const result = await conversationsApi.messages(id)
      setMessages(result.items)
      // Okundu işaretle
      await conversationsApi.markRead(id)
      // Konuşma listesinde unread sıfırla
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      )
      // WS odasına katıl
      getSocket()?.emit('conversation:join', { conversationId: id })
      scrollToBottom()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSend = () => {
    if (!newMessage.trim() || !selectedId) return
    const content = newMessage.trim()
    setNewMessage('')

    // Optimistic - hemen ekrana ekle
    const optimisticMsg = {
      id: `temp_${Date.now()}`,
      conversationId: selectedId,
      senderId: user!.id,
      sender: { id: user!.id, fullName: user!.fullName },
      content,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      pending: true,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    // WebSocket ile gönder (hızlı)
    const socket = getSocket()
    if (socket?.connected) {
      socket.emit('message:send', {
        conversationId: selectedId,
        content,
        type: 'TEXT',
      })
    }

    // DB'ye de kaydet (arka planda)
    conversationsApi
      .sendMessage({ conversationId: selectedId, content })
      .then(() => {
        // Optimistic mesajı gerçek ile değiştir
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMsg.id ? { ...m, pending: false } : m))
        )
      })
      .catch((err) => {
        toast.error('Mesaj gönderilemedi: ' + err.message)
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
        setNewMessage(content)
      })
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    const socket = getSocket()
    if (!socket || !selectedId) return

    socket.emit('typing:start', { conversationId: selectedId })

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: selectedId })
    }, 1500)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  const selected = conversations.find((c) => c.id === selectedId)

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
      <div className="mb-3 sm:mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Mesajlar</h1>
        <Badge variant={connected ? 'default' : 'secondary'} className={connected ? 'bg-green-500' : 'text-xs flex-shrink-0'}>
          <Circle className={`w-2 h-2 mr-1 ${connected ? 'fill-white' : 'fill-gray-400'}`} />
          <span className="hidden sm:inline">{connected ? 'Bağlı' : 'Bağlanıyor...'}</span>
          <span className="sm:hidden">{connected ? 'Aktif' : '...'}</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 h-[calc(100dvh-180px)] sm:h-[600px]">
        {/* Konuşma listesi */}
        <div className={`border rounded-lg overflow-hidden ${selectedId ? 'hidden md:block' : ''}`}>
          <ScrollArea className="h-full custom-scrollbar">
            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Henüz mesajlaşma yok</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left p-3 border-b hover:bg-gray-50 transition flex items-start gap-3 ${
                    selectedId === conv.id ? 'bg-emerald-50' : ''
                  }`}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                      {initials(conv.participant?.fullName || conv.participant?.companyName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {conv.participant?.companyName || conv.participant?.fullName}
                      </h4>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatRelative(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {conv.job && (
                      <p className="text-[11px] text-emerald-600 truncate">
                        💼 {conv.job.title}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.lastMessage?.content || 'Yeni konuşma'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white text-[10px] flex-shrink-0">
                      {conv.unreadCount}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Mesaj içeriği */}
        <div className={`md:col-span-2 border rounded-lg flex flex-col overflow-hidden ${!selectedId ? 'hidden md:flex' : ''}`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 p-4">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Bir konuşma seçin</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-2 sm:p-3 border-b flex items-center gap-2 sm:gap-3 bg-white">
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 flex-shrink-0" onClick={() => setSelectedId(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar className="w-9 h-9 flex-shrink-0">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                    {initials(selected.participant?.fullName || selected.participant?.companyName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {selected.participant?.companyName || selected.participant?.fullName}
                  </div>
                  {selected.job && (
                    <button
                      className="text-xs text-emerald-600 hover:underline truncate block max-w-full"
                      onClick={() => go('job-detail', { jobId: selected.job.id })}
                    >
                      💼 <span className="truncate">{selected.job.title}</span>
                    </button>
                  )}
                </div>
                {selected.participant?.isVerified && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px] flex-shrink-0">
                    <span className="hidden sm:inline">Doğrulanmış</span>
                    <span className="sm:hidden">✓</span>
                  </Badge>
                )}
              </div>

              {/* Mesajlar */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 custom-scrollbar">
                {loadingMessages ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user?.id
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-3 py-2 ${
                              isMe
                                ? 'bg-emerald-600 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                            } ${msg.pending ? 'opacity-60' : ''}`}
                          >
                            <p className="text-sm break-words">{msg.content}</p>
                            <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                              {msg.pending && <Circle className="w-2 h-2 fill-current" />}
                              {formatTime(msg.createdAt)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-3 py-2">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Mesaj input - Mobil klavye için sticky */}
              <div className="p-2 sm:p-3 border-t bg-white flex gap-2">
                <Input
                  placeholder="Mesajınızı yazın..."
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  className="flex-1 h-11"
                />
                <Button onClick={handleSend} disabled={!newMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700 h-11 w-11 p-0 flex-shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
