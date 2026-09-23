/**
 * PostJobScreen - \u0130\u015Fveren yeni ilan olu\u015Fturma
 *
 * - Form: ba\u015Fl\u0131k, a\u00E7\u0131klama, kategori, aciliyet, tarih, saat, \u00FCcret, kontenjan, konum
 * - "\u0130lan\u0131 Yay\u0131nla" butonu
 */

import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { useNavigation } from '@react-navigation/native'

import { COLORS, CATEGORIES, CATEGORY_COLORS } from '../config'
import { jobsApi, getErrorMessage } from '../api/client'
import { useAuthStore } from '../store/auth'

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'D\u00FC\u015F\u00FCk', icon: 'tortoise', color: COLORS.info },
  { value: 'NORMAL', label: 'Normal', icon: 'check-circle-outline', color: COLORS.primary },
  { value: 'HIGH', label: 'Y\u00FCksek', icon: 'alert-circle-outline', color: COLORS.accent },
  { value: 'URGENT', label: 'Acil', icon: 'lightning-bolt', color: COLORS.danger },
]

const WAGE_TYPES = [
  { value: 'HOURLY', label: 'Saatlik' },
  { value: 'DAILY', label: 'G\u00FCnl\u00FCk' },
  { value: 'FIXED', label: 'Sabit' },
]

