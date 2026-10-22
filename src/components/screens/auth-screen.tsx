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
} from 'lucide-react'
import { toast } from 'sonner'
import Logo from '@/components/shared/logo'

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

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''

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
  const [forgotStep, setForgotStep] = useState<'email' | 'reset' | 'done'>('email')
  const [forgotLoading, setForgotLoading] = useState(false)

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

      await new Promise((resolve, reject) => {
        if ((window as any).google?.accounts?.id) return resolve(null)
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => resolve(null)
        script.onerror = () => reject(new Error('Google bağlantısı kurulamadı'))
        document.head.appendChild(script)
      })

      const googleAccts = (window as any).google.accounts.id

      googleAccts.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          setLoading(false)
          if (response.error) {
            setError('Google ile giriş yapılamadı.')
            return
          }
          const idToken = response.credential
          if (!idToken) {
            setError('Google doğrulama bilgisi alınamadı.')
            return
          }
          try {
            setLoading(true)
            await loginWithGoogle(idToken)
            useApp.getState().closeAuthModal()
            toast.success('Google ile giriş yapıldı')
          } catch (err: any) {
            setError(err.message || 'Google ile giriş yapılamadı.')
          } finally {
            setLoading(false)
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

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

      container.innerHTML = ''
      googleAccts.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'rectangular',
      })

      setLoading(true)
      setTimeout(() => {
        const googleBtn = container?.querySelector('div[role="button"]') as HTMLElement
        if (googleBtn) {
          googleBtn.click()
        } else {
          googleAccts.prompt()
        }
      }, 300)
    } catch (err: any) {
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
          {tab === 'login' ? 'OTURUM AÇ' : `KAYIT • ADIM ${regStep}/3`}
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Sekme Seçici */}
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

        {error && (
          <Alert variant="destructive" className="py-2.5 px-3 rounded-md border-[#EFC7BD] bg-[#FBEEE9] text-[#B43B21] dark:bg-[#2E1611] dark:border-[#5C281E] dark:text-[#F5937E]">
            <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
          </Alert>
        )}

        {/* ============= GİRİŞ FORMU ============= */}
        {tab === 'login' && (
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
      </div>

      {/* ============= HATA DIALOGU ============= */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-sm rounded-lg bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#141615] dark:text-white">
              {errorDialog.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97]">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-2">
            <Button
              className="bg-[#0D6847] hover:bg-[#095237] h-9 px-4 text-xs text-white font-semibold"
              onClick={() => setErrorDialog({ ...errorDialog, open: false })}
            >
              Anladım
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============= 2FA DIALOGU ============= */}
      <Dialog open={showTwoFactor} onOpenChange={(open) => { if (!open) closeTwoFactor() }}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-sm rounded-lg bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-[#141615] dark:text-white">
              <Smartphone className="w-4 h-4 text-[#0D6847]" />
              İki Aşamalı Doğrulama
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97]">
              Doğrulama uygulamanızdaki 6 haneli güvenlik kodunu girin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTwoFactorLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Doğrulama Kodu</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="h-12 text-center text-xl tracking-[0.4em] font-mono bg-[#F6F5F2] dark:bg-[#181C1A] border-[#D8D5CC] dark:border-[#2B322E]"
                autoFocus
                autoComplete="one-time-code"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10 text-xs"
                onClick={closeTwoFactor}
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold"
                disabled={twoFactorLoading || twoFactorCode.length !== 6}
              >
                {twoFactorLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Doğrula'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============= ŞİFRE SIFIRLAMA DIALOGU ============= */}
      <Dialog open={forgotOpen} onOpenChange={(open) => { setForgotOpen(open); if (!open) resetForgotState() }}>
        <DialogContent className="w-[calc(100vw-24px)] max-w-sm rounded-lg bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#141615] dark:text-white">
              Şifre Sıfırlama
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97]">
              {forgotStep === 'email' && 'Kayıtlı e-posta adresinize 6 haneli doğrulama kodu göndereceğiz.'}
              {forgotStep === 'reset' && 'E-postanıza gelen kodu ve yeni şifrenizi girin.'}
              {forgotStep === 'done' && 'Şifreniz başarıyla güncellendi.'}
            </DialogDescription>
          </DialogHeader>

          {forgotStep === 'email' && (
            <form onSubmit={handleForgotRequest} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">E-posta Adresi</Label>
                <Input
                  type="email"
                  placeholder="ornek@eposta.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="h-10 text-sm"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold"
                disabled={forgotLoading}
              >
                {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Doğrulama Kodu Gönder'}
              </Button>
            </form>
          )}

          {forgotStep === 'reset' && (
            <form onSubmit={handleForgotReset} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">6 Haneli Kod</Label>
                <Input
                  placeholder="000000"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value)}
                  className="h-10 text-center font-mono tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Yeni Şifre</Label>
                <Input
                  type="password"
                  placeholder="En az 6 karakter"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="h-10 text-sm"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full h-10 bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold"
                disabled={forgotLoading}
              >
                {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Şifreyi Güncelle'}
              </Button>
            </form>
          )}

          {forgotStep === 'done' && (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[#0D6847] mx-auto" />
              <p className="text-xs text-[#5C615E] dark:text-[#949B97]">
                Yeni şifrenizle hesabınıza giriş yapabilirsiniz.
              </p>
              <Button
                className="w-full h-10 bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold"
                onClick={resetForgotState}
              >
                Giriş Ekranına Dön
              </Button>
            </div>
          )}
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
