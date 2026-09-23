/**
 * TwoFASetupScreen - 2FA kurulumu
 *
 * - QR kod g\u00F6ster (api'den gelen qrCode base64)
 * - Manuel secret kod g\u00F6ster
 * - Backup kodlar\u0131 g\u00F6ster (10 adet)
 * - 6 haneli kod input
 * - "Do\u011Frula" butonu
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { useNavigation } from '@react-navigation/native'

import { COLORS } from '../config'
import { authApi, getErrorMessage } from '../api/client'
import { useAuthStore } from '../store/auth'

export function TwoFASetupScreen() {
  const navigation = useNavigation<any>()
  const { updateUser } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [code, setCode] = useState('')

  const [qrCode, setQrCode] = useState<string>('') // base64 data URL
  const [secret, setSecret] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const loadSetup = useCallback(async () => {
    setLoading(true)
    try {
      const data = await authApi.setup2FA()
      // API cevap format\u0131: { qrCode, secret, backupCodes }
      setQrCode(data.qrCode || data.qr || '')
      setSecret(data.secret || data.manualCode || '')
      setBackupCodes(data.backupCodes || data.backup_codes || [])
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSetup()
  }, [loadSetup])

  const handleVerify = async () => {
    if (code.length !== 6) {
      Toast.show({ type: 'error', text1: '6 haneli kodu girin.' })
      return
    }
    setVerifying(true)
    try {
      await authApi.verify2FA(code)
      updateUser({ twoFactorEnabled: true })
      Toast.show({
        type: 'success',
        text1: '2FA etkinle\u015Ftirildi!',
        text2: 'Hesab\u0131n\u0131z art\u0131k daha g\u00FCvenli.',
      })
      Alert.alert(
        'Ba\u015Far\u0131l\u0131!',
        '\u0130ki fakt\u00F6rl\u00FC do\u011Frulama ba\u015Far\u0131yla etkinle\u015Ftirildi.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      )
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setVerifying(false)
    }
  }

  const handleCopySecret = () => {
    // Manuel olarak kopyalama - \u015Fimdilik sadece uyar\u0131
    Toast.show({ type: 'info', text1: 'Secret kodu yaz\u0131n veya taray\u0131n.' })
  }

  const handleSaveBackupCodes = () => {
    Alert.alert(
      'Backup Kodlar\u0131',
      'Bu kodlar\u0131 g\u00FCvenli bir yerde saklay\u0131n. Telefonunuzu kaybederseniz hesab\u0131n\u0131za eri\u015Fmek i\u00E7in bunlara ihtiyac\u0131n\u0131z olacak.',
      [{ text: 'Anlad\u0131m' }]
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>2FA kurulumu haz\u0131rlan\u0131yor...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Icon name="information-outline" size={20} color={COLORS.primaryDark} />
          <Text style={styles.infoText}>
            Google Authenticator veya benzeri bir uygulama kullanarak QR kodu taray\u0131n.
          </Text>
        </View>

        {/* QR Kod */}
        <View style={styles.qrCard}>
          <Text style={styles.cardTitle}>1. QR Kodu Taray\u0131n</Text>
          <Text style={styles.cardDesc}>
            Authenticator uygulaman\u0131zla bu QR kodu taray\u0131n.
          </Text>
          <View style={styles.qrBox}>
            {qrCode ? (
              <Image
                source={{ uri: qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}` }}
                style={styles.qrImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Icon name="qrcode-scan" size={80} color={COLORS.border} />
                <Text style={styles.qrPlaceholderText}>QR kod y\u00FCklenemedi</Text>
              </View>
            )}
          </View>
        </View>

        {/* Manuel kod */}
        {secret ? (
          <View style={styles.section}>
            <Text style={styles.cardTitle}>2. Manuel Kod (alternatif)</Text>
            <Text style={styles.cardDesc}>
              QR kodu tarayamazsan\u0131z bu kodu elle girin.
            </Text>
            <TouchableOpacity
              style={styles.secretBox}
              onPress={handleCopySecret}
              activeOpacity={0.85}
            >
              <Text style={styles.secretText}>{secret}</Text>
              <Icon name="content-copy" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Backup kodlar\u0131 */}
        {backupCodes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.backupHeader}>
              <Text style={styles.cardTitle}>3. Backup Kodlar\u0131</Text>
              <TouchableOpacity onPress={handleSaveBackupCodes} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Icon name="information-outline" size={20} color={COLORS.info} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cardDesc}>
              Bu kodlar\u0131 g\u00FCvenli bir yerde saklay\u0131n. Her kod bir kez kullan\u0131l\u0131r.
            </Text>
            <View style={styles.backupGrid}>
              {backupCodes.map((c, i) => (
                <View key={i} style={styles.backupCodeBox}>
                  <Text style={styles.backupCodeText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Do\u011Frulama */}
        <View style={styles.section}>
          <Text style={styles.cardTitle}>4. Do\u011Frula</Text>
          <Text style={styles.cardDesc}>
            Authenticator uygulaman\u0131zdaki 6 haneli kodu girin.
          </Text>
          <View style={styles.codeInputContainer}>
            <Icon name="shield-check-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.codeInput}
              placeholder="000000"
              placeholderTextColor={COLORS.textMuted}
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              returnKeyType="go"
              onSubmitEditing={handleVerify}
              maxLength={6}
            />
          </View>

          <TouchableOpacity
            style={[styles.verifyBtn, (verifying || code.length !== 6) && styles.verifyBtnDisabled]}
            onPress={handleVerify}
            disabled={verifying || code.length !== 6}
            activeOpacity={0.85}
          >
            {verifying ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon name="check-circle-outline" size={20} color="white" />
                <Text style={styles.verifyBtnText}>Do\u011Frula ve Etkinle\u015Ftir</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* \u0130ptal */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.cancelBtnText}>\u0130ptal</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
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
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primaryDark,
    lineHeight: 18,
  },
  qrCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  qrBox: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  qrPlaceholderText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secretBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  secretText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 1,
  },
  backupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backupCodeBox: {
    width: '48%',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backupCodeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    height: 56,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  codeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 8,
    paddingVertical: 0,
  },
  verifyBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  verifyBtnDisabled: {
    opacity: 0.5,
  },
  verifyBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
})
