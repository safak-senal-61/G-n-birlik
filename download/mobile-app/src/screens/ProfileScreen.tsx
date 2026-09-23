/**
 * ProfileScreen - Profil ekran\u0131
 *
 * - Avatar, ad, rol badge, puan
 * - \u0130statistik kartlar\u0131
 * - "Profili D\u00FCzenle", "G\u00FCvenlik", "\u00C7\u0131k\u0131\u015F Yap" butonlar\u0131
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { COLORS } from '../config'
import { useAuthStore } from '../store/auth'
import { applicationsApi } from '../api/client'
import { initials } from '../utils/format'
import type { RootStackParamList } from '../navigation/RootNavigator'

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Security'>

interface Stats {
  total: number
  accepted: number
  completed: number
}

export function ProfileScreen() {
  const navigation = useNavigation<NavProp>()
  const { user, logout, refresh } = useAuthStore()

  const [stats, setStats] = useState<Stats>({ total: 0, accepted: 0, completed: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const isEmployer = user?.role === 'EMPLOYER'

  const loadStats = useCallback(async () => {
    try {
      if (isEmployer) {
        // \u0130\u015Fveren: ilan say\u0131lar\u0131 + ba\u015Fvurular
        const [pending, accepted, completed] = await Promise.all([
          applicationsApi.byEmployer('PENDING').catch(() => []),
          applicationsApi.byEmployer('ACCEPTED').catch(() => []),
          applicationsApi.byEmployer('COMPLETED').catch(() => []),
        ])
        setStats({
          total: (pending?.length || 0) + (accepted?.length || 0) + (completed?.length || 0),
          accepted: accepted?.length || 0,
          completed: completed?.length || 0,
        })
      } else {
        // Worker: ba\u015Fvurular\u0131
        const [pending, accepted, completed] = await Promise.all([
          applicationsApi.mine('PENDING').catch(() => []),
          applicationsApi.mine('ACCEPTED').catch(() => []),
          applicationsApi.mine('COMPLETED').catch(() => []),
        ])
        setStats({
          total: (pending?.length || 0) + (accepted?.length || 0) + (completed?.length || 0),
          accepted: accepted?.length || 0,
          completed: completed?.length || 0,
        })
      }
    } catch (err) {
      // sessiz ge\u00E7
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [isEmployer])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
      await loadStats()
    } catch {}
  }

  const handleLogout = () => {
    Alert.alert(
      '\u00C7\u0131k\u0131\u015F Yap',
      'Hesab\u0131n\u0131zdan \u00E7\u0131k\u0131\u015F yapmak istiyor musunuz?',
      [
        { text: '\u0130ptal', style: 'cancel' },
        { text: '\u00C7\u0131k\u0131\u015F Yap', style: 'destructive', onPress: confirmLogout },
      ]
    )
  }

  const confirmLogout = async () => {
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      Toast.show({ type: 'error', text1: '\u00C7\u0131k\u0131\u015F yap\u0131l\u0131rken hata olu\u015Ftu.' })
    } finally {
      setLoggingOut(false)
    }
  }

  const handleEditProfile = () => {
    Alert.alert('Yak\u0131nda', 'Profil d\u00FCzenleme \u00F6zelli\u011Fi yak\u0131nda eklenecek.')
  }

  const roleLabel = isEmployer ? '\u0130\u015Fveren' : '\u0130\u015F\u00E7i'
  const roleIcon = isEmployer ? 'domain' : 'account-hard-hat'
  const roleColor = isEmployer ? COLORS.secondary : COLORS.primary

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={[styles.avatar, { backgroundColor: roleColor }]}>
              <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.fullName || 'Kullan\u0131c\u0131'}
              </Text>
              {user?.companyName && isEmployer && (
                <Text style={styles.profileCompany} numberOfLines={1}>
                  {user.companyName}
                </Text>
              )}
              <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
                <Icon name={roleIcon} size={13} color="white" />
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.profileMeta}>
            <View style={styles.metaItem}>
              <Icon name="star" size={18} color={COLORS.accent} />
              <Text style={styles.metaText}>
                {user?.ratingAvg ? user.ratingAvg.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.metaSub}>
                ({user?.ratingCount || 0} de\u011Ferlendirme)
              </Text>
            </View>
            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Icon name="check-decagram" size={14} color={COLORS.primary} />
                <Text style={styles.verifiedText}>Do\u011Frulanm\u0131\u015F</Text>
              </View>
            )}
            {user?.twoFactorEnabled && (
              <View style={styles.twofaBadge}>
                <Icon name="shield-check" size={14} color={COLORS.info} />
                <Text style={styles.twofaText}>2FA Aktif</Text>
              </View>
            )}
          </View>

          {/* Contact info */}
          {(user?.email || user?.phone || user?.city) && (
            <View style={styles.contactBox}>
              {user?.email && (
                <View style={styles.contactRow}>
                  <Icon name="email-outline" size={16} color={COLORS.textMuted} />
                  <Text style={styles.contactText} numberOfLines={1}>{user.email}</Text>
                </View>
              )}
              {user?.phone && (
                <View style={styles.contactRow}>
                  <Icon name="phone-outline" size={16} color={COLORS.textMuted} />
                  <Text style={styles.contactText}>{user.phone}</Text>
                </View>
              )}
              {(user?.city || user?.district) && (
                <View style={styles.contactRow}>
                  <Icon name="map-marker-outline" size={16} color={COLORS.textMuted} />
                  <Text style={styles.contactText}>
                    {[user?.district, user?.city].filter(Boolean).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          )}

          {user?.bio && (
            <View style={styles.bioBox}>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="clipboard-text-outline"
            color={COLORS.primary}
            value={loading ? '...' : String(stats.total)}
            label={isEmployer ? 'Toplam Ba\u015Fvuru' : 'Toplam Ba\u015Fvuru'}
          />
          <StatCard
            icon="check-circle-outline"
            color={COLORS.success}
            value={loading ? '...' : String(stats.accepted)}
            label="Onaylanan"
          />
          <StatCard
            icon="flag-checkered"
            color={COLORS.info}
            value={loading ? '...' : String(stats.completed)}
            label="Tamamlanan"
          />
        </View>

        {/* Menu */}
        <View style={styles.menuSection}>
          <MenuRow
            icon="account-edit-outline"
            color={COLORS.primary}
            label="Profili D\u00FCzenle"
            onPress={handleEditProfile}
          />
          <MenuRow
            icon="shield-lock-outline"
            color={COLORS.secondary}
            label="G\u00FCvenlik"
            onPress={() => navigation.navigate('Security')}
          />
          <MenuRow
            icon="bell-outline"
            color={COLORS.accent}
            label="Bildirimler"
            onPress={() => Alert.alert('Yak\u0131nda', 'Bildirim ayarlar\u0131 yak\u0131nda.')}
          />
          <MenuRow
            icon="help-circle-outline"
            color={COLORS.info}
            label="Yard\u0131m & Destek"
            onPress={() => Alert.alert('Yard\u0131m', 'support@gunubirlikisbul.com')}
          />
          <MenuRow
            icon="information-outline"
            color={COLORS.textSecondary}
            label="Hakk\u0131nda"
            onPress={() => Alert.alert('G\u00FCn\u00FCbirlik \u0130\u015F Bul', 'S\u00FCr\u00FCm 1.0.0')}
            isLast
          />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          {loggingOut ? (
            <ActivityIndicator color={COLORS.danger} />
          ) : (
            <>
              <Icon name="logout" size={20} color={COLORS.danger} />
              <Text style={styles.logoutText}>\u00C7\u0131k\u0131\u015F Yap</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ============================================================
// Alt bile\u015Fenler
// ============================================================
function StatCard({
  icon,
  color,
  value,
  label,
}: {
  icon: string
  color: string
  value: string
  label: string
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconCircle, { backgroundColor: color + '22' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function MenuRow({
  icon,
  color,
  label,
  onPress,
  isLast,
}: {
  icon: string
  color: string
  label: string
  onPress: () => void
  isLast?: boolean
}) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, isLast && styles.menuRowLast]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconCircle, { backgroundColor: color + '22' }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Icon name="chevron-right" size={22} color={COLORS.textMuted} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  profileCompany: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  metaSub: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  twofaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  twofaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.info,
  },
  contactBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bioBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
  },
  bioText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuRowLast: {
    borderBottomWidth: 0,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logoutBtnDisabled: {
    opacity: 0.7,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: 'bold',
  },
})
