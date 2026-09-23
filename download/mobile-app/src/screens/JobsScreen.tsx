/**
 * JobsScreen - Ana i\u015F listesi (Tab 1)
 *
 * - Arama \u00E7ubu\u011Fu
 * - Kategori yatay scroll (T\u00FCm\u00FC + 8 kategori)
 * - "Konumumu Kullan" butonu (expo-location)
 * - FlatList ile i\u015F kartlar\u0131
 * - Pull-to-refresh + sayfalama (load more)
 * - Kart t\u0131klay\u0131nca JobDetail'e navigate
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import * as Location from 'expo-location'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { COLORS, CATEGORIES, CATEGORY_COLORS } from '../config'
import { jobsApi, getErrorMessage } from '../api/client'
import {
  formatWage,
  formatDistance,
  daysUntil,
  categoryIcon,
  categoryLabel,
  urgencyLabel,
  initials,
} from '../utils/format'
import type { RootStackParamList } from '../navigation/RootNavigator'

type NavProp = NativeStackNavigationProp<RootStackParamList, 'JobDetail'>

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
  distance?: number
  employer?: {
    id: string
    fullName: string
    companyName?: string
    avatarUrl?: string
    ratingAvg?: number
  }
  status?: string
  createdAt?: string
}

const PAGE_SIZE = 10

export function JobsScreen() {
  const navigation = useNavigation<NavProp>()

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [usingLocation, setUsingLocation] = useState(false)

  // \u0130lk y\u00FCkleme / sayfa y\u00FCkleme
  const loadJobs = useCallback(
    async (targetPage: number, reset: boolean) => {
      if (reset) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      try {
        const result = await jobsApi.list({
          page: targetPage,
          pageSize: PAGE_SIZE,
          category: activeCategory || undefined,
          search: search || undefined,
          lat: location?.lat,
          lng: location?.lng,
          radiusKm: location ? 25 : undefined,
        })
        const items = result.items || []
        if (reset) {
          setJobs(items)
        } else {
          setJobs((prev) => [...prev, ...items])
        }
        setPage(targetPage)
        setHasMore(result.pagination?.hasNext ?? false)
      } catch (err) {
        Toast.show({ type: 'error', text1: getErrorMessage(err) })
      } finally {
        setLoading(false)
        setRefreshing(false)
        setLoadingMore(false)
      }
    },
    [activeCategory, search, location]
  )

  useEffect(() => {
    loadJobs(1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, search, location])

  const onRefresh = () => {
    setRefreshing(true)
    loadJobs(1, true)
  }

  const onLoadMore = () => {
    if (!hasMore || loadingMore || loading) return
    loadJobs(page + 1, false)
  }

  const handleSearch = () => {
    setSearch(searchInput.trim())
  }

  const handleUseLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Konum izni reddedildi.',
          text2: 'Ayararlardan konum izni verin.',
        })
        return
      }
      setUsingLocation(true)
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      Toast.show({
        type: 'success',
        text1: 'Konum kullan\u0131l\u0131yor',
        text2: 'Yak\u0131n\u0131nyardaki i\u015Fler listeleniyor.',
      })
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Konum al\u0131namad\u0131.' })
    } finally {
      setUsingLocation(false)
    }
  }

  const clearLocation = () => {
    setLocation(null)
    Toast.show({ type: 'info', text1: 'Konum filtresi kald\u0131r\u0131ld\u0131.' })
  }

  const handleJobPress = (jobId: string) => {
    navigation.navigate('JobDetail', { jobId })
  }

  const renderJobCard = ({ item }: { item: Job }) => {
    const catColor = CATEGORY_COLORS[item.category] || COLORS.primary
    const urgency = item.urgency ? urgencyLabel(item.urgency) : null

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => handleJobPress(item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.jobCardHeader}>
          <View style={[styles.categoryCircle, { backgroundColor: catColor + '22' }]}>
            <Text style={styles.categoryEmoji}>{categoryIcon(item.category)}</Text>
          </View>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.jobCategory}>{categoryLabel(item.category)}</Text>
          </View>
          {urgency && (
            <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
              <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.text}</Text>
            </View>
          )}
        </View>

        <View style={styles.jobMetaRow}>
          <View style={styles.jobMetaItem}>
            <Icon name="cash-multiple" size={16} color={COLORS.primary} />
            <Text style={styles.jobMetaText}>
              {formatWage(item.wage, item.wageType, item.currency)}
            </Text>
          </View>
          <View style={styles.jobMetaItem}>
            <Icon name="calendar-clock-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.jobMetaText}>{daysUntil(item.workDate)}</Text>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <View style={styles.jobMetaItem}>
            <Icon name="map-marker-outline" size={16} color={COLORS.textMuted} />
            <Text style={styles.jobLocationText} numberOfLines={1}>
              {[item.district, item.city].filter(Boolean).join(', ') || 'Konum belirtilmedi'}
            </Text>
          </View>
          {typeof item.distance === 'number' && (
            <View style={styles.distanceBadge}>
              <Icon name="map-marker-distance" size={13} color={COLORS.primary} />
              <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
            </View>
          )}
        </View>

        {item.employer && (
          <View style={styles.employerRow}>
            <View style={styles.avatarMini}>
              {item.employer.avatarUrl ? (
                <Text>{' '}</Text>
              ) : (
                <Text style={styles.avatarMiniText}>{initials(item.employer.companyName || item.employer.fullName)}</Text>
              )}
            </View>
            <Text style={styles.employerName} numberOfLines={1}>
              {item.employer.companyName || item.employer.fullName}
            </Text>
            {typeof item.employer.ratingAvg === 'number' && item.employer.ratingAvg > 0 && (
              <View style={styles.ratingRow}>
                <Icon name="star" size={13} color={COLORS.accent} />
                <Text style={styles.ratingText}>{item.employer.ratingAvg.toFixed(1)}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    )
  }

  const renderCategory = ({ item }: { item: { value: string; label: string; icon: string } }) => {
    const active = activeCategory === item.value
    const color = CATEGORY_COLORS[item.value] || COLORS.primary
    return (
      <TouchableOpacity
        style={[styles.categoryChip, active && { backgroundColor: color, borderColor: color }]}
        onPress={() => setActiveCategory(active ? null : item.value)}
        activeOpacity={0.85}
      >
        <Text style={styles.categoryChipIcon}>{item.icon}</Text>
        <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    )
  }

  const renderEmpty = () => {
    if (loading) return null
    return (
      <View style={styles.emptyContainer}>
        <Icon name="briefcase-search-outline" size={64} color={COLORS.border} />
        <Text style={styles.emptyTitle}>\u0130\u015F bulunamad\u0131</Text>
        <Text style={styles.emptyDesc}>
          {search || activeCategory || location
            ? 'Filtreleri de\u011Fi\u015Ftirmeyi deneyin.'
            : 'Hen\u00FCz ilan yok.'}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>\u0130\u015F Bul</Text>
          <Text style={styles.headerSubtitle}>Yak\u0131n\u0131nyardaki f\u0131rsatlar</Text>
        </View>
        <TouchableOpacity
          style={styles.locationBtn}
          onPress={location ? clearLocation : handleUseLocation}
          disabled={usingLocation}
          activeOpacity={0.85}
        >
          {usingLocation ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Icon
              name={location ? 'map-marker-check' : 'crosshairs-gps'}
              size={22}
              color={location ? COLORS.primary : COLORS.textSecondary}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Icon name="magnify" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="\u0130\u015F ara... (\u00F6rn. garson, in\u015Faat)"
            placeholderTextColor={COLORS.textMuted}
            value={searchInput}
            onChangeText={setSearchInput}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchInput('')
                setSearch('')
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.85}>
          <Icon name="arrow-right" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.value}
        renderItem={renderCategory}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        ListHeaderComponent={
          <TouchableOpacity
            style={[styles.categoryChip, !activeCategory && styles.categoryChipActive]}
            onPress={() => setActiveCategory(null)}
            activeOpacity={0.85}
          >
            <Icon name="format-list-bulleted" size={16} color={!activeCategory ? 'white' : COLORS.text} />
            <Text style={[styles.categoryChipText, !activeCategory && styles.categoryChipTextActive]}>T\u00FCm\u00FC</Text>
          </TouchableOpacity>
        }
      />

      {/* Job list */}
      {loading && jobs.length === 0 ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobCard}
          contentContainerStyle={styles.jobList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  locationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  searchBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryList: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipIcon: {
    fontSize: 16,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryChipTextActive: {
    color: 'white',
  },
  jobList: {
    padding: 20,
    paddingTop: 8,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  jobCategory: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  jobMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  jobMetaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  jobFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  jobLocationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 5,
    flexShrink: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  employerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarMini: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  employerName: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
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
  },
})