export function PostJobScreen() {
  const navigation = useNavigation<any>()
  const user = useAuthStore((s) => s.user)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('INSAAT')
  const [urgency, setUrgency] = useState('NORMAL')
  const [workDate, setWorkDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [wage, setWage] = useState('')
  const [wageType, setWageType] = useState('DAILY')
  const [capacity, setCapacity] = useState('1')
  const [city, setCity] = useState(user?.city || '')
  const [district, setDistrict] = useState(user?.district || '')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  const descRef = useRef<TextInput>(null)

  const handleSubmit = async () => {
    // Validasyon
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: '\u0130lan ba\u015Fl\u0131\u011F\u0131 gerekli.' })
      return
    }
    if (!description.trim()) {
      Toast.show({ type: 'error', text1: '\u0130\u015F a\u00E7\u0131klamas\u0131 gerekli.' })
      return
    }
    if (!workDate.trim()) {
      Toast.show({ type: 'error', text1: 'Tarih girin (YYYY-MM-DD).' })
      return
    }
    const wageNum = parseFloat(wage)
    if (isNaN(wageNum) || wageNum <= 0) {
      Toast.show({ type: 'error', text1: 'Ge\u00E7erli bir \u00FCcret girin.' })
      return
    }
    const capNum = parseInt(capacity, 10)
    if (isNaN(capNum) || capNum <= 0) {
      Toast.show({ type: 'error', text1: 'Kontenjan 1 veya daha fazla olmal\u0131.' })
      return
    }
    if (!city.trim()) {
      Toast.show({ type: 'error', text1: '\u015Eehir gerekli.' })
      return
    }

    Alert.alert(
      '\u0130lan\u0131 Yay\u0131nla',
      '\u0130lan\u0131n\u0131z\u0131 yay\u0131nlamak istiyor musunuz?',
      [
        { text: '\u0130ptal', style: 'cancel' },
        { text: 'Yay\u0131nla', onPress: confirmSubmit },
      ]
    )
  }

  const confirmSubmit = async () => {
    setLoading(true)
    try {
      await jobsApi.create({
        title: title.trim(),
        description: description.trim(),
        category,
        urgency,
        workDate: workDate.trim(),
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
        wage: parseFloat(wage),
        wageType,
        currency: 'TRY',
        capacity: parseInt(capacity, 10),
        city: city.trim(),
        district: district.trim() || undefined,
        address: address.trim() || undefined,
      })
      Toast.show({
        type: 'success',
        text1: '\u0130lan yay\u0131nland\u0131!',
        text2: '\u0130\u015F\u00E7iler ba\u015Fvurmaya ba\u015Flayabilir.',
      })
      navigation.goBack()
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Ba\u015Fl\u0131k */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>\u0130lan Ba\u015Fl\u0131\u011F\u0131 *</Text>
            <View style={styles.inputContainer}>
              <Icon name="format-title" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="\u00F6rn. Restoran i\u00E7in garson ar\u0131yoruz"
                placeholderTextColor={COLORS.textMuted}
                value={title}
                onChangeText={setTitle}
                returnKeyType="next"
                onSubmitEditing={() => descRef.current?.focus()}
                maxLength={100}
              />
            </View>
          </View>

          {/* A\u00E7\u0131klama */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>\u0130\u015F A\u00E7\u0131klamas\u0131 *</Text>
            <View style={styles.textareaContainer}>
              <TextInput
                ref={descRef}
                style={styles.textarea}
                placeholder="\u0130\u015Fin detaylar\u0131, gereksinimler, notlar..."
                placeholderTextColor={COLORS.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={1000}
              />
            </View>
          </View>

          {/* Kategori */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategori *</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.value
                const color = CATEGORY_COLORS[cat.value] || COLORS.primary
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryOption,
                      active && { backgroundColor: color, borderColor: color },
                    ]}
                    onPress={() => setCategory(cat.value)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.categoryOptionIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.categoryOptionText,
                        active && styles.categoryOptionTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Aciliyet */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Aciliyet *</Text>
            <View style={styles.urgencyRow}>
              {URGENCY_OPTIONS.map((opt) => {
                const active = urgency === opt.value
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.urgencyOption,
                      active && { backgroundColor: opt.color, borderColor: opt.color },
                    ]}
                    onPress={() => setUrgency(opt.value)}
                    activeOpacity={0.85}
                  >
                    <Icon name={opt.icon} size={16} color={active ? 'white' : opt.color} />
                    <Text
                      style={[
                        styles.urgencyOptionText,
                        active && styles.urgencyOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Tarih */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>\u00C7al\u0131\u015Fma Tarihi *</Text>
            <View style={styles.inputContainer}>
              <Icon name="calendar" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (\u00F6rn: 2025-01-15)"
                placeholderTextColor={COLORS.textMuted}
                value={workDate}
                onChangeText={setWorkDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Saat */}
          <View style={styles.row}>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.label}>Ba\u015Flang\u0131\u00E7</Text>
              <View style={styles.inputContainer}>
                <Icon name="clock-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="09:00"
                  placeholderTextColor={COLORS.textMuted}
                  value={startTime}
                  onChangeText={setStartTime}
                />
              </View>
            </View>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.label}>Biti\u015F</Text>
              <View style={styles.inputContainer}>
                <Icon name="clock-check-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="17:00"
                  placeholderTextColor={COLORS.textMuted}
                  value={endTime}
                  onChangeText={setEndTime}
                />
              </View>
            </View>
          </View>

          {/* \u00DCcret */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>\u00DCcret (₺) *</Text>
            <View style={styles.row}>
              <View style={styles.inputGroupHalf}>
                <View style={styles.inputContainer}>
                  <Icon name="cash-multiple" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="500"
                    placeholderTextColor={COLORS.textMuted}
                    value={wage}
                    onChangeText={(t) => setWage(t.replace(/[^0-9.]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.inputGroupHalf}>
                <View style={styles.wageTypeRow}>
                  {WAGE_TYPES.map((wt) => {
                    const active = wageType === wt.value
                    return (
                      <TouchableOpacity
                        key={wt.value}
                        style={[
                          styles.wageTypeBtn,
                          active && styles.wageTypeBtnActive,
                        ]}
                        onPress={() => setWageType(wt.value)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.wageTypeBtnText,
                            active && styles.wageTypeBtnTextActive,
                          ]}
                        >
                          {wt.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Kontenjan */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kontenjan *</Text>
            <View style={styles.inputContainer}>
              <Icon name="account-group-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor={COLORS.textMuted}
                value={capacity}
                onChangeText={(t) => setCapacity(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Konum */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konum *</Text>
            <View style={styles.row}>
              <View style={styles.inputGroupHalf}>
                <View style={styles.inputContainer}>
                  <Icon name="map-marker-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="\u015Eehir"
                    placeholderTextColor={COLORS.textMuted}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
              </View>
              <View style={styles.inputGroupHalf}>
                <View style={styles.inputContainer}>
                  <Icon name="map-marker-radius-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="\u0130l\u00E7e"
                    placeholderTextColor={COLORS.textMuted}
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>
              </View>
            </View>
            <View style={[styles.inputContainer, { marginTop: 10 }]}>
              <Icon name="home-map-marker" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="A\u00E7\u0131k adres (opsiyonel)"
                placeholderTextColor={COLORS.textMuted}
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Submit */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon name="rocket-launch" size={20} color="white" />
                <Text style={styles.submitBtnText}>\u0130lan\u0131 Yay\u0131nla</Text>
              </>
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
  scrollContent: {
    padding: 20,
    paddingTop: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
  textareaContainer: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 110,
  },
  textarea: {
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
    minHeight: 90,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroupHalf: {
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  categoryOptionIcon: {
    fontSize: 16,
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  categoryOptionTextActive: {
    color: 'white',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 6,
  },
  urgencyOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  urgencyOptionTextActive: {
    color: 'white',
  },
  wageTypeRow: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  wageTypeBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wageTypeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  wageTypeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  wageTypeBtnTextActive: {
    color: 'white',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
