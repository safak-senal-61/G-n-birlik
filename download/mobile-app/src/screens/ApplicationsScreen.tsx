/**
 * ApplicationsScreen - Ba\u015Fvurular / \u0130lanlar\u0131m
 *
 * - Worker ise: kendi ba\u015Fvurular\u0131 (status filter tablar\u0131)
 * - Employer ise: ilanlar\u0131na yap\u0131lan ba\u015Fvurular
 * - Her kart: i\u015F ba\u015Fl\u0131\u011F\u0131, status badge, tarih, employer/worker
 * - Status badge renkli
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
  Alert,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { useNavigation, useIsFocused } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { COLORS } from '../config'
import { applicationsApi, getErrorMessage } from '../api/client'
import { useAuthStore } from '../store/auth'
import { formatDate, formatWage, statusLabel, initials, categoryIcon } from '../utils/format'
import type { RootStackParamList } from '../navigation/RootNavigator'

type NavProp = NativeStackNavigationProp<RootStackParamList, 'JobDetail'>

interface Application {
  id: string
  status: string
  proposedWage?: number
  message?: string
  employerNote?: string
  rating?: number
  createdAt: string
  job?: {
    id: string
    title: string
    category?: string
    wage?: number
    wageType?: string
    currency?: string
    workDate?: string
    city?: string
    district?: string
    status?: string
  }
  worker?: {
    id: string
    fullName: string
    avatarUrl?: string
    phone?: string
    ratingAvg?: number
  }
  employer?: {
    id: string
    fullName: string
    companyName?: string
    avatarUrl?: string
    ratingAvg?: number
  }
}

const FILTER_TABS = [
  { value: 'ALL', label: 'T\u00FCm\u00FC' },
  { value: 'PENDING', label: 'Beklemede' },
  { value: 'ACCEPTED', label: 'Onaylanan' },
  { value: 'REJECTED', label: 'Reddedilen' },
]

export function ApplicationsScreen() {
  const navigation = useNavigation<NavProp>()
  const isFocused = useIsFocused()
  const user = useAuthStore((s) => s.user)
  const isEmployer = user?.role === 'EMPLOYER'

  const [activeFilter, setActiveFilter] = useState('ALL')
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadApplications = useCallback(async () => {
    try {
      const status = activeFilter === 'ALL' ? undefined : activeFilter
      const result = isEmployer
        ? await applicationsApi.byEmployer(status)
        : await applicationsApi.mine(status)
      setApplications(result || [])
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeFilter, isEmployer])

  useEffect(() => {
    setLoading(true)
    loadApplications()
  }, [loadApplications, isFocused])

  const onRefresh = () => {
    setRefreshing(true)
    loadApplications()
  }

  const handlePress = (app: Application) => {
    if (app.job?.id) {
      navigation.navigate('JobDetail', { jobId: app.job.id })
    }
  }

  const handleEmployerAction = (app: Application, action: 'ACCEPTED' | 'REJECTED') => {
    Alert.alert(
      action === 'ACCEPTED' ? 'Ba\u015Fvuruyu Onayla' : 'Ba\u015Fvuruyu Reddet',
      `${app.worker?.fullName || '\u0130\u015F\u00E7i'} adl\u0131 ki\u015Finin ba\u015Fvurusunu ${action === 'ACCEPTED' ? 'onaylamak' : 'reddetmek'} istiyor musunuz?`,
      [
        { text: '\u0130ptal', style: 'cancel' },
        {
          text: action === 'ACCEPTED' ? 'Onayla' : 'Reddet',
          style: action === 'ACCEPTED' ? 'default' : 'destructive',
          onPress: () => confirmEmployerAction(app, action),
        },
      ]
    )
  }

  const confirmEmployerAction = async (app: Application, action: 'ACCEPTED' | 'REJECTED') => {
    try {
      await applicationsApi.updateStatus(app.id, action)
      Toast.show({
        type: 'success',
        text1: action === 'ACCEPTED' ? 'Ba\u015Fvuru onayland\u0131' : 'Ba\u015Fvuru reddedildi',
      })
      loadApplications()
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    }
  }

  const handleWithdraw = (app: Application) => {
    Alert.alert(
      'Ba\u015Fvuruyu Geri \u00C7ek',
      'Bu ba\u015Fvuruyu geri \u00E7ekmek istiyor musunuz?',
      [
        { text: '\u0130ptal', style: 'cancel' },
        { text: 'Geri \u00C7ek', style: 'destructive', onPress: () => confirmWithdraw(app) },
      ]
    )
  }

  const confirmWithdraw = async (app: Application) => {
    try {
      await applicationsApi.updateStatus(app.id, 'WITHDRAWN')
      Toast.show({ type: 'success', text1: 'Ba\u015Fvuru geri \u00E7ekildi.' })
      loadApplications()
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    }
  }

  const renderItem = ({ item }: { item: Application }) => {
    const status = statusLabel(item.status)
    const counterparty = isEmployer ? item.worker : item.employer
    const name = counterparty?.fullName || counterparty?.companyName || 'Bilinmiyor'

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.jobIconCircle}>
            <Text style={styles.jobIconEmoji}>
              {item.job?.category ? categoryIcon(item.job.category) : '💼'}
            </Text>
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.job?.title || '\u0130lan silinmi\u015F'}
            </Text>
            <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{initials(name)}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.counterpartyName} numberOfLines={1}>{name}</Text>
            {counterparty && typeof counterparty.ratingAvg === 'number' && counterparty.ratingAvg > 0 && (
              <View style={styles.ratingRow}>
                <Icon name="star" size={12} color={COLORS.accent} />
                <Text style={styles.ratingText}>{counterparty.ratingAvg.toFixed(1)}</Text>
              </View>
            )}
          </View>
          {item.job?.wage != null && (
            <Text style={styles.wageText}>
              {formatWage(item.proposedWage || item.job.wage, item.job.wageType || 'FIXED', item.job.currency)}
            </Text>
          )}
        </View>

        {item.message && (
          <View style={styles.messageBox}>
            <Icon name="comment-text-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
          </View>
        )}

        {item.employerNote && (
          <View style={[styles.messageBox, { backgroundColor: COLORS.primaryLight }]}>
            <Icon name="note-text-outline" size={14} color={COLORS.primaryDark} />
            <Text style={[styles.messageText, { color: COLORS.primaryDark }]} numberOfLines={2}>
              {item.employerNote}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.cardActions}>
          {isEmployer && item.status === 'PENDING' && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={() => handleEmployerAction(item, 'ACCEPTED')}
              >
                <Icon name="check" size={16} color="white" />
                <Text style={styles.actionBtnTextWhite}>Onayla</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleEmployerAction(item, 'REJECTED')}
              >
                <Icon name="close" size={16} color="white" />
                <Text style={styles.actionBtnTextWhite}>Reddet</Text>
              </TouchableOpacity>
            </>
          )}
          {!isEmployer && item.status === 'PENDING' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.withdrawBtn]}
              onPress={() => handleWithdraw(item)}
            >
              <Icon name="undo-variant" size={16} color={COLORS.danger} />
              <Text style={styles.actionBtnTextDanger}>Geri \u00C7ek</Text>
            </TouchableOpacity>
          )}
          {!isEmployer && item.status === 'ACCEPTED' && item.job?.employer && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.messageActionBtn]}
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: '',
                  recipientName: item.employer?.companyName || item.employer?.fullName,
                })
              }
            >
              <Icon name="chat-outline" size={16} color={COLORS.primary} />
              <Text style={styles.actionBtnTextPrimary}>Mesaj G\u00F6nder</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    )
  }

  const renderEmpty = () => {
    if (loading) return null
    return (
      <View style={styles.emptyContainer}>
        <Icon
          name={isEmployer ? 'clipboard-account-outline' : 'clipboard-text-outline'}
          size={64}
          color={COLORS.border}
        />
        <Text style={styles.emptyTitle}>
          {isEmployer ? 'Hen\u00FCz ba\u015Fvuru yok' : 'Ba\u015Fvurun yok'}
        </Text>
        <Text style={styles.emptyDesc}>
          {isEmployer
            ? '\u0130\u015F\u00E7iler ilanlar\u0131na ba\u015Fvurdu\u011Funda burada g\u00F6r\u00FCnecek.'
            : '\u0130\u015F listesinden bir ilana ba\u015Fvurarak ba\u015Fla.'}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEmployer ? '\u0130lanlar\u0131m' : 'Ba\u015Fvurular\u0131m'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isEmployer ? '\u0130lanlar\u0131na gelen ba\u015Fvurular' : 'G\u00F6nderdi\u011Fin ba\u015Fvurular'}
        </Text>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScroll}
        >
          {FILTER_TABS.map((tab) => {
            const active = activeFilter === tab.value
            return (
              <TouchableOpacity
                key={tab.value}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveFilter(tab.value)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading && applications.length === 0 ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={applications}
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
  tabContainer: {
    paddingVertical: 8,
  },
  tabScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabTextActive: {
    color: 'white',
  },
  list: {
    padding: 20,
    paddingTop: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobIconEmoji: {
    fontSize: 20,
  },
  cardTitleWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarMiniText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  counterpartyName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  wageText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 6,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: COLORS.success,
  },
  rejectBtn: {
    backgroundColor: COLORS.danger,
  },
  withdrawBtn: {
    backgroundColor: '#fee2e2',
  },
  messageActionBtn: {
    backgroundColor: COLORS.primaryLight,
  },
  actionBtnTextWhite: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionBtnTextDanger: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionBtnTextPrimary: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: 'bold',
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
    paddingHorizontal: 20,
  },
})
