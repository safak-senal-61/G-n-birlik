'use client'

import { useEffect, useState, useCallback } from 'react'
import { walletApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Wallet as WalletIcon,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowRightLeft,
  QrCode,
  Plus,
  Minus,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  TURKISH_BANKS,
  BankInfo,
  ModernBankCard,
  BankSelector,
  FixedTrIbanInput,
} from '@/components/shared/bank-card'

export default function WalletScreen() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('ALL')

  // Dialog states
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)

  // Withdraw (IBAN'lı) - İşçi için
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawName, setWithdrawName] = useState(user?.fullName || '')
  const [withdrawIbanDigits, setWithdrawIbanDigits] = useState('')
  const [withdrawBank, setWithdrawBank] = useState<BankInfo | null>(TURKISH_BANKS[0])
  const [withdrawCustomBank, setWithdrawCustomBank] = useState('')

  // Deposit (IBAN'lı) - İşveren için
  const [depositAmount, setDepositAmount] = useState('')
  const [depositName, setDepositName] = useState(user?.fullName || '')
  const [depositIbanDigits, setDepositIbanDigits] = useState('')
  const [depositBank, setDepositBank] = useState<BankInfo | null>(TURKISH_BANKS[0])
  const [depositCustomBank, setDepositCustomBank] = useState('')

  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (user?.fullName) {
      if (!depositName) setDepositName(user.fullName)
      if (!withdrawName) setWithdrawName(user.fullName)
    }
  }, [user])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [bal, txs] = await Promise.all([
        walletApi.balance(),
        walletApi.transactions({ type: filterType, pageSize: 50 }),
      ])
      setBalance(bal.balance)
      setTransactions(txs.items)
    } catch (e: any) {
      toast.error('Cüzdan bilgileri yüklenemedi', { description: e.message })
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    load()
  }, [load])

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount < 50) { toast.error('Minimum 50₺ çekim yapabilirsiniz'); return }
    if (amount > balance) { toast.error('Yetersiz bakiye! Mevcut bakiyeniz: ' + balance + '₺'); return }
    if (!withdrawName || withdrawName.trim().length < 3) { toast.error('Lütfen Ad Soyad giriniz'); return }
    if (withdrawIbanDigits.length !== 24) { toast.error('Lütfen 24 haneli geçerli IBAN numarasını eksiksiz girin (TR sabittir)'); return }
    
    const bankName = withdrawBank?.id === 'other' ? withdrawCustomBank : withdrawBank?.name
    if (!bankName) { toast.error('Lütfen banka seçiniz'); return }

    const fullIban = `TR${withdrawIbanDigits}`
    setActionLoading(true)
    try {
      await walletApi.createWithdrawRequest({
        amount,
        recipientName: withdrawName.trim(),
        recipientIban: fullIban,
        recipientBank: bankName,
      })
      toast.success('Çekme talebi oluşturuldu! 3-5 iş günü içinde sonuçlanacak.')
      setWithdrawOpen(false)
      setWithdrawAmount('')
      setWithdrawIbanDigits('')
      await load()
    } catch (e: any) { toast.error('Hata', { description: e.message }) }
    finally { setActionLoading(false) }
  }

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (!amount || amount < 50) { toast.error('Minimum 50₺ yatırabilirsiniz'); return }
    if (!depositName || depositName.trim().length < 3) { toast.error('Lütfen Ad Soyad giriniz'); return }
    if (depositIbanDigits.length !== 24) { toast.error('Lütfen 24 haneli geçerli IBAN numarasını eksiksiz girin (TR sabittir)'); return }

    const bankName = depositBank?.id === 'other' ? depositCustomBank : depositBank?.name
    if (!bankName) { toast.error('Lütfen banka seçiniz'); return }

    const fullIban = `TR${depositIbanDigits}`
    setActionLoading(true)
    try {
      await walletApi.createDepositRequest({
        amount,
        senderName: depositName.trim(),
        senderIban: fullIban,
        senderBank: bankName,
      })
      toast.success('Yatırma talebi oluşturuldu! EFT/Havale yapıldıktan sonra admin onayı ile bakiyenize yansıyacaktır.')
      setDepositOpen(false)
      setDepositAmount('')
      setDepositIbanDigits('')
      await load()
    } catch (e: any) { toast.error('Hata', { description: e.message }) }
    finally { setActionLoading(false) }
  }

  const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
    DEPOSIT: { label: 'Yükleme', icon: ArrowDownCircle, color: 'text-emerald-600' },
    WITHDRAW: { label: 'Çekme', icon: ArrowUpCircle, color: 'text-red-600' },
    TRANSFER: { label: 'Transfer', icon: ArrowRightLeft, color: 'text-blue-600' },
    QR_PAYMENT: { label: 'QR Ödeme', icon: QrCode, color: 'text-purple-600' },
    JOB_PAYMENT: { label: 'İş Ücreti', icon: TrendingUp, color: 'text-emerald-600' },
    REFUND: { label: 'İade', icon: RefreshCw, color: 'text-amber-600' },
    FEE: { label: 'Komisyon', icon: Minus, color: 'text-red-600' },
    BONUS: { label: 'Bonus', icon: Plus, color: 'text-emerald-600' },
  }

  const statusInfo: Record<string, { label: string; color: string; icon: any }> = {
    COMPLETED: { label: 'Tamamlandı', color: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60', icon: CheckCircle2 },
    PENDING: { label: 'Beklemede', color: 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60', icon: Clock },
    FAILED: { label: 'Başarısız', color: 'text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60', icon: XCircle },
    CANCELLED: { label: 'İptal', color: 'text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700', icon: AlertCircle },
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-64 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-4xl">
      {/* Başlık */}
      <div className="mb-5 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
          <WalletIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          Cüzdanım
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Bakiye, işlem geçmişi ve ödemeler</p>
      </div>

      {/* Bakiye Kartı - 3D Financial Vault Card */}
      <div className="mb-6 card-3d-dark rounded-3xl p-6 sm:p-8 relative overflow-hidden text-white border border-emerald-500/30 shadow-[0_20px_50px_-15px_rgba(5,150,105,0.4)] preserve-3d">
        <div className="absolute inset-0 bg-spatial-grid opacity-25 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-start justify-between mb-4 preserve-3d">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full badge-3d-dark text-[11px] font-bold text-emerald-300 mb-2 translate-z-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>GÜVENLİ CÜZDAN & HAVUZ BAKİYESİ</span>
            </div>
            <p className="text-emerald-100 text-xs sm:text-sm font-semibold tracking-wide">Kullanılabilir Bakiye</p>
            <p className="text-3xl sm:text-5xl font-black tracking-tight mt-1 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] translate-z-4">
              {balance.toLocaleString('tr-TR')}₺
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.3)] translate-z-4">
            <WalletIcon className="w-7 h-7" />
          </div>
        </div>

        {/* Butonlar — 3D Tactile Push Buttons */}
        <div className="relative z-10 flex flex-wrap gap-3 mt-4 pt-2 border-t border-white/20 preserve-3d">
          {(user?.role === 'EMPLOYER' || user?.role === 'ADMIN') && (
            <button
              type="button"
              className="btn-3d-emerald btn-3d-pill px-5 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2 translate-z-4"
              onClick={() => setDepositOpen(true)}
            >
              <ArrowDownCircle className="w-4 h-4 text-emerald-100" />
              <span>Para Yatır (Havuz Bakiye)</span>
            </button>
          )}
          {(user?.role === 'WORKER' || user?.role === 'ADMIN') && (
            <button
              type="button"
              className="btn-3d-white btn-3d-pill px-5 py-2.5 text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2 translate-z-4 shadow-md"
              onClick={() => setWithdrawOpen(true)}
            >
              <ArrowUpCircle className="w-4 h-4 text-emerald-700" />
              <span>Bakiye Çek (IBAN)</span>
            </button>
          )}
        </div>
      </div>

      {/* İşlem Geçmişi - 3D Spatial */}
      <div className="card-3d-spatial rounded-3xl border border-slate-200/90 dark:border-white/10 dark:bg-slate-900/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">İşlem Geçmişi</h2>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
              {['ALL', 'DEPOSIT', 'WITHDRAW', 'JOB_PAYMENT', 'REFUND'].map((t) => {
                const isActive = filterType === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'btn-3d-emerald btn-3d-pill'
                        : 'btn-3d-white btn-3d-pill text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {t === 'ALL' ? 'Tümü' : typeLabels[t]?.label || t}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        <div className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
              <WalletIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-medium">Henüz işlem yok</p>
              <p className="text-xs mt-1">İşlemleriniz burada görünecek</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/10">
              {transactions.map((tx) => {
                const typeInfo = typeLabels[tx.type] || { label: tx.type, icon: WalletIcon, color: 'text-gray-600 dark:text-slate-400' }
                const statusInfo2 = statusInfo[tx.status] || statusInfo.COMPLETED
                const Icon = typeInfo.icon
                const isPositive = tx.amount > 0
                return (
                  <div key={tx.id} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isPositive ? 'bg-emerald-50 dark:bg-emerald-950/60' : 'bg-red-50 dark:bg-red-950/60'
                    }`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${typeInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{tx.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className={`text-[9px] sm:text-[10px] ${statusInfo2.color}`}>
                          {statusInfo2.label}
                        </Badge>
                        <span className="text-[10px] sm:text-xs text-gray-500">
                          {new Date(tx.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    <div className={`text-right shrink-0 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                      <p className="text-sm sm:font-semibold font-bold">
                        {isPositive ? '+' : ''}{tx.amount.toLocaleString('tr-TR')}₺
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500">{tx.balanceAfter.toLocaleString('tr-TR')}₺</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Para Yatırma Dialog — Ultra Modern Kart & Banka Seçimli */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowDownCircle className="w-5 h-5" />
              </div>
              Hesabına Para Yatır
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              Kendi banka hesabınızdan EFT/Havale ile para yatırın. Bilgilerinizi girip transferi yaptıktan sonra bakiyeniz hesabınıza yansıtılacaktır.
            </DialogDescription>
          </DialogHeader>

          {/* Ultra Modern Kart Önizlemesi */}
          <div className="py-1">
            <ModernBankCard
              cardType="DEPOSIT"
              amount={depositAmount}
              name={depositName}
              ibanDigits={depositIbanDigits}
              selectedBank={depositBank}
              customBankName={depositCustomBank}
            />
          </div>

          <div className="space-y-3.5 py-1">
            <div>
              <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Tutar (₺) — Min 50₺ *</Label>
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="500"
                min="50"
                className="h-10 mt-1 text-sm font-semibold dark:bg-slate-800 dark:border-white/10 dark:text-white"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Ad Soyad (Gönderen) *</Label>
              <Input
                value={depositName}
                onChange={(e) => setDepositName(e.target.value)}
                placeholder="Ahmet Yılmaz"
                className="h-10 mt-1 text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
              />
            </div>

            {/* Banka Seçici (Logolu ve Tikli) */}
            <BankSelector
              selectedBankId={depositBank?.id || ''}
              onSelectBank={(b) => setDepositBank(b)}
              customBankName={depositCustomBank}
              onCustomBankNameChange={setDepositCustomBank}
            />

            {/* TR Sabit IBAN Girişi */}
            <FixedTrIbanInput
              digits={depositIbanDigits}
              onChangeDigits={setDepositIbanDigits}
              label="Gönderen IBAN (Kendi Banka Hesabınız)"
            />

            {/* Alıcı Şirket Hesap Bilgisi */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200/80 dark:border-blue-800/50 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1.5 shadow-2xs">
              <div className="font-semibold text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                <span>📌</span>
                <span>Havale Yapılacak Şirket Hesabı</span>
              </div>
              <div className="bg-white/80 dark:bg-slate-850/90 p-2.5 rounded-lg border border-blue-100 dark:border-white/10 font-mono text-xs space-y-1">
                <div className="text-gray-600 dark:text-slate-400 text-[11px] font-sans">
                  Alıcı Ünvanı: <strong className="text-gray-900 dark:text-slate-100 font-semibold">Günübirlik İş Bul A.Ş.</strong>
                </div>
                <div className="text-gray-600 dark:text-slate-400 text-[11px] font-sans">
                  IBAN: <strong className="text-blue-900 dark:text-blue-400 font-bold select-all tracking-wider">TR99 0001 2345 6789 0123 4567 89</strong>
                </div>
                <div className="text-amber-800 dark:text-amber-400 text-[10px] font-sans">
                  💡 Açıklama kısmına sistemde kayıtlı cep telefon numaranızı yazınız.
                </div>
              </div>
            </div>

            <Button
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition"
              onClick={handleDeposit}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowDownCircle className="w-4 h-4 mr-2" />}
              Yatırma Talebi Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Para Çekme Dialog — Ultra Modern Kart & Banka Seçimli */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 dark:bg-slate-900 dark:border-white/10 dark:text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900 dark:text-slate-100">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <ArrowUpCircle className="w-5 h-5" />
              </div>
              Para Çek (IBAN&apos;a)
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
              Cüzdan bakiyenizi kendi banka hesabınıza çekin. Talebiniz onaylandıktan sonra paranız hesabınıza aktarılır.
              <br />Mevcut Bakiye: <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{balance.toLocaleString('tr-TR')}₺</strong>
            </DialogDescription>
          </DialogHeader>

          {/* Ultra Modern Kart Önizlemesi */}
          <div className="py-1">
            <ModernBankCard
              cardType="WITHDRAW"
              amount={withdrawAmount}
              name={withdrawName}
              ibanDigits={withdrawIbanDigits}
              selectedBank={withdrawBank}
              customBankName={withdrawCustomBank}
            />
          </div>

          <div className="space-y-3.5 py-1">
            <div>
              <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Tutar (₺) — Min 50₺ *</Label>
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="500"
                min="50"
                max={balance}
                className="h-10 mt-1 text-sm font-semibold dark:bg-slate-800 dark:border-white/10 dark:text-white"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700 dark:text-slate-300">Ad Soyad (Alıcı) *</Label>
              <Input
                value={withdrawName}
                onChange={(e) => setWithdrawName(e.target.value)}
                placeholder="Ahmet Yılmaz"
                className="h-10 mt-1 text-sm dark:bg-slate-800 dark:border-white/10 dark:text-white"
              />
            </div>

            {/* Banka Seçici (Logolu ve Tikli) */}
            <BankSelector
              selectedBankId={withdrawBank?.id || ''}
              onSelectBank={(b) => setWithdrawBank(b)}
              customBankName={withdrawCustomBank}
              onCustomBankNameChange={setWithdrawCustomBank}
            />

            {/* TR Sabit IBAN Girişi */}
            <FixedTrIbanInput
              digits={withdrawIbanDigits}
              onChangeDigits={setWithdrawIbanDigits}
              label="Alıcı IBAN (Paranın Yatacağı Hesap)"
            />

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-200 space-y-1 shadow-2xs">
              <div className="font-semibold text-amber-950 dark:text-amber-300 flex items-center gap-1">
                <span>⏳</span>
                <span>İşlem Süreci</span>
              </div>
              <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                Talebiniz alındıktan sonra <strong>3-5 iş günü</strong> içinde incelenir ve IBAN hesabınıza gönderilir. Onay süreci tamamlanana kadar çekilen tutar bakiyenizden düşülür.
              </p>
            </div>

            <Button
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-sm transition"
              onClick={handleWithdraw}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpCircle className="w-4 h-4 mr-2" />}
              Çekme Talebi Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
