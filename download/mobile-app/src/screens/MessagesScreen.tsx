/**
 * MessagesScreen - Konu\u015Fma listesi
 *
 * - Avatar, ad, son mesaj, zaman, okunmam\u0131\u015F say\u0131s\u0131
 * - T\u0131klay\u0131nca Chat ekran\u0131na navigate
 * - WebSocket ile ger\u00E7ek zamanl\u0131 g\u00FCncelleme
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { useNavigation, useIsFocused } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { COLORS } from '../config'
import { conversationsApi, getErrorMessage } from '../api/client'
import { socketService } from '../api/socket'
import { useAuthStore } from '../store/auth'
import { formatRelative, initials } from '../utils/format'
import type { RootStackParamList } from '../navigation/RootNavigator'

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>

interface Conversation {
  id: string
  participantId?: string
  participantName?: string
  participantAvatar?: string
  participantRole?: string
  lastMessage?: string
  lastMessageAt?: string
  lastMessageSender?: string
  unreadCount?: number
  jobId?: string
  jobTitle?: string
}

export function MessagesScreen() {
  const navigation = useNavigation<NavProp>()
  const isFocused = useIsFocused()
  const user = useAuthStore((s) => s.user)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadConversations = useCallback(async () => {
    try {
      const result = await conversationsApi.list()
      setConversations(result || [])
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Ger\u00E7ek zamanl\u0131: yeni mesaj geldi\u011Finde listeyi yenile
  useEffect(() => {
    const offNew = socketService.on('new_message', () => {
      loadConversations()
    })
    const offConv = socketService.on('conversation_updated', () => {
      loadConversations()
    })
    return () => {
      offNew()
      offConv()
    }
  }, [loadConversations])

  // Ekrana odaklan\u0131nca yenile
  useEffect(() => {
    if (isFocused) {
      loadConversations()
    }
  }, [isFocused, loadConversations])

  const onRefresh = () => {
    setRefreshing(true)
    loadConversations()
  }

  const handlePress = (conv: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: conv.id,
      recipientName: conv.participantName,
    })
  }

  const renderItem = ({ item }: { item: Conversation }) => {
    const isOwnLast = item.lastMessageSender === user?.id
    return (
      <TouchableOpacity
        style={styles.convCard}
        onPress={() => handlePress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(item.participantName)}</Text>
        </View>

        <View style={styles.convBody}>
          <View style={styles.convHeader}>
            <Text style={styles.convName} numberOfLines={1}>
              {item.participantName || 'Bilinmeyen'}
            </Text>
            <Text style={styles.convTime}>
              {item.lastMessageAt ? formatRelative(item.lastMessageAt) : ''}
            </Text>
          </View>

          <View style={styles.convFooter}>
            {isOwnLast && <Text style={styles.ownPrefix}>Sen: </Text>}
            <Text
              style={[
                styles.convLastMsg,
                (item.unreadCount || 0) > 0 && styles.convLastMsgUnread,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage || 'Hen\u00FCz mesaj yok'}
            </Text>
            {(item.unreadCount || 0) > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount! > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>

          {item.jobTitle && (
            <View style={styles.jobTag}>
              <Icon name="briefcase-outline" size={12} color={COLORS.primary} />
              <Text style={styles.jobTagText} numberOfLines={1}>{item.jobTitle}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmpty = () => {
    if (loading) return null
    return (
      <View style={styles.emptyContainer}>
        <Icon name="chat-outline" size={64} color={COLORS.border} />
        <Text style={styles.emptyTitle}>Hen\u00FCz mesaj yok</Text>
        <Text style={styles.emptyDesc}>
          \u0130\u015F detay\u0131ndan i\u015Fverene mesaj atarak konu\u015Fma ba\u015Flatabilirsiniz.
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mesajlar</Text>
        <Text style={styles.headerSubtitle}>Konu\u015Fmalar\u0131n</Text>
      </View>

      {loading && conversations.length === 0 ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  convCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  convBody: {
    flex: 1,
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convName: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  convTime: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  convFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownPrefix: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  convLastMsg: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  convLastMsgUnread: {
    color: COLORS.text,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  jobTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  jobTagText: {
    fontSize: 11,
    color: COLORS.primaryDark,
    fontWeight: '600',
    maxWidth: 200,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
})
