/**
 * ForgotPasswordScreen - 3 ad\u0131ml\u0131 \u015Fifre s\u0131f\u0131rlama
 *
 * 1. Email gir → kod g\u00F6nder
 * 2. Kod + yeni \u015Fifre gir → s\u0131f\u0131rla
 * 3. Ba\u015Far\u0131 ekran\u0131 → geri d\u00F6n
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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { useNavigation } from '@react-navigation/native'

import { COLORS } from '../config'
import { authApi, getErrorMessage } from '../api/client'

type Step = 1 | 2 | 3

export function ForgotPasswordScreen() {
  const navigation = useNavigation()

  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const codeRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const confirmRef = useRef<TextInput>(null)

  const handleSendCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      Toast.show({ type: 'error', text1: 'Ge\u00E7erli bir e-posta girin.' })
      return
    }
    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim())
      Toast.show({
        type: 'success',
        text1: 'Kod g\u00F6nderildi',
        text2: 'E-postan\u0131z\u0131 kontrol edin.',
      })
      setStep(2)
      setTimeout(() => codeRef.current?.focus(), 200)
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (code.length < 4) {
      Toast.show({ type: 'error', text1: 'Do\u011Frulama kodunu girin.' })
      return
    }
    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: '\u015Eifre en az 6 karakter olmal\u0131.' })
      return
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: '\u015Eifreler e\u015Fle\u015Fmiyor.' })
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(code, newPassword)
      setStep(3)
    } catch (err) {
      Toast.show({ type: 'error', text1: getErrorMessage(err) })
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    // navigation.goBack() AuthStack'te Login'e d\u00F6ner
    if (navigation.canGoBack()) {
      navigation.goBack()
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
          {/* Progress indicator */}
          <View style={styles.progressRow}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  step >= (s as Step) && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          {/* Step 1: Email */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.iconCircle}>
                <Icon name="email-send-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.stepTitle}>\u015Eifre S\u0131f\u0131rlama</Text>
              <Text style={styles.stepDesc}>
                E-posta adresinizi girin, size bir do\u011Frulama kodu g\u00F6nderelim.
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>E-posta</Text>
                <View style={styles.inputContainer}>
                  <Icon name="email-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="ornek@email.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    returnKeyType="go"
                    onSubmitEditing={handleSendCode}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
                onPress={handleSendCode}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.actionBtnText}>Kod G\u00F6nder</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Code + New Password */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.iconCircle}>
                <Icon name="shield-key-outline" size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.stepTitle}>Yeni \u015Eifre Belirle</Text>
              <Text style={styles.stepDesc}>
                {email} adresine g\u00F6nderilen kodu ve yeni \u015Fifrenizi girin.
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>Do\u011Frulama Kodu</Text>
                <View style={styles.inputContainer}>
                  <Icon name="shield-check-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    ref={codeRef}
                    style={styles.input}
                    placeholder="Kod"
                    placeholderTextColor={COLORS.textMuted}
                    value={code}
                    onChangeText={(t) => setCode(t.replace(/[^0-9a-zA-Z]/g, ''))}
                    keyboardType="default"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>Yeni \u015Eifre</Text>
                <View style={styles.inputContainer}>
                  <Icon name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="En az 6 karakter"
                    placeholderTextColor={COLORS.textMuted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputWrap}>
                <Text style={styles.label}>Yeni \u015Eifre (Tekrar)</Text>
                <View style={styles.inputContainer}>
                  <Icon name="lock-check-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={confirmRef}
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="go"
                    onSubmitEditing={handleResetPassword}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.actionBtn, loading && styles.actionBtnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.actionBtnText}>\u015Eifreyi S\u0131f\u0131rla</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep(1)}
                style={styles.backLink}
              >
                <Text style={styles.backLinkText}>← Geri d\u00F6n</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
                <Icon name="check-circle-outline" size={48} color={COLORS.success} />
              </View>
              <Text style={styles.stepTitle}>\u015Eifreniz G\u00FCncellendi!</Text>
              <Text style={styles.stepDesc}>
                Art\u0131k yeni \u015Fifrenizle giri\u015F yapabilirsiniz.
              </Text>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleBackToLogin}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>Giri\u015F Yap'a D\u00F6n</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
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
    padding: 24,
    paddingBottom: 40,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
    marginTop: 8,
  },
  progressDot: {
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepContainer: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  inputWrap: {
    width: '100%',
    marginBottom: 16,
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
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  actionBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  actionBtnDisabled: {
    opacity: 0.7,
  },
  actionBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  backLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
})
