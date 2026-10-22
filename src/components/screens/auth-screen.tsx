'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Building2,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Shield,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  FileText,
  Scale,
  Check,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import Logo from '@/components/shared/logo'
import { LEGAL_CONTRACTS, LegalContractId } from '@/lib/legal-contracts'

type Tab = 'login' | 'register'

export interface CountryOption {
  code: string
  name: string
  flag: string
  minDigits: number
  maxDigits: number
  placeholder: string
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: '+90', name: 'Türkiye', flag: 'TR', minDigits: 10, maxDigits: 11, placeholder: '05XX XXX XX XX' },
  { code: '+994', name: 'Azerbaycan', flag: 'AZ', minDigits: 9, maxDigits: 9, placeholder: '50 XXX XX XX' },
  { code: '+49', name: 'Almanya', flag: 'DE', minDigits: 10, maxDigits: 11, placeholder: '151 XXXX XXXX' },
  { code: '+1', name: 'ABD / Kanada', flag: 'US', minDigits: 10, maxDigits: 10, placeholder: '555 123 4567' },
  { code: '+44', name: 'Birleşik Krallık', flag: 'GB', minDigits: 10, maxDigits: 10, placeholder: '7911 123456' },
  { code: '+33', name: 'Fransa', flag: 'FR', minDigits: 9, maxDigits: 9, placeholder: '6 12 34 56 78' },
  { code: '+31', name: 'Hollanda', flag: 'NL', minDigits: 9, maxDigits: 9, placeholder: '6 12345678' },
  { code: '+7', name: 'Rusya / Kazakistan', flag: 'RU', minDigits: 10, maxDigits: 10, placeholder: '912 345 67 89' },
  { code: '+998', name: 'Özbekistan', flag: 'UZ', minDigits: 9, maxDigits: 9, placeholder: '90 123 45 67' },
  { code: '+993', name: 'Türkmenistan', flag: 'TM', minDigits: 8, maxDigits: 8, placeholder: '65 12 34 56' },
  { code: '+996', name: 'Kırgızistan', flag: 'KG', minDigits: 9, maxDigits: 9, placeholder: '555 12 34 56' },
  { code: '+32', name: 'Belçika', flag: 'BE', minDigits: 9, maxDigits: 9, placeholder: '470 12 34 56' },
  { code: '+43', name: 'Avusturya', flag: 'AT', minDigits: 10, maxDigits: 10, placeholder: '664 1234567' },
  { code: '+41', name: 'İsviçre', flag: 'CH', minDigits: 9, maxDigits: 9, placeholder: '78 123 45 67' },
]

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  '411578437442-gs1rck2124rgr516fe9dn9tuu15ge9ig.apps.googleusercontent.com'

