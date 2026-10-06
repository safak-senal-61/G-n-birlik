'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { authApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Loader2, Briefcase, User, Mail, Phone, Lock, MapPin, Building2,
  Eye, EyeOff, CheckCircle2, Sparkles, TrendingUp, Users, ArrowRight,
  ShieldCheck, Shield, Clock, Wallet, Smartphone,
  Share2, QrCode, Copy, Check, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import Logo from '@/components/shared/logo'
import { WhatsAppIcon, TelegramIcon, TwitterXIcon } from '@/components/shared/social-icons'

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
  { code: '+90', name: 'Türkiye', flag: '🇹🇷', minDigits: 10, maxDigits: 11, placeholder: '05XX XXX XX XX' },
  { code: '+994', name: 'Azerbaycan', flag: '🇦🇿', minDigits: 9, maxDigits: 9, placeholder: '50 XXX XX XX' },
  { code: '+49', name: 'Almanya', flag: '🇩🇪', minDigits: 10, maxDigits: 11, placeholder: '151 XXXX XXXX' },
  { code: '+1', name: 'ABD / Kanada', flag: '🇺🇸', minDigits: 10, maxDigits: 10, placeholder: '555 123 4567' },
  { code: '+44', name: 'Birleşik Krallık', flag: '🇬🇧', minDigits: 10, maxDigits: 10, placeholder: '7911 123456' },
  { code: '+33', name: 'Fransa', flag: '🇫🇷', minDigits: 9, maxDigits: 9, placeholder: '6 12 34 56 78' },
  { code: '+31', name: 'Hollanda', flag: '🇳🇱', minDigits: 9, maxDigits: 9, placeholder: '6 12345678' },
  { code: '+7', name: 'Rusya / Kazakistan', flag: '🇷🇺', minDigits: 10, maxDigits: 10, placeholder: '912 345 67 89' },
  { code: '+998', name: 'Özbekistan', flag: '🇺🇿', minDigits: 9, maxDigits: 9, placeholder: '90 123 45 67' },
  { code: '+993', name: 'Türkmenistan', flag: '🇹🇲', minDigits: 8, maxDigits: 8, placeholder: '65 12 34 56' },
  { code: '+996', name: 'Kırgızistan', flag: '🇰🇬', minDigits: 9, maxDigits: 9, placeholder: '555 12 34 56' },
  { code: '+32', name: 'Belçika', flag: '🇧🇪', minDigits: 9, maxDigits: 9, placeholder: '470 12 34 56' },
  { code: '+43', name: 'Avusturya', flag: '🇦🇹', minDigits: 10, maxDigits: 10, placeholder: '664 1234567' },
  { code: '+41', name: 'İsviçre', flag: '🇨🇭', minDigits: 9, maxDigits: 9, placeholder: '78 123 45 67' },
]

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''

