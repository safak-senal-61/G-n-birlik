/**
 * JobDetailScreen - \u0130\u015F detay\u0131
 *
 * - Ba\u015Fl\u0131k, kategori, aciliyet
 * - \u00DCcret kart\u0131 (b\u00FCy\u00FCk)
 * - Tarih, saat, kontenjan
 * - \u0130\u015Fveren kart\u0131 (avatar, ad, puan)
 * - \u0130\u015F tan\u0131m\u0131, konum
 * - "Bu \u0130\u015Fe Ba\u015Fvur" (worker) / "Mesaj G\u00F6nder" butonu
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'

import { COLORS, CATEGORY_COLORS } from '../config'
import { jobsApi, applicationsApi, conversationsApi, getErrorMessage } from '../api/client'
import { useAuthStore } from '../store/auth'
import {
  formatWage,
  formatDate,
  formatTime,
  daysUntil,
  categoryIcon,
  categoryLabel,
  urgencyLabel,
  statusLabel,
  initials,
} from '../utils/format'
import type { RootStackParamList } from '../navigation/RootNavigator'

type RouteProps = RouteProp<RootStackParamList, 'JobDetail'>

interface Job {
  id: string
  title: string
  description?: string
  category: string
  urgency?: string
  wage: number
  wageType: string
  currency?: string
  workDate: string
  startTime?: string
  endTime?: string
  capacity?: number
  filledCount?: number
  city?: string
  district?: string
  address?: string
  lat?: number
  lng?: number
  employer?: {
    id: string
    fullName: string
    companyName?: string
    avatarUrl?: string
    phone?: string
    ratingAvg?: number
    ratingCount?: number
  }
  status?: string
  createdAt?: string
}

export function JobDetailScreen() {
  const route = useRoute<RouteProps>()
  const navigation = useNavigation<any>()
  const { jobId } = route.params
  const user = useAuthStore((s) => s.user)

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const loadJob = useCallback(async () => {
    setLoading(true)
    try {
      const data = await jobsApi.get(jobId)
      setJob(data)
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    loadJob()
  }, [loadJob])

  const handleApply = () => {
    if (!user) return
    Alert.alert(
      '\u0130\u015Fe Ba\u015Fvur',
      `"${job?.title}" ilan\u0131na ba\u015Fvurmak istiyor musunuz?`,
      [
        { text: '\u0130ptal', style: 'cancel' },
        { text: 'Ba\u015Fvur', onPress: confirmApply },
      ]
    )
  }

  const confirmApply = async () => {
    setActionLoading(true)
    try {
      await applicationsApi.create({ jobId })
      Toast.show({
        type: 'success',
        text1: 'Ba\u015Fvuru g\u00F6nderildi!',
        text2: '\u0130\u015Fveren cevap verdi\u011Finde haber verece\u011Fiz.',
      })
      loadJob()
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setActionLoading(false)
    }
  }

  const handleMessage = async () => {
    if (!job?.employer) return
    setActionLoading(true)
    try {
      const result = await conversationsApi.sendMessage({
        recipientId: job.employer.id,
        jobId: job.id,
        content: `Merhaba, "${job.title}" ilan\u0131n\u0131z hakk\u0131nda bilgi almak istiyorum.`,
      })
      const conversationId = result.conversationId || result.id
      if (conversationId) {
        navigation.navigate('Chat', {
          conversationId,
          recipientName: job.employer.companyName || job.employer.fullName,
        })
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    )
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <Icon name="alert-circle-outline" size={56} color={COLORS.textMuted} />
        <Text style={styles.errorText}>\u0130\u015F bulunamad\u0131.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadJob}>
          <Text style={styles.retryBtnText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const catColor = CATEGORY_COLORS[job.category] || COLORS.primary
  const urgency = job.urgency ? urgencyLabel(job.urgency) : null
  const statusInfo = job.status ? statusLabel(job.status) : null
  const isOwnJob = user?.id === job.employer?.id
  const isWorker = user?.role === 'WORKER'
  const isClosed = job.status === 'CLOSED' || job.status === 'CANCELLED'
  const remaining = (job.capacity || 0) - (job.filledCount || 0)

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={[styles.categoryCircle, { backgroundColor: catColor + '22' }]}>
              <Text style={styles.categoryEmoji}>{categoryIcon(job.category)}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobCategory}>{categoryLabel(job.category)}</Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            {urgency && (
              <View style={[styles.badge, { backgroundColor: urgency.bg }]}>
                <Icon name="lightning-bolt" size={13} color={urgency.color} />
                <Text style={[styles.badgeText, { color: urgency.color }]}>{urgency.text}</Text>
              </View>
            )}
            {statusInfo && job.status !== 'OPEN' && (
              <View style={[styles.badge, { backgroundColor: statusInfo.bg }]}>
                <Text style={[styles.badgeText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: COLORS.primaryLight }]}>
              <Icon name="clock-outline" size={13} color={COLORS.primaryDark} />
              <Text style={[styles.badgeText, { color: COLORS.primaryDark }]}>{daysUntil(job.workDate)}</Text>
            </View>
          </View>
        </View>

        {/* Wage card */}
        <View style={[styles.wageCard, { backgroundColor: catColor }]}>
          <Text style={styles.wageLabel}>\u00DCCRET</Text>
          <Text style={styles.wageAmount}>{formatWage(job.wage, job.wageType, job.currency)}</Text>
          <View style={styles.wageSubRow}>
            <Icon name="cash-check" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.wageSubText}>
              {job.wageType === 'HOURLY' ? 'Saatlik \u00FCcret' : job.wageType === 'DAILY' ? 'G\u00FCnl\u00FCk \u00FCcret' : 'Sabit \u00FCcret'}
            </Text>
          </View>
        </View>

        {/* Date / Time / Capacity */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Icon name="calendar" size={22} color={COLORS.primary} />
            <Text style={styles.infoCardLabel}>Tarih</Text>
            <Text style={styles.infoCardValue}>{formatDate(job.workDate)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Icon name="clock-time-four-outline" size={22} color={COLORS.secondary} />
            <Text style={styles.infoCardLabel}>Saat</Text>
            <Text style={styles.infoCardValue}>
              {job.startTime ? formatTime(job.startTime) : '-'}
              {job.endTime ? ` - ${formatTime(job.endTime)}` : ''}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Icon name="account-group-outline" size={22} color={COLORS.accent} />
            <Text style={styles.infoCardLabel}>Kontenjan</Text>
            <Text style={styles.infoCardValue}>
              {job.filledCount || 0}/{job.capacity || 0}
            </Text>
          </View>
        </View>

        {remaining > 0 && !isClosed && (
          <View style={styles.remainingBanner}>
            <Icon name="account-plus-outline" size={18} color={COLORS.primary} />
            <Text style={styles.remainingText}>{remaining} ki\u015Filik kontenjan var</Text>
          </View>
        )}

        {/* Description */}
        {job.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="text-box-outline" size={18} color={COLORS.text} /> \u0130\u015F Tan\u0131m\u0131
            </Text>
            <Text style={styles.descriptionText}>{job.description}</Text>
          </View>
        ) : null}

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="map-marker-outline" size={18} color={COLORS.text} /> Konum
          </Text>
          <View style={styles.locationCard}>
            <Icon name="map-marker-radius" size={24} color={COLORS.primary} />
            <View style={styles.locationInfo}>
              {job.address && <Text style={styles.locationAddress}>{job.address}</Text>}
              <Text style={styles.locationCity}>
                {[job.district, job.city].filter(Boolean).join(', ') || 'Konum belirtilmedi'}
              </Text>
            </View>
          </View>
        </View>

        {/* Employer */}
        {job.employer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Icon name="domain" size={18} color={COLORS.text} /> \u0130\u015Fveren
            </Text>
            <View style={styles.employerCard}>
              <View style={styles.employerAvatar}>
                <Text style={styles.employerAvatarText}>
                  {initials(job.employer.companyName || job.employer.fullName)}
                </Text>
              </View>
              <View style={styles.employerInfo}>
                <Text style={styles.employerName}>
                  {job.employer.companyName || job.employer.fullName}
                </Text>
                {job.employer.companyName && (
                  <Text style={styles.employerSub}>{job.employer.fullName}</Text>
                )}
                {typeof job.employer.ratingAvg === 'number' && job.employer.ratingAvg > 0 ? (
                  <View style={styles.ratingRow}>
                    <Icon name="star" size={14} color={COLORS.accent} />
                    <Text style={styles.ratingText}>
                      {job.employer.ratingAvg.toFixed(1)} ({job.employer.ratingCount || 0} de\u011Ferlendirme)
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.ratingText}>Hen\u00FCz de\u011Ferlendirme yok</Text>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom action bar */}
      {!isOwnJob && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={handleMessage}
            disabled={actionLoading}
            activeOpacity={0.85}
          >
            <Icon name="chat-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          {isWorker && (
            <TouchableOpacity
              style={[styles.applyBtn, (actionLoading || isClosed) && styles.applyBtnDisabled]}
              onPress={handleApply}
              disabled={actionLoading || isClosed}
              activeOpacity={0.85}
            >
              {actionLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.applyBtnText}>
                  {isClosed ? '\u0130lan Kapand\u0131' : 'Bu \u0130\u015Fe Ba\u015Fvur'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  retryBtn: {
    paddingHorizontal: 24,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 26,
  },
  headerInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  jobCategory: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  wageCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  wageLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  wageAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  wageSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wageSubText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  infoCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoCardLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  remainingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationAddress: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 2,
  },
  locationCity: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  employerCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  employerAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  employerInfo: {
    flex: 1,
  },
  employerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  employerSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  messageBtn: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtn: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.6,
  },
  applyBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