export default function AuthScreen({ isModal = false }: { isModal?: boolean }) {
  const { login, register, loginWithGoogle } = useAuth()
  const { authModalTab, authModalTitle } = useApp()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>(authModalTab || 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [showAdminSecret, setShowAdminSecret] = useState(false)

  // Error dialog state
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  })

  const showErrorDialog = (title: string, message: string) => {
    setErrorDialog({ open: true, title, message })
  }

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1)
  const [regRole, setRegRole] = useState<'WORKER' | 'EMPLOYER' | 'ADMIN'>('WORKER')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regFullName, setRegFullName] = useState('')
  const [selectedCountryCode, setSelectedCountryCode] = useState('+90')
  const [regPhone, setRegPhone] = useState('')
  const [regCity, setRegCity] = useState('İstanbul')
  const [regDistrict, setRegDistrict] = useState('')
  const [regCompanyName, setRegCompanyName] = useState('')
  const [adminSecret, setAdminSecret] = useState('')
  const [logoClickCount, setLogoClickCount] = useState(0)

  // Sözleşme onay kutuları ve sözleşme okuma modalı
  const [acceptedContracts, setAcceptedContracts] = useState(false)
  const [acceptedKvkk, setAcceptedKvkk] = useState(false)
  const [activeContractModal, setActiveContractModal] = useState<LegalContractId | null>(null)

  // Google ile yeni kayıt olan kullanıcı için zorunlu Rol Seçimi ve Bilgi Tamamlama (Onboarding)
  const [googlePendingToken, setGooglePendingToken] = useState<string | null>(null)
  const [googleProfile, setGoogleProfile] = useState<{
    email: string
    fullName: string
    avatarUrl?: string
  } | null>(null)
  const [googleRole, setGoogleRole] = useState<'WORKER' | 'EMPLOYER' | null>(null)

  // Google One Tap ile gelen yeni kullanıcı: kayıt tamamlama ekranını aç
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.sessionStorage.getItem('gb_google_pending_registration')
      if (!raw) return
      window.sessionStorage.removeItem('gb_google_pending_registration')
      const pending = JSON.parse(raw)
      if (pending?.token) {
        setGooglePendingToken(pending.token)
        setGoogleProfile(pending.profile || { email: '', fullName: '' })
        if (pending.profile?.fullName) setRegFullName(pending.profile.fullName)
      }
    } catch {
      // ignore
    }
  }, [])

  // Modal açıldığında sekme ve rol bilgisini senkronize et
  useEffect(() => {
    if (authModalTab) {
      setTab(authModalTab)
      setError('')
    }
    if (authModalTitle && authModalTitle.toLowerCase().includes('ilan')) {
      setRegRole('EMPLOYER')
    }
  }, [authModalTab, authModalTitle])

  const activeCountry = COUNTRY_OPTIONS.find((c) => c.code === selectedCountryCode) || COUNTRY_OPTIONS[0]

  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, '')
    if (digits.length > activeCountry.maxDigits) {
      digits = digits.slice(0, activeCountry.maxDigits)
    }

    let formatted = digits
    if (activeCountry.code === '+90') {
      if (digits.startsWith('0')) {
        if (digits.length <= 4) formatted = digits
        else if (digits.length <= 7) formatted = `${digits.slice(0, 4)} ${digits.slice(4)}`
        else if (digits.length <= 9) formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
        else formatted = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`
      } else {
        if (digits.length <= 3) formatted = digits
        else if (digits.length <= 6) formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`
        else if (digits.length <= 8) formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
        else formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
      }
    } else {
      if (digits.length > 3 && digits.length <= 6) {
        formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`
      } else if (digits.length > 6) {
        formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
      }
    }

    setRegPhone(formatted)
  }

  const handleNextStep = () => {
    setError('')
    if (regStep === 1) {
      setRegStep(2)
    } else if (regStep === 2) {
      if (!regFullName.trim()) {
        toast.error('Lütfen adınızı ve soyadınızı girin.')
        return
      }
      if (!regEmail.trim() || !regEmail.includes('@')) {
        toast.error('Lütfen geçerli bir e-posta adresi girin.')
        return
      }
      if (regRole === 'EMPLOYER' && !regCompanyName.trim()) {
        toast.error('Lütfen şirket veya işletme adınızı girin.')
        return
      }
      if (regRole === 'ADMIN' && !adminSecret.trim()) {
        toast.error('Lütfen yönetici kayıt anahtarını girin.')
        return
      }
      setRegStep(3)
    }
  }

  const handlePrevStep = () => {
    setError('')
    if (regStep === 3) setRegStep(2)
    else if (regStep === 2) setRegStep(1)
  }

  // Şifremi unuttum akışı
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotStep, setForgotStep] = useState<'email' | 'reset' | 'done'>('email')
  const [forgotLoading, setForgotLoading] = useState(false)

  // Google GSI script'ini önceden yükle (tıklama anında popup engelleyiciye takılmaması için)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).google?.accounts) return
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [])

  // 2FA login state
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const adminParam = params.get('admin')
      if (adminParam) {
        setLogoClickCount(5)
        setRegRole('ADMIN')
        setTab('register')
        if (adminParam !== '1' && adminParam.length > 5) {
          setAdminSecret(adminParam)
        }
        toast.success('Yönetici kayıt modu açıldı', {
          description: 'Yönetici anahtarını girerek devam edebilirsiniz.',
        })
      }
    }
  }, [])

  const [loginInProgress, setLoginInProgress] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loginInProgress) return
    setLoginInProgress(true)
    setLoading(true)
    setError('')
    try {
      await login(loginEmail, loginPassword)
      useApp.getState().closeAuthModal()
      toast.success('Oturum açıldı')
    } catch (err: any) {
      if (err.message === '2FA_REQUIRED' || err.requiresTwoFactor) {
        setError('')
        setLoading(false)
        setLoginInProgress(false)
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('show2FA', 'true')
          window.sessionStorage.setItem('2faEmail', loginEmail)
          window.sessionStorage.setItem('2faPassword', loginPassword)
        }
        setShowTwoFactor(true)
        toast.info('İki aşamalı doğrulama kodu gerekli')
        return
      } else {
        const msg = err.message || 'Giriş yapılamadı.'
        setError(msg)
        let title = 'Giriş Hatası'
        let friendlyMsg = msg
        if (msg.includes('hatalı') || msg.includes('şifre')) {
          friendlyMsg = 'E-posta veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.'
        } else if (msg.includes('Çok fazla') || msg.includes('rate')) {
          title = 'Çok Fazla Deneme'
          friendlyMsg = 'Çok fazla giriş denemesi yaptınız. Lütfen birkaç dakika bekleyin.'
        } else if (msg.includes('askı') || msg.includes('ban')) {
          title = 'Hesap Askıya Alınmış'
          friendlyMsg = msg
        }
        setTimeout(() => {
          toast.error(title, { description: friendlyMsg, duration: 5000 })
        }, 100)
      }
    } finally {
      setLoading(false)
      setLoginInProgress(false)
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('show2FA') === 'true') {
      const email = window.sessionStorage.getItem('2faEmail')
      const password = window.sessionStorage.getItem('2faPassword')
      if (email) setLoginEmail(email)
      if (password) setLoginPassword(password)
      setShowTwoFactor(true)
    }
  }, [])

  const closeTwoFactor = () => {
    setShowTwoFactor(false)
    setTwoFactorCode('')
    setError('')
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('show2FA')
      window.sessionStorage.removeItem('2faEmail')
      window.sessionStorage.removeItem('2faPassword')
    }
  }

  const handleTwoFactorLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (twoFactorCode.length !== 6) {
      showErrorDialog('Eksik Kod', 'Lütfen 6 haneli doğrulama kodunu eksiksiz girin.')
      return
    }
    setTwoFactorLoading(true)
    setError('')
    try {
      await login(loginEmail, loginPassword, twoFactorCode)
      toast.success('Oturum açıldı')
      closeTwoFactor()
      useApp.getState().closeAuthModal()
    } catch (err: any) {
      if (err.message === '2FA_REQUIRED' || err.requiresTwoFactor) {
        showErrorDialog('Geçersiz Kod', 'Girdiğiniz doğrulama kodu yanlış. Lütfen tekrar deneyin.')
      } else {
        showErrorDialog('Doğrulama Hatası', err.message || 'Giriş yapılamadı.')
      }
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const [registerInProgress, setRegisterInProgress] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerInProgress) return

    if (!regPhone.trim()) {
      toast.error('Lütfen geçerli bir telefon numarası girin.')
      return
    }

    if (!acceptedContracts || !acceptedKvkk) {
      toast.error(
        'Kayıt olabilmek için Mesafeli Satış Sözleşmesi, Kullanıcı Sözleşmesi, Gizlilik ve KVKK metinlerini onaylamalısınız.'
      )
      return
    }

    setRegisterInProgress(true)
    setLoading(true)
    setError('')

    let formattedPhone: string | undefined = undefined
    if (regPhone.trim()) {
      let rawDigits = regPhone.replace(/\D/g, '')
      if (selectedCountryCode === '+90') {
        if (rawDigits.startsWith('0')) rawDigits = rawDigits.substring(1)
        if (rawDigits.length !== 10) {
          toast.error('Lütfen 10 veya 11 haneli geçerli bir telefon numarası girin.')
          setLoading(false)
          setRegisterInProgress(false)
          return
        }
        formattedPhone = `+90${rawDigits}`
      } else {
        if (rawDigits.length < activeCountry.minDigits) {
          toast.error(`${activeCountry.name} için numara en az ${activeCountry.minDigits} hane olmalıdır.`)
          setLoading(false)
          setRegisterInProgress(false)
          return
        }
        formattedPhone = `${selectedCountryCode}${rawDigits}`
      }
    }

    try {
      await register({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        phone: formattedPhone,
        role: regRole,
        city: regCity,
        district: regDistrict,
        companyName: regRole === 'EMPLOYER' ? regCompanyName : undefined,
        adminSecret: regRole === 'ADMIN' ? adminSecret : undefined,
      })
      useApp.getState().closeAuthModal()
      toast.success('Hesabınız oluşturuldu')
    } catch (err: any) {
      const msg = err.message || 'Kayıt yapılamadı.'
      setError(msg)
      let title = 'Kayıt Hatası'
      let friendlyMsg = msg
      if (msg.includes('telefon')) {
        if (msg.includes('kayıtlı')) {
          title = 'Telefon Zaten Kayıtlı'
          friendlyMsg = 'Bu telefon numarası başka bir hesapta kullanılıyor.'
        } else {
          title = 'Telefon Formatı Hatalı'
          friendlyMsg = 'Geçerli bir telefon numarası girin.'
        }
      } else if (msg.includes('e-posta') && msg.includes('kayıtlı')) {
        title = 'E-posta Kullanımda'
        friendlyMsg = 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.'
      } else if (msg.includes('şifre') || msg.includes('password')) {
        title = 'Şifre Hatası'
        friendlyMsg = 'Şifre en az 6 karakter olmalıdır.'
      }
      toast.error(title, { description: friendlyMsg, duration: 5000 })
    } finally {
      setLoading(false)
      setRegisterInProgress(false)
    }
  }

  const processGoogleToken = async (tokenValue: string) => {
    try {
      setLoading(true)
      const res = await loginWithGoogle(tokenValue)
      if (res?.requiresRegistration) {
        // Yeni Google kullanıcısı: henüz veritabanına kaydedilmedi!
        // Zorunlu İşçi/İşveren seçimi, bilgi doldurma ve sözleşme onayı ekranını aç.
        setGooglePendingToken(tokenValue)
        setGoogleProfile(
          res.googleProfile || {
            email: '',
            fullName: '',
          }
        )
        if (res.googleProfile?.fullName) {
          setRegFullName(res.googleProfile.fullName)
        }
        setGoogleRole(null)
        setAcceptedContracts(false)
        setAcceptedKvkk(false)
        toast.info('Kaydınızı tamamlamak için İşçi veya İşveren seçimi yapıp bilgilerinizi doldurun.')
        return
      }
      useApp.getState().closeAuthModal()
      toast.success('Google ile giriş yapıldı')
    } catch (err: any) {
      setError(err.message || 'Google ile giriş yapılamadı.')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteGoogleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!googlePendingToken) return
    setError('')

    if (!googleRole) {
      toast.error('Lütfen Çalışan (İşçi) mi yoksa İşveren (İşletme) mi olduğunuzu seçin.')
      setError('Kayıt olabilmek için İşçi veya İşveren rolünü seçmeniz zorunludur.')
      return
    }

    if (!regFullName.trim() || regFullName.trim().length < 2) {
      toast.error('Lütfen adınızı ve soyadınızı eksiksiz girin.')
      return
    }

    if (googleRole === 'EMPLOYER' && !regCompanyName.trim()) {
      toast.error('İşveren kaydı için işletme veya firma adınızı girmeniz zorunludur.')
      return
    }

    if (!regPhone.trim()) {
      toast.error('Lütfen telefon numaranızı girin.')
      return
    }

    let formattedPhone = ''
    let rawDigits = regPhone.replace(/\D/g, '')
    if (selectedCountryCode === '+90') {
      if (rawDigits.startsWith('0')) rawDigits = rawDigits.substring(1)
      if (rawDigits.length !== 10) {
        toast.error('Lütfen 10 veya 11 haneli geçerli bir telefon numarası girin.')
        return
      }
      formattedPhone = `+90${rawDigits}`
    } else {
      if (rawDigits.length < activeCountry.minDigits) {
        toast.error(`${activeCountry.name} için numara en az ${activeCountry.minDigits} hane olmalıdır.`)
        return
      }
      formattedPhone = `${selectedCountryCode}${rawDigits}`
    }

    if (!regCity.trim()) {
      toast.error('Lütfen bulunduğunuz şehri seçin.')
      return
    }

    if (!regDistrict.trim()) {
      toast.error('Lütfen bulunduğunuz ilçeyi girin.')
      return
    }

    if (!acceptedContracts || !acceptedKvkk) {
      toast.error(
        'Kayıt olabilmek için Mesafeli Satış, Üyelik, Gizlilik ve KVKK sözleşmelerini kabul etmeniz zorunludur.'
      )
      return
    }

    try {
      setLoading(true)
      await loginWithGoogle(googlePendingToken, {
        completeRegistration: true,
        role: googleRole,
        fullName: regFullName.trim(),
        phone: formattedPhone,
        city: regCity,
        district: regDistrict.trim(),
        companyName: googleRole === 'EMPLOYER' ? regCompanyName.trim() : undefined,
        acceptedContracts: true,
      })
      setGooglePendingToken(null)
      setGoogleProfile(null)
      useApp.getState().closeAuthModal()
      toast.success('Google hesabınızla kaydınız tamamlandı! Hoş geldiniz.')
    } catch (err: any) {
      const msg = err.message || 'Google kaydı tamamlanamadı.'
      setError(msg)
      toast.error('Kayıt Tamamlanamadı', { description: msg })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    try {
      if (!GOOGLE_CLIENT_ID) {
        showErrorDialog(
          'Google Girişi Yapılandırılmamış',
          'Lütfen e-posta ve şifrenizle giriş yapın veya yeni hesap oluşturun.'
        )
        return
      }

      if (!(window as any).google?.accounts) {
        await new Promise((resolve, reject) => {
          if ((window as any).google?.accounts) return resolve(null)
          const existing = document.querySelector(
            'script[src="https://accounts.google.com/gsi/client"]'
          ) as HTMLScriptElement | null
          if (existing) {
            existing.addEventListener('load', () => resolve(null))
            existing.addEventListener('error', () =>
              reject(new Error('Google bağlantısı kurulamadı'))
            )
            return
          }
          const script = document.createElement('script')
          script.src = 'https://accounts.google.com/gsi/client'
          script.async = true
          script.defer = true
          script.onload = () => resolve(null)
          script.onerror = () => reject(new Error('Google bağlantısı kurulamadı'))
          document.head.appendChild(script)
        })
      }

      const googleOAuth2 = (window as any).google?.accounts?.oauth2
      if (googleOAuth2?.initTokenClient) {
        setLoading(true)
        const tokenClient = googleOAuth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          prompt: 'select_account',
          error_callback: () => {
            setLoading(false)
          },
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error || !tokenResponse?.access_token) {
              setLoading(false)
              if (tokenResponse?.error && tokenResponse.error !== 'popup_closed_by_user') {
                setError('Google ile giriş iptal edildi veya tamamlanamadı.')
              }
              return
            }
            await processGoogleToken(tokenResponse.access_token)
          },
        })
        tokenClient.requestAccessToken({ prompt: 'select_account' })
        return
      }

      const googleAccts = (window as any).google.accounts.id
      googleAccts.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          setLoading(false)
          if (response.error || !response.credential) {
            setError('Google doğrulama bilgisi alınamadı.')
            return
          }
          await processGoogleToken(response.credential)
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      googleAccts.prompt()
    } catch (err: any) {
      setError(err.message || 'Google ile giriş başlatılamadı.')
      setLoading(false)
    }
  }

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await authApi.forgotPassword(forgotEmail)
      setForgotStep('reset')
      toast.success('Doğrulama kodu e-posta adresinize gönderildi')
    } catch (err: any) {
      const msg = err.message || 'Kod gönderilemedi.'
      showErrorDialog('İşlem Tamamlanamadı', msg)
    } finally {
      setForgotLoading(false)
    }
  }

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (forgotNewPassword.length < 6) {
      showErrorDialog('Şifre Kısa', 'Yeni şifreniz en az 6 karakter olmalıdır.')
      return
    }
    if (forgotCode.length !== 6) {
      showErrorDialog('Eksik Kod', 'Lütfen 6 haneli doğrulama kodunu girin.')
      return
    }
    setForgotLoading(true)
    try {
      await authApi.resetPassword(forgotCode, forgotNewPassword)
      setForgotStep('done')
      toast.success('Şifreniz güncellendi')
    } catch (err: any) {
      showErrorDialog('Sıfırlama Hatası', err.message || 'Sıfırlama başarısız.')
    } finally {
      setForgotLoading(false)
    }
  }

  const resetForgotState = () => {
    setForgotOpen(false)
    setForgotEmail('')
    setForgotCode('')
    setForgotNewPassword('')
    setForgotStep('email')
  }

  const handleLogoSecretClick = () => {
    const newCount = logoClickCount + 1
    setLogoClickCount(newCount)
    if (newCount === 5) {
      setTab('register')
      setRegRole('ADMIN')
      toast.success('Yönetici kayıt seçeneği aktif edildi')
    }
  }

  const activeLegalContract =
    LEGAL_CONTRACTS.find((c) => c.id === activeContractModal) || LEGAL_CONTRACTS[0]

  const renderLegalConsentBlock = () => (
    <div className="p-3 rounded-md bg-[#F6F5F2] dark:bg-[#181C1A] border border-[#D8D5CC] dark:border-[#2B322E] space-y-2.5">
      <div className="flex items-center justify-between border-b border-[#E2E0D8] dark:border-[#252B28] pb-2">
        <div className="flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#141615] dark:text-[#F2F1ED]">
            YASAL SÖZLEŞMELER VE GÜVENLİK ONAYI
          </span>
        </div>
        <button
          type="button"
          onClick={() => setActiveContractModal('mesafeli-satis')}
          className="font-mono text-[10px] font-bold text-[#0D6847] dark:text-[#5CD6A5] hover:underline cursor-pointer"
        >
          Tümünü Oku
        </button>
      </div>

      {/* Checkbox 1: Mesafeli Satış & Üyelik Sözleşmesi */}
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <button
          type="button"
          role="checkbox"
          aria-checked={acceptedContracts}
          onClick={() => setAcceptedContracts(!acceptedContracts)}
          className={`mt-0.5 w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
            acceptedContracts
              ? 'bg-[#0D6847] border-[#0D6847] text-white'
              : 'bg-white dark:bg-[#141716] border-[#B8B4A9] dark:border-[#3A433E]'
          }`}
        >
          {acceptedContracts && <Check className="w-3 h-3 stroke-[3]" />}
        </button>
        <span className="text-[11px] leading-relaxed text-[#424744] dark:text-[#B8BFBC]">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setActiveContractModal('mesafeli-satis')
            }}
            className="font-bold text-[#0D6847] dark:text-[#5CD6A5] underline underline-offset-2 hover: opacity-90 cursor-pointer"
          >
            Mesafeli Hizmet Satış ve Emanet Ödeme Sözleşmesi
          </button>{' '}
          ile{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setActiveContractModal('kullanici')
            }}
            className="font-bold text-[#0D6847] dark:text-[#5CD6A5] underline underline-offset-2 hover:opacity-90 cursor-pointer"
          >
            Kullanıcı, İşçi ve İşveren Üyelik Sözleşmesi
          </button>
          &apos;ni okudum, anladım ve kabul ediyorum. *
        </span>
      </label>

      {/* Checkbox 2: KVKK & Gizlilik Politikası */}
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <button
          type="button"
          role="checkbox"
          aria-checked={acceptedKvkk}
          onClick={() => setAcceptedKvkk(!acceptedKvkk)}
          className={`mt-0.5 w-4 h-4 rounded-xs border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
            acceptedKvkk
              ? 'bg-[#0D6847] border-[#0D6847] text-white'
              : 'bg-white dark:bg-[#141716] border-[#B8B4A9] dark:border-[#3A433E]'
          }`}
        >
          {acceptedKvkk && <Check className="w-3 h-3 stroke-[3]" />}
        </button>
        <span className="text-[11px] leading-relaxed text-[#424744] dark:text-[#B8BFBC]">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setActiveContractModal('kvkk')
            }}
            className="font-bold text-[#0D6847] dark:text-[#5CD6A5] underline underline-offset-2 hover:opacity-90 cursor-pointer"
          >
            6698 Sayılı KVKK Aydınlatma Metni ve Açık Rıza Beyanı
          </button>{' '}
          ile{' '}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              setActiveContractModal('gizlilik')
            }}
            className="font-bold text-[#0D6847] dark:text-[#5CD6A5] underline underline-offset-2 hover:opacity-90 cursor-pointer"
          >
            Gizlilik ve Saha Güvenlik Politikası
          </button>
          &apos;nı okudum ve onaylıyorum. *
        </span>
      </label>
    </div>
  )

  const formContent = (
    <div className="w-full bg-white dark:bg-[#141716] text-[#141615] dark:text-[#F2F1ED]">
      {/* Üst Başlık & Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
        <button
          type="button"
          onClick={handleLogoSecretClick}
          className="inline-flex items-center text-left cursor-pointer"
          aria-label="Günübirlik"
        >
          <Logo size="sm" variant="full" />
        </button>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#5C615E] dark:text-[#949B97] font-semibold pr-6">
          {googlePendingToken
            ? 'GOOGLE KAYIT TAMAMLAMA'
            : tab === 'login'
              ? 'OTURUM AÇ'
              : `KAYIT • ADIM ${regStep}/3`}
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Sekme Seçici (Google Onboarding aktif değilse göster) */}
        {!googlePendingToken && (
          <div className="grid grid-cols-2 gap-1 p-1 rounded-md bg-[#F0EFEA] dark:bg-[#1C211F] border border-[#D8D5CC] dark:border-[#2A302D]">
            <button
              type="button"
              onClick={() => {
                setTab('login')
                setError('')
              }}
              className={`py-2 rounded text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-white dark:bg-[#141716] text-[#141615] dark:text-white shadow-2xs'
                  : 'text-[#5C615E] dark:text-[#949B97] hover:text-[#141615] dark:hover:text-white'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register')
                setRegStep(1)
                setError('')
              }}
              className={`py-2 rounded text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'register'
                  ? 'bg-white dark:bg-[#141716] text-[#141615] dark:text-white shadow-2xs'
                  : 'text-[#5C615E] dark:text-[#949B97] hover:text-[#141615] dark:hover:text-white'
              }`}
            >
              Yeni Hesap Aç
            </button>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="py-2.5 px-3 rounded-md border-[#EFC7BD] bg-[#FBEEE9] text-[#B43B21] dark:bg-[#2E1611] dark:border-[#5C281E] dark:text-[#F5937E]">
            <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {/* ============= GOOGLE YENİ KULLANICI ZORUNLU KAYIT TAMAMLAMA FORMU ============= */}
        {googlePendingToken && (
          <form onSubmit={handleCompleteGoogleRegistration} className="space-y-4">
            <div className="p-3.5 rounded-md bg-[#EAF3EE]/80 dark:bg-[#162921]/50 border border-[#0D6847]/30 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
                  GOOGLE HESABI DOĞRULANDI • KAYIT TAMAMLAMA ZORUNLU
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-[#141716] text-[#141615] dark:text-[#F2F1ED] border border-[#D8D5CC] dark:border-[#2B322E]">
                  {googleProfile?.email}
                </span>
              </div>
              <p className="text-xs text-[#2B302E] dark:text-[#DCE0DD] leading-relaxed">
                Kaydınızın geçerli sayılması için <strong>İşçi (Çalışan)</strong> mi yoksa{' '}
                <strong>İşveren (İşletme)</strong> mi olduğunuzu seçmeniz, iletişim bilgilerinizi doldurmanız ve sözleşmeleri onaylamanız zorunludur.
              </p>
            </div>

            {/* 1. ZORUNLU ROL SEÇİMİ */}
            <div className="space-y-2">
              <Label className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#5C615E] dark:text-[#949B97]">
                1. HESAP TÜRÜNÜZÜ SEÇİN (ZORUNLU) *
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGoogleRole('WORKER')}
                  className={`p-3 rounded-md border text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                    googleRole === 'WORKER'
                      ? 'border-[#0D6847] bg-[#EAF3EE]/70 dark:bg-[#162921]/60 ring-1 ring-[#0D6847]'
                      : 'border-[#D8D5CC] dark:border-[#2B322E] hover:bg-[#F6F5F2] dark:hover:bg-[#1C211F]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5] flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#141615] dark:text-white">
                        Çalışan / İşçi
                      </div>
                      <div className="text-[11px] text-[#5C615E] dark:text-[#949B97] mt-0.5">
                        Günlük işlere başvurup yevmiye kazanacağım.
                      </div>
                    </div>
                  </div>
                  {googleRole === 'WORKER' && (
                    <CheckCircle2 className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5] shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setGoogleRole('EMPLOYER')}
                  className={`p-3 rounded-md border text-left flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                    googleRole === 'EMPLOYER'
                      ? 'border-[#0D6847] bg-[#EAF3EE]/70 dark:bg-[#162921]/60 ring-1 ring-[#0D6847]'
                      : 'border-[#D8D5CC] dark:border-[#2B322E] hover:bg-[#F6F5F2] dark:hover:bg-[#1C211F]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded bg-[#F0EFEA] dark:bg-[#1E2421] text-[#141615] dark:text-[#F2F1ED] flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#141615] dark:text-white">
                        İşveren / İşletme
                      </div>
                      <div className="text-[11px] text-[#5C615E] dark:text-[#949B97] mt-0.5">
                        İlan açıp günlük personel çalıştıracağım.
                      </div>
                    </div>
                  </div>
                  {googleRole === 'EMPLOYER' && (
                    <CheckCircle2 className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5] shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* 2. KİMLİK VE İŞLETME BİLGİLERİ */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                  Ad Soyad *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                  <Input
                    placeholder="Adınız ve Soyadınız"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="pl-9 h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                    required
                  />
                </div>
              </div>

              {googleRole === 'EMPLOYER' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                    İşletme veya Firma Adı *
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                    <Input
                      placeholder="Örn: Kadıköy Lojistik / Merkez Kafe"
                      value={regCompanyName}
                      onChange={(e) => setRegCompanyName(e.target.value)}
                      className="pl-9 h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Telefon Numarası */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                    Telefon Numarası *
                  </Label>
                  <span className="font-mono text-[10px] text-[#5C615E] dark:text-[#949B97]">
                    {regPhone.replace(/\D/g, '').length}/{activeCountry.maxDigits} hane
                  </span>
                </div>
                <div className="flex gap-1.5 items-center">
                  <div className="w-[100px] shrink-0">
                    <Select
                      value={selectedCountryCode}
                      onValueChange={(val) => {
                        setSelectedCountryCode(val)
                        setRegPhone('')
                      }}
                    >
                      <SelectTrigger className="h-10 text-xs border-[#D8D5CC] dark:border-[#2B322E] px-2.5 bg-[#F6F5F2] dark:bg-[#181C1A]">
                        <SelectValue>
                          <span className="font-mono text-xs font-semibold">
                            {activeCountry.flag} {activeCountry.code}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-60 bg-white dark:bg-[#141716] border-[#D8D5CC] dark:border-[#2B322E]">
                        {COUNTRY_OPTIONS.map((c) => (
                          <SelectItem key={c.code} value={c.code} className="text-xs">
                            <span className="font-mono mr-1.5">{c.code}</span>
                            <span>{c.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder={activeCountry.placeholder}
                      value={regPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="pl-9 h-10 text-sm font-mono bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Şehir ve İlçe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                    Şehir *
                  </Label>
                  <Select value={regCity} onValueChange={setRegCity}>
                    <SelectTrigger className="h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-[#141716] border-[#D8D5CC] dark:border-[#2B322E]">
                      {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Trabzon', 'Kocaeli', 'Gaziantep'].map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                    İlçe *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                    <Input
                      placeholder="Örn: Kadıköy"
                      value={regDistrict}
                      onChange={(e) => setRegDistrict(e.target.value)}
                      className="pl-9 h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. ZORUNLU SÖZLEŞMELER VE KVKK CHECKBOX */}
            {renderLegalConsentBlock()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setGooglePendingToken(null)
                  setGoogleProfile(null)
                  setGoogleRole(null)
                  setError('')
                }}
                className="h-10 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] text-xs font-semibold text-[#141615] dark:text-white flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Kaydı İptal Et</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <span>Kaydı Tamamla ve Başla</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ============= GİRİŞ FORMU ============= */}
        {!googlePendingToken && tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#141615] dark:text-white">
                Hesabınıza giriş yapın
              </h2>
              <p className="text-xs text-[#5C615E] dark:text-[#949B97]">
                İlanlara başvurmak, mesajlaşmak veya vardiya yönetmek için oturum açın.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                E-posta Adresi
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@eposta.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="pl-9 h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                  Şifre
                </Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-medium text-[#0D6847] dark:text-[#5CD6A5] hover:underline cursor-pointer"
                >
                  Şifremi unuttum
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="pl-9 pr-9 h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F8C] hover:text-[#141615] dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              disabled={loading || loginInProgress}
            >
              {loading || loginInProgress ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-[#E2E0D8] dark:border-[#252B28]" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-white dark:bg-[#141716] px-2.5 text-[#8A8F8C] font-mono">
                  VEYA
                </span>
              </div>
            </div>

            <button
              type="button"
              className="w-full h-10 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] hover:bg-[#F6F5F2] dark:hover:bg-[#222825] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google Hesabı ile Devam Et</span>
            </button>
          </form>
        )}

        {/* ============= KAYIT FORMU (3 ADIMLI) ============= */}
        {!googlePendingToken && tab === 'register' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (regStep < 3) {
                handleNextStep()
              } else {
                handleRegister(e)
              }
            }}
            className="space-y-4"
          >
            {/* Adım Çubuğu */}
            <div className="p-3 rounded-md bg-[#F6F5F2] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#141615] dark:text-white">
                  {regStep === 1 && '1. Hesap Türü Seçimi'}
                  {regStep === 2 && '2. Kimlik ve İletişim'}
                  {regStep === 3 && '3. Telefon, Şehir ve Şifre'}
                </span>
                <span className="font-mono text-[11px] text-[#0D6847] dark:text-[#5CD6A5] font-semibold">
                  {regStep} / 3
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 rounded-xs transition-colors ${
                      regStep >= s
                        ? 'bg-[#0D6847] dark:bg-[#5CD6A5]'
                        : 'bg-[#D8D5CC] dark:bg-[#2A302D]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* ADIM 1: HESAP TÜRÜ */}
            {regStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('WORKER')}
                    className={`w-full p-3.5 rounded-md border text-left flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                      regRole === 'WORKER'
                        ? 'border-[#0D6847] bg-[#EAF3EE]/60 dark:bg-[#162921]/50'
                        : 'border-[#D8D5CC] dark:border-[#2B322E] hover:bg-[#F6F5F2] dark:hover:bg-[#1C211F]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-[#EAF3EE] dark:bg-[#162921] text-[#0D6847] dark:text-[#5CD6A5] flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#141615] dark:text-white">
                          Çalışan / İş Arayan
                        </div>
                        <div className="text-xs text-[#5C615E] dark:text-[#949B97] mt-0.5">
                          Günlük vardiyalara başvurun, mesai bitiminde net yevmiye alın.
                        </div>
                      </div>
                    </div>
                    {regRole === 'WORKER' && (
                      <CheckCircle2 className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5] shrink-0 mt-1" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegRole('EMPLOYER')}
                    className={`w-full p-3.5 rounded-md border text-left flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                      regRole === 'EMPLOYER'
                        ? 'border-[#0D6847] bg-[#EAF3EE]/60 dark:bg-[#162921]/50'
                        : 'border-[#D8D5CC] dark:border-[#2B322E] hover:bg-[#F6F5F2] dark:hover:bg-[#1C211F]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-[#F0EFEA] dark:bg-[#1E2421] text-[#141615] dark:text-[#F2F1ED] flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#141615] dark:text-white">
                          İşveren / İşletme
                        </div>
                        <div className="text-xs text-[#5C615E] dark:text-[#949B97] mt-0.5">
                          Restoran, şantiye, depo veya temizlik için aynı gün eleman bulun.
                        </div>
                      </div>
                    </div>
                    {regRole === 'EMPLOYER' && (
                      <CheckCircle2 className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5] shrink-0 mt-1" />
                    )}
                  </button>

                  {logoClickCount >= 5 && (
                    <button
                      type="button"
                      onClick={() => setRegRole('ADMIN')}
                      className={`w-full p-3 rounded-md border text-left flex items-center justify-between gap-3 cursor-pointer ${
                        regRole === 'ADMIN'
                          ? 'border-[#141615] dark:border-white bg-[#F0EFEA] dark:bg-[#1E2421]'
                          : 'border-[#D8D5CC] dark:border-[#2B322E]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Shield className="w-4 h-4 text-[#141615] dark:text-white" />
                        <span className="text-xs font-bold">Sistem Yöneticisi (Admin)</span>
                      </div>
                      {regRole === 'ADMIN' && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Devam Et</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#E2E0D8] dark:border-[#252B28]" />
                  </div>
                  <div className="relative flex justify-center text-[11px]">
                    <span className="bg-white dark:bg-[#141716] px-2.5 text-[#8A8F8C] font-mono">
                      VEYA
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full h-10 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] hover:bg-[#F6F5F2] dark:hover:bg-[#222825] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Google ile Hızlı Kayıt Ol</span>
                </button>
              </div>
            )}

            {/* ADIM 2: KİMLİK & E-POSTA */}
            {regStep === 2 && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-fullname" className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                    Ad Soyad
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                    <Input
                      id="reg-fullname"
                      placeholder="Adınız ve Soyadınız"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      className="pl-9 h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-email" className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                    E-posta Adresi
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="ornek@eposta.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="pl-9 h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                      required
                    />
                  </div>
                </div>

                {regRole === 'EMPLOYER' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-company" className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                      İşletme veya Firma Adı
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                      <Input
                        id="reg-company"
                        placeholder="Örn: Kadıköy Lojistik / Merkez Kafe"
                        value={regCompanyName}
                        onChange={(e) => setRegCompanyName(e.target.value)}
                        className="pl-9 h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                        required
                      />
                    </div>
                  </div>
                )}

                {regRole === 'ADMIN' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-secret" className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                      Yönetici Kayıt Anahtarı
                    </Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                      <Input
                        id="admin-secret"
                        type={showAdminSecret ? 'text' : 'password'}
                        placeholder="ADMIN_REGISTER_SECRET"
                        value={adminSecret}
                        onChange={(e) => setAdminSecret(e.target.value)}
                        className="pl-9 pr-9 h-10 text-sm font-mono bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminSecret(!showAdminSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F8C]"
                      >
                        {showAdminSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="h-10 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] text-xs font-semibold text-[#141615] dark:text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Geri</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Sonraki Adım</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ADIM 3: TELEFON, ŞEHİR & ŞİFRE */}
            {regStep === 3 && (
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reg-phone" className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                      Telefon Numarası
                    </Label>
                    <span className="font-mono text-[10px] text-[#5C615E] dark:text-[#949B97]">
                      {regPhone.replace(/\D/g, '').length}/{activeCountry.maxDigits} hane
                    </span>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <div className="w-[100px] shrink-0">
                      <Select
                        value={selectedCountryCode}
                        onValueChange={(val) => {
                          setSelectedCountryCode(val)
                          setRegPhone('')
                        }}
                      >
                        <SelectTrigger className="h-10 text-xs border-[#D8D5CC] dark:border-[#2B322E] px-2.5 bg-[#F6F5F2] dark:bg-[#181C1A]">
                          <SelectValue>
                            <span className="font-mono text-xs font-semibold">
                              {activeCountry.flag} {activeCountry.code}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-60 bg-white dark:bg-[#141716] border-[#D8D5CC] dark:border-[#2B322E]">
                          {COUNTRY_OPTIONS.map((c) => (
                            <SelectItem key={c.code} value={c.code} className="text-xs">
                              <span className="font-mono mr-1.5">{c.code}</span>
                              <span>{c.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                      <Input
                        id="reg-phone"
                        type="tel"
                        inputMode="numeric"
                        placeholder={activeCountry.placeholder}
                        value={regPhone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="pl-9 h-10 text-sm font-mono bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                      Şehir
                    </Label>
                    <Select value={regCity} onValueChange={setRegCity}>
                      <SelectTrigger className="h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-[#141716] border-[#D8D5CC] dark:border-[#2B322E]">
                        {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Trabzon', 'Kocaeli', 'Gaziantep'].map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-district" className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                      İlçe
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                      <Input
                        id="reg-district"
                        placeholder="Örn: Kadıköy"
                        value={regDistrict}
                        onChange={(e) => setRegDistrict(e.target.value)}
                        className="pl-9 h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg-password" className="text-xs font-semibold text-[#141615] dark:text-[#DCE0DD]">
                    Şifre Belirleyin
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                    <Input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="En az 6 karakter"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="pl-9 pr-9 h-10 text-sm bg-white dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F8C]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ZORUNLU SÖZLEŞMELER VE KVKK CHECKBOX */}
                {renderLegalConsentBlock()}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="h-10 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] text-xs font-semibold text-[#141615] dark:text-white flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Geri</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading || registerInProgress}
                    className="h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {loading || registerInProgress ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Kaydediliyor...</span>
                      </>
                    ) : (
                      <>
                        <span>Hesabı Oluştur</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* Alt Yasal Sözleşme Kısayol Çubuğu */}
        <div className="pt-3 border-t border-[#E2E0D8] dark:border-[#252B28] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5C615E] dark:text-[#949B97]">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <button
              type="button"
              onClick={() => setActiveContractModal('mesafeli-satis')}
              className="hover:text-[#0D6847] dark:hover:text-[#5CD6A5] underline underline-offset-2 cursor-pointer"
            >
              Mesafeli Satış Sözleşmesi
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveContractModal('kullanici')}
              className="hover:text-[#0D6847] dark:hover:text-[#5CD6A5] underline underline-offset-2 cursor-pointer"
            >
              Üyelik Sözleşmesi
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveContractModal('kvkk')}
              className="hover:text-[#0D6847] dark:hover:text-[#5CD6A5] underline underline-offset-2 cursor-pointer"
            >
              KVKK &amp; Gizlilik
            </button>
          </div>
          <a
            href="/sozlesmeler"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[#0D6847] dark:text-[#5CD6A5] hover:underline"
          >
            <span>Yasal Merkez</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* ============= YASAL SÖZLEŞMELER VE KVKK OKUMA MODALI ============= */}
      <Dialog
        open={Boolean(activeContractModal)}
        onOpenChange={(open) => {
          if (!open) setActiveContractModal(null)
        }}
      >
        <DialogContent className="w-[calc(100vw-20px)] max-w-2xl p-0 overflow-hidden rounded-md bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28] shadow-xl">
          {/* Üst Kayıt Defteri Şeridi */}
          <div className="px-5 py-3 bg-[#EFECE6] dark:bg-[#1A1E1C] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between pr-10">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#0D6847] dark:text-[#5CD6A5]">
                {activeLegalContract.code} • HUKUKİ BELGE VE SÖZLEŞME METNİ
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#5C615E] dark:text-[#949B97]">
              GÜNCEL: {activeLegalContract.updatedAt}
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {/* Sözleşme Sekmeleri */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-md bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28]">
              {LEGAL_CONTRACTS.map((c) => {
                const isSelected = c.id === activeLegalContract.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveContractModal(c.id)}
                    className={`px-2 py-1.5 rounded text-[11px] font-semibold transition-colors text-center truncate cursor-pointer ${
                      isSelected
                        ? 'bg-[#0D6847] text-white'
                        : 'text-[#5C615E] dark:text-[#949B97] hover:text-[#141615] dark:hover:text-white'
                    }`}
                  >
                    {c.shortTitle}
                  </button>
                )
              })}
            </div>

            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-sm sm:text-base font-extrabold text-[#141615] dark:text-white">
                {activeLegalContract.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                {activeLegalContract.summary}
              </DialogDescription>
            </DialogHeader>

            {/* Maddeler (Kaydırılabilir Alan) */}
            <div className="max-h-[48vh] overflow-y-auto pr-1 space-y-2.5">
              {activeLegalContract.sections.map((sec, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-md bg-[#F6F5F2] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] space-y-1.5"
                >
                  <div className="text-xs font-extrabold text-[#141615] dark:text-[#F2F1ED]">
                    {sec.heading}
                  </div>
                  <p className="text-xs text-[#424744] dark:text-[#B8BFBC] leading-relaxed">
                    {sec.body}
                  </p>
                  {sec.bullets && sec.bullets.length > 0 && (
                    <ul className="space-y-1 pl-4 list-disc text-xs text-[#424744] dark:text-[#B8BFBC] leading-relaxed">
                      {sec.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Alt Onay Butonları */}
            <div className="pt-3 border-t border-[#E2E0D8] dark:border-[#252B28] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <a
                href={activeLegalContract.path}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#5C615E] dark:text-[#949B97] hover:text-[#141615] dark:hover:text-white"
              >
                <span>Tam Sayfada Görüntüle ({activeLegalContract.path})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveContractModal(null)}
                  className="h-9 px-3.5 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAcceptedContracts(true)
                    setAcceptedKvkk(true)
                    setActiveContractModal(null)
                    toast.success('Sözleşmeler ve KVKK metinleri onaylandı.')
                  }}
                  className="h-9 px-4 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Okudum, Tümünü Kabul Ediyorum</span>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============= HATA DIALOGU (MİMARİ KAYIT DEFTERİ) ============= */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-md p-0 overflow-hidden rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28]">
          <div className="px-5 py-3 bg-[#EFECE6] dark:bg-[#1A1E1C] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between pr-10">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C84B31] dark:text-[#FF7A5C]">
              00 / SİSTEM UYARISI
            </span>
            <span className="font-mono text-[10px] text-[#5C615E] dark:text-[#949B97]">AUTH-ERR</span>
          </div>
          <div className="p-5 space-y-4">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-base font-extrabold text-[#141615] dark:text-[#F2F1ED]">
                {errorDialog.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                {errorDialog.message}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end pt-2 border-t border-[#E2E0D8] dark:border-[#252B28]">
              <button
                type="button"
                className="h-9 px-4 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold transition-colors cursor-pointer"
                onClick={() => setErrorDialog({ ...errorDialog, open: false })}
              >
                Anladım
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============= 2FA DIALOGU (MİMARİ KAYIT DEFTERİ) ============= */}
      <Dialog open={showTwoFactor} onOpenChange={(open) => { if (!open) closeTwoFactor() }}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-md p-0 overflow-hidden rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28]">
          <div className="px-5 py-3 bg-[#EFECE6] dark:bg-[#1A1E1C] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between pr-10">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#0D6847] dark:text-[#5CD6A5]">
              01 / İKİ AŞAMALI GÜVENLİK (2FA)
            </span>
            <span className="font-mono text-[10px] text-[#5C615E] dark:text-[#949B97]">TOTP-6</span>
          </div>

          <div className="p-5 space-y-4">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-base font-extrabold flex items-center gap-2 text-[#141615] dark:text-white">
                <Smartphone className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5]" />
                Doğrulama Kodu Girin
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97]">
                Authenticator uygulamanızda üretilen 6 haneli tek kullanımlık güvenlik kodunu girin.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleTwoFactorLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#5C615E] dark:text-[#949B97]">
                  6 HANELİ GÜVENLİK KODU
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="h-12 text-center text-xl tracking-[0.4em] font-mono bg-[#F6F5F2] dark:bg-[#0C0E0D] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  className="h-10 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-[#F6F5F2] dark:bg-[#181C1A] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] cursor-pointer"
                  onClick={closeTwoFactor}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  disabled={twoFactorLoading || twoFactorCode.length !== 6}
                >
                  {twoFactorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Oturumu Doğrula'}
                </button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============= ŞİFRE SIFIRLAMA DIALOGU (MİMARİ KAYIT DEFTERİ) ============= */}
      <Dialog
        open={forgotOpen}
        onOpenChange={(open) => {
          setForgotOpen(open)
          if (!open) resetForgotState()
        }}
      >
        <DialogContent className="w-[calc(100vw-24px)] max-w-md p-0 overflow-hidden rounded-md bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28] shadow-xl">
          {/* Üst Kayıt Defteri Şeridi */}
          <div className="px-5 py-3.5 bg-[#EFECE6] dark:bg-[#1A1E1C] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between pr-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0D6847] dark:bg-[#5CD6A5]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#0D6847] dark:text-[#5CD6A5]">
                01 / GÜVENLİK & ŞİFRE KURTARMA
              </span>
            </div>
            <span className="font-mono text-[10px] font-semibold text-[#5C615E] dark:text-[#949B97]">
              {forgotStep === 'email' && 'ADIM 1/2'}
              {forgotStep === 'reset' && 'ADIM 2/2'}
              {forgotStep === 'done' && 'ONAYLANDI'}
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            {/* Başlık & Açıklama */}
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-base sm:text-lg font-extrabold tracking-tight text-[#141615] dark:text-white">
                {forgotStep === 'email' && 'Hesap Şifrenizi Sıfırlayın'}
                {forgotStep === 'reset' && 'Güvenlik Kodu & Yeni Şifre'}
                {forgotStep === 'done' && 'Şifreniz Başarıyla Yenilendi'}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                {forgotStep === 'email' &&
                  'Kayıtlı e-posta adresinizi girin; kimliğinizi doğrulamak için 6 haneli tek kullanımlık güvenlik kodu göndereceğiz.'}
                {forgotStep === 'reset' &&
                  'E-posta adresinize iletilen 6 haneli doğrulama kodunu ve yeni hesap şifrenizi tanımlayın.'}
                {forgotStep === 'done' &&
                  'Hesap güvenlik anahtarınız güncellendi. Yeni şifrenizle hemen oturum açabilirsiniz.'}
              </DialogDescription>
            </DialogHeader>

            {/* Adım İlerleme Çubuğu */}
            <div className="p-2.5 rounded-md bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] space-y-2">
              <div className="flex items-center justify-between font-mono text-[10px]">
                <span className="font-semibold text-[#141615] dark:text-[#F2F1ED]">
                  {forgotStep === 'email' && '01 • E-POSTA DOĞRULAMA'}
                  {forgotStep === 'reset' && '02 • OTP KODU & YENİ ŞİFRE'}
                  {forgotStep === 'done' && '03 • İŞLEM TAMAMLANDI'}
                </span>
                <span className="text-[#0D6847] dark:text-[#5CD6A5] font-bold">
                  {forgotStep === 'email' ? '50%' : '100%'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="h-1 rounded-xs bg-[#0D6847] dark:bg-[#5CD6A5]" />
                <div
                  className={`h-1 rounded-xs transition-colors ${
                    forgotStep === 'reset' || forgotStep === 'done'
                      ? 'bg-[#0D6847] dark:bg-[#5CD6A5]'
                      : 'bg-[#D8D5CC] dark:bg-[#2A302D]'
                  }`}
                />
              </div>
            </div>

            {/* ADIM 1: E-POSTA GİRİŞİ */}
            {forgotStep === 'email' && (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#5C615E] dark:text-[#949B97]">
                    KAYITLI E-POSTA ADRESİNİZ
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                    <Input
                      type="email"
                      placeholder="ornek@eposta.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-9 h-10 text-sm bg-[#F6F5F2] dark:bg-[#0C0E0D] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="p-3 rounded-md bg-[#F6F5F2] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-[#0D6847] dark:text-[#5CD6A5] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#5C615E] dark:text-[#949B97] leading-relaxed">
                    Doğrulama kodu gelen kutunuza 10–30 saniye içinde ulaşır. Göremezseniz Spam/Gereksiz klasörünü kontrol edin.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={resetForgotState}
                    className="h-10 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] hover:bg-[#F6F5F2] dark:hover:bg-[#222825] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gönderiliyor...</span>
                      </>
                    ) : (
                      <>
                        <span>Kod Gönder</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ADIM 2: KOD & YENİ ŞİFRE */}
            {forgotStep === 'reset' && (
              <form onSubmit={handleForgotReset} className="space-y-4">
                <div className="p-2.5 rounded-md bg-[#0D6847]/10 dark:bg-[#0D6847]/20 border border-[#0D6847]/30 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5] font-bold">
                      ALICI E-POSTA ADRESİ
                    </span>
                    <span className="block text-xs font-semibold text-[#141615] dark:text-white truncate">
                      {forgotEmail}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForgotStep('email')}
                    className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] text-[#141615] dark:text-[#F2F1ED] hover:border-[#0D6847] shrink-0 cursor-pointer"
                  >
                    Değiştir
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#5C615E] dark:text-[#949B97]">
                      6 HANELİ DOĞRULAMA KODU
                    </Label>
                    <span className="font-mono text-[10px] text-[#0D6847] dark:text-[#5CD6A5]">
                      {forgotCode.length}/6 Hane
                    </span>
                  </div>
                  <Input
                    inputMode="numeric"
                    placeholder="000000"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-11 text-center font-mono text-lg tracking-[0.4em] bg-[#F6F5F2] dark:bg-[#0C0E0D] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-mono text-[10px] uppercase tracking-wider font-bold text-[#5C615E] dark:text-[#949B97]">
                    YENİ HESAP ŞİFRESİ
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F8C]" />
                    <Input
                      type={showForgotPassword ? 'text' : 'password'}
                      placeholder="En az 6 karakter"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="pl-9 pr-9 h-10 text-sm bg-[#F6F5F2] dark:bg-[#0C0E0D] border-[#D8D5CC] dark:border-[#2B322E] rounded-md"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(!showForgotPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F8C] hover:text-[#141615] dark:hover:text-white"
                    >
                      {showForgotPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleForgotRequest}
                    disabled={forgotLoading}
                    className="h-10 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] hover:bg-[#F6F5F2] dark:hover:bg-[#222825] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] cursor-pointer"
                  >
                    Kodu Tekrar Gönder
                  </button>
                  <button
                    type="submit"
                    className="h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Güncelleniyor...</span>
                      </>
                    ) : (
                      <>
                        <span>Şifreyi Güncelle</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ADIM 3: TAMAMLANDI */}
            {forgotStep === 'done' && (
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-md bg-[#0D6847]/10 dark:bg-[#0D6847]/20 border border-[#0D6847]/30 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-md bg-[#0D6847] text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#141615] dark:text-white">
                      Şifre Güncelleme Kaydı Tamamlandı
                    </div>
                    <p className="text-[11px] text-[#5C615E] dark:text-[#949B97] mt-0.5 leading-relaxed">
                      <strong>{forgotEmail}</strong> hesabınız için yeni şifreniz aktif edildi.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  onClick={() => {
                    if (forgotEmail) setLoginEmail(forgotEmail)
                    resetForgotState()
                  }}
                >
                  <span>Giriş Ekranına Dön</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  if (isModal) {
    return formContent
  }

  return (
    <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#0C0E0D] flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-[#D8D5CC] dark:border-[#262C29] rounded-lg overflow-hidden shadow-sm">
        {formContent}
      </div>
    </div>
  )
}
