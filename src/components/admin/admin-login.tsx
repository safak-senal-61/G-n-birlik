'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import Logo from '@/components/shared/logo'
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Terminal,
  CheckCircle2,
  Globe,
} from 'lucide-react'

export default function AdminLogin() {
  const router = useRouter()
  const { setAuth } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await adminFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (!res.data?.user) throw new Error('Giriş başarısız')
      if (res.data.user.role !== 'ADMIN') {
        throw new Error('Bu hesap yönetici yetkisine sahip değil.')
      }
      setAuth(res.data.token, {
        userId: res.data.user.id,
        email: res.data.user.email,
        role: res.data.user.role,
        fullName: res.data.user.fullName,
      })
      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'Giriş yapılamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#0C0E0D] text-[#111312] dark:text-[#F3F4F3] flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle architectural grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #E2E0D8 1px, transparent 1px), linear-gradient(to bottom, #E2E0D8 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top System Strip */}
      <header className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between py-2 border-b border-[#E2E0D8] dark:border-[#252B28]">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" variant="icon" showText={false} />
          <div>
            <p className="text-xs font-extrabold tracking-tight text-[#111312] dark:text-[#F3F4F3]">
              GÜNÜBİRLİK İŞ BUL
            </p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#5A605D] dark:text-[#8E9893]">
              SYS-ADMIN // KONTROL MERKEZİ
            </p>
          </div>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] text-[11px] font-mono font-bold text-[#5A605D] dark:text-[#8E9893] hover:text-[#0D6847] hover:border-[#0D6847]/40 transition-colors"
        >
          <Globe className="w-3.5 h-3.5 text-[#0D6847]" />
          ANA SİTEYE DÖN
        </a>
      </header>

      {/* Main Ledger Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto my-8">
        <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md overflow-hidden shadow-sm">
          {/* Card Top Ledger Bar */}
          <div className="px-5 sm:px-6 py-3.5 bg-[#EFECE6] dark:bg-[#1A1E1C] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#0D6847]" />
              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#0D6847] dark:text-[#27AB78]">
                01 / YÖNETİCİ KİMLİK DOĞRULAMA
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#5A605D] dark:text-[#8E9893]">
              AUTH-V2
            </span>
          </div>

          <div className="p-5 sm:p-7">
            <div className="flex items-start gap-3.5 mb-6 pb-5 border-b border-[#E2E0D8] dark:border-[#252B28]">
              <div className="w-11 h-11 rounded-md bg-[#0D6847] text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#111312] dark:text-[#F3F4F3]">
                  Yönetim & Moderasyon Paneli
                </h1>
                <p className="text-xs text-[#5A605D] dark:text-[#8E9893] mt-0.5 leading-relaxed">
                  İlan onayları, cüzdan mutabakatı, SEO & Blog yönetimi ve sistem denetim kayıtları.
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#5A605D] dark:text-[#8E9893] mb-1.5">
                  YÖNETİCİ E-POSTA ADRESİ
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A605D]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] rounded-md text-sm text-[#111312] dark:text-[#F3F4F3] placeholder-[#5A605D]/60 focus:outline-none focus:border-[#0D6847]"
                    placeholder="admin@gunubirlik.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#5A605D] dark:text-[#8E9893] mb-1.5">
                  GÜVENLİK ANAHTARI / ŞİFRE
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A605D]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-11 bg-[#F6F5F2] dark:bg-[#0C0E0D] border border-[#E2E0D8] dark:border-[#252B28] rounded-md text-sm text-[#111312] dark:text-[#F3F4F3] placeholder-[#5A605D]/60 focus:outline-none focus:border-[#0D6847]"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A605D] hover:text-[#111312] dark:hover:text-[#F3F4F3] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 p-3 bg-[#C84B31]/10 border border-[#C84B31]/30 rounded-md text-[#C84B31] text-xs font-medium">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#0D6847] hover:bg-[#094D34] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    DOĞRULANIYOR...
                  </>
                ) : (
                  <>
                    YÖNETİM PANELİNE GİRİŞ YAP
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-[#E2E0D8] dark:border-[#252B28] grid grid-cols-2 gap-2 text-[10px] font-mono text-[#5A605D] dark:text-[#8E9893]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#0D6847]" />
                <span>JWT + RBAC KORUMALI</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Terminal className="w-3.5 h-3.5 text-[#C84B31]" />
                <span>DENETİM KAYDI AKTİF</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <footer className="relative z-10 max-w-5xl w-full mx-auto py-2 border-t border-[#E2E0D8] dark:border-[#252B28] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-[#5A605D] dark:text-[#8E9893]">
        <span>© {new Date().getFullYear()} GÜNÜBİRLİK İŞ BUL — MİMARİ KAYIT DEFTERİ SİSTEMİ</span>
        <span>TR-81 // TÜM İŞLEMLER LOGLANMAKTADIR</span>
      </footer>
    </div>
  )
}
