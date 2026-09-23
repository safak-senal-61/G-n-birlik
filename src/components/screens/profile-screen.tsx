'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useApp } from '@/lib/app-store'
import { authApi, jobsApi, applicationsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Star, MapPin, Phone, Mail, Building2, Briefcase,
  Clock, Wallet, Save, Loader2, Edit3, Award, TrendingUp, Calendar,
  Shield, Smartphone, Camera, Key, Lock, CheckCircle2, X, AlertCircle,
  Copy, QrCode, ArrowRight,
} from 'lucide-react'
import { initials, formatDate } from '@/lib/format'
import { toast } from 'sonner'

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuth()
  const { go } = useApp()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<any>({})

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

  const [securityInfo, setSecurityInfo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'edit' | 'security'>('info')

  // Şifre değiştirme
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwLoading, setPwLoading] = useState(false)

  // E-posta değiştirme
  const [emailForm, setEmailForm] = useState({ newEmail: '', code: '' })
  const [emailStep, setEmailStep] = useState<'request' | 'confirm'>('request')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailPreview, setEmailPreview] = useState('')

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
        const result = await jobsApi.list({ employerId: user.id, pageSize: 50 })
        setStats({
          totalJobs: result.pagination.total,
          activeJobs: result.items.filter((j: any) => j.status === 'OPEN').length,
          totalApplications: result.items.reduce((sum: number, j: any) => sum + (j.applicationCount || 0), 0),
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
      toast.success('Profil güncellendi!')
      setEditing(false)
      setActiveTab('info')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
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
          toast.error(err.message)
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
      toast.error('Yeni şifreler eşleşmiyor.')
      return
    }
    if (pwForm.next.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalı.')
      return
    }
    setPwLoading(true)
    try {
      await authApi.changePassword(pwForm.current, pwForm.next)
      toast.success('Şifreniz güncellendi!')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setPwLoading(false)
    }
  }

  const handleEmailChangeRequest = async () => {
    setEmailLoading(true)
    try {
      const result = await authApi.requestEmailChange(emailForm.newEmail)
      setEmailPreview(result.preview || '')
      setEmailStep('confirm')
      toast.success('Doğrulama kodu gönderildi!')
    } catch (err: any) {
      toast.error(err.message)
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
      setEmailPreview('')
      loadSecurityInfo()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setEmailLoading(false)
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
      toast.error(err.message)
    } finally {
      setTwoFALoading(false)
    }
  }

  const handleVerify2FA = async () => {
    setTwoFALoading(true)
    try {
      await authApi.verify2FA(twoFACode)
      toast.success('2FA aktif edildi! 🎉')
      setTwoFADialog(false)
      setTwoFACode('')
      loadSecurityInfo()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setTwoFALoading(false)
    }
  }

  const handleDisable2FA = async () => {
    setTwoFALoading(true)
    try {
      await authApi.disable2FA(disable2FACode)
      toast.success('2FA devre dışı bırakıldı.')
      setDisable2FADialog(false)
      setDisable2FACode('')
      loadSecurityInfo()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setTwoFALoading(false)
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(twoFABackupCodes.join('\n'))
    toast.success('Backup kodları kopyalandı!')
  }

  if (!user) return null

  const isWorker = user.role === 'WORKER'
  const isEmployer = user.role === 'EMPLOYER'

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      {/* Profil Başlığı */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 h-24" />
        <CardContent className="pt-0 -mt-10 sm:-mt-12 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
            <label className="relative cursor-pointer group">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white rounded-full flex-shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-emerald-600 text-white text-xl sm:text-2xl font-bold">
                    {initials(user.fullName)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {avatarLoading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={avatarLoading}
              />
            </label>
            <Button
              variant="outline"
              onClick={() => {
                if (editing) {
                  setEditing(false)
                  setActiveTab('info')
                } else {
                  setEditing(true)
                  setActiveTab('edit')
                }
              }}
              className="mb-2 text-xs sm:text-sm self-start sm:self-auto"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {editing ? 'İptal' : 'Profili Düzenle'}
            </Button>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {isEmployer ? user.companyName : user.fullName}
              </h1>
              {user.isVerified && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-[10px] sm:text-xs">
                  ✓ Doğrulanmış
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="mt-1 text-[10px] sm:text-xs">
              {isWorker ? 'İş Arayan' : isEmployer ? 'İşveren' : 'Admin'}
            </Badge>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {user.ratingAvg || '0.0'} ({user.ratingCount || 0})
              </span>
              {user.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {user.district}, {user.city}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(user.createdAt)} tarihinde katıldı
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        {isWorker ? (
          <>
            <StatCard label="Toplam Başvuru" value={stats.total || 0} icon={Briefcase} color="bg-blue-100 text-blue-700" />
            <StatCard label="Onaylanan" value={stats.accepted || 0} icon={Award} color="bg-green-100 text-green-700" />
            <StatCard label="Tamamlanan" value={stats.completed || 0} icon={TrendingUp} color="bg-emerald-100 text-emerald-700" />
          </>
        ) : (
          <>
            <StatCard label="Toplam İlan" value={stats.totalJobs || 0} icon={Briefcase} color="bg-blue-100 text-blue-700" />
            <StatCard label="Aktif İlan" value={stats.activeJobs || 0} icon={Clock} color="bg-green-100 text-green-700" />
            <StatCard label="Toplam Başvuru" value={stats.totalApplications || 0} icon={Award} color="bg-emerald-100 text-emerald-700" />
          </>
        )}
      </div>

      <Tabs value={editing ? 'edit' : activeTab} onValueChange={(v) => {
        if (v === 'edit') {
          setEditing(true)
        } else {
          setEditing(false)
          setActiveTab(v as 'info' | 'security')
        }
      }}>
        <TabsList className="w-full flex-wrap">
          <TabsTrigger value="info" className="flex-1">Bilgiler</TabsTrigger>
          <TabsTrigger value="edit" className="flex-1">Düzenle</TabsTrigger>
          <TabsTrigger value="security" className="flex-1">
            <Shield className="w-4 h-4 mr-1" />
            Güvenlik
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 mt-4">
          {/* İletişim */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{user.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bio */}
          {user.bio && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hakkında</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-gray-700 text-sm sm:text-base">{user.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* İşçi becerileri */}
          {isWorker && user.skills?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Yetenekler</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill: string) => (
                    <Badge key={skill} variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* İşçi ücret beklentisi */}
          {isWorker && (user.hourlyWageMin || user.hourlyWageMax) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ücret Beklentisi</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold text-sm sm:text-base">
                    ₺{user.hourlyWageMin} - ₺{user.hourlyWageMax}/saat
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="edit" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profili Düzenle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isEmployer ? 'Şirket Adı' : 'Ad Soyad'}</Label>
                  <Input className="h-11" value={form.companyName || form.fullName} onChange={(e) => isEmployer ? setForm({ ...form, companyName: e.target.value }) : setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input className="h-11" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+90 5XX..." />
                </div>
                <div className="space-y-2">
                  <Label>Şehir</Label>
                  <Input className="h-11" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>İlçe</Label>
                  <Input className="h-11" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adres</Label>
                <Input className="h-11" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Hakkında</Label>
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Kendinizden veya şirketinizden bahsedin..." />
              </div>

              {isWorker && (
                <>
                  <div className="space-y-2">
                    <Label>Yetenekler (virgülle ayırın)</Label>
                    <Input className="h-11" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="Boyacı, Tesisatçı, Elektrikçi" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label>Tecrübe (yıl)</Label>
                      <Input className="h-11" type="number" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Ücret (₺/saat)</Label>
                      <Input className="h-11" type="number" value={form.hourlyWageMin} onChange={(e) => setForm({ ...form, hourlyWageMin: Number(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Ücret (₺/saat)</Label>
                      <Input className="h-11" type="number" value={form.hourlyWageMax} onChange={(e) => setForm({ ...form, hourlyWageMax: Number(e.target.value) })} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0">
                      <Label className="font-medium">İş Arıyorum</Label>
                      <p className="text-xs text-gray-500">İşverenler sizi iş arayan olarak görecek</p>
                    </div>
                    <Switch checked={form.isAvailable} onCheckedChange={(v) => setForm({ ...form, isAvailable: v })} />
                  </div>
                </>
              )}

              <Button onClick={handleSave} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-sm" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Değişiklikleri Kaydet
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 mt-4">
          {/* Şifre Değiştirme */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                Şifre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
              {securityInfo?.hasPassword === false ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Google ile giriş yaptığınız için şifre değiştiremezsiniz.</span>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Mevcut Şifre</Label>
                    <Input
                      type="password"
                      className="h-11"
                      value={pwForm.current}
                      onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                      placeholder="••••••"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Yeni Şifre</Label>
                      <Input
                        type="password"
                        className="h-11"
                        value={pwForm.next}
                        onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                        placeholder="Min 6 karakter"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Yeni Şifre (Tekrar)</Label>
                      <Input
                        type="password"
                        className="h-11"
                        value={pwForm.confirm}
                        onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                        placeholder="Tekrar girin"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={pwLoading || !pwForm.current || !pwForm.next}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-sm"
                  >
                    {pwLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Şifreyi Güncelle
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* E-posta Değiştirme */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600" />
                E-posta Adresi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{user.email}</span>
                {user.emailVerified ? (
                  <Badge className="bg-emerald-100 text-emerald-700 text-[10px] ml-auto flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 mr-0.5" /> Doğrulanmış
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 text-[10px] ml-auto flex-shrink-0">
                    Doğrulanmamış
                  </Badge>
                )}
              </div>
              {emailStep === 'request' ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Yeni E-posta Adresi</Label>
                    <Input
                      type="email"
                      className="h-11"
                      value={emailForm.newEmail}
                      onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                      placeholder="yeni@email.com"
                    />
                  </div>
                  <Button
                    onClick={handleEmailChangeRequest}
                    disabled={emailLoading || !emailForm.newEmail}
                    variant="outline"
                    className="w-full h-11 text-sm"
                  >
                    {emailLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                    Doğrulama Kodu Gönder
                  </Button>
                </>
              ) : (
                <>
                  {emailPreview && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      <strong>Demo:</strong> {emailPreview}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Doğrulama Kodu</Label>
                    <Input
                      className="h-11 text-center text-lg tracking-widest"
                      value={emailForm.code}
                      onChange={(e) => setEmailForm({ ...emailForm, code: e.target.value })}
                      placeholder="6 haneli kod"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 text-sm"
                      onClick={() => { setEmailStep('request'); setEmailPreview('') }}
                    >
                      Geri
                    </Button>
                    <Button
                      onClick={handleEmailChangeConfirm}
                      disabled={emailLoading || !emailForm.code}
                      className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-sm"
                    >
                      {emailLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                      E-postayı Güncelle
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* 2FA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                İki Faktörlü Doğrulama (2FA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
                securityInfo?.twoFactorEnabled
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}>
                <Shield className={`w-5 h-5 ${securityInfo?.twoFactorEnabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">
                    {securityInfo?.twoFactorEnabled ? '2FA Aktif' : '2FA Devre Dışı'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {securityInfo?.twoFactorEnabled
                      ? 'Google Authenticator ile korunuyor'
                      : 'Hesabınızı daha güvenli hale getirin'}
                  </div>
                </div>
              </div>

              {securityInfo?.twoFactorEnabled ? (
                <Button
                  variant="outline"
                  className="w-full h-11 text-red-600 border-red-200 hover:bg-red-50 text-sm"
                  onClick={() => setDisable2FADialog(true)}
                >
                  <X className="w-4 h-4 mr-2" />
                  2FA'yı Devre Dışı Bırak
                </Button>
              ) : (
                <Button
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-sm"
                  onClick={handleSetup2FA}
                  disabled={twoFALoading}
                >
                  {twoFALoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Smartphone className="w-4 h-4 mr-2" />}
                  2FA'yı Etkinleştir
                </Button>
              )}

              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                <strong className="text-blue-800">ℹ️ 2FA nedir?</strong>
                <p className="mt-1">Google Authenticator, Authy veya Microsoft Authenticator gibi bir TOTP uygulaması kullanarak giriş yaparken ek bir kod girersiniz. Bu, hesabınızı çalınan şifrelere karşı korur.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={twoFADialog} onOpenChange={setTwoFADialog}>
        <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              2FA Kurulumu
            </DialogTitle>
            <DialogDescription className="text-sm">
              {twoFAStep === 'setup' && 'QR kodunu authenticator uygulamanızla tarayın.'}
              {twoFAStep === 'backup' && 'Bu kodları güvenli bir yerde saklayın.'}
              {twoFAStep === 'verify' && 'Uygulamanızdaki 6 haneli kodu girin.'}
            </DialogDescription>
          </DialogHeader>

          {twoFAStep === 'setup' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {twoFAQrCode && (
                  <img src={twoFAQrCode} alt="QR Kod" className="w-56 h-56 rounded-lg border" />
                )}
              </div>
              <div className="text-xs text-gray-500 text-center">
                <p className="mb-2">QR kodu tarayamıyorsanız, bu kodu manuel girin:</p>
                <code className="block bg-gray-100 p-2 rounded font-mono text-[11px] break-all">{twoFASecret}</code>
              </div>
              <Button
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-sm"
                onClick={() => setTwoFAStep('backup')}
              >
                Backup Kodlarını Göster
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {twoFAStep === 'backup' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Bu kodları güvenli bir yerde saklayın. Telefonunuzu kaybederseniz hesabınıza erişmek için bunlara ihtiyacınız olacak.
              </div>
              <div className="grid grid-cols-2 gap-2">
                {twoFABackupCodes.map((code, i) => (
                  <code key={i} className="bg-gray-100 p-2 rounded text-center font-mono text-sm">{code}</code>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full h-11 text-sm"
                onClick={copyBackupCodes}
              >
                <Copy className="w-4 h-4 mr-2" />
                Kodları Kopyala
              </Button>
              <Button
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-sm"
                onClick={() => setTwoFAStep('verify')}
              >
                Doğrulama Adımına Geç
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {twoFAStep === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Doğrulama Kodu</Label>
                <Input
                  className="h-12 text-center text-xl tracking-widest"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
              <Button
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-sm"
                onClick={handleVerify2FA}
                disabled={twoFALoading || twoFACode.length !== 6}
              >
                {twoFALoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                2FA'yı Aktif Et
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={disable2FADialog} onOpenChange={setDisable2FADialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">2FA'yı Devre Dışı Bırak</DialogTitle>
            <DialogDescription className="text-sm">
              Devre dışı bırakmak için authenticator kodunuzu girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Doğrulama Kodu</Label>
              <Input
                className="h-12 text-center text-xl tracking-widest"
                value={disable2FACode}
                onChange={(e) => setDisable2FACode(e.target.value)}
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-11" onClick={() => setDisable2FADialog(false)}>
                İptal
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-11 text-red-600 border-red-200 hover:bg-red-50"
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

      <Button variant="outline" onClick={() => logout()} className="w-full h-11 mt-4 text-red-600 hover:text-red-700 text-sm">
        Çıkış Yap
      </Button>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-lg sm:text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-[10px] sm:text-xs text-gray-500">{label}</div>
      </CardContent>
    </Card>
  )
}
