'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'
import { authApi, jobsApi, applicationsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Star, MapPin, Phone, Mail, Building2, Briefcase,
  Clock, Wallet, Save, Loader2, Edit3, Award, TrendingUp, Calendar,
  Shield, Smartphone, Camera, Key, Lock, CheckCircle2, X, AlertCircle,
  Copy, QrCode, ArrowRight, ShieldCheck, Check, Sparkles, User,
  ChevronRight, LogOut, BadgeCheck, CheckCircle, FileText, Plus, Sun, Moon
} from 'lucide-react'
import { initials, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/shared/theme-toggle'

const POPULAR_SKILLS = [
  'Garsonluk', 'Komi', 'Bulaşıkçı', 'Aşçı Yardımcısı',
  'Temizlik', 'Ev Temizliği', 'İnşaat Sonrası Temizlik',
  'Kurye', 'Paket Servis', 'Depo & Lojistik', 'Yükleme & Boşaltma',
  'Boya & Badana', 'Elektrik', 'Sıhhi Tesisat', 'Kaynak',
  'Bahçıvanlık', 'İnşaat İşçisi', 'Taşıma & Nakliye', 'Stand & Tanıtım'
]

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuth()
  const { go } = useApp()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<any>({})

  // Hızlı Biyografi Düzenleme (Inline)
  const [editingBio, setEditingBio] = useState(false)
  const [bioDraft, setBioDraft] = useState(user?.bio || '')
  const [savingBio, setSavingBio] = useState(false)

  // Hızlı Yetenek Düzenleme (Inline)
  const [editingSkills, setEditingSkills] = useState(false)
  const [skillsDraft, setSkillsDraft] = useState<string[]>(user?.skills || [])
  const [skillInput, setSkillInput] = useState('')
  const [savingSkills, setSavingSkills] = useState(false)

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    city: user?.city || '',
    district: user?.district || '',
    address: user?.address || '',
    skills: (user?.skills || []).join(', '),
    experienceYears: user?.experienceYears || 0,
    hourlyWageMin: user?.hourlyWageMin || 0,
    hourlyWageMax: user?.hourlyWageMax || 0,
    isAvailable: user?.isAvailable ?? true,
    companyName: user?.companyName || '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        bio: user.bio || '',
        city: user.city || '',
        district: user.district || '',
        address: user.address || '',
        skills: (user.skills || []).join(', '),
        experienceYears: user.experienceYears || 0,
        hourlyWageMin: user.hourlyWageMin || 0,
        hourlyWageMax: user.hourlyWageMax || 0,
        isAvailable: user.isAvailable ?? true,
        companyName: user.companyName || '',
      })
      setBioDraft(user.bio || '')
      setSkillsDraft(user.skills || [])
    }
  }, [user])

  const [securityInfo, setSecurityInfo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'security'>('info')

  // Şifre değiştirme
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)

  // E-posta değiştirme
  const [emailForm, setEmailForm] = useState({ newEmail: '', code: '' })
  const [emailStep, setEmailStep] = useState<'request' | 'confirm'>('request')
  const [emailLoading, setEmailLoading] = useState(false)

  // E-posta doğrulama (OTP)
  const [verifyDialog, setVerifyDialog] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifySent, setVerifySent] = useState(false)

  // 2FA
  const [twoFADialog, setTwoFADialog] = useState(false)
  const [twoFAStep, setTwoFAStep] = useState<'setup' | 'verify' | 'backup'>('setup')
  const [twoFAQrCode, setTwoFAQrCode] = useState('')
  const [twoFASecret, setTwoFASecret] = useState('')
  const [twoFABackupCodes, setTwoFABackupCodes] = useState<string[]>([])
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [disable2FADialog, setDisable2FADialog] = useState(false)
  const [disable2FACode, setDisable2FACode] = useState('')

  // Avatar
  const [avatarLoading, setAvatarLoading] = useState(false)

  useEffect(() => {
    loadStats()
    loadSecurityInfo()
  }, [user])

  const loadSecurityInfo = async () => {
    if (!user) return
    try {
      const info = await authApi.getSecurityInfo()
      setSecurityInfo(info)
    } catch {}
  }

  const loadStats = async () => {
    if (!user) return
    try {
      if (user.role === 'WORKER') {
        const apps = await applicationsApi.mine()
        setStats({
          total: apps.length,
          accepted: apps.filter((a: any) => a.status === 'ACCEPTED').length,
          completed: apps.filter((a: any) => a.status === 'COMPLETED').length,
        })
      } else if (user.role === 'EMPLOYER') {
        const result = await jobsApi.list({ pageSize: 50 } as any)
        const myJobs = (result.items || []).filter((j: any) => j.employerId === user.id)
        setStats({
          totalJobs: myJobs.length || result.pagination?.total || 0,
          activeJobs: myJobs.filter((j: any) => j.status === 'OPEN').length,
          totalApplications: myJobs.reduce((sum: number, j: any) => sum + (j.applicationCount || 0), 0),
        })
      }
    } catch {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const skillsArray = form.skills.split(',').map((s) => s.trim()).filter(Boolean)
      const updated = await authApi.updateProfile({
        fullName: form.fullName,
        phone: form.phone,
        bio: form.bio,
        city: form.city,
        district: form.district,
        address: form.address,
        skills: skillsArray,
        experienceYears: Number(form.experienceYears) || 0,
        hourlyWageMin: Number(form.hourlyWageMin) || 0,
        hourlyWageMax: Number(form.hourlyWageMax) || 0,
        isAvailable: form.isAvailable,
        companyName: form.companyName,
      })
      updateUser(updated)
      toast.success('Profil bilgileriniz başarıyla güncellendi!')
      setEditing(false)
      setActiveTab('info')
    } catch (err: any) {
      toast.error(err.message || 'Güncelleme başarısız oldu')
    } finally {
      setSaving(false)
    }
  }

  // Hızlı Biyografi Kaydetme (Inline)
  const handleSaveBio = async () => {
    setSavingBio(true)
    try {
      const updated = await authApi.updateProfile({
        fullName: user?.fullName,
        phone: user?.phone,
        city: user?.city,
        district: user?.district,
        address: user?.address,
        companyName: user?.companyName,
        bio: bioDraft.trim(),
      })
      updateUser(updated)
      setForm((prev) => ({ ...prev, bio: bioDraft.trim() }))
      toast.success('Hakkında & Deneyim özeti güncellendi!')
      setEditingBio(false)
    } catch (err: any) {
      toast.error(err.message || 'Biyografi kaydedilemedi.')
    } finally {
      setSavingBio(false)
    }
  }

  // Hızlı Yetenek Ekleme / Çıkarma / Kaydetme (Inline)
  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim()
    if (!trimmed) return
    if (skillsDraft.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.info('Bu uzmanlık alanı zaten ekli.')
      return
    }
    setSkillsDraft((prev) => [...prev, trimmed])
    setSkillInput('')
  }

  const handleRemoveSkill = (skill: string) => {
    setSkillsDraft((prev) => prev.filter((s) => s !== skill))
  }

  const handleToggleSkill = (skill: string) => {
    if (skillsDraft.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setSkillsDraft((prev) => prev.filter((s) => s.toLowerCase() !== skill.toLowerCase()))
    } else {
      setSkillsDraft((prev) => [...prev, skill])
    }
  }

  const handleSaveSkills = async () => {
    setSavingSkills(true)
    try {
      const updated = await authApi.updateProfile({
        fullName: user?.fullName,
        phone: user?.phone,
        city: user?.city,
        district: user?.district,
        address: user?.address,
        companyName: user?.companyName,
        skills: skillsDraft,
      })
      updateUser(updated)
      setForm((prev) => ({ ...prev, skills: skillsDraft.join(', ') }))
      toast.success('Uzmanlık ve yetenekleriniz kaydedildi!')
      setEditingSkills(false)
    } catch (err: any) {
      toast.error(err.message || 'Yetenekler kaydedilemedi.')
    } finally {
      setSavingSkills(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Sadece JPG, PNG ve WebP formatları desteklenir.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Dosya boyutu 2MB\'ı geçemez.')
      return
    }

    setAvatarLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const result = reader.result as string
        const base64 = result.split(',')[1]
        try {
          const res = await authApi.uploadAvatar(base64, file.type)
          updateUser({ avatarUrl: res.avatarUrl })
          toast.success('Profil fotoğrafınız güncellendi!')
        } catch (err: any) {
          toast.error(err.message || 'Fotoğraf yüklenemedi')
        } finally {
          setAvatarLoading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      toast.error(err.message)
      setAvatarLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (pwForm.next !== pwForm.confirm) {
      toast.error('Yeni şifreler birbiriyle eşleşmiyor.')
      return
    }
    if (pwForm.next.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalıdır.')
      return
    }
    setPwLoading(true)
    try {
      await authApi.changePassword(pwForm.current, pwForm.next)
      toast.success('Şifreniz başarıyla güncellendi!')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.message || 'Şifre güncellenemedi')
    } finally {
      setPwLoading(false)
    }
  }

  const handleEmailChangeRequest = async () => {
    setEmailLoading(true)
    try {
      await authApi.requestEmailChange(emailForm.newEmail)
      setEmailStep('confirm')
      toast.success('Doğrulama kodu yeni e-posta adresinize gönderildi!')
    } catch (err: any) {
      toast.error(err.message || 'Kod gönderilemedi')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleEmailChangeConfirm = async () => {
    setEmailLoading(true)
    try {
      const result = await authApi.confirmEmailChange(emailForm.code)
      updateUser({ email: result.email, emailVerified: true })
      toast.success('E-posta adresiniz güncellendi!')
      setEmailForm({ newEmail: '', code: '' })
      setEmailStep('request')
      loadSecurityInfo()
    } catch (err: any) {
      toast.error(err.message || 'Doğrulama başarısız')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleSendVerifyOtp = async () => {
    setVerifyLoading(true)
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user!.email, type: 'EMAIL_ACTIVATION' }),
      })
      const data = await res.json()
      if (data.success) {
        setVerifySent(true)
        toast.success('Doğrulama kodu e-posta adresinize gönderildi!')
      } else {
        toast.error(data.error || 'Kod gönderilemedi')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (verifyCode.length !== 6) {
      toast.error('Lütfen 6 haneli doğrulama kodunu girin.')
      return
    }
    setVerifyLoading(true)
    try {
      const res = await fetch('/api/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user!.email, code: verifyCode }),
      })
      const data = await res.json()
      if (data.success) {
        updateUser({ emailVerified: true })
        toast.success('E-posta adresiniz başarıyla doğrulandı! ✅')
        setVerifyDialog(false)
        setVerifyCode('')
        setVerifySent(false)
      } else {
        toast.error(data.error || 'Doğrulama başarısız oldu')
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleSetup2FA = async () => {
    setTwoFALoading(true)
    try {
      const result = await authApi.setup2FA()
      setTwoFAQrCode(result.qrCode)
      setTwoFASecret(result.secret)
      setTwoFABackupCodes(result.backupCodes)
      setTwoFAStep('setup')
      setTwoFADialog(true)
    } catch (err: any) {
      toast.error(err.message || '2FA kurulumu başlatılamadı')
    } finally {
      setTwoFALoading(false)
    }
  }

  const handleVerify2FA = async () => {
    setTwoFALoading(true)
    try {
      await authApi.verify2FA(twoFACode)
      toast.success('2FA koruması başarıyla aktif edildi! 🎉')
      setTwoFADialog(false)
      setTwoFACode('')
      loadSecurityInfo()
    } catch (err: any) {
      toast.error(err.message || 'Kod doğrulanamadı')
    } finally {
      setTwoFALoading(false)
    }
  }

  const handleDisable2FA = async () => {
    setTwoFALoading(true)
    try {
      await authApi.disable2FA(disable2FACode)
      toast.success('2FA koruması devre dışı bırakıldı.')
      setDisable2FADialog(false)
      setDisable2FACode('')
      loadSecurityInfo()
    } catch (err: any) {
      toast.error(err.message || 'İşlem başarısız oldu')
    } finally {
      setTwoFALoading(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(twoFABackupCodes.join('\n'))
    toast.success('Yedek kodlar panoya kopyalandı!')
  }

  if (!user) return null

  const isWorker = user.role === 'WORKER'
  const isEmployer = user.role === 'EMPLOYER'
  const displayName = isEmployer && user.companyName ? user.companyName : user.fullName

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* 1. HERO BAŞLIK & PROFİL KARTI */}
      {/* ============================================================== */}
      <div className="card-3d-spatial relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900/90 shadow-xl shadow-slate-200/40 dark:shadow-black/60 transition-all">
        {/* Banner Arka Planı (Modern Mesh & Gradient Glow) */}
        <div className="h-36 sm:h-48 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
          {/* Soyut Işık Halkaları */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 -left-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

          {/* Banner Üstü Hızlı Aksiyonlar */}
          <div className="absolute top-3.5 sm:top-4 inset-x-3.5 sm:inset-x-6 flex items-center justify-between z-10">
            <button
              onClick={() => go('wallet')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/25 hover:bg-black/40 text-white text-xs font-medium backdrop-blur-md border border-white/20 transition-all hover:scale-105"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Cüzdanıma Git</span>
            </button>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/30 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>{isWorker ? 'İş Arayan Profili' : isEmployer ? 'İşveren Profili' : 'Admin Profili'}</span>
            </div>
          </div>
        </div>

        {/* Profil İçeriği & Avatar Alanı */}
        <div className="px-4 sm:px-8 pb-6 sm:pb-8 pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
            {/* Avatar & Canlı Durum */}
            <div className="relative group">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-1 bg-white dark:bg-slate-900 shadow-2xl ring-4 ring-slate-100 dark:ring-slate-800">
                <Avatar className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-tr from-emerald-500 to-teal-400">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-tr from-emerald-600 to-teal-500 text-white text-3xl sm:text-4xl font-black">
                      {initials(displayName)}
                    </AvatarFallback>
                  )}
                </Avatar>

                {/* Fotoğraf Değiştirme Butonu */}
                <label className="absolute bottom-1 right-1 p-2 rounded-xl bg-slate-900/90 hover:bg-emerald-600 text-white shadow-lg cursor-pointer transition-all duration-200 transform hover:scale-110 border-2 border-white dark:border-slate-800">
                  {avatarLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={avatarLoading}
                  />
                </label>
              </div>

              {/* İş Arama / Canlı Durum Noktası */}
              {isWorker && (
                <div
                  className={`absolute top-0 right-0 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 shadow-md flex items-center justify-center ${
                    user.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                  title={user.isAvailable ? 'İş tekliflerine açık' : 'Şu anda meşgul'}
                >
                  <span className={`w-2 h-2 rounded-full bg-white ${user.isAvailable ? 'animate-ping' : ''}`} />
                </div>
              )}
            </div>

            {/* Sağ Buton Grubu */}
            <div className="flex items-center gap-2.5 self-center sm:self-end w-full sm:w-auto">
              <Button
                variant={editing ? 'secondary' : 'default'}
                onClick={() => {
                  if (editing) {
                    setEditing(false)
                    setActiveTab('info')
                  } else {
                    setEditing(true)
                    setActiveTab('edit')
                  }
                }}
                className={`flex-1 sm:flex-initial h-10 px-5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                  editing
                    ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                }`}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {editing ? 'Önizlemeye Dön' : 'Profili Düzenle'}
              </Button>
            </div>
          </div>

          {/* İsim ve Özet Bilgiler */}
          <div className="mt-4 sm:mt-5 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {displayName}
              </h1>

              {user.isVerified && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold shadow-xs">
                  <BadgeCheck className="w-3.5 h-3.5 fill-blue-500 text-white" />
                  <span>Onaylı Profil</span>
                </div>
              )}

              {isWorker && user.isAvailable && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  İş Tekliflerine Açık
                </span>
              )}
            </div>

            {isEmployer && user.fullName && user.companyName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex items-center justify-center sm:justify-start gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Yetkili: {user.fullName}
              </p>
            )}

            {/* Rozet ve Sinyal Şeritleri */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="inline-flex items-center gap-1.5 bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-800/60 px-2.5 py-1 rounded-xl font-semibold text-amber-800 dark:text-amber-300">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{user.ratingAvg ? Number(user.ratingAvg).toFixed(1) : '5.0'}</span>
                <span className="text-amber-600 dark:text-amber-400 font-normal">({user.ratingCount || 0} değerlendirme)</span>
              </div>

              {(user.city || user.district) && (
                <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 px-2.5 py-1 rounded-xl text-slate-700 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{[user.district, user.city].filter(Boolean).join(', ')}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 px-2.5 py-1 rounded-xl text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Katılım: {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. İSTATİSTİK KARTLARI (BENTO GRID) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {isWorker ? (
          <>
            <StatCard
              label="Toplam Başvuru"
              value={stats.total || 0}
              icon={Briefcase}
              color="bg-blue-500/10 text-blue-600 border-blue-200/70"
            />
            <StatCard
              label="Onaylanan İş"
              value={stats.accepted || 0}
              icon={Award}
              color="bg-teal-500/10 text-teal-600 border-teal-200/70"
            />
            <StatCard
              label="Tamamlanan"
              value={stats.completed || 0}
              icon={TrendingUp}
              color="bg-emerald-500/10 text-emerald-600 border-emerald-200/70"
            />
            <StatCard
              label="Deneyim Yılı"
              value={user.experienceYears ? `${user.experienceYears} Yıl` : '1 Yıl'}
              icon={Sparkles}
              color="bg-purple-500/10 text-purple-600 border-purple-200/70"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Toplam İlan"
              value={stats.totalJobs || 0}
              icon={Briefcase}
              color="bg-blue-500/10 text-blue-600 border-blue-200/70"
            />
            <StatCard
              label="Aktif İlanlar"
              value={stats.activeJobs || 0}
              icon={Clock}
              color="bg-emerald-500/10 text-emerald-600 border-emerald-200/70"
            />
            <StatCard
              label="Gelen Başvurular"
              value={stats.totalApplications || 0}
              icon={Award}
              color="bg-teal-500/10 text-teal-600 border-teal-200/70"
            />
            <StatCard
              label="İşveren Puanı"
              value={user.ratingAvg ? `${Number(user.ratingAvg).toFixed(1)} ★` : '5.0 ★'}
              icon={Star}
              color="bg-amber-500/10 text-amber-600 border-amber-200/70"
            />
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. MODERN SEKMELER (TABS) */}
      {/* ============================================================== */}
      <Tabs
        value={editing ? 'edit' : activeTab}
        onValueChange={(v) => {
          if (v === 'edit') {
            setEditing(true)
          } else {
            setEditing(false)
            setActiveTab(v as 'info' | 'security')
          }
        }}
        className="w-full"
      >
        {/* Modern Segmented Navigation Bar */}
        <div className="bg-slate-100/90 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 backdrop-blur-md shadow-xs">
          <TabsList className="w-full grid grid-cols-3 bg-transparent h-auto p-0 gap-1">
            <TabsTrigger
              value="info"
              className="py-2.5 rounded-xl font-semibold text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-300 transition-all"
            >
              <User className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
              Genel Bakış
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="py-2.5 rounded-xl font-semibold text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-300 transition-all"
            >
              <Edit3 className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
              Düzenle
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="py-2.5 rounded-xl font-semibold text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm text-slate-600 dark:text-slate-300 transition-all"
            >
              <ShieldCheck className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400" />
              Güvenlik & 2FA
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* SEKME 1: GENEL BAKIŞ */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="info" className="space-y-4 mt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* İletişim Bilgileri Kartı (2 Kolon) */}
            <Card className="md:col-span-2 rounded-2xl border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm overflow-hidden card-3d-spatial">
              <CardHeader className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/10 py-3.5 px-5">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  İletişim & Lokasyon Bilgileri
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5">
                {/* E-posta Satırı */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">E-posta Adresi</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.email}</div>
                    </div>
                  </div>
                  {user.emailVerified ? (
                    <Badge className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Doğrulandı
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700/60 dark:text-amber-300 dark:hover:bg-amber-950/50"
                      onClick={() => { setVerifyDialog(true); setVerifySent(false); setVerifyCode('') }}
                    >
                      Doğrula
                    </Button>
                  )}
                </div>

                {/* Telefon Satırı */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-100/60 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Telefon Numarası</div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {user.phone || <span className="text-slate-400 dark:text-slate-500 font-normal">Belirtilmedi</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Adres Satırı */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-amber-100/60 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Açık Adres / Bölge</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 break-words">
                      {user.address || [user.district, user.city].filter(Boolean).join(', ') || (
                        <span className="text-slate-400 dark:text-slate-500 font-normal">Adres tanımlanmadı</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hızlı Bilgi & Durum Kartı (1 Kolon) */}
            <Card className="rounded-2xl border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm flex flex-col justify-between overflow-hidden card-3d-spatial">
              <CardHeader className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/10 py-3.5 px-5">
                <CardTitle className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Hesap Durumu
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4 flex-1">
                {isWorker && (
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40">
                    <div className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold mb-1">İş Arama Modu</div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                      İş arama modunu aktif tutarak işverenlerin size yeni iş teklifleri göndermesini sağlayabilirsiniz.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        {form.isAvailable ? 'Tekliflere Açık' : 'Şu Anda Meşgul'}
                      </span>
                      <Switch
                        checked={form.isAvailable}
                        onCheckedChange={async (v) => {
                          setForm({ ...form, isAvailable: v })
                          try {
                            const res = await authApi.updateProfile({ isAvailable: v })
                            updateUser(res)
                            toast.success(`İş durumu güncellendi: ${v ? 'Açık' : 'Meşgul'}`)
                          } catch {}
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Ücret Beklentisi Özeti */}
                {isWorker && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-white/10">
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Saatlik Ücret Beklentisi</div>
                    <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                      {user.hourlyWageMin || user.hourlyWageMax
                        ? `₺${user.hourlyWageMin || 0} - ₺${user.hourlyWageMax || 0} / saat`
                        : 'Belirtilmedi'}
                    </div>
                  </div>
                )}

                {isEmployer && (
                  <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-900 dark:text-blue-200">
                    <strong className="block mb-1 font-semibold">İşveren Paneli Avantajı:</strong>
                    İlanlarınızı yayınlayıp işçi başvurularını hemen kabul edebilir, iş başlangıcında QR kod üreterek mesaiyi yönetebilirsiniz.
                  </div>
                )}

                {/* Tema ve Görünüm Tercihi */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-white/10">
                  <div className="text-xs text-slate-800 dark:text-slate-200 font-bold mb-1 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tema ve Görünüm</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                    Göz yormayan karanlık mod ile aydınlık mod arasında tercih yapabilirsiniz.
                  </p>
                  <ThemeToggle variant="segmented" className="w-full justify-between" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hakkında / Biyografi Kartı */}
          <Card className="rounded-2xl border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm overflow-hidden transition-all card-3d-spatial">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/10 py-3.5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Hakkında & Deneyim Özeti
              </CardTitle>
              {!editingBio ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBioDraft(user.bio || '')
                    setEditingBio(true)
                  }}
                  className="h-8 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {user.bio ? 'Düzenle' : 'Biyografi Ekle'}
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBioDraft(user.bio || '')
                      setEditingBio(false)
                    }}
                    className="h-8 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    disabled={savingBio}
                  >
                    Vazgeç
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveBio}
                    disabled={savingBio}
                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                  >
                    {savingBio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Kaydet
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-5">
              {editingBio ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Biyografi & Kendinizi Tanıtın
                    </Label>
                    <Textarea
                      rows={4}
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      placeholder="Kendinizi, geçmiş iş deneyimlerinizi, yaptığınız işleri, güçlü yönlerinizi ve çalışma prensiplerinizi anlatın..."
                      className="rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 text-sm leading-relaxed"
                      autoFocus
                    />
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Detaylı açıklama profilinizin güvenilirliğini ve tercih edilme oranını artırır.</span>
                      <span>{bioDraft.length} karakter</span>
                    </div>
                  </div>

                  {/* Hızlı Şablonlar */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-white/10">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Hazır Şablonlar (Tek Tıkla Ekle):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        {
                          label: '💼 Genel Deneyim',
                          text: 'Disiplinli, dakik ve iş sorumluluğu yüksek bir çalışanım. Verilen görevleri titizlikle yerine getiririm. Ekip çalışmasına uyumluyum.',
                        },
                        {
                          label: '🛠️ Usta & Teknik',
                          text: 'Yılların getirdiği saha ve ustalık deneyimimle kaliteli ve güvenilir iş teslim ederim. Gerekli teknik ve el aletlerini profesyonelce kullanırım.',
                        },
                        {
                          label: '🍽️ Hizmet & Restoran',
                          text: 'Dinamik, hızlı ve güler yüzlüyüm. Kafe, restoran ve organizasyonlarda müşteri memnuniyetini ön planda tutarak hizmet veririm.',
                        },
                        {
                          label: '📦 Depo & Taşıma',
                          text: 'Fiziksel dayanıklılığı yüksek, dikkatli ve seri bir çalışanım. Yükleme, boşaltma, koli taşıma ve depo düzenleme işlerinde deneyimliyim.',
                        },
                      ].map((tpl) => (
                        <button
                          key={tpl.label}
                          type="button"
                          onClick={() => setBioDraft(tpl.text)}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:dark:bg-emerald-950/40 hover:text-emerald-700 hover:dark:text-emerald-300 hover:border-emerald-200 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-colors"
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBioDraft(user.bio || '')
                        setEditingBio(false)
                      }}
                      className="text-xs"
                      disabled={savingBio}
                    >
                      İptal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveBio}
                      disabled={savingBio}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                    >
                      {savingBio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Biyografiyi Kaydet
                    </Button>
                  </div>
                </div>
              ) : user.bio ? (
                <div className="group relative">
                  <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                    {user.bio}
                  </p>
                  <button
                    onClick={() => {
                      setBioDraft(user.bio || '')
                      setEditingBio(true)
                    }}
                    className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Edit3 className="w-3 h-3" /> Metni Düzenle
                  </button>
                </div>
              ) : (
                <div className="text-center py-7 text-slate-400 text-sm space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Henüz bir biyografi veya deneyim özeti eklemediniz.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Kendinizden ve deneyimlerinizden bahsederek profilinizi öne çıkarın.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setBioDraft('')
                      setEditingBio(true)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-xl gap-1.5 shadow-sm shadow-emerald-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Biyografi Eklemek İçin Tıklayın
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Uzmanlık & Yetenekler Kartı */}
          <Card className="rounded-2xl border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm overflow-hidden transition-all card-3d-spatial">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/10 py-3.5 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Uzmanlık & Yetenekler
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-bold">
                  {(editingSkills ? skillsDraft.length : (user.skills?.length || 0))} Yetenek
                </Badge>
                {!editingSkills ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSkillsDraft(user.skills || [])
                      setEditingSkills(true)
                    }}
                    className="h-8 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {(user.skills?.length || 0) > 0 ? 'Yetenek Ekle / Düzenle' : 'Yetenek Ekle'}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSkillsDraft(user.skills || [])
                        setEditingSkills(false)
                      }}
                      className="h-8 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      disabled={savingSkills}
                    >
                      Vazgeç
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSkills}
                      disabled={savingSkills}
                      className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm"
                    >
                      {savingSkills ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Kaydet
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {editingSkills ? (
                <div className="space-y-4">
                  {/* Yetenek Giriş Kutusu */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Yeni yetenek yazın (örn: Garsonluk, Boya Badana, Forklift)..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSkill(skillInput)
                        }
                      }}
                      className="h-10 text-xs sm:text-sm rounded-xl border-slate-200 dark:border-white/10 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500"
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddSkill(skillInput)}
                      className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex-shrink-0 gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ekle
                    </Button>
                  </div>

                  {/* Seçili Yetenekler */}
                  <div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                      <span>Profilinizde Görünecek Yetenekler:</span>
                      <span className="text-[11px] text-slate-400 font-normal">Silmek için ✕'e tıklayın</span>
                    </div>
                    {skillsDraft.length > 0 ? (
                      <div className="flex flex-wrap gap-2 p-3 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-white/10 min-h-[48px] items-center">
                        {skillsDraft.map((skill) => (
                          <div
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs font-semibold shadow-xs"
                          >
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-1 text-emerald-700 dark:text-emerald-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-0.5"
                              title="Sil"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 text-center">
                        Henüz hiç yetenek eklemediniz. Aşağıdaki popüler listeden seçebilir veya yukarıya yazabilirsiniz.
                      </div>
                    )}
                  </div>

                  {/* Popüler Yetenek Önerileri */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/10">
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Popüler Yeteneklerden Hızlıca Seçin:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SKILLS.map((s) => {
                        const isSelected = skillsDraft.some((item) => item.toLowerCase() === s.toLowerCase())
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => handleToggleSkill(s)}
                            className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10'
                            }`}
                          >
                            {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-slate-400" />}
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Kaydet ve İptal Butonları */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSkillsDraft(user.skills || [])
                        setEditingSkills(false)
                      }}
                      className="text-xs"
                      disabled={savingSkills}
                    >
                      İptal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSkills}
                      disabled={savingSkills}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm"
                    >
                      {savingSkills ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Değişiklikleri Kaydet
                    </Button>
                  </div>
                </div>
              ) : (user.skills?.length || 0) > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {user.skills?.map((skill: string) => (
                      <div
                        key={skill}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:border-emerald-300 hover:bg-emerald-50/40 hover:dark:bg-emerald-950/40 hover:dark:border-emerald-500/40 transition-colors"
                      >
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSkillsDraft(user.skills || [])
                      setEditingSkills(true)
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 hover:underline pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Yetenek Ekle veya Çıkar
                  </button>
                </div>
              ) : (
                <div className="text-center py-7 text-slate-400 text-sm space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Henüz uzmanlık alanı veya yetenek eklemediniz.</p>
                    <p className="text-xs text-slate-400 mt-0.5">İşverenlerin sizi doğru işlerle eşleştirmesi için bildiğiniz işleri ekleyin.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSkillsDraft([])
                      setEditingSkills(true)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-xl gap-1.5 shadow-sm shadow-emerald-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Uzmanlık & Yetenek Ekle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* SEKME 2: PROFİLİ DÜZENLE */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="edit" className="space-y-4 mt-5">
          <Card className="rounded-2xl border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/10 py-3.5 px-5">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Profil Bilgilerini Güncelle
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Profil bilgilerinizi güncelleyerek daha fazla iş veya güvenilir işçi bulabilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isEmployer ? 'Şirket / İşletme Adı' : 'Ad Soyad'}
                  </Label>
                  <Input
                    className="h-11 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                    value={isEmployer ? (form.companyName || form.fullName) : form.fullName}
                    onChange={(e) => isEmployer ? setForm({ ...form, companyName: e.target.value }) : setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Telefon Numarası</Label>
                  <Input
                    className="h-11 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+90 5XX..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Şehir</Label>
                  <Input
                    className="h-11 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="İstanbul, Ankara, vb."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">İlçe</Label>
                  <Input
                    className="h-11 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="Kadıköy, Çankaya, vb."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Açık Adres</Label>
                <Input
                  className="h-11 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Mahalle, cadde, sokak ve kapı no"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Hakkında / Açıklama</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                  placeholder="Kendinizden, çalışma prensiplerinizden veya tecrübelerinizden bahsedin..."
                />
              </div>

              {/* İşçiye Özel Ek Alanlar */}
              {isWorker && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/10 space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Yetenekler (virgülle ayırın)</Label>
                    <Input
                      className="h-11 rounded-xl focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                      value={form.skills}
                      onChange={(e) => setForm({ ...form, skills: e.target.value })}
                      placeholder="Örn: İnşaat, Boyacı, Garson, Temizlik, Taşıma"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tecrübe (Yıl)</Label>
                      <Input
                        type="number"
                        className="h-11 rounded-xl dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                        value={form.experienceYears}
                        onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Min. Saatlik Ücret (₺)</Label>
                      <Input
                        type="number"
                        className="h-11 rounded-xl dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                        value={form.hourlyWageMin}
                        onChange={(e) => setForm({ ...form, hourlyWageMin: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Max. Saatlik Ücret (₺)</Label>
                      <Input
                        type="number"
                        className="h-11 rounded-xl dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                        value={form.hourlyWageMax}
                        onChange={(e) => setForm({ ...form, hourlyWageMax: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800/40">
                    <div>
                      <Label className="font-semibold text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">İş Tekliflerine Açığım</Label>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-400">İşverenler profilinizi aktif iş arayan olarak görsün</p>
                    </div>
                    <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Değişiklikleri Kaydet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setEditing(false); setActiveTab('info') }}
                  className="h-11 rounded-xl text-slate-600 dark:text-slate-300 dark:border-white/10 dark:hover:bg-slate-800"
                >
                  Vazgeç
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* SEKME 3: GÜVENLİK & 2FA */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="security" className="space-y-4 mt-5">
          {/* 1. Şifre Değiştirme */}
          <Card className="rounded-2xl border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/10 py-3.5 px-5">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Giriş Şifresi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5">
              {securityInfo?.hasPassword === false ? (
                <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/40 rounded-xl text-xs sm:text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span>Google ile giriş yaptığınız için hesabınız doğrudan Google OAuth güvencesindedir. Şifre belirlemenize gerek yoktur.</span>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mevcut Şifre</Label>
                    <Input
                      type="password"
                      className="h-11 rounded-xl dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                      value={pwForm.current}
                      onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Yeni Şifre</Label>
                      <Input
                        type="password"
                        className="h-11 rounded-xl dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                        value={pwForm.next}
                        onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                        placeholder="En az 6 karakter"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Yeni Şifre (Tekrar)</Label>
                      <Input
                        type="password"
                        className="h-11 rounded-xl dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                        value={pwForm.confirm}
                        onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                        placeholder="Tekrar girin"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={pwLoading || !pwForm.current || !pwForm.next}
                    className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm"
                  >
                    {pwLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Şifreyi Güncelle
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* 2. E-posta Değiştirme */}
          <Card className="rounded-2xl border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/10 py-3.5 px-5">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                E-posta Adresi Yönetimi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-3.5">
              <div className="p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user.email}</span>
                </div>
                {user.emailVerified ? (
                  <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 text-[10px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Doğrulandı
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 text-[10px]">Doğrulanmamış</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      onClick={() => { setVerifyDialog(true); setVerifySent(false); setVerifyCode('') }}
                    >
                      Doğrula
                    </Button>
                  </div>
                )}
              </div>

              {emailStep === 'request' ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Yeni E-posta Adresi</Label>
                    <Input
                      type="email"
                      className="h-11 rounded-xl dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      placeholder="yeni@email.com"
                    />
                  </div>
                  <Button
                    onClick={handleEmailChangeRequest}
                    disabled={emailLoading || !emailForm.newEmail}
                    variant="outline"
                    className="w-full h-11 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 dark:border-white/10"
                  >
                    {emailLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    Değişiklik Kodunu Gönder
                  </Button>
                </>
              ) : (
                <>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                    Yeni e-posta adresinize gönderilen 6 haneli doğrulama kodunu girin.
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">6 Haneli Kod</Label>
                    <Input
                      className="h-12 rounded-xl text-center text-xl tracking-[0.3em] font-mono font-bold dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                      value={emailForm.code}
                      onChange={(e) => setEmailForm({ ...emailForm, code: e.target.value })}
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl text-sm dark:border-white/10 dark:hover:bg-slate-800 dark:text-slate-300"
                      onClick={() => setEmailStep('request')}
                    >
                      Geri
                    </Button>
                    <Button
                      onClick={handleEmailChangeConfirm}
                      disabled={emailLoading || !emailForm.code}
                      className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
                    >
                      {emailLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Onayla ve Değiştir
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 3. İki Faktörlü Doğrulama (2FA) */}
          <Card className="rounded-2xl border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-100 dark:border-white/10 py-3.5 px-5">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                İki Faktörlü Doğrulama (TOTP / 2FA)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className={`p-4 rounded-2xl flex items-center gap-3.5 ${
                securityInfo?.twoFactorEnabled
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40'
                  : 'bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-white/10'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  securityInfo?.twoFactorEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {securityInfo?.twoFactorEnabled ? '2FA Koruması Aktif' : '2FA Koruması Kapalı'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {securityInfo?.twoFactorEnabled
                      ? 'Hesabınız Google Authenticator / TOTP kodu ile korunuyor.'
                      : 'Giriş yaparken ek güvenlik kodu isteyerek hesabınızı koruyun.'}
                  </div>
                </div>
              </div>

              {securityInfo?.twoFactorEnabled ? (
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm font-semibold"
                  onClick={() => setDisable2FADialog(true)}
                >
                  <X className="w-4 h-4 mr-2" />
                  2FA Korumasını Kapat
                </Button>
              ) : (
                <Button
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm"
                  onClick={handleSetup2FA}
                  disabled={twoFALoading}
                >
                  {twoFALoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Smartphone className="w-4 h-4 mr-2" />}
                  2FA Kurulumunu Başlat
                </Button>
              )}

              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-white/10 flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Neden 2FA?</strong> Şifreniz başkalarının eline geçse bile authenticator uygulamanız olmadan hiç kimse hesabınıza giriş yapamaz.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 4. Oturumu Kapat */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => logout()}
              className="w-full h-11 rounded-xl border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 text-sm font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Oturumu Sonlandır (Çıkış Yap)
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================================== */}
      {/* DIALOG: 2FA KURULUM MODALI */}
      {/* ============================================================== */}
      <Dialog open={twoFADialog} onOpenChange={setTwoFADialog}>
        <DialogContent className="w-[95vw] max-w-md rounded-2xl dark:bg-slate-900 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              2FA Kurulum Sihirbazı
            </DialogTitle>
            <DialogDescription className="text-xs">
              {twoFAStep === 'setup' && 'QR kodunu Google Authenticator veya benzeri bir uygulama ile tarayın.'}
              {twoFAStep === 'backup' && 'Cihazınızı kaybederseniz hesabınıza erişmek için bu kodları saklayın.'}
              {twoFAStep === 'verify' && 'Uygulamanızın ürettiği 6 haneli geçici kodu girin.'}
            </DialogDescription>
          </DialogHeader>

          {twoFAStep === 'setup' && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-center p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-white/10">
                {twoFAQrCode && (
                  <img src={twoFAQrCode} alt="QR Kod" className="w-52 h-52 rounded-xl bg-white p-2" />
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center space-y-1">
                <p>QR kodu tarayamıyorsanız gizli anahtarı manuel girin:</p>
                <code className="block bg-slate-100 dark:bg-slate-800 p-2 rounded-lg font-mono text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 break-all select-all">
                  {twoFASecret}
                </code>
              </div>
              <Button
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                onClick={() => setTwoFAStep('backup')}
              >
                Yedek Kurtarma Kodlarını Göster
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {twoFAStep === 'backup' && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-4 h-4 inline mr-1 text-amber-600 dark:text-amber-400" />
                Bu kodları güvenli bir yere kaydedin. Telefonunuzu kaybederseniz hesabınızı sadece bu kodlarla kurtarabilirsiniz.
              </div>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                {twoFABackupCodes.map((code, i) => (
                  <code key={i} className="bg-white dark:bg-slate-800 p-2 rounded-lg text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                    {code}
                  </code>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl text-sm font-semibold dark:border-white/10 dark:hover:bg-slate-800 dark:text-slate-200"
                onClick={copyBackupCodes}
              >
                <Copy className="w-4 h-4 mr-2" />
                Tüm Kodları Kopyala
              </Button>
              <Button
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                onClick={() => setTwoFAStep('verify')}
              >
                Doğrulama Adımına Geç
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {twoFAStep === 'verify' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Authenticator Kodu</Label>
                <Input
                  className="h-12 rounded-xl text-center text-2xl tracking-[0.4em] font-mono font-bold dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <Button
                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold"
                onClick={handleVerify2FA}
                disabled={twoFALoading || twoFACode.length !== 6}
              >
                {twoFALoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                2FA'yı Aktif Et ve Tamamla
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DIALOG: 2FA DEVRE DIŞI BIRAKMA */}
      {/* ============================================================== */}
      <Dialog open={disable2FADialog} onOpenChange={setDisable2FADialog}>
        <DialogContent className="w-[95vw] max-w-md rounded-2xl dark:bg-slate-900 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">2FA Korumasını Kapat</DialogTitle>
            <DialogDescription className="text-xs">
              Güvenliğiniz için lütfen authenticator uygulamanızdaki 6 haneli kodu girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Onay Kodu</Label>
              <Input
                className="h-12 rounded-xl text-center text-2xl tracking-[0.4em] font-mono font-bold dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                value={disable2FACode}
                onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11 rounded-xl text-sm dark:border-white/10 dark:hover:bg-slate-800 dark:text-slate-300" onClick={() => setDisable2FADialog(false)}>
                İptal
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm font-semibold"
                onClick={handleDisable2FA}
                disabled={twoFALoading || disable2FACode.length !== 6}
              >
                {twoFALoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Devre Dışı Bırak
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DIALOG: E-POSTA DOĞRULAMA (OTP) */}
      {/* ============================================================== */}
      <Dialog
        open={verifyDialog}
        onOpenChange={(v) => {
          setVerifyDialog(v)
          if (!v) { setVerifyCode(''); setVerifySent(false) }
        }}
      >
        <DialogContent className="w-[95vw] max-w-md rounded-2xl dark:bg-slate-900 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              E-posta Doğrulama
            </DialogTitle>
            <DialogDescription className="text-xs">
              {verifySent
                ? `${user?.email} adresine 6 haneli bir onay kodu gönderdik.`
                : 'Hesabınızın güvenliğini artırmak için e-posta adresinizi doğrulayın.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!verifySent ? (
              <Button
                className="w-full h-11 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm"
                onClick={handleSendVerifyOtp}
                disabled={verifyLoading}
              >
                {verifyLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Doğrulama Kodu Gönder
              </Button>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">6 Haneli Doğrulama Kodu</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="h-12 rounded-xl text-center text-2xl tracking-[0.4em] font-mono font-bold dark:bg-slate-950 dark:border-white/10 dark:text-slate-100"
                  />
                </div>
                <Button
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
                  onClick={handleVerifyEmail}
                  disabled={verifyLoading || verifyCode.length !== 6}
                >
                  {verifyLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Doğrula ve Tamamla
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  onClick={handleSendVerifyOtp}
                  disabled={verifyLoading}
                >
                  Kodu tekrar gönder
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: any
  color: string
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80 dark:border-white/10 dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all group overflow-hidden card-3d-spatial">
      <CardContent className="p-3.5 sm:p-4">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2.5 border transition-transform group-hover:scale-105 ${color}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{value}</div>
        <div className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
      </CardContent>
    </Card>
  )
}
