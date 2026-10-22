'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  Lightbulb,
  Bug,
  UserCog,
  Wallet,
  HelpCircle,
  Mail,
  Phone,
  Globe,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { WhatsAppIcon } from '@/components/shared/social-icons'

const CATEGORIES = [
  { value: 'COMPLAINT', label: 'Şikayet', icon: AlertTriangle },
  { value: 'SUGGESTION', label: 'Öneri', icon: Lightbulb },
  { value: 'BUG', label: 'Teknik Hata', icon: Bug },
  { value: 'ACCOUNT', label: 'Hesap', icon: UserCog },
  { value: 'PAYMENT', label: 'Emanet & Ödeme', icon: Wallet },
  { value: 'OTHER', label: 'Diğer', icon: HelpCircle },
]

const FAQ = [
  {
    code: '01',
    q: 'İş ilanlarına nasıl başvurabilirim?',
    a: 'Ana sayfadaki iş ilanına tıklayıp "Başvur" butonuna basın. İşveren onayladığında bildirim alırsınız.',
  },
  {
    code: '02',
    q: 'QR ile mesaiye nasıl başlarım?',
    a: 'Sabah iş yerine vardığınızda işvereniniz Check-in QR kodu üretir. "Başvurularım" sayfasından "QR Tara" butonuna basıp kamerayla okuttuğunuzda mesai başlar.',
  },
  {
    code: '03',
    q: 'Cüzdanıma nasıl bakiye yüklerim?',
    a: 'Cüzdan ekranından "Para Yatır" adımını seçip kendi IBAN bilginizi girin ve belirtilen kurumsal hesaba EFT/Havale gönderin.',
  },
  {
    code: '04',
    q: 'Kazandığım yevmiyeyi banka hesabıma nasıl çekerim?',
    a: 'Cüzdan ekranından "Bakiye Çek (IBAN)" butonuna tıklayıp kendi adınıza kayıtlı IBAN numaranızı girerek çekim talebi oluşturabilirsiniz.',
  },
  {
    code: '05',
    q: 'Bildirim tercihlerini nereden değiştirebilirim?',
    a: 'Bildirimler ekranındaki ayarlar simgesine tıklayarak vardiya, mesaj ve ödeme bildirimlerini ayrı ayrı yönetebilirsiniz.',
  },
  {
    code: '06',
    q: 'E-posta adresimi nasıl doğrularım?',
    a: 'Profil sayfanızda e-posta adresinizin yanındaki "Doğrula" butonuna tıklayarak gönderilen 6 haneli kodu girmeniz yeterlidir.',
  },
]

