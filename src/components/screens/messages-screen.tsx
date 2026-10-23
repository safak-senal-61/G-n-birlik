'use client'

import { useState, useEffect, useRef } from 'react'
import { conversationsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, MessageSquare, Circle, ArrowLeft, Briefcase } from 'lucide-react'
import { formatRelative, formatTime, initials } from '@/lib/format'
import { toast } from 'sonner'
import { getSocket, connectSocket, on } from '@/lib/socket'

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
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<any>(null)
  const remoteTypingTimeoutRef = useRef<any>(null)

  useEffect(() => {
    if (!user) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    const socket = connectSocket(token || user.id)
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))
    if (socket.connected) setConnected(true)

    const unsubNewMsg = on('message:new', (msg: any) => {
      if (!msg || !msg.conversationId) return

      if (msg.conversationId === selectedId) {
        setMessages((prev) => {
          // 1. Zaten listede bu ID varsa tekrar ekleme (çift gösterimi önler)
          if (msg.id && prev.some((m) => m.id === msg.id)) {
            return prev
          }
          // 2. tempId eşleşmesi varsa (sunucudan gelen resmi onay veya soket tempId)
          if (msg.tempId) {
            const matchIdx = prev.findIndex(
              (m) => m.id === msg.tempId || m.tempId === msg.tempId
            )
            if (matchIdx !== -1) {
              const updated = [...prev]
              updated[matchIdx] = { ...updated[matchIdx], ...msg, id: msg.id || updated[matchIdx].id, pending: false }
              return updated
            }
          }
          // 3. Eğer gönderen mevcut kullanıcı ise ve temp/pending mesaj varsa onunla eşle
          if (msg.senderId === user.id) {
            const tempIdx = prev.findIndex(
              (m) => m.pending || (typeof m.id === 'string' && m.id.startsWith('temp_'))
            )
            if (tempIdx !== -1) {
              const updated = [...prev]
              updated[tempIdx] = { ...updated[tempIdx], ...msg, id: msg.id || updated[tempIdx].id, pending: false }
              return updated
            }
          }
          return [...prev, msg]
        })

        // Karşı taraf mesajı gönderdiğinde yazıyor efektini sonlandır
        if (msg.senderId !== user.id) {
          setIsTyping(false)
          setTypingUser(null)
          if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current)
        }

        scrollToBottom()
      } else {
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
      // Kendimizin tetiklediği yazıyor olayını yok say
      if (data.conversationId === selectedId && data.userId && data.userId !== user.id) {
        setIsTyping(true)
        if (data.userName) setTypingUser(data.userName)
        if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current)
        remoteTypingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false)
          setTypingUser(null)
        }, 3500)
        scrollToBottom()
      }
    })

    const unsubTypingStop = on('typing:stop', (data: any) => {
      if (data.conversationId === selectedId && data.userId && data.userId !== user.id) {
        setIsTyping(false)
        setTypingUser(null)
        if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current)
      }
    })

    const unsubRead = on('message:read', () => {})

    return () => {
      unsubNewMsg?.()
      unsubTypingStart?.()
      unsubTypingStop?.()
      unsubRead?.()
      if (remoteTypingTimeoutRef.current) clearTimeout(remoteTypingTimeoutRef.current)
    }
  }, [user, selectedId])

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

  const selectConversation = async (id: string) => {
    setSelectedId(id)
    setLoadingMessages(true)
    try {
      const result = await conversationsApi.messages(id)
      setMessages(result.items)
      await conversationsApi.markRead(id)
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
      )
      getSocket()?.emit('conversation:join', { conversationId: id })
      scrollToBottom()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSend = () => {
    if (!newMessage.trim() || !selectedId || !user) return
    const content = newMessage.trim()
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`

    // Input alanını ve yazıyor göstergesini anında sıfırla (0ms gecikme)
    setNewMessage('')
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    const socket = getSocket()
    socket?.emit('typing:stop', { conversationId: selectedId, userId: user.id })

    const optimisticMsg = {
      id: tempId,
      tempId,
      conversationId: selectedId,
      senderId: user.id,
      sender: {
        id: user.id,
        fullName: user.fullName,
        companyName: (user as any).companyName,
        avatarUrl: (user as any).avatarUrl,
      },
      content,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
      pending: false,
    }

    // 1. Gönderenin ekranında anında (0ms) göster
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    // 2. Karşı tarafa Supabase Realtime WebSocket üzerinden ANINDA ilet (0ms gecikme)
    if (socket?.connected) {
      socket.emit('message:send', {
        ...optimisticMsg,
      })
    }

    // 3. Arka planda veritabanına kaydet
    conversationsApi
      .sendMessage({ conversationId: selectedId, content, tempId })
      .then((res: any) => {
        const serverMsg = res?.data || res
        if (serverMsg?.id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId || m.tempId === tempId
                ? { ...m, ...serverMsg, id: serverMsg.id, pending: false }
                : m
            )
          )
        }
      })
      .catch((err: any) => {
        toast.error('Mesaj sunucuya iletilemedi: ' + (err.message || 'Hata'))
      })
  }

  const handleTyping = (value: string) => {
    setNewMessage(value)
    const socket = getSocket()
    if (!socket || !selectedId || !user) return

    socket.emit('typing:start', {
      conversationId: selectedId,
      userId: user.id,
      userName: user.fullName || (user as any).companyName,
    })

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing:stop', {
        conversationId: selectedId,
        userId: user.id,
      })
    }, 1500)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }

  const selected = conversations.find((c) => c.id === selectedId)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      {/* Masthead */}
      <div className="flex items-center justify-between gap-3 border-b border-[#D8D5CC] dark:border-[#262C29] pb-4">
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
            SAHA İLETİŞİM HATTI • DOĞRUDAN MESAJLAŞMA
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141615] dark:text-white">
            Mesajlar
          </h1>
        </div>
        <span
          className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded-sm border inline-flex items-center gap-1.5 ${
            connected
              ? 'bg-[#EAF3EE] text-[#0D6847] border-[#C5DDD0] dark:bg-[#162921] dark:text-[#5CD6A5] dark:border-[#244738]'
              : 'bg-[#F0EFEA] text-[#5C615E] border-[#E2E0D8] dark:bg-[#1E2421] dark:text-[#949B97] dark:border-[#2C3330]'
          }`}
        >
          <Circle className={`w-2 h-2 ${connected ? 'fill-current' : ''}`} />
          <span>{connected ? 'CANLI BAĞLANTI' : 'BAĞLANIYOR'}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100dvh-210px)] sm:h-[600px]">
        {/* Konuşma Listesi */}
        <div
          className={`border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden bg-white dark:bg-[#141716] ${
            selectedId ? 'hidden md:block' : ''
          }`}
        >
          <ScrollArea className="h-full custom-scrollbar">
            {loading ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-md bg-[#E9E7E0] dark:bg-[#181C1A]" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-[#5C615E] dark:text-[#949B97] space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs sm:text-sm font-medium">Henüz aktif yazışmanız yok</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left p-3.5 border-b border-[#ECEAE4] dark:border-[#222624] transition-colors flex items-start gap-3 cursor-pointer ${
                    selectedId === conv.id
                      ? 'bg-[#EAF3EE]/60 dark:bg-[#162921]/40'
                      : 'hover:bg-[#F9F8F6] dark:hover:bg-[#181C1A]'
                  }`}
                >
                  <Avatar className="w-9 h-9 rounded-md shrink-0 border border-[#E2E0D8] dark:border-[#252B28]">
                    <AvatarFallback className="rounded-md bg-[#F0EFEA] dark:bg-[#1E2421] text-[#0D6847] dark:text-[#5CD6A5] font-mono text-xs font-bold">
                      {initials(conv.participant?.fullName || conv.participant?.companyName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-[#141615] dark:text-white text-xs sm:text-sm truncate">
                        {conv.participant?.companyName || conv.participant?.fullName}
                      </h4>
                      {conv.lastMessage && (
                        <span className="font-mono text-[10px] text-[#5C615E] dark:text-[#949B97] shrink-0">
                          {formatRelative(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {conv.job && (
                      <p className="font-mono text-[11px] font-semibold text-[#0D6847] dark:text-[#5CD6A5] truncate mt-0.5">
                        {conv.job.title}
                      </p>
                    )}
                    <p className="text-xs text-[#5C615E] dark:text-[#949B97] truncate mt-0.5">
                      {conv.lastMessage?.content || 'Yeni konuşma'}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-[#C84B31] text-white shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Mesaj İçeriği */}
        <div
          className={`md:col-span-2 border border-[#E2E0D8] dark:border-[#252B28] rounded-lg flex flex-col overflow-hidden bg-white dark:bg-[#141716] ${
            !selectedId ? 'hidden md:flex' : ''
          }`}
        >
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-[#5C615E] dark:text-[#949B97] p-6">
              <div className="text-center space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto opacity-40" />
                <p className="text-xs sm:text-sm">Görüşmeyi görüntülemek için soldan bir kişi seçin.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Konuşma Başlığı */}
              <div className="px-4 py-3 border-b border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#181C1A] flex items-center gap-3">
                <button
                  type="button"
                  className="md:hidden h-8 w-8 rounded border border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-center shrink-0"
                  onClick={() => setSelectedId(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <Avatar className="w-8 h-8 rounded-md shrink-0 border border-[#E2E0D8] dark:border-[#252B28]">
                  <AvatarFallback className="rounded-md bg-[#F0EFEA] dark:bg-[#1E2421] text-[#0D6847] dark:text-[#5CD6A5] font-mono text-xs font-bold">
                    {initials(selected.participant?.fullName || selected.participant?.companyName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate text-[#141615] dark:text-white">
                    {selected.participant?.companyName || selected.participant?.fullName}
                  </div>
                  {selected.job && (
                    <button
                      type="button"
                      className="text-xs font-medium text-[#0D6847] dark:text-[#5CD6A5] hover:underline truncate inline-flex items-center gap-1 max-w-full"
                      onClick={() => go('job-detail', { jobId: selected.job.id })}
                    >
                      <Briefcase className="w-3 h-3 shrink-0" />
                      <span className="truncate">{selected.job.title}</span>
                    </button>
                  )}
                </div>
                {selected.participant?.isVerified && (
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#EAF3EE] text-[#0D6847] border border-[#C5DDD0] dark:bg-[#162921] dark:text-[#5CD6A5] dark:border-[#244738] shrink-0">
                    ONAYLI
                  </span>
                )}
              </div>

              {/* Mesaj Akışı */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#F6F5F2] dark:bg-[#0C0E0D] custom-scrollbar">
                {loadingMessages ? (
                  <div className="space-y-2.5">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 rounded-md bg-[#E9E7E0] dark:bg-[#181C1A]" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user?.id
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[82%] sm:max-w-[72%] rounded-lg px-3.5 py-2.5 ${
                              isMe
                                ? 'bg-[#0D6847] text-white'
                                : 'bg-white dark:bg-[#141716] text-[#141615] dark:text-[#F2F1ED] border border-[#E2E0D8] dark:border-[#252B28]'
                            } ${msg.pending ? 'opacity-60' : ''}`}
                          >
                            <p className="text-xs sm:text-sm break-words leading-relaxed">
                              {msg.content}
                            </p>
                            <div
                              className={`font-mono text-[10px] mt-1 flex items-center gap-1 ${
                                isMe ? 'text-white/75' : 'text-[#8A8F8C]'
                              }`}
                            >
                              {msg.pending && <Circle className="w-2 h-2 fill-current" />}
                              {formatTime(msg.createdAt)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {isTyping && (
                      <div className="flex items-end gap-2 justify-start my-1.5 animate-in fade-in slide-in-from-bottom-1 duration-200">
                        <Avatar className="w-6 h-6 rounded-md shrink-0 border border-[#E2E0D8] dark:border-[#252B28] mb-0.5">
                          <AvatarFallback className="rounded-md bg-[#F0EFEA] dark:bg-[#1E2421] text-[#0D6847] dark:text-[#5CD6A5] font-mono text-[9px] font-bold">
                            {initials(typingUser || selected?.participant?.fullName || selected?.participant?.companyName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-2xl rounded-bl-xs px-3.5 py-2 shadow-xs flex items-center gap-2">
                          <span className="text-xs text-[#5C615E] dark:text-[#949B97] font-medium">
                            {typingUser || selected?.participant?.fullName || 'Yazıyor'}
                          </span>
                          <span className="flex items-center gap-1 pl-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D6847] dark:bg-[#5CD6A5] animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D6847] dark:bg-[#5CD6A5] animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0D6847] dark:bg-[#5CD6A5] animate-bounce" />
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Mesaj Gönderim Alanı */}
              <div className="p-3 border-t border-[#E2E0D8] dark:border-[#252B28] bg-white dark:bg-[#141716] flex gap-2">
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
                  className="flex-1 h-10 bg-[#FBFBF9] dark:bg-[#181C1A] border-[#D6D3C9] dark:border-[#2B322E]"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                  className="h-10 w-10 rounded-md bg-[#0D6847] hover:bg-[#095237] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
