/**
 * RegisterScreen - Kay\u0131t ekran\u0131
 *
 * - Rol se\u00E7imi (\u0130\u015F Ar\u0131yorum / \u0130\u015F\u00E7i Ar\u0131yorum) kart \u015Feklinde
 * - Ad Soyad, Email, Telefon, \u015Eifre, \u015Eehir, \u0130l\u00E7e
 * - \u0130\u015Fveren se\u00E7ilince \u015Eirket Ad\u0131
 */

import React, { useState, useRef, forwardRef } from 'react'
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

import { COLORS } from '../config'
import { useAuthStore } from '../store/auth'
import { getErrorMessage } from '../api/client'

type Role = 'WORKER' | 'EMPLOYER'

export function RegisterScreen() {
  const register = useAuthStore((s) => s.register)

  const [role, setRole] = useState<Role>('WORKER')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const emailRef = useRef<TextInput>(null)
  const phoneRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const cityRef = useRef<TextInput>(null)
  const districtRef = useRef<TextInput>(null)
  const companyRef = useRef<TextInput>(null)

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Toast.show({ type: 'error', text1: 'Ad Soyad gerekli.' })
      return
    }
    if (!email.trim() || !email.includes('@')) {
      Toast.show({ type: 'error', text1: 'Ge\u00E7erli bir e-posta girin.' })
      return
    }
    if (password.length < 6) {
      Toast.show({ type: 'error', text1: '\u015Eifre en az 6 karakter olmal\u0131.' })
      return
    }
    if (role === 'EMPLOYER' && !companyName.trim()) {
      Toast.show({ type: 'error', text1: '\u015Eirket ad\u0131 gerekli.' })
      return
    }

    setLoading(true)
    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        role,
        city: city.trim() || undefined,
        district: district.trim() || undefined,
        companyName: role === 'EMPLOYER' ? companyName.trim() : undefined,
      })
      Toast.show({ type: 'success', text1: 'Kay\u0131t ba\u015Far\u0131l\u0131! Ho\u015F geldiniz.' })
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
          {/* Role selection */}
          <Text style={styles.sectionTitle}>Hesap T\u00FCr\u00FC</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'WORKER' && styles.roleCardActive]}
              onPress={() => setRole('WORKER')}
              activeOpacity={0.85}
            >
              <View style={[styles.roleIconCircle, role === 'WORKER' && styles.roleIconCircleActive]}>
                <Icon
                  name="account-hard-hat"
                  size={28}
                  color={role === 'WORKER' ? 'white' : COLORS.primary}
                />
              </View>
              <Text style={[styles.roleTitle, role === 'WORKER' && styles.roleTitleActive]}>
                \u0130\u015F Ar\u0131yorum
              </Text>
              <Text style={[styles.roleDesc, role === 'WORKER' && styles.roleDescActive]}>
                \u0130\u015F\u00E7i olarak kay\u0131t ol
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === 'EMPLOYER' && styles.roleCardActive]}
              onPress={() => setRole('EMPLOYER')}
              activeOpacity={0.85}
            >
              <View style={[styles.roleIconCircle, role === 'EMPLOYER' && styles.roleIconCircleActive]}>
                <Icon
                  name="domain"
                  size={28}
                  color={role === 'EMPLOYER' ? 'white' : COLORS.secondary}
                />
              </View>
              <Text style={[styles.roleTitle, role === 'EMPLOYER' && styles.roleTitleActive]}>
                \u0130\u015F\u00E7i Ar\u0131yorum
              </Text>
              <Text style={[styles.roleDesc, role === 'EMPLOYER' && styles.roleDescActive]}>
                \u0130\u015Fveren olarak kay\u0131t ol
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <InputField
              label="Ad Soyad"
              icon="account-outline"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ad\u0131n\u0131z Soyad\u0131n\u0131z"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <InputField
              ref={emailRef}
              label="E-posta"
              icon="email-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />

            <InputField
              ref={phoneRef}
              label="Telefon (opsiyonel)"
              icon="phone-outline"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/[^0-9+\s]/g, ''))}
              placeholder="05XX XXX XX XX"
              keyboardType="phone-pad"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <View style={styles.inputWrap}>
              <Text style={styles.label}>\u015Eifre</Text>
              <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => (role === 'EMPLOYER' ? companyRef.current?.focus() : cityRef.current?.focus())}
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

            {role === 'EMPLOYER' && (
              <InputField
                ref={companyRef}
                label="\u015Eirket Ad\u0131"
                icon="domain"
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="\u015Eirketinizin ad\u0131"
                returnKeyType="next"
                onSubmitEditing={() => cityRef.current?.focus()}
              />
            )}

            <View style={styles.row}>
              <View style={styles.flex1}>
                <InputField
                  ref={cityRef}
                  label="\u015Eehir"
                  icon="map-marker-outline"
                  value={city}
                  onChangeText={setCity}
                  placeholder="\u0130stanbul"
                  returnKeyType="next"
                  onSubmitEditing={() => districtRef.current?.focus()}
                />
              </View>
              <View style={styles.gap} />
              <View style={styles.flex1}>
                <InputField
                  ref={districtRef}
                  label="\u0130l\u00E7e"
                  icon="map-marker-radius-outline"
                  value={district}
                  onChangeText={setDistrict}
                  placeholder="Kad\u0131k\u00F6y"
                  returnKeyType="done"
                />
              </View>
            </View>
          </View>

          {/* Register button */}
          <TouchableOpacity
            style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerBtnText}>Kay\u0131t Ol</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ============================================================
// InputField bile\u015Feni
// ============================================================
interface InputFieldProps {
  label: string
  icon: string
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric'
  autoCapitalize?: 'none' | 'sentences' | 'words'
  secureTextEntry?: boolean
  returnKeyType?: 'next' | 'done' | 'go'
  onSubmitEditing?: () => void
}
const InputField = forwardRef<TextInput, InputFieldProps>(
  ({ label, icon, value, onChangeText, placeholder, keyboardType, autoCapitalize, returnKeyType, onSubmitEditing }, ref) => (
    <View style={styles.inputWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Icon name={icon} size={20} color={COLORS.textMuted} style={styles.inputIcon} />
        <TextInput
          ref={ref}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
      </View>
    </View>
  )
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleIconCircleActive: {
    backgroundColor: COLORS.primary,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  roleTitleActive: {
    color: COLORS.primaryDark,
  },
  roleDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  roleDescActive: {
    color: COLORS.primaryDark,
  },
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex1: {
    flex: 1,
  },
  gap: {
    width: 12,
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
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  registerBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnDisabled: {
    opacity: 0.7,
  },
  registerBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