export default function AuthScreen() {
  const { login, register, loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showAdminSecret, setShowAdminSecret] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Error dialog state (tüm hatalar için şık modal)
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

  // Aktif ülke yapılandırması
  const activeCountry = COUNTRY_OPTIONS.find((c) => c.code === selectedCountryCode) || COUNTRY_OPTIONS[0]

  // Ülkeye göre sınırlandırılmış ve formatlanmış telefon girişi
  const handlePhoneChange = (val: string) => {
    let digits = val.replace(/\D/g, '')

    // Ülke hane sınırına göre kes
    if (digits.length > activeCountry.maxDigits) {
      digits = digits.slice(0, activeCountry.maxDigits)
    }

    let formatted = digits
    if (activeCountry.code === '+90') {
      // Türkiye: 0 ile başlarsa 11 hane (05XX XXX XX XX), 5 ile başlarsa 10 hane (5XX XXX XX XX)
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
      // Diğer ülkeler için genel bloklama
      if (digits.length > 3 && digits.length <= 6) {
        formatted = `${digits.slice(0, 3)} ${digits.slice(3)}`
      } else if (digits.length > 6) {
        formatted = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
      }
    }

    setRegPhone(formatted)
  }

  // Seviyeli kayıt sihirbazı adım geçişleri
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
        toast.error('Lütfen şirket / işletme adınızı girin.')
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
  const [forgotStep, setForgotStep] = useState<'email' | 'reset' | 'done'>('email')
  const [forgotLoading, setForgotLoading] = useState(false)
  // Şifre sıfırlama akışında artık preview göstermiyoruz (gerçek e-posta gönderiliyor)

  // 2FA login state
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)

  useEffect(() => {
    setMounted(true)

    // URL parametresi ile admin mode açma: ?admin=1 veya ?admin=secret
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const adminParam = params.get('admin')
      if (adminParam) {
        setLogoClickCount(5)
        setRegRole('ADMIN')
        setTab('register')
        if (adminParam !== '1' && adminParam.length > 5) {
          // URL'de secret varsa otomatik doldur
          setAdminSecret(adminParam)
        }
        toast.success('🔐 Yönetici kayıt modu açıldı!', {
          description: 'Secret alanını doldurun ve kayıt olun.',
        })
      }
    }
  }, [])

  const [loginInProgress, setLoginInProgress] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loginInProgress) return // Çift çağrıyı önle
    setLoginInProgress(true)
    setLoading(true)
    setError('')
    try {
      await login(loginEmail, loginPassword)
      toast.success('Hoş geldiniz! Giriş başarılı.', {
        description: 'Hesabınıza erişim sağlanıyor...',
      })
    } catch (err: any) {
      // 2FA gerekli mi kontrol et
      if (err.message === '2FA_REQUIRED' || err.requiresTwoFactor) {
        setError('')
        setLoading(false)
        setLoginInProgress(false)
        // sessionStorage ile HMR sonrası dialog'u koru
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('show2FA', 'true')
          window.sessionStorage.setItem('2faEmail', loginEmail)
          window.sessionStorage.setItem('2faPassword', loginPassword)
        }
        setShowTwoFactor(true)
        toast.info('İki faktörlü doğrulama kodu gerekli', {
          description: 'Lütfen authenticator uygulamanızdaki 6 haneli kodu girin.',
        })
        return
      } else {
        const msg = err.message || 'Giriş yapılamadı.'
        setError(msg)
        // Hata tipine göre şık toast + dialog
        let title = '❌ Hata'
        let friendlyMsg = msg
        if (msg.includes('hatalı') || msg.includes('şifre')) {
          title = '⚠️ Giriş Hatası'
          friendlyMsg = 'E-posta veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.'
        } else if (msg.includes('Çok fazla') || msg.includes('rate')) {
          title = '⏱️ Çok Fazla Deneme'
          friendlyMsg = 'Çok fazla giriş denemesi yaptınız. Lütfen birkaç dakika bekleyip tekrar deneyin.'
        } else if (msg.includes('askı') || msg.includes('ban')) {
          title = '🚫 Hesap Askıya Alınmış'
          friendlyMsg = msg
        }
        // Toast ile anlık geri bildirim — setTimeout ile state update çakışmasını önle
        setTimeout(() => {
          toast.error(title, { description: friendlyMsg, duration: 6000 })
        }, 100)
        // Dialog ile kalıcı uyarı — setTimeout ile
        setTimeout(() => {
          showErrorDialog(title, friendlyMsg)
        }, 150)
      }
    } finally {
      setLoading(false)
      setLoginInProgress(false)
    }
  }

  // HMR sonrası 2FA dialog'u yeniden aç
  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('show2FA') === 'true') {
      // Email ve password'ü geri yükle
      const email = window.sessionStorage.getItem('2faEmail')
      const password = window.sessionStorage.getItem('2faPassword')
      if (email) setLoginEmail(email)
      if (password) setLoginPassword(password)
      setShowTwoFactor(true)
    }
  }, []) // Sadece mount'ta çalış

  // 2FA dialog kapandığında sessionStorage'ı temizle
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

  // 2FA kodu ile login
  const handleTwoFactorLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (twoFactorCode.length !== 6) {
      showErrorDialog('⚠️ Eksik Kod', 'Lütfen 6 haneli doğrulama kodunu eksiksiz girin.')
      return
    }
    setTwoFactorLoading(true)
    setError('')
    try {
      await login(loginEmail, loginPassword, twoFactorCode)
      toast.success('Hoş geldiniz! Giriş başarılı.', {
        description: 'Hesabınıza erişim sağlanıyor...',
      })
      closeTwoFactor()
    } catch (err: any) {
      if (err.message === '2FA_REQUIRED' || err.requiresTwoFactor) {
        showErrorDialog('❌ Geçersiz Kod', 'Girdiğiniz doğrulama kodu yanlış. Lütfen authenticator uygulamanızı kontrol edip tekrar deneyin.')
      } else if (err.message.includes('Çok fazla') || err.message.includes('rate')) {
        showErrorDialog('⏱️ Çok Fazla Deneme', 'Çok fazla deneme yaptınız. Lütfen birkaç dakika bekleyin.')
      } else {
        showErrorDialog('❌ Hata', err.message || 'Giriş yapılamadı.')
      }
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const cancelTwoFactor = () => {
    closeTwoFactor()
  }

  const [registerInProgress, setRegisterInProgress] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    // Çift submit'i önle
    if (registerInProgress) return
    setRegisterInProgress(true)
    setLoading(true)
    setError('')

    // Telefon numarasını seçilen ülkeye göre E.164 uluslararası formatına çevir
    let formattedPhone: string | undefined = undefined
    if (regPhone.trim()) {
      let rawDigits = regPhone.replace(/\D/g, '')
      if (selectedCountryCode === '+90') {
        // Türkiye: 0 ile başladıysa baştaki 0'ı kaldır (0532 -> 532)
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
      toast.success('Kayıt başarılı! Hoş geldiniz. 🎉')
    } catch (err: any) {
      const msg = err.message || 'Kayıt yapılamadı.'
      setError(msg)
      // Hata tipine göre şık toast + dialog
      // ÖNEMLİ: Telefon kontrolü ÖNCE yapılmalı (backend "Bu telefon numarası zaten kayıtlı" döner)
      let title = '❌ Kayıt Hatası'
      let friendlyMsg = msg
      if (msg.includes('telefon')) {
        if (msg.includes('kayıtlı')) {
          title = '📱 Telefon Zaten Kayıtlı'
          friendlyMsg = 'Bu telefon numarası başka bir hesapta kullanılıyor. Farklı bir telefon numarası deneyin veya mevcut hesabınızla giriş yapın.'
        } else {
          title = '📱 Telefon Hatası'
          friendlyMsg = 'Geçerli bir telefon numarası girin. (Örn: +905321234567)'
        }
      } else if (msg.includes('e-posta') && msg.includes('kayıtlı')) {
        title = '📧 E-posta Kullanımda'
        friendlyMsg = 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin veya başka bir e-posta kullanın.'
      } else if (msg.includes('kayıtlı') || msg.includes('zaten')) {
        title = '⚠️ Zaten Kayıtlı'
        friendlyMsg = 'Bu bilgiler zaten kayıtlı. Giriş yapmayı deneyin.'
      } else if (msg.includes('şifre') || msg.includes('password')) {
        title = '🔐 Şifre Hatası'
        friendlyMsg = 'Şifre en az 6 karakter olmalıdır.'
      } else if (msg.includes('e-posta') || msg.includes('email')) {
        title = '📧 E-posta Hatası'
        friendlyMsg = 'Geçerli bir e-posta adresi girin.'
      } else if (msg.includes('Çok fazla')) {
        title = '⏱️ Çok Fazla Deneme'
        friendlyMsg = 'Çok fazla kayıt denemesi. Lütfen bekleyin.'
      }
      // Toast ile anlık geri bildirim
      toast.error(title, { description: friendlyMsg, duration: 6000 })
      // Dialog ile kalıcı uyarı
      setTimeout(() => {
        showErrorDialog(title, friendlyMsg)
      }, 100)
    } finally {
      setLoading(false)
      setRegisterInProgress(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    try {
      if (!GOOGLE_CLIENT_ID) {
        showErrorDialog(
          'Google Yapılandırılmamış',
          'Google ile giriş için yöneticinin .env dosyasına NEXT_PUBLIC_GOOGLE_CLIENT_ID eklemesi gerekir. Lütfen e-posta ile giriş yapın veya kayıt olun.'
        )
        return
      }

      // Google OAuth script'ini dinamik olarak yükle
      await new Promise((resolve, reject) => {
        if ((window as any).google?.accounts?.id) return resolve(null)
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => resolve(null)
        script.onerror = () => reject(new Error('Google script yüklenemedi'))
        document.head.appendChild(script)
      })

      const googleAccts = (window as any).google.accounts.id

      // Initialize (sadece bir kez)
      googleAccts.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          setLoading(false)

          if (response.error) {
            setError('Google ile giriş yapılamadı: ' + (response.error || 'bilinmeyen hata'))
            return
          }

          const idToken = response.credential
          if (!idToken) {
            setError('Google ID token alınamadı.')
            return
          }

          try {
            setLoading(true)
            await loginWithGoogle(idToken)
            toast.success('Google ile giriş başarılı! Hoş geldiniz.')
          } catch (err: any) {
            console.error('Google login error:', err)
            setError(err.message || 'Google ile giriş yapılamadı.')
          } finally {
            setLoading(false)
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      // Gizli container'a Google butonu render et
      let container = document.getElementById('google-hidden-button')
      if (!container) {
        container = document.createElement('div')
        container.id = 'google-hidden-button'
        container.style.position = 'fixed'
        container.style.top = '-9999px'
        container.style.left = '-9999px'
        container.style.opacity = '0'
        document.body.appendChild(container)
      }

      // Container'ı temizle ve yeniden render et
      container.innerHTML = ''
      googleAccts.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'pill',
      })

      // Google butonunun render edilmesini bekle, sonra tıkla
      setLoading(true)
      setTimeout(() => {
        const googleBtn = container?.querySelector('div[role="button"]') as HTMLElement
        if (googleBtn) {
          googleBtn.click()
        } else {
          // Fallback: One Tap dene
          googleAccts.prompt()
        }
      }, 300)
    } catch (err: any) {
      console.error('Google login error:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotLoading(true)
    try {
      await authApi.forgotPassword(forgotEmail)
      setForgotStep('reset')
      toast.success('Kod e-posta adresinize gönderildi!')
    } catch (err: any) {
      const msg = err.message || 'Kod gönderilemedi.'
      if (msg.includes('bulunamadı')) {
        showErrorDialog('📧 Kullanıcı Bulunamadı', 'Bu e-posta adresi ile kayıtlı kullanıcı yok. Kayıt olmayı deneyin.')
      } else if (msg.includes('Çok fazla') || msg.includes('dakika') || msg.includes('saat')) {
        // Kademeli rate limit mesajını direkt göster
        showErrorDialog('⏱️ Çok Fazla Deneme', msg)
      } else {
        showErrorDialog('❌ Hata', msg)
      }
    } finally {
      setForgotLoading(false)
    }
  }

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (forgotNewPassword.length < 6) {
      showErrorDialog('🔐 Şifre Kısa', 'Şifre en az 6 karakter olmalıdır.')
      return
    }
    if (forgotCode.length !== 6) {
      showErrorDialog('⚠️ Eksik Kod', 'Lütfen 6 haneli doğrulama kodunu girin.')
      return
    }
    setForgotLoading(true)
    try {
      await authApi.resetPassword(forgotCode, forgotNewPassword)
      setForgotStep('done')
      toast.success('Şifreniz sıfırlandı!')
    } catch (err: any) {
      const msg = err.message || 'Sıfırlama başarısız.'
      if (msg.includes('Geçersiz') || msg.includes('kullanılmış')) {
        showErrorDialog('❌ Geçersiz Kod', 'Doğrulama kodu yanlış veya daha önce kullanılmış. Yeni kod isteyin.')
      } else if (msg.includes('süresi')) {
        showErrorDialog('⏰ Süre Doldu', 'Doğrulama kodunun süresi dolmuş. Lütfen yeni kod isteyin.')
      } else {
        showErrorDialog('❌ Hata', msg)
      }
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* 3D Spatial Grid & Volumetric Lighting */}
      <div className="absolute inset-0 bg-spatial-grid opacity-25 pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-float-3d transform-gpu" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-float-3d-reverse transform-gpu" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl transform-gpu" />
      </div>

      {/* Sağ üst köşede her zaman görünür Share/Publish butonu */}
      <AuthShareButton />

      <div className={`relative w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* ============= SOL: BRAND & INFO ============= */}
        <div className="hidden lg:flex flex-col text-white p-8 space-y-8">
          <button
            type="button"
            aria-label="Günübirlik Logo"
            onClick={() => {
              const newCount = logoClickCount + 1
              setLogoClickCount(newCount)
              if (newCount === 5) {
                toast.success('🔐 Yönetici kayıt modu açıldı!', {
                  description: 'Kayıt formunda "Yönetici" seçeneği görünecek.',
                })
              } else if (newCount > 5 && newCount < 8) {
                toast.info(`${newCount}/5 — ${5 - newCount > 0 ? (5 - newCount) + ' tık daha' : 'aktif'}`)
              }
            }}
            className="flex items-center gap-3.5 cursor-pointer hover:opacity-90 transition text-left group"
          >
            <Logo size="xl" variant="full" />
          </button>

          <div className="space-y-5">
            <h2 className="text-4xl font-bold leading-tight">
              Yakındaki işleri<br />
              <span className="bg-gradient-to-r from-yellow-200 to-amber-300 bg-clip-text text-transparent">
                anında keşfedin
              </span>
            </h2>
            <p className="text-emerald-50 text-lg leading-relaxed">
              İnşaat, restoran, temizlik, nakliyat ve daha fazlası. Konumunu seç, hemen iş bul.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <FeatureCard
              icon={MapPin}
              title="Konum Bazlı"
              desc="GPS ile yakındaki işler"
              delay={100}
              mounted={mounted}
            />
            <FeatureCard
              icon={Clock}
              title="Hızlı İş Bulma"
              desc="Saniyeler içinde başvur"
              delay={200}
              mounted={mounted}
            />
            <FeatureCard
              icon={Wallet}
              title="Günlük Ödeme"
              desc="Aynı gün ödeme garantisi"
              delay={300}
              mounted={mounted}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Onaylı İşveren"
              desc="Doğrulanmış firmalar"
              delay={400}
              mounted={mounted}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 pt-6 border-t border-white/20">
            <Stat value="2.500+" label="Aktif İş İlanı" mounted={mounted} delay={500} />
            <Stat value="1.200+" label="Kayıtlı İşçi" mounted={mounted} delay={600} />
            <Stat value="180+" label="Onaylı İşveren" mounted={mounted} delay={700} />
          </div>
        </div>

        {/* ============= SAĞ: AUTH CARD (3D SPATIAL) ============= */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="card-3d-spatial rounded-3xl border border-white/60 dark:border-white/10 shadow-[0_25px_60px_-15px_rgba(5,150,105,0.45)] backdrop-blur-2xl bg-white/95 dark:bg-slate-900/95 overflow-hidden max-h-[95vh] flex flex-col preserve-3d">
            {/* Mobile header */}
            <div className="lg:hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-center border-b border-white/10">
              <button
                type="button"
                aria-label="Günübirlik Logo"
                onClick={() => {
                  const newCount = logoClickCount + 1
                  setLogoClickCount(newCount)
                  if (newCount === 5) {
                    toast.success('🔐 Yönetici kayıt modu açıldı!', {
                      description: 'Kayıt formunda "Yönetici" seçeneği görünecek.',
                    })
                  } else if (newCount > 5 && newCount < 8) {
                    toast.info(`${newCount}/5 — ${5 - newCount > 0 ? (5 - newCount) + ' tık daha' : 'aktif'}`)
                  }
                }}
                className="inline-flex flex-col items-center cursor-pointer hover:opacity-90 transition"
              >
                <Logo size="md" variant="full" className="mb-1" />
              </button>
            </div>

            <CardContent className="p-4 sm:p-5 overflow-y-auto">
              {/* Tab Switcher - 3D Inset */}
              <div className="grid grid-cols-2 gap-1 p-1 inset-3d rounded-2xl mb-3">
                <button
                  type="button"
                  aria-label="Giriş Yap sekmesi"
                  onClick={() => { setTab('login'); setError('') }}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    tab === 'login'
                      ? 'btn-3d-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`}
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  aria-label="Kayıt Ol sekmesi"
                  onClick={() => { setTab('register'); setRegStep(1); setError('') }}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    tab === 'register'
                      ? 'btn-3d-white text-emerald-800 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400'
                  }`}
                >
                  Kayıt Ol
                </button>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4 animate-shake">
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* ============= LOGIN FORM ============= */}
              {tab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Tekrar hoş geldiniz 👋</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Hesabınıza giriş yapın</p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">E-posta</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-9 h-9.5 text-xs border-gray-200 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">Şifre</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-9 pr-9 h-9.5 text-xs border-gray-200 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <label htmlFor="remember-me" className="flex items-center gap-1.5 cursor-pointer text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200">
                      <input id="remember-me" aria-label="Beni hatırla" type="checkbox" className="w-3 h-3 rounded border-gray-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500" />
                      Beni hatırla
                    </label>
                    <button type="button" aria-label="Şifremi unuttum" onClick={() => setForgotOpen(true)} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium">
                      Şifremi unuttum
                    </button>
                  </div>

                  <button
                    type="submit"
                    aria-label="Giriş Yap"
                    className="btn-3d-emerald btn-3d-pill w-full h-11 text-xs font-black flex items-center justify-center gap-1.5 shadow-md mt-2"
                    disabled={loading || loginInProgress}
                  >
                    {loading || loginInProgress ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        Giriş yapılıyor...
                      </>
                    ) : (
                      <>
                        Giriş Yap
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Google ile giriş */}
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200 dark:border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-[10px]">
                      <span className="bg-white dark:bg-slate-900 px-2 text-gray-400 dark:text-slate-400 font-bold">veya</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Google ile Giriş Yap"
                    className="btn-3d-white btn-3d-pill w-full h-10 text-xs font-bold flex items-center justify-center gap-2 text-slate-800 dark:text-slate-100"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Google ile Giriş Yap</span>
                  </button>
                </form>
              )}

              {/* ============= REGISTER FORM (LEVEL WIZARD) ============= */}
              {tab === 'register' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (regStep < 3) {
                      handleNextStep()
                    } else {
                      handleRegister(e)
                    }
                  }}
                  className="space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  {/* Gamified Level Progress Bar */}
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-slate-900/60 border border-emerald-100/90 dark:border-emerald-800/40 rounded-xl p-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow-xs">
                          {regStep}
                        </span>
                        <span className="text-[11px]">
                          {regStep === 1 && 'Level 1: Rolünü Seç'}
                          {regStep === 2 && 'Level 2: Kimlik & Bilgiler'}
                          {regStep === 3 && 'Level 3: Güvenlik & Konum'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-emerald-300 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 font-semibold py-0 px-1.5">
                        {regStep === 1 && '⚡ 33% XP'}
                        {regStep === 2 && '🔥 66% XP'}
                        {regStep === 3 && '🏆 Son Seviye'}
                      </Badge>
                    </div>

                    {/* Progress track */}
                    <div className="w-full bg-gray-200/90 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                        style={{
                          width: regStep === 1 ? '33.33%' : regStep === 2 ? '66.66%' : '100%',
                        }}
                      />
                    </div>

                    {/* Mini Level Navigation */}
                    <div className="flex justify-between items-center mt-1.5 px-0.5 text-[10px]">
                      <button
                        type="button"
                        aria-label="Rol Seçimi adımı"
                        onClick={() => setRegStep(1)}
                        className={`flex items-center gap-1 transition ${
                          regStep >= 1 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-slate-500'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                          regStep > 1 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {regStep > 1 ? '✓' : '1'}
                        </span>
                        Rol
                      </button>

                      <div className={`h-[1px] flex-1 mx-2 transition-colors ${regStep >= 2 ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-slate-800'}`} />

                      <button
                        type="button"
                        aria-label="Bilgiler adımı"
                        onClick={() => {
                          if (regStep > 2) setRegStep(2)
                          else if (regStep === 1) handleNextStep()
                        }}
                        className={`flex items-center gap-1 transition ${
                          regStep >= 2 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-slate-500'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                          regStep > 2 ? 'bg-emerald-600 text-white' : regStep === 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-300'
                        }`}>
                          {regStep > 2 ? '✓' : '2'}
                        </span>
                        Bilgiler
                      </button>

                      <div className={`h-[1px] flex-1 mx-2 transition-colors ${regStep >= 3 ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-slate-800'}`} />

                      <button
                        type="button"
                        aria-label="Güvenlik adımı"
                        onClick={() => {
                          if (regStep === 2) handleNextStep()
                        }}
                        className={`flex items-center gap-1 transition ${
                          regStep === 3 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-slate-500'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] ${
                          regStep === 3 ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-300'
                        }`}>
                          3
                        </span>
                        Güvenlik
                      </button>
                    </div>
                  </div>

                  {/* ============= LEVEL 1: ROL SEÇİMİ ============= */}
                  {regStep === 1 && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-right-3 duration-300">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Rolünü Belirle 🎯</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Platforma nasıl katılmak istiyorsun?</p>
                      </div>

                      {/* Role cards */}
                      <div className={`grid ${logoClickCount >= 5 ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                        <button
                          type="button"
                          aria-label="İş arayan olarak kayıt ol"
                          onClick={() => setRegRole('WORKER')}
                          className={`relative p-3 rounded-xl border-2 transition-all duration-300 group text-center ${
                            regRole === 'WORKER'
                              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/60 shadow-sm scale-101'
                              : 'border-gray-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {regRole === 'WORKER' && (
                            <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                          <div className={`w-9 h-9 rounded-xl mx-auto flex items-center justify-center mb-1.5 transition-colors ${
                            regRole === 'WORKER' ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                          }`}>
                            <User className="w-5 h-5" />
                          </div>
                          <div className={`text-xs font-bold ${regRole === 'WORKER' ? 'text-emerald-950 dark:text-emerald-200' : 'text-gray-800 dark:text-slate-200'}`}>
                            İş Arıyorum
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">İş bul, hemen kazan</div>
                        </button>

                        <button
                          type="button"
                          aria-label="İşveren olarak kayıt ol"
                          onClick={() => setRegRole('EMPLOYER')}
                          className={`relative p-3 rounded-xl border-2 transition-all duration-300 group text-center ${
                            regRole === 'EMPLOYER'
                              ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/60 shadow-sm scale-101'
                              : 'border-gray-200 dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {regRole === 'EMPLOYER' && (
                            <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-amber-600 dark:text-amber-400" />
                          )}
                          <div className={`w-9 h-9 rounded-xl mx-auto flex items-center justify-center mb-1.5 transition-colors ${
                            regRole === 'EMPLOYER' ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-950/40 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                          }`}>
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className={`text-xs font-bold ${regRole === 'EMPLOYER' ? 'text-amber-950 dark:text-amber-200' : 'text-gray-800 dark:text-slate-200'}`}>
                            İşçi Arıyorum
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">İlan ver, ekip kur</div>
                        </button>

                        {logoClickCount >= 5 && (
                          <button
                            type="button"
                            aria-label="Yönetici olarak kayıt ol"
                            onClick={() => setRegRole('ADMIN')}
                            className={`relative p-3 rounded-xl border-2 transition-all duration-300 group text-center ${
                              regRole === 'ADMIN'
                                ? 'border-purple-600 bg-purple-50/80 dark:bg-purple-950/60 shadow-sm scale-101'
                                : 'border-gray-200 dark:border-white/10 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            {regRole === 'ADMIN' && (
                              <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-purple-600 dark:text-purple-400" />
                            )}
                            <div className={`w-9 h-9 rounded-xl mx-auto flex items-center justify-center mb-1.5 transition-colors ${
                              regRole === 'ADMIN' ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/40 group-hover:text-purple-600 dark:group-hover:text-purple-400'
                            }`}>
                              <Shield className="w-5 h-5" />
                            </div>
                            <div className={`text-xs font-bold ${regRole === 'ADMIN' ? 'text-purple-950 dark:text-purple-200' : 'text-gray-800 dark:text-slate-200'}`}>
                              Yönetici
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-slate-400 leading-tight mt-0.5">Secret gerek</div>
                          </button>
                        )}
                      </div>

                      <Button
                        type="button"
                        aria-label="Level 2'ye Geç"
                        onClick={handleNextStep}
                        className="w-full h-10 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group mt-2"
                      >
                        Level 2'ye Geç
                        <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                      </Button>

                      {/* Google ile kayıt */}
                      <div className="relative my-2">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-200 dark:border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-[10px]">
                          <span className="bg-white dark:bg-slate-900 px-2 text-gray-400 dark:text-slate-400">veya hızlıca</span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        aria-label="Google ile Kayıt Ol"
                        variant="outline"
                        className="w-full h-9 text-xs border-gray-300 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google ile Kayıt Ol
                      </Button>
                    </div>
                  )}

                  {/* ============= LEVEL 2: KİMLİK & BİLGİLER ============= */}
                  {regStep === 2 && (
                    <div className="space-y-2.5 animate-in fade-in slide-in-from-right-3 duration-300">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Profilini Oluştur 👤</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Seni tanımamız için temel bilgilerini gir</p>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="reg-fullname" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">Ad Soyad</Label>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-emerald-600" />
                          <Input
                            id="reg-fullname"
                            placeholder="Adınız Soyadınız"
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            className="pl-9 h-9.5 text-xs border-gray-200 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20"
                            required
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="reg-email" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">E-posta</Label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-emerald-600" />
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="ornek@email.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="pl-9 h-9.5 text-xs border-gray-200 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20"
                            required
                          />
                        </div>
                      </div>

                      {regRole === 'EMPLOYER' && (
                        <div className="space-y-1 animate-in fade-in duration-200">
                          <Label htmlFor="reg-company" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">Şirket / Firma Adı</Label>
                          <div className="relative group">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-amber-600" />
                            <Input
                              id="reg-company"
                              placeholder="Firma veya işletme adınız"
                              value={regCompanyName}
                              onChange={(e) => setRegCompanyName(e.target.value)}
                              className="pl-9 h-9.5 text-xs border-gray-200 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 focus:border-amber-500 focus:ring-amber-500/20"
                              required
                            />
                          </div>
                        </div>
                      )}

                      {regRole === 'ADMIN' && (
                        <div className="space-y-1 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="admin-secret" className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                              🔐 Admin Kayıt Secretı
                            </Label>
                            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">.env: ADMIN_REGISTER_SECRET</span>
                          </div>
                          <div className="relative group">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400 group-focus-within:text-purple-600" />
                            <Input
                              id="admin-secret"
                              type={showAdminSecret ? 'text' : 'password'}
                              placeholder="ADMIN_REGISTER_SECRET değerini girin"
                              value={adminSecret}
                              onChange={(e) => setAdminSecret(e.target.value)}
                              className="pl-9 pr-9 h-9.5 text-xs border-purple-200 dark:border-purple-800/60 dark:bg-slate-950 dark:text-slate-100 focus:border-purple-500 focus:ring-purple-500/20 font-mono"
                              required
                            />
                            <button
                              type="button"
                              aria-label={showAdminSecret ? 'Secretı gizle' : 'Secretı göster'}
                              onClick={() => setShowAdminSecret(!showAdminSecret)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition p-1"
                            >
                              {showAdminSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-slate-400">
                            Yönetici hesabı açmak için .env dosyasında tanımlanan secret anahtarı gereklidir.
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          type="button"
                          aria-label="Önceki adım: Rol seçimi"
                          variant="outline"
                          onClick={handlePrevStep}
                          className="h-9.5 text-xs border-gray-300 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                          Geri (Rol)
                        </Button>

                        <Button
                          type="button"
                          aria-label="Level 3'e Geç"
                          onClick={handleNextStep}
                          className="h-9.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20"
                        >
                          Level 3'e Geç
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ============= LEVEL 3: GÜVENLİK & KONUM ============= */}
                  {regStep === 3 && (
                    <div className="space-y-2.5 animate-in fade-in slide-in-from-right-3 duration-300">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Güvenlik & Konum 🛡️</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Son adım! Hesabını koru ve lokasyonunu belirle</p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="reg-phone" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                            Telefon Numarası
                          </Label>
                          <span className="text-[10px] text-gray-400 dark:text-slate-400 font-mono">
                            {regPhone.replace(/\D/g, '').length}/{activeCountry.maxDigits} hane
                          </span>
                        </div>
                        <div className="flex gap-1.5 items-center">
                          {/* Ülke Seçici Dropdown */}
                          <div className="w-[110px] shrink-0">
                            <Select
                              value={selectedCountryCode}
                              onValueChange={(val) => {
                                setSelectedCountryCode(val)
                                setRegPhone('')
                              }}
                            >
                              <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-white/10 px-2 bg-gray-50/80 dark:bg-slate-950 dark:text-slate-100">
                                <SelectValue>
                                  <span className="flex items-center gap-1 text-xs">
                                    <span>{activeCountry.flag}</span>
                                    <span className="font-semibold text-gray-700 dark:text-slate-200">{activeCountry.code}</span>
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="max-h-60 dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
                                {COUNTRY_OPTIONS.map((c) => (
                                  <SelectItem key={c.code} value={c.code} className="text-xs">
                                    <div className="flex items-center gap-2">
                                      <span>{c.flag}</span>
                                      <span className="font-medium text-gray-800 dark:text-slate-200">{c.name}</span>
                                      <span className="text-gray-400 dark:text-slate-400 text-[11px] ml-auto">{c.code}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Telefon Inputu */}
                          <div className="relative group flex-1">
                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                            <Input
                              id="reg-phone"
                              type="tel"
                              inputMode="numeric"
                              placeholder={activeCountry.placeholder}
                              value={regPhone}
                              onChange={(e) => handlePhoneChange(e.target.value)}
                              className="pl-8 pr-3 h-9 text-xs border-gray-200 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20 font-mono tracking-wide"
                              autoFocus
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400">
                          {activeCountry.code === '+90'
                            ? 'Örn: 0532 123 45 67 veya 532 123 45 67 (10-11 hane)'
                            : `${activeCountry.name} formatı (maks. ${activeCountry.maxDigits} hane)`}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">Şehir</Label>
                          <Select value={regCity} onValueChange={setRegCity}>
                            <SelectTrigger className="h-9 text-xs border-gray-200 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 focus:border-emerald-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
                              {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Trabzon', 'Kocaeli', 'Gaziantep'].map((c) => (
                                <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="reg-district" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">İlçe</Label>
                          <div className="relative group">
                            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-emerald-600" />
                            <Input
                              id="reg-district"
                              placeholder="İlçe (örn: Kadıköy)"
                              value={regDistrict}
                              onChange={(e) => setRegDistrict(e.target.value)}
                              className="pl-8 h-9 text-xs border-gray-200 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="reg-password" className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">Şifre Belirleyin</Label>
                        <div className="relative group">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-emerald-600" />
                          <Input
                            id="reg-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="En az 6 karakter"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="pl-9 pr-9 h-9 text-xs border-gray-200 dark:border-white/10 dark:bg-slate-950 dark:text-slate-100 focus:border-emerald-500 focus:ring-emerald-500/20"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          type="button"
                          aria-label="Önceki adım: Bilgiler"
                          variant="outline"
                          onClick={handlePrevStep}
                          className="h-10 text-xs border-gray-300 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                          Geri (Bilgiler)
                        </Button>

                        <Button
                          type="submit"
                          aria-label="Kaydı Bitir"
                          className={`h-10 text-xs font-semibold shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group ${
                            regRole === 'WORKER'
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/30'
                              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
                          }`}
                          disabled={loading || registerInProgress}
                        >
                          {loading || registerInProgress ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                              Kayıt olunuyor...
                            </>
                          ) : (
                            <>
                              🎉 Kaydı Bitir
                              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </Button>
                      </div>

                      <p className="text-[10px] text-center text-gray-400 dark:text-slate-500 pt-0.5">
                        Kaydı tamamlayarak <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:underline">Kullanım Şartları</a>'nı kabul etmiş olursunuz.
                      </p>
                    </div>
                  )}
                </form>
              )}
            </CardContent>
          </Card>

          {/* Mobile footer */}
          <div className="flex flex-col items-center gap-2 mt-4">
            <p className="text-center text-xs text-white/80">
              © 2024 Günübirlik İş Bul — Türkiye'nin günlük iş platformu
            </p>
            {/* Gizli admin erişimi — çok küçük, neredeyse görünmez */}
            <button
              type="button"
              aria-label="Yönetici kaydı"
              onClick={() => {
                setLogoClickCount(5)
                setRegRole('ADMIN')
                setTab('register')
                toast.success('🔐 Yönetici kayıt modu açıldı!', {
                  description: 'Secret alanını doldurun ve kayıt olun.',
                })
              }}
              className="text-[9px] text-white/30 hover:text-white/70 transition-colors"
              title="Yönetici kaydı"
            >
              ·
            </button>
          </div>
        </div>
      </div>

      {/* ============= ERROR DIALOG (tüm hatalar için) ============= */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <DialogContent className="w-[95vw] max-w-md dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg text-gray-900 dark:text-white">{errorDialog.title}</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-slate-400">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6 text-white font-semibold"
              onClick={() => setErrorDialog({ ...errorDialog, open: false })}
            >
              Tamam, Anladım
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============= 2FA LOGIN DIALOG ============= */}
      <Dialog open={showTwoFactor} onOpenChange={(open) => { if (!open) cancelTwoFactor() }}>
        <DialogContent className="w-[95vw] max-w-md dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-900 dark:text-white">
              <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              İki Faktörlü Doğrulama
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-slate-400">
              Google Authenticator, Authy veya Microsoft Authenticator uygulamanızdaki 6 haneli kodu girin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTwoFactorLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-800 dark:text-slate-200">Doğrulama Kodu</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="h-14 text-center text-2xl tracking-[0.5em] font-mono dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                autoFocus
                autoComplete="one-time-code"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
                Kodu 6 haneli olarak girin
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 dark:bg-slate-800 dark:border-white/10 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={cancelTwoFactor}
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                disabled={twoFactorLoading || twoFactorCode.length !== 6}
              >
                {twoFactorLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Doğrula
              </Button>
            </div>

            <div className="text-xs text-gray-500 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 p-3 rounded-lg">
              <strong className="text-blue-800 dark:text-blue-200">💡 Backup kod:</strong> Eğer telefonunuza erişemiyorsanız, 2FA kurarken aldığınız backup kodlarından birini kullanabilirsiniz.
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============= ŞİFRE SIFIRLAMA DIALOG ============= */}
      <Dialog open={forgotOpen} onOpenChange={(open) => { setForgotOpen(open); if (!open) resetForgotState() }}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg text-gray-900 dark:text-white">Şifre Sıfırlama</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 dark:text-slate-400">
              {forgotStep === 'email' && 'E-posta adresinize sıfırlama kodu göndereceğiz.'}
              {forgotStep === 'reset' && 'E-postanıza gelen kodu ve yeni şifrenizi girin.'}
              {forgotStep === 'done' && 'Şifreniz başarıyla sıfırlandı.'}
            </DialogDescription>
          </DialogHeader>

          {forgotStep === 'email' && (
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-gray-800 dark:text-slate-200">E-posta Adresi</Label>
                <Input
                  type="email"
                  placeholder="ornek@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="h-11 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={forgotLoading}>
                {forgotLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Kod Gönder
              </Button>
            </form>
          )}

          {forgotStep === 'reset' && (
            <form onSubmit={handleForgotReset} className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                <strong>ℹ️ Bilgi:</strong> E-posta adresinize gönderilen 6 haneli kodu aşağıya girin.
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-800 dark:text-slate-200">Doğrulama Kodu</Label>
                <Input
                  placeholder="6 haneli kod"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value)}
                  className="h-11 text-center text-lg tracking-widest dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                  maxLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-800 dark:text-slate-200">Yeni Şifre</Label>
                <Input
                  type="password"
                  placeholder="Min 6 karakter"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="h-11 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={forgotLoading}>
                {forgotLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Şifreyi Sıfırla
              </Button>
            </form>
          )}

          {forgotStep === 'done' && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/70 mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Şifreniz güncellendi!</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">Yeni şifrenizle giriş yapabilirsiniz.</p>
              <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" onClick={resetForgotState}>
                Giriş Yapmaya Dön
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Inline styles for animations */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        .animate-in {
          animation-fill-mode: both;
        }
        .fade-in {
          animation-name: fadeIn;
        }
        .slide-in-from-bottom-2 {
          animation-name: slideInBottom;
        }
        .slide-in-from-top-2 {
          animation-name: slideInTop;
        }
        .duration-300 {
          animation-duration: 300ms;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInBottom {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInTop {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ============================================================
// Alt Bileşenler
// ============================================================

function FeatureCard({ icon: Icon, title, desc, delay, mounted }: {
  icon: any
  title: string
  desc: string
  delay: number
  mounted: boolean
}) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl bg-white/10 backdrop-blur border border-white/20 transition-all duration-500 hover:bg-white/15 hover:scale-105 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm text-white">{title}</div>
        <div className="text-xs text-emerald-100">{desc}</div>
      </div>
    </div>
  )
}

function Stat({ value, label, mounted, delay }: {
  value: string
  label: string
  mounted: boolean
  delay: number
}) {
  return (
    <div
      className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-emerald-100">{label}</div>
    </div>
  )
}

// ============================================================
// AuthShareButton — Login ekranında sağ üstte her zaman görünür
// Siteyi paylaş/publish linki al butonu
// ============================================================
function AuthShareButton() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://gunubirlik.com'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl)
      setCopied(true)
      toast.success('Link kopyalandı! 📋')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Kopyalanamadı')
    }
  }

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: 'Günübirlik İş Bul',
          text: 'Türkiye\'nin günübirlik iş bulma platformu. İlanları gör, hemen iş bul!',
          url: siteUrl,
        })
      } catch {
        // iptal
      }
    } else {
      handleCopy()
    }
  }

  return (
    <>
      {/* Fixed sağ üst — her zaman görünür, z-50 ile en üstte */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <ThemeToggle variant="icon" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white font-semibold text-sm shadow-lg hover:bg-white/30 transition-all duration-300 hover:scale-105"
          title="Siteyi Paylaş"
          aria-label="Siteyi Paylaş"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Siteyi Paylaş</span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600" />
              Siteyi Paylaş
            </DialogTitle>
            <DialogDescription>
              Günübirlik İş Bul platformunu arkadaşlarınla paylaş
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* URL + Copy */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
              <input
                value={siteUrl}
                readOnly
                aria-label="Site URL adresi"
                className="flex-1 h-10 bg-white text-sm px-3 rounded border-0 outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded border border-gray-300 hover:bg-gray-50"
                title="Kopyala"
                aria-label="Bağlantıyı Kopyala"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Native Share */}
            <button
              type="button"
              aria-label="Paylaş"
              onClick={handleNativeShare}
              className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition"
            >
              <Share2 className="w-5 h-5" />
              Paylaş (WhatsApp, Telegram, SMS...)
            </button>

            {/* Quick share */}
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent('Günübirlik İş Bul — Türkiye\'nin günübirlik iş bulma platformu! ' + siteUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border hover:border-emerald-500 hover:bg-emerald-50/60 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[11px] font-semibold text-gray-700">WhatsApp</span>
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent('Günübirlik İş Bul')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border hover:border-blue-500 hover:bg-blue-50/60 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center transition-transform group-hover:scale-110">
                  <TelegramIcon className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[11px] font-semibold text-gray-700">Telegram</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Günübirlik İş Bul — Türkiye\'nin günübirlik iş bulma platformu!')}&url=${encodeURIComponent(siteUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border hover:border-slate-500 hover:bg-slate-100/70 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-800 flex items-center justify-center transition-transform group-hover:scale-110">
                  <TwitterXIcon className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-[11px] font-semibold text-gray-700">X (Twitter)</span>
              </a>
            </div>

            {/* QR Kod */}
            <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <QrCode className="w-4 h-4" />
                QR Kod ile Eriş
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(siteUrl)}`}
                alt="QR Kod"
                className="w-44 h-44 bg-white p-2 rounded-lg shadow-sm"
              />
              <p className="text-xs text-emerald-700 text-center">
                Telefon kamerasıyla tara, siteye anında eriş
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