export default function HelpScreen() {
  const [ticketOpen, setTicketOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState('COMPLAINT')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [deleteReason, setDeleteReason] = useState('')
  const [deleteFeedback, setDeleteFeedback] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/support/tickets', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      })
      const data = await res.json()
      if (data.success) setTickets(data.data.items || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTickets()
  }, [loadTickets])

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Konu ve mesaj alanları zorunludur.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ category, subject, message }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Destek kaydınız oluşturuldu.')
        setTicketOpen(false)
        setSubject('')
        setMessage('')
        loadTickets()
      } else {
        toast.error(data.error)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) {
      toast.error('Lütfen hesap kapatma sebebinizi yazın.')
      return
    }
    if (!confirm('Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/v1/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ reason: deleteReason, feedback: deleteFeedback }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Hesap silme talebiniz incelemeye alındı.')
        setDeleteOpen(false)
        setDeleteReason('')
        setDeleteFeedback('')
      } else {
        toast.error(data.error)
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D8D5CC] dark:border-[#262C29] pb-5">
        <div className="space-y-1">
          <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#0D6847] dark:text-[#5CD6A5]">
            OPERASYON DESTEK MASASI • YARDIM MERKEZİ
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141615] dark:text-white">
            Yardım & Destek Kayıtları
          </h1>
          <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
            Vardiya, emanet ödeme ve hesap işlemleriniz için doğrudan destek hattı.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setTicketOpen(true)}
          className="h-10 px-4 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Yeni Destek Kaydı Aç</span>
        </button>
      </div>

      {/* İletişim Cetveli */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ContactCard
          code="E-POSTA"
          icon={Mail}
          value="destek@gunubirlik.com"
          href="mailto:destek@gunubirlik.com"
        />
        <ContactCard
          code="TELEFON"
          icon={Phone}
          value="0850 123 45 67"
          href="tel:08501234567"
        />
        <ContactCard
          code="WHATSAPP"
          icon={WhatsAppIcon}
          value="Canlı Destek Hattı"
          href="https://wa.me/908501234567"
        />
        <ContactCard
          code="WEB"
          icon={Globe}
          value="gunubirlik.qrders.com.tr"
          href="https://gunubirlik.qrders.com.tr"
        />
      </div>

      {/* Destek Taleplerim */}
      <section className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#141615] dark:text-white">
            Açtığım Destek Kayıtları
          </h2>
          <span className="font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
            {tickets.length} KAYIT
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-center font-mono text-xs text-[#5C615E]">Yükleniyor...</div>
        ) : tickets.length === 0 ? (
          <div className="p-6 text-center text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97]">
            Henüz oluşturulmuş bir destek talebiniz bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-[#ECEAE4] dark:divide-[#222624]">
            {tickets.map((t) => (
              <div key={t.id} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-[#F0EFEA] dark:bg-[#1E2421] text-[#454A47] dark:text-[#B8C0BC] border border-[#E2E0D8] dark:border-[#2C3330]">
                      {t.category}
                    </span>
                    <span className="font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
                      {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#141615] dark:text-white">{t.subject}</p>
                  {t.adminReply && (
                    <div className="mt-2 p-3 rounded-md bg-[#EAF3EE] dark:bg-[#162921] border border-[#C5DDD0] dark:border-[#244738] text-xs text-[#0D6847] dark:text-[#5CD6A5]">
                      <strong className="font-semibold">Destek Yanıtı:</strong> {t.adminReply}
                    </div>
                  )}
                </div>
                <span
                  className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm border shrink-0 ${
                    t.status === 'RESOLVED'
                      ? 'bg-[#EAF3EE] text-[#0D6847] border-[#C5DDD0] dark:bg-[#162921] dark:text-[#5CD6A5] dark:border-[#244738]'
                      : 'bg-[#F0EFEA] text-[#454A47] border-[#E2E0D8] dark:bg-[#1E2421] dark:text-[#B8C0BC] dark:border-[#2C3330]'
                  }`}
                >
                  {t.status === 'OPEN' ? 'AÇIK' : t.status === 'RESOLVED' ? 'ÇÖZÜLDÜ' : t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sıkça Sorulan Sorular */}
      <section className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 bg-[#FBFBF9] dark:bg-[#181C1A] border-b border-[#E2E0D8] dark:border-[#252B28] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#141615] dark:text-white">
            Sık Sorulan Sorular
          </h2>
          <span className="font-mono text-[11px] text-[#5C615E] dark:text-[#949B97]">
            REHBER
          </span>
        </div>
        <div className="divide-y divide-[#ECEAE4] dark:divide-[#222624]">
          {FAQ.map((item) => (
            <details key={item.code} className="p-4 sm:p-5 group">
              <summary className="text-sm font-bold text-[#141615] dark:text-white flex items-center gap-2.5 list-none">
                <span className="font-mono text-[11px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
                  {item.code} /
                </span>
                <span>{item.q}</span>
              </summary>
              <p className="text-xs sm:text-sm text-[#5C615E] dark:text-[#949B97] mt-2 pl-7 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Hesap Kapatma */}
      <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-lg p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-bold text-sm text-[#C84B31] dark:text-[#F28B73] flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" />
            <span>Hesabımı Kalıcı Olarak Kapat</span>
          </h3>
          <p className="text-xs text-[#5C615E] dark:text-[#949B97] mt-0.5">
            Kişisel verilerinizin ve hesap kaydınızın silinmesi için talep oluşturun.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="h-9 px-3.5 rounded-md border border-[#EFC7BD] dark:border-[#4A251D] bg-[#FBEEE9] dark:bg-[#2A1915] text-xs font-semibold text-[#B43B21] dark:text-[#F28B73] shrink-0 cursor-pointer"
        >
          Talep Oluştur
        </button>
      </div>

      {/* Yeni Destek Talebi Dialog */}
      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#141615] dark:text-white">
              Yeni Destek Kaydı
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97]">
              Konuyu seçip yaşadığınız durumu kısaca açıklayın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold text-[#141615] dark:text-[#F2F1ED]">
                Kategori
              </Label>
              <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`p-2 rounded-md text-xs font-semibold border transition-colors ${
                      category === c.value
                        ? 'bg-[#0D6847] text-white border-[#0D6847]'
                        : 'bg-[#FBFBF9] dark:bg-[#181C1A] border-[#E2E0D8] dark:border-[#252B28] text-[#5C615E] dark:text-[#949B97]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#141615] dark:text-[#F2F1ED]">
                Konu Başlığı
              </Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Örn: Vardiya QR onayı hakkında"
                className="h-10 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#141615] dark:text-[#F2F1ED]">
                Açıklama
              </Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Detayları yazın..."
                className="mt-1"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmitTicket}
              disabled={submitting}
              className="w-full h-10 rounded-md bg-[#0D6847] hover:bg-[#095237] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Kaydı Gönder</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hesap Silme Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#141716] border border-[#D8D5CC] dark:border-[#252B28] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#C84B31] dark:text-[#F28B73] flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Hesabımı Kapat
            </DialogTitle>
            <DialogDescription className="text-xs text-[#5C615E] dark:text-[#949B97]">
              Bu işlem onaylandığında hesabınız ve kişisel verileriniz kalıcı olarak kaldırılır.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-semibold">Kapatma Sebebi *</Label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={2}
                placeholder="Hesabınızı kapatma nedeninizi belirtin..."
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Ek Not (İsteğe Bağlı)</Label>
              <Textarea
                value={deleteFeedback}
                onChange={(e) => setDeleteFeedback(e.target.value)}
                rows={2}
                placeholder="Varsa görüş ve önerileriniz..."
                className="mt-1"
              />
            </div>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="w-full h-10 rounded-md bg-[#C84B31] hover:bg-[#B43B21] text-white text-xs font-semibold inline-flex items-center justify-center gap-2"
            >
              {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Silme Talebini Gönder</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ContactCard({
  code,
  icon: Icon,
  value,
  href,
}: {
  code: string
  icon: any
  value: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="p-3.5 bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] hover:border-[#0D6847] rounded-lg transition-colors flex flex-col justify-between gap-2"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-semibold text-[#0D6847] dark:text-[#5CD6A5]">
          {code}
        </span>
        <Icon className="w-3.5 h-3.5 text-[#5C615E] dark:text-[#949B97]" />
      </div>
      <div className="text-xs font-bold text-[#141615] dark:text-white truncate">{value}</div>
    </a>
  )
}
