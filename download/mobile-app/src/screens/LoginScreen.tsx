/**
 * LoginScreen - Giri\u015F ekran\u0131
 *
 * - Email + \u015Fifre
 * - 2FA deste\u011Fi (login error: '2FA_REQUIRED')
 * - \u015Eifremi unuttum / Kay\u0131t ol linkleri
 * - Google ile giri\u015F (disabled - ayr\u0131 kurulum ister)
 * - Demo hesap h\u0131zl\u0131 giri\u015F butonlar\u0131
 */

import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import Toast from 'react-native-toast-message'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { COLORS } from '../config'
import { useAuthStore } from '../store/auth'
import { getErrorMessage } from '../api/client'
import type { AuthStackParamList } from '../navigation/AuthStack'

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>

export function LoginScreen() {
  const navigation = useNavigation<NavProp>()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const passwordRef = useRef<TextInput>(null)
  const codeRef = useRef<TextInput>(null)

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Toast.show({ type: 'error', text1: 'L\u00FCtfen email ve \u015Fifre girin.' })
      return
    }

    if (show2FA && twoFactorCode.length !== 6) {
      Toast.show({ type: 'error', text1: '6 haneli 2FA kodunu girin.' })
      return
    }

    setLoading(true)
    try {
      await login(email.trim(), password, show2FA ? twoFactorCode : undefined)
      Toast.show({ type: 'success', text1: 'Giri\u015F ba\u015Far\u0131l\u0131!' })
    } catch (err: any) {
      if (err?.message === '2FA_REQUIRED') {
        setShow2FA(true)
        Toast.show({
          type: 'info',
          text1: '2FA gerekli',
          text2: 'L\u00FCtfen do\u011Frulay\u0131c\u0131 uygulaman\u0131zdaki kodu girin.',
        })
        setTimeout(() => codeRef.current?.focus(), 200)
      } else {
        Toast.show({ type: 'error', text1: getErrorMessage(err) })
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('123456')
    setShow2FA(false)
    setTwoFactorCode('')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>💼</Text>
            </View>
            <Text style={styles.title}>G\u00FCn\u00FCbirlik \u0130\u015F Bul</Text>
            <Text style={styles.subtitle}>Konum bazl\u0131 i\u015F platformu</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Giri\u015F Yap</Text>

            {/* Email */}
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
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputWrap}>
              <Text style={styles.label}>\u015Eifre</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType={show2FA ? 'next' : 'go'}
                  onSubmitEditing={() => (show2FA ? codeRef.current?.focus() : handleLogin())}
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

            {/* 2FA Input */}
            {show2FA && (
              <View style={styles.inputWrap}>
                <Text style={styles.label}>2FA Kodu (6 haneli)</Text>
                <View style={styles.inputContainer}>
                  <Icon name="shield-key-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
                  <TextInput
                    ref={codeRef}
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor={COLORS.textMuted}
                    value={twoFactorCode}
                    onChangeText={(t) => setTwoFactorCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                </View>
              </View>
            )}

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>\u015Eifremi unuttum?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginBtnText}>Giri\u015F Yap</Text>
              )}
            </TouchableOpacity>

            {/* Google Sign-In */}
            <TouchableOpacity style={styles.googleBtn} disabled activeOpacity={0.85}>
              <Icon name="google" size={20} color={COLORS.textMuted} />
              <Text style={styles.googleBtnText}>Google ile Giri\u015F (yak\u0131nda)</Text>
            </TouchableOpacity>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Hesab\u0131n yok mu? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Kay\u0131t Ol</Text>
              </TouchableOpacity>
            </View>

            {/* Demo accounts */}
            <View style={styles.demoContainer}>
              <Text style={styles.demoTitle}>Demo Hesaplar</Text>
              <View style={styles.demoRow}>
                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => fillDemo('worker1@example.com')}
                >
                  <Icon name="account-hard-hat" size={18} color={COLORS.primary} />
                  <Text style={styles.demoBtnText}>\u0130\u015F\u00E7i</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoBtn}
                  onPress={() => fillDemo('employer1@example.com')}
                >
                  <Icon name="domain" size={18} color={COLORS.secondary} />
                  <Text style={styles.demoBtnText}>\u0130\u015Fveren</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  inputWrap: {
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
    backgroundColor: '#f9fafb',
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleBtn: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#f9fafb',
    gap: 10,
    marginBottom: 16,
    opacity: 0.6,
  },
  googleBtnText: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  registerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  demoTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f9fafb',
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
})
