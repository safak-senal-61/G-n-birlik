/**
 * SecurityScreen - G\u00FCvenlik ayarlar\u0131
 *
 * - \u015Eifre de\u011Fi\u015Ftirme
 * - E-posta de\u011Fi\u015Ftirme (2 ad\u0131ml\u0131)
 * - 2FA b\u00F6l\u00FCm\u00FC (aktif/devre d\u0131\u015F\u0131, etkinle\u015Ftir → TwoFASetup'a navigate)
 * - G\u00FCvenlik durumu kart\u0131
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { COLORS } from '../config'
import { authApi, getErrorMessage } from '../api/client'
import { useAuthStore } from '../store/auth'
import type { RootStackParamList } from '../navigation/RootNavigator'

type NavProp = NativeStackNavigationProp<RootStackParamList, 'TwoFASetup'>

interface SecurityInfo {
  twoFactorEnabled?: boolean
  emailVerified?: boolean
  lastPasswordChange?: string
  provider?: string
  createdAt?: string
}

export function SecurityScreen() {
  const navigation = useNavigation<NavProp>()
  const { user, updateUser } = useAuthStore()

  // \u015Eifre de\u011Fi\u015Ftirme
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // E-posta de\u011Fi\u015Ftirme
  const [newEmail, setNewEmail] = useState('')
  const [emailCode, setEmailCode] = useState('')
  const [emailStep, setEmailStep] = useState<1 | 2>(1)
  const [emailLoading, setEmailLoading] = useState(false)

  // 2FA
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo>({})
  const [disableCode, setDisableCode] = useState('')
  const [disableLoading, setDisableLoading] = useState(false)
  const [infoLoading, setInfoLoading] = useState(true)

  const currentPwRef = useRef<TextInput>(null)
  const newPwRef = useRef<TextInput>(null)
  const confirmPwRef = useRef<TextInput>(null)

  const loadSecurityInfo = useCallback(async () => {
    try {
      const info = await authApi.getSecurityInfo()
      setSecurityInfo(info)
    } catch (err) {
      // sessiz ge\u00E7
    } finally {
      setInfoLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSecurityInfo()
  }, [loadSecurityInfo])

  // \u015Eifre de\u011Fi\u015Ftir
  const handleChangePassword = async () => {
    if (!currentPw) {
      Toast.show({ type: 'error', text1: 'Mevcut \u015Fifrenizi girin.' })
      return
    }
    if (newPw.length < 6) {
      Toast.show({ type: 'error', text1: 'Yeni \u015Fifre en az 6 karakter olmal\u0131.' })
      return
    }
    if (newPw !== confirmPw) {
      Toast.show({ type: 'error', text1: '\u015Eifreler e\u015Fle\u015Fmiyor.' })
      return
    }

    setPwLoading(true)
    try {
      await authApi.changePassword(currentPw, newPw)
      Toast.show({ type: 'success', text1: '\u015Eifreniz g\u00FCncellendi.' })
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      loadSecurityInfo()
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setPwLoading(false)
    }
  }

  // E-posta de\u011Fi\u015Ftirme: 1. ad\u0131m (kod iste)
  const handleRequestEmailChange = async () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      Toast.show({ type: 'error', text1: 'Ge\u00E7erli bir e-posta girin.' })
      return
    }
    if (newEmail.trim() === user?.email) {
      Toast.show({ type: 'error', text1: 'Yeni e-posta mevcut e-postan\u0131zla ayn\u0131.' })
      return
    }

    setEmailLoading(true)
    try {
      await authApi.requestEmailChange(newEmail.trim())
      Toast.show({
        type: 'success',
        text1: 'Do\u011Frulama kodu g\u00F6nderildi',
        text2: `${newEmail} adresini kontrol edin.`,
      })
      setEmailStep(2)
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setEmailLoading(false)
    }
  }

  // E-posta de\u011Fi\u015Ftirme: 2. ad\u0131m (kod do\u011Frula)
  const handleConfirmEmailChange = async () => {
    if (emailCode.length < 4) {
      Toast.show({ type: 'error', text1: 'Do\u011Frulama kodunu girin.' })
      return
    }

    setEmailLoading(true)
    try {
      await authApi.confirmEmailChange(emailCode)
      Toast.show({ type: 'success', text1: 'E-posta adresiniz g\u00FCncellendi.' })
      updateUser({ email: newEmail.trim() })
      setNewEmail('')
      setEmailCode('')
      setEmailStep(1)
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setEmailLoading(false)
    }
  }

  // 2FA etkinle\u015Ftir → TwoFASetup'a git
  const handleEnable2FA = () => {
    navigation.navigate('TwoFASetup')
  }

  // 2FA devre d\u0131\u015F\u0131 b\u0131rak
  const handleDisable2FA = () => {
    Alert.alert(
      '2FA Devre D\u0131\u015F\u0131 B\u0131rak',
      '\u0130ki fakt\u00F6rl\u00FC do\u011Frulamay\u0131 kapatmak istiyor musunuz? Bu hesap g\u00FCvenli\u011Finizi azalt\u0131r.',
      [
        { text: '\u0130ptal', style: 'cancel' },
        { text: 'Kapat', style: 'destructive', onPress: confirmDisable2FA },
      ]
    )
  }

  const confirmDisable2FA = async () => {
    if (!disableCode) {
      Toast.show({
        type: 'error',
        text1: '2FA kodu gerekli',
        text2: 'L\u00FCtfen do\u011Frulay\u0131c\u0131 uygulaman\u0131zdaki 6 haneli kodu girin.',
      })
      return
    }
    setDisableLoading(true)
    try {
      await authApi.disable2FA(disableCode)
      Toast.show({ type: 'success', text1: '2FA devre d\u0131\u015F\u0131 b\u0131rak\u0131ld\u0131.' })
      updateUser({ twoFactorEnabled: false })
      setDisableCode('')
      loadSecurityInfo()
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setDisableLoading(false)
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
          {/* G\u00FCvenlik durumu kart\u0131 */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Icon name="shield-check-outline" size={24} color={COLORS.primary} />
              <Text style={styles.statusTitle}>G\u00FCvenlik Durumu</Text>
            </View>
            <View style={styles.statusItems}>
              <StatusItem
                icon={securityInfo.twoFactorEnabled ? 'shield-check' : 'shield-alert-outline'}
                color={securityInfo.twoFactorEnabled ? COLORS.success : COLORS.accent}
                label="\u0130ki Fakt\u00F6rl\u00FC Do\u011Frulama"
                value={securityInfo.twoFactorEnabled ? 'Aktif' : 'Devre d\u0131\u015F\u0131'}
              />
              <StatusItem
                icon={securityInfo.emailVerified || user?.isVerified ? 'email-check-outline' : 'email-alert-outline'}
                color={securityInfo.emailVerified || user?.isVerified ? COLORS.success : COLORS.accent}
                label="E-posta Do\u011Frulama"
                value={securityInfo.emailVerified || user?.isVerified ? 'Do\u011Fruland\u0131' : 'Beklemede'}
              />
              <StatusItem
                icon="account-key-outline"
                color={COLORS.info}
                label="Giri\u015F Y\u00F6ntemi"
                value={securityInfo.provider === 'google' ? 'Google' : 'E-posta/\u015Eifre'}
              />
            </View>
          </View>

          {/* \u015Eifre de\u011Fi\u015Ftirme */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="lock-reset" size={20} color={COLORS.text} />
              <Text style={styles.sectionTitle}>\u015Eifre De\u011Fi\u015Ftir</Text>
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Mevcut \u015Eifre</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={currentPwRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={currentPw}
                  onChangeText={setCurrentPw}
                  secureTextEntry={!showPw}
                  returnKeyType="next"
                  onSubmitEditing={() => newPwRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Yeni \u015Eifre</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock-plus-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={newPwRef}
                  style={styles.input}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={COLORS.textMuted}
                  value={newPw}
                  onChangeText={setNewPw}
                  secureTextEntry={!showPw}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPwRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Yeni \u015Eifre (Tekrar)</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock-check-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={confirmPwRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry={!showPw}
                  returnKeyType="go"
                  onSubmitEditing={handleChangePassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPw(!showPw)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.actionBtn, pwLoading && styles.actionBtnDisabled]}
              onPress={handleChangePassword}
              disabled={pwLoading}
              activeOpacity={0.85}
            >
              {pwLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.actionBtnText}>\u015Eifreyi G\u00FCncelle</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* E-posta de\u011Fi\u015Ftirme */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="email-edit-outline" size={20} color={COLORS.text} />
              <Text style={styles.sectionTitle}>E-posta De\u011Fi\u015Ftir</Text>
            </View>

            <View style={styles.currentEmailBox}>
              <Icon name="email-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.currentEmailText}>Mevcut: {user?.email}</Text>
            </View>

            {emailStep === 1 ? (
              <>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Yeni E-posta</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="email-plus-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="yeni@email.com"
                      placeholderTextColor={COLORS.textMuted}
                      value={newEmail}
                      onChangeText={setNewEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      returnKeyType="go"
                      onSubmitEditing={handleRequestEmailChange}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.actionBtn, emailLoading && styles.actionBtnDisabled]}
                  onPress={handleRequestEmailChange}
                  disabled={emailLoading}
                  activeOpacity={0.85}
                >
                  {emailLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.actionBtnText}>Do\u011Frulama Kodu G\u00F6nder</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>Do\u011Frulama Kodu</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="shield-check-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Kod"
                      placeholderTextColor={COLORS.textMuted}
                      value={emailCode}
                      onChangeText={setEmailCode}
                      returnKeyType="go"
                      onSubmitEditing={handleConfirmEmailChange}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.actionBtn, emailLoading && styles.actionBtnDisabled]}
                  onPress={handleConfirmEmailChange}
                  disabled={emailLoading}
                  activeOpacity={0.85}
                >
                  {emailLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.actionBtnText}>E-postay\u0131 G\u00FCncelle</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setEmailStep(1)}
                  style={styles.backLink}
                >
                  <Text style={styles.backLinkText}>← Geri</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* 2FA */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="two-factor-authentication" size={20} color={COLORS.text} />
              <Text style={styles.sectionTitle}>\u0130ki Fakt\u00F6rl\u00FC Do\u011Frulama (2FA)</Text>
            </View>

            <View
              style={[
                styles.twofaStatusBox,
                { backgroundColor: securityInfo.twoFactorEnabled ? COLORS.primaryLight : '#fef3c7' },
              ]}
            >
              <Icon
                name={securityInfo.twoFactorEnabled ? 'shield-check' : 'shield-alert-outline'}
                size={28}
                color={securityInfo.twoFactorEnabled ? COLORS.primary : COLORS.accent}
              />
              <View style={styles.twofaStatusInfo}>
                <Text
                  style={[
                    styles.twofaStatusTitle,
                    { color: securityInfo.twoFactorEnabled ? COLORS.primaryDark : '#92400e' },
                  ]}
                >
                  {securityInfo.twoFactorEnabled ? '2FA Aktif' : '2FA Devre D\u0131\u015F\u0131'}
                </Text>
                <Text
                  style={[
                    styles.twofaStatusDesc,
                    { color: securityInfo.twoFactorEnabled ? COLORS.primaryDark : '#92400e' },
                  ]}
                >
                  {securityInfo.twoFactorEnabled
                    ? 'Hesab\u0131n\u0131z ek koruma alt\u0131nda.'
                    : 'Hesab\u0131n\u0131z\u0131 korumak i\u00E7in 2FA\'y\u0131 etkinle\u015Ftirin.'}
                </Text>
              </View>
            </View>

            {securityInfo.twoFactorEnabled ? (
              <>
                <View style={styles.inputWrap}>
                  <Text style={styles.label}>2FA Kodu (devre d\u0131\u015F\u0131 b\u0131rakmak i\u00E7in)</Text>
                  <View style={styles.inputContainer}>
                    <Icon name="shield-key-outline" size={20} color={COLORS.danger} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="000000"
                      placeholderTextColor={COLORS.textMuted}
                      value={disableCode}
                      onChangeText={(t) => setDisableCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.dangerBtn, disableLoading && styles.actionBtnDisabled]}
                  onPress={handleDisable2FA}
                  disabled={disableLoading}
                  activeOpacity={0.85}
                >
                  {disableLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.actionBtnText}>2FA'y\u0131 Devre D\u0131\u015F\u0131 B\u0131rak</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleEnable2FA}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>2FA Etkinle\u015Ftir</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ============================================================
// Alt bile\u015Fenler
// ============================================================
function StatusItem({
  icon,
  color,
  label,
  value,
}: {
  icon: string
  color: string
  label: string
  value: string
}) {
  return (
    <View style={styles.statusItem}>
      <View style={[styles.statusItemIcon, { backgroundColor: color + '22' }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statusItemLabel}>{label}</Text>
      <Text style={[styles.statusItemValue, { color }]}>{value}</Text>
    </View>
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
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusItems: {
    gap: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusItemLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusItemValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  inputWrap: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
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
  eyeBtn: {
    padding: 4,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: 'bold',
  },
  dangerBtn: {
    backgroundColor: COLORS.danger,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  backLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  currentEmailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  currentEmailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  twofaStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  twofaStatusInfo: {
    flex: 1,
  },
  twofaStatusTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  twofaStatusDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
})
