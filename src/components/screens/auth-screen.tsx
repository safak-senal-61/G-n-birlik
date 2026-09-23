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
  ShieldCheck, Clock, Wallet, Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google'

type Tab = 'login' | 'register'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''

export default function AuthScreen() {
  const { login, register, loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('login')
  const [showPassword, setShowPassword] = useState(false)
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
  const [loginEmail, setLoginEmail] = useState('worker1@example.com')
  const [loginPassword, setLoginPassword] = useState('123456')

  // Register form
  const [regRole, setRegRole] = useState<'WORKER' | 'EMPLOYER'>('WORKER')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regFullName, setRegFullName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regCity, setRegCity] = useState('İstanbul')
  const [regDistrict, setRegDistrict] = useState('')
  const [regCompanyName, setRegCompanyName] = useState('')

  // Şifremi unuttum akışı
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotStep, setForgotStep] = useState<'email' | 'reset' | 'done'>('email')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotPreview, setForgotPreview] = useState('') // Dev modunda kod burada görünür

  // 2FA login state
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
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
        // Hata tipine göre şık dialog göster
        if (msg.includes('hatalı') || msg.includes('şifre')) {
          showErrorDialog('⚠️ Giriş Hatası', 'E-posta veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.')
        } else if (msg.includes('Çok fazla') || msg.includes('rate')) {
          showErrorDialog('⏱️ Çok Fazla Deneme', 'Çok fazla giriş denemesi yaptınız. Lütfen birkaç dakika bekleyip tekrar deneyin.')
        } else {
          showErrorDialog('❌ Hata', msg)
        }
        setLoading(false)
      }
    } finally {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await register({
        email: regEmail,
        password: regPassword,
        fullName: regFullName,
        phone: regPhone,
        role: regRole,
        city: regCity,
        district: regDistrict,
        companyName: regRole === 'EMPLOYER' ? regCompanyName : undefined,
      })
      toast.success('Kayıt başarılı! Hoş geldiniz. 🎉')
    } catch (err: any) {
      const msg = err.message || 'Kayıt yapılamadı.'
      setError(msg)
      // Hata tipine göre şık dialog
      if (msg.includes('kayıtlı') || msg.includes('zaten')) {
        showErrorDialog('📧 E-posta Kullanımda', 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin veya başka bir e-posta kullanın.')
      } else if (msg.includes('şifre') || msg.includes('password')) {
        showErrorDialog('🔐 Şifre Hatası', 'Şifre en az 6 karakter olmalıdır.')
      } else if (msg.includes('telefon')) {
        showErrorDialog('📱 Telefon Hatası', 'Geçerli bir telefon numarası girin. (Örn: +905321234567)')
      } else if (msg.includes('e-posta') || msg.includes('email')) {
        showErrorDialog('📧 E-posta Hatası', 'Geçerli bir e-posta adresi girin.')
      } else if (msg.includes('Çok fazla')) {
        showErrorDialog('⏱️ Çok Fazla Deneme', 'Çok fazla kayıt denemesi. Lütfen bekleyin.')
      } else {
        showErrorDialog('❌ Kayıt Hatası', msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: 'worker' | 'employer') => {
    if (role === 'worker') {
      setLoginEmail('worker1@example.com')
      setLoginPassword('123456')
    } else {
      setLoginEmail('ahmet@insaat.com')
      setLoginPassword('123456')
    }
    setTab('login')
  }

  const handleGoogleLogin = async () => {
    setError('')
    try {
      if (!GOOGLE_CLIENT_ID) {
        toast.info('Google OAuth henüz yapılandırılmamış.', {
          description: '.env dosyasına NEXT_PUBLIC_GOOGLE_CLIENT_ID ekleyin.',
        })
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
      const result = await authApi.forgotPassword(forgotEmail)
      setForgotPreview(result.preview || '')
      setForgotStep('reset')
      toast.success('Kod e-posta adresinize gönderildi!')
    } catch (err: any) {
      const msg = err.message || 'Kod gönderilemedi.'
      if (msg.includes('bulunamadı')) {
        showErrorDialog('📧 Kullanıcı Bulunamadı', 'Bu e-posta adresi ile kayıtlı kullanıcı yok. Kayıt olmayı deneyin.')
      } else if (msg.includes('Çok fazla')) {
        showErrorDialog('⏱️ Çok Fazla İstek', 'Çok fazla sıfırlama isteği gönderdiniz. Lütfen bir saat bekleyin.')
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
    setForgotPreview('')
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 flex items-center justify-center p-4">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-teal-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className={`relative w-full max-w-5xl grid lg:grid-cols-2 gap-6 items-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* ============= SOL: BRAND & INFO ============= */}
        <div className="hidden lg:flex flex-col text-white p-8 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 shadow-2xl">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">Günübirlik İş Bul</h1>
              <p className="text-emerald-100 text-sm">Konum Bazlı İş Platformu</p>
            </div>
          </div>

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

        {/* ============= SAĞ: AUTH CARD ============= */}
        <div className="w-full max-w-md mx-auto lg:mx-0">
          <Card className="shadow-2xl border-white/40 backdrop-blur-xl bg-white/95 overflow-hidden">
            {/* Mobile header */}
            <div className="lg:hidden bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur border border-white/30 mb-3">
                <Briefcase className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-bold">Günübirlik İş Bul</h1>
              <p className="text-emerald-100 text-xs mt-1">Konum Bazlı İş Platformu</p>
            </div>

            <CardContent className="p-5 sm:p-7">
              {/* Tab Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError('') }}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    tab === 'login'
                      ? 'bg-white text-emerald-700 shadow-sm scale-105'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Giriş Yap
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError('') }}
                  className={`py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    tab === 'register'
                      ? 'bg-white text-emerald-700 shadow-sm scale-105'
                      : 'text-gray-500 hover:text-gray-700'
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
                <form onSubmit={handleLogin} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-gray-900">Tekrar hoş geldiniz 👋</h2>
                    <p className="text-sm text-gray-500">Hesabınıza giriş yapın</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold text-gray-700">E-posta</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-semibold text-gray-700">Şifre</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10 pr-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-600 hover:text-gray-800">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                      Beni hatırla
                    </label>
                    <button type="button" onClick={() => setForgotOpen(true)} className="text-emerald-600 hover:text-emerald-700 font-medium">
                      Şifremi unuttum
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 group"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <>
                        Giriş Yap
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>

                  {/* Google ile giriş */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-gray-500">veya</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-gray-300 hover:bg-gray-50"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google ile Giriş Yap
                  </Button>

                  {!GOOGLE_CLIENT_ID && (
                    <p className="text-[10px] text-amber-600 text-center mt-2">
                      ⚠️ Demo modu: .env dosyasına NEXT_PUBLIC_GOOGLE_CLIENT_ID ekleyin
                    </p>
                  )}

                  {/* Demo accounts */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-[11px] text-gray-500 font-medium mb-2 text-center">Demo hesaplarla hızlı giriş</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fillDemo('worker')}
                        className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                          <User className="w-4 h-4 text-emerald-700" />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-700">İşçi</span>
                        <span className="text-[9px] text-gray-500">worker1@...</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fillDemo('employer')}
                        className="flex flex-col items-center gap-1 p-2.5 rounded-lg border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
                      >
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                          <Building2 className="w-4 h-4 text-amber-700" />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-700">İşveren</span>
                        <span className="text-[9px] text-gray-500">ahmet@...</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ============= REGISTER FORM ============= */}
              {tab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-1.5">
                    <h2 className="text-xl font-bold text-gray-900">Aramıza katılın ✨</h2>
                    <p className="text-sm text-gray-500">Hesabınızı oluşturun, hemen başlayın</p>
                  </div>

                  {/* Role selector - Modern card style */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('WORKER')}
                      className={`relative p-3 rounded-xl border-2 transition-all duration-300 group ${
                        regRole === 'WORKER'
                          ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/20'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      {regRole === 'WORKER' && (
                        <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-emerald-600" />
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                        regRole === 'WORKER' ? 'bg-emerald-100' : 'bg-gray-100 group-hover:bg-emerald-50'
                      }`}>
                        <User className={`w-5 h-5 ${regRole === 'WORKER' ? 'text-emerald-700' : 'text-gray-500'}`} />
                      </div>
                      <div className={`text-sm font-semibold ${regRole === 'WORKER' ? 'text-emerald-900' : 'text-gray-700'}`}>
                        İş Arıyorum
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">İş bul, kazan</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegRole('EMPLOYER')}
                      className={`relative p-3 rounded-xl border-2 transition-all duration-300 group ${
                        regRole === 'EMPLOYER'
                          ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-500/20'
                          : 'border-gray-200 hover:border-amber-300'
                      }`}
                    >
                      {regRole === 'EMPLOYER' && (
                        <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-amber-600" />
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                        regRole === 'EMPLOYER' ? 'bg-amber-100' : 'bg-gray-100 group-hover:bg-amber-50'
                      }`}>
                        <Building2 className={`w-5 h-5 ${regRole === 'EMPLOYER' ? 'text-amber-700' : 'text-gray-500'}`} />
                      </div>
                      <div className={`text-sm font-semibold ${regRole === 'EMPLOYER' ? 'text-amber-900' : 'text-gray-700'}`}>
                        İşçi Arıyorum
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">İlan ver, işçi bul</div>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-fullname" className="text-xs font-semibold text-gray-700">Ad Soyad</Label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                      <Input
                        id="reg-fullname"
                        placeholder="Adınız Soyadınız"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-xs font-semibold text-gray-700">E-posta</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="ornek@email.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone" className="text-xs font-semibold text-gray-700">Telefon</Label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                        <Input
                          id="reg-phone"
                          placeholder="+90 5XX..."
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-xs font-semibold text-gray-700">Şifre</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                        <Input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 6 karakter"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-sm"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {regRole === 'EMPLOYER' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="reg-company" className="text-xs font-semibold text-gray-700">Şirket Adı</Label>
                      <div className="relative group">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-amber-600 transition-colors" />
                        <Input
                          id="reg-company"
                          placeholder="Şirketinizin adı"
                          value={regCompanyName}
                          onChange={(e) => setRegCompanyName(e.target.value)}
                          className="pl-10 h-12 border-gray-200 focus:border-amber-500 focus:ring-amber-500/20 transition-all"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-gray-700">Şehir</Label>
                      <Select value={regCity} onValueChange={setRegCity}>
                        <SelectTrigger className="h-12 border-gray-200 focus:border-emerald-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya'].map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-district" className="text-xs font-semibold text-gray-700">İlçe</Label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                        <Input
                          id="reg-district"
                          placeholder="İlçe"
                          value={regDistrict}
                          onChange={(e) => setRegDistrict(e.target.value)}
                          className="pl-10 h-12 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className={`w-full h-12 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 group ${
                      regRole === 'WORKER'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/30'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30'
                    }`}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <>
                        Kayıt Ol
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>

                  {/* Google ile kayıt */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-gray-500">veya</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 border-gray-300 hover:bg-gray-50"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google ile Kayıt Ol
                  </Button>

                  {!GOOGLE_CLIENT_ID && (
                    <p className="text-[10px] text-amber-600 text-center mt-2">
                      ⚠️ Demo modu: .env dosyasına NEXT_PUBLIC_GOOGLE_CLIENT_ID ekleyin
                    </p>
                  )}

                  <p className="text-[11px] text-center text-gray-500">
                    Kayıt olarak <a href="#" className="text-emerald-600 hover:underline">Kullanım Şartları</a> ve <a href="#" className="text-emerald-600 hover:underline">Gizlilik Politikası</a>'nı kabul edersiniz.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Mobile footer */}
          <p className="text-center text-xs text-white/80 mt-4">
            © 2024 Günübirlik İş Bul — Türkiye'nin günlük iş platformu
          </p>
        </div>
      </div>

      {/* ============= ERROR DIALOG (tüm hatalar için) ============= */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{errorDialog.title}</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6"
              onClick={() => setErrorDialog({ ...errorDialog, open: false })}
            >
              Tamam, Anladım
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============= 2FA LOGIN DIALOG ============= */}
      <Dialog open={showTwoFactor} onOpenChange={(open) => { if (!open) cancelTwoFactor() }}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              İki Faktörlü Doğrulama
            </DialogTitle>
            <DialogDescription className="text-sm">
              Google Authenticator, Authy veya Microsoft Authenticator uygulamanızdaki 6 haneli kodu girin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleTwoFactorLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Doğrulama Kodu</Label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                autoFocus
                autoComplete="one-time-code"
              />
              <p className="text-xs text-gray-500 text-center">
                Kodu 6 haneli olarak girin
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={cancelTwoFactor}
              >
                İptal
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700"
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

            <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
              <strong className="text-blue-800">💡 Backup kod:</strong> Eğer telefonunuza erişemiyorsanız, 2FA kurarken aldığınız backup kodlarından birini kullanabilirsiniz.
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============= ŞİFRE SIFIRLAMA DIALOG ============= */}
      <Dialog open={forgotOpen} onOpenChange={(open) => { setForgotOpen(open); if (!open) resetForgotState() }}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Şifre Sıfırlama</DialogTitle>
            <DialogDescription className="text-sm">
              {forgotStep === 'email' && 'E-posta adresinize sıfırlama kodu göndereceğiz.'}
              {forgotStep === 'reset' && 'E-postanıza gelen kodu ve yeni şifrenizi girin.'}
              {forgotStep === 'done' && 'Şifreniz başarıyla sıfırlandı.'}
            </DialogDescription>
          </DialogHeader>

          {forgotStep === 'email' && (
            <form onSubmit={handleForgotRequest} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">E-posta Adresi</Label>
                <Input
                  type="email"
                  placeholder="ornek@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700" disabled={forgotLoading}>
                {forgotLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Kod Gönder
              </Button>
            </form>
          )}

          {forgotStep === 'reset' && (
            <form onSubmit={handleForgotReset} className="space-y-4">
              {forgotPreview && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Demo Modu:</strong> {forgotPreview}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-sm">Doğrulama Kodu</Label>
                <Input
                  placeholder="6 haneli kod"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value)}
                  className="h-11 text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Yeni Şifre</Label>
                <Input
                  type="password"
                  placeholder="Min 6 karakter"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 bg-emerald-600 hover:bg-emerald-700" disabled={forgotLoading}>
                {forgotLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Şifreyi Sıfırla
              </Button>
            </form>
          )}

          {forgotStep === 'done' && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Şifreniz güncellendi!</h3>
              <p className="text-sm text-gray-500 mb-4">Yeni şifrenizle giriş yapabilirsiniz.</p>
              <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700" onClick={resetForgotState}>
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
