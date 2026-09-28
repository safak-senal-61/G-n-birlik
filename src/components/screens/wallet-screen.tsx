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
import QrScannerCamera from '@/components/qr-scanner-camera'

export default function WalletScreen() {
  const { user } = useAuth()
  const [balance, setBalance] = useState<number>(0)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('ALL')

  // Dialog states
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [qrGenerateOpen, setQrGenerateOpen] = useState(false)
  const [qrScanOpen, setQrScanOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)

  // Withdraw (IBAN'lı)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawName, setWithdrawName] = useState('')
  const [withdrawIban, setWithdrawIban] = useState('')
  const [withdrawBank, setWithdrawBank] = useState('')

  // Deposit (IBAN'lı)
  const [depositAmount, setDepositAmount] = useState('')
  const [depositName, setDepositName] = useState('')
  const [depositIban, setDepositIban] = useState('')
  const [depositBank, setDepositBank] = useState('')

  const [transferRecipient, setTransferRecipient] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferDesc, setTransferDesc] = useState('')
  const [qrAmount, setQrAmount] = useState('')
  const [qrDesc, setQrDesc] = useState('')
  const [qrToken, setQrToken] = useState('')
  const [generatedQr, setGeneratedQr] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [walletQrCameraMode, setWalletQrCameraMode] = useState(false)

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
    if (!amount || amount < 50) { toast.error('Minimum 50₺'); return }
    if (!withdrawName || withdrawName.trim().length < 3) { toast.error('Ad Soyad gerekli'); return }
    if (!withdrawIban || withdrawIban.trim().length < 10) { toast.error('Geçerli IBAN gerekli'); return }
    setActionLoading(true)
    try {
      await walletApi.createWithdrawRequest({
        amount,
        recipientName: withdrawName,
        recipientIban: withdrawIban,
        recipientBank: withdrawBank || undefined,
      })
      toast.success('Çekme talebi oluşturuldu! 3-5 iş günü içinde sonuçlanacak.')
      setWithdrawOpen(false)
      setWithdrawAmount(''); setWithdrawName(''); setWithdrawIban(''); setWithdrawBank('')
      await load()
    } catch (e: any) { toast.error('Hata', { description: e.message }) }
    finally { setActionLoading(false) }
  }

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (!amount || amount < 50) { toast.error('Minimum 50₺'); return }
    if (!depositName || depositName.trim().length < 3) { toast.error('Ad Soyad gerekli'); return }
    if (!depositIban || depositIban.trim().length < 10) { toast.error('Geçerli IBAN gerekli'); return }
    setActionLoading(true)
    try {
      await walletApi.createDepositRequest({
        amount,
        senderName: depositName,
        senderIban: depositIban,
        senderBank: depositBank || undefined,
      })
      toast.success('Yatırma talebi oluşturuldu! EFT/Havale yapıldıktan sonra admin onayı ile bakiyenize yansıyacaktır.')
      setDepositOpen(false)
      setDepositAmount(''); setDepositName(''); setDepositIban(''); setDepositBank('')
      await load()
    } catch (e: any) { toast.error('Hata', { description: e.message }) }
    finally { setActionLoading(false) }
  }

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount)
    if (!transferRecipient) {
      toast.error('Alıcı ID gerekli')
      return
    }
    if (!amount || amount < 10) {
      toast.error('Minimum transfer 10₺')
      return
    }
    setActionLoading(true)
    try {
      await walletApi.transfer(transferRecipient, amount, transferDesc)
      toast.success('Transfer başarılı!')
      setTransferOpen(false)
      setTransferRecipient('')
      setTransferAmount('')
      setTransferDesc('')
      await load()
    } catch (e: any) {
      toast.error('Transfer hatası', { description: e.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleQrGenerate = async () => {
    const amount = parseFloat(qrAmount)
    if (!amount || amount <= 0) {
      toast.error('Geçerli tutar girin')
      return
    }
    if (!qrDesc || qrDesc.trim().length < 3) {
      toast.error('Açıklama en az 3 karakter')
      return
    }
    setActionLoading(true)
    try {
      const result = await walletApi.generateQrPayment(amount, qrDesc.trim())
      setGeneratedQr(result)
      toast.success('QR ödeme kodu oluşturuldu! 5 dakika geçerli.')
    } catch (e: any) {
      toast.error('QR oluşturma hatası', { description: e.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleQrScan = async () => {
    if (!qrToken || qrToken.length < 10) {
      toast.error('Geçerli QR token girin')
      return
    }
    setActionLoading(true)
    try {
      const result = await walletApi.scanQrPayment(qrToken)
      toast.success('Ödeme alındı!', {
        description: `${result.amount.toLocaleString('tr-TR')}₺ bakiyenize eklendi.`,
      })
      setQrScanOpen(false)
      setQrToken('')
      await load()
    } catch (e: any) {
      toast.error('QR tarama hatası', { description: e.message })
    } finally {
      setActionLoading(false)
    }
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
    COMPLETED: { label: 'Tamamlandı', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
    PENDING: { label: 'Beklemede', color: 'text-amber-600 bg-amber-50', icon: Clock },
    FAILED: { label: 'Başarısız', color: 'text-red-600 bg-red-50', icon: XCircle },
    CANCELLED: { label: 'İptal', color: 'text-gray-600 bg-gray-50', icon: AlertCircle },
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
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <WalletIcon className="w-6 h-6 text-emerald-600" />
          Cüzdanım
        </h1>
        <p className="text-sm text-gray-500 mt-1">Bakiye, işlem geçmişi ve ödemeler</p>
      </div>

      {/* Bakiye Kartı */}
      <Card className="mb-4 sm:mb-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-white/10 blur-2xl" />
        <CardContent className="p-4 sm:p-6 relative">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-emerald-100 text-xs sm:text-sm">Mevcut Bakiye</p>
              <p className="text-2xl sm:text-4xl font-bold mt-1">{balance.toLocaleString('tr-TR')}₺</p>
            </div>
            <WalletIcon className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-200" />
          </div>
          {/* Butonlar — mobilde 2x2 grid, desktop'ta tek satır */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-3">
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs sm:text-sm"
              onClick={() => setDepositOpen(true)}
            >
              <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              Para Yatır
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs sm:text-sm"
              onClick={() => setWithdrawOpen(true)}
            >
              <ArrowUpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              Para Çek
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs sm:text-sm"
              onClick={() => setTransferOpen(true)}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              Transfer
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs sm:text-sm"
              onClick={() => setQrGenerateOpen(true)}
            >
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              QR Öde
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs sm:text-sm col-span-2 sm:col-span-1"
              onClick={() => setQrScanOpen(true)}
            >
              <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              QR Tara
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* İşlem Geçmişi */}
      <Card>
        <CardHeader className="pb-3 p-3 sm:p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm sm:text-lg">İşlem Geçmişi</CardTitle>
            <div className="flex gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
              {['ALL', 'DEPOSIT', 'WITHDRAW', 'TRANSFER', 'QR_PAYMENT', 'JOB_PAYMENT'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-colors ${
                    filterType === t
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t === 'ALL' ? 'Tümü' : typeLabels[t]?.label || t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <WalletIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-medium">Henüz işlem yok</p>
              <p className="text-xs mt-1">İşlemleriniz burada görünecek</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const typeInfo = typeLabels[tx.type] || { label: tx.type, icon: WalletIcon, color: 'text-gray-600' }
                const statusInfo2 = statusInfo[tx.status] || statusInfo.COMPLETED
                const Icon = typeInfo.icon
                const isPositive = tx.amount > 0
                return (
                  <div key={tx.id} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 hover:bg-gray-50">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isPositive ? 'bg-emerald-50' : 'bg-red-50'
                    }`}>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${typeInfo.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{tx.description}</p>
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
        </CardContent>
      </Card>

      {/* Para Yatırma Dialog — Kart Animasyonlu */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-emerald-600" />
              Hesabına Para Yatır
            </DialogTitle>
            <DialogDescription>
              Kendi banka hesabınızdan EFT/Havale ile para yatırın. Aşağıdaki banka bilgilerinizi girin, ödemeyi yaptıktan sonra admin onayı ile bakiyenize yansıyacaktır.
            </DialogDescription>
          </DialogHeader>

          {/* Kart Animasyonu */}
          <div className="relative h-32 mb-4 perspective-1000">
            <div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-4 text-white shadow-xl transition-transform"
              style={{
                transform: depositAmount ? 'rotateY(-5deg) rotateX(2deg)' : 'none',
                transition: 'transform 0.3s ease',
              }}
            >
              <div className="flex items-start justify-between h-full">
                <div>
                  <p className="text-emerald-100 text-[10px] uppercase tracking-wider">Bakiye Yükleme</p>
                  <p className="text-2xl font-bold mt-1">
                    {depositAmount ? `${parseFloat(depositAmount).toLocaleString('tr-TR')}₺` : '0₺'}
                  </p>
                  <p className="text-emerald-200 text-[10px] mt-2">{depositName || 'Ad Soyad'}</p>
                </div>
                <WalletIcon className="w-7 h-7 text-emerald-200" />
              </div>
              {/* Chip */}
              <div className="absolute bottom-3 left-4 w-8 h-6 rounded bg-yellow-400/80" />
              <p className="absolute bottom-3 right-4 text-[9px] text-emerald-200 font-mono">
                {depositIban ? `****${depositIban.slice(-4)}` : '****'}
              </p>
            </div>
          </div>

          <div className="space-y-3 py-1">
            <div>
              <Label>Tutar (₺) — Min 50₺</Label>
              <Input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="500" min="50" />
            </div>
            <div>
              <Label>Ad Soyad (Gönderen)</Label>
              <Input value={depositName} onChange={(e) => setDepositName(e.target.value)} placeholder="Ahmet Yılmaz" />
            </div>
            <div>
              <Label>IBAN (Gönderen)</Label>
              <Input value={depositIban} onChange={(e) => setDepositIban(e.target.value.toUpperCase())} placeholder="TR99 0001 2345 6789 0123 4567 89" />
            </div>
            <div>
              <Label>Banka Adı (opsiyonel)</Label>
              <Input value={depositBank} onChange={(e) => setDepositBank(e.target.value)} placeholder="İş Bankası" />
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg text-[11px] text-blue-700">
              📌 Aşağıdaki hesaba EFT/Havale yapın, ardından talebiniz admin tarafından onaylanacaktır:
              <br />
              <strong>Günübirlik İş Bul A.Ş.</strong><br />
              <strong>TR99 0001 2345 6789 0123 4567 89</strong><br />
              <span className="text-blue-500">Açıklamaya telefon numaranızı yazın</span>
            </div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleDeposit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowDownCircle className="w-4 h-4 mr-2" />}
              Yatırma Talebi Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Para Çekme Dialog — IBAN'lı */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-red-600" />
              Para Çek (IBAN'a)
            </DialogTitle>
            <DialogDescription>
              Cüzdan bakiyenizi kendi banka hesabınıza çekin. Talebiniz alındıktan sonra 3-5 iş günü içinde işlenir.
              <br />Mevcut bakiye: <strong>{balance.toLocaleString('tr-TR')}₺</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div>
              <Label>Tutar (₺) — Min 50₺</Label>
              <Input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="500" min="50" />
            </div>
            <div>
              <Label>Ad Soyad (Alıcı)</Label>
              <Input value={withdrawName} onChange={(e) => setWithdrawName(e.target.value)} placeholder="Ahmet Yılmaz" />
            </div>
            <div>
              <Label>IBAN (Alıcı)</Label>
              <Input value={withdrawIban} onChange={(e) => setWithdrawIban(e.target.value.toUpperCase())} placeholder="TR99 0001 2345 6789 0123 4567 89" />
            </div>
            <div>
              <Label>Banka Adı (opsiyonel)</Label>
              <Input value={withdrawBank} onChange={(e) => setWithdrawBank(e.target.value)} placeholder="İş Bankası" />
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg text-[11px] text-amber-700">
              ⏳ Talebiniz alındıktan sonra <strong>3-5 iş günü</strong> içinde incelenir ve IBAN'a gönderilir. Onay süreci tamamlanana kadar tutar bakiyenizden düşülür.
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleWithdraw} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpCircle className="w-4 h-4 mr-2" />}
              Çekme Talebi Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Para Transferi</DialogTitle>
            <DialogDescription>
              Başka bir kullanıcıya para gönderin. Min 10₺.
              Mevcut bakiye: {balance.toLocaleString('tr-TR')}₺
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Alıcı Kullanıcı ID</Label>
              <Input
                value={transferRecipient}
                onChange={(e) => setTransferRecipient(e.target.value)}
                placeholder="cmu..."
              />
            </div>
            <div>
              <Label>Tutar (₺)</Label>
              <Input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="100"
                min="10"
              />
            </div>
            <div>
              <Label>Açıklama (opsiyonel)</Label>
              <Input
                value={transferDesc}
                onChange={(e) => setTransferDesc(e.target.value)}
                placeholder="İş ücreti ödemesi"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleTransfer}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRightLeft className="w-4 h-4 mr-2" />}
              Transfer Yap
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Generate Dialog */}
      <Dialog open={qrGenerateOpen} onOpenChange={(v) => { setQrGenerateOpen(v); if (!v) setGeneratedQr(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR ile Öde</DialogTitle>
            <DialogDescription>
              Ödeme QR kodu üretin. Karşı taraf taradığında tutar otomatik transfer olur.
              Mevcut bakiye: {balance.toLocaleString('tr-TR')}₺
            </DialogDescription>
          </DialogHeader>
          {generatedQr ? (
            <div className="text-center py-4">
              <img
                src={generatedQr.qrImageDataUrl}
                alt="Ödeme QR"
                className="w-64 h-64 mx-auto rounded-xl border-2 border-emerald-200"
              />
              <div className="mt-4 space-y-1">
                <p className="text-2xl font-bold text-emerald-600">
                  {generatedQr.amount.toLocaleString('tr-TR')}₺
                </p>
                <p className="text-sm text-gray-600">{generatedQr.description}</p>
                <p className="text-xs text-amber-600 mt-2">
                  ⏰ Geçerlilik: {new Date(generatedQr.expiresAt).toLocaleTimeString('tr-TR')}
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setGeneratedQr(null)}
              >
                Yeni QR Üret
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label>Tutar (₺)</Label>
                <Input
                  type="number"
                  value={qrAmount}
                  onChange={(e) => setQrAmount(e.target.value)}
                  placeholder="250"
                  min="1"
                />
              </div>
              <div>
                <Label>Açıklama</Label>
                <Input
                  value={qrDesc}
                  onChange={(e) => setQrDesc(e.target.value)}
                  placeholder="İnşaat işçisi ücreti"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleQrGenerate}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <QrCode className="w-4 h-4 mr-2" />}
                QR Kod Üret
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Camera Scanner (cüzdan ödeme al) */}
      {qrScanOpen && walletQrCameraMode && (
        <QrScannerCamera
          onScan={async (token) => {
            setQrToken(token)
            setActionLoading(true)
            try {
              const result = await walletApi.scanQrPayment(token)
              toast.success('Ödeme alındı!', {
                description: `${result.amount.toLocaleString('tr-TR')}₺ bakiyenize eklendi.`,
              })
              setQrScanOpen(false)
              setWalletQrCameraMode(false)
              setQrToken('')
              await load()
            } catch (e: any) {
              toast.error('QR tarama hatası', { description: e.message })
              setQrScanOpen(false)
              setWalletQrCameraMode(false)
            } finally {
              setActionLoading(false)
            }
          }}
          onClose={() => { setQrScanOpen(false); setWalletQrCameraMode(false) }}
          loading={actionLoading}
          title="QR Tara — Ödeme Al"
          description="İşverenin QR kodunu kamera ile tarayın"
          onSwitchManual={() => { setWalletQrCameraMode(false) }}
        />
      )}

      {/* QR Scan Dialog (manuel) */}
      <Dialog open={qrScanOpen && !walletQrCameraMode} onOpenChange={(v) => { if (!v) setQrScanOpen(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Tara — Ödeme Al</DialogTitle>
            <DialogDescription>
              İşverenin QR kodunu kamera ile tarayın veya manuel token girin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Kamera butonu */}
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setWalletQrCameraMode(true)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              📷 Kamera ile Tara
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-500">veya manuel girin</span>
              </div>
            </div>

            <div>
              <Label>QR Token</Label>
              <Input
                value={qrToken}
                onChange={(e) => setQrToken(e.target.value)}
                placeholder="a1b2c3d4..."
              />
            </div>
            <Button
              className="w-full"
              onClick={handleQrScan}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowDownCircle className="w-4 h-4 mr-2" />}
              Ödemeyi Al
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
