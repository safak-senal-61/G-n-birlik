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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8D5CC] dark:border-[#262C29] pb-5">
        <div className="space-y-1">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
            FİNANSAL DEFTER • EMANET & BAKİYE KASASI
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141615] dark:text-white">
            Cüzdanım ve Hesap Hareketleri
          </h1>
          <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
            Yevmiye ödemelerinizi, emanet havuz bakiyenizi ve IBAN transferlerinizi yönetin.
          </p>
        </div>
      </div>

      {/* Bakiye Panosu */}
      <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#0D6847] dark:text-[#5CD6A5] bg-[#EAF3EE] dark:bg-[#162921] px-2 py-0.5 rounded-sm border border-[#C5DDD0] dark:border-[#244738]">
              <CheckCircle2 className="w-3 h-3" />
              <span>DOĞRULANMIŞ KULLANILABİLİR BAKİYE</span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-[#141615] dark:text-white pt-1">
              {balance.toLocaleString('tr-TR')} ₺
            </div>
            <p className="text-xs text-[#5C615E] dark:text-[#949B97]">
              Emanet onayı tamamlanan net tutarlar doğrudan kullanılabilir bakiyenize yansır.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            {(user?.role === 'EMPLOYER' || user?.role === 'ADMIN') && (
              <button
                type="button"
                className="h-10 px-4 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer w-full sm:w-auto"
                onClick={() => setDepositOpen(true)}
              >
                <ArrowDownCircle className="w-4 h-4 shrink-0" />
                <span>Para Yatır (Havuz Bakiye)</span>
              </button>
            )}
            {(user?.role === 'WORKER' || user?.role === 'ADMIN') && (
              <button
                type="button"
                className="h-10 px-4 rounded-md bg-[#141615] hover:bg-[#272B29] dark:bg-[#F2F1ED] dark:hover:bg-white text-white dark:text-[#141615] text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer w-full sm:w-auto"
                onClick={() => setWithdrawOpen(true)}
              >
                <ArrowUpCircle className="w-4 h-4 shrink-0" />
                <span>Bakiye Çek (IBAN)</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* İşlem Geçmişi Cetveli */}
      <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm sm:text-base font-bold text-[#141615] dark:text-white">
            Hesap Hareketleri Cetveli
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {['ALL', 'DEPOSIT', 'WITHDRAW', 'JOB_PAYMENT', 'REFUND'].map((t) => {
              const isActive = filterType === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(t)}
                  className={`h-8 px-3 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#141615] text-white border-[#141615] dark:bg-[#F2F1ED] dark:text-[#141615] dark:border-[#F2F1ED]'
                      : 'bg-white dark:bg-[#141716] text-[#5C615E] dark:text-[#949B97] border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847]'
                  }`}
                >
                  {t === 'ALL' ? 'Tümü' : typeLabels[t]?.label || t}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-[#5C615E] dark:text-[#949B97] space-y-1.5">
              <WalletIcon className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm font-bold text-[#141615] dark:text-white">Henüz işlem kaydı yok</p>
              <p className="text-xs">Yevmiye ve bakiye transferleriniz burada listelenir.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#ECEAE4] dark:divide-[#222624]">
              {transactions.map((tx) => {
                const typeInfo = typeLabels[tx.type] || {
                  label: tx.type,
                  icon: WalletIcon,
                  color: 'text-[#5C615E]',
                }
                const statusInfo2 = statusInfo[tx.status] || statusInfo.COMPLETED
                const Icon = typeInfo.icon
                const isPositive = tx.amount > 0
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-4 hover:bg-[#F9F8F6] dark:hover:bg-[#181C1A] transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
                        isPositive
                          ? 'bg-[#EAF3EE] text-[#0D6847] border-[#C5DDD0] dark:bg-[#162921] dark:text-[#5CD6A5] dark:border-[#244738]'
                          : 'bg-[#FBEEE9] text-[#B43B21] border-[#EFC7BD] dark:bg-[#2A1915] dark:text-[#F28B73] dark:border-[#4A251D]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#141615] dark:text-white truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#F0EFEA] dark:bg-[#1E2421] text-[#454A47] dark:text-[#B8C0BC] border border-[#E2E0D8] dark:border-[#2C3330]">
                          {statusInfo2.label}
                        </span>
                        <span className="font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
                          {new Date(tx.createdAt).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-mono text-sm font-bold ${
                          isPositive
                            ? 'text-[#0D6847] dark:text-[#5CD6A5]'
                            : 'text-[#C84B31] dark:text-[#F28B73]'
                        }`}
                      >
                        {isPositive ? '+' : ''}
                        {tx.amount.toLocaleString('tr-TR')} ₺
                      </p>
                      <p className="font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
                        Bakiye: {tx.balanceAfter.toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Para Yatırma Dialog — Mimari Ledger Dekont & Banka Seçimli */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md sm:max-w-lg max-h-[88dvh] overflow-y-auto p-3.5 sm:p-6 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] text-[#141716] dark:text-[#F0F2F1]">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-semibold text-[#141716] dark:text-[#F0F2F1]">
              <div className="w-8 h-8 rounded-md bg-[#E6F2EC] dark:bg-[#0D6847]/20 text-[#0D6847] dark:text-[#27A878] flex items-center justify-center shrink-0">
                <ArrowDownCircle className="w-4 h-4" />
              </div>
              <span>Hesabına Para Yatır</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#535A56] dark:text-[#9DA6A0]">
              Kendi banka hesabınızdan EFT/Havale ile para yatırın. Bilgilerinizi girip transferi yaptıktan sonra bakiyeniz hesabınıza yansıtılacaktır.
            </DialogDescription>
          </DialogHeader>

          {/* Dekont Önizlemesi */}
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

          <div className="space-y-3 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Tutar (₺) — Min 50₺ *</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="500"
                  min="50"
                  className="h-10 mt-1 text-sm font-mono font-semibold rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Ad Soyad (Gönderen) *</Label>
                <Input
                  value={depositName}
                  onChange={(e) => setDepositName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="h-10 mt-1 text-sm rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                />
              </div>
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
            <div className="p-3 bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] rounded-md text-xs space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#0D6847] dark:text-[#27A878]">
                HAVALE YAPILACAK ŞİRKET HESABI
              </div>
              <div className="bg-white dark:bg-[#141716] p-2.5 sm:p-3 rounded border border-[#E2E0D8] dark:border-[#252B28] space-y-1.5">
                <div className="text-[#535A56] dark:text-[#9DA6A0] text-[11px]">
                  Alıcı Ünvanı: <strong className="text-[#141716] dark:text-[#F0F2F1] font-semibold">Günübirlik İş Bul A.Ş.</strong>
                </div>
                <div className="text-[#535A56] dark:text-[#9DA6A0] text-[11px] break-all">
                  IBAN: <strong className="font-mono text-[#0D6847] dark:text-[#27A878] font-bold select-all tracking-wider">TR99 0001 2345 6789 0123 4567 89</strong>
                </div>
                <div className="text-[#535A56] dark:text-[#9DA6A0] text-[11px] pt-1 border-t border-[#E2E0D8] dark:border-[#252B28]">
                  Açıklama kısmına sistemde kayıtlı cep telefon numaranızı yazınız.
                </div>
              </div>
            </div>

            <Button
              className="w-full h-11 bg-[#0D6847] hover:bg-[#0A5238] text-white font-semibold text-sm rounded-md transition"
              onClick={handleDeposit}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowDownCircle className="w-4 h-4 mr-2" />}
              Yatırma Talebi Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Para Çekme Dialog — Mimari Ledger Dekont & Banka Seçimli */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md sm:max-w-lg max-h-[88dvh] overflow-y-auto p-3.5 sm:p-6 rounded-md bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] text-[#141716] dark:text-[#F0F2F1]">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-semibold text-[#141716] dark:text-[#F0F2F1]">
              <div className="w-8 h-8 rounded-md bg-[#E6F2EC] dark:bg-[#0D6847]/20 text-[#0D6847] dark:text-[#27A878] flex items-center justify-center shrink-0">
                <ArrowUpCircle className="w-4 h-4" />
              </div>
              <span>Para Çek (IBAN&apos;a)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#535A56] dark:text-[#9DA6A0]">
              Cüzdan bakiyenizi kendi banka hesabınıza çekin. Talebiniz onaylandıktan sonra paranız hesabınıza aktarılır.
              <span className="block mt-1 font-mono text-[11px]">
                Mevcut Bakiye: <strong className="text-[#0D6847] dark:text-[#27A878] font-bold">₺{balance.toLocaleString('tr-TR')}</strong>
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* Dekont Önizlemesi */}
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

          <div className="space-y-3 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Tutar (₺) — Min 50₺ *</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="500"
                  min="50"
                  max={balance}
                  className="h-10 mt-1 text-sm font-mono font-semibold rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-[#141716] dark:text-[#F0F2F1]">Ad Soyad (Alıcı) *</Label>
                <Input
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="h-10 mt-1 text-sm rounded-md border-[#E2E0D8] dark:border-[#252B28] bg-[#FBFBF9] dark:bg-[#0C0E0D] text-[#141716] dark:text-[#F0F2F1]"
                />
              </div>
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

            <div className="p-3 bg-[#FBFBF9] dark:bg-[#181C1A] border border-[#E2E0D8] dark:border-[#252B28] rounded-md text-xs space-y-1">
              <div className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#0D6847] dark:text-[#27A878]">
                İŞLEM SÜRECİ
              </div>
              <p className="text-[11px] text-[#535A56] dark:text-[#9DA6A0] leading-relaxed">
                Talebiniz alındıktan sonra <strong className="text-[#141716] dark:text-[#F0F2F1]">3-5 iş günü</strong> içinde incelenir ve IBAN hesabınıza gönderilir. Onay süreci tamamlanana kadar çekilen tutar bakiyenizden düşülür.
              </p>
            </div>

            <Button
              className="w-full h-11 bg-[#0D6847] hover:bg-[#0A5238] text-white font-semibold text-sm rounded-md transition"
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
