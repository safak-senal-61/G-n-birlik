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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* ============================================================== */}
      {/* 1. MİMARİ PROFİL KÜNYE KARTI */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
        {/* Üst Künye Şeridi */}
        <div className="px-4 sm:px-6 py-3 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
              {isWorker ? 'ÇALIŞAN SİCİL KARTI' : isEmployer ? 'İŞVEREN HESAP KÜNYESİ' : 'YÖNETİCİ KÜNYESİ'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => go('wallet')}
            className="h-8 px-3 rounded-md bg-white dark:bg-[#141716] border border-[#D6D3C9] dark:border-[#2B322E] hover:border-[#0D6847] text-xs font-semibold text-[#141615] dark:text-[#F2F1ED] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#5CD6A5]" />
            <span>Cüzdanıma Git</span>
          </button>
        </div>

        {/* Profil İçeriği & Avatar Alanı */}
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg p-0.5 bg-[#F0EFEA] dark:bg-[#1E2421] border border-[#D8D5CC] dark:border-[#262C29]">
                  <Avatar className="w-full h-full rounded-md overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="rounded-md bg-[#0D6847] text-white font-mono text-2xl font-bold">
                        {initials(displayName)}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <label className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-md bg-[#141615] hover:bg-[#0D6847] text-white cursor-pointer border border-white dark:border-[#252B28] transition-colors">
                    {avatarLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
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
              </div>

              {/* İsim & Özet */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#141615] dark:text-white tracking-tight">
                    {displayName}
                  </h1>

                  {user.isVerified && (
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#EAF3EE] text-[#0D6847] border border-[#C5DDD0] dark:bg-[#162921] dark:text-[#5CD6A5] dark:border-[#244738]">
                      <BadgeCheck className="w-3 h-3" />
                      <span>ONAYLI</span>
                    </span>
                  )}

                  {isWorker && user.isAvailable && (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-[#EAF3EE] text-[#0D6847] border border-[#C5DDD0] dark:bg-[#162921] dark:text-[#5CD6A5] dark:border-[#244738]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0D6847] dark:bg-[#5CD6A5]" />
                      <span>VARDİYAYA AÇIK</span>
                    </span>
                  )}
                </div>

                {isEmployer && user.fullName && user.companyName && (
                  <p className="text-xs text-[#5C615E] dark:text-[#949B97] flex items-center justify-center sm:justify-start gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    Yetkili: {user.fullName}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5 text-xs text-[#5C615E] dark:text-[#949B97]">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold px-2 py-0.5 rounded-sm bg-[#F0EFEA] dark:bg-[#1E2421] text-[#141615] dark:text-[#F2F1ED] border border-[#E2E0D8] dark:border-[#2C3330]">
                    <Star className="w-3 h-3 fill-[#B5830E] text-[#B5830E]" />
                    <span>{user.ratingAvg ? Number(user.ratingAvg).toFixed(1) : '5.0'}</span>
                    <span className="opacity-75">({user.ratingCount || 0})</span>
                  </span>

                  {(user.city || user.district) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[#F0EFEA] dark:bg-[#1E2421] border border-[#E2E0D8] dark:border-[#2C3330]">
                      <MapPin className="w-3 h-3 text-[#0D6847] dark:text-[#5CD6A5]" />
                      <span>{[user.district, user.city].filter(Boolean).join(', ')}</span>
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                    <Calendar className="w-3 h-3" />
                    <span>Kayıt: {formatDate(user.createdAt)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Düzenle Butonu */}
            <div className="flex items-center justify-center sm:justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (editing) {
                    setEditing(false)
                    setActiveTab('info')
                  } else {
                    setEditing(true)
                    setActiveTab('edit')
                  }
                }}
                className={`h-10 px-4 rounded-md text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  editing
                    ? 'bg-white dark:bg-[#141716] border border-[#D6D3C9] dark:border-[#2B322E] text-[#141615] dark:text-[#F2F1ED]'
                    : 'bg-[#0D6847] hover:bg-[#095237] text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{editing ? 'Önizlemeye Dön' : 'Profili Düzenle'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. İSTATİSTİK KARTLARI */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {isWorker ? (
          <>
            <StatCard
              label="Toplam Başvuru"
              value={stats.total || 0}
              icon={Briefcase}
              color="text-[#0D6847] dark:text-[#5CD6A5]"
            />
            <StatCard
              label="Onaylanan İş"
              value={stats.accepted || 0}
              icon={Award}
              color="text-[#0D6847] dark:text-[#5CD6A5]"
            />
            <StatCard
              label="Tamamlanan"
              value={stats.completed || 0}
              icon={TrendingUp}
              color="text-[#0D6847] dark:text-[#5CD6A5]"
            />
            <StatCard
              label="Deneyim Süresi"
              value={user.experienceYears ? `${user.experienceYears} Yıl` : '1 Yıl'}
              icon={Sparkles}
              color="text-[#0D6847] dark:text-[#5CD6A5]"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Toplam İlan"
              value={stats.totalJobs || 0}
              icon={Briefcase}
              color="text-[#0D6847] dark:text-[#5CD6A5]"
            />
            <StatCard
              label="Aktif İlanlar"
              value={stats.activeJobs || 0}
              icon={Clock}
              color="text-[#0D6847] dark:text-[#5CD6A5]"
            />
            <StatCard
              label="Gelen Başvurular"
              value={stats.totalApplications || 0}
              icon={Award}
              color="text-[#0D6847] dark:text-[#5CD6A5]"
            />
            <StatCard
              label="İşveren Puanı"
              value={user.ratingAvg ? `${Number(user.ratingAvg).toFixed(1)} ★` : '5.0 ★'}
              icon={Star}
              color="text-[#0D6847] dark:text-[#5CD6A5]"
            />
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* 3. SEKMELER (TABS) */}
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
        <div className="bg-white dark:bg-[#141716] p-1 rounded-md border border-[#E2E0D8] dark:border-[#252B28] overflow-hidden">
          <TabsList className="!grid !w-full grid-cols-3 bg-transparent h-auto p-0 gap-1">
            <TabsTrigger
              value="info"
              className="min-w-0 w-full px-1.5 sm:px-3 py-2 rounded-sm font-semibold text-[11px] sm:text-sm data-[state=active]:bg-[#141615] data-[state=active]:text-white dark:data-[state=active]:bg-[#F2F1ED] dark:data-[state=active]:text-[#141615] text-[#5C615E] dark:text-[#949B97] transition-colors flex items-center justify-center gap-1 sm:gap-1.5"
            >
              <User className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Genel Bakış</span>
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="min-w-0 w-full px-1.5 sm:px-3 py-2 rounded-sm font-semibold text-[11px] sm:text-sm data-[state=active]:bg-[#141615] data-[state=active]:text-white dark:data-[state=active]:bg-[#F2F1ED] dark:data-[state=active]:text-[#141615] text-[#5C615E] dark:text-[#949B97] transition-colors flex items-center justify-center gap-1 sm:gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Düzenle</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="min-w-0 w-full px-1.5 sm:px-3 py-2 rounded-sm font-semibold text-[11px] sm:text-sm data-[state=active]:bg-[#141615] data-[state=active]:text-white dark:data-[state=active]:bg-[#F2F1ED] dark:data-[state=active]:text-[#141615] text-[#5C615E] dark:text-[#949B97] transition-colors flex items-center justify-center gap-1 sm:gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Güvenlik & 2FA</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* SEKME 1: GENEL BAKIŞ */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="info" className="space-y-4 mt-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* İletişim Bilgileri Kartı (2 Kolon) */}
            <div className="md:col-span-2 rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-white dark:bg-[#141716] overflow-hidden">
              <div className="bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] py-3.5 px-5 flex items-center justify-between">
                <div className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1] flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#0D6847] dark:text-[#27A878]" />
                  <span>İletişim & Lokasyon Bilgileri</span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0]">
                  01 / İLETİŞİM
                </span>
              </div>
              <div className="p-5 space-y-3">
                {/* E-posta Satırı */}
                <div className="flex items-center justify-between p-3.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-[#E6F2EC] dark:bg-[#0D6847]/20 text-[#0D6847] dark:text-[#27A878] flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0]">E-posta Adresi</div>
                      <div className="text-sm font-mono font-semibold text-[#141716] dark:text-[#F0F2F1] truncate">{user.email}</div>
                    </div>
                  </div>
                  {user.emailVerified ? (
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E6F2EC] dark:bg-[#0D6847]/20 text-[#0D6847] dark:text-[#27A878] border border-[#0D6847]/25 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Doğrulandı
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs rounded-md border-[#C84B31]/40 text-[#C84B31] hover:bg-[#FDF3F0] dark:hover:bg-[#C84B31]/15"
                      onClick={() => { setVerifyDialog(true); setVerifySent(false); setVerifyCode('') }}
                    >
                      Doğrula
                    </Button>
                  )}
                </div>

                {/* Telefon Satırı */}
                <div className="flex items-center justify-between p-3.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-[#E6F2EC] dark:bg-[#0D6847]/20 text-[#0D6847] dark:text-[#27A878] flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0]">Telefon Numarası</div>
                      <div className="text-sm font-mono font-semibold text-[#141716] dark:text-[#F0F2F1]">
                        {user.phone || <span className="text-[#535A56] dark:text-[#9DA6A0] font-sans font-normal">Belirtilmedi</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Adres Satırı */}
                <div className="flex items-start gap-3 p-3.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28]">
                  <div className="w-8 h-8 rounded-md bg-[#E6F2EC] dark:bg-[#0D6847]/20 text-[#0D6847] dark:text-[#27A878] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0]">Açık Adres / Bölge</div>
                    <div className="text-sm font-medium text-[#141716] dark:text-[#F0F2F1] break-words">
                      {user.address || [user.district, user.city].filter(Boolean).join(', ') || (
                        <span className="text-[#535A56] dark:text-[#9DA6A0] font-normal">Adres tanımlanmadı</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hızlı Bilgi & Durum Kartı (1 Kolon) */}
            <div className="rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-white dark:bg-[#141716] flex flex-col justify-between overflow-hidden">
              <div className="bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] py-3.5 px-5 flex items-center justify-between">
                <div className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0D6847] dark:text-[#27A878]" />
                  <span>Hesap Durumu</span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0]">
                  02 / DURUM
                </span>
              </div>
              <div className="p-5 space-y-3.5 flex-1">
                {isWorker && (
                  <div className="p-3.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28]">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#0D6847] dark:text-[#27A878] font-semibold mb-1">İş Arama Modu</div>
                    <p className="text-xs text-[#535A56] dark:text-[#9DA6A0] mb-3 leading-relaxed">
                      İş arama modunu aktif tutarak işverenlerin size yeni iş teklifleri göndermesini sağlayabilirsiniz.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E2E0D8] dark:border-[#252B28]">
                      <span className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">
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
                  <div className="p-3.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28]">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0]">Saatlik Ücret Beklentisi</div>
                    <div className="text-base font-mono font-bold text-[#0D6847] dark:text-[#27A878] mt-0.5">
                      {user.hourlyWageMin || user.hourlyWageMax
                        ? `₺${user.hourlyWageMin || 0} - ₺${user.hourlyWageMax || 0} / saat`
                        : 'Belirtilmedi'}
                    </div>
                  </div>
                )}

                {isEmployer && (
                  <div className="p-3.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] text-xs text-[#535A56] dark:text-[#9DA6A0]">
                    <strong className="block mb-1 font-semibold text-[#141716] dark:text-[#F0F2F1]">İşveren Paneli Avantajı:</strong>
                    İlanlarınızı yayınlayıp çalışan başvurularını hemen kabul edebilir, iş başlangıcında QR kod üreterek mesaiyi yönetebilirsiniz.
                  </div>
                )}

                {/* Tema ve Görünüm Tercihi */}
                <div className="p-3.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28]">
                  <div className="text-xs text-[#141716] dark:text-[#F0F2F1] font-semibold mb-1 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#27A878]" />
                    <span>Tema ve Görünüm</span>
                  </div>
                  <p className="text-[11px] text-[#535A56] dark:text-[#9DA6A0] mb-2.5">
                    Karanlık mod ile aydınlık mod arasında tercih yapabilirsiniz.
                  </p>
                  <ThemeToggle variant="segmented" className="w-full justify-between" />
                </div>
              </div>
            </div>
          </div>

          {/* Hakkında / Biyografi Kartı */}
          <div className="rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-white dark:bg-[#141716] overflow-hidden">
            <div className="bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] py-3.5 px-5 flex flex-row items-center justify-between">
              <div className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0D6847] dark:text-[#27A878]" />
                <span>Hakkında & Deneyim Özeti</span>
              </div>
              {!editingBio ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBioDraft(user.bio || '')
                    setEditingBio(true)
                  }}
                  className="h-8 text-xs font-semibold rounded-md border-[#E2E0D8] dark:border-[#252B28] text-[#141716] dark:text-[#F0F2F1] hover:border-[#0D6847] gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#27A878]" />
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
                    className="h-8 text-xs text-[#535A56] dark:text-[#9DA6A0]"
                    disabled={savingBio}
                  >
                    Vazgeç
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveBio}
                    disabled={savingBio}
                    className="h-8 text-xs font-semibold rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white gap-1.5"
                  >
                    {savingBio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Kaydet
                  </Button>
                </div>
              )}
            </div>
            <div className="p-5">
              {editingBio ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">
                      Biyografi & Kendinizi Tanıtın
                    </Label>
                    <Textarea
                      rows={4}
                      value={bioDraft}
                      onChange={(e) => setBioDraft(e.target.value)}
                      placeholder="Kendinizi, geçmiş iş deneyimlerinizi, yaptığınız işleri, güçlü yönlerinizi ve çalışma prensiplerinizi anlatın..."
                      className="rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1] text-sm leading-relaxed"
                      autoFocus
                    />
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#535A56] dark:text-[#9DA6A0] pt-0.5">
                      <span>Detaylı açıklama profilinizin tercih edilme oranını artırır.</span>
                      <span>{bioDraft.length} karakter</span>
                    </div>
                  </div>

                  {/* Hızlı Şablonlar */}
                  <div className="space-y-1.5 pt-2 border-t border-[#E2E0D8] dark:border-[#252B28]">
                    <div className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#535A56] dark:text-[#9DA6A0]">
                      Hazır Şablonlar (Tek Tıkla Ekle):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        {
                          label: 'Genel Deneyim',
                          text: 'Disiplinli, dakik ve iş sorumluluğu yüksek bir çalışanım. Verilen görevleri titizlikle yerine getiririm. Ekip çalışmasına uyumluyum.',
                        },
                        {
                          label: 'Usta & Teknik',
                          text: 'Yılların getirdiği saha ve ustalık deneyimimle kaliteli ve güvenilir iş teslim ederim. Gerekli teknik ve el aletlerini profesyonelce kullanırım.',
                        },
                        {
                          label: 'Hizmet & Restoran',
                          text: 'Dinamik, hızlı ve güler yüzlüyüm. Kafe, restoran ve organizasyonlarda müşteri memnuniyetini ön planda tutarak hizmet veririm.',
                        },
                        {
                          label: 'Depo & Taşıma',
                          text: 'Fiziksel dayanıklılığı yüksek, dikkatli ve seri bir çalışanım. Yükleme, boşaltma, koli taşıma ve depo düzenleme işlerinde deneyimliyim.',
                        },
                      ].map((tpl) => (
                        <button
                          key={tpl.label}
                          type="button"
                          onClick={() => setBioDraft(tpl.text)}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] hover:border-[#0D6847] border border-[#E2E0D8] dark:border-[#252B28] text-[#141716] dark:text-[#F0F2F1] transition-colors"
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
                      className="text-xs rounded-md border-[#E2E0D8] dark:border-[#252B28]"
                      disabled={savingBio}
                    >
                      İptal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveBio}
                      disabled={savingBio}
                      className="bg-[#0D6847] hover:bg-[#0A5238] text-white text-xs font-semibold rounded-md gap-1.5"
                    >
                      {savingBio ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Biyografiyi Kaydet
                    </Button>
                  </div>
                </div>
              ) : user.bio ? (
                <div className="group relative">
                  <p className="text-[#141716] dark:text-[#F0F2F1] text-sm leading-relaxed whitespace-pre-line">
                    {user.bio}
                  </p>
                  <button
                    onClick={() => {
                      setBioDraft(user.bio || '')
                      setEditingBio(true)
                    }}
                    className="mt-3 text-xs text-[#0D6847] dark:text-[#27A878] font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Edit3 className="w-3 h-3" /> Metni Düzenle
                  </button>
                </div>
              ) : (
                <div className="text-center py-7 text-[#535A56] dark:text-[#9DA6A0] text-sm space-y-3">
                  <div className="w-11 h-11 rounded-md bg-[#E6F2EC] dark:bg-[#0D6847]/20 text-[#0D6847] dark:text-[#27A878] flex items-center justify-center mx-auto">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#141716] dark:text-[#F0F2F1]">Henüz bir biyografi veya deneyim özeti eklemediniz.</p>
                    <p className="text-xs text-[#535A56] dark:text-[#9DA6A0] mt-0.5">Kendinizden ve deneyimlerinizden bahsederek profilinizi öne çıkarın.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setBioDraft('')
                      setEditingBio(true)
                    }}
                    className="bg-[#0D6847] hover:bg-[#0A5238] text-white text-xs font-semibold h-9 px-4 rounded-md gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Biyografi Eklemek İçin Tıklayın
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Uzmanlık & Yetenekler Kartı */}
          <div className="rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-white dark:bg-[#141716] overflow-hidden">
            <div className="bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] py-3.5 px-5 flex flex-row items-center justify-between flex-wrap gap-2">
              <div className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#0D6847] dark:text-[#27A878]" />
                <span>Uzmanlık & Yetenekler</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E6F2EC] dark:bg-[#0D6847]/20 text-[#0D6847] dark:text-[#27A878] border border-[#0D6847]/25">
                  {(editingSkills ? skillsDraft.length : (user.skills?.length || 0))} YETENEK
                </span>
                {!editingSkills ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSkillsDraft(user.skills || [])
                      setEditingSkills(true)
                    }}
                    className="h-8 text-xs font-semibold rounded-md border-[#E2E0D8] dark:border-[#252B28] text-[#141716] dark:text-[#F0F2F1] hover:border-[#0D6847] gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#0D6847] dark:text-[#27A878]" />
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
                      className="h-8 text-xs text-[#535A56] dark:text-[#9DA6A0]"
                      disabled={savingSkills}
                    >
                      Vazgeç
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSkills}
                      disabled={savingSkills}
                      className="h-8 text-xs font-semibold rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white gap-1.5"
                    >
                      {savingSkills ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Kaydet
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
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
                      className="h-10 text-xs sm:text-sm rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                    />
                    <Button
                      type="button"
                      onClick={() => handleAddSkill(skillInput)}
                      className="h-10 px-4 bg-[#0D6847] hover:bg-[#0A5238] text-white text-xs font-semibold rounded-md flex-shrink-0 gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ekle
                    </Button>
                  </div>

                  {/* Seçili Yetenekler */}
                  <div>
                    <div className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] mb-2 flex items-center justify-between">
                      <span>Profilinizde Görünecek Yetenekler:</span>
                      <span className="font-mono text-[10px] text-[#535A56] dark:text-[#9DA6A0] font-normal">Silmek için ✕&apos;e tıklayın</span>
                    </div>
                    {skillsDraft.length > 0 ? (
                      <div className="flex flex-wrap gap-2 p-3 bg-[#FBFBF9] dark:bg-[#181C1A] rounded-md border border-[#E2E0D8] dark:border-[#252B28] min-h-[48px] items-center">
                        {skillsDraft.map((skill) => (
                          <div
                            key={skill}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E6F2EC] dark:bg-[#0D6847]/20 border border-[#0D6847]/30 text-[#0D6847] dark:text-[#27A878] text-xs font-semibold"
                          >
                            <Check className="w-3 h-3" />
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-1 hover:text-[#C84B31] transition-colors p-0.5"
                              title="Sil"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] rounded-md text-xs text-[#535A56] dark:text-[#9DA6A0] text-center">
                        Henüz hiç yetenek eklemediniz. Aşağıdaki popüler listeden seçebilir veya yukarıya yazabilirsiniz.
                      </div>
                    )}
                  </div>

                  {/* Popüler Yetenek Önerileri */}
                  <div className="space-y-2 pt-2 border-t border-[#E2E0D8] dark:border-[#252B28]">
                    <div className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#535A56] dark:text-[#9DA6A0]">
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
                            className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-[#0D6847] text-white border-[#0D6847]'
                                : 'bg-[#FBFBF9] dark:bg-[#181C1A] hover:border-[#0D6847] text-[#141716] dark:text-[#F0F2F1] border-[#E2E0D8] dark:border-[#252B28]'
                            }`}
                          >
                            {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 text-[#535A56] dark:text-[#9DA6A0]" />}
                            {s}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Kaydet ve İptal Butonları */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E0D8] dark:border-[#252B28]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSkillsDraft(user.skills || [])
                        setEditingSkills(false)
                      }}
                      className="text-xs rounded-md border-[#E2E0D8] dark:border-[#252B28]"
                      disabled={savingSkills}
                    >
                      İptal
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveSkills}
                      disabled={savingSkills}
                      className="bg-[#0D6847] hover:bg-[#0A5238] text-white text-xs font-semibold rounded-md gap-1.5"
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] text-[#141716] dark:text-[#F0F2F1] text-xs font-medium"
                      >
                        <Check className="w-3 h-3 text-[#0D6847] dark:text-[#27A878]" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setSkillsDraft(user.skills || [])
                      setEditingSkills(true)
                    }}
                    className="text-xs text-[#0D6847] dark:text-[#27A878] font-semibold flex items-center gap-1 hover:underline pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Yetenek Ekle veya Çıkar
                  </button>
                </div>
              ) : (
                <div className="text-center py-7 text-[#535A56] dark:text-[#9DA6A0] text-sm space-y-3">
                  <div className="w-11 h-11 rounded-md bg-[#E6F2EC] dark:bg-[#0D6847]/20 text-[#0D6847] dark:text-[#27A878] flex items-center justify-center mx-auto">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#141716] dark:text-[#F0F2F1]">Henüz uzmanlık alanı veya yetenek eklemediniz.</p>
                    <p className="text-xs text-[#535A56] dark:text-[#9DA6A0] mt-0.5">İşverenlerin sizi doğru işlerle eşleştirmesi için bildiğiniz işleri ekleyin.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSkillsDraft([])
                      setEditingSkills(true)
                    }}
                    className="bg-[#0D6847] hover:bg-[#0A5238] text-white text-xs font-semibold h-9 px-4 rounded-md gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Uzmanlık & Yetenek Ekle
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* SEKME 2: PROFİLİ DÜZENLE */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="edit" className="space-y-4 mt-5">
          <div className="rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-white dark:bg-[#141716] overflow-hidden">
            <div className="bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] py-4 px-5 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#141716] dark:text-[#F0F2F1] flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-[#0D6847] dark:text-[#27A878]" />
                  <span>Profil Bilgilerini Güncelle</span>
                </h3>
                <p className="text-xs text-[#535A56] dark:text-[#9DA6A0] mt-0.5">
                  Profil bilgilerinizi güncelleyerek daha fazla iş veya güvenilir çalışan bulabilirsiniz.
                </p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0] hidden sm:inline">
                SICIL KAYDI DÜZENLEME
              </span>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">
                    {isEmployer ? 'Şirket / İşletme Adı' : 'Ad Soyad'}
                  </Label>
                  <Input
                    className="h-10 rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                    value={isEmployer ? (form.companyName || form.fullName) : form.fullName}
                    onChange={(e) => isEmployer ? setForm({ ...form, companyName: e.target.value }) : setForm({ ...form, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Telefon Numarası</Label>
                  <Input
                    className="h-10 rounded-md font-mono border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+90 5XX..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Şehir</Label>
                  <Input
                    className="h-10 rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="İstanbul, Ankara, vb."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">İlçe</Label>
                  <Input
                    className="h-10 rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                    value={form.district}
                    onChange={(e) => setForm({ ...form, district: e.target.value })}
                    placeholder="Kadıköy, Çankaya, vb."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Açık Adres</Label>
                <Input
                  className="h-10 rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Mahalle, cadde, sokak ve kapı no"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Hakkında / Açıklama</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                  placeholder="Kendinizden, çalışma prensiplerinizden veya tecrübelerinizden bahsedin..."
                />
              </div>

              {/* İşçiye Özel Ek Alanlar */}
              {isWorker && (
                <div className="pt-3 border-t border-[#E2E0D8] dark:border-[#252B28] space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Yetenekler (virgülle ayırın)</Label>
                    <Input
                      className="h-10 rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                      value={form.skills}
                      onChange={(e) => setForm({ ...form, skills: e.target.value })}
                      placeholder="Örn: İnşaat, Boyacı, Garson, Temizlik, Taşıma"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Tecrübe (Yıl)</Label>
                      <Input
                        type="number"
                        className="h-10 rounded-md font-mono border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                        value={form.experienceYears}
                        onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Min. Saatlik Ücret (₺)</Label>
                      <Input
                        type="number"
                        className="h-10 rounded-md font-mono border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                        value={form.hourlyWageMin}
                        onChange={(e) => setForm({ ...form, hourlyWageMin: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Max. Saatlik Ücret (₺)</Label>
                      <Input
                        type="number"
                        className="h-10 rounded-md font-mono border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                        value={form.hourlyWageMax}
                        onChange={(e) => setForm({ ...form, hourlyWageMax: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] rounded-md border border-[#E2E0D8] dark:border-[#252B28]">
                    <div>
                      <Label className="font-semibold text-xs sm:text-sm text-[#141716] dark:text-[#F0F2F1]">İş Tekliflerine Açığım</Label>
                      <p className="text-[11px] text-[#535A56] dark:text-[#9DA6A0]">İşverenler profilinizi aktif iş arayan olarak görsün</p>
                    </div>
                    <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1 h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white font-semibold text-sm"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Değişiklikleri Kaydet
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setEditing(false); setActiveTab('info') }}
                  className="h-10 rounded-md text-[#535A56] dark:text-[#9DA6A0] border-[#E2E0D8] dark:border-[#252B28]"
                >
                  Vazgeç
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------ */}
        {/* SEKME 3: GÜVENLİK & 2FA */}
        {/* ------------------------------------------------------------ */}
        <TabsContent value="security" className="space-y-4 mt-5">
          {/* 1. Şifre Değiştirme */}
          <div className="rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-white dark:bg-[#141716] overflow-hidden">
            <div className="bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] py-3.5 px-5 flex items-center justify-between">
              <div className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#0D6847] dark:text-[#27A878]" />
                <span>Giriş Şifresi</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0]">
                01 / PAROLA
              </span>
            </div>
            <div className="p-5 space-y-3.5">
              {securityInfo?.hasPassword === false ? (
                <div className="p-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] rounded-md text-xs sm:text-sm text-[#535A56] dark:text-[#9DA6A0] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-[#0D6847] dark:text-[#27A878] flex-shrink-0" />
                  <span>Google ile giriş yaptığınız için hesabınız doğrudan Google OAuth güvencesindedir. Şifre belirlemenize gerek yoktur.</span>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Mevcut Şifre</Label>
                    <Input
                      type="password"
                      className="h-10 rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                      value={pwForm.current}
                      onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Yeni Şifre</Label>
                      <Input
                        type="password"
                        className="h-10 rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                        value={pwForm.next}
                        onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                        placeholder="En az 6 karakter"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Yeni Şifre (Tekrar)</Label>
                      <Input
                        type="password"
                        className="h-10 rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                        value={pwForm.confirm}
                        onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                        placeholder="Tekrar girin"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={pwLoading || !pwForm.current || !pwForm.next}
                    className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white font-semibold text-sm"
                  >
                    {pwLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Şifreyi Güncelle
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 2. E-posta Değiştirme */}
          <div className="rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-white dark:bg-[#141716] overflow-hidden">
            <div className="bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] py-3.5 px-5 flex items-center justify-between">
              <div className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#0D6847] dark:text-[#27A878]" />
                <span>E-posta Adresi Yönetimi</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0]">
                02 / E-POSTA
              </span>
            </div>
            <div className="p-5 space-y-3.5">
              <div className="p-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] rounded-md border border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="w-4 h-4 text-[#535A56] dark:text-[#9DA6A0] flex-shrink-0" />
                  <span className="text-sm font-mono font-semibold text-[#141716] dark:text-[#F0F2F1] truncate">{user.email}</span>
                </div>
                {user.emailVerified ? (
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E6F2EC] dark:bg-[#0D6847]/20 text-[#0D6847] dark:text-[#27A878] border border-[#0D6847]/25 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Doğrulandı
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#FDF3F0] dark:bg-[#C84B31]/15 text-[#C84B31] border border-[#C84B31]/25">Doğrulanmamış</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs rounded-md border-[#C84B31]/40 text-[#C84B31]"
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
                    <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Yeni E-posta Adresi</Label>
                    <Input
                      type="email"
                      className="h-10 rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      placeholder="yeni@email.com"
                    />
                  </div>
                  <Button
                    onClick={handleEmailChangeRequest}
                    disabled={emailLoading || !emailForm.newEmail}
                    variant="outline"
                    className="w-full h-10 rounded-md text-xs sm:text-sm font-semibold text-[#141716] dark:text-[#F0F2F1] border-[#E2E0D8] dark:border-[#252B28]"
                  >
                    {emailLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    Değişiklik Kodunu Gönder
                  </Button>
                </>
              ) : (
                <>
                  <div className="p-3 bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] rounded-md text-xs text-[#535A56] dark:text-[#9DA6A0]">
                    Yeni e-posta adresinize gönderilen 6 haneli doğrulama kodunu girin.
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">6 Haneli Kod</Label>
                    <Input
                      className="h-11 rounded-md text-center text-xl tracking-[0.3em] font-mono font-bold border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                      value={emailForm.code}
                      onChange={(e) => setEmailForm({ ...emailForm, code: e.target.value })}
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 rounded-md text-sm border-[#E2E0D8] dark:border-[#252B28]"
                      onClick={() => setEmailStep('request')}
                    >
                      Geri
                    </Button>
                    <Button
                      onClick={handleEmailChangeConfirm}
                      disabled={emailLoading || !emailForm.code}
                      className="flex-1 h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white font-semibold text-sm"
                    >
                      {emailLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      Onayla ve Değiştir
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3. İki Faktörlü Doğrulama (2FA) */}
          <div className="rounded-md border border-[#E2E0D8] dark:border-[#252B28] bg-white dark:bg-[#141716] overflow-hidden">
            <div className="bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] py-3.5 px-5 flex items-center justify-between">
              <div className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#0D6847] dark:text-[#27A878]" />
                <span>İki Faktörlü Doğrulama (TOTP / 2FA)</span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#535A56] dark:text-[#9DA6A0]">
                03 / TOTP 2FA
              </span>
            </div>
            <div className="p-5 space-y-4">
              <div className={`p-4 rounded-md flex items-center gap-3.5 border ${
                securityInfo?.twoFactorEnabled
                  ? 'bg-[#E6F2EC]/50 dark:bg-[#0D6847]/15 border-[#0D6847]/30'
                  : 'bg-[#FBFBF9] dark:bg-[#181C1A] border-[#E2E0D8] dark:border-[#252B28]'
              }`}>
                <div className={`w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 ${
                  securityInfo?.twoFactorEnabled ? 'bg-[#0D6847] text-white' : 'bg-[#EFECE6] dark:bg-[#252B28] text-[#535A56] dark:text-[#9DA6A0]'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#141716] dark:text-[#F0F2F1]">
                    {securityInfo?.twoFactorEnabled ? '2FA Koruması Aktif' : '2FA Koruması Kapalı'}
                  </div>
                  <div className="text-xs text-[#535A56] dark:text-[#9DA6A0] mt-0.5">
                    {securityInfo?.twoFactorEnabled
                      ? 'Hesabınız Google Authenticator / TOTP kodu ile korunuyor.'
                      : 'Giriş yaparken ek güvenlik kodu isteyerek hesabınızı koruyun.'}
                  </div>
                </div>
              </div>

              {securityInfo?.twoFactorEnabled ? (
                <Button
                  variant="outline"
                  className="w-full h-10 rounded-md text-[#C84B31] border-[#C84B31]/30 hover:bg-[#FDF3F0] dark:hover:bg-[#C84B31]/15 text-sm font-semibold"
                  onClick={() => setDisable2FADialog(true)}
                >
                  <X className="w-4 h-4 mr-2" />
                  2FA Korumasını Kapat
                </Button>
              ) : (
                <Button
                  className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white text-sm font-semibold"
                  onClick={handleSetup2FA}
                  disabled={twoFALoading}
                >
                  {twoFALoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Smartphone className="w-4 h-4 mr-2" />}
                  2FA Kurulumunu Başlat
                </Button>
              )}

              <div className="text-xs text-[#535A56] dark:text-[#9DA6A0] bg-[#FBFBF9] dark:bg-[#181C1A] p-3 rounded-md border border-[#E2E0D8] dark:border-[#252B28] flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#0D6847] dark:text-[#27A878] flex-shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#141716] dark:text-[#F0F2F1]">Neden 2FA?</strong> Şifreniz başkalarının eline geçse bile authenticator uygulamanız olmadan hiç kimse hesabınıza giriş yapamaz.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Oturumu Kapat */}
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => logout()}
              className="w-full h-10 rounded-md border-[#C84B31]/30 text-[#C84B31] hover:bg-[#FDF3F0] dark:hover:bg-[#C84B31]/15 text-sm font-semibold transition-colors"
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
        <DialogContent className="w-[95vw] max-w-md rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] text-[#141716] dark:text-[#F0F2F1]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-[#0D6847] dark:text-[#27A878]" />
              2FA Kurulum Sihirbazı
            </DialogTitle>
            <DialogDescription className="text-xs text-[#535A56] dark:text-[#9DA6A0]">
              {twoFAStep === 'setup' && 'QR kodunu Google Authenticator veya benzeri bir uygulama ile tarayın.'}
              {twoFAStep === 'backup' && 'Cihazınızı kaybederseniz hesabınıza erişmek için bu kodları saklayın.'}
              {twoFAStep === 'verify' && 'Uygulamanızın ürettiği 6 haneli geçici kodu girin.'}
            </DialogDescription>
          </DialogHeader>

          {twoFAStep === 'setup' && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-center p-3 bg-[#FBFBF9] dark:bg-[#0C0E0D] rounded-md border border-[#E2E0D8] dark:border-[#252B28]">
                {twoFAQrCode && (
                  <img src={twoFAQrCode} alt="QR Kod" className="w-52 h-52 rounded-md bg-white p-2" />
                )}
              </div>
              <div className="text-xs text-[#535A56] dark:text-[#9DA6A0] text-center space-y-1">
                <p>QR kodu tarayamıyorsanız gizli anahtarı manuel girin:</p>
                <code className="block bg-[#FBFBF9] dark:bg-[#0C0E0D] p-2 rounded-md font-mono text-[11px] text-[#141716] dark:text-[#F0F2F1] border border-[#E2E0D8] dark:border-[#252B28] break-all select-all">
                  {twoFASecret}
                </code>
              </div>
              <Button
                className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white text-sm font-semibold"
                onClick={() => setTwoFAStep('backup')}
              >
                Yedek Kurtarma Kodlarını Göster
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {twoFAStep === 'backup' && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-[#FDF3F0] dark:bg-[#C84B31]/15 border border-[#C84B31]/30 rounded-md text-xs text-[#C84B31]">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Bu kodları güvenli bir yere kaydedin. Telefonunuzu kaybederseniz hesabınızı sadece bu kodlarla kurtarabilirsiniz.
              </div>
              <div className="grid grid-cols-2 gap-2 bg-[#FBFBF9] dark:bg-[#0C0E0D] p-3 rounded-md border border-[#E2E0D8] dark:border-[#252B28]">
                {twoFABackupCodes.map((code, i) => (
                  <code key={i} className="bg-white dark:bg-[#141716] p-2 rounded text-center font-mono text-xs font-semibold text-[#141716] dark:text-[#F0F2F1] border border-[#E2E0D8] dark:border-[#252B28]">
                    {code}
                  </code>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full h-10 rounded-md text-sm font-semibold border-[#E2E0D8] dark:border-[#252B28]"
                onClick={copyBackupCodes}
              >
                <Copy className="w-4 h-4 mr-2" />
                Tüm Kodları Kopyala
              </Button>
              <Button
                className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white text-sm font-semibold"
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
                <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Authenticator Kodu</Label>
                <Input
                  className="h-11 rounded-md text-center text-2xl tracking-[0.4em] font-mono font-bold border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <Button
                className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white text-sm font-semibold"
                onClick={handleVerify2FA}
                disabled={twoFALoading || twoFACode.length !== 6}
              >
                {twoFALoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                2FA&apos;yı Aktif Et ve Tamamla
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ============================================================== */}
      {/* DIALOG: 2FA DEVRE DIŞI BIRAKMA */}
      {/* ============================================================== */}
      <Dialog open={disable2FADialog} onOpenChange={setDisable2FADialog}>
        <DialogContent className="w-[95vw] max-w-md rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] text-[#141716] dark:text-[#F0F2F1]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">2FA Korumasını Kapat</DialogTitle>
            <DialogDescription className="text-xs text-[#535A56] dark:text-[#9DA6A0]">
              Güvenliğiniz için lütfen authenticator uygulamanızdaki 6 haneli kodu girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Onay Kodu</Label>
              <Input
                className="h-11 rounded-md text-center text-2xl tracking-[0.4em] font-mono font-bold border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                value={disable2FACode}
                onChange={(e) => setDisable2FACode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-10 rounded-md text-sm border-[#E2E0D8] dark:border-[#252B28]" onClick={() => setDisable2FADialog(false)}>
                İptal
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-md text-[#C84B31] border-[#C84B31]/30 hover:bg-[#FDF3F0] dark:hover:bg-[#C84B31]/15 text-sm font-semibold"
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
        <DialogContent className="w-[95vw] max-w-md rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] text-[#141716] dark:text-[#F0F2F1]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Mail className="w-5 h-5 text-[#0D6847] dark:text-[#27A878]" />
              E-posta Doğrulama
            </DialogTitle>
            <DialogDescription className="text-xs text-[#535A56] dark:text-[#9DA6A0]">
              {verifySent
                ? `${user?.email} adresine 6 haneli bir onay kodu gönderdik.`
                : 'Hesabınızın güvenliğini artırmak için e-posta adresinizi doğrulayın.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!verifySent ? (
              <Button
                className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white font-semibold text-sm"
                onClick={handleSendVerifyOtp}
                disabled={verifyLoading}
              >
                {verifyLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Doğrulama Kodu Gönder
              </Button>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">6 Haneli Doğrulama Kodu</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="h-11 rounded-md text-center text-2xl tracking-[0.4em] font-mono font-bold border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                  />
                </div>
                <Button
                  className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#0A5238] text-white font-semibold text-sm"
                  onClick={handleVerifyEmail}
                  disabled={verifyLoading || verifyCode.length !== 6}
                >
                  {verifyLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Doğrula ve Tamamla
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-xs text-[#535A56] dark:text-[#9DA6A0]"
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
    <div className="p-4 rounded-lg bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#5C615E] dark:text-[#949B97]">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="font-mono text-xl sm:text-2xl font-bold text-[#141615] dark:text-white tracking-tight">
        {value}
      </div>
    </div>
  )
}
