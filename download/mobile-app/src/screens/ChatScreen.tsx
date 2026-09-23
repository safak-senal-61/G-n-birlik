/**
 * ChatScreen - Ger\u00E7ek zamanl\u0131 mesajla\u015Fma
 *
 * - \u00DCstte konu\u015Fma bilgisi (avatar, ad)
 * - Mesaj listesi (benim mesaj sa\u011Fda ye\u015Fil, kar\u015F\u0131da solda beyaz)
 * - Altta mesaj input + g\u00F6nder butonu
 * - WebSocket ile ger\u00E7ek zamanl\u0131
 * - useRoute ile conversationId al
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'

import { COLORS } from '../config'
import { conversationsApi, getErrorMessage } from '../api/client'
import { socketService } from '../api/socket'
import { useAuthStore } from '../store/auth'
import { formatTime, initials } from '../utils/format'
import type { RootStackParamList } from '../navigation/RootNavigator'

type RouteProps = RouteProp<RootStackParamList, 'Chat'>

interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  type?: string
  createdAt: string
  read?: boolean
}

export function ChatScreen() {
  const route = useRoute<RouteProps>()
  const navigation = useNavigation()
  const { conversationId, recipientName } = route.params
  const user = useAuthStore((s) => s.user)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const listRef = useRef<FlatList>(null)

  // Mesajlar\u0131 y\u00FCkle
  const loadMessages = useCallback(async () => {
    if (!conversationId) {
      setLoading(false)
      return
    }
    try {
      const result = await conversationsApi.messages(conversationId)
      const items = (result.items || []).slice().reverse()
      setMessages(items)
      // Okundu i\u015Faretle
      await conversationsApi.markRead(conversationId).catch(() => {})
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Header ba\u015Fl\u0131\u011F\u0131n\u0131 ayarla
  useEffect(() => {
    if (recipientName) {
      navigation.setOptions?.({ title: recipientName })
    }
  }, [navigation, recipientName])

  // WebSocket: yeni mesaj
  useEffect(() => {
    const offNew = socketService.on('new_message', (msg: Message) => {
      if (msg.conversationId === conversationId || !conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Okundu i\u015Faretle
        if (msg.senderId !== user?.id && conversationId) {
          conversationsApi.markRead(conversationId).catch(() => {})
        }
      }
    })
    return () => {
      offNew()
    }
  }, [conversationId, user?.id])

  // Mesaj geldi\u011Finde en alta scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  const handleSend = async () => {
    const content = input.trim()
    if (!content) return

    setSending(true)
    setInput('')

    // Optimistic: hemen ekranda g\u00F6ster
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      conversationId,
      senderId: user?.id || '',
      content,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    try {
      const result = await conversationsApi.sendMessage({
        conversationId: conversationId || undefined,
        content,
        type: 'TEXT',
      })
      // Gelen mesaj\u0131 temp ile de\u011Fi\u015Ftir (e\u011Fer farkl\u0131 id ise)
      if (result && result.id && result.id !== tempId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...optimistic, id: result.id, createdAt: result.createdAt || optimistic.createdAt } : m))
        )
      }
    } catch (err) {
      // Hata: optimistic mesaj\u0131 kald\u0131r, input'a geri koy
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setInput(content)
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setSending(false)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === user?.id
    return (
      <View style={[styles.msgRow, isOwn ? styles.msgRowOwn : styles.msgRowOther]}>
        {!isOwn && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>{initials(recipientName)}</Text>
          </View>
        )}
        <View
          style={[
            styles.msgBubble,
            isOwn ? styles.msgBubbleOwn : styles.msgBubbleOther,
          ]}
        >
          <Text
            style={[
              styles.msgText,
              isOwn ? styles.msgTextOwn : styles.msgTextOther,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.msgTime,
              isOwn ? styles.msgTimeOwn : styles.msgTimeOther,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Recipient header */}
        <View style={styles.chatHeader}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{initials(recipientName)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {recipientName || 'Konu\u015Fma'}
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>\u00C7evrimi\u00E7i</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.centerLoader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Icon name="chat-processing-outline" size={56} color={COLORS.border} />
                <Text style={styles.emptyChatText}>
                  Mesajla\u015Fmaya ba\u015Fla!
                </Text>
                <Text style={styles.emptyChatSub}>
                  \u0130lk mesaj\u0131n\u0131z\u0131 g\u00F6nderin.
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj\u0131n\u0131z\u0131 yaz\u0131n..."
            placeholderTextColor={COLORS.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Icon name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  onlineText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 10,
    maxWidth: '100%',
  },
  msgRowOwn: {
    justifyContent: 'flex-end',
  },
  msgRowOther: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  msgAvatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  msgBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  msgBubbleOwn: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  msgBubbleOther: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 15,
    lineHeight: 20,
  },
  msgTextOwn: {
    color: 'white',
  },
  msgTextOther: {
    color: COLORS.text,
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  msgTimeOwn: {
    color: 'rgba(255,255,255,0.8)',
  },
  msgTimeOther: {
    color: COLORS.textMuted,
  },
  emptyChat: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyChatText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 4,
  },
  emptyChatSub: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
})
